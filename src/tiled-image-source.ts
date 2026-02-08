/**
 * Tiled image content source - manages a grid of image tiles.
 * 
 * Supports image pyramids where large images are split into smaller tiles
 * for efficient loading and rendering.
 */

import { IContentSource } from './content-source';
import { Viewport2d } from './viewport';

/**
 * Configuration for a tiled image
 */
export interface TileConfig {
  /** Base URL for tiles (e.g., 'https://example.com/tiles/0/') */
  baseUrl: string;
  
  /** Number of tile rows in the grid */
  rows: number;
  
  /** Number of tile columns in the grid */
  cols: number;
  
  /** Width of each tile in pixels */
  tileWidth: number;
  
  /** Height of each tile in pixels */
  tileHeight: number;
  
  /** URL pattern for tiles, default: '{x}-{y}.jpg' */
  urlPattern?: string;
}

/**
 * Content source for tiled images.
 * 
 * @remarks
 * Loads and manages a grid of image tiles, useful for large images
 * that are split into smaller pieces. Common in map tiles and
 * high-resolution image viewers.
 * 
 * Currently loads all tiles at startup. Future enhancements could include:
 * - Viewport-based culling (only render visible tiles)
 * - LOD (Level of Detail) support for multiple zoom levels
 * - Progressive loading (load visible tiles first)
 * 
 * @example
 * ```typescript
 * const tiledSource = new TiledImageSource({
 *   baseUrl: 'https://example.com/tiles/0/',
 *   rows: 5,
 *   cols: 4,
 *   tileWidth: 1024,
 *   tileHeight: 1024,
 *   urlPattern: '{x}-{y}.jpg'
 * });
 * 
 * renderer.setContent(tiledSource);
 * ```
 */
export class TiledImageSource implements IContentSource {
  private tiles: HTMLImageElement[][] = [];
  private config: TileConfig;
  private bounds: { x: number; y: number; width: number; height: number };
  private loadedCount = 0;
  private totalTiles = 0;
  
  /**
   * Creates a tiled image content source
   * @param config - Tiling configuration
   */
  constructor(config: TileConfig) {
    this.config = config;
    this.totalTiles = config.rows * config.cols;
    
    // Calculate total dimensions
    const totalWidth = config.cols * config.tileWidth;
    const totalHeight = config.rows * config.tileHeight;
    
    // Center image grid at origin in virtual space
    this.bounds = {
      x: -totalWidth / 2,
      y: -totalHeight / 2,
      width: totalWidth,
      height: totalHeight
    };
    
    // Start loading tiles
    this.loadTiles();
  }
  
  /**
   * Loads all tiles from the configured URLs
   */
  private loadTiles(): void {
    const pattern = this.config.urlPattern || '{x}-{y}.jpg';
    
    for (let row = 0; row < this.config.rows; row++) {
      this.tiles[row] = [];
      
      for (let col = 0; col < this.config.cols; col++) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        // Build tile URL from pattern
        const url = this.config.baseUrl + pattern
          .replace('{x}', col.toString())
          .replace('{y}', row.toString());
        
        // Track loading progress
        img.onload = () => {
          this.loadedCount++;
          if (this.loadedCount === this.totalTiles) {
            console.log('All tiles loaded:', this.totalTiles);
          }
        };
        
        img.onerror = () => {
          console.error('Failed to load tile:', url);
          this.loadedCount++; // Count as "loaded" to avoid blocking
        };
        
        img.src = url;
        this.tiles[row][col] = img;
      }
    }
  }
  
  /**
   * Checks if all tiles are loaded
   */
  isReady(): boolean {
    return this.loadedCount === this.totalTiles;
  }
  
  /**
   * Gets the bounding box of the entire tile grid in virtual space
   */
  getBounds(): { x: number; y: number; width: number; height: number } {
    return this.bounds;
  }
  
  /**
   * Draws all tiles to the canvas
   * @param ctx - Canvas rendering context
   * @param viewport - Current viewport for coordinate transformations
   * 
   * @remarks
   * Currently draws all tiles. Future optimization: only draw visible tiles
   * based on viewport bounds.
   */
  draw(ctx: CanvasRenderingContext2D, viewport: Viewport2d): void {
    // Draw each tile at its position
    for (let row = 0; row < this.config.rows; row++) {
      for (let col = 0; col < this.config.cols; col++) {
        const tile = this.tiles[row][col];
        
        // Skip tiles that haven't loaded yet
        if (!tile.complete) continue;
        
        // Calculate tile position in virtual space
        const tileVirtualX = this.bounds.x + (col * this.config.tileWidth);
        const tileVirtualY = this.bounds.y + (row * this.config.tileHeight);
        
        // Convert to screen coordinates
        const screenPos = viewport.pointVirtualToScreen(tileVirtualX, tileVirtualY);
        const screenWidth = viewport.widthVirtualToScreen(this.config.tileWidth);
        const screenHeight = viewport.heightVirtualToScreen(this.config.tileHeight);
        
        // Draw the tile
        ctx.drawImage(
          tile,
          screenPos.x,
          screenPos.y,
          screenWidth,
          screenHeight
        );
      }
    }
  }
  
  /**
   * Cleanup tile resources
   */
  destroy(): void {
    // Clear tile references to allow garbage collection
    this.tiles = [];
  }
}
