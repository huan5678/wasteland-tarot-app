/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SearchInput } from '../SearchInput';

describe('SearchInput', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runAllTimers();
    });
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render search input with placeholder', () => {
      render(<SearchInput onSearch={jest.fn()} />);

      const input = screen.getByPlaceholderText(/搜尋解讀記錄/i);
      expect(input).toBeInTheDocument();
    });

    it('should render search icon', () => {
      render(<SearchInput onSearch={jest.fn()} />);

      const searchIcon = screen.getByLabelText(/搜尋/i);
      expect(searchIcon).toBeInTheDocument();
    });

    it('should render clear button when input has value', async () => {
      const user = userEvent.setup({ delay: null });
      render(<SearchInput onSearch={jest.fn()} />);

      const input = screen.getByPlaceholderText(/搜尋解讀記錄/i);
      await user.type(input, 'test query');

      const clearButton = screen.getByLabelText(/清除搜尋/i);
      expect(clearButton).toBeInTheDocument();
    });

    it('should not render clear button when input is empty', () => {
      render(<SearchInput onSearch={jest.fn()} />);

      const clearButton = screen.queryByLabelText(/清除搜尋/i);
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe('Debounce Functionality', () => {
    it('should debounce search callback with 300ms delay', async () => {
      const onSearch = jest.fn();
      const user = userEvent.setup({ delay: null });

      render(<SearchInput onSearch={onSearch} debounceMs={300} />);

      const input = screen.getByPlaceholderText(/搜尋解讀記錄/i);
      await user.type(input, 'test');

      // Should not call immediately
      expect(onSearch).not.toHaveBeenCalled();

      // Fast-forward 299ms - should still not call
      act(() => {
        jest.advanceTimersByTime(299);
      });
      expect(onSearch).not.toHaveBeenCalled();

      // Fast-forward 1ms more (total 300ms) - should call now
      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenCalledWith('test');
    });

    it('should reset debounce timer on each keystroke', async () => {
      const onSearch = jest.fn();
      const user = userEvent.setup({ delay: null });

      render(<SearchInput onSearch={onSearch} debounceMs={300} />);

      const input = screen.getByPlaceholderText(/搜尋解讀記錄/i);

      // Type 't'
      await user.type(input, 't');
      jest.advanceTimersByTime(200);

      // Type 'e' (resets timer)
      await user.type(input, 'e');
      jest.advanceTimersByTime(200);

      // Type 's' (resets timer)
      await user.type(input, 's');
      jest.advanceTimersByTime(200);

      // Type 't' (resets timer)
      await user.type(input, 't');

      // Should not have called yet
      expect(onSearch).not.toHaveBeenCalled();

      // Now wait full 300ms
      jest.advanceTimersByTime(300);

      // Should call only once with final value
      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenCalledWith('test');
    });

    it('should use default 300ms debounce if not specified', async () => {
      const onSearch = jest.fn();
      const user = userEvent.setup({ delay: null });

      render(<SearchInput onSearch={onSearch} />);

      const input = screen.getByPlaceholderText(/搜尋解讀記錄/i);
      await user.type(input, 'test');

      jest.advanceTimersByTime(299);
      expect(onSearch).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(onSearch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Clear Functionality', () => {
    it('should clear input when clear button is clicked', async () => {
      const onSearch = jest.fn();
      const user = userEvent.setup({ delay: null });

      render(<SearchInput onSearch={onSearch} />);

      const input = screen.getByPlaceholderText(/搜尋解讀記錄/i) as HTMLInputElement;
      await user.type(input, 'test query');

      expect(input.value).toBe('test query');

      const clearButton = screen.getByLabelText(/清除搜尋/i);
      await user.click(clearButton);

      expect(input.value).toBe('');
    });

    it('should call onSearch with empty string when cleared', async () => {
      const onSearch = jest.fn();
      const user = userEvent.setup({ delay: null });

      render(<SearchInput onSearch={onSearch} />);

      const input = screen.getByPlaceholderText(/搜尋解讀記錄/i);
      await user.type(input, 'test');

      jest.advanceTimersByTime(300);
      expect(onSearch).toHaveBeenCalledWith('test');

      onSearch.mockClear();

      const clearButton = screen.getByLabelText(/清除搜尋/i);
      await user.click(clearButton);

      // Should call immediately without debounce
      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenCalledWith('');
    });
  });

  describe('Results Count', () => {
    it('should display results count when provided', () => {
      render(<SearchInput onSearch={jest.fn()} resultsCount={42} />);

      expect(screen.getByText(/找到 42 筆記錄/i)).toBeInTheDocument();
    });

    it('should not display results count when not provided', () => {
      render(<SearchInput onSearch={jest.fn()} />);

      expect(screen.queryByText(/找到/i)).not.toBeInTheDocument();
    });

    it('should display zero results count', () => {
      render(<SearchInput onSearch={jest.fn()} resultsCount={0} />);

      expect(screen.getByText(/找到 0 筆記錄/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<SearchInput onSearch={jest.fn()} />);

      const input = screen.getByPlaceholderText(/搜尋解讀記錄/i);
      expect(input).toHaveAttribute('aria-label', '搜尋解讀記錄');
      expect(input).toHaveAttribute('type', 'search');
    });

    it('should announce results count to screen readers', () => {
      render(<SearchInput onSearch={jest.fn()} resultsCount={42} />);

      const resultsAnnouncement = screen.getByRole('status');
      expect(resultsAnnouncement).toHaveTextContent(/找到 42 筆記錄/i);
      expect(resultsAnnouncement).toHaveAttribute('aria-live', 'polite');
    });

    it('should be keyboard accessible', async () => {
      const onSearch = jest.fn();
      const user = userEvent.setup({ delay: null });

      render(<SearchInput onSearch={onSearch} />);

      const input = screen.getByPlaceholderText(/搜尋解讀記錄/i);

      // Tab to input
      await user.tab();
      expect(input).toHaveFocus();

      // Type using keyboard
      await user.keyboard('test');

      jest.advanceTimersByTime(300);
      expect(onSearch).toHaveBeenCalledWith('test');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid typing correctly', async () => {
      const onSearch = jest.fn();
      const user = userEvent.setup({ delay: null });

      render(<SearchInput onSearch={onSearch} debounceMs={300} />);

      const input = screen.getByPlaceholderText(/搜尋解讀記錄/i);

      // Type rapidly
      await user.type(input, 'abcdefghijklmnopqrstuvwxyz');

      // Should not call during typing
      expect(onSearch).not.toHaveBeenCalled();

      // Wait for debounce
      jest.advanceTimersByTime(300);

      // Should call only once with final value
      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenCalledWith('abcdefghijklmnopqrstuvwxyz');
    });

    it('should handle empty string search', async () => {
      const onSearch = jest.fn();
      const user = userEvent.setup({ delay: null });

      render(<SearchInput onSearch={onSearch} />);

      const input = screen.getByPlaceholderText(/搜尋解讀記錄/i);
      await user.type(input, 'test');

      jest.advanceTimersByTime(300);
      onSearch.mockClear();

      // Clear all text
      await user.clear(input);

      jest.advanceTimersByTime(300);
      expect(onSearch).toHaveBeenCalledWith('');
    });

    it('should cleanup debounce timer on unmount', async () => {
      const onSearch = jest.fn();
      const user = userEvent.setup({ delay: null });

      const { unmount } = render(<SearchInput onSearch={onSearch} />);

      const input = screen.getByPlaceholderText(/搜尋解讀記錄/i);
      await user.type(input, 'test');

      // Unmount before debounce completes
      unmount();

      // Should not call after unmount
      jest.advanceTimersByTime(300);
      expect(onSearch).not.toHaveBeenCalled();
    });
  });
});
