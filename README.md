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
   | `DATABASE_URL` | **Postgres** connection string — required for **saved replies** on `/dashboard/comments` (e.g. [Neon](https://neon.tech)). After setting it, run migrations (see below). |

   For **Analytics** (`/dashboard/analytics`), the same Google Cloud project should also have **YouTube Analytics API** enabled (Library → “YouTube Analytics API” → Enable), in addition to YouTube Data API v3.

   **Database migrations:** With `DATABASE_URL` in your environment, run:

   ```bash
   npx prisma migrate deploy
   ```

   (Locally or in CI; `postinstall` already runs `prisma generate`.) Migrations create **`SavedReply`** (comments templates) and **`PipelineItem`** + **`PipelineStatus`** enum (content pipeline on `/dashboard/pipeline`), plus **workspaces** (`Organization`, members, invites, per-org feature flags). Each signed-in user gets a personal workspace on first use; pipeline and saved replies are scoped to the **active** workspace (switch in **Settings**).

   If `AUTH_URL` / `NEXTAUTH_URL` are missing, `/api/auth/session` can return **500** and the dashboard shows “Could not load channel” because the session never establishes.

3. **Google Cloud Console** → OAuth client → **Authorized redirect URIs** must include:

   `https://<your-vercel-host>/api/auth/callback/google`

   (Add the same for a custom domain if you use one.)

4. Redeploy after changing env vars.

**Preview deployments:** Either leave `AUTH_URL` unset so the app uses `VERCEL_URL`, or set per-environment URLs in Vercel. Each preview hostname needs its own redirect URI in Google if you test OAuth there.

### Troubleshooting: `InvalidCheck` (pkceCodeVerifier or state `could not be parsed`)

On **Vercel/serverless**, OAuth **PKCE** and **`state`** cookies often do not round-trip on the callback request, which triggers Auth.js `InvalidCheck`. This app uses a **confidential** Google client (`client_secret`) with **`checks: []`** so sign-in does not depend on those cookies. Redeploy after pulling the latest `auth` config. Also confirm **`AUTH_URL`** matches the live URL (no trailing slash) and Google’s OAuth redirect URI includes `https://<host>/api/auth/callback/google` for that host.

### Troubleshooting: `GET /api/youtube/channel` returns 403 / “Forbidden”

1. **Enable YouTube Data API v3** in the **same Google Cloud project** as your OAuth client: [APIs & Services → Library](https://console.cloud.google.com/apis/library) → search “YouTube Data API v3” → **Enable**. Without this, Google returns `accessNotConfigured` and the channel request fails with HTTP 403.

2. **Re-consent after scope changes:** Sign out of the app, sign in again, and accept all requested permissions. If you previously approved the app without YouTube scopes, the access token will not work for `channels.list` until you complete a fresh consent with `youtube.readonly` / `youtube` in scope.

3. **YouTube channel:** The Google account must have a YouTube channel. Brand accounts or accounts that never opened YouTube may need to create a channel first.

### Workspaces, roles, and feature flags

- **Roles:** `VIEWER` (read pipeline/templates), `MEMBER` (edit), `ADMIN` (invites), `OWNER` (feature toggles). Team management lives under **`/dashboard/team`**.
- **Invites:** Admins create an invite by email; the invitee must sign in with that Google account and open the copied **`/dashboard/join?token=…`** link.
- **Feature flags (owner):** In **Settings**, owners can toggle **pipeline CSV export** and **YouTube write actions** (comments, playlist changes, video metadata updates, **video uploads** on **`/dashboard/upload`** and **`/dashboard/bulk-upload`**). Deployment defaults: `FEATURE_EXPORTS_DEFAULT` and `FEATURE_YOUTUBE_WRITES_DEFAULT` (set to `false` to default new workspaces off until overridden in the DB).

### Upload and scheduling

- **`/dashboard/upload`** — one video at a time (title, description, visibility, optional schedule, playlist).
- **`/dashboard/bulk-upload`** — **Add folder** (all supported videos, sorted by path) or **Add files**; **reorder** with the drag handle or up/down arrows; **per row:** title, description, visibility, and optional **schedule public** time. **Shared** for the whole batch: tags, category, made-for-kids, optional playlist.
- Uploads run **sequentially** via the YouTube Data API (each video uses quota — often **~1,600 units**; see [Quota](https://developers.google.com/youtube/v3/getting-started#quota)).
- **Scheduling:** “Schedule public” uses **private** + **`publishAt`** (YouTube publishes at that time).
- **Re-consent:** If upload returns 403, sign out, remove the app at [Google permissions](https://myaccount.google.com/permissions), sign in again, and accept scopes (**`youtube`** / **`youtube.upload`**).
- **Limits:** **20 GB** max per file; **2 MiB chunks** through the app server (Vercel-friendly; huge batches can take a long time).

### Privacy and data handling

- The app stores **OAuth tokens** in the Auth.js session and **workspace data** (pipeline cards, saved reply templates, org membership) in your **Postgres** database. YouTube API calls use the signed-in user’s Google permissions; we do not train models on your data.
- **Workspace content** (pipeline, templates) is visible to **all members** of that workspace, not only the user who created a row.

### Troubleshooting: Comments — “insufficient permissions”

Posting replies and loading some thread data needs **`youtube.force-ssl`** and **`youtube`** scopes. If you signed in before those were added, **remove the app** at [Google Account → Third-party access](https://myaccount.google.com/permissions), then **sign in again** and approve all prompts. Comments must be allowed on the video in YouTube Studio.

## Structure

- `src/app/` — App Router routes, API routes, layouts
- `src/components/` — UI, layout, feature components
- `src/lib/` — Auth, YouTube API client, utilities
