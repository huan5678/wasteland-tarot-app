/**
 * Admin Faction-Character Association Management Page
 * 管理後台 - 陣營角色關聯管理
 *
 * 功能：
 * - 查看所有陣營及其關聯角色
 * - 為陣營新增/移除角色
 * - 調整角色優先順序
 * - 批量管理關聯
 */

'use client'

import { useState, useEffect } from 'react'
import { PixelIcon } from '@/components/ui/icons'
import {
  useFactions,
  useCharacters,
  clearFactionsCache,
} from '@/hooks/useCharacterVoices'
import {
  getFactionsWithCharacters,
  addCharacterToFaction,
  removeCharacterFromFaction,
  updateFactionCharacterPriority,
} from '@/lib/api/character-voice'
import type {
  Faction,
  Character,
  FactionWithCharacters,
} from '@/types/character-voice'
import { toast } from 'sonner'

export default function FactionCharactersPage() {
  const { factions, isLoading: isLoadingFactions, reload: reloadFactions } = useFactions()
  const { characters, isLoading: isLoadingCharacters } = useCharacters()
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null)
  const [factionsWithCharacters, setFactionsWithCharacters] = useState<FactionWithCharacters[]>([])
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [isAddingCharacter, setIsAddingCharacter] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Load factions with characters
  const loadFactionsWithCharacters = async () => {
    setIsLoadingDetails(true)
    try {
      const data = await getFactionsWithCharacters()
      setFactionsWithCharacters(data)
    } catch (error) {
      console.error('Failed to load faction details:', error)
      toast.error('載入陣營詳情失敗')
    } finally {
      setIsLoadingDetails(false)
    }
  }

  useEffect(() => {
    loadFactionsWithCharacters()
  }, [])

  // Get faction with characters
  const getFactionWithCharacters = (factionId: string): FactionWithCharacters | undefined => {
    return factionsWithCharacters.find(f => f.id === factionId)
  }

  // Get available characters (not in selected faction)
  const getAvailableCharacters = (): Character[] => {
    if (!selectedFaction || !characters) return []

    const factionWithChars = getFactionWithCharacters(selectedFaction.id)
    const associatedCharacterIds = new Set(
      factionWithChars?.characters?.map(c => c.id) || []
    )

    return characters.filter(c => !associatedCharacterIds.has(c.id))
  }

  // Filter available characters by search
  const filteredAvailableCharacters = getAvailableCharacters().filter(char =>
    char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    char.key.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Add character to faction
  const handleAddCharacter = async (characterId: string, priority: number = 0) => {
    if (!selectedFaction) return

    try {
      await addCharacterToFaction(selectedFaction.id, characterId, priority)
      toast.success('角色已新增到陣營')
      await loadFactionsWithCharacters()
      clearFactionsCache()
      setSearchTerm('')
    } catch (error) {
      console.error('Failed to add character to faction:', error)
      toast.error('新增失敗')
    }
  }

  // Remove character from faction
  const handleRemoveCharacter = async (characterId: string, characterName: string) => {
    if (!selectedFaction) return

    if (!confirm(`確定要將「${characterName}」從陣營「${selectedFaction.name}」中移除嗎？`)) {
      return
    }

    try {
      await removeCharacterFromFaction(selectedFaction.id, characterId)
      toast.success('角色已移除')
      await loadFactionsWithCharacters()
      clearFactionsCache()
    } catch (error) {
      console.error('Failed to remove character:', error)
      toast.error('移除失敗')
    }
  }

  // Update character priority
  const handleUpdatePriority = async (characterId: string, newPriority: number) => {
    if (!selectedFaction) return

    try {
      await updateFactionCharacterPriority(selectedFaction.id, characterId, newPriority)
      toast.success('優先順序已更新')
      await loadFactionsWithCharacters()
      clearFactionsCache()
    } catch (error) {
      console.error('Failed to update priority:', error)
      toast.error('更新失敗')
    }
  }

  const isLoading = isLoadingFactions || isLoadingCharacters || isLoadingDetails

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-pip-boy-green">載入資料...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold uppercase tracking-wider mb-2">
          陣營角色關聯管理
        </h2>
        <p className="text-pip-boy-green/70 text-sm uppercase tracking-wider">
          FACTION-CHARACTER ASSOCIATIONS
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Factions List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xl font-bold text-pip-boy-green uppercase tracking-wider">
            選擇陣營
          </h3>

          <div className="space-y-2">
            {factions?.filter(f => f.is_active).map((faction) => {
              const factionWithChars = getFactionWithCharacters(faction.id)
              const characterCount = factionWithChars?.characters?.length || 0
              const isSelected = selectedFaction?.id === faction.id

              return (
                <button
                  key={faction.id}
                  onClick={() => setSelectedFaction(faction)}
                  className={`w-full p-4 border-2 text-left transition-all ${
                    isSelected
                      ? 'border-pip-boy-green bg-pip-boy-green/20'
                      : 'border-pip-boy-green/30 hover:border-pip-boy-green/60 hover:bg-pip-boy-green/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {faction.icon_name && (
                        <PixelIcon name={faction.icon_name} sizePreset="xs" variant="primary" decorative />
                      )}
                      <span className="font-bold text-pip-boy-green">
                        {faction.name}
                      </span>
                    </div>
                    {faction.theme_color && (
                      <div
                        className="w-4 h-4 border border-pip-boy-green/30"
                        style={{ backgroundColor: faction.theme_color }}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-pip-boy-green/70">
                    <PixelIcon name="user" sizePreset="xs" variant="muted" decorative />
                    <span>{characterCount} 個角色</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Character Management */}
        <div className="lg:col-span-2 space-y-4">
          {selectedFaction ? (
            <>
              {/* Faction Info */}
              <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-pip-boy-green">
                    {selectedFaction.name}
                  </h3>
                  <button
                    onClick={() => setIsAddingCharacter(!isAddingCharacter)}
                    className="px-4 py-2 border-2 border-pip-boy-green bg-pip-boy-green/20 hover:bg-pip-boy-green/30 text-pip-boy-green font-bold uppercase text-sm tracking-wider transition-colors flex items-center gap-2"
                  >
                    <PixelIcon name="plus" sizePreset="xs" decorative />
                    新增角色
                  </button>
                </div>
                {selectedFaction.description && (
                  <p className="text-pip-boy-green/70 text-sm">
                    {selectedFaction.description}
                  </p>
                )}
              </div>

              {/* Add Character Section */}
              {isAddingCharacter && (
                <div className="border-2 border-orange-400/30 bg-orange-500/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <PixelIcon name="plus-circle" sizePreset="sm" variant="warning" decorative />
                    <h4 className="font-bold text-orange-400 uppercase tracking-wider">
                      新增角色到陣營
                    </h4>
                  </div>

                  {/* Search */}
                  <div className="mb-3">
                    <div className="relative">
                      <PixelIcon
                        name="search"
                        sizePreset="xs"
                        variant="primary"
                        decorative
                        className="absolute left-3 top-1/2 -translate-y-1/2"
                      />
                      <input
                        type="text"
                        placeholder="搜尋角色..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border-2 border-pip-boy-green/30 bg-black text-pip-boy-green placeholder-pip-boy-green/50 focus:border-pip-boy-green focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Available Characters */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredAvailableCharacters.length === 0 ? (
                      <div className="text-center text-pip-boy-green/60 py-4">
                        <PixelIcon name="info" sizePreset="md" variant="muted" decorative className="mx-auto mb-2" />
                        <p className="text-sm">
                          {getAvailableCharacters().length === 0
                            ? '所有角色都已加入此陣營'
                            : '沒有找到符合的角色'}
                        </p>
                      </div>
                    ) : (
                      filteredAvailableCharacters.map((character) => (
                        <div
                          key={character.id}
                          className="flex items-center justify-between p-3 border border-pip-boy-green/30 hover:border-pip-boy-green/60 hover:bg-pip-boy-green/5 transition-colors"
                        >
                          <div>
                            <div className="font-bold text-pip-boy-green">
                              {character.name}
                            </div>
                            <div className="text-xs text-pip-boy-green/70 font-mono">
                              {character.key}
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddCharacter(character.id)}
                            className="px-3 py-1 border border-pip-boy-green/50 hover:border-pip-boy-green hover:bg-pip-boy-green/10 text-pip-boy-green text-sm font-bold uppercase tracking-wider transition-colors"
                          >
                            新增
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Associated Characters */}
              <div>
                <h4 className="font-bold text-pip-boy-green uppercase tracking-wider mb-3">
                  關聯角色 ({getFactionWithCharacters(selectedFaction.id)?.characters?.length || 0})
                </h4>

                <div className="border-2 border-pip-boy-green/30 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-pip-boy-green/20 border-b-2 border-pip-boy-green/30">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-pip-boy-green uppercase tracking-wider">
                            角色
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-pip-boy-green uppercase tracking-wider">
                            優先順序
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-pip-boy-green uppercase tracking-wider">
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-pip-boy-green/20">
                        {(() => {
                          const factionWithChars = getFactionWithCharacters(selectedFaction.id)
                          const associatedCharacters = factionWithChars?.characters || []

                          if (associatedCharacters.length === 0) {
                            return (
                              <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-pip-boy-green/60">
                                  <PixelIcon name="info" sizePreset="lg" variant="muted" decorative className="mx-auto mb-2" />
                                  <div>此陣營尚未關聯任何角色</div>
                                </td>
                              </tr>
                            )
                          }

                          // Sort by name
                          const sortedCharacters = [...associatedCharacters].sort((a, b) =>
                            a.name.localeCompare(b.name)
                          )

                          return sortedCharacters.map((character) => (
                            <tr key={character.id} className="hover:bg-pip-boy-green/5 transition-colors">
                              <td className="px-4 py-3">
                                <div className="font-bold text-pip-boy-green">
                                  {character.name}
                                </div>
                                <div className="text-xs text-pip-boy-green/70 font-mono">
                                  {character.key}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  defaultValue={character.sort_order || 0}
                                  onBlur={(e) => {
                                    const newPriority = parseInt(e.target.value) || 0
                                    if (newPriority !== (character.sort_order || 0)) {
                                      handleUpdatePriority(character.id, newPriority)
                                    }
                                  }}
                                  className="w-20 px-2 py-1 border border-pip-boy-green/30 bg-black text-pip-boy-green focus:border-pip-boy-green focus:outline-none text-center"
                                  min={0}
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => handleRemoveCharacter(character.id, character.name)}
                                  className="px-3 py-1 border border-red-500/30 hover:border-red-500 hover:bg-red-500/10 text-red-400 text-sm font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2"
                                >
                                  <PixelIcon name="trash" sizePreset="xs" variant="error" decorative />
                                  移除
                                </button>
                              </td>
                            </tr>
                          ))
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-12 text-center">
              <PixelIcon name="arrow-left" sizePreset="xl" variant="muted" decorative className="mx-auto mb-4" />
              <p className="text-pip-boy-green/70 text-lg">
                請從左側選擇一個陣營以管理其關聯角色
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
