import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagManager from '../TagManager';

describe('TagManager', () => {
  const mockOnTagsChange = jest.fn();
  const defaultProps = {
    readingId: 'reading-123',
    currentTags: ['愛情', '事業'],
    onTagsChange: mockOnTagsChange,
  };

  beforeEach(() => {
    mockOnTagsChange.mockClear();
  });

  describe('Display existing tags', () => {
    it('should display all current tags as chips', () => {
      render(<TagManager {...defaultProps} />);

      expect(screen.getByText('愛情')).toBeInTheDocument();
      expect(screen.getByText('事業')).toBeInTheDocument();
    });

    it('should show empty state when no tags exist', () => {
      render(<TagManager {...defaultProps} currentTags={[]} />);

      expect(screen.getByText(/尚無標籤/i)).toBeInTheDocument();
    });
  });

  describe('Add tag functionality', () => {
    it('should add a new tag when user types and presses Enter', async () => {
      const user = userEvent.setup();
      render(<TagManager {...defaultProps} />);

      const input = screen.getByPlaceholderText(/新增標籤/i);
      await user.type(input, '健康{Enter}');

      await waitFor(() => {
        expect(mockOnTagsChange).toHaveBeenCalledWith(['愛情', '事業', '健康']);
      });
    });

    it('should trim whitespace from new tags', async () => {
      const user = userEvent.setup();
      render(<TagManager {...defaultProps} />);

      const input = screen.getByPlaceholderText(/新增標籤/i);
      await user.type(input, '  健康  {Enter}');

      await waitFor(() => {
        expect(mockOnTagsChange).toHaveBeenCalledWith(['愛情', '事業', '健康']);
      });
    });

    it('should clear input after adding tag', async () => {
      const user = userEvent.setup();
      render(<TagManager {...defaultProps} />);

      const input = screen.getByPlaceholderText(/新增標籤/i) as HTMLInputElement;
      await user.type(input, '健康{Enter}');

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });
  });

  describe('Remove tag functionality', () => {
    it('should remove tag when clicking remove button', async () => {
      const user = userEvent.setup();
      render(<TagManager {...defaultProps} />);

      const removeButtons = screen.getAllByLabelText(/移除標籤/i);
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(mockOnTagsChange).toHaveBeenCalledWith(['事業']);
      });
    });
  });

  describe('Tag validation', () => {
    it('should not add empty tags', async () => {
      const user = userEvent.setup();
      render(<TagManager {...defaultProps} />);

      const input = screen.getByPlaceholderText(/新增標籤/i);
      await user.type(input, '{Enter}');

      expect(mockOnTagsChange).not.toHaveBeenCalled();
    });

    it('should not add duplicate tags', async () => {
      const user = userEvent.setup();
      render(<TagManager {...defaultProps} />);

      const input = screen.getByPlaceholderText(/新增標籤/i);
      await user.type(input, '愛情{Enter}');

      expect(mockOnTagsChange).not.toHaveBeenCalled();
      expect(screen.getByText(/標籤已存在/i)).toBeInTheDocument();
    });

    it('should validate tag length (1-50 characters)', async () => {
      const user = userEvent.setup();
      render(<TagManager {...defaultProps} />);

      const input = screen.getByPlaceholderText(/新增標籤/i);
      const longTag = 'a'.repeat(51);
      await user.type(input, `${longTag}{Enter}`);

      expect(mockOnTagsChange).not.toHaveBeenCalled();
      expect(screen.getByText(/標籤長度必須在 1-50 字元之間/i)).toBeInTheDocument();
    });

    it('should show warning when approaching 20 tag limit', () => {
      const manyTags = Array.from({ length: 18 }, (_, i) => `標籤${i + 1}`);
      render(<TagManager {...defaultProps} currentTags={manyTags} />);

      expect(screen.getByText(/還可以新增 2 個標籤/i)).toBeInTheDocument();
    });

    it('should prevent adding tags when limit reached', async () => {
      const user = userEvent.setup();
      const maxTags = Array.from({ length: 20 }, (_, i) => `標籤${i + 1}`);
      render(<TagManager {...defaultProps} currentTags={maxTags} />);

      const input = screen.getByPlaceholderText(/新增標籤/i);
      await user.type(input, '新標籤{Enter}');

      expect(mockOnTagsChange).not.toHaveBeenCalled();
      expect(screen.getByText(/已達到標籤數量上限/i)).toBeInTheDocument();
    });
  });

  describe('Autocomplete suggestions', () => {
    const availableTags = ['健康', '財富', '人際關係', '心靈成長'];

    it('should show autocomplete suggestions when typing', async () => {
      const user = userEvent.setup();
      render(
        <TagManager
          {...defaultProps}
          availableTags={availableTags}
        />
      );

      const input = screen.getByPlaceholderText(/新增標籤/i);
      await user.type(input, '健');

      await waitFor(() => {
        expect(screen.getByText('健康')).toBeInTheDocument();
      });
    });

    it('should filter suggestions based on input', async () => {
      const user = userEvent.setup();
      render(
        <TagManager
          {...defaultProps}
          availableTags={availableTags}
        />
      );

      const input = screen.getByPlaceholderText(/新增標籤/i);
      await user.type(input, '心');

      await waitFor(() => {
        expect(screen.getByText('心靈成長')).toBeInTheDocument();
        expect(screen.queryByText('健康')).not.toBeInTheDocument();
      });
    });

    it('should select suggestion when clicked', async () => {
      const user = userEvent.setup();
      render(
        <TagManager
          {...defaultProps}
          availableTags={availableTags}
        />
      );

      const input = screen.getByPlaceholderText(/新增標籤/i);
      await user.type(input, '健');

      const suggestion = await screen.findByText('健康');
      await user.click(suggestion);

      await waitFor(() => {
        expect(mockOnTagsChange).toHaveBeenCalledWith(['愛情', '事業', '健康']);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<TagManager {...defaultProps} />);

      expect(screen.getByLabelText(/標籤管理/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/新增標籤/i)).toHaveAttribute('aria-label');
    });

    it('should support keyboard navigation for removing tags', async () => {
      const user = userEvent.setup();
      render(<TagManager {...defaultProps} />);

      const removeButtons = screen.getAllByLabelText(/移除標籤/i);
      removeButtons[0].focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockOnTagsChange).toHaveBeenCalledWith(['事業']);
      });
    });
  });

  describe('Error handling', () => {
    it('should show error message when API call fails', async () => {
      const user = userEvent.setup();
      const onTagsChangeError = jest.fn().mockRejectedValue(new Error('API Error'));

      render(
        <TagManager
          {...defaultProps}
          onTagsChange={onTagsChangeError}
        />
      );

      const input = screen.getByPlaceholderText(/新增標籤/i);
      await user.type(input, '健康{Enter}');

      await waitFor(() => {
        expect(screen.getByText(/新增標籤失敗/i)).toBeInTheDocument();
      });
    });
  });
});
