import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive test to verify WastelandBackground component hydration fix
 *
 * This test validates that the useState/useEffect refactor successfully resolved
 * the hydration mismatch error by:
 * 1. Checking for absence of hydration errors in console
 * 2. Verifying correct particle generation on client-side
 * 3. Testing animation intensity configurations
 * 4. Confirming visual rendering through screenshots
 */

test.describe('WastelandBackground Hydration Fix Verification', () => {
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset error tracking arrays
    consoleErrors = [];
    consoleWarnings = [];

    // Capture console messages to detect hydration errors
    page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();

      if (type === 'error') {
        consoleErrors.push(text);
        console.log(`❌ Console Error: ${text}`);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
        console.log(`⚠️  Console Warning: ${text}`);
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page Error: ${error.message}`);
      console.log(`❌ Page Error: ${error.message}`);
    });
  });

  test('should load homepage without hydration mismatch errors', async ({ page }) => {
    console.log('🧪 Testing homepage navigation and hydration...');

    // Navigate to homepage where DynamicBackground uses variant="homepage", animationIntensity="medium"
    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for React hydration to complete
    await page.waitForTimeout(2000);

    // Check for hydration-specific errors
    const hydrationErrors = consoleErrors.filter(error =>
      error.includes('hydrat') ||
      error.includes('mismatch') ||
      error.includes('server') ||
      error.includes('client')
    );

    console.log(`📊 Total console errors: ${consoleErrors.length}`);
    console.log(`📊 Hydration-related errors: ${hydrationErrors.length}`);

    if (hydrationErrors.length > 0) {
      console.log('❌ Hydration errors detected:');
      hydrationErrors.forEach(error => console.log(`   - ${error}`));
    }

    // Verify no hydration errors
    expect(hydrationErrors).toHaveLength(0);
    console.log('✅ No hydration mismatch errors detected');
  });

  test('should render WastelandBackground with correct particle count for medium intensity', async ({ page }) => {
    console.log('🧪 Testing particle generation and count...');

    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for component to mount and useEffect to run
    await page.waitForTimeout(3000);

    // Check if WastelandBackground component is present
    const backgroundElement = page.locator('.wasteland-background');
    await expect(backgroundElement).toBeVisible();
    console.log('✅ WastelandBackground component is visible');

    // Check for particles container
    const particlesContainer = page.locator('.radiation-particles');
    await expect(particlesContainer).toBeVisible();
    console.log('✅ Radiation particles container is visible');

    // Count generated particles - should be 50 for medium intensity
    const particles = page.locator('.radiation-particles .particle');
    const particleCount = await particles.count();

    console.log(`📊 Generated particles: ${particleCount}`);
    console.log(`📊 Expected for medium intensity: 50`);

    // Verify particle count matches medium intensity (50 particles)
    expect(particleCount).toBe(50);
    console.log('✅ Particle count matches expected value for medium intensity');
  });

  test('should have correct variant classes for homepage', async ({ page }) => {
    console.log('🧪 Testing variant and animation classes...');

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const backgroundElement = page.locator('.wasteland-background');

    // Check for homepage variant class
    await expect(backgroundElement).toHaveClass(/wasteland-bg-homepage/);
    console.log('✅ Homepage variant class applied correctly');

    // Check for medium animation intensity class
    await expect(backgroundElement).toHaveClass(/animation-medium/);
    console.log('✅ Medium animation intensity class applied correctly');
  });

  test('should render all background layers without errors', async ({ page }) => {
    console.log('🧪 Testing background layer rendering...');

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Check all background layers are present
    const layers = [
      '.radiation-particles',
      '.wasteland-grid',
      '.scan-lines',
      '.screen-gradient',
      '.radiation-interference'
    ];

    for (const layer of layers) {
      const element = page.locator(layer);
      await expect(element).toBeVisible();
      console.log(`✅ ${layer} layer is rendered`);
    }
  });

  test('should generate particles with correct CSS custom properties', async ({ page }) => {
    console.log('🧪 Testing particle CSS properties...');

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Get first few particles and check their CSS custom properties
    const particles = page.locator('.radiation-particles .particle');
    const firstParticle = particles.first();

    // Verify CSS custom properties are set
    const style = await firstParticle.getAttribute('style');
    expect(style).toContain('--delay');
    expect(style).toContain('--duration');
    expect(style).toContain('--x-start');
    expect(style).toContain('--y-start');

    console.log('✅ Particles have correct CSS custom properties');
    console.log(`📊 Example particle style: ${style}`);
  });

  test('should take visual screenshot for manual verification', async ({ page }) => {
    console.log('🧪 Taking visual screenshot...');

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000); // Wait longer for animations to be visible

    // Take full page screenshot
    await page.screenshot({
      path: 'test-results/wasteland-background-homepage.png',
      fullPage: true
    });

    console.log('📸 Screenshot saved to test-results/wasteland-background-homepage.png');

    // Take screenshot of just the background component
    const backgroundElement = page.locator('.wasteland-background');
    await backgroundElement.screenshot({
      path: 'test-results/wasteland-background-component.png'
    });

    console.log('📸 Component screenshot saved to test-results/wasteland-background-component.png');
  });

  test('should verify performance after hydration fix', async ({ page }) => {
    console.log('🧪 Testing performance impact...');

    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const loadTime = Date.now() - startTime;
    console.log(`📊 Page load time: ${loadTime}ms`);

    // Performance check - should load within reasonable time
    expect(loadTime).toBeLessThan(10000); // 10 seconds max

    // Check for any performance warnings
    const performanceWarnings = consoleWarnings.filter(warning =>
      warning.includes('performance') ||
      warning.includes('slow') ||
      warning.includes('memory')
    );

    console.log(`📊 Performance warnings: ${performanceWarnings.length}`);
    expect(performanceWarnings).toHaveLength(0);

    console.log('✅ No performance degradation detected');
  });

  test.afterEach(async ({ page }) => {
    // Summary report
    console.log('\n📋 Test Summary:');
    console.log(`   Total Console Errors: ${consoleErrors.length}`);
    console.log(`   Total Console Warnings: ${consoleWarnings.length}`);

    if (consoleErrors.length === 0) {
      console.log('✅ All console checks passed - no errors detected');
    } else {
      console.log('❌ Console errors detected:');
      consoleErrors.forEach(error => console.log(`   - ${error}`));
    }
  });
});

test.describe('Cross-Page Hydration Verification', () => {
  /**
   * Test different pages to ensure hydration fix works across all variants
   */

  const routes = [
    { path: '/', variant: 'homepage', intensity: 'medium', expectedParticles: 50 },
    { path: '/auth/login', variant: 'login', intensity: 'high', expectedParticles: 80 },
    { path: '/auth/register', variant: 'login', intensity: 'medium', expectedParticles: 50 }
  ];

  routes.forEach(({ path, variant, intensity, expectedParticles }) => {
    test(`should render ${variant} variant with ${intensity} intensity on ${path}`, async ({ page }) => {
      console.log(`🧪 Testing ${path} - ${variant} variant, ${intensity} intensity`);

      let errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto(path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);

      // Check for hydration errors
      const hydrationErrors = errors.filter(error =>
        error.includes('hydrat') || error.includes('mismatch')
      );
      expect(hydrationErrors).toHaveLength(0);

      // Verify correct particle count
      const particles = page.locator('.radiation-particles .particle');
      const count = await particles.count();
      expect(count).toBe(expectedParticles);

      console.log(`✅ ${path}: No hydration errors, ${count} particles generated`);
    });
  });
});