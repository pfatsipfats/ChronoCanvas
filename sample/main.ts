/**
 * ChronoCanvas Sample Application
 * 
 * Demonstrates elliptical zoom navigation on Dürer's Melencolia I engraving.
 * Features:
 * - Smooth elliptical zoom animations
 * - Mouse wheel zoom
 * - Click and drag panning
 * - Preset zoom views to interesting details
 */

import { ChronoCanvas } from 'chronocanvas';

// Get DOM elements
const container = document.getElementById('canvas-container')!;
const loading = document.getElementById('loading')!;
const btnFull = document.getElementById('btn-full')!;
const btnMagicSquare = document.getElementById('btn-magic-square')!;
const btnPolyhedron = document.getElementById('btn-polyhedron')!;

// Create ChronoCanvas instance with custom settings
const canvas = new ChronoCanvas(container, {
  ellipticalZoomDuration: 2500,  // Slightly faster than default
  ellipticalZoomZoomoutFactor: 0.6,  // More dramatic zoom-out
  zoomLevelFactor: 1.3,  // Gentler wheel zoom
});

// Load Dürer's Melencolia I from Christie's
const img = new Image();
img.crossOrigin = 'anonymous'; // For CORS if needed

img.onload = () => {
  // Hide loading message
  loading.style.display = 'none';
  
  // Set image and fit to view
  canvas.setContent(img);
  canvas.fitToView(true); // Immediate, no animation on first load
  
  console.log('Image loaded:', img.naturalWidth, 'x', img.naturalHeight);
};

img.onerror = () => {
  loading.textContent = 'Failed to load image. Using fallback...';
  
  // If the Christie's URL fails, try a direct link or show error
  console.error('Failed to load image from primary source');
};

// Dürer's Melencolia I 
img.src = 'https://rijks-micrio.azureedge.net/zWsdM/1/0-0.jpg';

// Button event handlers

/**
 * Full View - Shows the entire engraving
 */
btnFull.onclick = () => {
  canvas.fitToView();
};

/**
 * Magic Square - Zooms to the famous 4x4 magic square in the upper right
 * The magic square is a 4x4 grid where every row, column, and diagonal sums to 34.
 * It also contains the date 1514 in the bottom middle cells.
 */
btnMagicSquare.onclick = () => {
  // Magic square is in the upper right portion of the engraving
  // These coordinates are approximate based on the composition
  canvas.zoomTo({
    centerX: 250,   // Right side
    centerY: -200,  // Upper area
    scale: 0.02     // Zoomed in quite close
  });
};

/**
 * Polyhedron - Zooms to the mysterious geometric solid on the left
 * Known as "Dürer's solid", this truncated rhombohedron has puzzled
 * scholars for centuries.
 */
btnPolyhedron.onclick = () => {
  // Polyhedron is on the left side, slightly below center
  canvas.zoomTo({
    centerX: -300,  // Left side
    centerY: 100,   // Slightly below center
    scale: 0.03     // Moderately zoomed
  });
};

// Handle window resize
window.addEventListener('resize', () => {
  canvas.updateViewport();
});

// Log keyboard shortcuts for advanced users
console.log('ChronoCanvas Sample - Keyboard Tips:');
console.log('- Mouse wheel: Zoom in/out');
console.log('- Click and drag: Pan the image');
console.log('- Buttons: Jump to interesting details');
