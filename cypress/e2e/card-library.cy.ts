/**
 * Card Library and Exploration E2E Tests
 * Tests card browsing, filtering, and detail viewing
 */

describe('Card Library', () => {
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

  describe('Card Browsing', () => {
    it('應該顯示所有塔羅牌', () => {
      cy.visit('/cards')

      // 驗證卡片網格顯示
      cy.get('[data-testid="card-grid"]').should('be.visible')

      // 驗證卡片數量（78張標準塔羅牌）
      cy.get('[data-testid="card-item"]').should('have.length', 78)
    })

    it('應該顯示大阿爾克那牌', () => {
      cy.visit('/cards')

      // 選擇大阿爾克那篩選
      cy.get('[data-testid="arcana-filter"]').select('major')

      // 驗證顯示22張大阿爾克那牌
      cy.get('[data-testid="card-item"]').should('have.length', 22)

      // 驗證第一張是 The Fool (0號牌)
      cy.get('[data-testid="card-item"]')
        .first()
        .invoke('text')
        .should('match', /(The Fool|愚者)/)
    })

    it('應該顯示小阿爾克那牌', () => {
      cy.visit('/cards')

      // 選擇小阿爾克那篩選
      cy.get('[data-testid="arcana-filter"]').select('minor')

      // 驗證顯示56張小阿爾克那牌
      cy.get('[data-testid="card-item"]').should('have.length', 56)
    })

    it('應該按花色篩選', () => {
      cy.visit('/cards')

      // 選擇輻射之棒（權杖）
      cy.get('[data-testid="suit-filter"]').select('radiation_rods')

      // 驗證顯示14張該花色的牌
      cy.get('[data-testid="card-item"]').should('have.length', 14)

      // 驗證都是輻射之棒花色
      cy.get('[data-testid="card-item"]').each(($card) => {
        cy.wrap($card)
          .find('[data-testid="card-suit"]')
          .invoke('text')
          .should('match', /(Radiation Rods|輻射之棒)/)
      })
    })

    it('應該顯示卡片網格和列表視圖', () => {
      cy.visit('/cards')

      // 預設網格視圖
      cy.get('[data-testid="card-grid"]').should('be.visible')

      // 切換到列表視圖
      cy.get('[data-testid="view-toggle-list"]').click()

      cy.get('[data-testid="card-list"]').should('be.visible')
      cy.get('[data-testid="card-grid"]').should('not.exist')

      // 切換回網格視圖
      cy.get('[data-testid="view-toggle-grid"]').click()

      cy.get('[data-testid="card-grid"]').should('be.visible')
      cy.get('[data-testid="card-list"]').should('not.exist')
    })
  })

  describe('Card Search', () => {
    beforeEach(() => {
      cy.visit('/cards')
    })

    it('應該能搜尋卡片名稱', () => {
      const searchTerm = 'Fool'

      cy.get('[data-testid="search-input"]').type(searchTerm)

      // 驗證搜尋結果
      cy.get('[data-testid="card-item"]').should('have.length.at.least', 1)

      cy.get('[data-testid="card-item"]').each(($card) => {
        cy.wrap($card)
          .find('[data-testid="card-name"]')
          .invoke('text')
          .should('match', new RegExp(searchTerm, 'i'))
      })
    })

    it('應該能搜尋中文卡片名稱', () => {
      const searchTerm = '愚者'

      cy.get('[data-testid="search-input"]').type(searchTerm)

      cy.get('[data-testid="card-item"]').should('have.length.at.least', 1)
    })

    it('應該顯示無搜尋結果訊息', () => {
      cy.get('[data-testid="search-input"]').type('NonExistentCard12345')

      cy.get('[data-testid="no-results"]')
        .should('be.visible')
        .and('contain', '找不到')
    })

    it('應該能清除搜尋', () => {
      cy.get('[data-testid="search-input"]').type('Fool')
      cy.get('[data-testid="card-item"]').should('have.length.lessThan', 78)

      // 清除搜尋
      cy.get('[data-testid="clear-search"]').click()

      // 驗證顯示所有卡片
      cy.get('[data-testid="card-item"]').should('have.length', 78)
    })
  })

  describe('Card Detail', () => {
    it('應該顯示卡片詳細資訊', () => {
      cy.visit('/cards')

      // 點擊第一張卡片
      cy.get('[data-testid="card-item"]').first().click()

      // 驗證詳情頁面元素
      cy.get('[data-testid="card-detail"]').should('be.visible')
      cy.get('[data-testid="card-image"]').should('be.visible')
      cy.get('[data-testid="card-name"]').should('be.visible')
      cy.get('[data-testid="card-number"]').should('be.visible')
      cy.get('[data-testid="card-arcana"]').should('be.visible')
      cy.get('[data-testid="card-description"]').should('be.visible')
    })

    it('應該顯示正位和逆位含義', () => {
      cy.visit('/cards')

      cy.get('[data-testid="card-item"]').first().click()

      // 驗證正位含義
      cy.get('[data-testid="upright-meaning"]').should('be.visible')
      cy.get('[data-testid="upright-keywords"]').should('be.visible')

      // 驗證逆位含義
      cy.get('[data-testid="reversed-meaning"]').should('be.visible')
      cy.get('[data-testid="reversed-keywords"]').should('be.visible')
    })

    it('應該顯示廢土主題詮釋', () => {
      cy.visit('/cards')

      cy.get('[data-testid="card-item"]').first().click()

      // 驗證廢土詮釋
      cy.get('[data-testid="wasteland-interpretation"]').should('be.visible')
      cy.get('[data-testid="faction-alignment"]').should('be.visible')
      cy.get('[data-testid="radiation-level"]').should('be.visible')
    })

    it('應該能切換卡片正逆位', () => {
      cy.visit('/cards')

      cy.get('[data-testid="card-item"]').first().click()

      // 預設正位
      cy.get('[data-testid="card-image"]').should('not.have.class', 'reversed')

      // 點擊翻轉按鈕
      cy.get('[data-testid="toggle-reversed"]').click()

      // 驗證逆位
      cy.get('[data-testid="card-image"]').should('have.class', 'reversed')

      // 驗證顯示逆位含義
      cy.get('[data-testid="reversed-meaning"]').should('have.class', 'active')
    })

    it('應該顯示相關卡片', () => {
      cy.visit('/cards')

      cy.get('[data-testid="card-item"]').first().click()

      // 驗證相關卡片區塊
      cy.get('[data-testid="related-cards"]').should('be.visible')
      cy.get('[data-testid="related-card-item"]').should('have.length.at.least', 3)
    })

    it('應該能導航到相關卡片', () => {
      cy.visit('/cards')

      cy.get('[data-testid="card-item"]').first().click()

      // 記錄當前卡片名稱
      cy.get('[data-testid="card-name"]').invoke('text').as('originalCard')

      // 點擊相關卡片
      cy.get('[data-testid="related-card-item"]').first().click()

      // 驗證切換到新卡片
      cy.get('@originalCard').then((originalCard) => {
        cy.get('[data-testid="card-name"]')
          .invoke('text')
          .should('not.equal', originalCard)
      })
    })

    it('應該能收藏卡片', () => {
      cy.visit('/cards')

      cy.get('[data-testid="card-item"]').first().click()

      // 點擊收藏按鈕
      cy.get('[data-testid="favorite-card"]').click()

      // 驗證收藏成功
      cy.get('[data-testid="favorite-card"]').should('have.class', 'favorited')

      // 回到卡片列表
      cy.visit('/cards')

      // 篩選收藏的卡片
      cy.get('[data-testid="filter-favorited"]').click()

      // 驗證顯示收藏的卡片
      cy.get('[data-testid="card-item"]').should('have.length.at.least', 1)
    })
  })

  describe('Card Learning', () => {
    it('應該顯示學習進度', () => {
      cy.visit('/cards')

      // 點擊學習模式
      cy.get('[data-testid="study-mode"]').click()

      // 驗證學習進度顯示
      cy.get('[data-testid="study-progress"]').should('be.visible')
      cy.get('[data-testid="cards-mastered"]').should('be.visible')
      cy.get('[data-testid="cards-learning"]').should('be.visible')
    })

    it('應該能練習卡片記憶', () => {
      cy.visit('/cards')

      cy.get('[data-testid="study-mode"]').click()

      // 開始練習
      cy.get('[data-testid="start-practice"]').click()

      // 驗證顯示卡片背面
      cy.get('[data-testid="card-back"]').should('be.visible')

      // 點擊翻牌
      cy.get('[data-testid="flip-card"]').click()

      // 驗證顯示卡片正面
      cy.get('[data-testid="card-front"]').should('be.visible')

      // 評估記憶程度
      cy.get('[data-testid="rate-again"]').should('be.visible')
      cy.get('[data-testid="rate-hard"]').should('be.visible')
      cy.get('[data-testid="rate-good"]').should('be.visible')
      cy.get('[data-testid="rate-easy"]').should('be.visible')
    })
  })

  describe('Card Comparison', () => {
    it('應該能比較多張卡片', () => {
      cy.visit('/cards')

      // 選擇比較模式
      cy.get('[data-testid="comparison-mode"]').click()

      // 選擇第一張卡片
      cy.get('[data-testid="card-item"]').eq(0).click()

      // 選擇第二張卡片
      cy.get('[data-testid="card-item"]').eq(1).click()

      // 選擇第三張卡片
      cy.get('[data-testid="card-item"]').eq(2).click()

      // 點擊開始比較
      cy.get('[data-testid="start-comparison"]').click()

      // 驗證比較視圖
      cy.get('[data-testid="comparison-view"]').should('be.visible')
      cy.get('[data-testid="compared-card"]').should('have.length', 3)

      // 驗證並排顯示
      cy.get('[data-testid="comparison-table"]').should('be.visible')
    })
  })

  describe('Accessibility', () => {
    it('應該可鍵盤導航卡片網格', () => {
      cy.visit('/cards')

      // Tab 到第一張卡片
      cy.get('body').type('{tab}')
      cy.focused().should('have.attr', 'data-testid', 'card-item')

      // 使用方向鍵導航
      cy.focused().type('{rightarrow}')
      cy.focused().should('have.attr', 'data-testid', 'card-item')
    })

    it('應該有正確的 ARIA 標籤', () => {
      cy.visit('/cards')

      cy.get('[data-testid="card-grid"]').should('have.attr', 'role', 'grid')

      cy.get('[data-testid="card-item"]').each(($card) => {
        cy.wrap($card).should('have.attr', 'role', 'gridcell')
        cy.wrap($card).should('have.attr', 'aria-label')
      })
    })
  })

  describe('Performance', () => {
    it('應該快速載入卡片圖片', () => {
      cy.visit('/cards')

      // 驗證圖片在合理時間內載入
      cy.get('[data-testid="card-item"]').first().within(() => {
        cy.get('img', { timeout: 5000 }).should('be.visible').and(($img) => {
          expect($img[0].naturalWidth).to.be.greaterThan(0)
        })
      })
    })

    it('應該使用圖片懶加載', () => {
      cy.visit('/cards')

      // 驗證屏幕外的圖片使用 lazy loading
      cy.get('[data-testid="card-item"]').eq(50).within(() => {
        cy.get('img').should('have.attr', 'loading', 'lazy')
      })
    })
  })

  describe('Responsive Design', () => {
    it('應該在手機上調整卡片網格', () => {
      cy.viewport('iphone-x')

      cy.visit('/cards')

      // 驗證單列或雙列網格
      cy.get('[data-testid="card-grid"]').should('have.css', 'grid-template-columns')
    })

    it('應該在平板上顯示多列網格', () => {
      cy.viewport('ipad-2')

      cy.visit('/cards')

      // 驗證多列網格
      cy.get('[data-testid="card-grid"]').should('have.css', 'grid-template-columns')
    })
  })
})
