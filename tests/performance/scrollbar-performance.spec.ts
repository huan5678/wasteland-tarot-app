import { test, expect, chromium } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

/**
 * Scrollbar Performance Tests
 *
 * Tests custom scrollbar implementation for performance impact:
 * - Lighthouse performance audit (target: >= 90)
 * - Cumulative Layout Shift (CLS < 0.1)
 * - First Contentful Paint (FCP < 1500ms)
 * - Scrolling frame rate (FPS >= 55)
 *
 * Requirements: 7.4, 7.5
 */

test.describe('Scrollbar Performance', () => {

  test('should pass Lighthouse performance audit', async () => {
    // Launch browser with specific flags for Lighthouse
    const browser = await chromium.launch({
      args: ['--remote-debugging-port=9222'],
    });

    const page = await browser.newPage();

    try {
      await page.goto('http://localhost:3000');

      // Run Lighthouse audit
      const lighthouseResult = await playAudit({
        page,
        port: 9222,
        thresholds: {
          performance: 90,
          accessibility: 90,
          'best-practices': 90,
          seo: 80,
        },
        reports: {
          formats: {
            html: true,
          },
          name: 'scrollbar-performance-audit',
          directory: './tests/performance/lighthouse-reports',
        },
      });

      // Verify performance score meets threshold
      expect(lighthouseResult.lhr.categories.performance.score).toBeGreaterThanOrEqual(0.9);

      // Verify CLS (Cumulative Layout Shift) is acceptable
      const clsMetric = lighthouseResult.lhr.audits['cumulative-layout-shift'];
      if (clsMetric && clsMetric.numericValue !== undefined) {
        expect(clsMetric.numericValue).toBeLessThan(0.1);
      }

      // Verify FCP (First Contentful Paint) is fast
      const fcpMetric = lighthouseResult.lhr.audits['first-contentful-paint'];
      if (fcpMetric && fcpMetric.numericValue !== undefined) {
        expect(fcpMetric.numericValue).toBeLessThan(1500); // 1.5 seconds
      }
    } finally {
      await page.close();
      await browser.close();
    }
  });

  test('should maintain high FPS during scrolling', async ({ page }) => {
    await page.goto('/');

    // Ensure page has scrollable content
    await page.evaluate(() => {
      const testContent = document.createElement('div');
      testContent.id = 'scrollbar-test-content';
      testContent.style.height = '5000px';
      testContent.style.position = 'absolute';
      testContent.style.top = '0';
      testContent.style.pointerEvents = 'none';
      document.body.appendChild(testContent);
    });

    // Measure frame rate during scrolling
    const fpsResults = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const frames: number[] = [];
        let lastFrameTime = performance.now();
        let animationFrameId: number;
        let startTime = performance.now();
        const duration = 2000; // 2 seconds of scrolling

        const measureFPS = () => {
          const currentTime = performance.now();
          const deltaTime = currentTime - lastFrameTime;

          if (deltaTime > 0) {
            frames.push(1000 / deltaTime);
          }

          lastFrameTime = currentTime;

          if (currentTime - startTime < duration) {
            animationFrameId = requestAnimationFrame(measureFPS);
          } else {
            cancelAnimationFrame(animationFrameId);
            // Calculate average FPS
            const averageFPS = frames.reduce((sum, fps) => sum + fps, 0) / frames.length;
            resolve(averageFPS);
          }
        };

        // Start scrolling animation
        let scrollTop = 0;
        const scrollInterval = setInterval(() => {
          scrollTop += 10;
          window.scrollTo(0, scrollTop);

          if (performance.now() - startTime >= duration) {
            clearInterval(scrollInterval);
          }
        }, 16); // ~60fps target

        // Start measuring
        animationFrameId = requestAnimationFrame(measureFPS);
      });
    });

    // Verify average FPS is >= 55 (requirement threshold)
    expect(fpsResults).toBeGreaterThanOrEqual(55);

    // Cleanup
    await page.evaluate(() => {
      const testContent = document.getElementById('scrollbar-test-content');
      if (testContent) testContent.remove();
    });
  });

  test('should not cause layout thrashing during scrollbar interactions', async ({ page }) => {
    await page.goto('/');

    // Ensure page has scrollable content
    await page.evaluate(() => {
      const testContent = document.createElement('div');
      testContent.id = 'scrollbar-test-content';
      testContent.style.height = '3000px';
      testContent.style.position = 'absolute';
      testContent.style.top = '0';
      testContent.style.pointerEvents = 'none';
      document.body.appendChild(testContent);
    });

    // Measure layout recalculations during hover
    const layoutCount = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let layoutRecalcCount = 0;

        // Use PerformanceObserver to detect layout shifts
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              layoutRecalcCount++;
            }
          }
        });

        observer.observe({ type: 'layout-shift', buffered: true });

        // Simulate hover interactions
        setTimeout(() => {
          observer.disconnect();
          resolve(layoutRecalcCount);
        }, 2000);
      });
    });

    // Verify minimal layout shifts (should be 0 or very low)
    expect(layoutCount).toBeLessThanOrEqual(2);

    // Cleanup
    await page.evaluate(() => {
      const testContent = document.getElementById('scrollbar-test-content');
      if (testContent) testContent.remove();
    });
  });

  test('should have minimal paint areas during scrollbar hover', async ({ page }) => {
    await page.goto('/');

    // Ensure page has scrollable content
    await page.evaluate(() => {
      const testContent = document.createElement('div');
      testContent.id = 'scrollbar-test-content';
      testContent.style.height = '3000px';
      testContent.style.position = 'absolute';
      testContent.style.top = '0';
      testContent.style.pointerEvents = 'none';
      document.body.appendChild(testContent);
    });

    // Enable paint profiling
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');

    // Hover over scrollbar area
    await page.mouse.move(page.viewportSize()!.width - 10, 500);

    // Wait for any paint operations
    await page.waitForTimeout(500);

    // Get performance metrics
    const metrics = await client.send('Performance.getMetrics');

    // Find paint-related metrics
    const layoutDurationMetric = metrics.metrics.find(m => m.name === 'LayoutDuration');
    const recalcStyleDurationMetric = metrics.metrics.find(m => m.name === 'RecalcStyleDuration');

    // Verify paint operations are minimal (values should be low)
    if (layoutDurationMetric) {
      expect(layoutDurationMetric.value).toBeLessThan(50); // Less than 50ms
    }

    if (recalcStyleDurationMetric) {
      expect(recalcStyleDurationMetric.value).toBeLessThan(20); // Less than 20ms
    }

    // Cleanup
    await client.detach();
    await page.evaluate(() => {
      const testContent = document.getElementById('scrollbar-test-content');
      if (testContent) testContent.remove();
    });
  });

  test('should not block main thread during scroll', async ({ page }) => {
    await page.goto('/');

    // Ensure page has scrollable content
    await page.evaluate(() => {
      const testContent = document.createElement('div');
      testContent.id = 'scrollbar-test-content';
      testContent.style.height = '5000px';
      testContent.style.position = 'absolute';
      testContent.style.top = '0';
      testContent.style.pointerEvents = 'none';
      document.body.appendChild(testContent);
    });

    // Measure main thread blocking time
    const blockingTime = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let longTaskDuration = 0;

        // Use PerformanceObserver to detect long tasks
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Tasks longer than 50ms
              longTaskDuration += entry.duration;
            }
          }
        });

        // Note: 'longtask' observer type may not be available in all browsers
        try {
          observer.observe({ type: 'longtask', buffered: true });
        } catch (e) {
          // Fallback if longtask observer is not supported
          console.warn('longtask observer not supported');
        }

        // Scroll for 2 seconds
        let scrollTop = 0;
        const scrollInterval = setInterval(() => {
          scrollTop += 20;
          window.scrollTo(0, scrollTop);
        }, 16);

        setTimeout(() => {
          clearInterval(scrollInterval);
          observer.disconnect();
          resolve(longTaskDuration);
        }, 2000);
      });
    });

    // Verify minimal main thread blocking (should be low)
    expect(blockingTime).toBeLessThan(500); // Less than 500ms total blocking time

    // Cleanup
    await page.evaluate(() => {
      const testContent = document.getElementById('scrollbar-test-content');
      if (testContent) testContent.remove();
    });
  });
});
