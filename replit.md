# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── astyra/             # Astyra makeup try-on React app (preview path: /)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## GlowJo (morning-mate/)

**Location**: `morning-mate/` (standalone project — not in pnpm workspace)
**Live**: getglowjo.com (Railway, auto-deploys from GitHub: user2008marvin/Morning-Mate)

**Stack**: React + Vite frontend, tRPC + Express backend, Drizzle ORM + TiDB Cloud (MySQL), JWT sessions in cookies, email/password auth

**Routes**: `/` Home, `/app` morning routine game, `/app?demo=1` demo mode, `/parent` Parent Dashboard, `/success` post-payment, `/reset-password` password reset

### Auth Flow
Email/password → bcrypt hash → JWT cookie (`app_session_id`) → `trpc.auth.me` for session. Forgot password sends reset link via Mailgun (token logged to Railway console as fallback).

### Key Files
- `server/_core/index.ts` — Express server, Helmet CSP (blob: allowed for media), rate limiting
- `server/routers.ts` — tRPC router: `auth` (login/register/forgotPassword/resetPassword), `subscription`, `app`, `stripe`
- `server/utils/email.ts` — Mailgun email (password-reset, welcome templates)
- `server/db.ts` — TiDB Cloud connection, user/child/subscription CRUD
- `client/src/pages/AppPage.tsx` — morning routine game (tasks, TTS, Mum's Voice playback, demo mode)
- `client/src/pages/ParentDashboard.tsx` — child CRUD, Mum's Voice recording, Stripe upgrade, evening prep
- `client/src/pages/ResetPassword.tsx` — token-based password reset page
- `client/src/components/AuthModal.tsx` — login / register / forgot password (4 view states)
- `client/src/lib/voiceRecordings.ts` — IndexedDB store for Mum's Voice recordings (per device)
- `vite.config.ts` — HTTPS enabled in dev (basicSsl) so mic recording works in Replit preview

### Freemium Strategy
- **Free**: Sign up, use app indefinitely, music on WAKE UP task only, 1 child max
- **Demo**: `/app?demo=1` — no sign-up, preset child "Emma age 7", orange banner CTA — this is the one free taste
- **No trial countdown** — 3-day free morning limit removed; demo replaces it
- **Upgrade via dashboard** — UpgradeCard at bottom of ParentDashboard is the upsell point

### Subscription Tiers
`freemium` (free, 1 child) → `starter` (£4.99/mo, up to 3 children)

### Mum's Voice
- Recorded per task (prompt + completion) in ParentDashboard — available to ALL tiers
- Stored in IndexedDB on device only (not synced to server)
- Key format: `prompt_TASK LABEL` / `completion_TASK LABEL`
- Plays during routine if recording exists; falls back to browser TTS
- CSP allows `blob:` in mediaSrc/connectSrc so recordings play back correctly

### TTS
- Browser speech synthesis only (rate 1.1, pitch 1.1)
- No server TTS — Manus TTS removed

### Multi-Child Flow (PLANNED — not yet built)
Premium supports up to 3 children. Planned UX:
1. If account has multiple children, show a **child picker** before the routine starts (tap to select which child is doing their morning)
2. After routine completion (child hits "LET'S GO! 🚀"), show prompt: "Emma's done! ☀️ Start Jake's morning?" — one tap starts next child's routine
3. Sequential by design — simultaneous use requires a second device (natural for families)

---

## Astyra Makeup Try-On App

**Artifact**: `artifacts/astyra` (preview path: `/`)

**Implementation**: Pure standalone HTML/CSS/JS in `artifacts/astyra/index.html`, served by Vite dev server. The React source files in `src/` are unused — the app is entirely self-contained in `index.html`.

### Flow
**Occasion → Look → Photo → Result** (4-step)

### Features
- **Headline**: "Your face. Your occasion. Your perfect look."
- **6 Occasions**: Wedding Guest, Date Night, Night Out, Work/Professional, Everyday Natural, Photoshoot/Event
- **2 looks per occasion** (Natural/Soft + Glam/Bold or Trendy), each with AI prompt, colour palettes, technique steps, and pro tips
- **Split-screen before/after** result view with colour overlay showing look palette
- **Optional name + email capture** on result screen (skip option available)
- **Submission storage** via POST `/api-server/api/submissions`
- **Hidden admin dashboard** accessed by tapping the Astyra logo 5 times
- **Admin metrics**: total, today, this week, email capture rate; bar charts by occasion and look; recent submissions table
- **Themed confetti** per occasion on result reveal
- **Look name flash** animation on transition to result
- **Swatch tap** modal with colour code copy
- No scrolling marquee

### Key Files
- `artifacts/astyra/index.html` — Complete standalone app (all HTML/CSS/JS inline)
- `lib/db/src/schema/submissions.ts` — Submissions DB table
- `artifacts/api-server/src/routes/submissions.ts` — API routes for submissions & admin

### API Base URL
`/api-server/api` (Replit path-based routing proxies to the api-server artifact)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `health.ts`, `submissions.ts`
- Depends on: `@workspace/db`, `@workspace/api-zod`

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

- `src/schema/submissions.ts` — Submissions table (id, occasion, look, firstName, email, imageDataUrl, createdAt)

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec. Endpoints:
- `GET /healthz` — health check
- `POST /submissions` — save try-on submission
- `GET /admin/submissions` — list submissions (paginated)
- `GET /admin/stats` — aggregated admin statistics

Run codegen: `pnpm --filter @workspace/api-spec run codegen`
