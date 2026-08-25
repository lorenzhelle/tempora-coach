# ADR-0002: Data source for running activities — Strava instead of a direct Garmin sync

## Status
Decided — 2026-08-25 (supersedes the original assumption of "Garmin via
an unofficial library + a Python sidecar," as it first appeared in
CLAUDE.md/docs/specs/)

## Context
Two options were evaluated for getting running data from the Garmin watch
into the app:

1. **Directly via `python-garminconnect`** (an unofficial library, login
   with the Garmin email/password through a Python sidecar). Works
   technically, but: no official support, the login flow can break at any
   time due to Garmin-side changes (MFA handling, rate limits), and for
   future additional users you'd have to store their Garmin password
   centrally — not defensible once more than the operator themselves uses
   the app.
2. **Strava as a relay via the official OAuth API.** Garmin Connect
   automatically syncs activities to Strava. Each user connects their own
   Strava account via OAuth — no password sharing. Real webhooks for new
   activities (one app-wide subscription for all users). The standard
   tier allows up to 10 connected athletes without formal review. Since
   June 1, 2026, an active Strava membership ($11.99/month) is required
   for API access — the app operator pays that per app, not each user
   individually.

**Trade-off, knowingly accepted:** Garmin-exclusive metrics (HRV status,
Body Battery, Training Load/Status — Firstbeat analytics) don't come
through via Strava, only basic running data (pace, distance, duration,
heart rate, GPS, splits). For the core of the plan (zones, volume
progression, progress, pain-traffic-light check-ins, the spike rule from
the research in `docs/research/`), that is entirely sufficient.

Apple Health was also evaluated: no cloud/REST API, only an on-device
framework — not a viable path for a web app without a companion native
app or Shortcuts automation. Remains a possible iOS-exclusive additional
channel for the future, but is not a substitute for Strava.

## Decision
The data source is **Strava**, connected via the official OAuth API +
webhooks. No more Python sidecar — the sync runs directly as a Next.js
API route (OAuth connect flow + webhook handler).

## Consequences
- New data model `StravaConnection` (userId, stravaAthleteId,
  accessToken, refreshToken, expiresAt) instead of Garmin login
  credentials in `.env`.
- `Activity.garminActivityId` becomes `Activity.stravaActivityId`.
- The architecture gets simpler: no separate sidecar host/cron process
  needed anymore. [Spec 1 and its tickets](../specs/01-strava-sync/) have
  been updated to Strava accordingly (details there, not duplicated
  here).
- Ongoing cost: $11.99/month for Strava API access (paid by the operator,
  not by individual users).
- The architecture is fundamentally multi-user-capable via per-user
  OAuth, even though v1 continues to deliberately go live for a single
  user only (see "Out of scope" in
  `docs/specs/00-fundament/tickets.md`) — that is a separate, still-open
  decision, not a consequence of this ADR.
- Firstbeat analytics (HRV, Body Battery, Training Load) are not
  available. If wanted later: a separate, optional add-on feature, not
  part of v1.
