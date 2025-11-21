/**
 * Integration tests for FilterChips component
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { FilterChips } from '../FilterChips';

describe('FilterChips Integration Tests', () => {
  const mockFilters = {
    tags: ['愛情', '事業', '健康'],
    categories: ['Love', 'Career'],
    dateRange: {
      start: new Date('2025-01-01'),
      end: new Date('2025-01-31'),
    },
    favoriteOnly: true,
  };

  describe('Rendering', () => {
    it('should render all filter chips', () => {
      render(<FilterChips filters={mockFilters} onRemove={jest.fn()} onClearAll={jest.fn()} />);

      // Tags
      expect(screen.getByText('愛情')).toBeInTheDocument();
      expect(screen.getByText('事業')).toBeInTheDocument();
      expect(screen.getByText('健康')).toBeInTheDocument();

      // Categories
      expect(screen.getByText('Love')).toBeInTheDocument();
      expect(screen.getByText('Career')).toBeInTheDocument();

      // Date range
      expect(screen.getByText(/2025\/01\/01 - 2025\/01\/31/i)).toBeInTheDocument();

      // Favorite only
      expect(screen.getByText(/只顯示收藏/i)).toBeInTheDocument();
    });

    it('should render clear all button when filters exist', () => {
      render(<FilterChips filters={mockFilters} onRemove={jest.fn()} onClearAll={jest.fn()} />);

      const clearButton = screen.getByText(/清除全部/i);
      expect(clearButton).toBeInTheDocument();
    });

    it('should not render when no filters active', () => {
      const { container } = render(
        <FilterChips filters={{}} onRemove={jest.fn()} onClearAll={jest.fn()} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render individual chip types correctly', () => {
      const tagFilter = { tags: ['愛情'] };
      render(<FilterChips filters={tagFilter} onRemove={jest.fn()} onClearAll={jest.fn()} />);

      const chip = screen.getByText('愛情').closest('[role="button"]');
      expect(chip).toHaveClass('filter-chip');
    });
  });

  describe('Remove Functionality', () => {
    it('should call onRemove when tag chip remove button clicked', async () => {
      const onRemove = jest.fn();
      const user = userEvent.setup();

      render(<FilterChips filters={mockFilters} onRemove={onRemove} onClearAll={jest.fn()} />);

      const removeButtons = screen.getAllByLabelText(/移除篩選/i);
      await user.click(removeButtons[0]); // First tag

      expect(onRemove).toHaveBeenCalledWith('tags', '愛情');
    });

    it('should call onRemove when category chip clicked', async () => {
      const onRemove = jest.fn();
      const user = userEvent.setup();

      render(<FilterChips filters={mockFilters} onRemove={onRemove} onClearAll={jest.fn()} />);

      const loveChip = screen.getByText('Love').closest('[role="button"]');
      const removeButton = loveChip?.querySelector('[aria-label*="移除"]');

      if (removeButton) {
        await user.click(removeButton);
        expect(onRemove).toHaveBeenCalledWith('categories', 'Love');
      }
    });

    it('should call onRemove when date range chip clicked', async () => {
      const onRemove = jest.fn();
      const user = userEvent.setup();

      render(<FilterChips filters={mockFilters} onRemove={onRemove} onClearAll={jest.fn()} />);

      const dateChip = screen.getByText(/2025\/01\/01 - 2025\/01\/31/i).closest('[role="button"]');
      const removeButton = dateChip?.querySelector('[aria-label*="移除"]');

      if (removeButton) {
        await user.click(removeButton);
        expect(onRemove).toHaveBeenCalledWith('dateRange', null);
      }
    });

    it('should call onRemove when favorite only chip clicked', async () => {
      const onRemove = jest.fn();
      const user = userEvent.setup();

      render(<FilterChips filters={mockFilters} onRemove={onRemove} onClearAll={jest.fn()} />);

      const favoriteChip = screen.getByText(/只顯示收藏/i).closest('[role="button"]');
      const removeButton = favoriteChip?.querySelector('[aria-label*="移除"]');

      if (removeButton) {
        await user.click(removeButton);
        expect(onRemove).toHaveBeenCalledWith('favoriteOnly', false);
      }
    });
  });

  describe('Clear All Functionality', () => {
    it('should call onClearAll when clear all button clicked', async () => {
      const onClearAll = jest.fn();
      const user = userEvent.setup();

      render(<FilterChips filters={mockFilters} onRemove={jest.fn()} onClearAll={onClearAll} />);

      const clearButton = screen.getByText(/清除全部/i);
      await user.click(clearButton);

      expect(onClearAll).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for chips', () => {
      render(<FilterChips filters={{ tags: ['愛情'] }} onRemove={jest.fn()} onClearAll={jest.fn()} />);

      const chip = screen.getByText('愛情').closest('[role="button"]');
      expect(chip).toHaveAttribute('aria-label', expect.stringContaining('移除篩選'));
    });

    it('should be keyboard accessible', async () => {
      const onRemove = jest.fn();
      const user = userEvent.setup();

      render(<FilterChips filters={{ tags: ['愛情'] }} onRemove={onRemove} onClearAll={jest.fn()} />);

      const removeButton = screen.getByLabelText(/移除篩選/i);

      // Focus and press Enter
      removeButton.focus();
      await user.keyboard('{Enter}');

      expect(onRemove).toHaveBeenCalled();
    });
  });

  describe('Visual States', () => {
    it('should apply correct styles to different chip types', () => {
      const filters = {
        tags: ['愛情'],
        categories: ['Love'],
      };

      render(<FilterChips filters={filters} onRemove={jest.fn()} onClearAll={jest.fn()} />);

      const tagChip = screen.getByText('愛情').closest('.filter-chip');
      const categoryChip = screen.getByText('Love').closest('.filter-chip');

      expect(tagChip).toBeInTheDocument();
      expect(categoryChip).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tag array', () => {
      render(<FilterChips filters={{ tags: [] }} onRemove={jest.fn()} onClearAll={jest.fn()} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should handle undefined filters gracefully', () => {
      const { container } = render(
        <FilterChips filters={undefined as any} onRemove={jest.fn()} onClearAll={jest.fn()} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should handle very long tag names', () => {
      const longTag = '這是一個非常非常非常非常長的標籤名稱用來測試界面是否能正確處理';
      render(<FilterChips filters={{ tags: [longTag] }} onRemove={jest.fn()} onClearAll={jest.fn()} />);

      expect(screen.getByText(longTag)).toBeInTheDocument();
    });
  });
});
