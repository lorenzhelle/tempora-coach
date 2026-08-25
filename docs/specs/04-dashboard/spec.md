# Spec 4: Dashboard

**Goal:** The primary view of the app — shows the current weekly plan, the
next session, and progress toward the milestones.

**Views:**
- Week overview: all `PlannedSession` entries for the current week,
  status (open/done/missed)
- Next session: highlighted, with details (type, target pace/duration)
- Milestone progress: current personal best vs. the next milestone
- History: recent activities with a pace trend (a simple chart)

**Acceptance Criteria:**
- WHEN the dashboard loads, THE SYSTEM SHALL determine and display the
  current `TrainingWeek` based on today's date.
- IF a `PlannedSession` is in the past and has no linked activity, THEN
  THE SYSTEM SHALL mark it as "missed."
- WHEN a new Strava activity has been synced, THE SYSTEM SHALL show the
  updated dashboard on the next load (no manual refresh needed).
