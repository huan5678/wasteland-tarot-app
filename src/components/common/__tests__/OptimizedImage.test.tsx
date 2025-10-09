/**
 * Tests for OptimizedImage components
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { OptimizedImage, CardImage, BackgroundImage, IconImage } from '../OptimizedImage'

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

describe('OptimizedImage', () => {
  it('應該渲染圖片', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="測試圖片"
        width={800}
        height={600}
      />
    )

    const img = screen.getByAlt('測試圖片')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/test-image.jpg')
  })

  it('應該在載入時顯示載入狀態', () => {
    const { container } = render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="測試圖片"
        width={800}
        height={600}
      />
    )

    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('animate-pulse')
  })

  it('應該在圖片載入完成後移除載入狀態', async () => {
    const { container } = render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="測試圖片"
        width={800}
        height={600}
      />
    )

    const img = screen.getByAlt('測試圖片')
    fireEvent.load(img)

    await waitFor(() => {
      const wrapper = container.firstChild
      expect(wrapper).not.toHaveClass('animate-pulse')
    })
  })

  it('應該處理圖片載入錯誤', async () => {
    render(
      <OptimizedImage
        src="/invalid-image.jpg"
        alt="測試圖片"
        width={800}
        height={600}
      />
    )

    const img = screen.getByAlt('測試圖片')
    fireEvent.error(img)

    await waitFor(() => {
      expect(screen.getByText('圖片載入失敗')).toBeInTheDocument()
    })
  })

  it('應該使用自訂 className', () => {
    const { container } = render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="測試圖片"
        width={800}
        height={600}
        className="custom-class"
      />
    )

    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('custom-class')
  })

  it('應該支援 priority 載入', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="測試圖片"
        width={800}
        height={600}
        priority={true}
      />
    )

    const img = screen.getByAlt('測試圖片')
    expect(img).toHaveAttribute('loading', 'eager')
  })

  it('應該支援延遲載入', () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="測試圖片"
        width={800}
        height={600}
        priority={false}
      />
    )

    const img = screen.getByAlt('測試圖片')
    expect(img).toHaveAttribute('loading', 'lazy')
  })
})

describe('CardImage', () => {
  it('應該渲染塔羅牌圖片', () => {
    render(
      <CardImage
        src="/assets/cards/major-arcana/00.png"
        alt="The Fool"
      />
    )

    const img = screen.getByAlt('The Fool')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('width', '300')
    expect(img).toHaveAttribute('height', '450')
  })

  it('應該使用最佳化的品質設定', () => {
    render(
      <CardImage
        src="/assets/cards/major-arcana/00.png"
        alt="The Fool"
      />
    )

    const img = screen.getByAlt('The Fool')
    expect(img).toHaveAttribute('quality', '85')
  })
})

describe('BackgroundImage', () => {
  it('應該渲染背景圖片', () => {
    render(
      <BackgroundImage
        src="/assets/backgrounds/wasteland.jpg"
        alt="Wasteland background"
      />
    )

    const img = screen.getByAlt('Wasteland background')
    expect(img).toBeInTheDocument()
  })

  it('應該使用 fill 模式', () => {
    render(
      <BackgroundImage
        src="/assets/backgrounds/wasteland.jpg"
        alt="Wasteland background"
      />
    )

    const img = screen.getByAlt('Wasteland background')
    expect(img).toHaveAttribute('fill', 'true')
  })

  it('應該設定 priority 為 true', () => {
    render(
      <BackgroundImage
        src="/assets/backgrounds/wasteland.jpg"
        alt="Wasteland background"
      />
    )

    const img = screen.getByAlt('Wasteland background')
    expect(img).toHaveAttribute('priority', 'true')
  })
})

describe('IconImage', () => {
  it('應該渲染圖示', () => {
    render(
      <IconImage
        src="/assets/icons/vault.svg"
        alt="Vault icon"
        size={24}
      />
    )

    const img = screen.getByAlt('Vault icon')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('width', '24')
    expect(img).toHaveAttribute('height', '24')
  })

  it('應該使用預設大小', () => {
    render(
      <IconImage
        src="/assets/icons/vault.svg"
        alt="Vault icon"
      />
    )

    const img = screen.getByAlt('Vault icon')
    expect(img).toHaveAttribute('width', '32')
    expect(img).toHaveAttribute('height', '32')
  })

  it('應該使用最高品質', () => {
    render(
      <IconImage
        src="/assets/icons/vault.svg"
        alt="Vault icon"
      />
    )

    const img = screen.getByAlt('Vault icon')
    expect(img).toHaveAttribute('quality', '100')
  })
})
