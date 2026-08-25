# Strava Sync — Tickets

Builds on [00-fundament](../00-fundament/tickets.md) and
[02-plan-datenmodell](../02-plan-datenmodell/tickets.md). See
[spec.md](spec.md) for the goal and acceptance criteria.

### B1 — Strava OAuth app + connect flow
- Register a Strava API app (client ID/secret in `.env`)
- Build the OAuth redirect flow: user connects their Strava account, the
  callback stores the access/refresh token in `StravaConnection`
- **Acceptance:** after the connect flow, a valid access token is in the
  DB, `StravaConnection` is populated (Spec 1, AC 1)

### B2 — Webhook endpoint: Strava → DB
- Create a webhook subscription with Strava, the endpoint validates the
  verification handshake
- On an incoming event: fetch the activity from the Strava API and store
  it as an `Activity`
- Dedupe via `stravaActivityId` (Spec 1, AC 3)
- **Acceptance:** a new activity created in Strava (real or a simulated
  webhook event) results in exactly one `Activity` entry, no duplicate on
  a repeated event

### B3 — Token refresh + error handling
- Automatic refresh of the access token before expiry (Spec 1, AC 4)
- Cleanly log the error case (invalid refresh token, network error), mark
  the connection as disconnected, don't block other syncs (Spec 1, AC 5)
- **Acceptance:** a simulated expired access token gets refreshed
  automatically without a sync failing; a simulated invalid refresh token
  doesn't block other syncs

### B4 — Periodic fallback reconciliation
- A daily cron job that reconciles the most recent activities per
  `StravaConnection`, in case a webhook event was lost
- **Acceptance:** manually "lose" a webhook event (don't trigger it) → the
  fallback job fetches the missing activity anyway
