/**
 * JournalList Component Tests
 * Tests list rendering, pagination, search, and filtering functionality
 */

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalList } from '../JournalList'
import type { Journal } from '@/stores/journalStore'

// ============================================================================
// Mock Data
// ============================================================================

const createMockJournal = (overrides: Partial<Journal> = {}): Journal => ({
  id: 'journal-1',
  reading_id: 'reading-1',
  user_id: 'user-1',
  content: '今天的塔羅占卜給了我很多啟發。\n\n**愚者牌**代表新的開始。',
  mood_tags: ['hopeful', 'reflective'],
  is_private: true,
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2025-01-15T10:00:00Z',
  ...overrides,
})

const mockJournals: Journal[] = [
  createMockJournal({
    id: 'journal-1',
    content: '今天抽到愚者牌，代表新的開始。非常期待！',
    mood_tags: ['hopeful', 'excited'],
    created_at: '2025-01-20T10:00:00Z',
  }),
  createMockJournal({
    id: 'journal-2',
    content: '今天的占卜結果讓我有點困惑，需要好好思考。',
    mood_tags: ['confused', 'anxious'],
    created_at: '2025-01-19T15:30:00Z',
  }),
  createMockJournal({
    id: 'journal-3',
    content: '感恩今天的指引，讓我找到內心的平靜。',
    mood_tags: ['grateful', 'peaceful'],
    created_at: '2025-01-18T08:00:00Z',
  }),
  createMockJournal({
    id: 'journal-4',
    content: '這次占卜給了我很多思考的空間，真的很有收穫。',
    mood_tags: ['reflective'],
    created_at: '2025-01-17T14:00:00Z',
  }),
  createMockJournal({
    id: 'journal-5',
    content: '對未來感到不確定，希望能找到方向。',
    mood_tags: ['uncertain', 'anxious'],
    created_at: '2025-01-16T09:00:00Z',
  }),
]

// ============================================================================
// Tests
// ============================================================================

describe('JournalList', () => {
  const mockOnJournalClick = jest.fn()

  beforeEach(() => {
    mockOnJournalClick.mockClear()
  })

  // ==========================================================================
  // Basic Rendering
  // ==========================================================================

  describe('Basic Rendering', () => {
    it('should render all journals as JournalCard components', () => {
      render(
        <JournalList
          journals={mockJournals}
          total={mockJournals.length}
          onJournalClick={mockOnJournalClick}
        />
      )

      // Check all journals are rendered
      expect(screen.getByText(/今天抽到愚者牌/)).toBeInTheDocument()
      expect(screen.getByText(/今天的占卜結果讓我有點困惑/)).toBeInTheDocument()
      expect(screen.getByText(/感恩今天的指引/)).toBeInTheDocument()
      expect(screen.getByText(/這次占卜給了我很多思考的空間/)).toBeInTheDocument()
      expect(screen.getByText(/對未來感到不確定/)).toBeInTheDocument()
    })

    it('should display journal count', () => {
      render(
        <JournalList
          journals={mockJournals}
          total={mockJournals.length}
          onJournalClick={mockOnJournalClick}
        />
      )

      expect(screen.getByText(/共 5 筆日記/)).toBeInTheDocument()
    })

    it('should pass journal data to JournalCard correctly', () => {
      render(
        <JournalList
          journals={[mockJournals[0]]}
          total={1}
          onJournalClick={mockOnJournalClick}
        />
      )

      // Check content is passed
      expect(screen.getByText(/今天抽到愚者牌/)).toBeInTheDocument()

      // Check mood tags are rendered
      expect(screen.getByText('充滿希望')).toBeInTheDocument()
      expect(screen.getByText('興奮期待')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Empty State
  // ==========================================================================

  describe('Empty State', () => {
    it('should display empty state when no journals', () => {
      render(
        <JournalList
          journals={[]}
          total={0}
          onJournalClick={mockOnJournalClick}
        />
      )

      expect(screen.getByText(/尚無日記/)).toBeInTheDocument()
      expect(screen.getByText(/開始記錄你的塔羅之旅/)).toBeInTheDocument()
    })

    it('should not display pagination when no journals', () => {
      render(
        <JournalList
          journals={[]}
          total={0}
          onJournalClick={mockOnJournalClick}
        />
      )

      expect(screen.queryByRole('button', { name: /上一頁/ })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /下一頁/ })).not.toBeInTheDocument()
    })

    it('should display empty state when search has no results', async () => {
      const user = userEvent.setup()

      render(
        <JournalList
          journals={mockJournals}
          total={mockJournals.length}
          onJournalClick={mockOnJournalClick}
        />
      )

      // Type search term with no results
      const searchInput = screen.getByPlaceholderText(/搜尋日記內容/)
      await user.type(searchInput, '沒有這個關鍵字xyzabc')

      await waitFor(() => {
        expect(screen.getByText(/找不到符合的日記/)).toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // Interactions
  // ==========================================================================

  describe('Interactions', () => {
    it('should call onJournalClick when a journal card is clicked', async () => {
      const user = userEvent.setup()

      render(
        <JournalList
          journals={[mockJournals[0]]}
          total={1}
          onJournalClick={mockOnJournalClick}
        />
      )

      const card = screen.getByRole('article')
      await user.click(card)

      expect(mockOnJournalClick).toHaveBeenCalledTimes(1)
      expect(mockOnJournalClick).toHaveBeenCalledWith(mockJournals[0])
    })
  })

  // ==========================================================================
  // Client-Side Search
  // ==========================================================================

  describe('Client-Side Search', () => {
    it('should display search input', () => {
      render(
        <JournalList
          journals={mockJournals}
          total={mockJournals.length}
          onJournalClick={mockOnJournalClick}
        />
      )

      expect(screen.getByPlaceholderText(/搜尋日記內容/)).toBeInTheDocument()
    })

    it('should filter journals by content keyword', async () => {
      const user = userEvent.setup()

      render(
        <JournalList
          journals={mockJournals}
          total={mockJournals.length}
          onJournalClick={mockOnJournalClick}
        />
      )

      const searchInput = screen.getByPlaceholderText(/搜尋日記內容/)
      await user.type(searchInput, '愚者牌')

      await waitFor(() => {
        expect(screen.getByText(/今天抽到愚者牌/)).toBeInTheDocument()
        expect(screen.queryByText(/今天的占卜結果讓我有點困惑/)).not.toBeInTheDocument()
      })
    })

    it('should be case-insensitive in search', async () => {
      const user = userEvent.setup()

      render(
        <JournalList
          journals={mockJournals}
          total={mockJournals.length}
          onJournalClick={mockOnJournalClick}
        />
      )

      const searchInput = screen.getByPlaceholderText(/搜尋日記內容/)
      await user.type(searchInput, '感恩')

      await waitFor(() => {
        expect(screen.getByText(/感恩今天的指引/)).toBeInTheDocument()
      })
    })

    it('should update results count when searching', async () => {
      const user = userEvent.setup()

      render(
        <JournalList
          journals={mockJournals}
          total={mockJournals.length}
          onJournalClick={mockOnJournalClick}
        />
      )

      // Initially shows all
      expect(screen.getByText(/共 5 筆日記/)).toBeInTheDocument()

      const searchInput = screen.getByPlaceholderText(/搜尋日記內容/)
      await user.type(searchInput, '占卜')

      await waitFor(() => {
        expect(screen.getByText(/共 2 筆日記/)).toBeInTheDocument()
      })
    })

    it('should clear search when input is emptied', async () => {
      const user = userEvent.setup()

      render(
        <JournalList
          journals={mockJournals}
          total={mockJournals.length}
          onJournalClick={mockOnJournalClick}
        />
      )

      const searchInput = screen.getByPlaceholderText(/搜尋日記內容/)

      // Type and clear
      await user.type(searchInput, '愚者牌')
      await waitFor(() => {
        expect(screen.getByText(/共 1 筆日記/)).toBeInTheDocument()
      })

      await user.clear(searchInput)
      await waitFor(() => {
        expect(screen.getByText(/共 5 筆日記/)).toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // Mood Tag Filtering
  // ==========================================================================

  describe('Mood Tag Filtering', () => {
    it('should display mood tag filter buttons', () => {
      render(
        <JournalList
          journals={mockJournals}
          total={mockJournals.length}
          onJournalClick={mockOnJournalClick}
        />
      )

      // Check some mood tag buttons exist
      expect(screen.getByRole('button', { name: '充滿希望' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '焦慮不安' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '平靜安詳' })).toBeInTheDocument()
    })

    it('should filter journals by selected mood tag', async () => {
      const user = userEvent.setup()

      render(
        <JournalList
          journals={mockJournals}
          total={mockJournals.length}
          onJournalClick={mockOnJournalClick}
        />
      )

      const hopefulButton = screen.getByRole('button', { name: '充滿希望' })
      await user.click(hopefulButton)

      await waitFor(() => {
        // Only journal-1 has 'hopeful' tag
        expect(screen.getByText(/今天抽到愚者牌/)).toBeInTheDocument()
        expect(screen.queryByText(/今天的占卜結果讓我有點困惑/)).not.toBeInTheDocument()
        expect(screen.getByText(/共 1 筆日記/)).toBeInTheDocument()
      })
    })

    it('should toggle mood tag filter on/off', async () => {
      const user = userEvent.setup()

      render(
        <JournalList
          journals={mockJournals}
          total={mockJournals.length}
          onJournalClick={mockOnJournalClick}
        />
      )

      const hopefulButton = screen.getByRole('button', { name: '充滿希望' })

      // Filter on
      await user.click(hopefulButton)
      await waitFor(() => {
        expect(screen.getByText(/共 1 筆日記/)).toBeInTheDocument()
      })

      // Filter off
      await user.click(hopefulButton)
      await waitFor(() => {
        expect(screen.getByText(/共 5 筆日記/)).toBeInTheDocument()
      })
    })

    it('should combine search and mood tag filters', async () => {
      const user = userEvent.setup()

      render(
        <JournalList
          journals={mockJournals}
          total={mockJournals.length}
          onJournalClick={mockOnJournalClick}
        />
      )

      // Apply mood tag filter
      const anxiousButton = screen.getByRole('button', { name: '焦慮不安' })
      await user.click(anxiousButton)

      // Apply search filter
      const searchInput = screen.getByPlaceholderText(/搜尋日記內容/)
      await user.type(searchInput, '困惑')

      await waitFor(() => {
        // Only journal-2 matches both filters
        expect(screen.getByText(/今天的占卜結果讓我有點困惑/)).toBeInTheDocument()
        expect(screen.queryByText(/對未來感到不確定/)).not.toBeInTheDocument()
        expect(screen.getByText(/共 1 筆日記/)).toBeInTheDocument()
      })
    })

    it('should visually indicate active mood tag filter', async () => {
      const user = userEvent.setup()

      render(
        <JournalList
          journals={mockJournals}
          total={mockJournals.length}
          onJournalClick={mockOnJournalClick}
        />
      )

      const hopefulButton = screen.getByRole('button', { name: '充滿希望' })

      // Initially not active
      expect(hopefulButton).not.toHaveClass('selected')

      // After click, should be active
      await user.click(hopefulButton)
      expect(hopefulButton).toHaveClass('selected')
    })
  })

  // ==========================================================================
  // Pagination
  // ==========================================================================

  describe('Pagination', () => {
    it('should display pagination controls when total > limit', () => {
      render(
        <JournalList
          journals={mockJournals.slice(0, 3)}
          total={25}
          currentPage={1}
          pageSize={3}
          onPageChange={jest.fn()}
          onJournalClick={mockOnJournalClick}
        />
      )

      expect(screen.getByRole('button', { name: /上一頁/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /下一頁/ })).toBeInTheDocument()
    })

    it('should not display pagination when total <= limit', () => {
      render(
        <JournalList
          journals={mockJournals}
          total={mockJournals.length}
          currentPage={1}
          pageSize={20}
          onPageChange={jest.fn()}
          onJournalClick={mockOnJournalClick}
        />
      )

      expect(screen.queryByRole('button', { name: /上一頁/ })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /下一頁/ })).not.toBeInTheDocument()
    })

    it('should disable "Previous" button on first page', () => {
      render(
        <JournalList
          journals={mockJournals.slice(0, 3)}
          total={25}
          currentPage={1}
          pageSize={3}
          onPageChange={jest.fn()}
          onJournalClick={mockOnJournalClick}
        />
      )

      const prevButton = screen.getByRole('button', { name: /上一頁/ })
      expect(prevButton).toBeDisabled()
    })

    it('should disable "Next" button on last page', () => {
      render(
        <JournalList
          journals={mockJournals.slice(0, 3)}
          total={10}
          currentPage={4}
          pageSize={3}
          onPageChange={jest.fn()}
          onJournalClick={mockOnJournalClick}
        />
      )

      const nextButton = screen.getByRole('button', { name: /下一頁/ })
      expect(nextButton).toBeDisabled()
    })

    it('should call onPageChange when clicking next page', async () => {
      const user = userEvent.setup()
      const mockOnPageChange = jest.fn()

      render(
        <JournalList
          journals={mockJournals.slice(0, 3)}
          total={25}
          currentPage={1}
          pageSize={3}
          onPageChange={mockOnPageChange}
          onJournalClick={mockOnJournalClick}
        />
      )

      const nextButton = screen.getByRole('button', { name: /下一頁/ })
      await user.click(nextButton)

      expect(mockOnPageChange).toHaveBeenCalledTimes(1)
      expect(mockOnPageChange).toHaveBeenCalledWith(2)
    })

    it('should call onPageChange when clicking previous page', async () => {
      const user = userEvent.setup()
      const mockOnPageChange = jest.fn()

      render(
        <JournalList
          journals={mockJournals.slice(0, 3)}
          total={25}
          currentPage={3}
          pageSize={3}
          onPageChange={mockOnPageChange}
          onJournalClick={mockOnJournalClick}
        />
      )

      const prevButton = screen.getByRole('button', { name: /上一頁/ })
      await user.click(prevButton)

      expect(mockOnPageChange).toHaveBeenCalledTimes(1)
      expect(mockOnPageChange).toHaveBeenCalledWith(2)
    })

    it('should display current page and total pages', () => {
      render(
        <JournalList
          journals={mockJournals.slice(0, 3)}
          total={25}
          currentPage={3}
          pageSize={5}
          onPageChange={jest.fn()}
          onJournalClick={mockOnJournalClick}
        />
      )

      expect(screen.getByText(/第 3 \/ 5 頁/)).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Loading State
  // ==========================================================================

  describe('Loading State', () => {
    it('should display loading skeleton when isLoading is true', () => {
      render(
        <JournalList
          journals={[]}
          total={0}
          isLoading={true}
          onJournalClick={mockOnJournalClick}
        />
      )

      expect(screen.getByRole('status', { name: /載入中/ })).toBeInTheDocument()
    })

    it('should not display journals when loading', () => {
      render(
        <JournalList
          journals={mockJournals}
          total={mockJournals.length}
          isLoading={true}
          onJournalClick={mockOnJournalClick}
        />
      )

      expect(screen.queryByRole('article')).not.toBeInTheDocument()
    })
  })
})
