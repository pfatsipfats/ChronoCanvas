/**
 * Core types and interface for the timescale ruler tick-source system.
 *
 * Implements Interface Segregation and Dependency Inversion principles:
 * TimeScaleRuler depends only on ITickSource; concrete implementations
 * (CalendarTickSource, DateTickSource, CosmosTickSource) are injected.
 */

/** A single rendered tick mark on the ruler. */
export interface Tick {
  /**
   * Position in decimal astronomical years.
   * Year 1 = 1 CE, year 0 = 1 BCE, year -499 = 500 BCE.
   */
  year: number;
  /** True for major (tall, labelled) ticks; false for minor (short) ticks. */
  isMajor: boolean;
  /**
   * Human-readable label rendered below the tick.
   * Present only on major ticks; absent when the label would be redundant
   * (e.g. non-January months in calendar mode).
   */
  label?: string;
}

/** Visual configuration for TimeScaleRuler. All fields are optional. */
export interface RulerOptions {
  /** Canvas background fill. Default: '#222' */
  background?: string;
  /** Colour of tick marks and the top baseline. Default: '#4a90e2' */
  tickColor?: string;
  /** Height in pixels of major tick marks. Default: 12 */
  majorTickHeight?: number;
  /** Height in pixels of minor tick marks. Default: 7 */
  minorTickHeight?: number;
  /** CSS font string for tick labels. Default: 11 px system sans-serif */
  labelFont?: string;
  /** Colour of tick labels. Default: '#aaa' */
  labelColor?: string;
}

/**
 * Strategy interface for computing time axis tick marks.
 *
 * Each implementation covers one temporal resolution regime
 * (geological, calendar-year, month/day) and self-selects via `handles()`.
 *
 * Implementations are injected into TimeScaleRuler as an ordered array;
 * the first whose `handles()` returns true is used for the current viewport.
 * This is the Open/Closed principle: new regimes are added by implementing
 * this interface and prepending/appending to the array — no existing code
 * changes.
 */
export interface ITickSource {
  /** Stable identifier, e.g. 'cosmos', 'calendar', 'date'. */
  readonly name: string;

  /**
   * Returns true when this source is appropriate for the given visible
   * year range. Called in array order; first match wins.
   *
   * @param leftYear  - Left edge of the visible range (decimal astronomical year)
   * @param rightYear - Right edge of the visible range (decimal astronomical year)
   */
  handles(leftYear: number, rightYear: number): boolean;

  /**
   * Computes all tick marks (major + minor) for the visible range.
   *
   * Implementations should extend slightly beyond [leftYear, rightYear]
   * so labels at viewport edges are not clipped mid-character.
   *
   * @param leftYear  - Left edge of the visible range
   * @param rightYear - Right edge of the visible range
   */
  computeTicks(leftYear: number, rightYear: number): Tick[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared date-math helpers
// Adapts ChronoZoom's Dates.getYMDFromCoordinate / getCoordinateFromYMD
// ─────────────────────────────────────────────────────────────────────────────

/** Days per month (non-leap year), 1-indexed — index 0 is unused. */
export const DAYS_IN_MONTH = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Returns true if the proleptic Gregorian year is a leap year. */
export function isLeapYear(year: number): boolean {
  const y = Math.trunc(year);
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/**
 * Converts a decimal astronomical year to { year, month (1–12), day (1–31) }.
 *
 * Works correctly for BCE (negative) years.
 * Adapts ChronoZoom's `Dates.getYMDFromCoordinate`.
 */
export function decimalYearToDate(decYear: number): { year: number; month: number; day: number } {
  const year = Math.floor(decYear);
  const frac = decYear - year; // 0 .. <1

  const daysInYear = isLeapYear(year) ? 366 : 365;
  let remaining = Math.floor(frac * daysInYear); // 0-based day-of-year

  let month = 1;
  while (month <= 12) {
    const dim = month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month];
    if (remaining < dim) break;
    remaining -= dim;
    month++;
  }

  return { year, month, day: remaining + 1 };
}

/**
 * Converts { year, month (1–12), day (1–31) } to a decimal astronomical year.
 *
 * Inverse of `decimalYearToDate`.
 * Adapts ChronoZoom's `Dates.getCoordinateFromYMD`.
 */
export function dateToDecimalYear(year: number, month: number, day: number): number {
  const daysInYear = isLeapYear(year) ? 366 : 365;
  let dayOfYear = day - 1; // 0-based
  for (let m = 1; m < month; m++) {
    dayOfYear += m === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[m];
  }
  return year + dayOfYear / daysInYear;
}
