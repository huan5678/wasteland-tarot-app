const { chromium } = require('playwright');

async function simpleWCAGTest() {
  console.log('🔍 簡化 WCAG AA 驗證測試...');

  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    console.log('📍 載入首頁...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 計算色彩對比度（核心功能）
    const contrastResults = await page.evaluate(() => {
      function getLuminance(r, g, b) {
        const [rs, gs, bs] = [r, g, b].map(c => {
          c = c / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      }

      function getContrastRatio(color1, color2) {
        const lum1 = getLuminance(...color1);
        const lum2 = getLuminance(...color2);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
      }

      function parseRgb(rgbString) {
        const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : null;
      }

      // 測試關鍵元素
      const testSelectors = [
        { selector: 'h1', name: '主標題', expected: 'high' },
        { selector: 'h2', name: '次標題', expected: 'high' },
        { selector: '.text-text-secondary', name: '次要文字', expected: 'medium' },
        { selector: '.text-text-muted', name: '淡化文字', expected: 'medium' },
        { selector: 'button', name: '按鈕', expected: 'high' },
        { selector: 'p', name: '段落文字', expected: 'medium' }
      ];

      const results = [];
      const backgroundColor = [26, 26, 26]; // #1a1a1a 主背景

      testSelectors.forEach(test => {
        const element = document.querySelector(test.selector);
        if (element) {
          const computedStyle = window.getComputedStyle(element);
          const color = computedStyle.color;
          const textColor = parseRgb(color);

          if (textColor) {
            const contrast = getContrastRatio(textColor, backgroundColor);
            const fontSize = parseFloat(computedStyle.fontSize);
            const fontWeight = computedStyle.fontWeight;
            const isLarge = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
            const requiredRatio = isLarge ? 3.0 : 4.5;
            const passes = contrast >= requiredRatio;

            results.push({
              name: test.name,
              selector: test.selector,
              contrast: contrast.toFixed(2),
              required: requiredRatio,
              passes: passes,
              level: contrast >= 7.0 ? 'AAA' : (contrast >= requiredRatio ? 'AA' : 'FAIL'),
              textColor: color,
              fontSize: fontSize,
              fontWeight: fontWeight
            });
          }
        }
      });

      return results;
    });

    // Focus 狀態檢查
    const focusResults = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const results = [];

      buttons.slice(0, 3).forEach((button, index) => {
        // 模擬 focus
        button.focus();
        const computedStyle = window.getComputedStyle(button);

        const hasFocusRing = computedStyle.outline !== 'none' && computedStyle.outline !== '';
        const hasBoxShadow = computedStyle.boxShadow !== 'none';
        const hasVisibleFocus = hasFocusRing || hasBoxShadow;

        results.push({
          buttonIndex: index + 1,
          hasOutline: hasFocusRing,
          hasBoxShadow: hasBoxShadow,
          visible: hasVisibleFocus,
          outline: computedStyle.outline,
          boxShadow: computedStyle.boxShadow
        });
      });

      return results;
    });

    // 檢查語義化色彩類別的使用
    const semanticColorUsage = await page.evaluate(() => {
      const semanticClasses = [
        'text-text-secondary',
        'text-text-muted',
        'text-high-contrast',
        'text-enhanced-secondary',
        'text-enhanced-muted'
      ];

      const usage = {};
      semanticClasses.forEach(className => {
        const elements = document.querySelectorAll(`.${className}`);
        usage[className] = elements.length;
      });

      return usage;
    });

    // 生成詳細報告
    console.log('\n📊 WCAG AA 色彩對比度檢查結果');
    console.log('=====================================');

    const passedTests = contrastResults.filter(r => r.passes).length;
    const totalTests = contrastResults.length;
    const passRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log(`\n📈 整體通過率: ${passedTests}/${totalTests} (${passRate}%)\n`);

    contrastResults.forEach(result => {
      const status = result.passes ? '✅' : '❌';
      const level = result.level === 'AAA' ? '🏆 AAA' :
                   result.level === 'AA' ? '✅ AA' : '❌ FAIL';

      console.log(`${status} ${result.name}:`);
      console.log(`   對比度: ${result.contrast}:1 (需要: ${result.required}:1)`);
      console.log(`   等級: ${level}`);
      console.log(`   文字顏色: ${result.textColor}`);
      console.log(`   字體大小: ${result.fontSize}px (${result.fontWeight})`);
      console.log('');
    });

    // Focus 狀態報告
    console.log('👁️ Focus 可見性檢查結果');
    console.log('========================');

    const visibleFocusCount = focusResults.filter(r => r.visible).length;
    const totalFocusTests = focusResults.length;
    const focusPassRate = ((visibleFocusCount / totalFocusTests) * 100).toFixed(1);

    console.log(`Focus 可見率: ${visibleFocusCount}/${totalFocusTests} (${focusPassRate}%)\n`);

    focusResults.forEach(result => {
      const status = result.visible ? '✅' : '❌';
      console.log(`${status} 按鈕 ${result.buttonIndex}:`);
      console.log(`   有 outline: ${result.hasOutline}`);
      console.log(`   有 box-shadow: ${result.hasBoxShadow}`);
      console.log(`   整體可見: ${result.visible}`);
      console.log('');
    });

    // 語義化色彩類別使用報告
    console.log('🎨 語義化色彩類別使用情況');
    console.log('===========================');

    Object.entries(semanticColorUsage).forEach(([className, count]) => {
      const status = count > 0 ? '✅' : '⚪';
      console.log(`${status} .${className}: ${count} 個元素`);
    });

    // 整體評分
    const contrastScore = parseFloat(passRate);
    const focusScore = parseFloat(focusPassRate);
    const semanticUsage = Object.values(semanticColorUsage).filter(count => count > 0).length;
    const semanticScore = (semanticUsage / Object.keys(semanticColorUsage).length) * 100;
    const overallScore = (contrastScore + focusScore + semanticScore) / 3;

    console.log('\n🏆 WCAG AA 合規性評分');
    console.log('=====================');
    console.log(`色彩對比度: ${contrastScore}%`);
    console.log(`Focus 可見性: ${focusScore}%`);
    console.log(`語義化色彩: ${semanticScore.toFixed(1)}%`);
    console.log(`整體分數: ${overallScore.toFixed(1)}%`);

    const grade = overallScore >= 95 ? 'A+' :
                  overallScore >= 85 ? 'A' :
                  overallScore >= 75 ? 'B+' :
                  overallScore >= 65 ? 'B' : 'C';

    console.log(`評級: ${grade}`);

    const isCompliant = overallScore >= 75 && contrastScore >= 80 && focusScore >= 80;
    console.log(`\n${isCompliant ? '✅ 符合 WCAG AA 標準！' : '⚠️ 需要進一步改善'}`);

    // 改善建議
    if (!isCompliant) {
      console.log('\n💡 改善建議:');
      if (contrastScore < 80) {
        console.log('- 提高色彩對比度至 4.5:1 (普通文字) 或 3:1 (大文字)');
      }
      if (focusScore < 80) {
        console.log('- 增強 focus 狀態的可見性');
      }
      if (semanticScore < 80) {
        console.log('- 更多使用語義化色彩類別替代硬編碼顏色');
      }
    }

    // 截圖
    await page.screenshot({
      path: 'wcag-simple-verification.png',
      fullPage: true
    });
    console.log('\n📸 已保存驗證截圖: wcag-simple-verification.png');

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤：', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

simpleWCAGTest();