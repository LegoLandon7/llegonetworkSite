const DISCORD_CLIENT_ID     = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI  = process.env.DISCORD_REDIRECT_URI;
const COOKIE_SECRET         = process.env.COOKIE_SECRET;
const FRONTEND_URL          = process.env.FRONTEND_URL;

async function verifyToken(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payload = JSON.parse(atob(parts[1]));
        const timestamp = Math.floor(Date.now() / 1000);

        if (payload.exp && payload.exp < timestamp) return null;
        return payload;
    } catch {
        return null;
    }
}

function createJWT(payload, secret) {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = btoa(JSON.stringify(payload));
    const signature = btoa(secret);
  
    return `${header}.${body}.${signature}`;
}

function getCookie(cookieString, name) {
    const cookies = cookieString?.split(';') || [];
    
    for (let cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
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
            return new Response("No code provided", { status: 400 });
        }

        try {
            const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: DISCORD_CLIENT_ID,
                    client_secret: DISCORD_CLIENT_SECRET,
                    grant_type: "authorization_code",
                    code: code,
                    redirect_uri: DISCORD_REDIRECT_URI
                })
            });

            const tokenData = await tokenResponse.json();

            if (!tokenData.access_token) {
                return new Response("Failed to get token", { status: 400 });
            }

            const userResponse = await fetch("https://discord.com/api/v10/users/@me", {
                headers: { Authorization: `Bearer ${tokenData.access_token}` }
            });

            const user = await userResponse.json();

            const sessionToken = createJWT(
                {
                    userId: user.id,
                    username: user.username,
                    avatar: user.avatar,
                    accessToken: tokenData.access_token,
                    exp: Math.floor(Date.now() / 1000) + 604800
                }, 
                COOKIE_SECRET
            );

            return Response.redirect(`${FRONTEND_URL}?token=${sessionToken}`);
        } catch (error) {
            return new Response(`Error: ${error.message}`, { status: 500 });
        }
    }

    if (path === "/user") {
        const token = getCookie(request.headers.get("Cookie"), "auth");

        if (!token) {
            return new Response(JSON.stringify({ error: "Not authenticated" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const payload = await verifyToken(token);
        if (!payload) {
            return new Response(JSON.stringify({ error: "Invalid token" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify(payload), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    if (path === "/user/guilds") {
        const token = getCookie(request.headers.get("Cookie"), "auth");
        const payload = await verifyToken(token);

        if (!payload?.accessToken) {
            return new Response(JSON.stringify({ error: "Not authenticated" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        try {
            const guildsResponse = await fetch(
                "https://discord.com/api/v10/users/@me/guilds",
                { headers: { Authorization: `Bearer ${payload.accessToken}` } }
            );

            const guilds = await guildsResponse.json();

            return new Response(JSON.stringify(guilds), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }
    }

    return new Response("Not found", { status: 404 });
}

export const fetch = handler;