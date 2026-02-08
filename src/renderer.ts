/**
 * Renderer module - handles canvas rendering with viewport transformations.
 * Simplified from ChronoZoom's virtual-canvas.js, focused on image rendering.
 */

import { IRenderer } from './types';
import { Viewport2d } from './viewport';
import { IContentSource } from './content-source';

/**
 * Canvas-based renderer for images.
 * 
 * Handles all canvas rendering operations.
 * Implements IRenderer interface for flexibility.
 * 
 * @remarks
 * This is a simplified version compared to ChronoZoom's VirtualCanvas:
 * - Single canvas (no layers)
 * - Content source abstraction (supports different content types)
 * - Direct rendering (no caching or optimization)
 */
export class CanvasRenderer implements IRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private contentSource: IContentSource | null = null;

  /**
   * Creates a canvas renderer
   * @param container - HTML element to contain the canvas
   * 
   * @example
   * ```typescript
   * const renderer = new CanvasRenderer(document.getElementById('container')!);
   * const source = new SingleImageSource(imageElement);
   * renderer.setContent(source);
   * renderer.render(viewport);
   * ```
   */
  constructor(container: HTMLElement) {
    // Create canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    
    // Get 2D context
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D canvas context');
    }
    this.ctx = ctx;
    
    // Add canvas to container
    container.appendChild(this.canvas);
    
    // Set canvas size to match container
    this.resize();
    
    // Listen for window resize
    window.addEventListener('resize', this.handleResize);
  }

  /**
   * Handles window resize events
   */
  private handleResize = (): void => {
    this.resize();
  };

  /**
   * Resizes canvas to match container size
   */
  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    
    // Set canvas internal resolution
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  /**
   * Sets the content to render
   * @param content - Content source to display
   * 
   * @remarks
   * The content source defines its own bounds in virtual space
   * and handles its own rendering logic.
   */
  setContent(content: IContentSource): void {
    this.contentSource = content;
  }

  /**
   * Renders content with current viewport transformation
   * @param viewport - Current viewport state
   * 
   * @remarks
   * Rendering steps:
   * 1. Clear canvas
   * 2. Fill background
   * 3. Delegate drawing to content source
   */
  render(viewport: Viewport2d): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Fill with background color
    this.ctx.fillStyle = '#232323'; // ChronoZoom's background color
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // If no content source, nothing to render
    if (!this.contentSource) {
      return;
    }
    
    // Let the content source draw itself
    this.contentSource.draw(this.ctx, viewport);
  }

  /**
   * Calculates viewport region that fits the entire content
   * @returns Visible region that shows all content
   * 
   * @remarks
   * Useful for "fit to view" functionality.
   * Scale represents virtual units per pixel - larger scale = more zoomed out.
   */
  getContentFitRegion(): { centerX: number; centerY: number; scale: number } | null {
    if (!this.contentSource) {
      return null;
    }
    
    const bounds = this.contentSource.getBounds();
    
    // Calculate scale to fit content in viewport
    const canvasAspect = this.canvas.width / this.canvas.height;
    const contentAspect = bounds.width / bounds.height;
    
    let scale: number;
    if (contentAspect > canvasAspect) {
      // Content is wider, fit to width
      // Scale = virtual units per pixel, so use canvas / content
      scale = bounds.width / this.canvas.width;
    } else {
      // Content is taller, fit to height
      scale = bounds.height / this.canvas.height;
    }
    
    // Add 10% padding (scale up = zoom out slightly)
    scale *= 1.1;
    
    // Center is content center (0, 0 in our coordinate system)
    return {
      centerX: 0,
      centerY: 0,
      scale
    };
  }

  /**
   * Gets the canvas element
   * @returns The underlying canvas element
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Cleanup renderer resources
   */
  destroy(): void {
    window.removeEventListener('resize', this.handleResize);
    this.canvas.remove();
  }
}
