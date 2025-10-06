import { test, expect, type Page } from '@playwright/test';

/**
 * Performance Testing Suite for Fallout Background Effects
 *
 * Measures performance impact of background animations, memory usage,
 * and rendering performance across different device profiles.
 */

test.describe('Fallout Background Effects - Performance Testing', () => {

  test('should measure page load time impact with background effects', async ({ page }) => {
    // Test with performance metrics enabled
    await page.goto('/', { waitUntil: 'networkidle' });

    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        pageLoad: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0,
      };
    });

    // Background effects should not significantly impact load times
    // DOMContentLoaded should be under 500ms for good UX
    expect(performanceMetrics.domContentLoaded).toBeLessThan(500);

    // First Contentful Paint should be under 1.5s
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1500);

    console.log('Performance Metrics:', performanceMetrics);
  });

  test('should measure CPU usage during background animations', async ({ page }) => {
    // Enable performance monitoring
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');

    await page.goto('/');
    await page.waitForSelector('.wasteland-background', { state: 'visible' });

    // Start performance measurement
    await client.send('Performance.enable');
    const startMetrics = await client.send('Performance.getMetrics');

    // Let animations run for 5 seconds
    await page.waitForTimeout(5000);

    const endMetrics = await client.send('Performance.getMetrics');

    // Calculate CPU usage difference
    const startCPU = startMetrics.metrics.find(m => m.name === 'TaskDuration')?.value || 0;
    const endCPU = endMetrics.metrics.find(m => m.name === 'TaskDuration')?.value || 0;
    const cpuUsage = (endCPU - startCPU) / 5; // Per second

    // CPU usage should be reasonable (under 50ms per second)
    expect(cpuUsage).toBeLessThan(50);

    console.log(`CPU Usage: ${cpuUsage}ms per second`);
  });

  test('should verify memory usage with different animation intensities', async ({ page }) => {
    const client = await page.context().newCDPSession(page);

    for (const intensity of ['low', 'medium', 'high']) {
      await page.goto('/');

      // Change animation intensity via JavaScript
      await page.evaluate((intensity) => {
        const background = document.querySelector('.wasteland-background');
        if (background) {
          background.className = background.className.replace(/animation-(low|medium|high)/, `animation-${intensity}`);
        }
      }, intensity);

      // Force garbage collection and measure memory
      await client.send('HeapProfiler.enable');
      await client.send('HeapProfiler.collectGarbage');

      const memoryUsage = await page.evaluate(() => {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          return {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
          };
        }
        return null;
      });

      if (memoryUsage) {
        // Memory usage should not grow excessively with higher intensity
        const usageMB = memoryUsage.usedJSHeapSize / (1024 * 1024);
        expect(usageMB).toBeLessThan(100); // Under 100MB

        console.log(`${intensity} intensity memory usage: ${usageMB.toFixed(2)}MB`);
      }
    }
  });

  test('should measure FPS during particle animations', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.radiation-particles', { state: 'visible' });

    // Measure FPS using requestAnimationFrame
    const fpsData = await page.evaluate(async () => {
      return new Promise<{ fps: number; frames: number }>((resolve) => {
        let frames = 0;
        let lastTime = performance.now();
        const duration = 3000; // Measure for 3 seconds

        function countFrames(currentTime: number) {
          frames++;

          if (currentTime - lastTime >= duration) {
            const fps = (frames * 1000) / (currentTime - lastTime);
            resolve({ fps, frames });
            return;
          }

          requestAnimationFrame(countFrames);
        }

        requestAnimationFrame(countFrames);
      });
    });

    // Should maintain at least 30 FPS for smooth animations
    expect(fpsData.fps).toBeGreaterThan(30);

    // Ideally should be close to 60 FPS
    expect(fpsData.fps).toBeGreaterThan(50);

    console.log(`Animation FPS: ${fpsData.fps.toFixed(2)}`);
  });

  test('should verify render performance with large particle counts', async ({ page }) => {
    await page.goto('/');

    // Test high animation intensity (80 particles)
    await page.evaluate(() => {
      const background = document.querySelector('.wasteland-background');
      if (background) {
        background.className = background.className.replace('animation-medium', 'animation-high');
      }
    });

    // Measure rendering time
    const renderTime = await page.evaluate(async () => {
      const startTime = performance.now();

      // Force a reflow/repaint
      document.body.offsetHeight;

      return new Promise<number>((resolve) => {
        requestAnimationFrame(() => {
          const endTime = performance.now();
          resolve(endTime - startTime);
        });
      });
    });

    // Render time should be under 16ms (60fps)
    expect(renderTime).toBeLessThan(16);

    console.log(`Render time with 80 particles: ${renderTime.toFixed(2)}ms`);
  });

  test('should test performance on mobile device profile', async ({ page }) => {
    // Simulate mobile device
    await page.setViewportSize({ width: 375, height: 667 });

    // Throttle CPU (simulate lower-end mobile device)
    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    await page.goto('/');
    await page.waitForSelector('.wasteland-background', { state: 'visible' });

    // Check that particles are reduced for mobile
    const particleCount = await page.locator('.particle').count();

    // Mobile should have reduced particles due to responsive CSS
    // Animation duration should be longer (performance optimization)
    const animationDuration = await page.evaluate(() => {
      const particle = document.querySelector('.particle');
      if (particle) {
        return window.getComputedStyle(particle).animationDuration;
      }
      return null;
    });

    if (animationDuration) {
      const duration = parseFloat(animationDuration);
      // Mobile should have longer animation duration (1.5x)
      expect(duration).toBeGreaterThan(4); // Original is ~4s, mobile should be ~6s
    }

    // Measure performance on throttled CPU
    const mobilePerformance = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
    });

    // Even on throttled CPU, should load within reasonable time
    expect(mobilePerformance).toBeLessThan(1000);

    console.log(`Mobile performance (throttled): ${mobilePerformance}ms`);
  });

  test('should verify GPU acceleration is properly utilized', async ({ page }) => {
    await page.goto('/');

    // Check if animations are using transform properties (GPU accelerated)
    const gpuAcceleration = await page.evaluate(() => {
      const particle = document.querySelector('.particle');
      const scanLines = document.querySelector('.scan-lines');
      const interference = document.querySelector('.radiation-interference');

      const results = {
        particleTransform: false,
        scanLinesTransform: false,
        interferenceTransform: false,
      };

      if (particle) {
        const styles = window.getComputedStyle(particle);
        results.particleTransform = styles.transform !== 'none';
      }

      if (scanLines) {
        const styles = window.getComputedStyle(scanLines);
        results.scanLinesTransform = styles.transform !== 'none';
      }

      if (interference) {
        const styles = window.getComputedStyle(interference);
        results.interferenceTransform = styles.transform !== 'none';
      }

      return results;
    });

    // At least scan lines and interference should use transforms
    expect(gpuAcceleration.scanLinesTransform || gpuAcceleration.interferenceTransform).toBe(true);
  });

  test('should measure network impact of background resources', async ({ page }) => {
    // Clear cache to measure fresh load
    await page.context().clearCookies();

    const requests: any[] = [];
    page.on('request', request => {
      requests.push({
        url: request.url(),
        resourceType: request.resourceType(),
        size: 0,
      });
    });

    page.on('response', response => {
      const request = requests.find(r => r.url === response.url());
      if (request) {
        request.size = response.headers()['content-length'] || 0;
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // Check CSS resources
    const cssRequests = requests.filter(r =>
      r.resourceType === 'stylesheet' || r.url.includes('.css')
    );

    const totalCSSSize = cssRequests.reduce((sum, req) => sum + parseInt(req.size || 0), 0);

    // CSS bundle size should be reasonable (under 500KB for background styles)
    expect(totalCSSSize).toBeLessThan(500 * 1024);

    console.log(`Total CSS size: ${(totalCSSSize / 1024).toFixed(2)}KB`);
  });

  test('should verify performance with multiple background instances', async ({ page }) => {
    // Create a test page with multiple background instances
    await page.goto('/');

    // Add additional background instances for stress testing
    await page.evaluate(() => {
      for (let i = 0; i < 3; i++) {
        const div = document.createElement('div');
        div.className = 'wasteland-background';
        div.innerHTML = `
          <div class="radiation-particles">
            ${Array.from({ length: 20 }, (_, j) =>
              `<div class="particle" style="--delay: ${j * 0.1}s; --duration: ${3 + j * 0.1}s; --x-start: ${j * 5}%; --y-start: ${j * 5}%;"></div>`
            ).join('')}
          </div>
          <div class="wasteland-grid"></div>
          <div class="scan-lines"></div>
        `;
        document.body.appendChild(div);
      }
    });

    // Measure performance with multiple instances
    const multiInstanceFPS = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        let frames = 0;
        const startTime = performance.now();

        function countFrames(currentTime: number) {
          frames++;
          if (currentTime - startTime >= 2000) {
            const fps = (frames * 1000) / (currentTime - startTime);
            resolve(fps);
            return;
          }
          requestAnimationFrame(countFrames);
        }

        requestAnimationFrame(countFrames);
      });
    });

    // Even with multiple instances, should maintain reasonable FPS
    expect(multiInstanceFPS).toBeGreaterThan(25);

    console.log(`FPS with multiple background instances: ${multiInstanceFPS.toFixed(2)}`);
  });
});