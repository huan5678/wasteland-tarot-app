/**
 * Quad-based ASCII Rendering Shaders
 *
 * These shaders render each ASCII character as a textured quad.
 * More efficient and accurate than point-based rendering.
 */

/**
 * Vertex Shader for Quad Rendering (WebGL 2.0)
 *
 * FIXED: Grid-based architecture
 * Each quad instance represents one ASCII grid cell.
 * The shader performs reverse ray-tracing to find what should be displayed at each cell.
 */
export const quadVertexShaderSource = `#version 300 es
precision highp float;

// Per-vertex attributes
in vec2 a_quadVertex;      // Quad corner position [0,0] to [1,1]

// Per-instance attributes (FIXED: now grid coordinates instead of torus coordinates)
in vec2 a_torusCoord;      // (gridX, gridY) ASCII grid cell coordinates

// Uniforms
uniform float u_angleA;
uniform float u_angleB;
uniform float u_R1;
uniform float u_R2;
uniform float u_K1;
uniform float u_K2;
uniform vec3 u_lightDir;
uniform vec2 u_gridSize;    // ASCII grid size (width, height)
uniform float u_charWidth;  // Character cell width in pixels
uniform float u_charHeight; // Character cell height in pixels
uniform vec2 u_canvasSize;  // Canvas size in pixels

// Outputs to fragment shader
out vec2 v_texCoord;        // Texture coordinates for character atlas
out float v_charIndex;      // Character index to sample

// Constants
const int MAX_STEPS = 100;
const float MIN_DIST = 0.01;
const float MAX_DIST = 100.0;

// Torus SDF (Signed Distance Function)
float sdTorus(vec3 p, float R1, float R2) {
  vec2 q = vec2(length(p.xz) - R2, p.y);
  return length(q) - R1;
}

// Ray-march to find torus surface
float rayMarch(vec3 ro, vec3 rd, float R1, float R2) {
  float t = 0.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * t;
    float d = sdTorus(p, R1, R2);
    if (d < MIN_DIST) return t;
    if (t > MAX_DIST) break;
    t += d;
  }
  return -1.0;
}

// Calculate torus normal
vec3 calcNormal(vec3 p, float R1, float R2) {
  float eps = 0.001;
  vec2 h = vec2(eps, 0.0);
  return normalize(vec3(
    sdTorus(p + h.xyy, R1, R2) - sdTorus(p - h.xyy, R1, R2),
    sdTorus(p + h.yxy, R1, R2) - sdTorus(p - h.yxy, R1, R2),
    sdTorus(p + h.yyx, R1, R2) - sdTorus(p - h.yyx, R1, R2)
  ));
}

// 3D rotation matrices
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
  // Get grid cell coordinates
  float gridX = a_torusCoord.x;
  float gridY = a_torusCoord.y;

  // Convert grid cell to screen coordinates
  float screenX = gridX - u_gridSize.x * 0.5;
  float screenY = u_gridSize.y * 0.5 - gridY;

  // Calculate ray direction for this grid cell
  vec3 rayOrigin = vec3(0.0, 0.0, -u_K2);
  vec3 rayDir = normalize(vec3(screenX / u_K1, screenY / u_K1, 1.0));

  // Apply inverse rotation to ray (rotate world instead of ray)
  mat3 rotation = rotateX(u_angleA) * rotateZ(u_angleB);
  mat3 invRotation = transpose(rotation);
  rayDir = invRotation * rayDir;
  rayOrigin = invRotation * rayOrigin;

  // Ray-march to find torus surface
  float t = rayMarch(rayOrigin, rayDir, u_R1, u_R2);

  // Default: no character (black/space)
  v_charIndex = 0.0;

  if (t > 0.0) {
    // Hit torus surface
    vec3 hitPoint = rayOrigin + rayDir * t;
    vec3 normal = calcNormal(hitPoint, u_R1, u_R2);

    // Rotate normal back to world space
    normal = rotation * normal;

    // Calculate luminance
    float luminance = dot(normal, normalize(u_lightDir));
    luminance = (luminance + 1.0) * 0.5;  // Map [-1, 1] to [0, 1]

    v_charIndex = luminance;
  }

  // Position quad at grid cell
  float pixelX = gridX * u_charWidth + a_quadVertex.x * u_charWidth;
  float pixelY = gridY * u_charHeight + a_quadVertex.y * u_charHeight;

  // Convert to clip space
  float clipX = (pixelX / u_canvasSize.x) * 2.0 - 1.0;
  float clipY = 1.0 - (pixelY / u_canvasSize.y) * 2.0;

  gl_Position = vec4(clipX, clipY, 0.0, 1.0);

  // Texture coordinates for quad
  v_texCoord = a_quadVertex;
}
`;

/**
 * Fragment Shader for Quad Rendering (WebGL 2.0)
 *
 * Samples the correct character from atlas based on luminance.
 */
export const quadFragmentShaderSource = `#version 300 es
precision highp float;

in vec2 v_texCoord;
in float v_charIndex;

uniform sampler2D u_charTexture;
uniform int u_charCount;
uniform vec3 u_color;

out vec4 fragColor;

void main() {
  // Map luminance to character index
  int charIndex = int(v_charIndex * float(u_charCount - 1));

  // Calculate UV in atlas
  float uMin = float(charIndex) / float(u_charCount);
  float uMax = float(charIndex + 1) / float(u_charCount);

  float u = uMin + v_texCoord.x * (uMax - uMin);
  float v = v_texCoord.y;

  // Sample character
  vec4 texColor = texture(u_charTexture, vec2(u, v));

  // Apply color
  fragColor = vec4(u_color * texColor.rgb, texColor.a);

  if (fragColor.a < 0.01) {
    discard;
  }
}
`;

/**
 * Vertex Shader for Quad Rendering (WebGL 1.0)
 *
 * FIXED: Grid-based architecture (same as WebGL 2.0 version)
 */
export const quadVertexShaderSourceV1 = `
precision highp float;

// Per-vertex attributes
attribute vec2 a_quadVertex;

// Per-instance attributes (FIXED: grid coordinates)
attribute vec2 a_torusCoord;

// Uniforms
uniform float u_angleA;
uniform float u_angleB;
uniform float u_R1;
uniform float u_R2;
uniform float u_K1;
uniform float u_K2;
uniform vec3 u_lightDir;
uniform vec2 u_gridSize;
uniform float u_charWidth;
uniform float u_charHeight;
uniform vec2 u_canvasSize;

// Varyings
varying vec2 v_texCoord;
varying float v_charIndex;

// Constants
const int MAX_STEPS = 100;
const float MIN_DIST = 0.01;
const float MAX_DIST = 100.0;

// Torus SDF
float sdTorus(vec3 p, float R1, float R2) {
  vec2 q = vec2(length(p.xz) - R2, p.y);
  return length(q) - R1;
}

// Ray-march
float rayMarch(vec3 ro, vec3 rd, float R1, float R2) {
  float t = 0.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * t;
    float d = sdTorus(p, R1, R2);
    if (d < MIN_DIST) return t;
    if (t > MAX_DIST) break;
    t += d;
  }
  return -1.0;
}

// Calculate normal
vec3 calcNormal(vec3 p, float R1, float R2) {
  float eps = 0.001;
  vec2 h = vec2(eps, 0.0);
  return normalize(vec3(
    sdTorus(p + h.xyy, R1, R2) - sdTorus(p - h.xyy, R1, R2),
    sdTorus(p + h.yxy, R1, R2) - sdTorus(p - h.yxy, R1, R2),
    sdTorus(p + h.yyx, R1, R2) - sdTorus(p - h.yyx, R1, R2)
  ));
}

// Rotation helpers
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
  float gridX = a_torusCoord.x;
  float gridY = a_torusCoord.y;

  float screenX = gridX - u_gridSize.x * 0.5;
  float screenY = u_gridSize.y * 0.5 - gridY;

  vec3 rayOrigin = vec3(0.0, 0.0, -u_K2);
  vec3 rayDir = normalize(vec3(screenX / u_K1, screenY / u_K1, 1.0));

  mat3 rotation = rotateX(u_angleA) * rotateZ(u_angleB);
  mat3 invRotation = transpose3(rotation);
  rayDir = invRotation * rayDir;
  rayOrigin = invRotation * rayOrigin;

  float t = rayMarch(rayOrigin, rayDir, u_R1, u_R2);

  v_charIndex = 0.0;

  if (t > 0.0) {
    vec3 hitPoint = rayOrigin + rayDir * t;
    vec3 normal = calcNormal(hitPoint, u_R1, u_R2);
    normal = rotation * normal;

    float luminance = dot(normal, normalize(u_lightDir));
    luminance = (luminance + 1.0) * 0.5;

    v_charIndex = luminance;
  }

  float pixelX = gridX * u_charWidth + a_quadVertex.x * u_charWidth;
  float pixelY = gridY * u_charHeight + a_quadVertex.y * u_charHeight;

  float clipX = (pixelX / u_canvasSize.x) * 2.0 - 1.0;
  float clipY = 1.0 - (pixelY / u_canvasSize.y) * 2.0;

  gl_Position = vec4(clipX, clipY, 0.0, 1.0);
  v_texCoord = a_quadVertex;
}
`;

/**
 * Fragment Shader for Quad Rendering (WebGL 1.0)
 */
export const quadFragmentShaderSourceV1 = `
precision highp float;

varying vec2 v_texCoord;
varying float v_charIndex;

uniform sampler2D u_charTexture;
uniform int u_charCount;
uniform vec3 u_color;

void main() {
  int charIndex = int(v_charIndex * float(u_charCount - 1));

  float uMin = float(charIndex) / float(u_charCount);
  float uMax = float(charIndex + 1) / float(u_charCount);

  float u = uMin + v_texCoord.x * (uMax - uMin);
  float v = v_texCoord.y;

  vec4 texColor = texture2D(u_charTexture, vec2(u, v));
  gl_FragColor = vec4(u_color * texColor.rgb, texColor.a);

  if (gl_FragColor.a < 0.01) {
    discard;
  }
}
`;

/**
 * Shader configuration interface for quad rendering
 */
export interface QuadShaderConfig {
  version: 1 | 2;
  vertexShader: string;
  fragmentShader: string;
}

/**
 * Get quad shader sources for specified WebGL version
 */
export function getQuadShaderSources(version: 1 | 2): QuadShaderConfig {
  if (version === 2) {
    return {
      version: 2,
      vertexShader: quadVertexShaderSource,
      fragmentShader: quadFragmentShaderSource,
    };
  } else {
    return {
      version: 1,
      vertexShader: quadVertexShaderSourceV1,
      fragmentShader: quadFragmentShaderSourceV1,
    };
  }
}
