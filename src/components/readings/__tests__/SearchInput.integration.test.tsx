/**
 * Integration tests for SearchInput component
 * Using real timers for better reliability
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SearchInput } from '../SearchInput';

describe('SearchInput Integration Tests', () => {
  describe('Rendering', () => {
    it('should render search input with placeholder', () => {
      render(<SearchInput onSearch={jest.fn()} />);

      const input = screen.getByPlaceholderText(/搜尋解讀記錄/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'search');
    });

    it('should render search icon', () => {
      render(<SearchInput onSearch={jest.fn()} />);

      const searchIcon = screen.getByLabelText(/搜尋/i);
      expect(searchIcon).toBeInTheDocument();
    });

    it('should render clear button when input has value', async () => {
      const user = userEvent.setup();
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
    it('should debounce search callback', async () => {
      const onSearch = jest.fn();
      const user = userEvent.setup();

      render(<SearchInput onSearch={onSearch} debounceMs={300} />);

      const input = screen.getByPlaceholderText(/搜尋解讀記錄/i);
      await user.type(input, 'test');

      // Should not call immediately after typing
      expect(onSearch).not.toHaveBeenCalled();

      // Wait for debounce to complete
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('test');
      }, { timeout: 500 });

      expect(onSearch).toHaveBeenCalledTimes(1);
    });

    it('should only trigger onSearch once after rapid typing', async () => {
      const onSearch = jest.fn();
      const user = userEvent.setup();

      render(<SearchInput onSearch={onSearch} debounceMs={200} />);

      const input = screen.getByPlaceholderText(/搜尋解讀記錄/i);

      // Type rapidly
      await user.type(input, 'hello');

      // Wait for debounce
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalled();
      }, { timeout: 400 });

      // Should only call once with final value
      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenCalledWith('hello');
    });
  });

  describe('Clear Functionality', () => {
    it('should clear input when clear button is clicked', async () => {
      const onSearch = jest.fn();
      const user = userEvent.setup();

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
      const user = userEvent.setup();

      render(<SearchInput onSearch={onSearch} />);

      const input = screen.getByPlaceholderText(/搜尋解讀記錄/i);
      await user.type(input, 'test');

      // Wait for debounced call
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('test');
      });

      onSearch.mockClear();

      const clearButton = screen.getByLabelText(/清除搜尋/i);
      await user.click(clearButton);

      // Should call with empty string
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
      const user = userEvent.setup();

      render(<SearchInput onSearch={onSearch} />);

      const input = screen.getByPlaceholderText(/搜尋解讀記錄/i);

      // Tab to input
      await user.tab();
      expect(input).toHaveFocus();

      // Type using keyboard
      await user.keyboard('test');

      // Wait for debounced call
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('test');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string search', async () => {
      const onSearch = jest.fn();
      const user = userEvent.setup();

      render(<SearchInput onSearch={onSearch} />);

      const input = screen.getByPlaceholderText(/搜尋解讀記錄/i);
      await user.type(input, 'test');

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('test');
      });

      onSearch.mockClear();

      // Clear all text
      await user.clear(input);

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('');
      });
    });

    it('should handle special characters in search query', async () => {
      const onSearch = jest.fn();
      const user = userEvent.setup();

      render(<SearchInput onSearch={jest.fn()} debounceMs={200} />);

      const input = screen.getByPlaceholderText(/搜尋解讀記錄/i);
      await user.type(input, '塔羅牌!@#$%');

      const value = (input as HTMLInputElement).value;
      expect(value).toBe('塔羅牌!@#$%');
    });
  });
});
