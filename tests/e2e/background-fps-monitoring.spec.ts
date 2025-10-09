import { test, expect, type Page } from '@playwright/test';

/**
 * Advanced Performance Monitoring and FPS Measurement Suite
 *
 * Provides detailed performance analysis including frame rate monitoring,
 * JavaScript performance profiling, and real-time performance metrics
 * for the Fallout background effects.
 */

test.describe('Fallout Background Effects - FPS and Performance Monitoring', () => {

  test('should maintain 60 FPS during normal operation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.wasteland-background', { state: 'visible' });

    // Monitor FPS over extended period
    const fpsMonitoring = await page.evaluate(async () => {
      return new Promise<{
        avgFPS: number;
        minFPS: number;
        maxFPS: number;
        frameDrops: number;
        samples: number[];
      }>((resolve) => {
        const frameTimes: number[] = [];
        const fpsSamples: number[] = [];
        let frameCount = 0;
        let lastTime = performance.now();
        let frameDrops = 0;
        const monitorDuration = 5000; // 5 seconds
        const startTime = performance.now();

        function measureFrame(currentTime: number) {
          frameCount++;
          const deltaTime = currentTime - lastTime;

          if (frameCount > 1) { // Skip first frame
            const fps = 1000 / deltaTime;
            fpsSamples.push(fps);

            // Count frame drops (below 55 FPS)
            if (fps < 55) {
              frameDrops++;
            }
          }

          lastTime = currentTime;

          if (currentTime - startTime < monitorDuration) {
            requestAnimationFrame(measureFrame);
          } else {
            const avgFPS = fpsSamples.reduce((sum, fps) => sum + fps, 0) / fpsSamples.length;
            const minFPS = Math.min(...fpsSamples);
            const maxFPS = Math.max(...fpsSamples);

            resolve({
              avgFPS,
              minFPS,
              maxFPS,
              frameDrops,
              samples: fpsSamples,
            });
          }
        }

        requestAnimationFrame(measureFrame);
      });
    });

    // Performance expectations
    expect(fpsMonitoring.avgFPS).toBeGreaterThan(55); // Average should be above 55 FPS
    expect(fpsMonitoring.minFPS).toBeGreaterThan(30); // Never drop below 30 FPS
    expect(fpsMonitoring.frameDrops).toBeLessThan(fpsMonitoring.samples.length * 0.1); // Less than 10% frame drops

    console.log(`FPS Analysis:
      - Average FPS: ${fpsMonitoring.avgFPS.toFixed(2)}
      - Min FPS: ${fpsMonitoring.minFPS.toFixed(2)}
      - Max FPS: ${fpsMonitoring.maxFPS.toFixed(2)}
      - Frame drops: ${fpsMonitoring.frameDrops}/${fpsMonitoring.samples.length}
    `);
  });

  test('should measure JavaScript execution time for animations', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.wasteland-background', { state: 'visible' });

    const jsPerformance = await page.evaluate(async () => {
      const originalRAF = window.requestAnimationFrame;
      const rafTimes: number[] = [];
      let rafCount = 0;

      // Override requestAnimationFrame to measure execution time
      window.requestAnimationFrame = function(callback) {
        return originalRAF.call(window, function(time) {
          const start = performance.now();
          callback(time);
          const end = performance.now();

          rafTimes.push(end - start);
          rafCount++;
        });
      };

      // Let it run for 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Restore original RAF
      window.requestAnimationFrame = originalRAF;

      return {
        totalRAFCalls: rafCount,
        avgExecutionTime: rafTimes.reduce((sum, time) => sum + time, 0) / rafTimes.length,
        maxExecutionTime: Math.max(...rafTimes),
        minExecutionTime: Math.min(...rafTimes),
        executionTimes: rafTimes,
      };
    });

    // JavaScript execution should be minimal per frame
    expect(jsPerformance.avgExecutionTime).toBeLessThan(5); // Less than 5ms average
    expect(jsPerformance.maxExecutionTime).toBeLessThan(16); // Never exceed 16ms (60 FPS budget)

    console.log(`JavaScript Performance:
      - RAF calls: ${jsPerformance.totalRAFCalls}
      - Avg execution: ${jsPerformance.avgExecutionTime.toFixed(2)}ms
      - Max execution: ${jsPerformance.maxExecutionTime.toFixed(2)}ms
    `);
  });

  test('should monitor CPU usage patterns', async ({ page }) => {
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');

    await page.goto('/');
    await page.waitForSelector('.wasteland-background', { state: 'visible' });

    // Collect baseline metrics
    const startMetrics = await client.send('Performance.getMetrics');
    const startTime = Date.now();

    // Let animations run
    await page.waitForTimeout(5000);

    const endMetrics = await client.send('Performance.getMetrics');
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // Convert to seconds

    const getMetricValue = (metrics: any[], name: string) => {
      const metric = metrics.find(m => m.name === name);
      return metric ? metric.value : 0;
    };

    const cpuMetrics = {
      taskDuration: getMetricValue(endMetrics.metrics, 'TaskDuration') -
                   getMetricValue(startMetrics.metrics, 'TaskDuration'),
      scriptDuration: getMetricValue(endMetrics.metrics, 'ScriptDuration') -
                     getMetricValue(startMetrics.metrics, 'ScriptDuration'),
      layoutDuration: getMetricValue(endMetrics.metrics, 'LayoutDuration') -
                     getMetricValue(startMetrics.metrics, 'LayoutDuration'),
      recalcStyleDuration: getMetricValue(endMetrics.metrics, 'RecalcStyleDuration') -
                          getMetricValue(startMetrics.metrics, 'RecalcStyleDuration'),
    };

    // Calculate per-second usage
    const cpuUsagePerSecond = {
      task: cpuMetrics.taskDuration / duration,
      script: cpuMetrics.scriptDuration / duration,
      layout: cpuMetrics.layoutDuration / duration,
      recalcStyle: cpuMetrics.recalcStyleDuration / duration,
    };

    // CPU usage should be reasonable
    expect(cpuUsagePerSecond.task).toBeLessThan(100); // Less than 100ms task time per second
    expect(cpuUsagePerSecond.script).toBeLessThan(50); // Less than 50ms script time per second
    expect(cpuUsagePerSecond.layout).toBeLessThan(10); // Minimal layout thrashing

    console.log(`CPU Usage per second:
      - Task: ${cpuUsagePerSecond.task.toFixed(2)}ms
      - Script: ${cpuUsagePerSecond.script.toFixed(2)}ms
      - Layout: ${cpuUsagePerSecond.layout.toFixed(2)}ms
      - Style Recalc: ${cpuUsagePerSecond.recalcStyle.toFixed(2)}ms
    `);
  });

  test('should analyze memory allocation patterns', async ({ page }) => {
    const client = await page.context().newCDPSession(page);
    await client.send('HeapProfiler.enable');

    await page.goto('/');
    await page.waitForSelector('.wasteland-background', { state: 'visible' });

    // Force garbage collection and get baseline
    await client.send('HeapProfiler.collectGarbage');
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        return {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        };
      }
      return null;
    });

    // Run animations for 10 seconds
    await page.waitForTimeout(10000);

    // Check memory after animation period
    const afterMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        return {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        };
      }
      return null;
    });

    if (initialMemory && afterMemory) {
      const memoryGrowth = afterMemory.used - initialMemory.used;
      const memoryGrowthMB = memoryGrowth / (1024 * 1024);

      // Memory growth should be minimal (less than 10MB over 10 seconds)
      expect(memoryGrowthMB).toBeLessThan(10);

      // Total memory usage should be reasonable (less than 100MB)
      const totalUsageMB = afterMemory.used / (1024 * 1024);
      expect(totalUsageMB).toBeLessThan(100);

      console.log(`Memory Analysis:
        - Initial usage: ${(initialMemory.used / (1024 * 1024)).toFixed(2)}MB
        - After 10s: ${(afterMemory.used / (1024 * 1024)).toFixed(2)}MB
        - Growth: ${memoryGrowthMB.toFixed(2)}MB
      `);
    }
  });

  test('should verify GPU acceleration effectiveness', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.wasteland-background', { state: 'visible' });

    const gpuMetrics = await page.evaluate(() => {
      // Check for composited layers (indicators of GPU acceleration)
      const getComputedTransform = (element: Element) => {
        const style = window.getComputedStyle(element);
        return {
          transform: style.transform,
          willChange: style.willChange,
          backfaceVisibility: style.backfaceVisibility,
          perspective: style.perspective,
        };
      };

      const elements = {
        particles: Array.from(document.querySelectorAll('.particle')).slice(0, 5),
        scanLines: document.querySelector('.scan-lines'),
        interference: document.querySelector('.radiation-interference'),
      };

      const results = {
        particlesUsingTransform: 0,
        scanLinesOptimized: false,
        interferenceOptimized: false,
      };

      // Check particles
      elements.particles.forEach(particle => {
        const styles = getComputedTransform(particle);
        if (styles.transform !== 'none' || styles.willChange === 'transform') {
          results.particlesUsingTransform++;
        }
      });

      // Check scan lines
      if (elements.scanLines) {
        const styles = getComputedTransform(elements.scanLines);
        results.scanLinesOptimized = styles.transform !== 'none' || styles.willChange === 'transform';
      }

      // Check interference
      if (elements.interference) {
        const styles = getComputedTransform(elements.interference);
        results.interferenceOptimized = styles.transform !== 'none' || styles.willChange === 'transform';
      }

      return results;
    });

    // At least some animations should use GPU acceleration
    expect(gpuMetrics.scanLinesOptimized || gpuMetrics.interferenceOptimized).toBe(true);

    console.log(`GPU Acceleration:
      - Particles using transforms: ${gpuMetrics.particlesUsingTransform}/5
      - Scan lines optimized: ${gpuMetrics.scanLinesOptimized}
      - Interference optimized: ${gpuMetrics.interferenceOptimized}
    `);
  });

  test('should measure paint and composite times', async ({ page }) => {
    const client = await page.context().newCDPSession(page);
    await client.send('Runtime.enable');

    await page.goto('/');
    await page.waitForSelector('.wasteland-background', { state: 'visible' });

    // Enable performance timeline
    await page.evaluate(() => {
      // Mark start of measurement
      performance.mark('animation-start');
    });

    // Let animations run
    await page.waitForTimeout(3000);

    const paintMetrics = await page.evaluate(() => {
      performance.mark('animation-end');
      performance.measure('animation-duration', 'animation-start', 'animation-end');

      // Get paint entries
      const paintEntries = performance.getEntriesByType('paint');
      const measureEntries = performance.getEntriesByType('measure');

      return {
        firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
        animationDuration: measureEntries.find(entry => entry.name === 'animation-duration')?.duration || 0,
        totalPaintEntries: paintEntries.length,
      };
    });

    // Paint performance should be good
    expect(paintMetrics.firstPaint).toBeLessThan(1000); // First paint under 1s
    expect(paintMetrics.firstContentfulPaint).toBeLessThan(1500); // FCP under 1.5s

    console.log(`Paint Metrics:
      - First Paint: ${paintMetrics.firstPaint.toFixed(2)}ms
      - First Contentful Paint: ${paintMetrics.firstContentfulPaint.toFixed(2)}ms
      - Animation Duration: ${paintMetrics.animationDuration.toFixed(2)}ms
    `);
  });

  test('should analyze animation smoothness with different intensities', async ({ page }) => {
    const intensities = ['low', 'medium', 'high'];
    const smoothnessResults: any = {};

    for (const intensity of intensities) {
      await page.goto('/');

      // Set animation intensity
      await page.evaluate((intensity) => {
        const background = document.querySelector('.wasteland-background');
        if (background) {
          background.className = background.className.replace(/animation-(low|medium|high)/, `animation-${intensity}`);
        }
      }, intensity);

      await page.waitForSelector('.wasteland-background', { state: 'visible' });

      // Measure smoothness
      const smoothness = await page.evaluate(async () => {
        const frameTimes: number[] = [];
        let lastTime = performance.now();
        const duration = 3000;
        const startTime = performance.now();

        return new Promise<{
          avgFrameTime: number;
          frameTimeVariance: number;
          smoothnessScore: number;
        }>((resolve) => {
          function measureFrame(currentTime: number) {
            const frameTime = currentTime - lastTime;
            if (frameTime > 0) {
              frameTimes.push(frameTime);
            }
            lastTime = currentTime;

            if (currentTime - startTime < duration) {
              requestAnimationFrame(measureFrame);
            } else {
              const avgFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;

              // Calculate variance (smoothness indicator)
              const variance = frameTimes.reduce((sum, time) => {
                return sum + Math.pow(time - avgFrameTime, 2);
              }, 0) / frameTimes.length;

              // Smoothness score (lower variance = smoother)
              const smoothnessScore = 1 / (1 + variance);

              resolve({
                avgFrameTime,
                frameTimeVariance: variance,
                smoothnessScore,
              });
            }
          }

          requestAnimationFrame(measureFrame);
        });
      });

      smoothnessResults[intensity] = smoothness;

      // Each intensity should maintain reasonable smoothness
      expect(smoothness.avgFrameTime).toBeLessThan(20); // Under 20ms average frame time
      expect(smoothness.smoothnessScore).toBeGreaterThan(0.1); // Reasonable smoothness
    }

    // Low intensity should be smoother than high intensity
    expect(smoothnessResults.low.smoothnessScore).toBeGreaterThanOrEqual(smoothnessResults.high.smoothnessScore);

    console.log('Animation Smoothness by Intensity:');
    Object.entries(smoothnessResults).forEach(([intensity, metrics]: [string, any]) => {
      console.log(`  ${intensity}: Avg frame time ${metrics.avgFrameTime.toFixed(2)}ms, Smoothness ${metrics.smoothnessScore.toFixed(3)}`);
    });
  });

  test('should monitor long-term performance stability', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.wasteland-background', { state: 'visible' });

    // Monitor performance over extended period (30 seconds)
    const stabilityTest = await page.evaluate(async () => {
      const measurements: Array<{
        time: number;
        fps: number;
        memoryUsed: number;
      }> = [];

      const measureInterval = 1000; // Measure every second
      const totalDuration = 15000; // 15 seconds (reduced for test speed)
      let lastTime = performance.now();
      let frameCount = 0;

      return new Promise<{
        measurements: typeof measurements;
        avgFPS: number;
        fpsStability: number;
        memoryGrowth: number;
      }>((resolve) => {
        function countFrames() {
          frameCount++;
          requestAnimationFrame(countFrames);
        }

        requestAnimationFrame(countFrames);

        const measurementTimer = setInterval(() => {
          const currentTime = performance.now();
          const elapsed = currentTime - lastTime;
          const fps = (frameCount * 1000) / elapsed;

          const memoryUsed = 'memory' in performance ?
            (performance as any).memory.usedJSHeapSize / (1024 * 1024) : 0;

          measurements.push({
            time: currentTime,
            fps,
            memoryUsed,
          });

          frameCount = 0;
          lastTime = currentTime;

          if (measurements.length * measureInterval >= totalDuration) {
            clearInterval(measurementTimer);

            const fpsSamples = measurements.map(m => m.fps);
            const avgFPS = fpsSamples.reduce((sum, fps) => sum + fps, 0) / fpsSamples.length;

            // Calculate FPS stability (lower variance = more stable)
            const fpsVariance = fpsSamples.reduce((sum, fps) => {
              return sum + Math.pow(fps - avgFPS, 2);
            }, 0) / fpsSamples.length;
            const fpsStability = 1 / (1 + Math.sqrt(fpsVariance));

            const memoryGrowth = measurements.length > 1 ?
              measurements[measurements.length - 1].memoryUsed - measurements[0].memoryUsed : 0;

            resolve({
              measurements,
              avgFPS,
              fpsStability,
              memoryGrowth,
            });
          }
        }, measureInterval);
      });
    });

    // Performance should remain stable over time
    expect(stabilityTest.avgFPS).toBeGreaterThan(50);
    expect(stabilityTest.fpsStability).toBeGreaterThan(0.5);
    expect(stabilityTest.memoryGrowth).toBeLessThan(5); // Less than 5MB growth

    console.log(`Long-term Performance:
      - Average FPS: ${stabilityTest.avgFPS.toFixed(2)}
      - FPS Stability: ${stabilityTest.fpsStability.toFixed(3)}
      - Memory Growth: ${stabilityTest.memoryGrowth.toFixed(2)}MB
      - Measurements: ${stabilityTest.measurements.length}
    `);
  });
});