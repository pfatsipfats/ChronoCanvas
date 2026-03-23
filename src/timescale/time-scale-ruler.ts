/**
 * TimeScaleRuler — canvas-based timescale ruler renderer.
 *
 * Responsibilities (Single Responsibility):
 *   - Poll the visible year range each animation frame.
 *   - Select the appropriate ITickSource (first match in the injected array).
 *   - Render ticks, labels, and a baseline onto a <canvas> element.
 *
 * The ruler has no knowledge of ChronoCanvas internals — it depends only on:
 *   - An `ITickSource[]` array (injected, never imported directly).
 *   - A `getVisibleRange` callback that returns { leftYear, rightYear }.
 *
 * This keeps it open for reuse with any viewport system (Dependency Inversion).
 */

import { ITickSource, RulerOptions } from './tick-source';

// ─────────────────────────────────────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULTS: Required<RulerOptions> = {
  background:      '#222',
  tickColor:       '#4a90e2',
  majorTickHeight: 12,
  minorTickHeight: 7,
  labelFont:       '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  labelColor:      '#aaa',
};

// ─────────────────────────────────────────────────────────────────────────────
// TimeScaleRuler
// ─────────────────────────────────────────────────────────────────────────────

export class TimeScaleRuler {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly getVisibleRange: () => { leftYear: number; rightYear: number };
  private readonly tickSources: readonly ITickSource[];
  private readonly opts: Required<RulerOptions>;

  private rafId: number | null = null;

  /**
   * @param canvas          - The `<canvas>` element to draw into.
   * @param getVisibleRange - Callback returning the currently visible year range.
   *                          This is the only coupling point to the outside world.
   * @param tickSources     - Ordered array of tick sources; the first whose
   *                          `handles()` returns true is used each frame.
   * @param options         - Optional visual overrides.
   */
  constructor(
    canvas: HTMLCanvasElement,
    getVisibleRange: () => { leftYear: number; rightYear: number },
    tickSources: ITickSource[],
    options?: RulerOptions,
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.getVisibleRange = getVisibleRange;
    this.tickSources = tickSources;
    this.opts = { ...DEFAULTS, ...options };
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /** Starts the render loop. Safe to call multiple times; only one loop runs. */
  start(): void {
    if (this.rafId !== null) return;
    const loop = () => {
      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  /** Stops the render loop and cancels the pending animation frame. */
  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  // ── Private ───────────────────────────────────────────────────────────────

  /**
   * Synchronises the canvas pixel dimensions with its CSS layout size.
   * Called every frame so the ruler adapts automatically on window resize.
   * Accounts for devicePixelRatio for sharp rendering on HiDPI screens.
   */
  private syncSize(): void {
    const dpr = window.devicePixelRatio || 1;
    const cssW = this.canvas.clientWidth;
    const cssH = this.canvas.clientHeight;
    const pxW  = Math.round(cssW * dpr);
    const pxH  = Math.round(cssH * dpr);

    if (this.canvas.width !== pxW || this.canvas.height !== pxH) {
      this.canvas.width  = pxW;
      this.canvas.height = pxH;
      this.ctx.scale(dpr, dpr);
    }
  }

  private render(): void {
    this.syncSize();

    const cssW = this.canvas.clientWidth;
    const cssH = this.canvas.clientHeight;

    if (cssW === 0 || cssH === 0) return;

    const { leftYear, rightYear } = this.getVisibleRange();
    const span = rightYear - leftYear;

    if (!isFinite(span) || span <= 0) return;

    // Select the first tick source that handles this range
    const source = this.tickSources.find(s => s.handles(leftYear, rightYear));
    if (!source) return;

    const ticks = source.computeTicks(leftYear, rightYear);

    const ctx  = this.ctx;
    const opts = this.opts;

    // Use CSS pixel dimensions for all drawing (ctx already scaled by dpr)
    const w = cssW;
    const h = cssH;

    // ── Background ─────────────────────────────────────────────────────────
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, w, h);

    // ── Baseline ───────────────────────────────────────────────────────────
    ctx.fillStyle = opts.tickColor;
    ctx.fillRect(0, 0, w, 1);

    // ── Ticks & labels ─────────────────────────────────────────────────────
    const yearToX = (y: number): number => ((y - leftYear) / span) * w;

    ctx.strokeStyle = opts.tickColor;
    ctx.lineWidth   = 1;
    ctx.fillStyle   = opts.labelColor;
    ctx.font        = opts.labelFont;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'bottom';

    for (const tick of ticks) {
      const x = yearToX(tick.year);

      // Skip ticks that are clearly off-screen (with small margin for edge labels)
      if (x < -60 || x > w + 60) continue;

      const tickH = tick.isMajor ? opts.majorTickHeight : opts.minorTickHeight;

      // Draw tick line
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 1);
      ctx.lineTo(x + 0.5, 1 + tickH);
      ctx.stroke();

      // Draw label (major ticks only)
      if (tick.isMajor && tick.label) {
        ctx.fillText(tick.label, x, h - 2);
      }
    }
  }
}
