import { test, expect, type Page } from '@playwright/test';

/**
 * Screen Reader Compatibility Testing Suite
 *
 * Tests compatibility with assistive technologies including:
 * - ARIA attributes and roles
 * - Semantic HTML structure
 * - Alternative text for images and media
 * - Form labels and descriptions
 * - Live regions and announcements
 * - Reading order and navigation
 * - Hidden content accessibility
 */

interface AriaAnalysis {
  hasAriaLabel: boolean;
  hasAriaLabelledBy: boolean;
  hasAriaDescribedBy: boolean;
  hasAriaRole: boolean;
  hasAriaExpanded: boolean;
  hasAriaHidden: boolean;
  ariaAttributes: string[];
  semanticElement: boolean;
  accessibleName: string;
  accessibleDescription: string;
}

interface ScreenReaderElement {
  tagName: string;
  role: string;
  textContent: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  alt?: string;
  title?: string;
  hasSemanticMeaning: boolean;
  isHiddenFromScreenReader: boolean;
  accessibleName: string;
  accessibleDescription: string;
}

test.describe('Screen Reader Compatibility Testing', () => {
  const testPages = [
    { path: '/', name: 'Home Page' },
    { path: '/cards', name: 'Cards Page' },
    { path: '/readings/new', name: 'New Reading Page' },
    { path: '/auth/login', name: 'Login Page' },
    { path: '/auth/register', name: 'Register Page' },
    { path: '/dashboard', name: 'Dashboard' }
  ];

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should have proper ARIA attributes and roles', async ({ page }) => {
    console.log('\n=== ARIA ATTRIBUTES AND ROLES TESTING ===');

    for (const pageTest of testPages) {
      console.log(`\nAnalyzing ARIA on: ${pageTest.name}`);

      await page.goto(pageTest.path);
      await page.waitForLoadState('networkidle');

      const ariaAnalysis = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const ariaElements: any[] = [];

        elements.forEach(element => {
          const rect = element.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;

          const ariaAttributes = Array.from(element.attributes)
            .filter(attr => attr.name.startsWith('aria-'))
            .map(attr => attr.name);

          const hasAnyAria = ariaAttributes.length > 0;
          const hasRole = element.hasAttribute('role');
          const isSemanticElement = [
            'MAIN', 'NAV', 'HEADER', 'FOOTER', 'SECTION', 'ARTICLE', 'ASIDE',
            'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BUTTON', 'A', 'FORM', 'LABEL'
          ].includes(element.tagName);

          if (hasAnyAria || hasRole || isSemanticElement) {
            const computedRole = element.getAttribute('role') ||
                               element.tagName.toLowerCase();

            // Calculate accessible name using accessibility API simulation
            const accessibleName = element.getAttribute('aria-label') ||
                                 element.getAttribute('title') ||
                                 (element as HTMLImageElement).alt ||
                                 element.textContent?.trim().substring(0, 100) ||
                                 '';

            const accessibleDescription = element.getAttribute('aria-describedby') ?
              document.getElementById(element.getAttribute('aria-describedby')!)?.textContent?.trim() || '' :
              '';

            ariaElements.push({
              tagName: element.tagName,
              role: computedRole,
              className: element.className,
              textContent: element.textContent?.trim().substring(0, 50) || '',
              ariaLabel: element.getAttribute('aria-label'),
              ariaLabelledBy: element.getAttribute('aria-labelledby'),
              ariaDescribedBy: element.getAttribute('aria-describedby'),
              ariaHidden: element.getAttribute('aria-hidden'),
              ariaExpanded: element.getAttribute('aria-expanded'),
              ariaRole: element.getAttribute('role'),
              hasAriaAttributes: hasAnyAria,
              ariaAttributes: ariaAttributes,
              isSemanticElement,
              accessibleName,
              accessibleDescription,
              isHiddenFromScreenReader: element.getAttribute('aria-hidden') === 'true' ||
                                      element.hasAttribute('hidden') ||
                                      window.getComputedStyle(element).display === 'none'
            });
          }
        });

        return ariaElements;
      });

      console.log(`  Found ${ariaAnalysis.length} elements with ARIA or semantic meaning`);

      // Analyze ARIA usage patterns
      const elementsWithAriaLabel = ariaAnalysis.filter(el => el.ariaLabel).length;
      const elementsWithAriaLabelledBy = ariaAnalysis.filter(el => el.ariaLabelledBy).length;
      const elementsWithAriaDescribedBy = ariaAnalysis.filter(el => el.ariaDescribedBy).length;
      const elementsWithCustomRoles = ariaAnalysis.filter(el => el.ariaRole).length;
      const semanticElements = ariaAnalysis.filter(el => el.isSemanticElement).length;
      const hiddenElements = ariaAnalysis.filter(el => el.isHiddenFromScreenReader).length;

      console.log(`  Elements with aria-label: ${elementsWithAriaLabel}`);
      console.log(`  Elements with aria-labelledby: ${elementsWithAriaLabelledBy}`);
      console.log(`  Elements with aria-describedby: ${elementsWithAriaDescribedBy}`);
      console.log(`  Elements with custom roles: ${elementsWithCustomRoles}`);
      console.log(`  Semantic HTML elements: ${semanticElements}`);
      console.log(`  Hidden from screen readers: ${hiddenElements}`);

      // Check for problematic ARIA usage
      const problematicElements = ariaAnalysis.filter(el => {
        // Empty aria-label
        if (el.ariaLabel === '') return true;

        // aria-labelledby pointing to non-existent elements
        if (el.ariaLabelledBy) {
          const referencedIds = el.ariaLabelledBy.split(' ');
          const existingIds = referencedIds.filter(id =>
            document.getElementById(id.trim())
          );
          if (existingIds.length !== referencedIds.length) return true;
        }

        // Interactive elements without accessible names
        if (['BUTTON', 'A'].includes(el.tagName) &&
            !el.accessibleName &&
            !el.isHiddenFromScreenReader) {
          return true;
        }

        return false;
      });

      if (problematicElements.length > 0) {
        console.log(`  ⚠️  Found ${problematicElements.length} problematic ARIA usages:`);
        problematicElements.slice(0, 5).forEach((el, index) => {
          console.log(`    ${index + 1}. ${el.tagName}.${el.className} - ${el.textContent}`);
        });
      }

      // ARIA usage should be appropriate
      expect(problematicElements.length).toBeLessThanOrEqual(ariaAnalysis.length * 0.1);

      // Should have reasonable amount of semantic structure
      expect(semanticElements).toBeGreaterThanOrEqual(5);
    }
  });

  test('should have proper alternative text for images and media', async ({ page }) => {
    console.log('\n=== IMAGE AND MEDIA ALTERNATIVE TEXT TESTING ===');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const mediaAnalysis = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      const videos = document.querySelectorAll('video');
      const audio = document.querySelectorAll('audio');
      const canvas = document.querySelectorAll('canvas');
      const svg = document.querySelectorAll('svg');
      const objectElements = document.querySelectorAll('object, embed');

      const results = {
        images: [] as any[],
        videos: [] as any[],
        audio: [] as any[],
        canvas: [] as any[],
        svg: [] as any[],
        objects: [] as any[]
      };

      // Analyze images
      images.forEach(img => {
        const rect = img.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const alt = img.getAttribute('alt');
        const ariaLabel = img.getAttribute('aria-label');
        const ariaLabelledBy = img.getAttribute('aria-labelledby');
        const title = img.getAttribute('title');
        const role = img.getAttribute('role');

        const hasAccessibleName = !!(alt || ariaLabel || ariaLabelledBy || title);
        const isDecorative = alt === '' || role === 'presentation' || img.getAttribute('aria-hidden') === 'true';

        results.images.push({
          src: img.src,
          alt: alt,
          ariaLabel: ariaLabel,
          ariaLabelledBy: ariaLabelledBy,
          title: title,
          role: role,
          hasAccessibleName,
          isDecorative,
          width: rect.width,
          height: rect.height,
          className: img.className
        });
      });

      // Analyze videos
      videos.forEach(video => {
        const tracks = video.querySelectorAll('track');
        const captionTracks = Array.from(tracks).filter(track =>
          track.getAttribute('kind') === 'captions' || track.getAttribute('kind') === 'subtitles'
        );

        results.videos.push({
          src: video.src || video.currentSrc,
          ariaLabel: video.getAttribute('aria-label'),
          title: video.getAttribute('title'),
          hasCaptions: captionTracks.length > 0,
          hasControls: video.hasAttribute('controls'),
          autoplay: video.hasAttribute('autoplay'),
          trackCount: tracks.length
        });
      });

      // Analyze audio
      audio.forEach(audioEl => {
        results.audio.push({
          src: audioEl.src || audioEl.currentSrc,
          ariaLabel: audioEl.getAttribute('aria-label'),
          title: audioEl.getAttribute('title'),
          hasControls: audioEl.hasAttribute('controls'),
          autoplay: audioEl.hasAttribute('autoplay')
        });
      });

      // Analyze canvas
      canvas.forEach(canvasEl => {
        const rect = canvasEl.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        results.canvas.push({
          ariaLabel: canvasEl.getAttribute('aria-label'),
          ariaLabelledBy: canvasEl.getAttribute('aria-labelledby'),
          role: canvasEl.getAttribute('role'),
          width: rect.width,
          height: rect.height,
          hasAccessibleName: !!(canvasEl.getAttribute('aria-label') || canvasEl.getAttribute('aria-labelledby'))
        });
      });

      // Analyze SVG
      svg.forEach(svgEl => {
        const rect = svgEl.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const title = svgEl.querySelector('title');
        const desc = svgEl.querySelector('desc');

        results.svg.push({
          ariaLabel: svgEl.getAttribute('aria-label'),
          ariaLabelledBy: svgEl.getAttribute('aria-labelledby'),
          role: svgEl.getAttribute('role'),
          hasTitle: !!title,
          hasDesc: !!desc,
          titleText: title?.textContent || '',
          descText: desc?.textContent || '',
          isDecorative: svgEl.getAttribute('aria-hidden') === 'true' || svgEl.getAttribute('role') === 'presentation'
        });
      });

      return results;
    });

    console.log('\nMedia accessibility analysis:');
    console.log(`Images: ${mediaAnalysis.images.length}`);
    console.log(`Videos: ${mediaAnalysis.videos.length}`);
    console.log(`Audio: ${mediaAnalysis.audio.length}`);
    console.log(`Canvas: ${mediaAnalysis.canvas.length}`);
    console.log(`SVG: ${mediaAnalysis.svg.length}`);

    // Analyze images
    if (mediaAnalysis.images.length > 0) {
      const imagesWithAlt = mediaAnalysis.images.filter(img => img.hasAccessibleName || img.isDecorative).length;
      const decorativeImages = mediaAnalysis.images.filter(img => img.isDecorative).length;
      const informativeImages = mediaAnalysis.images.length - decorativeImages;

      console.log(`\nImage analysis:`);
      console.log(`  Images with alt/accessible name: ${imagesWithAlt}/${mediaAnalysis.images.length}`);
      console.log(`  Decorative images: ${decorativeImages}`);
      console.log(`  Informative images: ${informativeImages}`);

      // Check for problematic images
      const problematicImages = mediaAnalysis.images.filter(img =>
        !img.hasAccessibleName && !img.isDecorative
      );

      if (problematicImages.length > 0) {
        console.log(`  ⚠️  Images missing alt text:`);
        problematicImages.slice(0, 3).forEach((img, index) => {
          console.log(`    ${index + 1}. ${img.src.substring(img.src.lastIndexOf('/') + 1)} (${img.width}x${img.height})`);
        });
      }

      // All images should have proper alt text or be marked as decorative
      expect(imagesWithAlt).toBe(mediaAnalysis.images.length);
    }

    // Analyze videos
    if (mediaAnalysis.videos.length > 0) {
      const videosWithCaptions = mediaAnalysis.videos.filter(video => video.hasCaptions).length;
      const autoplaying = mediaAnalysis.videos.filter(video => video.autoplay).length;

      console.log(`\nVideo analysis:`);
      console.log(`  Videos with captions: ${videosWithCaptions}/${mediaAnalysis.videos.length}`);
      console.log(`  Autoplaying videos: ${autoplaying}`);

      // Videos should have captions for accessibility
      if (mediaAnalysis.videos.length > 0) {
        expect(videosWithCaptions).toBeGreaterThanOrEqual(mediaAnalysis.videos.length * 0.8);
      }

      // Autoplaying videos should be minimal or have controls
      expect(autoplaying).toBeLessThanOrEqual(1);
    }

    // Analyze canvas elements
    if (mediaAnalysis.canvas.length > 0) {
      const canvasWithNames = mediaAnalysis.canvas.filter(canvas => canvas.hasAccessibleName).length;

      console.log(`\nCanvas analysis:`);
      console.log(`  Canvas with accessible names: ${canvasWithNames}/${mediaAnalysis.canvas.length}`);

      // Canvas elements should have accessible names
      expect(canvasWithNames).toBe(mediaAnalysis.canvas.length);
    }

    // Analyze SVG elements
    if (mediaAnalysis.svg.length > 0) {
      const decorativeSvg = mediaAnalysis.svg.filter(svg => svg.isDecorative).length;
      const svgWithTitles = mediaAnalysis.svg.filter(svg => svg.hasTitle || svg.ariaLabel).length;

      console.log(`\nSVG analysis:`);
      console.log(`  Decorative SVG: ${decorativeSvg}`);
      console.log(`  SVG with titles/labels: ${svgWithTitles}`);
      console.log(`  Total SVG: ${mediaAnalysis.svg.length}`);

      // Non-decorative SVG should have titles or ARIA labels
      const informativeSvg = mediaAnalysis.svg.length - decorativeSvg;
      expect(svgWithTitles).toBeGreaterThanOrEqual(informativeSvg * 0.8);
    }
  });

  test('should have proper form labels and descriptions', async ({ page }) => {
    console.log('\n=== FORM LABELS AND DESCRIPTIONS TESTING ===');

    // Test form pages
    const formPages = ['/auth/login', '/auth/register', '/readings/new'];

    for (const formPath of formPages) {
      console.log(`\nAnalyzing forms on: ${formPath}`);

      try {
        await page.goto(formPath);
        await page.waitForLoadState('networkidle');

        const formAnalysis = await page.evaluate(() => {
          const forms = document.querySelectorAll('form');
          const inputs = document.querySelectorAll('input, textarea, select');
          const labels = document.querySelectorAll('label');

          const formData = {
            formCount: forms.length,
            inputCount: inputs.length,
            labelCount: labels.length,
            inputs: [] as any[],
            fieldsets: [] as any[]
          };

          inputs.forEach(input => {
            const inputElement = input as HTMLInputElement;
            const inputId = inputElement.id;
            const inputName = inputElement.name;
            const inputType = inputElement.type;

            // Find associated label
            const associatedLabel = document.querySelector(`label[for="${inputId}"]`) as HTMLLabelElement;
            const parentLabel = inputElement.closest('label') as HTMLLabelElement;
            const actualLabel = associatedLabel || parentLabel;

            // Check ARIA labeling
            const ariaLabel = inputElement.getAttribute('aria-label');
            const ariaLabelledBy = inputElement.getAttribute('aria-labelledby');
            const ariaDescribedBy = inputElement.getAttribute('aria-describedby');

            // Check for placeholder
            const placeholder = inputElement.getAttribute('placeholder');

            // Check for description/help text
            let description = '';
            if (ariaDescribedBy) {
              const descElement = document.getElementById(ariaDescribedBy);
              description = descElement?.textContent?.trim() || '';
            }

            // Check required status
            const isRequired = inputElement.hasAttribute('required') ||
                             inputElement.getAttribute('aria-required') === 'true';

            // Check error state
            const hasError = inputElement.getAttribute('aria-invalid') === 'true' ||
                           inputElement.classList.contains('error') ||
                           inputElement.classList.contains('invalid');

            const hasAccessibleName = !!(actualLabel?.textContent?.trim() || ariaLabel || ariaLabelledBy || placeholder);

            formData.inputs.push({
              id: inputId,
              name: inputName,
              type: inputType,
              hasLabel: !!actualLabel,
              labelText: actualLabel?.textContent?.trim() || '',
              hasAriaLabel: !!ariaLabel,
              ariaLabel: ariaLabel,
              hasAriaLabelledBy: !!ariaLabelledBy,
              hasAriaDescribedBy: !!ariaDescribedBy,
              hasPlaceholder: !!placeholder,
              placeholder: placeholder,
              description: description,
              isRequired: isRequired,
              hasError: hasError,
              hasAccessibleName: hasAccessibleName
            });
          });

          // Check fieldsets and legends
          const fieldsets = document.querySelectorAll('fieldset');
          fieldsets.forEach(fieldset => {
            const legend = fieldset.querySelector('legend');
            const inputsInFieldset = fieldset.querySelectorAll('input, textarea, select').length;

            formData.fieldsets.push({
              hasLegend: !!legend,
              legendText: legend?.textContent?.trim() || '',
              inputCount: inputsInFieldset
            });
          });

          return formData;
        });

        console.log(`  Forms: ${formAnalysis.formCount}`);
        console.log(`  Inputs: ${formAnalysis.inputCount}`);
        console.log(`  Labels: ${formAnalysis.labelCount}`);
        console.log(`  Fieldsets: ${formAnalysis.fieldsets.length}`);

        if (formAnalysis.inputCount > 0) {
          const inputsWithLabels = formAnalysis.inputs.filter(input => input.hasAccessibleName).length;
          const requiredInputs = formAnalysis.inputs.filter(input => input.isRequired).length;
          const inputsWithDescriptions = formAnalysis.inputs.filter(input => input.description).length;

          console.log(`  Inputs with accessible names: ${inputsWithLabels}/${formAnalysis.inputCount}`);
          console.log(`  Required inputs: ${requiredInputs}`);
          console.log(`  Inputs with descriptions: ${inputsWithDescriptions}`);

          // Check for problematic inputs
          const problematicInputs = formAnalysis.inputs.filter(input => !input.hasAccessibleName);
          if (problematicInputs.length > 0) {
            console.log(`  ⚠️  Inputs without accessible names:`);
            problematicInputs.forEach((input, index) => {
              console.log(`    ${index + 1}. ${input.type} input (name: ${input.name || 'none'})`);
            });
          }

          // All form inputs should have accessible names
          expect(inputsWithLabels).toBe(formAnalysis.inputCount);

          // Required inputs should be properly marked
          if (requiredInputs > 0) {
            const properlyMarkedRequired = formAnalysis.inputs.filter(input =>
              input.isRequired && (input.labelText.includes('*') || input.description.includes('required'))
            ).length;

            // At least 80% of required fields should be visually indicated
            expect(properlyMarkedRequired).toBeGreaterThanOrEqual(requiredInputs * 0.8);
          }
        }

        // Check fieldsets
        if (formAnalysis.fieldsets.length > 0) {
          const fieldsetsWithLegends = formAnalysis.fieldsets.filter(fs => fs.hasLegend).length;
          console.log(`  Fieldsets with legends: ${fieldsetsWithLegends}/${formAnalysis.fieldsets.length}`);

          // Fieldsets should have legends
          expect(fieldsetsWithLegends).toBe(formAnalysis.fieldsets.length);
        }

      } catch (error) {
        console.log(`  Error accessing ${formPath}: ${error}`);
        // Continue with other pages
      }
    }
  });

  test('should have proper heading structure and landmarks', async ({ page }) => {
    console.log('\n=== HEADING STRUCTURE AND LANDMARKS TESTING ===');

    for (const pageTest of testPages) {
      console.log(`\nAnalyzing structure on: ${pageTest.name}`);

      await page.goto(pageTest.path);
      await page.waitForLoadState('networkidle');

      const structureAnalysis = await page.evaluate(() => {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const landmarks = document.querySelectorAll('main, nav, header, footer, aside, section, article, [role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"]');

        const headingStructure = Array.from(headings).map(heading => ({
          level: parseInt(heading.tagName.charAt(1)),
          text: heading.textContent?.trim().substring(0, 50) || '',
          tagName: heading.tagName,
          id: heading.id,
          ariaLabel: heading.getAttribute('aria-label')
        }));

        const landmarkStructure = Array.from(landmarks).map(landmark => ({
          tagName: landmark.tagName,
          role: landmark.getAttribute('role') || landmark.tagName.toLowerCase(),
          ariaLabel: landmark.getAttribute('aria-label'),
          ariaLabelledBy: landmark.getAttribute('aria-labelledby'),
          hasAccessibleName: !!(landmark.getAttribute('aria-label') ||
                               landmark.getAttribute('aria-labelledby') ||
                               (landmark.tagName === 'SECTION' && landmark.querySelector('h1, h2, h3, h4, h5, h6')))
        }));

        // Check for skip links
        const skipLinks = document.querySelectorAll('a[href^="#"]');
        const actualSkipLinks = Array.from(skipLinks).filter(link => {
          const href = link.getAttribute('href');
          const target = href ? document.querySelector(href) : null;
          return target && ['main', 'nav', 'content'].some(keyword =>
            href.includes(keyword) || link.textContent?.toLowerCase().includes(keyword)
          );
        });

        return {
          headings: headingStructure,
          landmarks: landmarkStructure,
          skipLinks: actualSkipLinks.length,
          hasMain: !!document.querySelector('main, [role="main"]'),
          hasNav: !!document.querySelector('nav, [role="navigation"]'),
          hasHeader: !!document.querySelector('header, [role="banner"]'),
          hasFooter: !!document.querySelector('footer, [role="contentinfo"]')
        };
      });

      console.log(`  Headings: ${structureAnalysis.headings.length}`);
      console.log(`  Landmarks: ${structureAnalysis.landmarks.length}`);
      console.log(`  Skip links: ${structureAnalysis.skipLinks}`);

      // Analyze heading hierarchy
      if (structureAnalysis.headings.length > 0) {
        const headingLevels = structureAnalysis.headings.map(h => h.level);
        const hasH1 = headingLevels.includes(1);
        const multipleH1 = headingLevels.filter(level => level === 1).length > 1;
        const hasLogicalProgression = headingLevels.every((level, index) => {
          if (index === 0) return true;
          const previousLevel = headingLevels[index - 1];
          return level <= previousLevel + 1; // Should not skip levels
        });

        console.log(`  Heading structure: ${headingLevels.join(' -> ')}`);
        console.log(`  Has H1: ${hasH1}`);
        console.log(`  Multiple H1s: ${multipleH1}`);
        console.log(`  Logical progression: ${hasLogicalProgression}`);

        // Should have exactly one H1
        expect(hasH1).toBe(true);
        expect(multipleH1).toBe(false);

        // Heading progression should be logical
        expect(hasLogicalProgression).toBe(true);
      }

      // Check landmark structure
      console.log(`  Main landmark: ${structureAnalysis.hasMain}`);
      console.log(`  Nav landmark: ${structureAnalysis.hasNav}`);
      console.log(`  Header landmark: ${structureAnalysis.hasHeader}`);
      console.log(`  Footer landmark: ${structureAnalysis.hasFooter}`);

      const landmarksWithNames = structureAnalysis.landmarks.filter(lm => lm.hasAccessibleName).length;
      console.log(`  Landmarks with accessible names: ${landmarksWithNames}/${structureAnalysis.landmarks.length}`);

      // Essential landmarks should be present
      expect(structureAnalysis.hasMain).toBe(true);

      // Should have multiple landmarks for good structure
      expect(structureAnalysis.landmarks.length).toBeGreaterThanOrEqual(3);

      // Multiple landmarks of same type should have accessible names
      const landmarkTypes = structureAnalysis.landmarks.map(lm => lm.role);
      const duplicateTypes = landmarkTypes.filter((type, index) => landmarkTypes.indexOf(type) !== index);

      if (duplicateTypes.length > 0) {
        expect(landmarksWithNames).toBeGreaterThanOrEqual(duplicateTypes.length);
      }
    }
  });

  test('should have proper live regions and dynamic content announcements', async ({ page }) => {
    console.log('\n=== LIVE REGIONS AND DYNAMIC CONTENT TESTING ===');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const liveRegionAnalysis = await page.evaluate(() => {
      const liveRegions = document.querySelectorAll('[aria-live], [role="status"], [role="alert"], [role="log"]');
      const statusElements = document.querySelectorAll('[role="status"]');
      const alertElements = document.querySelectorAll('[role="alert"]');
      const ariaLiveElements = document.querySelectorAll('[aria-live]');

      const liveRegionData = Array.from(liveRegions).map(region => ({
        tagName: region.tagName,
        role: region.getAttribute('role'),
        ariaLive: region.getAttribute('aria-live'),
        ariaAtomic: region.getAttribute('aria-atomic'),
        ariaRelevant: region.getAttribute('aria-relevant'),
        className: region.className,
        id: region.id,
        textContent: region.textContent?.trim().substring(0, 100) || '',
        isEmpty: !region.textContent?.trim()
      }));

      return {
        totalLiveRegions: liveRegions.length,
        statusElements: statusElements.length,
        alertElements: alertElements.length,
        ariaLiveElements: ariaLiveElements.length,
        liveRegions: liveRegionData
      };
    });

    console.log(`Found ${liveRegionAnalysis.totalLiveRegions} live regions:`);
    console.log(`  Status elements: ${liveRegionAnalysis.statusElements}`);
    console.log(`  Alert elements: ${liveRegionAnalysis.alertElements}`);
    console.log(`  aria-live elements: ${liveRegionAnalysis.ariaLiveElements}`);

    if (liveRegionAnalysis.liveRegions.length > 0) {
      console.log('\nLive region details:');
      liveRegionAnalysis.liveRegions.forEach((region, index) => {
        console.log(`  ${index + 1}. ${region.tagName} (${region.role || region.ariaLive})`);
        console.log(`     Content: "${region.textContent}"`);
        console.log(`     Empty: ${region.isEmpty}`);
      });

      // Live regions should be properly configured
      const properlyConfigured = liveRegionAnalysis.liveRegions.filter(region =>
        (region.ariaLive && ['polite', 'assertive', 'off'].includes(region.ariaLive)) ||
        ['status', 'alert', 'log'].includes(region.role || '')
      ).length;

      expect(properlyConfigured).toBe(liveRegionAnalysis.liveRegions.length);
    }

    // Test dynamic content updates (simulate if possible)
    const dynamicContentTest = await page.evaluate(() => {
      // Look for elements that might receive dynamic updates
      const potentialDynamicElements = document.querySelectorAll(
        '[id*="status"], [id*="message"], [id*="alert"], [class*="toast"], [class*="notification"], [class*="error"]'
      );

      const dynamicElements = Array.from(potentialDynamicElements).map(element => ({
        tagName: element.tagName,
        id: element.id,
        className: element.className,
        hasAriaLive: element.hasAttribute('aria-live'),
        hasRole: element.hasAttribute('role'),
        textContent: element.textContent?.trim().substring(0, 50) || ''
      }));

      return dynamicElements;
    });

    if (dynamicContentTest.length > 0) {
      console.log(`\nPotential dynamic content elements: ${dynamicContentTest.length}`);

      const elementsWithAnnouncements = dynamicContentTest.filter(el =>
        el.hasAriaLive || ['status', 'alert'].includes(el.hasRole ? 'role-exists' : '')
      ).length;

      console.log(`Elements with announcement capabilities: ${elementsWithAnnouncements}`);

      // At least 50% of dynamic content should have announcement capabilities
      if (dynamicContentTest.length > 2) {
        expect(elementsWithAnnouncements).toBeGreaterThanOrEqual(dynamicContentTest.length * 0.5);
      }
    }
  });

  test('should properly handle hidden content for screen readers', async ({ page }) => {
    console.log('\n=== HIDDEN CONTENT ACCESSIBILITY TESTING ===');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const hiddenContentAnalysis = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const hiddenAnalysis = {
        ariaHiddenTrue: 0,
        ariaHiddenFalse: 0,
        visuallyHidden: 0,
        displayNone: 0,
        visibilityHidden: 0,
        hiddenAttribute: 0,
        screenReaderOnly: 0,
        problematicHidden: [] as any[]
      };

      allElements.forEach(element => {
        const ariaHidden = element.getAttribute('aria-hidden');
        const styles = window.getComputedStyle(element);
        const hasHiddenAttribute = element.hasAttribute('hidden');

        // Count different types of hiding
        if (ariaHidden === 'true') hiddenAnalysis.ariaHiddenTrue++;
        if (ariaHidden === 'false') hiddenAnalysis.ariaHiddenFalse++;
        if (styles.display === 'none') hiddenAnalysis.displayNone++;
        if (styles.visibility === 'hidden') hiddenAnalysis.visibilityHidden++;
        if (hasHiddenAttribute) hiddenAnalysis.hiddenAttribute++;

        // Check for visually hidden but screen reader accessible content
        const isVisuallyHidden =
          styles.position === 'absolute' && (
            styles.left === '-9999px' || styles.left === '-10000px' ||
            styles.top === '-9999px' || styles.top === '-10000px'
          ) ||
          styles.clip === 'rect(0, 0, 0, 0)' ||
          styles.clipPath === 'inset(50%)' ||
          (styles.width === '1px' && styles.height === '1px' && styles.overflow === 'hidden');

        if (isVisuallyHidden) hiddenAnalysis.visuallyHidden++;

        // Check for screen reader only content
        const isScreenReaderOnly =
          element.className.includes('sr-only') ||
          element.className.includes('visually-hidden') ||
          element.className.includes('screen-reader-text');

        if (isScreenReaderOnly) hiddenAnalysis.screenReaderOnly++;

        // Check for problematic hiding patterns
        const isInteractive = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName);
        const isFocusable = element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '-1';

        if ((isInteractive || isFocusable) && ariaHidden === 'true') {
          hiddenAnalysis.problematicHidden.push({
            tagName: element.tagName,
            className: element.className,
            id: element.id,
            issue: 'Interactive element hidden from screen readers'
          });
        }

        // Check for hidden content with important information
        const hasImportantContent =
          element.textContent?.includes('error') ||
          element.textContent?.includes('required') ||
          element.textContent?.includes('invalid') ||
          element.className.includes('error') ||
          element.className.includes('required');

        if (hasImportantContent && (styles.display === 'none' || ariaHidden === 'true')) {
          hiddenAnalysis.problematicHidden.push({
            tagName: element.tagName,
            className: element.className,
            textContent: element.textContent?.trim().substring(0, 50),
            issue: 'Important content hidden from screen readers'
          });
        }
      });

      return hiddenAnalysis;
    });

    console.log('Hidden content analysis:');
    console.log(`  aria-hidden="true": ${hiddenContentAnalysis.ariaHiddenTrue}`);
    console.log(`  aria-hidden="false": ${hiddenContentAnalysis.ariaHiddenFalse}`);
    console.log(`  Visually hidden (SR accessible): ${hiddenContentAnalysis.visuallyHidden}`);
    console.log(`  Display none: ${hiddenContentAnalysis.displayNone}`);
    console.log(`  Visibility hidden: ${hiddenContentAnalysis.visibilityHidden}`);
    console.log(`  Hidden attribute: ${hiddenContentAnalysis.hiddenAttribute}`);
    console.log(`  Screen reader only classes: ${hiddenContentAnalysis.screenReaderOnly}`);

    if (hiddenContentAnalysis.problematicHidden.length > 0) {
      console.log(`\n⚠️  Problematic hidden content (${hiddenContentAnalysis.problematicHidden.length} issues):`);
      hiddenContentAnalysis.problematicHidden.slice(0, 5).forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.tagName}.${issue.className}: ${issue.issue}`);
        if (issue.textContent) console.log(`     Content: "${issue.textContent}"`);
      });
    }

    // Should not have problematic hiding patterns
    expect(hiddenContentAnalysis.problematicHidden.length).toBeLessThanOrEqual(2);

    // Screen reader only content is good for accessibility
    if (hiddenContentAnalysis.screenReaderOnly > 0) {
      console.log(`✅ Found ${hiddenContentAnalysis.screenReaderOnly} screen reader only elements`);
    }
  });

  test('should generate comprehensive screen reader compatibility report', async ({ page }) => {
    console.log('\n=== SCREEN READER COMPATIBILITY REPORT ===');

    const report = {
      timestamp: new Date().toISOString(),
      pages: [] as any[],
      overallScore: 0,
      criticalIssues: [] as string[],
      recommendations: [] as string[]
    };

    for (const pageTest of testPages.slice(0, 3)) { // Test top 3 pages
      console.log(`\nGenerating report for: ${pageTest.name}`);

      await page.goto(pageTest.path);
      await page.waitForLoadState('networkidle');

      const pageReport = await page.evaluate(() => {
        let score = 100;
        const issues: string[] = [];
        const analysis = {
          headings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
          landmarks: document.querySelectorAll('main, nav, header, footer, aside, [role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]').length,
          images: document.querySelectorAll('img').length,
          imagesWithAlt: document.querySelectorAll('img[alt]').length,
          forms: document.querySelectorAll('form').length,
          inputs: document.querySelectorAll('input, textarea, select').length,
          inputsWithLabels: 0,
          buttons: document.querySelectorAll('button').length,
          buttonsWithNames: 0,
          links: document.querySelectorAll('a[href]').length,
          linksWithNames: 0,
          ariaLabels: document.querySelectorAll('[aria-label]').length,
          ariaDescriptions: document.querySelectorAll('[aria-describedby]').length,
          liveRegions: document.querySelectorAll('[aria-live], [role="status"], [role="alert"]').length,
          skipLinks: 0
        };

        // Check input labels
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
          const id = input.id;
          const hasLabel = !!document.querySelector(`label[for="${id}"]`) ||
                          input.hasAttribute('aria-label') ||
                          input.hasAttribute('aria-labelledby') ||
                          !!input.closest('label');
          if (hasLabel) analysis.inputsWithLabels++;
        });

        // Check button names
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
          const hasName = button.textContent?.trim() ||
                         button.getAttribute('aria-label') ||
                         button.getAttribute('aria-labelledby') ||
                         button.getAttribute('title');
          if (hasName) analysis.buttonsWithNames++;
        });

        // Check link names
        const links = document.querySelectorAll('a[href]');
        links.forEach(link => {
          const hasName = link.textContent?.trim() ||
                         link.getAttribute('aria-label') ||
                         link.getAttribute('aria-labelledby') ||
                         link.getAttribute('title');
          if (hasName) analysis.linksWithNames++;
        });

        // Check skip links
        const skipLinkCandidates = document.querySelectorAll('a[href^="#"]');
        skipLinkCandidates.forEach(link => {
          const href = link.getAttribute('href') || '';
          const text = link.textContent?.toLowerCase() || '';
          if (href.includes('main') || href.includes('content') ||
              text.includes('skip') || text.includes('jump')) {
            analysis.skipLinks++;
          }
        });

        // Calculate deductions
        if (analysis.headings === 0) {
          score -= 15;
          issues.push('No headings found');
        }

        if (analysis.landmarks < 3) {
          score -= 10;
          issues.push('Insufficient landmark structure');
        }

        if (analysis.images > 0 && analysis.imagesWithAlt < analysis.images) {
          score -= 20;
          issues.push('Images missing alt text');
        }

        if (analysis.inputs > 0 && analysis.inputsWithLabels < analysis.inputs) {
          score -= 25;
          issues.push('Form inputs missing labels');
        }

        if (analysis.buttons > 0 && analysis.buttonsWithNames < analysis.buttons * 0.9) {
          score -= 15;
          issues.push('Buttons missing accessible names');
        }

        if (analysis.links > 0 && analysis.linksWithNames < analysis.links * 0.9) {
          score -= 15;
          issues.push('Links missing accessible names');
        }

        if (analysis.inputs > 5 && analysis.skipLinks === 0) {
          score -= 5;
          issues.push('No skip links for complex forms');
        }

        return {
          score: Math.max(0, score),
          issues,
          analysis
        };
      });

      report.pages.push({
        name: pageTest.name,
        path: pageTest.path,
        score: pageReport.score,
        issues: pageReport.issues,
        analysis: pageReport.analysis
      });

      console.log(`  Score: ${pageReport.score}/100`);
      if (pageReport.issues.length > 0) {
        console.log(`  Issues: ${pageReport.issues.join(', ')}`);
      }
    }

    // Calculate overall score and gather critical issues
    report.overallScore = Math.round(
      report.pages.reduce((sum, page) => sum + page.score, 0) / report.pages.length
    );

    // Identify critical issues across all pages
    const allIssues = report.pages.flatMap(page => page.issues);
    const issueFrequency = allIssues.reduce((acc, issue) => {
      acc[issue] = (acc[issue] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    report.criticalIssues = Object.entries(issueFrequency)
      .filter(([, count]) => count >= report.pages.length * 0.5) // Issues on 50%+ of pages
      .map(([issue]) => issue);

    // Generate recommendations
    if (report.criticalIssues.some(issue => issue.includes('labels'))) {
      report.recommendations.push('Implement proper form labeling strategy using <label>, aria-label, or aria-labelledby');
    }
    if (report.criticalIssues.some(issue => issue.includes('alt text'))) {
      report.recommendations.push('Add descriptive alt text to all informative images');
    }
    if (report.criticalIssues.some(issue => issue.includes('headings'))) {
      report.recommendations.push('Implement proper heading hierarchy starting with H1');
    }
    if (report.criticalIssues.some(issue => issue.includes('landmark'))) {
      report.recommendations.push('Add semantic landmarks (main, nav, header, footer) for better navigation');
    }
    if (report.criticalIssues.some(issue => issue.includes('names'))) {
      report.recommendations.push('Ensure all interactive elements have descriptive accessible names');
    }

    console.log('\n=== SCREEN READER COMPATIBILITY REPORT ===');
    console.log(`Overall Score: ${report.overallScore}/100`);
    console.log(`Pages Tested: ${report.pages.length}`);

    if (report.criticalIssues.length > 0) {
      console.log('\nCritical Issues (affecting multiple pages):');
      report.criticalIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }

    if (report.recommendations.length > 0) {
      console.log('\nRecommendations:');
      report.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }

    console.log('\nDetailed page scores:');
    report.pages.forEach(page => {
      console.log(`  ${page.name}: ${page.score}/100`);
    });

    // Assert minimum accessibility standards
    expect(report.overallScore).toBeGreaterThanOrEqual(80);

    // No page should score below 75
    report.pages.forEach(page => {
      expect(page.score).toBeGreaterThanOrEqual(75);
    });

    // Should not have more than 2 critical issues
    expect(report.criticalIssues.length).toBeLessThanOrEqual(2);
  });
});