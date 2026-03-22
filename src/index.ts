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

// ── General-purpose canvas navigation ──────────────────────────────────────

// Main controller (primary export)
export { ChronoCanvas } from './canvas-controller';

// Core classes
export { VisibleRegion2d, Viewport2d } from './viewport';
export { EllipticalZoom, PanZoomAnimation } from './animation';
export { CanvasRenderer } from './renderer';

// Content sources
export type { IContentSource } from './content-source';
export { SingleImageSource } from './single-image-source';
export { TiledImageSource, type TileConfig } from './tiled-image-source';
export { CompositeContentSource } from './composite-content-source';

// Gestures
export { createGestureStream, createClickGestureStream } from './gestures';
export type {
  PanGesture, ZoomGesture, PinGesture, ClickGesture,
  Gesture, GestureType,
} from './gestures';

// Types and interfaces
export type { Point2d, IAnimation, IRenderer, ChronoCanvasOptions } from './types';

// Settings
export { DEFAULT_SETTINGS, mergeSettings } from './settings';

// Default export for convenience
export { ChronoCanvas as default } from './canvas-controller';

// ── Time Canvas (domain layer on top of ChronoCanvas) ──────────────────────

export { TimeCanvas } from './time-canvas-controller';
export type { TimeCanvasTimeline, TimeCanvasInfodot } from './time-types';
