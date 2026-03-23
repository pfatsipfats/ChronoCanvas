/**
 * TimeCanvas — domain-specific wrapper around ChronoCanvas for hierarchical time data.
 *
 * Keeps all time-domain logic (layout, hit-testing, infodot cards) separate from the
 * general-purpose ChronoCanvas navigation library.
 *
 * Usage:
 *   const tc = new TimeCanvas(container, options);
 *   tc.setData(myTimelineTree);
 *   tc.fitToView(true);
 */

import { Subscription } from 'rxjs';
import { ChronoCanvas } from './canvas-controller';
import { ChronoCanvasOptions } from './types';
import { Viewport2d } from './viewport';
import { createClickGestureStream } from './gestures';
import { TimeCanvasTimeline } from './time-types';
import { TimeMapper } from './time-mapper';
import { layoutTimeCanvas, PositionedTimeline } from './time-layout';
import { TimeCanvasSource } from './time-canvas-source';

export class TimeCanvas {
  private readonly canvas: ChronoCanvas;
  private readonly container: HTMLElement;
  private timeCanvasSource: TimeCanvasSource | null = null;
  private timeMapper: TimeMapper | null = null;
  private clickSubscription: Subscription | null = null;

  /**
   * Creates a TimeCanvas instance.
   *
   * @param container - HTML element to render into (same as ChronoCanvas)
   * @param options - ChronoCanvas options forwarded to the underlying canvas
   *
   * @example
   * ```typescript
   * const tc = new TimeCanvas(document.getElementById('container')!, {
   *   ellipticalZoomDuration: 6000,
   * });
   * tc.setData(worldHistoryData);
   * tc.fitToView(true);
   * ```
   */
  constructor(container: HTMLElement, options?: ChronoCanvasOptions) {
    this.container = container;
    this.canvas = new ChronoCanvas(container, options);
    this.setupClickHandler();
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private setupClickHandler(): void {
    // Subscribe to click gestures directly on the container, independent of
    // ChronoCanvas's internal gesture stream.
    const click$ = createClickGestureStream(this.container);
    this.clickSubscription = click$.subscribe(({ xPos, yPos }) => {
      this.handleClick(xPos, yPos);
    });
  }

  private handleClick(screenX: number, screenY: number): void {
    if (!this.timeCanvasSource) return;

    const viewport = this.canvas.getViewport();
    const vp  = viewport.pointScreenToVirtual(screenX, screenY);
    const hit = this.timeCanvasSource.hitTest(vp.x, vp.y);

    if (!hit) {
      // Dismiss any open infodot card
      this.timeCanvasSource.setSelectedInfodot(null);
      // Re-render via a no-op zoomTo (immediate, same position)
      const v = viewport.visible;
      this.canvas.zoomTo({ centerX: v.centerX, centerY: v.centerY, scale: v.scale }, true);
      return;
    }

    if (hit.kind === 'infodot') {
      const dot = hit.dot;
      // Scale so the expanded card fills roughly half the viewport width
      const targetScale = dot.radius * 6 / (viewport.width / 2);
      this.timeCanvasSource.setSelectedInfodot(dot);
      this.canvas.zoomTo({ centerX: dot.cx, centerY: dot.cy, scale: targetScale });
      return;
    }

    if (hit.kind === 'timeline') {
      // Dismiss any open infodot card when navigating into a timeline
      this.timeCanvasSource.setSelectedInfodot(null);
      this.zoomToTimeline(hit.node);
    }
  }

  private zoomToTimeline(node: PositionedTimeline): void {
    const viewport = this.canvas.getViewport();
    const padX = node.width  * 0.10;
    const padY = node.height * 0.10;
    const fitScaleX = (node.width  + 2 * padX) / viewport.width;
    const fitScaleY = (node.height + 2 * padY) / viewport.height;
    this.canvas.zoomTo({
      centerX: node.x + node.width  / 2,
      centerY: node.y + node.height / 2,
      scale:   Math.max(fitScaleX, fitScaleY),
    });
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /**
   * Loads and renders a hierarchical timeline tree.
   * Replaces any previously loaded data.
   *
   * @param root - Root timeline (may contain nested timelines and infodots)
   */
  setData(root: TimeCanvasTimeline): void {
    const mapper     = new TimeMapper(root);
    this.timeMapper  = mapper;
    const positioned = layoutTimeCanvas(root, mapper);
    const source     = new TimeCanvasSource(positioned);
    this.timeCanvasSource = source;
    this.canvas.setContentSource(source);
  }

  /**
   * Fits the entire time canvas into the viewport.
   *
   * @param immediate - Jump without animation if true (default: false)
   */
  fitToView(immediate: boolean = false): void {
    this.canvas.fitToView(immediate);
  }

  /**
   * Animates the viewport to a specific virtual region.
   * Delegates directly to the underlying ChronoCanvas.
   */
  zoomTo(
    region: { centerX: number; centerY: number; scale: number },
    immediate: boolean = false
  ): void {
    this.canvas.zoomTo(region, immediate);
  }

  /**
   * Updates viewport dimensions after a container resize.
   *
   * @example
   * ```typescript
   * window.addEventListener('resize', () => tc.updateViewport());
   * ```
   */
  updateViewport(): void {
    this.canvas.updateViewport();
  }

  /**
   * Returns the current Viewport2d from the underlying ChronoCanvas.
   *
   * Useful for computing the visible year range to drive a TimeScaleRuler:
   * ```typescript
   * const vp = tc.getViewport();
   * const leftVX = vp.visible.centerX - (vp.width / 2) * vp.visible.scale;
   * ```
   */
  getViewport(): Viewport2d {
    return this.canvas.getViewport();
  }

  /**
   * Returns the root timeline's start and end in decimal astronomical years,
   * or null if `setData` has not yet been called.
   *
   * Use this together with `getViewport()` to convert virtual-X coordinates
   * back to calendar years for the timescale ruler.
   */
  getRootTimeRange(): { startYear: number; endYear: number } | null {
    if (!this.timeMapper) return null;
    return {
      startYear: this.timeMapper.startYear,
      endYear:   this.timeMapper.endYear,
    };
  }

  /**
   * Cleans up all resources, event subscriptions, and the underlying canvas.
   */
  destroy(): void {
    if (this.clickSubscription) {
      this.clickSubscription.unsubscribe();
      this.clickSubscription = null;
    }
    this.canvas.destroy();
  }
}
