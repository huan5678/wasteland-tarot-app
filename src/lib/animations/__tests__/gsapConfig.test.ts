/**
 * GSAP Configuration Tests
 * Verifies gsapConfig structure and types
 */

import { describe, test, expect } from 'vitest';
import { gsapConfig } from '../gsapConfig';
import type { GSAPConfig } from '../gsapConfig';

describe('gsapConfig', () => {
  test('should have durations object with correct values', () => {
    expect(gsapConfig.durations).toBeDefined();
    expect(gsapConfig.durations.fast).toBe(0.2);
    expect(gsapConfig.durations.normal).toBe(0.6);
    expect(gsapConfig.durations.slow).toBe(1.0);
  });

  test('should have counter durations for different number sizes', () => {
    expect(gsapConfig.durations.counter).toBeDefined();
    expect(gsapConfig.durations.counter.small).toBe(1.2);
    expect(gsapConfig.durations.counter.medium).toBe(1.5);
    expect(gsapConfig.durations.counter.large).toBe(2.0);
  });

  test('should have easings object with correct values', () => {
    expect(gsapConfig.easings).toBeDefined();
    expect(gsapConfig.easings.in).toBe('power2.in');
    expect(gsapConfig.easings.out).toBe('power2.out');
    expect(gsapConfig.easings.inOut).toBe('power2.inOut');
    expect(gsapConfig.easings.elastic).toBe('elastic.out(1, 0.5)');
    expect(gsapConfig.easings.linear).toBe('none');
  });

  test('should have staggers object with correct values', () => {
    expect(gsapConfig.staggers).toBeDefined();
    expect(gsapConfig.staggers.fast).toBe(0.075);
    expect(gsapConfig.staggers.normal).toBe(0.15);
    expect(gsapConfig.staggers.slow).toBe(0.25);
  });

  test('should have scrollTrigger defaults', () => {
    expect(gsapConfig.scrollTrigger).toBeDefined();
    expect(gsapConfig.scrollTrigger.start).toBe('top 80%');
    expect(gsapConfig.scrollTrigger.end).toBe('bottom 20%');
    expect(gsapConfig.scrollTrigger.toggleActions).toBe('play none none none');
    expect(typeof gsapConfig.scrollTrigger.markers).toBe('boolean');
  });

  test('should have parallax speeds', () => {
    expect(gsapConfig.parallax).toBeDefined();
    expect(gsapConfig.parallax.backgroundSpeed).toBe(0.5);
    expect(gsapConfig.parallax.foregroundSpeed).toBe(1.0);
  });

  test('should have responsive breakpoints', () => {
    expect(gsapConfig.breakpoints).toBeDefined();
    expect(gsapConfig.breakpoints.mobile).toBe('(max-width: 767px)');
    expect(gsapConfig.breakpoints.tablet).toBe('(min-width: 768px) and (max-width: 1023px)');
    expect(gsapConfig.breakpoints.desktop).toBe('(min-width: 1024px)');
  });

  test('should have performance settings', () => {
    expect(gsapConfig.performance).toBeDefined();
    expect(gsapConfig.performance.force3D).toBe(true);
    expect(gsapConfig.performance.autoKill).toBe(true);
    expect(gsapConfig.performance.minFPS).toBe(50);
  });

  test('should have Fallout theme colors', () => {
    expect(gsapConfig.colors).toBeDefined();
    expect(gsapConfig.colors.pipBoyGreen).toBe('#00ff88');
    expect(gsapConfig.colors.radiationOrange).toBe('#ff8800');
  });

  test('should be readonly (as const)', () => {
    // TypeScript will catch if this is not readonly
    // This test verifies the type is exported correctly
    const config: GSAPConfig = gsapConfig;
    expect(config).toBeDefined();
  });

  test('should have all duration values greater than 0', () => {
    expect(gsapConfig.durations.fast).toBeGreaterThan(0);
    expect(gsapConfig.durations.normal).toBeGreaterThan(0);
    expect(gsapConfig.durations.slow).toBeGreaterThan(0);
    expect(gsapConfig.durations.counter.small).toBeGreaterThan(0);
    expect(gsapConfig.durations.counter.medium).toBeGreaterThan(0);
    expect(gsapConfig.durations.counter.large).toBeGreaterThan(0);
  });

  test('should have stagger delays less than animation durations', () => {
    // Stagger delays should be shorter than animation durations to avoid overlap
    expect(gsapConfig.staggers.fast).toBeLessThan(gsapConfig.durations.fast);
    expect(gsapConfig.staggers.normal).toBeLessThan(gsapConfig.durations.normal);
    expect(gsapConfig.staggers.slow).toBeLessThan(gsapConfig.durations.slow);
  });

  test('should have valid color hex codes', () => {
    const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
    expect(gsapConfig.colors.pipBoyGreen).toMatch(hexColorRegex);
    expect(gsapConfig.colors.radiationOrange).toMatch(hexColorRegex);
  });
});
