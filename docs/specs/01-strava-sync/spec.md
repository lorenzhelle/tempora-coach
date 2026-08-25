# Spec 1: Strava Sync

**Goal:** Automatically pull runs from Strava (the Garmin watch syncs
there) into the app DB, without a manual export. See
[ADR-0002](../../decisions/0002-datenquelle-strava.md) for the reasoning
behind Strava instead of a direct Garmin sync.

**Approach:** The official Strava OAuth API. A one-time connect flow per
user (OAuth redirect, store access/refresh token), then a webhook
endpoint that gets notified about new/changed activities from Strava. A
periodic reconciliation (e.g. daily) as a fallback in case a webhook
event gets lost.

**Data model `StravaConnection`:**
```
id, userId, stravaAthleteId, accessToken, refreshToken, expiresAt
```

**Data model `Activity`:**
```
id, stravaActivityId (unique), date, distanceKm, durationSeconds,
avgPaceSecPerKm, avgHeartRate (nullable), splits (JSON: per-km pace),
feltEffort (nullable, can be added manually 1-10), notes (nullable)
```

**Acceptance Criteria:**
- WHEN a user completes the Strava connect flow, THE SYSTEM SHALL store
  the access token, refresh token, and expiry time in `StravaConnection`.
- WHEN a Strava webhook event arrives for a new activity, THE SYSTEM
  SHALL fetch the activity and store it as an `Activity` entry.
- IF a Strava activity already exists in the DB (same `stravaActivityId`),
  THEN THE SYSTEM SHALL NOT create a duplicate.
- WHEN an access token has expired, THE SYSTEM SHALL automatically renew
  it via the refresh token, before an API call fails.
- IF the refresh token is invalid (the user revoked access in Strava),
  THEN THE SYSTEM SHALL log the error, mark the connection as
  disconnected, and not block the next sync attempt for other users.
- WHEN a new activity has been stored, THE SYSTEM SHALL make it available
  to the dashboard and the chat context.
