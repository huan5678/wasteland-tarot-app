/**
 * WebAuthn 模組入口
 * 提供完整的 Passkey 認證功能
 */

// 工具函式
export {
  isWebAuthnSupported,
  isConditionalUISupported,
  base64URLEncode,
  base64URLDecode,
  convertCredentialCreationOptions,
  convertCredentialRequestOptions,
  convertRegistrationResponse,
  convertAuthenticationResponse,
  getPlatformAuthenticatorInfo,
  getFalloutErrorMessage,
} from './utils';

// API Client
export {
  getRegistrationOptions,
  verifyRegistration,
  getAuthenticationOptions,
  verifyAuthentication,
  getCredentials,
  getAddCredentialOptions,
  verifyAddCredential,
  updateCredentialName,
  deleteCredential,
  WebAuthnAPIError,
} from './api';

// 型別定義
export type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  PublicKeyCredentialDescriptorJSON,
  AuthenticatorDevice,
  WebAuthnErrorType,
  FalloutWebAuthnError,
  PlatformAuthenticatorType,
  PlatformAuthenticatorInfo,
  CredentialInfo,
  WebAuthnApiResponse,
  RegistrationOptionsResponse,
  AuthenticationOptionsResponse,
  RegistrationVerificationResponse,
  AuthenticationVerificationResponse,
  CredentialListResponse,
  CredentialUpdateResponse,
  CredentialDeleteResponse,
} from './types';
