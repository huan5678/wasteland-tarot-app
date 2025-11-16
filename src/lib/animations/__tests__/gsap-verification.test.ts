/**
 * GSAP Installation Verification Test
 * Verifies that GSAP and ScrollTrigger plugin can be loaded and used in Next.js 15 App Router environment
 */

import { describe, test, expect, beforeAll } from 'vitest';

describe('GSAP Installation Verification', () => {
  let gsap: any;
  let ScrollTrigger: any;

  beforeAll(async () => {
    // Dynamic import to handle SSR
    const gsapModule = await import('gsap');
    const scrollTriggerModule = await import('gsap/ScrollTrigger');

    gsap = gsapModule.default || gsapModule.gsap;
    ScrollTrigger = scrollTriggerModule.default || scrollTriggerModule.ScrollTrigger;

    // Register plugin
    if (gsap && ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
    }
  });

  test('GSAP library should be loaded', () => {
    expect(gsap).toBeDefined();
    expect(typeof gsap.timeline).toBe('function');
    expect(typeof gsap.to).toBe('function');
    expect(typeof gsap.from).toBe('function');
  });

  test('ScrollTrigger plugin should be loaded', () => {
    expect(ScrollTrigger).toBeDefined();
    expect(typeof ScrollTrigger.create).toBe('function');
  });

  test('GSAP Timeline can be created', () => {
    const timeline = gsap.timeline();
    expect(timeline).toBeDefined();
    expect(timeline.play).toBeDefined();
    expect(timeline.pause).toBeDefined();
    expect(timeline.kill).toBeDefined();
  });

  test('GSAP Timeline can add animations', () => {
    const timeline = gsap.timeline();
    const target = { opacity: 0 };

    timeline.to(target, { opacity: 1, duration: 0.5 });

    expect(timeline.duration()).toBeGreaterThan(0);
  });

  test('ScrollTrigger plugin can be registered', () => {
    // ScrollTrigger should be available after registration
    expect(gsap.registerPlugin).toBeDefined();

    // Verify ScrollTrigger.create works (proves registration)
    expect(typeof ScrollTrigger.create).toBe('function');

    // ScrollTrigger should have essential methods
    expect(ScrollTrigger.refresh).toBeDefined();
    expect(ScrollTrigger.getAll).toBeDefined();
  });
});
