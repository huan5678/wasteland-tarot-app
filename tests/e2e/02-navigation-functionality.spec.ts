import { test, expect } from '@playwright/test'

test.describe('導航功能測試', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('Header Logo 點擊導航到首頁', async ({ page }) => {
    // 先導航到其他頁面
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')

    // 點擊 Logo 回到首頁
    await page.getByRole('button').filter({ hasText: '廢土塔羅' }).click()
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL('/')
    await expect(page.getByText('由避難所科技驅動的後末世塔羅占卜')).toBeVisible()
  })

  test('未登入狀態導航連結測試', async ({ page }) => {
    // 測試登入按鈕
    await page.getByRole('button', { name: '登入' }).click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/auth/login')

    // 回到首頁
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 測試註冊按鈕
    await page.getByRole('button', { name: '註冊' }).click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/auth/register')
  })

  test('主頁按鈕導航測試', async ({ page }) => {
    // 測試「進入避難所」按鈕（未登入狀態應導向登入頁）
    await page.getByRole('button', { name: '進入避難所' }).click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/auth/login')

    // 回到首頁
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 測試「快速占卜」按鈕（未登入狀態應導向註冊頁）
    await page.getByRole('button', { name: '快速占卜' }).click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/auth/register')
  })

  test('CTA 區塊按鈕導航測試', async ({ page }) => {
    // 測試「註冊避難所帳號」按鈕
    await page.getByRole('button', { name: '註冊避難所帳號' }).click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/auth/register')

    // 回到首頁
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 測試「瀏覽卡牌圖書館」按鈕
    await page.getByRole('button', { name: '瀏覽卡牌圖書館' }).click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/cards')
  })

  test('直接 URL 訪問測試', async ({ page }) => {
    const urls = [
      '/',
      '/auth/login',
      '/auth/register',
      '/cards',
      '/dashboard',
      '/profile',
      '/readings',
      '/readings/new'
    ]

    for (const url of urls) {
      await page.goto(url)
      await page.waitForLoadState('networkidle')

      // 檢查頁面是否正常載入（沒有 404 或其他錯誤）
      const title = await page.title()
      expect(title).toBeTruthy()

      // 檢查頁面是否有基本的 Header 元素
      await expect(page.getByText('廢土塔羅')).toBeVisible()

      console.log(`✅ URL ${url} 正常載入，標題: ${title}`)
    }
  })

  test('瀏覽器前進後退功能測試', async ({ page }) => {
    // 首頁 -> 登入頁
    await page.getByRole('button', { name: '登入' }).click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/auth/login')

    // 登入頁 -> 註冊頁
    await page.goto('/auth/register')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/auth/register')

    // 後退到登入頁
    await page.goBack()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/auth/login')

    // 再後退到首頁
    await page.goBack()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/')

    // 前進到登入頁
    await page.goForward()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL('/auth/login')
  })

  test('重複點擊按鈕防護測試', async ({ page }) => {
    const button = page.getByRole('button', { name: '登入' })

    // 快速連續點擊多次
    await Promise.all([
      button.click(),
      button.click(),
      button.click()
    ])

    await page.waitForLoadState('networkidle')

    // 確保只導航了一次
    await expect(page).toHaveURL('/auth/login')

    // 檢查頁面狀態正常
    await expect(page.getByText('廢土塔羅')).toBeVisible()
  })
})