/**
 * NukaColaRenderer - 3D Nuka-Cola Bottle ASCII Renderer
 *
 * Mathematical 3D bottle renderer using parametric surface equations
 * Features:
 * - Bottle neck (narrow cylinder)
 * - Shoulder transition (conical)
 * - Main body (wide cylinder)
 * - Bottom base (slightly narrower with concave bottom)
 * - Smooth surface with proper lighting
 */

export interface NukaColaConfig {
  /** ASCII output width (characters) */
  width: number;
  /** ASCII output height (lines) */
  height: number;

  // Bottle dimensions
  /** Neck radius (top) */
  neckRadius: number;
  /** Neck height */
  neckHeight: number;
  /** Body radius (widest part) */
  bodyRadius: number;
  /** Body height */
  bodyHeight: number;
  /** Shoulder height (transition zone) */
  shoulderHeight: number;
  /** Base height (bottom part) */
  baseHeight: number;
  /** Bottom concave depth */
  bottomConcaveDepth: number;

  /** Perspective projection scale */
  K1: number;
  /** Camera distance */
  K2: number;
  /** Angular step size for rendering density */
  angleSpacing: number;
  /** Vertical step size for rendering density */
  verticalSpacing: number;
  /** ASCII luminance characters (dark to bright) */
  luminanceChars: string;
}

/**
 * Default Nuka-Cola bottle configuration
 */
export const DEFAULT_NUKA_COLA_CONFIG: NukaColaConfig = {
  width: 60,
  height: 40,

  // Bottle proportions (similar to reference image)
  neckRadius: 0.4,
  neckHeight: 1.5,
  bodyRadius: 1.2,
  bodyHeight: 3.5,
  shoulderHeight: 1.0,
  baseHeight: 0.8,
  bottomConcaveDepth: 0.3,

  K1: 40,  // Projection scale
  K2: 10,  // Camera distance
  angleSpacing: 0.08,
  verticalSpacing: 0.08,
  luminanceChars: '.,:;=!*#$@',
};

/**
 * NukaColaRenderer Class
 *
 * Renders a 3D Nuka-Cola bottle with proper proportions
 */
export class NukaColaRenderer {
  private config: NukaColaConfig;
  private zbuffer: Float32Array;
  private output: string[][];

  // Cached rotation matrices
  private sinA: number = 0;
  private cosA: number = 0;
  private sinB: number = 0;
  private cosB: number = 0;

  constructor(config: NukaColaConfig) {
    this.config = config;
    this.zbuffer = new Float32Array(config.width * config.height);
    this.output = Array.from({ length: config.height }, () =>
      Array(config.width).fill(' ')
    );
  }

  /**
   * Render a single frame of ASCII Nuka-Cola bottle
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

    // Calculate total height
    const totalHeight =
      this.config.neckHeight +
      this.config.shoulderHeight +
      this.config.bodyHeight +
      this.config.baseHeight;

    // Render bottle parts (from top to bottom)
    this.renderNeck(totalHeight);
    this.renderShoulder(totalHeight);
    this.renderBody(totalHeight);
    this.renderBase(totalHeight);
    this.renderBottom(totalHeight);

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
   * Calculate radius at a given height on the bottle
   */
  private getRadiusAtHeight(y: number, totalHeight: number): number {
    const { neckRadius, neckHeight, bodyRadius, shoulderHeight, bodyHeight, baseHeight } =
      this.config;

    // Coordinate system: y=0 at bottom, y=totalHeight at top
    const yFromTop = totalHeight - y;

    if (yFromTop <= neckHeight) {
      // Neck section (constant radius)
      return neckRadius;
    } else if (yFromTop <= neckHeight + shoulderHeight) {
      // Shoulder section (smooth transition from neck to body)
      const t = (yFromTop - neckHeight) / shoulderHeight;
      // Smooth interpolation (ease-in-out)
      const smoothT = t * t * (3 - 2 * t);
      return neckRadius + (bodyRadius - neckRadius) * smoothT;
    } else if (yFromTop <= neckHeight + shoulderHeight + bodyHeight) {
      // Body section (constant radius)
      return bodyRadius;
    } else {
      // Base section (slightly narrower)
      const t = (yFromTop - neckHeight - shoulderHeight - bodyHeight) / baseHeight;
      const smoothT = t * t;
      return bodyRadius - (bodyRadius * 0.1) * smoothT;
    }
  }

  /**
   * Render bottle neck
   */
  private renderNeck(totalHeight: number): void {
    const { neckHeight, angleSpacing, verticalSpacing } = this.config;

    const yStart = totalHeight - neckHeight;
    const yEnd = totalHeight;

    this.renderCylindricalSection(yStart, yEnd, verticalSpacing, angleSpacing, totalHeight);
  }

  /**
   * Render bottle shoulder
   */
  private renderShoulder(totalHeight: number): void {
    const { neckHeight, shoulderHeight, angleSpacing, verticalSpacing } = this.config;

    const yStart = totalHeight - neckHeight - shoulderHeight;
    const yEnd = totalHeight - neckHeight;

    this.renderCylindricalSection(yStart, yEnd, verticalSpacing, angleSpacing, totalHeight);
  }

  /**
   * Render bottle body
   */
  private renderBody(totalHeight: number): void {
    const { neckHeight, shoulderHeight, bodyHeight, angleSpacing, verticalSpacing } =
      this.config;

    const yStart = totalHeight - neckHeight - shoulderHeight - bodyHeight;
    const yEnd = totalHeight - neckHeight - shoulderHeight;

    this.renderCylindricalSection(yStart, yEnd, verticalSpacing, angleSpacing, totalHeight);
  }

  /**
   * Render bottle base
   */
  private renderBase(totalHeight: number): void {
    const { neckHeight, shoulderHeight, bodyHeight, baseHeight, angleSpacing, verticalSpacing } =
      this.config;

    const yStart = 0;
    const yEnd = totalHeight - neckHeight - shoulderHeight - bodyHeight;

    this.renderCylindricalSection(yStart, yEnd, verticalSpacing, angleSpacing, totalHeight);
  }

  /**
   * Render bottom surface with concave center
   */
  private renderBottom(totalHeight: number): void {
    const { bodyRadius, bottomConcaveDepth, angleSpacing } = this.config;
    const radialSpacing = 0.05;

    const yBottom = 0;

    for (let angle = 0; angle < Math.PI * 2; angle += angleSpacing) {
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      for (let r = 0; r <= bodyRadius; r += radialSpacing) {
        const surfaceX = r * cosAngle;
        const surfaceZ = r * sinAngle;

        // Concave bottom: deeper in the center
        let surfaceY = yBottom;
        if (r < bodyRadius * 0.7) {
          const t = r / (bodyRadius * 0.7);
          surfaceY = yBottom - bottomConcaveDepth * (1 - t * t);
        }

        // Shift to center bottle vertically
        const centeredY = surfaceY - totalHeight / 2;

        // Apply 3D rotation
        const { x, y, z } = this.rotate3D(surfaceX, centeredY, surfaceZ);

        // Project to screen
        const ooz = 1 / (z + this.config.K2);
        const { screenX, screenY, valid } = this.projectToScreen(x, y, ooz);

        if (!valid) continue;

        // Z-buffer test
        const bufferIndex = screenY * this.config.width + screenX;
        if (ooz > this.zbuffer[bufferIndex]) {
          this.zbuffer[bufferIndex] = ooz;

          // Calculate normal for lighting
          let nx = 0;
          let ny = -1;
          let nz = 0;

          if (r < bodyRadius * 0.7 && r > 0) {
            const slopeFactor = (2 * bottomConcaveDepth * r) / Math.pow(bodyRadius * 0.7, 2);
            nx = cosAngle * slopeFactor;
            nz = sinAngle * slopeFactor;
            ny = -1;
            const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
            nx /= len;
            ny /= len;
            nz /= len;
          }

          const normal = this.rotateNormal(nx, ny, nz);
          const luminance = this.calculateLuminance(normal.nx, normal.ny, normal.nz);
          const char = this.mapLuminanceToChar(luminance);

          this.output[screenY][screenX] = char;
        }
      }
    }
  }

  /**
   * Render a cylindrical section of the bottle
   */
  private renderCylindricalSection(
    yStart: number,
    yEnd: number,
    verticalSpacing: number,
    angleSpacing: number,
    totalHeight: number
  ): void {
    for (let y = yStart; y <= yEnd; y += verticalSpacing) {
      const radius = this.getRadiusAtHeight(y, totalHeight);

      for (let angle = 0; angle < Math.PI * 2; angle += angleSpacing) {
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);

        const surfaceX = radius * cosAngle;
        const surfaceZ = radius * sinAngle;

        // Shift to center bottle vertically
        const centeredY = y - totalHeight / 2;

        // Apply 3D rotation
        const { x, y: rotY, z } = this.rotate3D(surfaceX, centeredY, surfaceZ);

        // Project to screen
        const ooz = 1 / (z + this.config.K2);
        const { screenX, screenY, valid } = this.projectToScreen(x, rotY, ooz);

        if (!valid) continue;

        // Z-buffer test
        const bufferIndex = screenY * this.config.width + screenX;
        if (ooz > this.zbuffer[bufferIndex]) {
          this.zbuffer[bufferIndex] = ooz;

          // Surface normal points radially outward
          const normal = this.rotateNormal(cosAngle, 0, sinAngle);
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
   * Light source: from above-front (0.2, 0.7071, -0.7071)
   */
  private calculateLuminance(nx: number, ny: number, nz: number): number {
    // Light direction (normalized)
    const lightX = 0.2;
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
