/**
 * Fallout 主題測試
 *
 * 測試動畫元件是否符合 Fallout 主題規範
 *
 * Requirements: 7.4, 7.5, 7.6, 7.7
 */

import { render, screen } from '@testing-library/react'
import { PipBoyLoader } from '../PipBoyLoader'
import { SuccessPulse } from '../SuccessPulse'
import { ErrorFlash } from '../ErrorFlash'

describe('Fallout 主題一致性測試', () => {
  describe('Pip-Boy 綠色 (#00ff88)', () => {
    it('PipBoyLoader 應該使用 Pip-Boy 綠色', () => {
      render(<PipBoyLoader />)

      const text = screen.getByText(/Pip-Boy 掃描中/i)
      expect(text).toHaveClass('text-pip-boy-green')
    })

    it('SuccessPulse 應該使用成功色', () => {
      const { container } = render(<SuccessPulse />)

      const icon = container.querySelector('.ri-checkbox-circle-line')
      // 檢查是否使用成功色變體（variant="success" → text-pip-boy-green-bright）
      expect(icon?.className).toMatch(/text-pip-boy-green-bright/)
    })
  })

  describe('PixelIcon 圖示使用', () => {
    it('所有元件應該使用 PixelIcon（RemixIcon）', () => {
      const { container: loaderContainer } = render(<PipBoyLoader />)
      const { container: successContainer } = render(<SuccessPulse />)
      const { container: errorContainer } = render(<ErrorFlash />)

      // 檢查是否有 RemixIcon 的 class (ri-*)
      expect(loaderContainer.querySelector('.ri-loader-4-line')).toBeInTheDocument()
      expect(successContainer.querySelector('.ri-checkbox-circle-line')).toBeInTheDocument()
      expect(errorContainer.querySelector('.ri-error-warning-line')).toBeInTheDocument()
    })

    it('不應該使用 lucide-react 圖示', () => {
      const { container: loaderContainer } = render(<PipBoyLoader />)
      const { container: successContainer } = render(<SuccessPulse />)
      const { container: errorContainer } = render(<ErrorFlash />)

      // 確保沒有 lucide 的 svg 結構（PixelIcon 使用 <i> 標籤）
      expect(loaderContainer.querySelector('svg')).toBeNull()
      expect(successContainer.querySelector('svg')).toBeNull()
      expect(errorContainer.querySelector('svg')).toBeNull()
    })
  })

  describe('Cubic 11 字體', () => {
    it('文字應該繼承 Cubic 11 字體', () => {
      render(<PipBoyLoader text="測試文字" />)

      const text = screen.getByText('測試文字')
      // 元件應該繼承全域字體，不需要額外指定
      // 檢查沒有硬編碼其他字體
      expect(text.className).not.toMatch(/font-(sans|serif|mono)/)
    })
  })

  describe('Fallout 術語', () => {
    it('預設文字應該使用 Fallout 術語', () => {
      render(<PipBoyLoader />)

      // 應該使用 "Pip-Boy" 相關術語
      expect(screen.getByText(/Pip-Boy/i)).toBeInTheDocument()
    })

    it('應該避免使用通用術語', () => {
      render(<PipBoyLoader />)

      // 不應該使用 "載入中..." 這類通用詞
      const text = screen.queryByText('載入中...')
      expect(text).not.toBeInTheDocument()
    })
  })

  describe('動畫命名規範', () => {
    it('應該使用語意化的動畫名稱', () => {
      const { container } = render(<PipBoyLoader />)

      // 檢查是否使用 Tailwind 標準動畫
      expect(container.innerHTML).toMatch(/animate-(spin|pulse|bounce|wiggle)/)
    })
  })
})
