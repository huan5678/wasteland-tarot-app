# AI Text Streaming TDD 實作計畫

**日期**: 2025-10-22
**方法**: Test-Driven Development (TDD)
**原則**: Red-Green-Refactor

---

## 🎯 TDD 核心原則

```
🔴 RED:      先寫測試（會失敗）
🟢 GREEN:    寫最少的代碼讓測試通過
🔵 REFACTOR: 重構改善代碼品質
```

**重要**：每個功能都要遵循這個循環，不能跳過任何步驟。

---

## 📊 實作優先級

### P0: 自動重試機制（必須）⭐
**TDD 循環次數**: 4 次（4 個測試場景）
**時間**: 2-3 小時
**測試檔案**: `src/hooks/__tests__/useStreamingText.retry.test.ts`
**實作檔案**: `src/hooks/useStreamingText.ts`

### P1: 音效整合（重要）
**TDD 循環次數**: 3 次
**時間**: 1-2 小時
**測試檔案**: `src/hooks/__tests__/useStreamingText.audio.test.ts`

### P2: 進階錯誤處理（可選）
**TDD 循環次數**: 3 次
**時間**: 2-3 小時
**測試檔案**: `src/hooks/__tests__/useStreamingText.error.test.ts`

---

## 🔴🟢🔵 P0: 自動重試機制 TDD 流程

### 循環 1: 基本重試功能

#### 🔴 Step 1: RED - 寫測試（會失敗）

**檔案**: `src/hooks/__tests__/useStreamingText.retry.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useStreamingText } from '../useStreamingText';

describe('useStreamingText - Retry Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retry on network error', async () => {
    // 🔴 這個測試會失敗，因為 retry 功能還沒實作
    let callCount = 0;
    global.fetch = jest.fn(() => {
      callCount++;
      if (callCount <= 2) {
        // 前兩次失敗
        return Promise.reject(new Error('Network error'));
      }
      // 第三次成功
      return Promise.resolve(
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(
                new TextEncoder().encode('data: Hello\n\n')
              );
              controller.enqueue(
                new TextEncoder().encode('data: [DONE]\n\n')
              );
              controller.close();
            },
          }),
          {
            headers: { 'Content-Type': 'text/event-stream' },
          }
        )
      );
    });

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/api/test',
        requestBody: { test: true },
        maxRetries: 3,
        retryDelay: 100, // 快速測試
        enabled: true,
      })
    );

    // 等待串流完成
    await waitFor(
      () => {
        expect(result.current.isComplete).toBe(true);
      },
      { timeout: 5000 }
    );

    // 驗證：應該重試 2 次後成功
    expect(callCount).toBe(3);
    expect(result.current.text).toContain('Hello');
    expect(result.current.error).toBeNull();
  });
});
```

**運行測試**：
```bash
bun test src/hooks/__tests__/useStreamingText.retry.test.ts
```

**預期結果**: ❌ 測試失敗（因為功能還沒實作）

---

#### 🟢 Step 2: GREEN - 最小實作讓測試通過

**檔案**: `src/hooks/useStreamingText.ts`

```typescript
export interface StreamingTextOptions {
  // ... 現有選項
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

export interface StreamingTextState {
  // ... 現有狀態
  retryCount: number;
  isRetrying: boolean;
}

export function useStreamingText(options: StreamingTextOptions): StreamingTextState {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 30000,
    // ...
  } = options;

  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  /**
   * 延遲函式
   */
  const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  /**
   * 計算指數退避延遲
   */
  const getRetryDelay = (attempt: number): number => {
    return retryDelay * Math.pow(2, attempt);
  };

  /**
   * 帶重試的 fetch（最小實作）
   */
  const fetchWithRetry = async (signal: AbortSignal): Promise<Response> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // 重試時延遲
        if (attempt > 0) {
          setIsRetrying(true);
          setRetryCount(attempt);
          await delay(getRetryDelay(attempt - 1));
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        setIsRetrying(false);
        return response;

      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        // 用戶取消不重試
        if (lastError.name === 'AbortError') {
          throw lastError;
        }

        // 還有重試次數
        if (attempt < maxRetries) {
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new Error('Unknown error');
  };

  // 在 startStreaming 中使用
  const startStreaming = async () => {
    try {
      const response = await fetchWithRetry(abortController.signal);
      // ... 處理串流
    } catch (err) {
      setIsRetrying(false);
      setError(err as Error);
    }
  };

  // ... 其餘邏輯

  return {
    // ... 現有返回值
    retryCount,
    isRetrying,
  };
}
```

**運行測試**：
```bash
bun test src/hooks/__tests__/useStreamingText.retry.test.ts
```

**預期結果**: ✅ 測試通過

---

#### 🔵 Step 3: REFACTOR - 重構改善

重構目標：
1. 提取 `fetchWithRetry` 為獨立函式（更好測試）
2. 加入 logger
3. 改善錯誤訊息

```typescript
/**
 * 帶重試的 fetch（重構版）
 */
const fetchWithRetry = useCallback(
  async (signal: AbortSignal): Promise<Response> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          setIsRetrying(true);
          setRetryCount(attempt);
          const delayMs = getRetryDelay(attempt - 1);

          // 🔵 加入 logger
          logger.info(`Retrying request (${attempt}/${maxRetries}) after ${delayMs}ms...`);

          await delay(delayMs);
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal,
        });

        if (!response.ok) {
          // 🔵 改善錯誤訊息
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        setIsRetrying(false);
        return response;

      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (lastError.name === 'AbortError') {
          throw lastError;
        }

        if (attempt < maxRetries) {
          // 🔵 記錄重試
          logger.warn(
            `Request failed (attempt ${attempt + 1}/${maxRetries + 1}):`,
            lastError.message
          );
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new Error('Unknown error');
  },
  [url, requestBody, maxRetries, retryDelay]
);
```

**運行測試**：
```bash
bun test src/hooks/__tests__/useStreamingText.retry.test.ts
```

**預期結果**: ✅ 測試仍然通過（重構不改變行為）

---

### 循環 2: 重試次數限制

#### 🔴 Step 1: RED - 寫測試

```typescript
it('should respect maxRetries limit', async () => {
  // 🔴 測試重試次數限制
  let callCount = 0;
  global.fetch = jest.fn(() => {
    callCount++;
    return Promise.reject(new Error('Network error'));
  });

  const { result } = renderHook(() =>
    useStreamingText({
      url: '/api/test',
      requestBody: { test: true },
      maxRetries: 3,
      retryDelay: 100,
      enabled: true,
    })
  );

  await waitFor(
    () => {
      expect(result.current.error).not.toBeNull();
    },
    { timeout: 5000 }
  );

  // 驗證：應該嘗試 4 次（初始 + 3 次重試）
  expect(callCount).toBe(4);
  expect(result.current.error?.message).toContain('Network error');
});
```

#### 🟢 Step 2: GREEN - 實作

（已經在循環 1 中實作了，這個測試應該直接通過）

#### 🔵 Step 3: REFACTOR

（檢查是否需要重構）

---

### 循環 3: 指數退避驗證

#### 🔴 Step 1: RED - 寫測試

```typescript
it('should use exponential backoff', async () => {
  // 🔴 測試指數退避
  const delays: number[] = [];
  let lastTime = Date.now();

  let callCount = 0;
  global.fetch = jest.fn(() => {
    const now = Date.now();
    if (callCount > 0) {
      delays.push(now - lastTime);
    }
    lastTime = now;
    callCount++;

    if (callCount <= 3) {
      return Promise.reject(new Error('Network error'));
    }
    return Promise.resolve(mockSuccessResponse);
  });

  const { result } = renderHook(() =>
    useStreamingText({
      url: '/api/test',
      requestBody: { test: true },
      maxRetries: 3,
      retryDelay: 100, // 基礎延遲 100ms
      enabled: true,
    })
  );

  await waitFor(() => expect(result.current.isComplete).toBe(true), {
    timeout: 10000,
  });

  // 驗證：延遲應該是指數增長
  // 第 1 次重試：~100ms
  // 第 2 次重試：~200ms
  // 第 3 次重試：~400ms
  expect(delays[0]).toBeGreaterThanOrEqual(90);
  expect(delays[0]).toBeLessThan(150);

  expect(delays[1]).toBeGreaterThanOrEqual(190);
  expect(delays[1]).toBeLessThan(250);

  expect(delays[2]).toBeGreaterThanOrEqual(390);
  expect(delays[2]).toBeLessThan(500);
});
```

#### 🟢 Step 2: GREEN - 實作

（已實作 `getRetryDelay`）

#### 🔵 Step 3: REFACTOR

（檢查公式是否正確）

---

### 循環 4: 超時處理

#### 🔴 Step 1: RED - 寫測試

```typescript
it('should timeout if request takes too long', async () => {
  // 🔴 測試超時
  global.fetch = jest.fn(
    () =>
      new Promise((resolve) => {
        // 永遠不 resolve（模擬超時）
      })
  );

  const { result } = renderHook(() =>
    useStreamingText({
      url: '/api/test',
      requestBody: { test: true },
      timeout: 500, // 500ms 超時
      enabled: true,
    })
  );

  await waitFor(
    () => {
      expect(result.current.error).not.toBeNull();
    },
    { timeout: 2000 }
  );

  expect(result.current.error?.message).toContain('timeout');
});
```

#### 🟢 Step 2: GREEN - 實作超時

```typescript
const fetchWithRetry = async (signal: AbortSignal): Promise<Response> => {
  // ... 重試邏輯

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 🟢 新增：超時控制
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after ${timeout}ms`));
        }, timeout);
      });

      const fetchPromise = fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal,
      });

      // 競賽：fetch vs timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response;

    } catch (err) {
      // ... 錯誤處理
    }
  }
};
```

#### 🔵 Step 3: REFACTOR

優化超時實作：

```typescript
// 🔵 更好的超時實作（使用 AbortController）
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};
```

---

## 🔴🟢🔵 P1: 音效整合 TDD 流程

### 循環 1: 基本音效播放

#### 🔴 Step 1: RED - 寫測試

**檔案**: `src/hooks/__tests__/useStreamingText.audio.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useStreamingText } from '../useStreamingText';
import * as audioHooks from '@/hooks/audio/useAudioEffect';

// Mock audio hook
jest.mock('@/hooks/audio/useAudioEffect');

describe('useStreamingText - Audio Integration', () => {
  let mockPlaySound: jest.Mock;

  beforeEach(() => {
    mockPlaySound = jest.fn();
    (audioHooks.useAudioEffect as jest.Mock).mockReturnValue({
      playSound: mockPlaySound,
    });
  });

  it('should play typing sound when enabled', async () => {
    // 🔴 測試音效播放
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: H\n\n'));
        controller.enqueue(new TextEncoder().encode('data: e\n\n'));
        controller.enqueue(new TextEncoder().encode('data: l\n\n'));
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    global.fetch = jest.fn(() =>
      Promise.resolve(
        new Response(mockStream, {
          headers: { 'Content-Type': 'text/event-stream' },
        })
      )
    );

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/api/test',
        requestBody: { test: true },
        enableTypingSound: true,
        charsPerSecond: 10, // 慢速方便測試
        enabled: true,
      })
    );

    await waitFor(() => expect(result.current.isComplete).toBe(true), {
      timeout: 5000,
    });

    // 驗證：應該播放了音效
    expect(mockPlaySound).toHaveBeenCalled();
    expect(mockPlaySound).toHaveBeenCalledWith('typing', expect.any(Object));
  });

  it('should NOT play sound when disabled', async () => {
    // 🔴 測試音效關閉
    // ... 類似的測試，但 enableTypingSound: false

    await waitFor(() => expect(result.current.isComplete).toBe(true));

    // 驗證：不應該播放音效
    expect(mockPlaySound).not.toHaveBeenCalled();
  });
});
```

#### 🟢 Step 2: GREEN - 實作音效

```typescript
import { useAudioEffect } from '@/hooks/audio/useAudioEffect';

export interface StreamingTextOptions {
  // ...
  enableTypingSound?: boolean;
  soundThrottle?: number;
}

export function useStreamingText(options: StreamingTextOptions): StreamingTextState {
  const {
    enableTypingSound = false,
    soundThrottle = 50,
    // ...
  } = options;

  // 🟢 整合音效
  const { playSound } = useAudioEffect();
  const lastSoundTime = useRef<number>(0);

  /**
   * 播放打字音效（節流）
   */
  const playTypingSoundThrottled = useCallback(() => {
    if (!enableTypingSound) return;

    const now = Date.now();
    if (now - lastSoundTime.current >= soundThrottle) {
      playSound('typing', { volume: 0.3 });
      lastSoundTime.current = now;
    }
  }, [enableTypingSound, soundThrottle, playSound]);

  /**
   * 打字機效果（加入音效）
   */
  const startTypewriter = useCallback(() => {
    // ...
    typewriterIntervalRef.current = setInterval(() => {
      // 顯示字元
      displayedCharsRef.current++;
      setText(fullText.slice(0, displayedCharsRef.current));

      // 🟢 播放音效
      playTypingSoundThrottled();

      // ...
    }, intervalMs);
  }, [playTypingSoundThrottled, /* ... */]);

  // ...
}
```

#### 🔵 Step 3: REFACTOR

（檢查音效邏輯是否可以優化）

---

### 循環 2: 音效節流

#### 🔴 Step 1: RED - 寫測試

```typescript
it('should throttle sound playback', async () => {
  // 🔴 測試音效節流
  jest.useFakeTimers();

  const { result } = renderHook(() =>
    useStreamingText({
      url: '/api/test',
      requestBody: { test: true },
      enableTypingSound: true,
      soundThrottle: 100, // 100ms 節流
      charsPerSecond: 100, // 快速打字
      enabled: true,
    })
  );

  // 快進時間
  jest.advanceTimersByTime(1000); // 1 秒

  await waitFor(() => expect(result.current.isComplete).toBe(true));

  // 驗證：1 秒內最多播放 10 次（1000ms / 100ms）
  expect(mockPlaySound.mock.calls.length).toBeLessThanOrEqual(10);

  jest.useRealTimers();
});
```

#### 🟢 Step 2: GREEN - 實作節流

（已在循環 1 中實作）

#### 🔵 Step 3: REFACTOR

（優化節流邏輯）

---

## 📊 TDD 實作檢查清單

### P0: 自動重試機制
- [ ] 🔴 寫測試：基本重試功能
- [ ] 🟢 實作：`fetchWithRetry` 基本版
- [ ] 🔵 重構：加入 logger 和錯誤訊息
- [ ] 🔴 寫測試：重試次數限制
- [ ] 🟢 驗證：測試通過
- [ ] 🔴 寫測試：指數退避驗證
- [ ] 🟢 驗證：測試通過
- [ ] 🔴 寫測試：超時處理
- [ ] 🟢 實作：超時邏輯
- [ ] 🔵 重構：優化超時實作
- [ ] 運行所有測試確保通過
- [ ] 在 UI 中加入重試狀態顯示

### P1: 音效整合
- [ ] 🔴 寫測試：基本音效播放
- [ ] 🟢 實作：整合 `useAudioEffect`
- [ ] 🔵 重構：優化音效邏輯
- [ ] 🔴 寫測試：音效開關
- [ ] 🟢 驗證：測試通過
- [ ] 🔴 寫測試：音效節流
- [ ] 🟢 驗證：測試通過
- [ ] 建立 `generateTypingSound` 音效
- [ ] 在音效系統中註冊

### P2: 進階錯誤處理
- [ ] 🔴 寫測試：網路離線偵測
- [ ] 🟢 實作：監聽 `offline` 事件
- [ ] 🔴 寫測試：降級策略
- [ ] 🟢 實作：`fallbackToComplete`
- [ ] 🔴 寫測試：錯誤分類
- [ ] 🟢 實作：`classifyError` 和友善訊息

---

## 🚀 TDD 實作順序總結

### 第一階段：P0 重試機制（2-3 小時）

```bash
# 循環 1: 基本重試
1. 🔴 寫測試 → 2. 🟢 實作 → 3. 🔵 重構

# 循環 2: 重試次數限制
1. 🔴 寫測試 → 2. 🟢 驗證 → 3. 🔵 重構

# 循環 3: 指數退避
1. 🔴 寫測試 → 2. 🟢 驗證 → 3. 🔵 重構

# 循環 4: 超時處理
1. 🔴 寫測試 → 2. 🟢 實作 → 3. 🔵 重構

# 最後：UI 整合
- 在 StreamingInterpretation 中顯示重試狀態
```

### 第二階段：P1 音效整合（1-2 小時）

```bash
# 循環 1: 基本音效
1. 🔴 寫測試 → 2. 🟢 實作 → 3. 🔵 重構

# 循環 2: 音效節流
1. 🔴 寫測試 → 2. 🟢 驗證 → 3. 🔵 重構

# 循環 3: 用戶偏好整合
1. 🔴 寫測試 → 2. 🟢 實作 → 3. 🔵 重構
```

---

## 💡 TDD 最佳實踐

### 1. 測試先行
永遠**先寫測試**，再寫實作。這確保：
- 需求明確
- 可測試性
- 防止過度設計

### 2. 小步迭代
每個循環只實作**一個功能**：
- ❌ 不要一次寫完所有功能
- ✅ 一次一個測試，一次一個實作

### 3. 快速回饋
頻繁運行測試：
```bash
# 監視模式：自動運行測試
bun test --watch src/hooks/__tests__/useStreamingText.retry.test.ts
```

### 4. 重構勇敢
綠燈後勇敢重構：
- 測試是安全網
- 改善代碼品質
- 不改變行為

---

## 📚 參考資料

### TDD 經典
- [Test-Driven Development by Example](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530) - Kent Beck
- [Growing Object-Oriented Software, Guided by Tests](https://www.amazon.com/Growing-Object-Oriented-Software-Guided-Tests/dp/0321503627)

### React Testing
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Hooks](https://react-hooks-testing-library.com/)

---

**最後更新**: 2025-10-22
**方法論**: Test-Driven Development (TDD)
**維護者**: Claude (AI Assistant)
