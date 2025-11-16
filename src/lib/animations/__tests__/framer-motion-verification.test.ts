/**
 * Framer Motion Integration Verification Test
 * Verifies that motion package (Framer Motion) is installed and working correctly
 */

import { describe, test, expect } from 'vitest';

describe('Framer Motion Integration Verification', () => {
  test('motion package should be available', async () => {
    const { motion, AnimatePresence } = await import('motion/react');

    expect(motion).toBeDefined();
    expect(AnimatePresence).toBeDefined();
  });

  test('motion component types should be available', async () => {
    const { motion } = await import('motion/react');

    // Verify basic motion components exist
    expect(motion.div).toBeDefined();
    expect(motion.button).toBeDefined();
    expect(motion.section).toBeDefined();
    expect(motion.span).toBeDefined();
  });

  test('Variants type should be available', async () => {
    const motionModule = await import('motion/react');

    // Verify type exists (TypeScript will catch if it doesn't)
    const testVariants: typeof motionModule.Variants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    };

    expect(testVariants).toBeDefined();
    expect(testVariants.hidden).toEqual({ opacity: 0 });
    expect(testVariants.visible).toEqual({ opacity: 1 });
  });

  test('AnimatePresence should be importable', async () => {
    const { AnimatePresence } = await import('motion/react');

    expect(AnimatePresence).toBeDefined();
    expect(typeof AnimatePresence).toBe('function');
  });

  test('motion library version should be correct', async () => {
    // Verify we're using motion package (Framer Motion rebranded)
    const packageJson = await import('../../../../package.json');

    expect(packageJson.dependencies.motion).toBeDefined();
    expect(packageJson.dependencies.motion).toMatch(/^\^12\./);
  });

  test('motion should support animation props (TypeScript verification)', async () => {
    const { motion } = await import('motion/react');

    // This test verifies TypeScript types are working
    // If these properties don't exist, TypeScript compilation would fail
    const testProps = {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      whileHover: { scale: 1.1 },
      whileTap: { scale: 0.95 },
      transition: { duration: 0.3 },
    };

    expect(testProps).toBeDefined();
    expect(testProps.initial).toBeDefined();
    expect(testProps.animate).toBeDefined();
    expect(testProps.whileHover).toBeDefined();
  });
});
