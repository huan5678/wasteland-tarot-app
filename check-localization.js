const { chromium } = require('playwright');

async function checkLocalization() {
  console.log('🌏 檢查頁面中文化情況...');

  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 要檢查的頁面
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

    // 保留的 Fallout 專有名詞
    const falloutTerms = [
      'Vault-Tec', 'Pip-Boy', 'Vault', 'Dweller', 'SPECIAL'
    ];

    const allResults = [];

    for (const pageInfo of pagesToCheck) {
      console.log(`\n📍 檢查 ${pageInfo.name} (${pageInfo.url})`);
      console.log('=' .repeat(50));

      try {
        await page.goto(pageInfo.url, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(2000);

        // 檢查頁面文字內容
        const localizationAnalysis = await page.evaluate((falloutTerms) => {
          // 常見的英文單詞模式 (排除 Fallout 專有名詞)
          const englishPatterns = [
            /\b(login|register|sign in|sign up|sign out|logout)\b/gi,
            /\b(email|password|username|confirm password)\b/gi,
            /\b(submit|cancel|save|edit|delete|create|update)\b/gi,
            /\b(home|about|contact|profile|dashboard|settings)\b/gi,
            /\b(loading|error|success|warning|info)\b/gi,
            /\b(cards|tarot|reading|readings|new|history)\b/gi,
            /\b(welcome|hello|goodbye|thanks|thank you)\b/gi,
            /\b(page|next|previous|first|last|search|filter)\b/gi,
            /\b(name|title|description|date|time|status)\b/gi,
            /\b(required|optional|invalid|valid|placeholder)\b/gi
          ];

          const allText = document.body.innerText;
          const englishMatches = [];

          // 檢查英文模式
          englishPatterns.forEach((pattern, index) => {
            const matches = allText.match(pattern);
            if (matches) {
              matches.forEach(match => {
                // 檢查是否為 Fallout 專有名詞
                const isFalloutTerm = falloutTerms.some(term =>
                  match.toLowerCase().includes(term.toLowerCase())
                );

                if (!isFalloutTerm) {
                  englishMatches.push({
                    text: match,
                    pattern: index,
                    context: allText.substring(
                      Math.max(0, allText.indexOf(match) - 20),
                      allText.indexOf(match) + match.length + 20
                    )
                  });
                }
              });
            }
          });

          // 檢查表單元素的 placeholder 和 label
          const formElements = document.querySelectorAll('input, textarea, select, button, label');
          const formIssues = [];

          formElements.forEach(element => {
            const placeholder = element.placeholder;
            const textContent = element.textContent?.trim();
            const ariaLabel = element.getAttribute('aria-label');

            [placeholder, textContent, ariaLabel].forEach(text => {
              if (text && /^[a-zA-Z\s]+$/.test(text.trim()) && text.trim().length > 2) {
                // 檢查是否為 Fallout 專有名詞
                const isFalloutTerm = falloutTerms.some(term =>
                  text.toLowerCase().includes(term.toLowerCase())
                );

                if (!isFalloutTerm) {
                  formIssues.push({
                    element: element.tagName.toLowerCase(),
                    attribute: placeholder ? 'placeholder' : textContent ? 'textContent' : 'aria-label',
                    text: text.trim(),
                    className: element.className
                  });
                }
              }
            });
          });

          // 檢查頁面標題和 meta 資訊
          const pageTitle = document.title;
          const metaDescription = document.querySelector('meta[name="description"]')?.content || '';

          const metaIssues = [];
          [pageTitle, metaDescription].forEach((text, index) => {
            if (text && /^[a-zA-Z\s]+$/.test(text.trim()) && text.trim().length > 2) {
              const isFalloutTerm = falloutTerms.some(term =>
                text.toLowerCase().includes(term.toLowerCase())
              );

              if (!isFalloutTerm) {
                metaIssues.push({
                  type: index === 0 ? 'title' : 'description',
                  text: text.trim()
                });
              }
            }
          });

          // 計算中文字符比例
          const chineseChars = allText.match(/[\u4e00-\u9fff]/g) || [];
          const englishChars = allText.match(/[a-zA-Z]/g) || [];
          const totalChars = chineseChars.length + englishChars.length;

          const chineseRatio = totalChars > 0 ? (chineseChars.length / totalChars) * 100 : 0;

          return {
            pageTitle: document.title,
            englishMatches: englishMatches,
            formIssues: formIssues,
            metaIssues: metaIssues,
            chineseRatio: chineseRatio.toFixed(1),
            totalTextLength: allText.length,
            chineseCharCount: chineseChars.length,
            englishCharCount: englishChars.length
          };
        }, falloutTerms);

        const pageResult = {
          name: pageInfo.name,
          url: pageInfo.url,
          analysis: localizationAnalysis,
          timestamp: new Date().toISOString()
        };

        allResults.push(pageResult);

        // 顯示此頁面的分析結果
        console.log(`📊 ${pageInfo.name} 中文化分析:`);
        console.log(`   頁面標題: ${localizationAnalysis.pageTitle}`);
        console.log(`   中文字符比例: ${localizationAnalysis.chineseRatio}%`);
        console.log(`   英文匹配問題: ${localizationAnalysis.englishMatches.length} 個`);
        console.log(`   表單元素問題: ${localizationAnalysis.formIssues.length} 個`);
        console.log(`   Meta 資訊問題: ${localizationAnalysis.metaIssues.length} 個`);

        // 顯示主要問題
        if (localizationAnalysis.englishMatches.length > 0) {
          console.log(`   🔍 英文文字問題:`);
          localizationAnalysis.englishMatches.slice(0, 5).forEach(issue => {
            console.log(`      "${issue.text}" - ${issue.context.replace(/\s+/g, ' ')}`);
          });
        }

        if (localizationAnalysis.formIssues.length > 0) {
          console.log(`   📝 表單問題:`);
          localizationAnalysis.formIssues.slice(0, 3).forEach(issue => {
            console.log(`      ${issue.element}.${issue.attribute}: "${issue.text}"`);
          });
        }

        if (localizationAnalysis.metaIssues.length > 0) {
          console.log(`   🏷️ Meta 問題:`);
          localizationAnalysis.metaIssues.forEach(issue => {
            console.log(`      ${issue.type}: "${issue.text}"`);
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
    console.log('\n\n📋 中文化檢查總結報告');
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

    console.log(`\n🌏 中文化程度分析:`);
    successfulPages.forEach(page => {
      const analysis = page.analysis;
      const chineseRatio = parseFloat(analysis.chineseRatio);
      const totalIssues = analysis.englishMatches.length + analysis.formIssues.length + analysis.metaIssues.length;

      const status = chineseRatio >= 80 && totalIssues <= 2 ? '✅' :
                    chineseRatio >= 60 && totalIssues <= 5 ? '⚠️' : '❌';

      console.log(`   ${status} ${page.name}: ${analysis.chineseRatio}% 中文 (${totalIssues} 個問題)`);
    });

    // 需要修正的項目統計
    const allEnglishIssues = successfulPages.flatMap(page => page.analysis.englishMatches);
    const allFormIssues = successfulPages.flatMap(page => page.analysis.formIssues);
    const allMetaIssues = successfulPages.flatMap(page => page.analysis.metaIssues);

    console.log(`\n🔧 需要修正的項目:`);
    console.log(`   英文文字: ${allEnglishIssues.length} 處`);
    console.log(`   表單元素: ${allFormIssues.length} 處`);
    console.log(`   Meta 資訊: ${allMetaIssues.length} 處`);

    // 最常見的問題
    if (allEnglishIssues.length > 0) {
      const commonIssues = {};
      allEnglishIssues.forEach(issue => {
        const text = issue.text.toLowerCase();
        commonIssues[text] = (commonIssues[text] || 0) + 1;
      });

      console.log(`\n📝 最常見的英文詞彙:`);
      Object.entries(commonIssues)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([text, count]) => {
          console.log(`   "${text}": ${count} 次`);
        });
    }

    // 整體評分
    const totalChineseRatio = successfulPages.length > 0 ?
      successfulPages.reduce((sum, page) => sum + parseFloat(page.analysis.chineseRatio), 0) / successfulPages.length : 0;

    const totalIssues = allEnglishIssues.length + allFormIssues.length + allMetaIssues.length;

    console.log(`\n🏆 整體中文化評分:`);
    console.log(`   平均中文比例: ${totalChineseRatio.toFixed(1)}%`);
    console.log(`   總待修正項目: ${totalIssues} 個`);

    const grade = totalChineseRatio >= 85 && totalIssues <= 10 ? 'A' :
                  totalChineseRatio >= 70 && totalIssues <= 20 ? 'B' :
                  totalChineseRatio >= 60 && totalIssues <= 30 ? 'C' : 'D';

    console.log(`   評級: ${grade}`);
    console.log(`   ${grade >= 'B' ? '✅ 中文化程度良好' : '⚠️ 需要改善中文化'}`);

    // 儲存詳細報告
    const reportData = {
      summary: {
        totalPages: allResults.length,
        successfulPages: successfulPages.length,
        failedPages: failedPages.length,
        averageChineseRatio: totalChineseRatio.toFixed(1),
        totalIssues: totalIssues,
        grade: grade,
        timestamp: new Date().toISOString()
      },
      pages: allResults,
      commonIssues: {
        englishText: allEnglishIssues,
        formElements: allFormIssues,
        metaInfo: allMetaIssues
      }
    };

    require('fs').writeFileSync('localization-report.json', JSON.stringify(reportData, null, 2));
    console.log(`\n📄 詳細報告已儲存: localization-report.json`);

  } catch (error) {
    console.error('❌ 檢查過程中發生錯誤：', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

checkLocalization();