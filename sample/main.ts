/**
 * ChronoCanvas Sample Application
 * 
 * Multi-image gallery featuring Dutch Golden Age paintings with elliptical zoom.
 * Features:
 * - Three different artworks (single image + tiled images)
 * - Dynamic zoom buttons contextual to each painting
 * - Smooth elliptical zoom animations
 * - Mouse wheel zoom and click-drag panning
 */

import { ChronoCanvas, TiledImageSource, SingleImageSource } from 'chronocanvas';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ZoomPreset {
  label: string;
  centerX: number;
  centerY: number;
  scale: number;
}

interface TiledImageConfig {
  baseUrl: string;
  rows: number;
  cols: number;
  tileWidth: number;
  tileHeight: number;
  urlPattern: string;
}

interface SingleImageConfig {
  url: string;
}

interface ImageConfig {
  id: string;
  name: string;
  artist: string;
  year: string;
  type: 'single' | 'tiled';
  source: SingleImageConfig | TiledImageConfig;
  zoomPresets: ZoomPreset[];
}

// ============================================================================
// IMAGE CONFIGURATIONS
// ============================================================================

const images: ImageConfig[] = [
  {
    id: 'milkmaid',
    name: 'The Milkmaid',
    artist: 'Johannes Vermeer',
    year: 'c. 1660',
    type: 'single',
    source: {
      url: 'https://micrio.rijksmuseum.nl/QkOGy/2/0-0.jpg'
    },
    zoomPresets: [
      {
        label: 'Zoom to Milk Stream',
        centerX: -103,
        centerY: 269,
        scale: 0.2276
      },
      {
        label: 'Zoom to face',
        centerX: 179,
        centerY: -175,
        scale: 0.3759
      }
    ]
  },
  {
    id: 'durer',
    name: 'Melencolia I',
    artist: 'Albrecht Dürer',
    year: '1514',
    type: 'tiled',
    source: {
      baseUrl: 'https://rijks-micrio.azureedge.net/zWsdM/0/',
      rows: 5,
      cols: 4,
      tileWidth: 1024,
      tileHeight: 1024,
      urlPattern: '{x}-{y}.jpg'
    },
    zoomPresets: [
      {
        label: 'Zoom to Magic Square',
        centerX: 1417, 
        centerY: -1433,
        scale:  0.9667
      },
      {
        label: 'Zoom to Polyhedron',
        centerX: -1131,
        centerY: -135,
        scale: 2.3307
      }
    ]
  },
  {
    id: 'avercamp',
    name: 'Winter Landscape with Ice Skaters',
    artist: 'Hendrick Avercamp',
    year: 'c. 1608',
    type: 'tiled',
    source: {
      baseUrl: 'https://micrio.rijksmuseum.nl/aXnzA/0/',
      rows: 4,
      cols: 7,
      tileWidth: 1024,
      tileHeight: 1024,
      urlPattern: '{x}-{y}.jpg'
    },
    zoomPresets: [
      {
        label: 'Zoom to Ice Skaters',
        centerX: 652,
        centerY: 517,
        scale: 0.9075
      },
      {
        label: 'Zoom to Ice Hole',
        centerX: -1955,    
        centerY: 849,
        scale: 0.5118
      }
    ]
  }
];

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const container = document.getElementById('canvas-container')!;
const loading = document.getElementById('loading')!;
const imageSelector = document.getElementById('image-selector') as HTMLSelectElement;
const btnFull = document.getElementById('btn-full')!;
const btnZoom1 = document.getElementById('btn-zoom-1')!;
const btnZoom2 = document.getElementById('btn-zoom-2')!;

// ============================================================================
// CHRONOCANVAS INSTANCE
// ============================================================================

const canvas = new ChronoCanvas(container, {
  ellipticalZoomDuration: 9000,
  ellipticalZoomZoomoutFactor: 0.6,
  zoomLevelFactor: 1.3,
});

// Expose canvas to window for debugging in browser console
(window as any).canvas = canvas;

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

let currentImage: ImageConfig | null = null;
let currentSource: TiledImageSource | SingleImageSource | null = null;
let loadingCheckInterval: number | null = null;

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Updates the zoom button labels and handlers based on current image
 */
function updateZoomButtons(zoomPresets: ZoomPreset[]): void {
  if (zoomPresets.length >= 1) {
    btnZoom1.textContent = zoomPresets[0].label;
    btnZoom1.style.display = 'block';
    btnZoom1.onclick = () => {
      canvas.zoomTo({
        centerX: zoomPresets[0].centerX,
        centerY: zoomPresets[0].centerY,
        scale: zoomPresets[0].scale
      });
    };
  } else {
    btnZoom1.style.display = 'none';
  }

  if (zoomPresets.length >= 2) {
    btnZoom2.textContent = zoomPresets[1].label;
    btnZoom2.style.display = 'block';
    btnZoom2.onclick = () => {
      canvas.zoomTo({
        centerX: zoomPresets[1].centerX,
        centerY: zoomPresets[1].centerY,
        scale: zoomPresets[1].scale
      });
    };
  } else {
    btnZoom2.style.display = 'none';
  }
}

/**
 * Loads an image configuration into the canvas
 */
async function loadImage(config: ImageConfig): Promise<void> {
  // Clear any existing loading check
  if (loadingCheckInterval !== null) {
    clearInterval(loadingCheckInterval);
    loadingCheckInterval = null;
  }

  // Show loading indicator
  loading.style.display = 'block';
  loading.textContent = `Loading ${config.name}...`;

  // Clean up previous source if exists
  if (currentSource) {
    currentSource.destroy();
    currentSource = null;
  }

  currentImage = config;

  try {
    if (config.type === 'tiled') {
      // Load tiled image source
      const tiledConfig = config.source as TiledImageConfig;
      console.log(`Loading tiled image: ${config.name} (${tiledConfig.cols}x${tiledConfig.rows} grid)`);
      
      const tiledSource = new TiledImageSource(tiledConfig);
      currentSource = tiledSource;
      canvas.setContentSource(tiledSource);
      canvas.fitToView(true);

      // Monitor loading progress
      loadingCheckInterval = window.setInterval(() => {
        if (tiledSource.isReady()) {
          loading.style.display = 'none';
          console.log('All tiles loaded successfully');
          if (loadingCheckInterval !== null) {
            clearInterval(loadingCheckInterval);
            loadingCheckInterval = null;
          }
        }
      }, 500);
    } else {
      // Load single image
      const singleConfig = config.source as SingleImageConfig;
      console.log(`Loading single image: ${config.name}`);
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          loading.style.display = 'none';
          const singleSource = new SingleImageSource(img);
          currentSource = singleSource;
          canvas.setContentSource(singleSource);
          canvas.fitToView(true);
          console.log('Single image loaded:', img.naturalWidth, 'x', img.naturalHeight);
          resolve();
        };
        
        img.onerror = () => {
          loading.textContent = `Failed to load ${config.name}`;
          console.error('Failed to load single image');
          reject(new Error('Failed to load image'));
        };
        
        img.src = singleConfig.url;
      });
    }

    // Update zoom buttons for this image
    updateZoomButtons(config.zoomPresets);
  } catch (error) {
    console.error('Error loading image:', error);
    loading.textContent = 'Error loading image';
  }
}

/**
 * Handles image selection change
 */
function handleImageChange(imageId: string): void {
  const config = images.find(img => img.id === imageId);
  if (config) {
    loadImage(config);
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

// Image selector change
imageSelector.addEventListener('change', () => {
  handleImageChange(imageSelector.value);
});

// Full view button (always available)
btnFull.onclick = () => {
  canvas.fitToView();
};

// Window resize
window.addEventListener('resize', () => {
  canvas.updateViewport();
});

// ============================================================================
// INITIALIZATION
// ============================================================================

// Load the default selected image on startup
const defaultImageId = imageSelector.value;
handleImageChange(defaultImageId);

console.log('ChronoCanvas Multi-Image Sample');
console.log('- Use dropdown to switch between artworks');
console.log('- Mouse wheel: Zoom in/out');
console.log('- Click and drag: Pan the image');
console.log('- Buttons: Jump to interesting details');
