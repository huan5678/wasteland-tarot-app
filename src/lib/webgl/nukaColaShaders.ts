/**
 * Nuka-Cola Bottle WebGL Shaders
 *
 * GPU-accelerated ASCII bottle rendering using ray-marching SDF.
 * Features:
 * - Bottle neck, shoulder, body, and base sections
 * - Smooth shoulder transition
 * - Concave bottom detail
 * - Realistic proportions matching reference image
 */

/**
 * Vertex Shader for Nuka-Cola Bottle Rendering (WebGL 2.0)
 *
 * Uses ray-marching with Signed Distance Functions (SDF) to render bottle.
 * Each grid cell performs reverse ray-tracing to find what should be displayed.
 */
export const nukaColaVertexShaderSource = `#version 300 es
precision highp float;

// Per-vertex attributes
in vec2 a_quadVertex;      // Quad corner position [0,0] to [1,1]

// Per-instance attributes
in vec2 a_torusCoord;      // (gridX, gridY) ASCII grid cell coordinates

// Uniforms - Rotation
uniform float u_angleA;    // X-axis rotation
uniform float u_angleB;    // Z-axis rotation

// Uniforms - Bottle geometry
uniform float u_neckRadius;
uniform float u_neckHeight;
uniform float u_bodyRadius;
uniform float u_bodyHeight;
uniform float u_shoulderHeight;
uniform float u_baseHeight;
uniform float u_bottomConcaveDepth;

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

/**
 * Calculate bottle radius at a given height
 */
float getRadiusAtHeight(float y, float totalHeight) {
  // Coordinate system: y=0 at bottom, y=totalHeight at top
  float yFromTop = totalHeight - y;

  if (yFromTop <= u_neckHeight) {
    // Neck section (constant radius)
    return u_neckRadius;
  } else if (yFromTop <= u_neckHeight + u_shoulderHeight) {
    // Shoulder section (smooth transition from neck to body)
    float t = (yFromTop - u_neckHeight) / u_shoulderHeight;
    // Smooth interpolation (smoothstep)
    float smoothT = t * t * (3.0 - 2.0 * t);
    return u_neckRadius + (u_bodyRadius - u_neckRadius) * smoothT;
  } else if (yFromTop <= u_neckHeight + u_shoulderHeight + u_bodyHeight) {
    // Body section (constant radius)
    return u_bodyRadius;
  } else {
    // Base section (slightly narrower)
    float t = (yFromTop - u_neckHeight - u_shoulderHeight - u_bodyHeight) / u_baseHeight;
    float smoothT = t * t;
    return u_bodyRadius - (u_bodyRadius * 0.1) * smoothT;
  }
}

/**
 * Nuka-Cola Bottle SDF (Signed Distance Function)
 * Returns distance to nearest surface
 */
float sdNukaColaBottle(vec3 p) {
  float totalHeight = u_neckHeight + u_shoulderHeight + u_bodyHeight + u_baseHeight;

  // Shift coordinate system so y=0 is at bottom
  float y = p.y + totalHeight * 0.5;

  // Cylindrical coordinates
  float r = length(p.xz);

  // Get expected radius at this height
  float expectedRadius = getRadiusAtHeight(y, totalHeight);

  // Distance to side surface
  float distToSide = r - expectedRadius;

  // Distance to top (neck opening)
  float distToTop = y - totalHeight;

  // Distance to bottom surface (with concave center)
  float bottomSurfaceY = 0.0;
  if (r < u_bodyRadius * 0.7) {
    // Concave center area
    float t = r / (u_bodyRadius * 0.7);
    bottomSurfaceY = -u_bottomConcaveDepth * (1.0 - t * t);
  }
  // Else: flat bottom (bottomSurfaceY = 0.0)

  float distToBottom = y - bottomSurfaceY;

  // Combine distances to form closed bottle
  // Inside the bottle's cylindrical bounds
  if (r <= expectedRadius) {
    // Between bottom and top
    if (y >= bottomSurfaceY && y <= totalHeight) {
      // Inside bottle volume
      return max(max(-distToTop, -distToBottom), abs(distToSide));
    } else if (y < bottomSurfaceY) {
      // Below bottom surface - distance to bottom
      return abs(distToBottom);
    } else {
      // Above top (neck opening) - distance to top
      return abs(distToTop);
    }
  }

  // Outside bottle - calculate distance to nearest surface
  vec3 closestPoint = p;

  // Clamp to bottle height
  float clampedY = clamp(y, 0.0, totalHeight);
  float clampedRadius = getRadiusAtHeight(clampedY, totalHeight);

  // Project to bottle surface
  if (r > 0.001) {
    closestPoint.x = p.x * clampedRadius / r;
    closestPoint.z = p.z * clampedRadius / r;
  }

  // Handle bottom concave
  if (clampedY == 0.0 && r < u_bodyRadius * 0.7) {
    float t = r / (u_bodyRadius * 0.7);
    closestPoint.y = -totalHeight * 0.5 - u_bottomConcaveDepth * (1.0 - t * t);
  } else {
    closestPoint.y = clampedY - totalHeight * 0.5;
  }

  return length(p - closestPoint);
}

/**
 * Ray-march to find bottle surface
 */
float rayMarch(vec3 ro, vec3 rd) {
  float t = 0.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * t;
    float d = sdNukaColaBottle(p);
    if (abs(d) < MIN_DIST) return t;
    if (t > MAX_DIST) break;
    t += abs(d) * 0.9; // Conservative step
  }
  return -1.0;
}

/**
 * Calculate bottle normal using gradient
 */
vec3 calcNormal(vec3 p) {
  float eps = 0.001;
  vec2 h = vec2(eps, 0.0);
  return normalize(vec3(
    sdNukaColaBottle(p + h.xyy) - sdNukaColaBottle(p - h.xyy),
    sdNukaColaBottle(p + h.yxy) - sdNukaColaBottle(p - h.yxy),
    sdNukaColaBottle(p + h.yyx) - sdNukaColaBottle(p - h.yyx)
  ));
}

/**
 * 3D rotation matrices
 */
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

  // Ray-march to find bottle surface
  float t = rayMarch(rayOrigin, rayDir);

  // Default: no character (black/space)
  v_charIndex = 0.0;

  if (t > 0.0) {
    // Hit bottle surface
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
 * Fragment Shader for Nuka-Cola Bottle Rendering (WebGL 2.0)
 *
 * Samples the correct character from atlas based on luminance.
 */
export const nukaColaFragmentShaderSource = `#version 300 es
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
 * Vertex Shader for Nuka-Cola Bottle Rendering (WebGL 1.0)
 */
export const nukaColaVertexShaderSourceV1 = `
precision highp float;

// Per-vertex attributes
attribute vec2 a_quadVertex;
attribute vec2 a_torusCoord;

// Uniforms
uniform float u_angleA;
uniform float u_angleB;
uniform float u_neckRadius;
uniform float u_neckHeight;
uniform float u_bodyRadius;
uniform float u_bodyHeight;
uniform float u_shoulderHeight;
uniform float u_baseHeight;
uniform float u_bottomConcaveDepth;
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

float getRadiusAtHeight(float y, float totalHeight) {
  float yFromTop = totalHeight - y;

  if (yFromTop <= u_neckHeight) {
    return u_neckRadius;
  } else if (yFromTop <= u_neckHeight + u_shoulderHeight) {
    float t = (yFromTop - u_neckHeight) / u_shoulderHeight;
    float smoothT = t * t * (3.0 - 2.0 * t);
    return u_neckRadius + (u_bodyRadius - u_neckRadius) * smoothT;
  } else if (yFromTop <= u_neckHeight + u_shoulderHeight + u_bodyHeight) {
    return u_bodyRadius;
  } else {
    float t = (yFromTop - u_neckHeight - u_shoulderHeight - u_bodyHeight) / u_baseHeight;
    float smoothT = t * t;
    return u_bodyRadius - (u_bodyRadius * 0.1) * smoothT;
  }
}

float sdNukaColaBottle(vec3 p) {
  float totalHeight = u_neckHeight + u_shoulderHeight + u_bodyHeight + u_baseHeight;
  float y = p.y + totalHeight * 0.5;
  float r = length(p.xz);
  float expectedRadius = getRadiusAtHeight(y, totalHeight);
  float distToSide = r - expectedRadius;
  float distToTop = y - totalHeight;

  // Distance to bottom surface (with concave center)
  float bottomSurfaceY = 0.0;
  if (r < u_bodyRadius * 0.7) {
    // Concave center area
    float t = r / (u_bodyRadius * 0.7);
    bottomSurfaceY = -u_bottomConcaveDepth * (1.0 - t * t);
  }
  // Else: flat bottom (bottomSurfaceY = 0.0)

  float distToBottom = y - bottomSurfaceY;

  // Combine distances to form closed bottle
  // Inside the bottle's cylindrical bounds
  if (r <= expectedRadius) {
    // Between bottom and top
    if (y >= bottomSurfaceY && y <= totalHeight) {
      // Inside bottle volume
      return max(max(-distToTop, -distToBottom), abs(distToSide));
    } else if (y < bottomSurfaceY) {
      // Below bottom surface - distance to bottom
      return abs(distToBottom);
    } else {
      // Above top (neck opening) - distance to top
      return abs(distToTop);
    }
  }

  // Outside bottle - calculate distance to nearest surface
  vec3 closestPoint = p;
  float clampedY = clamp(y, 0.0, totalHeight);
  float clampedRadius = getRadiusAtHeight(clampedY, totalHeight);

  if (r > 0.001) {
    closestPoint.x = p.x * clampedRadius / r;
    closestPoint.z = p.z * clampedRadius / r;
  }

  if (clampedY == 0.0 && r < u_bodyRadius * 0.7) {
    float t = r / (u_bodyRadius * 0.7);
    closestPoint.y = -totalHeight * 0.5 - u_bottomConcaveDepth * (1.0 - t * t);
  } else {
    closestPoint.y = clampedY - totalHeight * 0.5;
  }

  return length(p - closestPoint);
}

float rayMarch(vec3 ro, vec3 rd) {
  float t = 0.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * t;
    float d = sdNukaColaBottle(p);
    if (abs(d) < MIN_DIST) return t;
    if (t > MAX_DIST) break;
    t += abs(d) * 0.9;
  }
  return -1.0;
}

vec3 calcNormal(vec3 p) {
  float eps = 0.001;
  vec2 h = vec2(eps, 0.0);
  return normalize(vec3(
    sdNukaColaBottle(p + h.xyy) - sdNukaColaBottle(p - h.xyy),
    sdNukaColaBottle(p + h.yxy) - sdNukaColaBottle(p - h.yxy),
    sdNukaColaBottle(p + h.yyx) - sdNukaColaBottle(p - h.yyx)
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
 * Fragment Shader for Nuka-Cola Bottle Rendering (WebGL 1.0)
 */
export const nukaColaFragmentShaderSourceV1 = `
precision highp float;

varying vec2 v_texCoord;
varying float v_charIndex;

uniform sampler2D u_charTexture;
uniform int u_charCount;
uniform vec3 u_color;

void main() {
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
 * Shader configuration interface for Nuka-Cola rendering
 */
export interface NukaColaShaderConfig {
  version: 1 | 2;
  vertexShader: string;
  fragmentShader: string;
}

/**
 * Get Nuka-Cola shader sources for specified WebGL version
 */
export function getNukaColaShaderSources(version: 1 | 2): NukaColaShaderConfig {
  if (version === 2) {
    return {
      version: 2,
      vertexShader: nukaColaVertexShaderSource,
      fragmentShader: nukaColaFragmentShaderSource,
    };
  } else {
    return {
      version: 1,
      vertexShader: nukaColaVertexShaderSourceV1,
      fragmentShader: nukaColaFragmentShaderSourceV1,
    };
  }
}
