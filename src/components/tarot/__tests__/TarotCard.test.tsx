import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TarotCard } from '../TarotCard'
import { createMockTarotCard } from '@/test/mocks/data'

const mockCard = createMockTarotCard({
  id: 1,
  name: '愚者',
  suit: '大阿爾克那',
  meaning_upright: '新的開始、純真、自發性、自由精神',
  meaning_reversed: '魯莽、愚蠢、冒險、輕率',
  image_url: '/cards/fool.jpg',
})

describe('TarotCard Component', () => {
  it('應該顯示卡片背面當 isRevealed 為 false', () => {
    render(
      <TarotCard
        card={mockCard}
        isRevealed={false}
        position="upright"
      />
    )

    expect(screen.getByTestId('card-back')).toBeInTheDocument()
    expect(screen.queryByText('愚者')).not.toBeInTheDocument()
  })

  it('應該顯示卡片正面當 isRevealed 為 true', () => {
    render(
      <TarotCard
        card={mockCard}
        isRevealed={true}
        position="upright"
      />
    )

    expect(screen.getByText('愚者')).toBeInTheDocument()
    expect(screen.getByAltText('愚者 塔羅牌')).toBeInTheDocument()
    expect(screen.queryByTestId('card-back')).not.toBeInTheDocument()
  })

  it('應該處理翻牌動畫', async () => {
    const { rerender } = render(
      <TarotCard
        card={mockCard}
        isRevealed={false}
        position="upright"
      />
    )

    const cardElement = screen.getByTestId('tarot-card')
    expect(cardElement).not.toHaveClass('flipping')

    rerender(
      <TarotCard
        card={mockCard}
        isRevealed={true}
        position="upright"
      />
    )

    // 檢查翻牌動畫開始
    await waitFor(() => {
      expect(cardElement).toHaveClass('flipping')
    })

    // 等待動畫完成
    await waitFor(() => {
      expect(cardElement).not.toHaveClass('flipping')
    }, { timeout: 1000 })
  })

  it('應該正確顯示正位牌', () => {
    render(
      <TarotCard
        card={mockCard}
        isRevealed={true}
        position="upright"
      />
    )

    const cardElement = screen.getByTestId('tarot-card')
    expect(cardElement).not.toHaveClass('reversed')

    // 檢查正位意義
    expect(screen.getByText(/新的開始/)).toBeInTheDocument()
  })

  it('應該正確顯示逆位牌', () => {
    render(
      <TarotCard
        card={mockCard}
        isRevealed={true}
        position="reversed"
      />
    )

    const cardElement = screen.getByTestId('tarot-card')
    expect(cardElement).toHaveClass('reversed')

    // 檢查逆位意義
    expect(screen.getByText(/魯莽/)).toBeInTheDocument()
  })

  it('應該處理卡片點擊事件', () => {
    const handleClick = jest.fn()
    render(
      <TarotCard
        card={mockCard}
        isRevealed={false}
        position="upright"
        onClick={handleClick}
      />
    )

    fireEvent.click(screen.getByTestId('tarot-card'))
    expect(handleClick).toHaveBeenCalledWith(mockCard)
  })

  it('應該在載入狀態顯示骨架屏', () => {
    render(
      <TarotCard
        card={mockCard}
        isRevealed={true}
        position="upright"
        loading={true}
      />
    )

    expect(screen.getByTestId('card-skeleton')).toBeInTheDocument()
    expect(screen.queryByText('愚者')).not.toBeInTheDocument()
  })

  it('應該處理圖片載入錯誤', async () => {
    render(
      <TarotCard
        card={mockCard}
        isRevealed={true}
        position="upright"
      />
    )

    const image = screen.getByAltText('愚者 塔羅牌')

    // 模擬圖片載入錯誤
    fireEvent.error(image)

    await waitFor(() => {
      expect(screen.getByTestId('card-placeholder')).toBeInTheDocument()
    })
  })

  it('應該支援關鍵字顯示', () => {
    render(
      <TarotCard
        card={mockCard}
        isRevealed={true}
        position="upright"
        showKeywords={true}
      />
    )

    expect(screen.getByText('開始')).toBeInTheDocument()
    expect(screen.getByText('冒險')).toBeInTheDocument()
    expect(screen.getByText('純真')).toBeInTheDocument()
    expect(screen.getByText('自由')).toBeInTheDocument()
  })

  it('應該支援不同的卡片尺寸', () => {
    const { rerender } = render(
      <TarotCard
        card={mockCard}
        isRevealed={true}
        position="upright"
        size="small"
      />
    )

    let cardElement = screen.getByTestId('tarot-card')
    expect(cardElement).toHaveClass('w-24')

    rerender(
      <TarotCard
        card={mockCard}
        isRevealed={true}
        position="upright"
        size="large"
      />
    )

    cardElement = screen.getByTestId('tarot-card')
    expect(cardElement).toHaveClass('w-48')
  })
})