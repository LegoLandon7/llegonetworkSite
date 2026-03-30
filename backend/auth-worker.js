const SESSION_TTL = 7 * 24 * 60 * 60;
const DISCORD_API = 'https://discord.com/api/v10';

const ERRORS = {
    400: 'Bad request',
    401: 'Unauthorized',
    404: 'Not found',
    429: 'Too many requests',
    500: 'Server error',
};

const SEC_HEADERS = {
    'X-Content-Type-Options':           'nosniff',
    'X-Frame-Options':                  'DENY',
    'Referrer-Policy':                  'strict-origin-when-cross-origin',
    'Strict-Transport-Security':        'max-age=63072000; includeSubDomains; preload',
};

function json(data, status = 200, extra = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', ...SEC_HEADERS, ...extra },
    });
}

function err(status) {
    return json({ error: ERRORS[status] ?? 'Error' }, status);
}

function redirect(location, extra = {}) {
    return new Response(null, {
        status: 302,
        headers: { ...SEC_HEADERS, Location: location, ...extra },
    });
}


// ── Allowed origins ──────────────────────────────────────────────────────────

function getAllowedOrigins(frontendUrl) {
    return frontendUrl.split(',').map(s => s.trim()).filter(Boolean);
}

function safeRedirectUrl(requested, frontendUrl) {
    const allowed = getAllowedOrigins(frontendUrl);
    return allowed.some(o => requested === o || requested.startsWith(o + '/'))
        ? requested
        : allowed[0];
}

function corsHeaders(origin, frontendUrl) {
    if (!getAllowedOrigins(frontendUrl).includes(origin)) return {};
    return {
        'Access-Control-Allow-Origin':      origin,
        'Access-Control-Allow-Methods':     'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers':     'Content-Type',
        'Access-Control-Allow-Credentials': 'true',
        'Vary':                             'Origin',
    };
}


// ── Rate limiting ────────────────────────────────────────────────────────────

async function isRateLimited(ip, kv) {
    const now = Date.now();
    const key = `rl:${ip}`;
    const entry = await kv.get(key, { type: 'json' }) ?? { count: 0, since: now };

    if (now - entry.since > 60_000) {
        entry.count = 1;
        entry.since = now;
    } else {
        entry.count++;
    }

    await kv.put(key, JSON.stringify(entry), { expirationTtl: 120 });
    return entry.count > 30;
}


// ── AES-GCM ──────────────────────────────────────────────────────────────────

async function deriveAesKey(secret) {
    const raw = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
    return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encrypt(text, secret) {
    const key = await deriveAesKey(secret);
    const iv  = crypto.getRandomValues(new Uint8Array(12));
    const enc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text));

    const combined = new Uint8Array(12 + enc.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(enc), 12);

    return btoa(String.fromCharCode(...combined))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function decrypt(b64, secret) {
    const key   = await deriveAesKey(secret);
    const bytes = Uint8Array.from(
        atob(b64.replace(/-/g, '+').replace(/_/g, '/')),
        c => c.charCodeAt(0)
    );
    const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, key, bytes.slice(12));
    return new TextDecoder().decode(dec);
}


// ── HMAC / JWT ───────────────────────────────────────────────────────────────

async function hmacSign(data, context, secret) {
    const key = await crypto.subtle.importKey(
        'raw', new TextEncoder().encode(`${secret}:${context}`),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const buf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    return btoa(String.fromCharCode(...new Uint8Array(buf)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function timingSafeEqual(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}

function b64url(obj) {
    return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function signJWT(payload, secret) {
    const header = b64url({ alg: 'HS256', typ: 'JWT' });
    const body   = b64url(payload);
    const sig    = await hmacSign(`${header}.${body}`, 'jwt', secret);
    return `${header}.${body}.${sig}`;
}

async function verifyJWT(token, secret) {
    try {
        if (typeof token !== 'string') return null;
        const [header, body, sig] = token.split('.');
        if (!header || !body || !sig) return null;
        if (!timingSafeEqual(sig, await hmacSign(`${header}.${body}`, 'jwt', secret))) return null;

        const payload = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')));
        if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
        if (!payload.sessionId || !payload.userId) return null;

        return payload;
    } catch {
        return null;
    }
}


// ── State (CSRF) ─────────────────────────────────────────────────────────────

async function createState(secret, kv, redirectTo) {
    const bytes  = crypto.getRandomValues(new Uint8Array(24));
    const nonce  = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const mac    = await hmacSign(nonce, 'state', secret);
    await kv.put(`state:${nonce}`, redirectTo, { expirationTtl: 600 });
    return `${nonce}.${mac}`;
}

async function consumeState(state, secret, kv) {
    if (typeof state !== 'string') return null;
    const split  = state.lastIndexOf('.');
    const nonce  = state.slice(0, split);
    const mac    = state.slice(split + 1);
    if (!timingSafeEqual(mac, await hmacSign(nonce, 'state', secret))) return null;

    const redirectTo = await kv.get(`state:${nonce}`);
    if (!redirectTo) return null;

    await kv.delete(`state:${nonce}`);
    return redirectTo;
}


// ── Cookies ──────────────────────────────────────────────────────────────────

function getCookie(header, name) {
    for (const part of (header ?? '').split(';')) {
        const [key, ...val] = part.trim().split('=');
        if (key === name) {
            try { return decodeURIComponent(val.join('=')); } catch { return null; }
        }
    }
    return null;
}

function makeCookie(jwt) {
    return `auth=${jwt}; HttpOnly; Path=/; SameSite=None; Max-Age=${SESSION_TTL}; Secure`;
}

function clearCookie() {
    return `auth=; HttpOnly; Path=/; SameSite=None; Max-Age=0; Secure`;
}


// ── Sessions ─────────────────────────────────────────────────────────────────

async function refreshAccessToken(session, env) {
    const decryptedRefresh = await decrypt(session.refreshToken, env.COOKIE_SECRET);

    const res = await fetch('https://discord.com/api/oauth2/token', {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    new URLSearchParams({
            client_id:     env.DISCORD_CLIENT_ID,
            client_secret: env.DISCORD_CLIENT_SECRET,
            grant_type:    'refresh_token',
            refresh_token: decryptedRefresh,
        }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data.access_token || !data.refresh_token) return null;

    return {
        accessToken:  await encrypt(data.access_token, env.COOKIE_SECRET),
        refreshToken: await encrypt(data.refresh_token, env.COOKIE_SECRET),
        expiresAt:    Math.floor(Date.now() / 1000) + (data.expires_in ?? 604800),
        userId:       session.userId,
    };
}

async function getValidSession(sessionId, env) {
    const session = await env.SESSIONS.get(`session:${sessionId}`, { type: 'json' });
    if (!session) return null;

    const expiresIn = session.expiresAt - Math.floor(Date.now() / 1000);
    if (expiresIn >= 300) return session;

    const refreshed = await refreshAccessToken(session, env);
    if (!refreshed) return null;

    await env.SESSIONS.put(`session:${sessionId}`, JSON.stringify(refreshed), { expirationTtl: SESSION_TTL });
    return refreshed;
}


// ── Auth helpers ─────────────────────────────────────────────────────────────

async function requireAuth(req, env) {
    const payload = await verifyJWT(getCookie(req.headers.get('cookie'), 'auth'), env.COOKIE_SECRET);
    if (!payload) return null;

    const session = await getValidSession(payload.sessionId, env);
    if (!session) return null;

    return { payload, session };
}


// ── Route handlers ───────────────────────────────────────────────────────────

async function handleLogin(url, env) {
    const allowed      = getAllowedOrigins(env.FRONTEND_URL);
    const safeRedirect = safeRedirectUrl(url.searchParams.get('redirect') ?? allowed[0], env.FRONTEND_URL);

    return redirect(`https://discord.com/api/oauth2/authorize?${new URLSearchParams({
        client_id:     env.DISCORD_CLIENT_ID,
        redirect_uri:  env.DISCORD_REDIRECT_URI,
        response_type: 'code',
        scope:         'identify guilds guilds.members.read',
        state:         await createState(env.COOKIE_SECRET, env.SESSIONS, safeRedirect),
    })}`);
}

async function handleCallback(url, env) {
    const code       = url.searchParams.get('code');
    const state      = url.searchParams.get('state');
    const redirectTo = await consumeState(state, env.COOKIE_SECRET, env.SESSIONS);

    if (!code || typeof code !== 'string' || code.length > 512 || !redirectTo) return err(400);

    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    new URLSearchParams({
            client_id:     env.DISCORD_CLIENT_ID,
            client_secret: env.DISCORD_CLIENT_SECRET,
            grant_type:    'authorization_code',
            code,
            redirect_uri:  env.DISCORD_REDIRECT_URI,
        }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token || !tokenData.refresh_token) return err(500);

    const userRes = await fetch(`${DISCORD_API}/users/@me`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const user = await userRes.json();
    if (!userRes.ok || !user.id) return err(500);

    const sessionBytes = crypto.getRandomValues(new Uint8Array(32));
    const sessionId    = Array.from(sessionBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    await env.SESSIONS.put(`session:${sessionId}`, JSON.stringify({
        accessToken:  await encrypt(tokenData.access_token, env.COOKIE_SECRET),
        refreshToken: await encrypt(tokenData.refresh_token, env.COOKIE_SECRET),
        expiresAt:    Math.floor(Date.now() / 1000) + (tokenData.expires_in ?? 604800),
        userId:       user.id,
    }), { expirationTtl: SESSION_TTL });

    const jwt = await signJWT({
        userId:    user.id,
        username:  user.username,
        avatar:    user.avatar ?? null,
        sessionId,
        exp:       Math.floor(Date.now() / 1000) + SESSION_TTL,
    }, env.COOKIE_SECRET);

    return redirect(redirectTo, { 'Set-Cookie': makeCookie(jwt) });
}

async function handleLogout(req, url, env) {
    const allowed      = getAllowedOrigins(env.FRONTEND_URL);
    const safeRedirect = safeRedirectUrl(url.searchParams.get('redirect') ?? allowed[0], env.FRONTEND_URL);

    const payload = await verifyJWT(getCookie(req.headers.get('cookie'), 'auth'), env.COOKIE_SECRET);
    if (payload?.sessionId) await env.SESSIONS.delete(`session:${payload.sessionId}`);
    return redirect(safeRedirect, { 'Set-Cookie': clearCookie() });
}

async function handleUser(req, env, cors) {
    const auth = await requireAuth(req, env);
    if (!auth) return err(401);
    const { payload } = auth;
    return json({ userId: payload.userId, username: payload.username, avatar: payload.avatar }, 200, cors);
}

async function handleGuilds(req, env, cors) {
    const auth = await requireAuth(req, env);
    if (!auth) return err(401);

    const accessToken = await decrypt(auth.session.accessToken, env.COOKIE_SECRET);
    const res         = await fetch(`${DISCORD_API}/users/@me/guilds`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) return err(500);

    const guilds = await res.json();
    return json(guilds.map(g => ({
        id:          g.id,
        name:        g.name,
        icon:        g.icon,
        owner:       g.owner,
        permissions: g.permissions,
        features:    g.features,
    })), 200, cors);
}

async function handleGuildMember(req, url, env, cors) {
    const guildId = url.searchParams.get('guild_id');
    if (!guildId || !/^\d{17,20}$/.test(guildId)) return err(400);

    const auth = await requireAuth(req, env);
    if (!auth) return err(401);

    const accessToken = await decrypt(auth.session.accessToken, env.COOKIE_SECRET);
    const res         = await fetch(`${DISCORD_API}/users/@me/guilds/${guildId}/member`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) return err(res.status === 404 ? 404 : 500);
    return json(await res.json(), 200, cors);
}


// ── Entry point ──────────────────────────────────────────────────────────────

export default {
    async fetch(req, env) {
        const url    = new URL(req.url);
        const origin = req.headers.get('origin') ?? '';
        const cors   = corsHeaders(origin, env.FRONTEND_URL);
        const ip     = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for') ?? 'unknown';

        if (req.method === 'OPTIONS')
            return new Response(null, { status: 204, headers: { ...cors, ...SEC_HEADERS } });

        if (await isRateLimited(ip, env.SESSIONS)) return err(429);

        switch (url.pathname) {
            case '/auth/login':          return handleLogin(url, env);
            case '/auth/callback':       return handleCallback(url, env);
            case '/auth/logout':         return handleLogout(req, url, env);
            case '/user':                return handleUser(req, env, cors);
            case '/user/guilds':         return handleGuilds(req, env, cors);
            case '/user/guilds/member':  return handleGuildMember(req, url, env, cors);
            default:                     return err(404);
        }
    },
};