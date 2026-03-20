// Cloudflare Worker — llegonetwork API
//
// This worker handles everything between your React frontend and Discord.
// It never exposes Discord tokens or bot credentials to the browser.
// The browser only ever holds a short JWT that identifies the user.
//
// Secrets (set via: wrangler secret put <NAME>)
//   DISCORD_CLIENT_SECRET   from discord.com/developers → OAuth2
//   JWT_SECRET              run: openssl rand -base64 32
//   BOT_TOKEN               from discord.com/developers → Bot
//   BOT_USER_ID             your bot's Discord user ID
//   BOT_API_SECRET          run: openssl rand -base64 32
//
// Vars in wrangler.toml (not secret, fine to commit)
//   DISCORD_CLIENT_ID       from discord.com/developers → General Information
//   DISCORD_REDIRECT_URI    https://api.llegonetwork.dev/auth/callback
//   FRONTEND_URL            https://llegonetwork.dev
//
// KV namespace in wrangler.toml
//   [[kv_namespaces]]
//   binding = "KV"
//   id = "your_kv_id"

const DISCORD  = 'https://discord.com/api/v10'
const ADMIN    = BigInt(0x8)
const JWT_TTL  = 7 * 24 * 60 * 60 * 1000  // 7 days in ms
const KV_TTL   = 7 * 24 * 60 * 60          // 7 days in seconds

export default {
    async fetch(request, env) {
        const url  = new URL(request.url)
        const cors = getCors(request, env)

        // All browsers send an OPTIONS request before any cross-origin request.
        // We respond immediately so the actual request can proceed.
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: cors })
        }

        // Rate limit: max 60 requests per IP per minute.
        // We bucket by IP + the current minute so the count resets automatically.
        const ip  = request.headers.get('CF-Connecting-IP') ?? 'unknown'
        const key = `rate:${ip}:${Math.floor(Date.now() / 60000)}`
        const hits = parseInt(await env.KV.get(key) ?? '0') + 1
        await env.KV.put(key, String(hits), { expirationTtl: 120 })
        if (hits > 60) return fail(429, 'Too many requests', cors)

        try {
            const path = url.pathname

            if (path === '/auth/login')    return authLogin(url, env, cors)
            if (path === '/auth/callback') return authCallback(url, env, cors)
            if (path === '/auth/me')       return authMe(request, env, cors)
            if (path === '/auth/logout')   return authLogout(request, env, cors)

            if (path === '/user/guilds')   return userGuilds(request, env, cors)

            // Guild routes: /guild/:id/stats, /guild/:id/slash-commands, etc.
            const guild = path.match(/^\/guild\/(\d+)\/(.+)$/)
            if (guild) return guildRoute(request, env, cors, guild[1], guild[2])

            // Bot routes: /bot/heartbeat, /bot/event, etc.
            if (path.startsWith('/bot/')) return botRoute(request, env, cors, path)

            return fail(404, 'Not found', cors)
        } catch (e) {
            console.error(e)
            return fail(500, 'Internal server error', cors)
        }
    }
}

// Auth — login redirects the user to Discord. Discord sends them back to
// /auth/callback with a one-time code. We exchange that code for a Discord
// access token, store it in KV so it never leaves the server, then issue
// our own JWT to the browser that just contains the user's ID and username.

function authLogin(url, env, cors) {
    const state = crypto.randomUUID()

    const params = new URLSearchParams({
        client_id:     env.DISCORD_CLIENT_ID,
        redirect_uri:  env.DISCORD_REDIRECT_URI,
        response_type: 'code',
        scope:         'identify guilds',
        state,
        prompt:        'none',
    })

    return Response.redirect(`https://discord.com/oauth2/authorize?${params}`, 302)
}

async function authCallback(url, env, cors) {
    const code = url.searchParams.get('code')
    if (!code) return fail(400, 'Missing code')

    // Exchange the one-time code Discord gave us for a real access token.
    const tokenRes = await fetch(`${DISCORD}/oauth2/token`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id:     env.DISCORD_CLIENT_ID,
            client_secret: env.DISCORD_CLIENT_SECRET,
            grant_type:    'authorization_code',
            code,
            redirect_uri:  env.DISCORD_REDIRECT_URI,
        }),
    })
    if (!tokenRes.ok) return fail(400, 'Failed to exchange code')
    const { access_token, refresh_token } = await tokenRes.json()

    // Fetch the user's basic profile using their access token.
    const userRes = await fetch(`${DISCORD}/users/@me`, {
        headers: { Authorization: `Bearer ${access_token}` },
    })
    if (!userRes.ok) return fail(400, 'Failed to fetch user')
    const user = await userRes.json()

    // Store the Discord tokens in KV keyed by user ID.
    // These never leave the worker — the browser never sees them.
    await env.KV.put(
        `session:${user.id}`,
        JSON.stringify({ access_token, refresh_token }),
        { expirationTtl: KV_TTL }
    )

    // Issue our own JWT. It only contains safe public info.
    // We put it in the URL fragment (#) so it never appears in server logs
    // or the Discord redirect — fragments aren't sent to servers.
    const jwt = await makeJWT({ userId: user.id, username: user.username, avatar: user.avatar }, env.JWT_SECRET)
    return Response.redirect(`${env.FRONTEND_URL}/auth/callback#token=${jwt}`, 302)
}

async function authMe(request, env, cors) {
    const user = await getAuth(request, env)
    if (!user) return fail(401, 'Unauthorized', cors)
    return ok({ userId: user.userId, username: user.username, avatar: user.avatar }, cors)
}

async function authLogout(request, env, cors) {
    const user = await getAuth(request, env)
    if (user) {
        // Grab the stored Discord token before we delete the session.
        const raw = await env.KV.get(`session:${user.userId}`)
        await env.KV.delete(`session:${user.userId}`)

        // Tell Discord to revoke the token so it can't be used elsewhere.
        if (raw) {
            const { access_token } = JSON.parse(raw)
            await fetch(`${DISCORD}/oauth2/token/revoke`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    token:         access_token,
                    client_id:     env.DISCORD_CLIENT_ID,
                    client_secret: env.DISCORD_CLIENT_SECRET,
                }),
            })
        }
    }
    return ok({ ok: true }, cors)
}

// User — fetches data about the logged-in user from Discord on their behalf.

async function userGuilds(request, env, cors) {
    const user = await getAuth(request, env)
    if (!user) return fail(401, 'Unauthorized', cors)

    const token = await getDiscordToken(user.userId, env)
    if (!token) return fail(401, 'Session expired, please log in again', cors)

    const res = await fetch(`${DISCORD}/users/@me/guilds`, {
        headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return fail(502, 'Failed to fetch guilds', cors)
    const guilds = await res.json()

    // Only return guilds where the user is an owner or administrator.
    // We also check whether the bot is in each guild so the frontend
    // can show an "Add Bot" button for guilds it hasn't joined yet.
    const admin = guilds.filter(g => g.owner || (BigInt(g.permissions) & ADMIN) === ADMIN)

    const withBot = await Promise.allSettled(admin.map(async g => {
        let hasBot = false
        try {
            const check = await fetch(`${DISCORD}/guilds/${g.id}/members/${env.BOT_USER_ID}`, {
                headers: { Authorization: `Bot ${env.BOT_TOKEN}` },
            })
            hasBot = check.ok
        } catch {}
        return { id: g.id, name: g.name, icon: g.icon, owner: g.owner, hasBot }
    }))

    return ok(withBot.filter(r => r.status === 'fulfilled').map(r => r.value), cors)
}

// Guild — routes for data about a specific server.
// Every route here verifies the user is an admin of that guild first.

async function guildRoute(request, env, cors, guildId, subpath) {
    const user = await getAuth(request, env)
    if (!user) return fail(401, 'Unauthorized', cors)

    const token = await getDiscordToken(user.userId, env)
    if (!token) return fail(401, 'Session expired', cors)

    if (!await isGuildAdmin(guildId, token)) return fail(403, 'Forbidden', cors)

    if (subpath === 'stats')          return guildStats(env, cors, guildId)
    if (subpath === 'slash-commands') return guildCommands(env, cors, guildId)
    if (subpath === 'moderation')     return guildModeration(env, cors, guildId)

    return fail(404, 'Not found', cors)
}

async function guildStats(env, cors, guildId) {
    const res = await fetch(`${DISCORD}/guilds/${guildId}?with_counts=true`, {
        headers: { Authorization: `Bot ${env.BOT_TOKEN}` },
    })
    if (!res.ok) return fail(502, 'Failed to fetch guild', cors)
    const g = await res.json()
    return ok({
        id:          g.id,
        name:        g.name,
        icon:        g.icon,
        members:     g.approximate_member_count,
        online:      g.approximate_presence_count,
    }, cors)
}

async function guildCommands(env, cors, guildId) {
    const res = await fetch(`${DISCORD}/applications/${env.DISCORD_CLIENT_ID}/guilds/${guildId}/commands`, {
        headers: { Authorization: `Bot ${env.BOT_TOKEN}` },
    })
    if (!res.ok) return fail(502, 'Failed to fetch commands', cors)
    return ok(await res.json(), cors)
}

async function guildModeration(env, cors, guildId) {
    // Pull any moderation data your bot has stored in KV
    const data = await env.KV.get(`mod:${guildId}`)
    return ok(data ? JSON.parse(data) : { guildId, bans: [], warnings: [] }, cors)
}

// Bot — your Discord bot talks to these endpoints using a shared secret.
// Add new bot routes here as your bot grows.

async function botRoute(request, env, cors, path) {
    const secret = request.headers.get('X-Bot-Secret') ?? ''
    if (!await safeEqual(secret, env.BOT_API_SECRET)) return fail(401, 'Unauthorized', cors)
    if (request.method !== 'POST') return fail(405, 'Method not allowed', cors)
    if (!request.headers.get('Content-Type')?.includes('application/json')) return fail(415, 'Expected JSON', cors)

    const body = await readBody(request, 65536)
    if (!body) return fail(413, 'Payload too large', cors)

    if (path === '/bot/heartbeat') return botHeartbeat(env, cors)
    if (path === '/bot/event')     return botEvent(body, env, cors)

    return fail(404, 'Not found', cors)
}

async function botHeartbeat(env, cors) {
    // The bot calls this every 30 seconds so the frontend knows it's alive.
    // We store the timestamp and let it expire after 90 seconds.
    await env.KV.put('bot:heartbeat', Date.now().toString(), { expirationTtl: 90 })
    return ok({ ok: true }, cors)
}

async function botEvent(body, env, cors) {
    const { event, guildId, data } = body
    if (!event || typeof event !== 'string' || event.length > 64) return fail(400, 'Invalid event', cors)

    await env.KV.put(
        `event:${guildId}:${Date.now()}`,
        JSON.stringify({ event, data, ts: Date.now() }),
        { expirationTtl: KV_TTL }
    )
    return ok({ ok: true }, cors)
}

// Public status endpoint — no auth needed, the frontend polls this for the bot status badge.
// We expose it here outside botRoute since it's a GET, not a bot-authenticated POST.

async function botStatus(env, cors) {
    const last = await env.KV.get('bot:heartbeat')
    return ok({ online: !!last }, cors)
}

// JWT helpers — we sign our own tokens using HMAC-SHA256 via the Web Crypto API
// that's built into the Workers runtime. No libraries needed.

async function makeJWT(payload, secret) {
    const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const body   = b64url(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + JWT_TTL }))
    const key    = await hmacKey(secret)
    const sig    = await crypto.subtle.sign('HMAC', key, encode(`${header}.${body}`))
    return `${header}.${body}.${b64urlBytes(sig)}`
}

async function readJWT(token, secret) {
    if (!token || typeof token !== 'string') return null
    const [header, body, sig] = token.split('.')
    if (!header || !body || !sig) return null
    try {
        const key   = await hmacKey(secret)
        const valid = await crypto.subtle.verify(
            'HMAC', key,
            Uint8Array.from(atob(sig.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
            encode(`${header}.${body}`)
        )
        if (!valid) return null
        const payload = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')))
        if (payload.exp < Date.now()) return null
        return payload
    } catch {
        return null
    }
}

async function hmacKey(secret) {
    return crypto.subtle.importKey('raw', encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

// Shared helpers

async function getAuth(request, env) {
    const header = request.headers.get('Authorization') ?? ''
    if (!header.startsWith('Bearer ')) return null
    return readJWT(header.slice(7), env.JWT_SECRET)
}

async function getDiscordToken(userId, env) {
    const raw = await env.KV.get(`session:${userId}`)
    if (!raw) return null
    return JSON.parse(raw).access_token
}

async function isGuildAdmin(guildId, discordToken) {
    try {
        const res    = await fetch(`${DISCORD}/users/@me/guilds`, { headers: { Authorization: `Bearer ${discordToken}` } })
        if (!res.ok) return false
        const guilds = await res.json()
        const guild  = guilds.find(g => g.id === guildId)
        return guild && (guild.owner || (BigInt(guild.permissions) & ADMIN) === ADMIN)
    } catch {
        return false
    }
}

// Constant-time comparison so an attacker can't guess the BOT_API_SECRET
// one character at a time by measuring how long the comparison takes.
async function safeEqual(a, b) {
    const key  = { name: 'HMAC', hash: 'SHA-256' }
    const ka   = await crypto.subtle.importKey('raw', encode(a), key, false, ['sign'])
    const kb   = await crypto.subtle.importKey('raw', encode(b), key, false, ['sign'])
    const msg  = encode('check')
    const [sa, sb] = await Promise.all([crypto.subtle.sign('HMAC', ka, msg), crypto.subtle.sign('HMAC', kb, msg)])
    const va   = new Uint8Array(sa)
    const vb   = new Uint8Array(sb)
    if (va.length !== vb.length) return false
    let diff = 0
    for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i]
    return diff === 0
}

async function readBody(request, max) {
    const reader = request.body.getReader()
    const chunks = []
    let total = 0
    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        total += value.length
        if (total > max) return null
        chunks.push(value)
    }
    const merged = new Uint8Array(total)
    let offset = 0
    for (const c of chunks) { merged.set(c, offset); offset += c.length }
    try { return JSON.parse(new TextDecoder().decode(merged)) } catch { return null }
}

function getCors(request, env) {
    const origin  = request.headers.get('Origin') ?? ''
    const allowed = env.FRONTEND_URL
    return {
        'Access-Control-Allow-Origin':      origin === allowed ? allowed : '',
        'Access-Control-Allow-Methods':     'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers':     'Content-Type, Authorization, X-Bot-Secret',
        'Access-Control-Allow-Credentials': 'true',
        'Vary':                             'Origin',
        'X-Content-Type-Options':           'nosniff',
        'X-Frame-Options':                  'DENY',
        'Referrer-Policy':                  'no-referrer',
    }
}

function ok(data, cors = {}) {
    return new Response(JSON.stringify(data), {
        headers: { ...cors, 'Content-Type': 'application/json' }
    })
}

function fail(status, message, cors = {}) {
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...cors, 'Content-Type': 'application/json' }
    })
}

const encode     = s => new TextEncoder().encode(s)
const b64url     = s => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
const b64urlBytes = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')