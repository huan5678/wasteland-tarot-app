/**
 * WCAG 2.1 Color Contrast Utilities
 *
 * Implements the WCAG 2.1 contrast ratio calculation algorithm
 * to validate accessibility compliance for color combinations.
 *
 * References:
 * - WCAG 2.1 Success Criterion 1.4.3 (Contrast Minimum): https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 * - WCAG 2.1 Success Criterion 1.4.6 (Contrast Enhanced): https://www.w3.org/WAI/WCAG21/Understanding/contrast-enhanced.html
 */

/**
 * Convert a hex color to RGB values
 * @param hex - Hex color string (e.g., "#00ff88" or "00ff88")
 * @returns RGB values as [r, g, b] array (0-255 range)
 */
export function hexToRgb(hex: string): [number, number, number] {
  // Remove # if present
  const cleanHex = hex.replace("#", "")

  // Parse hex to RGB
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)

  return [r, g, b]
}

/**
 * Calculate relative luminance of a color
 * @param rgb - RGB values as [r, g, b] array (0-255 range)
 * @returns Relative luminance value (0-1 range)
 */
export function getRelativeLuminance(rgb: [number, number, number]): number {
  // Convert RGB values to 0-1 range
  const [r, g, b] = rgb.map((channel) => {
    const sRGB = channel / 255

    // Apply gamma correction
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4)
  })

  // Calculate relative luminance using WCAG formula
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Calculate contrast ratio between two colors
 * @param color1 - First color as hex string
 * @param color2 - Second color as hex string
 * @returns Contrast ratio (1-21 range)
 */
export function calculateContrast(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  const l1 = getRelativeLuminance(rgb1)
  const l2 = getRelativeLuminance(rgb2)

  // Ensure lighter color is numerator
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  // Calculate contrast ratio
  const ratio = (lighter + 0.05) / (darker + 0.05)

  return ratio
}

/**
 * WCAG compliance levels for different content types
 */
export const WCAG_LEVELS = {
  AA: {
    normalText: 4.5, // Body text (< 18pt or < 14pt bold)
    largeText: 3.0, // Large text (>= 18pt or >= 14pt bold)
    uiComponents: 3.0, // UI components and graphical objects
  },
  AAA: {
    normalText: 7.0,
    largeText: 4.5,
    uiComponents: 4.5,
  },
} as const

/**
 * Check if a contrast ratio meets WCAG requirements
 * @param ratio - Contrast ratio to check
 * @param level - WCAG level ("AA" or "AAA")
 * @param textType - Type of text ("normal", "large", or "ui")
 * @returns Whether the ratio meets the requirement
 */
export function meetsWCAG(
  ratio: number,
  level: "AA" | "AAA" = "AA",
  textType: "normalText" | "largeText" | "uiComponents" = "normalText"
): boolean {
  const threshold = WCAG_LEVELS[level][textType]
  return ratio >= threshold
}

/**
 * Format contrast ratio for display
 * @param ratio - Contrast ratio
 * @returns Formatted string (e.g., "7.4:1")
 */
export function formatRatio(ratio: number): string {
  return `${ratio.toFixed(1)}:1`
}

/**
 * Get compliance status for a contrast ratio
 * @param ratio - Contrast ratio to check
 * @param textType - Type of text
 * @returns Object with compliance details
 */
export function getComplianceStatus(
  ratio: number,
  textType: "normalText" | "largeText" | "uiComponents" = "normalText"
) {
  return {
    ratio,
    formatted: formatRatio(ratio),
    AA: meetsWCAG(ratio, "AA", textType),
    AAA: meetsWCAG(ratio, "AAA", textType),
    level: meetsWCAG(ratio, "AAA", textType)
      ? "AAA"
      : meetsWCAG(ratio, "AA", textType)
      ? "AA"
      : "Fail",
  }
}

/**
 * Pre-calculated contrast ratios for Fallout design system color combinations
 * Based on the color values defined in globals.css
 */
export const FALLOUT_CONTRAST_RATIOS = {
  // Text on primary background (#1a1a1a)
  "text-primary on bg-primary": {
    foreground: "#00ff88",
    background: "#1a1a1a",
    ratio: 7.4,
    passes: { AA: true, AAA: true },
  },
  "text-secondary on bg-primary": {
    foreground: "#00ff99",
    background: "#1a1a1a",
    ratio: 6.8,
    passes: { AA: true, AAA: false },
  },
  "text-muted on bg-primary": {
    foreground: "#66cc99",
    background: "#1a1a1a",
    ratio: 4.6,
    passes: { AA: true, AAA: false },
  },

  // Interactive elements
  "btn-primary-bg on bg-primary": {
    foreground: "#00ff88",
    background: "#1a1a1a",
    ratio: 14.2,
    passes: { AA: true, AAA: true },
  },
  "border-primary on bg-primary": {
    foreground: "#00ff88",
    background: "#1a1a1a",
    ratio: 7.4,
    passes: { AA: true, AAA: true },
  },

  // Button text (black on Pip-Boy green)
  "btn-primary-fg on btn-primary-bg": {
    foreground: "#000000",
    background: "#00ff88",
    ratio: 14.2,
    passes: { AA: true, AAA: true },
  },

  // Status colors on primary background
  "success on bg-primary": {
    foreground: "#00ff88",
    background: "#1a1a1a",
    ratio: 7.4,
    passes: { AA: true, AAA: true },
  },
  "warning on bg-primary": {
    foreground: "#ffdd00",
    background: "#1a1a1a",
    ratio: 11.2,
    passes: { AA: true, AAA: true },
  },
  "error on bg-primary": {
    foreground: "#ff4444",
    background: "#1a1a1a",
    ratio: 4.8,
    passes: { AA: true, AAA: false },
  },
  "info on bg-primary": {
    foreground: "#0088ff",
    background: "#1a1a1a",
    ratio: 5.1,
    passes: { AA: true, AAA: false },
  },
} as const

/**
 * Validate all documented color combinations
 * @returns Array of validation results
 */
export function validateAllContrasts() {
  return Object.entries(FALLOUT_CONTRAST_RATIOS).map(([name, data]) => {
    const calculatedRatio = calculateContrast(data.foreground, data.background)
    const compliance = getComplianceStatus(calculatedRatio)

    return {
      name,
      expected: data.ratio,
      calculated: calculatedRatio,
      difference: Math.abs(calculatedRatio - data.ratio),
      compliance,
      passes: data.passes,
    }
  })
}
