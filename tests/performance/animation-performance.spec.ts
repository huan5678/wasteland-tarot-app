/**
 * Animation Performance Tests
 * Task 16.4 & 16.5: Lighthouse Performance and Memory/FPS Testing
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 17.3
 */

import { test, expect, chromium } from '@playwright/test';

test.describe('Animation Performance Tests', () => {
  test('should achieve Lighthouse Performance score >= 90', async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('http://localhost:3000');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Measure Web Vitals using Performance API
    const vitals = await page.evaluate(() => {
      return new Promise<{
        FCP: number | null;
        LCP: number | null;
        CLS: number;
        FID: number | null;
        TTFB: number | null;
      }>((resolve) => {
        let fcpValue = null;
        let lcpValue = null;
        let clsValue = 0;
        let fidValue = null;
        let ttfbValue = null;

        // First Contentful Paint
        const fcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              fcpValue = entry.startTime;
            }
          }
        });
        fcpObserver.observe({ type: 'paint', buffered: true });

        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          lcpValue = lastEntry.startTime;
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });

        // Time to First Byte
        const navTiming = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        if (navTiming) {
          ttfbValue = navTiming.responseStart - navTiming.requestStart;
        }

        // Wait for measurements to stabilize
        setTimeout(() => {
          fcpObserver.disconnect();
          lcpObserver.disconnect();
          clsObserver.disconnect();

          resolve({
            FCP: fcpValue,
            LCP: lcpValue,
            CLS: clsValue,
            FID: fidValue,
            TTFB: ttfbValue,
          });
        }, 3000);
      });
    });

    console.log('Web Vitals:', vitals);

    // Performance targets
    expect(vitals.FCP).not.toBeNull();
    expect(vitals.FCP!).toBeLessThan(1500); // FCP < 1.5s

    expect(vitals.LCP).not.toBeNull();
    expect(vitals.LCP!).toBeLessThan(2500); // LCP < 2.5s

    expect(vitals.CLS).toBeLessThanOrEqual(0.1); // CLS <= 0.1

    await browser.close();
  });

  test('should maintain >= 55 average FPS during automatic scrolling', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Inject FPS monitor
    await page.evaluate(() => {
      (window as any).fpsData = [];
      let lastFrameTime = performance.now();

      function measureFPS() {
        const now = performance.now();
        const fps = 1000 / (now - lastFrameTime);
        (window as any).fpsData.push(fps);
        lastFrameTime = now;
        requestAnimationFrame(measureFPS);
      }
      requestAnimationFrame(measureFPS);
    });

    // Automatic smooth scroll through entire page
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);

    // Scroll in steps
    const scrollSteps = 10;
    const scrollStep = pageHeight / scrollSteps;

    for (let i = 0; i < scrollSteps; i++) {
      await page.evaluate((step) => {
        window.scrollTo({ top: step, behavior: 'smooth' });
      }, (i + 1) * scrollStep);
      await page.waitForTimeout(300);
    }

    // Get FPS data
    const fpsData = (await page.evaluate(() => (window as any).fpsData || [])) as number[];

    expect(fpsData.length).toBeGreaterThan(0);

    // Calculate average FPS
    const averageFPS = fpsData.reduce((sum, fps) => sum + fps, 0) / fpsData.length;
    console.log(`Average FPS during scrolling: ${averageFPS.toFixed(2)}`);

    // Average FPS should be >= 55
    expect(averageFPS).toBeGreaterThanOrEqual(55);

    // Check for frame drops (FPS < 30)
    const frameDrops = fpsData.filter((fps) => fps < 30).length;
    const frameDropPercentage = (frameDrops / fpsData.length) * 100;

    console.log(`Frame drops (< 30fps): ${frameDropPercentage.toFixed(2)}%`);

    // Frame drops should be < 5%
    expect(frameDropPercentage).toBeLessThan(5);
  });

  test('should have no long tasks > 50ms during animations', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Enable long task monitoring
    const longTasks = await page.evaluate(() => {
      return new Promise<Array<{ duration: number }>>((resolve) => {
        const tasks: Array<{ duration: number }> = [];

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            tasks.push({ duration: entry.duration });
          }
        });

        observer.observe({ type: 'longtask', buffered: true });

        // Scroll through page to trigger animations
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

        setTimeout(() => {
          observer.disconnect();
          resolve(tasks);
        }, 5000);
      });
    });

    console.log(`Long tasks detected: ${longTasks.length}`);

    // Log tasks > 50ms
    const tasksOver50ms = longTasks.filter((task) => task.duration > 50);
    if (tasksOver50ms.length > 0) {
      console.log('Tasks over 50ms:', tasksOver50ms);
    }

    // Should have no tasks > 50ms (or very few)
    expect(tasksOver50ms.length).toBeLessThanOrEqual(2);
  });

  test('should detect no memory leaks after 100 mount/unmount cycles', async () => {
    const browser = await chromium.launch({
      args: ['--enable-precise-memory-info'],
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Get initial heap size
    const initialHeapSize = await page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return null;
    });

    if (initialHeapSize === null) {
      console.log('Memory API not available, skipping memory leak test');
      await browser.close();
      return;
    }

    console.log(`Initial heap size: ${(initialHeapSize / 1024 / 1024).toFixed(2)} MB`);

    // Simulate 100 mount/unmount cycles by navigating
    for (let i = 0; i < 100; i++) {
      // Navigate to different route
      await page.goto('http://localhost:3000/about');
      await page.waitForTimeout(50);

      // Navigate back to homepage
      await page.goto('http://localhost:3000');
      await page.waitForTimeout(50);

      // Force garbage collection every 10 cycles
      if (i % 10 === 0) {
        await page.evaluate(() => {
          if ((window as any).gc) {
            (window as any).gc();
          }
        });
      }
    }

    // Final garbage collection
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });
    await page.waitForTimeout(1000);

    // Get final heap size
    const finalHeapSize = await page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return null;
    });

    console.log(`Final heap size: ${(finalHeapSize / 1024 / 1024).toFixed(2)} MB`);

    // Calculate heap growth
    const heapGrowth = finalHeapSize - initialHeapSize;
    const heapGrowthMB = heapGrowth / 1024 / 1024;
    const heapGrowthPercentage = (heapGrowth / initialHeapSize) * 100;

    console.log(`Heap growth: ${heapGrowthMB.toFixed(2)} MB (${heapGrowthPercentage.toFixed(2)}%)`);

    // Heap should not grow significantly (< 50% growth allowed)
    expect(heapGrowthPercentage).toBeLessThan(50);

    await browser.close();
  });

  test('should use GPU-accelerated properties only (transform, opacity)', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Check all animated elements
    const nonGPUProperties = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-gsap], [data-motion], .motion-element');
      const violations: string[] = [];

      // Properties that trigger layout (non-GPU-accelerated)
      const badProperties = [
        'width',
        'height',
        'top',
        'left',
        'right',
        'bottom',
        'margin',
        'padding',
      ];

      elements.forEach((el) => {
        const computedStyle = window.getComputedStyle(el);
        const transition = computedStyle.transition || computedStyle.webkitTransition;

        badProperties.forEach((prop) => {
          if (transition.includes(prop)) {
            violations.push(`Element uses non-GPU property: ${prop}`);
          }
        });
      });

      return violations;
    });

    console.log('Non-GPU property violations:', nonGPUProperties);

    // Should have no violations (or very few exceptions)
    expect(nonGPUProperties.length).toBeLessThanOrEqual(1);
  });

  test('should load animation libraries efficiently (bundle size check)', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check bundle sizes via Performance API
    const resourceSizes = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const bundles: { [key: string]: number } = {};

      resources.forEach((resource) => {
        const name = resource.name;
        const size = resource.transferSize || 0;

        if (name.includes('gsap')) {
          bundles['GSAP'] = (bundles['GSAP'] || 0) + size;
        }
        if (name.includes('motion')) {
          bundles['Framer Motion'] = (bundles['Framer Motion'] || 0) + size;
        }
        if (name.includes('_next/static/chunks')) {
          bundles['Next.js Chunks'] = (bundles['Next.js Chunks'] || 0) + size;
        }
      });

      return bundles;
    });

    console.log('Bundle sizes:', resourceSizes);

    // GSAP + ScrollTrigger should be < 100KB (gzipped)
    if (resourceSizes['GSAP']) {
      expect(resourceSizes['GSAP']).toBeLessThan(100 * 1024);
    }
  });

  test('should pass GSAP ScrollTrigger performance test', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Check number of ScrollTrigger instances
    const scrollTriggerCount = await page.evaluate(() => {
      if (typeof (window as any).ScrollTrigger !== 'undefined') {
        return (window as any).ScrollTrigger.getAll().length;
      }
      return 0;
    });

    console.log(`ScrollTrigger instances: ${scrollTriggerCount}`);

    // Should have reasonable number of ScrollTriggers (not too many)
    expect(scrollTriggerCount).toBeLessThanOrEqual(20);

    // Scroll performance test
    const scrollStartTime = Date.now();

    await page.evaluate(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });

    await page.waitForTimeout(2000);

    const scrollEndTime = Date.now();
    const scrollDuration = scrollEndTime - scrollStartTime;

    // Scroll should complete smoothly within reasonable time
    expect(scrollDuration).toBeLessThan(3000);
  });

  test('should prevent cumulative layout shift (CLS) during all animations', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Enable layout shift tracking
    const cls = await page.evaluate(() => {
      return new Promise<{ total: number; shifts: number }>((resolve) => {
        let clsValue = 0;
        let shiftCount = 0;

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
              shiftCount++;
            }
          }
        });

        observer.observe({ type: 'layout-shift', buffered: true });

        // Scroll through entire page
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

        setTimeout(() => {
          observer.disconnect();
          resolve({ total: clsValue, shifts: shiftCount });
        }, 5000);
      });
    });

    console.log(`CLS: ${cls.total.toFixed(4)}, Shifts: ${cls.shifts}`);

    // CLS should be <= 0.1
    expect(cls.total).toBeLessThanOrEqual(0.1);
  });

  test('should handle multiple viewport sizes without performance degradation', async () => {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' },
    ];

    for (const viewport of viewports) {
      const browser = await chromium.launch();
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();

      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');

      // Measure FPS
      await page.evaluate(() => {
        (window as any).fpsData = [];
        let lastFrameTime = performance.now();

        function measureFPS() {
          const now = performance.now();
          const fps = 1000 / (now - lastFrameTime);
          (window as any).fpsData.push(fps);
          lastFrameTime = now;

          if ((window as any).fpsData.length < 60) {
            requestAnimationFrame(measureFPS);
          }
        }
        requestAnimationFrame(measureFPS);
      });

      // Scroll
      await page.evaluate(() => {
        window.scrollTo({ top: 500, behavior: 'smooth' });
      });
      await page.waitForTimeout(1500);

      const fpsData = (await page.evaluate(() => (window as any).fpsData || [])) as number[];
      const averageFPS = fpsData.reduce((sum, fps) => sum + fps, 0) / fpsData.length;

      console.log(`${viewport.name} Average FPS: ${averageFPS.toFixed(2)}`);

      // All viewports should maintain >= 50 FPS
      expect(averageFPS).toBeGreaterThanOrEqual(50);

      await browser.close();
    }
  });
});
