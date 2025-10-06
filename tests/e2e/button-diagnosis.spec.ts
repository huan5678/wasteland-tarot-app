import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('按鈕功能問題診斷', () => {
  let page: Page;
  let consoleLogs: string[] = [];
  let consoleErrors: string[] = [];
  let networkFailures: string[] = [];

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // 監聽 console 訊息
    page.on('console', (msg) => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(text);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    // 監聽網路請求失敗
    page.on('requestfailed', (request) => {
      networkFailures.push(`Failed: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });

    // 前往首頁
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('01-首頁按鈕檢測與截圖', async () => {
    // 截取初始頁面狀態
    await page.screenshot({
      path: './test-results/homepage-initial.png',
      fullPage: true
    });

    // 檢查所有可能的按鈕元素
    const buttonSelectors = [
      'button',
      '[role="button"]',
      'a[href]',
      '.btn',
      '.button',
      '[onclick]',
      '[data-testid*="button"]'
    ];

    const allButtons = [];

    for (const selector of buttonSelectors) {
      const elements = await page.locator(selector).all();
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        try {
          const text = await element.textContent();
          const href = await element.getAttribute('href');
          const onClick = await element.getAttribute('onclick');
          const disabled = await element.getAttribute('disabled');
          const tagName = await element.evaluate(el => el.tagName);
          const className = await element.getAttribute('class');

          // 檢查元素是否可見和可點擊
          const isVisible = await element.isVisible();
          const isEnabled = await element.isEnabled();

          // 獲取元素位置
          const boundingBox = await element.boundingBox();

          allButtons.push({
            selector,
            index: i,
            text: text?.trim() || '',
            href,
            onClick,
            disabled,
            tagName,
            className,
            isVisible,
            isEnabled,
            boundingBox,
            elementHandle: element
          });
        } catch (error) {
          console.log(`Error inspecting element ${selector}[${i}]:`, error);
        }
      }
    }

    // 輸出所有發現的按鈕
    console.log(`\n=== 發現 ${allButtons.length} 個可能的按鈕元素 ===`);
    allButtons.forEach((btn, index) => {
      console.log(`\n按鈕 ${index + 1}:`);
      console.log(`  文字: "${btn.text}"`);
      console.log(`  標籤: ${btn.tagName}`);
      console.log(`  類別: ${btn.className || 'none'}`);
      console.log(`  href: ${btn.href || 'none'}`);
      console.log(`  onClick: ${btn.onClick || 'none'}`);
      console.log(`  可見: ${btn.isVisible}`);
      console.log(`  啟用: ${btn.isEnabled}`);
      console.log(`  位置: ${btn.boundingBox ? `${btn.boundingBox.x}, ${btn.boundingBox.y}` : 'unknown'}`);
    });

    // 保存按鈕信息到文件
    const buttonReport = {
      timestamp: new Date().toISOString(),
      totalButtons: allButtons.length,
      buttons: allButtons.map(btn => ({
        text: btn.text,
        tagName: btn.tagName,
        className: btn.className,
        href: btn.href,
        onClick: btn.onClick,
        isVisible: btn.isVisible,
        isEnabled: btn.isEnabled,
        boundingBox: btn.boundingBox
      }))
    };

    fs.writeFileSync('./test-results/button-analysis.json', JSON.stringify(buttonReport, null, 2));
  });

  test('02-主要按鈕點擊測試', async () => {
    // 測試主要功能按鈕
    const mainButtons = [
      { text: '進入避難所', expectedAction: 'navigation' },
      { text: '快速占卜', expectedAction: 'navigation' },
      { text: '登入', expectedAction: 'navigation' },
      { text: '註冊', expectedAction: 'navigation' },
      { text: '會員登入', expectedAction: 'navigation' },
      { text: '立即註冊', expectedAction: 'navigation' }
    ];

    const testResults = [];

    for (const buttonInfo of mainButtons) {
      try {
        console.log(`\n=== 測試按鈕: "${buttonInfo.text}" ===`);

        // 嘗試多種方式找到按鈕
        let button = null;
        const selectors = [
          `text="${buttonInfo.text}"`,
          `"${buttonInfo.text}"`,
          `[aria-label="${buttonInfo.text}"]`,
          `button:has-text("${buttonInfo.text}")`,
          `a:has-text("${buttonInfo.text}")`
        ];

        for (const selector of selectors) {
          try {
            const element = page.locator(selector).first();
            if (await element.count() > 0) {
              button = element;
              console.log(`  找到按鈕使用選擇器: ${selector}`);
              break;
            }
          } catch (e) {
            // 繼續嘗試下一個選擇器
          }
        }

        if (!button) {
          testResults.push({
            buttonText: buttonInfo.text,
            found: false,
            error: '找不到按鈕元素'
          });
          continue;
        }

        // 檢查按鈕狀態
        const isVisible = await button.isVisible();
        const isEnabled = await button.isEnabled();
        const boundingBox = await button.boundingBox();

        console.log(`  可見: ${isVisible}`);
        console.log(`  啟用: ${isEnabled}`);
        console.log(`  位置: ${boundingBox ? `${boundingBox.x}, ${boundingBox.y}` : 'unknown'}`);

        if (!isVisible || !isEnabled) {
          testResults.push({
            buttonText: buttonInfo.text,
            found: true,
            clickable: false,
            isVisible,
            isEnabled,
            error: '按鈕不可點擊'
          });
          continue;
        }

        // 記錄點擊前的 URL
        const beforeUrl = page.url();
        console.log(`  點擊前 URL: ${beforeUrl}`);

        // 截圖點擊前狀態
        await page.screenshot({
          path: `./test-results/before-click-${buttonInfo.text.replace(/\s+/g, '-')}.png`
        });

        // 清空之前的錯誤
        consoleErrors.length = 0;
        networkFailures.length = 0;

        // 點擊按鈕
        await button.click();

        // 等待可能的導航或狀態變化
        await page.waitForTimeout(2000);

        // 記錄點擊後的 URL
        const afterUrl = page.url();
        console.log(`  點擊後 URL: ${afterUrl}`);

        // 截圖點擊後狀態
        await page.screenshot({
          path: `./test-results/after-click-${buttonInfo.text.replace(/\s+/g, '-')}.png`
        });

        const urlChanged = beforeUrl !== afterUrl;

        testResults.push({
          buttonText: buttonInfo.text,
          found: true,
          clickable: true,
          clicked: true,
          beforeUrl,
          afterUrl,
          urlChanged,
          consoleErrors: [...consoleErrors],
          networkFailures: [...networkFailures]
        });

        console.log(`  URL 是否改變: ${urlChanged}`);
        if (consoleErrors.length > 0) {
          console.log(`  Console 錯誤: ${consoleErrors.join(', ')}`);
        }
        if (networkFailures.length > 0) {
          console.log(`  網路失敗: ${networkFailures.join(', ')}`);
        }

        // 如果 URL 改變了，回到首頁繼續測試
        if (urlChanged) {
          await page.goto('/');
          await page.waitForLoadState('networkidle');
        }

      } catch (error) {
        console.log(`  錯誤: ${error.message}`);
        testResults.push({
          buttonText: buttonInfo.text,
          found: false,
          error: error.message
        });
      }
    }

    // 保存測試結果
    fs.writeFileSync('./test-results/button-click-results.json', JSON.stringify(testResults, null, 2));

    // 輸出總結
    console.log(`\n=== 按鈕點擊測試總結 ===`);
    testResults.forEach(result => {
      console.log(`\n${result.buttonText}:`);
      if (!result.found) {
        console.log(`  ❌ 找不到按鈕`);
      } else if (!result.clickable) {
        console.log(`  ❌ 按鈕不可點擊`);
      } else if (result.clicked) {
        console.log(`  ✅ 成功點擊`);
        console.log(`  URL 變化: ${result.urlChanged ? '是' : '否'}`);
        if (result.consoleErrors?.length > 0) {
          console.log(`  ⚠️  Console 錯誤: ${result.consoleErrors.length} 個`);
        }
      }
    });
  });

  test('03-導航菜單測試', async () => {
    console.log('\n=== 測試導航菜單 ===');

    // 查找導航菜單
    const navSelectors = [
      'nav',
      '[role="navigation"]',
      '.nav',
      '.navbar',
      '.navigation',
      'header nav',
      '.header nav'
    ];

    let navElement = null;
    for (const selector of navSelectors) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        navElement = element;
        console.log(`找到導航菜單: ${selector}`);
        break;
      }
    }

    if (navElement) {
      // 截圖導航菜單
      await navElement.screenshot({ path: './test-results/navigation-menu.png' });

      // 查找導航連結
      const navLinks = await navElement.locator('a').all();
      console.log(`找到 ${navLinks.length} 個導航連結`);

      for (let i = 0; i < navLinks.length; i++) {
        const link = navLinks[i];
        const text = await link.textContent();
        const href = await link.getAttribute('href');
        const isVisible = await link.isVisible();

        console.log(`  連結 ${i + 1}: "${text?.trim()}" -> ${href} (可見: ${isVisible})`);
      }
    } else {
      console.log('❌ 找不到導航菜單');
    }
  });

  test('04-JavaScript 事件綁定檢查', async () => {
    console.log('\n=== 檢查 JavaScript 事件綁定 ===');

    // 執行 JavaScript 來檢查事件監聽器
    const eventInfo = await page.evaluate(() => {
      const results: any[] = [];

      // 查找所有按鈕和連結
      const elements = document.querySelectorAll('button, a, [role="button"], [onclick]');

      elements.forEach((element, index) => {
        const tagName = element.tagName;
        const text = element.textContent?.trim() || '';
        const onclick = element.getAttribute('onclick');
        const href = element.getAttribute('href');

        // 檢查是否有事件監聽器（簡單檢查）
        const hasClickHandler = onclick !== null || href !== null;

        // 檢查元素樣式
        const style = window.getComputedStyle(element);
        const pointerEvents = style.pointerEvents;
        const zIndex = style.zIndex;
        const position = style.position;
        const display = style.display;
        const visibility = style.visibility;

        results.push({
          index,
          tagName,
          text,
          onclick,
          href,
          hasClickHandler,
          styles: {
            pointerEvents,
            zIndex,
            position,
            display,
            visibility
          }
        });
      });

      return results;
    });

    console.log(`檢查了 ${eventInfo.length} 個元素:`);
    eventInfo.forEach(info => {
      console.log(`\n元素 ${info.index + 1}: ${info.tagName}`);
      console.log(`  文字: "${info.text}"`);
      console.log(`  onclick: ${info.onclick || 'none'}`);
      console.log(`  href: ${info.href || 'none'}`);
      console.log(`  有點擊處理: ${info.hasClickHandler}`);
      console.log(`  樣式:`, info.styles);
    });

    // 保存事件檢查結果
    fs.writeFileSync('./test-results/event-binding-check.json', JSON.stringify(eventInfo, null, 2));
  });

  test('05-CSS 和佈局問題檢查', async () => {
    console.log('\n=== 檢查 CSS 和佈局問題 ===');

    // 檢查可能的 CSS 問題
    const cssIssues = await page.evaluate(() => {
      const issues: string[] = [];

      // 查找所有按鈕
      const buttons = document.querySelectorAll('button, a, [role="button"]');

      buttons.forEach((button, index) => {
        const rect = button.getBoundingClientRect();
        const style = window.getComputedStyle(button);

        // 檢查按鈕是否在視窗外
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          issues.push(`按鈕 ${index + 1} 在垂直視窗外`);
        }

        if (rect.right < 0 || rect.left > window.innerWidth) {
          issues.push(`按鈕 ${index + 1} 在水平視窗外`);
        }

        // 檢查 z-index 問題
        const zIndex = parseInt(style.zIndex);
        if (zIndex < 0) {
          issues.push(`按鈕 ${index + 1} 有負的 z-index: ${zIndex}`);
        }

        // 檢查 pointer-events
        if (style.pointerEvents === 'none') {
          issues.push(`按鈕 ${index + 1} pointer-events 被設為 none`);
        }

        // 檢查尺寸
        if (rect.width === 0 || rect.height === 0) {
          issues.push(`按鈕 ${index + 1} 尺寸為零`);
        }

        // 檢查 display
        if (style.display === 'none') {
          issues.push(`按鈕 ${index + 1} display 為 none`);
        }

        // 檢查 visibility
        if (style.visibility === 'hidden') {
          issues.push(`按鈕 ${index + 1} visibility 為 hidden`);
        }
      });

      return issues;
    });

    console.log(`發現 ${cssIssues.length} 個 CSS 問題:`);
    cssIssues.forEach(issue => {
      console.log(`  ⚠️  ${issue}`);
    });

    // 檢查是否有遮擋元素
    const overlayCheck = await page.evaluate(() => {
      const overlays: any[] = [];

      // 查找可能遮擋的元素
      const elements = document.querySelectorAll('*');
      elements.forEach((element, index) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        if (style.position === 'fixed' || style.position === 'absolute') {
          const zIndex = parseInt(style.zIndex) || 0;
          if (zIndex > 1000) {  // 高 z-index 可能遮擋其他元素
            overlays.push({
              tagName: element.tagName,
              className: element.className,
              zIndex: zIndex,
              position: style.position,
              size: `${rect.width}x${rect.height}`
            });
          }
        }
      });

      return overlays;
    });

    console.log(`發現 ${overlayCheck.length} 個可能的遮擋元素:`);
    overlayCheck.forEach(overlay => {
      console.log(`  ${overlay.tagName}.${overlay.className} (z-index: ${overlay.zIndex}, ${overlay.position}, ${overlay.size})`);
    });
  });

  test.afterEach(async () => {
    // 輸出所有 console 訊息
    if (consoleLogs.length > 0) {
      console.log('\n=== Console 訊息 ===');
      consoleLogs.forEach(log => console.log(log));
    }

    // 輸出網路失敗
    if (networkFailures.length > 0) {
      console.log('\n=== 網路失敗 ===');
      networkFailures.forEach(failure => console.log(failure));
    }

    // 保存完整的 log
    const logReport = {
      timestamp: new Date().toISOString(),
      consoleLogs,
      consoleErrors,
      networkFailures
    };

    fs.writeFileSync('./test-results/console-and-network-log.json', JSON.stringify(logReport, null, 2));

    await page.close();
  });
});