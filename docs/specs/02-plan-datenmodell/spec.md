# Spec 2: Plan Data Model

**Goal:** The training plan is structured in the DB, not just text.

**Data model:**
```
Plan: id, goalDescription ("5km under 20min"), startDate, targetDate,
      currentPhase (enum: base | tempo | interval | race),
      status (enum: draft | confirmed | archived),

      -- Onboarding-intake fields. These are the input packages/plan-engine's
      -- generatePlan() consumes (see ADR-0009) -- not user-facing plan
      -- content by themselves. The first 8 are required for generation
      -- (see evaluateIntake() in packages/plan-engine); the rest are
      -- optional, each named for the specific rule it feeds:
      currentWeeklyVolumeKm, currentRunsPerWeek, longestRecentRunKm,
      availableDaysPerWeek, longRunDay (dayOfWeek),
      experience (enum: beginner | returner | continuous),
      safetyScreenCompleted (bool),
      personalBest (JSON, nullable: {distanceMeters, timeSeconds, achievedMonthsAgo}),
      recentTimeTrial (JSON, nullable: {distanceMeters, timeSeconds}),
      gymAccess (bool, nullable), priorStressFracture (bool, nullable),
      scheduleRegularity (enum: regular | irregular, nullable),
      ageYears (nullable), heightCm (nullable), weightKg (nullable),

      -- generatePlan() output, persisted alongside the plan so the
      -- transparency reveal (Spec 3) never has to recompute or guess:
      ruleSetVersion (string), trace (JSON array of Decision objects)

Milestone: id, planId, targetTimeSeconds (nullable), label ("under 25min"),
           targetDate (nullable), achievedDate (nullable)

TrainingWeek: id, planId, weekNumber, startDate, endDate, phase,
              isDeload (bool), isTaper (bool), notes

PlannedSession: id, trainingWeekId, dayOfWeek, date, type (enum: easy |
                tempo | interval | strength | rest | timeTrial),
                targetDurationMin (nullable), targetDistanceKm (nullable),
                targetPaceSecPerKm (nullable, a number -- never a
                pre-formatted string like '5:30/km'; formatting is a
                render-time concern, not stored data), description,
                completed (bool), linkedActivityId (nullable, FK to
                Activity)
```

`Plan.targetDate` is capped at 12 months after `startDate` — onboarding
validates this before a `Plan` is ever created (see
[Spec 3](../03-onboarding/spec.md)); `packages/plan-engine`'s
`generatePlan()` clamps the same way and reports a violation if the
request exceeded it, as defense in depth. The onboarding-intake fields are
consumed by `generatePlan()`, not shown as user-facing plan content by
themselves; `ageYears`/`heightCm`/`weightKg` are collected for future
injury-risk stratification research only — they feed no rule yet (a
deliberate first-version scope choice, not an oversight — see
`packages/plan-engine`'s `INTAKE_FIELDS` metadata, where this is stated
plainly rather than implied). There is no separate "phase overview"
model: a phase's date range and week count are derived by grouping
`TrainingWeek` rows by `phase`.

`isDeload`/`isTaper` on `TrainingWeek`, `PlannedSession.date`, and
`targetPaceSecPerKm` all mirror `generatePlan()`'s own output field-for-
field — the mapping from engine output to DB row is meant to be nearly
mechanical, not a reinterpretation.

**Acceptance Criteria:**
- WHEN a plan is created, THE SYSTEM SHALL create at least one
  `Milestone` and `TrainingWeek`/`PlannedSession` entries for the full
  horizon (every week from `startDate` to `targetDate`, capped at 12
  months) — not just the current phase.
- WHEN a plan is created or replanned, THE SYSTEM SHALL persist the
  `ruleSetVersion` and `trace` `generatePlan()` returned alongside it, so
  the "why" reveal (Spec 3) renders from the stored trace rather than
  recomputing or inventing an explanation.
- WHEN a Strava activity matches a `PlannedSession` in time/content, THE
  SYSTEM SHALL be able to link them (manually or suggested) and set
  `completed = true`.
- IF a milestone's target date has been reached and the last time-trial
  result is under the target value, THEN THE SYSTEM SHALL set
  `achievedDate`.
- WHEN a full replan happens (Spec 5), THE SYSTEM SHALL recompute and
  replace `TrainingWeek`/`PlannedSession` rows only where
  `completed = false` — rows already marked `completed` are never
  modified or deleted.
