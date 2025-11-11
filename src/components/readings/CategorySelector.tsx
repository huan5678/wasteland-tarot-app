'use client';

import React, { useState } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Category {
  id: string;
  name: string;
  color: string;
  description?: string;
  icon?: string;
  totalReadings?: number;
  averageKarma?: number;
}

interface CategorySelectorProps {
  currentCategoryId?: string;
  categories: Category[];
  onCategoryChange: (categoryId: string) => Promise<void> | void;
  onCustomCreate?: (category: Omit<Category, 'id'>) => Promise<Category>;
  allowCustom?: boolean;
  showStats?: boolean;
  className?: string;
}

const MAX_CATEGORY_NAME_LENGTH = 50;

export default function CategorySelector({
  currentCategoryId,
  categories,
  onCategoryChange,
  onCustomCreate,
  allowCustom = false,
  showStats = false,
  className,
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#00ff88');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentCategory = categories.find(cat => cat.id === currentCategoryId);

  const handleCategorySelect = async (categoryId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await onCategoryChange(categoryId);
      setIsOpen(false);
    } catch (err) {
      setError('變更類別失敗，請稍後再試');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!onCustomCreate) return;

    const trimmedName = newCategoryName.trim();

    if (!trimmedName) {
      setError('請輸入類別名稱');
      return;
    }

    if (trimmedName.length > MAX_CATEGORY_NAME_LENGTH) {
      setError(`名稱長度不可超過 ${MAX_CATEGORY_NAME_LENGTH} 字元`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newCategory = await onCustomCreate({
        name: trimmedName,
        color: newCategoryColor,
        description: newCategoryDescription.trim(),
      });

      // Reset form
      setNewCategoryName('');
      setNewCategoryColor('#00ff88');
      setNewCategoryDescription('');
      setShowCreateDialog(false);

      // Select the newly created category
      await handleCategorySelect(newCategory.id);
    } catch (err) {
      setError('建立類別失敗，請稍後再試');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isOpen) {
      setIsOpen(true);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setShowCreateDialog(false);
    } else if (e.key === 'ArrowDown' && isOpen) {
      e.preventDefault();
      // Focus first category option
      const firstOption = document.querySelector('[data-category-option]') as HTMLElement;
      firstOption?.focus();
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Dropdown Trigger */}
      <button
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-label="選擇類別"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2',
          'bg-black/50 border border-pip-boy-green/30 rounded',
          'text-pip-boy-green hover:border-pip-boy-green',
          'focus:outline-none focus:border-pip-boy-green',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {currentCategory ? (
          <div className="flex items-center gap-2">
            <div
              data-testid="category-badge"
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: currentCategory.color }}
              title={currentCategory.description}
            />
            <span className="text-sm">{currentCategory.name}</span>
            {showStats && currentCategory.totalReadings !== undefined && (
              <span className="text-xs text-pip-boy-green/60">
                ({currentCategory.totalReadings} 次解讀)
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm text-pip-boy-green/60">選擇類別</span>
        )}
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-black border border-pip-boy-green/30 rounded shadow-lg max-h-64 overflow-y-auto">
          {categories.map(category => (
            <button
              key={category.id}
              type="button"
              data-category-option
              onClick={() => handleCategorySelect(category.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCategorySelect(category.id);
                }
              }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-pip-boy-green/10 focus:bg-pip-boy-green/10 focus:outline-none"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <div>
                  <div className="text-sm text-pip-boy-green">{category.name}</div>
                  {category.description && (
                    <div className="text-xs text-pip-boy-green/60">{category.description}</div>
                  )}
                  {showStats && category.totalReadings !== undefined && (
                    <div className="text-xs text-pip-boy-green/60 mt-1">
                      {category.totalReadings} 次解讀
                      {category.averageKarma !== undefined && (
                        <span className="ml-2">平均 Karma: {category.averageKarma.toFixed(1)}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {category.id === currentCategoryId && (
                <Check className="w-4 h-4 text-pip-boy-green" />
              )}
            </button>
          ))}

          {/* Custom Category Creation */}
          {allowCustom && (
            <button
              type="button"
              onClick={() => {
                setShowCreateDialog(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left border-t border-pip-boy-green/30 hover:bg-pip-boy-green/10 focus:bg-pip-boy-green/10 focus:outline-none"
            >
              <Plus className="w-4 h-4 text-pip-boy-green" />
              <span className="text-sm text-pip-boy-green">建立自訂類別</span>
            </button>
          )}
        </div>
      )}

      {/* Custom Category Creation Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-full max-w-md p-6 bg-black border border-pip-boy-green rounded shadow-lg">
            <h3 className="mb-4 text-lg font-bold text-pip-boy-green">新增類別</h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="category-name" className="block mb-1 text-sm text-pip-boy-green">
                  類別名稱 *
                </label>
                <input
                  id="category-name"
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  maxLength={MAX_CATEGORY_NAME_LENGTH}
                  placeholder="輸入類別名稱"
                  className="w-full px-3 py-2 bg-black/50 border border-pip-boy-green/30 rounded text-pip-boy-green placeholder:text-pip-boy-green/40 focus:outline-none focus:border-pip-boy-green"
                />
                <p className="mt-1 text-xs text-pip-boy-green/60">
                  {newCategoryName.length}/{MAX_CATEGORY_NAME_LENGTH}
                </p>
              </div>

              <div>
                <label htmlFor="category-color" className="block mb-1 text-sm text-pip-boy-green">
                  類別顏色 *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="category-color"
                    type="color"
                    value={newCategoryColor}
                    onChange={e => setNewCategoryColor(e.target.value)}
                    className="w-12 h-10 bg-black/50 border border-pip-boy-green/30 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newCategoryColor}
                    onChange={e => setNewCategoryColor(e.target.value)}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    placeholder="#00ff88"
                    className="flex-1 px-3 py-2 bg-black/50 border border-pip-boy-green/30 rounded text-pip-boy-green placeholder:text-pip-boy-green/40 focus:outline-none focus:border-pip-boy-green"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="category-description" className="block mb-1 text-sm text-pip-boy-green">
                  類別描述（選填）
                </label>
                <textarea
                  id="category-description"
                  value={newCategoryDescription}
                  onChange={e => setNewCategoryDescription(e.target.value)}
                  rows={3}
                  placeholder="輸入類別描述"
                  className="w-full px-3 py-2 bg-black/50 border border-pip-boy-green/30 rounded text-pip-boy-green placeholder:text-pip-boy-green/40 focus:outline-none focus:border-pip-boy-green resize-none"
                />
              </div>

              {error && (
                <p className="text-xs text-pip-boy-orange" role="alert">
                  {error}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-pip-boy-green text-black font-bold rounded hover:bg-pip-boy-green/80 focus:outline-none focus:ring-2 focus:ring-pip-boy-green disabled:opacity-50"
                >
                  {isLoading ? '建立中...' : '確認'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setNewCategoryName('');
                    setNewCategoryDescription('');
                    setError(null);
                  }}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-black border border-pip-boy-green text-pip-boy-green rounded hover:bg-pip-boy-green/10 focus:outline-none focus:ring-2 focus:ring-pip-boy-green disabled:opacity-50"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && !showCreateDialog && (
        <p className="mt-1 text-xs text-pip-boy-orange" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
