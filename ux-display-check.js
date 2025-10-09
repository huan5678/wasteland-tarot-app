const { chromium } = require('playwright');
const fs = require('fs');

async function checkUXAndDisplay() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    locale: 'zh-TW',
    extraHTTPHeaders: {
      'Accept-Language': 'zh-TW,zh;q=0.9'
    }
  });
  const page = await context.newPage();

  const pages = [
    { name: '首頁', url: 'http://localhost:3000/' },
    { name: '登入頁面', url: 'http://localhost:3000/auth/login' },
    { name: '註冊頁面', url: 'http://localhost:3000/auth/register' },
    { name: 'Dashboard', url: 'http://localhost:3000/dashboard' },
    { name: 'Cards 頁面', url: 'http://localhost:3000/cards' }
  ];

  const viewports = [
    { name: '桌面', width: 1920, height: 1080 },
    { name: '平板', width: 768, height: 1024 },
    { name: '手機', width: 375, height: 667 }
  ];

  const results = {};

  for (const pageInfo of pages) {
    console.log(`正在檢查: ${pageInfo.name}`);
    results[pageInfo.name] = {};

    for (const viewport of viewports) {
      console.log(`  ${viewport.name} 視窗 (${viewport.width}x${viewport.height})`);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(pageInfo.url);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      // 檢查中文字體顯示
      const fontChecks = await page.evaluate(() => {
        const body = document.body;
        const computedStyle = window.getComputedStyle(body);
        return {
          fontFamily: computedStyle.fontFamily,
          fontSize: computedStyle.fontSize,
          lineHeight: computedStyle.lineHeight,
          letterSpacing: computedStyle.letterSpacing
        };
      });

      // 檢查文字溢出問題
      const textOverflowIssues = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const issues = [];

        elements.forEach((element, index) => {
          const text = element.textContent?.trim();
          if (text && text.length > 0) {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);

            // 檢查是否有中文字符
            const hasChinese = /[\u4e00-\u9fff]/.test(text);

            if (hasChinese && rect.width > 0 && rect.height > 0) {
              // 檢查是否有文字溢出
              const hasOverflow = element.scrollWidth > element.clientWidth ||
                                 element.scrollHeight > element.clientHeight;

              // 檢查是否被截斷
              const isTruncated = style.textOverflow === 'ellipsis' ||
                                 style.overflow === 'hidden';

              if (hasOverflow || isTruncated) {
                issues.push({
                  index: index,
                  tagName: element.tagName,
                  className: element.className,
                  text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
                  hasOverflow: hasOverflow,
                  isTruncated: isTruncated,
                  width: rect.width,
                  height: rect.height,
                  scrollWidth: element.scrollWidth,
                  scrollHeight: element.scrollHeight
                });
              }
            }
          }
        });

        return issues;
      });

      // 檢查按鈕和連結的點擊區域
      const interactiveElements = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, a, input[type="submit"]');
        const elements = [];

        buttons.forEach((element, index) => {
          const rect = element.getBoundingClientRect();
          const text = element.textContent?.trim();
          const hasChinese = /[\u4e00-\u9fff]/.test(text || '');

          if (hasChinese && rect.width > 0 && rect.height > 0) {
            elements.push({
              index: index,
              tagName: element.tagName,
              text: text?.substring(0, 30) + (text && text.length > 30 ? '...' : ''),
              width: rect.width,
              height: rect.height,
              isClickable: rect.width >= 44 && rect.height >= 44, // 最小點擊區域標準
              position: {
                top: rect.top,
                left: rect.left
              }
            });
          }
        });

        return elements;
      });

      // 檢查表單元素
      const formElements = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input, textarea, select');
        const elements = [];

        inputs.forEach((element, index) => {
          const rect = element.getBoundingClientRect();
          const placeholder = element.getAttribute('placeholder') || '';
          const label = document.querySelector(`label[for="${element.id}"]`);
          const labelText = label ? label.textContent?.trim() : '';

          const hasChinese = /[\u4e00-\u9fff]/.test(placeholder + labelText);

          if (hasChinese && rect.width > 0 && rect.height > 0) {
            elements.push({
              index: index,
              tagName: element.tagName,
              type: element.type,
              placeholder: placeholder,
              labelText: labelText,
              width: rect.width,
              height: rect.height,
              isAccessible: rect.height >= 44 // 最小觸碰區域
            });
          }
        });

        return elements;
      });

      // 截圖
      const screenshotPath = `/tmp/claude/ux-check-${pageInfo.name.replace(/[\/\s]/g, '-')}-${viewport.name}.png`;
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });

      results[pageInfo.name][viewport.name] = {
        viewport: viewport,
        fontChecks: fontChecks,
        textOverflowIssues: textOverflowIssues,
        interactiveElements: interactiveElements,
        formElements: formElements,
        screenshot: screenshotPath
      };

      console.log(`    ✅ 完成檢查 - 發現 ${textOverflowIssues.length} 個文字顯示問題`);
    }
  }

  await browser.close();

  // 生成報告
  console.log('\n=== 用戶體驗和顯示效果檢查報告 ===\n');

  let totalIssues = 0;
  let totalInteractiveElements = 0;
  let accessibleInteractiveElements = 0;
  let totalFormElements = 0;
  let accessibleFormElements = 0;

  for (const [pageName, pageData] of Object.entries(results)) {
    console.log(`【${pageName}】`);

    for (const [viewportName, data] of Object.entries(pageData)) {
      console.log(`  ${viewportName} 視窗:`);

      // 字體檢查
      console.log(`    字體: ${data.fontChecks.fontFamily}`);
      console.log(`    字體大小: ${data.fontChecks.fontSize}`);

      // 文字溢出問題
      const overflowIssues = data.textOverflowIssues.length;
      totalIssues += overflowIssues;
      console.log(`    文字顯示問題: ${overflowIssues} 個 ${overflowIssues > 0 ? '❌' : '✅'}`);

      if (overflowIssues > 0) {
        data.textOverflowIssues.slice(0, 3).forEach((issue, index) => {
          console.log(`      ${index + 1}. ${issue.tagName}: "${issue.text}"`);
        });
        if (overflowIssues > 3) {
          console.log(`      ... 還有 ${overflowIssues - 3} 個問題`);
        }
      }

      // 互動元素檢查
      const interactiveCount = data.interactiveElements.length;
      const accessibleInteractive = data.interactiveElements.filter(e => e.isClickable).length;
      totalInteractiveElements += interactiveCount;
      accessibleInteractiveElements += accessibleInteractive;

      console.log(`    互動元素: ${accessibleInteractive}/${interactiveCount} 符合可點擊標準 ${accessibleInteractive === interactiveCount ? '✅' : '⚠️'}`);

      // 表單元素檢查
      const formCount = data.formElements.length;
      const accessibleForm = data.formElements.filter(e => e.isAccessible).length;
      totalFormElements += formCount;
      accessibleFormElements += accessibleForm;

      if (formCount > 0) {
        console.log(`    表單元素: ${accessibleForm}/${formCount} 符合可觸碰標準 ${accessibleForm === formCount ? '✅' : '⚠️'}`);
      }
    }
    console.log('');
  }

  // 總結
  console.log('=== 總結 ===');
  console.log(`總計檢查頁面: ${Object.keys(results).length} 個`);
  console.log(`總計視窗大小: ${viewports.length} 種`);
  console.log(`文字顯示問題: ${totalIssues} 個 ${totalIssues === 0 ? '✅' : '❌'}`);
  console.log(`互動元素可用性: ${accessibleInteractiveElements}/${totalInteractiveElements} (${((accessibleInteractiveElements/totalInteractiveElements)*100).toFixed(1)}%) ${accessibleInteractiveElements === totalInteractiveElements ? '✅' : '⚠️'}`);
  console.log(`表單元素可用性: ${accessibleFormElements}/${totalFormElements} (${totalFormElements > 0 ? ((accessibleFormElements/totalFormElements)*100).toFixed(1) : 0}%) ${accessibleFormElements === totalFormElements ? '✅' : '⚠️'}`);

  // 儲存詳細結果
  const finalResults = {
    timestamp: new Date().toISOString(),
    pages: results,
    summary: {
      totalPages: Object.keys(results).length,
      totalViewports: viewports.length,
      totalTextIssues: totalIssues,
      interactiveElementsAccessibility: {
        accessible: accessibleInteractiveElements,
        total: totalInteractiveElements,
        percentage: totalInteractiveElements > 0 ? (accessibleInteractiveElements / totalInteractiveElements) * 100 : 0
      },
      formElementsAccessibility: {
        accessible: accessibleFormElements,
        total: totalFormElements,
        percentage: totalFormElements > 0 ? (accessibleFormElements / totalFormElements) * 100 : 0
      }
    }
  };

  fs.writeFileSync('/tmp/claude/ux-display-check-results.json', JSON.stringify(finalResults, null, 2));

  console.log('\n檢查完成！詳細結果已儲存至 /tmp/claude/ux-display-check-results.json');

  return finalResults;
}

checkUXAndDisplay().catch(console.error);