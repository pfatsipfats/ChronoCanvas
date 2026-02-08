/**
 * Core type definitions for ChronoCanvas
 */

import { VisibleRegion2d, Viewport2d } from './viewport';
import { IContentSource } from './content-source';

/**
 * 2D point in any coordinate system
 */
export interface Point2d {
  readonly x: number;
  readonly y: number;
}

/**
 * Interface for viewport animations.
 * Allows different animation strategies.
 */
export interface IAnimation {
  /** Whether animation should continue */
  readonly isActive: boolean;
  
  /** Unique identifier for this animation instance */
  readonly id: number;
  
  /**
   * Produces the next viewport state for current frame
   * @param currentViewport - Current viewport state
   * @returns New visible region for this frame
   */
  produceNextVisible(currentViewport: Viewport2d): VisibleRegion2d;
}

/**
 * Renderer interface - allows different rendering strategies.
 */
export interface IRenderer {
  /**
   * Renders content with current viewport transformation
   * @param viewport - Current viewport state
   */
  render(viewport: Viewport2d): void;
  
  /**
   * Sets the content to render
   * @param content - Content source (single image, tiled image, etc.)
   */
  setContent(content: IContentSource): void;
  
  /**
   * Cleanup renderer resources
   */
  destroy(): void;
}

/**
 * Configuration for ChronoCanvas behavior
 */
export interface ChronoCanvasOptions {
  /** How far to zoom out during elliptical zoom (0-1, default 0.5) */
  ellipticalZoomZoomoutFactor?: number;
  
  /** Base duration for zoom animations in ms (default 9000) */
  ellipticalZoomDuration?: number;
  
  /** Zoom step per mouse wheel tick (default 1.4) */
  zoomLevelFactor?: number;
  
  /** Pan gesture velocity multiplier (default 3.0) */
  panSpeedFactor?: number;
  
  /** Zoom gesture velocity multiplier (default 2.5) */
  zoomSpeedFactor?: number;
  
  /** Target framerate for animations (default 60) */
  targetFps?: number;
}
