# Spec 2: Plan Data Model

**Goal:** The training plan is structured in the DB, not just text.

**Data model:**
```
Plan: id, goalDescription ("5km under 20min"), startDate, targetDate,
      currentPhase (enum: base | tempo | interval | race)

Milestone: id, planId, targetTimeSeconds, label ("under 25min"),
           targetDate (nullable), achievedDate (nullable)

TrainingWeek: id, planId, weekNumber, startDate, endDate, phase, notes

PlannedSession: id, trainingWeekId, dayOfWeek, type (enum: easy | tempo |
                interval | strength | rest | timeTrial), targetDurationMin
                (nullable), targetDistanceKm (nullable), targetPace
                (nullable), description, completed (bool),
                linkedActivityId (nullable, FK to Activity)
```

**Acceptance Criteria:**
- WHEN a plan is created, THE SYSTEM SHALL create at least one
  `Milestone` and the `TrainingWeek` entries for the current phase.
- WHEN a Strava activity matches a `PlannedSession` in time/content, THE
  SYSTEM SHALL be able to link them (manually or suggested) and set
  `completed = true`.
- IF a milestone's target date has been reached and the last time-trial
  result is under the target value, THEN THE SYSTEM SHALL set
  `achievedDate`.
