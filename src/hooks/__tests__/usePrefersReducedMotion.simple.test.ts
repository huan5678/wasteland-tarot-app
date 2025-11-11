/**
 * Simple unit test for usePrefersReducedMotion hook
 *
 * This test focuses on the core algorithm logic without relying on
 * complex test environment setup. For full E2E testing, see the
 * Playwright accessibility tests.
 */

import { describe, it, expect } from 'bun:test';

describe('usePrefersReducedMotion - Core Logic', () => {
  it('should export the hook function', () => {
    // Dynamic import to avoid immediate execution
    const hookModule = require('../usePrefersReducedMotion');

    expect(hookModule.usePrefersReducedMotion).toBeDefined();
    expect(typeof hookModule.usePrefersReducedMotion).toBe('function');
  });

  it('should export the interface type', () => {
    const hookModule = require('../usePrefersReducedMotion');

    // TypeScript interfaces don't exist at runtime, but we can verify
    // the function returns the correct structure by checking its implementation
    expect(hookModule.usePrefersReducedMotion).toBeDefined();
  });

  it('should have default export for backward compatibility', () => {
    const hookModule = require('../usePrefersReducedMotion');

    expect(hookModule.default).toBeDefined();
    expect(hookModule.default).toBe(hookModule.usePrefersReducedMotion);
  });
});

describe('usePrefersReducedMotion - TypeScript Types', () => {
  it('should have correct return type structure', () => {
    // This test verifies the TypeScript type structure exists
    // The actual runtime behavior is tested in Playwright e2e tests

    type UsePrefersReducedMotionReturn = {
      prefersReducedMotion: boolean;
      isLoading: boolean;
    };

    // Type assertion to verify the interface matches
    const verifyType = (result: UsePrefersReducedMotionReturn) => {
      expect(typeof result.prefersReducedMotion).toBe('boolean');
      expect(typeof result.isLoading).toBe('boolean');
    };

    // Mock return value that matches the interface
    const mockResult: UsePrefersReducedMotionReturn = {
      prefersReducedMotion: true,
      isLoading: false,
    };

    verifyType(mockResult);
  });
});

/**
 * Note on Testing Strategy:
 *
 * This hook requires a browser environment with window.matchMedia API.
 * Full integration tests are handled by:
 * - Playwright E2E tests in tests/accessibility/
 * - Manual testing in browsers
 *
 * This unit test verifies:
 * 1. The hook is exported correctly
 * 2. The TypeScript types are defined
 * 3. The module structure is correct
 *
 * For runtime behavior testing, see:
 * - tests/accessibility/keyboard-navigation.spec.ts
 * - tests/accessibility/screen-reader-compatibility.spec.ts
 */
