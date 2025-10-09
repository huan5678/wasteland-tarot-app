import { test, expect } from '@playwright/test';

/**
 * Focused test to verify the WastelandBackground hydration mismatch fix
 *
 * The component was modified from useMemo to useState + useEffect to prevent
 * hydration mismatches between server and client particle generation.
 */

test.describe('WastelandBackground Hydration Fix', () => {
  test('should not have hydration mismatch errors', async ({ page }) => {
    const hydrationErrors: string[] = [];
    const allErrors: string[] = [];

    // Capture console messages
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        allErrors.push(text);

        // Check for hydration-specific errors
        if (text.toLowerCase().includes('hydrat') ||
            text.toLowerCase().includes('mismatch') ||
            text.toLowerCase().includes('text content does not match') ||
            text.toLowerCase().includes('server-rendered html didn\'t match')) {
          hydrationErrors.push(text);
        }
      }
    });

    console.log('🧪 Testing homepage for hydration errors...');

    // Navigate to homepage
    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for React hydration and particle generation
    await page.waitForTimeout(3000);

    console.log(`📊 Total console errors: ${allErrors.length}`);
    console.log(`📊 Hydration-related errors: ${hydrationErrors.length}`);

    if (hydrationErrors.length > 0) {
      console.log('❌ Hydration errors found:');
      hydrationErrors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('✅ No hydration mismatch errors detected');
    }

    // Main assertion: No hydration errors
    expect(hydrationErrors).toHaveLength(0);
  });

  test('should generate particles after client-side hydration', async ({ page }) => {
    console.log('🧪 Testing particle generation after hydration...');

    await page.goto('/', { waitUntil: 'networkidle' });

    // Initial check - particles container should exist but be empty (SSR)
    const particlesContainer = page.locator('.radiation-particles');
    await expect(particlesContainer).toBeVisible();

    // Wait for client-side rendering and particle generation
    await page.waitForTimeout(4000);

    // Check particle count after client-side generation
    const particles = page.locator('.radiation-particles .particle');
    const particleCount = await particles.count();

    console.log(`📊 Particles generated: ${particleCount}`);
    console.log(`📊 Expected for medium intensity: 50`);

    // Verify particles were generated
    expect(particleCount).toBeGreaterThan(0);
    expect(particleCount).toBe(50); // Medium intensity should generate 50 particles

    console.log('✅ Particles generated correctly after hydration');
  });

  test('should have empty particles container on initial SSR', async ({ page }) => {
    console.log('🧪 Checking initial SSR state...');

    // Intercept the initial HTML response
    let initialHTML = '';
    page.on('response', async (response) => {
      if (response.url() === 'http://localhost:3000/' && response.status() === 200) {
        try {
          initialHTML = await response.text();
        } catch (error) {
          // Ignore errors in getting response text
        }
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Check if particles container is empty in initial HTML (before hydration)
    if (initialHTML) {
      const hasEmptyParticlesContainer = initialHTML.includes('<div class="radiation-particles"></div>');
      console.log(`📊 SSR has empty particles container: ${hasEmptyParticlesContainer}`);
      expect(hasEmptyParticlesContainer).toBe(true);
    }

    console.log('✅ SSR renders empty particles container (prevents hydration mismatch)');
  });

  test('should render all background layers correctly', async ({ page }) => {
    console.log('🧪 Testing background layer rendering...');

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check main background element
    const background = page.locator('.wasteland-background');
    await expect(background).toBeVisible();
    await expect(background).toHaveClass(/wasteland-bg-homepage/);
    await expect(background).toHaveClass(/animation-medium/);

    // Check required layers exist (some may not be visible due to CSS)
    const requiredLayers = [
      '.radiation-particles',
      '.wasteland-grid',
      '.scan-lines',
      '.screen-gradient',
      '.radiation-interference'
    ];

    for (const layer of requiredLayers) {
      const element = page.locator(layer);
      const exists = await element.count() > 0;
      console.log(`📊 ${layer}: ${exists ? 'exists' : 'missing'}`);
      expect(exists).toBe(true);
    }

    console.log('✅ All background layers are present');
  });

  test('should take visual verification screenshot', async ({ page }) => {
    console.log('🧪 Taking visual verification screenshot...');

    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for particles to be generated
    await page.waitForTimeout(5000);

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'test-results/hydration-fix-verification.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1280, height: 800 }
    });

    console.log('📸 Screenshot saved to test-results/hydration-fix-verification.png');

    // Verify particles are visible in the DOM
    const particles = page.locator('.radiation-particles .particle');
    const count = await particles.count();

    expect(count).toBe(50);
    console.log(`✅ Visual verification complete - ${count} particles rendered`);
  });

  test('should perform before/after comparison', async ({ page }) => {
    console.log('🧪 Testing complete hydration cycle...');

    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Step 1: Load page
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Step 2: Check initial state (should be empty particles)
    let initialParticleCount = await page.locator('.radiation-particles .particle').count();
    console.log(`📊 Initial particle count (SSR): ${initialParticleCount}`);

    // Step 3: Wait for hydration and client-side rendering
    await page.waitForTimeout(4000);

    // Step 4: Check final state (should have 50 particles)
    let finalParticleCount = await page.locator('.radiation-particles .particle').count();
    console.log(`📊 Final particle count (after hydration): ${finalParticleCount}`);

    // Step 5: Verify the transition
    expect(initialParticleCount).toBe(0); // SSR should have no particles
    expect(finalParticleCount).toBe(50);  // Client should generate 50 particles

    // Step 6: Verify no errors occurred during hydration
    const hydrationErrors = errors.filter(error =>
      error.toLowerCase().includes('hydrat') ||
      error.toLowerCase().includes('mismatch')
    );

    expect(hydrationErrors).toHaveLength(0);

    console.log('✅ Complete hydration cycle test passed');
    console.log(`   - SSR: ${initialParticleCount} particles`);
    console.log(`   - Client: ${finalParticleCount} particles`);
    console.log(`   - Hydration errors: ${hydrationErrors.length}`);
  });
});