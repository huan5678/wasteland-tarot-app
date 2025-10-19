/**
 * VoiceSelector - 智能語音選擇器
 *
 * 功能：
 * 1. 偵測系統可用語音
 * 2. 根據角色特性智能匹配最佳語音
 * 3. 支援語言優先順序（繁體中文 > 英文）
 * 4. 提供 fallback 機制
 */

import type { CharacterVoice } from './types';
import { logger } from '../logger';

/**
 * 語音匹配偏好
 */
interface VoicePreference {
  character: CharacterVoice;
  preferredLanguages: string[]; // 優先語言 (BCP 47 language tags)
  preferredGender?: 'male' | 'female';
  keywords: string[];           // 語音名稱關鍵字
  excludeKeywords?: string[];   // 排除的關鍵字
}

/**
 * 語音匹配分數
 */
interface VoiceScore {
  voice: SpeechSynthesisVoice;
  score: number;
  reasons: string[];
}

/**
 * 角色語音偏好配置
 *
 * 設計原則：
 * - 機械角色優先匹配機器人/合成語音
 * - 人類角色根據性格匹配性別和風格
 * - 變種生物使用粗獷/低沉的語音
 */
const CHARACTER_VOICE_PREFERENCES: Record<CharacterVoice, VoicePreference> = {
  // 通用角色
  pip_boy: {
    character: 'pip_boy',
    preferredLanguages: ['zh-TW', 'zh-CN', 'en-US'],
    preferredGender: undefined, // 機械音不分性別
    keywords: ['male', 'man', 'david', 'mark', 'james', '男'],
    excludeKeywords: ['female', 'woman', '女'],
  },
  vault_dweller: {
    character: 'vault_dweller',
    preferredLanguages: ['zh-TW', 'zh-CN', 'en-US'],
    preferredGender: 'male',
    keywords: ['male', 'young', 'david', 'mark', '男', '青年'],
  },
  wasteland_trader: {
    character: 'wasteland_trader',
    preferredLanguages: ['zh-TW', 'zh-CN', 'en-US'],
    preferredGender: 'male',
    keywords: ['male', 'mature', 'james', 'george', '男', '成熟'],
  },
  codsworth: {
    character: 'codsworth',
    preferredLanguages: ['en-GB', 'en-AU', 'en-US', 'zh-TW'], // 英式英語優先（管家風格）
    preferredGender: 'male',
    keywords: ['male', 'british', 'daniel', 'oliver', '男', '英國'],
  },

  // 廢土生物與掠奪者
  super_mutant: {
    character: 'super_mutant',
    preferredLanguages: ['en-US', 'zh-TW', 'zh-CN'],
    preferredGender: 'male',
    keywords: ['male', 'deep', 'bass', 'low', '男', '低音', '深'],
  },
  ghoul: {
    character: 'ghoul',
    preferredLanguages: ['en-US', 'zh-TW', 'zh-CN'],
    preferredGender: 'male',
    keywords: ['male', 'deep', 'mature', 'gravelly', '男', '低沉', '成熟'],
  },
  raider: {
    character: 'raider',
    preferredLanguages: ['en-US', 'zh-TW', 'zh-CN'],
    preferredGender: 'male',
    keywords: ['male', 'rough', 'aggressive', '男', '粗糙'],
  },

  // 鋼鐵兄弟會
  brotherhood_scribe: {
    character: 'brotherhood_scribe',
    preferredLanguages: ['zh-TW', 'zh-CN', 'en-US'],
    preferredGender: 'male',
    keywords: ['male', 'calm', 'professional', '男', '冷靜', '專業'],
  },
  brotherhood_paladin: {
    character: 'brotherhood_paladin',
    preferredLanguages: ['en-US', 'zh-TW', 'zh-CN'],
    preferredGender: 'male',
    keywords: ['male', 'deep', 'authoritative', 'military', '男', '深沉', '權威'],
  },

  // NCR
  ncr_ranger: {
    character: 'ncr_ranger',
    preferredLanguages: ['en-US', 'zh-TW', 'zh-CN'],
    preferredGender: 'male',
    keywords: ['male', 'professional', 'confident', '男', '專業', '自信'],
  },

  // 凱薩軍團
  legion_centurion: {
    character: 'legion_centurion',
    preferredLanguages: ['en-US', 'zh-TW', 'zh-CN'],
    preferredGender: 'male',
    keywords: ['male', 'deep', 'commanding', 'authoritative', '男', '深沉', '命令'],
  },

  // Fallout 4 陣營角色
  minuteman: {
    character: 'minuteman',
    preferredLanguages: ['en-US', 'zh-TW', 'zh-CN'],
    preferredGender: 'male',
    keywords: ['male', 'friendly', 'warm', '男', '友善', '溫暖'],
  },
  railroad_agent: {
    character: 'railroad_agent',
    preferredLanguages: ['en-US', 'zh-TW', 'zh-CN'],
    preferredGender: undefined, // 特工不分性別
    keywords: ['calm', 'mysterious', 'quiet', '冷靜', '神秘', '安靜'],
  },
  institute_scientist: {
    character: 'institute_scientist',
    preferredLanguages: ['en-US', 'zh-TW', 'zh-CN'],
    preferredGender: 'male',
    keywords: ['male', 'intelligent', 'technical', 'precise', '男', '智慧', '精確'],
  },
};

/**
 * 智能語音選擇器類別
 */
export class VoiceSelector {
  private availableVoices: SpeechSynthesisVoice[] = [];
  private voiceCache: Map<CharacterVoice, SpeechSynthesisVoice | null> = new Map();

  /**
   * 初始化並載入可用語音
   */
  async initialize(): Promise<void> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      logger.warn('[VoiceSelector] Speech synthesis not supported');
      return;
    }

    // 載入語音（某些瀏覽器異步載入）
    this.availableVoices = window.speechSynthesis.getVoices();

    if (this.availableVoices.length === 0) {
      // 等待語音載入
      await new Promise<void>((resolve) => {
        window.speechSynthesis.onvoiceschanged = () => {
          this.availableVoices = window.speechSynthesis.getVoices();
          logger.info(`[VoiceSelector] Loaded ${this.availableVoices.length} voices`);
          resolve();
        };

        // 超時保護（2秒）
        setTimeout(() => {
          this.availableVoices = window.speechSynthesis.getVoices();
          resolve();
        }, 2000);
      });
    }

    logger.info(`[VoiceSelector] Available voices: ${this.availableVoices.length}`);
  }

  /**
   * 為角色選擇最佳語音
   */
  selectBestVoice(character: CharacterVoice): SpeechSynthesisVoice | null {
    // 檢查快取
    if (this.voiceCache.has(character)) {
      return this.voiceCache.get(character) || null;
    }

    // 獲取角色偏好
    const preference = CHARACTER_VOICE_PREFERENCES[character];
    if (!preference) {
      logger.warn(`[VoiceSelector] No preference found for character: ${character}`);
      return this.getDefaultVoice();
    }

    // 評分所有可用語音
    const scoredVoices = this.availableVoices.map((voice) =>
      this.scoreVoice(voice, preference)
    );

    // 排序並選擇最高分
    scoredVoices.sort((a, b) => b.score - a.score);

    const bestMatch = scoredVoices[0];
    if (bestMatch && bestMatch.score > 0) {
      logger.info(
        `[VoiceSelector] Best match for ${character}: ${bestMatch.voice.name} (score: ${bestMatch.score})`,
        bestMatch.reasons
      );
      this.voiceCache.set(character, bestMatch.voice);
      return bestMatch.voice;
    }

    // 無匹配，使用預設語音
    logger.warn(`[VoiceSelector] No suitable voice found for ${character}, using default`);
    const defaultVoice = this.getDefaultVoice();
    this.voiceCache.set(character, defaultVoice);
    return defaultVoice;
  }

  /**
   * 評分單一語音
   */
  private scoreVoice(
    voice: SpeechSynthesisVoice,
    preference: VoicePreference
  ): VoiceScore {
    let score = 0;
    const reasons: string[] = [];

    const voiceName = voice.name.toLowerCase();
    const voiceLang = voice.lang.toLowerCase();

    // 1. 語言匹配 (最高優先級，50 分)
    const langIndex = preference.preferredLanguages.findIndex((lang) =>
      voiceLang.startsWith(lang.toLowerCase())
    );
    if (langIndex !== -1) {
      const langScore = 50 - langIndex * 10; // 第一優先 50 分，第二 40 分，依此類推
      score += langScore;
      reasons.push(`Language match: ${voice.lang} (+${langScore})`);
    }

    // 2. 性別匹配 (30 分)
    if (preference.preferredGender) {
      const isMale = voiceName.includes('male') && !voiceName.includes('female');
      const isFemale = voiceName.includes('female');

      if (preference.preferredGender === 'male' && isMale) {
        score += 30;
        reasons.push('Gender match: male (+30)');
      } else if (preference.preferredGender === 'female' && isFemale) {
        score += 30;
        reasons.push('Gender match: female (+30)');
      }
    }

    // 3. 關鍵字匹配 (每個 10 分)
    preference.keywords.forEach((keyword) => {
      if (voiceName.includes(keyword.toLowerCase())) {
        score += 10;
        reasons.push(`Keyword match: ${keyword} (+10)`);
      }
    });

    // 4. 排除關鍵字 (每個 -50 分，強制排除)
    if (preference.excludeKeywords) {
      preference.excludeKeywords.forEach((keyword) => {
        if (voiceName.includes(keyword.toLowerCase())) {
          score -= 50;
          reasons.push(`Exclude keyword: ${keyword} (-50)`);
        }
      });
    }

    // 5. 本地語音優先 (10 分)
    if (voice.localService) {
      score += 10;
      reasons.push('Local voice (+10)');
    }

    return { voice, score, reasons };
  }

  /**
   * 獲取預設語音（繁體中文或英文）
   */
  private getDefaultVoice(): SpeechSynthesisVoice | null {
    // 優先繁體中文
    let defaultVoice = this.availableVoices.find((voice) =>
      voice.lang.toLowerCase().startsWith('zh-tw')
    );

    // 其次簡體中文
    if (!defaultVoice) {
      defaultVoice = this.availableVoices.find((voice) =>
        voice.lang.toLowerCase().startsWith('zh-cn')
      );
    }

    // 最後英文
    if (!defaultVoice) {
      defaultVoice = this.availableVoices.find((voice) =>
        voice.lang.toLowerCase().startsWith('en')
      );
    }

    // 完全沒有就用第一個
    if (!defaultVoice && this.availableVoices.length > 0) {
      defaultVoice = this.availableVoices[0];
    }

    return defaultVoice || null;
  }

  /**
   * 獲取所有可用語音
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices;
  }

  /**
   * 清除快取
   */
  clearCache(): void {
    this.voiceCache.clear();
  }

  /**
   * 獲取角色的語音偏好資訊（用於 UI 顯示）
   */
  getCharacterPreference(character: CharacterVoice): VoicePreference | undefined {
    return CHARACTER_VOICE_PREFERENCES[character];
  }
}

/**
 * 單例實例（與 SpeechEngine 共用）
 */
let voiceSelectorInstance: VoiceSelector | null = null;

export function getVoiceSelector(): VoiceSelector {
  if (!voiceSelectorInstance) {
    voiceSelectorInstance = new VoiceSelector();
  }
  return voiceSelectorInstance;
}
