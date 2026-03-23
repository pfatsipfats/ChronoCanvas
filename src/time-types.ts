/**
 * Time Canvas data model — hierarchical timelines with infodots.
 *
 * Dates are expressed as:
 *   "YYYY-MM-DD" — CE date (year, month, day; three parts required)
 *   "-Y"         — BCE year only (Y is a positive integer, e.g. "-500")
 *   "present"    — resolves to the current date (only valid in `end` fields)
 */

/**
 * A time-bounded region that can contain nested timelines and infodots.
 */
export interface TimeCanvasTimeline {
  /** Optional stable identifier */
  id?: string;

  /** Display label rendered inside the timeline rectangle */
  title: string;

  /** Start date: "YYYY-MM-DD" (CE) or "-Y" (BCE year only) */
  start: string;

  /** End date: "YYYY-MM-DD", "-Y", or "present" */
  end: string;

  /**
   * Optional height as a percentage (0–100) of the parent timeline's height.
   * When omitted the layout engine computes height from children.
   */
  height?: number;

  /** Nested child timelines (must fall within this timeline's time span) */
  timelines?: TimeCanvasTimeline[];

  /** Infodots pinned to points in time inside this timeline */
  infodots?: TimeCanvasInfodot[];
}

/**
 * A point-in-time marker with optional image and text content.
 * Rendered as a circle; expands to a card when zoomed in.
 */
export interface TimeCanvasInfodot {
  /** Optional stable identifier */
  id?: string;

  /** Short label shown near the dot and in the expanded card header */
  title: string;

  /** Point in time: "YYYY-MM-DD" (CE) or "-Y" (BCE year only) */
  time: string;

  /** Optional image displayed in the expanded card */
  image?: { url: string };

  /** Optional descriptive text shown below the image in the expanded card */
  text?: string;
}
