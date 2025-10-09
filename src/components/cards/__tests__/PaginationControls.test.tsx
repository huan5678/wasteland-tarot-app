/**
 * PaginationControls Component Tests
 * 測試分頁控制項元件
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaginationControls } from '../PaginationControls'

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

describe('PaginationControls', () => {
  describe('Rendering', () => {
    it('should render current page and total pages', () => {
      render(<PaginationControls currentPage={2} totalPages={5} baseUrl="/cards/nuka-cola" />)

      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('/', { exact: false })).toBeInTheDocument()
    })

    it('should render previous and next buttons', () => {
      render(<PaginationControls currentPage={2} totalPages={5} baseUrl="/cards/nuka-cola" />)

      expect(screen.getByLabelText('前往上一頁')).toBeInTheDocument()
      expect(screen.getByLabelText('前往下一頁')).toBeInTheDocument()
    })

    it('should render screen reader text for page info', () => {
      render(<PaginationControls currentPage={3} totalPages={10} baseUrl="/cards/nuka-cola" />)

      expect(screen.getByText('第 3 頁,共 10 頁')).toBeInTheDocument()
    })
  })

  describe('Button States', () => {
    it('should disable previous button on first page', () => {
      render(<PaginationControls currentPage={1} totalPages={5} baseUrl="/cards/nuka-cola" />)

      const prevButton = screen.getByLabelText('前往上一頁')
      expect(prevButton).toHaveAttribute('aria-disabled', 'true')
    })

    it('should disable next button on last page', () => {
      render(<PaginationControls currentPage={5} totalPages={5} baseUrl="/cards/nuka-cola" />)

      const nextButton = screen.getByLabelText('前往下一頁')
      expect(nextButton).toHaveAttribute('aria-disabled', 'true')
    })

    it('should enable both buttons on middle pages', () => {
      render(<PaginationControls currentPage={3} totalPages={5} baseUrl="/cards/nuka-cola" />)

      const prevButton = screen.getByLabelText('前往上一頁')
      const nextButton = screen.getByLabelText('前往下一頁')

      expect(prevButton).not.toHaveAttribute('aria-disabled', 'true')
      expect(nextButton).not.toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('Navigation Links', () => {
    it('should have correct href for previous page', () => {
      render(<PaginationControls currentPage={3} totalPages={5} baseUrl="/cards/nuka-cola" />)

      const prevLink = screen.getByLabelText('前往上一頁').closest('a')
      expect(prevLink).toHaveAttribute('href', '/cards/nuka-cola?page=2')
    })

    it('should have correct href for next page', () => {
      render(<PaginationControls currentPage={2} totalPages={5} baseUrl="/cards/nuka-cola" />)

      const nextLink = screen.getByLabelText('前往下一頁').closest('a')
      expect(nextLink).toHaveAttribute('href', '/cards/nuka-cola?page=3')
    })

    it('should construct URL with baseUrl correctly', () => {
      render(<PaginationControls currentPage={1} totalPages={3} baseUrl="/cards/combat_weapons" />)

      const nextLink = screen.getByLabelText('前往下一頁').closest('a')
      expect(nextLink).toHaveAttribute('href', '/cards/combat_weapons?page=2')
    })
  })

  describe('Client-side Navigation', () => {
    it('should call onPageChange when clientSideNavigation is true', async () => {
      const user = userEvent.setup()
      const handlePageChange = jest.fn()

      render(
        <PaginationControls
          currentPage={2}
          totalPages={5}
          baseUrl="/cards/nuka-cola"
          clientSideNavigation={true}
          onPageChange={handlePageChange}
        />
      )

      const nextButton = screen.getByLabelText('前往下一頁')
      await user.click(nextButton)

      expect(handlePageChange).toHaveBeenCalledWith(3)
    })

    it('should not render Link when clientSideNavigation is true', () => {
      render(
        <PaginationControls
          currentPage={2}
          totalPages={5}
          baseUrl="/cards/nuka-cola"
          clientSideNavigation={true}
        />
      )

      const prevButton = screen.getByLabelText('前往上一頁')
      const nextButton = screen.getByLabelText('前往下一頁')

      // Buttons should not be wrapped in Link when clientSideNavigation is true
      expect(prevButton.tagName).toBe('BUTTON')
      expect(nextButton.tagName).toBe('BUTTON')
    })
  })

  describe('Accessibility', () => {
    it('should have navigation landmark', () => {
      render(<PaginationControls currentPage={2} totalPages={5} baseUrl="/cards/nuka-cola" />)

      const nav = screen.getByRole('navigation', { name: '分頁導航' })
      expect(nav).toBeInTheDocument()
    })

    it('should have aria-live region for page indicator', () => {
      const { container } = render(
        <PaginationControls currentPage={2} totalPages={5} baseUrl="/cards/nuka-cola" />
      )

      const liveRegion = container.querySelector('[aria-live="polite"]')
      expect(liveRegion).toBeInTheDocument()
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true')
    })

    it('should announce page changes to screen readers', () => {
      const { rerender } = render(
        <PaginationControls currentPage={2} totalPages={5} baseUrl="/cards/nuka-cola" />
      )

      expect(screen.getByText('第 2 頁,共 5 頁')).toBeInTheDocument()

      rerender(<PaginationControls currentPage={3} totalPages={5} baseUrl="/cards/nuka-cola" />)

      expect(screen.getByText('第 3 頁,共 5 頁')).toBeInTheDocument()
    })

    it('should have minimum touch target size (44x44px)', () => {
      render(<PaginationControls currentPage={2} totalPages={5} baseUrl="/cards/nuka-cola" />)

      const prevButton = screen.getByLabelText('前往上一頁')
      const nextButton = screen.getByLabelText('前往下一頁')

      expect(prevButton).toHaveClass('min-w-[44px]', 'min-h-[44px]')
      expect(nextButton).toHaveClass('min-w-[44px]', 'min-h-[44px]')
    })
  })

  describe('Responsive Design', () => {
    it('should hide button labels on small screens', () => {
      render(<PaginationControls currentPage={2} totalPages={5} baseUrl="/cards/nuka-cola" />)

      const prevButton = screen.getByLabelText('前往上一頁')
      const nextButton = screen.getByLabelText('前往下一頁')

      // Check for responsive classes
      expect(prevButton.querySelector('.hidden')).toBeInTheDocument()
      expect(nextButton.querySelector('.hidden')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle single page (no pagination needed)', () => {
      render(<PaginationControls currentPage={1} totalPages={1} baseUrl="/cards/nuka-cola" />)

      const prevButton = screen.getByLabelText('前往上一頁')
      const nextButton = screen.getByLabelText('前往下一頁')

      expect(prevButton).toHaveAttribute('aria-disabled', 'true')
      expect(nextButton).toHaveAttribute('aria-disabled', 'true')
    })

    it('should handle large page numbers', () => {
      render(<PaginationControls currentPage={99} totalPages={100} baseUrl="/cards/nuka-cola" />)

      expect(screen.getByText('99')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()

      const nextLink = screen.getByLabelText('前往下一頁').closest('a')
      expect(nextLink).toHaveAttribute('href', '/cards/nuka-cola?page=100')
    })
  })
})
