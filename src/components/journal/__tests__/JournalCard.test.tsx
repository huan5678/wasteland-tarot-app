/**
 * JournalCard Component Tests
 * Testing journal preview card display
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { JournalCard } from '../JournalCard'
import type { Journal } from '@/stores/journalStore'

describe('JournalCard', () => {
  const mockJournal: Journal = {
    id: 'journal-1',
    reading_id: 'reading-1',
    user_id: 'user-1',
    content: '# My Reading\n\nThe Fool card appeared today. This represents new beginnings and opportunities. I feel hopeful about the future.',
    mood_tags: ['hopeful', 'excited', 'peaceful'],
    is_private: true,
    created_at: '2025-10-23T10:00:00Z',
    updated_at: '2025-10-23T10:00:00Z',
  }

  const mockOnClick = jest.fn()

  describe('Basic Rendering', () => {
    it('should render journal creation date', () => {
      render(<JournalCard journal={mockJournal} onClick={mockOnClick} />)

      expect(screen.getByText(/2025/)).toBeInTheDocument()
    })

    it('should render content preview (first 100 characters without markdown)', () => {
      render(<JournalCard journal={mockJournal} onClick={mockOnClick} />)

      // Should remove markdown syntax (# heading)
      expect(screen.getByText(/My Reading/)).toBeInTheDocument()
      expect(screen.getByText(/The Fool card appeared/)).toBeInTheDocument()
    })

    it('should render mood tags (max 3 visible)', () => {
      render(<JournalCard journal={mockJournal} onClick={mockOnClick} />)

      expect(screen.getByText(/充滿希望/)).toBeInTheDocument()
      expect(screen.getByText(/興奮期待/)).toBeInTheDocument()
      expect(screen.getByText(/平靜安詳/)).toBeInTheDocument()
    })

    it('should show remaining tags count when more than 3 tags', () => {
      const journalWithManyTags = {
        ...mockJournal,
        mood_tags: ['hopeful', 'excited', 'peaceful', 'grateful', 'reflective'],
      }

      render(<JournalCard journal={journalWithManyTags} onClick={mockOnClick} />)

      // Should show "+2 more" or similar
      expect(screen.getByText(/\+2/)).toBeInTheDocument()
    })

    it('should render private icon when journal is private', () => {
      render(<JournalCard journal={mockJournal} onClick={mockOnClick} />)

      expect(screen.getByLabelText(/私密/i)).toBeInTheDocument()
    })

    it('should not render private icon when journal is public', () => {
      const publicJournal = { ...mockJournal, is_private: false }

      render(<JournalCard journal={publicJournal} onClick={mockOnClick} />)

      expect(screen.queryByLabelText(/私密/i)).not.toBeInTheDocument()
    })
  })

  describe('Content Preview', () => {
    it('should truncate content to 100 characters', () => {
      const longContent = 'A'.repeat(200)
      const journalWithLongContent = { ...mockJournal, content: longContent }

      render(<JournalCard journal={journalWithLongContent} onClick={mockOnClick} />)

      const previewText = screen.getByText(/A+/)
      expect(previewText.textContent?.length).toBeLessThanOrEqual(103) // 100 + "..."
    })

    it('should strip markdown syntax from preview', () => {
      const markdownContent = '# Heading\n\n**Bold** and *italic* text\n\n- List item'
      const journalWithMarkdown = { ...mockJournal, content: markdownContent }

      render(<JournalCard journal={journalWithMarkdown} onClick={mockOnClick} />)

      // Should not show markdown symbols
      const previewElement = screen.getByText(/Heading/)
      expect(previewElement.textContent).not.toContain('#')
      expect(previewElement.textContent).not.toContain('**')
      expect(previewElement.textContent).not.toContain('*')
      expect(previewElement.textContent).not.toContain('-')
    })
  })

  describe('Interactions', () => {
    it('should call onClick when card is clicked', () => {
      render(<JournalCard journal={mockJournal} onClick={mockOnClick} />)

      const card = screen.getByRole('article')
      fireEvent.click(card)

      expect(mockOnClick).toHaveBeenCalledWith(mockJournal)
    })

    it('should have hover styles', () => {
      render(<JournalCard journal={mockJournal} onClick={mockOnClick} />)

      const card = screen.getByRole('article')
      expect(card).toHaveClass('cursor-pointer')
    })
  })

  describe('Empty States', () => {
    it('should handle journal with no mood tags', () => {
      const journalWithoutTags = { ...mockJournal, mood_tags: [] }

      render(<JournalCard journal={journalWithoutTags} onClick={mockOnClick} />)

      // Should not crash, card should still render
      expect(screen.getByRole('article')).toBeInTheDocument()
    })

    it('should handle journal with minimal content', () => {
      const journalWithMinimalContent = { ...mockJournal, content: 'Hi' }

      render(<JournalCard journal={journalWithMinimalContent} onClick={mockOnClick} />)

      expect(screen.getByText('Hi')).toBeInTheDocument()
    })
  })
})
