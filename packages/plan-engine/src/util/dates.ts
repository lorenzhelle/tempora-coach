// Pure date arithmetic on ISO 8601 date strings ('YYYY-MM-DD'). Every date
// the engine touches (today, startDate, targetDate) is an explicit input —
// see the package boundary rules — so this never reads the system clock.
// All arithmetic treats a date as a UTC calendar day, avoiding local
// timezone ambiguity.

import type { DayOfWeek } from "../types";

const MS_PER_DAY = 86_400_000;

function parseISODate(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

function formatISODate(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return formatISODate(parseISODate(date) + days * MS_PER_DAY);
}

export function diffInDays(from: string, to: string): number {
  return Math.round((parseISODate(to) - parseISODate(from)) / MS_PER_DAY);
}

export function diffInWeeks(from: string, to: string): number {
  return diffInDays(from, to) / 7;
}

const DAY_OF_WEEK_BY_JS_INDEX: DayOfWeek[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function dayOfWeekOf(date: string): DayOfWeek {
  const jsIndex = new Date(parseISODate(date)).getUTCDay();
  const dayOfWeek = DAY_OF_WEEK_BY_JS_INDEX[jsIndex];
  if (!dayOfWeek)
    throw new Error(
      `unreachable: getUTCDay() returned out-of-range index ${jsIndex}`,
    );
  return dayOfWeek;
}

export const ALL_DAYS_OF_WEEK: readonly DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

/** Maps each DayOfWeek label to its actual calendar date within the 7-day block starting at `weekStartDate`. */
export function datesForWeek(weekStartDate: string): Record<DayOfWeek, string> {
  const entries = Array.from({ length: 7 }, (_, offset) => {
    const date = addDays(weekStartDate, offset);
    return [dayOfWeekOf(date), date] as const;
  });
  return Object.fromEntries(entries) as Record<DayOfWeek, string>;
}
