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

/** The 7 DayOfWeek labels in cyclic order starting at `startDay`. */
export function orderedFrom(startDay: DayOfWeek): DayOfWeek[] {
  const startIndex = ALL_DAYS_OF_WEEK.indexOf(startDay);
  return Array.from({ length: 7 }, (_, i) => {
    const day = ALL_DAYS_OF_WEEK[(startIndex + i) % 7];
    if (!day) throw new Error("unreachable: modulo 7 index out of range");
    return day;
  });
}

/** Shortest distance (in days) between two weekdays around the 7-day cycle. */
export function cyclicDistance(a: DayOfWeek, b: DayOfWeek): number {
  const diff = Math.abs(
    ALL_DAYS_OF_WEEK.indexOf(a) - ALL_DAYS_OF_WEEK.indexOf(b),
  );
  return Math.min(diff, 7 - diff);
}
