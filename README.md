# YTM Web

YouTube creator dashboard built with **Next.js 16** (App Router), **React 19**, and **Tailwind CSS v4**. Designed for **Vercel** (default `next build` / `next start`, no custom output directory).

## Setup

```bash
npm install
cp .env.example .env.local
# Fill AUTH_SECRET, AUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Local dev (Turbopack)    |
| `npm run build`| Production build         |
| `npm run start`| Start production server  |
| `npm run lint` | ESLint                   |

## Deploy on Vercel

1. Import the repo; framework **Next.js** is auto-detected (no `vercel.json` needed).
2. In **Project → Settings → Environment Variables**, add (Production at minimum):

   | Variable | Notes |
   |----------|--------|
   | `AUTH_SECRET` | Same as local; `openssl rand -base64 32` |
   | `AUTH_URL` | **Exact** site URL, e.g. `https://yt-manager-pro-fawn.vercel.app` (no trailing slash) |
   | `NEXTAUTH_URL` | Optional duplicate of `AUTH_URL` for compatibility |
   | `GOOGLE_CLIENT_ID` | Web OAuth client |
   | `GOOGLE_CLIENT_SECRET` | Web OAuth client |

   If `AUTH_URL` / `NEXTAUTH_URL` are missing, `/api/auth/session` can return **500** and the dashboard shows “Could not load channel” because the session never establishes.

3. **Google Cloud Console** → OAuth client → **Authorized redirect URIs** must include:

   `https://<your-vercel-host>/api/auth/callback/google`

   (Add the same for a custom domain if you use one.)

4. Redeploy after changing env vars.

**Preview deployments:** Either leave `AUTH_URL` unset so the app uses `VERCEL_URL`, or set per-environment URLs in Vercel. Each preview hostname needs its own redirect URI in Google if you test OAuth there.

## Structure

- `src/app/` — App Router routes, API routes, layouts
- `src/components/` — UI, layout, feature components
- `src/lib/` — Auth, YouTube API client, utilities
