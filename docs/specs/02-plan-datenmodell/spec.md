# Spec 2: Plan-Datenmodell

**Ziel:** Der Trainingsplan ist strukturiert in der DB, nicht nur Text.

**Datenmodell:**
```
Plan: id, goalDescription ("5km unter 20min"), startDate, targetDate,
      currentPhase (enum: basis | tempo | intervall | renn)

Milestone: id, planId, targetTimeSeconds, label ("unter 25min"),
           targetDate (nullable), achievedDate (nullable)

TrainingWeek: id, planId, weekNumber, startDate, endDate, phase, notes

PlannedSession: id, trainingWeekId, dayOfWeek, type (enum: locker | tempo |
                intervall | kraft | rest | testlauf), targetDurationMin
                (nullable), targetDistanceKm (nullable), targetPace
                (nullable), description, completed (bool),
                linkedActivityId (nullable, FK zu Activity)
```

**Acceptance Criteria:**
- WHEN ein Plan erstellt wird, THE SYSTEM SHALL mindestens einen `Milestone`
  und die `TrainingWeek`-Einträge für die aktuelle Phase anlegen.
- WHEN eine Strava-Aktivität einer `PlannedSession` zeitlich/inhaltlich
  entspricht, THE SYSTEM SHALL sie verknüpfen können (manuell oder
  vorgeschlagen) und `completed = true` setzen.
- IF ein Milestone-Zieldatum erreicht ist und die letzte Testlauf-Zeit unter
  dem Zielwert liegt, THEN THE SYSTEM SHALL `achievedDate` setzen.
