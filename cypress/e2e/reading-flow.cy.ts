/**
 * Reading Creation and Management Flow E2E Tests
 * Tests the complete reading creation, viewing, and management journey
 */

describe('Reading Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()

    // Login first
    cy.visit('/auth/login')
    cy.get('input[name="username"]').type('test_user')
    cy.get('input[name="password"]').type('test_password')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/dashboard')
  })

  describe('Reading Creation', () => {
    it('應該創建新的單張占卜', () => {
      cy.visit('/readings/new')

      // 驗證頁面載入
      cy.get('[data-testid="reading-form"]').should('be.visible')

      // 輸入問題
      const question = '我今天的運勢如何？'
      cy.get('[data-testid="question-input"]').type(question)

      // 選擇單張占卜
      cy.get('[data-testid="spread-selector"]').select('single_wasteland')

      // 選擇角色聲音
      cy.get('[data-testid="voice-selector"]').select('pip_boy')

      // 開始占卜
      cy.get('[data-testid="start-reading"]').click()

      // 等待卡片抽取
      cy.get('[data-testid="card-drawing"]').should('be.visible')

      // 驗證卡片顯示
      cy.get('[data-testid="drawn-card"]', { timeout: 10000 }).should('be.visible')

      // 點擊卡片翻面
      cy.get('[data-testid="drawn-card"]').click()

      // 等待 AI 解讀
      cy.get('[data-testid="interpretation-text"]', { timeout: 15000 })
        .should('be.visible')
        .and('not.be.empty')

      // 驗證問題顯示
      cy.get('[data-testid="reading-question"]').should('contain', question)
    })

    it('應該創建三張占卜', () => {
      cy.visit('/readings/new')

      cy.get('[data-testid="question-input"]').type('我的愛情運勢如何？')
      cy.get('[data-testid="spread-selector"]').select('vault_tec_spread')
      cy.get('[data-testid="start-reading"]').click()

      // 驗證三張卡片
      cy.get('[data-testid="drawn-cards"]').should('have.length', 3)

      // 翻開所有卡片
      cy.get('[data-testid="card-0"]').click()
      cy.get('[data-testid="card-1"]').click()
      cy.get('[data-testid="card-2"]').click()

      // 驗證每張卡片都有解讀
      cy.get('[data-testid="interpretation-0"]').should('be.visible')
      cy.get('[data-testid="interpretation-1"]').should('be.visible')
      cy.get('[data-testid="interpretation-2"]').should('be.visible')

      // 驗證位置標籤
      cy.get('[data-testid="position-0"]').should('contain', '過去')
      cy.get('[data-testid="position-1"]').should('contain', '現在')
      cy.get('[data-testid="position-2"]').should('contain', '未來')
    })

    it('應該驗證必填欄位', () => {
      cy.visit('/readings/new')

      // 不填寫問題，直接開始
      cy.get('[data-testid="start-reading"]').click()

      // 驗證錯誤訊息
      cy.get('[data-testid="question-error"]')
        .should('be.visible')
        .and('contain', '請輸入問題')
    })

    it('應該能跳過 AI 解讀動畫', () => {
      cy.visit('/readings/new')

      cy.get('[data-testid="question-input"]').type('測試問題')
      cy.get('[data-testid="spread-selector"]').select('single_wasteland')
      cy.get('[data-testid="start-reading"]').click()

      // 等待卡片顯示
      cy.get('[data-testid="drawn-card"]').should('be.visible').click()

      // 等待串流開始
      cy.get('[data-testid="interpretation-text"]').should('be.visible')

      // 點擊跳過按鈕
      cy.get('[data-testid="skip-animation"]').click()

      // 驗證完整文字立即顯示
      cy.get('[data-testid="interpretation-complete"]').should('be.visible')
    })

    it('應該保存占卜結果', () => {
      cy.visit('/readings/new')

      const question = '我的事業運勢如何？'
      cy.get('[data-testid="question-input"]').type(question)
      cy.get('[data-testid="spread-selector"]').select('single_wasteland')
      cy.get('[data-testid="start-reading"]').click()

      cy.get('[data-testid="drawn-card"]').should('be.visible').click()
      cy.get('[data-testid="interpretation-text"]', { timeout: 15000 }).should('be.visible')

      // 點擊保存按鈕
      cy.get('[data-testid="save-reading"]').click()

      // 驗證保存成功訊息
      cy.get('[data-testid="save-success"]')
        .should('be.visible')
        .and('contain', '已保存')

      // 導向到歷史記錄
      cy.visit('/readings')

      // 驗證最新的占卜記錄
      cy.get('[data-testid="reading-item"]')
        .first()
        .should('contain', question)
    })
  })

  describe('Reading History', () => {
    beforeEach(() => {
      cy.visit('/readings')
    })

    it('應該顯示占卜歷史列表', () => {
      cy.get('[data-testid="readings-list"]').should('be.visible')
      cy.get('[data-testid="reading-item"]').should('have.length.at.least', 1)
    })

    it('應該能篩選占卜記錄', () => {
      // 選擇日期範圍
      cy.get('[data-testid="date-filter"]').click()
      cy.get('[data-testid="date-range-last-week"]').click()

      // 驗證篩選後的結果
      cy.get('[data-testid="reading-item"]').each(($item) => {
        cy.wrap($item)
          .find('[data-testid="reading-date"]')
          .should('satisfy', (date: string) => {
            const readingDate = new Date(date)
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return readingDate >= weekAgo
          })
      })
    })

    it('應該能搜尋占卜記錄', () => {
      const searchTerm = '運勢'

      cy.get('[data-testid="search-input"]').type(searchTerm)

      // 驗證搜尋結果
      cy.get('[data-testid="reading-item"]').each(($item) => {
        cy.wrap($item)
          .find('[data-testid="reading-question"]')
          .should('contain', searchTerm)
      })
    })

    it('應該能查看占卜詳情', () => {
      // 點擊第一筆記錄
      cy.get('[data-testid="reading-item"]').first().click()

      // 驗證詳情頁面
      cy.get('[data-testid="reading-detail"]').should('be.visible')
      cy.get('[data-testid="reading-question"]').should('be.visible')
      cy.get('[data-testid="reading-cards"]').should('be.visible')
      cy.get('[data-testid="reading-interpretation"]').should('be.visible')
      cy.get('[data-testid="reading-timestamp"]').should('be.visible')
    })

    it('應該能刪除占卜記錄', () => {
      // 記錄初始數量
      cy.get('[data-testid="reading-item"]').then(($items) => {
        const initialCount = $items.length

        // 點擊刪除按鈕
        cy.get('[data-testid="reading-item"]')
          .first()
          .find('[data-testid="delete-reading"]')
          .click()

        // 確認刪除
        cy.get('[data-testid="delete-confirm"]').should('be.visible')
        cy.get('[data-testid="delete-confirm-yes"]').click()

        // 驗證刪除成功
        cy.get('[data-testid="delete-success"]')
          .should('be.visible')
          .and('contain', '已刪除')

        // 驗證數量減少
        cy.get('[data-testid="reading-item"]').should('have.length', initialCount - 1)
      })
    })

    it('應該能匯出占卜記錄', () => {
      cy.get('[data-testid="export-readings"]').click()

      // 選擇匯出格式
      cy.get('[data-testid="export-format"]').select('json')

      // 點擊確認匯出
      cy.get('[data-testid="export-confirm"]').click()

      // 驗證下載（檢查下載連結）
      cy.get('[data-testid="download-link"]')
        .should('have.attr', 'download')
        .and('include', '.json')
    })
  })

  describe('Reading Detail', () => {
    it('應該能添加註記', () => {
      cy.visit('/readings')
      cy.get('[data-testid="reading-item"]').first().click()

      // 點擊添加註記
      cy.get('[data-testid="add-note"]').click()

      const note = '這個解讀很準確，事情後來真的這樣發展'
      cy.get('[data-testid="note-input"]').type(note)
      cy.get('[data-testid="save-note"]').click()

      // 驗證註記保存
      cy.get('[data-testid="reading-notes"]')
        .should('be.visible')
        .and('contain', note)
    })

    it('應該能分享占卜', () => {
      cy.visit('/readings')
      cy.get('[data-testid="reading-item"]').first().click()

      // 點擊分享按鈕
      cy.get('[data-testid="share-reading"]').click()

      // 驗證分享對話框
      cy.get('[data-testid="share-dialog"]').should('be.visible')

      // 複製分享連結
      cy.get('[data-testid="copy-share-link"]').click()

      // 驗證複製成功提示
      cy.get('[data-testid="copy-success"]')
        .should('be.visible')
        .and('contain', '已複製')
    })

    it('應該能標記為最愛', () => {
      cy.visit('/readings')
      cy.get('[data-testid="reading-item"]').first().click()

      // 點擊最愛按鈕
      cy.get('[data-testid="favorite-toggle"]').click()

      // 驗證已標記
      cy.get('[data-testid="favorite-toggle"]').should('have.class', 'favorited')

      // 回到列表驗證
      cy.visit('/readings')
      cy.get('[data-testid="reading-item"]')
        .first()
        .find('[data-testid="favorite-icon"]')
        .should('be.visible')
    })
  })

  describe('Streaming Interpretation', () => {
    it('應該顯示串流解讀動畫', () => {
      cy.visit('/readings/new')

      cy.get('[data-testid="question-input"]').type('測試串流')
      cy.get('[data-testid="spread-selector"]').select('single_wasteland')
      cy.get('[data-testid="start-reading"]').click()

      cy.get('[data-testid="drawn-card"]').should('be.visible').click()

      // 驗證載入狀態
      cy.get('[data-testid="interpretation-loading"]').should('be.visible')

      // 驗證文字逐漸顯示
      cy.get('[data-testid="interpretation-text"]').should('be.visible')

      // 等待一段時間，確認文字在增長
      cy.wait(2000)

      cy.get('[data-testid="interpretation-text"]').then(($text1) => {
        const length1 = $text1.text().length

        cy.wait(2000)

        cy.get('[data-testid="interpretation-text"]').then(($text2) => {
          const length2 = $text2.text().length
          expect(length2).to.be.greaterThan(length1)
        })
      })
    })

    it('應該處理串流錯誤', () => {
      // Mock API 錯誤
      cy.intercept('POST', '**/api/v1/readings/interpretation/stream', {
        statusCode: 500,
        body: { error: 'AI service unavailable' },
      }).as('streamError')

      cy.visit('/readings/new')

      cy.get('[data-testid="question-input"]').type('測試錯誤')
      cy.get('[data-testid="spread-selector"]').select('single_wasteland')
      cy.get('[data-testid="start-reading"]').click()

      cy.get('[data-testid="drawn-card"]').should('be.visible').click()

      cy.wait('@streamError')

      // 驗證錯誤訊息
      cy.get('[data-testid="interpretation-error"]')
        .should('be.visible')
        .and('contain', '解讀生成失敗')

      // 驗證重試按鈕
      cy.get('[data-testid="retry-interpretation"]').should('be.visible')
    })
  })

  describe('Responsive Design', () => {
    it('應該在手機上正常顯示', () => {
      cy.viewport('iphone-x')

      cy.visit('/readings/new')

      // 驗證表單可見性
      cy.get('[data-testid="reading-form"]').should('be.visible')
      cy.get('[data-testid="question-input"]').should('be.visible')
      cy.get('[data-testid="spread-selector"]').should('be.visible')

      // 驗證按鈕可點擊
      cy.get('[data-testid="start-reading"]').should('be.visible').and('not.be.disabled')
    })

    it('應該在平板上正常顯示', () => {
      cy.viewport('ipad-2')

      cy.visit('/readings')

      // 驗證列表顯示
      cy.get('[data-testid="readings-list"]').should('be.visible')
      cy.get('[data-testid="reading-item"]').should('have.length.at.least', 1)
    })
  })

  describe('Performance', () => {
    it('應該在合理時間內完成占卜', () => {
      cy.visit('/readings/new')

      const startTime = Date.now()

      cy.get('[data-testid="question-input"]').type('效能測試')
      cy.get('[data-testid="spread-selector"]').select('single_wasteland')
      cy.get('[data-testid="start-reading"]').click()

      cy.get('[data-testid="drawn-card"]', { timeout: 5000 })
        .should('be.visible')
        .then(() => {
          const cardDrawTime = Date.now() - startTime
          expect(cardDrawTime).to.be.lessThan(5000)
        })

      cy.get('[data-testid="drawn-card"]').click()

      cy.get('[data-testid="interpretation-text"]', { timeout: 15000 })
        .should('be.visible')
        .then(() => {
          const totalTime = Date.now() - startTime
          expect(totalTime).to.be.lessThan(20000)
        })
    })
  })
})
