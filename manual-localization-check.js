const { chromium } = require('playwright');
const fs = require('fs');

// 檢查文字是否為中文
function isChineseText(text) {
  const chineseRegex = /[\u4e00-\u9fff]/;
  return chineseRegex.test(text) && text.trim().length > 0;
}

// 檢查常見的英文詞彙是否已被翻譯
function hasUntranslatedEnglish(text) {
  const commonEnglishWords = [
    'login', 'register', 'dashboard', 'cards', 'home', 'welcome',
    'email', 'password', 'username', 'submit', 'cancel', 'loading',
    'error', 'success', 'warning', 'info', 'search', 'filter',
    'collection', 'reading', 'tarot', 'card', 'deck', 'fortune'
  ];

  const lowerText = text.toLowerCase();
  return commonEnglishWords.some(word => lowerText.includes(word));
}

async function checkLocalization() {
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

  const results = {};

  for (const pageInfo of pages) {
    console.log(`正在檢查: ${pageInfo.name} (${pageInfo.url})`);

    try {
      await page.goto(pageInfo.url);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      // 獲取頁面標題
      const title = await page.title();

      // 獲取頁面所有可見文字
      const allText = await page.textContent('body') || '';

      // 獲取所有按鈕文字
      const buttonElements = await page.locator('button').all();
      const buttonTexts = [];
      for (const button of buttonElements) {
        const text = await button.textContent();
        if (text && text.trim()) {
          buttonTexts.push(text.trim());
        }
      }

      // 獲取所有輸入欄位的 placeholder
      const inputElements = await page.locator('input').all();
      const placeholderTexts = [];
      for (const input of inputElements) {
        const placeholder = await input.getAttribute('placeholder');
        if (placeholder) {
          placeholderTexts.push(placeholder);
        }
      }

      // 獲取所有標籤文字
      const labelElements = await page.locator('label').all();
      const labelTexts = [];
      for (const label of labelElements) {
        const text = await label.textContent();
        if (text && text.trim()) {
          labelTexts.push(text.trim());
        }
      }

      // 檢查 meta tags
      const metaDescription = await page.getAttribute('meta[name="description"]', 'content') || '';

      // 分析結果
      const analysis = {
        title: {
          content: title,
          isChinese: isChineseText(title),
          hasUntranslated: hasUntranslatedEnglish(title)
        },
        metaDescription: {
          content: metaDescription,
          isChinese: isChineseText(metaDescription),
          hasUntranslated: hasUntranslatedEnglish(metaDescription)
        },
        buttons: buttonTexts.map(text => ({
          content: text,
          isChinese: isChineseText(text),
          hasUntranslated: hasUntranslatedEnglish(text)
        })),
        placeholders: placeholderTexts.map(text => ({
          content: text,
          isChinese: isChineseText(text),
          hasUntranslated: hasUntranslatedEnglish(text)
        })),
        labels: labelTexts.map(text => ({
          content: text,
          isChinese: isChineseText(text),
          hasUntranslated: hasUntranslatedEnglish(text)
        })),
        bodyText: {
          length: allText.length,
          isChinese: isChineseText(allText),
          hasUntranslated: hasUntranslatedEnglish(allText)
        }
      };

      results[pageInfo.name] = analysis;

      // 截圖
      await page.screenshot({
        path: `/tmp/claude/manual-check-${pageInfo.name.replace(/[\/\s]/g, '-')}.png`,
        fullPage: true
      });

      console.log(`✅ ${pageInfo.name} 檢查完成`);

    } catch (error) {
      console.error(`❌ 檢查 ${pageInfo.name} 時發生錯誤:`, error.message);
      results[pageInfo.name] = { error: error.message };
    }
  }

  // 儲存結果
  fs.writeFileSync('/tmp/claude/manual-localization-results.json', JSON.stringify(results, null, 2));

  // 生成報告
  console.log('\n=== 中文化檢查報告 ===');
  for (const [pageName, pageResult] of Object.entries(results)) {
    console.log(`\n【${pageName}】`);

    if (pageResult.error) {
      console.log(`❌ 錯誤: ${pageResult.error}`);
      continue;
    }

    // 檢查標題
    if (pageResult.title) {
      console.log(`標題: "${pageResult.title.content}"`);
      console.log(`  中文化: ${pageResult.title.isChinese ? '✅' : '❌'}`);
      console.log(`  未翻譯英文: ${pageResult.title.hasUntranslated ? '❌' : '✅'}`);
    }

    // 檢查按鈕
    console.log(`按鈕文字: ${pageResult.buttons.length} 個`);
    pageResult.buttons.forEach((button, index) => {
      const status = button.isChinese && !button.hasUntranslated ? '✅' : '❌';
      console.log(`  ${index + 1}. "${button.content}" ${status}`);
    });

    // 檢查標籤
    console.log(`標籤文字: ${pageResult.labels.length} 個`);
    pageResult.labels.forEach((label, index) => {
      const status = label.isChinese && !label.hasUntranslated ? '✅' : '❌';
      console.log(`  ${index + 1}. "${label.content}" ${status}`);
    });

    // 檢查 placeholders
    console.log(`輸入欄位 placeholder: ${pageResult.placeholders.length} 個`);
    pageResult.placeholders.forEach((placeholder, index) => {
      const status = placeholder.isChinese && !placeholder.hasUntranslated ? '✅' : '❌';
      console.log(`  ${index + 1}. "${placeholder.content}" ${status}`);
    });
  }

  await browser.close();
  console.log('\n檢查完成！結果已儲存至 /tmp/claude/manual-localization-results.json');
}

checkLocalization().catch(console.error);