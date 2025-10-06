const { chromium } = require('playwright');

async function testFinalColorFix() {
  console.log('🎯 最終顏色修正測試...');

  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 監聽 console 錯誤
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // 首頁測試
    console.log('📍 測試首頁 (增強的 Pip-Boy 綠色)...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 全面分析顏色和樣式
    const homepageAnalysis = await page.evaluate(() => {
      const results = {
        pixelBlast: {},
        backgroundColors: [],
        textColors: [],
        borderColors: [],
        computedStyles: {},
        elementCounts: {}
      };

      // PixelBlast Canvas 檢查
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        results.pixelBlast = {
          exists: true,
          width: canvas.width,
          height: canvas.height,
          displayWidth: rect.width,
          displayHeight: rect.height,
          visible: rect.width > 0 && rect.height > 0
        };
      } else {
        results.pixelBlast = { exists: false };
      }

      // 收集所有背景顏色
      const allElements = document.querySelectorAll('*');
      const bgColors = new Set();
      const textColors = new Set();
      const borderColors = new Set();

      Array.from(allElements).forEach(el => {
        const computed = getComputedStyle(el);

        if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          bgColors.add(computed.backgroundColor);
        }

        if (computed.color && computed.color !== 'rgba(0, 0, 0, 0)') {
          textColors.add(computed.color);
        }

        if (computed.borderColor && computed.borderColor !== 'rgba(0, 0, 0, 0)') {
          borderColors.add(computed.borderColor);
        }
      });

      results.backgroundColors = Array.from(bgColors);
      results.textColors = Array.from(textColors);
      results.borderColors = Array.from(borderColors);

      // 檢查特定元素的樣式
      const body = document.body;
      const header = document.querySelector('header');
      const footer = document.querySelector('footer');

      results.computedStyles = {
        body: body ? {
          backgroundColor: getComputedStyle(body).backgroundColor,
          color: getComputedStyle(body).color
        } : null,
        header: header ? {
          backgroundColor: getComputedStyle(header).backgroundColor,
          borderColor: getComputedStyle(header).borderBottomColor
        } : null,
        footer: footer ? {
          backgroundColor: getComputedStyle(footer).backgroundColor,
          borderColor: getComputedStyle(footer).borderTopColor
        } : null
      };

      // 計算各種元素
      results.elementCounts = {
        totalElements: allElements.length,
        pipBoyElements: document.querySelectorAll('[class*="pip-boy"]').length,
        wastelandElements: document.querySelectorAll('[class*="wasteland"]').length,
        greenElements: Array.from(allElements).filter(el => {
          const computed = getComputedStyle(el);
          return computed.color.includes('0, 255') ||
                 computed.backgroundColor.includes('0, 255') ||
                 computed.borderColor.includes('0, 255');
        }).length
      };

      return results;
    });

    console.log('\n🎨 首頁分析結果:');
    console.log('================');

    console.log('\n📺 PixelBlast 狀態:');
    if (homepageAnalysis.pixelBlast.exists) {
      console.log(`✅ Canvas 存在: ${homepageAnalysis.pixelBlast.width}x${homepageAnalysis.pixelBlast.height}`);
      console.log(`✅ 顯示尺寸: ${homepageAnalysis.pixelBlast.displayWidth}x${homepageAnalysis.pixelBlast.displayHeight}`);
      console.log(`✅ 可見性: ${homepageAnalysis.pixelBlast.visible ? '正常' : '異常'}`);
    } else {
      console.log('❌ PixelBlast Canvas 未找到');
    }

    console.log('\n🎭 元素計數:');
    console.log(`  總元素: ${homepageAnalysis.elementCounts.totalElements}`);
    console.log(`  Pip-Boy 元素: ${homepageAnalysis.elementCounts.pipBoyElements}`);
    console.log(`  Wasteland 元素: ${homepageAnalysis.elementCounts.wastelandElements}`);
    console.log(`  綠色元素: ${homepageAnalysis.elementCounts.greenElements}`);

    console.log('\n🎨 關鍵元素樣式:');
    if (homepageAnalysis.computedStyles.body) {
      console.log(`  Body 背景: ${homepageAnalysis.computedStyles.body.backgroundColor}`);
      console.log(`  Body 文字: ${homepageAnalysis.computedStyles.body.color}`);
    }
    if (homepageAnalysis.computedStyles.header) {
      console.log(`  Header 背景: ${homepageAnalysis.computedStyles.header.backgroundColor}`);
      console.log(`  Header 邊框: ${homepageAnalysis.computedStyles.header.borderColor}`);
    }

    console.log('\n🌈 實際顏色分析:');
    const greenColors = homepageAnalysis.textColors.filter(color =>
      color.includes('0, 255') || color.includes('#00ff')
    );
    const darkColors = homepageAnalysis.backgroundColors.filter(color =>
      color.includes('26, 26, 26') || color.includes('rgb(26, 26, 26)')
    );

    console.log(`  綠色文字: ${greenColors.length > 0 ? '✅ ' + greenColors.slice(0, 3).join(', ') : '❌ 未找到'}`);
    console.log(`  深色背景: ${darkColors.length > 0 ? '✅ ' + darkColors.slice(0, 2).join(', ') : '❌ 未找到'}`);

    // 截圖保存
    await page.screenshot({
      path: 'final-fix-homepage.png',
      fullPage: true
    });
    console.log('\n📸 已保存首頁截圖: final-fix-homepage.png');

    // 測試登入頁面
    console.log('\n📍 測試登入頁面 (增強的橙色)...');
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const loginAnalysis = await page.evaluate(() => {
      const results = {
        pixelBlast: {},
        orangeElements: 0
      };

      // PixelBlast Canvas 檢查
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        results.pixelBlast = {
          exists: true,
          visible: rect.width > 0 && rect.height > 0
        };
      }

      // 檢查橙色元素
      const allElements = document.querySelectorAll('*');
      results.orangeElements = Array.from(allElements).filter(el => {
        const computed = getComputedStyle(el);
        return computed.color.includes('255, 136') ||
               computed.backgroundColor.includes('255, 136') ||
               computed.color.includes('255, 153') ||
               computed.backgroundColor.includes('255, 153');
      }).length;

      return results;
    });

    console.log('\n🍊 登入頁面分析:');
    console.log(`  PixelBlast Canvas: ${loginAnalysis.pixelBlast.exists ? '✅' : '❌'}`);
    console.log(`  Canvas 可見: ${loginAnalysis.pixelBlast.visible ? '✅' : '❌'}`);
    console.log(`  橙色元素: ${loginAnalysis.orangeElements}`);

    await page.screenshot({
      path: 'final-fix-login.png',
      fullPage: true
    });
    console.log('📸 已保存登入頁截圖: final-fix-login.png');

    // 錯誤檢查
    console.log('\n🚨 錯誤檢查:');
    if (errors.length > 0) {
      console.log('❌ 發現錯誤:');
      errors.forEach(error => console.log(`   ${error}`));
    } else {
      console.log('✅ 沒有 Console 錯誤');
    }

    // 總結評估
    console.log('\n🎯 修正效果評估:');
    console.log('==================');

    const pixelBlastWorking = homepageAnalysis.pixelBlast.exists && homepageAnalysis.pixelBlast.visible;
    const colorsPresent = homepageAnalysis.elementCounts.greenElements > 0;
    const stylesApplied = homepageAnalysis.elementCounts.pipBoyElements > 0;
    const noErrors = errors.length === 0;

    console.log(`✅ PixelBlast 背景: ${pixelBlastWorking ? '正常運作' : '需要修正'}`);
    console.log(`✅ 顏色顯示: ${colorsPresent ? '正常顯示' : '需要修正'}`);
    console.log(`✅ 樣式套用: ${stylesApplied ? '正常套用' : '需要修正'}`);
    console.log(`✅ 錯誤狀態: ${noErrors ? '無錯誤' : '有錯誤'}`);

    if (pixelBlastWorking && colorsPresent && stylesApplied && noErrors) {
      console.log('\n🎉 顏色修正成功！');
      console.log('📱 Fallout 主題 PixelBlast 背景正常顯示');
      console.log('🌈 Pip-Boy 綠色和放射橙色效果已啟用');
    } else {
      console.log('\n⚠️  還需要進一步修正');

      if (!pixelBlastWorking) console.log('💡 建議: 檢查 PixelBlast 元件載入');
      if (!colorsPresent) console.log('💡 建議: 檢查顏色配置和 CSS 變數');
      if (!stylesApplied) console.log('💡 建議: 檢查 Tailwind 類別配置');
      if (!noErrors) console.log('💡 建議: 修正 Console 錯誤');
    }

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤：', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testFinalColorFix();