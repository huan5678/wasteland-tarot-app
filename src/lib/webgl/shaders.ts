/**
 * WebGL Shader Sources
 *
 * Contains GLSL shader source code for rendering ASCII donut on GPU.
 * Shaders are written for WebGL 2.0 with fallback support for WebGL 1.0.
 */

/**
 * Vertex Shader (WebGL 2.0)
 *
 * Processes each vertex of the torus geometry.
 * Calculates:
 * - 3D rotation (angleA, angleB)
 * - Perspective projection
 * - Surface normal for lighting
 * - Luminance value passed to fragment shader
 */
export const vertexShaderSource = `#version 300 es
precision highp float;

// Attributes (per-vertex input)
in vec2 a_torusCoord;  // (theta, phi) parametric coordinates on torus surface

// Uniforms (constant for all vertices in draw call)
uniform float u_angleA;     // Rotation angle around X-axis
uniform float u_angleB;     // Rotation angle around Z-axis
uniform float u_R1;         // Torus cross-section radius
uniform float u_R2;         // Distance from torus center to tube center
uniform float u_K1;         // Perspective projection distance
uniform float u_K2;         // Observer distance from origin
uniform vec3 u_lightDir;    // Light direction (normalized)
uniform vec2 u_canvasSize;  // Canvas size (width, height) for clip space conversion

// Outputs (passed to fragment shader)
out float v_luminance;      // Surface luminance [0, 1]
out float v_depth;          // Depth value for z-buffer

void main() {
  float theta = a_torusCoord.x;
  float phi = a_torusCoord.y;

  // Precompute trigonometric values
  float cosTheta = cos(theta);
  float sinTheta = sin(theta);
  float cosPhi = cos(phi);
  float sinPhi = sin(phi);
  float cosA = cos(u_angleA);
  float sinA = sin(u_angleA);
  float cosB = cos(u_angleB);
  float sinB = sin(u_angleB);

  // Torus parametric equations
  // Circle in XY plane, radius R1, centered at (R2, 0)
  float circleX = u_R2 + u_R1 * cosTheta;
  float circleY = u_R1 * sinTheta;

  // 3D position after rotation
  // Rotation matrix: Rz(angleB) * Rx(angleA)
  float x = circleX * (cosB * cosPhi + sinA * sinB * sinPhi) -
            circleY * cosA * sinB;
  float y = circleX * (sinB * cosPhi - sinA * cosB * sinPhi) +
            circleY * cosA * cosB;
  float z = u_K2 + cosA * circleX * sinPhi + circleY * sinA;

  // Surface normal (for lighting calculation)
  // Normal = ∂P/∂θ × ∂P/∂φ (cross product of tangent vectors)
  float nx = cosB * cosPhi + sinA * sinB * sinPhi;
  float ny = sinB * cosPhi - sinA * cosB * sinPhi;
  float nz = cosA * sinPhi;

  // Normalize normal vector
  float nLen = sqrt(nx * nx + ny * ny + nz * nz);
  nx /= nLen;
  ny /= nLen;
  nz /= nLen;

  // Lambertian reflectance: luminance = max(0, N · L)
  float luminance = dot(vec3(nx, ny, nz), u_lightDir);

  // Map luminance from [-1, 1] to [0, 1]
  v_luminance = (luminance + 1.0) * 0.5;

  // Perspective projection
  float ooz = 1.0 / z;  // One over Z (inverse depth)
  v_depth = ooz;

  // Screen space coordinates
  float xp = x * u_K1 * ooz;
  float yp = y * u_K1 * ooz;

  // Convert to clip space [-1, 1]
  // Normalize by half of canvas size
  float clipX = xp / (u_canvasSize.x * 0.5);
  float clipY = yp / (u_canvasSize.y * 0.5);

  gl_Position = vec4(clipX, clipY, 0.0, 1.0);

  // Point size for rendering (in pixels)
  gl_PointSize = 1.0;
}
`;

/**
 * Fragment Shader (WebGL 2.0)
 *
 * Processes each pixel (fragment) of the rendered geometry.
 * Samples character from texture atlas based on luminance value.
 */
export const fragmentShaderSource = `#version 300 es
precision highp float;

// Inputs (from vertex shader)
in float v_luminance;       // Surface luminance [0, 1]
in float v_depth;           // Depth value

// Uniforms
uniform sampler2D u_charTexture;  // Character atlas texture
uniform int u_charCount;          // Number of characters in atlas
uniform vec3 u_color;             // Output color (Pip-Boy green)

// Output
out vec4 fragColor;

void main() {
  // Map luminance to character index
  // Darker surfaces use lower indices (e.g., '.'), brighter use higher (e.g., '@')
  float charIndexFloat = v_luminance * float(u_charCount - 1);
  int charIndex = int(charIndexFloat);

  // Calculate UV coordinates for character in atlas
  // Atlas is a horizontal strip: each character occupies 1/charCount of width
  float uMin = float(charIndex) / float(u_charCount);
  float uMax = float(charIndex + 1) / float(u_charCount);
  float vMin = 0.0;
  float vMax = 1.0;

  // Sample from center of character cell
  float u = (uMin + uMax) * 0.5;
  float v = 0.5;

  // Sample character texture
  vec4 texColor = texture(u_charTexture, vec2(u, v));

  // Apply Pip-Boy green color tint
  // Alpha channel from texture determines character visibility
  fragColor = vec4(u_color * texColor.rgb, texColor.a);

  // Discard fully transparent fragments (optimization)
  if (fragColor.a < 0.01) {
    discard;
  }
}
`;

/**
 * Vertex Shader (WebGL 1.0 Fallback)
 *
 * Compatible with older devices that don't support WebGL 2.0.
 * Uses older GLSL syntax (no #version directive, attribute/varying keywords).
 */
export const vertexShaderSourceV1 = `
precision highp float;

// Attributes (per-vertex input)
attribute vec2 a_torusCoord;  // (theta, phi) parametric coordinates

// Uniforms
uniform float u_angleA;
uniform float u_angleB;
uniform float u_R1;
uniform float u_R2;
uniform float u_K1;
uniform float u_K2;
uniform vec3 u_lightDir;
uniform vec2 u_canvasSize;

// Varyings (passed to fragment shader)
varying float v_luminance;
varying float v_depth;

void main() {
  float theta = a_torusCoord.x;
  float phi = a_torusCoord.y;

  // Precompute trigonometric values
  float cosTheta = cos(theta);
  float sinTheta = sin(theta);
  float cosPhi = cos(phi);
  float sinPhi = sin(phi);
  float cosA = cos(u_angleA);
  float sinA = sin(u_angleA);
  float cosB = cos(u_angleB);
  float sinB = sin(u_angleB);

  // Torus parametric equations
  float circleX = u_R2 + u_R1 * cosTheta;
  float circleY = u_R1 * sinTheta;

  // 3D position after rotation
  float x = circleX * (cosB * cosPhi + sinA * sinB * sinPhi) -
            circleY * cosA * sinB;
  float y = circleX * (sinB * cosPhi - sinA * cosB * sinPhi) +
            circleY * cosA * cosB;
  float z = u_K2 + cosA * circleX * sinPhi + circleY * sinA;

  // Surface normal
  float nx = cosB * cosPhi + sinA * sinB * sinPhi;
  float ny = sinB * cosPhi - sinA * cosB * sinPhi;
  float nz = cosA * sinPhi;

  // Normalize
  float nLen = sqrt(nx * nx + ny * ny + nz * nz);
  nx /= nLen;
  ny /= nLen;
  nz /= nLen;

  // Lambertian reflectance
  float luminance = dot(vec3(nx, ny, nz), u_lightDir);
  v_luminance = (luminance + 1.0) * 0.5;

  // Perspective projection
  float ooz = 1.0 / z;
  v_depth = ooz;

  float xp = x * u_K1 * ooz;
  float yp = y * u_K1 * ooz;

  // Convert to clip space [-1, 1]
  float clipX = xp / (u_canvasSize.x * 0.5);
  float clipY = yp / (u_canvasSize.y * 0.5);

  gl_Position = vec4(clipX, clipY, 0.0, 1.0);
  gl_PointSize = 1.0;
}
`;

/**
 * Fragment Shader (WebGL 1.0 Fallback)
 */
export const fragmentShaderSourceV1 = `
precision highp float;

// Varyings (from vertex shader)
varying float v_luminance;
varying float v_depth;

// Uniforms
uniform sampler2D u_charTexture;
uniform int u_charCount;
uniform vec3 u_color;

void main() {
  // Map luminance to character index
  float charIndexFloat = v_luminance * float(u_charCount - 1);
  int charIndex = int(charIndexFloat);

  // Calculate UV coordinates
  float uMin = float(charIndex) / float(u_charCount);
  float uMax = float(charIndex + 1) / float(u_charCount);

  float u = (uMin + uMax) * 0.5;
  float v = 0.5;

  // Sample texture
  vec4 texColor = texture2D(u_charTexture, vec2(u, v));

  // Apply color tint
  gl_FragColor = vec4(u_color * texColor.rgb, texColor.a);

  // Discard transparent fragments
  if (gl_FragColor.a < 0.01) {
    discard;
  }
}
`;

/**
 * Shader configuration interface
 */
export interface ShaderConfig {
  /** WebGL version (1 or 2) */
  version: 1 | 2;
  /** Vertex shader source code */
  vertexShader: string;
  /** Fragment shader source code */
  fragmentShader: string;
}

/**
 * Get shader sources for specified WebGL version
 *
 * @param version - WebGL version (1 or 2)
 * @returns Shader configuration
 */
export function getShaderSources(version: 1 | 2): ShaderConfig {
  if (version === 2) {
    return {
      version: 2,
      vertexShader: vertexShaderSource,
      fragmentShader: fragmentShaderSource,
    };
  } else {
    return {
      version: 1,
      vertexShader: vertexShaderSourceV1,
      fragmentShader: fragmentShaderSourceV1,
    };
  }
}
