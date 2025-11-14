/**
 * useTTS Hook - TTS 語音播放狀態管理與控制
 *
 * Requirement 2: Text-to-Speech (TTS) 整合
 * - 管理 TTS 播放狀態 (loading, playing, paused, complete, error)
 * - 提供播放控制方法 (play, pause, resume, stop, setVolume)
 * - 整合 TTS API 呼叫 (參考 chirp3-hd-tts-system spec)
 * - 實作錯誤處理 (network, timeout, 4xx, 5xx)
 * - 監聽 audioStore 設定 (muted, volume)
 * - Cleanup 邏輯 (unmount 時停止播放)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioStore } from '@/lib/audio/audioStore';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * TTS 狀態介面
 */
export interface TTSState {
  // Playback state
  isLoading: boolean;                   // 是否正在載入 TTS 音檔
  isPlaying: boolean;                   // 是否正在播放
  isPaused: boolean;                    // 是否已暫停
  isComplete: boolean;                  // 是否播放完成

  // Error state
  error: Error | null;                  // 技術錯誤物件
  userFriendlyError: string | null;     // 使用者友善錯誤訊息

  // Progress state
  progress: number;                     // 播放進度 (0-100)
  duration: number;                     // 總時長（秒）

  // Control methods
  play: () => void;                     // 開始播放
  pause: () => void;                    // 暫停播放
  resume: () => void;                   // 恢復播放
  stop: () => void;                     // 停止並重置
  setVolume: (volume: number) => void;  // 調整音量
}

/**
 * TTS Hook 選項
 */
export interface TTSOptions {
  text: string;                         // 要播放的文字內容
  voice?: string;                       // 角色語音 ID（預設: 'pip_boy'）
  language?: string;                    // 語言代碼（預設: 'zh-TW'）
  speed?: number;                       // 速度倍率（預設: 1.0）
  autoPlay?: boolean;                   // 是否自動播放（預設: check settings）
  onPlaybackComplete?: () => void;      // 播放完成回調
}

/**
 * TTS API 請求介面（對應 backend/app/api/v1/endpoints/audio.py）
 */
interface TTSRequest {
  text: string;
  character_key: string;
  audio_type?: string;
  cache_enabled?: boolean;
  return_format?: string;
  force_voice_model?: string;
  language_code?: string;
}

/**
 * TTS API 回應介面
 */
interface TTSResponse {
  url: string;                          // 音檔 URL
  duration: number;                     // 時長（秒）
  file_size: number;                    // 檔案大小（bytes）
  cached: boolean;                      // 是否來自快取
  source: string;                       // 來源（'redis' | 'db' | 'new'）
  voice_model: string;                  // 使用的語音模型
  voice_name: string;                   // 實際語音名稱
  character: {
    key: string;
    name: string;
    voice_params: Record<string, unknown>;
  };
}

/**
 * 錯誤類型枚舉
 */
enum ErrorType {
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  CLIENT_ERROR = 'client_error',      // 4xx
  SERVER_ERROR = 'server_error',      // 5xx
  AUDIO_LOAD_ERROR = 'audio_load_error',
  UNKNOWN = 'unknown',
}

/**
 * 友善錯誤訊息映射
 */
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: '網路連線失敗，請檢查您的網路連線',
  [ErrorType.TIMEOUT]: '語音載入逾時，請稍後重試',
  [ErrorType.CLIENT_ERROR]: '請求參數錯誤，請重新整理頁面',
  [ErrorType.SERVER_ERROR]: '語音播放功能暫時無法使用，您仍可閱讀文字內容',
  [ErrorType.AUDIO_LOAD_ERROR]: '音檔載入失敗，請重試',
  [ErrorType.UNKNOWN]: '發生未知錯誤，請重試',
};

// ============================================================================
// Constants
// ============================================================================

const TTS_API_URL = '/api/v1/audio/synthesize';
const DEFAULT_TIMEOUT = 60000; // 60 seconds (increased for longer texts)
const DEFAULT_VOICE = 'pip_boy';
const DEFAULT_LANGUAGE = 'zh-TW';
const DEFAULT_SPEED = 1.0;

// ============================================================================
// useTTS Hook
// ============================================================================

/**
 * useTTS - TTS 語音播放 Hook
 *
 * @param options - TTS 選項
 * @returns TTSState - TTS 狀態與控制方法
 *
 * @example
 * ```tsx
 * const tts = useTTS({
 *   text: "廢土塔羅系統歡迎您",
 *   voice: "pip_boy",
 *   autoPlay: true,
 *   onPlaybackComplete: () => console.log("Playback finished")
 * });
 *
 * // 控制播放
 * <button onClick={tts.play}>播放</button>
 * <button onClick={tts.pause}>暫停</button>
 * <button onClick={tts.stop}>停止</button>
 *
 * // 顯示狀態
 * {tts.isLoading && <div>載入中...</div>}
 * {tts.error && <div>{tts.userFriendlyError}</div>}
 * <progress value={tts.progress} max="100" />
 * ```
 */
export function useTTS(options: TTSOptions): TTSState {
  const {
    text,
    voice = DEFAULT_VOICE,
    language = DEFAULT_LANGUAGE,
    speed = DEFAULT_SPEED,
    autoPlay,
    onPlaybackComplete,
  } = options;

  // ============================================================================
  // State Management
  // ============================================================================

  // Playback state
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Error state
  const [error, setError] = useState<Error | null>(null);
  const [userFriendlyError, setUserFriendlyError] = useState<string | null>(null);

  // Progress state
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // ============================================================================
  // Refs (不觸發 re-render)
  // ============================================================================

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  // ============================================================================
  // Audio Store Integration
  // ============================================================================

  const voiceVolume = useAudioStore((state) =>
    state.muted.voice ? 0 : state.volumes.voice
  );
  const isVoiceMuted = useAudioStore((state) => state.muted.voice);

  // ============================================================================
  // Error Handling
  // ============================================================================

  /**
   * 設定錯誤狀態
   */
  const setErrorState = useCallback((err: Error, type: ErrorType) => {
    // 安全地輸出錯誤（避免循環引用）
    console.error('[useTTS] Error occurred:', {
      type,
      message: err?.message || 'Unknown error',
      name: err?.name || 'Error',
      stack: err?.stack
    });
    setError(err);
    setUserFriendlyError(ERROR_MESSAGES[type]);
    setIsLoading(false);
    setIsPlaying(false);
  }, []);

  /**
   * 判斷錯誤類型
   */
  const getErrorType = useCallback((err: unknown): ErrorType => {
    if (err instanceof Error) {
      const message = err.message.toLowerCase();

      // Network errors
      if (message.includes('network') || message.includes('fetch')) {
        return ErrorType.NETWORK;
      }

      // Timeout errors
      if (message.includes('timeout') || message.includes('aborted')) {
        return ErrorType.TIMEOUT;
      }

      // HTTP errors (需從 Response 判斷)
      if (message.includes('4')) {
        return ErrorType.CLIENT_ERROR;
      }
      if (message.includes('5')) {
        return ErrorType.SERVER_ERROR;
      }
    }

    return ErrorType.UNKNOWN;
  }, []);

  // ============================================================================
  // TTS API Integration
  // ============================================================================

  /**
   * 呼叫 TTS API 生成音檔
   */
  const fetchTTSAudio = useCallback(async (): Promise<string> => {
    // 建立 AbortController 用於 timeout 和 cleanup
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // 設定 timeout
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
    }, DEFAULT_TIMEOUT);

    try {
      const requestBody: TTSRequest = {
        text,
        character_key: voice,
        audio_type: 'ai_response',
        cache_enabled: true,
        return_format: 'url',
        language_code: language,
      };

      console.log('[useTTS] Fetching TTS audio:', requestBody);

      const response = await fetch(TTS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        credentials: 'include', // 包含認證 cookies
        signal,
      });

      clearTimeout(timeoutId);

      // 檢查 HTTP 狀態碼
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || `HTTP ${response.status}`;

        console.error('[useTTS] TTS API error:', {
          status: response.status,
          detail: errorMessage
        });

        if (response.status >= 400 && response.status < 500) {
          throw new Error(`Client Error: ${errorMessage}`);
        } else if (response.status >= 500) {
          throw new Error(`Server Error: ${errorMessage}`);
        }

        throw new Error(errorMessage);
      }

      const data: TTSResponse = await response.json();

      console.log('[useTTS] TTS audio fetched successfully:', {
        url: data.url,
        duration: data.duration,
        cached: data.cached,
        voice_model: data.voice_model,
      });

      setDuration(data.duration);

      return data.url;

    } catch (err) {
      clearTimeout(timeoutId);

      // 如果是 abort，判定為 timeout
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      throw err;
    }
  }, [text, voice, language]);

  /**
   * 載入並準備音檔
   */
  const loadAudio = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setUserFriendlyError(null);

      // 1. 呼叫 TTS API 取得音檔 URL
      const audioUrl = await fetchTTSAudio();
      audioUrlRef.current = audioUrl;

      // 2. 建立 Audio 元素
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // 設定初始音量（根據 audioStore 設定）
      audio.volume = isVoiceMuted ? 0 : voiceVolume;
      audio.playbackRate = speed;

      // 3. 監聽音檔事件
      audio.addEventListener('loadedmetadata', () => {
        console.log('[useTTS] Audio metadata loaded:', {
          duration: audio.duration,
        });
        setDuration(audio.duration);
        setIsLoading(false);
      });

      audio.addEventListener('timeupdate', () => {
        if (audio.duration > 0) {
          const currentProgress = (audio.currentTime / audio.duration) * 100;
          setProgress(currentProgress);
        }
      });

      audio.addEventListener('ended', () => {
        console.log('[useTTS] Playback ended');
        setIsPlaying(false);
        setIsComplete(true);
        setProgress(100);
        onPlaybackComplete?.();
      });

      audio.addEventListener('error', (e) => {
        const target = e.target as HTMLAudioElement;

        // 忽略 cleanup 造成的錯誤（src 被清空）
        if (!target?.src || target.src === '' || target.src === window.location.href) {
          console.warn('[useTTS] Audio error ignored (cleanup or empty src)');
          return;
        }

        const errorCode = target?.error?.code;
        const errorMessage = target?.error?.message || 'Audio load error';
        console.error('[useTTS] Audio load error:', {
          code: errorCode,
          message: errorMessage,
          src: target?.src
        });
        const err = new Error(`Audio load error: ${errorMessage} (code: ${errorCode})`);
        setErrorState(err, ErrorType.AUDIO_LOAD_ERROR);
      });

      // 4. 預載音檔
      audio.load();

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      const errorType = getErrorType(error);
      setErrorState(error, errorType);
    }
  }, [fetchTTSAudio, speed, voiceVolume, isVoiceMuted, onPlaybackComplete, setErrorState, getErrorType]);

  // ============================================================================
  // Control Methods
  // ============================================================================

  /**
   * 播放音檔
   */
  const play = useCallback(async () => {
    try {
      // 如果音檔未載入，先載入
      if (!audioRef.current) {
        await loadAudio();
      }

      // 再次檢查：loadAudio 可能失敗，audioRef.current 仍為 null
      if (!audioRef.current) {
        console.warn('[useTTS] Cannot play: audio not loaded');
        return;
      }

      // 如果已完成，重新開始
      if (isComplete) {
        audioRef.current.currentTime = 0;
        setIsComplete(false);
        setProgress(0);
      }

      await audioRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);

      console.log('[useTTS] Playback started');

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      // 忽略 AbortError（play 被 pause 中斷是正常的 cleanup 行為）
      if (error.name === 'AbortError') {
        console.warn('[useTTS] Play interrupted (AbortError ignored):', error.message);
        return;
      }

      // 其他錯誤才記錄並設置錯誤狀態
      console.error('[useTTS] Play error:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      setErrorState(error, ErrorType.AUDIO_LOAD_ERROR);
    }
  }, [loadAudio, isComplete, setErrorState]);

  /**
   * 暫停播放
   */
  const pause = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsPaused(true);
      console.log('[useTTS] Playback paused');
    }
  }, [isPlaying]);

  /**
   * 恢復播放
   */
  const resume = useCallback(async () => {
    if (audioRef.current && isPaused) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setIsPaused(false);
        console.log('[useTTS] Playback resumed');
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        // 忽略 AbortError（play 被 pause 中斷是正常的 cleanup 行為）
        if (error.name === 'AbortError') {
          console.warn('[useTTS] Resume interrupted (AbortError ignored):', error.message);
          return;
        }

        // 其他錯誤才記錄並設置錯誤狀態
        console.error('[useTTS] Resume error:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        setErrorState(error, ErrorType.AUDIO_LOAD_ERROR);
      }
    }
  }, [isPaused, setErrorState]);

  /**
   * 停止播放並重置
   */
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
      console.log('[useTTS] Playback stopped');
    }
  }, []);

  /**
   * 設定音量
   */
  const setVolumeControl = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
      console.log('[useTTS] Volume set:', clampedVolume);
    }
  }, []);

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * 監聽 audioStore 音量變化
   */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isVoiceMuted ? 0 : voiceVolume;
      console.log('[useTTS] Volume updated from audioStore:', {
        volume: voiceVolume,
        muted: isVoiceMuted,
      });
    }
  }, [voiceVolume, isVoiceMuted]);

  /**
   * 自動播放（如果啟用）
   */
  useEffect(() => {
    const shouldAutoPlay = autoPlay ?? !isVoiceMuted;

    if (shouldAutoPlay && text && !isPlaying && !isLoading && !error) {
      console.log('[useTTS] Auto-play triggered');
      // 捕獲 promise rejection，防止 React Strict Mode 下的錯誤
      play().catch((err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        console.warn('[useTTS] Auto-play failed (silently handled):', {
          message: error.message,
          name: error.name
        });
        // 靜默失敗，錯誤已經在 play() 內部處理過了
      });
    }
    // 故意不包含 play 在依賴項中，避免無限循環
    // play() 函數內部已有完整的 null check
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, text, isVoiceMuted, isPlaying, isLoading, error]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      console.log('[useTTS] Cleanup on unmount');

      // 停止播放並清理 Audio 元素
      if (audioRef.current) {
        const audio = audioRef.current;

        // 先暫停播放
        audio.pause();

        // 移除所有事件監聽器（避免觸發錯誤）
        audio.onloadedmetadata = null;
        audio.ontimeupdate = null;
        audio.onended = null;
        audio.onerror = null;

        // 不要設置 src = ''，直接讓垃圾回收器處理
        audioRef.current = null;
      }

      // 取消 API 請求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // 清除 interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // 釋放 URL
      if (audioUrlRef.current) {
        audioUrlRef.current = null;
      }
    };
  }, []);

  // ============================================================================
  // Return State & Methods
  // ============================================================================

  return {
    // Playback state
    isLoading,
    isPlaying,
    isPaused,
    isComplete,

    // Error state
    error,
    userFriendlyError,

    // Progress state
    progress,
    duration,

    // Control methods
    play,
    pause,
    resume,
    stop,
    setVolume: setVolumeControl,
  };
}
