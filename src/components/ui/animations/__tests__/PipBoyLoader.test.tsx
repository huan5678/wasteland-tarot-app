/**
 * PipBoyLoader 元件測試
 *
 * 測試 Pip-Boy 主題載入動畫元件
 *
 * Requirements: 7.3, 7.4, 7.5
 */

import { render, screen } from '@testing-library/react'
import { PipBoyLoader } from '../PipBoyLoader'

describe('PipBoyLoader', () => {
  describe('渲染行為', () => {
    it('應該正確渲染載入動畫', () => {
      const { container } = render(<PipBoyLoader />)

      // 檢查 loader 圖示存在（RemixIcon 使用 <i> 標籤）
      const loader = container.querySelector('.ri-loader-4-line')
      expect(loader).toBeInTheDocument()

      // 檢查預設文字
      expect(screen.getByText(/Pip-Boy 掃描中/i)).toBeInTheDocument()
    })

    it('應該顯示自訂文字', () => {
      render(<PipBoyLoader text="載入避難所資料..." />)

      expect(screen.getByText('載入避難所資料...')).toBeInTheDocument()
    })

    it('應該使用 Pip-Boy 綠色主題', () => {
      const { container } = render(<PipBoyLoader />)

      // 檢查文字顏色類別
      const textElement = screen.getByText(/Pip-Boy 掃描中/i)
      expect(textElement).toHaveClass('text-pip-boy-green')
    })
  })

  describe('動畫效果', () => {
    it('應該套用旋轉動畫', () => {
      const { container } = render(<PipBoyLoader />)

      const loader = container.querySelector('.ri-loader-4-line')
      // 檢查是否有 spin 動畫
      expect(loader?.className).toMatch(/animate-spin/)
    })

    it('應該套用脈衝動畫到文字', () => {
      render(<PipBoyLoader />)

      const text = screen.getByText(/Pip-Boy 掃描中/i)
      expect(text.className).toMatch(/animate-pulse/)
    })
  })

  describe('無障礙性', () => {
    it('應該標記為裝飾性圖示', () => {
      const { container } = render(<PipBoyLoader />)

      const loader = container.querySelector('.ri-loader-4-line')
      expect(loader).toHaveAttribute('aria-hidden', 'true')
    })

    it('應該提供 role="status" 給載入訊息', () => {
      const { container } = render(<PipBoyLoader />)

      const statusElement = container.querySelector('[role="status"]')
      expect(statusElement).toBeInTheDocument()
    })
  })

  describe('響應式設計', () => {
    it('應該在不同尺寸下正確顯示', () => {
      const { container, rerender } = render(<PipBoyLoader size="sm" />)
      expect(container.querySelector('.ri-loader-4-line')).toBeInTheDocument()

      rerender(<PipBoyLoader size="md" />)
      expect(container.querySelector('.ri-loader-4-line')).toBeInTheDocument()

      rerender(<PipBoyLoader size="lg" />)
      expect(container.querySelector('.ri-loader-4-line')).toBeInTheDocument()
    })
  })
})
