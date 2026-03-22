/**
 * TimeCanvasSource — IContentSource implementation for the Time Canvas.
 *
 * Renders a hierarchy of timelines and infodots onto the virtual canvas.
 * Supports:
 *   - LOD culling (elements below 2px on screen are skipped)
 *   - Timeline rectangles with depth-based colours and bottom-aligned labels
 *   - Infodot circles that expand to a card (image + title + text) when zoomed in
 *   - Lazy image loading with a url → HTMLImageElement cache
 *   - Hit testing for click-to-navigate
 */

import { IContentSource } from './content-source';
import { Viewport2d } from './viewport';
import { PositionedTimeline, PositionedInfodot } from './time-layout';

// ─────────────────────────────────────────────────────────────────────────────
// Visual constants
// ─────────────────────────────────────────────────────────────────────────────

/** Minimum on-screen width/height (px) before an element is culled */
const MIN_SCREEN_PX = 2;

/** On-screen infodot diameter thresholds for LOD transitions */
const DOT_SHOW_LABEL_PX  = 20;   // show title text around circle
const DOT_SHOW_THUMB_PX  = 40;   // show image thumbnail inside circle
const DOT_SHOW_CARD_PX   = 80;   // show full expanded card

/** Colours per depth (0 = root, 1 = level-1, 2 = level-2, …) */
const DEPTH_COLORS = [
  'rgba(80, 120, 200, 0.15)',   // root — barely visible
  'rgba(60, 160, 120, 0.20)',
  'rgba(200, 150,  60, 0.22)',
  'rgba(180,  80, 130, 0.22)',
  'rgba(100, 180, 200, 0.22)',
];

const TIMELINE_STROKE   = 'rgba(220, 220, 220, 0.55)';
const TIMELINE_LABEL_COLOR = 'rgb(232, 232, 232)';

const INFODOT_FILL         = 'rgba(255, 200,  80, 0.85)';
const INFODOT_STROKE       = 'rgba(255, 255, 255, 0.9)';
const INFODOT_SELECTED_FILL  = 'rgba(255, 230, 130, 0.95)';

const CARD_BG    = 'rgba(25, 25, 35, 0.92)';
const CARD_TITLE = 'rgb(230, 230, 230)';
const CARD_TEXT  = 'rgb(190, 190, 190)';

// ─────────────────────────────────────────────────────────────────────────────
// Hit-test result
// ─────────────────────────────────────────────────────────────────────────────

export type HitResult =
  | { kind: 'timeline'; node: PositionedTimeline }
  | { kind: 'infodot';  dot:  PositionedInfodot  };

// ─────────────────────────────────────────────────────────────────────────────
// TimeCanvasSource
// ─────────────────────────────────────────────────────────────────────────────

export class TimeCanvasSource implements IContentSource {
  private readonly root: PositionedTimeline;
  private selectedInfodot: PositionedInfodot | null = null;
  private readonly imageCache = new Map<string, HTMLImageElement>();

  constructor(root: PositionedTimeline) {
    this.root = root;
  }

  // ── IContentSource ──────────────────────────────────────────────────────

  getBounds(): { x: number; y: number; width: number; height: number } {
    return {
      x:      this.root.x,
      y:      this.root.y,
      width:  this.root.width,
      height: this.root.height,
    };
  }

  isReady(): boolean {
    return true; // images are lazy-loaded; the canvas is always ready to draw
  }

  draw(ctx: CanvasRenderingContext2D, viewport: Viewport2d): void {
    this.drawTimeline(ctx, viewport, this.root);
  }

  destroy(): void {
    this.imageCache.clear();
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /** Set which infodot is "selected" (shows full card regardless of zoom) */
  setSelectedInfodot(dot: PositionedInfodot | null): void {
    this.selectedInfodot = dot;
  }

  getSelectedInfodot(): PositionedInfodot | null {
    return this.selectedInfodot;
  }

  /**
   * Hit-test a point in virtual space.
   * Returns the deepest (smallest) timeline or the nearest infodot hit, or null.
   */
  hitTest(vx: number, vy: number): HitResult | null {
    return this.hitTestNode(vx, vy, this.root);
  }

  // ── Drawing helpers ──────────────────────────────────────────────────────

  private drawTimeline(
    ctx: CanvasRenderingContext2D,
    viewport: Viewport2d,
    node: PositionedTimeline
  ): void {
    const screenW = viewport.widthVirtualToScreen(node.width);
    if (screenW < MIN_SCREEN_PX) return;

    const screenH = viewport.widthVirtualToScreen(node.height);
    const screenPos = viewport.pointVirtualToScreen(node.x, node.y);

    // Fill + stroke the rectangle
    ctx.save();
    ctx.beginPath();
    ctx.rect(screenPos.x, screenPos.y, screenW, screenH);

    const fillColor = DEPTH_COLORS[Math.min(node.depth, DEPTH_COLORS.length - 1)];
    ctx.fillStyle   = fillColor;
    ctx.fill();

    ctx.strokeStyle = TIMELINE_STROKE;
    ctx.lineWidth   = Math.max(0.5, Math.min(2, screenW * 0.001));
    ctx.stroke();
    ctx.restore();

    // Title label (bottom-aligned, same as ChronoZoom)
    if (screenH > 10 && screenW > 20) {
      this.drawTimelineLabel(ctx, viewport, node, screenPos.x, screenPos.y, screenW, screenH);
    }

    // Draw children (skip if smaller than clip rect — handled by size check above)
    for (const child of node.children) {
      this.drawTimeline(ctx, viewport, child);
    }

    // Draw infodots
    for (const dot of node.infodots) {
      this.drawInfodot(ctx, viewport, dot);
    }
  }

  private drawTimelineLabel(
    ctx: CanvasRenderingContext2D,
    _viewport: Viewport2d,
    node: PositionedTimeline,
    sx: number,
    sy: number,
    sw: number,
    sh: number
  ): void {
    // Header constants (from ChronoZoom)
    const headerSize   = sh * (1 / 9);
    const headerMargin = Math.min(sh, sw) * (1 / 12);
    const marginTop    = sh - headerSize - headerMargin;  // bottom-aligned
    const marginLeft   = headerMargin;

    const fontSize = Math.max(8, Math.min(headerSize, 48));

    ctx.save();
    // Clip to the timeline rect so text doesn't overflow
    ctx.beginPath();
    ctx.rect(sx, sy, sw, sh);
    ctx.clip();

    ctx.font        = `${fontSize.toFixed(1)}px Arial, sans-serif`;
    ctx.fillStyle   = TIMELINE_LABEL_COLOR;
    ctx.textBaseline = 'top';

    const textX = sx + marginLeft;
    const textY = sy + marginTop;

    // Measure + truncate if needed
    const maxTextWidth = sw - marginLeft * 2;
    let label = node.source.title;
    if (ctx.measureText(label).width > maxTextWidth) {
      while (label.length > 1 && ctx.measureText(label + '…').width > maxTextWidth) {
        label = label.slice(0, -1);
      }
      label += '…';
    }

    ctx.fillText(label, textX, textY);
    ctx.restore();
  }

  private drawInfodot(
    ctx: CanvasRenderingContext2D,
    viewport: Viewport2d,
    dot: PositionedInfodot
  ): void {
    const screenRadius = viewport.widthVirtualToScreen(dot.radius);
    if (screenRadius * 2 < MIN_SCREEN_PX) return;

    const screenCenter = viewport.pointVirtualToScreen(dot.cx, dot.cy);
    const isSelected   = dot === this.selectedInfodot;
    const screenDiam   = screenRadius * 2;

    if (isSelected || screenDiam >= DOT_SHOW_CARD_PX) {
      this.drawInfodotCard(ctx, viewport, dot, screenCenter.x, screenCenter.y, screenRadius);
      return;
    }

    // Base circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(screenCenter.x, screenCenter.y, screenRadius, 0, Math.PI * 2);
    ctx.fillStyle   = INFODOT_FILL;
    ctx.fill();
    ctx.strokeStyle = INFODOT_STROKE;
    ctx.lineWidth   = Math.max(0.5, screenRadius * 0.08);
    ctx.stroke();
    ctx.restore();

    // Thumbnail image inside circle (medium zoom)
    if (screenDiam >= DOT_SHOW_THUMB_PX && dot.source.image) {
      const img = this.getOrLoadImage(dot.source.image.url);
      if (img.complete && img.naturalWidth > 0) {
        const ir = screenRadius * 0.75;
        ctx.save();
        ctx.beginPath();
        ctx.arc(screenCenter.x, screenCenter.y, ir, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(
          img,
          screenCenter.x - ir, screenCenter.y - ir,
          ir * 2, ir * 2
        );
        ctx.restore();
      }
    }

    // Label below the circle (small→medium zoom)
    if (screenDiam >= DOT_SHOW_LABEL_PX) {
      const fontSize = Math.max(9, Math.min(14, screenRadius * 0.6));
      ctx.save();
      ctx.font         = `${fontSize.toFixed(1)}px Arial, sans-serif`;
      ctx.fillStyle    = TIMELINE_LABEL_COLOR;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'top';
      const label = dot.source.title;
      ctx.fillText(label, screenCenter.x, screenCenter.y + screenRadius + 3);
      ctx.restore();
    }
  }

  /**
   * Expanded infodot card: drawn as a rounded rect centred on the infodot.
   * Layout (proportional to screenRadius × 4):
   *   - top 55%: image (or placeholder colour)
   *   - next 20%: title
   *   - bottom 25%: text (up to 3 lines)
   */
  private drawInfodotCard(
    ctx: CanvasRenderingContext2D,
    _viewport: Viewport2d,
    dot: PositionedInfodot,
    cx: number,
    cy: number,
    r: number
  ): void {
    const cardW = r * 4;
    const cardH = r * 5;
    const rx    = cx - cardW / 2;
    const ry    = cy - cardH / 2;
    const cornerR = cardW * 0.04;

    // Card background
    ctx.save();
    roundRect(ctx, rx, ry, cardW, cardH, cornerR);
    ctx.fillStyle = CARD_BG;
    ctx.fill();
    ctx.strokeStyle = INFODOT_SELECTED_FILL;
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Image region (top 55%)
    const imgH = cardH * 0.55;
    if (dot.source.image) {
      const img = this.getOrLoadImage(dot.source.image.url);
      if (img.complete && img.naturalWidth > 0) {
        ctx.save();
        // Clip to image area (rounded top corners)
        roundRect(ctx, rx, ry, cardW, imgH, cornerR, { bl: 0, br: 0 });
        ctx.clip();
        // Cover-fit: centre + crop
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const areaAspect = cardW / imgH;
        let sw: number, sh: number, sx: number, sy: number;
        if (imgAspect > areaAspect) {
          sh = img.naturalHeight;
          sw = sh * areaAspect;
          sx = (img.naturalWidth - sw) / 2;
          sy = 0;
        } else {
          sw = img.naturalWidth;
          sh = sw / areaAspect;
          sx = 0;
          sy = (img.naturalHeight - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, rx, ry, cardW, imgH);
        ctx.restore();
      } else {
        // Placeholder while image loads
        ctx.fillStyle = 'rgba(60, 60, 80, 0.7)';
        roundRect(ctx, rx, ry, cardW, imgH, cornerR, { bl: 0, br: 0 });
        ctx.fill();
      }
    }

    // Title (below image)
    const titleY     = ry + imgH + cardH * 0.03;
    const titleFontSz = Math.max(11, Math.min(22, r * 0.35));
    ctx.font         = `bold ${titleFontSz.toFixed(1)}px Arial, sans-serif`;
    ctx.fillStyle    = CARD_TITLE;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';

    const titleMaxW = cardW * 0.9;
    let title = dot.source.title;
    if (ctx.measureText(title).width > titleMaxW) {
      while (title.length > 1 && ctx.measureText(title + '…').width > titleMaxW) {
        title = title.slice(0, -1);
      }
      title += '…';
    }
    ctx.fillText(title, cx, titleY);

    // Description text (up to 3 lines)
    if (dot.source.text) {
      const textFontSz = Math.max(9, Math.min(14, r * 0.22));
      ctx.font         = `${textFontSz.toFixed(1)}px Arial, sans-serif`;
      ctx.fillStyle    = CARD_TEXT;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'top';

      const lineH    = textFontSz * 1.4;
      const maxLines = 3;
      const textMaxW = cardW * 0.88;
      const lines    = wrapText(ctx, dot.source.text, textMaxW, maxLines);
      const textStartY = titleY + titleFontSz * 1.5;

      lines.forEach((line, i) => {
        ctx.fillText(line, cx, textStartY + i * lineH);
      });
    }

    ctx.restore();
  }

  // ── Image loading ─────────────────────────────────────────────────────────

  private getOrLoadImage(url: string): HTMLImageElement {
    let img = this.imageCache.get(url);
    if (!img) {
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      this.imageCache.set(url, img);
    }
    return img;
  }

  // ── Hit testing ───────────────────────────────────────────────────────────

  private hitTestNode(
    vx: number,
    vy: number,
    node: PositionedTimeline
  ): HitResult | null {
    // Check if point is within this node's bounds
    if (
      vx < node.x || vx > node.x + node.width ||
      vy < node.y || vy > node.y + node.height
    ) {
      return null;
    }

    // Check infodots first (they sit on top visually)
    for (const dot of node.infodots) {
      const dx = vx - dot.cx;
      const dy = vy - dot.cy;
      if (Math.sqrt(dx * dx + dy * dy) <= dot.halfSize) {
        return { kind: 'infodot', dot };
      }
    }

    // Recurse into children (deepest match wins)
    for (const child of node.children) {
      const hit = this.hitTestNode(vx, vy, child);
      if (hit) return hit;
    }

    // This timeline itself is the hit
    return { kind: 'timeline', node };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Canvas helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Draws a rounded rectangle path.
 * `corners` lets you disable specific corners (e.g. top-only rounding).
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number,
  corners: { tl?: number; tr?: number; bl?: number; br?: number } = {}
): void {
  const tl = corners.tl ?? r;
  const tr = corners.tr ?? r;
  const br = corners.br ?? r;
  const bl = corners.bl ?? r;

  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y,       x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h,   x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x,     y + h,   x,           y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x,     y,       x + tl, y);
  ctx.closePath();
}

/**
 * Wraps `text` into at most `maxLines` lines no wider than `maxWidth`.
 * Uses a simple greedy word-wrap algorithm.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      if (lines.length >= maxLines) break;
      current = word;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);

  // If last line would be too long, truncate
  if (lines.length === maxLines && ctx.measureText(lines[maxLines - 1]).width > maxWidth) {
    let last = lines[maxLines - 1];
    while (last.length > 1 && ctx.measureText(last + '…').width > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = last + '…';
  }

  return lines;
}
