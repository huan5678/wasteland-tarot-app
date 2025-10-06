const { chromium } = require('playwright');

async function testWastelandBackground() {
  console.log('🧪 測試 WastelandBackground 切換...');

  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 監聽 console 訊息
    const messages = [];
    page.on('console', msg => {
      messages.push(`${msg.type()}: ${msg.text()}`);
    });

    // 首頁測試
    console.log('📍 測試首頁背景元件...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 檢查背景元件
    const backgroundAnalysis = await page.evaluate(() => {
      // 檢查是否存在 WastelandBackground 相關的 CSS 類別
      const wastelandBg = document.querySelector('.wasteland-background');
      const pixelBlastBg = document.querySelector('.pixel-blast-background');
      const ditherBg = document.querySelector('.dither-background');

      return {
        hasWastelandBg: !!wastelandBg,
        hasPixelBlastBg: !!pixelBlastBg,
        hasDitherBg: !!ditherBg,
        wastelandClasses: wastelandBg ? wastelandBg.className : null,
        totalBackgroundElements: document.querySelectorAll('[class*="background"]').length
      };
    });

    console.log('🔍 背景元件分析結果:');
    console.log('==================');
    console.log(`WastelandBackground: ${backgroundAnalysis.hasWastelandBg ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`PixelBlastBackground: ${backgroundAnalysis.hasPixelBlastBg ? '⚠️ 仍存在' : '✅ 已移除'}`);
    console.log(`DitherBackground: ${backgroundAnalysis.hasDitherBg ? '⚠️ 仍存在' : '✅ 已移除'}`);

    if (backgroundAnalysis.wastelandClasses) {
      console.log(`WastelandBackground 類別: ${backgroundAnalysis.wastelandClasses}`);
    }

    console.log(`背景元件總數: ${backgroundAnalysis.totalBackgroundElements}`);

    // 截圖保存
    await page.screenshot({
      path: 'wasteland-bg-test.png',
      fullPage: true
    });
    console.log('📸 已保存截圖: wasteland-bg-test.png');

    // Console 錯誤檢查
    const errors = messages.filter(msg => msg.startsWith('error:'));
    const warnings = messages.filter(msg => msg.startsWith('warn:'));

    console.log('\n🔍 Console 狀態:');
    console.log(`錯誤: ${errors.length}`);
    console.log(`警告: ${warnings.length}`);

    if (errors.length > 0) {
      console.log('主要錯誤:');
      errors.slice(0, 3).forEach(error => console.log(`  ${error}`));
    }

    // 最終評估
    const success = backgroundAnalysis.hasWastelandBg && !backgroundAnalysis.hasPixelBlastBg && errors.length === 0;

    console.log('\n🎯 切換結果評估:');
    console.log('================');
    console.log(`背景元件切換: ${success ? '✅ 成功' : '❌ 需要修正'}`);
    console.log(`效能改善: ${!backgroundAnalysis.hasPixelBlastBg ? '✅ WebGL 移除' : '⚠️ 仍有 WebGL'}`);

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤：', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testWastelandBackground();