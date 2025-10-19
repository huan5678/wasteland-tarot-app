/**
 * Character Voice System Types
 * 角色聲音系統的 TypeScript 型別定義
 * 對應後端 Pydantic schemas (app/schemas/character_voice.py)
 */

import { z } from 'zod'

// ============================================================================
// Character Types
// ============================================================================

/**
 * Character 基礎 Schema
 */
export const CharacterSchema = z.object({
  id: z.string().uuid(),
  key: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  personality: z.string().max(200).nullable().optional(),
  voice_style: z.string().nullable().optional(),
  theme_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  icon_name: z.string().max(50).nullable().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable().optional(),
})

export type Character = z.infer<typeof CharacterSchema>

/**
 * Character 建立請求
 */
export const CharacterCreateSchema = CharacterSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type CharacterCreate = z.infer<typeof CharacterCreateSchema>

/**
 * Character 更新請求
 */
export const CharacterUpdateSchema = CharacterCreateSchema.partial()

export type CharacterUpdate = z.infer<typeof CharacterUpdateSchema>

/**
 * Character 含解讀數量
 */
export const CharacterWithInterpretationsCountSchema = CharacterSchema.extend({
  interpretations_count: z.number().int().min(0).default(0),
})

export type CharacterWithInterpretationsCount = z.infer<typeof CharacterWithInterpretationsCountSchema>

// ============================================================================
// Faction Types
// ============================================================================

/**
 * Faction 基礎 Schema
 */
export const FactionSchema = z.object({
  id: z.string().uuid(),
  key: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  alignment: z.string().max(20).nullable().optional(),
  icon_name: z.string().max(50).nullable().optional(),
  theme_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable().optional(),
})

export type Faction = z.infer<typeof FactionSchema>

/**
 * Faction 建立請求
 */
export const FactionCreateSchema = FactionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type FactionCreate = z.infer<typeof FactionCreateSchema>

/**
 * Faction 更新請求
 */
export const FactionUpdateSchema = FactionCreateSchema.partial()

export type FactionUpdate = z.infer<typeof FactionUpdateSchema>

/**
 * Faction 含關聯角色
 */
export const FactionWithCharactersSchema = FactionSchema.extend({
  characters: z.array(CharacterSchema).default([]),
})

export type FactionWithCharacters = z.infer<typeof FactionWithCharactersSchema>

// ============================================================================
// FactionCharacter Association Types
// ============================================================================

/**
 * FactionCharacter 關聯 Schema
 */
export const FactionCharacterSchema = z.object({
  id: z.string().uuid(),
  faction_id: z.string().uuid(),
  character_id: z.string().uuid(),
  priority: z.number().int().min(0).default(0),
  created_at: z.string().datetime(),
})

export type FactionCharacter = z.infer<typeof FactionCharacterSchema>

/**
 * FactionCharacter 建立請求
 */
export const FactionCharacterCreateSchema = FactionCharacterSchema.omit({
  id: true,
  created_at: true,
})

export type FactionCharacterCreate = z.infer<typeof FactionCharacterCreateSchema>

/**
 * FactionCharacter 更新請求
 */
export const FactionCharacterUpdateSchema = z.object({
  priority: z.number().int().min(0).optional(),
})

export type FactionCharacterUpdate = z.infer<typeof FactionCharacterUpdateSchema>

// ============================================================================
// CardInterpretation Types
// ============================================================================

/**
 * CardInterpretation 基礎 Schema
 */
export const CardInterpretationSchema = z.object({
  id: z.string().uuid(),
  card_id: z.string().uuid(),
  character_id: z.string().uuid(),
  interpretation_text: z.string().min(1),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable().optional(),
})

export type CardInterpretation = z.infer<typeof CardInterpretationSchema>

/**
 * CardInterpretation 建立請求
 */
export const CardInterpretationCreateSchema = CardInterpretationSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type CardInterpretationCreate = z.infer<typeof CardInterpretationCreateSchema>

/**
 * CardInterpretation 更新請求
 */
export const CardInterpretationUpdateSchema = z.object({
  interpretation_text: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
})

export type CardInterpretationUpdate = z.infer<typeof CardInterpretationUpdateSchema>

/**
 * CardInterpretation 含詳細資訊
 */
export const CardInterpretationWithDetailsSchema = CardInterpretationSchema.extend({
  character_name: z.string().nullable().optional(),
  character_key: z.string().nullable().optional(),
  card_name: z.string().nullable().optional(),
})

export type CardInterpretationWithDetails = z.infer<typeof CardInterpretationWithDetailsSchema>

// ============================================================================
// Bulk Operations Types
// ============================================================================

/**
 * 批量建立解讀請求
 */
export const BulkInterpretationCreateSchema = z.object({
  card_id: z.string().uuid(),
  interpretations: z.array(
    z.object({
      character_id: z.string().uuid(),
      interpretation_text: z.string().min(1),
    })
  ),
})

export type BulkInterpretationCreate = z.infer<typeof BulkInterpretationCreateSchema>

/**
 * 批量操作回應
 */
export const BulkOperationResponseSchema = z.object({
  success_count: z.number().int().min(0).default(0),
  failed_count: z.number().int().min(0).default(0),
  errors: z.array(z.string()).default([]),
})

export type BulkOperationResponse = z.infer<typeof BulkOperationResponseSchema>

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * Character 查詢參數
 */
export type CharacterQueryParams = {
  is_active?: boolean
  search?: string
  skip?: number
  limit?: number
}

/**
 * Faction 查詢參數
 */
export type FactionQueryParams = {
  is_active?: boolean
  search?: string
  skip?: number
  limit?: number
}

/**
 * Interpretation 查詢參數
 */
export type InterpretationQueryParams = {
  card_id?: string
  character_id?: string
  is_active?: boolean
  skip?: number
  limit?: number
}

// ============================================================================
// Statistics Types
// ============================================================================

/**
 * 解讀統計摘要
 */
export const InterpretationStatsSchema = z.object({
  total_interpretations: z.number().int().min(0),
  active_interpretations: z.number().int().min(0),
  inactive_interpretations: z.number().int().min(0),
  cards_with_interpretations: z.number().int().min(0),
  characters_with_interpretations: z.number().int().min(0),
})

export type InterpretationStats = z.infer<typeof InterpretationStatsSchema>

// ============================================================================
// Helper Types
// ============================================================================

/**
 * API 回應型別（泛型）
 */
export type ApiResponse<T> = {
  data: T
  error?: string
}

/**
 * 分頁回應型別
 */
export type PaginatedResponse<T> = {
  items: T[]
  total: number
  skip: number
  limit: number
}
