# llegonetwork

Personal portfolio and project hub built with React, with a Cloudflare Worker backend handling Discord OAuth and serving as a central API for all llegonetwork projects.

Live at [llegonetwork.dev](https://llegonetwork.dev)

---

## Stack

The frontend is React with React Router and plain CSS. No UI framework. Built with Vite and deployed to GitHub Pages.

The backend is a Cloudflare Worker at `api.llegonetwork.dev`. It handles Discord OAuth, issues JWTs to the frontend, stores Discord tokens server-side in Cloudflare KV, and accepts events from Discord bots via a shared secret. Discord credentials never reach the frontend.

---

## Running Locally

```bash
cd frontend
npm install
npm run dev
```

For the API worker:

```bash
cd backend
cp wrangler.toml.example wrangler.toml
cp .dev.vars.example .dev.vars
# fill in both files with your values
wrangler dev
```

---

## Self-Hosting the API

You need a Cloudflare account, your domain added to Cloudflare, and a Discord application with a bot created at [discord.com/developers](https://discord.com/developers).

Install Wrangler:

```bash
npm install -g wrangler
```

Create the KV namespace and paste the ID it gives you into `wrangler.toml`:

```bash
wrangler kv:namespace create SESSIONS
```

Fill in `wrangler.toml` with your Discord client ID, redirect URI, and domain. Fill in `.dev.vars` for local development. Then set production secrets — these are stored encrypted in Cloudflare and never in any file:

```bash
wrangler secret put DISCORD_CLIENT_SECRET
wrangler secret put JWT_SECRET
wrangler secret put BOT_TOKEN
wrangler secret put BOT_USER_ID
wrangler secret put BOT_API_SECRET
```

Generate `JWT_SECRET` and `BOT_API_SECRET` yourself with `openssl rand -base64 32` or any other random string. The others come from the Discord developer portal.

Add `https://api.yourdomain.com/auth/callback` as a redirect URI in your Discord application under OAuth2, then deploy:

```bash
wrangler deploy
```

---

## Contributing

Pull requests are welcome. Open an issue first for significant changes. If you self-host, you are responsible for your own credentials and Cloudflare account.

---

## License

...