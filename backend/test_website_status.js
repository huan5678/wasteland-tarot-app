const { chromium } = require('playwright');

async function testWebsiteStatus() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    errors: [],
    warnings: [],
    success: [],
    apiCalls: []
  };

  // 監聽網路請求
  page.on('request', request => {
    if (request.url().includes('localhost:8000')) {
      results.apiCalls.push({
        url: request.url(),
        method: request.method()
      });
    }
  });

  // 監聽網路回應
  page.on('response', response => {
    if (response.url().includes('localhost:8000')) {
      const status = response.status();
      if (status >= 400) {
        results.errors.push(`API Error: ${response.url()} returned ${status}`);
      }
    }
  });

  // 監聽控制台錯誤
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.errors.push(`Console Error: ${msg.text()}`);
    }
  });

  // 監聽頁面錯誤
  page.on('pageerror', error => {
    results.errors.push(`Page Error: ${error.message}`);
  });

  const testPages = [
    {
      name: '首頁',
      url: 'http://localhost:3003',
      checks: [
        () => page.waitForSelector('h1', { timeout: 5000 }),
        () => page.textContent('title')
      ]
    },
    {
      name: '卡牌頁面',
      url: 'http://localhost:3003/cards',
      checks: [
        () => page.waitForSelector('[data-testid="cards-container"], .card, [class*="card"]', { timeout: 10000 }),
        () => page.waitForResponse(response =>
          response.url().includes('/api/cards') && response.status() === 200,
          { timeout: 10000 }
        )
      ]
    },
    {
      name: '新占卜頁面',
      url: 'http://localhost:3003/readings/new',
      checks: [
        () => page.waitForSelector('form, button, [data-testid*="reading"]', { timeout: 5000 })
      ]
    },
    {
      name: '占卜記錄頁面',
      url: 'http://localhost:3003/readings',
      checks: [
        () => page.waitForSelector('[data-testid*="reading"], .reading, [class*="reading"]', { timeout: 5000 })
      ]
    },
    {
      name: '個人檔案頁面',
      url: 'http://localhost:3003/profile',
      checks: [
        () => page.waitForSelector('form, [data-testid*="profile"], .profile', { timeout: 5000 })
      ]
    }
  ];

  for (const testPage of testPages) {
    try {
      console.log(`\n=== 測試 ${testPage.name} ===`);

      // 導航到頁面
      const response = await page.goto(testPage.url, {
        waitUntil: 'networkidle',
        timeout: 15000
      });

      if (response.status() !== 200) {
        results.errors.push(`${testPage.name}: HTTP ${response.status()}`);
        continue;
      }

      // 等待頁面載入
      await page.waitForTimeout(2000);

      // 執行檢查
      for (const check of testPage.checks) {
        try {
          await check();
        } catch (error) {
          results.warnings.push(`${testPage.name}: ${error.message}`);
        }
      }

      // 檢查中文化
      const pageText = await page.textContent('body');
      const hasChineseContent = /[\u4e00-\u9fff]/.test(pageText);

      if (hasChineseContent) {
        results.success.push(`${testPage.name}: 中文化正常`);
      } else {
        results.warnings.push(`${testPage.name}: 未發現中文內容`);
      }

      // 截圖
      await page.screenshot({
        path: `/tmp/claude/${testPage.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
        fullPage: false
      });

      results.success.push(`${testPage.name}: 頁面載入成功`);

    } catch (error) {
      results.errors.push(`${testPage.name}: ${error.message}`);
    }
  }

  // 測試 API 端點
  try {
    console.log(`\n=== 測試 API 端點 ===`);
    const apiResponse = await page.goto('http://localhost:8000/api/v1/cards', { timeout: 10000 });

    if (apiResponse.status() === 200) {
      const apiData = await apiResponse.json();
      results.success.push(`API /cards: 返回 ${apiData.length || Object.keys(apiData).length} 筆資料`);
    } else {
      results.errors.push(`API /cards: HTTP ${apiResponse.status()}`);
    }
  } catch (error) {
    results.errors.push(`API 測試失敗: ${error.message}`);
  }

  await browser.close();

  // 輸出結果
  console.log('\n' + '='.repeat(50));
  console.log('測試結果報告');
  console.log('='.repeat(50));

  if (results.success.length > 0) {
    console.log('\n✅ 成功項目:');
    results.success.forEach(item => console.log(`  ${item}`));
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  警告項目:');
    results.warnings.forEach(item => console.log(`  ${item}`));
  }

  if (results.errors.length > 0) {
    console.log('\n❌ 錯誤項目:');
    results.errors.forEach(item => console.log(`  ${item}`));
  }

  if (results.apiCalls.length > 0) {
    console.log('\n🌐 API 調用:');
    [...new Set(results.apiCalls.map(call => `${call.method} ${call.url}`))].forEach(item => console.log(`  ${item}`));
  }

  console.log('\n' + '='.repeat(50));

  return results;
}

testWebsiteStatus().catch(console.error);