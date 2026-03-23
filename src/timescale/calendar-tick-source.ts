/**
 * CalendarTickSource — year-resolution tick marks.
 *
 * Handles visible spans of 2 years or more (unless a higher-priority
 * source such as CosmosTickSource has already matched).
 *
 * Tick intervals are chosen from a lookup table so that label density
 * stays readable at any zoom level between 2 and ~2 500 years.
 * Adapts ChronoZoom's CalendarTickSource / CalendarTickSource.getRegime().
 */

import { ITickSource, Tick } from './tick-source';

// ─────────────────────────────────────────────────────────────────────────────
// Interval selection
// ─────────────────────────────────────────────────────────────────────────────

interface YearInterval {
  /** Major tick step in integer years. */
  major: number;
  /** Minor tick step in integer years. Must divide `major` evenly. */
  minor: number;
}

/**
 * Returns appropriate major/minor year intervals for the given visible span.
 * Mirrors ChronoZoom's CalendarTickSource regime + delta/beta logic,
 * simplified to a lookup table for clarity.
 */
function pickInterval(span: number): YearInterval {
  if (span >= 4000) return { major: 2000, minor: 500  };
  if (span >= 2000) return { major: 1000, minor: 200  };
  if (span >= 1500) return { major: 500,  minor: 100  };
  if (span >= 600)  return { major: 250,  minor: 50   };
  if (span >= 200)  return { major: 100,  minor: 25   };
  if (span >= 80)   return { major: 50,   minor: 10   };
  if (span >= 30)   return { major: 25,   minor: 5    };
  if (span >= 12)   return { major: 10,   minor: 2    };
  if (span >= 5)    return { major: 5,    minor: 1    };
  return                   { major: 2,    minor: 1    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Label formatting
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats an astronomical year as a historical BCE/CE string.
 *
 * Follows ChronoZoom's convention:
 *   year < 0  → "${-year} BCE"  (e.g. -499 → "499 BCE")
 *   year = 0  → "1 BCE"         (astronomical year 0 = 1 BCE)
 *   year > 0  → "${year} CE"   (e.g. 2000 → "2000 CE")
 */
function formatYear(year: number): string {
  if (year < 0) return `${-year} BCE`;
  if (year === 0) return '1 BCE';
  return `${year} CE`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CalendarTickSource
// ─────────────────────────────────────────────────────────────────────────────

export class CalendarTickSource implements ITickSource {
  readonly name = 'calendar';

  /**
   * Handles any visible span ≥ 2 years that was not claimed by a
   * higher-priority source (e.g. CosmosTickSource).
   */
  handles(leftYear: number, rightYear: number): boolean {
    return (rightYear - leftYear) >= 2;
  }

  computeTicks(leftYear: number, rightYear: number): Tick[] {
    const span = rightYear - leftYear;
    const { major, minor } = pickInterval(span);
    const ratio = major / minor; // minor ticks per major interval

    const ticks: Tick[] = [];

    // Work in integer minor-step units to avoid floating-point drift.
    // Add one extra step of padding on each side so edge labels are visible.
    const iStart = Math.floor(leftYear / minor) - 1;
    const iEnd   = Math.ceil(rightYear  / minor) + 1;

    for (let i = iStart; i <= iEnd; i++) {
      const year = i * minor;
      const isMajor = i % ratio === 0;
      ticks.push({
        year,
        isMajor,
        label: isMajor ? formatYear(year) : undefined,
      });
    }

    return ticks;
  }
}
