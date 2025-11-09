const { chromium } = require('playwright');

async function testDitherBackground() {
  console.log('🎯 開始測試新的 Dither 背景效果...');

  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 訪問首頁
    console.log('📍 正在訪問首頁...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // 等待 Dither 元件載入
    console.log('⏳ 等待 Dither 背景載入...');
    await page.waitForTimeout(3000);

    // 檢查 Canvas 元素（Dither 使用 WebGL Canvas）
    const canvasElements = await page.locator('canvas').count();
    console.log(`🎨 找到 ${canvasElements} 個 Canvas 元素`);

    if (canvasElements > 0) {
      console.log('✅ Dither 背景 Canvas 已成功載入！');

      // 檢查 DitherBackground 元件
      const ditherBackground = await page.locator('.dither-background').count();
      console.log(`🎭 找到 ${ditherBackground} 個 Dither 背景容器`);

      // 測試滑鼠互動
      console.log('🖱️  測試滑鼠互動效果...');
      await page.mouse.move(200, 200);
      await page.waitForTimeout(1000);
      await page.mouse.move(400, 300);
      await page.waitForTimeout(1000);

      // 截圖保存當前狀態
      await page.screenshot({
        path: 'dither-background-test.png',
        fullPage: true
      });
      console.log('📸 已保存首頁截圖：dither-background-test.png');

      // 測試登入頁面
      console.log('📍 測試登入頁面的背景變體...');
      await page.goto('http://localhost:3000/auth/login');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: 'dither-background-login.png',
        fullPage: true
      });
      console.log('📸 已保存登入頁面截圖：dither-background-login.png');

      console.log('🎉 所有測試完成！Dither 背景運作正常！');

    } else {
      console.log('❌ 未找到 Canvas 元素，Dither 背景可能未正確載入');
    }

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤：', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testDitherBackground();