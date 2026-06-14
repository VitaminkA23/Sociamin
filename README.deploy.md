# VitaminA — Production Deployment Guide

Stack: **Frontend → Vercel** | **Backend + WebSockets → Render** | **Database → Neon / Supabase**

---

## 1. Database (Neon or Supabase) — do this first

### Neon (recommended — free tier, serverless Postgres)
1. Go to [neon.tech](https://neon.tech) → **New Project**
2. Copy the **Connection string** (looks like `postgresql://user:pass@host/db?sslmode=require`)
3. Save it — you'll need it as `DATABASE_URL` in both Render and locally

### Supabase (alternative)
1. Go to [supabase.com](https://supabase.com) → **New project**
2. Settings → Database → **Connection string** (use the "URI" tab, not the pooler, for Prisma)
3. Append `?pgbouncer=true&connection_limit=1` if using the pooler

> **Schema:** You do NOT need to run any SQL manually. The Render build command runs
> `prisma db push` automatically, which creates all tables from `schema.prisma`.

---

## 2. Backend → Render

### Option A — Render Blueprint (recommended)
1. Push the repo to GitHub
2. Go to [render.com](https://render.com) → **New → Blueprint**
3. Connect your repo — Render reads `render.yaml` from the root automatically
4. Fill in the two secret environment variables when prompted (see table below)
5. Click **Apply** — Render builds and deploys

### Option B — Manual web service
1. **New → Web Service** → connect your GitHub repo
2. **Runtime:** Node
3. **Build command:**
   ```
   pnpm install && pnpm --filter @vitamina/backend build && cd apps/backend && npx prisma db push
   ```
4. **Start command:**
   ```
   node apps/backend/dist/index.js
   ```
5. **Health check path:** `/health`
6. Add all environment variables from the table below

### Backend environment variables (Render dashboard)

| Variable | Value / Notes |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Connection string from Neon/Supabase |
| `JWT_SECRET` | Generate with `openssl rand -base64 48` (min 32 chars) |
| `JWT_EXPIRES_IN` | `7d` |
| `BCRYPT_ROUNDS` | `12` |
| `FRONTEND_URL` | Your Vercel URL, e.g. `https://vitamina.vercel.app` |
| `UPLOADS_DIR` | *(optional)* Set only if you add a Render Persistent Disk (see §5) |

> Render automatically sets `PORT` — the app reads it via `env.PORT`.

---

## 3. Frontend → Vercel

### Deploy
1. Go to [vercel.com](https://vercel.com) → **New Project** → import your GitHub repo
2. Vercel detects `vercel.json` at the root and uses it automatically:
   - **Install:** `pnpm install --frozen-lockfile`
   - **Build:** `pnpm --filter @vitamina/web build`
   - **Output:** `apps/web/dist`
   - **Rewrites:** all routes → `index.html` (React Router SPA)
3. Before deploying, set the environment variable below

### Frontend environment variables (Vercel dashboard → Settings → Environment Variables)

| Variable | Value |
|---|---|
| `VITE_API_URL` | Your Render backend URL, e.g. `https://vitamina-backend.onrender.com` |

> This single variable powers both the REST API calls (`/api/*`) and the Socket.io
> connection. In local dev it's **not set** — the Vite proxy handles `/api/*` transparently.

---

## 4. Wire everything together

After both services are deployed:

1. Copy the Vercel URL (e.g. `https://vitamina.vercel.app`)
2. Go to Render → your backend service → **Environment** → set `FRONTEND_URL` to that URL
3. Click **Save** — Render restarts the backend with the correct CORS origin
4. Copy the Render URL (e.g. `https://vitamina-backend.onrender.com`)
5. Go to Vercel → your project → **Settings → Environment Variables** → set `VITE_API_URL` to that URL
6. Trigger a Vercel redeploy (the env var bakes into the Vite bundle at build time)

---

## 5. File uploads (avatars, post images)

**The problem:** Render's filesystem resets on every redeploy. Uploaded images are lost.

### Option A — Render Persistent Disk (simplest, paid)
1. Render dashboard → your service → **Disks → Add Disk**
2. Mount path: `/opt/render/project/uploads`
3. Add env var: `UPLOADS_DIR=/opt/render/project/uploads`
4. Files survive redeploys ✓ (but not service migration)

### Option B — Cloudinary / AWS S3 / Cloudflare R2 (recommended for production scale)
Swap out `upload.middleware.ts` to use `multer-storage-cloudinary` or `multer-s3`.
The backend currently stores files at `UPLOADS_DIR` and serves them at `/uploads/*`.
The frontend uses the returned `avatarUrl` path directly.

### For now (first deploy)
If you accept losing uploads on redeploy (fine for a private beta), deploy as-is with no
`UPLOADS_DIR` — files go to `/opt/render/project/src/uploads` and are ephemeral.

---

## 6. Local → Production quick reference

```bash
# Generate a JWT secret
openssl rand -base64 48

# Apply schema to production DB without migrations (first deploy or after schema changes)
DATABASE_URL="<neon-url>" npx prisma db push

# Run a full production build locally to validate before pushing
cd apps/backend && pnpm build
```

---

## 7. Checklist before go-live

- [ ] `DATABASE_URL` set in Render → backend builds and `prisma db push` succeeds
- [ ] `JWT_SECRET` set to a secure random value (≥32 chars)
- [ ] `FRONTEND_URL` in Render matches the exact Vercel URL (no trailing slash)
- [ ] `VITE_API_URL` in Vercel matches the exact Render URL (no trailing slash)
- [ ] Vercel redeployed after setting `VITE_API_URL` (env bakes into the JS bundle)
- [ ] Visit `https://vitamina-backend.onrender.com/health` → should return `{"status":"ok",...}`
- [ ] Open the frontend, register/login, send a message — Socket.io connection should connect
- [ ] Upload a profile picture — verify avatar persists (or note uploads are ephemeral)
- [ ] Decide on uploads strategy (Persistent Disk vs cloud storage) before public launch
