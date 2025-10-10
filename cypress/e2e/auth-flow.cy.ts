/**
 * Authentication Flow E2E Tests
 * Tests login, logout, and authentication error handling
 */

describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  describe('Login Flow', () => {
    it('應該成功登入並導向儀表板', () => {
      cy.visit('/auth/login')

      // 驗證登入頁面元素
      cy.get('[data-testid="login-form"]').should('be.visible')
      cy.get('input[name="username"]').should('be.visible')
      cy.get('input[name="password"]').should('be.visible')
      cy.get('button[type="submit"]').should('contain', '登入')

      // 填寫登入表單
      cy.get('input[name="username"]').type('test_user')
      cy.get('input[name="password"]').type('test_password')

      // 提交表單
      cy.get('button[type="submit"]').click()

      // 驗證登入成功
      cy.url().should('include', '/dashboard')
      cy.get('[data-testid="user-profile"]').should('be.visible')

      // 驗證 localStorage 有 token
      cy.window().then((window) => {
        expect(window.localStorage.getItem('auth_token')).to.exist
      })
    })

    it('應該顯示登入錯誤訊息', () => {
      cy.visit('/auth/login')

      // 輸入錯誤的憑證
      cy.get('input[name="username"]').type('wrong_user')
      cy.get('input[name="password"]').type('wrong_password')
      cy.get('button[type="submit"]').click()

      // 驗證錯誤訊息
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', '登入失敗')

      // 確保沒有導向
      cy.url().should('include', '/auth/login')
    })

    it('應該驗證必填欄位', () => {
      cy.visit('/auth/login')

      // 直接提交空表單
      cy.get('button[type="submit"]').click()

      // 驗證欄位錯誤訊息
      cy.get('input[name="username"]:invalid').should('exist')
      cy.get('input[name="password"]:invalid').should('exist')
    })

    it('應該顯示密碼可見性切換', () => {
      cy.visit('/auth/login')

      cy.get('input[name="password"]').should('have.attr', 'type', 'password')

      // 點擊顯示密碼按鈕
      cy.get('[data-testid="toggle-password-visibility"]').click()

      cy.get('input[name="password"]').should('have.attr', 'type', 'text')

      // 再次點擊隱藏密碼
      cy.get('[data-testid="toggle-password-visibility"]').click()

      cy.get('input[name="password"]').should('have.attr', 'type', 'password')
    })

    it('應該有註冊連結', () => {
      cy.visit('/auth/login')

      cy.get('[data-testid="register-link"]')
        .should('be.visible')
        .and('contain', '註冊')
        .click()

      cy.url().should('include', '/auth/register')
    })
  })

  describe('Registration Flow', () => {
    it('應該成功註冊新用戶', () => {
      cy.visit('/auth/register')

      // 填寫註冊表單
      const username = `test_user_${Date.now()}`
      const email = `${username}@wasteland.com`

      cy.get('input[name="username"]').type(username)
      cy.get('input[name="email"]').type(email)
      cy.get('input[name="password"]').type('SecurePassword123!')
      cy.get('input[name="confirmPassword"]').type('SecurePassword123!')

      // 同意條款
      cy.get('input[name="agreeToTerms"]').check()

      // 提交表單
      cy.get('button[type="submit"]').click()

      // 驗證註冊成功
      cy.get('[data-testid="registration-success"]')
        .should('be.visible')
        .and('contain', '註冊成功')
    })

    it('應該驗證密碼一致性', () => {
      cy.visit('/auth/register')

      cy.get('input[name="username"]').type('test_user')
      cy.get('input[name="email"]').type('test@wasteland.com')
      cy.get('input[name="password"]').type('Password123!')
      cy.get('input[name="confirmPassword"]').type('DifferentPassword123!')

      cy.get('button[type="submit"]').click()

      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', '密碼不一致')
    })

    it('應該驗證電子郵件格式', () => {
      cy.visit('/auth/register')

      cy.get('input[name="email"]').type('invalid-email')
      cy.get('input[name="username"]').click() // blur email field

      cy.get('[data-testid="email-error"]')
        .should('be.visible')
        .and('contain', '電子郵件格式不正確')
    })

    it('應該驗證用戶名可用性', () => {
      cy.visit('/auth/register')

      cy.get('input[name="username"]').type('existing_user')
      cy.get('input[name="email"]').click() // blur username field

      // 等待驗證請求
      cy.wait(1000)

      cy.get('[data-testid="username-error"]')
        .should('be.visible')
        .and('contain', '用戶名已存在')
    })
  })

  describe('Logout Flow', () => {
    beforeEach(() => {
      // 先登入
      cy.visit('/auth/login')
      cy.get('input[name="username"]').type('test_user')
      cy.get('input[name="password"]').type('test_password')
      cy.get('button[type="submit"]').click()
      cy.url().should('include', '/dashboard')
    })

    it('應該成功登出', () => {
      // 點擊登出按鈕
      cy.get('[data-testid="logout-button"]').click()

      // 驗證確認對話框
      cy.get('[data-testid="logout-confirm"]').should('be.visible')
      cy.get('[data-testid="logout-confirm-yes"]').click()

      // 驗證登出成功
      cy.url().should('include', '/auth/login')

      // 驗證 localStorage 已清除
      cy.window().then((window) => {
        expect(window.localStorage.getItem('auth_token')).to.be.null
      })
    })

    it('應該能取消登出', () => {
      cy.get('[data-testid="logout-button"]').click()
      cy.get('[data-testid="logout-confirm"]').should('be.visible')
      cy.get('[data-testid="logout-confirm-no"]').click()

      // 應該仍在儀表板
      cy.url().should('include', '/dashboard')
    })
  })

  describe('Protected Routes', () => {
    it('應該重導向未認證用戶到登入頁', () => {
      cy.visit('/dashboard')

      // 應該被重導向到登入頁
      cy.url().should('include', '/auth/login')

      // 應該顯示提示訊息
      cy.get('[data-testid="auth-required-message"]')
        .should('be.visible')
        .and('contain', '請先登入')
    })

    it('應該記住重導向前的頁面', () => {
      // 嘗試訪問受保護的頁面
      cy.visit('/readings/new')

      // 重導向到登入
      cy.url().should('include', '/auth/login')

      // 登入
      cy.get('input[name="username"]').type('test_user')
      cy.get('input[name="password"]').type('test_password')
      cy.get('button[type="submit"]').click()

      // 應該回到原本要訪問的頁面
      cy.url().should('include', '/readings/new')
    })
  })

  describe('Token Expiration', () => {
    it('應該處理過期的 token', () => {
      // 設定一個過期的 token
      cy.window().then((window) => {
        window.localStorage.setItem('auth_token', 'expired_token_12345')
      })

      cy.visit('/dashboard')

      // 應該重導向到登入
      cy.url().should('include', '/auth/login')

      // 顯示 session 過期訊息
      cy.get('[data-testid="session-expired-message"]')
        .should('be.visible')
        .and('contain', '登入已過期')
    })
  })

  describe('Accessibility', () => {
    it('登入表單應該可鍵盤導航', () => {
      cy.visit('/auth/login')

      // Tab 順序測試
      cy.get('body').type('{tab}')
      cy.focused().should('have.attr', 'name', 'username')

      cy.focused().type('{tab}')
      cy.focused().should('have.attr', 'name', 'password')

      cy.focused().type('{tab}')
      cy.focused().should('have.attr', 'type', 'submit')
    })

    it('應該有正確的 ARIA 標籤', () => {
      cy.visit('/auth/login')

      cy.get('input[name="username"]')
        .should('have.attr', 'aria-label')
        .and('not.be.empty')

      cy.get('input[name="password"]')
        .should('have.attr', 'aria-label')
        .and('not.be.empty')

      cy.get('button[type="submit"]')
        .should('have.attr', 'aria-label')
    })
  })
})
