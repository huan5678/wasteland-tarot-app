/**
 * Music Types - Playlist Music Player
 * 音樂系統型別定義
 */

/**
 * 音樂參數介面 (對應 music_tracks.parameters JSONB 欄位)
 */
export interface MusicParameters {
  key: "C" | "D" | "E" | "F" | "G" | "A" | "B";
  mode: "major" | "minor";
  tempo: number;              // 60-180 BPM
  timbre: "sine" | "square" | "sawtooth" | "triangle";
  genre: string[];            // ["ambient", "synthwave", "lofi", "industrial"]
  mood: string[];             // ["mysterious", "energetic", "calm", "dark"]
}

/**
 * 音樂軌道介面 (對應 music_tracks 資料表)
 */
export interface MusicTrack {
  id: string;
  user_id: string | null;     // NULL 表示系統音樂
  title: string;
  prompt?: string;            // 生成 prompt (系統音樂無此欄位)
  parameters: MusicParameters;
  audio_data: string;         // 序列化的 Web Audio API 參數
  duration: number;           // 音樂時長 (秒)
  is_public: boolean;
  is_system: boolean;         // 系統預設音樂標記
  play_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * 分頁資訊介面
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

/**
 * GET /api/music 回應格式
 */
export interface GetMusicResponse {
  data: MusicTrack[];
  pagination: Pagination;
}

/**
 * POST /api/music 請求 body
 */
export interface CreateMusicRequest {
  title: string;
  prompt?: string;
  parameters: MusicParameters;
  audio_data: string;
  duration?: number;
  is_public?: boolean;
}

/**
 * POST /api/music 回應格式
 */
export interface CreateMusicResponse {
  success: boolean;
  data?: {
    id: string;
    music: MusicTrack;
    quotaRemaining?: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * DELETE /api/music/:id 回應格式
 */
export interface DeleteMusicResponse {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 播放清單介面 (對應 playlists 資料表)
 */
export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  tracks: MusicTrack[];  // JOIN 後的完整音樂資料
  created_at: string;
  updated_at: string;
}

/**
 * 播放清單軌道關聯介面 (對應 playlist_tracks 資料表)
 */
export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
  added_at: string;
}

/**
 * GET /api/playlists 回應格式
 */
export interface GetPlaylistsResponse {
  data: Playlist[];
}

/**
 * POST /api/playlists 請求 body
 */
export interface CreatePlaylistRequest {
  name: string;
  description?: string;
}

/**
 * POST /api/playlists 回應格式
 */
export interface CreatePlaylistResponse {
  success: boolean;
  data?: {
    playlist: Playlist;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * PUT /api/playlists/:id 請求 body
 */
export interface UpdatePlaylistRequest {
  name: string;
}

/**
 * PUT /api/playlists/:id 回應格式
 */
export interface UpdatePlaylistResponse {
  success: boolean;
  data?: {
    playlist: Playlist;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * DELETE /api/playlists/:id 回應格式
 */
export interface DeletePlaylistResponse {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * POST /api/playlists/:id/tracks 請求 body
 */
export interface AddTrackToPlaylistRequest {
  track_id: string;
}

/**
 * POST /api/playlists/:id/tracks 回應格式
 */
export interface AddTrackToPlaylistResponse {
  success: boolean;
  data?: {
    playlistTrack: PlaylistTrack;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * DELETE /api/playlists/:id/tracks/:trackId 回應格式
 */
export interface RemoveTrackFromPlaylistResponse {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * PUT /api/playlists/:id/reorder 請求 body
 */
export interface ReorderPlaylistTracksRequest {
  trackIds: string[];  // 新的順序 (track_id 陣列)
}

/**
 * PUT /api/playlists/:id/reorder 回應格式
 */
export interface ReorderPlaylistTracksResponse {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 錯誤代碼列舉
 */
export enum MusicErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  NOT_FOUND = 'NOT_FOUND',
  SYSTEM_MUSIC_DELETE_FORBIDDEN = 'SYSTEM_MUSIC_DELETE_FORBIDDEN',
  DEFAULT_PLAYLIST_DELETE_FORBIDDEN = 'DEFAULT_PLAYLIST_DELETE_FORBIDDEN',
  PLAYLIST_LIMIT_EXCEEDED = 'PLAYLIST_LIMIT_EXCEEDED',
  TRACK_ALREADY_IN_PLAYLIST = 'TRACK_ALREADY_IN_PLAYLIST',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  DB_ERROR = 'DB_ERROR',
}
