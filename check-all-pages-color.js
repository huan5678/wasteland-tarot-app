const { chromium } = require('playwright');

async function checkAllPagesColor() {
  console.log('🔍 檢查所有頁面的色彩與對比度...');

  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 定義要檢查的頁面路由
    const pagesToCheck = [
      { url: 'http://localhost:3001/', name: '首頁' },
      { url: 'http://localhost:3001/auth/login', name: '登入頁面' },
      { url: 'http://localhost:3001/auth/register', name: '註冊頁面' },
      { url: 'http://localhost:3001/cards', name: '卡牌頁面' },
      { url: 'http://localhost:3001/dashboard', name: '儀表板' },
      { url: 'http://localhost:3001/readings', name: '占卜記錄' },
      { url: 'http://localhost:3001/readings/new', name: '新占卜' },
      { url: 'http://localhost:3001/profile', name: '個人檔案' }
    ];

    const allResults = [];

    for (const pageInfo of pagesToCheck) {
      console.log(`\n📍 檢查 ${pageInfo.name} (${pageInfo.url})`);
      console.log('=' .repeat(50));

      try {
        await page.goto(pageInfo.url, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(2000);

        // 檢查頁面色彩對比度
        const colorAnalysis = await page.evaluate(() => {
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

          // 檢查各種元素類型
          const elements = [
            { selector: 'h1', type: '主標題' },
            { selector: 'h2', type: '次標題' },
            { selector: 'h3', type: '小標題' },
            { selector: 'p', type: '段落文字' },
            { selector: 'button', type: '按鈕' },
            { selector: 'input', type: '輸入框' },
            { selector: 'label', type: '標籤' },
            { selector: 'a', type: '連結' },
            { selector: '.text-text-secondary', type: '次要文字' },
            { selector: '.text-text-muted', type: '淡化文字' },
            { selector: '.text-pip-boy-green', type: 'Pip-Boy綠色文字' }
          ];

          const results = [];
          const backgroundColor = [26, 26, 26]; // #1a1a1a

          elements.forEach(test => {
            const element = document.querySelector(test.selector);
            if (element) {
              const computedStyle = window.getComputedStyle(element);
              const color = computedStyle.color;
              const bgColor = computedStyle.backgroundColor;
              const textColor = parseRgb(color);

              if (textColor) {
                const contrast = getContrastRatio(textColor, backgroundColor);
                const fontSize = parseFloat(computedStyle.fontSize);
                const fontWeight = computedStyle.fontWeight;
                const isLarge = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
                const requiredRatio = isLarge ? 3.0 : 4.5;
                const passes = contrast >= requiredRatio;

                results.push({
                  type: test.type,
                  selector: test.selector,
                  contrast: contrast.toFixed(2),
                  required: requiredRatio,
                  passes: passes,
                  level: contrast >= 7.0 ? 'AAA' : (contrast >= requiredRatio ? 'AA' : 'FAIL'),
                  textColor: color,
                  backgroundColor: bgColor,
                  fontSize: fontSize,
                  visible: element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0
                });
              }
            }
          });

          // 檢查邊框顏色
          const borderElements = document.querySelectorAll('[class*="border"]');
          const borderInfo = Array.from(borderElements).slice(0, 5).map(el => {
            const style = window.getComputedStyle(el);
            return {
              borderColor: style.borderColor,
              borderWidth: style.borderWidth,
              borderStyle: style.borderStyle,
              className: el.className
            };
          });

          // 檢查背景色彩使用
          const backgroundElements = document.querySelectorAll('[style*="background"]');
          const backgroundInfo = Array.from(backgroundElements).slice(0, 3).map(el => {
            const style = window.getComputedStyle(el);
            return {
              backgroundColor: style.backgroundColor,
              className: el.className
            };
          });

          return {
            textElements: results,
            borderElements: borderInfo,
            backgroundElements: backgroundInfo,
            pageTitle: document.title || 'Unknown',
            totalElements: results.length
          };
        });

        // 檢查是否有錯誤訊息或問題
        const pageErrors = await page.evaluate(() => {
          const errors = [];

          // 檢查是否有404或錯誤頁面
          if (document.body.innerText.includes('404') ||
              document.body.innerText.includes('Page not found') ||
              document.body.innerText.includes('Error')) {
            errors.push('頁面可能包含錯誤訊息');
          }

          // 檢查是否有隱藏內容或載入問題
          const visibleElements = Array.from(document.querySelectorAll('*')).filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          });

          return {
            errors: errors,
            visibleElementCount: visibleElements.length,
            hasContent: document.body.innerText.trim().length > 0
          };
        });

        const pageResult = {
          name: pageInfo.name,
          url: pageInfo.url,
          analysis: colorAnalysis,
          errors: pageErrors,
          timestamp: new Date().toISOString()
        };

        allResults.push(pageResult);

        // 顯示此頁面的摘要
        const passedElements = colorAnalysis.textElements.filter(el => el.passes).length;
        const totalElements = colorAnalysis.textElements.length;
        const passRate = totalElements > 0 ? ((passedElements / totalElements) * 100).toFixed(1) : 'N/A';

        console.log(`📊 ${pageInfo.name} 分析結果:`);
        console.log(`   文字元素: ${totalElements} 個`);
        console.log(`   對比度通過: ${passedElements}/${totalElements} (${passRate}%)`);
        console.log(`   邊框元素: ${colorAnalysis.borderElements.length} 個`);
        console.log(`   背景元素: ${colorAnalysis.backgroundElements.length} 個`);
        console.log(`   頁面錯誤: ${pageErrors.errors.length} 個`);

        if (pageErrors.errors.length > 0) {
          console.log(`   ⚠️ 錯誤: ${pageErrors.errors.join(', ')}`);
        }

        // 顯示主要問題
        const failedElements = colorAnalysis.textElements.filter(el => !el.passes);
        if (failedElements.length > 0) {
          console.log(`   ❌ 對比度不足的元素:`);
          failedElements.forEach(el => {
            console.log(`      ${el.type}: ${el.contrast}:1 (需要 ${el.required}:1)`);
          });
        }

      } catch (error) {
        console.log(`❌ 檢查 ${pageInfo.name} 時發生錯誤: ${error.message}`);
        allResults.push({
          name: pageInfo.name,
          url: pageInfo.url,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // 生成總結報告
    console.log('\n\n📋 所有頁面色彩檢查總結報告');
    console.log('=' .repeat(60));

    const successfulPages = allResults.filter(result => !result.error);
    const failedPages = allResults.filter(result => result.error);

    console.log(`\n📊 檢查統計:`);
    console.log(`   總頁面數: ${allResults.length}`);
    console.log(`   成功檢查: ${successfulPages.length}`);
    console.log(`   檢查失敗: ${failedPages.length}`);

    if (failedPages.length > 0) {
      console.log(`\n❌ 無法檢查的頁面:`);
      failedPages.forEach(page => {
        console.log(`   ${page.name}: ${page.error}`);
      });
    }

    console.log(`\n🎨 色彩對比度詳細分析:`);
    successfulPages.forEach(page => {
      const analysis = page.analysis;
      const passedElements = analysis.textElements.filter(el => el.passes).length;
      const totalElements = analysis.textElements.length;
      const passRate = totalElements > 0 ? ((passedElements / totalElements) * 100).toFixed(1) : 'N/A';

      const status = passRate === 'N/A' ? '⚪' :
                    parseFloat(passRate) >= 90 ? '✅' :
                    parseFloat(passRate) >= 75 ? '⚠️' : '❌';

      console.log(`   ${status} ${page.name}: ${passedElements}/${totalElements} (${passRate}%)`);

      // 顯示主要問題
      const criticalIssues = analysis.textElements.filter(el => !el.passes && el.visible);
      if (criticalIssues.length > 0) {
        criticalIssues.slice(0, 2).forEach(issue => {
          console.log(`      ⚠️ ${issue.type}: ${issue.contrast}:1 對比度不足`);
        });
      }
    });

    // 邊框檢查摘要
    console.log(`\n🔲 邊框顏色檢查:`);
    successfulPages.forEach(page => {
      const borderElements = page.analysis?.borderElements || [];
      const pipBoyBorders = borderElements.filter(border =>
        border.borderColor.includes('rgb(0, 255, 136)') ||
        border.borderColor.includes('#00ff88')
      ).length;

      const status = pipBoyBorders > 0 ? '✅' : borderElements.length > 0 ? '⚠️' : '⚪';
      console.log(`   ${status} ${page.name}: ${pipBoyBorders}/${borderElements.length} Pip-Boy 綠色邊框`);
    });

    // 整體評分
    const totalPassedElements = successfulPages.reduce((sum, page) =>
      sum + (page.analysis?.textElements.filter(el => el.passes).length || 0), 0);
    const totalElements = successfulPages.reduce((sum, page) =>
      sum + (page.analysis?.textElements.length || 0), 0);
    const overallPassRate = totalElements > 0 ? ((totalPassedElements / totalElements) * 100).toFixed(1) : 0;

    console.log(`\n🏆 整體 WCAG AA 合規性評分:`);
    console.log(`   總體對比度通過率: ${overallPassRate}%`);
    console.log(`   頁面載入成功率: ${((successfulPages.length / allResults.length) * 100).toFixed(1)}%`);

    const grade = parseFloat(overallPassRate) >= 95 ? 'A+' :
                  parseFloat(overallPassRate) >= 85 ? 'A' :
                  parseFloat(overallPassRate) >= 75 ? 'B+' :
                  parseFloat(overallPassRate) >= 65 ? 'B' : 'C';

    console.log(`   整體評級: ${grade}`);
    console.log(`   ${parseFloat(overallPassRate) >= 75 ? '✅ 符合 WCAG AA 標準' : '⚠️ 需要改善'}`);

    // 儲存詳細報告
    const reportData = {
      summary: {
        totalPages: allResults.length,
        successfulPages: successfulPages.length,
        failedPages: failedPages.length,
        overallPassRate: overallPassRate,
        grade: grade,
        timestamp: new Date().toISOString()
      },
      pages: allResults
    };

    require('fs').writeFileSync('color-contrast-report.json', JSON.stringify(reportData, null, 2));
    console.log(`\n📄 詳細報告已儲存: color-contrast-report.json`);

  } catch (error) {
    console.error('❌ 檢查過程中發生錯誤：', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

checkAllPagesColor();