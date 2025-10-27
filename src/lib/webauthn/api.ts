/**
 * WebAuthn API Client
 * 與後端 FastAPI WebAuthn 端點通信
 * 使用 Next.js API Proxy (/api/v1/*)
 */

import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  RegistrationOptionsResponse,
  AuthenticationOptionsResponse,
  RegistrationVerificationResponse,
  AuthenticationVerificationResponse,
  CredentialListResponse,
  CredentialUpdateResponse,
  CredentialDeleteResponse,
  CredentialInfo,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

/**
 * API 錯誤類別（Fallout 主題）
 */
class WebAuthnAPIError extends Error {
  status: number;
  vaultTecCode?: string;

  constructor(message: string, status: number, vaultTecCode?: string) {
    super(message);
    this.name = 'WebAuthnAPIError';
    this.status = status;
    this.vaultTecCode = vaultTecCode;
  }
}

/**
 * 統一錯誤處理函式
 */
async function handleAPIResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `[Pip-Boy 錯誤] 避難所伺服器回應異常（HTTP ${response.status}）`;
    let vaultTecCode: string | undefined;

    try {
      const errorData = await response.json();
      if (errorData.error || errorData.detail) {
        errorMessage = errorData.error || errorData.detail;
      }
      if (errorData.vaultTecCode) {
        vaultTecCode = errorData.vaultTecCode;
      }
    } catch {
      // JSON 解析失敗，使用預設錯誤訊息
    }

    throw new WebAuthnAPIError(errorMessage, response.status, vaultTecCode);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new WebAuthnAPIError(
      '[Pip-Boy 錯誤] 避難所資料格式錯誤，無法解析伺服器回應',
      500
    );
  }
}

/**
 * 1. 取得新用戶註冊選項
 *
 * POST /api/v1/webauthn/register-new/options
 *
 * @param email - 用戶 email
 * @param name - 用戶名稱
 * @returns {Promise<PublicKeyCredentialCreationOptionsJSON>} 註冊選項
 * @throws {WebAuthnAPIError} Fallout 風格錯誤
 */
export async function getRegistrationOptions(
  email: string,
  name: string
): Promise<PublicKeyCredentialCreationOptionsJSON> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/webauthn/register-new/options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, name }),
    });

    const data = await handleAPIResponse<RegistrationOptionsResponse>(response);
    return data.options;
  } catch (error) {
    if (error instanceof WebAuthnAPIError) {
      throw error;
    }
    throw new WebAuthnAPIError(
      '[Pip-Boy 錯誤] 無法連線至避難所伺服器。請檢查網路連線或稍後再試。',
      0
    );
  }
}

/**
 * 2. 驗證新用戶註冊回應
 *
 * POST /api/v1/webauthn/register-new/verify
 *
 * @param email - 用戶 email
 * @param name - 用戶名稱
 * @param credential - 註冊憑證回應
 * @returns {Promise<RegistrationVerificationResponse>} 驗證結果和 tokens
 * @throws {WebAuthnAPIError} Fallout 風格錯誤
 */
export async function verifyRegistration(
  email: string,
  name: string,
  credential: RegistrationResponseJSON
): Promise<RegistrationVerificationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/webauthn/register-new/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, name, credential }),
    });

    return await handleAPIResponse<RegistrationVerificationResponse>(response);
  } catch (error) {
    if (error instanceof WebAuthnAPIError) {
      throw error;
    }
    throw new WebAuthnAPIError(
      '[Pip-Boy 錯誤] 生物辨識註冊驗證失敗。請重試或聯繫避難所技術支援。',
      0
    );
  }
}

/**
 * 3. 取得驗證選項（登入）
 *
 * POST /api/v1/webauthn/authenticate/options
 *
 * @param email - 可選的用戶 email（email-guided login）
 * @returns {Promise<PublicKeyCredentialRequestOptionsJSON>} 驗證選項
 * @throws {WebAuthnAPIError} Fallout 風格錯誤
 */
export async function getAuthenticationOptions(
  email?: string
): Promise<PublicKeyCredentialRequestOptionsJSON> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/webauthn/authenticate/options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email: email || null }),
    });

    const data = await handleAPIResponse<AuthenticationOptionsResponse>(response);
    return data.options;
  } catch (error) {
    if (error instanceof WebAuthnAPIError) {
      throw error;
    }
    throw new WebAuthnAPIError(
      '[Pip-Boy 錯誤] 無法啟動生物辨識驗證。請檢查網路連線或稍後再試。',
      0
    );
  }
}

/**
 * 4. 驗證登入回應
 *
 * POST /api/v1/webauthn/authenticate/verify
 *
 * @param credential - 驗證憑證回應
 * @returns {Promise<AuthenticationVerificationResponse>} 驗證結果和 tokens
 * @throws {WebAuthnAPIError} Fallout 風格錯誤
 */
export async function verifyAuthentication(
  credential: AuthenticationResponseJSON
): Promise<AuthenticationVerificationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/webauthn/authenticate/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ credential }),
    });

    return await handleAPIResponse<AuthenticationVerificationResponse>(response);
  } catch (error) {
    if (error instanceof WebAuthnAPIError) {
      throw error;
    }
    throw new WebAuthnAPIError(
      '[Pip-Boy 錯誤] 生物辨識驗證失敗。請重試或使用其他登入方式。',
      0
    );
  }
}

/**
 * 5. 取得用戶所有 Credentials（需登入）
 *
 * GET /api/v1/webauthn/credentials
 *
 * @returns {Promise<CredentialInfo[]>} Credential 列表
 * @throws {WebAuthnAPIError} Fallout 風格錯誤
 */
export async function getCredentials(): Promise<CredentialInfo[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/webauthn/credentials`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await handleAPIResponse<CredentialListResponse>(response);
    return data.credentials;
  } catch (error) {
    if (error instanceof WebAuthnAPIError) {
      throw error;
    }
    throw new WebAuthnAPIError(
      '[Pip-Boy 錯誤] 無法讀取避難所生物辨識資料庫。請稍後再試。',
      0
    );
  }
}

/**
 * 6. 取得已登入用戶新增 Credential 的註冊選項（需登入）
 *
 * POST /api/v1/webauthn/register/options
 *
 * @returns {Promise<PublicKeyCredentialCreationOptionsJSON>} 註冊選項
 * @throws {WebAuthnAPIError} Fallout 風格錯誤
 */
export async function getAddCredentialOptions(): Promise<PublicKeyCredentialCreationOptionsJSON> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/webauthn/register/options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await handleAPIResponse<RegistrationOptionsResponse>(response);
    return data.options;
  } catch (error) {
    if (error instanceof WebAuthnAPIError) {
      throw error;
    }
    throw new WebAuthnAPIError(
      '[Pip-Boy 錯誤] 無法啟動新 Passkey 註冊程序。請稍後再試。',
      0
    );
  }
}

/**
 * 7. 驗證新增 Credential 的回應（需登入）
 *
 * POST /api/v1/webauthn/register/verify
 *
 * @param credential - 註冊憑證回應
 * @returns {Promise<CredentialInfo>} 新增的 Credential 資訊
 * @throws {WebAuthnAPIError} Fallout 風格錯誤
 */
export async function verifyAddCredential(
  credential: RegistrationResponseJSON
): Promise<CredentialInfo> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/webauthn/register/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ credential }),
    });

    const data = await handleAPIResponse<CredentialUpdateResponse>(response);
    return data.credential;
  } catch (error) {
    if (error instanceof WebAuthnAPIError) {
      throw error;
    }
    throw new WebAuthnAPIError(
      '[Pip-Boy 錯誤] 新 Passkey 註冊驗證失敗。請重試。',
      0
    );
  }
}

/**
 * 8. 更新 Credential 名稱（需登入）
 *
 * PATCH /api/v1/webauthn/credentials/:id/name
 *
 * @param credentialId - Credential ID
 * @param newName - 新名稱
 * @returns {Promise<CredentialInfo>} 更新後的 Credential 資訊
 * @throws {WebAuthnAPIError} Fallout 風格錯誤
 */
export async function updateCredentialName(
  credentialId: string,
  newName: string
): Promise<CredentialInfo> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/webauthn/credentials/${credentialId}/name`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: newName }),
      }
    );

    const data = await handleAPIResponse<CredentialUpdateResponse>(response);
    return data.credential;
  } catch (error) {
    if (error instanceof WebAuthnAPIError) {
      throw error;
    }
    throw new WebAuthnAPIError(
      '[Pip-Boy 錯誤] 無法更新 Passkey 名稱。請稍後再試。',
      0
    );
  }
}

/**
 * 9. 刪除 Credential（需登入）
 *
 * DELETE /api/v1/webauthn/credentials/:id
 *
 * @param credentialId - Credential ID
 * @returns {Promise<void>}
 * @throws {WebAuthnAPIError} Fallout 風格錯誤
 */
export async function deleteCredential(credentialId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/webauthn/credentials/${credentialId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    await handleAPIResponse<CredentialDeleteResponse>(response);
  } catch (error) {
    if (error instanceof WebAuthnAPIError) {
      throw error;
    }
    throw new WebAuthnAPIError(
      '[Pip-Boy 錯誤] 無法刪除 Passkey。請確認這不是您最後一個認證方式。',
      0
    );
  }
}

/**
 * 匯出錯誤類別供外部使用
 */
export { WebAuthnAPIError };
