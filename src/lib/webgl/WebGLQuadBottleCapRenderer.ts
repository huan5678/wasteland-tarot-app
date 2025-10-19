/**
 * WebGL Quad-based Bottle Cap Renderer
 *
 * GPU-accelerated ASCII renderer using instanced quad rendering.
 * Each ASCII character is rendered as a textured quad directly on GPU.
 * Uses ray-marching SDF for bottle cap geometry.
 */

import { BottleCapConfig } from '../bottleCapRenderer';
import {
  createWebGLContext,
  createProgram,
  getAttribLocation,
  getUniformLocation,
  createBuffer,
  checkError,
} from './webglUtils';
import {
  generateCharacterAtlas,
  createTextureFromAtlas,
  CharacterAtlas,
} from './textureAtlas';
import { getBottleCapShaderSources } from './bottleCapShaders';

/**
 * WebGL Quad-based Bottle Cap Renderer
 *
 * Renders each ASCII character as a quad (2 triangles) directly on GPU.
 * Uses instanced rendering (WebGL 2.0) or manual batching (WebGL 1.0).
 */
export class WebGLQuadBottleCapRenderer {
  private config: BottleCapConfig;
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private gl2: WebGL2RenderingContext | null = null;
  private program: WebGLProgram;
  private atlas: CharacterAtlas;
  private charTexture: WebGLTexture;

  // Buffers
  private quadVertexBuffer: WebGLBuffer; // Quad corner vertices
  private quadIndexBuffer: WebGLBuffer; // Quad indices for 2 triangles
  private gridBuffer: WebGLBuffer; // Grid coordinates
  private gridCount: number; // Number of grid cells

  // Attribute locations
  private a_quadVertex: number;
  private a_torusCoord: number;

  // Uniform locations
  private u_angleA: WebGLUniformLocation | null;
  private u_angleB: WebGLUniformLocation | null;
  private u_radius: WebGLUniformLocation | null;
  private u_thickness: WebGLUniformLocation | null;
  private u_crimpCount: WebGLUniformLocation | null;
  private u_crimpAmplitude: WebGLUniformLocation | null;
  private u_depressionDepth: WebGLUniformLocation | null;
  private u_depressionRadius: WebGLUniformLocation | null;
  private u_K1: WebGLUniformLocation | null;
  private u_K2: WebGLUniformLocation | null;
  private u_lightDir: WebGLUniformLocation | null;
  private u_charTexture: WebGLUniformLocation | null;
  private u_charCount: WebGLUniformLocation | null;
  private u_color: WebGLUniformLocation | null;
  private u_gridSize: WebGLUniformLocation | null;
  private u_charWidth: WebGLUniformLocation | null;
  private u_charHeight: WebGLUniformLocation | null;
  private u_canvasSize: WebGLUniformLocation | null;

  // WebGL version info
  private isWebGL2: boolean;
  private useInstancing: boolean = false;

  /**
   * Constructor
   *
   * @param config - Bottle cap renderer configuration
   */
  constructor(config: BottleCapConfig) {
    this.config = config;

    // Create canvas for rendering
    const charCellWidth = 8;
    const charCellHeight = 12;
    this.canvas = document.createElement('canvas');
    this.canvas.width = config.width * charCellWidth;
    this.canvas.height = config.height * charCellHeight;

    // Initialize WebGL
    const contextResult = createWebGLContext(this.canvas, {
      preferWebGL2: true,
      alpha: true,
      antialias: false,
      preserveDrawingBuffer: false,
    });

    if (!contextResult) {
      throw new Error('[WebGLQuadBottleCapRenderer] WebGL is not supported');
    }

    this.gl = contextResult.gl;
    this.isWebGL2 = contextResult.isWebGL2;

    if (this.isWebGL2) {
      this.gl2 = this.gl as WebGL2RenderingContext;
      this.useInstancing = true;
    }

    console.log(
      `[WebGLQuadBottleCapRenderer] Initialized with WebGL ${contextResult.version}.0` +
        (this.useInstancing ? ' (instanced rendering)' : ' (batched rendering)')
    );

    // Initialize resources
    this.atlas = this.createAtlas();
    this.charTexture = this.createTexture();
    this.program = this.createShaderProgram();

    // Create geometry
    this.quadVertexBuffer = this.createQuadVertices();
    this.quadIndexBuffer = this.createQuadIndices();
    this.gridBuffer = this.createGridCoordinates();

    // Get locations
    this.getLocations();

    // Setup rendering state
    this.setupRenderingState();
  }

  /**
   * Render a single frame
   *
   * @param angleA - Rotation angle around X axis (radians)
   * @param angleB - Rotation angle around Z axis (radians)
   */
  render(angleA: number, angleB: number): void {
    const gl = this.gl;

    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Update rotation uniforms
    gl.uniform1f(this.u_angleA, angleA);
    gl.uniform1f(this.u_angleB, angleB);

    // Draw quads
    if (this.useInstancing && this.gl2) {
      // WebGL 2.0: Use instanced rendering
      this.gl2.drawElementsInstanced(
        gl.TRIANGLES,
        6, // 6 indices per quad (2 triangles)
        gl.UNSIGNED_SHORT,
        0,
        this.gridCount // Number of instances
      );
    } else {
      // WebGL 1.0: Draw each quad individually
      for (let i = 0; i < this.gridCount; i++) {
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      }
    }

    checkError(gl, 'render');
  }

  /**
   * Get the canvas element
   *
   * @returns Canvas element for display
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Clean up WebGL resources
   */
  dispose(): void {
    const gl = this.gl;

    gl.deleteBuffer(this.quadVertexBuffer);
    gl.deleteBuffer(this.quadIndexBuffer);
    gl.deleteBuffer(this.gridBuffer);
    gl.deleteTexture(this.charTexture);
    gl.deleteProgram(this.program);

    console.log('[WebGLQuadBottleCapRenderer] Resources disposed');
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
      color: '#00ff00',
      backgroundColor: 'transparent',
    });
  }

  /**
   * Create WebGL texture from atlas
   */
  private createTexture(): WebGLTexture {
    const texture = createTextureFromAtlas(this.gl, this.atlas);
    if (!texture) {
      throw new Error('[WebGLQuadBottleCapRenderer] Failed to create texture');
    }
    return texture;
  }

  /**
   * Create and compile shader program
   */
  private createShaderProgram(): WebGLProgram {
    const version = this.isWebGL2 ? 2 : 1;
    const shaderSources = getBottleCapShaderSources(version);

    const program = createProgram(
      this.gl,
      shaderSources.vertexShader,
      shaderSources.fragmentShader
    );

    if (!program) {
      throw new Error('[WebGLQuadBottleCapRenderer] Failed to create shader program');
    }

    this.gl.useProgram(program);
    return program;
  }

  /**
   * Create quad vertex buffer
   *
   * Quad corners: [0,0], [1,0], [0,1], [1,1]
   */
  private createQuadVertices(): WebGLBuffer {
    const vertices = new Float32Array([
      0, 0, // Bottom-left
      1, 0, // Bottom-right
      1, 1, // Top-right
      0, 1, // Top-left
    ]);

    const buffer = createBuffer(
      this.gl,
      this.gl.ARRAY_BUFFER,
      vertices,
      this.gl.STATIC_DRAW
    );

    if (!buffer) {
      throw new Error('[WebGLQuadBottleCapRenderer] Failed to create quad vertex buffer');
    }

    return buffer;
  }

  /**
   * Create quad index buffer
   *
   * Two triangles: [0,1,2] and [0,2,3]
   */
  private createQuadIndices(): WebGLBuffer {
    const indices = new Uint16Array([
      0, 1, 2, // First triangle
      0, 2, 3, // Second triangle
    ]);

    const buffer = createBuffer(
      this.gl,
      this.gl.ELEMENT_ARRAY_BUFFER,
      indices,
      this.gl.STATIC_DRAW
    );

    if (!buffer) {
      throw new Error('[WebGLQuadBottleCapRenderer] Failed to create quad index buffer');
    }

    return buffer;
  }

  /**
   * Create ASCII grid coordinates
   *
   * One quad per ASCII character position
   */
  private createGridCoordinates(): WebGLBuffer {
    const coords: number[] = [];

    // Create grid coordinates: one quad per ASCII character position
    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        coords.push(x, y);
      }
    }

    this.gridCount = coords.length / 2;

    const buffer = createBuffer(
      this.gl,
      this.gl.ARRAY_BUFFER,
      new Float32Array(coords),
      this.gl.STATIC_DRAW
    );

    if (!buffer) {
      throw new Error('[WebGLQuadBottleCapRenderer] Failed to create grid buffer');
    }

    console.log(
      `[WebGLQuadBottleCapRenderer] Created ${this.gridCount} grid cells (${this.config.width}×${this.config.height})`
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
    this.a_quadVertex = getAttribLocation(gl, program, 'a_quadVertex');
    this.a_torusCoord = getAttribLocation(gl, program, 'a_torusCoord');

    // Uniforms
    this.u_angleA = getUniformLocation(gl, program, 'u_angleA');
    this.u_angleB = getUniformLocation(gl, program, 'u_angleB');
    this.u_radius = getUniformLocation(gl, program, 'u_radius');
    this.u_thickness = getUniformLocation(gl, program, 'u_thickness');
    this.u_crimpCount = getUniformLocation(gl, program, 'u_crimpCount');
    this.u_crimpAmplitude = getUniformLocation(gl, program, 'u_crimpAmplitude');
    this.u_depressionDepth = getUniformLocation(gl, program, 'u_depressionDepth');
    this.u_depressionRadius = getUniformLocation(gl, program, 'u_depressionRadius');
    this.u_K1 = getUniformLocation(gl, program, 'u_K1');
    this.u_K2 = getUniformLocation(gl, program, 'u_K2');
    this.u_lightDir = getUniformLocation(gl, program, 'u_lightDir');
    this.u_charTexture = getUniformLocation(gl, program, 'u_charTexture');
    this.u_charCount = getUniformLocation(gl, program, 'u_charCount');
    this.u_color = getUniformLocation(gl, program, 'u_color');
    this.u_gridSize = getUniformLocation(gl, program, 'u_gridSize');
    this.u_charWidth = getUniformLocation(gl, program, 'u_charWidth');
    this.u_charHeight = getUniformLocation(gl, program, 'u_charHeight');
    this.u_canvasSize = getUniformLocation(gl, program, 'u_canvasSize');
  }

  /**
   * Setup rendering state
   */
  private setupRenderingState(): void {
    const gl = this.gl;
    const gl2 = this.gl2;

    // Bind quad vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVertexBuffer);
    gl.enableVertexAttribArray(this.a_quadVertex);
    gl.vertexAttribPointer(this.a_quadVertex, 2, gl.FLOAT, false, 0, 0);

    // Bind grid coordinates
    gl.bindBuffer(gl.ARRAY_BUFFER, this.gridBuffer);
    gl.enableVertexAttribArray(this.a_torusCoord);
    gl.vertexAttribPointer(this.a_torusCoord, 2, gl.FLOAT, false, 0, 0);

    // Set instancing divisor (WebGL 2.0 only)
    if (gl2) {
      gl2.vertexAttribDivisor(this.a_quadVertex, 0); // Per-vertex
      gl2.vertexAttribDivisor(this.a_torusCoord, 1); // Per-instance
    }

    // Bind quad indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.quadIndexBuffer);

    // Set constant uniforms
    gl.uniform1f(this.u_radius, this.config.radius);
    gl.uniform1f(this.u_thickness, this.config.thickness);
    gl.uniform1f(this.u_crimpCount, this.config.crimpCount);
    gl.uniform1f(this.u_crimpAmplitude, this.config.crimpAmplitude);
    gl.uniform1f(this.u_depressionDepth, this.config.depressionDepth);
    gl.uniform1f(this.u_depressionRadius, this.config.depressionRadius);
    gl.uniform1f(this.u_K1, this.config.K1);
    gl.uniform1f(this.u_K2, this.config.K2);
    gl.uniform3f(this.u_lightDir, 0, 0.7071, -0.7071);
    gl.uniform1i(this.u_charCount, this.atlas.charCount);
    gl.uniform3f(this.u_color, 0, 1, 0); // Pip-Boy green
    gl.uniform2f(this.u_gridSize, this.config.width, this.config.height);
    gl.uniform1f(this.u_charWidth, this.canvas.width / this.config.width);
    gl.uniform1f(this.u_charHeight, this.canvas.height / this.config.height);
    gl.uniform2f(this.u_canvasSize, this.canvas.width, this.canvas.height);

    // Bind texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.charTexture);
    gl.uniform1i(this.u_charTexture, 0);

    // Setup viewport
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 1);

    // Enable blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Enable depth test
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    checkError(gl, 'setupRenderingState');
  }
}
