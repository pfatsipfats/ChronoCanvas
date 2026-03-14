/**
 * Single image content source - wraps a single HTMLImageElement.
 *
 * Draws the image at a placement rect in global virtual space with
 * aspect-preserving fit (letterbox/pillarbox).
 */

import { IContentSource } from './content-source';
import { Viewport2d } from './viewport';

/**
 * Content source for a single image.
 *
 * @remarks
 * The image is drawn at the given placement rect in global virtual space.
 * Aspect ratio is preserved by fitting the image inside the placement
 * (letterbox or pillarbox as needed).
 *
 * @example
 * ```typescript
 * const img = new Image();
 * img.onload = () => {
 *   const source = new SingleImageSource(img, { x: 0, y: 0, width: 400, height: 300 });
 *   renderer.setContent(source);
 * };
 * img.src = 'image.jpg';
 * ```
 */
export class SingleImageSource implements IContentSource {
  private image: HTMLImageElement;
  private bounds: { x: number; y: number; width: number; height: number };

  /**
   * Creates a single image content source
   * @param image - The image element to render
   * @param placement - Bounds in global virtual space where the image is drawn
   */
  constructor(
    image: HTMLImageElement,
    placement: { x: number; y: number; width: number; height: number }
  ) {
    this.image = image;
    this.bounds = placement;
  }

  /**
   * Gets the bounding box of the image in virtual space
   */
  getBounds(): { x: number; y: number; width: number; height: number } {
    return this.bounds;
  }

  /**
   * Checks if the image is fully loaded
   */
  isReady(): boolean {
    return this.image.complete;
  }

  /**
   * Draws the image to the canvas at the placement rect with aspect-preserving fit
   */
  draw(ctx: CanvasRenderingContext2D, viewport: Viewport2d): void {
    const pw = this.bounds.width;
    const ph = this.bounds.height;
    const iw = this.image.naturalWidth;
    const ih = this.image.naturalHeight;

    if (iw <= 0 || ih <= 0) return;

    const childAspect = iw / ih;
    const placementAspect = pw / ph;

    let aw: number, ah: number, ax: number, ay: number;
    if (childAspect > placementAspect) {
      aw = pw;
      ah = pw / childAspect;
      ax = this.bounds.x;
      ay = this.bounds.y + (ph - ah) / 2;
    } else {
      ah = ph;
      aw = ph * childAspect;
      ax = this.bounds.x + (pw - aw) / 2;
      ay = this.bounds.y;
    }

    const screenTopLeft = viewport.pointVirtualToScreen(ax, ay);
    const screenWidth = viewport.widthVirtualToScreen(aw);
    const screenHeight = viewport.heightVirtualToScreen(ah);

    ctx.drawImage(
      this.image,
      screenTopLeft.x,
      screenTopLeft.y,
      screenWidth,
      screenHeight
    );
  }

  /**
   * Cleanup resources (no-op for single images)
   */
  destroy(): void {
    // Single images don't need cleanup
    // The image element is managed by the caller
  }
}
