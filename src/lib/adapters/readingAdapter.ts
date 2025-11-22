import type { ReadingSession, CardPosition } from '@/types/api'
import { adaptBackendCardToFrontend } from './cardAdapter'

/**
 * 將後端 API 返回的 CardPosition 數據轉換為前端格式
 */
export function adaptBackendCardPositionToFrontend(data: any): CardPosition {
  if (!data) return data;

  return {
    ...data,
    // 遞歸適配嵌套的 Card 對象
    card: data.card ? adaptBackendCardToFrontend(data.card) : undefined,
  };
}

/**
 * 將後端 API 返回的 ReadingSession 數據轉換為前端格式
 * 
 * 職責：
 * 1. 確保 card_positions 中的 card 對象經過適配
 * 2. 處理可能缺失的字段
 */
export function adaptBackendReadingSessionToFrontend(data: any): ReadingSession {
  if (!data) {
    throw new Error('adaptBackendReadingSessionToFrontend: data is null or undefined');
  }

  // 適配卡牌位置
  const cardPositions = Array.isArray(data.card_positions)
    ? data.card_positions.map(adaptBackendCardPositionToFrontend)
    : [];

  return {
    ...data,
    id: data.id,
    userId: data.user_id, // 轉換為駝峰 (如果前端類型定義已更新)
    
    // 核心內容
    question: data.question,
    focusArea: data.focus_area,
    contextNotes: data.context_notes,
    
    // 配置
    spreadTemplate: data.spread_template, // 可能需要進一步適配 SpreadTemplate
    spreadTemplateId: data.spread_template_id,
    spreadType: data.spread_type,
    characterVoiceUsed: data.character_voice_used,
    karmaContext: data.karma_context,
    factionInfluence: data.faction_influence,
    radiationFactor: data.radiation_factor,
    
    // 卡牌數據 (這是最重要的部分)
    cardPositions,
    
    // 解讀
    overallInterpretation: data.overall_interpretation,
    summaryMessage: data.summary_message,
    predictionConfidence: data.prediction_confidence,
    energyReading: data.energy_reading,
    
    // AI 狀態
    aiInterpretationRequested: data.ai_interpretation_requested,
    aiInterpretationAt: data.ai_interpretation_at,
    aiInterpretationProvider: data.ai_interpretation_provider,
    interpretationAudioUrl: data.interpretation_audio_url,
    
    // 元數據
    sessionDuration: data.session_duration,
    startTime: data.start_time,
    endTime: data.end_time,
    location: data.location,
    
    // 用戶體驗
    moodBefore: data.mood_before,
    moodAfter: data.mood_after,
    
    // 隱私與社交
    privacyLevel: data.privacy_level,
    allowPublicSharing: data.allow_public_sharing,
    isFavorite: data.is_favorite,
    
    // 反饋
    userSatisfaction: data.user_satisfaction,
    accuracyRating: data.accuracy_rating,
    helpfulRating: data.helpful_rating,
    userFeedback: data.user_feedback,
    
    // 社交計數
    likesCount: data.likes_count ?? 0,
    sharesCount: data.shares_count ?? 0,
    commentsCount: data.comments_count ?? 0,
    
    // 時間戳
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
