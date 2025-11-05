/**
 * WebGL Utility Functions
 *
 * Provides helper functions for WebGL context creation, shader compilation,
 * and error handling.
 */

/**
 * WebGL context creation options
 */
export interface WebGLContextOptions {
  /** Prefer WebGL 2.0 over WebGL 1.0 */
  preferWebGL2?: boolean;
  /** Enable alpha channel */
  alpha?: boolean;
  /** Enable antialiasing */
  antialias?: boolean;
  /** Preserve drawing buffer */
  preserveDrawingBuffer?: boolean;
}

/**
 * WebGL context result
 */
export interface WebGLContextResult {
  /** WebGL rendering context (WebGL2 or WebGL1) */
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  /** WebGL version (1 or 2) */
  version: 1 | 2;
  /** Whether WebGL 2.0 is supported */
  isWebGL2: boolean;
}

/**
 * Create WebGL context with fallback support
 *
 * Tries to create WebGL 2.0 context first, falls back to WebGL 1.0 if unavailable.
 *
 * @param canvas - Canvas element
 * @param options - WebGL context options
 * @returns WebGL context result or null if WebGL is not supported
 */
export function createWebGLContext(
  canvas: HTMLCanvasElement,
  options: WebGLContextOptions = {}
): WebGLContextResult | null {
  const {
    preferWebGL2 = true,
    alpha = false,
    antialias = false,
    preserveDrawingBuffer = false,
  } = options;

  const contextAttributes: WebGLContextAttributes = {
    alpha,
    antialias,
    preserveDrawingBuffer,
  };

  // Try WebGL 2.0 first
  if (preferWebGL2) {
    const gl2 = canvas.getContext('webgl2', contextAttributes) as WebGL2RenderingContext | null;
    if (gl2) {
      return {
        gl: gl2,
        version: 2,
        isWebGL2: true,
      };
    }
  }

  // Fallback to WebGL 1.0
  const gl1 = canvas.getContext('webgl', contextAttributes) as WebGLRenderingContext | null;
  if (gl1) {
    return {
      gl: gl1,
      version: 1,
      isWebGL2: false,
    };
  }

  // WebGL not supported - return null without throwing error
  console.warn('[WebGL] WebGL is not supported in this browser, falling back to CPU rendering');
  return null;
}

/**
 * Compile a WebGL shader
 *
 * @param gl - WebGL rendering context
 * @param type - Shader type (VERTEX_SHADER or FRAGMENT_SHADER)
 * @param source - Shader source code (GLSL)
 * @returns Compiled shader or null on error
 */
export function compileShader(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error('[WebGL] Failed to create shader');
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  // Check compilation status
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    console.error('[WebGL] Shader compilation failed:', info);
    console.error('[WebGL] Shader source:', source);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

/**
 * Create and link a WebGL program from vertex and fragment shaders
 *
 * @param gl - WebGL rendering context
 * @param vertexShaderSource - Vertex shader source code (GLSL)
 * @param fragmentShaderSource - Fragment shader source code (GLSL)
 * @returns Linked program or null on error
 */
export function createProgram(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  vertexShaderSource: string,
  fragmentShaderSource: string
): WebGLProgram | null {
  // Compile shaders
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  if (!vertexShader) return null;

  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  if (!fragmentShader) {
    gl.deleteShader(vertexShader);
    return null;
  }

  // Create and link program
  const program = gl.createProgram();
  if (!program) {
    console.error('[WebGL] Failed to create program');
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  // Check linking status
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    console.error('[WebGL] Program linking failed:', info);
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  // Clean up shaders (no longer needed after linking)
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

/**
 * Get attribute location with error handling
 *
 * @param gl - WebGL rendering context
 * @param program - WebGL program
 * @param name - Attribute name
 * @returns Attribute location or -1 on error
 */
export function getAttribLocation(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  program: WebGLProgram,
  name: string
): number {
  const location = gl.getAttribLocation(program, name);
  if (location === -1) {
    console.warn(`[WebGL] Attribute '${name}' not found in program`);
  }
  return location;
}

/**
 * Get uniform location with error handling
 *
 * @param gl - WebGL rendering context
 * @param program - WebGL program
 * @param name - Uniform name
 * @returns Uniform location or null on error
 */
export function getUniformLocation(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  program: WebGLProgram,
  name: string
): WebGLUniformLocation | null {
  const location = gl.getUniformLocation(program, name);
  if (!location) {
    console.warn(`[WebGL] Uniform '${name}' not found in program`);
  }
  return location;
}

/**
 * Create and bind a buffer
 *
 * @param gl - WebGL rendering context
 * @param target - Buffer target (ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER)
 * @param data - Buffer data
 * @param usage - Buffer usage hint (STATIC_DRAW, DYNAMIC_DRAW, etc.)
 * @returns WebGL buffer or null on error
 */
export function createBuffer(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  target: number,
  data: BufferSource,
  usage: number
): WebGLBuffer | null {
  const buffer = gl.createBuffer();
  if (!buffer) {
    console.error('[WebGL] Failed to create buffer');
    return null;
  }

  gl.bindBuffer(target, buffer);
  gl.bufferData(target, data, usage);

  return buffer;
}

/**
 * Check if WebGL is supported
 *
 * @param preferWebGL2 - Check for WebGL 2.0 support
 * @returns true if WebGL is supported
 */
export function isWebGLSupported(preferWebGL2: boolean = false): boolean {
  const canvas = document.createElement('canvas');

  if (preferWebGL2) {
    const gl2 = canvas.getContext('webgl2');
    if (gl2) return true;
  }

  const gl1 = canvas.getContext('webgl');
  return gl1 !== null;
}

/**
 * Get WebGL error name
 *
 * @param gl - WebGL rendering context
 * @param error - Error code
 * @returns Error name string
 */
export function getErrorName(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  error: number
): string {
  switch (error) {
    case gl.NO_ERROR:
      return 'NO_ERROR';
    case gl.INVALID_ENUM:
      return 'INVALID_ENUM';
    case gl.INVALID_VALUE:
      return 'INVALID_VALUE';
    case gl.INVALID_OPERATION:
      return 'INVALID_OPERATION';
    case gl.INVALID_FRAMEBUFFER_OPERATION:
      return 'INVALID_FRAMEBUFFER_OPERATION';
    case gl.OUT_OF_MEMORY:
      return 'OUT_OF_MEMORY';
    case gl.CONTEXT_LOST_WEBGL:
      return 'CONTEXT_LOST_WEBGL';
    default:
      return `UNKNOWN_ERROR (${error})`;
  }
}

/**
 * Check for WebGL errors
 *
 * @param gl - WebGL rendering context
 * @param context - Context string for error message
 */
export function checkError(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  context: string = ''
): void {
  const error = gl.getError();
  if (error !== gl.NO_ERROR) {
    const errorName = getErrorName(gl, error);
    console.error(`[WebGL] Error in ${context}: ${errorName}`);
  }
}
