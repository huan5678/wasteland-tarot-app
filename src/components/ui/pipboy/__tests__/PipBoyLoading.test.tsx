import { render, screen } from '@testing-library/react'
import { PipBoyLoading } from '../PipBoyLoading'

describe('PipBoyLoading', () => {
  describe('基礎渲染', () => {
    it('應該渲染 spinner variant', () => {
      render(<PipBoyLoading variant="spinner" />)
      const loader = screen.getByRole('status')
      expect(loader).toBeInTheDocument()
      expect(loader).toHaveAttribute('aria-live', 'polite')
    })

    it('應該渲染 dots variant', () => {
      render(<PipBoyLoading variant="dots" />)
      const loader = screen.getByRole('status')
      expect(loader).toBeInTheDocument()
    })

    it('應該渲染 skeleton variant', () => {
      render(<PipBoyLoading variant="skeleton" />)
      const skeleton = screen.getByTestId('pipboy-skeleton')
      expect(skeleton).toBeInTheDocument()
    })

    it('應該渲染 overlay variant', () => {
      render(<PipBoyLoading variant="overlay" />)
      const overlay = screen.getByTestId('pipboy-overlay')
      expect(overlay).toBeInTheDocument()
    })
  })

  describe('尺寸變體', () => {
    it('應該套用 sm 尺寸', () => {
      render(<PipBoyLoading variant="spinner" size="sm" />)
      const loader = screen.getByRole('status')
      expect(loader).toHaveClass('text-sm')
    })

    it('應該套用 md 尺寸 (預設)', () => {
      render(<PipBoyLoading variant="spinner" />)
      const loader = screen.getByRole('status')
      expect(loader).toHaveClass('text-base')
    })

    it('應該套用 lg 尺寸', () => {
      render(<PipBoyLoading variant="spinner" size="lg" />)
      const loader = screen.getByRole('status')
      expect(loader).toHaveClass('text-lg')
    })
  })

  describe('載入文字', () => {
    it('應該顯示自訂載入文字', () => {
      render(<PipBoyLoading variant="spinner" text="載入中..." />)
      expect(screen.getByText('載入中...')).toBeInTheDocument()
    })

    it('應該在沒有 text prop 時只顯示圖示', () => {
      render(<PipBoyLoading variant="spinner" />)
      expect(screen.queryByText(/載入/)).not.toBeInTheDocument()
    })

    it('應該使用 Cubic 11 字體顯示文字', () => {
      render(<PipBoyLoading variant="spinner" text="載入資料" />)
      const text = screen.getByText('載入資料')
      expect(text).toHaveStyle({ fontFamily: expect.stringContaining('Cubic') })
    })
  })

  describe('Pip-Boy Green 配色', () => {
    it('應該使用 Pip-Boy Green 色彩作為主色', () => {
      render(<PipBoyLoading variant="spinner" />)
      const loader = screen.getByRole('status')
      expect(loader).toHaveClass('text-pip-boy-green')
    })
  })

  describe('prefers-reduced-motion 支援', () => {
    it('應該在 prefers-reduced-motion 時停用動畫', () => {
      // Mock matchMedia
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      render(<PipBoyLoading variant="spinner" />)
      const loader = screen.getByRole('status')
      expect(loader.querySelector('[class*="animate"]')).toHaveClass('motion-reduce:animate-none')
    })
  })

  describe('無障礙支援', () => {
    it('應該包含 role="status"', () => {
      render(<PipBoyLoading variant="spinner" />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('應該包含 aria-live="polite"', () => {
      render(<PipBoyLoading variant="spinner" />)
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    })

    it('應該包含 sr-only 載入訊息', () => {
      render(<PipBoyLoading variant="spinner" />)
      const srText = screen.getByText('Loading...', { selector: '.sr-only' })
      expect(srText).toBeInTheDocument()
    })
  })
})
