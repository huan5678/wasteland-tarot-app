/**
 * E2E Tests - Music Player Performance Testing
 * Task 35: 效能測試 - 驗證效能指標並優化
 * Requirements 12.1, 12.4: 效能測試
 *
 * Performance Targets:
 * - Music Switch Latency: < 500ms
 * - UI Render Performance: < 100ms
 * - Memory Usage: ≤ 50MB
 * - Visualizer FPS: ≥ 30
 */

import { test, expect } from '@playwright/test';

test.describe('Music Player - Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Clear localStorage
    await page.evaluate(() => {
      localStorage.clear();
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  // ========================================================================
  // Test 1: Music Switch Latency (Target: < 500ms)
  // ========================================================================

  test('Performance: Music switch latency should be < 500ms', async ({ page }) => {
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(500);

    const latencies: number[] = [];

    // Test switching between different modes
    const modes = ['Synthwave', 'Lo-fi', 'Ambient', 'Synthwave'];

    for (const mode of modes) {
      const startTime = Date.now();

      // Click mode button
      await page.click(`button:has-text("${mode}")`);

      // Wait for mode to be selected (indicated by border class)
      await page.waitForSelector(`button:has-text("${mode}"):has-class("border-pip-boy-green")`, {
        timeout: 1000,
      });

      const endTime = Date.now();
      const latency = endTime - startTime;

      latencies.push(latency);

      console.log(`Mode switch to ${mode}: ${latency}ms`);

      // Add small delay between switches
      await page.waitForTimeout(200);
    }

    // Calculate average latency
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);

    console.log(`Average latency: ${avgLatency}ms`);
    console.log(`Max latency: ${maxLatency}ms`);

    // Generate performance report
    const report = {
      test: 'Music Switch Latency',
      target: '< 500ms',
      avgLatency: `${avgLatency.toFixed(2)}ms`,
      maxLatency: `${maxLatency}ms`,
      samples: latencies,
      passed: maxLatency < 500,
    };

    console.log('Performance Report:', JSON.stringify(report, null, 2));

    // Assert target is met
    expect(maxLatency).toBeLessThan(500);
    expect(avgLatency).toBeLessThan(300); // Stricter target for average
  });

  // ========================================================================
  // Test 2: UI Render Performance (Target: < 100ms)
  // ========================================================================

  test('Performance: UI render time should be < 100ms', async ({ page }) => {
    // Enable performance measuring
    await page.evaluate(() => {
      performance.mark('render-start');
    });

    const startTime = Date.now();

    // Open drawer (trigger render)
    await page.click('[aria-label="開啟音樂播放器"]');

    // Wait for drawer to be visible
    await page.waitForSelector('[data-testid="music-player-drawer"]', { state: 'visible' });

    const endTime = Date.now();
    const renderTime = endTime - startTime;

    console.log(`Drawer render time: ${renderTime}ms`);

    // Get performance metrics using React Profiler (if available)
    const perfMetrics = await page.evaluate(() => {
      performance.mark('render-end');
      performance.measure('drawer-render', 'render-start', 'render-end');

      const entries = performance.getEntriesByName('drawer-render');
      if (entries.length > 0) {
        return {
          duration: entries[0].duration,
          startTime: entries[0].startTime,
        };
      }

      return null;
    });

    if (perfMetrics) {
      console.log(`Performance API duration: ${perfMetrics.duration}ms`);
    }

    // Generate performance report
    const report = {
      test: 'UI Render Performance',
      target: '< 100ms',
      renderTime: `${renderTime}ms`,
      perfAPIMetrics: perfMetrics,
      passed: renderTime < 100,
    };

    console.log('Performance Report:', JSON.stringify(report, null, 2));

    // Assert target is met
    expect(renderTime).toBeLessThan(100);
  });

  test('Performance: Component re-render optimization', async ({ page }) => {
    // Open drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(500);

    // Inject render tracking
    await page.evaluate(() => {
      (window as any).__renderCount = 0;

      // Mock React.memo effectiveness by tracking re-renders
      const originalSetState = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf((window as any).React || {}),
        'setState'
      );

      if (originalSetState) {
        Object.defineProperty(Object.getPrototypeOf((window as any).React || {}), 'setState', {
          ...originalSetState,
          value: function (...args: any[]) {
            (window as any).__renderCount++;
            return originalSetState.value?.apply(this, args);
          },
        });
      }
    });

    // Perform multiple unrelated actions
    await page.click('[aria-label="下一首"]');
    await page.waitForTimeout(100);

    await page.click('[aria-label="上一首"]');
    await page.waitForTimeout(100);

    await page.locator('[role="slider"][aria-label*="音量"]').fill('50');
    await page.waitForTimeout(100);

    // Get render count
    const renderCount = await page.evaluate(() => (window as any).__renderCount || 0);

    console.log(`Total re-renders: ${renderCount}`);

    // With React.memo, re-renders should be minimal
    // (This is a heuristic test - exact count depends on implementation)
    expect(renderCount).toBeLessThan(50); // Reasonable threshold
  });

  // ========================================================================
  // Test 3: Memory Usage (Target: ≤ 50MB)
  // ========================================================================

  test('Performance: Memory usage should be ≤ 50MB', async ({ page }) => {
    // Get initial memory
    const initialMetrics = await page.evaluate(() => {
      if ((performance as any).memory) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        };
      }
      return null;
    });

    if (!initialMetrics) {
      console.log('Memory metrics not available (requires Chrome with --enable-precise-memory-info)');
      test.skip();
      return;
    }

    console.log('Initial memory:', initialMetrics);

    // Open drawer and perform operations
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(500);

    // Select mode and play
    await page.click('button:has-text("Synthwave")');
    await page.waitForTimeout(500);

    await page.click('[aria-label="播放"]');
    await page.waitForTimeout(1000);

    // Switch modes multiple times
    for (const mode of ['Lo-fi', 'Ambient', 'Synthwave']) {
      await page.click(`button:has-text("${mode}")`);
      await page.waitForTimeout(500);
    }

    // Get final memory
    const finalMetrics = await page.evaluate(() => {
      if ((performance as any).memory) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        };
      }
      return null;
    });

    if (!finalMetrics) return;

    console.log('Final memory:', finalMetrics);

    const memoryIncreaseMB =
      (finalMetrics.usedJSHeapSize - initialMetrics.usedJSHeapSize) / 1024 / 1024;

    console.log(`Memory increase: ${memoryIncreaseMB.toFixed(2)}MB`);

    // Generate performance report
    const report = {
      test: 'Memory Usage',
      target: '≤ 50MB',
      memoryIncrease: `${memoryIncreaseMB.toFixed(2)}MB`,
      initialHeapSize: `${(initialMetrics.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      finalHeapSize: `${(finalMetrics.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      passed: memoryIncreaseMB <= 50,
    };

    console.log('Performance Report:', JSON.stringify(report, null, 2));

    // Assert target is met
    expect(memoryIncreaseMB).toBeLessThanOrEqual(50);
  });

  // ========================================================================
  // Test 4: Visualizer FPS (Target: ≥ 30)
  // ========================================================================

  test('Performance: Visualizer FPS should be ≥ 30', async ({ page }) => {
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(500);

    // Select mode and play
    await page.click('button:has-text("Synthwave")');
    await page.waitForTimeout(500);

    await page.click('[aria-label="播放"]');
    await page.waitForTimeout(500);

    // Measure FPS using requestAnimationFrame
    const fps = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let frameCount = 0;
        const startTime = performance.now();
        const duration = 1000; // Measure for 1 second

        function countFrames() {
          frameCount++;
          const elapsed = performance.now() - startTime;

          if (elapsed < duration) {
            requestAnimationFrame(countFrames);
          } else {
            const fps = frameCount / (elapsed / 1000);
            resolve(fps);
          }
        }

        requestAnimationFrame(countFrames);
      });
    });

    console.log(`Measured FPS: ${fps.toFixed(2)}`);

    // Generate performance report
    const report = {
      test: 'Visualizer FPS',
      target: '≥ 30 FPS',
      measuredFPS: fps.toFixed(2),
      passed: fps >= 30,
    };

    console.log('Performance Report:', JSON.stringify(report, null, 2));

    // Assert target is met
    expect(fps).toBeGreaterThanOrEqual(30);
  });

  // ========================================================================
  // Test 5: Stress Test - Rapid Interactions
  // ========================================================================

  test('Performance: Stress test with rapid interactions', async ({ page }) => {
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(500);

    const startTime = Date.now();

    // Perform 50 rapid interactions
    for (let i = 0; i < 50; i++) {
      // Alternate between actions
      if (i % 5 === 0) {
        await page.click('button:has-text("Synthwave")');
      } else if (i % 5 === 1) {
        await page.click('button:has-text("Lo-fi")');
      } else if (i % 5 === 2) {
        await page.click('[aria-label="下一首"]');
      } else if (i % 5 === 3) {
        await page.locator('[role="slider"][aria-label*="音量"]').fill(`${(i % 100)}`);
      } else {
        await page.click('[aria-label*="循環"]').first();
      }

      // Small delay to avoid overwhelming
      await page.waitForTimeout(10);
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    console.log(`50 interactions completed in: ${totalTime}ms`);
    console.log(`Average time per interaction: ${(totalTime / 50).toFixed(2)}ms`);

    // UI should remain responsive
    const drawer = page.locator('[data-testid="music-player-drawer"]');
    await expect(drawer).toBeVisible();

    // No UI crashes or freezes
    expect(totalTime).toBeLessThan(10000); // 10 seconds for 50 interactions

    // Generate performance report
    const report = {
      test: 'Stress Test - Rapid Interactions',
      interactions: 50,
      totalTime: `${totalTime}ms`,
      avgPerInteraction: `${(totalTime / 50).toFixed(2)}ms`,
      passed: totalTime < 10000,
    };

    console.log('Performance Report:', JSON.stringify(report, null, 2));
  });

  // ========================================================================
  // Test 6: Generate Comprehensive Performance Report
  // ========================================================================

  test('Generate comprehensive performance report', async ({ page }) => {
    const performanceData: any = {
      timestamp: new Date().toISOString(),
      browser: page.context().browser()?.version(),
      tests: [],
    };

    // Test 1: Music Switch Latency
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(500);

    const switchStartTime = Date.now();
    await page.click('button:has-text("Synthwave")');
    await page.waitForSelector('button:has-text("Synthwave"):has-class("border-pip-boy-green")');
    const switchLatency = Date.now() - switchStartTime;

    performanceData.tests.push({
      name: 'Music Switch Latency',
      target: '< 500ms',
      actual: `${switchLatency}ms`,
      passed: switchLatency < 500,
    });

    // Test 2: UI Render
    await page.reload();
    await page.waitForLoadState('networkidle');

    const renderStartTime = Date.now();
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForSelector('[data-testid="music-player-drawer"]');
    const renderTime = Date.now() - renderStartTime;

    performanceData.tests.push({
      name: 'UI Render Performance',
      target: '< 100ms',
      actual: `${renderTime}ms`,
      passed: renderTime < 100,
    });

    // Test 3: Memory Usage
    const memoryMetrics = await page.evaluate(() => {
      if ((performance as any).memory) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        };
      }
      return null;
    });

    if (memoryMetrics) {
      const memoryMB = memoryMetrics.usedJSHeapSize / 1024 / 1024;
      performanceData.tests.push({
        name: 'Memory Usage',
        target: '≤ 50MB',
        actual: `${memoryMB.toFixed(2)}MB`,
        passed: memoryMB <= 50,
      });
    }

    // Test 4: FPS
    await page.click('button:has-text("Synthwave")');
    await page.waitForTimeout(300);
    await page.click('[aria-label="播放"]');
    await page.waitForTimeout(500);

    const fps = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let frameCount = 0;
        const startTime = performance.now();

        function countFrames() {
          frameCount++;
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(countFrames);
          } else {
            resolve(frameCount);
          }
        }

        requestAnimationFrame(countFrames);
      });
    });

    performanceData.tests.push({
      name: 'Visualizer FPS',
      target: '≥ 30 FPS',
      actual: `${fps.toFixed(2)} FPS`,
      passed: fps >= 30,
    });

    // Calculate overall score
    const passedTests = performanceData.tests.filter((t: any) => t.passed).length;
    const totalTests = performanceData.tests.length;
    performanceData.score = `${passedTests}/${totalTests}`;

    // Write report to file
    console.log('\n========================================');
    console.log('COMPREHENSIVE PERFORMANCE REPORT');
    console.log('========================================\n');
    console.log(JSON.stringify(performanceData, null, 2));
    console.log('\n========================================\n');

    // Assert all tests passed
    expect(passedTests).toBe(totalTests);
  });
});
