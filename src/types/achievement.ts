/**
 * Achievement System Type Definitions
 * 成就系統型別定義 - 單一真相來源
 *
 * ⚠️ 重要：此檔案的型別定義必須與後端 schema 保持一致
 * 參考：backend/app/schemas/achievement.py
 */

import { z } from 'zod'

// ===== Enums =====

/**
 * 成就類別
 * 與後端 AchievementCategory enum 一致
 */
export const AchievementCategorySchema = z.enum([
  'READING',
  'SOCIAL',
  'BINGO',
  'KARMA',
  'EXPLORATION'
])

export type AchievementCategory = z.infer<typeof AchievementCategorySchema>

/**
 * 成就稀有度
 * 與後端 AchievementRarity enum 一致
 *
 * ⚠️ 注意：沒有 UNCOMMON（前端之前有誤）
 */
export const AchievementRaritySchema = z.enum([
  'COMMON',
  'RARE',
  'EPIC',
  'LEGENDARY'
])

export type AchievementRarity = z.infer<typeof AchievementRaritySchema>

/**
 * 成就狀態
 * 與後端 AchievementStatus enum 一致
 */
export const AchievementStatusSchema = z.enum([
  'IN_PROGRESS',
  'UNLOCKED',
  'CLAIMED'
])

export type AchievementStatus = z.infer<typeof AchievementStatusSchema>

// ===== Nested Schemas =====

/**
 * 成就解鎖條件
 */
export const AchievementCriteriaSchema = z.object({
  type: z.string(),
  target: z.number().positive(),
  filters: z.record(z.any()).optional(),
})

export type AchievementCriteria = z.infer<typeof AchievementCriteriaSchema>

/**
 * 成就獎勵
 */
export const AchievementRewardsSchema = z.object({
  karma_points: z.number().optional(),
  title: z.string().optional(),
  badge: z.string().optional(),
})

export type AchievementRewards = z.infer<typeof AchievementRewardsSchema>

// ===== Main Schemas =====

/**
 * 成就定義
 * 與後端 AchievementResponse 一致
 */
export const AchievementSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  category: AchievementCategorySchema,
  rarity: AchievementRaritySchema,
  icon_name: z.string(),
  icon_image_url: z.string().nullable().optional(),
  criteria: z.record(z.any()),
  rewards: z.record(z.any()),
  is_hidden: z.boolean(),
  display_order: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type Achievement = z.infer<typeof AchievementSchema>

/**
 * 成就列表回應
 * 與後端 AchievementListResponse 一致
 */
export const AchievementListResponseSchema = z.object({
  achievements: z.array(AchievementSchema),
  total: z.number(),
  category_filter: AchievementCategorySchema.nullable().optional(),
})

export type AchievementListResponse = z.infer<typeof AchievementListResponseSchema>

/**
 * 使用者成就進度
 * 與後端 UserAchievementProgressResponse 一致
 */
export const UserAchievementProgressSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  achievement_id: z.string(),
  achievement: AchievementSchema.nullable().optional(),
  current_progress: z.number(),
  target_progress: z.number(),
  progress_percentage: z.number(),
  status: AchievementStatusSchema,
  unlocked_at: z.string().nullable().optional(),
  claimed_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type UserAchievementProgress = z.infer<typeof UserAchievementProgressSchema>

/**
 * 使用者進度總覽
 * 與後端 UserProgressSummaryResponse 一致
 */
export const UserProgressSummaryResponseSchema = z.object({
  user_id: z.string(),
  total_achievements: z.number(),
  unlocked_count: z.number(),
  claimed_count: z.number(),
  in_progress_count: z.number(),
  completion_percentage: z.number(),
  achievements: z.array(UserAchievementProgressSchema),
  category_summary: z.record(z.object({
    total: z.number(),
    unlocked: z.number(),
    claimed: z.number(),
  })).optional(),
})

export type UserProgressSummaryResponse = z.infer<typeof UserProgressSummaryResponseSchema>

/**
 * 領取獎勵請求
 * 與後端 ClaimRewardRequest 一致
 */
export const ClaimRewardRequestSchema = z.object({
  achievement_code: z.string(),
})

export type ClaimRewardRequest = z.infer<typeof ClaimRewardRequestSchema>

/**
 * 領取獎勵回應
 * 與後端 ClaimRewardResponse 一致
 */
export const ClaimRewardResponseSchema = z.object({
  success: z.boolean(),
  achievement_code: z.string(),
  rewards: z.record(z.any()),
  message: z.string(), // 回應訊息
  claimed_at: z.string(),
})

export type ClaimRewardResponse = z.infer<typeof ClaimRewardResponseSchema>

/**
 * 錯誤回應
 */
export const AchievementErrorResponseSchema = z.object({
  error_code: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional(),
})

export type AchievementErrorResponse = z.infer<typeof AchievementErrorResponseSchema>

// ===== Helper Functions =====

/**
 * 安全地解析 Achievement 資料
 */
export function parseAchievement(data: unknown): Achievement {
  return AchievementSchema.parse(data)
}

/**
 * 安全地解析 UserProgressSummary 資料
 */
export function parseUserProgressSummary(data: unknown): UserProgressSummaryResponse {
  return UserProgressSummaryResponseSchema.parse(data)
}

/**
 * 安全地解析 ClaimRewardResponse 資料
 */
export function parseClaimRewardResponse(data: unknown): ClaimRewardResponse {
  return ClaimRewardResponseSchema.parse(data)
}
