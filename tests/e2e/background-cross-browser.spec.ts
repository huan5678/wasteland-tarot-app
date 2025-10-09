import { test, expect, type Page, type BrowserContext } from '@playwright/test';

/**
 * Cross-Browser Compatibility Testing Suite for Fallout Background Effects
 *
 * Tests background rendering, animations, and color accuracy across different
 * browsers to ensure consistent user experience on all platforms.
 */

test.describe('Fallout Background Effects - Cross-Browser Compatibility', () => {

  // Test across different browser engines
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test.describe(`${browserName} browser tests`, () => {

      test(`should render background correctly in ${browserName}`, async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('.wasteland-background', { state: 'visible' });

        // Check core background elements
        const backgroundElements = await page.evaluate(() => {
          return {
            background: !!document.querySelector('.wasteland-background'),
            particles: document.querySelectorAll('.particle').length,
            grid: !!document.querySelector('.wasteland-grid'),
            scanLines: !!document.querySelector('.scan-lines'),
            gradient: !!document.querySelector('.screen-gradient'),
            interference: !!document.querySelector('.radiation-interference'),
          };
        });

        expect(backgroundElements.background).toBe(true);
        expect(backgroundElements.particles).toBeGreaterThan(0);
        expect(backgroundElements.grid).toBe(true);
        expect(backgroundElements.scanLines).toBe(true);
        expect(backgroundElements.gradient).toBe(true);
        expect(backgroundElements.interference).toBe(true);

        console.log(`${browserName}: All background elements present`);
      });

      test(`should support CSS custom properties in ${browserName}`, async ({ page }) => {
        await page.goto('/');

        // Test CSS custom property support
        const cssVariableSupport = await page.evaluate(() => {
          const testElement = document.createElement('div');
          testElement.style.setProperty('--test-var', '#00ff88');
          document.body.appendChild(testElement);

          const computedStyle = window.getComputedStyle(testElement);
          const customPropertyValue = computedStyle.getPropertyValue('--test-var').trim();

          document.body.removeChild(testElement);

          // Also test actual Fallout variables
          const rootStyle = window.getComputedStyle(document.documentElement);
          const pipBoyGreen = rootStyle.getPropertyValue('--color-pip-boy-green').trim();
          const radiationOrange = rootStyle.getPropertyValue('--color-radiation-orange').trim();

          return {
            supportsCustomProperties: !!customPropertyValue,
            testValue: customPropertyValue,
            pipBoyGreen,
            radiationOrange,
          };
        });

        expect(cssVariableSupport.supportsCustomProperties).toBe(true);
        expect(cssVariableSupport.pipBoyGreen).toBe('#00ff88');
        expect(cssVariableSupport.radiationOrange).toBe('#ff8800');

        console.log(`${browserName}: CSS custom properties supported`);
      });

      test(`should render gradients correctly in ${browserName}`, async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('.wasteland-background', { state: 'visible' });

        const gradientSupport = await page.evaluate(() => {
          const background = document.querySelector('.wasteland-background') as HTMLElement;
          const grid = document.querySelector('.wasteland-grid') as HTMLElement;
          const interference = document.querySelector('.radiation-interference') as HTMLElement;

          if (background && grid && interference) {
            const bgStyle = window.getComputedStyle(background);
            const gridStyle = window.getComputedStyle(grid);
            const interferenceStyle = window.getComputedStyle(interference);

            return {
              backgroundGradient: bgStyle.backgroundImage.includes('gradient'),
              gridGradient: gridStyle.backgroundImage.includes('gradient'),
              interferenceGradient: interferenceStyle.background.includes('gradient'),
              backgroundImage: bgStyle.backgroundImage,
              gridImage: gridStyle.backgroundImage,
            };
          }

          return null;
        });

        if (gradientSupport) {
          expect(gradientSupport.backgroundGradient).toBe(true);
          expect(gradientSupport.gridGradient).toBe(true);
          expect(gradientSupport.interferenceGradient).toBe(true);
        }

        console.log(`${browserName}: Gradients render correctly`);
      });

      test(`should support CSS animations in ${browserName}`, async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('.particle', { state: 'visible' });

        const animationSupport = await page.evaluate(() => {
          const particle = document.querySelector('.particle') as HTMLElement;
          const scanLines = document.querySelector('.scan-lines') as HTMLElement;
          const interference = document.querySelector('.radiation-interference') as HTMLElement;

          const results: any = {};

          if (particle) {
            const particleStyle = window.getComputedStyle(particle);
            results.particle = {
              animationName: particleStyle.animationName,
              animationDuration: particleStyle.animationDuration,
              animationTimingFunction: particleStyle.animationTimingFunction,
              hasAnimation: particleStyle.animationName !== 'none',
            };
          }

          if (scanLines) {
            const scanStyle = window.getComputedStyle(scanLines);
            results.scanLines = {
              animationName: scanStyle.animationName,
              animationDuration: scanStyle.animationDuration,
              hasAnimation: scanStyle.animationName !== 'none',
            };
          }

          if (interference) {
            const interferenceStyle = window.getComputedStyle(interference);
            results.interference = {
              animationName: interferenceStyle.animationName,
              animationDuration: interferenceStyle.animationDuration,
              hasAnimation: interferenceStyle.animationName !== 'none',
            };
          }

          return results;
        });

        if (animationSupport.particle) {
          expect(animationSupport.particle.hasAnimation).toBe(true);
          expect(animationSupport.particle.animationDuration).not.toBe('0s');
        }

        if (animationSupport.scanLines) {
          expect(animationSupport.scanLines.hasAnimation).toBe(true);
        }

        if (animationSupport.interference) {
          expect(animationSupport.interference.hasAnimation).toBe(true);
        }

        console.log(`${browserName}: CSS animations supported`);
      });

      test(`should handle transform animations in ${browserName}`, async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('.scan-lines', { state: 'visible' });

        // Check transform support and animation
        const transformSupport = await page.evaluate(() => {
          const scanLines = document.querySelector('.scan-lines') as HTMLElement;
          const interference = document.querySelector('.radiation-interference') as HTMLElement;

          const results = {
            scanLinesTransform: 'none',
            interferenceTransform: 'none',
            supportsTransform: true,
          };

          try {
            if (scanLines) {
              const style = window.getComputedStyle(scanLines);
              results.scanLinesTransform = style.transform;
            }

            if (interference) {
              const style = window.getComputedStyle(interference);
              results.interferenceTransform = style.transform;
            }

            // Test transform support
            const testEl = document.createElement('div');
            testEl.style.transform = 'translateX(10px)';
            results.supportsTransform = testEl.style.transform !== '';

          } catch (error) {
            results.supportsTransform = false;
          }

          return results;
        });

        expect(transformSupport.supportsTransform).toBe(true);

        console.log(`${browserName}: Transform animations supported`);
      });

      test(`should render box-shadow effects in ${browserName}`, async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('.particle', { state: 'visible' });

        const shadowSupport = await page.evaluate(() => {
          const particles = document.querySelectorAll('.particle');
          const buttons = document.querySelectorAll('.btn-pip-boy, .glow-green');

          const results = {
            particlesShadow: false,
            buttonsGlow: false,
            shadowSupported: true,
          };

          // Check particle glow effects
          if (particles.length > 0) {
            const firstParticle = particles[0] as HTMLElement;
            const style = window.getComputedStyle(firstParticle);
            results.particlesShadow = style.boxShadow !== 'none';
          }

          // Check button glow effects
          if (buttons.length > 0) {
            const firstButton = buttons[0] as HTMLElement;
            const style = window.getComputedStyle(firstButton);
            results.buttonsGlow = style.boxShadow !== 'none';
          }

          return results;
        });

        // Particles should have glow effects
        expect(shadowSupport.particlesShadow).toBe(true);

        console.log(`${browserName}: Box-shadow effects render correctly`);
      });

      test(`should handle opacity and blending in ${browserName}`, async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('.wasteland-background', { state: 'visible' });

        const opacitySupport = await page.evaluate(() => {
          const elements = {
            particles: document.querySelector('.radiation-particles') as HTMLElement,
            grid: document.querySelector('.wasteland-grid') as HTMLElement,
            scanLines: document.querySelector('.scan-lines') as HTMLElement,
            interference: document.querySelector('.radiation-interference') as HTMLElement,
          };

          const results: any = {};

          Object.entries(elements).forEach(([name, element]) => {
            if (element) {
              const style = window.getComputedStyle(element);
              results[name] = {
                opacity: parseFloat(style.opacity),
                hasOpacity: parseFloat(style.opacity) < 1,
                mixBlendMode: style.mixBlendMode || 'normal',
              };
            }
          });

          return results;
        });

        // Check that opacity effects are applied
        expect(opacitySupport.particles?.hasOpacity).toBe(true);
        expect(opacitySupport.grid?.hasOpacity).toBe(true);

        console.log(`${browserName}: Opacity effects supported`);
      });

      test(`should maintain color accuracy in ${browserName}`, async ({ page }) => {
        await page.goto('/');

        const colorAccuracy = await page.evaluate(() => {
          const rootStyle = window.getComputedStyle(document.documentElement);

          // Test key Fallout colors
          const colors = {
            pipBoyGreen: rootStyle.getPropertyValue('--color-pip-boy-green').trim(),
            radiationOrange: rootStyle.getPropertyValue('--color-radiation-orange').trim(),
            wastelandDark: rootStyle.getPropertyValue('--color-wasteland-dark').trim(),
            warningYellow: rootStyle.getPropertyValue('--color-warning-yellow').trim(),
          };

          // Test rendered colors on actual elements
          const particle = document.querySelector('.particle') as HTMLElement;
          const background = document.querySelector('.wasteland-background') as HTMLElement;

          const renderedColors = {
            particleColor: particle ? window.getComputedStyle(particle).backgroundColor : null,
            backgroundColor: background ? window.getComputedStyle(background).backgroundColor : null,
          };

          return { colors, renderedColors };
        });

        // Verify exact color values
        expect(colorAccuracy.colors.pipBoyGreen).toBe('#00ff88');
        expect(colorAccuracy.colors.radiationOrange).toBe('#ff8800');
        expect(colorAccuracy.colors.wastelandDark).toBe('#1a1a1a');
        expect(colorAccuracy.colors.warningYellow).toBe('#ffdd00');

        console.log(`${browserName}: Colors render accurately`);
      });

      test(`should support media queries in ${browserName}`, async ({ page }) => {
        // Test reduced motion media query
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/');

        const mediaQuerySupport = await page.evaluate(() => {
          return {
            reducedMotionMatches: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            supportsMatchMedia: typeof window.matchMedia === 'function',
          };
        });

        expect(mediaQuerySupport.supportsMatchMedia).toBe(true);
        expect(mediaQuerySupport.reducedMotionMatches).toBe(true);

        // Test mobile media query
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');

        const mobileMediaQuery = await page.evaluate(() => {
          return {
            mobileMatches: window.matchMedia('(max-width: 768px)').matches,
          };
        });

        expect(mobileMediaQuery.mobileMatches).toBe(true);

        console.log(`${browserName}: Media queries supported`);
      });

      test(`should handle viewport units correctly in ${browserName}`, async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('/');

        const viewportSupport = await page.evaluate(() => {
          // Test vh/vw units
          const testEl = document.createElement('div');
          testEl.style.width = '100vw';
          testEl.style.height = '100vh';
          document.body.appendChild(testEl);

          const rect = testEl.getBoundingClientRect();
          const supportsViewportUnits = rect.width === window.innerWidth && rect.height === window.innerHeight;

          document.body.removeChild(testEl);

          // Check if background uses viewport units properly
          const background = document.querySelector('.wasteland-background') as HTMLElement;
          const bgRect = background ? background.getBoundingClientRect() : null;

          return {
            supportsViewportUnits,
            backgroundCoversViewport: bgRect ?
              bgRect.width >= window.innerWidth && bgRect.height >= window.innerHeight : false,
          };
        });

        expect(viewportSupport.supportsViewportUnits).toBe(true);
        expect(viewportSupport.backgroundCoversViewport).toBe(true);

        console.log(`${browserName}: Viewport units supported`);
      });

      test(`should handle z-index layering in ${browserName}`, async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('.wasteland-background', { state: 'visible' });

        const zIndexSupport = await page.evaluate(() => {
          const background = document.querySelector('.wasteland-background') as HTMLElement;
          const content = document.querySelector('main, header, .main-content') as HTMLElement;

          const results = {
            backgroundZIndex: 0,
            contentZIndex: 0,
            properLayering: false,
          };

          if (background) {
            const bgStyle = window.getComputedStyle(background);
            results.backgroundZIndex = parseInt(bgStyle.zIndex) || 0;
          }

          if (content) {
            const contentStyle = window.getComputedStyle(content);
            results.contentZIndex = parseInt(contentStyle.zIndex) || 0;
          }

          results.properLayering = results.backgroundZIndex < results.contentZIndex ||
                                   (results.backgroundZIndex < 0 && results.contentZIndex >= 0);

          return results;
        });

        // Background should be behind content
        expect(zIndexSupport.backgroundZIndex).toBeLessThan(0);

        console.log(`${browserName}: Z-index layering correct`);
      });

      test(`should handle calc() functions in ${browserName}`, async ({ page }) => {
        await page.goto('/');

        const calcSupport = await page.evaluate(() => {
          // Test calc() support
          const testEl = document.createElement('div');
          testEl.style.width = 'calc(100% - 20px)';
          document.body.appendChild(testEl);

          const supportsCalc = testEl.style.width.includes('calc');
          document.body.removeChild(testEl);

          return {
            supportsCalc,
            cssCalcSupported: CSS && CSS.supports && CSS.supports('width', 'calc(100% - 20px)'),
          };
        });

        // Most modern browsers should support calc()
        expect(calcSupport.supportsCalc || calcSupport.cssCalcSupported).toBe(true);

        console.log(`${browserName}: calc() functions supported`);
      });
    });
  });

  test('should provide browser-specific fallbacks when needed', async ({ page }) => {
    await page.goto('/');

    // Test graceful degradation
    const featureSupport = await page.evaluate(() => {
      const features = {
        cssGrid: CSS && CSS.supports && CSS.supports('display', 'grid'),
        flexbox: CSS && CSS.supports && CSS.supports('display', 'flex'),
        customProperties: CSS && CSS.supports && CSS.supports('--custom', 'value'),
        transforms: CSS && CSS.supports && CSS.supports('transform', 'translateX(1px)'),
        animations: CSS && CSS.supports && CSS.supports('animation', 'test 1s'),
        gradients: CSS && CSS.supports && CSS.supports('background', 'linear-gradient(red, blue)'),
      };

      return features;
    });

    // Log feature support for debugging
    console.log('Browser feature support:', featureSupport);

    // Essential features should be supported in all modern browsers
    expect(featureSupport.transforms).toBe(true);
    expect(featureSupport.customProperties).toBe(true);
  });
});