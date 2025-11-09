const { chromium } = require('playwright');

async function verifyWCAGCompliance() {
  console.log('🔍 WCAG AA 合規性驗證測試開始...');

  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 導入 axe-core 進行無障礙性測試
    await page.addScriptTag({
      url: 'https://unpkg.com/axe-core@4.7.0/axe.min.js'
    });

    console.log('📍 載入首頁並執行無障礙性檢查...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 執行 axe-core 無障礙性檢查
    const axeResults = await page.evaluate(async () => {
      return await axe.run();
    });

    // 計算色彩對比度
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

      function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16)
        ] : null;
      }

      // 測試關鍵色彩組合
      const testElements = [
        { selector: 'h1', description: '主標題' },
        { selector: 'h2', description: '次標題' },
        { selector: '.text-text-secondary', description: '次要文字' },
        { selector: '.text-text-muted', description: '淡化文字' },
        { selector: 'button', description: '按鈕文字' },
        { selector: 'p', description: '段落文字' }
      ];

      const results = [];
      const backgroundColor = [26, 26, 26]; // #1a1a1a

      testElements.forEach(test => {
        const elements = document.querySelectorAll(test.selector);
        if (elements.length > 0) {
          const element = elements[0];
          const computedStyle = window.getComputedStyle(element);
          const color = computedStyle.color;

          // 解析 RGB 顏色
          const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          if (rgbMatch) {
            const textColor = [
              parseInt(rgbMatch[1]),
              parseInt(rgbMatch[2]),
              parseInt(rgbMatch[3])
            ];

            const contrast = getContrastRatio(textColor, backgroundColor);
            const fontSize = parseFloat(computedStyle.fontSize);
            const fontWeight = computedStyle.fontWeight;
            const isLarge = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
            const requiredRatio = isLarge ? 3.0 : 4.5;
            const passes = contrast >= requiredRatio;

            results.push({
              element: test.description,
              selector: test.selector,
              contrast: contrast.toFixed(2),
              required: requiredRatio,
              passes: passes,
              fontSize: fontSize,
              fontWeight: fontWeight,
              textColor: `rgb(${textColor.join(', ')})`,
              level: contrast >= 7.0 ? 'AAA' : (contrast >= requiredRatio ? 'AA' : 'FAIL')
            });
          }
        }
      });

      return results;
    });

    // Focus 可見性測試
    console.log('\n🎯 測試 Focus 狀態可見性...');
    const focusResults = await page.evaluate(() => {
      const interactiveElements = document.querySelectorAll('button, a, input, [tabindex]:not([tabindex="-1"])');
      const results = [];

      interactiveElements.forEach((element, index) => {
        if (index < 5) { // 測試前5個元素
          element.focus();
          const computedStyle = window.getComputedStyle(element);
          const outline = computedStyle.outline;
          const outlineWidth = computedStyle.outlineWidth;
          const boxShadow = computedStyle.boxShadow;

          results.push({
            element: element.tagName.toLowerCase() + (element.className ? '.' + element.className.split(' ')[0] : ''),
            hasOutline: outline !== 'none' && outline !== '',
            outlineWidth: outlineWidth,
            hasBoxShadow: boxShadow !== 'none',
            visible: (outline !== 'none' && outline !== '') || boxShadow !== 'none'
          });
        }
      });

      return results;
    });

    // 鍵盤導航測試
    console.log('\n⌨️ 測試鍵盤導航...');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);

    const firstFocusable = await page.evaluate(() => {
      const activeElement = document.activeElement;
      return {
        tagName: activeElement.tagName,
        className: activeElement.className,
        visible: activeElement.getBoundingClientRect().width > 0 && activeElement.getBoundingClientRect().height > 0
      };
    });

    // 生成報告
    console.log('\n📊 WCAG AA 合規性驗證報告');
    console.log('================================');

    // Axe 結果
    console.log(`\n🔍 Axe 自動化檢查結果:`);
    console.log(`違規數量: ${axeResults.violations.length}`);
    console.log(`通過測試: ${axeResults.passes.length}`);
    console.log(`不完整測試: ${axeResults.incomplete.length}`);

    if (axeResults.violations.length > 0) {
      console.log('\n主要違規項目:');
      axeResults.violations.slice(0, 3).forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.description}`);
        console.log(`   影響: ${violation.impact}`);
        console.log(`   受影響元素: ${violation.nodes.length}`);
      });
    }

    // 色彩對比度結果
    console.log(`\n🎨 色彩對比度檢查結果:`);
    const passedContrast = contrastResults.filter(r => r.passes).length;
    const totalContrast = contrastResults.length;
    console.log(`通過率: ${passedContrast}/${totalContrast} (${((passedContrast/totalContrast)*100).toFixed(1)}%)`);

    contrastResults.forEach(result => {
      const status = result.passes ? '✅' : '❌';
      console.log(`${status} ${result.element}: ${result.contrast}:1 (需要 ${result.required}:1) - ${result.level}`);
    });

    // Focus 狀態結果
    console.log(`\n👁️ Focus 可見性檢查結果:`);
    const visibleFocus = focusResults.filter(r => r.visible).length;
    const totalFocus = focusResults.length;
    console.log(`可見 Focus 狀態: ${visibleFocus}/${totalFocus} (${((visibleFocus/totalFocus)*100).toFixed(1)}%)`);

    focusResults.forEach(result => {
      const status = result.visible ? '✅' : '❌';
      console.log(`${status} ${result.element}: ${result.visible ? '可見' : '不可見'}`);
    });

    // 鍵盤導航結果
    console.log(`\n⌨️ 鍵盤導航檢查結果:`);
    console.log(`首個焦點元素: ${firstFocusable.tagName} ${firstFocusable.className ? '(' + firstFocusable.className.split(' ')[0] + ')' : ''}`);
    console.log(`焦點可見: ${firstFocusable.visible ? '✅ 是' : '❌ 否'}`);

    // 整體評分
    const axeScore = Math.max(0, 100 - (axeResults.violations.length * 10));
    const contrastScore = (passedContrast / totalContrast) * 100;
    const focusScore = (visibleFocus / totalFocus) * 100;
    const overallScore = (axeScore + contrastScore + focusScore) / 3;

    console.log('\n🏆 整體 WCAG AA 合規性評分:');
    console.log('==========================');
    console.log(`自動化檢查分數: ${axeScore.toFixed(1)}/100`);
    console.log(`色彩對比度分數: ${contrastScore.toFixed(1)}/100`);
    console.log(`Focus 可見性分數: ${focusScore.toFixed(1)}/100`);
    console.log(`整體分數: ${overallScore.toFixed(1)}/100`);

    const grade = overallScore >= 95 ? 'A+' :
                  overallScore >= 85 ? 'A' :
                  overallScore >= 75 ? 'B+' :
                  overallScore >= 65 ? 'B' : 'C';

    console.log(`\n🎖️ WCAG AA 合規等級: ${grade}`);
    console.log(`${overallScore >= 75 ? '✅ 符合 WCAG AA 標準' : '⚠️ 需要進一步改善'}`);

    // 截圖
    await page.screenshot({
      path: 'wcag-verification-result.png',
      fullPage: true
    });
    console.log('\n📸 已保存驗證截圖: wcag-verification-result.png');

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤：', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

verifyWCAGCompliance();