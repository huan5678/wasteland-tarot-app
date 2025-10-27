/**
 * WebAuthn 錯誤處理工具
 * 將瀏覽器原生錯誤轉換為 Fallout 風格錯誤訊息
 */

/**
 * Fallout 風格錯誤代碼
 */
export enum FalloutErrorCode {
  /** 權限不足 */
  VAULT_ACCESS_DENIED = 'VAULT_ACCESS_DENIED',
  /** WebAuthn 錯誤 */
  PIPBOY_MALFUNCTION = 'PIPBOY_MALFUNCTION',
  /** 網路錯誤 */
  RADIATION_INTERFERENCE = 'RADIATION_INTERFERENCE',
  /** HTTPS 必要 */
  SECURITY_PROTOCOL_VIOLATION = 'SECURITY_PROTOCOL_VIOLATION',
  /** 操作逾時 */
  WASTELAND_TIMEOUT = 'WASTELAND_TIMEOUT',
  /** 使用者取消 */
  VAULT_RESIDENT_CANCELLED = 'VAULT_RESIDENT_CANCELLED',
  /** 瀏覽器不支援 */
  OBSOLETE_PIPBOY = 'OBSOLETE_PIPBOY',
  /** 未知錯誤 */
  UNKNOWN_ANOMALY = 'UNKNOWN_ANOMALY',
}

/**
 * 錯誤處理結果
 */
export interface ErrorHandlerResult {
  /** Fallout 風格錯誤代碼 */
  code: FalloutErrorCode;
  /** 錯誤訊息（zh-TW） */
  message: string;
  /** 使用者可執行的操作建議 */
  action?: string;
  /** 原始錯誤名稱 */
  originalError?: string;
  /** 是否可重試 */
  isRetryable: boolean;
}

/**
 * WebAuthn DOMException 錯誤名稱對照表
 */
const DOM_EXCEPTION_MAP: Record<string, ErrorHandlerResult> = {
  // 使用者取消操作
  NotAllowedError: {
    code: FalloutErrorCode.VAULT_RESIDENT_CANCELLED,
    message: '[Pip-Boy 訊息] 避難所居民取消了生物辨識驗證',
    action: '請重新嘗試驗證',
    isRetryable: true,
  },

  // 逾時錯誤
  TimeoutError: {
    code: FalloutErrorCode.WASTELAND_TIMEOUT,
    message: '[Pip-Boy 警告] 生物辨識驗證逾時，Pip-Boy 反應時間過長',
    action: '請檢查 Pip-Boy 功能是否正常，然後重試',
    isRetryable: true,
  },

  // 安全性錯誤（通常是 HTTPS 問題）
  SecurityError: {
    code: FalloutErrorCode.SECURITY_PROTOCOL_VIOLATION,
    message: '[避難科技警告] 不安全的連線環境，避難科技安全協議要求 HTTPS 加密連線',
    action: '請確認網址開頭為 https://',
    isRetryable: false,
  },

  // 網路錯誤
  NetworkError: {
    code: FalloutErrorCode.RADIATION_INTERFERENCE,
    message: '[Pip-Boy 錯誤] 偵測到輻射干擾，通訊中斷',
    action: '請檢查網路連線並重試',
    isRetryable: true,
  },

  // 不支援的操作
  NotSupportedError: {
    code: FalloutErrorCode.OBSOLETE_PIPBOY,
    message: '[Pip-Boy 警告] 此 Pip-Boy 韌體版本過舊，不支援生物辨識技術',
    action: '請升級瀏覽器至：Chrome 67+, Safari 13+, Firefox 60+, Edge 18+',
    isRetryable: false,
  },

  // 憑證無效或不存在
  InvalidStateError: {
    code: FalloutErrorCode.PIPBOY_MALFUNCTION,
    message: '[Pip-Boy 錯誤] 生物辨識資料異常，Pip-Boy 狀態錯誤',
    action: '請聯絡避難所技術支援',
    isRetryable: false,
  },

  // 權限不足
  AbortError: {
    code: FalloutErrorCode.VAULT_RESIDENT_CANCELLED,
    message: '[Pip-Boy 訊息] 生物辨識驗證被中止',
    action: '請重新嘗試驗證',
    isRetryable: true,
  },
};

/**
 * 處理 WebAuthn 錯誤並轉換為 Fallout 風格訊息
 *
 * @param error - 原始錯誤物件
 * @returns {ErrorHandlerResult} Fallout 風格錯誤資訊
 *
 * @example
 * ```typescript
 * try {
 *   const credential = await navigator.credentials.create(options);
 * } catch (error) {
 *   const falloutError = handleWebAuthnError(error);
 *   toast.error(falloutError.message);
 *   if (falloutError.action) {
 *     console.log('建議操作:', falloutError.action);
 *   }
 * }
 * ```
 */
export function handleWebAuthnError(error: unknown): ErrorHandlerResult {
  // 處理 DOMException
  if (error instanceof DOMException) {
    const mapped = DOM_EXCEPTION_MAP[error.name];
    if (mapped) {
      return {
        ...mapped,
        originalError: error.name,
      };
    }
  }

  // 處理 TypeError (通常是瀏覽器不支援)
  if (error instanceof TypeError) {
    return {
      code: FalloutErrorCode.OBSOLETE_PIPBOY,
      message: '[Pip-Boy 警告] 此 Pip-Boy 不支援生物辨識功能',
      action: '請升級瀏覽器至最新版本',
      originalError: 'TypeError',
      isRetryable: false,
    };
  }

  // 處理標準 Error
  if (error instanceof Error) {
    // 檢查是否為逾時錯誤
    if (error.message.toLowerCase().includes('timeout')) {
      return {
        code: FalloutErrorCode.WASTELAND_TIMEOUT,
        message: '[Pip-Boy 警告] 生物辨識驗證逾時',
        action: '請重試',
        originalError: error.message,
        isRetryable: true,
      };
    }

    // 檢查是否為網路錯誤
    if (
      error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('fetch')
    ) {
      return {
        code: FalloutErrorCode.RADIATION_INTERFERENCE,
        message: '[Pip-Boy 錯誤] 網路連線中斷',
        action: '請檢查網路連線',
        originalError: error.message,
        isRetryable: true,
      };
    }
  }

  // 未知錯誤
  return {
    code: FalloutErrorCode.UNKNOWN_ANOMALY,
    message: '[Pip-Boy 錯誤] 偵測到未知的廢土異常',
    action: '請重試或聯絡避難所技術支援',
    originalError: error instanceof Error ? error.message : String(error),
    isRetryable: true,
  };
}

/**
 * 建立帶有 timeout 的 Promise 包裝器
 *
 * @param promise - 要包裝的 Promise
 * @param timeoutMs - 逾時時間（毫秒），預設 5 分鐘（300000ms）
 * @returns {Promise<T>} 包裝後的 Promise
 *
 * @example
 * ```typescript
 * const credential = await withTimeout(
 *   navigator.credentials.create(options),
 *   300000 // 5 分鐘
 * );
 * ```
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 300000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => {
        reject(
          new DOMException(
            'WebAuthn operation timed out',
            'TimeoutError'
          )
        );
      }, timeoutMs)
    ),
  ]);
}

/**
 * 重試機制包裝器
 *
 * @param fn - 要執行的函式
 * @param maxRetries - 最大重試次數（預設 3 次）
 * @param delayMs - 重試間隔（毫秒，預設 1000ms）
 * @returns {Promise<T>} 函式執行結果
 *
 * @example
 * ```typescript
 * const credential = await withRetry(
 *   () => navigator.credentials.create(options),
 *   3,
 *   1000
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 檢查錯誤是否可重試
      const errorInfo = handleWebAuthnError(error);
      if (!errorInfo.isRetryable) {
        throw error;
      }

      // 如果不是最後一次嘗試，等待後重試
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

/**
 * 取得錯誤的使用者友善訊息
 *
 * @param error - 錯誤物件
 * @returns {string} 使用者友善的錯誤訊息
 */
export function getFriendlyErrorMessage(error: unknown): string {
  const errorInfo = handleWebAuthnError(error);
  return errorInfo.action
    ? `${errorInfo.message}\n\n${errorInfo.action}`
    : errorInfo.message;
}
