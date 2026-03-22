/**
 * Time Canvas layout engine.
 *
 * Faithfully adapted from ChronoZoom's three-phase algorithm in layout.js:
 *   Phase 1 — Prepare  : compute virtual X coords for every node
 *   Phase 2 — Layout   : bottom-up height sizing + free-segment stacking
 *   Phase 3 — Arrange  : top-down conversion to absolute virtual coords
 *
 * Key constants replicated from ChronoZoom settings.js:
 *   timelineHeaderSize    = 1/9  ≈ 0.111  (title height as fraction of timeline height)
 *   timelineHeaderMargin  = 1/12 ≈ 0.083  (margin fraction)
 *   headerPercent         = 1/9 + 2×(1/12) ≈ 0.278  (total header band)
 *   timelineMinAspect     = 0.2  (minimum height/width ratio)
 *   timelineContentMargin = 0.01 (epsilon padding as fraction of parent width)
 *   timelineHeightRate    = 0.4  (default child height = 40% of parent)
 */

import { TimeCanvasTimeline, TimeCanvasInfodot } from './time-types';
import { TimeMapper, CANVAS_WIDTH, CANVAS_HEIGHT } from './time-mapper';

// ─────────────────────────────────────────────────────────────────────────────
// Constants (mirroring ChronoZoom settings.js)
// ─────────────────────────────────────────────────────────────────────────────

const TIMELINE_HEADER_SIZE   = 1 / 9;          // ~0.111
const TIMELINE_HEADER_MARGIN = 1 / 12;         // ~0.083
const HEADER_PERCENT = TIMELINE_HEADER_SIZE + 2 * TIMELINE_HEADER_MARGIN; // ~0.278
const TIMELINE_MIN_ASPECT    = 0.2;            // height/width floor
const TIMELINE_CONTENT_MARGIN = 0.01;          // heightEps = parentWidth * this
// default child height fraction when no `height` field is specified: 0.4 (40% of parent)

// ─────────────────────────────────────────────────────────────────────────────
// Output types
// ─────────────────────────────────────────────────────────────────────────────

/** Infodot after layout — all coords are virtual canvas units */
export interface PositionedInfodot {
  source: TimeCanvasInfodot;
  /** Center X in virtual space */
  cx: number;
  /** Center Y in virtual space */
  cy: number;
  /** Visual radius in virtual space */
  radius: number;
  /** Bounding half-size used for layout (= exhibitSize / 2) */
  halfSize: number;
}

/** Timeline after layout — all coords are virtual canvas units */
export interface PositionedTimeline {
  source: TimeCanvasTimeline;
  /** Left edge in virtual space */
  x: number;
  /** Top edge in virtual space */
  y: number;
  width: number;
  height: number;
  children: PositionedTimeline[];
  infodots: PositionedInfodot[];
  /** Depth in the tree (root = 0) */
  depth: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal working node (mutable, pre-Arrange)
// ─────────────────────────────────────────────────────────────────────────────

interface WorkNode {
  source: TimeCanvasTimeline;
  left: number;   // virtual X left
  right: number;  // virtual X right
  width: number;
  height: number; // computed during layout phase
  realHeight: number;
  realY: number;  // relative Y within parent's content band (pre-Arrange)
  heightEps: number;
  heightPercent: number | null; // source.height / 100, or null
  children: WorkNode[];
  infodots: WorkInfodot[];
  exhibitSize: number; // final infodot bounding size after shrink passes
  depth: number;
}

interface WorkInfodot {
  source: TimeCanvasInfodot;
  x: number;     // virtual X center
  left: number;  // x - exhibitSize/2
  right: number; // x + exhibitSize/2
  realY: number; // top of bounding square (pre-Arrange)
  realHeight: number; // = exhibitSize
  size: number;  // current exhibitSize (updated per shrink pass)
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 1 — Prepare
// ─────────────────────────────────────────────────────────────────────────────

function prepareNode(
  tl: TimeCanvasTimeline,
  mapper: TimeMapper,
  depth: number
): WorkNode {
  const left  = mapper.toVirtualX(tl.start);
  const right = mapper.toVirtualX(tl.end);
  const width = right - left;

  const infodots: WorkInfodot[] = (tl.infodots ?? []).map(dot => {
    const x = mapper.toVirtualX(dot.time);
    return {
      source: dot,
      x,
      left: x,  // will be updated once exhibitSize is known
      right: x,
      realY: 0,
      realHeight: 0,
      size: 0,
    };
  });

  const children = (tl.timelines ?? []).map(child =>
    prepareNode(child, mapper, depth + 1)
  );

  return {
    source: tl,
    left,
    right,
    width,
    height: 0,
    realHeight: 0,
    realY: 0,
    heightEps: 0,  // set during layout relative to parent width
    heightPercent: tl.height != null ? tl.height / 100 : null,
    children,
    infodots,
    exhibitSize: 0,
    depth,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 — LayoutTimeline (bottom-up)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Free-segment stacking algorithm (adapted from ChronoZoom PositionContent).
 *
 * For each element (in order), find all already-placed elements whose
 * horizontal range overlaps, build the occupied Y intervals, then sweep to
 * find the first free gap that fits. Falls back to stacking above everything.
 */
function positionContent(
  elements: Array<{ left: number; right: number; realY: number; realHeight: number }>
): void {
  const arranged: Array<{ left: number; right: number; realY: number; realHeight: number }> = [];

  for (const el of elements) {
    // Collect occupied intervals from horizontally-overlapping placed elements
    const usedY: Array<{ bottom: number; top: number }> = [];
    for (const ael of arranged) {
      const overlaps = !(el.left >= ael.right || ael.left >= el.right);
      if (overlaps) {
        usedY.push({ bottom: ael.realY, top: ael.realY + ael.realHeight });
      }
    }

    let y = 0;

    if (usedY.length > 0) {
      // Build sorted endpoint list
      interface Pt { type: 'bottom' | 'top'; value: number }
      const pts: Pt[] = [];
      for (const seg of usedY) {
        pts.push({ type: 'bottom', value: seg.bottom });
        pts.push({ type: 'top',    value: seg.top    });
      }
      // Add a sentinel at y=0
      pts.push({ type: 'bottom', value: 0 });
      pts.push({ type: 'top',    value: 0 });

      pts.sort((a, b) => a.value - b.value);

      // Sweep to find free segments
      const freeSegs: Array<{ bottom: number; top: number }> = [];
      let depth = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        if (pts[i].type === 'top') depth++;
        else                       depth--;
        if (depth === 0 && pts[i + 1].type === 'bottom') {
          freeSegs.push({ bottom: pts[i].value, top: pts[i + 1].value });
        }
      }

      let placed = false;
      for (const seg of freeSegs) {
        if (seg.top - seg.bottom >= el.realHeight) {
          y = seg.bottom;
          placed = true;
          break;
        }
      }

      if (!placed) {
        // Stack above everything
        y = pts[pts.length - 1].value;
      }
    }

    el.realY = y;
    arranged.push(el);
  }
}

/**
 * Main recursive sizing + stacking pass (adapts LayoutTimeline from layout.js).
 *
 * @param node       The node being laid out
 * @param parentWidth Width of the parent timeline (0 for root)
 * @param knownHeight Parent height if known (used for percentage-based children)
 */
function layoutNode(node: WorkNode, parentWidth: number, knownHeight: number | null): void {
  node.heightEps = parentWidth * TIMELINE_CONTENT_MARGIN;

  // ── Pre-size children with known heights ──────────────────────────────────
  for (const child of node.children) {
    if (child.heightPercent !== null && knownHeight !== null) {
      // Percentage of current node's height (which may itself still be unknown)
      // We pass the current node's known height (may be 0 at this stage)
    }
    layoutNode(child, node.width, node.height > 0 ? node.height : null);
  }

  // ── Determine this node's height ─────────────────────────────────────────
  if (node.height === 0) {
    if (node.children.length > 0) {
      // Find the scale coefficient from the most height-hungry percentage child
      let scaleCoef = 0;
      for (const child of node.children) {
        if (child.heightPercent !== null && child.height > 0) {
          const localScale = child.height / child.heightPercent;
          if (localScale > scaleCoef) scaleCoef = localScale;
        }
      }
      if (scaleCoef > 0) {
        node.height = scaleCoef;
      }
    }
    // Floor at minimum aspect
    const minHeight = node.width * TIMELINE_MIN_ASPECT;
    if (node.height < minHeight) node.height = minHeight;
  }

  // ── Apply percentage-based heights now that parent height is known ────────
  for (const child of node.children) {
    if (child.heightPercent !== null && node.height > 0) {
      const pct = child.heightPercent;
      child.height = Math.min(
        node.height * pct,
        child.width * TIMELINE_MIN_ASPECT
      );
      if (child.height === 0) {
        child.height = node.height * pct;
      }
    }
    // Recurse again to finalise any children whose height was now determined
    layoutNode(child, node.width, node.height);
  }

  // ── Compute exhibitSize and infodot bounding boxes ────────────────────────
  let exhibitSize = node.width / 20;
  const minExhibitSize = node.width / 40;

  // Build content list for stacking: children + infodots interleaved
  const runLayout = (eSz: number) => {
    for (const dot of node.infodots) {
      dot.size = eSz;
      dot.realHeight = eSz;
      dot.left  = dot.x - eSz / 2;
      dot.right = dot.x + eSz / 2;
      // Clamp to parent horizontal bounds
      if (dot.left < node.left) {
        dot.left  = node.left;
        dot.right = node.left + eSz;
      } else if (dot.right > node.right) {
        dot.right = node.right;
        dot.left  = node.right - eSz;
      }
      dot.realY = 0;
    }

    for (const child of node.children) {
      child.realY = 0;
    }

    // Reset realY before each layout pass
    node.children.forEach(c => { c.realY = 0; });
    node.infodots.forEach(d  => { d.realY = 0; });

    // Stack children and infodots together using free-segment algorithm
    positionContent([...node.children, ...node.infodots] as Array<{
      left: number; right: number; realY: number; realHeight: number
    }>);

    // Compute content bounding box max
    let maxY = 0;
    for (const c of node.children) {
      const bot = c.realY + c.height + 2 * c.heightEps;
      if (bot > maxY) maxY = bot;
    }
    for (const d of node.infodots) {
      const bot = d.realY + d.size;
      if (bot > maxY) maxY = bot;
    }
    return maxY;
  };

  // First pass
  let contentMax = runLayout(exhibitSize);

  // Scale up total height to account for header band
  let requiredHeight = contentMax / (1 - HEADER_PERCENT);

  // Shrink infodots if they overflow a fixed-height node
  if (node.height > 0 && node.infodots.length > 0) {
    while (requiredHeight > node.height && exhibitSize > minExhibitSize) {
      exhibitSize /= 1.5;
      contentMax   = runLayout(exhibitSize);
      requiredHeight = contentMax / (1 - HEADER_PERCENT);
    }
  }

  // If height still not determined, use content bounding box
  if (node.height === 0) {
    node.height = Math.max(node.width * TIMELINE_MIN_ASPECT, requiredHeight);
  } else if (requiredHeight > node.height) {
    // Content overflows: expand
    node.height = requiredHeight;
  }

  node.exhibitSize = exhibitSize;
  node.realHeight  = node.height + 2 * node.heightEps;

  // Normalise realY so the top of the content band starts at 0
  const minRealY = Math.min(
    0,
    ...node.children.map(c => c.realY),
    ...node.infodots.map(d => d.realY)
  );
  if (minRealY < 0) {
    for (const c of node.children) c.realY -= minRealY;
    for (const d of node.infodots)  d.realY -= minRealY;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3 — Arrange (top-down absolute coords)
// ─────────────────────────────────────────────────────────────────────────────

function arrangeNode(
  node: WorkNode,
  parentX: number,
  parentY: number
): PositionedTimeline {
  const x = node.left + parentX;
  const y = parentY + node.realY + node.heightEps;

  // Clamp height (CZ's Arrange clamp)
  const minH = node.width / 20;
  const maxH = node.width * 15;
  const height = Math.max(minH, Math.min(maxH, node.height));

  // Place infodot centers
  const infodots: PositionedInfodot[] = node.infodots.map(d => {
    const radius = 0.8 * node.exhibitSize / 2;
    return {
      source: d.source,
      cx: d.x,
      cy: y + d.realY + d.size / 2,
      radius,
      halfSize: d.size / 2,
    };
  });

  // Recurse into children (their realY is relative to this node's content top)
  const children: PositionedTimeline[] = node.children.map(child =>
    arrangeNode(child, 0, y)
  );

  return { source: node.source, x, y, width: node.width, height, children, infodots, depth: node.depth };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runs the full three-phase layout and returns the positioned tree.
 *
 * The root timeline is placed at:
 *   x = -CANVAS_WIDTH/2, y = -CANVAS_HEIGHT/2
 *   width = CANVAS_WIDTH, height = CANVAS_HEIGHT
 */
export function layoutTimeCanvas(
  root: TimeCanvasTimeline,
  mapper: TimeMapper
): PositionedTimeline {
  // Phase 1 — Prepare
  const workRoot = prepareNode(root, mapper, 0);

  // Force root dimensions
  workRoot.height    = CANVAS_HEIGHT;
  workRoot.realY     = 0;
  workRoot.heightEps = 0;

  // Phase 2 — Layout (bottom-up)
  // Root children get parentWidth = CANVAS_WIDTH
  for (const child of workRoot.children) {
    if (child.heightPercent !== null) {
      child.height = CANVAS_HEIGHT * child.heightPercent;
    }
    layoutNode(child, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  // Stack root's direct children and infodots
  const rootExhibitSize = CANVAS_WIDTH / 20;
  for (const d of workRoot.infodots) {
    d.size       = rootExhibitSize;
    d.realHeight = rootExhibitSize;
    d.left       = d.x - rootExhibitSize / 2;
    d.right      = d.x + rootExhibitSize / 2;
    d.realY      = 0;
  }
  positionContent([...workRoot.children, ...workRoot.infodots] as Array<{
    left: number; right: number; realY: number; realHeight: number
  }>);
  workRoot.exhibitSize = rootExhibitSize;

  // Phase 3 — Arrange (top-down)
  const rootX = -CANVAS_WIDTH / 2;
  const rootY = -CANVAS_HEIGHT / 2;

  // workRoot's realY starts at 0; apply root offset via arrangeNode
  workRoot.realY     = 0;
  workRoot.heightEps = 0;
  // We call arrangeNode with the offset baked in:
  const positioned = arrangeNode(workRoot, rootX - workRoot.left, rootY);

  return positioned;
}
