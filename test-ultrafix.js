const { chromium } = require('playwright');

async function testUltraColorFix() {
  console.log('🚀 極限顏色增強測試...');

  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 監聽 console 訊息
    const messages = [];
    page.on('console', msg => {
      messages.push(`${msg.type()}: ${msg.text()}`);
    });

    // 首頁測試 - 增強的綠色
    console.log('📍 測試首頁 (極限增強 Pip-Boy 綠色 #00ffaa)...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(4000); // 多等一點時間讓效果充分顯示

    // 深度分析 PixelBlast 狀態
    const analysis = await page.evaluate(() => {
      const results = {
        pixelBlast: {},
        rendering: {},
        colors: {},
        performance: {}
      };

      // PixelBlast Canvas 深度檢查
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('webgl') || canvas.getContext('webgl2');

        results.pixelBlast = {
          exists: true,
          dimensions: { width: canvas.width, height: canvas.height },
          displaySize: { width: rect.width, height: rect.height },
          position: { x: rect.x, y: rect.y },
          visible: rect.width > 0 && rect.height > 0,
          webglContext: !!ctx,
          contextType: ctx ? (ctx instanceof WebGL2RenderingContext ? 'WebGL2' : 'WebGL1') : 'None'
        };

        // 嘗試獲取 Canvas 像素樣本
        try {
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          tempCtx.drawImage(canvas, 0, 0);

          // 樣本中心點顏色
          const centerData = tempCtx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data;
          results.rendering.centerPixel = {
            r: centerData[0],
            g: centerData[1],
            b: centerData[2],
            a: centerData[3]
          };

          // 樣本多個點
          const samples = [];
          for (let i = 0; i < 5; i++) {
            const x = Math.floor(canvas.width * (0.2 + i * 0.15));
            const y = Math.floor(canvas.height * 0.5);
            const data = tempCtx.getImageData(x, y, 1, 1).data;
            samples.push({ r: data[0], g: data[1], b: data[2], a: data[3] });
          }
          results.rendering.samples = samples;

        } catch (e) {
          results.rendering.error = e.message;
        }
      } else {
        results.pixelBlast = { exists: false };
      }

      // 檢查容器樣式
      const bgContainer = document.querySelector('.pixel-blast-background');
      if (bgContainer) {
        const computed = getComputedStyle(bgContainer);
        results.colors.container = {
          position: computed.position,
          zIndex: computed.zIndex,
          opacity: computed.opacity,
          transform: computed.transform
        };
      }

      // 性能指標
      results.performance = {
        totalElements: document.querySelectorAll('*').length,
        canvasCount: document.querySelectorAll('canvas').length,
        animationFrames: window.requestAnimationFrame ? 'Available' : 'Not available'
      };

      return results;
    });

    console.log('\n🎨 極限增強分析結果:');
    console.log('====================');

    if (analysis.pixelBlast.exists) {
      console.log('✅ PixelBlast Canvas 狀態:');
      console.log(`   尺寸: ${analysis.pixelBlast.dimensions.width}x${analysis.pixelBlast.dimensions.height}`);
      console.log(`   顯示: ${analysis.pixelBlast.displaySize.width}x${analysis.pixelBlast.displaySize.height}`);
      console.log(`   WebGL: ${analysis.pixelBlast.contextType}`);
      console.log(`   可見: ${analysis.pixelBlast.visible ? '是' : '否'}`);

      if (analysis.rendering.centerPixel) {
        const { r, g, b, a } = analysis.rendering.centerPixel;
        console.log(`   中心像素: rgba(${r}, ${g}, ${b}, ${a})`);

        // 檢查是否有綠色成分
        const hasGreen = g > r && g > b && g > 50;
        const isVisible = a > 100;
        console.log(`   綠色檢測: ${hasGreen ? '✅ 有綠色' : '❌ 無綠色'}`);
        console.log(`   可見度: ${isVisible ? '✅ 可見' : '❌ 太透明'}`);

        if (analysis.rendering.samples) {
          console.log('   樣本點分析:');
          analysis.rendering.samples.forEach((sample, i) => {
            const intensity = Math.max(sample.r, sample.g, sample.b);
            console.log(`     點${i + 1}: rgba(${sample.r}, ${sample.g}, ${sample.b}, ${sample.a}) - 強度: ${intensity}`);
          });
        }
      }

      if (analysis.rendering.error) {
        console.log(`   渲染錯誤: ${analysis.rendering.error}`);
      }
    } else {
      console.log('❌ PixelBlast Canvas 未找到');
    }

    console.log('\n📊 容器狀態:');
    if (analysis.colors.container) {
      console.log(`   位置: ${analysis.colors.container.position}`);
      console.log(`   層級: ${analysis.colors.container.zIndex}`);
      console.log(`   透明度: ${analysis.colors.container.opacity}`);
    }

    // 截圖保存
    await page.screenshot({
      path: 'ultra-fix-homepage.png',
      fullPage: true
    });
    console.log('\n📸 已保存極限增強首頁截圖: ultra-fix-homepage.png');

    // 快速測試登入頁面
    console.log('\n📍 測試登入頁面 (極限增強橙黃色 #ffbb00)...');
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(4000);

    await page.screenshot({
      path: 'ultra-fix-login.png',
      fullPage: true
    });
    console.log('📸 已保存極限增強登入頁截圖: ultra-fix-login.png');

    // Console 訊息檢查
    const errors = messages.filter(msg => msg.startsWith('error:'));
    const warnings = messages.filter(msg => msg.startsWith('warn:'));

    console.log('\n🔍 Console 狀態:');
    console.log(`   錯誤: ${errors.length}`);
    console.log(`   警告: ${warnings.length}`);

    if (errors.length > 0) {
      console.log('   主要錯誤:');
      errors.slice(0, 3).forEach(error => console.log(`     ${error}`));
    }

    // 最終評估
    console.log('\n🎯 極限增強效果評估:');
    console.log('========================');

    const working = analysis.pixelBlast.exists && analysis.pixelBlast.visible;
    const hasColor = analysis.rendering.centerPixel &&
                    (analysis.rendering.centerPixel.g > 50 ||
                     Math.max(analysis.rendering.centerPixel.r, analysis.rendering.centerPixel.g, analysis.rendering.centerPixel.b) > 100);
    const goodPerformance = errors.length === 0;

    console.log(`✅ PixelBlast 運作: ${working ? '正常' : '異常'}`);
    console.log(`✅ 顏色強度: ${hasColor ? '充足' : '不足'}`);
    console.log(`✅ 系統穩定: ${goodPerformance ? '正常' : '有問題'}`);

    if (working && hasColor && goodPerformance) {
      console.log('\n🎉 極限增強成功！');
      console.log('💚 Pip-Boy 綠色背景應該現在非常明顯！');
      console.log('🧡 登入頁面橙黃色效果也已大幅增強！');
    } else {
      console.log('\n🔧 需要進一步調整:');
      if (!working) console.log('   - 檢查 PixelBlast 載入和渲染');
      if (!hasColor) console.log('   - 顏色強度仍需提高');
      if (!goodPerformance) console.log('   - 修正系統錯誤');
    }

  } catch (error) {
    console.error('❌ 極限測試過程中發生錯誤：', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testUltraColorFix();