# ChronoCanvas

Modern TypeScript library for canvas navigation with smooth elliptical zoom, extracted from [ChronoZoom](https://github.com/alterm4nn/ChronoZoom).

## Features

- ✨ **Smooth Elliptical Zoom** - Based on the paper "Smooth and efficient zooming and panning" by van Wijk & Nuij
- 🎯 **Precise Navigation** - Mouse wheel zoom and click-drag panning
- 🚀 **Modern Architecture** - TypeScript, RxJS v7, native DOM APIs
- 📦 **Zero Dependencies** - Only RxJS runtime dependency
- 🎨 **Flexible Rendering** - Interface-based renderer for extensibility
- 🔧 **Fully Typed** - Complete TypeScript definitions

## Installation

```bash
npm install chronocanvas
# or
yarn add chronocanvas
# or
pnpm add chronocanvas
```

## Quick Start

```typescript
import { ChronoCanvas } from 'chronocanvas';

// Create canvas in a container
const canvas = new ChronoCanvas(document.getElementById('container')!);

// Load and display an image
const img = new Image();
img.onload = () => {
  canvas.setContent(img);
  canvas.fitToView();
};
img.src = 'path/to/image.jpg';
```

## Usage Examples

### Basic Setup

```typescript
import { ChronoCanvas } from 'chronocanvas';

const canvas = new ChronoCanvas(container, {
  ellipticalZoomDuration: 2000,      // Animation duration in ms
  ellipticalZoomZoomoutFactor: 0.5,  // How far to zoom out during transition
  zoomLevelFactor: 1.4,              // Mouse wheel zoom step
  panSpeedFactor: 3.0,               // Pan gesture sensitivity
  targetFps: 60                      // Target framerate
});
```

### Programmatic Zoom

```typescript
// Zoom to a specific region with animation
canvas.zoomTo({
  centerX: 1000,
  centerY: 500,
  scale: 0.1
});

// Jump immediately without animation
canvas.zoomTo(region, true);

// Fit content to viewport
canvas.fitToView();
```

### Event Handling

```typescript
// Handle window resize
window.addEventListener('resize', () => {
  canvas.updateViewport();
});

// Cleanup when done
canvas.destroy();
```

### Custom Renderer

```typescript
import { ChronoCanvas, IRenderer, Viewport2d } from 'chronocanvas';

class CustomRenderer implements IRenderer {
  render(viewport: Viewport2d): void {
    // Your custom rendering logic
  }
  
  setContent(content: HTMLImageElement): void {
    // Handle content
  }
  
  destroy(): void {
    // Cleanup
  }
}

const renderer = new CustomRenderer();
const canvas = new ChronoCanvas(container, options, renderer);
```

## API Reference

### ChronoCanvas

Main controller class for canvas navigation.

#### Constructor

```typescript
new ChronoCanvas(
  container: HTMLElement,
  options?: ChronoCanvasOptions,
  renderer?: IRenderer
)
```

#### Methods

##### `setContent(image: HTMLImageElement): void`
Sets the image to display on the canvas.

##### `zoomTo(region: VisibleRegion2d, immediate?: boolean): void`
Animates to a specific viewport region. Set `immediate` to `true` to jump without animation.

##### `fitToView(immediate?: boolean): void`
Fits the entire content to the viewport.

##### `getViewport(): Viewport2d`
Returns the current viewport state.

##### `updateViewport(): void`
Updates viewport dimensions. Call this when the container resizes.

##### `destroy(): void`
Cleans up resources and unsubscribes from events.

### Configuration Options

```typescript
interface ChronoCanvasOptions {
  ellipticalZoomZoomoutFactor?: number;  // 0-1, default: 0.5
  ellipticalZoomDuration?: number;       // milliseconds, default: 9000
  zoomLevelFactor?: number;              // default: 1.4
  panSpeedFactor?: number;               // default: 3.0
  targetFps?: number;                    // default: 60
}
```

### Viewport & Coordinates

#### VisibleRegion2d

```typescript
class VisibleRegion2d {
  centerX: number;  // X coordinate of viewport center
  centerY: number;  // Y coordinate of viewport center
  scale: number;    // Virtual units per screen pixel
}
```

#### Viewport2d

Handles coordinate transformations between screen and virtual space.

```typescript
class Viewport2d {
  // Convert points between coordinate systems
  pointScreenToVirtual(px: number, py: number): Point2d;
  pointVirtualToScreen(vx: number, vy: number): Point2d;
  
  // Convert vectors (displacements)
  vectorScreenToVirtual(px: number, py: number): Point2d;
  vectorVirtualToScreen(vx: number, vy: number): Point2d;
  
  // Convert dimensions
  widthScreenToVirtual(wp: number): number;
  heightScreenToVirtual(hp: number): number;
  widthVirtualToScreen(wv: number): number;
  heightVirtualToScreen(hv: number): number;
}
```

### Gestures

The library automatically handles:
- **Pan** - Click and drag to move the viewport
- **Zoom** - Mouse wheel to zoom in/out
- **Pin** - Mouse down to stop animations

You can also create custom gesture streams:

```typescript
import { createGestureStream } from 'chronocanvas';

const gestures$ = createGestureStream(element, settings);
gestures$.subscribe(gesture => {
  console.log(gesture.Type); // 'Pan', 'Zoom', or 'Pin'
});
```

## Architecture

ChronoCanvas follows modern software design principles:

- **Modular Components** - Viewport, Gestures, Animation, Renderer are separate concerns
- **Interface-Based** - `IRenderer` and `IAnimation` interfaces for extensibility
- **Reactive Streams** - RxJS observables for gesture handling
- **TypeScript First** - Full type safety and IntelliSense support

### Component Overview

```
┌─────────────────┐
│ ChronoCanvas    │  Main controller
│  (Orchestrator) │  
└────────┬────────┘
         │
    ┌────┴────┬────────┬────────────┐
    │         │        │            │
┌───▼───┐ ┌──▼───┐ ┌──▼──────┐ ┌──▼──────┐
│Viewport│ │Gestures│ │Animation│ │Renderer │
│        │ │(RxJS)  │ │         │ │         │
└────────┘ └────────┘ └─────────┘ └─────────┘
```

## Elliptical Zoom

ChronoCanvas implements the elliptical zoom algorithm from the paper ["Smooth and efficient zooming and panning"](https://www.win.tue.nl/~vanwijk/zoompan.pdf) by Jarke J. van Wijk and Wim A.A. Nuij (2003).

This algorithm:
- Calculates an optimal camera path through scale space
- Zooms out smoothly when navigating between distant regions
- Maintains visual context during transitions
- Feels natural and predictable

The zoom path uses hyperbolic functions (cosh, sinh, tanh) to create smooth acceleration and deceleration.

## Sample Application

A complete sample application is included in the `sample/` directory:

```bash
cd sample
pnpm dev
```

The sample demonstrates:
- Loading Dürer's "Melencolia I" engraving
- Full view and detail zoom buttons
- Mouse wheel zoom and pan interactions
- Smooth elliptical zoom transitions

## Building from Source

```bash
# Install dependencies
pnpm install

# Build library
pnpm run build

# Run type checking
pnpm run typecheck

# Run sample app
cd sample && pnpm dev
```

## Browser Support

ChronoCanvas works in all modern browsers that support:
- ES2020
- Native `wheel` event
- Canvas API
- RxJS v7

No polyfills or legacy browser support needed.

## Credits

ChronoCanvas is extracted and modernized from [ChronoZoom](https://github.com/alterm4nn/ChronoZoom), an open-source visualization of Big History.

Original ChronoZoom authors:
- Roland Saekow
- Richard Gregson  
- Walter Portnoy
- David Ward
- And many contributors

Elliptical zoom algorithm:
- Jarke J. van Wijk and Wim A.A. Nuij (2003)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

### Development Setup

1. Clone the repository
2. `pnpm install` - Install dependencies
3. `pnpm run build` - Build the library
4. `cd sample && pnpm dev` - Run sample app

### Code Style

- TypeScript strict mode
- Comprehensive TSDoc comments
- Interface-based design
- Pure functions where possible

## Changelog

### 0.1.0 (Initial Release)

- Ported core viewport and coordinate transformation logic
- Implemented elliptical zoom animation
- RxJS-based gesture detection
- Canvas renderer for images
- Sample application
- Full TypeScript support
