/**
 * WebAuthn 工具函式測試
 * TDD 循環 6 - 紅燈階段
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  isWebAuthnSupported,
  isConditionalUISupported,
  base64URLEncode,
  base64URLDecode,
  convertCredentialCreationOptions,
  convertCredentialRequestOptions,
  convertRegistrationResponse,
  convertAuthenticationResponse,
} from '../utils';

describe('WebAuthn 瀏覽器支援檢測', () => {
  beforeEach(() => {
    // 重置 global 模擬
    jest.clearAllMocks();
  });

  describe('isWebAuthnSupported', () => {
    it('應該在支援 WebAuthn 的瀏覽器中回傳 true', () => {
      // 模擬支援 WebAuthn 的環境
      Object.defineProperty(window, 'PublicKeyCredential', {
        writable: true,
        configurable: true,
        value: function() {},
      });
      Object.defineProperty(navigator, 'credentials', {
        writable: true,
        configurable: true,
        value: {
          create: jest.fn(),
          get: jest.fn(),
        },
      });

      expect(isWebAuthnSupported()).toBe(true);
    });

    it('應該在不支援 WebAuthn 的瀏覽器中回傳 false', () => {
      // 清除 window.PublicKeyCredential
      Object.defineProperty(window, 'PublicKeyCredential', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      expect(isWebAuthnSupported()).toBe(false);
    });

    it('應該在 SSR 環境中回傳 false', () => {
      // 模擬 SSR 環境（沒有 window）
      const originalWindow = global.window;
      delete (global as any).window;

      expect(isWebAuthnSupported()).toBe(false);

      // 恢復 window
      global.window = originalWindow;
    });
  });

  describe('isConditionalUISupported', () => {
    it('應該在支援 Conditional UI 的瀏覽器中回傳 true', async () => {
      // 模擬支援 Conditional UI
      Object.defineProperty(window, 'PublicKeyCredential', {
        writable: true,
        configurable: true,
        value: {
          isConditionalMediationAvailable: jest.fn().mockResolvedValue(true),
        },
      });
      Object.defineProperty(navigator, 'credentials', {
        writable: true,
        configurable: true,
        value: {
          create: jest.fn(),
          get: jest.fn(),
        },
      });

      const result = await isConditionalUISupported();
      expect(result).toBe(true);
    });

    it('應該在不支援 Conditional UI 的瀏覽器中回傳 false', async () => {
      Object.defineProperty(window, 'PublicKeyCredential', {
        writable: true,
        configurable: true,
        value: {
          isConditionalMediationAvailable: jest.fn().mockResolvedValue(false),
        },
      });
      Object.defineProperty(navigator, 'credentials', {
        writable: true,
        configurable: true,
        value: {
          create: jest.fn(),
          get: jest.fn(),
        },
      });

      const result = await isConditionalUISupported();
      expect(result).toBe(false);
    });

    it('應該在不支援 WebAuthn 的瀏覽器中回傳 false', async () => {
      global.window = {} as any;

      const result = await isConditionalUISupported();
      expect(result).toBe(false);
    });

    it('應該在 API 拋出錯誤時回傳 false', async () => {
      Object.defineProperty(window, 'PublicKeyCredential', {
        writable: true,
        configurable: true,
        value: {
          isConditionalMediationAvailable: jest.fn().mockRejectedValue(new Error('Not supported')),
        },
      });
      Object.defineProperty(navigator, 'credentials', {
        writable: true,
        configurable: true,
        value: {
          create: jest.fn(),
          get: jest.fn(),
        },
      });

      const result = await isConditionalUISupported();
      expect(result).toBe(false);
    });
  });
});

describe('Base64URL 編碼/解碼', () => {
  describe('base64URLEncode', () => {
    it('應該正確編碼 ArrayBuffer 為 Base64URL 字串', () => {
      const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer; // "Hello"
      const result = base64URLEncode(buffer);

      expect(result).toBe('SGVsbG8');
      expect(result).not.toContain('+');
      expect(result).not.toContain('/');
      expect(result).not.toContain('=');
    });

    it('應該正確處理包含 + / = 的標準 Base64 字元', () => {
      // Base64 標準編碼包含 + / = 的例子
      const buffer = new Uint8Array([0xfb, 0xff, 0xff]).buffer;
      const result = base64URLEncode(buffer);

      // 標準 Base64: +///
      // Base64URL: -___
      expect(result).toBe('-___');
    });

    it('應該正確處理空 ArrayBuffer', () => {
      const buffer = new Uint8Array([]).buffer;
      const result = base64URLEncode(buffer);

      expect(result).toBe('');
    });
  });

  describe('base64URLDecode', () => {
    it('應該正確解碼 Base64URL 字串為 ArrayBuffer', () => {
      const base64url = 'SGVsbG8';
      const result = base64URLDecode(base64url);
      const bytes = new Uint8Array(result);

      expect(Array.from(bytes)).toEqual([72, 101, 108, 108, 111]); // "Hello"
    });

    it('應該正確處理包含 - _ 的 Base64URL 字元', () => {
      const base64url = '-___';
      const result = base64URLDecode(base64url);
      const bytes = new Uint8Array(result);

      expect(Array.from(bytes)).toEqual([0xfb, 0xff, 0xff]);
    });

    it('應該正確處理沒有 padding 的字串', () => {
      const base64url = 'SGVsbG8'; // 原本是 'SGVsbG8='，但 Base64URL 移除了 =
      const result = base64URLDecode(base64url);
      const bytes = new Uint8Array(result);

      expect(Array.from(bytes)).toEqual([72, 101, 108, 108, 111]);
    });

    it('應該正確處理空字串', () => {
      const result = base64URLDecode('');
      const bytes = new Uint8Array(result);

      expect(bytes.length).toBe(0);
    });

    it('編碼後解碼應該得到原始資料', () => {
      const original = new Uint8Array([1, 2, 3, 4, 5, 255, 254, 253]).buffer;
      const encoded = base64URLEncode(original);
      const decoded = base64URLDecode(encoded);

      expect(new Uint8Array(decoded)).toEqual(new Uint8Array(original));
    });
  });
});

describe('PublicKeyCredential 型別轉換', () => {
  describe('convertCredentialCreationOptions', () => {
    it('應該正確轉換 JSON 格式的 registration options', () => {
      const jsonOptions = {
        challenge: 'SGVsbG8',
        rp: {
          name: 'Tarot Card App',
          id: 'localhost',
        },
        user: {
          id: 'dXNlcjEyMw',
          name: 'user@example.com',
          displayName: 'User 123',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        timeout: 60000,
        attestation: 'none',
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          requireResidentKey: true,
          userVerification: 'required',
        },
        excludeCredentials: [
          {
            id: 'Y3JlZDEyMw',
            type: 'public-key',
            transports: ['internal'],
          },
        ],
      };

      const result = convertCredentialCreationOptions(jsonOptions as any);

      // 驗證 challenge 已轉換為 ArrayBuffer
      expect(result.challenge).toBeInstanceOf(ArrayBuffer);
      expect(new Uint8Array(result.challenge)).toEqual(new Uint8Array([72, 101, 108, 108, 111]));

      // 驗證 user.id 已轉換為 ArrayBuffer
      expect(result.user.id).toBeInstanceOf(ArrayBuffer);

      // 驗證 excludeCredentials 的 id 已轉換為 ArrayBuffer
      expect(result.excludeCredentials).toHaveLength(1);
      expect(result.excludeCredentials![0].id).toBeInstanceOf(ArrayBuffer);

      // 驗證其他欄位保持不變
      expect(result.rp).toEqual(jsonOptions.rp);
      expect(result.user.name).toBe(jsonOptions.user.name);
      expect(result.pubKeyCredParams).toEqual(jsonOptions.pubKeyCredParams);
    });

    it('應該處理沒有 excludeCredentials 的情況', () => {
      const jsonOptions = {
        challenge: 'SGVsbG8',
        rp: { name: 'Tarot Card App', id: 'localhost' },
        user: { id: 'dXNlcjEyMw', name: 'user@example.com', displayName: 'User 123' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      };

      const result = convertCredentialCreationOptions(jsonOptions as any);

      expect(result.excludeCredentials).toBeUndefined();
    });
  });

  describe('convertCredentialRequestOptions', () => {
    it('應該正確轉換 JSON 格式的 authentication options', () => {
      const jsonOptions = {
        challenge: 'SGVsbG8',
        timeout: 60000,
        rpId: 'localhost',
        userVerification: 'required',
        allowCredentials: [
          {
            id: 'Y3JlZDEyMw',
            type: 'public-key',
            transports: ['internal'],
          },
        ],
      };

      const result = convertCredentialRequestOptions(jsonOptions as any);

      // 驗證 challenge 已轉換為 ArrayBuffer
      expect(result.challenge).toBeInstanceOf(ArrayBuffer);
      expect(new Uint8Array(result.challenge)).toEqual(new Uint8Array([72, 101, 108, 108, 111]));

      // 驗證 allowCredentials 的 id 已轉換為 ArrayBuffer
      expect(result.allowCredentials).toHaveLength(1);
      expect(result.allowCredentials![0].id).toBeInstanceOf(ArrayBuffer);

      // 驗證其他欄位保持不變
      expect(result.rpId).toBe(jsonOptions.rpId);
      expect(result.userVerification).toBe(jsonOptions.userVerification);
    });

    it('應該處理沒有 allowCredentials 的情況（用於 usernameless login）', () => {
      const jsonOptions = {
        challenge: 'SGVsbG8',
        rpId: 'localhost',
      };

      const result = convertCredentialRequestOptions(jsonOptions as any);

      expect(result.allowCredentials).toBeUndefined();
    });
  });

  describe('convertRegistrationResponse', () => {
    it('應該正確轉換 PublicKeyCredential 為 JSON 格式', () => {
      // 模擬 PublicKeyCredential
      const mockCredential = {
        id: 'cred123',
        rawId: new Uint8Array([99, 114, 101, 100, 49, 50, 51]).buffer,
        type: 'public-key',
        response: {
          clientDataJSON: new Uint8Array([123, 125]).buffer,
          attestationObject: new Uint8Array([1, 2, 3]).buffer,
          getTransports: () => ['internal', 'hybrid'],
        },
        getClientExtensionResults: () => ({}),
        authenticatorAttachment: 'platform',
      };

      const result = convertRegistrationResponse(mockCredential as any);

      // 驗證所有 ArrayBuffer 已轉換為 Base64URL
      expect(typeof result.rawId).toBe('string');
      expect(typeof result.response.clientDataJSON).toBe('string');
      expect(typeof result.response.attestationObject).toBe('string');

      // 驗證 transports 正確轉換
      expect(result.response.transports).toEqual(['internal', 'hybrid']);

      // 驗證其他欄位
      expect(result.id).toBe('cred123');
      expect(result.type).toBe('public-key');
      expect(result.authenticatorAttachment).toBe('platform');
    });

    it('應該處理沒有 getTransports 方法的舊版瀏覽器', () => {
      const mockCredential = {
        id: 'cred123',
        rawId: new Uint8Array([99]).buffer,
        type: 'public-key',
        response: {
          clientDataJSON: new Uint8Array([123]).buffer,
          attestationObject: new Uint8Array([1]).buffer,
        },
        getClientExtensionResults: () => ({}),
      };

      const result = convertRegistrationResponse(mockCredential as any);

      expect(result.response.transports).toEqual([]);
    });
  });

  describe('convertAuthenticationResponse', () => {
    it('應該正確轉換 PublicKeyCredential 為 JSON 格式', () => {
      const mockCredential = {
        id: 'cred123',
        rawId: new Uint8Array([99, 114, 101, 100]).buffer,
        type: 'public-key',
        response: {
          clientDataJSON: new Uint8Array([123, 125]).buffer,
          authenticatorData: new Uint8Array([1, 2, 3, 4]).buffer,
          signature: new Uint8Array([255, 254, 253]).buffer,
          userHandle: new Uint8Array([117, 115, 101, 114]).buffer,
        },
        getClientExtensionResults: () => ({}),
        authenticatorAttachment: 'cross-platform',
      };

      const result = convertAuthenticationResponse(mockCredential as any);

      // 驗證所有 ArrayBuffer 已轉換為 Base64URL
      expect(typeof result.rawId).toBe('string');
      expect(typeof result.response.clientDataJSON).toBe('string');
      expect(typeof result.response.authenticatorData).toBe('string');
      expect(typeof result.response.signature).toBe('string');
      expect(typeof result.response.userHandle).toBe('string');

      // 驗證其他欄位
      expect(result.id).toBe('cred123');
      expect(result.type).toBe('public-key');
      expect(result.authenticatorAttachment).toBe('cross-platform');
    });

    it('應該處理沒有 userHandle 的情況', () => {
      const mockCredential = {
        id: 'cred123',
        rawId: new Uint8Array([99]).buffer,
        type: 'public-key',
        response: {
          clientDataJSON: new Uint8Array([123]).buffer,
          authenticatorData: new Uint8Array([1]).buffer,
          signature: new Uint8Array([255]).buffer,
          userHandle: null,
        },
        getClientExtensionResults: () => ({}),
      };

      const result = convertAuthenticationResponse(mockCredential as any);

      expect(result.response.userHandle).toBeUndefined();
    });
  });
});

describe('Fallout 風格錯誤訊息', () => {
  it('Base64URL 解碼失敗時應該拋出 Fallout 風格錯誤', () => {
    expect(() => {
      base64URLDecode('!!!invalid!!!');
    }).toThrow(/避難所資料解碼失敗|Pip-Boy.*錯誤|輻射干擾/);
  });

  it('credential 轉換失敗時應該拋出 Fallout 風格錯誤', () => {
    expect(() => {
      convertCredentialCreationOptions(null as any);
    }).toThrow(/Pip-Boy.*資料|避難所.*格式|生物辨識.*錯誤/);
  });
});
