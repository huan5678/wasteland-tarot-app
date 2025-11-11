/**
 * Integration tests for FilterPanel component
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { FilterPanel } from '../FilterPanel';

describe('FilterPanel Integration Tests', () => {
  const mockAvailableTags = [
    { name: '愛情', count: 12 },
    { name: '事業', count: 8 },
    { name: '健康', count: 5 },
  ];

  const mockAvailableCategories = [
    { id: 'love', name: 'Love', count: 15 },
    { id: 'career', name: 'Career', count: 10 },
    { id: 'health', name: 'Health', count: 7 },
  ];

  const mockFilters = {
    tags: [],
    categories: [],
    favoriteOnly: false,
  };

  describe('Rendering', () => {
    it('should render filter panel with sections', () => {
      render(
        <FilterPanel
          availableTags={mockAvailableTags}
          availableCategories={mockAvailableCategories}
          filters={mockFilters}
          onChange={jest.fn()}
        />
      );

      expect(screen.getByText('篩選條件')).toBeInTheDocument();
      expect(screen.getByText('標籤')).toBeInTheDocument();
      expect(screen.getByText('分類')).toBeInTheDocument();
    });

    it('should display tags with counts', () => {
      render(
        <FilterPanel
          availableTags={mockAvailableTags}
          availableCategories={mockAvailableCategories}
          filters={mockFilters}
          onChange={jest.fn()}
        />
      );

      expect(screen.getByText('愛情 (12)')).toBeInTheDocument();
      expect(screen.getByText('事業 (8)')).toBeInTheDocument();
      expect(screen.getByText('健康 (5)')).toBeInTheDocument();
    });

    it('should display categories with counts', () => {
      render(
        <FilterPanel
          availableTags={mockAvailableTags}
          availableCategories={mockAvailableCategories}
          filters={mockFilters}
          onChange={jest.fn()}
        />
      );

      expect(screen.getByText('Love (15)')).toBeInTheDocument();
      expect(screen.getByText('Career (10)')).toBeInTheDocument();
      expect(screen.getByText('Health (7)')).toBeInTheDocument();
    });

    it('should show zero count items with warning', () => {
      const zeroCountTags = [{ name: '測試', count: 0 }];

      render(
        <FilterPanel
          availableTags={zeroCountTags}
          availableCategories={[]}
          filters={mockFilters}
          onChange={jest.fn()}
        />
      );

      const zeroItem = screen.getByText('測試 (0)');
      expect(zeroItem).toBeInTheDocument();
      expect(zeroItem.closest('button')).toHaveClass('text-muted');
    });
  });

  describe('Tag Selection', () => {
    it('should call onChange when tag is selected', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();

      render(
        <FilterPanel
          availableTags={mockAvailableTags}
          availableCategories={mockAvailableCategories}
          filters={mockFilters}
          onChange={onChange}
        />
      );

      const loveTag = screen.getByText('愛情 (12)');
      await user.click(loveTag);

      expect(onChange).toHaveBeenCalledWith({
        ...mockFilters,
        tags: ['愛情'],
      });
    });

    it('should show selected state for active tags', () => {
      const activeFilters = { ...mockFilters, tags: ['愛情'] };

      render(
        <FilterPanel
          availableTags={mockAvailableTags}
          availableCategories={mockAvailableCategories}
          filters={activeFilters}
          onChange={jest.fn()}
        />
      );

      const loveTag = screen.getByText('愛情 (12)').closest('button');
      expect(loveTag).toHaveClass('bg-pip-boy-green/20');
    });

    it('should allow multiple tag selection', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();

      render(
        <FilterPanel
          availableTags={mockAvailableTags}
          availableCategories={mockAvailableCategories}
          filters={mockFilters}
          onChange={onChange}
        />
      );

      const loveTag = screen.getByText('愛情 (12)');
      const careerTag = screen.getByText('事業 (8)');

      await user.click(loveTag);
      expect(onChange).toHaveBeenCalledWith({
        ...mockFilters,
        tags: ['愛情'],
      });

      onChange.mockClear();

      // Click second tag
      await user.click(careerTag);
      expect(onChange).toHaveBeenCalledWith({
        ...mockFilters,
        tags: ['愛情', '事業'],
      });
    });

    it('should deselect tag when clicked again', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();
      const activeFilters = { ...mockFilters, tags: ['愛情'] };

      render(
        <FilterPanel
          availableTags={mockAvailableTags}
          availableCategories={mockAvailableCategories}
          filters={activeFilters}
          onChange={onChange}
        />
      );

      const loveTag = screen.getByText('愛情 (12)');
      await user.click(loveTag);

      expect(onChange).toHaveBeenCalledWith({
        ...mockFilters,
        tags: [],
      });
    });
  });

  describe('Category Selection', () => {
    it('should call onChange when category is selected', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();

      render(
        <FilterPanel
          availableTags={mockAvailableTags}
          availableCategories={mockAvailableCategories}
          filters={mockFilters}
          onChange={onChange}
        />
      );

      const loveCategory = screen.getByText('Love (15)');
      await user.click(loveCategory);

      expect(onChange).toHaveBeenCalledWith({
        ...mockFilters,
        categories: ['love'],
      });
    });

    it('should show selected state for active categories', () => {
      const activeFilters = { ...mockFilters, categories: ['love'] };

      render(
        <FilterPanel
          availableTags={mockAvailableTags}
          availableCategories={mockAvailableCategories}
          filters={activeFilters}
          onChange={jest.fn()}
        />
      );

      const loveCategory = screen.getByText('Love (15)').closest('button');
      expect(loveCategory).toHaveClass('bg-radiation-orange/20');
    });
  });

  describe('Toggle Filters', () => {
    it('should render favorite only toggle', () => {
      render(
        <FilterPanel
          availableTags={mockAvailableTags}
          availableCategories={mockAvailableCategories}
          filters={mockFilters}
          onChange={jest.fn()}
        />
      );

      expect(screen.getByText('只顯示收藏')).toBeInTheDocument();
    });

    it('should call onChange when favorite toggle clicked', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();

      render(
        <FilterPanel
          availableTags={mockAvailableTags}
          availableCategories={mockAvailableCategories}
          filters={mockFilters}
          onChange={onChange}
        />
      );

      const favoriteToggle = screen.getByText('只顯示收藏');
      await user.click(favoriteToggle);

      expect(onChange).toHaveBeenCalledWith({
        ...mockFilters,
        favoriteOnly: true,
      });
    });

    it('should show active state for favorite toggle', () => {
      const activeFilters = { ...mockFilters, favoriteOnly: true };

      render(
        <FilterPanel
          availableTags={mockAvailableTags}
          availableCategories={mockAvailableCategories}
          filters={activeFilters}
          onChange={jest.fn()}
        />
      );

      const favoriteToggle = screen.getByText('只顯示收藏').closest('button');
      expect(favoriteToggle).toHaveClass('bg-warning-yellow/20');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <FilterPanel
          availableTags={mockAvailableTags}
          availableCategories={mockAvailableCategories}
          filters={mockFilters}
          onChange={jest.fn()}
        />
      );

      const tagSection = screen.getByLabelText('標籤篩選');
      const categorySection = screen.getByLabelText('分類篩選');

      expect(tagSection).toBeInTheDocument();
      expect(categorySection).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();

      render(
        <FilterPanel
          availableTags={mockAvailableTags}
          availableCategories={mockAvailableCategories}
          filters={mockFilters}
          onChange={onChange}
        />
      );

      const loveTag = screen.getByText('愛情 (12)');

      // Tab to tag and press Enter
      loveTag.focus();
      await user.keyboard('{Enter}');

      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tags array', () => {
      render(
        <FilterPanel
          availableTags={[]}
          availableCategories={mockAvailableCategories}
          filters={mockFilters}
          onChange={jest.fn()}
        />
      );

      expect(screen.getByText('標籤')).toBeInTheDocument();
      expect(screen.getByText('暫無可用標籤')).toBeInTheDocument();
    });

    it('should handle empty categories array', () => {
      render(
        <FilterPanel
          availableTags={mockAvailableTags}
          availableCategories={[]}
          filters={mockFilters}
          onChange={jest.fn()}
        />
      );

      expect(screen.getByText('分類')).toBeInTheDocument();
      expect(screen.getByText('暫無可用分類')).toBeInTheDocument();
    });

    it('should handle undefined filters gracefully', () => {
      render(
        <FilterPanel
          availableTags={mockAvailableTags}
          availableCategories={mockAvailableCategories}
          filters={undefined as any}
          onChange={jest.fn()}
        />
      );

      // Should render without crashing
      expect(screen.getByText('篩選條件')).toBeInTheDocument();
    });
  });
});
