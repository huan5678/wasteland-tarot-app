/**
 * WebGL Donut Renderer
 *
 * GPU-accelerated 3D torus ASCII renderer using WebGL.
 * Maintains 100% API compatibility with DonutRenderer (Canvas 2D version).
 */

import { DonutRendererConfig } from '../donutConfig';
import {
  createWebGLContext,
  createProgram,
  getAttribLocation,
  getUniformLocation,
  createBuffer,
  checkError,
  WebGLContextResult,
} from './webglUtils';
import {
  generateCharacterAtlas,
  createTextureFromAtlas,
  CharacterAtlas,
} from './textureAtlas';
import { getShaderSources } from './shaders';

/**
 * WebGL Donut Renderer Class
 *
 * Implements the same interface as DonutRenderer but uses WebGL for rendering.
 * All calculations moved to GPU via Vertex/Fragment Shaders.
 */
export class WebGLDonutRenderer {
  private config: DonutRendererConfig;
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private program: WebGLProgram;
  private atlas: CharacterAtlas;
  private charTexture: WebGLTexture;

  // Vertex buffer for torus geometry
  private vertexBuffer: WebGLBuffer;
  private vertexCount: number;

  // Attribute locations
  private a_torusCoord: number;

  // Uniform locations
  private u_angleA: WebGLUniformLocation | null;
  private u_angleB: WebGLUniformLocation | null;
  private u_R1: WebGLUniformLocation | null;
  private u_R2: WebGLUniformLocation | null;
  private u_K1: WebGLUniformLocation | null;
  private u_K2: WebGLUniformLocation | null;
  private u_lightDir: WebGLUniformLocation | null;
  private u_charTexture: WebGLUniformLocation | null;
  private u_charCount: WebGLUniformLocation | null;
  private u_color: WebGLUniformLocation | null;
  private u_canvasSize: WebGLUniformLocation | null;

  // WebGL version info
  private isWebGL2: boolean;

  /**
   * Constructor
   *
   * @param config - Renderer configuration (same as Canvas 2D version)
   */
  constructor(config: DonutRendererConfig) {
    this.config = config;

    // Create offscreen canvas for WebGL rendering
    this.canvas = document.createElement('canvas');
    this.canvas.width = config.width * 8; // Scale up for character rendering
    this.canvas.height = config.height * 12;

    // Initialize WebGL context
    const contextResult = createWebGLContext(this.canvas, {
      preferWebGL2: true,
      alpha: false,
      antialias: false,
      preserveDrawingBuffer: true, // Required for readPixels
    });

    if (!contextResult) {
      throw new Error('[WebGLDonutRenderer] WebGL is not supported');
    }

    this.gl = contextResult.gl;
    this.isWebGL2 = contextResult.isWebGL2;

    console.log(
      `[WebGLDonutRenderer] Initialized with WebGL ${contextResult.version}.0`
    );

    // Initialize WebGL resources
    this.atlas = this.createAtlas();
    this.charTexture = this.createTexture();
    this.program = this.createShaderProgram();
    this.vertexBuffer = this.createGeometry();

    // Get attribute and uniform locations
    this.getLocations();

    // Setup rendering state
    this.setupRenderingState();
  }

  /**
   * Render a single frame
   *
   * API compatible with Canvas 2D version.
   *
   * @param angleA - Rotation angle around X axis (radians)
   * @param angleB - Rotation angle around Z axis (radians)
   * @returns ASCII string (with newlines)
   */
  render(angleA: number, angleB: number): string {
    const gl = this.gl;

    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Update rotation uniforms
    gl.uniform1f(this.u_angleA, angleA);
    gl.uniform1f(this.u_angleB, angleB);

    // Draw torus
    gl.drawArrays(gl.POINTS, 0, this.vertexCount);

    checkError(gl, 'render');

    // Convert framebuffer to ASCII string
    return this.framebufferToASCII();
  }

  /**
   * Clean up WebGL resources
   *
   * API compatible with Canvas 2D version.
   */
  dispose(): void {
    const gl = this.gl;

    // Delete WebGL resources
    gl.deleteBuffer(this.vertexBuffer);
    gl.deleteTexture(this.charTexture);
    gl.deleteProgram(this.program);

    console.log('[WebGLDonutRenderer] Resources disposed');
  }

  /**
   * Create character texture atlas
   */
  private createAtlas(): CharacterAtlas {
    return generateCharacterAtlas({
      characters: this.config.luminanceChars,
      charWidth: 16,
      charHeight: 16,
      fontSize: 14,
      color: '#00ff00', // Pip-Boy green
      backgroundColor: 'transparent',
    });
  }

  /**
   * Create WebGL texture from atlas
   */
  private createTexture(): WebGLTexture {
    const texture = createTextureFromAtlas(this.gl, this.atlas);
    if (!texture) {
      throw new Error('[WebGLDonutRenderer] Failed to create texture');
    }
    return texture;
  }

  /**
   * Create and compile shader program
   */
  private createShaderProgram(): WebGLProgram {
    const version = this.isWebGL2 ? 2 : 1;
    const shaderSources = getShaderSources(version);

    const program = createProgram(
      this.gl,
      shaderSources.vertexShader,
      shaderSources.fragmentShader
    );

    if (!program) {
      throw new Error('[WebGLDonutRenderer] Failed to create shader program');
    }

    this.gl.useProgram(program);
    return program;
  }

  /**
   * Create torus geometry (parametric coordinates)
   */
  private createGeometry(): WebGLBuffer {
    const thetaSteps = Math.ceil((Math.PI * 2) / this.config.thetaSpacing);
    const phiSteps = Math.ceil((Math.PI * 2) / this.config.phiSpacing);
    const vertices: number[] = [];

    for (let i = 0; i < thetaSteps; i++) {
      const theta = (i / thetaSteps) * Math.PI * 2;
      for (let j = 0; j < phiSteps; j++) {
        const phi = (j / phiSteps) * Math.PI * 2;
        vertices.push(theta, phi);
      }
    }

    this.vertexCount = vertices.length / 2;

    const buffer = createBuffer(
      this.gl,
      this.gl.ARRAY_BUFFER,
      new Float32Array(vertices),
      this.gl.STATIC_DRAW
    );

    if (!buffer) {
      throw new Error('[WebGLDonutRenderer] Failed to create vertex buffer');
    }

    console.log(
      `[WebGLDonutRenderer] Created geometry with ${this.vertexCount} vertices`
    );

    return buffer;
  }

  /**
   * Get attribute and uniform locations
   */
  private getLocations(): void {
    const gl = this.gl;
    const program = this.program;

    // Attributes
    this.a_torusCoord = getAttribLocation(gl, program, 'a_torusCoord');

    // Uniforms
    this.u_angleA = getUniformLocation(gl, program, 'u_angleA');
    this.u_angleB = getUniformLocation(gl, program, 'u_angleB');
    this.u_R1 = getUniformLocation(gl, program, 'u_R1');
    this.u_R2 = getUniformLocation(gl, program, 'u_R2');
    this.u_K1 = getUniformLocation(gl, program, 'u_K1');
    this.u_K2 = getUniformLocation(gl, program, 'u_K2');
    this.u_lightDir = getUniformLocation(gl, program, 'u_lightDir');
    this.u_charTexture = getUniformLocation(gl, program, 'u_charTexture');
    this.u_charCount = getUniformLocation(gl, program, 'u_charCount');
    this.u_color = getUniformLocation(gl, program, 'u_color');
    this.u_canvasSize = getUniformLocation(gl, program, 'u_canvasSize');
  }

  /**
   * Setup rendering state (once)
   */
  private setupRenderingState(): void {
    const gl = this.gl;

    // Bind vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.enableVertexAttribArray(this.a_torusCoord);
    gl.vertexAttribPointer(this.a_torusCoord, 2, gl.FLOAT, false, 0, 0);

    // Set constant uniforms
    gl.uniform1f(this.u_R1, this.config.R1);
    gl.uniform1f(this.u_R2, this.config.R2);
    gl.uniform1f(this.u_K1, this.config.K1);
    gl.uniform1f(this.u_K2, this.config.K2);
    gl.uniform3f(this.u_lightDir, 0, 0.7071, -0.7071); // Light direction
    gl.uniform1i(this.u_charCount, this.atlas.charCount);
    gl.uniform3f(this.u_color, 0, 1, 0); // Pip-Boy green (RGB)
    gl.uniform2f(this.u_canvasSize, this.canvas.width, this.canvas.height);

    // Bind texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.charTexture);
    gl.uniform1i(this.u_charTexture, 0);

    // Setup viewport
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 1); // Black background

    // Enable blending for transparent characters
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Enable depth test
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    checkError(gl, 'setupRenderingState');
  }

  /**
   * Convert WebGL framebuffer to ASCII string
   *
   * Reads pixels from WebGL canvas and converts to ASCII grid.
   *
   * @returns ASCII string (with newlines)
   */
  private framebufferToASCII(): string {
    const { width, height, luminanceChars } = this.config;
    const gl = this.gl;

    // Create output grid
    const output: string[][] = Array.from({ length: height }, () =>
      Array(width).fill(' ')
    );

    // Read pixels from framebuffer
    const cellWidth = this.canvas.width / width;
    const cellHeight = this.canvas.height / height;
    const pixels = new Uint8Array(4); // RGBA

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Sample center of each cell
        const px = Math.floor((x + 0.5) * cellWidth);
        const py = Math.floor((y + 0.5) * cellHeight);

        // Read pixel (flipped Y for WebGL coordinate system)
        gl.readPixels(
          px,
          this.canvas.height - py - 1,
          1,
          1,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          pixels
        );

        // Convert to luminance (green channel, as we render in green)
        const luminance = pixels[1] / 255; // Green channel

        // Map to character
        if (luminance > 0.01) {
          const charIndex = Math.floor(
            luminance * (luminanceChars.length - 1)
          );
          output[y][x] = luminanceChars[charIndex];
        }
      }
    }

    // Convert to string
    return output.map((row) => row.join('')).join('\n');
  }
}
