/**
 * Audio Manifest Loader
 * 音訊清單載入系統
 * 需求 5.1: 從 manifest.json 載入音效清單配置
 */

import type { AudioManifest } from './types';
import { AUDIO_MANIFEST_URL } from './constants';
import { logger } from '../logger';

let cachedManifest: AudioManifest | null = null;

/**
 * 獲取音訊清單
 * 需求 5.1: 載入音訊清單配置
 *
 * 注意：由於使用 Web Audio API 生成音效，manifest.json 為可選配置
 * 如果載入失敗，將使用 constants.ts 中的 SOUND_CONFIGS 作為後備
 */
export async function fetchAudioManifest(): Promise<AudioManifest> {
  // 返回快取的清單
  if (cachedManifest) {
    return cachedManifest;
  }

  try {
    const response = await fetch(AUDIO_MANIFEST_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch manifest: ${response.status}`);
    }

    const manifest: AudioManifest = await response.json();

    // 驗證清單結構
    if (!validateManifest(manifest)) {
      throw new Error('Invalid manifest structure');
    }

    cachedManifest = manifest;
    logger.info(`[AudioManifest] Loaded version ${manifest.version}`);

    return manifest;
  } catch (error) {
    logger.warn('[AudioManifest] Failed to load manifest, using fallback config', error);
    // 使用後備配置
    return getFallbackManifest();
  }
}

/**
 * 取得後備清單（從 constants.ts）
 * 當 manifest.json 載入失敗時使用
 */
function getFallbackManifest(): AudioManifest {
  const { SOUND_CONFIGS } = require('./constants');

  const manifest: AudioManifest = {
    version: '1.0.0-fallback',
    sounds: Object.values(SOUND_CONFIGS).map((config: any) => ({
      id: config.id,
      url: '', // 不需要 URL，使用生成器
      type: config.type,
      priority: config.priority,
      size: 0, // 生成的音效沒有檔案大小
    })),
    music: [
      {
        id: 'wasteland-ambient',
        url: '', // 不需要 URL，使用生成器
        scene: 'home',
        size: 0,
      },
      {
        id: 'divination-theme',
        url: '',
        scene: 'reading',
        size: 0,
      },
      {
        id: 'vault-theme',
        url: '',
        scene: 'dashboard',
        size: 0,
      },
    ],
    lastUpdated: new Date().toISOString(),
  };

  cachedManifest = manifest;
  logger.info('[AudioManifest] Using fallback manifest');

  return manifest;
}

/**
 * 驗證清單結構
 */
function validateManifest(manifest: any): manifest is AudioManifest {
  return (
    manifest &&
    typeof manifest.version === 'string' &&
    Array.isArray(manifest.sounds) &&
    Array.isArray(manifest.music) &&
    manifest.sounds.every((s: any) =>
      typeof s.id === 'string' &&
      typeof s.url === 'string' &&
      typeof s.type === 'string' &&
      typeof s.priority === 'string'
    ) &&
    manifest.music.every((m: any) =>
      typeof m.id === 'string' &&
      typeof m.url === 'string' &&
      typeof m.scene === 'string'
    )
  );
}

/**
 * 獲取關鍵音效列表
 * 需求 5.1: 預載關鍵音效
 */
export async function getCriticalSounds() {
  const manifest = await fetchAudioManifest();
  return manifest.sounds.filter(s => s.priority === 'critical');
}

/**
 * 獲取非關鍵音效列表
 * 需求 5.4: 延遲載入非關鍵音效
 */
export async function getNonCriticalSounds() {
  const manifest = await fetchAudioManifest();
  return manifest.sounds.filter(s => s.priority !== 'critical');
}

/**
 * 根據場景取得音樂
 */
export async function getMusicByScene(scene: string) {
  const manifest = await fetchAudioManifest();
  return manifest.music.find(m => m.scene === scene);
}

/**
 * 清除快取的清單（用於重新載入）
 */
export function clearManifestCache(): void {
  cachedManifest = null;
}
