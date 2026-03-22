/**
 * TimeMapper — converts date strings to virtual X coordinates.
 *
 * Date format supported:
 *   "YYYY-MM-DD"  — CE date
 *   "-YYYY-MM-DD" — BCE date (year is negative)
 *   "present"     — resolves to current year at construction time
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

/**
 * Parses a date string into a decimal year.
 *
 * Examples:
 *   "1969-07-20"  → 1969.549
 *   "-0323-06-10" → -323.436
 *   "0001-01-01"  → 1.0
 *   "present"     → <current year as decimal>
 */
export function parseDate(s: string): number {
  if (s === 'present') {
    const now = new Date();
    return now.getFullYear() + (now.getMonth()) / 12 + (now.getDate() - 1) / 365;
  }

  const negative = s.startsWith('-');
  // Remove leading '-' then split; result is ["YYYY", "MM", "DD"]
  const parts = (negative ? s.slice(1) : s).split('-');

  const year = parseInt(parts[0], 10) * (negative ? -1 : 1);
  const month = parts.length > 1 ? parseInt(parts[1], 10) : 1;
  const day = parts.length > 2 ? parseInt(parts[2], 10) : 1;

  return year + (month - 1) / 12 + (day - 1) / 365;
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
