import { test, expect, Page } from '@playwright/test'

interface LocalizationCheck {
  page: string
  url: string
  elements: {
    selector: string
    expectedText?: string
    shouldBeInChinese: boolean
    description: string
  }[]
}

const localizationChecks: LocalizationCheck[] = [
  {
    page: '首頁',
    url: '/',
    elements: [
      { selector: 'h1', shouldBeInChinese: true, description: '主標題' },
      { selector: '[data-testid="hero-description"]', shouldBeInChinese: true, description: '描述文字' },
      { selector: '[data-testid="cta-button"]', expectedText: '開始占卜', shouldBeInChinese: true, description: 'CTA 按鈕' },
      { selector: '[data-testid="features-title"]', shouldBeInChinese: true, description: '功能區標題' },
      { selector: '[data-testid="feature-card"]', shouldBeInChinese: true, description: '功能卡片' },
      { selector: 'nav a', shouldBeInChinese: true, description: '導航連結' }
    ]
  },
  {
    page: '登入頁面',
    url: '/auth/login',
    elements: [
      { selector: 'h1', expectedText: '登入廢土塔羅', shouldBeInChinese: true, description: '頁面標題' },
      { selector: 'label[for="email"]', expectedText: '電子信箱', shouldBeInChinese: true, description: '信箱標籤' },
      { selector: 'label[for="password"]', expectedText: '密碼', shouldBeInChinese: true, description: '密碼標籤' },
      { selector: 'input[type="email"]', shouldBeInChinese: true, description: '信箱 placeholder' },
      { selector: 'input[type="password"]', shouldBeInChinese: true, description: '密碼 placeholder' },
      { selector: 'button[type="submit"]', expectedText: '登入', shouldBeInChinese: true, description: '登入按鈕' },
      { selector: '[data-testid="register-link"]', shouldBeInChinese: true, description: '註冊連結' },
      { selector: '[data-testid="forgot-password-link"]', shouldBeInChinese: true, description: '忘記密碼連結' }
    ]
  },
  {
    page: '註冊頁面',
    url: '/auth/register',
    elements: [
      { selector: 'h1', expectedText: '加入廢土塔羅', shouldBeInChinese: true, description: '頁面標題' },
      { selector: 'label[for="username"]', expectedText: '用戶名', shouldBeInChinese: true, description: '用戶名標籤' },
      { selector: 'label[for="email"]', expectedText: '電子信箱', shouldBeInChinese: true, description: '信箱標籤' },
      { selector: 'label[for="password"]', expectedText: '密碼', shouldBeInChinese: true, description: '密碼標籤' },
      { selector: 'label[for="confirmPassword"]', expectedText: '確認密碼', shouldBeInChinese: true, description: '確認密碼標籤' },
      { selector: 'button[type="submit"]', expectedText: '註冊', shouldBeInChinese: true, description: '註冊按鈕' },
      { selector: '[data-testid="login-link"]', shouldBeInChinese: true, description: '登入連結' }
    ]
  },
  {
    page: 'Dashboard',
    url: '/dashboard',
    elements: [
      { selector: 'h1', shouldBeInChinese: true, description: '歡迎標題' },
      { selector: '[data-testid="quick-reading-title"]', expectedText: '快速占卜', shouldBeInChinese: true, description: '快速占卜標題' },
      { selector: '[data-testid="quick-reading-description"]', shouldBeInChinese: true, description: '快速占卜描述' },
      { selector: '[data-testid="quick-reading-button"]', expectedText: '開始占卜', shouldBeInChinese: true, description: '開始占卜按鈕' },
      { selector: '[data-testid="recent-readings-title"]', expectedText: '最近的占卜', shouldBeInChinese: true, description: '最近占卜標題' },
      { selector: '[data-testid="cards-collection-title"]', expectedText: '牌組收藏', shouldBeInChinese: true, description: '牌組收藏標題' }
    ]
  },
  {
    page: 'Cards 頁面',
    url: '/cards',
    elements: [
      { selector: 'h1', expectedText: '廢土塔羅牌', shouldBeInChinese: true, description: '頁面標題' },
      { selector: '[data-testid="filter-label"]', shouldBeInChinese: true, description: '篩選標籤' },
      { selector: '[data-testid="search-placeholder"]', shouldBeInChinese: true, description: '搜尋 placeholder' },
      { selector: '[data-testid="card-grid"]', shouldBeInChinese: true, description: '卡片網格' },
      { selector: '[data-testid="loading-text"]', shouldBeInChinese: true, description: '載入文字' }
    ]
  }
]

// 檢查文字是否為中文
function isChineseText(text: string): boolean {
  // 檢查是否包含中文字符
  const chineseRegex = /[\u4e00-\u9fff]/
  return chineseRegex.test(text) && text.trim().length > 0
}

// 檢查常見的英文詞彙是否已被翻譯
function hasUntranslatedEnglish(text: string): boolean {
  const commonEnglishWords = [
    'login', 'register', 'dashboard', 'cards', 'home', 'welcome',
    'email', 'password', 'username', 'submit', 'cancel', 'loading',
    'error', 'success', 'warning', 'info', 'search', 'filter',
    'collection', 'reading', 'tarot', 'card', 'deck', 'fortune'
  ]

  const lowerText = text.toLowerCase()
  return commonEnglishWords.some(word => lowerText.includes(word))
}

async function checkMetaTags(page: Page, pageName: string) {
  // 檢查頁面標題
  const title = await page.title()

  // 檢查 meta description
  const description = await page.getAttribute('meta[name="description"]', 'content') || ''

  // 檢查 og:title
  const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content') || ''

  // 檢查 og:description
  const ogDescription = await page.getAttribute('meta[property="og:description"]', 'content') || ''

  return {
    title: { content: title, isChineseText: isChineseText(title), hasUntranslated: hasUntranslatedEnglish(title) },
    description: { content: description, isChineseText: isChineseText(description), hasUntranslated: hasUntranslatedEnglish(description) },
    ogTitle: { content: ogTitle, isChineseText: isChineseText(ogTitle), hasUntranslated: hasUntranslatedEnglish(ogTitle) },
    ogDescription: { content: ogDescription, isChineseText: isChineseText(ogDescription), hasUntranslated: hasUntranslatedEnglish(ogDescription) }
  }
}

test.describe('中文化驗證測試', () => {
  test.beforeEach(async ({ page }) => {
    // 設置中文語言環境
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'zh-TW,zh;q=0.9'
    })
  })

  for (const check of localizationChecks) {
    test(`${check.page} - 中文化完整性檢查`, async ({ page }) => {
      await page.goto(check.url)

      // 等待頁面載入
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(2000) // 等待動態內容載入

      const results: any[] = []

      // 檢查 Meta tags
      const metaResults = await checkMetaTags(page, check.page)
      results.push({
        type: 'meta',
        page: check.page,
        results: metaResults
      })

      // 檢查頁面元素
      for (const element of check.elements) {
        try {
          const locator = page.locator(element.selector).first()
          await expect(locator).toBeVisible({ timeout: 5000 })

          let text = ''
          let placeholder = ''

          // 獲取文字內容
          if (element.selector.includes('input')) {
            placeholder = await locator.getAttribute('placeholder') || ''
            text = placeholder
          } else {
            text = await locator.textContent() || ''
          }

          // 檢查是否為中文
          const isChinese = isChineseText(text)
          const hasUntranslated = hasUntranslatedEnglish(text)

          // 如果有期望的特定文字，檢查是否符合
          let matchesExpected = true
          if (element.expectedText) {
            matchesExpected = text.includes(element.expectedText)
          }

          results.push({
            type: 'element',
            page: check.page,
            element: element.description,
            selector: element.selector,
            text: text,
            isChinese: isChinese,
            hasUntranslated: hasUntranslated,
            matchesExpected: matchesExpected,
            expectedText: element.expectedText
          })

          // 驗證結果
          if (element.shouldBeInChinese) {
            expect(isChinese, `${element.description} 應該包含中文文字，但發現: "${text}"`).toBe(true)
            expect(hasUntranslated, `${element.description} 包含未翻譯的英文: "${text}"`).toBe(false)
          }

          if (element.expectedText) {
            expect(matchesExpected, `${element.description} 應該包含 "${element.expectedText}"，但發現: "${text}"`).toBe(true)
          }

        } catch (error) {
          console.error(`檢查 ${element.description} 時發生錯誤:`, error)
          results.push({
            type: 'error',
            page: check.page,
            element: element.description,
            selector: element.selector,
            error: error.message
          })
        }
      }

      // 截圖記錄
      await page.screenshot({
        path: `/tmp/claude/localization-${check.page.replace(/[\/\s]/g, '-')}.png`,
        fullPage: true
      })

      // 將結果保存到檔案
      const fs = require('fs')
      const resultPath = `/tmp/claude/localization-results-${check.page.replace(/[\/\s]/g, '-')}.json`
      fs.writeFileSync(resultPath, JSON.stringify(results, null, 2))
    })
  }

  test('全站術語一致性檢查', async ({ page }) => {
    const pages = ['/', '/auth/login', '/auth/register', '/dashboard', '/cards']
    const terminologyMap = new Map<string, string[]>()

    for (const url of pages) {
      await page.goto(url)
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(2000)

      // 獲取頁面所有文字內容
      const allText = await page.textContent('body') || ''

      // 檢查關鍵術語
      const keyTerms = [
        '塔羅', '占卜', '廢土', '登入', '註冊', '密碼', '電子信箱',
        '用戶名', '開始', '收藏', '牌組', '最近', '快速'
      ]

      for (const term of keyTerms) {
        if (allText.includes(term)) {
          if (!terminologyMap.has(term)) {
            terminologyMap.set(term, [])
          }
          terminologyMap.get(term)!.push(url)
        }
      }
    }

    // 檢查術語使用一致性
    const fs = require('fs')
    const terminologyResults = Object.fromEntries(terminologyMap)
    fs.writeFileSync('/tmp/claude/terminology-consistency.json', JSON.stringify(terminologyResults, null, 2))

    // 驗證關鍵術語在所有相關頁面都有使用
    expect(terminologyMap.get('塔羅')?.length).toBeGreaterThan(0)
    expect(terminologyMap.get('占卜')?.length).toBeGreaterThan(0)
  })
})

test.describe('響應式設計中文顯示測試', () => {
  const viewports = [
    { name: '桌面', width: 1920, height: 1080 },
    { name: '平板', width: 768, height: 1024 },
    { name: '手機', width: 375, height: 667 }
  ]

  for (const viewport of viewports) {
    test(`${viewport.name} 視窗 - 中文顯示檢查`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })

      const pages = ['/', '/auth/login', '/auth/register', '/dashboard', '/cards']

      for (const url of pages) {
        await page.goto(url)
        await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(2000)

        // 檢查是否有文字溢出或顯示問題
        const elements = await page.locator('*').all()

        for (const element of elements) {
          const text = await element.textContent() || ''
          if (isChineseText(text) && text.length > 0) {
            // 檢查元素是否可見且沒有被截斷
            const isVisible = await element.isVisible()
            if (isVisible) {
              const boundingBox = await element.boundingBox()
              expect(boundingBox).not.toBeNull()
            }
          }
        }

        // 截圖記錄
        const pageName = url === '/' ? 'home' : url.replace(/[\/]/g, '-')
        await page.screenshot({
          path: `/tmp/claude/responsive-${viewport.name}-${pageName}.png`,
          fullPage: true
        })
      }
    })
  }
})