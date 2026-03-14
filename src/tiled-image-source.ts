/**
 * Tiled image content source - manages a grid of image tiles.
 *
 * Supports image pyramids where large images are split into smaller tiles
 * for efficient loading and rendering. Draws the tile grid at a placement
 * rect in global virtual space.
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
 * Draws the tile grid at the given placement rect in global virtual space.
 * Tiles are scaled to fit the placement.
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
 * }, { x: -2048, y: -2048, width: 4096, height: 4096 });
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
   * @param placement - Bounds in global virtual space where the tile grid is drawn
   */
  constructor(
    config: TileConfig,
    placement: { x: number; y: number; width: number; height: number }
  ) {
    this.config = config;
    this.bounds = placement;
    this.totalTiles = config.rows * config.cols;

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

        const url =
          this.config.baseUrl +
          pattern
            .replace('{x}', col.toString())
            .replace('{y}', row.toString());

        img.onload = () => {
          this.loadedCount++;
          if (this.loadedCount === this.totalTiles) {
            console.log('All tiles loaded:', this.totalTiles);
          }
        };

        img.onerror = () => {
          console.error('Failed to load tile:', url);
          this.loadedCount++;
        };

        img.src = url;
        this.tiles[row][col] = img;
      }
    }
  }

  isReady(): boolean {
    return this.loadedCount === this.totalTiles;
  }

  getBounds(): { x: number; y: number; width: number; height: number } {
    return this.bounds;
  }

  /**
   * Draws all tiles scaled to fit the placement rect with aspect-preserving contain.
   * Same letterbox/pillarbox logic as SingleImageSource.
   */
  draw(ctx: CanvasRenderingContext2D, viewport: Viewport2d): void {
    const { cols, rows, tileWidth, tileHeight } = this.config;
    const pw = this.bounds.width;
    const ph = this.bounds.height;
    const gridW = cols * tileWidth;
    const gridH = rows * tileHeight;

    const childAspect = gridW / gridH;
    const placementAspect = pw / ph;

    let aw: number, ah: number, ax: number, ay: number;
    if (childAspect > placementAspect) {
      aw = pw;
      ah = pw / childAspect;
      ax = this.bounds.x;
      ay = this.bounds.y + (ph - ah) / 2;
    } else {
      ah = ph;
      aw = ph * childAspect;
      ax = this.bounds.x + (pw - aw) / 2;
      ay = this.bounds.y;
    }

    const tileW = aw / cols;
    const tileH = ah / rows;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tile = this.tiles[row][col];

        if (!tile.complete) continue;

        const tileVirtualX = ax + (col / cols) * aw;
        const tileVirtualY = ay + (row / rows) * ah;

        const screenPos = viewport.pointVirtualToScreen(tileVirtualX, tileVirtualY);
        const screenWidth = viewport.widthVirtualToScreen(tileW);
        const screenHeight = viewport.heightVirtualToScreen(tileH);

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

  destroy(): void {
    this.tiles = [];
  }
}
