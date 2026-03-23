/**
 * DateTickSource — month and day resolution tick marks.
 *
 * Handles visible spans below 2 years, automatically selecting one of
 * four regimes as the user zooms in:
 *
 *   Quarters  (1–2 yr)  — Jan/Apr/Jul/Oct major, all months minor
 *   Months    (¼–1 yr)  — every month major, weekly minor
 *   Weeks     (7d–90d)  — every ~7 days major, every day minor
 *   Days      (< 7d)    — every day major, no minor
 *
 * Adapts ChronoZoom's DateTickSource (Quarters_Month / Month_Weeks /
 * Weeks_Days / Days_Quarters regimes).
 */

import {
  ITickSource,
  Tick,
  DAYS_IN_MONTH,
  isLeapYear,
  decimalYearToDate,
  dateToDecimalYear,
} from './tick-source';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MONTH_ABBR = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const DAYS_PER_YEAR = 365.25;

/** Span thresholds in decimal years for each regime. */
const THRESHOLD_QUARTERS = 1;          // > 1 yr → quarter mode
const THRESHOLD_MONTHS   = 0.25;       // > ¼ yr → month mode
const THRESHOLD_WEEKS    = 7 / DAYS_PER_YEAR; // > 7 days → week mode
// below THRESHOLD_WEEKS → day mode

// ─────────────────────────────────────────────────────────────────────────────
// Label helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Formats a year number, handling BCE (astronomical year ≤ 0). */
function yearStr(year: number): string {
  if (year < 0) return `${-year} BCE`;
  if (year === 0) return '1 BCE';
  return `${year}`;
}

/** "Jan 2025" or "Jan 501 BCE". January always includes the year. */
function monthLabel(year: number, month: number): string {
  return `${MONTH_ABBR[month]} ${yearStr(year)}`;
}

/** "Mar" — abbreviated month only (non-January in month mode). */
function shortMonthLabel(month: number): string {
  return MONTH_ABBR[month];
}

/** "15 Mar" — day + month without year (week ticks). */
function dayMonthLabel(day: number, month: number): string {
  return `${day} ${MONTH_ABBR[month]}`;
}

/** "15 Mar 2025" — full date label (day ticks). */
function fullDateLabel(year: number, month: number, day: number): string {
  return `${day} ${MONTH_ABBR[month]} ${yearStr(year)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Month iterator
// ─────────────────────────────────────────────────────────────────────────────

interface MonthPoint {
  year: number;
  month: number;
  decYear: number;
}

/**
 * Iterates calendar month starts in [leftYear − buffer, rightYear + buffer].
 * Adapts CZ DateTickSource's month-iteration loop.
 */
function* iterateMonths(leftYear: number, rightYear: number): Generator<MonthPoint> {
  const buffer = 2 / 12; // two-month buffer on each side
  const startDate = decimalYearToDate(leftYear - buffer);
  let year = startDate.year;
  let month = startDate.month;

  const endLimit = rightYear + buffer;

  while (true) {
    const decYear = dateToDecimalYear(year, month, 1);
    if (decYear > endLimit) break;
    yield { year, month, decYear };
    month++;
    if (month > 12) { month = 1; year++; }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Day iterator
// ─────────────────────────────────────────────────────────────────────────────

interface DayPoint {
  year: number;
  month: number;
  day: number;
  decYear: number;
}

/**
 * Iterates calendar days in [leftYear − buffer, rightYear + buffer].
 * Adapts CZ DateTickSource's day-iteration loop.
 */
function* iterateDays(leftYear: number, rightYear: number): Generator<DayPoint> {
  const bufferDays = 2;
  const buffer = bufferDays / DAYS_PER_YEAR;

  const startDate = decimalYearToDate(leftYear - buffer);
  let { year, month, day } = startDate;

  const endLimit = rightYear + buffer;

  while (true) {
    const decYear = dateToDecimalYear(year, month, day);
    if (decYear > endLimit) break;
    yield { year, month, day, decYear };

    // Advance by one calendar day
    const daysInMonth = month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month];
    day++;
    if (day > daysInMonth) {
      day = 1;
      month++;
      if (month > 12) { month = 1; year++; }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Regime builders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Quarter regime (1–2 yr visible).
 * Major ticks at Jan/Apr/Jul/Oct; minor ticks at all other months.
 * Adapts CZ DateTickSource "Quarters_Month".
 */
function quarterTicks(leftYear: number, rightYear: number): Tick[] {
  const ticks: Tick[] = [];

  for (const { year, month, decYear } of iterateMonths(leftYear, rightYear)) {
    const isQuarter = month === 1 || month === 4 || month === 7 || month === 10;
    ticks.push({
      year: decYear,
      isMajor: isQuarter,
      label: isQuarter ? monthLabel(year, month) : undefined,
    });
  }

  return ticks;
}

/**
 * Month regime (¼–1 yr visible).
 * Major ticks at every month start; minor ticks at days 8, 15, 22 (≈ weekly).
 * January ticks carry a full "Jan 2025" label; others show only "Feb".
 * Adapts CZ DateTickSource "Month_Weeks".
 */
function monthTicks(leftYear: number, rightYear: number): Tick[] {
  const ticks: Tick[] = [];

  for (const { year, month, decYear } of iterateMonths(leftYear, rightYear)) {
    // Major tick: month start
    ticks.push({
      year: decYear,
      isMajor: true,
      label: month === 1 ? monthLabel(year, month) : shortMonthLabel(month),
    });

    // Minor ticks: days 8, 15, 22 within this month (approx. weekly)
    for (const weekDay of [8, 15, 22]) {
      const daysInMonth = month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month];
      if (weekDay <= daysInMonth) {
        ticks.push({
          year: dateToDecimalYear(year, month, weekDay),
          isMajor: false,
        });
      }
    }
  }

  return ticks;
}

/**
 * Week regime (7 days – 90 days visible).
 * Major ticks on specific week-representative days (3, 10, 17, 24 of each month);
 * minor ticks at all other days.
 * Adapts CZ DateTickSource "Weeks_Days".
 */
function weekTicks(leftYear: number, rightYear: number): Tick[] {
  const ticks: Tick[] = [];

  // CZ uses days 3, 10, 17, 24, 28 as "week representative" days within a month.
  const weekDays = new Set([3, 10, 17, 24, 28]);

  for (const { month, day, decYear } of iterateDays(leftYear, rightYear)) {
    const isWeek = weekDays.has(day);
    ticks.push({
      year: decYear,
      isMajor: isWeek,
      label: isWeek ? dayMonthLabel(day, month) : undefined,
    });
  }

  return ticks;
}

/**
 * Day regime (< 7 days visible).
 * Every calendar day gets a major tick with a full date label.
 * Adapts CZ DateTickSource "Days_Quarters".
 */
function dayTicks(leftYear: number, rightYear: number): Tick[] {
  const ticks: Tick[] = [];

  for (const { year, month, day, decYear } of iterateDays(leftYear, rightYear)) {
    ticks.push({
      year: decYear,
      isMajor: true,
      label: fullDateLabel(year, month, day),
    });
  }

  return ticks;
}

// ─────────────────────────────────────────────────────────────────────────────
// DateTickSource
// ─────────────────────────────────────────────────────────────────────────────

export class DateTickSource implements ITickSource {
  readonly name = 'date';

  /** Handles any visible span below 2 years. */
  handles(leftYear: number, rightYear: number): boolean {
    return (rightYear - leftYear) < 2;
  }

  computeTicks(leftYear: number, rightYear: number): Tick[] {
    const span = rightYear - leftYear;

    if (span > THRESHOLD_QUARTERS) return quarterTicks(leftYear, rightYear);
    if (span > THRESHOLD_MONTHS)   return monthTicks(leftYear, rightYear);
    if (span > THRESHOLD_WEEKS)    return weekTicks(leftYear, rightYear);
    return dayTicks(leftYear, rightYear);
  }
}
