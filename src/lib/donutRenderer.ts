/**
 * DonutRenderer Core Rendering Engine
 *
 * Mathematical 3D torus ASCII renderer
 * Reference: https://www.a1k0n.net/2011/07/20/donut-math.html
 */

import { DonutRendererConfig } from './donutConfig';

/**
 * DonutRenderer Class
 *
 * Handles 3D torus mathematical calculations and ASCII character mapping
 */
export class DonutRenderer {
  private config: DonutRendererConfig;
  private zbuffer: Float32Array;
  private output: string[][];

  // Cached trigonometric values
  private sinA: number = 0;
  private cosA: number = 0;
  private sinB: number = 0;
  private cosB: number = 0;

  /**
   * Constructor
   *
   * @param config - Renderer configuration
   */
  constructor(config: DonutRendererConfig) {
    this.config = config;
    this.zbuffer = new Float32Array(config.width * config.height);
    this.output = Array.from({ length: config.height }, () =>
      Array(config.width).fill(' ')
    );
  }

  /**
   * Render a single frame of ASCII donut
   *
   * @param angleA - Rotation angle around X axis (radians)
   * @param angleB - Rotation angle around Z axis (radians)
   * @returns ASCII string (with newlines)
   */
  render(angleA: number, angleB: number): string {
    // Step 1: Reset buffers
    this.resetBuffers();

    // Step 2: Cache trigonometric values
    this.sinA = Math.sin(angleA);
    this.cosA = Math.cos(angleA);
    this.sinB = Math.sin(angleB);
    this.cosB = Math.cos(angleB);

    // Step 3: Iterate through torus surface points
    this.renderTorus();

    // Step 4: Convert output buffer to string
    return this.outputToString();
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Reset buffers (allow garbage collection)
    this.zbuffer = new Float32Array(this.config.width * this.config.height);
    this.output = Array.from({ length: this.config.height }, () =>
      Array(this.config.width).fill(' ')
    );
  }

  /**
   * Reset z-buffer and output buffer
   */
  private resetBuffers(): void {
    // Reset z-buffer (fill with 0)
    this.zbuffer.fill(0);

    // Reset output buffer (fill with spaces)
    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        this.output[y][x] = ' ';
      }
    }
  }

  /**
   * Render torus surface
   *
   * Mathematical explanation:
   * - Torus parametric equations:
   *   circle_x = R2 + R1 * cos(theta)
   *   circle_y = R1 * sin(theta)
   * - Rotation matrices applied for 3D transformation
   * - Z-buffer algorithm ensures correct occlusion
   */
  private renderTorus(): void {
    const { R1, R2, thetaSpacing, phiSpacing } = this.config;

    // Iterate through theta (torus cross-section angle)
    for (let theta = 0; theta < Math.PI * 2; theta += thetaSpacing) {
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      // Calculate circle coordinates using torus parametric equations
      // circleX: Distance from torus center to point on cross-section
      // circleY: Height of point on cross-section
      const circleX = R2 + R1 * cosTheta;
      const circleY = R1 * sinTheta;

      // Iterate through phi (torus rotation angle)
      for (let phi = 0; phi < Math.PI * 2; phi += phiSpacing) {
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        // Calculate 3D coordinates after applying rotation matrices
        // Rotation matrix order: X-axis (angleA) -> Z-axis (angleB)
        // Formula combines circleX/circleY with rotation transforms
        const x =
          circleX * (this.cosB * cosPhi + this.sinA * this.sinB * sinPhi) -
          circleY * this.cosA * this.sinB;

        const y =
          circleX * (this.sinB * cosPhi - this.sinA * this.cosB * sinPhi) +
          circleY * this.cosA * this.cosB;

        const z =
          this.config.K2 +
          this.cosA * circleX * sinPhi +
          circleY * this.sinA;

        // Calculate inverse depth (1/z) for perspective projection and z-buffer
        // Higher ooz = closer to camera (depth test)
        const ooz = 1 / z;

        // Perspective projection to 2D screen coordinates
        const { screenX, screenY, valid } = this.projectToScreen(x, y, ooz);

        if (!valid) continue;

        // Z-buffer depth test
        const bufferIndex = screenY * this.config.width + screenX;
        if (ooz > this.zbuffer[bufferIndex]) {
          this.zbuffer[bufferIndex] = ooz;

          // Calculate lighting and map to ASCII character
          const luminance = this.calculateLuminance(
            cosTheta,
            sinTheta,
            cosPhi,
            sinPhi
          );
          const char = this.mapLuminanceToChar(luminance);

          this.output[screenY][screenX] = char;
        }
      }
    }
  }

  /**
   * Project to 2D screen coordinates
   *
   * @param x - 3D x coordinate
   * @param y - 3D y coordinate
   * @param ooz - 1/z (inverse depth)
   * @returns Screen coordinates and validity
   */
  private projectToScreen(
    x: number,
    y: number,
    ooz: number
  ): { screenX: number; screenY: number; valid: boolean } {
    const { width, height, K1 } = this.config;

    // Perspective projection formula
    const screenX = Math.floor(width / 2 + K1 * ooz * x);
    const screenY = Math.floor(height / 2 - K1 * ooz * y);

    // Check if within screen bounds
    const valid =
      screenX >= 0 && screenX < width && screenY >= 0 && screenY < height;

    return { screenX, screenY, valid };
  }

  /**
   * Calculate surface luminance using Lambertian reflectance
   *
   * Mathematical explanation:
   * - Computes surface normal vector N = (nx, ny, nz) at each point
   * - Light source direction L = (0, 0.7071, -0.7071) (from above-front)
   * - Luminance = N · L (dot product) normalized to [0, 1]
   * - Result maps to ASCII character brightness
   *
   * @param cosTheta - cos(theta)
   * @param sinTheta - sin(theta)
   * @param cosPhi - cos(phi)
   * @param sinPhi - sin(phi)
   * @returns Luminance value (0-1)
   */
  private calculateLuminance(
    cosTheta: number,
    sinTheta: number,
    cosPhi: number,
    sinPhi: number
  ): number {
    // Calculate surface normal vector components
    // Normal = derivative of torus surface parametric equations
    const nx =
      cosTheta * (this.cosB * cosPhi + this.sinA * this.sinB * sinPhi) -
      sinTheta * this.cosA * this.sinB;

    const ny =
      cosTheta * (this.sinB * cosPhi - this.sinA * this.cosB * sinPhi) +
      sinTheta * this.cosA * this.cosB;

    const nz = this.cosA * cosTheta * sinPhi + sinTheta * this.sinA;

    // Light direction vector (normalized)
    // Direction: (0, 1, -1) normalized -> simulates light from above and front
    const lightX = 0;
    const lightY = 0.7071; // 1/sqrt(2) ≈ 0.7071
    const lightZ = -0.7071; // -1/sqrt(2)

    // Calculate Lambertian reflectance (dot product N · L)
    // Dot product = brightness of surface based on angle to light
    let luminance = nx * lightX + ny * lightY + nz * lightZ;

    // Normalize dot product result from [-1, 1] to [0, 1]
    // -1 (facing away) -> 0 (dark), +1 (facing light) -> 1 (bright)
    luminance = (luminance + 1) / 2;

    // Clamp to valid range [0, 1]
    return Math.max(0, Math.min(1, luminance));
  }

  /**
   * Map luminance value to ASCII character
   *
   * @param luminance - Luminance value (0-1)
   * @returns ASCII character
   */
  private mapLuminanceToChar(luminance: number): string {
    const { luminanceChars } = this.config;
    const index = Math.floor(luminance * (luminanceChars.length - 1));
    return luminanceChars[index];
  }

  /**
   * Convert output buffer to string
   *
   * @returns ASCII string (with newlines)
   */
  private outputToString(): string {
    return this.output.map((row) => row.join('')).join('\n');
  }
}
