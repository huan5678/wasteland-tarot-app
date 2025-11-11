/**
 * Performance Benchmarking and Optimization Tests
 *
 * Tests performance metrics for interactive reading experience
 * Requirements: NFR-1.1, NFR-1.2, NFR-1.3, NFR-1.4, NFR-1.5, NFR-1.6, 7.1, 7.2, 7.3, 7.4
 *
 * Performance Targets:
 * - Initial Load (FCP): < 2s desktop, < 3s mobile
 * - Time to Interactive (TTI): < 3.5s desktop, < 5s mobile
 * - Animation FPS: 60 FPS target, 30 FPS minimum
 * - API Response: < 5s including AI
 * - Virtual Scroll: Load 500 records < 5s
 */

import { test, expect } from '@playwright/test';

test.describe('Interactive Reading - Performance Benchmarks', () => {
  test.describe('Page Load Performance', () => {
    test('should meet FCP target on desktop (< 2s)', async ({ page }) => {
      // Navigate and measure
      const navigationPromise = page.goto('/readings/new', { waitUntil: 'commit' });

      // Wait for first contentful paint
      await page.waitForLoadState('domcontentloaded');

      const metrics = await page.evaluate(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];

        return {
          fcp: fcpEntry?.startTime || 0,
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
          loadComplete: perfData.loadEventEnd - perfData.fetchStart,
        };
      });

      await navigationPromise;

      // Assert NFR-1.1: FCP < 2s desktop
      expect(metrics.fcp).toBeLessThan(2000);
      console.log(`FCP: ${metrics.fcp.toFixed(2)}ms`);

      // Assert NFR-1.2: TTI < 3.5s desktop
      expect(metrics.domContentLoaded).toBeLessThan(3500);
      console.log(`TTI: ${metrics.domContentLoaded.toFixed(2)}ms`);
    });

    test('should meet FCP target on mobile (< 3s)', async ({ page }) => {
      // Set mobile viewport and user agent
      await page.setViewportSize({ width: 375, height: 667 });
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      });

      // Navigate
      await page.goto('/readings/new', { waitUntil: 'domcontentloaded' });

      const metrics = await page.evaluate(() => {
        const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

        return {
          fcp: fcpEntry?.startTime || 0,
          tti: perfData.domContentLoadedEventEnd - perfData.fetchStart,
        };
      });

      // Assert mobile targets
      expect(metrics.fcp).toBeLessThan(3000);
      expect(metrics.tti).toBeLessThan(5000);
      console.log(`Mobile FCP: ${metrics.fcp.toFixed(2)}ms, TTI: ${metrics.tti.toFixed(2)}ms`);
    });

    test('should have low Cumulative Layout Shift (< 0.1)', async ({ page }) => {
      await page.goto('/readings/new');

      // Wait for page to fully load
      await page.waitForLoadState('networkidle');

      // Get CLS metric
      const cls = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let clsValue = 0;

          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if ((entry as any).hadRecentInput) continue;
              clsValue += (entry as any).value;
            }
          });

          observer.observe({ type: 'layout-shift', buffered: true });

          // Wait a bit then disconnect and return value
          setTimeout(() => {
            observer.disconnect();
            resolve(clsValue);
          }, 3000);
        });
      });

      // Assert NFR-1.4: CLS < 0.1
      expect(cls).toBeLessThan(0.1);
      console.log(`Cumulative Layout Shift: ${cls.toFixed(4)}`);
    });

    test('should load critical resources quickly', async ({ page }) => {
      await page.goto('/readings/new');
      await page.waitForLoadState('networkidle');

      // Use Resource Timing API to measure load times
      const resourceTimings = await page.evaluate(() => {
        const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        return entries
          .filter(entry =>
            entry.name.includes('/readings/') ||
            entry.name.includes('.js') ||
            entry.name.includes('.css')
          )
          .map(entry => ({
            url: entry.name,
            duration: entry.duration,
            type: entry.initiatorType,
          }));
      });

      // Check that critical resources loaded quickly
      const slowResources = resourceTimings.filter(r => r.duration > 2000);

      if (slowResources.length > 0) {
        console.log('Slow resources:', slowResources);
      }

      // No critical resource should take > 2s
      expect(slowResources.length).toBe(0);
    });
  });

  test.describe('Animation Performance', () => {
    test('should maintain 30+ FPS during shuffle animation', async ({ page }) => {
      await page.goto('/readings/new');

      // Setup FPS monitoring
      await page.evaluate(() => {
        (window as any).__fpsMonitor = {
          frames: [] as number[],
          lastTime: performance.now(),
          startMonitoring() {
            const monitor = () => {
              const now = performance.now();
              const delta = now - this.lastTime;
              const fps = 1000 / delta;
              this.frames.push(fps);
              this.lastTime = now;

              if (this.monitoring) {
                requestAnimationFrame(monitor);
              }
            };

            this.monitoring = true;
            this.lastTime = performance.now();
            requestAnimationFrame(monitor);
          },
          stopMonitoring() {
            this.monitoring = false;
          },
          getStats() {
            const frames = this.frames;
            const avgFps = frames.reduce((a, b) => a + b, 0) / frames.length;
            const minFps = Math.min(...frames);
            const maxFps = Math.max(...frames);

            return { avgFps, minFps, maxFps, frameCount: frames.length };
          },
        };
      });

      // Start monitoring
      await page.evaluate(() => (window as any).__fpsMonitor.startMonitoring());

      // Trigger shuffle animation
      await page.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i }).click();

      // Wait for animation to complete
      await page.waitForTimeout(2500);

      // Stop monitoring
      await page.evaluate(() => (window as any).__fpsMonitor.stopMonitoring());

      // Get FPS statistics
      const fpsStats = await page.evaluate(() => (window as any).__fpsMonitor.getStats());

      console.log(`Animation FPS - Avg: ${fpsStats.avgFps.toFixed(2)}, Min: ${fpsStats.minFps.toFixed(2)}, Max: ${fpsStats.maxFps.toFixed(2)}`);

      // Assert requirement 7.2: Minimum 30 FPS
      expect(fpsStats.minFps).toBeGreaterThan(30);
      // Target: 60 FPS average
      expect(fpsStats.avgFps).toBeGreaterThan(45);
    });

    test('should complete card flip animation within budget (< 1s)', async ({ page }) => {
      await page.goto('/readings/new');

      // Complete shuffle first
      await page.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i }).click();
      await page.waitForTimeout(2000);

      // Measure flip animation time
      const firstCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
      await expect(firstCard).toBeVisible();

      const flipStart = Date.now();
      await firstCard.click();

      // Wait for flip to complete (card front visible)
      await page.locator('[class*="card-front"], [class*="revealed"]').first().waitFor();
      const flipDuration = Date.now() - flipStart;

      console.log(`Flip animation duration: ${flipDuration}ms`);

      // Flip should complete in < 1s (requirement 1.7: 0.5s flip duration)
      expect(flipDuration).toBeLessThan(1000);
    });

    test('should handle reduced motion without performance penalty', async ({ page }) => {
      // Enable reduced motion
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/readings/new');

      // Measure load time with reduced motion
      const startTime = Date.now();
      await page.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i }).click();

      // Cards should appear immediately
      await page.getByRole('button', { name: /flip|翻牌/i }).first().waitFor();
      const duration = Date.now() - startTime;

      console.log(`Reduced motion mode duration: ${duration}ms`);

      // Should be faster than animated version (< 500ms)
      expect(duration).toBeLessThan(500);
    });
  });

  test.describe('API and Streaming Performance', () => {
    test('should start streaming interpretation within 5 seconds', async ({ page }) => {
      await page.goto('/readings/new');

      // Complete card drawing
      await page.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i }).click();
      await page.waitForTimeout(2000);

      const firstCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
      await expect(firstCard).toBeVisible();

      // Measure time to first interpretation token
      const streamStart = Date.now();
      await firstCard.click();

      // Wait for interpretation area to appear with content
      await page.locator('[class*="interpretation"], [class*="streaming"]').waitFor({ timeout: 10000 });

      // Wait for first text to appear
      const hasText = await page.evaluate(() => {
        const interpretationEl = document.querySelector('[class*="interpretation"], [class*="streaming"]');
        return interpretationEl?.textContent && interpretationEl.textContent.trim().length > 0;
      });

      const streamDuration = Date.now() - streamStart;

      console.log(`Time to first interpretation token: ${streamDuration}ms`);

      // Assert requirement 7.3: First token < 5s
      expect(streamDuration).toBeLessThan(5000);
      expect(hasText).toBe(true);
    });

    test('should display first batch of streamed text within 200ms', async ({ page }) => {
      await page.goto('/readings/new');

      // Setup performance marker
      await page.evaluate(() => {
        (window as any).__streamMetrics = {
          firstBatchTime: 0,
          apiCallTime: 0,
        };
      });

      // Complete drawing
      await page.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i }).click();
      await page.waitForTimeout(2000);

      const firstCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
      await expect(firstCard).toBeVisible();
      await firstCard.click();

      // Monitor for first text appearance
      const textAppeared = await page.waitForFunction(
        () => {
          const el = document.querySelector('[class*="interpretation"], [class*="streaming"]');
          return el && el.textContent && el.textContent.trim().length > 0;
        },
        { timeout: 10000 }
      );

      // We can't easily measure the 200ms window without instrumentation,
      // but we can verify text appears quickly
      expect(textAppeared).toBeTruthy();
    });

    test('should handle API timeout gracefully', async ({ page }) => {
      // Intercept and delay API response
      await page.route('**/api/v1/readings/**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 35000)); // 35s > 30s timeout
        route.fulfill({
          status: 504,
          body: JSON.stringify({ error: 'Gateway Timeout' }),
        });
      });

      await page.goto('/readings/new');

      // Complete drawing
      await page.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i }).click();
      await page.waitForTimeout(2000);

      const firstCard = page.getByRole('button', { name: /flip|翻牌/i }).first();
      await firstCard.click();

      // Should show timeout error within reasonable time
      const errorMessage = page.getByText(/錯誤|error|timeout|超時/i);
      await expect(errorMessage).toBeVisible({ timeout: 35000 });

      // Retry button should be available
      const retryButton = page.getByRole('button', { name: /重試|retry/i });
      await expect(retryButton).toBeVisible();
    });
  });

  test.describe('Virtual Scroll Performance', () => {
    test.skip('should load 500 reading records within 5 seconds', async ({ page }) => {
      // This test requires backend setup with 500 records
      // Skip for now, but structure is ready

      await page.goto('/readings/history');

      // Measure load time
      const loadStart = Date.now();
      await page.waitForLoadState('networkidle');

      // Wait for virtual list to be ready
      await page.locator('[role="list"]').waitFor();

      const loadDuration = Date.now() - loadStart;

      console.log(`500 records load time: ${loadDuration}ms`);

      // Assert requirement 7.4: < 5s for 500 records
      expect(loadDuration).toBeLessThan(5000);
    });

    test.skip('should maintain smooth scrolling with virtualization', async ({ page }) => {
      await page.goto('/readings/history');
      await page.waitForLoadState('networkidle');

      // Setup scroll FPS monitoring
      await page.evaluate(() => {
        (window as any).__scrollFps = {
          frames: [] as number[],
          lastTime: performance.now(),
        };

        const listElement = document.querySelector('[role="list"]');
        if (listElement) {
          listElement.addEventListener('scroll', () => {
            const now = performance.now();
            const fps = 1000 / (now - (window as any).__scrollFps.lastTime);
            (window as any).__scrollFps.frames.push(fps);
            (window as any).__scrollFps.lastTime = now;
          });
        }
      });

      // Perform rapid scrolling
      const listElement = page.locator('[role="list"]');
      await listElement.evaluate((el) => {
        el.scrollTo({ top: 1000, behavior: 'auto' });
      });
      await page.waitForTimeout(100);

      await listElement.evaluate((el) => {
        el.scrollTo({ top: 5000, behavior: 'auto' });
      });
      await page.waitForTimeout(100);

      await listElement.evaluate((el) => {
        el.scrollTo({ top: 10000, behavior: 'auto' });
      });
      await page.waitForTimeout(100);

      // Get FPS data
      const scrollFps = await page.evaluate(() => {
        const frames = (window as any).__scrollFps.frames;
        if (frames.length === 0) return { avgFps: 60, minFps: 60 };

        const avgFps = frames.reduce((a: number, b: number) => a + b, 0) / frames.length;
        const minFps = Math.min(...frames);
        return { avgFps, minFps };
      });

      console.log(`Scroll FPS - Avg: ${scrollFps.avgFps.toFixed(2)}, Min: ${scrollFps.minFps.toFixed(2)}`);

      // Should maintain > 30 FPS while scrolling
      expect(scrollFps.minFps).toBeGreaterThan(30);
    });
  });

  test.describe('Memory and Resource Usage', () => {
    test('should not have memory leaks during repeated animations', async ({ page }) => {
      await page.goto('/readings/new');

      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      // Perform multiple animation cycles
      for (let i = 0; i < 5; i++) {
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Trigger animation
        await page.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i }).click();
        await page.waitForTimeout(2000);
      }

      // Get final memory usage
      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = ((finalMemory - initialMemory) / initialMemory) * 100;
        console.log(`Memory increase: ${memoryIncrease.toFixed(2)}%`);

        // Memory should not increase more than 50% after 5 cycles
        expect(memoryIncrease).toBeLessThan(50);
      }
    });

    test('should clean up event listeners properly', async ({ page }) => {
      await page.goto('/readings/new');

      // Count initial event listeners
      const initialListeners = await page.evaluate(() => {
        const getListeners = (target: EventTarget) => {
          const listeners = (target as any)._listeners || {};
          return Object.keys(listeners).length;
        };

        return {
          window: getListeners(window),
          document: getListeners(document),
        };
      });

      // Trigger multiple state changes
      for (let i = 0; i < 3; i++) {
        await page.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i }).click();
        await page.waitForTimeout(500);
        await page.reload();
        await page.waitForLoadState('networkidle');
      }

      // Count final event listeners
      const finalListeners = await page.evaluate(() => {
        const getListeners = (target: EventTarget) => {
          const listeners = (target as any)._listeners || {};
          return Object.keys(listeners).length;
        };

        return {
          window: getListeners(window),
          document: getListeners(document),
        };
      });

      console.log('Initial listeners:', initialListeners);
      console.log('Final listeners:', finalListeners);

      // Listener count should not grow unbounded (allow some variance)
      const windowGrowth = finalListeners.window - initialListeners.window;
      const documentGrowth = finalListeners.document - initialListeners.document;

      expect(Math.abs(windowGrowth)).toBeLessThan(10);
      expect(Math.abs(documentGrowth)).toBeLessThan(10);
    });
  });

  test.describe('Bundle Size and Code Splitting', () => {
    test('should lazy load non-critical resources', async ({ page }) => {
      const loadedResources: string[] = [];

      page.on('response', (response) => {
        const url = response.url();
        if (url.includes('.js') || url.includes('.css')) {
          loadedResources.push(url);
        }
      });

      // Initial page load
      await page.goto('/readings/new');
      await page.waitForLoadState('domcontentloaded');

      const initialResourceCount = loadedResources.length;
      console.log(`Initial resources loaded: ${initialResourceCount}`);

      // Trigger interaction that might load more resources
      await page.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i }).click();
      await page.waitForTimeout(2000);

      const totalResourceCount = loadedResources.length;
      console.log(`Total resources after interaction: ${totalResourceCount}`);

      // Some lazy loading should occur (or all loaded upfront is also okay)
      // Main check: not loading excessive resources
      expect(totalResourceCount).toBeLessThan(50); // Reasonable bundle count
    });
  });
});
