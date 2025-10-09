/**
 * Test suite for WCAG color contrast calculations
 */
import { describe, it, expect } from "@jest/globals"
import {
  hexToRgb,
  getRelativeLuminance,
  calculateContrast,
  meetsWCAG,
  getComplianceStatus,
  validateAllContrasts,
  WCAG_LEVELS,
} from "../contrast"

describe("hexToRgb", () => {
  it("should convert hex color to RGB", () => {
    expect(hexToRgb("#00ff88")).toEqual([0, 255, 136])
    expect(hexToRgb("00ff88")).toEqual([0, 255, 136])
    expect(hexToRgb("#1a1a1a")).toEqual([26, 26, 26])
    expect(hexToRgb("#ffffff")).toEqual([255, 255, 255])
    expect(hexToRgb("#000000")).toEqual([0, 0, 0])
  })
})

describe("getRelativeLuminance", () => {
  it("should calculate relative luminance correctly", () => {
    // Pure white has luminance of 1
    expect(getRelativeLuminance([255, 255, 255])).toBeCloseTo(1, 2)

    // Pure black has luminance of 0
    expect(getRelativeLuminance([0, 0, 0])).toBeCloseTo(0, 2)

    // Pip-Boy green (#00ff88)
    const pipBoyLuminance = getRelativeLuminance([0, 255, 136])
    expect(pipBoyLuminance).toBeGreaterThan(0)
    expect(pipBoyLuminance).toBeLessThan(1)
  })
})

describe("calculateContrast", () => {
  it("should calculate contrast ratio between two colors", () => {
    // White on black should be maximum contrast (21:1)
    const maxContrast = calculateContrast("#ffffff", "#000000")
    expect(maxContrast).toBeCloseTo(21, 0)

    // Same color should have minimum contrast (1:1)
    const minContrast = calculateContrast("#00ff88", "#00ff88")
    expect(minContrast).toBeCloseTo(1, 1)

    // Pip-Boy green on dark background
    const pipBoyContrast = calculateContrast("#00ff88", "#1a1a1a")
    expect(pipBoyContrast).toBeGreaterThan(4.5) // Should meet WCAG AA
  })
})

describe("meetsWCAG", () => {
  it("should check WCAG AA compliance for normal text", () => {
    expect(meetsWCAG(4.5, "AA", "normalText")).toBe(true)
    expect(meetsWCAG(4.4, "AA", "normalText")).toBe(false)
    expect(meetsWCAG(7.0, "AA", "normalText")).toBe(true)
  })

  it("should check WCAG AA compliance for large text", () => {
    expect(meetsWCAG(3.0, "AA", "largeText")).toBe(true)
    expect(meetsWCAG(2.9, "AA", "largeText")).toBe(false)
  })

  it("should check WCAG AAA compliance", () => {
    expect(meetsWCAG(7.0, "AAA", "normalText")).toBe(true)
    expect(meetsWCAG(6.9, "AAA", "normalText")).toBe(false)
    expect(meetsWCAG(4.5, "AAA", "largeText")).toBe(true)
  })
})

describe("getComplianceStatus", () => {
  it("should return compliance status for a ratio", () => {
    const status = getComplianceStatus(7.0, "normalText")

    expect(status.ratio).toBe(7.0)
    expect(status.formatted).toBe("7.0:1")
    expect(status.AA).toBe(true)
    expect(status.AAA).toBe(true)
    expect(status.level).toBe("AAA")
  })

  it("should return fail status for insufficient contrast", () => {
    const status = getComplianceStatus(3.0, "normalText")

    expect(status.AA).toBe(false)
    expect(status.AAA).toBe(false)
    expect(status.level).toBe("Fail")
  })
})

describe("Fallout Design System Color Contrasts", () => {
  it("should validate text-primary on bg-primary meets WCAG AA", () => {
    const ratio = calculateContrast("#00ff88", "#1a1a1a")
    expect(ratio).toBeGreaterThanOrEqual(WCAG_LEVELS.AA.normalText)
  })

  it("should validate text-secondary on bg-primary meets WCAG AA", () => {
    const ratio = calculateContrast("#00ff99", "#1a1a1a")
    expect(ratio).toBeGreaterThanOrEqual(WCAG_LEVELS.AA.normalText)
  })

  it("should validate text-muted on bg-primary meets WCAG AA", () => {
    const ratio = calculateContrast("#66cc99", "#1a1a1a")
    expect(ratio).toBeGreaterThanOrEqual(WCAG_LEVELS.AA.normalText)
  })

  it("should validate btn-primary-fg on btn-primary-bg meets WCAG AAA", () => {
    const ratio = calculateContrast("#000000", "#00ff88")
    expect(ratio).toBeGreaterThanOrEqual(WCAG_LEVELS.AAA.normalText)
  })

  it("should validate warning color on bg-primary meets WCAG AA", () => {
    const ratio = calculateContrast("#ffdd00", "#1a1a1a")
    expect(ratio).toBeGreaterThanOrEqual(WCAG_LEVELS.AA.normalText)
  })

  it("should validate error color on bg-primary meets WCAG AA", () => {
    const ratio = calculateContrast("#ff4444", "#1a1a1a")
    expect(ratio).toBeGreaterThanOrEqual(WCAG_LEVELS.AA.normalText)
  })

  it("should validate info color on bg-primary meets WCAG AA", () => {
    const ratio = calculateContrast("#0088ff", "#1a1a1a")
    expect(ratio).toBeGreaterThanOrEqual(WCAG_LEVELS.AA.normalText)
  })
})

describe("validateAllContrasts", () => {
  it("should validate all documented color combinations", () => {
    const results = validateAllContrasts()

    // All combinations should pass WCAG AA
    results.forEach((result) => {
      expect(result.compliance.AA).toBe(true)
    })

    // Check that calculations are within reasonable range of documented values
    results.forEach((result) => {
      expect(result.difference).toBeLessThan(1.0)
    })
  })

  it("should have no failing contrasts", () => {
    const results = validateAllContrasts()
    const failures = results.filter((r) => !r.compliance.AA)

    expect(failures).toHaveLength(0)
  })
})
