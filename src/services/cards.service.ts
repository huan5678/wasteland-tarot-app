/**
 * Card Service
 * 處理所有與卡牌相關的 API 請求
 */

import { api } from '@/lib/apiClient';
import type { TarotCard, PaginatedCardsResponse } from '@/types/api';
import type { WastelandCardWithStory, GenerateStoryAudioResponse } from '@/types/database';

export const CardService = {
  /**
   * 獲取所有卡牌（支援分頁回應）
   */
  async getAll(options?: { limit?: number; page?: number }): Promise<TarotCard[]> {
    const page = options?.page || 1;
    const pageSize = options?.limit || 100;
    const response = await api.get<PaginatedCardsResponse>(
      `/cards/?page=${page}&page_size=${pageSize}`
    );
    return response.cards;
  },

  /**
   * 根據 ID 獲取卡牌
   */
  async getById(id: string): Promise<TarotCard> {
    return api.get<TarotCard>(`/cards/${id}`);
  },

  /**
   * 抽取隨機卡牌
   */
  async drawRandom(count: number = 1): Promise<TarotCard[]> {
    return api.get<TarotCard[]>(`/cards/draws?count=${count}`);
  },

  /**
   * 根據花色獲取卡牌
   */
  async getBySuit(suit: string): Promise<TarotCard[]> {
    return api.get<TarotCard[]>(`/cards/?suit=${suit}`);
  },

  // ============================================================================
  // Story Mode Methods
  // ============================================================================
  
  /**
   * Get card with story content and audio URLs
   * 包含後端資料結構映射轉換
   */
  async getCardWithStory(id: string): Promise<WastelandCardWithStory> {
    const response = await api.get<any>(`/cards/${id}?include_story=true`);
    
    // 🔄 欄位映射：將後端巢狀結構轉換為前端扁平結構
    // 保持與舊 api.ts 相同的映射邏輯
    return {
      ...response,
      audioUrls: response.audio_urls || response.audioUrls,
      radiation_factor: response.metadata?.radiation_level ?? response.radiation_factor ?? 0,
      image_url: response.visuals?.image_url ?? response.image_url ?? '',
      character_voices: response.character_voices ? {
        pip_boy: response.character_voices.pip_boy_analysis ?? response.character_voices.pip_boy,
        vault_dweller: response.character_voices.vault_dweller_perspective ?? response.character_voices.vault_dweller,
        wasteland_trader: response.character_voices.wasteland_trader_wisdom ?? response.character_voices.wasteland_trader,
        super_mutant: response.character_voices.super_mutant_simplicity ?? response.character_voices.super_mutant,
        codsworth: response.character_voices.codsworth_analysis ?? response.character_voices.codsworth,
      } : {},
      fallout_reference: response.fallout_reference ?? response.fallout_easter_egg,
      vault_reference: response.metadata?.vault_number ?? response.vault_reference,
      threat_level: response.metadata?.threat_level ?? response.threat_level,
    } as WastelandCardWithStory;
  },

  /**
   * Generate story audio for specific characters
   */
  async generateStoryAudio(
    cardId: string,
    characterKeys: string[],
    forceRegenerate: boolean = false
  ): Promise<GenerateStoryAudioResponse> {
    try {
      return await api.post<GenerateStoryAudioResponse>('/audio/generate/story', {
        card_id: cardId,
        character_keys: characterKeys,
        force_regenerate: forceRegenerate,
      });
    } catch (error: any) {
      // Handle TTS service unavailable (503) - return fallback hint
      // 檢查 error message 是否包含 503 (因為 apiClient 會封裝錯誤訊息)
      if (error.message && error.message.includes('503')) {
        console.warn('TTS service unavailable, client should use Web Speech API fallback');
        return {
          cardId,
          audioUrls: {},
          cached: {},
          generatedAt: new Date().toISOString(),
        } as GenerateStoryAudioResponse;
      }
      throw error;
    }
  },

  /**
   * Get all story audio URLs for a card
   */
  async getStoryAudioUrls(cardId: string): Promise<Record<string, string>> {
    try {
      const response = await api.get<{ audioUrls: Record<string, string> }>(
        `/audio/story/${cardId}`
      );
      return response.audioUrls || {};
    } catch (error: any) {
       console.warn(`Failed to fetch story audio URLs for card ${cardId}:`, error.message);
       return {};
    }
  }
};
