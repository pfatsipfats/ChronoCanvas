/**
 * Default configuration settings for ChronoCanvas.
 * Values match ChronoZoom's original behavior.
 */

import { ChronoCanvasOptions } from './types';

/**
 * Default settings matching ChronoZoom behavior
 */
export const DEFAULT_SETTINGS: Required<ChronoCanvasOptions> = {
  /** How far to zoom out during elliptical zoom transitions */
  ellipticalZoomZoomoutFactor: 0.5,
  
  /** Base duration for zoom animations (scaled by distance) */
  ellipticalZoomDuration: 9000,
  
  /** Zoom multiplier per mouse wheel notch */
  zoomLevelFactor: 1.4,
  
  /** Pan gesture velocity multiplier */
  panSpeedFactor: 3.0,
  
  /** Zoom gesture velocity multiplier */
  zoomSpeedFactor: 2.5,
  
  /** Target frames per second for animations */
  targetFps: 60,
};

/**
 * Merges user options with defaults
 * @param options - User-provided options
 * @returns Complete settings object
 */
export function mergeSettings(options?: ChronoCanvasOptions): Required<ChronoCanvasOptions> {
  return {
    ...DEFAULT_SETTINGS,
    ...options,
  };
}
