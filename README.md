# Movee — Ride-Sharing Web Application


Movee is a modern ride-sharing platform similar to Uber/Bolt, built with Next.js 15, TypeScript, Prisma, Tailwind CSS, and **Socket.io** for real-time updates.

## Admin Panel

| Page | Route |
|------|-------|
| Dashboard | `/admin` |
| User Management | `/admin/users` |
| Ride Management | `/admin/rides` |
| Reports | `/admin/reports` |

## Real-Time (Socket.io)

Live events powered by Socket.io on path `/api/socket/io`:

| Event | Description |
|-------|-------------|
| `ride:requested` | New ride request (drivers & admins) |
| `ride:accepted` | Driver accepted ride (rider & admins) |
| `ride:location` | Driver location update (rider tracking) |
| `ride:status` | Ride status change (all parties) |
| `ride:completed` | Trip completed (rider, driver, admins) |

A **Live** indicator and toast notifications appear when connected.

## Quick Start

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

> **Important:** Use `npm run dev` (custom server with Socket.io). Do not use `next dev` directly — real-time features require the custom server.

Open http://localhost:3000

## Demo Accounts

| Role   | Email             | Password     |
|--------|-------------------|--------------|
| Rider  | rider@movee.com   | password123  |
| Driver | driver@movee.com  | password123  |
| Admin  | admin@movee.com   | password123  |

## Monetization

Movee takes a **15% platform commission** on each completed ride (configurable via `PLATFORM_COMMISSION_RATE` in `.env`).

| Party | Amount |
|-------|--------|
| Rider | Pays full fare |
| Driver | Receives 85% of fare |
| Movee | Keeps 15% commission |

Commission is calculated and stored when a driver completes a trip. Admin dashboards and reports show **commission revenue**; driver earnings show **net payout** after the fee.

## Tech Stack

- Next.js 15, React 19, Tailwind CSS 4
- SQLite + Prisma ORM
- Socket.io (custom Node server)
- Leaflet + OpenStreetMap
- JWT (httpOnly cookies)

## Production (local)

```bash
npm run build
npm run start
```

Both commands use the custom `server.ts` that bundles Next.js + Socket.io.

---

## Host it live (deployment)

Movee needs a **always-on Node server** (Socket.io + custom `server.ts`). **Vercel alone will not work** for the full app without splitting the socket server.

### Before you deploy

1. **PostgreSQL** — the schema uses PostgreSQL (required for Railway and other hosts). For local dev: `docker compose up -d` then set `DATABASE_URL` in `.env` from `.env.example`.

2. **Set strong secrets** — copy `.env.example` and set:
   - `JWT_SECRET` — long random string ([generate one](https://generate-secret.vercel.app/32))
   - `NEXT_PUBLIC_APP_URL` — your live URL, e.g. `https://movee.up.railway.app`
   - `DATABASE_URL` — PostgreSQL connection string from your host

3. **Run migrations** after deploy:

   ```bash
   npx prisma db push
   npm run db:seed
   ```

4. **Change demo passwords** before real users sign up.

---

### Option A — Railway (recommended, easiest)

The repo includes `railway.toml` with build/start commands. Prisma uses **PostgreSQL**.

1. Push your code to **GitHub** ([Carti0z/Movee](https://github.com/Carti0z/Movee)).
2. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub** → select **Movee**.
3. In the project, click **+ New** → **Database** → **PostgreSQL**.
4. Click your **web service** (the repo) → **Variables** → **Add variable** (or **Reference** the Postgres service’s `DATABASE_URL`):

   | Variable | Value |
   |----------|--------|
   | `DATABASE_URL` | Reference → PostgreSQL → `DATABASE_URL` |
   | `JWT_SECRET` | Long random string |
   | `NEXT_PUBLIC_APP_URL` | Your Railway public URL (Settings → Networking → generate domain), e.g. `https://movee-production.up.railway.app` |
   | `NODE_ENV` | `production` |
   | `NEXT_PUBLIC_APP_NAME` | `Movee` |
   | `PLATFORM_COMMISSION_RATE` | `0.15` |
   | `NEXT_PUBLIC_COMMISSION_RATE` | `0.15` |

5. **Settings** → **Networking** → **Generate Domain** (if you have not already).
6. Set `NEXT_PUBLIC_APP_URL` to that exact HTTPS URL (no trailing slash), then **Redeploy**.
7. After the first successful deploy: service → **⋯** → **Shell** → run once:

   ```bash
   npm run db:seed
   ```

8. Open the public URL and log in with demo accounts (see above).

**CLI (optional):** `npm i -g @railway/cli` → `railway login` → `railway link` → `railway up`.

---

### Option B — Render

1. [render.com](https://render.com) → **New** → **Web Service** → connect GitHub repo.
2. **Environment:** Node
3. **Build command:** `npm install && npx prisma generate && npm run build`
4. **Start command:** `npx prisma db push && npm run start`
5. Add **PostgreSQL** from Render dashboard → paste `DATABASE_URL` into env vars.
6. Set `NEXT_PUBLIC_APP_URL` to your Render URL (e.g. `https://movee.onrender.com`).
7. Free tier sleeps after inactivity (slow first load).

---

### Option C — VPS (DigitalOcean, Hetzner, AWS EC2)

Full control; you manage the server.

```bash
# On the server (Ubuntu)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx

git clone <your-repo> && cd RideSharing
cp .env.example .env   # edit with production values
npm install
npx prisma generate
npm run build
npx prisma db push
npm run db:seed

# Run with PM2 (keeps app alive)
sudo npm install -g pm2
pm2 start "npm run start" --name movee
pm2 save && pm2 startup
```

Put **Nginx** in front for HTTPS (Let’s Encrypt with Certbot) and proxy to `http://127.0.0.1:3000`.

---

### Option D — Docker (Fly.io, Railway, any Docker host)

A `Dockerfile` is included in the repo.

```bash
docker build -t movee .
docker run -p 3000:3000 --env-file .env movee
```

On Fly.io: `fly launch` → set secrets → `fly deploy`.

---

### Hosting checklist

| Requirement | Why |
|-------------|-----|
| Node.js 20+ | Custom server + Socket.io |
| PostgreSQL | Persistent data in production |
| HTTPS | Secure cookies & auth |
| `NEXT_PUBLIC_APP_URL` | Socket.io CORS + redirects |
| Always-on instance | Real-time ride updates |

### What does **not** work out of the box

- **Vercel** — no long-running Socket.io server on the same deployment
- **GitHub Pages / static hosts** — no backend
- **SQLite on serverless** — database resets on redeploy

### After going live

1. Test rider book → driver accept → track → complete → rate.
2. Confirm the **Live** badge connects (Socket.io).
3. Log in as admin and check commission in **Reports**.
4. Point a custom domain and update `NEXT_PUBLIC_APP_URL` to match.
