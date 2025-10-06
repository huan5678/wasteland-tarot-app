/**
 * API Types and Schemas
 * 統一的 API 型別定義和 Zod 驗證 schemas
 */

import { z } from 'zod'

// ============================================================================
// Tarot Card Types - Nested Structure
// ============================================================================

// 嵌套物件：Metadata
export const CardMetadataSchema = z.object({
  radiation_level: z.number().min(0).max(1),
  threat_level: z.number().int().min(1).max(10),
  vault_number: z.number().int().optional(),
})

export type CardMetadata = z.infer<typeof CardMetadataSchema>

// 嵌套物件：Character Voices
export const CharacterVoicesSchema = z.object({
  pip_boy_analysis: z.string().optional(),
  vault_dweller_perspective: z.string().optional(),
  wasteland_trader_wisdom: z.string().optional(),
  super_mutant_simplicity: z.string().optional(),
  codsworth_analysis: z.string().optional(),
})

export type CharacterVoices = z.infer<typeof CharacterVoicesSchema>

// 嵌套物件：Faction Meanings
export const FactionMeaningsSchema = z.object({
  brotherhood_significance: z.string().optional(),
  ncr_significance: z.string().optional(),
  legion_significance: z.string().optional(),
  raiders_significance: z.string().optional(),
  vault_dweller_significance: z.string().optional(),
})

export type FactionMeanings = z.infer<typeof FactionMeaningsSchema>

// 嵌套物件：Card Visuals
export const CardVisualsSchema = z.object({
  image_url: z.string().optional(),
  image_alt_text: z.string().optional(),
  background_image_url: z.string().optional(),
  audio_cue_url: z.string().optional(),
  geiger_sound_intensity: z.number().min(0).max(1).default(0.1),
})

export type CardVisuals = z.infer<typeof CardVisualsSchema>

// 嵌套物件：Card Stats
export const CardStatsSchema = z.object({
  draw_frequency: z.number().int().default(0),
  total_appearances: z.number().int().default(0),
  last_drawn_at: z.string().optional(),
})

export type CardStats = z.infer<typeof CardStatsSchema>

// 完整的 Card Schema（嵌套結構）
export const TarotCardSchema = z.object({
  // 基本資訊
  id: z.string(),
  name: z.string(),
  suit: z.string(),
  number: z.number().optional(),
  upright_meaning: z.string(),
  reversed_meaning: z.string(),

  // 嵌套物件
  metadata: CardMetadataSchema,
  character_voices: CharacterVoicesSchema,
  faction_meanings: FactionMeaningsSchema,
  visuals: CardVisualsSchema,
  stats: CardStatsSchema,

  // Karma 解讀
  good_karma_interpretation: z.string().optional(),
  neutral_karma_interpretation: z.string().optional(),
  evil_karma_interpretation: z.string().optional(),

  // Fallout 元素
  wasteland_humor: z.string().optional(),
  nuka_cola_reference: z.string().optional(),
  fallout_easter_egg: z.string().optional(),

  // 遊戲機制
  affects_luck_stat: z.boolean().default(false),
  affects_charisma_stat: z.boolean().default(false),
  affects_intelligence_stat: z.boolean().default(false),
  special_ability: z.string().optional(),

  // 計算屬性
  is_major_arcana: z.boolean(),
  is_court_card: z.boolean(),
  rank: z.string().optional(),

  // 向後相容（已棄用，但保留以避免破壞現有程式碼）
  image_url: z.string().optional(),
  keywords: z.array(z.string()).optional(),
})

export type TarotCard = z.infer<typeof TarotCardSchema>

export const TarotCardArraySchema = z.array(TarotCardSchema)

// Paginated response schema for Cards API
export const PaginatedCardsResponseSchema = z.object({
  cards: z.array(TarotCardSchema),
  total_count: z.number(),
  page: z.number(),
  page_size: z.number(),
  has_more: z.boolean(),
})

export type PaginatedCardsResponse = z.infer<typeof PaginatedCardsResponseSchema>

// ============================================================================
// Reading Types
// ============================================================================

export const ReadingSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  question: z.string(),
  spread_type: z.string(),
  cards_drawn: z.array(z.any()),
  interpretation: z.string().optional(),
  character_voice: z.string().optional(),
  karma_context: z.string().optional(),
  faction_influence: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
})

export type Reading = z.infer<typeof ReadingSchema>

export const ReadingArraySchema = z.array(ReadingSchema)

export interface CreateReadingPayload {
  question: string
  spread_type: string
  cards_drawn: any[]
  interpretation?: string
  character_voice?: string
  karma_context?: string
  faction_influence?: string
}

// ============================================================================
// User Types
// ============================================================================

export const UserSchema = z.object({
  id: z.string(),
  username: z.string().optional(), // 向後相容
  name: z.string(),
  email: z.string().email(),
  display_name: z.string().optional(),
  faction_alignment: z.string().optional(),
  karma_score: z.number().optional(),
  vault_number: z.number().optional(),
  experience_level: z.string().optional(),
  total_readings: z.number().optional(),
  created_at: z.string(),
  // OAuth 相關欄位
  isOAuthUser: z.boolean().optional(),
  oauthProvider: z.string().nullable().optional(),
  profilePicture: z.string().nullable().optional(),
})

export type User = z.infer<typeof UserSchema>

// ============================================================================
// Auth Types
// ============================================================================

export const AuthResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  user: UserSchema,
})

export type AuthResponse = z.infer<typeof AuthResponseSchema>

export interface RegisterPayload {
  username: string
  email: string
  password: string
  display_name?: string
  vault_number?: number
}

export interface LoginPayload {
  username: string
  password: string
}

export const RefreshTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
})

export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>

export const LogoutResponseSchema = z.object({
  message: z.string(),
  is_oauth_user: z.boolean(),
  oauth_provider: z.string().nullable(),
})

export type LogoutResponse = z.infer<typeof LogoutResponseSchema>

// ============================================================================
// Bingo Types
// ============================================================================

export const BingoCardSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  month_year: z.string(),
  card_data: z.array(z.array(z.number())), // 5x5 grid
  is_active: z.boolean(),
  created_at: z.string(),
})

export type BingoCard = z.infer<typeof BingoCardSchema>

export const DailyNumberSchema = z.object({
  id: z.string(),
  number: z.number(),
  date_generated: z.string(),
  is_current: z.boolean(),
})

export type DailyNumber = z.infer<typeof DailyNumberSchema>

export const ClaimResultSchema = z.object({
  success: z.boolean(),
  number: z.number(),
  is_on_card: z.boolean(),
  current_lines: z.number(),
  has_reward: z.boolean(),
  message: z.string(),
})

export type ClaimResult = z.infer<typeof ClaimResultSchema>

export const BingoStatusSchema = z.object({
  has_card: z.boolean(),
  card_data: z.array(z.array(z.number())).nullable(),
  daily_number: z.number().nullable(),
  claimed_numbers: z.array(z.number()),
  line_count: z.number(),
  has_reward: z.boolean(),
  has_claimed_today: z.boolean(),
})

export type BingoStatus = z.infer<typeof BingoStatusSchema>

// ============================================================================
// Health Check Types
// ============================================================================

export const HealthCheckSchema = z.object({
  status: z.string(),
  service: z.string(),
  version: z.string(),
})

export type HealthCheck = z.infer<typeof HealthCheckSchema>

// ============================================================================
// Error Response Types
// ============================================================================

export const ErrorResponseSchema = z.object({
  detail: z.string(),
  status: z.number().optional(),
})

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

// ============================================================================
// Passkey Types
// ============================================================================

export const PasskeyCredentialSchema = z.object({
  id: z.string(),
  device_name: z.string(),
  created_at: z.string(),
  last_used_at: z.string().nullable(),
  transports: z.array(z.string()),
})

export type PasskeyCredential = z.infer<typeof PasskeyCredentialSchema>

export const PasskeyCredentialArraySchema = z.array(PasskeyCredentialSchema)
