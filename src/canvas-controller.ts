/**
 * Main ChronoCanvas controller - orchestrates all components.
 */

import { Subscription } from 'rxjs';
import { IRenderer, IAnimation, ChronoCanvasOptions } from './types';
import { VisibleRegion2d, Viewport2d } from './viewport';
import { createGestureStream, PanGesture, ZoomGesture, PinGesture } from './gestures';
import { EllipticalZoom, PanZoomAnimation } from './animation';
import { CanvasRenderer } from './renderer';
import { mergeSettings } from './settings';
import { IContentSource } from './content-source';
import { SingleImageSource } from './single-image-source';

/**
 * Main controller for the ChronoCanvas library.
 * Orchestrates viewport, gestures, animations, and rendering.
 * 
 * Responsibilities:
 * - Coordinate between modules (orchestration only)
 * - Manage lifecycle (initialization, cleanup)
 * - Provide public API
 * 
 * @example
 * Basic usage:
 * ```typescript
 * const canvas = new ChronoCanvas(document.getElementById('container')!, {
 *   ellipticalZoomDuration: 2000,
 *   zoomLevelFactor: 1.4
 * });
 * 
 * // Load and display image
 * const img = new Image();
 * img.onload = () => {
 *   canvas.setContent(img);
 *   canvas.fitToView();
 * };
 * img.src = 'path/to/image.jpg';
 * ```
 * 
 * @example
 * Advanced usage with custom renderer:
 * ```typescript
 * const customRenderer = new MyCustomRenderer(container);
 * const canvas = new ChronoCanvas(container, options, customRenderer);
 * ```
 */
export class ChronoCanvas {
  private viewport: Viewport2d;
  private renderer: IRenderer;
  private animation: IAnimation | null = null;
  private gestureSubscription: Subscription | null = null;
  private animationFrameId: number | null = null;
  private settings: Required<ChronoCanvasOptions>;
  
  private readonly container: HTMLElement;

  /**
   * Creates a new ChronoCanvas instance
   * 
   * @param container - HTML element to render into
   * @param options - Configuration options (merged with defaults)
   * @param renderer - Custom renderer (optional, defaults to CanvasRenderer)
   * 
   * @remarks
   * The renderer parameter allows you to inject a custom renderer
   * implementation for testing or alternative rendering strategies.
   */
  constructor(
    container: HTMLElement,
    options?: ChronoCanvasOptions,
    renderer?: IRenderer
  ) {
    this.container = container;
    this.settings = mergeSettings(options);
    
    // Dependency injection: use provided renderer or create default
    this.renderer = renderer ?? new CanvasRenderer(container);
    
    // Get canvas dimensions for initial viewport
    const rect = container.getBoundingClientRect();
    
    // Initialize viewport with default visible region
    // ChronoZoom's aspect ratio represents the relationship between horizontal and vertical virtual units.
    // For uniform image display (not timeline), aspectRatio = 1.0 provides equal X/Y scaling.
    const aspectRatio = 1.0;
    this.viewport = new Viewport2d(
      aspectRatio,
      rect.width,
      rect.height,
      new VisibleRegion2d(0, 0, 1.0) // Centered at origin, scale 1.0
    );
    
    // Set up gesture stream
    this.setupGestures();
    
    // Initial render
    this.renderer.render(this.viewport);
  }

  /**
   * Calculates aspect ratio from current viewport dimensions
   * @returns Aspect ratio (always 1.0 for uniform image scaling)
   * 
   * @remarks
   * ChronoZoom's aspect ratio was designed for timeline-based content where horizontal (time)
   * and vertical (content) axes have different semantic meanings. For image display,
   * aspectRatio = 1.0 ensures uniform X/Y coordinate transformations.
   */
  private getAspectRatio(): number {
    const ratio = 1.0;
    return ratio;
  }

  /**
   * Sets up the gesture event stream and subscriptions
   */
  private setupGestures(): void {
    // Get the canvas element from renderer
    const canvas = (this.renderer as CanvasRenderer).getCanvas();
    
    // Create gesture stream
    const gestures$ = createGestureStream(canvas, this.settings);
    
    // Subscribe to gestures
    this.gestureSubscription = gestures$.subscribe(gesture => {
      this.handleGesture(gesture);
    });
  }

  /**
   * Handles a gesture event
   * @param gesture - The gesture to handle
   */
  private handleGesture(gesture: PanGesture | ZoomGesture | PinGesture): void {
    switch (gesture.Type) {
      case 'Pin':
        // Stop any active animation
        this.stopAnimation();
        break;
        
      case 'Pan':
        this.handlePan(gesture.xOffset, gesture.yOffset);
        break;
        
      case 'Zoom':
        this.handleZoom(gesture.xOrigin, gesture.yOrigin, gesture.scaleFactor);
        break;
    }
  }

  /**
   * Handles pan gesture
   * @param xOffset - Horizontal offset in pixels
   * @param yOffset - Vertical offset in pixels
   */
  private handlePan(xOffset: number, yOffset: number): void {
    // Convert screen offset to virtual offset
    const virtualOffset = this.viewport.vectorScreenToVirtual(xOffset, yOffset);
    
    // Calculate target viewport
    const targetVisible = new VisibleRegion2d(
      this.viewport.visible.centerX + virtualOffset.x,
      this.viewport.visible.centerY + virtualOffset.y,
      this.viewport.visible.scale
    );
    
    const targetViewport = new Viewport2d(
      this.getAspectRatio(),
      this.viewport.width,
      this.viewport.height,
      targetVisible
    );
    
    // Create or update PanZoomAnimation for smooth inertia
    if (!this.animation || !(this.animation instanceof PanZoomAnimation)) {
      // Create new pan animation
      const panAnimation = new PanZoomAnimation(this.viewport);
      panAnimation.setVelocity(this.settings.panSpeedFactor * 0.001);
      this.animation = panAnimation;
      this.startAnimationLoop();
    }
    
    // Update target (supports continuous gestures)
    if (this.animation instanceof PanZoomAnimation) {
      this.animation.setTargetViewport(targetViewport);
    }
  }

  /**
   * Handles zoom gesture
   * @param xOrigin - X position of zoom origin in screen coordinates
   * @param yOrigin - Y position of zoom origin in screen coordinates
   * @param scaleFactor - Scale multiplication factor
   */
  private handleZoom(xOrigin: number, yOrigin: number, scaleFactor: number): void {
    // Convert zoom origin to virtual coordinates
    const virtualOrigin = this.viewport.pointScreenToVirtual(xOrigin, yOrigin);
    
    // Calculate new scale
    const newScale = this.viewport.visible.scale * scaleFactor;
    
    // Calculate target viewport (zoom toward/away from cursor)
    const targetVisible = new VisibleRegion2d(
      virtualOrigin.x,
      virtualOrigin.y,
      newScale
    );
    
    const targetViewport = new Viewport2d(
      this.getAspectRatio(),
      this.viewport.width,
      this.viewport.height,
      targetVisible
    );
    
    // Create or update PanZoomAnimation for smooth inertia
    if (!this.animation || !(this.animation instanceof PanZoomAnimation)) {
      // Create new zoom animation
      const zoomAnimation = new PanZoomAnimation(this.viewport);
      zoomAnimation.setVelocity(this.settings.zoomSpeedFactor * 0.001);
      this.animation = zoomAnimation;
      this.startAnimationLoop();
    }
    
    // Update target (supports continuous gestures)
    if (this.animation instanceof PanZoomAnimation) {
      this.animation.setTargetViewport(targetViewport);
    }
  }

  /**
   * Updates the visible region and triggers a render
   * @param newVisible - New visible region
   */
  private setVisible(newVisible: VisibleRegion2d): void {
    // Update viewport
    this.viewport = new Viewport2d(
      this.getAspectRatio(),
      this.viewport.width,
      this.viewport.height,
      newVisible
    );
    
    // Render
    this.renderer.render(this.viewport);
  }

  /**
   * Starts the animation loop
   */
  private startAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      return; // Already running
    }
    
    const animate = () => {
      if (this.animation && this.animation.isActive) {
        // Get next frame from animation
        const newVisible = this.animation.produceNextVisible(this.viewport);
        this.setVisible(newVisible);
        
        // Continue loop
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        // Animation finished
        this.animationFrameId = null;
        this.animation = null;
      }
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Stops the current animation
   */
  private stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.animation = null;
  }

  /**
   * Sets the content to display
   * 
   * @param image - Image element to render
   * 
   * @remarks
   * Convenience method that automatically wraps the image in a SingleImageSource.
   * For more advanced usage (e.g., tiled images), use setContentSource() instead.
   * 
   * @example
   * ```typescript
   * const img = new Image();
   * img.onload = () => canvas.setContent(img);
   * img.src = 'image.jpg';
   * ```
   */
  setContent(image: HTMLImageElement): void {
    const source = new SingleImageSource(image);
    this.renderer.setContent(source);
    this.renderer.render(this.viewport);
  }

  /**
   * Sets the content source to display
   * 
   * @param source - Content source (single image, tiled image, etc.)
   * 
   * @remarks
   * Advanced method for using custom content sources like TiledImageSource.
   * 
   * @example
   * ```typescript
   * const tiledSource = new TiledImageSource({
   *   baseUrl: 'https://example.com/tiles/',
   *   rows: 5,
   *   cols: 4,
   *   tileWidth: 1024,
   *   tileHeight: 1024
   * });
   * canvas.setContentSource(tiledSource);
   * ```
   */
  setContentSource(source: IContentSource): void {
    this.renderer.setContent(source);
    this.renderer.render(this.viewport);
  }

  /**
   * Animates viewport to show specific region using elliptical zoom
   * 
   * @param region - Target visible region
   * @param immediate - If true, jump without animation (default: false)
   * 
   * @example
   * ```typescript
   * // Zoom to a specific region
   * canvas.zoomTo({
   *   centerX: 1000,
   *   centerY: 500,
   *   scale: 0.1
   * });
   * 
   * // Jump immediately without animation
   * canvas.zoomTo(region, true);
   * ```
   */
  zoomTo(
    region: { centerX: number; centerY: number; scale: number },
    immediate: boolean = false
  ): void {
    const targetVisible = new VisibleRegion2d(
      region.centerX,
      region.centerY,
      region.scale
    );
    
    if (immediate) {
      // Jump directly
      this.stopAnimation();
      this.setVisible(targetVisible);
    } else {
      // Animate with elliptical zoom
      this.stopAnimation();
      this.animation = new EllipticalZoom(
        this.viewport.visible,
        targetVisible,
        this.settings
      );
      this.startAnimationLoop();
    }
  }

  /**
   * Fits content to viewport (shows entire image)
   * Uses elliptical zoom animation for smooth transition.
   * 
   * @param immediate - If true, jump without animation (default: false)
   * 
   * @example
   * ```typescript
   * // Smoothly zoom out to show full image
   * canvas.fitToView();
   * 
   * // Jump immediately
   * canvas.fitToView(true);
   * ```
   */
  fitToView(immediate: boolean = false): void {
    const fitRegion = (this.renderer as CanvasRenderer).getContentFitRegion();
    if (fitRegion) {
      this.zoomTo(fitRegion, immediate);
    }
  }

  /**
   * Gets the current viewport
   * @returns Current viewport instance
   * 
   * @remarks
   * Useful for advanced use cases where you need to query the current
   * visible region or perform custom transformations.
   */
  getViewport(): Viewport2d {
    return this.viewport;
  }

  /**
   * Updates viewport dimensions (call when container resizes)
   * 
   * Maintains the visual zoom level and center position while updating
   * the viewport dimensions. The image stays at the same zoom - the window
   * just reveals more or less of the canvas area.
   * 
   * @example
   * ```typescript
   * window.addEventListener('resize', () => {
   *   canvas.updateViewport();
   * });
   * ```
   */
  updateViewport(): void {
    const rect = this.container.getBoundingClientRect();
    
    // ChronoZoom's aspect ratio: 1.0 for uniform X/Y scaling in image display
    const aspectRatio = 1.0;
    
    // Keep the same visible region (center and scale) - just update dimensions
    // This makes the image stay at the same zoom level; the window size change
    // simply reveals more or less of the image
    this.viewport = new Viewport2d(
      aspectRatio,
      rect.width,
      rect.height,
      this.viewport.visible  // Keep existing center and scale
    );
    this.renderer.render(this.viewport);
  }

  /**
   * Cleans up resources and unsubscribes from events
   * 
   * @remarks
   * Always call this when you're done with the ChronoCanvas instance
   * to prevent memory leaks.
   * 
   * @example
   * ```typescript
   * canvas.destroy();
   * ```
   */
  destroy(): void {
    this.stopAnimation();
    
    if (this.gestureSubscription) {
      this.gestureSubscription.unsubscribe();
      this.gestureSubscription = null;
    }
    
    this.renderer.destroy();
  }
}
