/**
 * Bottle Cap WebGL Shaders
 *
 * GPU-accelerated ASCII bottle cap rendering using ray-marching SDF.
 * Features:
 * - Circular disk with thickness (cylinder)
 * - 21 crimped edges (wavy perimeter)
 * - Central depression on top surface
 * - Metallic appearance with Lambertian lighting
 */

/**
 * Vertex Shader for Bottle Cap Rendering (WebGL 2.0)
 *
 * Uses ray-marching with Signed Distance Functions (SDF) to render bottle cap.
 * Each grid cell performs reverse ray-tracing to find what should be displayed.
 */
export const bottleCapVertexShaderSource = `#version 300 es
precision highp float;

// Per-vertex attributes
in vec2 a_quadVertex;      // Quad corner position [0,0] to [1,1]

// Per-instance attributes
in vec2 a_torusCoord;      // (gridX, gridY) ASCII grid cell coordinates

// Uniforms - Rotation
uniform float u_angleA;    // X-axis rotation
uniform float u_angleB;    // Z-axis rotation

// Uniforms - Bottle cap geometry
uniform float u_radius;           // Bottle cap radius
uniform float u_thickness;        // Cap thickness
uniform float u_crimpCount;       // Number of crimps (21)
uniform float u_crimpAmplitude;   // Crimp wave amplitude
uniform float u_depressionDepth;  // Central depression depth
uniform float u_depressionRadius; // Depression radius

// Uniforms - Projection
uniform float u_K1;        // Projection scale
uniform float u_K2;        // Camera distance
uniform vec3 u_lightDir;   // Light direction

// Uniforms - Grid
uniform vec2 u_gridSize;    // ASCII grid size (width, height)
uniform float u_charWidth;  // Character cell width in pixels
uniform float u_charHeight; // Character cell height in pixels
uniform vec2 u_canvasSize;  // Canvas size in pixels

// Outputs to fragment shader
out vec2 v_texCoord;        // Texture coordinates for character atlas
out float v_charIndex;      // Character index to sample

// Constants
const int MAX_STEPS = 150;
const float MIN_DIST = 0.001;
const float MAX_DIST = 100.0;
const float PI = 3.14159265359;

// Bottle Cap SDF (Signed Distance Function)
// Returns distance to nearest surface
float sdBottleCap(vec3 p) {
  // Calculate distance from Y-axis (cylindrical coordinates)
  float r = length(p.xz);

  // Crimp wave modulation: radius varies sinusoidally around the edge
  float angle = atan(p.z, p.x);
  float crimpWave = sin(angle * u_crimpCount);
  float effectiveRadius = u_radius + u_crimpAmplitude * crimpWave;

  // Top surface with central depression
  float topSurfaceZ = 0.0;
  if (r < u_depressionRadius) {
    // Parabolic depression: z = -depth * (r / depressionRadius)^2
    float t = r / u_depressionRadius;
    topSurfaceZ = -u_depressionDepth * t * t;
  }

  // Distance to top surface
  float distToTop = p.y - topSurfaceZ;

  // Distance to bottom surface
  float distToBottom = p.y + u_thickness;

  // Distance to side (crimped cylinder)
  float distToSide = r - effectiveRadius;

  // Combine distances (union of surfaces)
  // Inside cap: max(max(distToTop, -distToBottom), distToSide)
  // This creates a solid cylinder with depression

  if (r <= effectiveRadius) {
    // Inside cylinder radius
    if (p.y >= topSurfaceZ && p.y <= 0.0) {
      // Between top and flat top surface
      return min(abs(distToTop), abs(p.y));
    } else if (p.y >= -u_thickness && p.y < topSurfaceZ) {
      // Between depression and bottom
      return min(abs(distToTop), abs(distToBottom));
    } else {
      // Outside vertical bounds
      return min(abs(distToTop), abs(distToBottom));
    }
  } else {
    // Outside cylinder radius - distance to crimped edge
    vec3 closestPoint = vec3(
      p.x * effectiveRadius / r,
      clamp(p.y, -u_thickness, 0.0),
      p.z * effectiveRadius / r
    );
    return length(p - closestPoint);
  }
}

// Ray-march to find bottle cap surface
float rayMarch(vec3 ro, vec3 rd) {
  float t = 0.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * t;
    float d = sdBottleCap(p);
    if (abs(d) < MIN_DIST) return t;
    if (t > MAX_DIST) break;
    t += abs(d) * 0.9; // Conservative step to avoid overshooting thin features
  }
  return -1.0;
}

// Calculate bottle cap normal using gradient
vec3 calcNormal(vec3 p) {
  float eps = 0.001;
  vec2 h = vec2(eps, 0.0);
  return normalize(vec3(
    sdBottleCap(p + h.xyy) - sdBottleCap(p - h.xyy),
    sdBottleCap(p + h.yxy) - sdBottleCap(p - h.yxy),
    sdBottleCap(p + h.yyx) - sdBottleCap(p - h.yyx)
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

  // Ray-march to find bottle cap surface
  float t = rayMarch(rayOrigin, rayDir);

  // Default: no character (black/space)
  v_charIndex = 0.0;

  if (t > 0.0) {
    // Hit bottle cap surface
    vec3 hitPoint = rayOrigin + rayDir * t;
    vec3 normal = calcNormal(hitPoint);

    // Rotate normal back to world space
    normal = rotation * normal;

    // Calculate luminance (Lambertian reflectance)
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
 * Fragment Shader for Bottle Cap Rendering (WebGL 2.0)
 *
 * Samples the correct character from atlas based on luminance.
 */
export const bottleCapFragmentShaderSource = `#version 300 es
precision highp float;

in vec2 v_texCoord;
in float v_charIndex;

uniform sampler2D u_charTexture;
uniform int u_charCount;
uniform vec3 u_color;

out vec4 fragColor;

void main() {
  // Discard background pixels (no surface hit)
  if (v_charIndex <= 0.0) {
    discard;
  }

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
 * Vertex Shader for Bottle Cap Rendering (WebGL 1.0)
 *
 * Same as WebGL 2.0 but with WebGL 1.0 syntax
 */
export const bottleCapVertexShaderSourceV1 = `
precision highp float;

// Per-vertex attributes
attribute vec2 a_quadVertex;
attribute vec2 a_torusCoord;

// Uniforms
uniform float u_angleA;
uniform float u_angleB;
uniform float u_radius;
uniform float u_thickness;
uniform float u_crimpCount;
uniform float u_crimpAmplitude;
uniform float u_depressionDepth;
uniform float u_depressionRadius;
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
const int MAX_STEPS = 150;
const float MIN_DIST = 0.001;
const float MAX_DIST = 100.0;
const float PI = 3.14159265359;

// Bottle Cap SDF (same as WebGL 2.0)
float sdBottleCap(vec3 p) {
  float r = length(p.xz);
  float angle = atan(p.z, p.x);
  float crimpWave = sin(angle * u_crimpCount);
  float effectiveRadius = u_radius + u_crimpAmplitude * crimpWave;

  float topSurfaceZ = 0.0;
  if (r < u_depressionRadius) {
    float t = r / u_depressionRadius;
    topSurfaceZ = -u_depressionDepth * t * t;
  }

  float distToTop = p.y - topSurfaceZ;
  float distToBottom = p.y + u_thickness;
  float distToSide = r - effectiveRadius;

  if (r <= effectiveRadius) {
    if (p.y >= topSurfaceZ && p.y <= 0.0) {
      return min(abs(distToTop), abs(p.y));
    } else if (p.y >= -u_thickness && p.y < topSurfaceZ) {
      return min(abs(distToTop), abs(distToBottom));
    } else {
      return min(abs(distToTop), abs(distToBottom));
    }
  } else {
    vec3 closestPoint = vec3(
      p.x * effectiveRadius / r,
      clamp(p.y, -u_thickness, 0.0),
      p.z * effectiveRadius / r
    );
    return length(p - closestPoint);
  }
}

// Ray-march
float rayMarch(vec3 ro, vec3 rd) {
  float t = 0.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * t;
    float d = sdBottleCap(p);
    if (abs(d) < MIN_DIST) return t;
    if (t > MAX_DIST) break;
    t += abs(d) * 0.9;
  }
  return -1.0;
}

// Calculate normal
vec3 calcNormal(vec3 p) {
  float eps = 0.001;
  vec2 h = vec2(eps, 0.0);
  return normalize(vec3(
    sdBottleCap(p + h.xyy) - sdBottleCap(p - h.xyy),
    sdBottleCap(p + h.yxy) - sdBottleCap(p - h.yxy),
    sdBottleCap(p + h.yyx) - sdBottleCap(p - h.yyx)
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

  float t = rayMarch(rayOrigin, rayDir);

  v_charIndex = 0.0;

  if (t > 0.0) {
    vec3 hitPoint = rayOrigin + rayDir * t;
    vec3 normal = calcNormal(hitPoint);
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
 * Fragment Shader for Bottle Cap Rendering (WebGL 1.0)
 */
export const bottleCapFragmentShaderSourceV1 = `
precision highp float;

varying vec2 v_texCoord;
varying float v_charIndex;

uniform sampler2D u_charTexture;
uniform int u_charCount;
uniform vec3 u_color;

void main() {
  // Discard background pixels (no surface hit)
  if (v_charIndex <= 0.0) {
    discard;
  }

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
 * Shader configuration interface for bottle cap rendering
 */
export interface BottleCapShaderConfig {
  version: 1 | 2;
  vertexShader: string;
  fragmentShader: string;
}

/**
 * Get bottle cap shader sources for specified WebGL version
 */
export function getBottleCapShaderSources(version: 1 | 2): BottleCapShaderConfig {
  if (version === 2) {
    return {
      version: 2,
      vertexShader: bottleCapVertexShaderSource,
      fragmentShader: bottleCapFragmentShaderSource,
    };
  } else {
    return {
      version: 1,
      vertexShader: bottleCapVertexShaderSourceV1,
      fragmentShader: bottleCapFragmentShaderSourceV1,
    };
  }
}
