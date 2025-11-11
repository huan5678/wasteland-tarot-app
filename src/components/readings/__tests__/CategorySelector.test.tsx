import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategorySelector from '../CategorySelector';

describe('CategorySelector', () => {
  const mockOnCategoryChange = jest.fn();
  const defaultCategories = [
    { id: 'cat-1', name: 'Love', color: '#ff69b4', description: '愛情與關係' },
    { id: 'cat-2', name: 'Career', color: '#4169e1', description: '事業與工作' },
    { id: 'cat-3', name: 'Health', color: '#32cd32', description: '健康與身心' },
    { id: 'cat-4', name: 'Survival', color: '#ff8c00', description: '生存與挑戰' },
    { id: 'cat-5', name: 'Faction Relations', color: '#9370db', description: '派系關係' },
  ];

  const defaultProps = {
    currentCategoryId: 'cat-1',
    categories: defaultCategories,
    onCategoryChange: mockOnCategoryChange,
  };

  beforeEach(() => {
    mockOnCategoryChange.mockClear();
  });

  describe('Display categories', () => {
    it('should display all available categories in dropdown', async () => {
      const user = userEvent.setup();
      render(<CategorySelector {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Love')).toBeInTheDocument();
        expect(screen.getByText('Career')).toBeInTheDocument();
        expect(screen.getByText('Health')).toBeInTheDocument();
      });
    });

    it('should show current category as selected', () => {
      render(<CategorySelector {...defaultProps} />);

      expect(screen.getByText('Love')).toBeInTheDocument();
    });

    it('should show placeholder when no category selected', () => {
      render(
        <CategorySelector
          {...defaultProps}
          currentCategoryId={undefined}
        />
      );

      expect(screen.getByText(/選擇類別/i)).toBeInTheDocument();
    });
  });

  describe('Change category', () => {
    it('should call onCategoryChange when selecting a category', async () => {
      const user = userEvent.setup();
      render(<CategorySelector {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const careerOption = await screen.findByText('Career');
      await user.click(careerOption);

      await waitFor(() => {
        expect(mockOnCategoryChange).toHaveBeenCalledWith('cat-2');
      });
    });

    it('should update display after category change', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<CategorySelector {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const careerOption = await screen.findByText('Career');
      await user.click(careerOption);

      rerender(
        <CategorySelector
          {...defaultProps}
          currentCategoryId="cat-2"
        />
      );

      expect(screen.getByText('Career')).toBeInTheDocument();
    });
  });

  describe('Category badge display', () => {
    it('should display category badge with color', () => {
      render(<CategorySelector {...defaultProps} />);

      const badge = screen.getByTestId('category-badge');
      expect(badge).toHaveStyle({ backgroundColor: '#ff69b4' });
    });

    it('should show category description on hover', async () => {
      const user = userEvent.setup();
      render(<CategorySelector {...defaultProps} />);

      const badge = screen.getByTestId('category-badge');
      await user.hover(badge);

      await waitFor(() => {
        expect(screen.getByText('愛情與關係')).toBeInTheDocument();
      });
    });
  });

  describe('Custom category creation', () => {
    it('should show custom category creation button', async () => {
      const user = userEvent.setup();
      render(<CategorySelector {...defaultProps} allowCustom />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText(/建立自訂類別/i)).toBeInTheDocument();
      });
    });

    it('should open create dialog when clicking custom button', async () => {
      const user = userEvent.setup();
      render(<CategorySelector {...defaultProps} allowCustom />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const createButton = await screen.findByText(/建立自訂類別/i);
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/新增類別/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/類別名稱/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/類別顏色/i)).toBeInTheDocument();
      });
    });

    it('should create custom category with valid input', async () => {
      const user = userEvent.setup();
      const onCustomCreate = jest.fn().mockResolvedValue({ id: 'cat-new', name: '自訂類別', color: '#ff0000' });

      render(
        <CategorySelector
          {...defaultProps}
          allowCustom
          onCustomCreate={onCustomCreate}
        />
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const createButton = await screen.findByText(/建立自訂類別/i);
      await user.click(createButton);

      const nameInput = screen.getByLabelText(/類別名稱/i);
      await user.type(nameInput, '自訂類別');

      const colorInput = screen.getByLabelText(/類別顏色/i);
      await user.clear(colorInput);
      await user.type(colorInput, '#ff0000');

      const submitButton = screen.getByText(/確認/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(onCustomCreate).toHaveBeenCalledWith({
          name: '自訂類別',
          color: '#ff0000',
          description: '',
        });
      });
    });

    it('should validate custom category name length', async () => {
      const user = userEvent.setup();
      render(<CategorySelector {...defaultProps} allowCustom />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const createButton = await screen.findByText(/建立自訂類別/i);
      await user.click(createButton);

      const nameInput = screen.getByLabelText(/類別名稱/i);
      const longName = 'a'.repeat(51);
      await user.type(nameInput, longName);

      const submitButton = screen.getByText(/確認/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/名稱長度不可超過 50 字元/i)).toBeInTheDocument();
      });
    });
  });

  describe('Category statistics', () => {
    it('should show category statistics when provided', () => {
      const categoriesWithStats = defaultCategories.map(cat => ({
        ...cat,
        totalReadings: 10,
        averageKarma: 5.5,
      }));

      render(
        <CategorySelector
          {...defaultProps}
          categories={categoriesWithStats}
          showStats
        />
      );

      expect(screen.getByText(/10 次解讀/i)).toBeInTheDocument();
      expect(screen.getByText(/平均 Karma: 5.5/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<CategorySelector {...defaultProps} />);

      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveAttribute('aria-label');
      expect(combobox).toHaveAttribute('aria-expanded');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<CategorySelector {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      trigger.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Career')).toBeInTheDocument();
      });

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockOnCategoryChange).toHaveBeenCalled();
      });
    });
  });

  describe('Error handling', () => {
    it('should show error when category change fails', async () => {
      const user = userEvent.setup();
      const onCategoryChangeError = jest.fn().mockRejectedValue(new Error('API Error'));

      render(
        <CategorySelector
          {...defaultProps}
          onCategoryChange={onCategoryChangeError}
        />
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const careerOption = await screen.findByText('Career');
      await user.click(careerOption);

      await waitFor(() => {
        expect(screen.getByText(/變更類別失敗/i)).toBeInTheDocument();
      });
    });

    it('should show error when custom category creation fails', async () => {
      const user = userEvent.setup();
      const onCustomCreateError = jest.fn().mockRejectedValue(new Error('API Error'));

      render(
        <CategorySelector
          {...defaultProps}
          allowCustom
          onCustomCreate={onCustomCreateError}
        />
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const createButton = await screen.findByText(/建立自訂類別/i);
      await user.click(createButton);

      const nameInput = screen.getByLabelText(/類別名稱/i);
      await user.type(nameInput, '自訂類別');

      const submitButton = screen.getByText(/確認/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/建立類別失敗/i)).toBeInTheDocument();
      });
    });
  });
});
