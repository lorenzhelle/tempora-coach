# Spec 2: Plan Data Model

**Goal:** The training plan is structured in the DB, not just text.

**Data model:**
```
Plan: id, goalDescription ("5km under 20min"), startDate, targetDate,
      currentPhase (enum: base | tempo | interval | race),
      longRunDay (dayOfWeek, nullable), scheduleRegularity
      (enum: regular | irregular, nullable), gymAccess (bool, nullable),
      ageYears (nullable), heightCm (nullable), weightKg (nullable)

Milestone: id, planId, targetTimeSeconds, label ("under 25min"),
           targetDate (nullable), achievedDate (nullable)

TrainingWeek: id, planId, weekNumber, startDate, endDate, phase, notes

PlannedSession: id, trainingWeekId, dayOfWeek, type (enum: easy | tempo |
                interval | strength | rest | timeTrial), targetDurationMin
                (nullable), targetDistanceKm (nullable), targetPace
                (nullable), description, completed (bool),
                linkedActivityId (nullable, FK to Activity)
```

`Plan.targetDate` is capped at 12 months after `startDate` — onboarding
validates this before a `Plan` is ever created (see
[Spec 3](../03-onboarding/spec.md)). The `longRunDay`/`scheduleRegularity`/
`gymAccess`/`ageYears`/`heightCm`/`weightKg` fields are onboarding-intake
inputs to the progression algorithm (see
[ADR-0008](../../decisions/0008-full-horizon-deterministic-plan-generation.md)),
not user-facing plan content by themselves; `ageYears`/`heightCm`/
`weightKg` are collected for injury-risk stratification only — they feed
no rule yet (explicitly deferred, see ADR-0008 "Deferred"). There is no
separate "phase overview" model: a phase's date range and week count are
derived by grouping `TrainingWeek` rows by `phase`.

**Acceptance Criteria:**
- WHEN a plan is created, THE SYSTEM SHALL create at least one
  `Milestone` and `TrainingWeek`/`PlannedSession` entries for the full
  horizon (every week from `startDate` to `targetDate`, capped at 12
  months) — not just the current phase.
- WHEN a Strava activity matches a `PlannedSession` in time/content, THE
  SYSTEM SHALL be able to link them (manually or suggested) and set
  `completed = true`.
- IF a milestone's target date has been reached and the last time-trial
  result is under the target value, THEN THE SYSTEM SHALL set
  `achievedDate`.
- WHEN a full replan happens (Spec 5, ADR-0008), THE SYSTEM SHALL
  recompute and replace `TrainingWeek`/`PlannedSession` rows only where
  `completed = false` — rows already marked `completed` are never
  modified or deleted.
