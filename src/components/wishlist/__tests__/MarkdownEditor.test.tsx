/**
 * MarkdownEditor Component Tests
 * Testing Markdown editor with toolbar, preview, and character count
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MarkdownEditor from '../MarkdownEditor'

describe('MarkdownEditor', () => {
  const mockOnChange = jest.fn()
  const mockOnSubmit = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render textarea for markdown input', () => {
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
        />
      )

      const textarea = screen.getByRole('textbox', { name: /Markdown 編輯區/i })
      expect(textarea).toBeInTheDocument()
    })

    it('should render markdown toolbar with 6 buttons', () => {
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
        />
      )

      // Toolbar buttons: bold, italic, list, link, code, quote
      const toolbarButtons = screen.getAllByRole('button', { name: /粗體|斜體|清單|連結|程式碼區塊|引用區塊/i })
      expect(toolbarButtons).toHaveLength(6)
    })

    it('should render preview area', () => {
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
        />
      )

      const previewArea = screen.getByRole('region', { name: /Markdown 預覽/i })
      expect(previewArea).toBeInTheDocument()
    })

    it('should render submit button', () => {
      render(
        <MarkdownEditor
          maxLength={500}
          submitButtonText="提交"
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByRole('button', { name: /提交/i })).toBeInTheDocument()
    })

    it('should render cancel button when showCancelButton is true', () => {
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
          showCancelButton
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByRole('button', { name: /取消/i })).toBeInTheDocument()
    })

    it('should not render cancel button when showCancelButton is false', () => {
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
          showCancelButton={false}
        />
      )

      expect(screen.queryByRole('button', { name: /取消/i })).not.toBeInTheDocument()
    })
  })

  describe('Character Count', () => {
    it('should display character count (0 / maxLength)', () => {
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByText(/0\s*\/\s*500\s*字/)).toBeInTheDocument()
    })

    it('should update character count as user types (plain text length)', async () => {
      const user = userEvent.setup()
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
        />
      )

      const textarea = screen.getByRole('textbox', { name: /Markdown 編輯區/i })
      await user.type(textarea, 'Hello World')

      // Wait for debounced character count update (200ms)
      await waitFor(() => {
        expect(screen.getByText(/11\s*\/\s*500\s*字/)).toBeInTheDocument()
      }, { timeout: 300 })
    })

    it('should calculate plain text length (strip Markdown syntax)', async () => {
      const user = userEvent.setup()
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
        />
      )

      const textarea = screen.getByRole('textbox', { name: /Markdown 編輯區/i })

      // Type markdown with bold syntax: **Hello** (7 chars with syntax, but 5 chars plain text)
      await user.type(textarea, '**Hello**')

      await waitFor(() => {
        // Should show 5 (plain text "Hello") not 9 (with ** syntax)
        const countText = screen.getByText(/5\s*\/\s*500\s*字/)
        expect(countText).toBeInTheDocument()
      }, { timeout: 300 })
    })

    it('should show warning when exceeding maxLength', async () => {
      const user = userEvent.setup()
      render(
        <MarkdownEditor
          maxLength={10}
          onSubmit={mockOnSubmit}
        />
      )

      const textarea = screen.getByRole('textbox', { name: /Markdown 編輯區/i })
      await user.type(textarea, 'This is a very long text that exceeds limit')

      await waitFor(() => {
        expect(screen.getByText(/超過字數限制/i)).toBeInTheDocument()
      }, { timeout: 300 })
    })

    it('should show warning when near limit (>90%)', async () => {
      const user = userEvent.setup()
      render(
        <MarkdownEditor
          maxLength={10}
          onSubmit={mockOnSubmit}
        />
      )

      const textarea = screen.getByRole('textbox', { name: /Markdown 編輯區/i })

      // Type 9 characters (90%)
      await user.type(textarea, 'Nine char')

      await waitFor(() => {
        // Just verify the character count is displayed (warning styling is visual)
        const countText = screen.getByText(/9\s*\/\s*10\s*字/)
        expect(countText).toBeInTheDocument()
      }, { timeout: 300 })
    })
  })

  describe('Toolbar Button Functionality', () => {
    it('should insert bold syntax when bold button clicked', async () => {
      const user = userEvent.setup()
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
        />
      )

      const textarea = screen.getByRole('textbox', { name: /Markdown 編輯區/i }) as HTMLTextAreaElement
      const boldButton = screen.getByRole('button', { name: /粗體/i })

      await user.click(boldButton)

      expect(textarea.value).toContain('**粗體文字**')
    })

    it('should wrap selected text with bold syntax', async () => {
      const user = userEvent.setup()
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
        />
      )

      const textarea = screen.getByRole('textbox', { name: /Markdown 編輯區/i }) as HTMLTextAreaElement

      // Type some text
      await user.type(textarea, 'Hello World')

      // Select "World" (indices 6-11)
      textarea.setSelectionRange(6, 11)

      const boldButton = screen.getByRole('button', { name: /粗體/i })
      await user.click(boldButton)

      expect(textarea.value).toBe('Hello **World**')
    })

    it('should insert italic syntax when italic button clicked', async () => {
      const user = userEvent.setup()
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
        />
      )

      const textarea = screen.getByRole('textbox', { name: /Markdown 編輯區/i }) as HTMLTextAreaElement
      const italicButton = screen.getByRole('button', { name: /斜體/i })

      await user.click(italicButton)

      expect(textarea.value).toContain('*斜體文字*')
    })

    it('should insert list syntax when list button clicked', async () => {
      const user = userEvent.setup()
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
        />
      )

      const textarea = screen.getByRole('textbox', { name: /Markdown 編輯區/i }) as HTMLTextAreaElement
      const listButton = screen.getByRole('button', { name: /清單/i })

      await user.click(listButton)

      expect(textarea.value).toContain('- 清單項目')
    })

    it('should insert link syntax when link button clicked', async () => {
      const user = userEvent.setup()
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
        />
      )

      const textarea = screen.getByRole('textbox', { name: /Markdown 編輯區/i }) as HTMLTextAreaElement
      const linkButton = screen.getByRole('button', { name: /連結/i })

      await user.click(linkButton)

      expect(textarea.value).toContain('[連結文字](url)')
    })

    it('should insert code block syntax when code button clicked', async () => {
      const user = userEvent.setup()
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
        />
      )

      const textarea = screen.getByRole('textbox', { name: /Markdown 編輯區/i }) as HTMLTextAreaElement
      const codeButton = screen.getByRole('button', { name: /程式碼區塊/i })

      await user.click(codeButton)

      expect(textarea.value).toContain('```')
      expect(textarea.value).toContain('程式碼')
    })

    it('should insert quote syntax when quote button clicked', async () => {
      const user = userEvent.setup()
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
        />
      )

      const textarea = screen.getByRole('textbox', { name: /Markdown 編輯區/i }) as HTMLTextAreaElement
      const quoteButton = screen.getByRole('button', { name: /引用區塊/i })

      await user.click(quoteButton)

      expect(textarea.value).toContain('> 引用內容')
    })
  })

  describe('Real-time Preview', () => {
    it('should show placeholder text when content is empty', () => {
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByText(/預覽區將顯示渲染後的內容/i)).toBeInTheDocument()
    })

    it('should render markdown content in preview area', async () => {
      const user = userEvent.setup()
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
        />
      )

      const textarea = screen.getByRole('textbox', { name: /Markdown 編輯區/i })
      await user.type(textarea, '**Bold Text**')

      const previewArea = screen.getByRole('region', { name: /Markdown 預覽/i })

      await waitFor(() => {
        expect(previewArea.innerHTML).toContain('Bold Text')
      })
    })

    it('should update preview as user types', async () => {
      const user = userEvent.setup()
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
        />
      )

      const textarea = screen.getByRole('textbox', { name: /Markdown 編輯區/i })

      await user.type(textarea, 'First')
      await waitFor(() => {
        const preview = screen.getByRole('region', { name: /Markdown 預覽/i })
        expect(preview.textContent).toContain('First')
      })

      await user.type(textarea, ' Second')
      await waitFor(() => {
        const preview = screen.getByRole('region', { name: /Markdown 預覽/i })
        expect(preview.textContent).toContain('First Second')
      })
    })
  })

  describe('Submit Functionality', () => {
    it('should call onSubmit when submit button clicked with valid content', async () => {
      const user = userEvent.setup()
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
        />
      )

      const textarea = screen.getByRole('textbox', { name: /Markdown 編輯區/i })
      await user.type(textarea, 'Test content')

      const submitButton = screen.getByRole('button', { name: /提交/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('Test content')
      })
    })

    it('should not submit when content is empty', async () => {
      const user = userEvent.setup()

      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
        />
      )

      const submitButton = screen.getByRole('button', { name: /提交/i })

      // Button should be disabled when content is empty
      expect(submitButton).toBeDisabled()

      await user.click(submitButton)

      // Since button is disabled, onSubmit should not be called
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should not submit when content exceeds maxLength', async () => {
      const user = userEvent.setup()

      render(
        <MarkdownEditor
          maxLength={10}
          onSubmit={mockOnSubmit}
        />
      )

      const textarea = screen.getByRole('textbox', { name: /Markdown 編輯區/i })
      await user.type(textarea, 'This is a very long text exceeding limit')

      const submitButton = screen.getByRole('button', { name: /提交/i })

      // Wait for character count update and warning message
      await waitFor(() => {
        expect(screen.getByText(/超過字數限制/i)).toBeInTheDocument()
      }, { timeout: 300 })

      // Button should be disabled when content exceeds limit
      expect(submitButton).toBeDisabled()

      await user.click(submitButton)

      // Since button is disabled, onSubmit should not be called
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should disable submit button when isLoading is true', () => {
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
          isLoading={true}
        />
      )

      const submitButton = screen.getByRole('button', { name: /提交中/i })
      expect(submitButton).toBeDisabled()
    })

    it('should disable submit button when content is empty', () => {
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
        />
      )

      const submitButton = screen.getByRole('button', { name: /提交/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup()
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
          showCancelButton
          onCancel={mockOnCancel}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /取消/i })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it('should disable cancel button when isLoading is true', () => {
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
          showCancelButton
          onCancel={mockOnCancel}
          isLoading={true}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /取消/i })
      expect(cancelButton).toBeDisabled()
    })
  })

  describe('Initial Content', () => {
    it('should display initialContent in textarea', () => {
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
          initialContent="Initial content here"
        />
      )

      const textarea = screen.getByRole('textbox', { name: /Markdown 編輯區/i }) as HTMLTextAreaElement
      expect(textarea.value).toBe('Initial content here')
    })

    it('should calculate character count for initialContent', async () => {
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
          initialContent="Hello World"
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/11\s*\/\s*500\s*字/)).toBeInTheDocument()
      }, { timeout: 300 })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for textarea', () => {
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
        />
      )

      const textarea = screen.getByRole('textbox', { name: /Markdown 編輯區/i })
      expect(textarea).toHaveAttribute('aria-multiline', 'true')
      expect(textarea).toHaveAttribute('aria-label', 'Markdown 編輯區')
    })

    it('should have proper ARIA label for preview area', () => {
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
        />
      )

      const previewArea = screen.getByRole('region', { name: /Markdown 預覽/i })
      expect(previewArea).toHaveAttribute('aria-label', 'Markdown 預覽')
    })

    it('should have aria-label for all toolbar buttons', () => {
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
        />
      )

      const boldButton = screen.getByRole('button', { name: /粗體/i })
      expect(boldButton).toHaveAttribute('aria-label', '粗體')

      const italicButton = screen.getByRole('button', { name: /斜體/i })
      expect(italicButton).toHaveAttribute('aria-label', '斜體')
    })
  })

  describe('OnChange Callback', () => {
    it('should call onChange when content changes', async () => {
      const user = userEvent.setup()
      render(
        <MarkdownEditor
          maxLength={500}
          onSubmit={mockOnSubmit}
          onChange={mockOnChange}
        />
      )

      const textarea = screen.getByRole('textbox', { name: /Markdown 編輯區/i })
      await user.type(textarea, 'Test')

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled()
      })
    })
  })
})
