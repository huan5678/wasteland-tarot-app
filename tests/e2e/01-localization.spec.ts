import { test, expect } from '@playwright/test'

test.describe('中文化驗證測試', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('首頁中文化內容驗證', async ({ page }) => {
    // 檢查主標題
    await expect(page.locator('h1').first()).toContainText('廢土塔羅')

    // 檢查副標題
    await expect(page.getByText('由避難所科技驅動的後末世塔羅占卜')).toBeVisible()

    // 檢查引言文字
    await expect(page.getByText('當核戰終結了文明，古老的占卜藝術也隨之進化')).toBeVisible()

    // 檢查主要按鈕文字
    await expect(page.getByRole('button', { name: '進入避難所' })).toBeVisible()
    await expect(page.getByRole('button', { name: '快速占卜' })).toBeVisible()

    // 檢查功能區塊標題
    await expect(page.getByText('終端機功能')).toBeVisible()
    await expect(page.getByText('量子占卜')).toBeVisible()
    await expect(page.getByText('占卜分析')).toBeVisible()
    await expect(page.getByText('廢土主題')).toBeVisible()

    // 檢查 CTA 區塊
    await expect(page.getByText('準備好探索你的廢土命運了嗎？')).toBeVisible()
    await expect(page.getByRole('button', { name: '註冊避難所帳號' })).toBeVisible()
    await expect(page.getByRole('button', { name: '瀏覽卡牌圖書館' })).toBeVisible()

    // 截圖保存首頁中文化狀態
    await page.screenshot({ path: 'test-results/screenshots/homepage-chinese.png', fullPage: true })
  })

  test('Header 中文化內容驗證', async ({ page }) => {
    // 檢查 Pip-Boy 標題區域
    await expect(page.getByText('VAULT-TEC PIP-BOY 3000 MARK IV').first()).toBeVisible()
    await expect(page.getByText('STATUS: ONLINE').first()).toBeVisible()

    // 檢查 Logo 區域
    await expect(page.getByText('廢土塔羅')).toBeVisible()
    await expect(page.getByText('Pip-Boy 占卜終端機')).toBeVisible()

    // 檢查導航按鈕（未登入狀態）
    await expect(page.getByRole('button', { name: '登入' })).toBeVisible()
    await expect(page.getByRole('button', { name: '註冊' })).toBeVisible()

    // 截圖保存 Header 中文化狀態
    await page.screenshot({ path: 'test-results/screenshots/header-chinese.png' })
  })

  test('登入頁面中文化內容驗證', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')

    // 檢查頁面是否有中文內容
    // 注意：這裡需要根據實際的登入頁面內容進行調整
    await expect(page).toHaveTitle(/登入|廢土塔羅|Tarot/)

    // 截圖保存登入頁面狀態
    await page.screenshot({ path: 'test-results/screenshots/login-page-chinese.png', fullPage: true })
  })

  test('註冊頁面中文化內容驗證', async ({ page }) => {
    await page.goto('/auth/register')
    await page.waitForLoadState('networkidle')

    // 檢查頁面是否有中文內容
    await expect(page).toHaveTitle(/註冊|廢土塔羅|Tarot/)

    // 截圖保存註冊頁面狀態
    await page.screenshot({ path: 'test-results/screenshots/register-page-chinese.png', fullPage: true })
  })

  test('卡牌圖書館頁面中文化內容驗證', async ({ page }) => {
    await page.goto('/cards')
    await page.waitForLoadState('networkidle')

    // 檢查頁面標題
    await expect(page).toHaveTitle(/卡牌|圖書館|廢土塔羅|Tarot/)

    // 截圖保存卡牌圖書館頁面狀態
    await page.screenshot({ path: 'test-results/screenshots/cards-page-chinese.png', fullPage: true })
  })

  test('檢查是否還有遺漏的英文內容', async ({ page }) => {
    // 檢查頁面中是否存在常見的英文詞彙（可能遺漏翻譯的）
    const englishTexts = [
      'Login',
      'Register',
      'Sign in',
      'Sign up',
      'Submit',
      'Cancel',
      'Home',
      'Dashboard',
      'Profile',
      'Settings',
      'Logout',
      'Sign out',
      'Welcome',
      'Hello',
      'Error',
      'Success',
      'Loading',
      'Please wait'
    ]

    for (const text of englishTexts) {
      const elements = page.locator(`text="${text}"`)
      const count = await elements.count()

      if (count > 0) {
        console.warn(`⚠️  發現可能遺漏翻譯的英文內容: "${text}" (出現 ${count} 次)`)

        // 截圖標示有英文內容的區域
        for (let i = 0; i < count; i++) {
          const element = elements.nth(i)
          if (await element.isVisible()) {
            await element.screenshot({
              path: `test-results/screenshots/english-content-${text.toLowerCase()}-${i}.png`
            })
          }
        }
      }
    }
  })

  test('檢查中文字體顯示是否正常', async ({ page }) => {
    // 檢查是否有中文字體渲染問題（方框字或亂碼）
    const chineseTextElement = page.getByText('廢土塔羅').first()
    await expect(chineseTextElement).toBeVisible()

    // 檢查字體是否正確渲染
    const boundingBox = await chineseTextElement.boundingBox()
    expect(boundingBox).toBeTruthy()
    expect(boundingBox!.width).toBeGreaterThan(50) // 確保文字有實際寬度

    // 截圖檢查字體渲染
    await page.screenshot({ path: 'test-results/screenshots/chinese-font-rendering.png' })
  })
})