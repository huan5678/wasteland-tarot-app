import { create } from 'zustand'
import { apiRequest } from '@/lib/api'

export interface SpreadTemplate {
  id: string
  name: string
  display_name: string
  description: string
  spread_type: string
  card_count: number
  positions: any[]
  interpretation_guide?: string
  difficulty_level?: string
  tags?: string[]
  is_active?: boolean
}

interface SpreadTemplateState {
  templates: SpreadTemplate[]
  byId: Record<string, SpreadTemplate>
  isLoading: boolean
  error: string | null
  fetchAll: (force?: boolean) => Promise<void>
}

const TTL = 10 * 60 * 1000

export const useSpreadTemplatesStore = create<SpreadTemplateState>((set, get) => ({
  templates: [],
  byId: {},
  isLoading: false,
  error: null,
  fetchAll: async (force=false) => {
    const state = get()
    if (!force && state.templates.length && (Date.now() - (state as any)._ts < TTL)) return
    set({ isLoading: true, error: null })
    try {
      const data = await apiRequest<SpreadTemplate[]>('/api/v1/spread-templates/')
      const map: Record<string, SpreadTemplate> = {}
      data.forEach(t => { map[t.id] = t })
      set({ templates: data, byId: map, isLoading: false, error: null, _ts: Date.now() } as any)
    } catch (e: any) {
      set({ error: e?.message || '讀取牌陣模板失敗', isLoading: false })
    }
  }
}))
