/**
 * WebAuthn 型別定義
 * 使用 @simplewebauthn/types 作為基礎並擴充 Fallout 主題
 */

import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  PublicKeyCredentialDescriptorJSON,
  AuthenticatorDevice,
} from '@simplewebauthn/types';

/**
 * 重新匯出 @simplewebauthn/types 的型別
 */
export type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  PublicKeyCredentialDescriptorJSON,
  AuthenticatorDevice,
};

/**
 * WebAuthn 錯誤型別（Fallout 主題）
 */
export type WebAuthnErrorType =
  | 'NotAllowedError' // 使用者取消或逾時
  | 'NotSupportedError' // 裝置不支援
  | 'InvalidStateError' // Credential 已存在或找不到
  | 'SecurityError' // 安全性錯誤（非 HTTPS）
  | 'AbortError' // 操作被中止
  | 'ConstraintError' // 無法滿足條件
  | 'UnknownError'; // 未知錯誤

/**
 * Fallout 主題的 WebAuthn 錯誤訊息
 */
export interface FalloutWebAuthnError {
  type: WebAuthnErrorType;
  message: string;
  falloutMessage: string; // Pip-Boy 風格錯誤訊息
  vaultTecCode?: string; // 避難科技錯誤代碼
}

/**
 * 平台認證器類型
 */
export type PlatformAuthenticatorType =
  | 'windows-hello'
  | 'touch-id'
  | 'face-id'
  | 'android-biometric'
  | 'unknown';

/**
 * 平台認證器資訊
 */
export interface PlatformAuthenticatorInfo {
  available: boolean;
  type: PlatformAuthenticatorType;
  falloutName: string; // Fallout 主題名稱
}

/**
 * Credential 詳細資訊（前端使用）
 */
export interface CredentialInfo {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
  deviceType: 'platform' | 'cross-platform' | 'unknown';
  transports: AuthenticatorTransport[];
  falloutDeviceName: string; // Fallout 主題裝置名稱
}

/**
 * API 回應型別
 */
export interface WebAuthnApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  vaultTecCode?: string;
}

/**
 * 註冊選項回應
 */
export interface RegistrationOptionsResponse {
  options: PublicKeyCredentialCreationOptionsJSON;
}

/**
 * 驗證選項回應
 */
export interface AuthenticationOptionsResponse {
  options: PublicKeyCredentialRequestOptionsJSON;
}

/**
 * 註冊驗證回應
 */
export interface RegistrationVerificationResponse {
  verified: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

/**
 * 登入驗證回應
 */
export interface AuthenticationVerificationResponse {
  verified: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

/**
 * Credential 列表回應
 */
export interface CredentialListResponse {
  credentials: CredentialInfo[];
}

/**
 * Credential 更新回應
 */
export interface CredentialUpdateResponse {
  success: boolean;
  credential: CredentialInfo;
}

/**
 * Credential 刪除回應
 */
export interface CredentialDeleteResponse {
  success: boolean;
  message: string;
}
