import type { User } from '@/types/api'

/**
 * 將後端 API 返回的用戶數據轉換為前端使用的 User 格式
 * 
 * 職責：
 * 1. 統一命名風格（蛇形 -> 駝峰）
 * 2. 處理可選字段的默認值
 * 3. 確保類型安全
 * 
 * @param data 後端返回的原始數據
 * @returns 清洗後的 User 對象
 */
export function adaptBackendUserToFrontend(data: any): User {
  if (!data) {
    throw new Error('adaptBackendUserToFrontend: data is null or undefined');
  }

  return {
    id: data.id,
    username: data.username,
    email: data.email,
    name: data.name || data.full_name || data.username || 'Unknown Wanderer',
    displayName: data.display_name || data.name, // 前端統一使用 displayName
    
    // 遊戲化屬性
    factionAlignment: data.faction_alignment,
    karmaScore: data.karma_score ?? 0,
    experienceLevel: data.experience_level || 'Novice',
    totalReadings: data.total_readings ?? 0,
    favoriteCardSuit: data.favorite_card_suit,
    
    // 權限與認證
    isAdmin: data.is_admin ?? false,
    isOAuthUser: data.is_oauth_user ?? data.isOAuthUser ?? false, // 兼容兩種命名
    oauthProvider: data.oauth_provider ?? data.oauthProvider,
    
    // 外觀
    profilePicture: data.profile_picture || data.avatar_url,
    avatarUrl: data.avatar_url || data.profile_picture,
    
    // 時間戳
    createdAt: data.created_at,
  };
}
