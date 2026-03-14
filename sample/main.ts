/**
 * ChronoCanvas Sample Application
 *
 * Nested images: Winter landscape with Milkmaid and Melencolia embedded.
 * All 6 region buttons visible. Elliptical zoom, mouse wheel, pan.
 */

import {
  ChronoCanvas,
  TiledImageSource,
  SingleImageSource,
  CompositeContentSource
} from 'chronocanvas';

// ============================================================================
// CONFIGURATION
// ============================================================================

const avercampConfig = {
  baseUrl: 'https://micrio.rijksmuseum.nl/aXnzA/0/',
  rows: 4,
  cols: 7,
  tileWidth: 1024,
  tileHeight: 1024,
  urlPattern: '{x}-{y}.jpg'
};

const durerConfig = {
  baseUrl: 'https://rijks-micrio.azureedge.net/zWsdM/0/',
  rows: 5,
  cols: 4,
  tileWidth: 1024,
  tileHeight: 1024,
  urlPattern: '{x}-{y}.jpg'
};

const milkmaidUrl = 'https://micrio.rijksmuseum.nl/QkOGy/2/0-0.jpg';

// Placements in global virtual space (winter = 7168×4096, centered at origin)
const winterPlacement = { x: -3584, y: -2048, width: 7168, height: 4096 };
const milkmaidPlacement = { x: 2275, y: 624, width: 49, height: 18 };
// Melencolia fitted into region left:2296.42, right:2296.69, top:632.88, bottom:632.98
const durerPlacement = {
  x: 2296.422442185373,
  y: 632.8830368629516,
  width: 2296.6939053447354 - 2296.422442185373,
  height: 632.9846867192263 - 632.8830368629516
};

// Zoom presets (Avercamp already in global space; Milkmaid/Dürer in child local)
const avercampPresets = [
  { label: 'Zoom to Ice Skaters', centerX: 652, centerY: 517, scale: 0.9075 },
  { label: 'Zoom to Ice Hole', centerX: -1955, centerY: 849, scale: 0.5118 }
];

const milkmaidPresets = [
  { label: 'Zoom to Milk Stream', centerX: -103, centerY: 269, scale: 0.2276 },
  { label: 'Zoom to face', centerX: 179, centerY: -175, scale: 0.3759 }
];

const durerPresets = [
  { label: 'Zoom to Magic Square', centerX: 1417, centerY: -1433, scale: 0.9667 },
  { label: 'Zoom to Polyhedron', centerX: -1131, centerY: -135, scale: 2.3307 }
];

// ============================================================================
// COORDINATE CONVERSION HELPERS
// ============================================================================

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getActualDrawRect(childBounds: Bounds, placement: Bounds): Bounds {
  const childAspect = childBounds.width / childBounds.height;
  const placementAspect = placement.width / placement.height;
  let aw: number, ah: number, ax: number, ay: number;
  if (childAspect > placementAspect) {
    aw = placement.width;
    ah = placement.width / childAspect;
    ax = placement.x;
    ay = placement.y + (placement.height - ah) / 2;
  } else {
    ah = placement.height;
    aw = placement.height * childAspect;
    ax = placement.x + (placement.width - aw) / 2;
    ay = placement.y;
  }
  return { x: ax, y: ay, width: aw, height: ah };
}

function childToComposite(
  childCenter: { centerX: number; centerY: number },
  childBounds: Bounds,
  actualRect: Bounds
): { centerX: number; centerY: number } {
  const nx = (childCenter.centerX - childBounds.x) / childBounds.width;
  const ny = (childCenter.centerY - childBounds.y) / childBounds.height;
  return {
    centerX: actualRect.x + nx * actualRect.width,
    centerY: actualRect.y + ny * actualRect.height
  };
}

function childScaleToGlobal(
  childScale: number,
  childBounds: Bounds,
  actualRect: Bounds
): number {
  return childScale * (actualRect.width / childBounds.width);
}

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const container = document.getElementById('canvas-container')!;
const loading = document.getElementById('loading')!;
const btnFull = document.getElementById('btn-full')!;
const btnZoom1 = document.getElementById('btn-zoom-1')!;
const btnZoom2 = document.getElementById('btn-zoom-2')!;
const btnZoom3 = document.getElementById('btn-zoom-3')!;
const btnZoom4 = document.getElementById('btn-zoom-4')!;
const btnZoom5 = document.getElementById('btn-zoom-5')!;
const btnZoom6 = document.getElementById('btn-zoom-6')!;

// ============================================================================
// CHRONOCANVAS
// ============================================================================

const canvas = new ChronoCanvas(container, {
  ellipticalZoomDuration: 9000,
  ellipticalZoomZoomoutFactor: 0.6,
  zoomLevelFactor: 1.3
});

(window as any).canvas = canvas;

// ============================================================================
// INITIALIZATION
// ============================================================================

async function init(): Promise<void> {
  loading.style.display = 'block';
  loading.textContent = 'Loading...';

  const winterSource = new TiledImageSource(avercampConfig, winterPlacement);
  const durerSource = new TiledImageSource(durerConfig, durerPlacement);

  const milkmaidImg = new Image();
  milkmaidImg.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    milkmaidImg.onload = () => resolve();
    milkmaidImg.onerror = () => reject(new Error('Failed to load Milkmaid'));
    milkmaidImg.src = milkmaidUrl;
  });

  const milkmaidSource = new SingleImageSource(milkmaidImg, milkmaidPlacement);
  const composite = new CompositeContentSource([
    winterSource,
    milkmaidSource,
    durerSource
  ]);

  const checkReady = () => {
    if (composite.isReady()) {
      loading.style.display = 'none';
      canvas.setContentSource(composite);
      canvas.fitToView(true);
      setupZoomButtons(milkmaidImg, composite);
    } else {
      setTimeout(checkReady, 200);
    }
  };
  checkReady();
}

function setupZoomButtons(
  milkmaidImg: HTMLImageElement,
  _composite: CompositeContentSource
): void {
  const milkmaidChildBounds = {
    x: -milkmaidImg.naturalWidth / 2,
    y: -milkmaidImg.naturalHeight / 2,
    width: milkmaidImg.naturalWidth,
    height: milkmaidImg.naturalHeight
  };
  const durerChildBounds = {
    x: (-durerConfig.cols * durerConfig.tileWidth) / 2,
    y: (-durerConfig.rows * durerConfig.tileHeight) / 2,
    width: durerConfig.cols * durerConfig.tileWidth,
    height: durerConfig.rows * durerConfig.tileHeight
  };

  const milkmaidActual = getActualDrawRect(milkmaidChildBounds, milkmaidPlacement);
  const durerActual = getActualDrawRect(durerChildBounds, durerPlacement);

  btnFull.onclick = () => canvas.fitToView();

  btnZoom1.textContent = avercampPresets[0].label;
  btnZoom1.onclick = () =>
    canvas.zoomTo({
      centerX: avercampPresets[0].centerX,
      centerY: avercampPresets[0].centerY,
      scale: avercampPresets[0].scale
    });

  btnZoom2.textContent = avercampPresets[1].label;
  btnZoom2.onclick = () =>
    canvas.zoomTo({
      centerX: avercampPresets[1].centerX,
      centerY: avercampPresets[1].centerY,
      scale: avercampPresets[1].scale
    });

  btnZoom3.textContent = milkmaidPresets[0].label;
  btnZoom3.onclick = () => {
    const p = childToComposite(
      { centerX: milkmaidPresets[0].centerX, centerY: milkmaidPresets[0].centerY },
      milkmaidChildBounds,
      milkmaidActual
    );
    const s = childScaleToGlobal(
      milkmaidPresets[0].scale,
      milkmaidChildBounds,
      milkmaidActual
    );
    canvas.zoomTo({ centerX: p.centerX, centerY: p.centerY, scale: s });
  };

  btnZoom4.textContent = milkmaidPresets[1].label;
  btnZoom4.onclick = () => {
    const p = childToComposite(
      { centerX: milkmaidPresets[1].centerX, centerY: milkmaidPresets[1].centerY },
      milkmaidChildBounds,
      milkmaidActual
    );
    const s = childScaleToGlobal(
      milkmaidPresets[1].scale,
      milkmaidChildBounds,
      milkmaidActual
    );
    canvas.zoomTo({ centerX: p.centerX, centerY: p.centerY, scale: s });
  };

  btnZoom5.textContent = durerPresets[0].label;
  btnZoom5.onclick = () => {
    const p = childToComposite(
      { centerX: durerPresets[0].centerX, centerY: durerPresets[0].centerY },
      durerChildBounds,
      durerActual
    );
    const s = childScaleToGlobal(
      durerPresets[0].scale,
      durerChildBounds,
      durerActual
    );
    canvas.zoomTo({ centerX: p.centerX, centerY: p.centerY, scale: s });
  };

  btnZoom6.textContent = durerPresets[1].label;
  btnZoom6.onclick = () => {
    const p = childToComposite(
      { centerX: durerPresets[1].centerX, centerY: durerPresets[1].centerY },
      durerChildBounds,
      durerActual
    );
    const s = childScaleToGlobal(
      durerPresets[1].scale,
      durerChildBounds,
      durerActual
    );
    canvas.zoomTo({ centerX: p.centerX, centerY: p.centerY, scale: s });
  };
}

window.addEventListener('resize', () => canvas.updateViewport());

init().catch((err) => {
  console.error(err);
  loading.textContent = 'Error loading images';
});

console.log('ChronoCanvas Nested Images Sample');
console.log('- Use buttons to zoom to details');
console.log('- Mouse wheel: Zoom in/out');
console.log('- Click and drag: Pan');
