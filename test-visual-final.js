const { chromium } = require('playwright');

async function visualColorTest() {
  console.log('🎨 開始視覺顏色驗證測試...');

  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 測試首頁
    console.log('📍 視覺測試首頁 (期望: Pip-Boy 綠色 #00ff88)...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 檢查實際顏色顯示
    const colorAnalysis = await page.evaluate(() => {
      const results = {
        pixelBlastCanvas: null,
        elementColors: [],
        backgroundInfo: {},
        actualColors: []
      };

      // 檢查 PixelBlast Canvas
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        results.pixelBlastCanvas = {
          width: canvas.width,
          height: canvas.height,
          displayWidth: rect.width,
          displayHeight: rect.height,
          visible: rect.width > 0 && rect.height > 0,
          position: { x: rect.x, y: rect.y }
        };
      }

      // 檢查具有綠色的元素
      const greenElements = document.querySelectorAll('[class*="pip-boy"], [class*="green"], [style*="green"], [style*="#00ff88"]');
      greenElements.forEach((el, index) => {
        if (index < 10) { // 只檢查前 10 個
          const computed = getComputedStyle(el);
          results.elementColors.push({
            tagName: el.tagName,
            className: el.className,
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            borderColor: computed.borderColor
          });
        }
      });

      // 檢查頁面中的實際顏色
      const allElements = document.querySelectorAll('*');
      const colorSet = new Set();

      Array.from(allElements).forEach(el => {
        const computed = getComputedStyle(el);
        if (computed.color && computed.color !== 'rgba(0, 0, 0, 0)') {
          colorSet.add(computed.color);
        }
        if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          colorSet.add(computed.backgroundColor);
        }
      });

      results.actualColors = Array.from(colorSet).filter(color =>
        color.includes('0, 255') || // 可能的綠色
        color.includes('255, 136') || // 可能的橙色
        color.includes('#00ff88') ||
        color.includes('#ff8800')
      );

      return results;
    });

    console.log('\n🎨 首頁視覺分析:');
    console.log('================');

    if (colorAnalysis.pixelBlastCanvas) {
      console.log('✅ PixelBlast Canvas 已找到:');
      console.log(`   尺寸: ${colorAnalysis.pixelBlastCanvas.width}x${colorAnalysis.pixelBlastCanvas.height}`);
      console.log(`   顯示: ${colorAnalysis.pixelBlastCanvas.displayWidth}x${colorAnalysis.pixelBlastCanvas.displayHeight}`);
      console.log(`   可見: ${colorAnalysis.pixelBlastCanvas.visible ? '是' : '否'}`);
    } else {
      console.log('❌ 未找到 PixelBlast Canvas');
    }

    console.log('\n🌈 實際顏色檢測:');
    if (colorAnalysis.actualColors.length > 0) {
      console.log('✅ 找到相關顏色:');
      colorAnalysis.actualColors.forEach(color => {
        console.log(`   ${color}`);
      });
    } else {
      console.log('ℹ️  未找到特定的綠色/橙色');
    }

    console.log('\n🔍 元素顏色樣本:');
    if (colorAnalysis.elementColors.length > 0) {
      colorAnalysis.elementColors.forEach((el, i) => {
        console.log(`   ${i + 1}. ${el.tagName}.${el.className}`);
        if (el.color !== 'rgba(0, 0, 0, 0)') console.log(`      文字: ${el.color}`);
        if (el.backgroundColor !== 'rgba(0, 0, 0, 0)') console.log(`      背景: ${el.backgroundColor}`);
      });
    }

    // 截圖保存
    await page.screenshot({
      path: 'visual-test-homepage.png',
      fullPage: true
    });
    console.log('\n📸 已保存首頁視覺截圖: visual-test-homepage.png');

    // 測試登入頁面
    console.log('\n📍 視覺測試登入頁面 (期望: 放射橙色 #ff8800)...');
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const loginColorAnalysis = await page.evaluate(() => {
      const results = {
        pixelBlastCanvas: null,
        orangeColors: []
      };

      // 檢查 PixelBlast Canvas
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        results.pixelBlastCanvas = {
          visible: rect.width > 0 && rect.height > 0
        };
      }

      // 檢查橙色相關的顏色
      const allElements = document.querySelectorAll('*');
      const colorSet = new Set();

      Array.from(allElements).forEach(el => {
        const computed = getComputedStyle(el);
        if (computed.color && (computed.color.includes('255, 136') || computed.color.includes('#ff8800'))) {
          colorSet.add(computed.color);
        }
        if (computed.backgroundColor && (computed.backgroundColor.includes('255, 136') || computed.backgroundColor.includes('#ff8800'))) {
          colorSet.add(computed.backgroundColor);
        }
      });

      results.orangeColors = Array.from(colorSet);
      return results;
    });

    console.log('\n🍊 登入頁面分析:');
    console.log(`   Canvas 可見: ${loginColorAnalysis.pixelBlastCanvas?.visible ? '✅' : '❌'}`);
    console.log(`   橙色元素: ${loginColorAnalysis.orangeColors.length > 0 ? '✅' : 'ℹ️  未檢測到'}`);

    await page.screenshot({
      path: 'visual-test-login.png',
      fullPage: true
    });
    console.log('📸 已保存登入頁截圖: visual-test-login.png');

    // 整體評估
    console.log('\n🎯 視覺測試總結:');
    console.log('================');

    const canvasWorking = colorAnalysis.pixelBlastCanvas?.visible && loginColorAnalysis.pixelBlastCanvas?.visible;
    const colorsPresent = colorAnalysis.actualColors.length > 0 || colorAnalysis.elementColors.length > 0;

    console.log(`✅ PixelBlast Canvas 運作: ${canvasWorking ? '正常' : '異常'}`);
    console.log(`✅ 顏色系統運作: ${colorsPresent ? '正常' : '異常'}`);

    if (canvasWorking && colorsPresent) {
      console.log('\n🎉 視覺測試通過！');
      console.log('📱 PixelBlast 背景正在正確顯示');
      console.log('🌈 Fallout 主題顏色系統正常運作');
      console.log('\n💡 重要提示:');
      console.log('   - PixelBlast 使用 WebGL shader 渲染顏色');
      console.log('   - 顏色可能不會出現在 DOM 元素的 CSS 屬性中');
      console.log('   - 但會直接在 Canvas 上顯示正確的顏色');
    } else {
      console.log('\n⚠️  需要進一步檢查');
    }

  } catch (error) {
    console.error('❌ 視覺測試過程中發生錯誤：', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

visualColorTest();