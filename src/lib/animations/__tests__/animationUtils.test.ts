/**
 * Animation Utils Tests
 * Verifies animation utility functions
 */

import { describe, test, expect } from 'vitest';
import {
  FPSMonitor,
  isTouchDevice,
  getViewportCategory,
  isGSAPAvailable,
} from '../animationUtils';

describe('animationUtils', () => {
  describe('FPSMonitor', () => {
    test('should initialize with default FPS of 60', () => {
      const monitor = new FPSMonitor();
      expect(monitor.getFPS()).toBe(60);
    });

    test('should have start, stop, and getFPS methods', () => {
      const monitor = new FPSMonitor();
      expect(typeof monitor.start).toBe('function');
      expect(typeof monitor.stop).toBe('function');
      expect(typeof monitor.getFPS).toBe('function');
    });

    test('should return current FPS value', () => {
      const monitor = new FPSMonitor();
      const fps = monitor.getFPS();
      expect(typeof fps).toBe('number');
      expect(fps).toBeGreaterThanOrEqual(0);
    });
  });

  describe('isTouchDevice', () => {
    test('should return a boolean value', () => {
      const result = isTouchDevice();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getViewportCategory', () => {
    test('should return one of the valid viewport categories', () => {
      const result = getViewportCategory();
      expect(['mobile', 'tablet', 'desktop']).toContain(result);
    });
  });

  describe('isGSAPAvailable', () => {
    test('should return a boolean value', () => {
      const result = isGSAPAvailable();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Function exports', () => {
    test('all utility functions should be exported', async () => {
      const utils = await import('../animationUtils');

      expect(utils.isInViewport).toBeDefined();
      expect(utils.FPSMonitor).toBeDefined();
      expect(utils.isTouchDevice).toBeDefined();
      expect(utils.getViewportCategory).toBeDefined();
      expect(utils.isGSAPAvailable).toBeDefined();
      expect(utils.getElementFullHeight).toBeDefined();
    });

    test('exported functions should have correct types', async () => {
      const utils = await import('../animationUtils');

      expect(typeof utils.isInViewport).toBe('function');
      expect(typeof utils.FPSMonitor).toBe('function');
      expect(typeof utils.isTouchDevice).toBe('function');
      expect(typeof utils.getViewportCategory).toBe('function');
      expect(typeof utils.isGSAPAvailable).toBe('function');
      expect(typeof utils.getElementFullHeight).toBe('function');
    });
  });
});
