/**
 * GuestPlaylistManager - 訪客播放清單管理（localStorage）
 * Task 4.3: 實作 localStorage 訪客播放清單管理
 * Feature: playlist-music-player
 * Requirements: 需求 33.1-33.5
 */

/**
 * 訪客播放清單 Pattern
 */
export interface GuestPlaylistPattern {
  patternId: string;    // 引用 DB 中的 pattern ID
  position: number;     // 順序（0-based）
  addedAt: string;      // ISO timestamp
}

/**
 * 訪客播放清單
 */
export interface GuestPlaylist {
  id: string;           // 固定為 "guest-playlist-local"
  name: string;         // 固定為「訪客播放清單」
  patterns: GuestPlaylistPattern[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 匯出格式（用於註冊時匯入）
 */
export interface GuestPlaylistExport {
  patterns: Array<{
    patternId: string;
    position: number;
  }>;
  patternCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * localStorage 儲存鍵值
 */
const STORAGE_KEY = 'guest_playlist';

/**
 * 訪客播放清單上限（硬編碼）
 */
export const GUEST_PLAYLIST_LIMIT = 4;

/**
 * 訪客播放清單管理器
 */
export class GuestPlaylistManager {
  /**
   * 從 localStorage 載入播放清單
   */
  loadFromLocalStorage(): GuestPlaylist | null {
    if (typeof window === 'undefined') return null;

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;

      const playlist: GuestPlaylist = JSON.parse(data);

      // 驗證資料結構
      if (!this.isValidGuestPlaylist(playlist)) {
        console.error('[GuestPlaylistManager] Invalid playlist data, clearing...');
        this.clearPlaylist();
        return null;
      }

      return playlist;
    } catch (error) {
      console.error('[GuestPlaylistManager] Failed to load from localStorage:', error);
      // 資料損壞，清除
      this.clearPlaylist();
      return null;
    }
  }

  /**
   * 儲存播放清單到 localStorage
   */
  saveToLocalStorage(playlist: GuestPlaylist): void {
    if (typeof window === 'undefined') return;

    try {
      // 驗證資料
      if (!this.isValidGuestPlaylist(playlist)) {
        throw new Error('Invalid playlist data');
      }

      const data = JSON.stringify(playlist);
      localStorage.setItem(STORAGE_KEY, data);
    } catch (error) {
      console.error('[GuestPlaylistManager] Failed to save to localStorage:', error);
      throw error;
    }
  }

  /**
   * 加入 Pattern 到播放清單
   * @returns true 表示成功，false 表示已滿
   */
  addPattern(patternId: string): boolean {
    try {
      let playlist = this.loadFromLocalStorage();

      // 檢查是否已滿
      if (playlist && playlist.patterns.length >= GUEST_PLAYLIST_LIMIT) {
        console.warn('[GuestPlaylistManager] Playlist is full');
        return false;
      }

      // 初始化播放清單（如果不存在）
      if (!playlist) {
        playlist = this.createEmptyPlaylist();
      }

      // 檢查是否重複
      if (playlist.patterns.some((p) => p.patternId === patternId)) {
        console.warn('[GuestPlaylistManager] Pattern already exists');
        return true; // 已存在視為成功
      }

      // 加入 Pattern
      const newPattern: GuestPlaylistPattern = {
        patternId,
        position: playlist.patterns.length,
        addedAt: new Date().toISOString(),
      };

      playlist.patterns.push(newPattern);
      playlist.updatedAt = new Date().toISOString();

      this.saveToLocalStorage(playlist);
      return true;
    } catch (error) {
      console.error('[GuestPlaylistManager] Failed to add pattern:', error);
      return false;
    }
  }

  /**
   * 從播放清單移除 Pattern
   */
  removePattern(patternId: string): void {
    try {
      const playlist = this.loadFromLocalStorage();
      if (!playlist) return;

      // 過濾掉要移除的 Pattern
      playlist.patterns = playlist.patterns.filter((p) => p.patternId !== patternId);

      // 重新計算 position
      playlist.patterns.forEach((p, index) => {
        p.position = index;
      });

      playlist.updatedAt = new Date().toISOString();

      // 如果播放清單空了，清除整個資料
      if (playlist.patterns.length === 0) {
        this.clearPlaylist();
      } else {
        this.saveToLocalStorage(playlist);
      }
    } catch (error) {
      console.error('[GuestPlaylistManager] Failed to remove pattern:', error);
      throw error;
    }
  }

  /**
   * 清除播放清單
   */
  clearPlaylist(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[GuestPlaylistManager] Failed to clear playlist:', error);
    }
  }

  /**
   * 檢查播放清單是否已滿
   */
  isFull(): boolean {
    const playlist = this.loadFromLocalStorage();
    return playlist ? playlist.patterns.length >= GUEST_PLAYLIST_LIMIT : false;
  }

  /**
   * 取得 Pattern 數量
   */
  getPatternCount(): number {
    const playlist = this.loadFromLocalStorage();
    return playlist ? playlist.patterns.length : 0;
  }

  /**
   * 匯出播放清單（用於註冊時匯入）
   */
  exportForMigration(): GuestPlaylistExport | null {
    const playlist = this.loadFromLocalStorage();
    if (!playlist) return null;

    return {
      patterns: playlist.patterns.map((p) => ({
        patternId: p.patternId,
        position: p.position,
      })),
      patternCount: playlist.patterns.length,
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
    };
  }

  /**
   * 建立空白播放清單
   */
  private createEmptyPlaylist(): GuestPlaylist {
    const now = new Date().toISOString();
    return {
      id: 'guest-playlist-local',
      name: '訪客播放清單',
      patterns: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 驗證播放清單資料結構
   */
  private isValidGuestPlaylist(playlist: any): playlist is GuestPlaylist {
    if (!playlist || typeof playlist !== 'object') return false;

    // 檢查必要欄位
    if (
      typeof playlist.id !== 'string' ||
      typeof playlist.name !== 'string' ||
      !Array.isArray(playlist.patterns) ||
      typeof playlist.createdAt !== 'string' ||
      typeof playlist.updatedAt !== 'string'
    ) {
      return false;
    }

    // 檢查 patterns 陣列
    for (const pattern of playlist.patterns) {
      if (
        typeof pattern.patternId !== 'string' ||
        typeof pattern.position !== 'number' ||
        typeof pattern.addedAt !== 'string'
      ) {
        return false;
      }
    }

    // 檢查上限
    if (playlist.patterns.length > GUEST_PLAYLIST_LIMIT) {
      return false;
    }

    return true;
  }
}

/**
 * 單例實例
 */
export const guestPlaylistManager = new GuestPlaylistManager();
