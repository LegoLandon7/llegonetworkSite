# llegonetwork

[llegonetwork.dev](https://llegonetwork.dev)

llegonetwork is a personal site and collection of projects built by a single developer as a way to learn and experiment with web development, bots, and new concepts.

> **Note:** The backend is not production-ready. Do not attempt to use it in its current state. AI tools were used to help understand unfamiliar concepts during development. All frontend code was written independently.

---

## Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Backend

The backend runs as a Cloudflare Worker and handles Discord OAuth2, session management, and API proxying.

### 1. Deploy the worker

Copy the contents of `backend/auth-worker.js` into a new Cloudflare Worker.

### 2. Set environment variables

Add the following as encrypted secrets in the worker's settings:

| Variable | Description |
|---|---|
| `COOKIE_SECRET` | A long random string used to sign and encrypt session cookies and tokens. Generate with `openssl rand -hex 32` |
| `DISCORD_CLIENT_ID` | Your Discord application's client ID, found in the Discord Developer Portal |
| `DISCORD_CLIENT_SECRET` | Your Discord application's client secret, found in the Discord Developer Portal |
| `DISCORD_REDIRECT_URI` | The full callback URL of your worker, e.g. `https://api.yourdomain.dev/auth/callback`. Must match exactly what is set in the Discord Developer Portal under OAuth2 redirects |
| `FRONTEND_URL` | The origin of your frontend, e.g. `https://yourdomain.dev`. Used for CORS and post-login redirects |

### 3. Create a KV namespace binding

In your worker's settings under **KV Namespace Bindings**, create a binding with the variable name `SESSIONS`. This is used to store rate limit data and encrypted session tokens.

---

## Legal

placeholder
