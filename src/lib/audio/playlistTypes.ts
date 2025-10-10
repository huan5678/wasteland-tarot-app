/**
 * Playlist Music Player - Type Definitions
 * 播放清單音樂播放器 - 型別定義
 *
 * Requirements: 3.1, 3.2, 4.1, 4.2 (播放清單建立、模式選擇、重複/隨機播放)
 */

/**
 * 音樂模式定義
 * 對應 ProceduralMusicEngine 的 MusicMode
 * Requirements 1.1, 1.2: 音樂模式瀏覽與選擇
 */
export type MusicMode = 'synthwave' | 'divination' | 'lofi' | 'ambient';

/**
 * 所有可用的音樂模式常數
 */
export const MUSIC_MODES: readonly MusicMode[] = ['synthwave', 'divination', 'lofi', 'ambient'] as const;

/**
 * 循環模式
 * Requirements 2.5-2.7: 單曲循環、列表循環、隨機播放
 */
export type RepeatMode = 'off' | 'one' | 'all';

/**
 * 隨機播放模式
 */
export type ShuffleMode = boolean;

/**
 * 播放清單定義
 * Requirements 3.1, 3.2: 播放清單管理
 */
export interface Playlist {
  id: string;              // UUID
  name: string;            // 播放清單名稱 (1-50 字元)
  modes: MusicMode[];      // 音樂模式陣列 (1-20 個模式)
  createdAt: Date;         // 建立時間
  updatedAt: Date;         // 更新時間
}

/**
 * 播放清單驗證錯誤
 */
export class PlaylistValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlaylistValidationError';
  }
}

/**
 * 驗證播放清單格式和長度限制
 * Requirements 3.1: 播放清單建立驗證
 *
 * @param playlist - 待驗證的播放清單
 * @throws {PlaylistValidationError} 當驗證失敗時
 */
export function validatePlaylist(playlist: Partial<Playlist>): void {
  // 驗證 ID
  if (!playlist.id || typeof playlist.id !== 'string') {
    throw new PlaylistValidationError('播放清單 ID 必須是字串');
  }

  // 驗證名稱
  if (!playlist.name || typeof playlist.name !== 'string') {
    throw new PlaylistValidationError('播放清單名稱必須是字串');
  }

  if (playlist.name.length < 1 || playlist.name.length > 50) {
    throw new PlaylistValidationError('播放清單名稱長度必須在 1-50 個字元之間');
  }

  // 驗證音樂模式陣列
  if (!Array.isArray(playlist.modes)) {
    throw new PlaylistValidationError('播放清單音樂模式必須是陣列');
  }

  if (playlist.modes.length < 1 || playlist.modes.length > 20) {
    throw new PlaylistValidationError('播放清單必須包含 1-20 個音樂模式');
  }

  // 驗證每個音樂模式
  for (const mode of playlist.modes) {
    if (!MUSIC_MODES.includes(mode)) {
      throw new PlaylistValidationError(`無效的音樂模式: ${mode}`);
    }
  }

  // 驗證時間戳記
  if (!(playlist.createdAt instanceof Date)) {
    throw new PlaylistValidationError('播放清單建立時間必須是 Date 物件');
  }

  if (!(playlist.updatedAt instanceof Date)) {
    throw new PlaylistValidationError('播放清單更新時間必須是 Date 物件');
  }
}

/**
 * 檢查是否為有效的音樂模式
 */
export function isMusicMode(value: unknown): value is MusicMode {
  return typeof value === 'string' && MUSIC_MODES.includes(value as MusicMode);
}

/**
 * 檢查是否為有效的循環模式
 */
export function isRepeatMode(value: unknown): value is RepeatMode {
  return value === 'off' || value === 'one' || value === 'all';
}
