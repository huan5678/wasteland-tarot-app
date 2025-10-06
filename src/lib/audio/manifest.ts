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
    logger.error('[AudioManifest] Failed to load manifest', error);
    throw error;
  }
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
