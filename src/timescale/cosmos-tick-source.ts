/**
 * CosmosTickSource — geological timescale tick marks (Ga / Ma / ka).
 *
 * This implementation is a STUB. It correctly self-selects when the visible
 * range extends into deep geological time (left edge < −10 000 years), and
 * the interface contract is fully implemented so TimeScaleRuler requires no
 * changes when this source is later filled in.
 *
 * Intended future behaviour (mirrors ChronoZoom's CosmosTickSource):
 *   leftYear < −10 000 000 000  → Ga  (billions of years, e.g. "4.6 Ga")
 *   leftYear < −10 000 000      → Ma  (millions of years, e.g. "66 Ma")
 *   leftYear < −10 000          → ka  (thousands of years, e.g. "12 ka")
 *
 * To implement: fill in `computeTicks()` following CZ CosmosTickSource's
 * regime / delta / beta logic.  No other file needs to change — just add
 * this source first in the ITickSource[] array passed to TimeScaleRuler.
 */

import { ITickSource, Tick } from './tick-source';

export class CosmosTickSource implements ITickSource {
  readonly name = 'cosmos';

  /**
   * Activates when the left edge of the visible range is in deep
   * geological time (before 10 000 BCE), mirroring ChronoZoom's
   * `if (_range.min <= -10000)` condition in `setMode()`.
   */
  handles(leftYear: number, _rightYear: number): boolean {
    return leftYear < -10_000;
  }

  /**
   * @todo Implement geological tick generation.
   *
   * Suggested implementation (from ChronoZoom's CosmosTickSource):
   *   1. Determine regime (Ga / Ma / ka) from leftYear magnitude.
   *   2. Set level (1e9 / 1e6 / 1e3) and delta/beta for the regime.
   *   3. Iterate multiples of (delta × 10^beta) within [leftYear, rightYear].
   *   4. Format labels as "4.6 Ga", "66 Ma", "12 ka", etc.
   */
  computeTicks(_leftYear: number, _rightYear: number): Tick[] {
    // Stub: returns no ticks until implemented.
    return [];
  }
}
