const { chromium } = require('playwright');

async function finalColorTest() {
  console.log('🔍 開始最終顏色驗證測試...');

  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 監聽 console 訊息
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    // 首頁測試
    console.log('📍 測試首頁 PixelBlast 顏色...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 執行完整的顏色和 WebGL 診斷
    const diagnosis = await page.evaluate(() => {
      const result = {
        cssVariables: {},
        canvasInfo: [],
        webglStatus: {},
        pixelBlastStatus: {},
        colorElements: {}
      };

      // 檢查正確的 CSS 變數
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);

      const variablesToCheck = [
        'color-pip-boy-green',
        'color-pip-boy-green-dark',
        'color-radiation-orange',
        'color-wasteland-dark',
        'color-bg-primary',
        'color-text-primary'
      ];

      variablesToCheck.forEach(varName => {
        const value = computedStyle.getPropertyValue(`--${varName}`).trim();
        result.cssVariables[varName] = value || 'NOT_FOUND';
      });

      // 檢查 Canvas 和 WebGL 狀態
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach((canvas, index) => {
        const rect = canvas.getBoundingClientRect();
        let glContext = null;
        let webglInfo = {};

        try {
          // 嘗試獲取 WebGL context 資訊（不會創建新的 context）
          const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
          if (gl) {
            webglInfo = {
              version: gl.getParameter(gl.VERSION),
              vendor: gl.getParameter(gl.VENDOR),
              renderer: gl.getParameter(gl.RENDERER),
              extensions: gl.getSupportedExtensions()?.slice(0, 5) // 只取前 5 個
            };
          }
        } catch (e) {
          webglInfo.error = e.message;
        }

        result.canvasInfo.push({
          index,
          width: canvas.width,
          height: canvas.height,
          displayWidth: rect.width,
          displayHeight: rect.height,
          visible: rect.width > 0 && rect.height > 0,
          className: canvas.className,
          parentElement: canvas.parentElement?.className || '',
          webgl: webglInfo
        });
      });

      // 檢查 PixelBlast 相關元素
      result.pixelBlastStatus = {
        containers: document.querySelectorAll('.pixel-blast-background').length,
        components: document.querySelectorAll('[class*="pixel-blast"]').length,
        canvases: document.querySelectorAll('canvas').length
      };

      // 檢查顏色相關元素
      result.colorElements = {
        pipBoyGreen: document.querySelectorAll('[class*="pip-boy-green"], [style*="#00ff88"]').length,
        radiationOrange: document.querySelectorAll('[class*="radiation-orange"], [style*="#ff8800"]').length,
        anyGreen: document.querySelectorAll('[class*="green"]').length,
        anyOrange: document.querySelectorAll('[class*="orange"]').length
      };

      // 測試 WebGL 支援
      try {
        const testCanvas = document.createElement('canvas');
        const testGl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
        result.webglStatus = {
          supported: !!testGl,
          version: testGl ? (testGl instanceof WebGL2RenderingContext ? 'WebGL2' : 'WebGL1') : 'None'
        };
      } catch (e) {
        result.webglStatus = { supported: false, error: e.message };
      }

      return result;
    });

    console.log('\n📊 首頁診斷結果:');
    console.log('================');

    console.log('\n🎨 CSS 變數檢查:');
    Object.entries(diagnosis.cssVariables).forEach(([key, value]) => {
      const status = value !== 'NOT_FOUND' ? '✅' : '❌';
      console.log(`  ${status} --${key}: ${value}`);
    });

    console.log('\n🖼️  Canvas 檢查:');
    diagnosis.canvasInfo.forEach((canvas, i) => {
      console.log(`  Canvas ${i}:`);
      console.log(`    尺寸: ${canvas.width}x${canvas.height} (顯示: ${canvas.displayWidth}x${canvas.displayHeight})`);
      console.log(`    可見: ${canvas.visible ? '✅' : '❌'}`);
      console.log(`    WebGL: ${canvas.webgl.version || '❌'}`);
      if (canvas.webgl.error) {
        console.log(`    錯誤: ${canvas.webgl.error}`);
      }
    });

    console.log('\n⚡ WebGL 狀態:');
    console.log(`  支援: ${diagnosis.webglStatus.supported ? '✅' : '❌'} (${diagnosis.webglStatus.version})`);

    console.log('\n🎯 PixelBlast 狀態:');
    console.log(`  背景容器: ${diagnosis.pixelBlastStatus.containers}`);
    console.log(`  PixelBlast 元件: ${diagnosis.pixelBlastStatus.components}`);
    console.log(`  Canvas 元素: ${diagnosis.pixelBlastStatus.canvases}`);

    console.log('\n🌈 顏色元素統計:');
    console.log(`  Pip-Boy 綠色元素: ${diagnosis.colorElements.pipBoyGreen}`);
    console.log(`  放射橙色元素: ${diagnosis.colorElements.radiationOrange}`);
    console.log(`  所有綠色元素: ${diagnosis.colorElements.anyGreen}`);
    console.log(`  所有橙色元素: ${diagnosis.colorElements.anyOrange}`);

    // 截圖首頁
    await page.screenshot({
      path: 'final-color-test-homepage.png',
      fullPage: true
    });
    console.log('\n📸 已保存首頁截圖: final-color-test-homepage.png');

    // 測試登入頁面
    console.log('\n📍 測試登入頁面...');
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const loginDiagnosis = await page.evaluate(() => {
      const result = {
        canvases: document.querySelectorAll('canvas').length,
        pixelBlastContainers: document.querySelectorAll('.pixel-blast-background').length,
        orangeElements: document.querySelectorAll('[class*="orange"], [style*="#ff8800"]').length
      };
      return result;
    });

    console.log('\n📊 登入頁面診斷:');
    console.log(`  Canvas 元素: ${loginDiagnosis.canvases}`);
    console.log(`  PixelBlast 容器: ${loginDiagnosis.pixelBlastContainers}`);
    console.log(`  橙色元素: ${loginDiagnosis.orangeElements}`);

    // 截圖登入頁
    await page.screenshot({
      path: 'final-color-test-login.png',
      fullPage: true
    });
    console.log('📸 已保存登入頁截圖: final-color-test-login.png');

    // 檢查 Console 訊息
    const errors = consoleMessages.filter(msg => msg.startsWith('error:'));
    const warnings = consoleMessages.filter(msg => msg.startsWith('warn:'));

    console.log('\n🔍 Console 狀態:');
    if (errors.length > 0) {
      console.log('❌ 錯誤訊息:');
      errors.forEach(error => console.log(`   ${error}`));
    }
    if (warnings.length > 0) {
      console.log('⚠️  警告訊息:');
      warnings.forEach(warning => console.log(`   ${warning}`));
    }
    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ 沒有錯誤或警告');
    }

    // 總結
    console.log('\n🎯 測試總結:');
    console.log('================');

    const allCSSVarsFound = Object.values(diagnosis.cssVariables).every(v => v !== 'NOT_FOUND');
    const webglWorking = diagnosis.webglStatus.supported && diagnosis.canvasInfo.length > 0;
    const pixelBlastWorking = diagnosis.pixelBlastStatus.containers > 0 && diagnosis.pixelBlastStatus.canvases > 0;
    const colorsPresent = diagnosis.colorElements.pipBoyGreen > 0;
    const noWebGLErrors = !errors.some(e => e.includes('WebGL'));

    console.log(`✅ CSS 變數載入: ${allCSSVarsFound ? '正常' : '異常'}`);
    console.log(`✅ WebGL 支援: ${webglWorking ? '正常' : '異常'}`);
    console.log(`✅ PixelBlast 運作: ${pixelBlastWorking ? '正常' : '異常'}`);
    console.log(`✅ 顏色顯示: ${colorsPresent ? '正常' : '異常'}`);
    console.log(`✅ WebGL 錯誤: ${noWebGLErrors ? '無' : '有錯誤'}`);

    if (allCSSVarsFound && webglWorking && pixelBlastWorking && colorsPresent && noWebGLErrors) {
      console.log('\n🎉 所有測試通過！PixelBlast 背景顏色系統正常運作！');
    } else {
      console.log('\n⚠️  發現需要修正的問題，請檢查上述診斷結果');
    }

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤：', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

finalColorTest();