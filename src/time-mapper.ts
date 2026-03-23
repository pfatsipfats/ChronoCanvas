/**
 * TimeMapper — converts date strings to virtual X coordinates.
 *
 * Date format supported:
 *   "YYYY-MM-DD" — CE date (three parts required)
 *   "-Y"         — BCE year only (Y is a positive integer, e.g. "-500" for 500 BCE)
 *   "present"    — resolves to current date at parse time (typically for `end` only)
 *
 * The root timeline's time span is mapped linearly onto the virtual X range
 * [-HALF_WIDTH, +HALF_WIDTH] (total 10 000 virtual units).
 */

import { TimeCanvasTimeline } from './time-types';

/** Total virtual width of the root timeline */
export const CANVAS_WIDTH = 10000;
/** Total virtual height of the root timeline */
export const CANVAS_HEIGHT = 2000;

const HALF_WIDTH = CANVAS_WIDTH / 2;

function decimalYear(year: number, month: number, day: number): number {
  return year + (month - 1) / 12 + (day - 1) / 365;
}

/**
 * Parses a date string into a decimal year.
 *
 * Examples:
 *   "1969-07-20" → 1969.549
 *   "-323"       → -323.0 (1 Jan of 323 BCE)
 *   "0001-01-01" → 1.0
 *   "present"    → <current year as decimal>
 */
export function parseDate(s: string): number {
  if (s === 'present') {
    const now = new Date();
    return now.getFullYear() + now.getMonth() / 12 + (now.getDate() - 1) / 365;
  }

  if (s.startsWith('-')) {
    const body = s.slice(1);
    if (body.includes('-')) {
      throw new Error(
        `parseDate: BCE dates must be year only (e.g. "-500"), got "${s}"`
      );
    }
    if (!/^\d+$/.test(body)) {
      throw new Error(`parseDate: invalid BCE year in "${s}"`);
    }
    const absYear = parseInt(body, 10);
    return decimalYear(-absYear, 1, 1);
  }

  const parts = s.split('-');
  if (parts.length !== 3) {
    throw new Error(
      `parseDate: CE dates must be YYYY-MM-DD (three parts), got "${s}"`
    );
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    throw new Error(`parseDate: non-numeric date parts in "${s}"`);
  }
  if (month < 1 || month > 12) {
    throw new Error(`parseDate: month must be 1–12 in "${s}"`);
  }
  if (day < 1 || day > 31) {
    throw new Error(`parseDate: day must be 1–31 in "${s}"`);
  }

  return decimalYear(year, month, day);
}

/**
 * Maps the time span of a root timeline onto the virtual canvas X axis.
 *
 * Virtual X = -5000 at rootStart, +5000 at rootEnd (linear interpolation).
 */
export class TimeMapper {
  private readonly rootStartYear: number;
  private readonly rootEndYear: number;

  constructor(root: TimeCanvasTimeline) {
    this.rootStartYear = parseDate(root.start);
    this.rootEndYear = parseDate(root.end);

    if (this.rootEndYear <= this.rootStartYear) {
      throw new Error(
        `TimeMapper: root end ("${root.end}" = ${this.rootEndYear}) must be after start ("${root.start}" = ${this.rootStartYear})`
      );
    }
  }

  /** Converts a date string to a virtual X coordinate */
  toVirtualX(dateString: string): number {
    const year = parseDate(dateString);
    const t = (year - this.rootStartYear) / (this.rootEndYear - this.rootStartYear);
    return t * CANVAS_WIDTH - HALF_WIDTH;
  }

  /** Decimal year of the root start */
  get startYear(): number {
    return this.rootStartYear;
  }

  /** Decimal year of the root end */
  get endYear(): number {
    return this.rootEndYear;
  }
}
