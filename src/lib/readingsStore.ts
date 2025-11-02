import { create } from 'zustand'
import { readingsAPI } from '@/lib/api'
import type { ReadingSession } from '@/types/session'

// Enhanced Reading Categories
export interface ReadingCategory {
  id: string
  name: string
  color: string
  description?: string
  icon?: string
}

export interface ReadingNote {
  id: string
  content: string
  created_at: string
  updated_at?: string
  type: 'note' | 'insight' | 'reflection' | 'follow_up'
}

export interface ReadingStatistics {
  total_readings: number
  favorite_readings: number
  readings_by_spread: Record<string, number>
  readings_by_month: Record<string, number>
  most_used_cards: Record<string, number>
  average_interpretation_length: number
  reading_streak: number
  last_reading_date?: string
}

export interface Reading {
  id: string
  user_id?: string
  question: string
  spread_type: string // Legacy field for backward compatibility
  spread_template?: {
    id: string
    name: string
    display_name: string
    description: string
    spread_type: string
    card_count: number
    positions: any[]
    difficulty_level?: string
  } // New structured spread template data
  cards_drawn: any[]
  interpretation?: string
  character_voice?: string
  karma_context?: string
  faction_influence?: string
  created_at?: string
  updated_at?: string
  is_favorite?: boolean
  notes?: string // Basic notes (legacy)
  detailed_notes?: ReadingNote[] // Enhanced notes system
  category_id?: string
  custom_category?: string
  privacy_level?: 'private' | 'shared' | 'public'
  reading_duration?: number // Time spent on reading in minutes
  mood_before?: string
  mood_after?: string
  accuracy_rating?: number // 1-5 scale
  follow_up_date?: string
  archived?: boolean
  _offline?: boolean // Flag for offline-created readings

  // AI Interpretation (NEW)
  overall_interpretation?: string
  summary_message?: string
  prediction_confidence?: number
  ai_interpretation_requested?: boolean
  ai_interpretation_at?: string
  ai_interpretation_provider?: string
}

interface ReadingsState {
  readings: Reading[]
  byId: Record<string, Reading>
  categories: ReadingCategory[]
  statistics: ReadingStatistics | null
  isLoading: boolean
  error: string | null
  lastFetched: number | null

  // Core CRUD operations
  fetchUserReadings: (userId: string, force?: boolean) => Promise<void>
  createReading: (data: Omit<Reading, 'id'>) => Promise<Reading | null>
  updateReading: (id: string, data: Partial<Reading>) => Promise<Reading | null>
  deleteReading: (id: string) => Promise<boolean>
  duplicateReading: (id: string) => Promise<Reading | null>

  // AI Interpretation (NEW)
  requestAIInterpretation: (id: string, provider?: 'openai' | 'gemini') => Promise<Reading | null>
  patchReading: (id: string, data: Partial<Reading>) => Promise<Reading | null>

  // Enhanced features
  toggleFavorite: (id: string) => Promise<void>
  toggleArchived: (id: string) => Promise<void>
  addNote: (readingId: string, note: Omit<ReadingNote, 'id' | 'created_at'>) => Promise<void>
  updateNote: (readingId: string, noteId: string, content: string) => Promise<void>
  deleteNote: (readingId: string, noteId: string) => Promise<void>

  // Categories
  createCategory: (category: Omit<ReadingCategory, 'id'>) => ReadingCategory
  updateCategory: (id: string, data: Partial<ReadingCategory>) => void
  deleteCategory: (id: string) => void
  assignCategory: (readingId: string, categoryId: string | null) => Promise<void>

  // Statistics and analytics
  calculateStatistics: () => ReadingStatistics
  getReadingsByPeriod: (period: 'week' | 'month' | 'year') => Reading[]
  getReadingStreak: () => number

  // Advanced search and filtering
  searchReadings: (query: string, filters?: SearchFilters) => Reading[]
  getReadingsByCategory: (categoryId: string) => Reading[]

  // Utility functions
  clearError: () => void
  exportReadings: (format: 'json' | 'csv', readingIds?: string[]) => string
  importReadings: (data: Reading[]) => Promise<void>
}

export interface SearchFilters {
  category?: string
  spreadType?: string
  dateRange?: { start: Date; end: Date }
  isFavorite?: boolean
  isArchived?: boolean
  accuracyRating?: number[]
  hasNotes?: boolean
}

// LocalStorage utility for offline functionality
const READINGS_STORAGE_KEY = 'wasteland_tarot_readings'
const CATEGORIES_STORAGE_KEY = 'wasteland_tarot_categories'

interface LocalStorageReadings {
  readings: Reading[]
  categories?: ReadingCategory[]
  lastSync: number
}

const loadFromLocalStorage = (): Reading[] => {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(READINGS_STORAGE_KEY)
    if (stored) {
      const data: LocalStorageReadings = JSON.parse(stored)
      return data.readings || []
    }
  } catch (error) {
    console.warn('Failed to load readings from localStorage:', error)
  }
  return []
}

const saveToLocalStorage = (readings: Reading[]) => {
  if (typeof window === 'undefined') return
  try {
    const data: LocalStorageReadings = {
      readings,
      lastSync: Date.now()
    }
    localStorage.setItem(READINGS_STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.warn('Failed to save readings to localStorage:', error)
  }
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Default categories
const DEFAULT_CATEGORIES: ReadingCategory[] = [
  { id: 'personal', name: '個人成長', color: '#10B981', description: '關於個人發展和自我提升的占卜', icon: '🌱' },
  { id: 'relationship', name: '感情關係', color: '#F59E0B', description: '愛情、友誼和家庭關係的占卜', icon: '💕' },
  { id: 'career', name: '事業財運', color: '#3B82F6', description: '工作、職涯和金錢相關的占卜', icon: '💼' },
  { id: 'spiritual', name: '靈性探索', color: '#8B5CF6', description: '靈性成長和內在探索的占卜', icon: '✨' },
  { id: 'daily', name: '日常指引', color: '#6B7280', description: '日常生活的指引和建議', icon: '🌟' },
]

export const useReadingsStore = create<ReadingsState>((set, get) => {
  // Initialize with localStorage data
  const initialReadings = loadFromLocalStorage()
  const initialById: Record<string, Reading> = {}
  initialReadings.forEach(r => { initialById[r.id] = r })

  return {
    readings: initialReadings,
    byId: initialById,
    categories: DEFAULT_CATEGORIES,
    statistics: null,
    isLoading: false,
    error: null,
    lastFetched: null,

    fetchUserReadings: async (userId: string, force = false) => {
      const { lastFetched, isLoading } = get()
      if (!force && !isLoading && lastFetched && Date.now() - lastFetched < CACHE_TTL) return
      set({ isLoading: true, error: null })
      try {
        const response = await readingsAPI.getUserReadings(userId)
        // API 回傳格式: { readings: Reading[], total_count, page, page_size, has_more }
        const readings = response.readings || []
        const map: Record<string, Reading> = {}
        readings.forEach(r => { map[r.id] = r })

        // Save to localStorage for offline access
        saveToLocalStorage(readings)

        set({ readings, byId: map, isLoading: false, lastFetched: Date.now() })
      } catch (e: any) {
        // On API failure, try to use localStorage data
        const localReadings = loadFromLocalStorage()
        if (localReadings.length > 0) {
          const map: Record<string, Reading> = {}
          localReadings.forEach(r => { map[r.id] = r })
          set({
            readings: localReadings,
            byId: map,
            isLoading: false,
            error: '離線模式 - 顯示已快取的占卜記錄'
          })
        } else {
          set({ error: e?.message || '讀取占卜失敗', isLoading: false })
        }
      }
    },

    createReading: async (data) => {
      set({ isLoading: true, error: null })
      try {
        // API expects different field names (cards_drawn etc.) - adapt
        const created = await readingsAPI.create({
          question: data.question,
          spread_type: data.spread_type,
          cards_drawn: data.cards_drawn,
          interpretation: data.interpretation,
          character_voice: data.character_voice,
          karma_context: data.karma_context,
          faction_influence: data.faction_influence
        })

        const newState = {
          readings: [created, ...get().readings],
          byId: { ...get().byId, [created.id]: created },
          isLoading: false
        }

        // Save updated readings to localStorage
        saveToLocalStorage(newState.readings)

        set(newState)
        return created
      } catch (e: any) {
        // For offline mode, create a temporary reading with offline flag
        const offlineReading: Reading = {
          id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...data,
          created_at: new Date().toISOString(),
          is_favorite: false,
          _offline: true // Mark as offline
        }

        const newState = {
          readings: [offlineReading, ...get().readings],
          byId: { ...get().byId, [offlineReading.id]: offlineReading },
          isLoading: false,
          error: '離線模式 - 占卜已儲存至本地，聯網後將同步'
        }

        // Save to localStorage
        saveToLocalStorage(newState.readings)

        set(newState)
        return offlineReading
      }
    },

    updateReading: async (id, data) => {
      set({ isLoading: true, error: null })
      try {
        const updated = await readingsAPI.update(id, data)
        const newState = {
          readings: get().readings.map(r => r.id === id ? updated : r),
          byId: { ...get().byId, [id]: updated },
          isLoading: false
        }

        // Save to localStorage
        saveToLocalStorage(newState.readings)

        set(newState)
        return updated
      } catch (e: any) {
        // For offline mode, update locally
        const current = get().byId[id]
        if (current) {
          const updated = { ...current, ...data, updated_at: new Date().toISOString(), _offline: true }
          const newState = {
            readings: get().readings.map(r => r.id === id ? updated : r),
            byId: { ...get().byId, [id]: updated },
            isLoading: false,
            error: '離線模式 - 更新已儲存至本地，聯網後將同步'
          }

          // Save to localStorage
          saveToLocalStorage(newState.readings)

          set(newState)
          return updated
        }

        set({ error: e?.message || '更新占卜失敗', isLoading: false })
        return null
      }
    },

    // PATCH reading (for AI interpretation updates)
    patchReading: async (id: string, data: Partial<Reading>) => {
      set({ isLoading: true, error: null })
      try {
        const updated = await readingsAPI.patch(id, data)
        const newState = {
          readings: get().readings.map(r => r.id === id ? updated : r),
          byId: { ...get().byId, [id]: updated },
          isLoading: false
        }

        // Save to localStorage
        saveToLocalStorage(newState.readings)

        set(newState)
        return updated
      } catch (e: any) {
        set({ error: e?.message || '更新占卜失敗', isLoading: false })
        return null
      }
    },

    // Request AI interpretation (one-time only)
    requestAIInterpretation: async (id: string, provider: 'openai' | 'gemini' = 'openai') => {
      const current = get().byId[id]
      if (!current) {
        set({ error: '找不到此占卜記錄' })
        return null
      }

      // Check if already requested
      if (current.ai_interpretation_requested) {
        set({ error: 'AI 解讀已經使用過，無法再次請求' })
        return null
      }

      set({ isLoading: true, error: null })

      try {
        // Debug: log the COMPLETE reading object
        console.log('[requestAIInterpretation] 完整的 Reading 物件:', JSON.parse(JSON.stringify(current)))

        // Debug: log the reading structure
        console.log('[requestAIInterpretation] Reading 資料結構分析:', {
          hasCardPositions: 'card_positions' in current,
          cardPositionsLength: (current as any).card_positions?.length,
          cardPositionsData: (current as any).card_positions,
          hasCardsDrawn: 'cards_drawn' in current,
          cardsDrawnLength: (current as any).cards_drawn?.length,
          cardsDrawnData: (current as any).cards_drawn,
          keys: Object.keys(current),
          readingId: current.id,
          createdAt: current.created_at,
        })

        // Extract card IDs from card_positions
        const cardIds: string[] = []

        // Support both new (card_positions) and legacy (cards_drawn) structures
        if ('card_positions' in current && current.card_positions && current.card_positions.length > 0) {
          console.log('[requestAIInterpretation] 使用 card_positions')
          cardIds.push(...current.card_positions.map(pos => {
            console.log('[requestAIInterpretation] Position:', pos)
            return pos.card_id
          }))
        } else if ('cards_drawn' in current && (current as any).cards_drawn && (current as any).cards_drawn.length > 0) {
          // Legacy: extract card_id from cards_drawn
          console.log('[requestAIInterpretation] 使用 cards_drawn (legacy)')
          cardIds.push(...(current as any).cards_drawn
            .map((card: any) => {
              console.log('[requestAIInterpretation] Card:', card)
              return card.card_id || card.id
            })
            .filter(Boolean))
        }

        console.log('[requestAIInterpretation] 提取的 card IDs:', cardIds)

        if (cardIds.length === 0) {
          const errorDetails = {
            hasCardPositions: 'card_positions' in current,
            cardPositionsIsArray: Array.isArray((current as any).card_positions),
            cardPositionsLength: (current as any).card_positions?.length,
            hasCardsDrawn: 'cards_drawn' in current,
            cardsDrawnIsArray: Array.isArray((current as any).cards_drawn),
            cardsDrawnLength: (current as any).cards_drawn?.length,
            readingId: current.id,
            createdAt: current.created_at,
            spreadType: current.spread_type,
          }
          console.error('[requestAIInterpretation] 找不到卡牌資料，詳細資訊:', errorDetails)
          throw new Error(
            '此占卜記錄沒有卡牌資料。' +
            '\n可能原因：' +
            '\n1. 這是舊的占卜記錄（在新架構之前建立）' +
            '\n2. 占卜尚未完成' +
            '\n3. 資料庫記錄不完整' +
            '\n\n建議：請建立一個新的占卜來使用 AI 解讀功能。'
          )
        }

        console.log('[requestAIInterpretation] 呼叫後端 streaming API', {
          readingId: id,
          cardIds,
          question: current.question,
          spread_type: current.spread_type,
          character_voice: current.character_voice_used,
          karma: current.karma_context,
          faction: current.faction_influence,
        })

        // Call backend streaming API
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
        const response = await fetch(`${API_BASE_URL}/api/v1/readings/interpretation/stream-multi`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('pip-boy-token') || ''}`,
          },
          body: JSON.stringify({
            card_ids: cardIds,
            question: current.question || '未指定問題',
            character_voice: current.character_voice_used || 'PIP_BOY',
            karma_alignment: current.karma_context || 'NEUTRAL',
            faction_alignment: current.faction_influence || null,
            spread_type: current.spread_type || 'three_card',
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        // Read SSE stream
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let interpretation = ''

        if (!reader) {
          throw new Error('無法讀取回應串流')
        }

        console.log('[requestAIInterpretation] 開始接收 AI 串流')

        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            console.log('[requestAIInterpretation] 串流結束')
            break
          }

          // Decode chunk
          const chunk = decoder.decode(value, { stream: true })

          // Parse SSE format: "data: {text}\n\n"
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6).trim()

              // Check for completion signal
              if (data === '[DONE]') {
                console.log('[requestAIInterpretation] 收到完成信號')
                break
              }

              // Check for error signal
              if (data.startsWith('[ERROR]')) {
                const errorMsg = data.substring(7).trim()
                console.error('[requestAIInterpretation] 收到錯誤:', errorMsg)
                throw new Error(errorMsg)
              }

              // Append to interpretation
              interpretation += data
            }
          }
        }

        console.log('[requestAIInterpretation] AI 解讀完成', {
          length: interpretation.length,
          preview: interpretation.substring(0, 100),
        })

        // Prepare AI response data
        const aiResponse = {
          overall_interpretation: interpretation,
          summary_message: "AI 已完成解讀",
          prediction_confidence: 0.85,
          ai_interpretation_requested: true,
          ai_interpretation_at: new Date().toISOString(),
          ai_interpretation_provider: provider,
        }

        // 使用 PATCH 更新 Reading（Backend 會檢查一次性限制）
        console.log('[requestAIInterpretation] 儲存 AI 解讀到資料庫')
        const updated = await readingsAPI.patch(id, aiResponse)

        const newState = {
          readings: get().readings.map(r => r.id === id ? updated : r),
          byId: { ...get().byId, [id]: updated },
          isLoading: false
        }

        // Save to localStorage
        saveToLocalStorage(newState.readings)

        set(newState)
        console.log('[requestAIInterpretation] 成功完成')
        return updated
      } catch (e: any) {
        console.error('[requestAIInterpretation] 錯誤:', e)
        // Check if 403 error (already requested)
        if (e?.status === 403) {
          set({ error: 'AI 解讀已經使用過，無法再次請求', isLoading: false })
        } else {
          set({ error: e?.message || '請求 AI 解讀失敗', isLoading: false })
        }
        return null
      }
    },

    deleteReading: async (id) => {
      set({ isLoading: true, error: null })
      try {
        await readingsAPI.delete(id)
        const newState = {
          readings: get().readings.filter(r => r.id !== id),
          byId: { ...get().byId },
          isLoading: false
        }
        delete newState.byId[id]

        // Save to localStorage
        saveToLocalStorage(newState.readings)

        set(newState)
        return true
      } catch (e: any) {
        set({ error: e?.message || '刪除占卜失敗', isLoading: false })
        return false
      }
    },

    toggleFavorite: async (id) => {
      const current = get().byId[id]
      if (!current) return

      // optimistic update
      const optimisticReading = { ...current, is_favorite: !current.is_favorite }
      set(state => {
        const newState = {
          readings: state.readings.map(r => r.id === id ? optimisticReading : r),
          byId: { ...state.byId, [id]: optimisticReading }
        }
        // Save to localStorage
        saveToLocalStorage(newState.readings)
        return newState
      })

      try {
        await readingsAPI.update(id, { is_favorite: !current.is_favorite })
      } catch (e) {
        // rollback on failure
        set(state => {
          const rolledBack = { ...current, is_favorite: current.is_favorite }
          const newState = {
            readings: state.readings.map(r => r.id === id ? rolledBack : r),
            byId: { ...state.byId, [id]: rolledBack }
          }
          // Save rollback to localStorage
          saveToLocalStorage(newState.readings, get().categories)
          return newState
        })
      }
    },

    duplicateReading: async (id: string) => {
      const original = get().byId[id]
      if (!original) return null

      const duplicated: Omit<Reading, 'id'> = {
        ...original,
        question: `${original.question} (副本)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        detailed_notes: original.detailed_notes?.map(note => ({
          ...note,
          id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString()
        }))
      }

      return await get().createReading(duplicated)
    },

    toggleArchived: async (id: string) => {
      const current = get().byId[id]
      if (!current) return

      await get().updateReading(id, { archived: !current.archived })
    },

    addNote: async (readingId: string, note: Omit<ReadingNote, 'id' | 'created_at'>) => {
      const current = get().byId[readingId]
      if (!current) return

      const newNote: ReadingNote = {
        ...note,
        id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString()
      }

      const updatedNotes = [...(current.detailed_notes || []), newNote]
      await get().updateReading(readingId, { detailed_notes: updatedNotes })
    },

    updateNote: async (readingId: string, noteId: string, content: string) => {
      const current = get().byId[readingId]
      if (!current || !current.detailed_notes) return

      const updatedNotes = current.detailed_notes.map(note =>
        note.id === noteId
          ? { ...note, content, updated_at: new Date().toISOString() }
          : note
      )

      await get().updateReading(readingId, { detailed_notes: updatedNotes })
    },

    deleteNote: async (readingId: string, noteId: string) => {
      const current = get().byId[readingId]
      if (!current || !current.detailed_notes) return

      const updatedNotes = current.detailed_notes.filter(note => note.id !== noteId)
      await get().updateReading(readingId, { detailed_notes: updatedNotes })
    },

    createCategory: (category: Omit<ReadingCategory, 'id'>) => {
      const newCategory: ReadingCategory = {
        ...category,
        id: `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      set(state => ({ categories: [...state.categories, newCategory] }))
      return newCategory
    },

    updateCategory: (id: string, data: Partial<ReadingCategory>) => {
      set(state => ({
        categories: state.categories.map(cat =>
          cat.id === id ? { ...cat, ...data } : cat
        )
      }))
    },

    deleteCategory: (id: string) => {
      // Remove category from all readings first
      set(state => {
        const updatedReadings = state.readings.map(reading =>
          reading.category_id === id
            ? { ...reading, category_id: undefined }
            : reading
        )
        const updatedById = { ...state.byId }
        updatedReadings.forEach(r => { updatedById[r.id] = r })

        // Save to localStorage
        saveToLocalStorage(updatedReadings)

        return {
          readings: updatedReadings,
          byId: updatedById,
          categories: state.categories.filter(cat => cat.id !== id)
        }
      })
    },

    assignCategory: async (readingId: string, categoryId: string | null) => {
      await get().updateReading(readingId, { category_id: categoryId })
    },

    calculateStatistics: (): ReadingStatistics => {
      const readings = get().readings.filter(r => !r.archived)
      const now = new Date()

      const stats: ReadingStatistics = {
        total_readings: readings.length,
        favorite_readings: readings.filter(r => r.is_favorite).length,
        readings_by_spread: {},
        readings_by_month: {},
        most_used_cards: {},
        average_interpretation_length: 0,
        reading_streak: get().getReadingStreak(),
        last_reading_date: readings.length > 0 ? readings[0].created_at : undefined
      }

      // Calculate spread type distribution
      readings.forEach(r => {
        // CRITICAL FIX: Use spread_template.spread_type for new readings
        // Fallback to r.spread_type for legacy readings
        const spreadType = r.spread_template?.spread_type || r.spread_type || 'unknown'
        stats.readings_by_spread[spreadType] = (stats.readings_by_spread[spreadType] || 0) + 1
      })

      // Calculate monthly distribution
      readings.forEach(r => {
        if (r.created_at) {
          const month = new Date(r.created_at).toISOString().substring(0, 7) // YYYY-MM
          stats.readings_by_month[month] = (stats.readings_by_month[month] || 0) + 1
        }
      })

      // Calculate card usage
      // Support both new (card_positions) and legacy (cards_drawn) structures
      readings.forEach(r => {
        // New structure: card_positions
        if ('card_positions' in r && (r as any).card_positions) {
          (r as any).card_positions.forEach((pos: any) => {
            const cardName = pos.card?.name || pos.name || 'Unknown'
            stats.most_used_cards[cardName] = (stats.most_used_cards[cardName] || 0) + 1
          })
        }
        // Legacy structure: cards_drawn
        else if (r.cards_drawn) {
          r.cards_drawn.forEach(card => {
            const cardName = card.name || 'Unknown'
            stats.most_used_cards[cardName] = (stats.most_used_cards[cardName] || 0) + 1
          })
        }
      })

      // Calculate average interpretation length
      // Support both new (overall_interpretation) and legacy (interpretation) fields
      const interpretations = readings.filter(r =>
        (r as any).overall_interpretation || r.interpretation
      )
      if (interpretations.length > 0) {
        const totalLength = interpretations.reduce((sum, r) => {
          const text = (r as any).overall_interpretation || r.interpretation || ''
          return sum + text.length
        }, 0)
        stats.average_interpretation_length = Math.round(totalLength / interpretations.length)
      }

      return stats
    },

    getReadingsByPeriod: (period: 'week' | 'month' | 'year') => {
      const now = new Date()
      const readings = get().readings

      return readings.filter(reading => {
        if (!reading.created_at) return false

        const readingDate = new Date(reading.created_at)
        const diffTime = now.getTime() - readingDate.getTime()

        switch (period) {
          case 'week':
            return diffTime <= 7 * 24 * 60 * 60 * 1000
          case 'month':
            return diffTime <= 30 * 24 * 60 * 60 * 1000
          case 'year':
            return diffTime <= 365 * 24 * 60 * 60 * 1000
          default:
            return false
        }
      })
    },

    getReadingStreak: () => {
      const readings = get().readings.filter(r => !r.archived)
      if (readings.length === 0) return 0

      // Sort by date descending
      const sortedReadings = readings
        .filter(r => r.created_at)
        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())

      let streak = 0
      let currentDate = new Date()
      currentDate.setHours(23, 59, 59, 999) // End of today

      for (const reading of sortedReadings) {
        const readingDate = new Date(reading.created_at!)
        readingDate.setHours(0, 0, 0, 0) // Start of reading day

        const daysDiff = Math.floor((currentDate.getTime() - readingDate.getTime()) / (24 * 60 * 60 * 1000))

        if (daysDiff <= 1) { // Same day or yesterday
          streak++
          currentDate = readingDate
        } else {
          break
        }
      }

      return streak
    },

    searchReadings: (query: string, filters?: SearchFilters) => {
      const readings = get().readings.filter(r => !r.archived)
      let filtered = readings

      // Text search
      if (query.trim()) {
        const q = query.toLowerCase()
        filtered = filtered.filter(r =>
          r.question.toLowerCase().includes(q) ||
          (r.interpretation || '').toLowerCase().includes(q) ||
          (r.notes || '').toLowerCase().includes(q) ||
          r.detailed_notes?.some(note => note.content.toLowerCase().includes(q))
        )
      }

      // Apply filters
      if (filters) {
        if (filters.category) {
          filtered = filtered.filter(r => r.category_id === filters.category)
        }

        if (filters.spreadType) {
          filtered = filtered.filter(r => r.spread_type === filters.spreadType)
        }

        if (filters.isFavorite !== undefined) {
          filtered = filtered.filter(r => r.is_favorite === filters.isFavorite)
        }

        if (filters.isArchived !== undefined) {
          filtered = filtered.filter(r => (r.archived || false) === filters.isArchived)
        }

        if (filters.hasNotes !== undefined) {
          filtered = filtered.filter(r => {
            const hasNotes = !!(r.notes || r.detailed_notes?.length)
            return hasNotes === filters.hasNotes
          })
        }

        if (filters.dateRange) {
          filtered = filtered.filter(r => {
            if (!r.created_at) return false
            const date = new Date(r.created_at)
            return date >= filters.dateRange!.start && date <= filters.dateRange!.end
          })
        }

        if (filters.accuracyRating && filters.accuracyRating.length > 0) {
          filtered = filtered.filter(r =>
            r.accuracy_rating && filters.accuracyRating!.includes(r.accuracy_rating)
          )
        }
      }

      return filtered
    },

    getReadingsByCategory: (categoryId: string) => {
      const readings = get().readings.filter(r => !r.archived)
      return readings.filter(r => r.category_id === categoryId)
    },

    exportReadings: (format: 'json' | 'csv', readingIds?: string[]) => {
      const allReadings = get().readings
      const readingsToExport = readingIds
        ? allReadings.filter(r => readingIds.includes(r.id))
        : allReadings

      if (format === 'json') {
        return JSON.stringify(readingsToExport, null, 2)
      } else {
        // CSV format
        const headers = [
          'ID', 'Question', 'Spread Type', 'Created At', 'Is Favorite',
          'Category', 'Cards', 'Interpretation'
        ]

        const rows = readingsToExport.map(r => [
          r.id,
          `"${r.question.replace(/"/g, '""')}"`,
          r.spread_type,
          r.created_at || '',
          r.is_favorite ? 'Yes' : 'No',
          r.category_id || '',
          r.cards_drawn?.map(c => c.name).join(';') || '',
          `"${(r.interpretation || '').replace(/"/g, '""')}"`
        ])

        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
      }
    },

    importReadings: async (data: Reading[]) => {
      // Validate and sanitize imported data
      const validReadings = data.filter(r => r.id && r.question && r.spread_type)

      // Merge with existing readings, avoiding duplicates
      const existingIds = new Set(get().readings.map(r => r.id))
      const newReadings = validReadings.filter(r => !existingIds.has(r.id))

      if (newReadings.length > 0) {
        const updatedReadings = [...get().readings, ...newReadings]
        const updatedById = { ...get().byId }
        newReadings.forEach(r => { updatedById[r.id] = r })

        // Save to localStorage
        saveToLocalStorage(updatedReadings)

        set({
          readings: updatedReadings,
          byId: updatedById
        })
      }
    },

    clearError: () => set({ error: null })
  }
})