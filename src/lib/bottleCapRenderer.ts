/**
 * BottleCapRenderer - 3D Bottle Cap ASCII Renderer
 *
 * Mathematical 3D bottle cap renderer using parametric surface equations
 * Features:
 * - Circular disk with thickness (cylinder)
 * - 21 crimped edges (wavy perimeter)
 * - Central depression on top surface
 * - Metallic appearance with advanced lighting
 */

export interface BottleCapConfig {
  /** ASCII output width (characters) */
  width: number;
  /** ASCII output height (lines) */
  height: number;
  /** Bottle cap radius */
  radius: number;
  /** Thickness of the cap */
  thickness: number;
  /** Number of crimps/teeth on edge */
  crimpCount: number;
  /** Amplitude of crimps (height) */
  crimpAmplitude: number;
  /** Depth of central depression */
  depressionDepth: number;
  /** Radius of central depression */
  depressionRadius: number;
  /** Perspective projection scale */
  K1: number;
  /** Camera distance */
  K2: number;
  /** Angular step size for rendering density */
  angleSpacing: number;
  /** Radial step size for rendering density */
  radialSpacing: number;
  /** ASCII luminance characters (dark to bright) */
  luminanceChars: string;
}

/**
 * Default bottle cap configuration
 */
export const DEFAULT_BOTTLE_CAP_CONFIG: BottleCapConfig = {
  width: 80,
  height: 24,
  radius: 2.0,
  thickness: 1.0,  // Further increased thickness to match reference image
  crimpCount: 21,
  crimpAmplitude: 0.35,  // Increased crimp amplitude for deeper, more visible teeth
  depressionDepth: 0.25,  // Slightly deeper depression
  depressionRadius: 1.2,
  K1: 60,  // Reduced projection scale for better perspective
  K2: 10,  // Increased camera distance to see full bottle cap
  angleSpacing: 0.04,  // Finer angular sampling for smoother crimps
  radialSpacing: 0.04,  // Finer radial sampling for better detail
  luminanceChars: '.,:;=!*#$@',
};

/**
 * BottleCapRenderer Class
 *
 * Renders a 3D bottle cap with crimped edges and central depression
 */
export class BottleCapRenderer {
  private config: BottleCapConfig;
  private zbuffer: Float32Array;
  private output: string[][];

  // Cached rotation matrices
  private sinA: number = 0;
  private cosA: number = 0;
  private sinB: number = 0;
  private cosB: number = 0;

  constructor(config: BottleCapConfig) {
    this.config = config;
    this.zbuffer = new Float32Array(config.width * config.height);
    this.output = Array.from({ length: config.height }, () =>
      Array(config.width).fill(' ')
    );
  }

  /**
   * Render a single frame of ASCII bottle cap
   *
   * @param angleA - Rotation angle around X axis (radians)
   * @param angleB - Rotation angle around Z axis (radians)
   * @returns ASCII string with newlines
   */
  render(angleA: number, angleB: number): string {
    // Reset buffers
    this.resetBuffers();

    // Cache trigonometric values
    this.sinA = Math.sin(angleA);
    this.cosA = Math.cos(angleA);
    this.sinB = Math.sin(angleB);
    this.cosB = Math.cos(angleB);

    // Render bottle cap surfaces
    this.renderTopSurface();
    this.renderBottomSurface();
    this.renderSideEdge();
    this.renderCrimpedEdge();

    // Convert output buffer to string
    return this.outputToString();
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.zbuffer = new Float32Array(this.config.width * this.config.height);
    this.output = Array.from({ length: this.config.height }, () =>
      Array(this.config.width).fill(' ')
    );
  }

  /**
   * Reset z-buffer and output buffer
   */
  private resetBuffers(): void {
    this.zbuffer.fill(0);
    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        this.output[y][x] = ' ';
      }
    }
  }

  /**
   * Render top surface with central depression
   */
  private renderTopSurface(): void {
    const { radius, depressionDepth, depressionRadius, angleSpacing, radialSpacing } =
      this.config;

    for (let angle = 0; angle < Math.PI * 2; angle += angleSpacing) {
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      for (let r = 0; r <= radius; r += radialSpacing) {
        // Calculate x, y on circular surface
        const surfaceX = r * cosAngle;
        const surfaceY = r * sinAngle;

        // Calculate z with depression (smooth bowl shape)
        let surfaceZ = 0;
        if (r < depressionRadius) {
          // Parabolic depression: z = -depth * (r / depressionRadius)^2
          const t = r / depressionRadius;
          surfaceZ = -depressionDepth * t * t;
        }

        // Apply 3D rotation
        const { x, y, z } = this.rotate3D(surfaceX, surfaceY, surfaceZ);

        // Project to screen
        const ooz = 1 / (z + this.config.K2);
        const { screenX, screenY, valid } = this.projectToScreen(x, y, ooz);

        if (!valid) continue;

        // Z-buffer test
        const bufferIndex = screenY * this.config.width + screenX;
        if (ooz > this.zbuffer[bufferIndex]) {
          this.zbuffer[bufferIndex] = ooz;

          // Calculate normal vector for lighting (pointing upward with depression slope)
          let nx = 0;
          let ny = 0;
          let nz = 1; // Default: flat surface pointing up

          if (r < depressionRadius && r > 0) {
            // For depressed area, normal slopes inward
            const slopeFactor = (2 * depressionDepth * r) / (depressionRadius * depressionRadius);
            nx = -cosAngle * slopeFactor;
            ny = -sinAngle * slopeFactor;
            nz = 1; // Normalize later
            const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
            nx /= len;
            ny /= len;
            nz /= len;
          }

          // Apply rotation to normal vector
          const normal = this.rotateNormal(nx, ny, nz);
          const luminance = this.calculateLuminance(normal.nx, normal.ny, normal.nz);
          const char = this.mapLuminanceToChar(luminance);

          this.output[screenY][screenX] = char;
        }
      }
    }
  }

  /**
   * Render bottom surface (flat)
   */
  private renderBottomSurface(): void {
    const { radius, thickness, angleSpacing, radialSpacing } = this.config;

    for (let angle = 0; angle < Math.PI * 2; angle += angleSpacing) {
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      for (let r = 0; r <= radius; r += radialSpacing) {
        const surfaceX = r * cosAngle;
        const surfaceY = r * sinAngle;
        const surfaceZ = -thickness; // Bottom surface

        const { x, y, z } = this.rotate3D(surfaceX, surfaceY, surfaceZ);
        const ooz = 1 / (z + this.config.K2);
        const { screenX, screenY, valid } = this.projectToScreen(x, y, ooz);

        if (!valid) continue;

        const bufferIndex = screenY * this.config.width + screenX;
        if (ooz > this.zbuffer[bufferIndex]) {
          this.zbuffer[bufferIndex] = ooz;

          // Bottom normal points downward
          const normal = this.rotateNormal(0, 0, -1);
          const luminance = this.calculateLuminance(normal.nx, normal.ny, normal.nz);
          const char = this.mapLuminanceToChar(luminance);

          this.output[screenY][screenX] = char;
        }
      }
    }
  }

  /**
   * Render smooth cylindrical side edge
   */
  private renderSideEdge(): void {
    const { radius, thickness, angleSpacing } = this.config;
    const heightSteps = 15; // Increased vertical samples for better side wall detail

    for (let angle = 0; angle < Math.PI * 2; angle += angleSpacing) {
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      for (let h = 0; h <= heightSteps; h++) {
        const t = h / heightSteps;
        const surfaceX = radius * cosAngle;
        const surfaceY = radius * sinAngle;
        const surfaceZ = -thickness * t; // Interpolate from top (0) to bottom (-thickness)

        const { x, y, z } = this.rotate3D(surfaceX, surfaceY, surfaceZ);
        const ooz = 1 / (z + this.config.K2);
        const { screenX, screenY, valid } = this.projectToScreen(x, y, ooz);

        if (!valid) continue;

        const bufferIndex = screenY * this.config.width + screenX;
        if (ooz > this.zbuffer[bufferIndex]) {
          this.zbuffer[bufferIndex] = ooz;

          // Side normal points radially outward
          const normal = this.rotateNormal(cosAngle, sinAngle, 0);
          const luminance = this.calculateLuminance(normal.nx, normal.ny, normal.nz);
          const char = this.mapLuminanceToChar(luminance);

          this.output[screenY][screenX] = char;
        }
      }
    }
  }

  /**
   * Render crimped edge (21 wavy teeth)
   */
  private renderCrimpedEdge(): void {
    const { radius, thickness, crimpCount, crimpAmplitude, angleSpacing } = this.config;
    const heightSteps = 10; // Increased for more detailed crimp rendering

    for (let angle = 0; angle < Math.PI * 2; angle += angleSpacing) {
      // Calculate crimp wave: radius varies sinusoidally
      const crimpPhase = angle * crimpCount;
      const crimpWave = Math.sin(crimpPhase);
      const currentRadius = radius + crimpAmplitude * crimpWave;

      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      for (let h = 0; h <= heightSteps; h++) {
        const t = h / heightSteps;
        const surfaceX = currentRadius * cosAngle;
        const surfaceY = currentRadius * sinAngle;
        const surfaceZ = -thickness * t;

        const { x, y, z } = this.rotate3D(surfaceX, surfaceY, surfaceZ);
        const ooz = 1 / (z + this.config.K2);
        const { screenX, screenY, valid } = this.projectToScreen(x, y, ooz);

        if (!valid) continue;

        const bufferIndex = screenY * this.config.width + screenX;
        if (ooz > this.zbuffer[bufferIndex]) {
          this.zbuffer[bufferIndex] = ooz;

          // Calculate normal for crimped surface
          // Radial component + tangential component from crimp wave derivative
          const crimpDerivative = crimpCount * Math.cos(crimpPhase);
          const tangentX = -sinAngle - crimpAmplitude * crimpDerivative * sinAngle;
          const tangentY = cosAngle + crimpAmplitude * crimpDerivative * cosAngle;
          const radialX = cosAngle;
          const radialY = sinAngle;

          // Cross product for normal (approximate)
          let nx = radialX;
          let ny = radialY;
          let nz = 0;

          // Normalize
          const len = Math.sqrt(nx * nx + ny * ny + nz * nz + 0.001);
          nx /= len;
          ny /= len;
          nz /= len;

          const normal = this.rotateNormal(nx, ny, nz);
          const luminance = this.calculateLuminance(normal.nx, normal.ny, normal.nz);
          const char = this.mapLuminanceToChar(luminance);

          this.output[screenY][screenX] = char;
        }
      }
    }
  }

  /**
   * Apply 3D rotation to a point
   */
  private rotate3D(x: number, y: number, z: number): { x: number; y: number; z: number } {
    // Rotation around X-axis (angleA)
    const y1 = y * this.cosA - z * this.sinA;
    const z1 = y * this.sinA + z * this.cosA;

    // Rotation around Z-axis (angleB)
    const x2 = x * this.cosB - y1 * this.sinB;
    const y2 = x * this.sinB + y1 * this.cosB;

    return { x: x2, y: y2, z: z1 };
  }

  /**
   * Rotate a normal vector
   */
  private rotateNormal(
    nx: number,
    ny: number,
    nz: number
  ): { nx: number; ny: number; nz: number } {
    // Rotation around X-axis
    const ny1 = ny * this.cosA - nz * this.sinA;
    const nz1 = ny * this.sinA + nz * this.cosA;

    // Rotation around Z-axis
    const nx2 = nx * this.cosB - ny1 * this.sinB;
    const ny2 = nx * this.sinB + ny1 * this.cosB;

    return { nx: nx2, ny: ny2, nz: nz1 };
  }

  /**
   * Project 3D point to 2D screen coordinates
   */
  private projectToScreen(
    x: number,
    y: number,
    ooz: number
  ): { screenX: number; screenY: number; valid: boolean } {
    const { width, height, K1 } = this.config;

    const screenX = Math.floor(width / 2 + K1 * ooz * x);
    const screenY = Math.floor(height / 2 - K1 * ooz * y);

    const valid =
      screenX >= 0 && screenX < width && screenY >= 0 && screenY < height;

    return { screenX, screenY, valid };
  }

  /**
   * Calculate surface luminance using Lambertian reflectance
   *
   * Light source: from above-front (0, 0.7071, -0.7071)
   */
  private calculateLuminance(nx: number, ny: number, nz: number): number {
    // Light direction (normalized)
    const lightX = 0;
    const lightY = 0.7071;
    const lightZ = -0.7071;

    // Dot product N · L
    let luminance = nx * lightX + ny * lightY + nz * lightZ;

    // Normalize to [0, 1]
    luminance = (luminance + 1) / 2;

    // Clamp
    return Math.max(0, Math.min(1, luminance));
  }

  /**
   * Map luminance to ASCII character
   */
  private mapLuminanceToChar(luminance: number): string {
    const { luminanceChars } = this.config;
    const index = Math.floor(luminance * (luminanceChars.length - 1));
    return luminanceChars[index];
  }

  /**
   * Convert output buffer to string
   */
  private outputToString(): string {
    return this.output.map((row) => row.join('')).join('\n');
  }
}
