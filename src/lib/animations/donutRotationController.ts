/**
 * Donut Rotation Animation Controller
 *
 * Provides smooth, random rotation animations with easing.
 * Avoids jarring or bouncy movements.
 */

/**
 * Easing functions for smooth animations
 */
export const Easing = {
  // Smooth ease-in-out (no bounce)
  easeInOutCubic: (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },

  // Gentler ease-in-out
  easeInOutQuad: (t: number): number => {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  },

  // Very smooth (sine-based)
  easeInOutSine: (t: number): number => {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  },
};

export interface RotationState {
  angleA: number;
  angleB: number;
}

export interface RotationTarget {
  targetA: number;
  targetB: number;
  startA: number;
  startB: number;
  startTime: number;
  duration: number; // in milliseconds
}

export class DonutRotationController {
  private currentRotation: RotationState = { angleA: 0, angleB: 0 };
  private target: RotationTarget | null = null;
  private easingFunction: (t: number) => number;

  // Configuration (optimized for smooth, non-jarring rotations)
  private minDuration = 3000; // 3 seconds minimum (increased from 2)
  private maxDuration = 5000; // 5 seconds maximum (increased from 4)
  private minAngleChange = Math.PI / 6; // 30 degrees minimum change
  private maxAngleChange = Math.PI * 0.75; // 135 degrees maximum change (more conservative)

  constructor(
    initialRotation: RotationState = { angleA: 0, angleB: 0 },
    easingFn: (t: number) => number = Easing.easeInOutSine
  ) {
    this.currentRotation = { ...initialRotation };
    this.easingFunction = easingFn;
  }

  /**
   * Generate a random target rotation
   */
  private generateRandomTarget(): void {
    // Random duration between min and max
    const duration =
      this.minDuration + Math.random() * (this.maxDuration - this.minDuration);

    // Random angle changes (can be positive or negative)
    const deltaA =
      (Math.random() * 2 - 1) * // Random direction (-1 to 1)
      (this.minAngleChange +
        Math.random() * (this.maxAngleChange - this.minAngleChange));

    const deltaB =
      (Math.random() * 2 - 1) *
      (this.minAngleChange +
        Math.random() * (this.maxAngleChange - this.minAngleChange));

    this.target = {
      startA: this.currentRotation.angleA,
      startB: this.currentRotation.angleB,
      targetA: this.currentRotation.angleA + deltaA,
      targetB: this.currentRotation.angleB + deltaB,
      startTime: Date.now(),
      duration,
    };
  }

  /**
   * Update rotation based on current time
   * Returns current rotation angles
   */
  update(currentTime: number = Date.now()): RotationState {
    // If no target, generate one
    if (!this.target) {
      this.generateRandomTarget();
    }

    if (!this.target) {
      return this.currentRotation;
    }

    // Calculate progress (0 to 1)
    const elapsed = currentTime - this.target.startTime;
    const rawProgress = Math.min(elapsed / this.target.duration, 1.0);

    // Apply easing function
    const easedProgress = this.easingFunction(rawProgress);

    // Interpolate between start and target
    this.currentRotation.angleA =
      this.target.startA +
      (this.target.targetA - this.target.startA) * easedProgress;

    this.currentRotation.angleB =
      this.target.startB +
      (this.target.targetB - this.target.startB) * easedProgress;

    // If animation complete, ensure we're exactly at target (avoid floating point drift)
    if (rawProgress >= 1.0) {
      // Snap to exact target values
      this.currentRotation.angleA = this.target.targetA;
      this.currentRotation.angleB = this.target.targetB;

      // Generate new target from current position
      this.generateRandomTarget();
    }

    return { ...this.currentRotation };
  }

  /**
   * Get current rotation without updating
   */
  getCurrentRotation(): RotationState {
    return { ...this.currentRotation };
  }

  /**
   * Force immediate rotation to new random target
   */
  randomize(): void {
    this.generateRandomTarget();
  }

  /**
   * Set rotation speed (by adjusting duration range)
   */
  setSpeed(speedMultiplier: number): void {
    // Higher multiplier = faster rotation (shorter duration)
    this.minDuration = 2000 / speedMultiplier;
    this.maxDuration = 4000 / speedMultiplier;
  }

  /**
   * Set rotation intensity (angle change range)
   */
  setIntensity(intensityMultiplier: number): void {
    // Higher multiplier = larger angle changes
    this.maxAngleChange = (Math.PI * 2) * intensityMultiplier;
  }
}

/**
 * Alternative: Continuous slow drift with occasional flips
 */
export class DonutDriftController {
  private currentRotation: RotationState = { angleA: 0, angleB: 0 };
  private driftSpeedA: number;
  private driftSpeedB: number;
  private lastUpdateTime: number;

  // Configuration
  private baseDriftSpeed = 0.0002; // radians per ms (very slow)
  private flipProbability = 0.001; // 0.1% chance per update
  private flipDuration = 1500; // 1.5 seconds for flip

  private flipTarget: RotationTarget | null = null;

  constructor(initialRotation: RotationState = { angleA: 0, angleB: 0 }) {
    this.currentRotation = { ...initialRotation };
    this.lastUpdateTime = Date.now();

    // Random initial drift speeds
    this.driftSpeedA = this.baseDriftSpeed * (Math.random() * 2 - 1);
    this.driftSpeedB = this.baseDriftSpeed * (Math.random() * 2 - 1);
  }

  update(currentTime: number = Date.now()): RotationState {
    const deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;

    // If currently flipping, use interpolation
    if (this.flipTarget) {
      const elapsed = currentTime - this.flipTarget.startTime;
      const progress = Math.min(elapsed / this.flipTarget.duration, 1.0);
      const easedProgress = Easing.easeInOutSine(progress);

      this.currentRotation.angleA =
        this.flipTarget.startA +
        (this.flipTarget.targetA - this.flipTarget.startA) * easedProgress;

      this.currentRotation.angleB =
        this.flipTarget.startB +
        (this.flipTarget.targetB - this.flipTarget.startB) * easedProgress;

      // If flip complete, return to drift
      if (progress >= 1.0) {
        this.flipTarget = null;
        // Randomize new drift speeds
        this.driftSpeedA = this.baseDriftSpeed * (Math.random() * 2 - 1);
        this.driftSpeedB = this.baseDriftSpeed * (Math.random() * 2 - 1);
      }
    } else {
      // Normal drift
      this.currentRotation.angleA += this.driftSpeedA * deltaTime;
      this.currentRotation.angleB += this.driftSpeedB * deltaTime;

      // Random chance to flip
      if (Math.random() < this.flipProbability) {
        this.initiateFlip();
      }
    }

    return { ...this.currentRotation };
  }

  private initiateFlip(): void {
    // Large random rotation
    const deltaA = (Math.random() * 2 - 1) * Math.PI * 2;
    const deltaB = (Math.random() * 2 - 1) * Math.PI * 2;

    this.flipTarget = {
      startA: this.currentRotation.angleA,
      startB: this.currentRotation.angleB,
      targetA: this.currentRotation.angleA + deltaA,
      targetB: this.currentRotation.angleB + deltaB,
      startTime: Date.now(),
      duration: this.flipDuration,
    };
  }

  getCurrentRotation(): RotationState {
    return { ...this.currentRotation };
  }

  triggerFlip(): void {
    this.initiateFlip();
  }
}
