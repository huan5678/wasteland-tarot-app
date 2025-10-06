/**
 * WebAuthn/Passkey 前端工具函式
 * 處理瀏覽器 WebAuthn API 和 Base64URL 編解碼
 */

import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';

/**
 * 檢查瀏覽器是否支援 WebAuthn/Passkey
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
 */
export function base64URLEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64URL 解碼（string → ArrayBuffer）
 */
export function base64URLDecode(base64url: string): ArrayBuffer {
  // 補回 padding
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (base64.length % 4)) % 4;
  base64 += '='.repeat(padLength);

  // 解碼
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * 開始 Passkey 註冊流程
 * @param options - 後端返回的註冊選項
 * @returns 註冊憑證回應
 */
export async function startRegistration(
  options: PublicKeyCredentialCreationOptionsJSON
): Promise<RegistrationResponseJSON> {
  if (!isWebAuthnSupported()) {
    throw new Error('您的瀏覽器不支援 Passkey，請使用最新版本的 Chrome、Safari、Edge 或 Firefox');
  }

  try {
    // 將 JSON 格式的 options 轉換為 PublicKeyCredentialCreationOptions
    const publicKeyOptions: PublicKeyCredentialCreationOptions = {
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

    // 呼叫瀏覽器 WebAuthn API
    const credential = (await navigator.credentials.create({
      publicKey: publicKeyOptions,
    })) as PublicKeyCredential;

    if (!credential) {
      throw new Error('建立 Passkey 失敗，請重試');
    }

    // 格式化回應
    const response = credential.response as AuthenticatorAttestationResponse;
    const clientExtensionResults = credential.getClientExtensionResults();

    return {
      id: credential.id,
      rawId: base64URLEncode(credential.rawId),
      response: {
        clientDataJSON: base64URLEncode(response.clientDataJSON),
        attestationObject: base64URLEncode(response.attestationObject),
        transports: (response as any).getTransports?.() || [],
      },
      type: credential.type,
      clientExtensionResults,
      authenticatorAttachment: (credential as any).authenticatorAttachment,
    };
  } catch (error: any) {
    // 友善的錯誤訊息
    if (error.name === 'NotAllowedError') {
      throw new Error('您取消了 Passkey 建立，或操作逾時');
    } else if (error.name === 'InvalidStateError') {
      throw new Error('此 Passkey 已存在於您的裝置');
    } else if (error.name === 'NotSupportedError') {
      throw new Error('您的裝置不支援此類型的 Passkey');
    } else {
      throw new Error(`建立 Passkey 失敗：${error.message || '未知錯誤'}`);
    }
  }
}

/**
 * 開始 Passkey 驗證流程（登入）
 * @param options - 後端返回的驗證選項
 * @param useBrowserAutofill - 是否使用瀏覽器自動填充 UI
 * @returns 驗證憑證回應
 */
export async function startAuthentication(
  options: PublicKeyCredentialRequestOptionsJSON,
  useBrowserAutofill: boolean = false
): Promise<AuthenticationResponseJSON> {
  if (!isWebAuthnSupported()) {
    throw new Error('您的瀏覽器不支援 Passkey，請使用最新版本的 Chrome、Safari、Edge 或 Firefox');
  }

  try {
    // 將 JSON 格式的 options 轉換為 PublicKeyCredentialRequestOptions
    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
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

    // 呼叫瀏覽器 WebAuthn API
    const credential = (await navigator.credentials.get({
      publicKey: publicKeyOptions,
      mediation: useBrowserAutofill ? 'conditional' : 'optional',
    })) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Passkey 驗證失敗，請重試');
    }

    // 格式化回應
    const response = credential.response as AuthenticatorAssertionResponse;
    const clientExtensionResults = credential.getClientExtensionResults();

    return {
      id: credential.id,
      rawId: base64URLEncode(credential.rawId),
      response: {
        clientDataJSON: base64URLEncode(response.clientDataJSON),
        authenticatorData: base64URLEncode(response.authenticatorData),
        signature: base64URLEncode(response.signature),
        userHandle: response.userHandle ? base64URLEncode(response.userHandle) : undefined,
      },
      type: credential.type,
      clientExtensionResults,
      authenticatorAttachment: (credential as any).authenticatorAttachment,
    };
  } catch (error: any) {
    // 友善的錯誤訊息
    if (error.name === 'NotAllowedError') {
      throw new Error('您取消了 Passkey 驗證，或操作逾時');
    } else if (error.name === 'InvalidStateError') {
      throw new Error('找不到可用的 Passkey');
    } else if (error.name === 'NotSupportedError') {
      throw new Error('您的裝置不支援此類型的 Passkey');
    } else {
      throw new Error(`Passkey 驗證失敗：${error.message || '未知錯誤'}`);
    }
  }
}

/**
 * 平台認證器類型檢測
 */
export async function getPlatformAuthenticatorInfo(): Promise<{
  available: boolean;
  type: 'windows-hello' | 'touch-id' | 'face-id' | 'android-biometric' | 'unknown';
}> {
  if (!isWebAuthnSupported()) {
    return { available: false, type: 'unknown' };
  }

  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

    // 簡易的平台檢測
    let type: 'windows-hello' | 'touch-id' | 'face-id' | 'android-biometric' | 'unknown' = 'unknown';

    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();

      if (ua.includes('windows')) {
        type = 'windows-hello';
      } else if (ua.includes('mac')) {
        type = 'touch-id'; // 可能是 Touch ID 或 Face ID
      } else if (ua.includes('android')) {
        type = 'android-biometric';
      } else if (ua.includes('iphone') || ua.includes('ipad')) {
        type = 'face-id'; // 現代 iOS 裝置主要使用 Face ID
      }
    }

    return { available, type };
  } catch {
    return { available: false, type: 'unknown' };
  }
}

/**
 * 錯誤訊息本地化
 */
export function getLocalizedErrorMessage(error: Error): string {
  const errorMap: Record<string, string> = {
    NotAllowedError: '您取消了操作，或操作逾時',
    InvalidStateError: '找不到可用的 Passkey，或此 Passkey 已存在',
    NotSupportedError: '您的裝置不支援此類型的 Passkey',
    SecurityError: '安全性錯誤，請確認您的連線是 HTTPS',
    AbortError: '操作被中止',
    ConstraintError: '無法滿足 Passkey 建立的條件',
    UnknownError: '發生未知錯誤，請重試',
  };

  return errorMap[error.name] || `錯誤：${error.message || '未知錯誤'}`;
}
