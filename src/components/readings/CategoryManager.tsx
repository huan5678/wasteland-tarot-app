'use client'
import React, { useState, useCallback } from 'react'
import { useReadingsStore, ReadingCategory } from '@/lib/readingsStore'
import { Plus, Edit2, Trash2, Save, X, Palette, Hash, Info } from 'lucide-react'

interface Props {
  onClose?: () => void
  selectedReadingId?: string // For assigning category to specific reading
  onCategoryAssigned?: (categoryId: string | null) => void
}

const COLOR_PRESETS = [
  { name: '綠色', value: '#10B981' },
  { name: '藍色', value: '#3B82F6' },
  { name: '紫色', value: '#8B5CF6' },
  { name: '橙色', value: '#F59E0B' },
  { name: '紅色', value: '#EF4444' },
  { name: '粉色', value: '#EC4899' },
  { name: '青色', value: '#06B6D4' },
  { name: '灰色', value: '#6B7280' },
  { name: '黃色', value: '#EAB308' },
  { name: '靛色', value: '#6366F1' },
]

const EMOJI_PRESETS = [
  '🌱', '💕', '💼', '✨', '🌟', '🎯', '🔮', '🌙', '☀️', '🌈',
  '🦋', '🌸', '🍀', '💎', '🔥', '💧', '🌪️', '⚡', '🌺', '🌿'
]

export function CategoryManager({ onClose, selectedReadingId, onCategoryAssigned }: Props) {
  const { categories, createCategory, updateCategory, deleteCategory, assignCategory, getReadingsByCategory } = useReadingsStore()
  const [editingCategory, setEditingCategory] = useState<ReadingCategory | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<Partial<ReadingCategory>>({})
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const resetForm = () => {
    setFormData({})
    setEditingCategory(null)
    setIsCreating(false)
    setShowColorPicker(false)
    setShowEmojiPicker(false)
  }

  const handleSave = useCallback(() => {
    if (!formData.name?.trim()) return

    const categoryData = {
      name: formData.name.trim(),
      color: formData.color || '#6B7280',
      description: formData.description?.trim() || '',
      icon: formData.icon || '📁'
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, categoryData)
    } else {
      createCategory(categoryData)
    }

    resetForm()
  }, [formData, editingCategory, createCategory, updateCategory])

  const handleDelete = useCallback((category: ReadingCategory) => {
    const readingsInCategory = getReadingsByCategory(category.id)
    const confirmMessage = readingsInCategory.length > 0
      ? `確定要刪除類別 "${category.name}"？這將影響 ${readingsInCategory.length} 個占卜記錄。`
      : `確定要刪除類別 "${category.name}"？`

    if (window.confirm(confirmMessage)) {
      deleteCategory(category.id)
    }
  }, [deleteCategory, getReadingsByCategory])

  const handleCategorySelect = useCallback((categoryId: string | null) => {
    if (selectedReadingId && onCategoryAssigned) {
      assignCategory(selectedReadingId, categoryId)
      onCategoryAssigned(categoryId)
      onClose?.()
    }
  }, [selectedReadingId, assignCategory, onCategoryAssigned, onClose])

  const startEdit = (category: ReadingCategory) => {
    setEditingCategory(category)
    setFormData(category)
    setIsCreating(false)
  }

  const startCreate = () => {
    setIsCreating(true)
    setFormData({ name: '', color: '#10B981', icon: '📁', description: '' })
    setEditingCategory(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-pip-boy-green font-mono">
          {selectedReadingId ? '選擇類別' : '類別管理'}
        </h3>
        <div className="flex items-center gap-2">
          {!selectedReadingId && (
            <button
              onClick={startCreate}
              className="px-3 py-1 border border-pip-boy-green/30 text-pip-boy-green font-mono text-sm
                       hover:border-pip-boy-green/60 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新增類別
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-pip-boy-green/70 hover:text-pip-boy-green"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Creation/Edit Form */}
      {(isCreating || editingCategory) && (
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 space-y-4">
          <h4 className="font-mono font-bold text-pip-boy-green">
            {editingCategory ? '編輯類別' : '新增類別'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1">
              <label className="block text-pip-boy-green font-mono text-sm">類別名稱 *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="輸入類別名稱"
                className="w-full px-3 py-2 bg-black border border-pip-boy-green/30 text-pip-boy-green font-mono text-sm
                         focus:border-pip-boy-green focus:outline-none"
                maxLength={50}
              />
            </div>

            {/* Icon */}
            <div className="space-y-1">
              <label className="block text-pip-boy-green font-mono text-sm">圖示</label>
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 border border-pip-boy-green/30 bg-black flex items-center justify-center text-lg cursor-pointer hover:border-pip-boy-green/60"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  {formData.icon || '📁'}
                </div>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="px-2 py-1 border border-pip-boy-green/30 text-pip-boy-green/70 font-mono text-xs hover:border-pip-boy-green/60"
                >
                  選擇
                </button>
              </div>

              {showEmojiPicker && (
                <div className="absolute z-20 mt-1 p-3 bg-vault-dark border-2 border-pip-boy-green grid grid-cols-10 gap-1 max-w-xs">
                  {EMOJI_PRESETS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, icon: emoji }))
                        setShowEmojiPicker(false)
                      }}
                      className="w-8 h-8 text-lg hover:bg-pip-boy-green/20 flex items-center justify-center"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Color */}
          <div className="space-y-1">
            <label className="block text-pip-boy-green font-mono text-sm">顏色</label>
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-6 border border-pip-boy-green/30 cursor-pointer"
                style={{ backgroundColor: formData.color || '#6B7280' }}
                onClick={() => setShowColorPicker(!showColorPicker)}
              />
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="px-2 py-1 border border-pip-boy-green/30 text-pip-boy-green/70 font-mono text-xs hover:border-pip-boy-green/60 flex items-center gap-1"
              >
                <Palette className="w-3 h-3" />
                選擇顏色
              </button>
            </div>

            {showColorPicker && (
              <div className="absolute z-20 mt-1 p-3 bg-vault-dark border-2 border-pip-boy-green grid grid-cols-5 gap-2 max-w-xs">
                {COLOR_PRESETS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, color: color.value }))
                      setShowColorPicker(false)
                    }}
                    className="w-8 h-8 border border-pip-boy-green/30 hover:border-pip-boy-green flex items-center justify-center"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
                <input
                  type="color"
                  value={formData.color || '#6B7280'}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-8 h-8 border border-pip-boy-green/30 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-pip-boy-green font-mono text-sm">描述</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="類別用途說明（選填）"
              rows={2}
              maxLength={200}
              className="w-full px-3 py-2 bg-black border border-pip-boy-green/30 text-pip-boy-green font-mono text-sm
                       focus:border-pip-boy-green focus:outline-none resize-none"
            />
            <div className="text-xs text-pip-boy-green/60 font-mono">
              <span className="numeric tabular-nums">{(formData.description || '').length}</span>/<span className="numeric tabular-nums">200</span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2">
            <button
              onClick={resetForm}
              className="px-3 py-2 border border-pip-boy-green/30 text-pip-boy-green/70 font-mono text-sm
                       hover:border-pip-boy-green/60 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.name?.trim()}
              className="px-3 py-2 border border-pip-boy-green bg-pip-boy-green/10 text-pip-boy-green font-mono text-sm
                       hover:bg-pip-boy-green/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              保存
            </button>
          </div>
        </div>
      )}

      {/* Category List */}
      <div className="space-y-2">
        {/* None/Remove Category Option for Reading Assignment */}
        {selectedReadingId && (
          <div
            onClick={() => handleCategorySelect(null)}
            className="border border-pip-boy-green/30 p-3 cursor-pointer hover:border-pip-boy-green/60 hover:bg-pip-boy-green/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border border-pip-boy-green/30 flex items-center justify-center text-pip-boy-green/60">
                <X className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-mono font-bold text-pip-boy-green/70 text-sm">無類別</div>
                <div className="font-mono text-xs text-pip-boy-green/50">移除類別標籤</div>
              </div>
            </div>
          </div>
        )}

        {categories.map(category => {
          const readingsInCategory = selectedReadingId ? [] : getReadingsByCategory(category.id)

          return (
            <div
              key={category.id}
              onClick={() => selectedReadingId && handleCategorySelect(category.id)}
              className={`border border-pip-boy-green/30 p-3 transition-colors
                ${selectedReadingId
                  ? 'cursor-pointer hover:border-pip-boy-green/60 hover:bg-pip-boy-green/5'
                  : ''
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-8 h-8 border border-pip-boy-green/30 flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${category.color}20`, borderColor: `${category.color}80` }}
                  >
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-mono font-bold text-pip-boy-green text-sm">
                      {category.name}
                    </div>
                    <div className="font-mono text-xs text-pip-boy-green/70">
                      {category.description}
                    </div>
                    {!selectedReadingId && (
                      <div className="font-mono text-xs text-pip-boy-green/50 mt-1">
                        {readingsInCategory.length} 個占卜記錄
                      </div>
                    )}
                  </div>
                </div>

                {/* Category Actions (only when not selecting) */}
                {!selectedReadingId && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(category)}
                      className="p-1 text-pip-boy-green/60 hover:text-pip-boy-green"
                      title="編輯類別"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {/* Don't allow deleting default categories */}
                    {!['personal', 'relationship', 'career', 'spiritual', 'daily'].includes(category.id) && (
                      <button
                        onClick={() => handleDelete(category)}
                        className="p-1 text-pip-boy-green/60 hover:text-red-400"
                        title="刪除類別"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {categories.length === 0 && (
          <div className="text-center py-8 border-2 border-pip-boy-green/30">
            <Hash className="w-8 h-8 mx-auto mb-2 text-pip-boy-green/40" />
            <div className="font-mono text-sm text-pip-boy-green/70">尚無類別</div>
            <button
              onClick={startCreate}
              className="mt-2 px-3 py-1 border border-pip-boy-green/30 text-pip-boy-green/70 font-mono text-xs hover:border-pip-boy-green/60"
            >
              建立第一個類別
            </button>
          </div>
        )}
      </div>

      {/* Help Text */}
      {!selectedReadingId && (
        <div className="border border-pip-boy-green/30 bg-pip-boy-green/5 p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-pip-boy-green/60 mt-0.5" />
          <div className="text-pip-boy-green/70 font-mono text-xs">
            類別可以幫助你整理不同主題的占卜記錄。預設類別無法刪除，但可以編輯名稱和描述。
          </div>
        </div>
      )}
    </div>
  )
}