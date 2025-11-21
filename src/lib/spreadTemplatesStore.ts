import { create } from 'zustand'
import { SpreadService } from '@/services/spreads.service'

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
      const response = await SpreadService.getAll()
      // API 回傳格式: { spreads: [...], total_count: N, page: 1, page_size: 20 }
      // Note: Service type says SpreadTemplate[] but runtime might be object if backend is paginated
      const data = Array.isArray(response) ? response : (response as any).spreads || []
      const map: Record<string, SpreadTemplate> = {}
      data.forEach((t: SpreadTemplate) => { map[t.id] = t })
      set({ templates: data, byId: map, isLoading: false, error: null, _ts: Date.now() } as any)
    } catch (e: any) {
      set({ error: e?.message || '讀取牌陣模板失敗', isLoading: false })
    }
  }
}))