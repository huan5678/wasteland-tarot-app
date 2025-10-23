/**
 * JournalEditor Component Tests
 * Testing journal editor with markdown support, mood tags, and character count
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JournalEditor } from '../JournalEditor'

describe('JournalEditor', () => {
  const mockOnSave = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render textarea for content input', () => {
      render(<JournalEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      const textarea = screen.getByPlaceholderText(/寫下你的塔羅感想/i)
      expect(textarea).toBeInTheDocument()
    })

    it('should render edit/preview toggle buttons', () => {
      render(<JournalEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      expect(screen.getByRole('button', { name: /編輯/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /預覽/i })).toBeInTheDocument()
    })

    it('should render save and cancel buttons', () => {
      render(<JournalEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      expect(screen.getByRole('button', { name: /儲存/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /取消/i })).toBeInTheDocument()
    })
  })

  describe('Character Count', () => {
    it('should display character count (0/10000)', () => {
      render(<JournalEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      expect(screen.getByText(/0\s*\/\s*10,?000/)).toBeInTheDocument()
    })

    it('should update character count as user types', async () => {
      const user = userEvent.setup()
      render(<JournalEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      const textarea = screen.getByPlaceholderText(/寫下你的塔羅感想/i)
      await user.type(textarea, 'Hello')

      expect(screen.getByText(/5\s*\/\s*10,?000/)).toBeInTheDocument()
    })

    it('should show warning when exceeding 10000 characters', async () => {
      const user = userEvent.setup()
      render(<JournalEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      const textarea = screen.getByPlaceholderText(/寫下你的塔羅感想/i)
      const longText = 'A'.repeat(10001)
      await user.type(textarea, longText)

      expect(screen.getByText(/超過字數限制/i)).toBeInTheDocument()
    })
  })

  describe('Mood Tags Selection', () => {
    it('should render 8 mood tag options', () => {
      render(<JournalEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      const moodTags = ['hopeful', 'anxious', 'reflective', 'excited', 'peaceful', 'confused', 'grateful', 'uncertain']

      moodTags.forEach(tag => {
        expect(screen.getByText(new RegExp(tag, 'i'))).toBeInTheDocument()
      })
    })

    it('should allow selecting up to 5 mood tags', async () => {
      const user = userEvent.setup()
      render(<JournalEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      const hopefulBtn = screen.getByRole('button', { name: /hopeful/i })
      const anxiousBtn = screen.getByRole('button', { name: /anxious/i })

      await user.click(hopefulBtn)
      await user.click(anxiousBtn)

      expect(hopefulBtn).toHaveClass('selected')
      expect(anxiousBtn).toHaveClass('selected')
    })

    it('should prevent selecting more than 5 mood tags', async () => {
      const user = userEvent.setup()
      render(<JournalEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      // Select 5 tags
      const tags = screen.getAllByRole('button', { name: /hopeful|anxious|reflective|excited|peaceful/i })
      for (let i = 0; i < 5; i++) {
        await user.click(tags[i])
      }

      // Try to select 6th tag
      const sixthTag = screen.getByRole('button', { name: /grateful/i })
      await user.click(sixthTag)

      expect(screen.getByText(/最多只能選擇 5 個標籤/i)).toBeInTheDocument()
    })
  })

  describe('Edit/Preview Mode', () => {
    it('should switch to preview mode when clicking preview button', async () => {
      const user = userEvent.setup()
      render(<JournalEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      const textarea = screen.getByPlaceholderText(/寫下你的塔羅感想/i)
      await user.type(textarea, '# Test Heading')

      const previewBtn = screen.getByRole('button', { name: /預覽/i })
      await user.click(previewBtn)

      // Textarea should be hidden in preview mode
      expect(textarea).not.toBeVisible()

      // Markdown should be rendered
      expect(screen.getByRole('heading', { name: /test heading/i })).toBeInTheDocument()
    })

    it('should switch back to edit mode when clicking edit button', async () => {
      const user = userEvent.setup()
      render(<JournalEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      const previewBtn = screen.getByRole('button', { name: /預覽/i })
      await user.click(previewBtn)

      const editBtn = screen.getByRole('button', { name: /編輯/i })
      await user.click(editBtn)

      const textarea = screen.getByPlaceholderText(/寫下你的塔羅感想/i)
      expect(textarea).toBeVisible()
    })
  })

  describe('Save and Cancel Actions', () => {
    it('should call onSave with journal data when save button is clicked', async () => {
      const user = userEvent.setup()
      render(<JournalEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      const textarea = screen.getByPlaceholderText(/寫下你的塔羅感想/i)
      await user.type(textarea, 'My journal entry')

      const hopefulBtn = screen.getByRole('button', { name: /hopeful/i })
      await user.click(hopefulBtn)

      const saveBtn = screen.getByRole('button', { name: /儲存/i })
      await user.click(saveBtn)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          content: 'My journal entry',
          mood_tags: ['hopeful'],
          is_private: true,
        })
      })
    })

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<JournalEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      const cancelBtn = screen.getByRole('button', { name: /取消/i })
      await user.click(cancelBtn)

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('should not save when content is empty', async () => {
      const user = userEvent.setup()
      render(<JournalEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      const saveBtn = screen.getByRole('button', { name: /儲存/i })
      await user.click(saveBtn)

      expect(mockOnSave).not.toHaveBeenCalled()
      expect(screen.getByText(/請輸入日記內容/i)).toBeInTheDocument()
    })
  })

  describe('Initial Values', () => {
    it('should populate form with initial values when provided', () => {
      const initialData = {
        content: '# Existing Journal',
        mood_tags: ['hopeful', 'peaceful'],
        is_private: false,
      }

      render(
        <JournalEditor
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          initialData={initialData}
        />
      )

      const textarea = screen.getByPlaceholderText(/寫下你的塔羅感想/i) as HTMLTextAreaElement
      expect(textarea.value).toBe('# Existing Journal')

      const hopefulBtn = screen.getByRole('button', { name: /hopeful/i })
      const peacefulBtn = screen.getByRole('button', { name: /peaceful/i })
      expect(hopefulBtn).toHaveClass('selected')
      expect(peacefulBtn).toHaveClass('selected')
    })
  })

  describe('Privacy Toggle', () => {
    it('should render privacy toggle switch', () => {
      render(<JournalEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      expect(screen.getByRole('switch', { name: /私密日記/i })).toBeInTheDocument()
    })

    it('should toggle privacy setting', async () => {
      const user = userEvent.setup()
      render(<JournalEditor onSave={mockOnSave} onCancel={mockOnCancel} />)

      const privacySwitch = screen.getByRole('switch', { name: /私密日記/i })
      expect(privacySwitch).toBeChecked() // Default is private

      await user.click(privacySwitch)
      expect(privacySwitch).not.toBeChecked()
    })
  })
})
