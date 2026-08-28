# Design System

Binding visual language for the Tempora UI. Origin: the "Performance Dark"
direction was created as one of three Claude Design drafts and confirmed
by the user as the final direction (dashboard + onboarding chat). Visual
reference (private, Claude Design canvas):
https://claude.ai/code/artifact/a7691a56-03c8-4a38-aa75-86a5aa36c93a

This document records the tokens and components derived from it, so later
UI work stays consistent even without looking at the canvas again. In case
of conflict between the canvas and this document, this document governs
once it has been updated — the canvas is the draft state, this document is
the binding as-built reference for the implementation.

## Tone

Athletic, data-forward, calm — no marketing overload. Short, direct copy.
No emoji in the UI. Dark interface as the default (no light mode specified
for v1).

## Color tokens

All colors defined as `oklch()` (same chroma/lightness share across related
accents, only hue varies).

| Token | Value | Usage |
| --- | --- | --- |
| `--bg` | `oklch(0.17 0.012 260)` | Page background |
| `--surface` | `oklch(0.22 0.012 260)` | Card/panel background |
| `--surface-2` | `oklch(0.26 0.014 260)` | Elevated surface within a card (e.g. chat input) |
| `--border` | `oklch(0.3 0.012 260)` | Card/divider border |
| `--text` | `oklch(0.95 0.006 260)` | Primary text |
| `--text-muted` | `oklch(0.62 0.012 260)` | Secondary text, labels, timestamps |
| `--accent` | `oklch(0.85 0.19 155)` | Primary accent (lime green) — CTAs, active states, positive values |
| `--accent-ink` | `oklch(0.2 0.05 155)` | Text/icons on `--accent` surfaces |
| `--accent-soft` | `oklch(0.27 0.05 155)` | Muted accent surface (chips, user chat bubble, selected day tile) |
| `--rest` | `oklch(0.4 0.012 260)` | Neutral dots/icons (e.g. rest day) |
| `--warn` | `oklch(0.72 0.17 55)` | Reserved for warnings (e.g. spike-rule notice, Spec 5) — not yet used in screens |

Only one accent hue (155°, green) for positive/active states. A second hue
(`--warn`, 55° orange) is reserved for warning notices once Spec 5
(training-principles check) gets UI — not yet fleshed out further.

## Typography

All three fonts via Google Fonts, with a system fallback:

| Role | Font | Fallback | Weights |
| --- | --- | --- | --- |
| Headlines, buttons, UI labels | Sora | `system-ui, sans-serif` | 500, 600, 700 |
| Body copy, chat messages | Manrope | `system-ui, sans-serif` | 400, 500, 600 |
| Numbers/data (pace, times, dates, weeks) | JetBrains Mono | `monospace` | 500, 600 |

Rule: every numeric measurement (pace, personal best, date, week counter)
runs in the mono typeface, even inline within body copy — that's the
visual signal for "measurement" in this system.

## Spacing, radii, borders

- Card radius: `16px` (chat cards, panels); `20px` for the more generous
  hero surfaces not used in Performance Dark (that was direction A).
- Smaller elements (chips, day tiles, buttons): `6px`–`10px` radius.
- Borders throughout: `1px solid var(--border)`, no shadows (a flat,
  data-forward look instead of depth effects).
- Card inner padding: `26px–32px` at desktop width (1440px layouts).
- Grid spacing (`gap`) between peer elements: `12px–20px`.


## Screens already using this system

- Dashboard (`docs/specs/04-dashboard/spec.md`) — the primary view with
  week overview, next session, milestone, history.
- Onboarding chat (`docs/specs/03-onboarding/spec.md`, "Design" section)
  — one continuous chat screen (guided dialog, plan proposal with the
  plan card inline), no separate start screen.

Both as artboards on the same design canvas (link above), onboarding on
its own canvas page.

## Implementation

Tokens above are exposed as Tailwind v4 theme variables via `@theme` in
`app/globals.css` (e.g. `--color-accent`, `--radius-card`) — build UI with
the resulting utilities (`bg-accent`, `rounded-card`, ...) rather than raw
oklch values.
