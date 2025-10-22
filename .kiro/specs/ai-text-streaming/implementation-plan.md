# AI Text Streaming 實作計畫

**日期**: 2025-10-22
**目標**: 補完 AI 文字串流系統的缺失功能

---

## 📊 目前狀態

- ✅ **80% 完成**：核心串流功能已可運行
- ⚠️ **20% 待補**：重試機制、音效整合、進階錯誤處理

詳細分析請見：`.kiro/specs/ai-text-streaming/analysis.md`

---

## 🎯 實作優先級

### P0: 自動重試機制（必須）⭐
**時間**: 2-3 小時
**檔案**: `src/hooks/useStreamingText.ts`

**為什麼是 P0？**
> "這是真實問題，不是想像的。網路會斷，API 會 timeout。沒有重試機制的串流系統在生產環境會很脆弱。" — Linus

**需實作**：
1. 指數退避重試（exponential backoff）
2. 超時處理（10-30 秒可配置）
3. 重試次數限制（3-5 次可配置）
4. 重試狀態顯示給用戶

### P1: 音效整合（重要）
**時間**: 1-2 小時
**檔案**: `src/hooks/useStreamingText.ts`, `src/components/readings/StreamingInterpretation.tsx`

**需實作**：
1. 在 `useStreamingText` 中加入可選音效參數
2. 音效節流（每 50-100ms 最多觸發一次）
3. 與用戶偏好設定整合

### P2: 進階錯誤處理（可選）
**時間**: 2-3 小時
**檔案**: `src/hooks/useStreamingText.ts`

**需實作**：
1. 網路狀態偵測（`navigator.onLine`）
2. 降級策略（streaming 失敗時 fallback）
3. 錯誤類型分類與友善訊息

---

## 📝 詳細實作指南

### P0: 自動重試機制

#### 1. 在 `useStreamingText` 中加入重試邏輯

```typescript
export interface StreamingTextOptions {
  url: string;
  requestBody: any;
  enabled?: boolean;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
  charsPerSecond?: number;

  // 新增：重試設定
  maxRetries?: number;          // 最大重試次數（預設 3）
  retryDelay?: number;          // 初始重試延遲（預設 1000ms）
  timeout?: number;             // 請求超時（預設 30000ms）
}

export interface StreamingTextState {
  text: string;
  isStreaming: boolean;
  isComplete: boolean;
  error: Error | null;
  skip: () => void;
  reset: () => void;

  // 新增：重試狀態
  retryCount: number;           // 當前重試次數
  isRetrying: boolean;          // 是否正在重試
}
```

#### 2. 實作指數退避重試

```typescript
export function useStreamingText(options: StreamingTextOptions): StreamingTextState {
  const {
    url,
    requestBody,
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 30000,
    // ... 其他選項
  } = options;

  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  /**
   * 計算指數退避延遲
   * 第 1 次重試：1000ms
   * 第 2 次重試：2000ms
   * 第 3 次重試：4000ms
   */
  const getRetryDelay = (attempt: number): number => {
    return retryDelay * Math.pow(2, attempt);
  };

  /**
   * 延遲函式
   */
  const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  /**
   * 帶重試的 fetch
   */
  const fetchWithRetry = async (
    signal: AbortSignal
  ): Promise<Response> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // 如果是重試，顯示重試狀態
        if (attempt > 0) {
          setIsRetrying(true);
          setRetryCount(attempt);
          const delayMs = getRetryDelay(attempt - 1);
          logger.info(`Retrying request (${attempt}/${maxRetries}) after ${delayMs}ms...`);
          await delay(delayMs);
        }

        // 建立帶超時的 AbortController
        const timeoutId = setTimeout(() => {
          throw new Error(`Request timeout after ${timeout}ms`);
        }, timeout);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // 成功，清除重試狀態
        setIsRetrying(false);
        return response;

      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        // 如果是用戶取消或網路離線，不重試
        if (
          lastError.name === 'AbortError' ||
          !navigator.onLine
        ) {
          throw lastError;
        }

        // 如果還有重試次數，繼續
        if (attempt < maxRetries) {
          logger.warn(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}):`, lastError.message);
          continue;
        }

        // 所有重試都失敗
        throw lastError;
      }
    }

    // 不應該到這裡，但為了 TypeScript
    throw lastError || new Error('Unknown error');
  };

  // 在 startStreaming 中使用 fetchWithRetry
  const startStreaming = async () => {
    try {
      const response = await fetchWithRetry(abortController.signal);

      // ... 處理串流
    } catch (err) {
      // 錯誤處理
      setIsRetrying(false);
      setError(err as Error);
    }
  };

  // ... 其餘邏輯
}
```

#### 3. 在 UI 中顯示重試狀態

```tsx
// StreamingInterpretation.tsx
{streaming.isRetrying && (
  <div className="flex items-center gap-2 text-yellow-500/80 mb-4">
    <div className="animate-spin h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full" />
    <span className="text-sm">
      Connection interrupted. Retrying ({streaming.retryCount}/{maxRetries})...
    </span>
  </div>
)}
```

---

### P1: 音效整合

#### 1. 在 `useStreamingText` 中加入音效選項

```typescript
export interface StreamingTextOptions {
  // ... 現有選項

  // 新增：音效設定
  enableTypingSound?: boolean;  // 啟用打字音效（預設 false）
  soundThrottle?: number;       // 音效節流間隔（預設 50ms）
}
```

#### 2. 整合音效播放

```typescript
import { useAudioEffect } from '@/hooks/audio/useAudioEffect';

export function useStreamingText(options: StreamingTextOptions): StreamingTextState {
  const {
    enableTypingSound = false,
    soundThrottle = 50,
    // ...
  } = options;

  const { playSound } = useAudioEffect();
  const lastSoundTime = useRef<number>(0);

  /**
   * 播放打字音效（節流）
   */
  const playTypingSoundThrottled = useCallback(() => {
    if (!enableTypingSound) return;

    const now = Date.now();
    if (now - lastSoundTime.current >= soundThrottle) {
      playSound('typing', { volume: 0.3 }); // 較低音量
      lastSoundTime.current = now;
    }
  }, [enableTypingSound, soundThrottle, playSound]);

  /**
   * 打字機效果（加入音效）
   */
  const startTypewriter = useCallback(() => {
    // ...

    typewriterIntervalRef.current = setInterval(() => {
      // ... 顯示字元邏輯

      // 播放音效
      playTypingSoundThrottled();

      // ...
    }, intervalMs);
  }, [playTypingSoundThrottled, /* ... */]);

  // ...
}
```

#### 3. 建立打字音效

```typescript
// src/lib/audio/SoundGenerator.ts
export async function generateTypingSound(
  audioContext: AudioContext,
  destination: AudioNode,
  options: SoundGeneratorOptions = {}
): Promise<AudioBuffer> {
  const frequency = options.frequency || 1200; // 較高頻率
  const duration = options.duration || 0.03;   // 短促
  const volume = options.volume || 0.3;        // 較低音量

  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  // 生成短促的 click 音效
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 100); // 快速衰減
    data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * volume;
  }

  return buffer;
}
```

#### 4. 在音效系統中註冊

```typescript
// src/lib/audio/manifest.ts
export const SOUND_EFFECTS = {
  // ... 現有音效
  typing: {
    generator: 'generateTypingSound',
    category: 'ui',
    description: 'Typing sound for streaming text',
  },
};
```

---

### P2: 進階錯誤處理

#### 1. 網路狀態偵測

```typescript
export function useStreamingText(options: StreamingTextOptions): StreamingTextState {
  // ...

  /**
   * 監聽網路狀態
   */
  useEffect(() => {
    const handleOffline = () => {
      logger.warn('Network offline detected');
      setError(new Error('Network connection lost'));
      abortControllerRef.current?.abort();
    };

    const handleOnline = () => {
      logger.info('Network online detected');
      // 可選：自動重試
      if (error && error.message === 'Network connection lost') {
        reset();
        // 觸發重新開始
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [error, reset]);

  // ...
}
```

#### 2. 降級策略（Fallback）

```typescript
/**
 * 當串流失敗時，降級為完整回應
 */
const fallbackToComplete = async (): Promise<string> => {
  logger.info('Falling back to non-streaming API');

  const response = await fetch(url.replace('/stream', ''), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Fallback request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.interpretation || '';
};

// 在錯誤處理中使用
catch (err) {
  // 嘗試降級
  try {
    const fullText = await fallbackToComplete();
    setText(fullText);
    setIsComplete(true);
    if (onComplete) onComplete(fullText);
    return;
  } catch (fallbackErr) {
    // Fallback 也失敗，顯示錯誤
    setError(err as Error);
  }
}
```

#### 3. 錯誤分類與友善訊息

```typescript
/**
 * 錯誤類型
 */
enum StreamingErrorType {
  NETWORK_ERROR = 'network_error',
  TIMEOUT = 'timeout',
  SERVER_ERROR = 'server_error',
  PARSE_ERROR = 'parse_error',
  UNKNOWN = 'unknown',
}

/**
 * 分類錯誤
 */
const classifyError = (error: Error): StreamingErrorType => {
  if (error.message.includes('timeout')) {
    return StreamingErrorType.TIMEOUT;
  }
  if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
    return StreamingErrorType.NETWORK_ERROR;
  }
  if (error.message.includes('HTTP 5')) {
    return StreamingErrorType.SERVER_ERROR;
  }
  if (error.message.includes('parse') || error.message.includes('JSON')) {
    return StreamingErrorType.PARSE_ERROR;
  }
  return StreamingErrorType.UNKNOWN;
};

/**
 * 取得友善錯誤訊息
 */
const getFriendlyErrorMessage = (error: Error): string => {
  const type = classifyError(error);

  switch (type) {
    case StreamingErrorType.NETWORK_ERROR:
      return '網路連線中斷。請檢查你的網路連線。';
    case StreamingErrorType.TIMEOUT:
      return '請求超時。伺服器回應過慢，請稍後再試。';
    case StreamingErrorType.SERVER_ERROR:
      return '伺服器錯誤。我們的系統遇到問題，請稍後再試。';
    case StreamingErrorType.PARSE_ERROR:
      return '資料解析錯誤。請重新整理頁面再試。';
    default:
      return `發生錯誤：${error.message}`;
  }
};
```

---

## 🧪 測試計畫

### 單元測試
**檔案**: `src/hooks/__tests__/useStreamingText.retry.test.ts`

```typescript
describe('useStreamingText - Retry Logic', () => {
  it('should retry on network error', async () => {
    // Mock fetch to fail twice, then succeed
    let callCount = 0;
    global.fetch = jest.fn(() => {
      callCount++;
      if (callCount <= 2) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve(mockResponse);
    });

    // Test retry logic
    // ...
  });

  it('should respect maxRetries limit', async () => {
    // Mock fetch to always fail
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

    // Should stop after maxRetries
    // ...
  });

  it('should use exponential backoff', async () => {
    // Track delay times
    const delays: number[] = [];

    // Assert delays follow exponential pattern
    // ...
  });
});
```

### 整合測試
**檔案**: `src/__tests__/integration/streaming-retry.test.ts`

```typescript
describe('Streaming with Retry - Integration', () => {
  it('should recover from temporary network failure', async () => {
    // Simulate network failure then recovery
    // ...
  });

  it('should fallback to complete response on streaming failure', async () => {
    // Mock streaming endpoint to fail
    // Mock non-streaming endpoint to succeed
    // ...
  });
});
```

---

## 📦 完成標準

### P0: 自動重試機制
- [ ] 實作指數退避重試邏輯
- [ ] 實作超時處理
- [ ] 實作重試次數限制
- [ ] UI 顯示重試狀態
- [ ] 單元測試覆蓋率 > 80%
- [ ] 整合測試通過

### P1: 音效整合
- [ ] 在 `useStreamingText` 中加入音效選項
- [ ] 實作音效節流
- [ ] 建立打字音效
- [ ] 與用戶偏好整合
- [ ] 測試頁面支援音效開關

### P2: 進階錯誤處理
- [ ] 實作網路狀態偵測
- [ ] 實作降級策略
- [ ] 實作錯誤分類與友善訊息
- [ ] 錯誤場景測試完整

---

## 🚀 實作順序

### 第一階段：P0 重試機制（2-3 小時）
1. 修改 `useStreamingText` 加入重試邏輯
2. 實作指數退避算法
3. 修改 `StreamingInterpretation` 顯示重試狀態
4. 撰寫單元測試
5. 在 `/test-streaming` 頁面測試

### 第二階段：P1 音效整合（1-2 小時）
1. 建立 `generateTypingSound` 音效
2. 在 `useStreamingText` 中整合音效播放
3. 實作音效節流
4. 在測試頁面加入音效開關
5. 與用戶偏好整合

### 第三階段：P2 進階錯誤處理（2-3 小時）
1. 實作網路狀態監聽
2. 實作降級策略
3. 實作錯誤分類與友善訊息
4. 撰寫錯誤場景測試
5. 文件更新

---

## 📚 參考資料

### 內部文件
- [分析報告](./analysis.md) - 完整的現狀分析
- [Web Audio 系統文件](.kiro/specs/web-audio-system/design.md)

### 外部參考
- [Server-Sent Events (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Exponential Backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

**最後更新**: 2025-10-22
**維護者**: Claude (AI Assistant)
