# Fundament — Tickets

Kein Spec-Bezug — Basis-Setup, auf dem alle anderen Specs aufbauen.

### A1 — Projekt-Setup
- Next.js (App Router, TypeScript) Projekt aufsetzen
- SQLite + Prisma einrichten, `.env`-Handling für Secrets
- CLAUDE.md ins Repo-Root legen
- **Akzeptanz:** `npm run dev` startet eine leere Startseite, DB-Migration
  läuft fehlerfrei durch

### A3 — Vercel-Deployment + CI-Pipeline
- Vercel-Projekt anlegen und mit dem GitHub-Repo verbinden (Git-Integration):
  Push auf `main` deployt automatisch nach Production, jeder PR bekommt ein
  Preview-Deployment
- Secrets (Strava Client-ID/Secret, Anthropic API-Key, DB-Connection) als
  Vercel Environment Variables hinterlegen (nie im Repo, siehe
  `docs/constitution.md` SEC-001)
- GitHub-Actions-Workflow, der vor jedem Merge Lint, Typecheck und Build
  laufen lässt (Tests sobald ein Test-Framework gewählt ist, siehe
  `AGENTS.md` "Exact commands")
- **Akzeptanz:** Push auf `main` triggert ein Production-Deployment auf
  Vercel; ein PR erzeugt automatisch ein Preview-Deployment; ein PR mit
  fehlschlagendem Lint/Typecheck/Build wird von GitHub als "checks failed"
  markiert und blockiert den Merge

---

## Nicht in Scope (bewusst zurückgestellt)
- Workout-Push zurück aufs Garmin-Gerät (Training API / Connect IQ)
- Mehrbenutzer-Fähigkeit / echtes Auth-System für mehrere Nutzer-Accounts —
  die Strava-OAuth-Architektur (ADR-0002) ist technisch multi-user-fähig,
  aber v1 bleibt bewusst auf einen Nutzer beschränkt (kein Nutzer-Onboarding-
  Flow, keine Rollen/Rechte)
- Garmin-exklusive Metriken (HRV-Status, Body Battery, Training Load/Status)
  — kommen über Strava nicht durch (siehe ADR-0002); falls später gewünscht,
  wäre das ein separates Zusatzfeature
- Apple Health als Datenquelle (kein Cloud-API, nur geräteseitig — siehe
  `docs/research/`)
