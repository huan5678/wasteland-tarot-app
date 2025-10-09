import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CardDraw } from '../CardDraw'
import { mockTarotCards } from '@/test/mocks/data'

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16))

describe('CardDraw Component', () => {
  const mockProps = {
    spreadType: 'single' as const,
    onCardsDrawn: jest.fn(),
    isLoading: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('應該顯示卡牌堆', () => {
    render(<CardDraw {...mockProps} />)

    expect(screen.getByTestId('card-deck')).toBeInTheDocument()
    expect(screen.getByText('點擊抽牌')).toBeInTheDocument()
  })

  it('應該處理單張牌抽牌', async () => {
    render(<CardDraw {...mockProps} />)

    fireEvent.click(screen.getByTestId('card-deck'))

    await waitFor(() => {
      expect(mockProps.onCardsDrawn).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            name: expect.any(String),
            position: expect.stringMatching(/upright|reversed/),
          })
        ])
      )
    })

    expect(mockProps.onCardsDrawn).toHaveBeenCalledTimes(1)
    expect(mockProps.onCardsDrawn.mock.calls[0][0]).toHaveLength(1)
  })

  it('應該處理三張牌抽牌', async () => {
    const threeCardProps = {
      ...mockProps,
      spreadType: 'three_card' as const,
    }

    render(<CardDraw {...threeCardProps} />)

    fireEvent.click(screen.getByTestId('card-deck'))

    await waitFor(() => {
      expect(mockProps.onCardsDrawn).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            position: expect.stringMatching(/upright|reversed/),
          })
        ])
      )
    })

    expect(mockProps.onCardsDrawn.mock.calls[0][0]).toHaveLength(3)
  })

  it('應該在載入狀態禁用抽牌', () => {
    const loadingProps = {
      ...mockProps,
      isLoading: true,
    }

    render(<CardDraw {...loadingProps} />)

    const deckButton = screen.getByTestId('card-deck')
    expect(deckButton).toHaveAttribute('aria-disabled', 'true')

    fireEvent.click(deckButton)
    expect(mockProps.onCardsDrawn).not.toHaveBeenCalled()
  })

  it('應該顯示抽牌動畫', async () => {
    render(<CardDraw {...mockProps} />)

    const deckElement = screen.getByTestId('card-deck')
    fireEvent.click(deckElement)

    // 檢查動畫 class 是否被添加
    await waitFor(() => {
      expect(deckElement).toHaveClass('drawing')
    })

    // 等待動畫完成
    await waitFor(() => {
      expect(deckElement).not.toHaveClass('drawing')
    }, { timeout: 2000 })
  })

  it('應該顯示已抽取的卡片', async () => {
    render(<CardDraw {...mockProps} />)

    fireEvent.click(screen.getByTestId('card-deck'))

    await waitFor(() => {
      expect(screen.getByTestId('drawn-cards')).toBeInTheDocument()
    })

    const drawnCards = screen.getAllByTestId(/drawn-card-\d+/)
    expect(drawnCards).toHaveLength(1)
  })

  it('應該支援卡片位置選擇模式', async () => {
    const positionProps = {
      ...mockProps,
      spreadType: 'three_card' as const,
      enablePositionSelection: true,
    }

    render(<CardDraw {...positionProps} />)

    // 應該顯示三個位置選擇器
    const positions = screen.getAllByTestId(/position-\d+/)
    expect(positions).toHaveLength(3)

    // 點擊第一個位置
    fireEvent.click(positions[0])

    await waitFor(() => {
      expect(screen.getByTestId('drawn-card-0')).toBeInTheDocument()
    })

    // 其他位置仍可點擊
    expect(positions[1]).not.toHaveAttribute('aria-disabled')
    expect(positions[2]).not.toHaveAttribute('aria-disabled')
  })

  it('應該處理錯誤狀態', async () => {
    const errorProps = {
      ...mockProps,
      onCardsDrawn: jest.fn().mockImplementation(() => {
        throw new Error('抽牌失敗')
      }),
    }

    // Mock console.error to prevent error output in tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    render(<CardDraw {...errorProps} />)

    fireEvent.click(screen.getByTestId('card-deck'))

    await waitFor(() => {
      expect(screen.getByText(/抽牌失敗/)).toBeInTheDocument()
    })

    consoleSpy.mockRestore()
  })

  it('應該支援重新抽牌', async () => {
    render(<CardDraw {...mockProps} enableRedraw />)

    // 先抽一次牌
    fireEvent.click(screen.getByTestId('card-deck'))

    await waitFor(() => {
      expect(screen.getByTestId('redraw-button')).toBeInTheDocument()
    })

    // 重新抽牌
    fireEvent.click(screen.getByTestId('redraw-button'))

    await waitFor(() => {
      expect(mockProps.onCardsDrawn).toHaveBeenCalledTimes(2)
    })
  })

  it('應該確保抽牌無重複', async () => {
    const threeCardProps = {
      ...mockProps,
      spreadType: 'three_card' as const,
    }

    render(<CardDraw {...threeCardProps} />)

    fireEvent.click(screen.getByTestId('card-deck'))

    await waitFor(() => {
      const drawnCards = mockProps.onCardsDrawn.mock.calls[0][0]
      const cardIds = drawnCards.map((card: any) => card.id)
      const uniqueIds = [...new Set(cardIds)]

      expect(uniqueIds).toHaveLength(cardIds.length)
    })
  })

  it('應該支援自定義動畫時長', async () => {
    const customProps = {
      ...mockProps,
      animationDuration: 500,
    }

    render(<CardDraw {...customProps} />)

    const deckElement = screen.getByTestId('card-deck')
    fireEvent.click(deckElement)

    // 動畫應該在指定時間內完成
    await waitFor(() => {
      expect(deckElement).not.toHaveClass('drawing')
    }, { timeout: 600 })
  })
})