/**
 * Content source abstraction - allows different types of content to be rendered.
 * 
 * This interface decouples the renderer from specific content types, enabling:
 * - Single images
 * - Tiled image pyramids
 * - Future content types (timelines, infodots, etc.)
 */

import { Viewport2d } from './viewport';

/**
 * Interface for content that can be rendered on the canvas.
 * 
 * @remarks
 * Content sources are responsible for:
 * - Defining their bounds in virtual space
 * - Managing their own resources (loading, caching)
 * - Drawing themselves to the canvas context
 */
export interface IContentSource {
  /**
   * Gets the bounding box of this content in virtual space
   * @returns Bounds with x, y (top-left corner), width, and height
   */
  getBounds(): { x: number; y: number; width: number; height: number };
  
  /**
   * Checks if the content is ready to be rendered
   * @returns True if all resources are loaded and ready
   */
  isReady(): boolean;
  
  /**
   * Draws the content to the canvas context
   * @param ctx - Canvas rendering context
   * @param viewport - Current viewport for coordinate transformations
   */
  draw(ctx: CanvasRenderingContext2D, viewport: Viewport2d): void;
  
  /**
   * Cleanup resources used by this content source
   */
  destroy(): void;
}
