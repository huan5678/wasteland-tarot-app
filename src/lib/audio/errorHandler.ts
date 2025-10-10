/**
 * ErrorHandler - Music Player Error Handling Module
 * Task 4: 錯誤處理模組
 *
 * Requirements 10.1, 10.2, 10.3 (錯誤處理、重試機制、錯誤率監控)
 */

import { logger } from '../logger';

/**
 * 音樂播放器錯誤類型
 * Requirements 10.1: 定義所有可能的錯誤類型
 */
export enum MusicPlayerErrorType {
  ENGINE_INIT_FAILED = 'ENGINE_INIT_FAILED',           // 音樂引擎初始化失敗
  MODE_LOAD_FAILED = 'MODE_LOAD_FAILED',               // 音樂模式載入失敗
  AUDIO_CONTEXT_SUSPENDED = 'AUDIO_CONTEXT_SUSPENDED', // AudioContext 被暫停
  STORAGE_WRITE_FAILED = 'STORAGE_WRITE_FAILED',       // localStorage 寫入失敗
  PLAYLIST_CORRUPTED = 'PLAYLIST_CORRUPTED',           // 播放清單資料損壞
}

/**
 * 自訂音樂播放器錯誤類別
 * Requirements 10.1: 建立自訂錯誤類別
 */
export class MusicPlayerError extends Error {
  public readonly type: MusicPlayerErrorType;
  public readonly recoverable: boolean;
  public readonly originalError?: Error;
  public readonly timestamp: number;

  constructor(
    type: MusicPlayerErrorType,
    message: string,
    recoverable: boolean = true,
    originalError?: Error
  ) {
    super(message);
    this.name = 'MusicPlayerError';
    this.type = type;
    this.recoverable = recoverable;
    this.originalError = originalError;
    this.timestamp = Date.now();

    // 維持正確的 stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MusicPlayerError);
    }
  }

  /**
   * 取得使用者友善的錯誤訊息
   */
  getUserMessage(): string {
    const messages: Record<MusicPlayerErrorType, string> = {
      [MusicPlayerErrorType.ENGINE_INIT_FAILED]:
        '音樂引擎初始化失敗。請檢查瀏覽器音訊支援。',
      [MusicPlayerErrorType.MODE_LOAD_FAILED]:
        '音樂模式載入失敗。正在重試...',
      [MusicPlayerErrorType.AUDIO_CONTEXT_SUSPENDED]:
        '音訊已被瀏覽器暫停。請點擊任意位置以繼續播放。',
      [MusicPlayerErrorType.STORAGE_WRITE_FAILED]:
        '無法儲存設定。請檢查瀏覽器儲存空間。',
      [MusicPlayerErrorType.PLAYLIST_CORRUPTED]:
        '播放清單資料損壞。已重置為預設設定。',
    };

    return messages[this.type] || '發生未知錯誤';
  }

  /**
   * 轉換為可序列化的物件 (用於日誌)
   */
  toJSON() {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      recoverable: this.recoverable,
      timestamp: this.timestamp,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack,
      } : undefined,
    };
  }
}

/**
 * 重試配置選項
 */
export interface RetryOptions {
  maxRetries?: number;        // 最大重試次數 (預設 3)
  backoffMs?: number;         // 初始退避時間 (預設 100ms)
  backoffMultiplier?: number; // 退避倍增器 (預設 2)
  maxBackoffMs?: number;      // 最大退避時間 (預設 5000ms)
  onRetry?: (attempt: number, error: Error) => void; // 重試回調
}

/**
 * ErrorHandler 單例類別
 * Requirements 10.2, 10.3: 重試機制和錯誤率監控
 */
export class ErrorHandler {
  private static instance: ErrorHandler | null = null;

  // 錯誤率監控
  private static readonly MAX_RETRIES = 3;
  private static readonly ERROR_RATE_THRESHOLD = 0.3; // 30%
  private static errorCount = 0;
  private static totalAttempts = 0;
  private static errorHistory: Array<{ timestamp: number; type: MusicPlayerErrorType }> = [];
  private static readonly ERROR_HISTORY_WINDOW = 60000; // 1 分鐘

  private constructor() {
    // 私有建構子，防止外部實例化
  }

  /**
   * 取得 ErrorHandler 單例
   */
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 帶重試的操作執行
   * Requirements 10.2: 重試機制 (最多 3 次，exponential backoff)
   *
   * @param operation - 要執行的操作
   * @param options - 重試配置選項
   * @returns 操作結果
   * @throws {Error} 當所有重試都失敗時
   */
  async retry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = ErrorHandler.MAX_RETRIES,
      backoffMs = 100,
      backoffMultiplier = 2,
      maxBackoffMs = 5000,
      onRetry,
    } = options;

    ErrorHandler.totalAttempts++;

    let lastError: Error | null = null;
    let currentBackoff = backoffMs;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // 最後一次嘗試失敗
        if (attempt === maxRetries) {
          ErrorHandler.errorCount++;
          this.trackError(error as Error);
          this.checkErrorRate();
          break;
        }

        // 呼叫重試回調
        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }

        logger.warn(
          `[ErrorHandler] Operation failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${currentBackoff}ms...`,
          { error: lastError }
        );

        // Exponential backoff
        await this.delay(currentBackoff);
        currentBackoff = Math.min(currentBackoff * backoffMultiplier, maxBackoffMs);
      }
    }

    // 所有重試都失敗
    throw lastError || new Error('Operation failed after all retries');
  }

  /**
   * 追蹤錯誤
   * Requirements 10.3: 錯誤率監控
   */
  private trackError(error: Error): void {
    const now = Date.now();

    // 判斷錯誤類型
    let errorType: MusicPlayerErrorType = MusicPlayerErrorType.MODE_LOAD_FAILED;
    if (error instanceof MusicPlayerError) {
      errorType = error.type;
    }

    // 新增到錯誤歷史
    ErrorHandler.errorHistory.push({ timestamp: now, type: errorType });

    // 清理過期的錯誤記錄 (超過 1 分鐘)
    ErrorHandler.errorHistory = ErrorHandler.errorHistory.filter(
      (entry) => now - entry.timestamp <= ErrorHandler.ERROR_HISTORY_WINDOW
    );

    logger.error('[ErrorHandler] Error tracked', {
      type: errorType,
      message: error.message,
      totalErrors: ErrorHandler.errorCount,
      recentErrors: ErrorHandler.errorHistory.length,
    });
  }

  /**
   * 檢查錯誤率
   * Requirements 10.3: 錯誤率超過 30% 時停用音樂功能
   */
  private checkErrorRate(): void {
    if (ErrorHandler.totalAttempts === 0) return;

    const errorRate = ErrorHandler.errorCount / ErrorHandler.totalAttempts;

    if (errorRate > ErrorHandler.ERROR_RATE_THRESHOLD) {
      logger.error(
        `[ErrorHandler] Error rate ${(errorRate * 100).toFixed(1)}% exceeds threshold ${(ErrorHandler.ERROR_RATE_THRESHOLD * 100).toFixed(1)}%. Music player may be disabled.`,
        {
          errorCount: ErrorHandler.errorCount,
          totalAttempts: ErrorHandler.totalAttempts,
          errorRate: errorRate.toFixed(3),
        }
      );

      // Note: 實際停用音樂播放器的邏輯應該由呼叫方處理
      // 這裡只是記錄錯誤率超標的情況
    }
  }

  /**
   * 處理錯誤
   * 統一錯誤處理入口
   *
   * @param error - 錯誤物件
   * @param context - 錯誤上下文資訊
   */
  handleError(error: Error | MusicPlayerError, context?: Record<string, unknown>): void {
    if (error instanceof MusicPlayerError) {
      logger.error(`[ErrorHandler] MusicPlayerError: ${error.type}`, {
        message: error.message,
        userMessage: error.getUserMessage(),
        recoverable: error.recoverable,
        context,
        ...error.toJSON(),
      });
    } else {
      logger.error('[ErrorHandler] Unexpected error', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        context,
      });
    }

    this.trackError(error);
  }

  /**
   * 重置錯誤計數器
   * 用於測試或手動重置
   */
  static resetMetrics(): void {
    ErrorHandler.errorCount = 0;
    ErrorHandler.totalAttempts = 0;
    ErrorHandler.errorHistory = [];
    logger.info('[ErrorHandler] Metrics reset');
  }

  /**
   * 取得當前錯誤率
   */
  static getErrorRate(): number {
    if (ErrorHandler.totalAttempts === 0) return 0;
    return ErrorHandler.errorCount / ErrorHandler.totalAttempts;
  }

  /**
   * 取得錯誤統計
   */
  static getMetrics() {
    return {
      errorCount: ErrorHandler.errorCount,
      totalAttempts: ErrorHandler.totalAttempts,
      errorRate: this.getErrorRate(),
      recentErrors: ErrorHandler.errorHistory.length,
      threshold: ErrorHandler.ERROR_RATE_THRESHOLD,
      isAboveThreshold: this.getErrorRate() > ErrorHandler.ERROR_RATE_THRESHOLD,
    };
  }

  /**
   * 延遲工具函數
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * 便捷函數：建立 MusicPlayerError
 */
export function createMusicPlayerError(
  type: MusicPlayerErrorType,
  message: string,
  recoverable: boolean = true,
  originalError?: Error
): MusicPlayerError {
  return new MusicPlayerError(type, message, recoverable, originalError);
}

/**
 * 便捷函數：取得 ErrorHandler 單例
 */
export function getErrorHandler(): ErrorHandler {
  return ErrorHandler.getInstance();
}
