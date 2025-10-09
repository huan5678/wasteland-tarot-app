/**
 * Character Texture Atlas Generator
 *
 * Generates a texture atlas containing ASCII characters for WebGL rendering.
 * Each character is rendered to a canvas and combined into a single texture.
 */

/**
 * Character atlas configuration
 */
export interface CharacterAtlasConfig {
  /** Characters to include in the atlas */
  characters: string;
  /** Width of each character cell in pixels */
  charWidth: number;
  /** Height of each character cell in pixels */
  charHeight: number;
  /** Font family (must be monospace) */
  fontFamily?: string;
  /** Font size in pixels */
  fontSize?: number;
  /** Text color (CSS color) */
  color?: string;
  /** Background color (CSS color, typically transparent) */
  backgroundColor?: string;
}

/**
 * Character atlas result
 */
export interface CharacterAtlas {
  /** Canvas element containing the texture atlas */
  canvas: HTMLCanvasElement;
  /** Width of the atlas in pixels */
  width: number;
  /** Height of the atlas in pixels */
  height: number;
  /** Width of each character cell */
  charWidth: number;
  /** Height of each character cell */
  charHeight: number;
  /** Number of characters in the atlas */
  charCount: number;
  /** Character string used to generate the atlas */
  characters: string;
}

/**
 * Generate a character texture atlas
 *
 * Creates a horizontal strip of ASCII characters that can be used as a texture
 * in WebGL shaders. Each character occupies a fixed-width cell.
 *
 * @param config - Character atlas configuration
 * @returns Character atlas result
 */
export function generateCharacterAtlas(config: CharacterAtlasConfig): CharacterAtlas {
  const {
    characters,
    charWidth,
    charHeight,
    fontFamily = 'monospace',
    fontSize = charHeight,
    color = '#00ff00', // Pip-Boy green by default
    backgroundColor = 'transparent',
  } = config;

  const charCount = characters.length;
  const atlasWidth = charWidth * charCount;
  const atlasHeight = charHeight;

  // Create canvas for the atlas
  const canvas = document.createElement('canvas');
  canvas.width = atlasWidth;
  canvas.height = atlasHeight;

  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) {
    throw new Error('[TextureAtlas] Failed to get 2D context');
  }

  // Set background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, atlasWidth, atlasHeight);

  // Set font and text rendering
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Render each character to its cell
  for (let i = 0; i < charCount; i++) {
    const char = characters[i];
    const x = i * charWidth + charWidth / 2;
    const y = atlasHeight / 2;

    ctx.fillText(char, x, y);
  }

  return {
    canvas,
    width: atlasWidth,
    height: atlasHeight,
    charWidth,
    charHeight,
    charCount,
    characters,
  };
}

/**
 * Create WebGL texture from character atlas
 *
 * @param gl - WebGL rendering context
 * @param atlas - Character atlas
 * @returns WebGL texture or null on error
 */
export function createTextureFromAtlas(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  atlas: CharacterAtlas
): WebGLTexture | null {
  const texture = gl.createTexture();
  if (!texture) {
    console.error('[TextureAtlas] Failed to create texture');
    return null;
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Upload the canvas to the texture
  gl.texImage2D(
    gl.TEXTURE_2D,
    0, // mipmap level
    gl.RGBA, // internal format
    gl.RGBA, // format
    gl.UNSIGNED_BYTE, // type
    atlas.canvas // source
  );

  // Set texture parameters
  // Use NEAREST filtering to preserve sharp ASCII characters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // Use CLAMP_TO_EDGE to prevent wrapping artifacts
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.bindTexture(gl.TEXTURE_2D, null);

  return texture;
}

/**
 * Get UV coordinates for a character in the atlas
 *
 * @param atlas - Character atlas
 * @param charIndex - Character index (0-based)
 * @returns UV coordinates { uMin, uMax, vMin, vMax }
 */
export function getCharacterUV(
  atlas: CharacterAtlas,
  charIndex: number
): { uMin: number; uMax: number; vMin: number; vMax: number } {
  const { charCount, charWidth, width } = atlas;

  // Clamp index to valid range
  const index = Math.max(0, Math.min(charCount - 1, charIndex));

  const uMin = index / charCount;
  const uMax = (index + 1) / charCount;
  const vMin = 0;
  const vMax = 1;

  return { uMin, uMax, vMin, vMax };
}

/**
 * Get character index from luminance value
 *
 * Maps a luminance value [0, 1] to a character index in the atlas.
 *
 * @param luminance - Luminance value [0, 1]
 * @param charCount - Number of characters in the atlas
 * @returns Character index
 */
export function luminanceToCharIndex(luminance: number, charCount: number): number {
  // Clamp luminance to [0, 1]
  const clampedLuminance = Math.max(0, Math.min(1, luminance));

  // Map to character index
  // Darker = lower index (e.g., '.'), Brighter = higher index (e.g., '@')
  const index = Math.floor(clampedLuminance * (charCount - 1));

  return index;
}

/**
 * Preview character atlas (for debugging)
 *
 * Logs the atlas to console and optionally appends it to the document body.
 *
 * @param atlas - Character atlas
 * @param appendToBody - Whether to append the canvas to document body
 */
export function previewAtlas(atlas: CharacterAtlas, appendToBody: boolean = false): void {
  console.log('[TextureAtlas] Preview:', {
    width: atlas.width,
    height: atlas.height,
    charWidth: atlas.charWidth,
    charHeight: atlas.charHeight,
    charCount: atlas.charCount,
    characters: atlas.characters,
  });

  if (appendToBody && typeof document !== 'undefined') {
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: black;
      border: 2px solid #00ff00;
      padding: 10px;
      z-index: 9999;
    `;

    const title = document.createElement('div');
    title.textContent = 'Character Atlas Preview';
    title.style.cssText = 'color: #00ff00; font-family: monospace; margin-bottom: 5px;';

    const canvas = atlas.canvas.cloneNode(true) as HTMLCanvasElement;
    canvas.style.cssText = 'display: block; image-rendering: pixelated;';

    container.appendChild(title);
    container.appendChild(canvas);
    document.body.appendChild(container);
  }
}
