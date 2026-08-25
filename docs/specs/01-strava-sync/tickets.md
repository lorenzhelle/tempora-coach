# Strava-Sync — Tickets

Setzt auf [00-fundament](../00-fundament/tickets.md) und
[02-plan-datenmodell](../02-plan-datenmodell/tickets.md) auf. Siehe
[spec.md](spec.md) für Ziel und Acceptance Criteria.

### B1 — Strava-OAuth-App + Connect-Flow
- Strava-API-App registrieren (Client-ID/Secret in `.env`)
- OAuth-Redirect-Flow bauen: Nutzer verbindet sein Strava-Konto, Callback
  speichert Access-/Refresh-Token in `StravaConnection`
- **Akzeptanz:** Nach dem Connect-Flow steht ein gültiges Access-Token in der
  DB, `StravaConnection` ist befüllt (Spec 1, AC 1)

### B2 — Webhook-Endpoint: Strava → DB
- Webhook-Subscription bei Strava anlegen, Endpoint validiert den
  Verifizierungs-Handshake
- Bei eintreffendem Event: Aktivität von der Strava-API abrufen und als
  `Activity` speichern
- Dedupe über `stravaActivityId` (Spec 1, AC 3)
- **Akzeptanz:** Neue Aktivität in Strava erzeugt (echt oder simuliertes
  Webhook-Event) führt zu genau einem `Activity`-Eintrag, kein Duplikat bei
  wiederholtem Event

### B3 — Token-Refresh + Fehlerbehandlung
- Automatischer Refresh des Access-Tokens vor Ablauf (Spec 1, AC 4)
- Fehlerfall (Refresh-Token ungültig, Netzwerkfehler) sauber loggen,
  Verbindung als getrennt markieren, andere Syncs nicht blockieren
  (Spec 1, AC 5)
- **Akzeptanz:** Simulierter abgelaufener Access-Token wird automatisch
  erneuert, ohne dass ein Sync fehlschlägt; simulierter ungültiger
  Refresh-Token blockiert keine anderen Syncs

### B4 — Periodischer Fallback-Abgleich
- Täglicher Cronjob, der pro `StravaConnection` die letzten Aktivitäten
  abgleicht, falls ein Webhook-Event verloren ging
- **Akzeptanz:** Manuell ein Webhook-Event "verlieren" (nicht auslösen) →
  Fallback-Job holt die fehlende Aktivität trotzdem nach
