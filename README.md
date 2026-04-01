# YTM Web

YouTube creator dashboard built with **Next.js 16** (App Router), **React 19**, and **Tailwind CSS v4**. Designed for **Vercel** (default `next build` / `next start`, no custom output directory).

## Setup

```bash
npm install
cp .env.example .env.local
# Fill AUTH_SECRET, NEXTAUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
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

Import the repo, set environment variables to match `.env.example`, and deploy. Framework preset: **Next.js** (auto-detected). No `vercel.json` is required.

## Structure

- `src/app/` — App Router routes, API routes, layouts
- `src/components/` — UI, layout, feature components
- `src/lib/` — Auth, YouTube API client, utilities
