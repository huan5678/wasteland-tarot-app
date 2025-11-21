import { api } from '@/lib/apiClient';
import type {
  Character,
  CharacterCreate,
  CharacterUpdate,
  Faction,
  FactionCreate,
  FactionUpdate,
  FactionWithCharacters,
  CardInterpretation,
  CardInterpretationWithDetails,
  CardInterpretationCreate,
  CardInterpretationUpdate,
  CharacterQueryParams,
  FactionQueryParams,
  InterpretationQueryParams,
} from '@/types/character-voice';

const BASE_PATH = '/character-voice';

// ============================================================================
// Character API
// ============================================================================

export const getCharacters = async (params?: CharacterQueryParams): Promise<Character[]> => {
  const query = new URLSearchParams();
  if (params?.is_active !== undefined) query.append('is_active', String(params.is_active));
  if (params?.search) query.append('search', params.search);
  if (params?.skip !== undefined) query.append('skip', String(params.skip));
  if (params?.limit !== undefined) query.append('limit', String(params.limit));

  return api.get<Character[]>(`${BASE_PATH}/characters?${query.toString()}`);
};

export const getCharacter = async (id: string): Promise<Character> => {
  return api.get<Character>(`${BASE_PATH}/characters/${id}`);
};

export const createCharacter = async (data: CharacterCreate): Promise<Character> => {
  return api.post<Character>(`${BASE_PATH}/characters`, data);
};

export const updateCharacter = async (id: string, data: CharacterUpdate): Promise<Character> => {
  return api.patch<Character>(`${BASE_PATH}/characters/${id}`, data);
};

export const deleteCharacter = async (id: string): Promise<void> => {
  return api.delete(`${BASE_PATH}/characters/${id}`);
};

// ============================================================================
// Faction API
// ============================================================================

export const getFactions = async (params?: FactionQueryParams): Promise<Faction[]> => {
  const query = new URLSearchParams();
  if (params?.is_active !== undefined) query.append('is_active', String(params.is_active));
  if (params?.search) query.append('search', params.search);
  if (params?.skip !== undefined) query.append('skip', String(params.skip));
  if (params?.limit !== undefined) query.append('limit', String(params.limit));

  return api.get<Faction[]>(`${BASE_PATH}/factions?${query.toString()}`);
};

export const getFactionsWithCharacters = async (params?: FactionQueryParams): Promise<FactionWithCharacters[]> => {
  const query = new URLSearchParams();
  if (params?.is_active !== undefined) query.append('is_active', String(params.is_active));
  if (params?.search) query.append('search', params.search);
  
  return api.get<FactionWithCharacters[]>(`${BASE_PATH}/factions/with-characters?${query.toString()}`);
};

export const getFaction = async (id: string): Promise<Faction> => {
  return api.get<Faction>(`${BASE_PATH}/factions/${id}`);
};

export const createFaction = async (data: FactionCreate): Promise<Faction> => {
  return api.post<Faction>(`${BASE_PATH}/factions`, data);
};

export const updateFaction = async (id: string, data: FactionUpdate): Promise<Faction> => {
  return api.patch<Faction>(`${BASE_PATH}/factions/${id}`, data);
};

export const deleteFaction = async (id: string): Promise<void> => {
  return api.delete(`${BASE_PATH}/factions/${id}`);
};

// ============================================================================
// Faction-Character Association API
// ============================================================================

export const addCharacterToFaction = async (
  factionId: string, 
  characterId: string, 
  priority: number = 0
): Promise<void> => {
  return api.post(`${BASE_PATH}/factions/${factionId}/characters`, {
    character_id: characterId,
    priority
  });
};

export const removeCharacterFromFaction = async (
  factionId: string, 
  characterId: string
): Promise<void> => {
  return api.delete(`${BASE_PATH}/factions/${factionId}/characters/${characterId}`);
};

export const updateFactionCharacterPriority = async (
  factionId: string, 
  characterId: string, 
  priority: number
): Promise<void> => {
  return api.patch(`${BASE_PATH}/factions/${factionId}/characters/${characterId}`, {
    priority
  });
};

// ============================================================================
// Interpretation API
// ============================================================================

export const getInterpretations = async (params?: InterpretationQueryParams): Promise<CardInterpretation[]> => {
  const query = new URLSearchParams();
  if (params?.card_id) query.append('card_id', params.card_id);
  if (params?.character_id) query.append('character_id', params.character_id);
  if (params?.is_active !== undefined) query.append('is_active', String(params.is_active));
  if (params?.skip !== undefined) query.append('skip', String(params.skip));
  if (params?.limit !== undefined) query.append('limit', String(params.limit));

  return api.get<CardInterpretation[]>(`${BASE_PATH}/interpretations?${query.toString()}`);
};

export const getInterpretationsByCard = async (
  cardId: string, 
  isActiveOnly: boolean = false
): Promise<CardInterpretationWithDetails[]> => {
  const query = new URLSearchParams();
  query.append('card_id', cardId);
  if (isActiveOnly) query.append('is_active', 'true');
  
  // Using a specific endpoint or just querying the list with details
  // Assuming the backend returns details when querying by card_id
  return api.get<CardInterpretationWithDetails[]>(`${BASE_PATH}/interpretations/by-card/${cardId}?${query.toString()}`);
};

export const createInterpretation = async (data: CardInterpretationCreate): Promise<CardInterpretation> => {
  return api.post<CardInterpretation>(`${BASE_PATH}/interpretations`, data);
};

export const updateInterpretation = async (id: string, data: CardInterpretationUpdate): Promise<CardInterpretation> => {
  return api.patch<CardInterpretation>(`${BASE_PATH}/interpretations/${id}`, data);
};

export const deleteInterpretation = async (id: string): Promise<void> => {
  return api.delete(`${BASE_PATH}/interpretations/${id}`);
};
