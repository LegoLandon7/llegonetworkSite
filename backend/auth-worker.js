const SESSION_TTL = 7 * 24 * 60 * 60;
const rateLimits = new Map();

function isLimited(ip) {
    const now = Date.now();
    const e = rateLimits.get(ip) ?? { c: 0, t: now };
    if (now - e.t > 60000) { e.c = 1; e.t = now; } else e.c++;
    rateLimits.set(ip, e);
    return e.c > 30;
}

async function hmac(data, ctx, secret) {
    const key = await crypto.subtle.importKey(
        "raw", new TextEncoder().encode(`${secret}:${ctx}`),
        { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const buf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
    return btoa(String.fromCharCode(...new Uint8Array(buf)))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function safeEq(a, b) {
    if (a.length !== b.length) return false;
    let d = 0;
    for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return d === 0;
}

function b64url(obj) {
    return btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function signJWT(payload, secret) {
    const h = b64url({ alg: "HS256", typ: "JWT" });
    const b = b64url(payload);
    return `${h}.${b}.${await hmac(`${h}.${b}`, "jwt", secret)}`;
}

async function verifyJWT(token, secret) {
    try {
        if (typeof token !== "string") return null;
        const [h, b, sig] = token.split(".");
        if (!h || !b || !sig) return null;
        if (!safeEq(sig, await hmac(`${h}.${b}`, "jwt", secret))) return null;
        const p = JSON.parse(atob(b.replace(/-/g, "+").replace(/_/g, "/")));
        if (p.exp < Math.floor(Date.now() / 1000)) return null;
        return p;
    } catch { return null; }
}

function getCookie(header, name) {
    for (const part of (header ?? "").split(";")) {
        const [k, ...v] = part.trim().split("=");
        if (k === name) try { return decodeURIComponent(v.join("=")); } catch { return null; }
    }
    return null;
}

async function makeState(secret, kv) {
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    const n = Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
    const mac = await hmac(n, "state", secret);
    await kv.put(`state:${n}`, "1", { expirationTtl: 600 });
    return `${n}.${mac}`;
}

async function checkState(s, secret, kv) {
    if (typeof s !== "string") return false;
    const i = s.lastIndexOf(".");
    const n = s.slice(0, i), m = s.slice(i + 1);
    if (!safeEq(m, await hmac(n, "state", secret))) return false;
    const exists = await kv.get(`state:${n}`);
    if (!exists) return false;
    await kv.delete(`state:${n}`);
    return true;
}

function corsHeaders(origin, frontendUrl) {
    if (origin !== frontendUrl) return {};
    return {
        "Access-Control-Allow-Origin": frontendUrl,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": "true",
        "Vary": "Origin",
    };
}

const SEC = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

function json(data, status = 200, extra = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json", ...SEC, ...extra },
    });
}

const MSGS = { 400: "Bad request", 401: "Unauthorized", 404: "Not found", 429: "Too many requests", 500: "Server error" };
const err = (s) => json({ error: MSGS[s] ?? "Error" }, s);

function makeCookie(jwt) {
    return `auth=${jwt}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL}; Secure`;
}

function clearCookie() {
    return `auth=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0; Secure`;
}

export default {
    async fetch(req, env) {
        const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI, COOKIE_SECRET, FRONTEND_URL, SESSIONS } = env;

        const url    = new URL(req.url);
        const path   = url.pathname;
        const origin = req.headers.get("origin") ?? "";
        const cors   = corsHeaders(origin, FRONTEND_URL);
        const ip     = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "unknown";

        if (req.method === "OPTIONS")
            return new Response(null, { status: 204, headers: { ...cors, ...SEC } });

        if (isLimited(ip)) return err(429);

        if (path === "/auth/login") {
            return new Response(null, {
                status: 302,
                headers: {
                    ...SEC,
                    Location: `https://discord.com/api/oauth2/authorize?${new URLSearchParams({
                        client_id:     DISCORD_CLIENT_ID,
                        redirect_uri:  DISCORD_REDIRECT_URI,
                        response_type: "code",
                        scope:         "identify guilds",
                        state:         await makeState(COOKIE_SECRET, SESSIONS),
                    })}`,
                },
            });
        }

        if (path === "/auth/callback") {
            const code  = url.searchParams.get("code");
            const state = url.searchParams.get("state");

            if (!code || code.length > 512 || !(await checkState(state, COOKIE_SECRET, SESSIONS))) return err(400);

            const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
                method:  "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body:    new URLSearchParams({
                    client_id:     DISCORD_CLIENT_ID,
                    client_secret: DISCORD_CLIENT_SECRET,
                    grant_type:    "authorization_code",
                    code,
                    redirect_uri:  DISCORD_REDIRECT_URI,
                }),
            });

            const tokenData = await tokenRes.json();
            if (!tokenRes.ok || !tokenData.access_token) return err(500);

            const userRes = await fetch("https://discord.com/api/v10/users/@me", {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });

            const user = await userRes.json();
            if (!userRes.ok || !user.id) return err(500);

            const arr = new Uint8Array(32);
            crypto.getRandomValues(arr);
            const sessionId = Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");

            await SESSIONS.put(`session:${sessionId}`, JSON.stringify({
                accessToken: tokenData.access_token,
                userId: user.id,
            }), { expirationTtl: SESSION_TTL });

            const jwt = await signJWT({
                userId:   user.id,
                username: user.username,
                avatar:   user.avatar ?? null,
                sessionId,
                exp:      Math.floor(Date.now() / 1000) + SESSION_TTL,
            }, COOKIE_SECRET);

            return new Response(null, {
                status: 302,
                headers: { ...SEC, "Set-Cookie": makeCookie(jwt), Location: FRONTEND_URL },
            });
        }

        if (path === "/auth/logout") {
            const p = await verifyJWT(getCookie(req.headers.get("cookie"), "auth"), COOKIE_SECRET);
            if (p?.sessionId) await SESSIONS.delete(`session:${p.sessionId}`);
            return new Response(null, {
                status: 302,
                headers: { ...SEC, "Set-Cookie": clearCookie(), Location: FRONTEND_URL },
            });
        }

        if (path === "/user") {
            const p = await verifyJWT(getCookie(req.headers.get("cookie"), "auth"), COOKIE_SECRET);
            if (!p) return err(401);
            const session = await SESSIONS.get(`session:${p.sessionId}`);
            if (!session) return err(401);
            return json({ userId: p.userId, username: p.username, avatar: p.avatar }, 200, cors);
        }

        if (path === "/user/guilds") {
            const p = await verifyJWT(getCookie(req.headers.get("cookie"), "auth"), COOKIE_SECRET);
            if (!p) return err(401);
            const session = await SESSIONS.get(`session:${p.sessionId}`, { type: "json" });
            if (!session) return err(401);

            const res = await fetch("https://discord.com/api/v10/users/@me/guilds", {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (!res.ok) return err(500);
            return json(await res.json(), 200, cors);
        }

        return err(404);
    },
};