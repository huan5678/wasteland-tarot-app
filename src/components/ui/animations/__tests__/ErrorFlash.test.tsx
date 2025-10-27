/**
 * ErrorFlash 元件測試
 *
 * 測試錯誤狀態動畫元件
 *
 * Requirements: 7.5, 7.6
 */

import { render, screen } from '@testing-library/react'
import { ErrorFlash } from '../ErrorFlash'

describe('ErrorFlash', () => {
  describe('渲染行為', () => {
    it('應該正確渲染錯誤圖示', () => {
      const { container } = render(<ErrorFlash />)

      // 檢查 error-warning 圖示存在
      const icon = container.querySelector('.ri-error-warning-line')
      expect(icon).toBeInTheDocument()
    })

    it('應該使用 error 顏色變體', () => {
      const { container } = render(<ErrorFlash />)

      const icon = container.querySelector('.ri-error-warning-line')
      // 檢查是否套用錯誤色（variant="error" → text-red-500）
      expect(icon?.className).toMatch(/text-red-500/)
    })

    it('應該顯示錯誤訊息', () => {
      render(<ErrorFlash message="連線失敗" />)

      expect(screen.getByText('連線失敗')).toBeInTheDocument()
    })

    it('應該不顯示未提供的訊息', () => {
      const { container } = render(<ErrorFlash />)

      // 只應該有圖示，沒有文字訊息
      const message = container.querySelector('p')
      expect(message).not.toBeInTheDocument()
    })
  })

  describe('動畫效果', () => {
    it('應該套用搖晃動畫', () => {
      const { container } = render(<ErrorFlash />)

      const icon = container.querySelector('.ri-error-warning-line')
      expect(icon?.className).toMatch(/animate-wiggle/)
    })

    it('應該套用閃爍效果到文字', () => {
      render(<ErrorFlash message="錯誤" />)

      const text = screen.getByText('錯誤')
      // 錯誤訊息文字使用 text-error class，但它可能被定義為其他顏色
      expect(text.className).toMatch(/animate-pulse/)
    })
  })

  describe('響應式設計', () => {
    it('應該支援自訂尺寸', () => {
      const { container, rerender } = render(<ErrorFlash size="sm" />)
      expect(container.querySelector('.ri-error-warning-line')).toBeInTheDocument()

      rerender(<ErrorFlash size="lg" />)
      expect(container.querySelector('.ri-error-warning-line')).toBeInTheDocument()
    })
  })

  describe('無障礙性', () => {
    it('應該標記為裝飾性圖示（無訊息時）', () => {
      const { container } = render(<ErrorFlash />)

      const icon = container.querySelector('.ri-error-warning-line')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('應該提供 role="alert" 給錯誤訊息', () => {
      const { container } = render(<ErrorFlash message="錯誤" />)

      const alertElement = container.querySelector('[role="alert"]')
      expect(alertElement).toBeInTheDocument()
    })
  })
})
