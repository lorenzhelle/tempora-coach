# Spec 5: Chat-basierte Plan-Anpassung

**Ziel:** Nutzer kann jederzeit per Chat Rückfragen stellen oder Anpassungen
anfordern ("war zu hart", "muss Woche verschieben", "Knie zwickt").

**Kontext, das Claude pro Anfrage bekommt:**
- Aktueller Plan-Stand (JSON, [Spec 2](../02-plan-datenmodell/spec.md))
- Letzte N Aktivitäten ([Spec 1](../01-strava-sync/spec.md))
- System-Prompt mit Coaching-Logik (Trainingsprinzipien, siehe
  `docs/research/` — insbesondere Schmerz-Ampel-Modell und die RUNSAFE-
  Spike-Regel für Sicherheits-Checks)

**Acceptance Criteria:**
- WHEN der Nutzer im Chat eine Anpassung anfragt, THE SYSTEM SHALL den
  relevanten Teil des Plans identifizieren und gezielt ändern (nicht den
  gesamten Plan neu schreiben).
- WHEN eine Plan-Änderung vorgenommen wurde, THE SYSTEM SHALL sie im
  Dashboard sofort sichtbar machen.
- IF die Anfrage nur eine Frage ist (keine Änderung gewünscht), THEN THE
  SYSTEM SHALL antworten, ohne den Plan zu verändern.
- WHEN eine Anpassung angefragt wird, die den Trainingsprinzipien widerspricht
  (z.B. ein Einzellauf, der stark über den längsten Lauf der letzten 30 Tage
  springt — siehe RUNSAFE-Befund in `docs/research/`), THEN THE SYSTEM SHALL
  darauf hinweisen, bevor es die Änderung übernimmt.
