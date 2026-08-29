// Render-time formatting for engine output. packages/plan-engine
// deliberately never formats a pace as a string (see ADR-0009 and
// plan-schema.ts's targetPaceSecPerKm comment) — this is that
// formatting, kept in the app layer where it belongs.

export function formatPace(secPerKm: number): string {
  const totalSeconds = Math.round(secPerKm);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
}

export function formatDuration(minutes: number): string {
  const totalSeconds = Math.round(minutes * 60);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return secs === 0
    ? `${mins} min`
    : `${mins}:${secs.toString().padStart(2, "0")} min`;
}

export function formatMinutesSecondsFromSeconds(totalSeconds: number): string {
  const rounded = Math.round(totalSeconds);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
