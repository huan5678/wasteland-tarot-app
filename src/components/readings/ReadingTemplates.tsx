'use client'
import React, { useState, useCallback } from 'react'
import { useReadingsStore } from '@/lib/readingsStore'
import { PixelIcon } from '@/components/ui/icons'

interface ReadingTemplate {
  id: string
  name: string
  description: string
  question: string
  spread_type: string
  category_id?: string
  icon: string
  color: string
  created_at: string
}

const TEMPLATE_ICONS = [
  { icon: '❓', name: '問題' },
  { icon: '💕', name: '愛情' },
  { icon: '💼', name: '事業' },
  { icon: '🌱', name: '成長' },
  { icon: '✨', name: '靈性' },
  { icon: '🎯', name: '目標' },
  { icon: '🔮', name: '預測' },
  { icon: '💡', name: '靈感' },
  { icon: '🌟', name: '指引' },
  { icon: '⚖️', name: '平衡' },
]

const DEFAULT_TEMPLATES: ReadingTemplate[] = [
  {
    id: 'daily_guidance',
    name: '每日指引',
    description: '獲得今日的靈性指導',
    question: '今天我需要關注什麼？',
    spread_type: 'single',
    category_id: 'daily',
    icon: '🌟',
    color: '#10B981',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'love_relationship',
    name: '感情狀況',
    description: '了解你的戀愛關係現況',
    question: '我的感情生活現在如何？接下來會有什麼變化？',
    spread_type: 'three_card',
    category_id: 'relationship',
    icon: '💕',
    color: '#F59E0B',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'career_path',
    name: '事業發展',
    description: '探索你的職業道路和機會',
    question: '我的事業發展方向是什麼？有什麼需要注意的？',
    spread_type: 'three_card',
    category_id: 'career',
    icon: '💼',
    color: '#3B82F6',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'personal_growth',
    name: '個人成長',
    description: '探索自我提升的方向',
    question: '我現在需要在哪些方面成長？',
    spread_type: 'single',
    category_id: 'personal',
    icon: '🌱',
    color: '#10B981',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'decision_making',
    name: '重要決定',
    description: '幫助做出重要決定',
    question: '關於這個決定，我需要考慮什麼？',
    spread_type: 'three_card',
    icon: '⚖️',
    color: '#8B5CF6',
    created_at: '2024-01-01T00:00:00Z'
  },
]

export function ReadingTemplates() {
  const { categories, readings } = useReadingsStore()
  const [templates, setTemplates] = useState<ReadingTemplate[]>(DEFAULT_TEMPLATES)
  const [isCreating, setIsCreating] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ReadingTemplate | null>(null)
  const [formData, setFormData] = useState<Partial<ReadingTemplate>>({})
  const [selectedTemplate, setSelectedTemplate] = useState<ReadingTemplate | null>(null)

  const resetForm = () => {
    setFormData({})
    setEditingTemplate(null)
    setIsCreating(false)
  }

  const handleSave = useCallback(() => {
    if (!formData.name?.trim() || !formData.question?.trim()) return

    const templateData: ReadingTemplate = {
      id: editingTemplate?.id || `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      question: formData.question.trim(),
      spread_type: formData.spread_type || 'single',
      category_id: formData.category_id,
      icon: formData.icon || '📝',
      color: formData.color || '#10B981',
      created_at: editingTemplate?.created_at || new Date().toISOString()
    }

    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? templateData : t))
    } else {
      setTemplates(prev => [templateData, ...prev])
    }

    resetForm()
  }, [formData, editingTemplate])

  const handleDelete = useCallback((template: ReadingTemplate) => {
    if (DEFAULT_TEMPLATES.some(t => t.id === template.id)) {
      alert('預設模板無法刪除')
      return
    }

    if (window.confirm(`確定要刪除模板 "${template.name}"？`)) {
      setTemplates(prev => prev.filter(t => t.id !== template.id))
    }
  }, [])

  const startEdit = (template: ReadingTemplate) => {
    if (DEFAULT_TEMPLATES.some(t => t.id === template.id)) {
      alert('預設模板無法編輯')
      return
    }
    setEditingTemplate(template)
    setFormData(template)
    setIsCreating(false)
  }

  const startCreate = () => {
    setIsCreating(true)
    setFormData({
      name: '',
      description: '',
      question: '',
      spread_type: 'single',
      icon: '📝',
      color: '#10B981'
    })
    setEditingTemplate(null)
  }

  const handleUseTemplate = (template: ReadingTemplate) => {
    // This would redirect to the reading creation page with the template data
    const params = new URLSearchParams({
      template: template.id,
      question: template.question,
      spread_type: template.spread_type,
      category: template.category_id || ''
    })

    window.location.href = `/readings/new?${params.toString()}`
  }

  const getUsageCount = (templateId: string) => {
    return readings.filter(reading =>
      reading.question.includes(DEFAULT_TEMPLATES.find(t => t.id === templateId)?.question.slice(0, 10) || '')
    ).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-pip-boy-green">占卜模板</h2>
          <p className="text-pip-boy-green/70 text-sm">預設問題模板，快速開始占卜</p>
        </div>
        <button
          onClick={startCreate}
          className="px-4 py-2 border border-pip-boy-green/30 text-pip-boy-green text-sm
                   hover:border-pip-boy-green/60 flex items-center gap-2"
        >
          < PixelIcon name="plus" className="w-4 h-4" />
          新增模板
        </button>
      </div>

      {/* Template Creation/Edit Form */}
      {(isCreating || editingTemplate) && (
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6 space-y-4">
          <h3 className="font-bold text-pip-boy-green">
            {editingTemplate ? '編輯模板' : '新增模板'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1">
              <label className="block text-pip-boy-green text-sm">模板名稱 *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="輸入模板名稱"
                className="w-full px-3 py-2 bg-black border border-pip-boy-green/30 text-pip-boy-green text-sm
                         focus:border-pip-boy-green focus:outline-none"
                maxLength={50}
              />
            </div>

            {/* Icon & Color */}
            <div className="space-y-1">
              <label className="block text-pip-boy-green text-sm">圖示與顏色</label>
              <div className="flex items-center gap-3">
                <select
                  value={formData.icon || '📝'}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  className="px-3 py-2 bg-black border border-pip-boy-green/30 text-pip-boy-green text-sm"
                >
                  {TEMPLATE_ICONS.map(item => (
                    <option key={item.icon} value={item.icon}>
                      {item.icon} {item.name}
                    </option>
                  ))}
                </select>
                <input
                  type="color"
                  value={formData.color || '#10B981'}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-10 border border-pip-boy-green/30 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-pip-boy-green text-sm">描述</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="模板用途說明"
              rows={2}
              maxLength={200}
              className="w-full px-3 py-2 bg-black border border-pip-boy-green/30 text-pip-boy-green text-sm
                       focus:border-pip-boy-green focus:outline-none resize-none"
            />
          </div>

          {/* Question */}
          <div className="space-y-1">
            <label className="block text-pip-boy-green text-sm">預設問題 *</label>
            <textarea
              value={formData.question || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
              placeholder="輸入占卜問題"
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 bg-black border border-pip-boy-green/30 text-pip-boy-green text-sm
                       focus:border-pip-boy-green focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Spread Type */}
            <div className="space-y-1">
              <label className="block text-pip-boy-green text-sm">牌陣類型</label>
              <select
                value={formData.spread_type || 'single'}
                onChange={(e) => setFormData(prev => ({ ...prev, spread_type: e.target.value }))}
                className="w-full px-3 py-2 bg-black border border-pip-boy-green/30 text-pip-boy-green text-sm"
              >
                <option value="single">單張卡牌</option>
                <option value="three_card">三張卡牌</option>
                <option value="celtic_cross">凱爾特十字</option>
              </select>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="block text-pip-boy-green text-sm">預設類別</label>
              <select
                value={formData.category_id || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value || undefined }))}
                className="w-full px-3 py-2 bg-black border border-pip-boy-green/30 text-pip-boy-green text-sm"
              >
                <option value="">無類別</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="block text-pip-boy-green text-sm">預設標籤</label>
            <input
              type="text"
              value={(formData.tags || []).join(', ')}
              onChange={(e) => {
                const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                setFormData(prev => ({ ...prev, tags }))
              }}
              placeholder="用逗號分隔多個標籤"
              className="w-full px-3 py-2 bg-black border border-pip-boy-green/30 text-pip-boy-green text-sm
                       focus:border-pip-boy-green focus:outline-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2">
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-pip-boy-green/30 text-pip-boy-green/70 text-sm
                       hover:border-pip-boy-green/60 flex items-center gap-2"
            >
              < PixelIcon name="x" className="w-4 h-4" />
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.name?.trim() || !formData.question?.trim()}
              className="px-4 py-2 border border-pip-boy-green bg-pip-boy-green/10 text-pip-boy-green text-sm
                       hover:bg-pip-boy-green/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              < PixelIcon name="save" className="w-4 h-4" />
              保存
            </button>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => {
          const isDefault = DEFAULT_TEMPLATES.some(t => t.id === template.id)
          const usageCount = getUsageCount(template.id)

          return (
            <div
              key={template.id}
              className="border-2 border-pip-boy-green/30 p-4 space-y-3 hover:border-pip-boy-green/60 transition-colors cursor-pointer"
              onClick={() => setSelectedTemplate(selectedTemplate?.id === template.id ? null : template)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="text-2xl w-12 h-12 border border-pip-boy-green/30 flex items-center justify-center"
                    style={{ backgroundColor: `${template.color}20`, borderColor: `${template.color}60` }}
                  >
                    {template.icon}
                  </div>
                  <div>
                    <div className="font-bold text-pip-boy-green">{template.name}</div>
                    <div className="text-xs text-pip-boy-green/60">
                      {template.spread_type === 'single' ? '單張' : '三張'}
                      {isDefault && ' • 預設'}
                    </div>
                  </div>
                </div>

                {!isDefault && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(template) }}
                      className="p-1 text-pip-boy-green/60 hover:text-pip-boy-green"
                    >
                      < PixelIcon name="edit-2" className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(template) }}
                      className="p-1 text-pip-boy-green/60 hover:text-red-400"
                    >
                      < PixelIcon name="trash-2" className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-pip-boy-green/80">{template.description}</p>

                {selectedTemplate?.id === template.id && (
                  <div className="border-t border-pip-boy-green/30 pt-3 space-y-3">
                    <div>
                      <div className="text-xs text-pip-boy-green/70 mb-1">問題:</div>
                      <div className="text-sm text-pip-boy-green italic">"{template.question}"</div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleUseTemplate(template) }}
                      className="w-full px-3 py-2 border border-pip-boy-green bg-pip-boy-green/10 text-pip-boy-green
                               text-sm hover:bg-pip-boy-green/20 flex items-center justify-center gap-2"
                    >
                      < PixelIcon name="book-open" className="w-4 h-4" />
                      使用此模板
                    </button>
                  </div>
                )}
              </div>

              {usageCount > 0 && (
                <div className="flex items-center gap-1 text-pip-boy-green/60 text-xs">
                  < PixelIcon name="star" className="w-3 h-3" />
                  已使用 {usageCount} 次
                </div>
              )}
            </div>
          )
        })}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12 border-2 border-pip-boy-green/30">
          < PixelIcon name="book-open" className="w-12 h-12 mx-auto mb-4 text-pip-boy-green/40" />
          <div className="text-lg font-bold text-pip-boy-green/70 mb-2">尚無模板</div>
          <div className="text-sm text-pip-boy-green/50 mb-4">建立你的第一個占卜模板</div>
          <button
            onClick={startCreate}
            className="px-4 py-2 border border-pip-boy-green/30 text-pip-boy-green text-sm
                     hover:border-pip-boy-green/60 flex items-center gap-2 mx-auto"
          >
            < PixelIcon name="plus" className="w-4 h-4" />
            新增模板
          </button>
        </div>
      )}
    </div>
  )
}