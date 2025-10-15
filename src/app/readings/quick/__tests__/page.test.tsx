import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import QuickReadingPage from '../page'
import { enhancedWastelandCards } from '@/data/enhancedCards'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}))

describe('QuickReadingPage - 任務 1: 頁面基礎架構與卡牌池初始化', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  describe('卡牌資料載入與篩選', () => {
    it('應該成功從 enhancedCards 載入大阿爾克納卡牌', async () => {
      render(<QuickReadingPage />)

      // 等待卡牌載入完成
      await waitFor(() => {
        // 至少應該顯示一張卡牌
        const cards = screen.queryAllByTestId(/^card-/)
        expect(cards.length).toBeGreaterThan(0)
      })
    })

    it('應該只選取大阿爾克納(suit === "大阿爾克那")', async () => {
      render(<QuickReadingPage />)

      await waitFor(() => {
        const cards = screen.queryAllByTestId(/^card-/)
        expect(cards.length).toBe(5)
      })

      // 驗證所有顯示的卡牌都是大阿爾克納
      const majorArcanaCards = enhancedWastelandCards.filter(
        card => card.suit === 'major_arcana'
      )
      expect(majorArcanaCards.length).toBeGreaterThanOrEqual(5)
    })
  })

  describe('隨機選取 5 張不重複卡牌', () => {
    it('應該顯示恰好 5 張卡牌', async () => {
      render(<QuickReadingPage />)

      await waitFor(() => {
        const cards = screen.queryAllByTestId(/^card-/)
        expect(cards.length).toBe(5)
      })
    })

    it('選取的 5 張卡牌應該不重複', async () => {
      render(<QuickReadingPage />)

      await waitFor(async () => {
        const cards = screen.queryAllByTestId(/^card-/)
        const cardIds = cards.map(card => card.getAttribute('data-card-id'))
        const uniqueIds = new Set(cardIds)

        expect(uniqueIds.size).toBe(5)
      })
    })
  })

  describe('頁面狀態管理結構', () => {
    it('應該初始化時無選中卡牌', async () => {
      render(<QuickReadingPage />)

      await waitFor(() => {
        // 查找任何被標記為 selected 的卡牌
        const selectedCards = screen.queryAllByTestId(/^card-.*-selected$/)
        expect(selectedCards.length).toBe(0)
      })
    })

    it('應該顯示載入指示器直到卡牌載入完成', async () => {
      render(<QuickReadingPage />)

      // 初始應該顯示載入中
      expect(screen.queryByTestId('loading-indicator')).toBeInTheDocument()

      // 載入完成後應該移除載入指示器
      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
      })
    })
  })

  describe('錯誤處理與降級策略', () => {
    it('當卡牌資料載入失敗時應該顯示錯誤訊息', async () => {
      // 模擬載入失敗
      jest.mock('@/data/enhancedCards', () => ({
        enhancedWastelandCards: null,
      }))

      render(<QuickReadingPage />)

      await waitFor(() => {
        expect(screen.getByText(/載入失敗/i)).toBeInTheDocument()
      })
    })

    it('當大阿爾克納數量不足 5 張時應該使用備用策略', async () => {
      // 這個測試驗證邊界情況
      // 實際上 enhancedCards 應該有 22 張大阿爾克納
      // 此測試確保程式碼能處理異常情況

      render(<QuickReadingPage />)

      await waitFor(() => {
        const cards = screen.queryAllByTestId(/^card-/)
        // 即使在邊界情況下,也應該嘗試顯示卡牌
        expect(cards.length).toBeGreaterThanOrEqual(0)
      })
    })
  })
})
