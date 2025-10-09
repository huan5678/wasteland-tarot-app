/**
 * SuitIcon Component Tests
 * 測試 SuitIcon 元件的渲染、樣式和無障礙性
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { Sparkles, Swords, Coins } from 'lucide-react'
import { SuitIcon } from '../SuitIcon'

describe('SuitIcon Component', () => {
  describe('基本渲染', () => {
    it('應該正確渲染傳入的 lucide-react 圖示', () => {
      render(<SuitIcon Icon={Sparkles} ariaLabel="Sparkles Icon" />)

      // 驗證 SVG 元素存在
      const icon = screen.getByRole('img', { name: 'Sparkles Icon' })
      expect(icon).toBeInTheDocument()
    })

    it('應該正確渲染不同的圖示元件', () => {
      const { rerender } = render(<SuitIcon Icon={Swords} ariaLabel="Swords" />)
      expect(screen.getByRole('img', { name: 'Swords' })).toBeInTheDocument()

      rerender(<SuitIcon Icon={Coins} ariaLabel="Coins" />)
      expect(screen.getByRole('img', { name: 'Coins' })).toBeInTheDocument()
    })
  })

  describe('尺寸變體', () => {
    it('應該在 size="sm" 時套用小尺寸類別', () => {
      render(<SuitIcon Icon={Sparkles} size="sm" ariaLabel="Small icon" />)
      const icon = screen.getByRole('img')
      expect(icon).toHaveClass('w-8', 'h-8')
    })

    it('應該在 size="md" 時套用中尺寸類別', () => {
      render(<SuitIcon Icon={Sparkles} size="md" ariaLabel="Medium icon" />)
      const icon = screen.getByRole('img')
      expect(icon).toHaveClass('w-12', 'h-12')
    })

    it('應該在 size="lg" 時套用大尺寸響應式類別', () => {
      render(<SuitIcon Icon={Sparkles} size="lg" ariaLabel="Large icon" />)
      const icon = screen.getByRole('img')
      expect(icon).toHaveClass('w-16', 'h-16', 'md:w-20', 'md:h-20', 'lg:w-24', 'lg:h-24')
    })

    it('應該在 size="xl" 時套用超大尺寸響應式類別', () => {
      render(<SuitIcon Icon={Sparkles} size="xl" ariaLabel="XL icon" />)
      const icon = screen.getByRole('img')
      expect(icon).toHaveClass('w-20', 'h-20', 'md:w-24', 'md:h-24', 'lg:w-28', 'lg:h-28')
    })

    it('應該預設使用 "lg" 尺寸當 size prop 未提供時', () => {
      render(<SuitIcon Icon={Sparkles} ariaLabel="Default size" />)
      const icon = screen.getByRole('img')
      expect(icon).toHaveClass('w-16', 'h-16', 'md:w-20', 'md:h-20', 'lg:w-24', 'lg:h-24')
    })
  })

  describe('樣式套用', () => {
    it('應該套用 pip-boy-green 顏色類別', () => {
      render(<SuitIcon Icon={Sparkles} ariaLabel="Styled icon" />)
      const icon = screen.getByRole('img')
      expect(icon).toHaveClass('text-pip-boy-green')
    })

    it('應該套用過渡動畫類別', () => {
      render(<SuitIcon Icon={Sparkles} ariaLabel="Animated icon" />)
      const icon = screen.getByRole('img')
      expect(icon).toHaveClass('transition-transform', 'duration-300')
    })

    it('應該套用 drop-shadow 發光效果', () => {
      render(<SuitIcon Icon={Sparkles} ariaLabel="Glowing icon" />)
      const icon = screen.getByRole('img')
      const style = window.getComputedStyle(icon)
      expect(icon.style.filter).toContain('drop-shadow')
    })

    it('應該正確合併自訂 className', () => {
      render(<SuitIcon Icon={Sparkles} className="custom-class" ariaLabel="Custom styled" />)
      const icon = screen.getByRole('img')
      expect(icon).toHaveClass('custom-class', 'text-pip-boy-green')
    })
  })

  describe('無障礙性屬性', () => {
    it('應該設定 aria-label 當 ariaLabel prop 提供時', () => {
      render(<SuitIcon Icon={Sparkles} ariaLabel="Major Arcana Icon" />)
      const icon = screen.getByRole('img', { name: 'Major Arcana Icon' })
      expect(icon).toBeInTheDocument()
    })

    it('應該設定 aria-hidden="true" 當 ariaHidden={true}', () => {
      render(<SuitIcon Icon={Sparkles} ariaHidden={true} />)
      const icon = screen.getByRole('img', { hidden: true })
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('應該預設 aria-hidden 為 false', () => {
      render(<SuitIcon Icon={Sparkles} ariaLabel="Visible icon" />)
      const icon = screen.getByRole('img')
      expect(icon).toHaveAttribute('aria-hidden', 'false')
    })

    it('不應該同時設定 ariaLabel 和 ariaHidden', () => {
      // 這個測試驗證當兩者都提供時的行為
      // 正確做法是只使用其中之一
      render(<SuitIcon Icon={Sparkles} ariaLabel="Test" ariaHidden={true} />)
      const icon = screen.getByRole('img', { hidden: true })
      expect(icon).toHaveAttribute('aria-label', 'Test')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
      // Note: 這是不建議的用法,但元件應該能處理
    })
  })

  describe('strokeWidth 屬性', () => {
    it('應該預設 strokeWidth 為 1.5', () => {
      render(<SuitIcon Icon={Sparkles} ariaLabel="Default stroke" />)
      const icon = screen.getByRole('img')
      // lucide-react 圖示會將 strokeWidth 套用至 SVG
      expect(icon).toHaveAttribute('stroke-width', '1.5')
    })

    it('應該接受自訂 strokeWidth', () => {
      render(<SuitIcon Icon={Sparkles} strokeWidth={2} ariaLabel="Custom stroke" />)
      const icon = screen.getByRole('img')
      expect(icon).toHaveAttribute('stroke-width', '2')
    })
  })

  describe('錯誤處理', () => {
    it('應該在未提供 Icon prop 時返回 null', () => {
      // @ts-expect-error - 測試錯誤情況
      const { container } = render(<SuitIcon ariaLabel="Missing icon" />)
      expect(container.firstChild).toBeNull()
    })
  })
})
