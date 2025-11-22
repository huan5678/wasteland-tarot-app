/**
 * API Types and Schemas
 * 統一的 API 型別定義和 Zod 驗證 schemas
 * 
 * 重要原則：
 * 1. 這裡定義的類型應反映**前端使用的數據結構**（通常是駝峰命名）。
 * 2. 原始後端數據（通常是蛇形命名）應在進入應用前通過 adapters 進行轉換。
 * 3. 不要為了妥協後端的不一致性而在這裡使用聯合類型或可選類型。
 */

import { z } from 'zod'

// ============================================================================
// Tarot Card Types
// ============================================================================

// Metadata
export const CardMetadataSchema = z.object({
  radiation_level: z.number().min(0).max(1).default(0),
  threat_level: z.number().int().min(1).max(10).default(1),
  vault_number: z.number().int().optional().nullable(),
})

export type CardMetadata = z.infer<typeof CardMetadataSchema>

// Character Voices
export const CharacterVoicesSchema = z.object({
  // 基礎角色
  pip_boy: z.string().optional().nullable(),
  vault_dweller: z.string().optional().nullable(),
  wasteland_trader: z.string().optional().nullable(),
  super_mutant: z.string().optional().nullable(),
  codsworth: z.string().optional().nullable(),
  
  // 擴展角色
  brotherhood_scribe: z.string().optional().nullable(),
  ghoul: z.string().optional().nullable(),
  raider: z.string().optional().nullable(),
  brotherhood_paladin: z.string().optional().nullable(),
  ncr_ranger: z.string().optional().nullable(),
  legion_centurion: z.string().optional().nullable(),
  minuteman: z.string().optional().nullable(),
  railroad_agent: z.string().optional().nullable(),
  institute_scientist: z.string().optional().nullable(),
})

export type CharacterVoices = z.infer<typeof CharacterVoicesSchema>

// Faction Meanings
export const FactionMeaningsSchema = z.object({
  brotherhood_significance: z.string().optional().nullable(),
  ncr_significance: z.string().optional().nullable(),
  legion_significance: z.string().optional().nullable(),
  raiders_significance: z.string().optional().nullable(),
  vault_dweller_significance: z.string().optional().nullable(),
})

export type FactionMeanings = z.infer<typeof FactionMeaningsSchema>

// Visuals
export const CardVisualsSchema = z.object({
  image_url: z.string().optional().nullable(),
  image_alt_text: z.string().optional().nullable(),
  background_image_url: z.string().optional().nullable(),
  audio_cue_url: z.string().optional().nullable(),
  geiger_sound_intensity: z.number().min(0).max(1).default(0.1),
})

export type CardVisuals = z.infer<typeof CardVisualsSchema>

// Stats
export const CardStatsSchema = z.object({
  draw_frequency: z.number().int().default(0),
  total_appearances: z.number().int().default(0),
  last_drawn_at: z.string().optional().nullable(),
})

export type CardStats = z.infer<typeof CardStatsSchema>

// Story Mode
export const WastelandStorySchema = z.object({
  background: z.string(),
  character: z.string(),
  location: z.string(),
  timeline: z.string(),
  factionsInvolved: z.array(z.string()),
  relatedQuest: z.string().optional().nullable(),
})

export type WastelandStory = z.infer<typeof WastelandStorySchema>

// Tarot Card (Cleaned up)
export const TarotCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  suit: z.string(),
  number: z.number().optional().nullable(),
  upright_meaning: z.string(),
  reversed_meaning: z.string(),

  metadata: CardMetadataSchema,
  character_voices: CharacterVoicesSchema,
  faction_meanings: FactionMeaningsSchema,
  visuals: CardVisualsSchema,
  stats: CardStatsSchema,

  good_karma_interpretation: z.string().optional().nullable(),
  neutral_karma_interpretation: z.string().optional().nullable(),
  evil_karma_interpretation: z.string().optional().nullable(),

  wasteland_humor: z.string().optional().nullable(),
  nuka_cola_reference: z.string().optional().nullable(),
  fallout_easter_egg: z.string().optional().nullable(),
  
  // Frontend specific mapped fields
  radiation_factor: z.number().optional(),
  image_url: z.string().optional(),
  fallout_reference: z.string().optional().nullable(),
  vault_reference: z.number().optional().nullable(),
  threat_level: z.number().optional(),

  affects_luck_stat: z.boolean().default(false),
  affects_charisma_stat: z.boolean().default(false),
  affects_intelligence_stat: z.boolean().default(false),
  special_ability: z.string().optional().nullable(),

  is_major_arcana: z.boolean(),
  is_court_card: z.boolean(),
  rank: z.string().optional().nullable(),

  story: WastelandStorySchema.optional().nullable(),
  audio_urls: z.record(z.string(), z.string()).optional().nullable(),
})

export type TarotCard = z.infer<typeof TarotCardSchema>

export const TarotCardArraySchema = z.array(TarotCardSchema)

export const PaginatedCardsResponseSchema = z.object({
  cards: z.array(TarotCardSchema),
  total_count: z.number(),
  page: z.number(),
  page_size: z.number(),
  has_more: z.boolean(),
})

export type PaginatedCardsResponse = z.infer<typeof PaginatedCardsResponseSchema>

// ============================================================================
// User Types (Cleaned up)
// ============================================================================

export const UserSchema = z.object({
  id: z.string(),
  username: z.string().optional(),
  email: z.string().email(),
  name: z.string(), // displayed name
  displayName: z.string().optional(),
  
  // Game attributes
  factionAlignment: z.string().optional(),
  karmaScore: z.number().default(0),
  experienceLevel: z.string().default('Novice'),
  totalReadings: z.number().default(0),
  favoriteCardSuit: z.string().optional(), // Added missing field
  
  // Permissions
  isAdmin: z.boolean().default(false),
  
  // Auth
  isOAuthUser: z.boolean().default(false),
  oauthProvider: z.string().nullable().optional(),
  
  // Appearance
  profilePicture: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  
  createdAt: z.string(),
})

export type User = z.infer<typeof UserSchema>

// ============================================================================
// Reading Types (Cleaned up)
// ============================================================================

// Card Position
export const CardPositionSchema = z.object({
  position_number: z.number(),
  position_name: z.string(),
  position_meaning: z.string(),
  card_id: z.string(),
  is_reversed: z.boolean(),
  draw_order: z.number(),
  radiation_influence: z.number().default(0),
  card: TarotCardSchema.optional(), // 適配後的 Card 對象
  position_interpretation: z.string().optional().nullable(),
  card_significance: z.string().optional().nullable(),
  connection_to_question: z.string().optional().nullable(),
  user_resonance: z.number().optional().nullable(),
  interpretation_confidence: z.number().optional().nullable(),
})

export type CardPosition = z.infer<typeof CardPositionSchema>

// Spread Template
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

// Reading Session (Unified - no legacy schema needed if adapter is used)
export const ReadingSessionSchema = z.object({
  id: z.string(),
  userId: z.string(), // CamelCase
  
  question: z.string(),
  focusArea: z.string().optional().nullable(),
  contextNotes: z.string().optional().nullable(),
  
  spreadTemplate: SpreadTemplateSchema.optional().nullable(),
  spreadTemplateId: z.string().optional().nullable(),
  spreadType: z.string().optional().nullable(),
  
  characterVoiceUsed: z.string(),
  karmaContext: z.string(),
  factionInfluence: z.string().optional().nullable(),
  radiationFactor: z.number(),
  
  cardPositions: z.array(CardPositionSchema),
  
  overallInterpretation: z.string().optional().nullable(),
  summaryMessage: z.string().optional().nullable(),
  predictionConfidence: z.number().optional().nullable(),
  energyReading: z.record(z.unknown()).optional().nullable(),
  
  aiInterpretationRequested: z.boolean().optional().nullable(),
  aiInterpretationAt: z.string().optional().nullable(),
  aiInterpretationProvider: z.string().optional().nullable(),
  interpretationAudioUrl: z.string().optional().nullable(),
  
  sessionDuration: z.number().optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  
  moodBefore: z.string().optional().nullable(),
  moodAfter: z.string().optional().nullable(),
  
  privacyLevel: z.string(),
  allowPublicSharing: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
  
  userSatisfaction: z.number().optional().nullable(),
  accuracyRating: z.number().optional().nullable(),
  helpfulRating: z.number().optional().nullable(),
  userFeedback: z.string().optional().nullable(),
  
  likesCount: z.number().default(0),
  sharesCount: z.number().default(0),
  commentsCount: z.number().default(0),
  
  createdAt: z.string(),
  updatedAt: z.string().optional().nullable(),
})

export type ReadingSession = z.infer<typeof ReadingSessionSchema>
// Backwards compatibility alias
export type Reading = ReadingSession

export const ReadingArraySchema = z.array(ReadingSessionSchema)

// ============================================================================
// Auth & API Responses
// ============================================================================

export const AuthResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  user: UserSchema,
})

export type AuthResponse = z.infer<typeof AuthResponseSchema>

export const RefreshTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
})

export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>

export const LogoutResponseSchema = z.object({
  message: z.string(),
  isOAuthUser: z.boolean(),
  oauthProvider: z.string().nullable(),
})

export type LogoutResponse = z.infer<typeof LogoutResponseSchema>

export const ErrorResponseSchema = z.object({
  detail: z.string(),
  status: z.number().optional(),
})

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

// ============================================================================
// Other Types (Bingo, Stats, etc.)
// ============================================================================

export const BingoCardSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  month_year: z.string(),
  card_data: z.array(z.array(z.number())),
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

export const HealthCheckSchema = z.object({
  status: z.string(),
  service: z.string(),
  version: z.string(),
})

export type HealthCheck = z.infer<typeof HealthCheckSchema>

export const LandingStatsResponseSchema = z.object({
  users: z.number().int().nonnegative(),
  readings: z.number().int().nonnegative(),
  cards: z.number().int().default(78),
  providers: z.number().int().default(3),
})

export type LandingStatsResponse = z.infer<typeof LandingStatsResponseSchema>