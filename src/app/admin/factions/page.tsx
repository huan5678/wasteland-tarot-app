/**
 * Admin Factions Management Page
 * 管理後台 - 陣營管理頁面
 *
 * 功能：
 * - 陣營列表顯示（含關聯角色數量）
 * - 搜尋和篩選
 * - CRUD 操作
 * - 啟用/停用切換
 */

'use client'

import { useState, useEffect } from 'react'
import { PixelIcon } from '@/components/ui/icons'
import { useFactions, clearFactionsCache } from '@/hooks/useCharacterVoices'
import {
  createFaction,
  updateFaction,
  deleteFaction,
  getFactionsWithCharacters,
} from '@/lib/api/character-voice'
import type { Faction, FactionCreate, FactionWithCharacters } from '@/types/character-voice'
import { toast } from 'sonner'

export default function FactionsPage() {
  const { factions, isLoading, error, reload } = useFactions()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFaction, setEditingFaction] = useState<Faction | null>(null)
  const [factionsWithCharacters, setFactionsWithCharacters] = useState<FactionWithCharacters[]>([])
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  // Batch edit state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)

  // Load factions with character counts
  useEffect(() => {
    const loadDetails = async () => {
      setIsLoadingDetails(true)
      try {
        const data = await getFactionsWithCharacters()
        setFactionsWithCharacters(data)
      } catch (error) {
        console.error('Failed to load faction details:', error)
      } finally {
        setIsLoadingDetails(false)
      }
    }
    loadDetails()
  }, [])

  // Filter factions
  const filteredFactions = factions?.filter(faction => {
    const matchesSearch =
      faction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faction.key.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter =
      filterActive === 'all' ||
      (filterActive === 'active' && faction.is_active) ||
      (filterActive === 'inactive' && !faction.is_active)

    return matchesSearch && matchesFilter
  }) || []

  // Get character count for a faction
  const getCharacterCount = (factionId: string): number => {
    const factionWithChars = factionsWithCharacters.find(f => f.id === factionId)
    return factionWithChars?.characters?.length || 0
  }

  // CRUD Handlers
  const handleCreate = () => {
    setEditingFaction(null)
    setIsModalOpen(true)
  }

  const handleEdit = (faction: Faction) => {
    setEditingFaction(faction)
    setIsModalOpen(true)
  }

  const handleDelete = async (faction: Faction) => {
    const characterCount = getCharacterCount(faction.id)

    const confirmMessage = characterCount > 0
      ? `確定要刪除陣營「${faction.name}」嗎？\n\n這個陣營目前有 ${characterCount} 個關聯角色。`
      : `確定要刪除陣營「${faction.name}」嗎？`

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      await deleteFaction(faction.id)
      toast.success('陣營已刪除')
      clearFactionsCache()
      reload()

      // Reload details
      const data = await getFactionsWithCharacters()
      setFactionsWithCharacters(data)
    } catch (error) {
      console.error('Failed to delete faction:', error)
      toast.error('刪除失敗')
    }
  }

  const handleToggleActive = async (faction: Faction) => {
    try {
      await updateFaction(faction.id, {
        is_active: !faction.is_active
      })
      toast.success(`陣營已${faction.is_active ? '停用' : '啟用'}`)
      clearFactionsCache()
      reload()
    } catch (error) {
      console.error('Failed to toggle faction:', error)
      toast.error('更新失敗')
    }
  }

  const handleModalSuccess = async () => {
    setIsModalOpen(false)
    setEditingFaction(null)
    clearFactionsCache()
    reload()

    // Reload details
    const data = await getFactionsWithCharacters()
    setFactionsWithCharacters(data)
  }

  // Batch operations
  const handleSelectAll = () => {
    if (selectedIds.size === filteredFactions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredFactions.map(f => f.id)))
    }
  }

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkActivate = async () => {
    if (selectedIds.size === 0) return

    if (!confirm(`確定要啟用選中的 ${selectedIds.size} 個陣營嗎？`)) return

    setIsBulkProcessing(true)
    let successCount = 0
    let failCount = 0

    try {
      for (const id of selectedIds) {
        try {
          await updateFaction(id, { is_active: true })
          successCount++
        } catch (error) {
          console.error(`Failed to activate faction ${id}:`, error)
          failCount++
        }
      }

      toast.success(`成功啟用 ${successCount} 個陣營${failCount > 0 ? `，${failCount} 個失敗` : ''}`)
      clearFactionsCache()
      reload()
      setSelectedIds(new Set())

      // Reload details
      const data = await getFactionsWithCharacters()
      setFactionsWithCharacters(data)
    } finally {
      setIsBulkProcessing(false)
    }
  }

  const handleBulkDeactivate = async () => {
    if (selectedIds.size === 0) return

    if (!confirm(`確定要停用選中的 ${selectedIds.size} 個陣營嗎？`)) return

    setIsBulkProcessing(true)
    let successCount = 0
    let failCount = 0

    try {
      for (const id of selectedIds) {
        try {
          await updateFaction(id, { is_active: false })
          successCount++
        } catch (error) {
          console.error(`Failed to deactivate faction ${id}:`, error)
          failCount++
        }
      }

      toast.success(`成功停用 ${successCount} 個陣營${failCount > 0 ? `，${failCount} 個失敗` : ''}`)
      clearFactionsCache()
      reload()
      setSelectedIds(new Set())

      // Reload details
      const data = await getFactionsWithCharacters()
      setFactionsWithCharacters(data)
    } finally {
      setIsBulkProcessing(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return

    if (!confirm(`確定要刪除選中的 ${selectedIds.size} 個陣營嗎？\n\n這將會刪除所有關聯的角色關係！`)) return

    setIsBulkProcessing(true)
    let successCount = 0
    let failCount = 0

    try {
      for (const id of selectedIds) {
        try {
          await deleteFaction(id)
          successCount++
        } catch (error) {
          console.error(`Failed to delete faction ${id}:`, error)
          failCount++
        }
      }

      toast.success(`成功刪除 ${successCount} 個陣營${failCount > 0 ? `，${failCount} 個失敗` : ''}`)
      clearFactionsCache()
      reload()
      setSelectedIds(new Set())

      // Reload details
      const data = await getFactionsWithCharacters()
      setFactionsWithCharacters(data)
    } finally {
      setIsBulkProcessing(false)
    }
  }

  if (isLoading || isLoadingDetails) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-pip-boy-green">載入陣營資料...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border-2 border-red-500/50 bg-red-500/10 p-6">
        <div className="flex items-center gap-3 mb-2">
          <PixelIcon name="alert-triangle" sizePreset="md" variant="error" decorative />
          <h3 className="text-lg font-bold text-red-400">載入失敗</h3>
        </div>
        <p className="text-red-300/80 text-sm">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold uppercase tracking-wider mb-2">
            陣營管理
          </h2>
          <p className="text-pip-boy-green/70 text-sm uppercase tracking-wider">
            FACTION MANAGEMENT
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-6 py-3 border-2 border-pip-boy-green bg-pip-boy-green/20 hover:bg-pip-boy-green/30 text-pip-boy-green font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
        >
          <PixelIcon name="plus" sizePreset="sm" decorative />
          新增陣營
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4">
          <div className="text-pip-boy-green/70 text-sm uppercase mb-1">總陣營數</div>
          <div className="text-2xl font-bold text-pip-boy-green">{factions?.length || 0}</div>
        </div>
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4">
          <div className="text-pip-boy-green/70 text-sm uppercase mb-1">啟用中</div>
          <div className="text-2xl font-bold text-pip-boy-green">
            {factions?.filter(f => f.is_active).length || 0}
          </div>
        </div>
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4">
          <div className="text-pip-boy-green/70 text-sm uppercase mb-1">已停用</div>
          <div className="text-2xl font-bold text-pip-boy-green/60">
            {factions?.filter(f => !f.is_active).length || 0}
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <PixelIcon
            name="search"
            sizePreset="xs"
            variant="primary"
            decorative
            className="absolute left-3 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            placeholder="搜尋陣營名稱或代碼..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-pip-boy-green/30 bg-black text-pip-boy-green placeholder-pip-boy-green/50 focus:border-pip-boy-green focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterActive(filter)}
              className={`px-4 py-2 border-2 uppercase text-sm font-bold transition-colors ${
                filterActive === filter
                  ? 'border-pip-boy-green bg-pip-boy-green/20 text-pip-boy-green'
                  : 'border-pip-boy-green/30 text-pip-boy-green/70 hover:border-pip-boy-green/60'
              }`}
            >
              {filter === 'all' ? '全部' : filter === 'active' ? '啟用' : '停用'}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="border-2 border-orange-400/30 bg-orange-500/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PixelIcon name="check-circle" sizePreset="sm" variant="warning" decorative />
              <span className="font-bold text-orange-400">
                已選擇 {selectedIds.size} 個陣營
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkActivate}
                disabled={isBulkProcessing}
                className="px-4 py-2 border-2 border-pip-boy-green bg-pip-boy-green/20 hover:bg-pip-boy-green/30 disabled:opacity-50 disabled:cursor-not-allowed text-pip-boy-green font-bold uppercase text-sm tracking-wider transition-colors flex items-center gap-2"
              >
                <PixelIcon name="check" sizePreset="xs" decorative />
                批量啟用
              </button>
              <button
                onClick={handleBulkDeactivate}
                disabled={isBulkProcessing}
                className="px-4 py-2 border-2 border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-yellow-400 font-bold uppercase text-sm tracking-wider transition-colors flex items-center gap-2"
              >
                <PixelIcon name="close" sizePreset="xs" decorative />
                批量停用
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isBulkProcessing}
                className="px-4 py-2 border-2 border-red-500/50 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 font-bold uppercase text-sm tracking-wider transition-colors flex items-center gap-2"
              >
                <PixelIcon name="trash" sizePreset="xs" decorative />
                批量刪除
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                disabled={isBulkProcessing}
                className="px-4 py-2 border-2 border-pip-boy-green/50 hover:bg-pip-boy-green/10 disabled:opacity-50 disabled:cursor-not-allowed text-pip-boy-green/80 font-bold uppercase text-sm tracking-wider transition-colors"
              >
                取消選擇
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Factions Table */}
      <div className="border-2 border-pip-boy-green/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-pip-boy-green/20 border-b-2 border-pip-boy-green/30">
              <tr>
                <th className="px-6 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredFactions.length && filteredFactions.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 cursor-pointer accent-pip-boy-green"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-pip-boy-green uppercase tracking-wider">
                  陣營名稱
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-pip-boy-green uppercase tracking-wider">
                  代碼 (Key)
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-pip-boy-green uppercase tracking-wider">
                  陣營傾向
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-pip-boy-green uppercase tracking-wider">
                  關聯角色
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-pip-boy-green uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-pip-boy-green uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pip-boy-green/20">
              {filteredFactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-pip-boy-green/60">
                    <PixelIcon name="info" sizePreset="lg" variant="muted" decorative className="mx-auto mb-2" />
                    <div>沒有找到陣營</div>
                  </td>
                </tr>
              ) : (
                filteredFactions.map((faction) => (
                  <tr
                    key={faction.id}
                    className="hover:bg-pip-boy-green/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(faction.id)}
                        onChange={() => handleSelectOne(faction.id)}
                        className="w-4 h-4 cursor-pointer accent-pip-boy-green"
                      />
                    </td>
                    <td className="px-4 py-3 text-pip-boy-green">
                      <div className="flex items-center gap-2">
                        {faction.icon_name && (
                          <PixelIcon name={faction.icon_name} sizePreset="xs" decorative />
                        )}
                        <span className="font-bold">{faction.name}</span>
                        {faction.theme_color && (
                          <div
                            className="w-4 h-4 border border-pip-boy-green/30"
                            style={{ backgroundColor: faction.theme_color }}
                            title={faction.theme_color}
                          />
                        )}
                      </div>
                      {faction.description && (
                        <div className="text-xs text-pip-boy-green/60 mt-1 line-clamp-2">
                          {faction.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-pip-boy-green/80 font-mono text-sm">
                      {faction.key}
                    </td>
                    <td className="px-4 py-3 text-pip-boy-green/80 text-sm">
                      {faction.alignment || '-'}
                    </td>
                    <td className="px-4 py-3 text-pip-boy-green/80 text-sm">
                      <div className="flex items-center gap-2">
                        <PixelIcon name="user" sizePreset="xs" variant="primary" decorative />
                        <span>{getCharacterCount(faction.id)} 個角色</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(faction)}
                        className={`px-3 py-1 border text-xs font-bold uppercase tracking-wider transition-colors ${
                          faction.is_active
                            ? 'border-pip-boy-green text-pip-boy-green bg-pip-boy-green/10 hover:bg-pip-boy-green/20'
                            : 'border-pip-boy-green/30 text-pip-boy-green/50 bg-pip-boy-green/5 hover:border-pip-boy-green/60'
                        }`}
                      >
                        {faction.is_active ? '啟用' : '停用'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(faction)}
                          className="p-2 border border-pip-boy-green/30 hover:border-pip-boy-green hover:bg-pip-boy-green/10 transition-colors"
                          title="編輯"
                        >
                          <PixelIcon name="edit" sizePreset="xs" variant="primary" decorative />
                        </button>
                        <button
                          onClick={() => handleDelete(faction)}
                          className="p-2 border border-red-500/30 hover:border-red-500 hover:bg-red-500/10 transition-colors"
                          title="刪除"
                        >
                          <PixelIcon name="trash" sizePreset="xs" variant="error" decorative />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <FactionFormModal
          faction={editingFaction}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingFaction(null)
          }}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  )
}

// ============================================================================
// Faction Form Modal Component
// ============================================================================

interface FactionFormModalProps {
  faction: Faction | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function FactionFormModal({ faction, isOpen, onClose, onSuccess }: FactionFormModalProps) {
  const [formData, setFormData] = useState({
    name: faction?.name || '',
    key: faction?.key || '',
    description: faction?.description || '',
    alignment: faction?.alignment || '',
    icon_name: faction?.icon_name || '',
    theme_color: faction?.theme_color || '',
    is_active: faction?.is_active ?? true,
    sort_order: faction?.sort_order || 0,
  })
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      toast.error('請輸入陣營名稱')
      return
    }
    if (!formData.key.trim()) {
      toast.error('請輸入陣營代碼')
      return
    }

    setIsSaving(true)

    try {
      const submitData: FactionCreate = {
        name: formData.name.trim(),
        key: formData.key.trim(),
        description: formData.description.trim() || null,
        alignment: formData.alignment.trim() || null,
        icon_name: formData.icon_name.trim() || null,
        theme_color: formData.theme_color.trim() || null,
        is_active: formData.is_active,
        sort_order: formData.sort_order,
      }

      if (faction) {
        // Update existing faction
        await updateFaction(faction.id, submitData)
        toast.success('陣營已更新')
      } else {
        // Create new faction
        await createFaction(submitData)
        toast.success('陣營已建立')
      }

      onSuccess()
    } catch (error) {
      console.error('Failed to save faction:', error)
      toast.error(faction ? '更新失敗' : '建立失敗')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyChange = (value: string) => {
    // Convert to lowercase and replace spaces with underscores
    const formatted = value.toLowerCase().replace(/\s+/g, '_')
    setFormData(prev => ({ ...prev, key: formatted }))
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-wasteland-dark border-2 border-pip-boy-green max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-pip-boy-green/30 p-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-pip-boy-green uppercase tracking-wider">
            {faction ? '編輯陣營' : '新增陣營'}
          </h3>
          <button
            onClick={onClose}
            className="text-pip-boy-green hover:text-pip-boy-green/80 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-pip-boy-green text-sm font-bold mb-2">
                陣營名稱 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-pip-boy-green/30 bg-black text-pip-boy-green focus:border-pip-boy-green focus:outline-none"
                placeholder="例如：Brotherhood of Steel"
                required
              />
            </div>

            {/* Key */}
            <div>
              <label className="block text-pip-boy-green text-sm font-bold mb-2">
                陣營代碼 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => handleKeyChange(e.target.value)}
                disabled={!!faction}
                className="w-full px-3 py-2 border-2 border-pip-boy-green/30 bg-black text-pip-boy-green focus:border-pip-boy-green focus:outline-none font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="例如：brotherhood_of_steel"
                required
              />
              {faction && (
                <p className="text-xs text-pip-boy-green/60 mt-1">
                  代碼不可修改
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-pip-boy-green text-sm font-bold mb-2">
                描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-pip-boy-green/30 bg-black text-pip-boy-green focus:border-pip-boy-green focus:outline-none resize-none"
                rows={3}
                placeholder="陣營的背景描述..."
              />
            </div>

            {/* Alignment */}
            <div>
              <label className="block text-pip-boy-green text-sm font-bold mb-2">
                陣營傾向
              </label>
              <input
                type="text"
                value={formData.alignment}
                onChange={(e) => setFormData(prev => ({ ...prev, alignment: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-pip-boy-green/30 bg-black text-pip-boy-green focus:border-pip-boy-green focus:outline-none"
                placeholder="例如：Lawful Good, Chaotic Evil"
                maxLength={20}
              />
            </div>

            {/* Icon Name */}
            <div>
              <label className="block text-pip-boy-green text-sm font-bold mb-2">
                圖示名稱
              </label>
              <input
                type="text"
                value={formData.icon_name}
                onChange={(e) => setFormData(prev => ({ ...prev, icon_name: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-pip-boy-green/30 bg-black text-pip-boy-green focus:border-pip-boy-green focus:outline-none"
                placeholder="例如：flag, shield"
                maxLength={50}
              />
              <p className="text-xs text-pip-boy-green/60 mt-1">
                使用 RemixIcon 圖示名稱
              </p>
            </div>

            {/* Theme Color */}
            <div>
              <label className="block text-pip-boy-green text-sm font-bold mb-2">
                主題顏色
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.theme_color || '#00ff88'}
                  onChange={(e) => setFormData(prev => ({ ...prev, theme_color: e.target.value }))}
                  className="w-16 h-10 border-2 border-pip-boy-green/30 bg-black cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.theme_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, theme_color: e.target.value }))}
                  className="flex-1 px-3 py-2 border-2 border-pip-boy-green/30 bg-black text-pip-boy-green focus:border-pip-boy-green focus:outline-none font-mono"
                  placeholder="#00ff88"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-pip-boy-green text-sm font-bold mb-2">
                排序順序
              </label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border-2 border-pip-boy-green/30 bg-black text-pip-boy-green focus:border-pip-boy-green focus:outline-none"
                min={0}
              />
              <p className="text-xs text-pip-boy-green/60 mt-1">
                數字越小越靠前
              </p>
            </div>

            {/* Is Active */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-5 h-5 border-2 border-pip-boy-green/30 bg-black text-pip-boy-green focus:ring-pip-boy-green focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="is_active" className="text-pip-boy-green text-sm font-bold cursor-pointer">
                啟用此陣營
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-pip-boy-green/30">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-pip-boy-green/30 text-pip-boy-green hover:border-pip-boy-green/60 hover:bg-pip-boy-green/5 font-bold uppercase tracking-wider transition-colors"
              disabled={isSaving}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 border-2 border-pip-boy-green bg-pip-boy-green/20 hover:bg-pip-boy-green/30 text-pip-boy-green font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving}
            >
              {isSaving ? '儲存中...' : faction ? '更新' : '建立'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
