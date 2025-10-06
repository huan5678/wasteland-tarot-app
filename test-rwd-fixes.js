const { chromium } = require('playwright');

async function testResponsiveDesign() {
  console.log('🧪 測試響應式設計(RWD)修正...');

  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 測試不同螢幕尺寸
    const viewports = [
      { name: 'Mobile Portrait', width: 375, height: 667 },
      { name: 'Mobile Landscape', width: 667, height: 375 },
      { name: 'Tablet Portrait', width: 768, height: 1024 },
      { name: 'Tablet Landscape', width: 1024, height: 768 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    // 監聽 console 訊息
    const messages = [];
    page.on('console', msg => {
      messages.push(`${msg.type()}: ${msg.text()}`);
    });

    console.log('📍 開始測試首頁響應式設計...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');

    // 測試每個螢幕尺寸
    for (const viewport of viewports) {
      console.log(`\n🔍 測試 ${viewport.name} (${viewport.width}x${viewport.height})`);
      console.log('================================================');

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);

      // 檢查文字間距和佈局
      const layoutAnalysis = await page.evaluate(() => {
        // 檢查 Header 元件
        const header = document.querySelector('header');
        const nav = document.querySelector('nav');
        const mobileMenu = document.querySelector('[data-mobile-menu]');

        // 檢查 Hero 區域
        const heroTitle = document.querySelector('h1');
        const heroSubtitle = document.querySelector('.hero-subtitle, h2');

        // 檢查 Footer 元件
        const footer = document.querySelector('footer');
        const footerGrid = footer ? footer.querySelector('.grid') : null;

        // 檢查按鈕和觸控目標
        const buttons = Array.from(document.querySelectorAll('button, .btn, a[role="button"]'));
        const buttonSizes = buttons.map(btn => {
          const rect = btn.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            meetsTouchTarget: rect.width >= 44 && rect.height >= 44
          };
        });

        // 檢查文字行高和字距
        const textElements = Array.from(document.querySelectorAll('p, span, div[class*="text"]'));
        const textSpacing = textElements.slice(0, 5).map(el => {
          const styles = window.getComputedStyle(el);
          return {
            lineHeight: styles.lineHeight,
            letterSpacing: styles.letterSpacing,
            fontSize: styles.fontSize
          };
        });

        return {
          viewport: { width: window.innerWidth, height: window.innerHeight },
          header: {
            exists: !!header,
            height: header ? header.getBoundingClientRect().height : 0,
            hasMobileMenu: !!mobileMenu,
            navVisible: nav ? window.getComputedStyle(nav).display !== 'none' : false
          },
          hero: {
            titleExists: !!heroTitle,
            titleSize: heroTitle ? window.getComputedStyle(heroTitle).fontSize : 'N/A',
            subtitleExists: !!heroSubtitle,
            subtitleSize: heroSubtitle ? window.getComputedStyle(heroSubtitle).fontSize : 'N/A'
          },
          footer: {
            exists: !!footer,
            hasGrid: !!footerGrid,
            gridColumns: footerGrid ? window.getComputedStyle(footerGrid).gridTemplateColumns : 'N/A'
          },
          touchTargets: {
            totalButtons: buttons.length,
            meetingStandard: buttonSizes.filter(b => b.meetsTouchTarget).length,
            averageSize: buttonSizes.length > 0 ?
              buttonSizes.reduce((acc, b) => acc + Math.min(b.width, b.height), 0) / buttonSizes.length : 0
          },
          textSpacing: textSpacing
        };
      });

      // 顯示分析結果
      console.log(`螢幕尺寸: ${layoutAnalysis.viewport.width}x${layoutAnalysis.viewport.height}`);
      console.log(`Header 高度: ${layoutAnalysis.header.height}px`);
      console.log(`行動選單: ${layoutAnalysis.header.hasMobileMenu ? '✅ 存在' : '❌ 不存在'}`);
      console.log(`導航顯示: ${layoutAnalysis.header.navVisible ? '✅ 可見' : '⚠️ 隱藏'}`);
      console.log(`Hero 標題大小: ${layoutAnalysis.hero.titleSize}`);
      console.log(`Hero 副標題大小: ${layoutAnalysis.hero.subtitleSize}`);
      console.log(`Footer 網格欄位: ${layoutAnalysis.footer.gridColumns}`);
      console.log(`觸控目標: ${layoutAnalysis.touchTargets.meetingStandard}/${layoutAnalysis.touchTargets.totalButtons} 符合標準(44px+)`);
      console.log(`平均按鈕大小: ${Math.round(layoutAnalysis.touchTargets.averageSize)}px`);

      // 評估響應式品質
      const isGoodResponsive =
        layoutAnalysis.header.exists &&
        (viewport.width < 640 ? layoutAnalysis.header.hasMobileMenu : layoutAnalysis.header.navVisible) &&
        layoutAnalysis.hero.titleExists &&
        layoutAnalysis.footer.exists &&
        layoutAnalysis.touchTargets.averageSize >= 40; // 稍微寬鬆的標準

      console.log(`響應式品質: ${isGoodResponsive ? '✅ 良好' : '⚠️ 需改進'}`);

      // 為行動裝置截圖
      if (viewport.width <= 768) {
        const screenshotName = `rwd-test-${viewport.name.toLowerCase().replace(/\s+/g, '-')}.png`;
        await page.screenshot({
          path: screenshotName,
          fullPage: true
        });
        console.log(`📸 已保存截圖: ${screenshotName}`);
      }
    }

    // Console 錯誤檢查
    const errors = messages.filter(msg => msg.startsWith('error:'));
    const warnings = messages.filter(msg => msg.startsWith('warn:'));

    console.log('\n🔍 Console 狀態總結:');
    console.log('===================');
    console.log(`錯誤: ${errors.length}`);
    console.log(`警告: ${warnings.length}`);

    if (errors.length > 0) {
      console.log('\n主要錯誤:');
      errors.slice(0, 3).forEach(error => console.log(`  ${error}`));
    }

    // 最終評估
    console.log('\n🎯 RWD 修正評估:');
    console.log('================');
    console.log('✅ 多螢幕尺寸測試完成');
    console.log('✅ 觸控目標尺寸檢查完成');
    console.log('✅ 文字間距分析完成');
    console.log(`${errors.length === 0 ? '✅' : '⚠️'} Console 錯誤狀態: ${errors.length === 0 ? '無錯誤' : `${errors.length}個錯誤`}`);

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤：', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testResponsiveDesign();