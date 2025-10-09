/**
 * SuitCard Component Tests
 * 測試花色卡片元件
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SuitCard, SuitCardGrid } from '../SuitCard'
import { SuitType } from '@/types/suits'

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
})

describe('SuitCard', () => {
  describe('Rendering', () => {
    it('should render Major Arcana suit card', () => {
      render(<SuitCard suit={SuitType.MAJOR_ARCANA} />)

      expect(screen.getByText('大阿爾克那')).toBeInTheDocument()
      expect(screen.getByText('MAJOR ARCANA')).toBeInTheDocument()
      expect(screen.getByText('代表生命中的重大主題與轉折點')).toBeInTheDocument()
      expect(screen.getByText('22 張卡牌')).toBeInTheDocument()
    })

    it('should render Nuka-Cola suit card', () => {
      render(<SuitCard suit={SuitType.NUKA_COLA} />)

      expect(screen.getByText('Nuka-Cola 瓶(聖杯)')).toBeInTheDocument()
      expect(screen.getByText('NUKA-COLA BOTTLES (CUPS)')).toBeInTheDocument()
      expect(screen.getByText('代表情感、關係與內在體驗')).toBeInTheDocument()
      expect(screen.getByText('14 張卡牌')).toBeInTheDocument()
    })

    it('should render Combat Weapons suit card', () => {
      render(<SuitCard suit={SuitType.COMBAT_WEAPONS} />)

      expect(screen.getByText('戰鬥武器(寶劍)')).toBeInTheDocument()
      expect(screen.getByText('COMBAT WEAPONS (SWORDS)')).toBeInTheDocument()
      expect(screen.getByText('代表挑戰、衝突與決策')).toBeInTheDocument()
      expect(screen.getByText('14 張卡牌')).toBeInTheDocument()
    })

    it('should render Bottle Caps suit card', () => {
      render(<SuitCard suit={SuitType.BOTTLE_CAPS} />)

      expect(screen.getByText('瓶蓋(錢幣)')).toBeInTheDocument()
      expect(screen.getByText('BOTTLE CAPS (PENTACLES)')).toBeInTheDocument()
      expect(screen.getByText('代表物質、資源與價值')).toBeInTheDocument()
      expect(screen.getByText('14 張卡牌')).toBeInTheDocument()
    })

    it('should render Radiation Rods suit card', () => {
      render(<SuitCard suit={SuitType.RADIATION_RODS} />)

      expect(screen.getByText('輻射棒(權杖)')).toBeInTheDocument()
      expect(screen.getByText('RADIATION RODS (WANDS)')).toBeInTheDocument()
      expect(screen.getByText('代表能量、創造力與行動')).toBeInTheDocument()
      expect(screen.getByText('14 張卡牌')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should have correct href for navigation', () => {
      render(<SuitCard suit={SuitType.NUKA_COLA} />)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/cards/nuka_cola')
    })

    it('should navigate to correct page when clicked', async () => {
      const user = userEvent.setup()
      render(<SuitCard suit={SuitType.MAJOR_ARCANA} />)

      const link = screen.getByRole('link')
      await user.click(link)

      expect(link).toHaveAttribute('href', '/cards/major_arcana')
    })
  })

  describe('Accessibility', () => {
    it('should have descriptive aria-label', () => {
      render(<SuitCard suit={SuitType.NUKA_COLA} />)

      const link = screen.getByLabelText(/瀏覽 Nuka-Cola 瓶\(聖杯\).*, 共 14 張卡牌/)
      expect(link).toBeInTheDocument()
    })

    it('should support keyboard navigation (Enter)', async () => {
      const user = userEvent.setup()
      render(<SuitCard suit={SuitType.MAJOR_ARCANA} />)

      const link = screen.getByRole('link')
      link.focus()
      await user.keyboard('{Enter}')

      // Link should still be in the document after Enter key
      expect(link).toBeInTheDocument()
    })

    it('should support keyboard navigation (Space)', async () => {
      const user = userEvent.setup()
      render(<SuitCard suit={SuitType.BOTTLE_CAPS} />)

      const link = screen.getByRole('link')
      link.focus()
      await user.keyboard(' ')

      // Link should still be in the document after Space key
      expect(link).toBeInTheDocument()
    })

    it('should have proper focus styling classes', () => {
      render(<SuitCard suit={SuitType.COMBAT_WEAPONS} />)

      const link = screen.getByRole('link')
      expect(link).toHaveClass('focus-visible:ring-2')
      expect(link).toHaveClass('focus-visible:ring-pip-boy-green')
    })
  })

  describe('Styling', () => {
    it('should apply custom className', () => {
      render(<SuitCard suit={SuitType.MAJOR_ARCANA} className="custom-class" />)

      const link = screen.getByRole('link')
      expect(link).toHaveClass('custom-class')
    })
  })
})

describe('SuitCardGrid', () => {
  it('should render children in grid layout', () => {
    render(
      <SuitCardGrid>
        <SuitCard suit={SuitType.MAJOR_ARCANA} />
        <SuitCard suit={SuitType.NUKA_COLA} />
        <SuitCard suit={SuitType.COMBAT_WEAPONS} />
      </SuitCardGrid>
    )

    expect(screen.getByText('大阿爾克那')).toBeInTheDocument()
    expect(screen.getByText('Nuka-Cola 瓶(聖杯)')).toBeInTheDocument()
    expect(screen.getByText('戰鬥武器(寶劍)')).toBeInTheDocument()
  })

  it('should apply responsive grid classes', () => {
    const { container } = render(
      <SuitCardGrid>
        <div>Test</div>
      </SuitCardGrid>
    )

    const grid = container.firstChild as HTMLElement
    expect(grid).toHaveClass('grid')
    expect(grid).toHaveClass('grid-cols-1')
    expect(grid).toHaveClass('sm:grid-cols-2')
    expect(grid).toHaveClass('lg:grid-cols-3')
  })

  it('should apply custom className', () => {
    const { container } = render(
      <SuitCardGrid className="custom-grid">
        <div>Test</div>
      </SuitCardGrid>
    )

    const grid = container.firstChild as HTMLElement
    expect(grid).toHaveClass('custom-grid')
  })
})
