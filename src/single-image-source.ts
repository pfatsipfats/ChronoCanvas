/**
 * Single image content source - wraps a single HTMLImageElement.
 * 
 * This is the simplest content source, representing a single image
 * centered at the origin in virtual space.
 */

import { IContentSource } from './content-source';
import { Viewport2d } from './viewport';

/**
 * Content source for a single image.
 * 
 * @remarks
 * The image is positioned in virtual space with its center at (0, 0)
 * and dimensions matching the image's natural size.
 * 
 * @example
 * ```typescript
 * const img = new Image();
 * img.onload = () => {
 *   const source = new SingleImageSource(img);
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
   */
  constructor(image: HTMLImageElement) {
    this.image = image;
    
    // Center image at origin in virtual space
    // Image spans from (-width/2, -height/2) to (width/2, height/2)
    this.bounds = {
      x: -image.naturalWidth / 2,
      y: -image.naturalHeight / 2,
      width: image.naturalWidth,
      height: image.naturalHeight
    };
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
   * Draws the image to the canvas
   * @param ctx - Canvas rendering context
   * @param viewport - Current viewport for coordinate transformations
   */
  draw(ctx: CanvasRenderingContext2D, viewport: Viewport2d): void {
    // Convert virtual bounds to screen coordinates
    const screenTopLeft = viewport.pointVirtualToScreen(this.bounds.x, this.bounds.y);
    const screenWidth = viewport.widthVirtualToScreen(this.bounds.width);
    const screenHeight = viewport.heightVirtualToScreen(this.bounds.height);
    
    // Draw the image
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
