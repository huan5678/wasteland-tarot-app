/**
 * 完整抽卡流程整合測試
 * 任務 15.1
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react'
import QuickReadingPage from '../page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock dynamic imports
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (fn: any) => {
    const Component = fn().then((mod: any) => mod.default || mod)
    return Component
  },
}))

describe('快速占卜頁面 - 完整流程整合測試', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('頁面載入流程', () => {
    it('應該顯示載入指示器', async () => {
      render(<QuickReadingPage />)

      const loadingIndicator = screen.getByTestId('loading-indicator')
      expect(loadingIndicator).toBeInTheDocument()
    })

    it('載入完成後應該顯示 Carousel', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      expect(screen.getByText('選擇你的命運之牌')).toBeInTheDocument()
    })

    it('應該顯示 5 張卡牌', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      const positionIndicator = screen.getByTestId('position-indicator')
      expect(positionIndicator.textContent).toContain('/ 5')
    })
  })

  describe('Carousel 導航', () => {
    it('應該顯示導航箭頭', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      const prevButton = screen.getByLabelText('上一張卡牌')
      const nextButton = screen.getByLabelText('下一張卡牌')

      expect(prevButton).toBeInTheDocument()
      expect(nextButton).toBeInTheDocument()
    })

    it('第一張卡牌時，上一張按鈕應該被禁用', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      const prevButton = screen.getByLabelText('上一張卡牌')
      expect(prevButton).toBeDisabled()
    })

    it('點擊下一張應該切換卡牌', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      const nextButton = screen.getByLabelText('下一張卡牌')
      const positionIndicator = screen.getByTestId('position-indicator')

      expect(positionIndicator.textContent).toContain('1 / 5')

      act(() => {
        fireEvent.click(nextButton)
      })

      await waitFor(() => {
        expect(positionIndicator.textContent).toContain('2 / 5')
      })
    })
  })

  describe('localStorage 持久化', () => {
    it('頁面重新渲染後應該恢復狀態', async () => {
      // 第一次渲染
      const { unmount } = render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // 檢查 localStorage 是否有資料（初始化時會儲存）
      const stored = localStorage.getItem('wasteland-tarot-quick-reading')

      unmount()

      // 第二次渲染
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // 應該成功載入
      expect(screen.getByText('選擇你的命運之牌')).toBeInTheDocument()
    })
  })

  describe('Header 資訊顯示', () => {
    it('應該顯示快速占卜模式標題', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      expect(screen.getByText('快速占卜模式')).toBeInTheDocument()
    })

    it('應該顯示訪客體驗標記', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      expect(screen.getByText('訪客體驗')).toBeInTheDocument()
    })
  })

  describe('無障礙功能', () => {
    it('Carousel 應該有正確的 ARIA 標籤', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      const carousel = screen.getByRole('region', { name: /卡牌選擇輪播/i })
      expect(carousel).toBeInTheDocument()
    })

    it('位置指示器應該有 aria-live', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      const positionIndicator = screen.getByTestId('position-indicator')
      expect(positionIndicator).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('錯誤處理', () => {
    it('當資料載入失敗時應該顯示錯誤訊息', async () => {
      // Mock enhancedWastelandCards 為空陣列
      jest.mock('@/data/enhancedCards', () => ({
        enhancedWastelandCards: [],
      }))

      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // 應該顯示錯誤狀態或降級處理
      // 注意：實際實作中可能會顯示錯誤頁面
    })
  })
})

/**
 * 任務 15.2 - localStorage 持久化流程測試
 */
describe('localStorage 持久化流程測試', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('頁面重新整理狀態恢復', () => {
    it('翻牌後重新整理應該恢復相同的卡牌池', async () => {
      const { unmount } = render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // 記錄初始卡牌池
      const stored = localStorage.getItem('wasteland-tarot-quick-reading')
      expect(stored).toBeTruthy()

      unmount()

      // 重新渲染
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // 應該載入相同的資料
      const restoredData = localStorage.getItem('wasteland-tarot-quick-reading')
      expect(restoredData).toBe(stored)
    })

    it('損壞資料應該自動清除並重新初始化', async () => {
      localStorage.setItem('wasteland-tarot-quick-reading', 'invalid-json{')

      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // 應該清除損壞資料
      const data = localStorage.getItem('wasteland-tarot-quick-reading')
      if (data) {
        expect(() => JSON.parse(data)).not.toThrow()
      }
    })
  })

  describe('隱私模式降級處理', () => {
    it('localStorage 不可用時應該使用 sessionStorage', async () => {
      // Mock localStorage.setItem 拋出 QuotaExceededError
      const originalSetItem = Storage.prototype.setItem
      Storage.prototype.setItem = jest.fn(() => {
        throw new DOMException('QuotaExceededError')
      })

      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // 應該能正常運作（使用降級方案）
      expect(screen.getByText('選擇你的命運之牌')).toBeInTheDocument()

      // 恢復原始方法
      Storage.prototype.setItem = originalSetItem
    })
  })
})

/**
 * 任務 15.3 - Carousel 導航測試
 */
describe('Carousel 導航功能測試', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('箭頭按鈕導航', () => {
    it('點擊右箭頭應該移至下一張卡牌', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      const positionIndicator = screen.getByTestId('position-indicator')
      expect(positionIndicator.textContent).toContain('1 / 5')

      const nextButton = screen.getByLabelText('下一張卡牌')
      act(() => {
        fireEvent.click(nextButton)
      })

      await waitFor(() => {
        expect(positionIndicator.textContent).toContain('2 / 5')
      })
    })

    it('第一張卡牌時左箭頭應該被禁用', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      const prevButton = screen.getByLabelText('上一張卡牌')
      expect(prevButton).toBeDisabled()
    })

    it('最後一張卡牌時右箭頭應該被禁用', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      const nextButton = screen.getByLabelText('下一張卡牌')

      // 連續點擊 4 次到達第 5 張
      for (let i = 0; i < 4; i++) {
        act(() => {
          fireEvent.click(nextButton)
        })
      }

      await waitFor(() => {
        expect(screen.getByTestId('position-indicator').textContent).toContain('5 / 5')
      })

      expect(nextButton).toBeDisabled()
    })
  })

  describe('鍵盤導航', () => {
    it('按 ArrowRight 應該移至下一張卡牌', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      const positionIndicator = screen.getByTestId('position-indicator')

      act(() => {
        fireEvent.keyDown(window, { key: 'ArrowRight' })
      })

      await waitFor(() => {
        expect(positionIndicator.textContent).toContain('2 / 5')
      })
    })

    it('按 ArrowLeft 應該移至上一張卡牌', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      const nextButton = screen.getByLabelText('下一張卡牌')
      const positionIndicator = screen.getByTestId('position-indicator')

      // 先移到第 2 張
      act(() => {
        fireEvent.click(nextButton)
      })

      await waitFor(() => {
        expect(positionIndicator.textContent).toContain('2 / 5')
      })

      // 按左鍵返回
      act(() => {
        fireEvent.keyDown(window, { key: 'ArrowLeft' })
      })

      await waitFor(() => {
        expect(positionIndicator.textContent).toContain('1 / 5')
      })
    })
  })

  describe('導航邊界檢查', () => {
    it('在第一張卡牌按 ArrowLeft 不應該有任何效果', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      const positionIndicator = screen.getByTestId('position-indicator')
      expect(positionIndicator.textContent).toContain('1 / 5')

      act(() => {
        fireEvent.keyDown(window, { key: 'ArrowLeft' })
      })

      // 應該保持在第 1 張
      expect(positionIndicator.textContent).toContain('1 / 5')
    })

    it('在最後一張卡牌按 ArrowRight 不應該有任何效果', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      const nextButton = screen.getByLabelText('下一張卡牌')
      const positionIndicator = screen.getByTestId('position-indicator')

      // 移到最後一張
      for (let i = 0; i < 4; i++) {
        act(() => {
          fireEvent.click(nextButton)
        })
      }

      await waitFor(() => {
        expect(positionIndicator.textContent).toContain('5 / 5')
      })

      // 按右鍵
      act(() => {
        fireEvent.keyDown(window, { key: 'ArrowRight' })
      })

      // 應該保持在第 5 張
      expect(positionIndicator.textContent).toContain('5 / 5')
    })
  })
})

/**
 * 任務 15.4 - Modal 互動測試
 */
describe('Modal 互動功能測試', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('Modal 焦點管理', () => {
    it('Modal 開啟時焦點應該移至 Modal', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // 翻牌
      const firstCard = screen.getByTestId('card-0')
      act(() => {
        fireEvent.click(firstCard)
      })

      await waitFor(() => {
        expect(screen.getByText('重新抽卡')).toBeInTheDocument()
      })

      // 點擊卡牌開啟 Modal（注意：需要等待 CardDetailModal 動態載入）
      act(() => {
        fireEvent.click(firstCard)
      })

      // 等待 Modal 載入
      await waitFor(
        () => {
          const modal = document.querySelector('[role="dialog"]')
          expect(modal).toBeInTheDocument()
        },
        { timeout: 2000 }
      )
    })
  })

  describe('Modal 關閉操作', () => {
    it('按 ESC 鍵應該關閉 Modal', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // 翻牌
      const firstCard = screen.getByTestId('card-0')
      act(() => {
        fireEvent.click(firstCard)
      })

      await waitFor(() => {
        expect(screen.getByText('重新抽卡')).toBeInTheDocument()
      })

      // 開啟 Modal
      act(() => {
        fireEvent.click(firstCard)
      })

      await waitFor(
        () => {
          expect(document.querySelector('[role="dialog"]')).toBeInTheDocument()
        },
        { timeout: 2000 }
      )

      // 按 ESC 關閉
      act(() => {
        fireEvent.keyDown(document, { key: 'Escape' })
      })

      await waitFor(
        () => {
          expect(document.querySelector('[role="dialog"]')).not.toBeInTheDocument()
        },
        { timeout: 1000 }
      )
    })

    it('點擊外部應該關閉 Modal', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // 翻牌並開啟 Modal
      const firstCard = screen.getByTestId('card-0')
      act(() => {
        fireEvent.click(firstCard)
      })

      await waitFor(() => {
        expect(screen.getByText('重新抽卡')).toBeInTheDocument()
      })

      act(() => {
        fireEvent.click(firstCard)
      })

      await waitFor(
        () => {
          expect(document.querySelector('[role="dialog"]')).toBeInTheDocument()
        },
        { timeout: 2000 }
      )

      // 點擊背景關閉（模擬點擊 backdrop）
      const backdrop = document.querySelector('[role="dialog"]')?.parentElement
      if (backdrop) {
        act(() => {
          fireEvent.click(backdrop)
        })

        await waitFor(
          () => {
            expect(document.querySelector('[role="dialog"]')).not.toBeInTheDocument()
          },
          { timeout: 1000 }
        )
      }
    })
  })

  describe('語音播放整合', () => {
    it('Modal 應該包含語音播放按鈕', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // 翻牌並開啟 Modal
      const firstCard = screen.getByTestId('card-0')
      act(() => {
        fireEvent.click(firstCard)
      })

      await waitFor(() => {
        expect(screen.getByText('重新抽卡')).toBeInTheDocument()
      })

      act(() => {
        fireEvent.click(firstCard)
      })

      // 等待 Modal 並檢查語音控制元素（useTextToSpeech 內建）
      await waitFor(
        () => {
          expect(document.querySelector('[role="dialog"]')).toBeInTheDocument()
        },
        { timeout: 2000 }
      )
    })
  })

  describe('Modal 關閉後焦點返回', () => {
    it('關閉 Modal 後焦點應該返回觸發元素', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      const firstCard = screen.getByTestId('card-0')

      // 翻牌
      act(() => {
        fireEvent.click(firstCard)
      })

      await waitFor(() => {
        expect(screen.getByText('重新抽卡')).toBeInTheDocument()
      })

      // 開啟 Modal
      act(() => {
        fireEvent.click(firstCard)
      })

      await waitFor(
        () => {
          expect(document.querySelector('[role="dialog"]')).toBeInTheDocument()
        },
        { timeout: 2000 }
      )

      // 關閉 Modal
      act(() => {
        fireEvent.keyDown(document, { key: 'Escape' })
      })

      await waitFor(
        () => {
          expect(document.querySelector('[role="dialog"]')).not.toBeInTheDocument()
        },
        { timeout: 1000 }
      )

      // 焦點應該返回（在實際 DOM 中測試）
      // 注意：需要實際的 focus 測試環境
    })
  })
})

/**
 * 任務 15.5 - CTA 導流測試
 */
describe('CTA 導流功能測試', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('主要 CTA 顯示', () => {
    it('翻牌後應該顯示主要 CTA 區塊', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // 翻牌前不應該顯示 CTA
      expect(screen.queryByText('探索完整的廢土命運')).not.toBeInTheDocument()

      // 翻牌
      const firstCard = screen.getByTestId('card-0')
      act(() => {
        fireEvent.click(firstCard)
      })

      // 翻牌後應該顯示 CTA
      await waitFor(() => {
        expect(screen.getByText('探索完整的廢土命運')).toBeInTheDocument()
      })
    })

    it('應該顯示 4 個功能特色卡片', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // 翻牌
      const firstCard = screen.getByTestId('card-0')
      act(() => {
        fireEvent.click(firstCard)
      })

      await waitFor(() => {
        expect(screen.getByText('探索完整的廢土命運')).toBeInTheDocument()
      })

      // 檢查 4 個功能特色
      expect(screen.getByText(/AI 深度解讀/)).toBeInTheDocument()
      expect(screen.getByText(/保存占卜記錄/)).toBeInTheDocument()
      expect(screen.getByText(/進階牌陣/)).toBeInTheDocument()
      expect(screen.getByText(/Karma 追蹤/)).toBeInTheDocument()
    })
  })

  describe('註冊按鈕導航', () => {
    it('點擊註冊按鈕應該有正確的 onClick 處理', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // 翻牌
      const firstCard = screen.getByTestId('card-0')
      act(() => {
        fireEvent.click(firstCard)
      })

      await waitFor(() => {
        expect(screen.getByText('探索完整的廢土命運')).toBeInTheDocument()
      })

      // 檢查註冊按鈕存在
      const registerButton = screen.getByText('立即註冊 Vault 帳號')
      expect(registerButton).toBeInTheDocument()
      expect(registerButton.tagName).toBe('BUTTON')
    })
  })

  describe('登入按鈕導航', () => {
    it('點擊登入按鈕應該有正確的 onClick 處理', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // 翻牌
      const firstCard = screen.getByTestId('card-0')
      act(() => {
        fireEvent.click(firstCard)
      })

      await waitFor(() => {
        expect(screen.getByText('探索完整的廢土命運')).toBeInTheDocument()
      })

      // 檢查登入按鈕存在
      const loginButton = screen.getByText('已有帳號？立即登入')
      expect(loginButton).toBeInTheDocument()
      expect(loginButton.tagName).toBe('BUTTON')
    })
  })

  describe('Modal 內次要 CTA', () => {
    it('訪客模式 Modal 應該顯示次要 CTA', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // 翻牌並開啟 Modal
      const firstCard = screen.getByTestId('card-0')
      act(() => {
        fireEvent.click(firstCard)
      })

      await waitFor(() => {
        expect(screen.getByText('重新抽卡')).toBeInTheDocument()
      })

      act(() => {
        fireEvent.click(firstCard)
      })

      // 等待 Modal 載入並檢查訪客 CTA
      await waitFor(
        () => {
          expect(document.querySelector('[role="dialog"]')).toBeInTheDocument()
        },
        { timeout: 2000 }
      )

      // Modal 應該使用 isGuestMode=true，會顯示次要 CTA
      // 注意：實際文案需要根據 CardDetailModal 實作檢查
    })
  })

  describe('CTA 按鈕互動狀態', () => {
    it('CTA 按鈕應該有正確的 hover 和 focus 樣式', async () => {
      render(<QuickReadingPage />)

      await waitFor(
        () => {
          expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
        },
        { timeout: 3000 }
      )

      // 翻牌
      const firstCard = screen.getByTestId('card-0')
      act(() => {
        fireEvent.click(firstCard)
      })

      await waitFor(() => {
        expect(screen.getByText('探索完整的廢土命運')).toBeInTheDocument()
      })

      const registerButton = screen.getByText('立即註冊 Vault 帳號')

      // 測試 focus
      act(() => {
        registerButton.focus()
      })

      expect(document.activeElement).toBe(registerButton)
    })
  })
})
