# Design System

Verbindliche visuelle Sprache für Tempora-UI. Herkunft: Die Richtung
"Performance Dark" wurde als eine von drei Claude-Design-Entwürfen erstellt
und vom Nutzer als finale Richtung bestätigt (Dashboard + Onboarding-Chat).
Visuelle Referenz (privat, Claude-Design-Canvas):
https://claude.ai/code/artifact/a7691a56-03c8-4a38-aa75-86a5aa36c93a

Dieses Dokument hält die daraus abgeleiteten Tokens und Komponenten fest,
damit spätere UI-Arbeit (auch ohne erneuten Blick auf die Canvas) konsistent
bleibt. Bei Widersprüchen zwischen der Canvas und diesem Dokument gilt dieses
Dokument, sobald es aktualisiert wurde — die Canvas ist der Entwurfsstand,
dieses Dokument der bindende Ist-Stand für die Implementierung.

## Ton

Athletisch, datennah, ruhig — kein Marketing-Overload. Kurze, direkte Copy.
Keine Emojis in der UI. Dunkles Interface als Standard (kein Light-Mode für
v1 spezifiziert).

## Farb-Tokens

Alle Farben als `oklch()` definiert (gleicher Chroma/Lightness-Anteil über
verwandte Akzente hinweg, nur Hue variiert).

| Token | Wert | Verwendung |
| --- | --- | --- |
| `--bg` | `oklch(0.17 0.012 260)` | Seitenhintergrund |
| `--surface` | `oklch(0.22 0.012 260)` | Card-/Panel-Hintergrund |
| `--surface-2` | `oklch(0.26 0.014 260)` | Erhöhte Fläche innerhalb einer Card (z.B. Chat-Input) |
| `--border` | `oklch(0.3 0.012 260)` | Card-/Trennlinien-Rahmen |
| `--text` | `oklch(0.95 0.006 260)` | Primärtext |
| `--text-muted` | `oklch(0.62 0.012 260)` | Sekundärtext, Labels, Zeitstempel |
| `--accent` | `oklch(0.85 0.19 155)` | Primärakzent (Lime-Grün) — CTAs, aktive Zustände, positive Werte |
| `--accent-ink` | `oklch(0.2 0.05 155)` | Text/Icons auf `--accent`-Flächen |
| `--accent-soft` | `oklch(0.27 0.05 155)` | Gedämpfte Akzentfläche (Chips, User-Chat-Bubble, ausgewählte Tageskachel) |
| `--rest` | `oklch(0.4 0.012 260)` | Neutrale Punkte/Icons (z.B. Ruhetag) |
| `--warn` | `oklch(0.72 0.17 55)` | Reserviert für Warnungen (z.B. Spike-Regel-Hinweis, Spec 5) — noch nicht in Screens verwendet |

Nur ein Akzent-Hue (155°, Grün) für positive/aktive Zustände. Ein zweiter
Hue (`--warn`, 55° Orange) ist für Warnhinweise reserviert, sobald Spec 5
(Trainingsprinzipien-Check) UI bekommt — noch nicht weiter ausgestaltet.

## Typografie

Alle drei Fonts über Google Fonts, mit System-Fallback:

| Rolle | Font | Fallback | Gewichte |
| --- | --- | --- | --- |
| Headlines, Buttons, UI-Labels | Sora | `system-ui, sans-serif` | 500, 600, 700 |
| Fließtext, Chat-Nachrichten | Manrope | `system-ui, sans-serif` | 400, 500, 600 |
| Zahlen/Daten (Pace, Zeiten, Daten, Wochen) | JetBrains Mono | `monospace` | 500, 600 |

Regel: Jeder numerische Messwert (Pace, Bestzeit, Datum, Wochenzähler) läuft
über die Mono-Schrift, auch inline im Fließtext — das ist das visuelle
Signal "Messwert" in diesem System.

## Abstände, Radien, Rahmen

- Card-Radius: `16px` (Chat-Karten, Panels), `20px` bei großzügigeren
  Hero-Flächen nicht verwendet in Performance Dark (das war Richtung A).
- Kleinere Elemente (Chips, Tageskacheln, Buttons): `6px`–`10px` Radius.
- Rahmen durchgehend `1px solid var(--border)`, keine Schatten (flaches,
  datennahes Erscheinungsbild statt Tiefenwirkung).
- Card-Innenabstand: `26px–32px` auf Desktop-Breite (1440px-Layouts).
- Grid-Abstand (`gap`) zwischen gleichrangigen Elementen: `12px–20px`.

## Komponenten-Inventar

- **Top Bar** — Logo/Wordmark links (Icon + "TEMPORA", Sora 700,
  Buchstabenabstand), Navigation/Kontext rechts, `72–76px` Höhe,
  `1px solid var(--border)` unten.
- **Card** — `--surface`-Hintergrund, `1px solid var(--border)`, `16px`
  Radius. Grundbaustein für Hero-, Meilenstein-, Wochen- und Verlaufs-Panels.
- **Button primary** — `--accent`-Hintergrund, `--accent-ink`-Text, Sora 600,
  `10px` Radius, Icon rechts (Pfeil/Check) für Aktionsrichtung.
- **Button secondary** — transparenter Hintergrund, `1px solid var(--border)`,
  `--text`-Farbe — für nicht-destruktive Zweitaktionen (z.B. "Anpassung
  wünschen").
- **Chip/Tag** — Pill oder abgerundetes Rechteck, `--surface`/`--accent-soft`
  Hintergrund, kleine Caps-Labels (11–12px, Sora/Mono, Letter-Spacing) für
  Status ("Heute", Zusammenfassungs-Tags wie "12 Monate").
- **Wochenkachel (Week-Strip Day Cell)** — 7-Spalten-Grid, pro Tag:
  Wochentag-Label (Mono), Status-Icon (Haken = erledigt, Ring = offen, Punkt
  in `--rest` = Ruhetag), Session-Label. Heutiger/aktiver Tag bekommt
  `1px solid var(--accent)` + `--accent-soft`-Füllung statt nur `--border`.
- **Meilenstein-Fortschrittsbalken** — dünner (`6–8px`) abgerundeter Balken,
  `--rest`/`--surface-2` als Bahn, `--accent` als Füllung, Start-/Zielwert
  als Mono-Labels an den Enden.
- **Pace-Trend-Sparkline** — einfache SVG-Polyline in `--accent`, kein
  Achsenschmuck, ein Endpunkt-Dot — bewusst reduziert, kein volles Chart.
- **Chat-Bubble Coach** — `--surface`-Hintergrund, links ausgerichtet,
  asymmetrischer Radius (`4px 16px 16px 16px`, "Sprechblasen-Ecke" oben
  links), kleines Avatar-Icon links daneben.
- **Chat-Bubble User** — `--accent-soft`-Hintergrund, rechts ausgerichtet,
  gespiegelter asymmetrischer Radius (`16px 4px 16px 16px`), kein Avatar.
- **Quick-Reply-Chip** — wie Chip, aber klickbar/interaktiv gedacht:
  Default (`--surface` + `--border`) vs. ausgewählt (`--accent-soft` +
  `1.5px solid var(--accent)`, `--accent`-Text).
- **Plan-Karte** — Card-Variante für den strukturierten Plan-Vorschlag
  (Onboarding, Spec 3 AC 1): Kopfzeile mit Zielwert + Zeitrahmen-Tag,
  Phasenübersicht als proportional breite, farblich abgestufte
  Segment-Leiste (helleres bis volles `--accent`), darunter eine
  Wochenkachel-Reihe für "Woche 1 im Detail". Kein Fließtext-JSON-Dump —
  die Struktur aus Spec 2 wird visuell abgebildet.

## Screens, die dieses System bereits nutzen

- Dashboard (`docs/specs/04-dashboard/spec.md`) — Hauptansicht mit
  Wochenübersicht, nächster Einheit, Meilenstein, Verlauf.
- Onboarding-Chat (`docs/specs/03-onboarding/spec.md`, Abschnitt "Design")
  — Start-Screen, geführter Chat-Dialog, Plan-Vorschlag mit Plan-Karte.

Beide als Artboards in derselben Design-Canvas (Link oben), Onboarding auf
einer eigenen Canvas-Seite.

## Maintenance

Aktualisieren, wenn ein neuer Screen einen neuen Komponententyp oder Token
einführt, oder wenn die Canvas-Referenz durch eine neue Version ersetzt
wird. Neue Farb-Hues nur ergänzen, wenn ein Screen sie tatsächlich braucht
(kein Vorratsanlegen von Tokens ohne Verwendung).
