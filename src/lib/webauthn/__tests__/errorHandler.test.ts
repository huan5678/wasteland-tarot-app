/**
 * 測試：WebAuthn 錯誤處理工具
 */

import { describe, it, expect, vi } from 'vitest';
import {
  handleWebAuthnError,
  withTimeout,
  withRetry,
  getFriendlyErrorMessage,
  FalloutErrorCode,
} from '../errorHandler';

describe('handleWebAuthnError', () => {
  it('應該正確處理 NotAllowedError（使用者取消）', () => {
    const error = new DOMException('User cancelled', 'NotAllowedError');
    const result = handleWebAuthnError(error);

    expect(result.code).toBe(FalloutErrorCode.VAULT_RESIDENT_CANCELLED);
    expect(result.message).toContain('取消');
    expect(result.isRetryable).toBe(true);
  });

  it('應該正確處理 TimeoutError（逾時）', () => {
    const error = new DOMException('Timeout', 'TimeoutError');
    const result = handleWebAuthnError(error);

    expect(result.code).toBe(FalloutErrorCode.WASTELAND_TIMEOUT);
    expect(result.message).toContain('逾時');
    expect(result.isRetryable).toBe(true);
  });

  it('應該正確處理 SecurityError（HTTPS 問題）', () => {
    const error = new DOMException('Security', 'SecurityError');
    const result = handleWebAuthnError(error);

    expect(result.code).toBe(FalloutErrorCode.SECURITY_PROTOCOL_VIOLATION);
    expect(result.message).toContain('HTTPS');
    expect(result.isRetryable).toBe(false);
  });

  it('應該正確處理 NotSupportedError（瀏覽器不支援）', () => {
    const error = new DOMException('Not supported', 'NotSupportedError');
    const result = handleWebAuthnError(error);

    expect(result.code).toBe(FalloutErrorCode.OBSOLETE_PIPBOY);
    expect(result.message).toContain('不支援');
    expect(result.isRetryable).toBe(false);
  });

  it('應該正確處理 NetworkError（網路錯誤）', () => {
    const error = new DOMException('Network error', 'NetworkError');
    const result = handleWebAuthnError(error);

    expect(result.code).toBe(FalloutErrorCode.RADIATION_INTERFERENCE);
    expect(result.message).toContain('輻射');
    expect(result.isRetryable).toBe(true);
  });

  it('應該正確處理 TypeError（瀏覽器不支援）', () => {
    const error = new TypeError('navigator.credentials is undefined');
    const result = handleWebAuthnError(error);

    expect(result.code).toBe(FalloutErrorCode.OBSOLETE_PIPBOY);
    expect(result.message).toContain('不支援');
    expect(result.isRetryable).toBe(false);
  });

  it('應該正確處理未知錯誤', () => {
    const error = new Error('Unknown error');
    const result = handleWebAuthnError(error);

    expect(result.code).toBe(FalloutErrorCode.UNKNOWN_ANOMALY);
    expect(result.message).toContain('未知');
    expect(result.isRetryable).toBe(true);
  });

  it('應該包含原始錯誤名稱', () => {
    const error = new DOMException('Test', 'NotAllowedError');
    const result = handleWebAuthnError(error);

    expect(result.originalError).toBe('NotAllowedError');
  });

  it('應該提供使用者可執行的操作建議', () => {
    const error = new DOMException('Security', 'SecurityError');
    const result = handleWebAuthnError(error);

    expect(result.action).toBeDefined();
    expect(result.action).toContain('https');
  });
});

describe('withTimeout', () => {
  it('應該在時間內完成時回傳結果', async () => {
    const promise = Promise.resolve('success');
    const result = await withTimeout(promise, 1000);

    expect(result).toBe('success');
  });

  it('應該在逾時時拋出 TimeoutError', async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve('late'), 2000));

    await expect(withTimeout(promise, 100)).rejects.toThrow('timed out');
  });

  it('應該使用預設 timeout（5 分鐘）', async () => {
    const promise = Promise.resolve('success');
    const result = await withTimeout(promise);

    expect(result).toBe('success');
  });
});

describe('withRetry', () => {
  it('應該在第一次成功時不重試', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn, 3, 10);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('應該在失敗時重試（可重試錯誤）', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new DOMException('Timeout', 'TimeoutError'))
      .mockRejectedValueOnce(new DOMException('Timeout', 'TimeoutError'))
      .mockResolvedValue('success');

    const result = await withRetry(fn, 3, 10);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('應該在不可重試錯誤時立即拋出', async () => {
    const fn = vi.fn().mockRejectedValue(new DOMException('Security', 'SecurityError'));

    await expect(withRetry(fn, 3, 10)).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('應該在達到最大重試次數後拋出錯誤', async () => {
    const fn = vi.fn().mockRejectedValue(new DOMException('Timeout', 'TimeoutError'));

    await expect(withRetry(fn, 2, 10)).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(3); // 初始 + 2 次重試
  });
});

describe('getFriendlyErrorMessage', () => {
  it('應該回傳包含訊息和操作建議的字串', () => {
    const error = new DOMException('Security', 'SecurityError');
    const message = getFriendlyErrorMessage(error);

    expect(message).toContain('安全協議');
    expect(message).toContain('https');
  });

  it('應該在沒有操作建議時只回傳訊息', () => {
    const error = new Error('Simple error');
    const message = getFriendlyErrorMessage(error);

    expect(message).toBeTruthy();
  });
});

describe('Fallout 主題錯誤訊息', () => {
  it('所有錯誤訊息應包含 Fallout 主題詞彙', () => {
    const errors = [
      new DOMException('Test', 'NotAllowedError'),
      new DOMException('Test', 'TimeoutError'),
      new DOMException('Test', 'SecurityError'),
      new DOMException('Test', 'NetworkError'),
      new DOMException('Test', 'NotSupportedError'),
    ];

    const falloutKeywords = ['Pip-Boy', '避難', '輻射', '廢土', '居民'];

    errors.forEach((error) => {
      const result = handleWebAuthnError(error);
      const hasKeyword = falloutKeywords.some((keyword) =>
        result.message.includes(keyword)
      );
      expect(hasKeyword).toBe(true);
    });
  });
});
