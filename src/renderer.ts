/**
 * Renderer module - handles canvas rendering with viewport transformations.
 * Simplified from ChronoZoom's virtual-canvas.js, focused on image rendering.
 */

import { IRenderer } from './types';
import { Viewport2d } from './viewport';

/**
 * Canvas-based renderer for images.
 * 
 * Handles all canvas rendering operations.
 * Implements IRenderer interface for flexibility.
 * 
 * @remarks
 * This is a simplified version compared to ChronoZoom's VirtualCanvas:
 * - Single canvas (no layers)
 * - Image rendering only (no complex content tree)
 * - Direct rendering (no caching or optimization)
 */
export class CanvasRenderer implements IRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private image: HTMLImageElement | null = null;
  
  // Virtual bounds of the content in virtual space
  private contentBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;

  /**
   * Creates a canvas renderer
   * @param container - HTML element to contain the canvas
   * 
   * @example
   * ```typescript
   * const renderer = new CanvasRenderer(document.getElementById('container')!);
   * renderer.setContent(imageElement);
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
   * @param content - Image element to display
   * 
   * @remarks
   * The image is positioned in virtual space with origin at (0, 0)
   * and dimensions matching the image's natural size.
   */
  setContent(content: HTMLImageElement): void {
    this.image = content;
    
    // Define content bounds in virtual space
    // Image is centered at origin, spans from (-width/2, -height/2) to (width/2, height/2)
    this.contentBounds = {
      x: -content.naturalWidth / 2,
      y: -content.naturalHeight / 2,
      width: content.naturalWidth,
      height: content.naturalHeight
    };
  }

  /**
   * Renders content with current viewport transformation
   * @param viewport - Current viewport state
   * 
   * @remarks
   * Rendering steps:
   * 1. Clear canvas
   * 2. Calculate image position in screen space
   * 3. Draw image with appropriate transform
   */
  render(viewport: Viewport2d): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Fill with background color
    this.ctx.fillStyle = '#232323'; // ChronoZoom's background color
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // If no image, nothing to render
    if (!this.image || !this.contentBounds) {
      return;
    }
    
    // Calculate image corners in virtual space
    const virtualTopLeft = {
      x: this.contentBounds.x,
      y: this.contentBounds.y
    };
    
    // Convert to screen space
    const screenTopLeft = viewport.pointVirtualToScreen(
      virtualTopLeft.x,
      virtualTopLeft.y
    );
    
    // Calculate screen dimensions
    const screenWidth = viewport.widthVirtualToScreen(this.contentBounds.width);
    const screenHeight = viewport.heightVirtualToScreen(this.contentBounds.height);
    
    // Draw image
    this.ctx.drawImage(
      this.image,
      screenTopLeft.x,
      screenTopLeft.y,
      screenWidth,
      screenHeight
    );
  }

  /**
   * Calculates viewport region that fits the entire content
   * @returns Visible region that shows all content
   * 
   * @remarks
   * Useful for "fit to view" functionality
   */
  getContentFitRegion(): { centerX: number; centerY: number; scale: number } | null {
    if (!this.contentBounds) {
      return null;
    }
    
    // Calculate scale to fit content in viewport
    const canvasAspect = this.canvas.width / this.canvas.height;
    const contentAspect = this.contentBounds.width / this.contentBounds.height;
    
    let scale: number;
    if (contentAspect > canvasAspect) {
      // Content is wider, fit to width
      scale = this.contentBounds.width / this.canvas.width;
    } else {
      // Content is taller, fit to height
      scale = this.contentBounds.height / this.canvas.height;
    }
    
    // Add 10% padding
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
