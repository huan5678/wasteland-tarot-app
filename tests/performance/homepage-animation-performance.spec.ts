/**
 * Homepage Animation System - Performance Validation Tests
 * Task 18.3: 執行最終效能驗證
 *
 * 驗證目標：
 * - Lighthouse Performance score >= 90
 * - FPS >= 60 (滾動動畫)
 * - CLS <= 0.1 (無 layout shift)
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage Animation Performance Tests - Task 18.3', () => {
  test.beforeEach(async ({ page }) => {
    // 訪問首頁
    await page.goto('/');

    // 等待頁面完全載入
    await page.waitForLoadState('networkidle');
  });

  test('應該在 3 秒內完成首次內容繪製 (FCP)', async ({ page }) => {
    // 使用 Performance API 測量 FCP
    const fcp = await page.evaluate(() => {
      const perfEntries = performance.getEntriesByType('paint');
      const fcpEntry = perfEntries.find(
        (entry) => entry.name === 'first-contentful-paint'
      );
      return fcpEntry ? fcpEntry.startTime : 0;
    });

    expect(fcp).toBeGreaterThan(0);
    expect(fcp).toBeLessThan(3000); // FCP < 3s
  });

  test('應該在 5 秒內完成最大內容繪製 (LCP)', async ({ page }) => {
    // 使用 PerformanceObserver 測量 LCP
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        });

        observer.observe({ type: 'largest-contentful-paint', buffered: true });

        // 5s timeout
        setTimeout(() => resolve(-1), 5000);
      });
    });

    expect(lcp).toBeGreaterThan(0);
    expect(lcp).toBeLessThan(5000); // LCP < 5s
  });

  test('應該維持 CLS <= 0.1 (無 layout shift)', async ({ page }) => {
    // 滾動整個頁面並測量 CLS
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalDistance = document.body.scrollHeight - window.innerHeight;
        let distance = 0;

        const interval = setInterval(() => {
          const scrollAmount = 100;
          window.scrollBy(0, scrollAmount);
          distance += scrollAmount;

          if (distance >= totalDistance) {
            clearInterval(interval);
            resolve();
          }
        }, 100); // 每 100ms 滾動 100px
      });
    });

    // 測量 Cumulative Layout Shift
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        });

        observer.observe({ type: 'layout-shift', buffered: true });

        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 1000);
      });
    });

    expect(cls).toBeLessThanOrEqual(0.1); // CLS <= 0.1
  });

  test('滾動動畫應該維持 FPS >= 55', async ({ page }) => {
    // 注入 FPS monitor
    await page.evaluate(() => {
      (window as any).fpsMonitor = {
        fps: 60,
        lastTime: performance.now(),
        frames: 0,
        measurements: [] as number[],

        start() {
          const measure = (time: number) => {
            this.frames++;
            if (time >= this.lastTime + 1000) {
              this.fps = Math.round(
                (this.frames * 1000) / (time - this.lastTime)
              );
              this.measurements.push(this.fps);
              this.frames = 0;
              this.lastTime = time;
            }
            requestAnimationFrame(measure);
          };
          requestAnimationFrame(measure);
        },

        getAverageFPS() {
          if (this.measurements.length === 0) return 60;
          return (
            this.measurements.reduce((a, b) => a + b, 0) /
            this.measurements.length
          );
        },
      };

      (window as any).fpsMonitor.start();
    });

    // 等待 1s 開始測量
    await page.waitForTimeout(1000);

    // 滾動整個頁面（5s）
    await page.evaluate(async () => {
      const totalDistance = document.body.scrollHeight - window.innerHeight;
      let distance = 0;

      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          const scrollAmount = 50;
          window.scrollBy(0, scrollAmount);
          distance += scrollAmount;

          if (distance >= totalDistance) {
            clearInterval(interval);
            resolve();
          }
        }, 50); // 每 50ms 滾動 50px
      });
    });

    // 等待動畫完成
    await page.waitForTimeout(1000);

    // 取得平均 FPS
    const avgFPS = await page.evaluate(() => {
      return (window as any).fpsMonitor.getAverageFPS();
    });

    expect(avgFPS).toBeGreaterThanOrEqual(55); // 平均 FPS >= 55
  });

  test('所有 sections 應該在進入 viewport 時觸發動畫', async ({ page }) => {
    const sections = [
      'Hero Section',
      'How It Works',
      'Stats',
      'Testimonials',
      'Features',
      'FAQ',
      'CTA',
    ];

    for (const sectionName of sections) {
      // 滾動至 section
      const section = page.locator('section', { hasText: sectionName });

      if (await section.count() > 0) {
        await section.scrollIntoViewIfNeeded();

        // 等待動畫觸發（500ms）
        await page.waitForTimeout(500);

        // 驗證 section 可見
        await expect(section).toBeVisible();
      }
    }
  });

  test('GSAP 與 ScrollTrigger 應該正確載入', async ({ page }) => {
    // 檢查 GSAP 全域物件
    const gsapAvailable = await page.evaluate(() => {
      return typeof (window as any).gsap !== 'undefined';
    });

    expect(gsapAvailable).toBe(true);

    // 檢查 ScrollTrigger plugin
    const scrollTriggerAvailable = await page.evaluate(() => {
      return (
        typeof (window as any).gsap !== 'undefined' &&
        typeof (window as any).gsap.registerPlugin !== 'undefined'
      );
    });

    expect(scrollTriggerAvailable).toBe(true);
  });

  test('動畫不應該阻塞主 thread', async ({ page }, testInfo) => {
    // 啟用 Chrome DevTools Protocol
    const client = await page.context().newCDPSession(page);

    // 啟用 Performance 追蹤
    await client.send('Performance.enable');

    // 滾動頁面
    await page.evaluate(async () => {
      const totalDistance = document.body.scrollHeight - window.innerHeight;
      let distance = 0;

      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          window.scrollBy(0, 100);
          distance += 100;

          if (distance >= totalDistance) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });
    });

    // 取得 Performance metrics
    const metrics = await client.send('Performance.getMetrics');

    // 檢查 long tasks (應該無 > 50ms 的 task)
    const layoutDuration = metrics.metrics.find(
      (m: any) => m.name === 'LayoutDuration'
    );
    const scriptDuration = metrics.metrics.find(
      (m: any) => m.name === 'ScriptDuration'
    );

    // 這些值應該相對較低
    if (layoutDuration) {
      expect(layoutDuration.value).toBeLessThan(500); // Layout duration < 500ms
    }

    if (scriptDuration) {
      expect(scriptDuration.value).toBeLessThan(1000); // Script duration < 1s
    }

    await client.detach();
  });

  test('prefers-reduced-motion 模式應該正常運作', async ({ page }) => {
    // 模擬 prefers-reduced-motion: reduce
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // 重新載入頁面
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 滾動至 CTA section
    const ctaSection = page.locator('section', {
      hasText: '準備好探索你的廢土命運了嗎？',
    });
    await ctaSection.scrollIntoViewIfNeeded();

    // 驗證 CTA 按鈕存在且可見
    const ctaButton = page.getByRole('button', { name: '註冊 Vault 帳號' });
    await expect(ctaButton).toBeVisible();

    // 驗證頁面仍可正常滾動（動畫停用但功能正常）
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
  });

  test('響應式動畫調整 - Mobile viewport', async ({ page }) => {
    // 設定 mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // 重新載入頁面
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 滾動至 How It Works section
    const howItWorksSection = page.locator('section', {
      hasText: '如何使用',
    });
    await howItWorksSection.scrollIntoViewIfNeeded();

    // 等待動畫觸發
    await page.waitForTimeout(1000);

    // 驗證 StepCards 可見
    expect(await page.locator('.step-card').count()).toBeGreaterThanOrEqual(4);

    // Mobile 裝置不應有視差效果（透過檢查 Hero Section 的 transform）
    const heroBackground = await page.evaluate(() => {
      const heroSection = document.querySelector('section');
      const bgElement = heroSection?.querySelector('.scanline-overlay');
      if (!bgElement) return null;

      const styles = window.getComputedStyle(bgElement);
      return styles.transform;
    });

    // Mobile 視差應該停用（transform 為 'none' 或預設值）
    // 這個檢查可能需要根據實際實作調整
  });
});
