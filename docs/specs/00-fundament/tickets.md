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

---

## Out of scope (deliberately deferred)
- Pushing workouts back to the Garmin device (Training API / Connect IQ)
- Multi-user capability / a real auth system for multiple user accounts —
  the Strava OAuth architecture (ADR-0002) is technically
  multi-user-capable, but v1 stays deliberately limited to a single user
  (no user onboarding flow, no roles/permissions)
- Garmin-exclusive metrics (HRV status, Body Battery, Training
  Load/Status) — don't come through via Strava (see ADR-0002); if wanted
  later, that would be a separate add-on feature
- Apple Health as a data source (no cloud API, on-device only — see
  `docs/research/`)
