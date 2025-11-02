/**
 * Metadata Store - 管理角色聲音、陣營、業力等 metadata
 * 從後端 API 取得資料，避免前端硬編碼
 */

import { create } from 'zustand'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// ============================================================================
// Types
// ============================================================================

export interface Character {
  id: string
  key: string
  name: string
  description: string
  personality: string
  voice_style: string
  theme_color: string
  icon_name: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Faction {
  id: string
  key: string
  name: string
  description: string
  alignment: string
  icon_name: string
  theme_color: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// 業力對齊映射（前端定義，因為後端沒有獨立的表）
export const KARMA_ALIGNMENTS: Record<string, string> = {
  'very_good': '極善 (聖人之路)',
  'good': '善良 (正義使者)',
  'neutral': '中立 (平衡行者)',
  'evil': '邪惡 (黑暗之路)',
  'very_evil': '極惡 (毀滅使者)',
}

// ============================================================================
// Store Interface
// ============================================================================

interface MetadataStore {
  // State
  characters: Character[]
  factions: Faction[]
  isLoading: boolean
  isInitialized: boolean
  error: Error | null

  // Actions
  initialize: () => Promise<void>
  fetchCharacters: () => Promise<void>
  fetchFactions: () => Promise<void>

  // Getters
  getCharacterName: (key: string) => string
  getFactionName: (key: string) => string
  getKarmaName: (key: string) => string
}

// ============================================================================
// API Functions
// ============================================================================

async function fetchCharactersAPI(): Promise<Character[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/characters?is_active=true&limit=100`)
  if (!response.ok) {
    throw new Error(`Failed to fetch characters: ${response.statusText}`)
  }
  return response.json()
}

async function fetchFactionsAPI(): Promise<Faction[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/factions?is_active=true&limit=100`)
  if (!response.ok) {
    throw new Error(`Failed to fetch factions: ${response.statusText}`)
  }
  return response.json()
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useMetadataStore = create<MetadataStore>((set, get) => ({
  // Initial State
  characters: [],
  factions: [],
  isLoading: false,
  isInitialized: false,
  error: null,

  // Initialize - 一次性載入所有 metadata
  initialize: async () => {
    const state = get()
    if (state.isInitialized || state.isLoading) {
      return
    }

    set({ isLoading: true, error: null })

    try {
      // 平行載入 characters 和 factions
      const [characters, factions] = await Promise.all([
        fetchCharactersAPI(),
        fetchFactionsAPI(),
      ])

      set({
        characters,
        factions,
        isInitialized: true,
        isLoading: false,
        error: null,
      })

      console.log('[MetadataStore] ✅ Initialized:', {
        characters: characters.length,
        factions: factions.length,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      console.error('[MetadataStore] ❌ Initialize failed:', err)
      set({
        error: err,
        isLoading: false,
      })
    }
  },

  // Fetch Characters
  fetchCharacters: async () => {
    set({ isLoading: true, error: null })

    try {
      const characters = await fetchCharactersAPI()
      set({
        characters,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      console.error('[MetadataStore] Failed to fetch characters:', err)
      set({
        error: err,
        isLoading: false,
      })
    }
  },

  // Fetch Factions
  fetchFactions: async () => {
    set({ isLoading: true, error: null })

    try {
      const factions = await fetchFactionsAPI()
      set({
        factions,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      console.error('[MetadataStore] Failed to fetch factions:', err)
      set({
        error: err,
        isLoading: false,
      })
    }
  },

  // Getter: 取得角色名稱
  getCharacterName: (key: string) => {
    const character = get().characters.find(c => c.key === key)
    if (character) {
      return character.name
    }
    // Fallback: 如果找不到，返回 key
    console.warn(`[MetadataStore] Character not found: ${key}`)
    return key
  },

  // Getter: 取得陣營名稱
  getFactionName: (key: string) => {
    const faction = get().factions.find(f => f.key === key)
    if (faction) {
      return faction.name
    }
    // Fallback: 如果找不到，返回 key
    console.warn(`[MetadataStore] Faction not found: ${key}`)
    return key
  },

  // Getter: 取得業力名稱
  getKarmaName: (key: string) => {
    return KARMA_ALIGNMENTS[key] || key
  },
}))
