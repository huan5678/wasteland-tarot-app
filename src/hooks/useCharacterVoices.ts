/**
 * useCharacterVoices Hook
 * 用於載入角色聲音和卡牌解讀資料
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getCharacters,
  getInterpretationsByCard,
  getFactionsWithCharacters,
} from '@/lib/api/character-voice'
import type {
  Character,
  CardInterpretationWithDetails,
  FactionWithCharacters,
} from '@/types/character-voice'

// 全域快取
const charactersCache: {
  data: Character[] | null
  timestamp: number | null
} = {
  data: null,
  timestamp: null,
}

const factionsCache: {
  data: FactionWithCharacters[] | null
  timestamp: number | null
} = {
  data: null,
  timestamp: null,
}

const interpretationsCache = new Map<string, {
  data: CardInterpretationWithDetails[]
  timestamp: number
}>()

// 快取有效期（5分鐘）
const CACHE_TTL = 5 * 60 * 1000

/**
 * 檢查快取是否有效
 */
function isCacheValid(timestamp: number | null): boolean {
  if (!timestamp) return false
  return Date.now() - timestamp < CACHE_TTL
}

/**
 * Hook: 載入所有角色資料
 */
export function useCharacters() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadCharacters = useCallback(async () => {
    // 檢查快取
    if (charactersCache.data && isCacheValid(charactersCache.timestamp)) {
      setCharacters(charactersCache.data)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getCharacters({ is_active: true })

      // 更新快取
      charactersCache.data = data
      charactersCache.timestamp = Date.now()

      setCharacters(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load characters')
      setError(error)
      console.error('Failed to load characters:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCharacters()
  }, [loadCharacters])

  return { characters, isLoading, error, reload: loadCharacters }
}

/**
 * Hook: 載入所有陣營資料（含關聯角色）
 */
export function useFactions() {
  const [factions, setFactions] = useState<FactionWithCharacters[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadFactions = useCallback(async () => {
    // 檢查快取
    if (factionsCache.data && isCacheValid(factionsCache.timestamp)) {
      setFactions(factionsCache.data)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getFactionsWithCharacters({ is_active: true })

      // 更新快取
      factionsCache.data = data
      factionsCache.timestamp = Date.now()

      setFactions(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load factions')
      setError(error)
      console.error('Failed to load factions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFactions()
  }, [loadFactions])

  return { factions, isLoading, error, reload: loadFactions }
}

/**
 * Hook: 載入特定卡牌的所有角色解讀
 */
export function useCardInterpretations(cardId: string | undefined) {
  const [interpretations, setInterpretations] = useState<CardInterpretationWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadInterpretations = useCallback(async () => {
    if (!cardId) {
      setInterpretations([])
      setIsLoading(false)
      return
    }

    // 檢查快取
    const cached = interpretationsCache.get(cardId)
    if (cached && isCacheValid(cached.timestamp)) {
      setInterpretations(cached.data)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getInterpretationsByCard(cardId, true) // 只載入啟用的解讀

      // 更新快取
      interpretationsCache.set(cardId, {
        data,
        timestamp: Date.now(),
      })

      setInterpretations(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load interpretations')
      setError(error)
      console.error('Failed to load interpretations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [cardId])

  useEffect(() => {
    loadInterpretations()
  }, [loadInterpretations])

  return { interpretations, isLoading, error, reload: loadInterpretations }
}

/**
 * Hook: 組合角色和解讀資料（用於 Reading Detail 頁面）
 *
 * 這個 Hook 整合了角色列表和特定卡牌的解讀，
 * 並將解讀資料轉換為舊格式的 character_voice_interpretations
 */
export function useCharacterVoicesWithInterpretations(cardId: string | undefined) {
  const { characters, isLoading: isLoadingCharacters, error: charactersError } = useCharacters()
  const { interpretations, isLoading: isLoadingInterpretations, error: interpretationsError } = useCardInterpretations(cardId)

  // 將解讀資料轉換為舊格式（相容現有程式碼）
  const characterVoiceInterpretations = useMemo(() => {
    if (!interpretations || interpretations.length === 0) {
      return {}
    }

    const result: Record<string, string> = {}

    interpretations.forEach((interp) => {
      if (interp.character_key && interp.interpretation_text) {
        result[interp.character_key] = interp.interpretation_text
      }
    })

    return result
  }, [interpretations])

  // 根據陣營過濾角色（相容現有的 filterCharacterVoicesByFaction）
  const filterByFaction = useCallback((factionInfluence?: string) => {
    if (!factionInfluence) {
      return characterVoiceInterpretations
    }

    // 這裡可以根據 factionInfluence 過濾角色
    // 暫時回傳所有解讀，因為後端已經有完整的陣營-角色關聯
    return characterVoiceInterpretations
  }, [characterVoiceInterpretations])

  return {
    characters,
    interpretations,
    characterVoiceInterpretations,
    filterByFaction,
    isLoading: isLoadingCharacters || isLoadingInterpretations,
    error: charactersError || interpretationsError,
  }
}

/**
 * Hook: 根據陣營過濾角色
 */
export function useCharactersByFaction(factionKey?: string) {
  const { factions, isLoading, error } = useFactions()

  const characters = useMemo(() => {
    if (!factionKey || !factions) {
      return []
    }

    const faction = factions.find((f) => f.key === factionKey)
    return faction?.characters || []
  }, [factions, factionKey])

  return { characters, isLoading, error }
}

/**
 * 清除所有快取（用於需要強制重新載入的情況）
 */
export function clearCharacterVoicesCache() {
  charactersCache.data = null
  charactersCache.timestamp = null
  factionsCache.data = null
  factionsCache.timestamp = null
  interpretationsCache.clear()
}

/**
 * 清除陣營快取
 */
export function clearFactionsCache() {
  factionsCache.data = null
  factionsCache.timestamp = null
}
