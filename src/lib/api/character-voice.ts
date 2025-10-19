/**
 * Character Voice System API Client
 * 角色聲音系統的 API 客戶端函數
 */

import { apiClient } from './client'
import type {
  Character,
  CharacterCreate,
  CharacterUpdate,
  CharacterWithInterpretationsCount,
  CharacterQueryParams,
  Faction,
  FactionCreate,
  FactionUpdate,
  FactionWithCharacters,
  FactionQueryParams,
  FactionCharacter,
  FactionCharacterCreate,
  CardInterpretation,
  CardInterpretationCreate,
  CardInterpretationUpdate,
  CardInterpretationWithDetails,
  InterpretationQueryParams,
  BulkInterpretationCreate,
  BulkOperationResponse,
  InterpretationStats,
} from '@/types/character-voice'

// ============================================================================
// Characters API
// ============================================================================

/**
 * 取得角色列表
 */
export async function getCharacters(params?: CharacterQueryParams): Promise<Character[]> {
  const queryParams = new URLSearchParams()
  if (params?.is_active !== undefined) queryParams.set('is_active', String(params.is_active))
  if (params?.search) queryParams.set('search', params.search)
  if (params?.skip !== undefined) queryParams.set('skip', String(params.skip))
  if (params?.limit !== undefined) queryParams.set('limit', String(params.limit))

  const query = queryParams.toString()
  const url = `/api/v1/characters/${query ? `?${query}` : ''}`

  return apiClient.get<Character[]>(url)
}

/**
 * 取得角色列表（含解讀數量）
 */
export async function getCharactersWithCounts(
  params?: CharacterQueryParams
): Promise<CharacterWithInterpretationsCount[]> {
  const queryParams = new URLSearchParams()
  if (params?.is_active !== undefined) queryParams.set('is_active', String(params.is_active))
  if (params?.skip !== undefined) queryParams.set('skip', String(params.skip))
  if (params?.limit !== undefined) queryParams.set('limit', String(params.limit))

  const query = queryParams.toString()
  const url = `/api/v1/characters/with-counts${query ? `?${query}` : ''}`

  return apiClient.get<CharacterWithInterpretationsCount[]>(url)
}

/**
 * 根據 ID 取得單一角色
 */
export async function getCharacterById(id: string): Promise<Character> {
  return apiClient.get<Character>(`/api/v1/characters/${id}`)
}

/**
 * 根據 key 取得單一角色
 */
export async function getCharacterByKey(key: string): Promise<Character> {
  return apiClient.get<Character>(`/api/v1/characters/by-key/${key}`)
}

/**
 * 建立新角色
 */
export async function createCharacter(data: CharacterCreate): Promise<Character> {
  return apiClient.post<Character>('/api/v1/characters/', data)
}

/**
 * 更新角色
 */
export async function updateCharacter(id: string, data: CharacterUpdate): Promise<Character> {
  return apiClient.put<Character>(`/api/v1/characters/${id}`, data)
}

/**
 * 刪除角色
 */
export async function deleteCharacter(id: string): Promise<void> {
  return apiClient.delete(`/api/v1/characters/${id}`)
}

// ============================================================================
// Factions API
// ============================================================================

/**
 * 取得陣營列表
 */
export async function getFactions(params?: FactionQueryParams): Promise<Faction[]> {
  const queryParams = new URLSearchParams()
  if (params?.is_active !== undefined) queryParams.set('is_active', String(params.is_active))
  if (params?.search) queryParams.set('search', params.search)
  if (params?.skip !== undefined) queryParams.set('skip', String(params.skip))
  if (params?.limit !== undefined) queryParams.set('limit', String(params.limit))

  const query = queryParams.toString()
  const url = `/api/v1/factions/${query ? `?${query}` : ''}`

  return apiClient.get<Faction[]>(url)
}

/**
 * 取得陣營列表（含關聯角色）
 */
export async function getFactionsWithCharacters(
  params?: FactionQueryParams
): Promise<FactionWithCharacters[]> {
  const queryParams = new URLSearchParams()
  if (params?.is_active !== undefined) queryParams.set('is_active', String(params.is_active))
  if (params?.skip !== undefined) queryParams.set('skip', String(params.skip))
  if (params?.limit !== undefined) queryParams.set('limit', String(params.limit))

  const query = queryParams.toString()
  const url = `/api/v1/factions/with-characters${query ? `?${query}` : ''}`

  return apiClient.get<FactionWithCharacters[]>(url)
}

/**
 * 根據 ID 取得單一陣營
 */
export async function getFactionById(id: string): Promise<Faction> {
  return apiClient.get<Faction>(`/api/v1/factions/${id}`)
}

/**
 * 根據 key 取得單一陣營
 */
export async function getFactionByKey(key: string): Promise<Faction> {
  return apiClient.get<Faction>(`/api/v1/factions/by-key/${key}`)
}

/**
 * 建立新陣營
 */
export async function createFaction(data: FactionCreate): Promise<Faction> {
  return apiClient.post<Faction>('/api/v1/factions/', data)
}

/**
 * 更新陣營
 */
export async function updateFaction(id: string, data: FactionUpdate): Promise<Faction> {
  return apiClient.put<Faction>(`/api/v1/factions/${id}`, data)
}

/**
 * 刪除陣營
 */
export async function deleteFaction(id: string): Promise<void> {
  return apiClient.delete(`/api/v1/factions/${id}`)
}

// ============================================================================
// Faction-Character Association API
// ============================================================================

/**
 * 將角色加入陣營
 */
export async function addCharacterToFaction(
  factionId: string,
  characterId: string,
  priority: number = 0
): Promise<FactionCharacter> {
  const url = `/api/v1/factions/${factionId}/characters/${characterId}?priority=${priority}`
  return apiClient.post<FactionCharacter>(url)
}

/**
 * 更新陣營-角色關聯的優先順序
 */
export async function updateFactionCharacterPriority(
  factionId: string,
  characterId: string,
  priority: number
): Promise<FactionCharacter> {
  const url = `/api/v1/factions/${factionId}/characters/${characterId}?priority=${priority}`
  return apiClient.put<FactionCharacter>(url)
}

/**
 * 從陣營中移除角色
 */
export async function removeCharacterFromFaction(
  factionId: string,
  characterId: string
): Promise<void> {
  return apiClient.delete(`/api/v1/factions/${factionId}/characters/${characterId}`)
}

/**
 * 取得陣營的所有角色
 */
export async function getFactionCharacters(factionId: string): Promise<FactionCharacter[]> {
  return apiClient.get<FactionCharacter[]>(`/api/v1/factions/${factionId}/characters`)
}

// ============================================================================
// Card Interpretations API
// ============================================================================

/**
 * 取得卡牌解讀列表
 */
export async function getInterpretations(
  params?: InterpretationQueryParams
): Promise<CardInterpretation[]> {
  const queryParams = new URLSearchParams()
  if (params?.card_id) queryParams.set('card_id', params.card_id)
  if (params?.character_id) queryParams.set('character_id', params.character_id)
  if (params?.is_active !== undefined) queryParams.set('is_active', String(params.is_active))
  if (params?.skip !== undefined) queryParams.set('skip', String(params.skip))
  if (params?.limit !== undefined) queryParams.set('limit', String(params.limit))

  const query = queryParams.toString()
  const url = `/api/v1/interpretations/${query ? `?${query}` : ''}`

  return apiClient.get<CardInterpretation[]>(url)
}

/**
 * 取得卡牌解讀列表（含詳細資訊）
 */
export async function getInterpretationsWithDetails(
  params?: InterpretationQueryParams
): Promise<CardInterpretationWithDetails[]> {
  const queryParams = new URLSearchParams()
  if (params?.card_id) queryParams.set('card_id', params.card_id)
  if (params?.character_id) queryParams.set('character_id', params.character_id)
  if (params?.is_active !== undefined) queryParams.set('is_active', String(params.is_active))
  if (params?.skip !== undefined) queryParams.set('skip', String(params.skip))
  if (params?.limit !== undefined) queryParams.set('limit', String(params.limit))

  const query = queryParams.toString()
  const url = `/api/v1/interpretations/with-details${query ? `?${query}` : ''}`

  return apiClient.get<CardInterpretationWithDetails[]>(url)
}

/**
 * 根據 ID 取得單一卡牌解讀
 */
export async function getInterpretationById(id: string): Promise<CardInterpretation> {
  return apiClient.get<CardInterpretation>(`/api/v1/interpretations/${id}`)
}

/**
 * 取得特定卡牌的所有解讀
 */
export async function getInterpretationsByCard(
  cardId: string,
  isActive?: boolean
): Promise<CardInterpretationWithDetails[]> {
  const queryParams = new URLSearchParams()
  if (isActive !== undefined) queryParams.set('is_active', String(isActive))

  const query = queryParams.toString()
  const url = `/api/v1/interpretations/by-card/${cardId}${query ? `?${query}` : ''}`

  return apiClient.get<CardInterpretationWithDetails[]>(url)
}

/**
 * 取得特定角色的所有解讀
 */
export async function getInterpretationsByCharacter(
  characterId: string,
  params?: Omit<InterpretationQueryParams, 'character_id'>
): Promise<CardInterpretationWithDetails[]> {
  const queryParams = new URLSearchParams()
  if (params?.is_active !== undefined) queryParams.set('is_active', String(params.is_active))
  if (params?.skip !== undefined) queryParams.set('skip', String(params.skip))
  if (params?.limit !== undefined) queryParams.set('limit', String(params.limit))

  const query = queryParams.toString()
  const url = `/api/v1/interpretations/by-character/${characterId}${query ? `?${query}` : ''}`

  return apiClient.get<CardInterpretationWithDetails[]>(url)
}

/**
 * 取得特定卡牌+角色的解讀
 */
export async function getInterpretationByCardAndCharacter(
  cardId: string,
  characterId: string
): Promise<CardInterpretationWithDetails> {
  const url = `/api/v1/interpretations/card/${cardId}/character/${characterId}`
  return apiClient.get<CardInterpretationWithDetails>(url)
}

/**
 * 建立新的卡牌解讀
 */
export async function createInterpretation(
  data: CardInterpretationCreate
): Promise<CardInterpretation> {
  return apiClient.post<CardInterpretation>('/api/v1/interpretations/', data)
}

/**
 * 批量建立卡牌解讀
 */
export async function createInterpretationsBulk(
  data: BulkInterpretationCreate
): Promise<BulkOperationResponse> {
  return apiClient.post<BulkOperationResponse>('/api/v1/interpretations/bulk', data)
}

/**
 * 更新卡牌解讀
 */
export async function updateInterpretation(
  id: string,
  data: CardInterpretationUpdate
): Promise<CardInterpretation> {
  return apiClient.put<CardInterpretation>(`/api/v1/interpretations/${id}`, data)
}

/**
 * 刪除卡牌解讀
 */
export async function deleteInterpretation(id: string): Promise<void> {
  return apiClient.delete(`/api/v1/interpretations/${id}`)
}

// ============================================================================
// Statistics API
// ============================================================================

/**
 * 取得解讀統計摘要
 */
export async function getInterpretationStats(): Promise<InterpretationStats> {
  return apiClient.get<InterpretationStats>('/api/v1/interpretations/stats/summary')
}
