const { chromium } = require('playwright');

async function testBorderVisibility() {
  console.log('🔍 測試邊框可見性...');

  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    console.log('📍 載入首頁檢查邊框...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 檢查邊框顏色和可見性
    const borderAnalysis = await page.evaluate(() => {
      const sections = document.querySelectorAll('section');
      const results = [];

      sections.forEach((section, index) => {
        const computedStyle = window.getComputedStyle(section);
        const borderTop = computedStyle.borderTopColor;
        const borderTopWidth = computedStyle.borderTopWidth;
        const backgroundColor = computedStyle.backgroundColor;

        // 檢查內部卡片/容器的邊框
        const cards = section.querySelectorAll('div[class*="border"]');
        const cardBorders = Array.from(cards).slice(0, 3).map(card => {
          const cardStyle = window.getComputedStyle(card);
          return {
            borderColor: cardStyle.borderColor,
            borderWidth: cardStyle.borderWidth,
            backgroundColor: cardStyle.backgroundColor
          };
        });

        results.push({
          sectionIndex: index + 1,
          borderTopColor: borderTop,
          borderTopWidth: borderTopWidth,
          backgroundColor: backgroundColor,
          cards: cardBorders
        });
      });

      return results;
    });

    console.log('\n📊 邊框可見性分析結果:');
    console.log('=========================');

    borderAnalysis.forEach(section => {
      console.log(`\n📦 Section ${section.sectionIndex}:`);
      console.log(`   頂部邊框顏色: ${section.borderTopColor}`);
      console.log(`   頂部邊框寬度: ${section.borderTopWidth}`);
      console.log(`   背景色: ${section.backgroundColor}`);

      if (section.cards.length > 0) {
        console.log(`   包含 ${section.cards.length} 個卡片:`);
        section.cards.forEach((card, index) => {
          console.log(`     卡片 ${index + 1}:`);
          console.log(`       邊框顏色: ${card.borderColor}`);
          console.log(`       邊框寬度: ${card.borderWidth}`);
          console.log(`       背景色: ${card.backgroundColor}`);
        });
      }
    });

    // 重點檢查 Features Section 和 CTA Section
    const targetSections = await page.evaluate(() => {
      const featuresSection = document.querySelector('section:has(h2)'); // 包含 "終端機功能" 的 section
      const ctaSection = document.querySelector('section:has(h2):last-of-type'); // 最後一個包含 h2 的 section

      const getColorValues = (element) => {
        const style = window.getComputedStyle(element);
        return {
          borderTopColor: style.borderTopColor,
          borderTopWidth: style.borderTopWidth,
          borderTopStyle: style.borderTopStyle
        };
      };

      return {
        features: featuresSection ? getColorValues(featuresSection) : null,
        cta: ctaSection ? getColorValues(ctaSection) : null
      };
    });

    console.log('\n🎯 關鍵 Section 邊框檢查:');
    console.log('========================');
    console.log('終端機功能 Section:');
    console.log(`  邊框顏色: ${targetSections.features?.borderTopColor || 'N/A'}`);
    console.log(`  邊框寬度: ${targetSections.features?.borderTopWidth || 'N/A'}`);
    console.log(`  邊框樣式: ${targetSections.features?.borderTopStyle || 'N/A'}`);

    console.log('\nCTA Section:');
    console.log(`  邊框顏色: ${targetSections.cta?.borderTopColor || 'N/A'}`);
    console.log(`  邊框寬度: ${targetSections.cta?.borderTopWidth || 'N/A'}`);
    console.log(`  邊框樣式: ${targetSections.cta?.borderTopStyle || 'N/A'}`);

    // 截圖比較
    await page.screenshot({
      path: 'border-visibility-test.png',
      fullPage: true
    });
    console.log('\n📸 已保存邊框測試截圖: border-visibility-test.png');

    // 檢查是否為 Pip-Boy 綠色
    const isPipBoyGreen = (colorString) => {
      return colorString.includes('rgb(0, 255, 136)') ||
             colorString.includes('#00ff88') ||
             colorString.includes('0, 255, 136');
    };

    const featuresHasGreenBorder = isPipBoyGreen(targetSections.features?.borderTopColor || '');
    const ctaHasGreenBorder = isPipBoyGreen(targetSections.cta?.borderTopColor || '');

    console.log('\n✅ 邊框顏色驗證:');
    console.log('================');
    console.log(`終端機功能 Section: ${featuresHasGreenBorder ? '✅ Pip-Boy 綠色' : '❌ 非預期顏色'}`);
    console.log(`CTA Section: ${ctaHasGreenBorder ? '✅ Pip-Boy 綠色' : '❌ 非預期顏色'}`);

    const overallSuccess = featuresHasGreenBorder && ctaHasGreenBorder;
    console.log(`\n🎯 整體結果: ${overallSuccess ? '✅ 邊框顏色修正成功' : '⚠️ 需要進一步調整'}`);

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤：', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testBorderVisibility();