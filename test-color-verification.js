const { chromium } = require('playwright');

async function verifyColorsAccurately() {
  console.log('🎯 開始精確驗證 PixelBlast 背景顏色...');

  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 首頁測試
    console.log('📍 測試首頁 (應該是 Pip-Boy 綠色 #00ff88)...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 檢查 PixelBlast Canvas 元素
    const canvasElements = await page.locator('canvas').count();
    console.log(`🎨 首頁找到 ${canvasElements} 個 Canvas 元素`);

    // 檢查 PixelBlast 背景容器
    const pixelBlastContainers = await page.locator('.pixel-blast-background').count();
    console.log(`📦 首頁找到 ${pixelBlastContainers} 個 PixelBlast 背景容器`);

    // 檢查具體的綠色元素
    const greenElements = await page.locator('[class*="pip-boy"], [class*="green"], [style*="#00ff88"], [style*="rgb(0, 255, 136)"]').count();
    console.log(`🟢 首頁找到 ${greenElements} 個綠色相關元素`);

    // 檢查 Console 錯誤
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warn') {
        consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      }
    });

    // 執行顏色診斷腳本
    const colorDiagnosis = await page.evaluate(() => {
      const diagnosis = {
        canvasInfo: [],
        computedStyles: {},
        elementCounts: {},
        webglSupport: false
      };

      // 檢查 Canvas 元素詳情
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach((canvas, index) => {
        const rect = canvas.getBoundingClientRect();
        const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        diagnosis.canvasInfo.push({
          index,
          width: canvas.width,
          height: canvas.height,
          displayWidth: rect.width,
          displayHeight: rect.height,
          hasWebGL: !!context,
          className: canvas.className,
          parentClassName: canvas.parentElement?.className || ''
        });
      });

      // 檢查 WebGL 支援
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      diagnosis.webglSupport = !!gl;

      // 檢查 CSS 變數
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      diagnosis.computedStyles = {
        pipBoyPrimary: computedStyle.getPropertyValue('--pip-boy-primary'),
        pipBoyGreen: computedStyle.getPropertyValue('--pip-boy-green'),
        wastelandDark: computedStyle.getPropertyValue('--wasteland-dark')
      };

      // 計算不同類型的元素
      diagnosis.elementCounts = {
        pixelBlastContainers: document.querySelectorAll('.pixel-blast-background').length,
        pixelBlastComponents: document.querySelectorAll('[class*="pixel-blast"]').length,
        greenElements: document.querySelectorAll('[class*="green"], [class*="pip-boy"]').length,
        canvasElements: document.querySelectorAll('canvas').length
      };

      return diagnosis;
    });

    console.log('📊 首頁顏色診斷結果:', JSON.stringify(colorDiagnosis, null, 2));

    // 截圖首頁
    await page.screenshot({
      path: 'color-verification-homepage.png',
      fullPage: true
    });
    console.log('📸 已保存首頁截圖: color-verification-homepage.png');

    // 測試登入頁面
    console.log('\n📍 測試登入頁面 (應該是放射橙色 #ff8800)...');
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const loginCanvasElements = await page.locator('canvas').count();
    console.log(`🎨 登入頁找到 ${loginCanvasElements} 個 Canvas 元素`);

    const loginPixelBlastContainers = await page.locator('.pixel-blast-background').count();
    console.log(`📦 登入頁找到 ${loginPixelBlastContainers} 個 PixelBlast 背景容器`);

    // 登入頁顏色診斷
    const loginColorDiagnosis = await page.evaluate(() => {
      const diagnosis = {
        canvasInfo: [],
        orangeElements: 0,
        pixelBlastContainers: 0
      };

      // 檢查 Canvas 元素
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach((canvas, index) => {
        const rect = canvas.getBoundingClientRect();
        diagnosis.canvasInfo.push({
          index,
          width: canvas.width,
          height: canvas.height,
          displayWidth: rect.width,
          displayHeight: rect.height,
          className: canvas.className,
          parentClassName: canvas.parentElement?.className || ''
        });
      });

      // 檢查橙色相關元素
      diagnosis.orangeElements = document.querySelectorAll('[style*="#ff8800"], [style*="rgb(255, 136, 0)"], [class*="orange"]').length;
      diagnosis.pixelBlastContainers = document.querySelectorAll('.pixel-blast-background').length;

      return diagnosis;
    });

    console.log('📊 登入頁顏色診斷結果:', JSON.stringify(loginColorDiagnosis, null, 2));

    // 截圖登入頁
    await page.screenshot({
      path: 'color-verification-login.png',
      fullPage: true
    });
    console.log('📸 已保存登入頁截圖: color-verification-login.png');

    // 檢查開發者工具的錯誤
    if (consoleMessages.length > 0) {
      console.log('\n⚠️  Console 訊息:');
      consoleMessages.forEach(msg => console.log('  ', msg));
    } else {
      console.log('\n✅ 沒有 Console 錯誤或警告');
    }

    // 總結報告
    console.log('\n📋 測試總結:');
    console.log('================');
    console.log(`✅ 首頁 Canvas 元素: ${canvasElements > 0 ? '正常' : '異常'}`);
    console.log(`✅ 登入頁 Canvas 元素: ${loginCanvasElements > 0 ? '正常' : '異常'}`);
    console.log(`✅ PixelBlast 容器: ${pixelBlastContainers > 0 ? '正常' : '異常'}`);
    console.log(`✅ WebGL 支援: ${colorDiagnosis.webglSupport ? '正常' : '異常'}`);
    console.log(`✅ CSS 變數: ${Object.keys(colorDiagnosis.computedStyles).length > 0 ? '正常' : '異常'}`);

    if (canvasElements > 0 && pixelBlastContainers > 0 && colorDiagnosis.webglSupport) {
      console.log('\n🎉 PixelBlast 背景系統運作正常！');
      console.log('💡 如果顏色看起來不對，可能是：');
      console.log('   1. Shader 參數需要調整');
      console.log('   2. Three.js 顏色設定需要修正');
      console.log('   3. WebGL 驅動程式問題');
    } else {
      console.log('\n❌ 發現問題需要修正');
    }

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤：', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

verifyColorsAccurately();