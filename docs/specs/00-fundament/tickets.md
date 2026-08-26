# Foundation — Tickets

No spec relation — baseline setup that all other specs build on.

### A1 — Project setup
- Set up the Next.js (App Router, TypeScript) project
- Set up SQLite + Prisma, `.env` handling for secrets
- Place CLAUDE.md at the repo root
- **Acceptance:** `npm run dev` starts an empty landing page, the DB
  migration runs without errors

### A3 — Vercel deployment + CI pipeline
- Create a Vercel project and connect it to the GitHub repo (git
  integration): a push to `main` auto-deploys to production, every PR
  gets a preview deployment
- Store secrets (Strava client ID/secret, Anthropic API key, DB
  connection) as Vercel environment variables (never in the repo, see
  `docs/constitution.md` SEC-001)
- A GitHub Actions workflow that runs lint, typecheck, and build before
  every merge (tests once a test framework is chosen, see `AGENTS.md`
  "Exact commands")
- **Acceptance:** a push to `main` triggers a production deployment on
  Vercel; a PR automatically gets a preview deployment; a PR with a
  failing lint/typecheck/build is marked "checks failed" by GitHub and
  blocks the merge

### A4 — Authentication (Supabase Auth)
- Wire up Supabase Auth (email/password) via `@supabase/supabase-js` +
  `@supabase/ssr` — see [ADR-0005](../../decisions/0005-multi-user-supabase-auth.md)
- `lib/supabase/{client,server,proxy}.ts` (browser client, server client,
  session-refresh helper) + `proxy.ts` at the repo root (Next.js 16's
  renamed `middleware.ts`) calling it on every request
- `app/login`, `app/signup` (email/password forms), `app/auth/callback`
  (Route Handler exchanging an emailed confirmation code for a session)
- `app/page.tsx` becomes auth-aware: signed-in/out view, sign-out control
- **Acceptance:**
  - An unauthenticated visitor can open `/login` and `/signup`, sees the
    forms, no console errors (`e2e/login.spec.ts`, `e2e/signup.spec.ts`,
    same shape as `e2e/landing.spec.ts`)
  - A signed-up-and-confirmed user can sign in and see "Signed in as
    `<email>`" on `/`; signing out returns to the signed-out view
    (verified manually — see "Known gaps" below)
  - `e2e/landing.spec.ts` still passes unchanged
- **Known gaps (flagged, not silently skipped):**
  - No automated signup/login round-trip E2E test yet — needs a seeded
    test account and Supabase's email-confirmation dashboard setting,
    both human/dashboard-only steps (see `AGENTS.md`)
  - The `e2e` CI job now needs a real, reachable Supabase project
    (`proxy.ts` calls Supabase on every request) — requires two new
    GitHub repo secrets, a human-only setup step, before that job passes
  - Per-user data scoping (`userId` on Prisma models) is not part of this
    ticket — added per-model when Epic B/C create those models, per the
    existing A2 decision

---

## Out of scope (deliberately deferred)
- Pushing workouts back to the Garmin device (Training API / Connect IQ)
- Per-user data scoping, roles/permissions, and invite-gating/closed
  signup — Supabase Auth itself is now wired up (ticket A4, see
  [ADR-0005](../../decisions/0005-multi-user-supabase-auth.md)), but the
  Prisma schema doesn't yet scope any model by user (added per-model as
  Epic B/C create them) and there's no access-control layer beyond "has
  an account" yet
- Garmin-exclusive metrics (HRV status, Body Battery, Training
  Load/Status) — don't come through via Strava (see ADR-0002); if wanted
  later, that would be a separate add-on feature
- Apple Health as a data source (no cloud API, on-device only — see
  `docs/research/`)
