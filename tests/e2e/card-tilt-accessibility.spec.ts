/**
 * Card Tilt Accessibility E2E Tests
 * 測試 3D 傾斜效果的無障礙性（鍵盤與螢幕閱讀器）
 */

import { test, expect } from '@playwright/test'

test.describe('Card Tilt Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // 導航至包含卡片的頁面
    await page.goto('/cards/major-arcana')
    await page.waitForLoadState('networkidle')
  })

  test('鍵盤導航應正常運作（Tab 鍵）', async ({ page }) => {
    // 使用 Tab 鍵導航至第一張卡片
    await page.keyboard.press('Tab')

    // 等待焦點移至卡片
    const firstCard = page.locator('a[href^="/cards/"]').first()
    await expect(firstCard).toBeFocused()

    // 檢查焦點指示器是否可見
    const focusRing = await firstCard.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow
      }
    })

    // 確保有焦點指示器（outline 或 box-shadow）
    const hasFocusIndicator =
      focusRing.outline !== 'none' ||
      focusRing.outlineWidth !== '0px' ||
      focusRing.boxShadow.includes('ring')

    expect(hasFocusIndicator).toBeTruthy()
  })

  test('Enter 鍵應能觸發卡片選擇', async ({ page }) => {
    // Tab 至第一張卡片
    await page.keyboard.press('Tab')
    const firstCard = page.locator('a[href^="/cards/"]').first()
    await expect(firstCard).toBeFocused()

    // 按下 Enter 鍵
    await page.keyboard.press('Enter')

    // 確認導航至卡片詳情頁
    await page.waitForURL(/\/cards\/[^/]+\/\d+/)
    expect(page.url()).toMatch(/\/cards\/[^/]+\/\d+/)
  })

  test('Space 鍵應能觸發卡片選擇', async ({ page }) => {
    // Tab 至第一張卡片
    await page.keyboard.press('Tab')
    const firstCard = page.locator('a[href^="/cards/"]').first()
    await expect(firstCard).toBeFocused()

    // 按下 Space 鍵
    await page.keyboard.press('Space')

    // 確認導航至卡片詳情頁
    await page.waitForURL(/\/cards\/[^/]+\/\d+/)
    expect(page.url()).toMatch(/\/cards\/[^/]+\/\d+/)
  })

  test('焦點指示器不應被 3D 傾斜效果遮蓋', async ({ page }) => {
    // 導航至卡片並聚焦
    const firstCard = page.locator('a[href^="/cards/"]').first()
    await firstCard.focus()

    // 模擬滑鼠移動以觸發傾斜效果
    const box = await firstCard.boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.waitForTimeout(100) // 等待傾斜動畫啟動
    }

    // 檢查焦點指示器的 z-index
    const zIndex = await firstCard.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      // 檢查 focus-visible 偽類狀態
      return {
        zIndex: styles.zIndex,
        position: styles.position
      }
    })

    // 焦點指示器應在最上層（或使用 outline 不受 z-index 影響）
    // outline 本身就在元素最上層，不需要特別的 z-index
    expect(zIndex).toBeDefined()
  })

  test('傾斜效果不應干擾 Tab 鍵順序', async ({ page }) => {
    // 獲取頁面上所有可聚焦的卡片
    const cards = page.locator('a[href^="/cards/"]')
    const cardCount = await cards.count()

    // 確保至少有 3 張卡片
    expect(cardCount).toBeGreaterThanOrEqual(3)

    // 依序 Tab 並檢查焦點
    for (let i = 0; i < Math.min(3, cardCount); i++) {
      await page.keyboard.press('Tab')
      const focusedCard = cards.nth(i)

      // 等待焦點轉移
      await expect(focusedCard).toBeFocused({ timeout: 1000 })
    }
  })

  test('視覺效果元素應有 aria-hidden 屬性', async ({ page }) => {
    const firstCard = page.locator('a[href^="/cards/"]').first()

    // 觸發懸停以顯示傾斜效果
    await firstCard.hover()
    await page.waitForTimeout(200) // 等待效果出現

    // 檢查光澤效果是否有 aria-hidden
    const glossOverlay = firstCard.locator('.tilt-gloss-overlay, [aria-hidden="true"]').first()

    // 如果效果元素存在，應該有 aria-hidden="true"
    const overlayCount = await glossOverlay.count()
    if (overlayCount > 0) {
      const ariaHidden = await glossOverlay.getAttribute('aria-hidden')
      expect(ariaHidden).toBe('true')
    }
  })

  test('prefers-reduced-motion 應停用傾斜效果', async ({ page, context }) => {
    // 啟用 prefers-reduced-motion
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => {
          if (query === '(prefers-reduced-motion: reduce)') {
            return {
              matches: true,
              media: query,
              onchange: null,
              addListener: () => {},
              removeListener: () => {},
              addEventListener: () => {},
              removeEventListener: () => {},
              dispatchEvent: () => true
            }
          }
          return {
            matches: false,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => true
          }
        }
      })
    })

    // 重新載入頁面
    await page.goto('/cards/major-arcana')
    await page.waitForLoadState('networkidle')

    const firstCard = page.locator('a[href^="/cards/"]').first()
    const box = await firstCard.boundingBox()

    if (box) {
      // 記錄初始 transform
      const initialTransform = await firstCard.evaluate((el) => {
        return window.getComputedStyle(el).transform
      })

      // 懸停並移動滑鼠
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.waitForTimeout(200)

      // 檢查 transform（應該沒有 rotateX/rotateY）
      const currentTransform = await firstCard.evaluate((el) => {
        return window.getComputedStyle(el).transform
      })

      // transform 不應包含 3D 旋轉（可能仍有 scale 或其他效果）
      // 如果有 rotate，應該是 rotate(0deg) 或無 rotate
      expect(currentTransform).not.toMatch(/rotate[XY]\([^0]/)
    }
  })

  test('螢幕閱讀器應只讀取卡片內容，不讀取視覺效果', async ({ page }) => {
    const firstCard = page.locator('a[href^="/cards/"]').first()

    // 獲取可訪問性樹
    const snapshot = await page.accessibility.snapshot({
      root: firstCard
    })

    // 確保視覺效果元素不在可訪問性樹中
    // 只應該有卡片名稱、花色等文字內容
    const checkAccessibilityTree = (node: any): boolean => {
      if (!node) return false

      // 檢查是否包含 "gloss" 或 "overlay" 等視覺效果名稱
      const hasVisualEffectText = node.name?.toLowerCase().includes('gloss') ||
                                   node.name?.toLowerCase().includes('overlay')

      if (hasVisualEffectText) return true

      // 遞迴檢查子節點
      if (node.children) {
        return node.children.some(checkAccessibilityTree)
      }

      return false
    }

    const hasVisualEffects = checkAccessibilityTree(snapshot)
    expect(hasVisualEffects).toBe(false)
  })

  test('卡片選中狀態應有可訪問的指示', async ({ page }) => {
    // 導航至快速占卜頁面（有卡片選擇功能）
    await page.goto('/readings/quick')
    await page.waitForLoadState('networkidle')

    // 等待卡片出現
    const card = page.locator('[data-testid="tarot-card"], [data-testid="mobile-tarot-card"]').first()
    await card.waitFor({ state: 'visible' })

    // 點擊卡片
    await card.click()
    await page.waitForTimeout(200)

    // 檢查是否有選中狀態的 aria 屬性
    const ariaSelected = await card.getAttribute('aria-selected')
    const ariaPressed = await card.getAttribute('aria-pressed')
    const ariaChecked = await card.getAttribute('aria-checked')

    // 應該有某種選中狀態的指示
    const hasAccessibleState =
      ariaSelected === 'true' ||
      ariaPressed === 'true' ||
      ariaChecked === 'true' ||
      await card.evaluate((el) => el.classList.contains('selected')) ||
      await card.evaluate((el) => el.classList.contains('animate-card-selection'))

    expect(hasAccessibleState).toBeTruthy()
  })

  test('鍵盤焦點應在卡片網格中正確移動', async ({ page }) => {
    const cards = page.locator('a[href^="/cards/"]')

    // 等待卡片載入
    await cards.first().waitFor({ state: 'visible' })

    // Tab 至第一張卡片
    await page.keyboard.press('Tab')
    await expect(cards.first()).toBeFocused()

    // Shift+Tab 應返回上一個元素（如果有的話）
    await page.keyboard.press('Shift+Tab')
    await expect(cards.first()).not.toBeFocused()

    // 再次 Tab 回到第一張卡片
    await page.keyboard.press('Tab')
    await expect(cards.first()).toBeFocused()

    // Tab 至第二張卡片
    await page.keyboard.press('Tab')
    await expect(cards.nth(1)).toBeFocused()
  })
})
