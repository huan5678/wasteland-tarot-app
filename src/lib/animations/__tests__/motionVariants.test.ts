/**
 * Motion Variants Tests
 * Verifies motionVariants structure and types
 */

import { describe, test, expect } from 'vitest';
import {
  fadeInVariants,
  slideUpVariants,
  scaleInVariants,
  breathingGlowVariants,
  featureCardHoverVariants,
  featureIconHoverVariants,
  faqExpandVariants,
  faqArrowVariants,
  reducedMotionTransition,
} from '../motionVariants';

describe('motionVariants', () => {
  test('fadeInVariants should have hidden and visible states', () => {
    expect(fadeInVariants.hidden).toBeDefined();
    expect(fadeInVariants.visible).toBeDefined();
    expect(fadeInVariants.hidden).toEqual({ opacity: 0 });
    expect(fadeInVariants.visible).toHaveProperty('opacity', 1);
    expect(fadeInVariants.visible).toHaveProperty('transition');
  });

  test('slideUpVariants should have vertical translation', () => {
    expect(slideUpVariants.hidden).toEqual({ opacity: 0, y: 40 });
    expect(slideUpVariants.visible).toHaveProperty('opacity', 1);
    expect(slideUpVariants.visible).toHaveProperty('y', 0);
    expect(slideUpVariants.visible).toHaveProperty('transition');
  });

  test('scaleInVariants should have scale transformation', () => {
    expect(scaleInVariants.hidden).toEqual({ opacity: 0, scale: 0.9 });
    expect(scaleInVariants.visible).toHaveProperty('opacity', 1);
    expect(scaleInVariants.visible).toHaveProperty('scale', 1);
    expect(scaleInVariants.visible).toHaveProperty('transition');
  });

  test('breathingGlowVariants should have infinite loop animation', () => {
    expect(breathingGlowVariants.initial).toBeDefined();
    expect(breathingGlowVariants.animate).toBeDefined();
    expect(breathingGlowVariants.initial).toHaveProperty('boxShadow');
    expect(breathingGlowVariants.animate).toHaveProperty('boxShadow');
    expect(breathingGlowVariants.animate).toHaveProperty('transition');

    const transition = breathingGlowVariants.animate?.transition;
    expect(transition).toHaveProperty('repeat', Infinity);
  });

  test('featureCardHoverVariants should have rest and hover states', () => {
    expect(featureCardHoverVariants.rest).toBeDefined();
    expect(featureCardHoverVariants.hover).toBeDefined();
    expect(featureCardHoverVariants.rest).toEqual({ scale: 1 });
    expect(featureCardHoverVariants.hover).toHaveProperty('scale', 1.02);
    expect(featureCardHoverVariants.hover).toHaveProperty('boxShadow');
  });

  test('featureIconHoverVariants should have rotation animation', () => {
    expect(featureIconHoverVariants.rest).toBeDefined();
    expect(featureIconHoverVariants.hover).toBeDefined();
    expect(featureIconHoverVariants.rest).toHaveProperty('rotate', 0);
    expect(featureIconHoverVariants.hover).toHaveProperty('rotate', 360);
    expect(featureIconHoverVariants.hover).toHaveProperty('color', '#00ff88');
  });

  test('faqExpandVariants should have height and opacity animations', () => {
    expect(faqExpandVariants.collapsed).toBeDefined();
    expect(faqExpandVariants.expanded).toBeDefined();
    expect(faqExpandVariants.collapsed).toHaveProperty('height', 0);
    expect(faqExpandVariants.collapsed).toHaveProperty('opacity', 0);
    expect(faqExpandVariants.expanded).toHaveProperty('height', 'auto');
    expect(faqExpandVariants.expanded).toHaveProperty('opacity', 1);
  });

  test('faqArrowVariants should have rotation states', () => {
    expect(faqArrowVariants.collapsed).toEqual({ rotate: 0 });
    expect(faqArrowVariants.expanded).toEqual({ rotate: 180 });
  });

  test('reducedMotionTransition should have zero duration', () => {
    expect(reducedMotionTransition).toBeDefined();
    expect(reducedMotionTransition.duration).toBe(0);
  });

  test('all variants should have valid transition durations', () => {
    const checkTransitionDuration = (variant: any) => {
      if (variant.transition && typeof variant.transition.duration === 'number') {
        expect(variant.transition.duration).toBeGreaterThanOrEqual(0);
      }
    };

    checkTransitionDuration(fadeInVariants.visible);
    checkTransitionDuration(slideUpVariants.visible);
    checkTransitionDuration(scaleInVariants.visible);
    checkTransitionDuration(featureCardHoverVariants.hover);
    checkTransitionDuration(featureIconHoverVariants.hover);
    checkTransitionDuration(faqExpandVariants.collapsed);
    checkTransitionDuration(faqExpandVariants.expanded);
  });

  test('boxShadow values should use Fallout colors (Pip-Boy Green)', () => {
    const pipBoyGreenRgb = '0, 255, 136'; // #00ff88 in RGB

    expect(breathingGlowVariants.initial?.boxShadow).toContain(pipBoyGreenRgb);
    expect(featureCardHoverVariants.hover?.boxShadow).toContain(pipBoyGreenRgb);
  });
});
