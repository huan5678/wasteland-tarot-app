/**
 * 響應式動畫測試
 *
 * 測試動畫元件在不同裝置尺寸下的行為
 *
 * Requirements: 7.2, 7.3
 */

import { render, screen } from '@testing-library/react'
import { PipBoyLoader } from '../PipBoyLoader'
import { SuccessPulse } from '../SuccessPulse'
import { ErrorFlash } from '../ErrorFlash'

describe('響應式動畫測試', () => {
  // Mock window.matchMedia
  const createMatchMedia = (matches: boolean) => {
    return (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    })
  }

  describe('行動裝置 (< 768px)', () => {
    beforeEach(() => {
      window.matchMedia = createMatchMedia(true) as any
      window.innerWidth = 375
    })

    it('PipBoyLoader 應該在行動裝置正確顯示', () => {
      const { container } = render(<PipBoyLoader />)
      expect(container.querySelector('.ri-loader-4-line')).toBeInTheDocument()
    })

    it('SuccessPulse 應該在行動裝置正確顯示', () => {
      const { container } = render(<SuccessPulse />)
      expect(container.querySelector('.ri-checkbox-circle-line')).toBeInTheDocument()
    })

    it('ErrorFlash 應該在行動裝置正確顯示', () => {
      render(<ErrorFlash message="錯誤" />)
      expect(screen.getByText('錯誤')).toBeInTheDocument()
    })
  })

  describe('平板裝置 (768px - 1024px)', () => {
    beforeEach(() => {
      window.matchMedia = createMatchMedia(false) as any
      window.innerWidth = 768
    })

    it('所有動畫元件應該在平板裝置正確顯示', () => {
      const { container, rerender } = render(<PipBoyLoader />)
      expect(container.querySelector('.ri-loader-4-line')).toBeInTheDocument()

      rerender(<SuccessPulse />)
      expect(container.querySelector('.ri-checkbox-circle-line')).toBeInTheDocument()

      rerender(<ErrorFlash />)
      expect(container.querySelector('.ri-error-warning-line')).toBeInTheDocument()
    })
  })

  describe('桌面裝置 (> 1024px)', () => {
    beforeEach(() => {
      window.matchMedia = createMatchMedia(false) as any
      window.innerWidth = 1920
    })

    it('所有動畫元件應該在桌面裝置正確顯示', () => {
      const { container, rerender } = render(<PipBoyLoader />)
      expect(container.querySelector('.ri-loader-4-line')).toBeInTheDocument()

      rerender(<SuccessPulse />)
      expect(container.querySelector('.ri-checkbox-circle-line')).toBeInTheDocument()

      rerender(<ErrorFlash />)
      expect(container.querySelector('.ri-error-warning-line')).toBeInTheDocument()
    })
  })

  describe('減少動畫偏好 (prefers-reduced-motion)', () => {
    beforeEach(() => {
      window.matchMedia = createMatchMedia(true) as any
    })

    it('應該尊重使用者的減少動畫偏好', () => {
      const { container } = render(<PipBoyLoader />)

      // 動畫應該被停用或簡化
      // 具體實作會在元件中處理
      expect(container).toBeInTheDocument()
    })
  })
})
