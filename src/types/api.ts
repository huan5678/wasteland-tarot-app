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
  radiation_level: z.number().min(0).max(1).default(0),
  threat_level: z.number().int().min(1).max(10).default(1),
  vault_number: z.number().int().optional().nullable(),
})

export type CardMetadata = z.infer<typeof CardMetadataSchema>

// 嵌套物件：Character Voices
export const CharacterVoicesSchema = z.object({
  pip_boy_analysis: z.string().optional().nullable(),
  vault_dweller_perspective: z.string().optional().nullable(),
  wasteland_trader_wisdom: z.string().optional().nullable(),
  super_mutant_simplicity: z.string().optional().nullable(),
  codsworth_analysis: z.string().optional().nullable(),
})

export type CharacterVoices = z.infer<typeof CharacterVoicesSchema>

// 嵌套物件：Faction Meanings
export const FactionMeaningsSchema = z.object({
  brotherhood_significance: z.string().optional().nullable(),
  ncr_significance: z.string().optional().nullable(),
  legion_significance: z.string().optional().nullable(),
  raiders_significance: z.string().optional().nullable(),
  vault_dweller_significance: z.string().optional().nullable(),
})

export type FactionMeanings = z.infer<typeof FactionMeaningsSchema>

// 嵌套物件：Card Visuals
export const CardVisualsSchema = z.object({
  image_url: z.string().optional().nullable(),
  image_alt_text: z.string().optional().nullable(),
  background_image_url: z.string().optional().nullable(),
  audio_cue_url: z.string().optional().nullable(),
  geiger_sound_intensity: z.number().min(0).max(1).default(0.1),
})

export type CardVisuals = z.infer<typeof CardVisualsSchema>

// 嵌套物件：Card Stats
export const CardStatsSchema = z.object({
  draw_frequency: z.number().int().default(0),
  total_appearances: z.number().int().default(0),
  last_drawn_at: z.string().optional().nullable(),
})

export type CardStats = z.infer<typeof CardStatsSchema>

// 完整的 Card Schema（嵌套結構）
export const TarotCardSchema = z.object({
  // 基本資訊
  id: z.string(),
  name: z.string(),
  suit: z.string(),
  number: z.number().optional().nullable(),
  upright_meaning: z.string(),
  reversed_meaning: z.string(),

  // 嵌套物件
  metadata: CardMetadataSchema,
  character_voices: CharacterVoicesSchema,
  faction_meanings: FactionMeaningsSchema,
  visuals: CardVisualsSchema,
  stats: CardStatsSchema,

  // Karma 解讀
  good_karma_interpretation: z.string().optional().nullable(),
  neutral_karma_interpretation: z.string().optional().nullable(),
  evil_karma_interpretation: z.string().optional().nullable(),

  // Fallout 元素
  wasteland_humor: z.string().optional().nullable(),
  nuka_cola_reference: z.string().optional().nullable(),
  fallout_easter_egg: z.string().optional().nullable(),

  // 遊戲機制
  affects_luck_stat: z.boolean().default(false),
  affects_charisma_stat: z.boolean().default(false),
  affects_intelligence_stat: z.boolean().default(false),
  special_ability: z.string().optional().nullable(),

  // 計算屬性
  is_major_arcana: z.boolean(),
  is_court_card: z.boolean(),
  rank: z.string().optional().nullable(),

  // 向後相容（已棄用，但保留以避免破壞現有程式碼）
  image_url: z.string().optional().nullable(),
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

// CardPosition Schema (對應後端 CardPosition)
export const CardPositionSchema = z.object({
  position_number: z.number(),
  position_name: z.string(),
  position_meaning: z.string(),
  card_id: z.string(),
  is_reversed: z.boolean(),
  draw_order: z.number(),
  radiation_influence: z.number().default(0),
  // Complete card data (included when fetching reading details)
  card: TarotCardSchema.optional().nullable(),
  position_interpretation: z.string().optional().nullable(),
  card_significance: z.string().optional().nullable(),
  connection_to_question: z.string().optional().nullable(),
  user_resonance: z.number().optional().nullable(),
  interpretation_confidence: z.number().optional().nullable(),
})

export type CardPosition = z.infer<typeof CardPositionSchema>

// SpreadTemplate Schema (對應後端 SpreadTemplate)
export const SpreadTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  display_name: z.string(),
  description: z.string(),
  spread_type: z.string(),
  card_count: z.number(),
  positions: z.array(z.object({
    number: z.number(),
    name: z.string(),
    meaning: z.string(),
  })),
  difficulty_level: z.string(),
  faction_preference: z.string().optional().nullable(),
  radiation_sensitivity: z.number().default(0.5),
  vault_origin: z.number().optional().nullable(),
  usage_count: z.number().default(0),
  average_rating: z.number().default(0),
  is_active: z.boolean().default(true),
  is_premium: z.boolean().default(false),
})

export type SpreadTemplate = z.infer<typeof SpreadTemplateSchema>

// ReadingSession Schema (新的資料結構，對應後端 ReadingSession)
export const ReadingSessionSchema = z.object({
  id: z.string(),
  user_id: z.string(),

  // Reading content
  question: z.string(),
  focus_area: z.string().optional().nullable(),
  context_notes: z.string().optional().nullable(),

  // Configuration
  spread_template: SpreadTemplateSchema.optional().nullable(),
  spread_template_id: z.string().optional().nullable(),
  spread_type: z.string().optional().nullable(),
  character_voice_used: z.string(),
  karma_context: z.string(),
  faction_influence: z.string().optional().nullable(),
  radiation_factor: z.number(),

  // Card positions
  card_positions: z.array(CardPositionSchema),

  // Interpretations
  overall_interpretation: z.string().optional().nullable(),
  summary_message: z.string().optional().nullable(),
  prediction_confidence: z.number().optional().nullable(),
  energy_reading: z.record(z.unknown()).optional().nullable(),

  // AI Interpretation Tracking
  ai_interpretation_requested: z.boolean().optional().nullable(),
  ai_interpretation_at: z.string().optional().nullable(),
  ai_interpretation_provider: z.string().optional().nullable(),

  // Session metadata
  session_duration: z.number().optional().nullable(),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  location: z.string().optional().nullable(),

  // User experience
  mood_before: z.string().optional().nullable(),
  mood_after: z.string().optional().nullable(),

  // Privacy and sharing
  privacy_level: z.string(),
  allow_public_sharing: z.boolean().default(false),
  is_favorite: z.boolean().default(false),

  // User feedback
  user_satisfaction: z.number().optional().nullable(),
  accuracy_rating: z.number().optional().nullable(),
  helpful_rating: z.number().optional().nullable(),
  user_feedback: z.string().optional().nullable(),

  // Social features
  likes_count: z.number().default(0),
  shares_count: z.number().default(0),
  comments_count: z.number().default(0),

  // Timestamps
  created_at: z.string(),
  updated_at: z.string().optional().nullable(),
})

export type ReadingSession = z.infer<typeof ReadingSessionSchema>

// Legacy Reading Schema (舊的資料結構，向後相容)
export const LegacyReadingSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  question: z.string(),
  spread_type: z.string(),
  cards_drawn: z.array(z.unknown()),
  interpretation: z.string().optional(),
  character_voice: z.string().optional(),
  karma_context: z.string().optional(),
  faction_influence: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
})

export type LegacyReading = z.infer<typeof LegacyReadingSchema>

// 統一的 Reading 型別（支援新舊兩種結構）
export type Reading = ReadingSession | LegacyReading

// 型別守衛
export function isReadingSession(reading: Reading): reading is ReadingSession {
  return 'card_positions' in reading && Array.isArray(reading.card_positions)
}

export function isLegacyReading(reading: Reading): reading is LegacyReading {
  return 'cards_drawn' in reading && Array.isArray(reading.cards_drawn)
}

export const ReadingArraySchema = z.array(z.union([ReadingSessionSchema, LegacyReadingSchema]))

export interface CreateReadingPayload {
  question: string
  spread_template_id: string
  character_voice: string
  karma_context: string
  faction_influence?: string
  radiation_factor?: number
  focus_area?: string
  context_notes?: string
  privacy_level?: string
  allow_public_sharing?: boolean
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
  experience_level: z.string().optional(),
  total_readings: z.number().optional(),
  created_at: z.string(),
  // 權限相關欄位
  is_admin: z.boolean().optional().default(false),
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
