/**
 * SuccessPulse 元件測試
 *
 * 測試成功狀態動畫元件
 *
 * Requirements: 7.5, 7.6
 */

import { render, screen, waitFor } from '@testing-library/react'
import { SuccessPulse } from '../SuccessPulse'

describe('SuccessPulse', () => {
  describe('渲染行為', () => {
    it('應該正確渲染成功圖示', () => {
      const { container } = render(<SuccessPulse />)

      // 檢查 checkbox-circle 圖示存在
      const icon = container.querySelector('.ri-checkbox-circle-line')
      expect(icon).toBeInTheDocument()
    })

    it('應該使用 success 顏色變體', () => {
      const { container } = render(<SuccessPulse />)

      const icon = container.querySelector('.ri-checkbox-circle-line')
      // 檢查是否套用成功色（variant="success" → text-pip-boy-green-bright）
      expect(icon?.className).toMatch(/text-pip-boy-green-bright/)
    })
  })

  describe('動畫效果', () => {
    it('應該套用脈衝動畫', () => {
      const { container } = render(<SuccessPulse />)

      const icon = container.querySelector('.ri-checkbox-circle-line')
      expect(icon?.className).toMatch(/animate-pip-boy-pulse/)
    })

    it('應該套用縮放效果', () => {
      const { container } = render(<SuccessPulse />)

      // 檢查容器有動畫效果
      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('animate-scale-in')
    })
  })

  describe('完成回調', () => {
    it('應該在動畫完成後呼叫 onComplete', async () => {
      const onComplete = jest.fn()
      render(<SuccessPulse onComplete={onComplete} duration={100} />)

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled()
      }, { timeout: 200 })
    })

    it('應該不呼叫未提供的 onComplete', () => {
      // 不應該拋出錯誤
      expect(() => {
        render(<SuccessPulse />)
      }).not.toThrow()
    })
  })

  describe('響應式設計', () => {
    it('應該支援自訂尺寸', () => {
      const { container, rerender } = render(<SuccessPulse size="sm" />)
      expect(container.querySelector('.ri-checkbox-circle-line')).toBeInTheDocument()

      rerender(<SuccessPulse size="lg" />)
      expect(container.querySelector('.ri-checkbox-circle-line')).toBeInTheDocument()
    })
  })

  describe('無障礙性', () => {
    it('應該標記為裝飾性圖示', () => {
      const { container } = render(<SuccessPulse />)

      const icon = container.querySelector('.ri-checkbox-circle-line')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })
})
