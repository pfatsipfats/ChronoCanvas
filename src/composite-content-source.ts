/**
 * Composite content source - renders multiple content sources in a single
 * global virtual space. Each source has its own bounds; no coordinate transform.
 */

import { IContentSource } from './content-source';
import { Viewport2d } from './viewport';

/**
 * Content source that composites multiple sources in array order (back to front).
 * All sources use the same global virtual space and viewport.
 */
export class CompositeContentSource implements IContentSource {
  private sources: IContentSource[];

  constructor(sources: IContentSource[]) {
    this.sources = sources;
  }

  getBounds(): { x: number; y: number; width: number; height: number } {
    if (this.sources.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;

    for (const source of this.sources) {
      const b = source.getBounds();
      left = Math.min(left, b.x);
      top = Math.min(top, b.y);
      right = Math.max(right, b.x + b.width);
      bottom = Math.max(bottom, b.y + b.height);
    }

    return {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top
    };
  }

  isReady(): boolean {
    return this.sources.every((s) => s.isReady());
  }

  draw(ctx: CanvasRenderingContext2D, viewport: Viewport2d): void {
    for (const source of this.sources) {
      const bounds = source.getBounds();
      const sw = viewport.widthVirtualToScreen(bounds.width);
      const sh = viewport.heightVirtualToScreen(bounds.height);

      if (sw < 1 || sh < 1) continue;

      source.draw(ctx, viewport);
    }
  }

  destroy(): void {
    for (const source of this.sources) {
      source.destroy();
    }
    this.sources = [];
  }
}
