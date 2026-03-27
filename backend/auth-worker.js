import crypto from "crypto";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
const COOKIE_SECRET = process.env.COOKIE_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;

function base64url(input) {
    return Buffer.from(input).toString("base64url");
}

function sign(data, secret) {
    return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

function createJWT(payload, secret) {
    const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = base64url(JSON.stringify(payload));
    const signature = sign(`${header}.${body}`, secret);
    return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;

        const [header, body, signature] = parts;
        const expected = sign(`${header}.${body}`, COOKIE_SECRET);
        if (signature !== expected) return null;

        const payload = JSON.parse(Buffer.from(body, "base64url").toString());
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) return null;

        return payload;
    } catch {
        return null;
    }
}

function getCookie(cookieString, name) {
    const cookies = cookieString?.split(";") || [];
    for (let cookie of cookies) {
        const [key, value] = cookie.trim().split("=");
        if (key === name) return decodeURIComponent(value);
    }
    return null;
}

export default async function handler(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
        "Access-Control-Allow-Origin": FRONTEND_URL,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": "true"
    };

    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    if (path === "/auth/login") {
        const params = new URLSearchParams({
            client_id: DISCORD_CLIENT_ID,
            redirect_uri: DISCORD_REDIRECT_URI,
            response_type: "code",
            scope: "identify guilds"
        });

        return Response.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
    }

    if (path === "/auth/callback") {
        const code = url.searchParams.get("code");

        if (!code) {
            return new Response("No code", { status: 400 });
        }

        try {
            const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: DISCORD_CLIENT_ID,
                    client_secret: DISCORD_CLIENT_SECRET,
                    grant_type: "authorization_code",
                    code,
                    redirect_uri: DISCORD_REDIRECT_URI
                })
            });

            const tokenData = await tokenRes.json();
            if (!tokenData.access_token) {
                return new Response("Token error", { status: 400 });
            }

            const userRes = await fetch("https://discord.com/api/v10/users/@me", {
                headers: { Authorization: `Bearer ${tokenData.access_token}` }
            });

            const user = await userRes.json();

            const jwt = createJWT({
                userId: user.id,
                username: user.username,
                avatar: user.avatar,
                accessToken: tokenData.access_token,
                exp: Math.floor(Date.now() / 1000) + 604800
            }, COOKIE_SECRET);

            return new Response(null, {
                status: 302,
                headers: {
                    "Set-Cookie": `auth=${jwt}; HttpOnly; Path=/; SameSite=Lax`,
                    "Location": FRONTEND_URL
                }
            });
        } catch (e) {
            return new Response("Error", { status: 500 });
        }
    }

    if (path === "/user") {
        const token = getCookie(request.headers.get("cookie"), "auth");
        const payload = verifyToken(token);

        if (!payload) {
            return new Response(JSON.stringify({ error: "unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify(payload), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    if (path === "/user/guilds") {
        const token = getCookie(request.headers.get("cookie"), "auth");
        const payload = verifyToken(token);

        if (!payload?.accessToken) {
            return new Response(JSON.stringify({ error: "unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const res = await fetch("https://discord.com/api/v10/users/@me/guilds", {
            headers: { Authorization: `Bearer ${payload.accessToken}` }
        });

        const data = await res.json();

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    return new Response("Not found", { status: 404 });
}

export const fetch = handler;