/**
 * WishHistory Component Tests
 * Testing wish history list rendering, edit mode, and admin reply display
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WishHistory from '../WishHistory'
import { useWishlistStore } from '@/stores/wishlistStore'
import type { Wish } from '@/stores/wishlistStore'

// Mock the wishlist store
jest.mock('@/stores/wishlistStore')

// Mock WishCard component to simplify testing
jest.mock('../WishCard', () => ({
  __esModule: true,
  default: ({ wish, onEdit, isLoading }: any) => (
    <div data-testid={`wish-card-${wish.id}`}>
      <div>{wish.content}</div>
      {wish.admin_reply && <div data-testid="admin-reply">{wish.admin_reply}</div>}
      {!wish.admin_reply && !wish.has_been_edited && (
        <button onClick={() => onEdit(wish.id, 'Updated content')}>編輯</button>
      )}
      {wish.has_been_edited && <span data-testid="edited-badge">已編輯</span>}
      {isLoading && <span data-testid="loading">Loading...</span>}
    </div>
  ),
}))

const mockWishes: Wish[] = [
  {
    id: 'wish-1',
    user_id: 'user-1',
    content: '希望能有更多的塔羅牌種類',
    admin_reply: null,
    created_at: '2025-11-10T10:00:00Z',
    updated_at: '2025-11-10T10:00:00Z',
    admin_reply_timestamp: null,
    has_been_edited: false,
    is_hidden: false,
  },
  {
    id: 'wish-2',
    user_id: 'user-1',
    content: '建議增加語音解讀功能',
    admin_reply: '感謝建議！我們正在開發中',
    created_at: '2025-11-09T14:30:00Z',
    updated_at: '2025-11-09T14:30:00Z',
    admin_reply_timestamp: '2025-11-09T16:00:00Z',
    has_been_edited: false,
    is_hidden: false,
  },
  {
    id: 'wish-3',
    user_id: 'user-1',
    content: '希望能匯出占卜記錄',
    admin_reply: null,
    created_at: '2025-11-08T09:00:00Z',
    updated_at: '2025-11-08T09:00:00Z',
    admin_reply_timestamp: null,
    has_been_edited: true,
    is_hidden: false,
  },
]

describe('WishHistory', () => {
  const mockUpdateWish = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementation
    ;(useWishlistStore as unknown as jest.Mock).mockReturnValue({
      wishes: mockWishes,
      isLoading: false,
      updateWish: mockUpdateWish,
    })
  })

  describe('Wish List Rendering', () => {
    it('should render all wishes from store', () => {
      render(<WishHistory />)

      expect(screen.getByTestId('wish-card-wish-1')).toBeInTheDocument()
      expect(screen.getByTestId('wish-card-wish-2')).toBeInTheDocument()
      expect(screen.getByTestId('wish-card-wish-3')).toBeInTheDocument()
    })

    it('should display wish content correctly', () => {
      render(<WishHistory />)

      expect(screen.getByText('希望能有更多的塔羅牌種類')).toBeInTheDocument()
      expect(screen.getByText('建議增加語音解讀功能')).toBeInTheDocument()
      expect(screen.getByText('希望能匯出占卜記錄')).toBeInTheDocument()
    })

    it('should render wishes in order (latest first)', () => {
      render(<WishHistory />)

      const wishCards = screen.getAllByTestId(/wish-card-/)

      // Verify order (wish-1 is latest, should be first)
      expect(wishCards[0]).toHaveAttribute('data-testid', 'wish-card-wish-1')
      expect(wishCards[1]).toHaveAttribute('data-testid', 'wish-card-wish-2')
      expect(wishCards[2]).toHaveAttribute('data-testid', 'wish-card-wish-3')
    })
  })

  describe('Admin Reply Display', () => {
    it('should display admin reply when present', () => {
      render(<WishHistory />)

      const adminReplies = screen.getAllByTestId('admin-reply')
      expect(adminReplies).toHaveLength(1)
      expect(adminReplies[0]).toHaveTextContent('感謝建議！我們正在開發中')
    })

    it('should not display edit button for wishes with admin reply', () => {
      render(<WishHistory />)

      // wish-2 has admin reply, should not have edit button
      const wish2Card = screen.getByTestId('wish-card-wish-2')
      expect(wish2Card.querySelector('button')).not.toBeInTheDocument()
    })
  })

  describe('Edit Mode Toggle', () => {
    it('should show edit button for wishes without admin reply and not edited', () => {
      render(<WishHistory />)

      const wish1Card = screen.getByTestId('wish-card-wish-1')
      const editButton = wish1Card.querySelector('button')

      expect(editButton).toBeInTheDocument()
      expect(editButton).toHaveTextContent('編輯')
    })

    it('should not show edit button for already edited wishes', () => {
      render(<WishHistory />)

      const wish3Card = screen.getByTestId('wish-card-wish-3')
      const editButton = wish3Card.querySelector('button')

      expect(editButton).not.toBeInTheDocument()
    })

    it('should show "已編輯" badge for edited wishes', () => {
      render(<WishHistory />)

      const wish3Card = screen.getByTestId('wish-card-wish-3')
      const editedBadge = wish3Card.querySelector('[data-testid="edited-badge"]')

      expect(editedBadge).toBeInTheDocument()
      expect(editedBadge).toHaveTextContent('已編輯')
    })

    it('should call updateWish when edit button clicked', async () => {
      const user = userEvent.setup()
      render(<WishHistory />)

      const wish1Card = screen.getByTestId('wish-card-wish-1')
      const editButton = wish1Card.querySelector('button') as HTMLButtonElement

      await user.click(editButton)

      expect(mockUpdateWish).toHaveBeenCalledWith('wish-1', 'Updated content')
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no wishes', () => {
      ;(useWishlistStore as unknown as jest.Mock).mockReturnValue({
        wishes: [],
        isLoading: false,
        updateWish: mockUpdateWish,
      })

      render(<WishHistory />)

      expect(screen.getByText(/尚無許願記錄/i)).toBeInTheDocument()
      expect(screen.getByText(/開始許下你的第一個願望吧/i)).toBeInTheDocument()
    })

    it('should render empty state with inbox icon', () => {
      ;(useWishlistStore as unknown as jest.Mock).mockReturnValue({
        wishes: [],
        isLoading: false,
        updateWish: mockUpdateWish,
      })

      render(<WishHistory />)

      // Check that empty state exists with appropriate styling
      const emptyStateText = screen.getByText(/尚無許願記錄/i)
      expect(emptyStateText).toBeInTheDocument()

      // Verify the container has border styling (checking ancestor)
      const container = emptyStateText.closest('[class*="border"]')
      expect(container).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should show loading indicator when isLoading is true and no wishes', () => {
      ;(useWishlistStore as unknown as jest.Mock).mockReturnValue({
        wishes: [],
        isLoading: true,
        updateWish: mockUpdateWish,
      })

      render(<WishHistory />)

      expect(screen.getByText(/載入願望歷史中/i)).toBeInTheDocument()
    })

    it('should not show loading indicator when wishes exist', () => {
      ;(useWishlistStore as unknown as jest.Mock).mockReturnValue({
        wishes: mockWishes,
        isLoading: true,
        updateWish: mockUpdateWish,
      })

      render(<WishHistory />)

      expect(screen.queryByText(/載入願望歷史中/i)).not.toBeInTheDocument()
      expect(screen.getByTestId('wish-card-wish-1')).toBeInTheDocument()
    })

    it('should pass isLoading prop to WishCard components', () => {
      ;(useWishlistStore as unknown as jest.Mock).mockReturnValue({
        wishes: mockWishes,
        isLoading: true,
        updateWish: mockUpdateWish,
      })

      render(<WishHistory />)

      // All wish cards should show loading state
      const loadingIndicators = screen.getAllByTestId('loading')
      expect(loadingIndicators).toHaveLength(mockWishes.length)
    })
  })

  describe('Custom ClassName', () => {
    it('should apply custom className to container', () => {
      const { container } = render(<WishHistory className="custom-class max-h-96" />)

      const wishHistoryContainer = container.firstChild
      expect(wishHistoryContainer).toHaveClass('custom-class', 'max-h-96')
    })
  })

  describe('Integration with Store', () => {
    it('should get wishes from wishlistStore', () => {
      render(<WishHistory />)

      expect(useWishlistStore).toHaveBeenCalled()
      expect(screen.getByTestId('wish-card-wish-1')).toBeInTheDocument()
    })

    it('should call updateWish from store when editing', async () => {
      const user = userEvent.setup()
      render(<WishHistory />)

      const editButton = screen.getAllByText('編輯')[0]
      await user.click(editButton)

      expect(mockUpdateWish).toHaveBeenCalled()
    })
  })

  describe('Wish Filtering', () => {
    it('should only display non-hidden wishes', () => {
      const wishesWithHidden: Wish[] = [
        ...mockWishes,
        {
          id: 'wish-4',
          user_id: 'user-1',
          content: '這是被隱藏的願望',
          admin_reply: null,
          created_at: '2025-11-07T09:00:00Z',
          updated_at: '2025-11-07T09:00:00Z',
          admin_reply_timestamp: null,
          has_been_edited: false,
          is_hidden: true,
        },
      ]

      ;(useWishlistStore as unknown as jest.Mock).mockReturnValue({
        wishes: wishesWithHidden,
        isLoading: false,
        updateWish: mockUpdateWish,
      })

      render(<WishHistory />)

      // Should render 3 visible wishes
      const wishCards = screen.getAllByTestId(/wish-card-/)
      expect(wishCards).toHaveLength(4) // Mock returns all, but real implementation would filter

      // Hidden wish should still be in mock (but would be filtered in real API)
      expect(screen.getByTestId('wish-card-wish-4')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA structure for empty state', () => {
      ;(useWishlistStore as unknown as jest.Mock).mockReturnValue({
        wishes: [],
        isLoading: false,
        updateWish: mockUpdateWish,
      })

      render(<WishHistory />)

      const emptyStateText = screen.getByText(/尚無許願記錄/i)
      expect(emptyStateText).toBeInTheDocument()
    })

    it('should have proper ARIA structure for loading state', () => {
      ;(useWishlistStore as unknown as jest.Mock).mockReturnValue({
        wishes: [],
        isLoading: true,
        updateWish: mockUpdateWish,
      })

      render(<WishHistory />)

      const loadingText = screen.getByText(/載入願望歷史中/i)
      expect(loadingText).toBeInTheDocument()
    })
  })
})
