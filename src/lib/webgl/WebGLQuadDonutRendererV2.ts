/**
 * WebGL Quad-based Donut Renderer V2
 *
 * OPTIMIZED: Uses full-screen quad + fragment shader ray-marching
 * Based on WebGL best practices:
 * - Fragment shader does all ray-marching (not vertex shader)
 * - Single quad instead of 1,920 quads
 * - Optimized SDF calculations
 */

import { DonutRendererConfig } from '../donutConfig';
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

/**
 * WebGL Quad-based Donut Renderer V2
 *
 * Renders ASCII donut using a single full-screen quad.
 * All ray-marching happens in fragment shader (best practice).
 */
export class WebGLQuadDonutRendererV2 {
  private config: DonutRendererConfig;
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private gl2: WebGL2RenderingContext | null = null;
  private program: WebGLProgram;
  private atlas: CharacterAtlas;
  private charTexture: WebGLTexture;

  // Buffers
  private quadVertexBuffer: WebGLBuffer; // Full-screen quad vertices
  private quadIndexBuffer: WebGLBuffer; // Quad indices

  // Attribute locations
  private a_position: number;

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
  private u_gridSize: WebGLUniformLocation | null;
  private u_charWidth: WebGLUniformLocation | null;
  private u_charHeight: WebGLUniformLocation | null;
  private u_canvasSize: WebGLUniformLocation | null;

  // WebGL version info
  private isWebGL2: boolean;

  constructor(config: DonutRendererConfig) {
    this.config = config;

    // Create canvas for rendering
    const charCellWidth = 8;
    const charCellHeight = 12;
    this.canvas = document.createElement('canvas');
    this.canvas.width = config.width * charCellWidth;
    this.canvas.height = config.height * charCellHeight;

    // Set CSS size to scale up the canvas for better visibility
    // The canvas logical size stays at width x height for crisp rendering
    // but CSS display size is scaled up
    this.canvas.style.width = '100%';
    this.canvas.style.maxWidth = `${this.canvas.width}px`;
    this.canvas.style.height = 'auto';
    this.canvas.style.imageRendering = 'pixelated'; // Crisp pixel scaling

    // Initialize WebGL
    const contextResult = createWebGLContext(this.canvas, {
      preferWebGL2: true,
      alpha: true,
      antialias: false,
      preserveDrawingBuffer: false,
    });

    if (!contextResult) {
      throw new Error('[WebGLQuadDonutRendererV2] WebGL is not supported');
    }

    this.gl = contextResult.gl;
    this.isWebGL2 = contextResult.isWebGL2;

    if (this.isWebGL2) {
      this.gl2 = this.gl as WebGL2RenderingContext;
    }

    console.log(
      `[WebGLQuadDonutRendererV2] Initialized with WebGL ${contextResult.version}.0 (full-screen quad + fragment shader)`
    );

    // Initialize resources
    this.atlas = this.createAtlas();
    this.charTexture = this.createTexture();
    this.program = this.createShaderProgram();

    // Create geometry (single full-screen quad)
    this.quadVertexBuffer = this.createQuadVertices();
    this.quadIndexBuffer = this.createQuadIndices();

    // Get locations
    this.getLocations();

    // Setup rendering state
    this.setupRenderingState();
  }

  render(angleA: number, angleB: number): string {
    const gl = this.gl;

    // CRITICAL: Ensure program is active before updating uniforms!
    gl.useProgram(this.program);

    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Update rotation uniforms
    gl.uniform1f(this.u_angleA, angleA);
    gl.uniform1f(this.u_angleB, angleB);

    // Draw single full-screen quad
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    checkError(gl, 'render');

    return '';
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  dispose(): void {
    const gl = this.gl;

    gl.deleteBuffer(this.quadVertexBuffer);
    gl.deleteBuffer(this.quadIndexBuffer);
    gl.deleteTexture(this.charTexture);
    gl.deleteProgram(this.program);

    console.log('[WebGLQuadDonutRendererV2] Resources disposed');
  }

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

  private createTexture(): WebGLTexture {
    const texture = createTextureFromAtlas(this.gl, this.atlas);
    if (!texture) {
      throw new Error('[WebGLQuadDonutRendererV2] Failed to create texture');
    }
    return texture;
  }

  private createShaderProgram(): WebGLProgram {
    const version = this.isWebGL2 ? 2 : 1;
    const vertexShader = this.getVertexShader(version);
    const fragmentShader = this.getFragmentShader(version);

    const program = createProgram(this.gl, vertexShader, fragmentShader);

    if (!program) {
      throw new Error('[WebGLQuadDonutRendererV2] Failed to create shader program');
    }

    this.gl.useProgram(program);
    return program;
  }

  private getVertexShader(version: 1 | 2): string {
    if (version === 2) {
      return `#version 300 es
precision highp float;

in vec2 a_position;  // Clip space position [-1, 1]

out vec2 v_screenPos;  // Pass to fragment shader

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_screenPos = a_position;
}
`;
    } else {
      return `
precision highp float;

attribute vec2 a_position;

varying vec2 v_screenPos;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_screenPos = a_position;
}
`;
    }
  }

  private getFragmentShader(version: 1 | 2): string {
    if (version === 2) {
      return `#version 300 es
precision highp float;

in vec2 v_screenPos;

uniform float u_angleA;
uniform float u_angleB;
uniform float u_R1;
uniform float u_R2;
uniform float u_K1;
uniform float u_K2;
uniform vec3 u_lightDir;
uniform sampler2D u_charTexture;
uniform int u_charCount;
uniform vec3 u_color;
uniform vec2 u_gridSize;
uniform float u_charWidth;
uniform float u_charHeight;
uniform vec2 u_canvasSize;

out vec4 fragColor;

// OPTIMIZED: Reduced iterations
const int MAX_STEPS = 64;
const float MIN_DIST = 0.005;
const float MAX_DIST = 50.0;

// Torus SDF
float sdTorus(vec3 p, float R1, float R2) {
  vec2 q = vec2(length(p.xz) - R2, p.y);
  return length(q) - R1;
}

// OPTIMIZED: Ray-march with early termination
float rayMarch(vec3 ro, vec3 rd, float R1, float R2) {
  float t = 0.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * t;
    float d = sdTorus(p, R1, R2);

    if (d < MIN_DIST) return t;  // Hit
    if (t > MAX_DIST) break;     // Miss

    t += d * 0.9;  // OPTIMIZED: Safety factor for faster marching
  }
  return -1.0;
}

// OPTIMIZED: 3-tap normal (instead of 6-tap)
vec3 calcNormal(vec3 p, float R1, float R2) {
  float eps = 0.002;
  vec2 h = vec2(eps, 0.0);
  return normalize(vec3(
    sdTorus(p + h.xyy, R1, R2) - sdTorus(p - h.xyy, R1, R2),
    sdTorus(p + h.yxy, R1, R2) - sdTorus(p - h.yxy, R1, R2),
    sdTorus(p + h.yyx, R1, R2) - sdTorus(p - h.yyx, R1, R2)
  ));
}

// Rotation matrices (same as V1)
mat3 rotateX(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat3(
    1.0, 0.0, 0.0,
    0.0, c, -s,
    0.0, s, c
  );
}

mat3 rotateZ(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat3(
    c, -s, 0.0,
    s, c, 0.0,
    0.0, 0.0, 1.0
  );
}

void main() {
  // Convert screen position to pixel coordinates
  vec2 pixelCoord = (v_screenPos * 0.5 + 0.5) * u_canvasSize;

  // Calculate grid cell (for character selection)
  vec2 gridCoord = floor(pixelCoord / vec2(u_charWidth, u_charHeight));

  // Check if within grid bounds
  if (gridCoord.x < 0.0 || gridCoord.x >= u_gridSize.x ||
      gridCoord.y < 0.0 || gridCoord.y >= u_gridSize.y) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // FIXED: Use pixel coordinates (not grid coordinates) for ray direction
  // This ensures each pixel has its own ray, not one ray per character cell
  float screenX = pixelCoord.x - u_canvasSize.x * 0.5;
  float screenY = u_canvasSize.y * 0.5 - pixelCoord.y;

  // Calculate ray (one per pixel)
  vec3 rayOrigin = vec3(0.0, 0.0, -u_K2);
  vec3 rayDir = normalize(vec3(screenX / u_K1, screenY / u_K1, 1.0));

  // Apply inverse rotation to ray (rotate world instead of ray)
  mat3 rotation = rotateX(u_angleA) * rotateZ(u_angleB);
  mat3 invRotation = transpose(rotation);
  rayDir = invRotation * rayDir;
  rayOrigin = invRotation * rayOrigin;

  // Ray-march
  float t = rayMarch(rayOrigin, rayDir, u_R1, u_R2);

  if (t < 0.0) {
    // Miss - no character
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // Hit - calculate lighting
  vec3 hitPoint = rayOrigin + rayDir * t;
  vec3 normal = calcNormal(hitPoint, u_R1, u_R2);
  normal = rotation * normal;

  float luminance = dot(normal, normalize(u_lightDir));
  luminance = (luminance + 1.0) * 0.5;

  // Select character
  int charIndex = int(luminance * float(u_charCount - 1));

  // Calculate texture coordinates
  vec2 cellOffset = mod(pixelCoord, vec2(u_charWidth, u_charHeight));
  vec2 charUV = cellOffset / vec2(u_charWidth, u_charHeight);

  float uMin = float(charIndex) / float(u_charCount);
  float uMax = float(charIndex + 1) / float(u_charCount);

  vec2 texCoord = vec2(
    uMin + charUV.x * (uMax - uMin),
    charUV.y
  );

  // Sample character texture
  vec4 texColor = texture(u_charTexture, texCoord);

  // Apply color
  fragColor = vec4(u_color * texColor.rgb, texColor.a);

  if (fragColor.a < 0.01) {
    discard;
  }
}
`;
    } else {
      // WebGL 1.0 version (similar logic with different syntax)
      return `
precision highp float;

varying vec2 v_screenPos;

uniform float u_angleA;
uniform float u_angleB;
uniform float u_R1;
uniform float u_R2;
uniform float u_K1;
uniform float u_K2;
uniform vec3 u_lightDir;
uniform sampler2D u_charTexture;
uniform int u_charCount;
uniform vec3 u_color;
uniform vec2 u_gridSize;
uniform float u_charWidth;
uniform float u_charHeight;
uniform vec2 u_canvasSize;

const int MAX_STEPS = 64;
const float MIN_DIST = 0.005;
const float MAX_DIST = 50.0;

float sdTorus(vec3 p, float R1, float R2) {
  vec2 q = vec2(length(p.xz) - R2, p.y);
  return length(q) - R1;
}

float rayMarch(vec3 ro, vec3 rd, float R1, float R2) {
  float t = 0.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * t;
    float d = sdTorus(p, R1, R2);
    if (d < MIN_DIST) return t;
    if (t > MAX_DIST) break;
    t += d * 0.9;
  }
  return -1.0;
}

vec3 calcNormal(vec3 p, float R1, float R2) {
  float eps = 0.002;
  vec2 h = vec2(eps, 0.0);
  return normalize(vec3(
    sdTorus(p + h.xyy, R1, R2) - sdTorus(p - h.xyy, R1, R2),
    sdTorus(p + h.yxy, R1, R2) - sdTorus(p - h.yxy, R1, R2),
    sdTorus(p + h.yyx, R1, R2) - sdTorus(p - h.yyx, R1, R2)
  ));
}

mat3 rotateX(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat3(
    1.0, 0.0, 0.0,
    0.0, c, -s,
    0.0, s, c
  );
}

mat3 rotateZ(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat3(
    c, -s, 0.0,
    s, c, 0.0,
    0.0, 0.0, 1.0
  );
}

mat3 transpose3(mat3 m) {
  return mat3(
    m[0][0], m[1][0], m[2][0],
    m[0][1], m[1][1], m[2][1],
    m[0][2], m[1][2], m[2][2]
  );
}

void main() {
  vec2 pixelCoord = (v_screenPos * 0.5 + 0.5) * u_canvasSize;
  vec2 gridCoord = floor(pixelCoord / vec2(u_charWidth, u_charHeight));

  if (gridCoord.x < 0.0 || gridCoord.x >= u_gridSize.x ||
      gridCoord.y < 0.0 || gridCoord.y >= u_gridSize.y) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // FIXED: Use pixel coordinates for ray direction
  float screenX = pixelCoord.x - u_canvasSize.x * 0.5;
  float screenY = u_canvasSize.y * 0.5 - pixelCoord.y;

  vec3 rayOrigin = vec3(0.0, 0.0, -u_K2);
  vec3 rayDir = normalize(vec3(screenX / u_K1, screenY / u_K1, 1.0));

  mat3 rotation = rotateX(u_angleA) * rotateZ(u_angleB);
  mat3 invRotation = transpose3(rotation);
  rayDir = invRotation * rayDir;
  rayOrigin = invRotation * rayOrigin;

  float t = rayMarch(rayOrigin, rayDir, u_R1, u_R2);

  if (t < 0.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  vec3 hitPoint = rayOrigin + rayDir * t;
  vec3 normal = calcNormal(hitPoint, u_R1, u_R2);
  normal = rotation * normal;

  float luminance = dot(normal, normalize(u_lightDir));
  luminance = (luminance + 1.0) * 0.5;

  int charIndex = int(luminance * float(u_charCount - 1));

  vec2 cellOffset = mod(pixelCoord, vec2(u_charWidth, u_charHeight));
  vec2 charUV = cellOffset / vec2(u_charWidth, u_charHeight);

  float uMin = float(charIndex) / float(u_charCount);
  float uMax = float(charIndex + 1) / float(u_charCount);

  vec2 texCoord = vec2(
    uMin + charUV.x * (uMax - uMin),
    charUV.y
  );

  vec4 texColor = texture2D(u_charTexture, texCoord);
  gl_FragColor = vec4(u_color * texColor.rgb, texColor.a);

  if (gl_FragColor.a < 0.01) {
    discard;
  }
}
`;
    }
  }

  private createQuadVertices(): WebGLBuffer {
    // Full-screen quad in clip space
    const vertices = new Float32Array([
      -1.0, -1.0, // Bottom-left
       1.0, -1.0, // Bottom-right
       1.0,  1.0, // Top-right
      -1.0,  1.0, // Top-left
    ]);

    const buffer = createBuffer(
      this.gl,
      this.gl.ARRAY_BUFFER,
      vertices,
      this.gl.STATIC_DRAW
    );

    if (!buffer) {
      throw new Error('[WebGLQuadDonutRendererV2] Failed to create quad vertex buffer');
    }

    return buffer;
  }

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
      throw new Error('[WebGLQuadDonutRendererV2] Failed to create quad index buffer');
    }

    return buffer;
  }

  private getLocations(): void {
    const gl = this.gl;
    const program = this.program;

    // Attributes
    this.a_position = getAttribLocation(gl, program, 'a_position');

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
    this.u_gridSize = getUniformLocation(gl, program, 'u_gridSize');
    this.u_charWidth = getUniformLocation(gl, program, 'u_charWidth');
    this.u_charHeight = getUniformLocation(gl, program, 'u_charHeight');
    this.u_canvasSize = getUniformLocation(gl, program, 'u_canvasSize');
  }

  private setupRenderingState(): void {
    const gl = this.gl;

    // Bind quad vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVertexBuffer);
    gl.enableVertexAttribArray(this.a_position);
    gl.vertexAttribPointer(this.a_position, 2, gl.FLOAT, false, 0, 0);

    // Bind quad indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.quadIndexBuffer);

    // Set constant uniforms
    gl.uniform1f(this.u_R1, this.config.R1);
    gl.uniform1f(this.u_R2, this.config.R2);
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

    checkError(gl, 'setupRenderingState');
  }
}
