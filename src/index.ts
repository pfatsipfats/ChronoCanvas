/**
 * ChronoCanvas - Modern canvas navigation library with elliptical zoom
 * 
 * Extracted from ChronoZoom and modernized with:
 * - TypeScript
 * - RxJS v7
 * - Native DOM APIs
 * 
 * @packageDocumentation
 */

// Main controller (primary export)
export { ChronoCanvas } from './canvas-controller';

// Core classes
export { VisibleRegion2d, Viewport2d } from './viewport';
export { EllipticalZoom, PanZoomAnimation } from './animation';
export { CanvasRenderer } from './renderer';

// Gestures
export { createGestureStream } from './gestures';
export type { PanGesture, ZoomGesture, PinGesture, Gesture, GestureType } from './gestures';

// Types and interfaces
export type { Point2d, IAnimation, IRenderer, ChronoCanvasOptions } from './types';

// Settings
export { DEFAULT_SETTINGS, mergeSettings } from './settings';

// Default export for convenience
export { ChronoCanvas as default } from './canvas-controller';
