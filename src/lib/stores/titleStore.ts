import { create } from 'zustand'
import { api } from '@/lib/apiClient'
import { z } from 'zod'

// ============================================================================
// Inline Zod Schemas
// ============================================================================

const UserTitlesResponseSchema = z.object({
  current_title: z.string().nullable(),
  unlocked_titles: z.array(z.string()),
})

const SetTitleResponseSchema = z.object({
  current_title: z.string().nullable(),
  message: z.string(),
})

export type UserTitlesResponse = z.infer<typeof UserTitlesResponseSchema>
export type SetTitleResponse = z.infer<typeof SetTitleResponseSchema>

// ============================================================================
// Title Store State
// ============================================================================

interface TitleState {
  currentTitle: string | null
  unlockedTitles: string[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchTitles: () => Promise<void>
  setTitle: (title: string | null) => Promise<boolean>
  clearError: () => void
}

export const useTitleStore = create<TitleState>((set, get) => ({
  currentTitle: null,
  unlockedTitles: [],
  isLoading: false,
  error: null,

  fetchTitles: async () => {
    set({ isLoading: true, error: null })
    try {
      // api.get automatically adds /api/v1 prefix
      const data = await api.get<UserTitlesResponse>('/users/me/titles')

      // Validate response
      const validated = UserTitlesResponseSchema.parse(data)

      set({
        currentTitle: validated.current_title,
        unlockedTitles: validated.unlocked_titles,
        isLoading: false,
      })
    } catch (error) {
      console.error('[TitleStore] Failed to fetch titles:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to load titles',
        isLoading: false,
      })
    }
  },

  setTitle: async (title: string | null) => {
    set({ isLoading: true, error: null })
    try {
      // api.put automatically adds /api/v1 prefix
      const data = await api.put<SetTitleResponse>('/users/me/title', { title })

      // Validate response
      const validated = SetTitleResponseSchema.parse(data)

      set({
        currentTitle: validated.current_title,
        isLoading: false,
      })

      console.log('[TitleStore] Title updated successfully:', validated.message)
      return true
    } catch (error) {
      console.error('[TitleStore] Failed to set title:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to update title',
        isLoading: false,
      })
      return false
    }
  },

  clearError: () => set({ error: null }),
}))