/**
 * Animation module - implements elliptical zoom animation.
 * Ported from ChronoZoom's viewport-animation.js with TypeScript.
 */

import { IAnimation } from './types';
import { VisibleRegion2d, Viewport2d } from './viewport';
import { ChronoCanvasOptions } from './types';

/**
 * Global animation ID counter for unique identification
 */
let globalAnimationID = 1;

/**
 * Hyperbolic cosine function
 * @param x - Input value
 * @returns cosh(x)
 */
function cosh(x: number): number {
  return (Math.exp(x) + Math.exp(-x)) / 2;
}

/**
 * Hyperbolic sine function
 * @param x - Input value
 * @returns sinh(x)
 */
function sinh(x: number): number {
  return (Math.exp(x) - Math.exp(-x)) / 2;
}

/**
 * Hyperbolic tangent function
 * @param x - Input value
 * @returns tanh(x)
 */
function tanh(x: number): number {
  return sinh(x) / cosh(x);
}

/**
 * Easing function for smooth acceleration/deceleration
 * Maps [0,1] -> [0,1] with smooth in/out curve
 * @param t - Progress value in range [0, 1]
 * @returns Eased value in range [0, 1]
 */
function animationEase(t: number): number {
  return -2 * t * t * t + 3 * t * t;
}

/**
 * Velocity-based pan and zoom animation with inertia.
 * 
 * Unlike EllipticalZoom (which is time-based with a fixed path), PanZoomAnimation:
 * - Speed is proportional to the distance to the target
 * - Supports dynamic target updates during animation (for continuous gestures)
 * - Creates smooth inertia effect as viewport approaches target
 * - Can be configured with different velocities for pan vs zoom gestures
 * 
 * Ported from ChronoZoom's PanZoomAnimation for gesture-driven interactions.
 * 
 * @remarks
 * This animation continues after user releases the gesture, providing natural
 * deceleration. The target viewport can be updated mid-animation when the user
 * continues gesturing.
 */
export class PanZoomAnimation implements IAnimation {
  public readonly id: number;
  private _isActive: boolean = true;
  
  // Animation state
  private velocity: number = 0.001;
  private prevFrameTime: number;
  
  // Start and target states
  private startViewport: Viewport2d;
  private estimatedEndViewport: Viewport2d | null = null;
  
  // Tracking for smooth interpolation
  private previousFrameViewport: Viewport2d;
  private previousFrameCenterInSC: { x: number; y: number };
  private startCenterInSC: { x: number; y: number };
  private endCenterInSC: { x: number; y: number } | null = null;
  
  // Movement direction (normalized)
  private direction: { X: number; Y: number } = { X: 0, Y: 0 };
  private pathLen: number = 0;
  
  // Distance threshold for completion
  private readonly distanceThreshold = 0.1;

  /**
   * Creates a pan/zoom animation with inertia
   * @param startViewport - Initial viewport state
   */
  constructor(startViewport: Viewport2d) {
    this.id = globalAnimationID++;
    this.prevFrameTime = Date.now();
    
    const startVisible = startViewport.visible;
    this.startViewport = new Viewport2d(
      startViewport.aspectRatio,
      startViewport.width,
      startViewport.height,
      new VisibleRegion2d(startVisible.centerX, startVisible.centerY, startVisible.scale)
    );
    
    this.previousFrameViewport = this.startViewport;
    this.startCenterInSC = this.startViewport.pointVirtualToScreen(
      startVisible.centerX,
      startVisible.centerY
    );
    this.previousFrameCenterInSC = { ...this.startCenterInSC };
  }

  get isActive(): boolean {
    return this._isActive;
  }

  /**
   * Sets the velocity multiplier for the animation
   * @param velocity - Velocity factor (typically 0.001-0.0025 range)
   */
  setVelocity(velocity: number): void {
    this.velocity = velocity;
  }

  /**
   * Updates the target viewport for this animation.
   * Allows dynamic updates during continuous gestures.
   * 
   * @param estimatedEndViewport - New target viewport state
   */
  setTargetViewport(estimatedEndViewport: Viewport2d): void {
    this.estimatedEndViewport = estimatedEndViewport;
    
    // Reset start viewport to previous frame (makes animation smooth during updates)
    const prevVis = this.previousFrameViewport.visible;
    this.startViewport = new Viewport2d(
      this.previousFrameViewport.aspectRatio,
      this.previousFrameViewport.width,
      this.previousFrameViewport.height,
      new VisibleRegion2d(prevVis.centerX, prevVis.centerY, prevVis.scale)
    );
    
    // Update coordinates in screen space
    this.startCenterInSC = this.startViewport.pointVirtualToScreen(
      prevVis.centerX,
      prevVis.centerY
    );
    this.previousFrameCenterInSC = { ...this.startCenterInSC };
    
    const estimatedVisible = this.estimatedEndViewport.visible;
    this.endCenterInSC = this.startViewport.pointVirtualToScreen(
      estimatedVisible.centerX,
      estimatedVisible.centerY
    );
    
    // Calculate movement direction
    this.direction = {
      X: this.endCenterInSC.x - this.startCenterInSC.x,
      Y: this.endCenterInSC.y - this.startCenterInSC.y
    };
    
    const dirX = this.direction.X;
    const dirY = this.direction.Y;
    this.pathLen = Math.sqrt(dirX * dirX + dirY * dirY);
    
    // Normalize direction or set to zero if target is very close
    if (this.pathLen < this.distanceThreshold) {
      this.direction.X = 0;
      this.direction.Y = 0;
      
      // Check if scale also matches
      if (estimatedVisible.scale === prevVis.scale) {
        this._isActive = false;
      }
    } else {
      // Normalize direction vector
      this.direction.X /= this.pathLen;
      this.direction.Y /= this.pathLen;
    }
  }

  /**
   * Produces the next viewport state for current frame
   * @param currentViewport - Current viewport state
   * @returns New visible region for this frame
   * 
   * @remarks
   * The animation is velocity-based: movement speed is proportional to
   * the distance remaining to the target. This creates a natural deceleration
   * as the viewport approaches the target position.
   */
  produceNextVisible(currentViewport: Viewport2d): VisibleRegion2d {
    if (!this.estimatedEndViewport) {
      // No target set yet, return current
      this._isActive = false;
      return currentViewport.visible;
    }
    
    const startVisible = this.startViewport.visible;
    
    // Calculate time delta
    const curTime = Date.now();
    const timeDiff = curTime - this.prevFrameTime;
    const k = this.velocity * timeDiff;
    
    // Calculate distance to target
    const dx = this.endCenterInSC!.x - this.previousFrameCenterInSC.x;
    const dy = this.endCenterInSC!.y - this.previousFrameCenterInSC.y;
    const curDist = Math.max(1.0, Math.sqrt(dx * dx + dy * dy));
    
    // Update position: move proportional to distance (creates deceleration)
    const prevFrameVisible = this.previousFrameViewport.visible;
    this.previousFrameCenterInSC.x += curDist * k * this.direction.X;
    this.previousFrameCenterInSC.y += curDist * k * this.direction.Y;
    
    // Update scale: interpolate toward target
    const updatedScale = prevFrameVisible.scale + 
      (this.estimatedEndViewport.visible.scale - prevFrameVisible.scale) * k;
    
    this.prevFrameTime = curTime;
    
    // Check if we've reached the target
    const dxFromStart = this.previousFrameCenterInSC.x - this.startCenterInSC.x;
    const dyFromStart = this.previousFrameCenterInSC.y - this.startCenterInSC.y;
    const distToStart = Math.sqrt(dxFromStart * dxFromStart + dyFromStart * dyFromStart);
    
    const scaleDistToStart = this.estimatedEndViewport.visible.scale - startVisible.scale;
    const scaleDistCurrent = updatedScale - startVisible.scale;
    
    // Stop if we've reached or passed the target
    if (distToStart >= this.pathLen || 
        Math.abs(scaleDistCurrent) > Math.abs(scaleDistToStart)) {
      this._isActive = false;
      return this.estimatedEndViewport.visible;
    }
    
    // Convert screen coordinates back to virtual coordinates
    const virtPoint = this.startViewport.pointScreenToVirtual(
      this.previousFrameCenterInSC.x,
      this.previousFrameCenterInSC.y
    );
    
    const updatedVisible = new VisibleRegion2d(
      virtPoint.x,
      virtPoint.y,
      updatedScale
    );
    
    // Update tracking for next frame
    this.previousFrameViewport = new Viewport2d(
      currentViewport.aspectRatio,
      currentViewport.width,
      currentViewport.height,
      updatedVisible
    );
    
    return updatedVisible;
  }
}

/**
 * Implements smooth "elliptical zoom" animation between two viewport states.
 * 
 * Based on the paper "Smooth and efficient zooming and panning" 
 * by Jarke J. van Wijk and Wim A.A. Nuij (2003).
 * 
 * Uses hyperbolic geometry to create an optimal camera path that:
 * - Zooms out smoothly when transitioning between distant regions
 * - Maintains visual context during navigation
 * - Feels natural and predictable to users
 * 
 * The algorithm calculates an optimal path through scale space that minimizes
 * the integral of velocity over time, resulting in smooth, efficient animations.
 * 
 * @see https://www.win.tue.nl/~vanwijk/zoompan.pdf
 * 
 * @remarks
 * Only calculates animation frames.
 * Implements IAnimation interface for flexibility.
 */
export class EllipticalZoom implements IAnimation {
  public readonly id: number;
  private _isActive: boolean = true;
  
  private readonly startTime: number;
  private readonly duration: number;
  
  // Animation parameters from the paper
  private readonly ro: number;
  private readonly u0: number;
  private readonly pathLen: number;
  private readonly r0: number;
  private readonly r1: number;
  private readonly S: number;
  
  // Pre-calculated optimization constants
  private readonly coshR0: number;
  private readonly sinhR0: number;
  private readonly uS: number;
  private readonly uSRatio: number;
  
  // Start and end points
  private readonly startPoint: { X: number; Y: number };
  private readonly endPoint: { X: number; Y: number };
  private readonly startScale: number;
  private readonly endScale: number;
  
  // Imprecision threshold for numerical stability
  private readonly imprecision = 0.0001;
  
  // Functions for calculating position and scale (may be overridden for degenerate cases)
  private xFunc: (s: number) => number;
  private yFunc: (s: number) => number;
  private scaleFunc: (s: number) => number;

  /**
   * Creates an elliptical zoom animation
   * @param startVisible - Initial viewport region
   * @param endVisible - Target viewport region
   * @param settings - Animation parameters (duration, zoom-out factor)
   * 
   * @example
   * ```typescript
   * const animation = new EllipticalZoom(
   *   new VisibleRegion2d(0, 0, 1.0),
   *   new VisibleRegion2d(1000, 500, 0.1),
   *   { ellipticalZoomDuration: 2000, ellipticalZoomZoomoutFactor: 0.5 }
   * );
   * ```
   */
  constructor(
    startVisible: VisibleRegion2d,
    endVisible: VisibleRegion2d,
    settings: Required<ChronoCanvasOptions>
  ) {
    this.id = globalAnimationID++;
    this.startTime = Date.now();
    
    this.startPoint = {
      X: startVisible.centerX,
      Y: startVisible.centerY
    };
    
    this.endPoint = {
      X: endVisible.centerX,
      Y: endVisible.centerY
    };
    
    this.startScale = startVisible.scale;
    this.endScale = endVisible.scale;
    
    // Calculate Euclidean distance between start and end points
    const xDiff = this.startPoint.X - this.endPoint.X;
    const yDiff = this.startPoint.Y - this.endPoint.Y;
    this.pathLen = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    
    // Zoom-out factor (ro in the paper)
    this.ro = 0.1 * settings.ellipticalZoomZoomoutFactor;
    this.u0 = 0;
    const u1 = this.pathLen;
    
    // Check if centers are the same (degenerate case)
    if (Math.abs(this.u0 - u1) > this.imprecision) {
      // Normal case: centers are different
      const uDiff = this.u0 - u1;
      
      // Calculate b0 and b1 from the paper's equations
      const b0 = (this.endScale * this.endScale - this.startScale * this.startScale + 
                  Math.pow(this.ro, 4) * uDiff * uDiff) / 
                 (2 * this.startScale * this.ro * this.ro * (-uDiff));
      
      const b1 = (this.endScale * this.endScale - this.startScale * this.startScale - 
                  Math.pow(this.ro, 4) * uDiff * uDiff) / 
                 (2 * this.endScale * this.ro * this.ro * (-uDiff));
      
      // Calculate r0 and r1 (arc-sinh approximation for numerical stability)
      this.r0 = Math.log(-b0 + Math.sqrt(b0 * b0 + 1));
      if (this.r0 === -Infinity) {
        this.r0 = -Math.log(2 * b0); // Taylor series approximation
      }
      
      this.r1 = Math.log(-b1 + Math.sqrt(b1 * b1 + 1));
      if (this.r1 === -Infinity) {
        this.r1 = -Math.log(2 * b1);
      }
      
      this.S = (this.r1 - this.r0) / this.ro;
      this.duration = settings.ellipticalZoomDuration / 300 * this.S;
      
      // Pre-calculate optimization constants
      this.coshR0 = cosh(this.r0);
      this.sinhR0 = sinh(this.r0);
      this.uS = this.u(this.S);
      this.uSRatio = this.pathLen / this.uS;
      
      // Set up normal calculation functions
      this.xFunc = (t: number) => {
        const s = t * this.S;
        const uVal = this.u(s);
        return this.startPoint.X + (this.endPoint.X - this.startPoint.X) / this.pathLen * uVal;
      };
      
      this.yFunc = (t: number) => {
        const s = t * this.S;
        const uVal = this.u(s);
        return this.startPoint.Y + (this.endPoint.Y - this.startPoint.Y) / this.pathLen * uVal;
      };
      
      this.scaleFunc = (t: number) => {
        const s = t * this.S;
        return this.startScale * cosh(this.r0) / cosh(this.ro * s + this.r0);
      };
    } else {
      // Degenerate case: same center, only scale changes
      const logScaleChange = Math.log(Math.abs(this.endScale - this.startScale)) + 10;
      if (logScaleChange < 0) {
        this._isActive = false;
      }
      
      let scaleDiff = 0.5;
      if (this.endScale !== 0 || this.startScale !== 0) {
        scaleDiff = Math.min(this.endScale, this.startScale) / Math.max(this.endScale, this.startScale);
      }
      
      // No animation needed if scales are the same
      if (scaleDiff === 1) {
        this._isActive = false;
      }
      
      this.duration = settings.ellipticalZoomDuration * scaleDiff * 0.2;
      
      // Dummy values for degenerate case
      this.r0 = 0;
      this.r1 = 0;
      this.S = 1;
      this.coshR0 = 1;
      this.sinhR0 = 0;
      this.uS = 0;
      this.uSRatio = 1;
      
      // Simplified functions for same-center case
      this.xFunc = () => this.startPoint.X;
      this.yFunc = () => this.startPoint.Y;
      this.scaleFunc = (t: number) => this.startScale + (this.endScale - this.startScale) * t;
    }
  }

  get isActive(): boolean {
    return this._isActive;
  }

  /**
   * Helper function u(s) from the paper.
   * Calculates path position at parameter s.
   * @param s - Animation parameter in range [0, S]
   * @returns Position along path in range [0, pathLen]
   */
  private u(s: number): number {
    let val = this.startScale / (this.ro * this.ro) * 
              (this.coshR0 * tanh(this.ro * s + this.r0) - this.sinhR0) + this.u0;
    
    // Compensate for numerical imprecision
    if (this.uS < this.pathLen) {
      val = val * this.uSRatio;
    }
    
    // Ensure we don't exceed path length
    return Math.min(val, this.pathLen);
  }

  /**
   * Produces the next viewport state for current frame
   * @param _currentViewport - Current viewport state (unused, animation is time-based)
   * @returns New visible region for this frame
   * 
   * @remarks
   * The animation is time-based rather than velocity-based for predictable duration.
   * For velocity-based animations with inertia, use PanZoomAnimation instead.
   */
  produceNextVisible(_currentViewport: Viewport2d): VisibleRegion2d {
    const curTime = Date.now();
    let t: number;
    
    if (this.duration > 0) {
      // Project current time to [0, 1] interval
      t = Math.min(1.0, (curTime - this.startTime) / this.duration);
    } else {
      t = 1.0;
    }
    
    // Apply easing for smooth acceleration/deceleration
    t = animationEase(t);
    
    if (t >= 1.0) {
      this._isActive = false;
    }
    
    return new VisibleRegion2d(
      this.xFunc(t),
      this.yFunc(t),
      this.scaleFunc(t)
    );
  }
}
