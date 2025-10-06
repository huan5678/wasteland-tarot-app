/**
 * Doto Font Configuration Tests
 *
 * Tests for Google Font Doto integration
 * Requirements: 1.3, 9.1
 */

import { doto } from '@/lib/fonts';

describe('Doto Font Configuration', () => {
  it('should export doto font instance', () => {
    expect(doto).toBeDefined();
  });

  it('should have correct variable name', () => {
    expect(doto.variable).toBe('--font-doto');
  });

  it('should have style.fontFamily property', () => {
    expect(doto.style).toBeDefined();
    expect(doto.style.fontFamily).toBeDefined();
  });

  it('should include monospace fallback in fontFamily', () => {
    expect(doto.style.fontFamily).toContain('monospace');
  });

  it('should have className property', () => {
    expect(doto.className).toBeDefined();
    expect(typeof doto.className).toBe('string');
  });
});
