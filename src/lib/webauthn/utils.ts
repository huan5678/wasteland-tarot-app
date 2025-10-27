/**
 * WebAuthn 工具函式
 * 處理 Base64URL 編解碼、型別轉換和瀏覽器支援檢測
 * Fallout 主題錯誤訊息
 */

import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from './types';

/**
 * 檢查瀏覽器是否支援 WebAuthn/Passkey
 * @returns {boolean} 是否支援
 */
export function isWebAuthnSupported(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.PublicKeyCredential !== undefined &&
    navigator.credentials !== undefined &&
    typeof navigator.credentials.create === 'function' &&
    typeof navigator.credentials.get === 'function'
  );
}

/**
 * 檢查瀏覽器是否支援 Conditional UI (Autofill)
 * @returns {Promise<boolean>} 是否支援 Conditional UI
 */
export async function isConditionalUISupported(): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    return false;
  }

  try {
    const result = await PublicKeyCredential.isConditionalMediationAvailable();
    return result === true;
  } catch {
    return false;
  }
}

/**
 * Base64URL 編碼（ArrayBuffer → string）
 * 符合 RFC 4648 的 Base64URL 編碼規範
 *
 * @param {ArrayBuffer} buffer - 要編碼的 ArrayBuffer
 * @returns {string} Base64URL 編碼字串（無 padding）
 * @throws {Error} Fallout 風格錯誤訊息
 */
export function base64URLEncode(buffer: ArrayBuffer): string {
  try {
    const bytes = new Uint8Array(buffer);
    let binary = '';

    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    // 標準 Base64 編碼
    const base64 = btoa(binary);

    // 轉換為 Base64URL：+ → -, / → _, 移除 =
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  } catch (error) {
    throw new Error(
      `[Pip-Boy 錯誤] 避難所資料編碼失敗。輻射干擾偵測到異常數據流。請重試生物辨識掃描。\n` +
      `Vault-Tec 錯誤代碼: ENCODE_FAILURE_${Date.now()}`
    );
  }
}

/**
 * Base64URL 解碼（string → ArrayBuffer）
 * 符合 RFC 4648 的 Base64URL 解碼規範
 *
 * @param {string} base64url - Base64URL 編碼字串
 * @returns {ArrayBuffer} 解碼後的 ArrayBuffer
 * @throws {Error} Fallout 風格錯誤訊息
 */
export function base64URLDecode(base64url: string): ArrayBuffer {
  try {
    // Base64URL → Base64：- → +, _ → /
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');

    // 補回 padding (=)
    const padLength = (4 - (base64.length % 4)) % 4;
    base64 += '='.repeat(padLength);

    // Base64 解碼
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes.buffer;
  } catch (error) {
    throw new Error(
      `[Pip-Boy 錯誤] 避難所資料解碼失敗。偵測到數據損壞或輻射干擾。請檢查 Pip-Boy 功能是否正常。\n` +
      `Vault-Tec 錯誤代碼: DECODE_FAILURE_${Date.now()}`
    );
  }
}

/**
 * 將 JSON 格式的 registration options 轉換為 PublicKeyCredentialCreationOptions
 *
 * @param {PublicKeyCredentialCreationOptionsJSON} options - JSON 格式的選項
 * @returns {PublicKeyCredentialCreationOptions} 瀏覽器 API 所需的格式
 * @throws {Error} Fallout 風格錯誤訊息
 */
export function convertCredentialCreationOptions(
  options: PublicKeyCredentialCreationOptionsJSON
): PublicKeyCredentialCreationOptions {
  try {
    if (!options) {
      throw new Error('Options is null or undefined');
    }

    return {
      challenge: base64URLDecode(options.challenge as unknown as string),
      rp: options.rp,
      user: {
        id: base64URLDecode(options.user.id as unknown as string),
        name: options.user.name,
        displayName: options.user.displayName,
      },
      pubKeyCredParams: options.pubKeyCredParams,
      timeout: options.timeout,
      excludeCredentials: options.excludeCredentials?.map((cred) => ({
        id: base64URLDecode(cred.id as unknown as string),
        type: cred.type,
        transports: cred.transports,
      })),
      authenticatorSelection: options.authenticatorSelection,
      attestation: options.attestation,
    };
  } catch (error) {
    throw new Error(
      `[Pip-Boy 錯誤] 生物辨識註冊資料格式錯誤。避難所安全協議無法解析註冊選項。\n` +
      `原因: ${error instanceof Error ? error.message : '未知錯誤'}\n` +
      `Vault-Tec 錯誤代碼: CONVERT_CREATE_OPTIONS_FAILURE`
    );
  }
}

/**
 * 將 JSON 格式的 authentication options 轉換為 PublicKeyCredentialRequestOptions
 *
 * @param {PublicKeyCredentialRequestOptionsJSON} options - JSON 格式的選項
 * @returns {PublicKeyCredentialRequestOptions} 瀏覽器 API 所需的格式
 * @throws {Error} Fallout 風格錯誤訊息
 */
export function convertCredentialRequestOptions(
  options: PublicKeyCredentialRequestOptionsJSON
): PublicKeyCredentialRequestOptions {
  try {
    if (!options) {
      throw new Error('Options is null or undefined');
    }

    return {
      challenge: base64URLDecode(options.challenge as unknown as string),
      timeout: options.timeout,
      rpId: options.rpId,
      allowCredentials: options.allowCredentials?.map((cred) => ({
        id: base64URLDecode(cred.id as unknown as string),
        type: cred.type,
        transports: cred.transports,
      })),
      userVerification: options.userVerification,
    };
  } catch (error) {
    throw new Error(
      `[Pip-Boy 錯誤] 生物辨識驗證資料格式錯誤。避難所安全協議無法解析驗證選項。\n` +
      `原因: ${error instanceof Error ? error.message : '未知錯誤'}\n` +
      `Vault-Tec 錯誤代碼: CONVERT_REQUEST_OPTIONS_FAILURE`
    );
  }
}

/**
 * 將 PublicKeyCredential 轉換為 JSON 格式（註冊）
 *
 * @param {PublicKeyCredential} credential - 瀏覽器回傳的 credential
 * @returns {RegistrationResponseJSON} JSON 格式的回應
 * @throws {Error} Fallout 風格錯誤訊息
 */
export function convertRegistrationResponse(
  credential: PublicKeyCredential
): RegistrationResponseJSON {
  try {
    const response = credential.response as AuthenticatorAttestationResponse;
    const clientExtensionResults = credential.getClientExtensionResults();

    // 取得 transports（部分瀏覽器可能不支援）
    let transports: AuthenticatorTransport[] = [];
    if ('getTransports' in response && typeof response.getTransports === 'function') {
      transports = response.getTransports();
    }

    return {
      id: credential.id,
      rawId: base64URLEncode(credential.rawId),
      response: {
        clientDataJSON: base64URLEncode(response.clientDataJSON),
        attestationObject: base64URLEncode(response.attestationObject),
        transports,
      },
      type: credential.type,
      clientExtensionResults,
      authenticatorAttachment: (credential as any).authenticatorAttachment,
    };
  } catch (error) {
    throw new Error(
      `[Pip-Boy 錯誤] 生物辨識註冊回應轉換失敗。Pip-Boy 無法處理認證器回傳的資料。\n` +
      `原因: ${error instanceof Error ? error.message : '未知錯誤'}\n` +
      `Vault-Tec 錯誤代碼: CONVERT_REGISTRATION_RESPONSE_FAILURE`
    );
  }
}

/**
 * 將 PublicKeyCredential 轉換為 JSON 格式（驗證）
 *
 * @param {PublicKeyCredential} credential - 瀏覽器回傳的 credential
 * @returns {AuthenticationResponseJSON} JSON 格式的回應
 * @throws {Error} Fallout 風格錯誤訊息
 */
export function convertAuthenticationResponse(
  credential: PublicKeyCredential
): AuthenticationResponseJSON {
  try {
    const response = credential.response as AuthenticatorAssertionResponse;
    const clientExtensionResults = credential.getClientExtensionResults();

    return {
      id: credential.id,
      rawId: base64URLEncode(credential.rawId),
      response: {
        clientDataJSON: base64URLEncode(response.clientDataJSON),
        authenticatorData: base64URLEncode(response.authenticatorData),
        signature: base64URLEncode(response.signature),
        userHandle: response.userHandle
          ? base64URLEncode(response.userHandle)
          : undefined,
      },
      type: credential.type,
      clientExtensionResults,
      authenticatorAttachment: (credential as any).authenticatorAttachment,
    };
  } catch (error) {
    throw new Error(
      `[Pip-Boy 錯誤] 生物辨識驗證回應轉換失敗。Pip-Boy 無法處理認證器回傳的資料。\n` +
      `原因: ${error instanceof Error ? error.message : '未知錯誤'}\n` +
      `Vault-Tec 錯誤代碼: CONVERT_AUTHENTICATION_RESPONSE_FAILURE`
    );
  }
}

/**
 * 取得平台認證器資訊（Fallout 主題）
 *
 * @returns {Promise<PlatformAuthenticatorInfo>} 平台認證器資訊
 */
export async function getPlatformAuthenticatorInfo(): Promise<{
  available: boolean;
  type: 'windows-hello' | 'touch-id' | 'face-id' | 'android-biometric' | 'unknown';
  falloutName: string;
}> {
  if (!isWebAuthnSupported()) {
    return { available: false, type: 'unknown', falloutName: '未偵測到生物辨識裝置' };
  }

  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

    // 簡易的平台檢測
    let type: 'windows-hello' | 'touch-id' | 'face-id' | 'android-biometric' | 'unknown' = 'unknown';
    let falloutName = '未知生物辨識系統';

    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();

      if (ua.includes('windows')) {
        type = 'windows-hello';
        falloutName = 'Pip-Boy Windows 生物辨識模組';
      } else if (ua.includes('mac')) {
        type = 'touch-id';
        falloutName = 'Pip-Boy Touch ID 掃描器';
      } else if (ua.includes('android')) {
        type = 'android-biometric';
        falloutName = 'Pip-Boy Android 生物辨識單元';
      } else if (ua.includes('iphone') || ua.includes('ipad')) {
        type = 'face-id';
        falloutName = 'Pip-Boy Face ID 識別系統';
      }
    }

    return { available, type, falloutName };
  } catch {
    return { available: false, type: 'unknown', falloutName: '生物辨識系統離線' };
  }
}

/**
 * 將 DOMException 轉換為 Fallout 風格的錯誤訊息
 *
 * @param {Error} error - 原始錯誤
 * @returns {string} Fallout 風格的錯誤訊息
 */
export function getFalloutErrorMessage(error: Error): string {
  const errorMap: Record<string, string> = {
    NotAllowedError:
      '[Pip-Boy 警告] 您取消了生物辨識掃描，或操作逾時。請重新啟動 Pip-Boy 認證程序。',
    InvalidStateError:
      '[Pip-Boy 錯誤] 找不到可用的生物辨識資料，或此 Passkey 已存在於避難所資料庫。',
    NotSupportedError:
      '[Pip-Boy 錯誤] 您的 Pip-Boy 型號不支援此類型的生物辨識。請升級至最新版 Pip-Boy 3000 Mark IV。',
    SecurityError:
      '[Vault-Tec 安全警報] 安全性錯誤。請確認您的連線使用避難所安全協議（HTTPS）。',
    AbortError:
      '[Pip-Boy 通知] 生物辨識掃描被中止。請檢查 Pip-Boy 功能是否正常。',
    ConstraintError:
      '[Pip-Boy 錯誤] 無法滿足生物辨識註冊條件。您的裝置可能不支援所需的安全等級。',
    UnknownError:
      '[Pip-Boy 嚴重錯誤] 發生未知的輻射干擾。請重啟 Pip-Boy 並重試。',
  };

  const falloutMessage = errorMap[error.name] ||
    `[Pip-Boy 錯誤] ${error.message || '未知錯誤。請聯繫避難所技術支援。'}`;

  return falloutMessage;
}
