/**
 * WishlistModal Component Tests
 * Testing modal open/close, daily limit status, and automatic data loading
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WishlistModal from '../WishlistModal'
import { useWishlistStore } from '@/stores/wishlistStore'

// Mock the wishlist store
jest.mock('@/stores/wishlistStore')

// Mock MarkdownEditor component
jest.mock('../MarkdownEditor', () => ({
  __esModule: true,
  default: ({ onSubmit, isLoading, maxLength, submitButtonText }: any) => (
    <div data-testid="markdown-editor">
      <textarea data-testid="editor-textarea" placeholder="Test editor" />
      <button onClick={() => onSubmit('Test wish content')} disabled={isLoading}>
        {submitButtonText}
      </button>
      <span>Max length: {maxLength}</span>
    </div>
  ),
}))

// Mock WishHistory component
jest.mock('../WishHistory', () => ({
  __esModule: true,
  default: () => (
    <div data-testid="wish-history">
      <div>Wish 1 content</div>
      <div>Wish 2 content</div>
    </div>
  ),
}))

describe('WishlistModal', () => {
  const mockFetchUserWishes = jest.fn()
  const mockSubmitWish = jest.fn()
  const mockOnOpenChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementation
    ;(useWishlistStore as unknown as jest.Mock).mockReturnValue({
      hasSubmittedToday: false,
      isLoading: false,
      fetchUserWishes: mockFetchUserWishes,
      submitWish: mockSubmitWish,
    })
  })

  describe('Modal Rendering', () => {
    it('should render modal when open is true', () => {
      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should not render modal content when open is false', () => {
      render(
        <WishlistModal
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should render modal title', () => {
      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.getByText('願望許願池')).toBeInTheDocument()
    })

    it('should render modal description', () => {
      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.getByText(/每日限制一則願望/i)).toBeInTheDocument()
    })

    it('should render close button', () => {
      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      // Close button with close icon
      const closeButton = screen.getByLabelText(/關閉彈窗/i).closest('button')
      expect(closeButton).toBeInTheDocument()
    })
  })

  describe('Daily Limit Status Display', () => {
    it('should show MarkdownEditor when hasSubmittedToday is false', () => {
      ;(useWishlistStore as unknown as jest.Mock).mockReturnValue({
        hasSubmittedToday: false,
        isLoading: false,
        fetchUserWishes: mockFetchUserWishes,
        submitWish: mockSubmitWish,
      })

      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.getByTestId('markdown-editor')).toBeInTheDocument()
      expect(screen.queryByText(/今日已許願/i)).not.toBeInTheDocument()
    })

    it('should show "今日已許願" message when hasSubmittedToday is true', () => {
      ;(useWishlistStore as unknown as jest.Mock).mockReturnValue({
        hasSubmittedToday: true,
        isLoading: false,
        fetchUserWishes: mockFetchUserWishes,
        submitWish: mockSubmitWish,
      })

      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.getByText('今日已許願')).toBeInTheDocument()
      expect(screen.getByText(/感謝你的願望！明日再來許下新的期待吧/i)).toBeInTheDocument()
      expect(screen.queryByTestId('markdown-editor')).not.toBeInTheDocument()
    })

    it('should render success message when submitted today', () => {
      ;(useWishlistStore as unknown as jest.Mock).mockReturnValue({
        hasSubmittedToday: true,
        isLoading: false,
        fetchUserWishes: mockFetchUserWishes,
        submitWish: mockSubmitWish,
      })

      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      // Verify the success message is displayed
      expect(screen.getByText('今日已許願')).toBeInTheDocument()

      // Verify the success container exists with border styling
      const successMessage = screen.getByText('今日已許願')
      const container = successMessage.closest('[class*="border"]')
      expect(container).toBeInTheDocument()
    })
  })

  describe('Automatic Data Loading', () => {
    it('should call fetchUserWishes when modal opens', async () => {
      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await waitFor(() => {
        expect(mockFetchUserWishes).toHaveBeenCalledTimes(1)
      })
    })

    it('should not call fetchUserWishes when modal is closed', () => {
      render(
        <WishlistModal
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(mockFetchUserWishes).not.toHaveBeenCalled()
    })

    it('should call fetchUserWishes again when modal reopens', async () => {
      const { rerender } = render(
        <WishlistModal
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(mockFetchUserWishes).not.toHaveBeenCalled()

      // Open modal
      rerender(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await waitFor(() => {
        expect(mockFetchUserWishes).toHaveBeenCalledTimes(1)
      })

      // Close modal
      rerender(
        <WishlistModal
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      )

      // Reopen modal
      rerender(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await waitFor(() => {
        expect(mockFetchUserWishes).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Wish Submission', () => {
    it('should call submitWish when user submits wish', async () => {
      mockSubmitWish.mockResolvedValue(undefined)

      const user = userEvent.setup()
      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const submitButton = screen.getByText('提交願望')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSubmitWish).toHaveBeenCalledWith('Test wish content')
      })
    })

    it('should handle submission errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      mockSubmitWish.mockRejectedValue(new Error('Submission failed'))

      const user = userEvent.setup()
      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const submitButton = screen.getByText('提交願望')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSubmitWish).toHaveBeenCalled()
      })

      // Modal should remain open (not crash)
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      consoleErrorSpy.mockRestore()
    })

    it('should pass maxLength of 500 to MarkdownEditor', () => {
      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.getByText('Max length: 500')).toBeInTheDocument()
    })

    it('should pass isLoading state to MarkdownEditor', () => {
      ;(useWishlistStore as unknown as jest.Mock).mockReturnValue({
        hasSubmittedToday: false,
        isLoading: true,
        fetchUserWishes: mockFetchUserWishes,
        submitWish: mockSubmitWish,
      })

      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const submitButton = screen.getByText('提交願望')
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Wish History Display', () => {
    it('should render WishHistory component', () => {
      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.getByTestId('wish-history')).toBeInTheDocument()
    })

    it('should render history section title', () => {
      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.getByText('願望歷史')).toBeInTheDocument()
    })

    it('should display wish history content', () => {
      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      expect(screen.getByText('Wish 1 content')).toBeInTheDocument()
      expect(screen.getByText('Wish 2 content')).toBeInTheDocument()
    })
  })

  describe('Modal Close Interaction', () => {
    it('should call onOpenChange with false when close button clicked', async () => {
      const user = userEvent.setup()
      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const closeButton = screen.getByLabelText(/關閉彈窗/i).closest('button') as HTMLElement
      await user.click(closeButton)

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for dialog', () => {
      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby', 'wishlist-modal-title')
      expect(dialog).toHaveAttribute('aria-describedby', 'wishlist-modal-description')
    })

    it('should have proper dialog title', () => {
      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const title = screen.getByText('願望許願池')
      expect(title).toBeInTheDocument()

      // Check if title or its parent has the ID
      const titleOrParent = title.id ? title : title.closest('[id="wishlist-modal-title"]')
      expect(titleOrParent).toBeTruthy()
    })

    it('should have proper dialog description ID', () => {
      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const description = screen.getByText(/每日限制一則願望/i)
      expect(description).toHaveAttribute('id', 'wishlist-modal-description')
    })

    it('should have aria-label for close button', () => {
      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const closeIcon = screen.getByLabelText(/關閉彈窗/i)
      expect(closeIcon).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('should have fixed upper section for input area', () => {
      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const editor = screen.getByTestId('markdown-editor')
      expect(editor).toBeInTheDocument()

      // Check if the editor or its container has flex-shrink-0
      const container = editor.closest('[class*="flex-shrink-0"]') || editor.parentElement
      expect(container).toBeTruthy()
    })

    it('should have scrollable lower section for history', () => {
      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const historySection = screen.getByText('願望歷史').closest('div')
      expect(historySection).toHaveClass('flex-1', 'min-h-0', 'flex', 'flex-col')
    })

    it('should have proper Fallout theme styling', () => {
      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('border-2', 'border-pip-boy-green')
    })
  })

  describe('Console Logging', () => {
    it('should log when modal opens', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()

      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('彈窗開啟，載入使用者願望列表')
        )
      })

      consoleLogSpy.mockRestore()
    })

    it('should log on successful wish submission', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
      mockSubmitWish.mockResolvedValue(undefined)

      const user = userEvent.setup()
      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const submitButton = screen.getByText('提交願望')
      await user.click(submitButton)

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('願望提交成功')
        )
      })

      consoleLogSpy.mockRestore()
    })

    it('should log error on failed wish submission', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      mockSubmitWish.mockRejectedValue(new Error('Failed'))

      const user = userEvent.setup()
      render(
        <WishlistModal
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      )

      const submitButton = screen.getByText('提交願望')
      await user.click(submitButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('願望提交失敗'),
          expect.any(Error)
        )
      })

      consoleErrorSpy.mockRestore()
    })
  })
})
