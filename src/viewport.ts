/**
 * Viewport module - handles coordinate transformations between screen and virtual space.
 * Ported from ChronoZoom's viewport.js with TypeScript.
 */

import { Point2d } from './types';

/**
 * Represents a visible region in virtual 2D space.
 * 
 * Virtual coordinate system: 
 * - Origin can be anywhere in virtual space
 * - X axis points right
 * - Y axis points down
 * - Scale determines how many virtual units fit in one screen pixel
 * 
 * @remarks
 * This class only stores the visible region parameters without any transformation logic.
 */
export class VisibleRegion2d {
  /**
   * Creates a visible region descriptor
   * @param centerX - X coordinate of viewport center in virtual space
   * @param centerY - Y coordinate of viewport center in virtual space  
   * @param scale - How many virtual units per screen pixel (virtual unit/pixel)
   */
  constructor(
    public centerX: number,
    public centerY: number,
    public scale: number
  ) {}
}

/**
 * Handles coordinate transformations between screen and virtual space.
 * 
 * Screen coordinate system:
 * - Origin at top-left corner of viewport
 * - X axis points right
 * - Y axis points down
 * - Units are pixels
 * 
 * Virtual coordinate system:
 * - Origin can be anywhere
 * - X axis points right (same as screen)
 * - Y axis points down (same as screen)
 * - Units are arbitrary "virtual units"
 * 
 * @remarks
 * Only handles coordinate transformations.
 * All methods are pure functions with no side effects.
 */
export class Viewport2d {
  /**
   * Creates a viewport with coordinate transformation capabilities
   * @param aspectRatio - How many h-units (height units) are in a single time unit
   * @param width - Viewport width in screen pixels
   * @param height - Viewport height in screen pixels
   * @param visible - Describes the visible region in virtual space
   */
  constructor(
    public aspectRatio: number,
    public width: number,
    public height: number,
    public visible: VisibleRegion2d
  ) {}

  /**
   * Converts pixels in h-units (horizontal virtual units)
   * @param wp - Amount of pixels
   * @returns Amount of h-units
   */
  widthScreenToVirtual(wp: number): number {
    return this.visible.scale * wp;
  }

  /**
   * Converts pixels in t-units (time/vertical virtual units)
   * @param hp - Amount of pixels
   * @returns Amount of t-units
   */
  heightScreenToVirtual(hp: number): number {
    return this.aspectRatio * this.visible.scale * hp;
  }

  /**
   * Converts h-units into pixels
   * @param wv - Amount of h-units
   * @returns Amount of pixels
   */
  widthVirtualToScreen(wv: number): number {
    return wv / this.visible.scale;
  }

  /**
   * Converts t-units into pixels
   * @param hv - Amount of t-units
   * @returns Amount of pixels
   */
  heightVirtualToScreen(hv: number): number {
    return hv / (this.aspectRatio * this.visible.scale);
  }

  /**
   * Converts a vector from virtual space to screen space.
   * A vector represents a displacement/direction, not an absolute position.
   * 
   * @param vx - Amount of t-units (horizontal displacement)
   * @param vy - Amount of h-units (vertical displacement)
   * @returns Vector in screen pixels
   * 
   * @example
   * ```typescript
   * const displacement = viewport.vectorVirtualToScreen(100, 50);
   * // Returns how many pixels correspond to 100 virtual units horizontally
   * // and 50 virtual units vertically
   * ```
   */
  vectorVirtualToScreen(vx: number, vy: number): Point2d {
    return {
      x: vx / this.visible.scale,
      y: vy / (this.aspectRatio * this.visible.scale)
    };
  }

  /**
   * Converts a point from virtual space to screen space.
   * A point represents an absolute position in the coordinate system.
   * 
   * @param px - X coordinate in virtual space (t-units)
   * @param py - Y coordinate in virtual space (h-units)
   * @returns Point in screen pixels from top-left origin
   * 
   * @example
   * ```typescript
   * const screenPos = viewport.pointVirtualToScreen(1000, 500);
   * // Returns pixel position on screen for virtual point (1000, 500)
   * ```
   */
  pointVirtualToScreen(px: number, py: number): Point2d {
    return {
      x: (px - this.visible.centerX) / this.visible.scale + this.width / 2.0,
      y: (py - this.visible.centerY) / (this.aspectRatio * this.visible.scale) + this.height / 2.0
    };
  }

  /**
   * Converts a point from screen space to virtual space.
   * 
   * @param px - X coordinate in screen pixels from top-left
   * @param py - Y coordinate in screen pixels from top-left
   * @returns Point in virtual coordinates (t-units, h-units)
   * 
   * @example
   * ```typescript
   * const virtualPos = viewport.pointScreenToVirtual(mouseX, mouseY);
   * // Converts mouse position to virtual space coordinates
   * ```
   */
  pointScreenToVirtual(px: number, py: number): Point2d {
    return {
      x: (px - this.width / 2.0) * this.visible.scale + this.visible.centerX,
      y: this.visible.centerY - (this.height / 2.0 - py) * (this.aspectRatio * this.visible.scale)
    };
  }

  /**
   * Converts a vector from screen space to virtual space.
   * 
   * @param px - Horizontal displacement in pixels
   * @param py - Vertical displacement in pixels
   * @returns Vector in virtual units (t-units, h-units)
   * 
   * @example
   * ```typescript
   * const virtualDelta = viewport.vectorScreenToVirtual(deltaX, deltaY);
   * // Converts pixel displacement to virtual space displacement
   * ```
   */
  vectorScreenToVirtual(px: number, py: number): Point2d {
    return {
      x: px * this.visible.scale,
      y: this.aspectRatio * this.visible.scale * py
    };
  }
}
