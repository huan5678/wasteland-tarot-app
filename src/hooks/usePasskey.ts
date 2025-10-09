/**
 * usePasskey Hook
 * 統一管理 Passkey 註冊、驗證、管理功能
 * 重構版本 - 改善型別安全、錯誤處理和程式碼可讀性
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import { passkeyAPI } from '@/lib/api/services';
import { ApiError } from '@/lib/api/client';
import {
  startRegistration,
  startAuthentication,
  isWebAuthnSupported,
  getLocalizedErrorMessage,
} from '@/lib/webauthn';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/types';
import type { PasskeyCredential } from '@/types/api';

// ============================================================================
// Types
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

interface WebAuthnOptionsResponse {
  options: PublicKeyCredentialCreationOptionsJSON | PublicKeyCredentialRequestOptionsJSON;
}

interface WebAuthnVerifyResponse {
  user: any;
  access_token: string;
}

interface UsePasskeyReturn {
  // 狀態
  isLoading: boolean;
  error: string | null;
  isSupported: boolean;

  // 新使用者無密碼註冊
  registerNewUserWithPasskey: (email: string, name: string, deviceName?: string) => Promise<void>;

  // Passkey 登入（已註冊使用者）
  authenticateWithPasskey: (email?: string) => Promise<void>;

  // 已登入使用者新增 Passkey
  registerPasskey: (deviceName?: string) => Promise<void>;

  // Passkey 管理
  listCredentials: () => Promise<PasskeyCredential[]>;
  updateCredentialName: (credentialId: string, newName: string) => Promise<void>;
  deleteCredential: (credentialId: string) => Promise<void>;

  // 重置錯誤
  clearError: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function usePasskey(): UsePasskeyReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();

  const isSupported = isWebAuthnSupported();

  // ========== Helper Functions ==========

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 統一的錯誤處理
   */
  const handleError = useCallback((err: unknown, context: string) => {
    let errorMessage = `${context}失敗`;

    if (err instanceof ApiError) {
      errorMessage = err.message;
    } else if (err instanceof Error) {
      errorMessage = getLocalizedErrorMessage(err);
    }

    setError(errorMessage);
    console.error(`[usePasskey] ${context}:`, err);
  }, []);

  /**
   * 通用的 API fetch 函數
   */
  const fetchAPI = useCallback(async <T,>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: '未知錯誤' }));
      throw new ApiError(errorData.detail || `HTTP ${response.status}`, response.status);
    }

    return response.json();
  }, []);

  // ========== Main Functions ==========

  /**
   * Task 38: 新使用者無密碼註冊（Passkey 作為唯一認證方式）
   */
  const registerNewUserWithPasskey = useCallback(
    async (email: string, name: string, deviceName?: string) => {
      if (!isSupported) {
        setError('您的瀏覽器不支援 Passkey，請使用最新版本的 Chrome、Safari、Edge 或 Firefox');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Step 1: 取得註冊選項
        const optionsResponse = await fetch(`${API_BASE_URL}/api/webauthn/register-new/options`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, name }),
        });

        if (!optionsResponse.ok) {
          const errorData = await optionsResponse.json();
          throw new Error(errorData.detail || '取得註冊選項失敗');
        }

        const { options } = await optionsResponse.json();

        // Step 2: 呼叫瀏覽器 WebAuthn API 建立憑證
        const credential = await startRegistration(
          options as PublicKeyCredentialCreationOptionsJSON
        );

        // Step 3: 將憑證送回後端驗證並建立帳號
        const verifyResponse = await fetch(`${API_BASE_URL}/api/webauthn/register-new/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email,
            name,
            credential_id: credential.id,
            client_data_json: credential.response.clientDataJSON,
            attestation_object: credential.response.attestationObject,
            device_name: deviceName || '我的裝置',
          }),
        });

        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json();
          throw new Error(errorData.detail || '註冊失敗');
        }

        const { user, access_token } = await verifyResponse.json();

        // Step 4: 更新全域狀態並跳轉
        setUser(user);
        setToken(access_token);
        router.push('/profile');
      } catch (err: any) {
        const errorMessage = getLocalizedErrorMessage(err);
        setError(errorMessage);
        console.error('Passkey 註冊失敗:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [isSupported, router, setUser, setToken]
  );

  /**
   * Passkey 登入（Email-guided 或 Usernameless）
   */
  const authenticateWithPasskey = useCallback(
    async (email?: string) => {
      if (!isSupported) {
        setError('您的瀏覽器不支援 Passkey');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Step 1: 取得驗證選項
        const optionsResponse = await fetch(`${API_BASE_URL}/api/webauthn/authenticate/options`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: email || null }), // null = usernameless
        });

        if (!optionsResponse.ok) {
          const errorData = await optionsResponse.json();
          throw new Error(errorData.detail || '取得驗證選項失敗');
        }

        const { options } = await optionsResponse.json();

        // Step 2: 呼叫瀏覽器 WebAuthn API 驗證
        const credential = await startAuthentication(
          options as PublicKeyCredentialRequestOptionsJSON,
          !email // 如果沒有 email，使用 conditional UI
        );

        // Step 3: 將憑證送回後端驗證
        const verifyResponse = await fetch(`${API_BASE_URL}/api/webauthn/authenticate/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            credential_id: credential.id,
            client_data_json: credential.response.clientDataJSON,
            authenticator_data: credential.response.authenticatorData,
            signature: credential.response.signature,
            user_handle: credential.response.userHandle,
          }),
        });

        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json();
          throw new Error(errorData.detail || '驗證失敗');
        }

        const { user, access_token } = await verifyResponse.json();

        // Step 4: 更新全域狀態並跳轉
        setUser(user);
        setToken(access_token);
        router.push('/profile');
      } catch (err: any) {
        const errorMessage = getLocalizedErrorMessage(err);
        setError(errorMessage);
        console.error('Passkey 登入失敗:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [isSupported, router, setUser, setToken]
  );

  /**
   * 已登入使用者新增 Passkey
   */
  const registerPasskey = useCallback(
    async (deviceName?: string) => {
      if (!isSupported) {
        setError('您的瀏覽器不支援 Passkey');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Step 1: 取得註冊選項
        const optionsResponse = await fetch(`${API_BASE_URL}/api/webauthn/register/options`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!optionsResponse.ok) {
          const errorData = await optionsResponse.json();
          throw new Error(errorData.detail || '取得註冊選項失敗');
        }

        const { options } = await optionsResponse.json();

        // Step 2: 呼叫瀏覽器 WebAuthn API 建立憑證
        const credential = await startRegistration(
          options as PublicKeyCredentialCreationOptionsJSON
        );

        // Step 3: 將憑證送回後端驗證
        const verifyResponse = await fetch(`${API_BASE_URL}/api/webauthn/register/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            credential_id: credential.id,
            client_data_json: credential.response.clientDataJSON,
            attestation_object: credential.response.attestationObject,
            device_name: deviceName || '我的裝置',
          }),
        });

        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json();
          throw new Error(errorData.detail || '註冊失敗');
        }

        alert('Passkey 已成功新增！');
      } catch (err: any) {
        const errorMessage = getLocalizedErrorMessage(err);
        setError(errorMessage);
        console.error('Passkey 新增失敗:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [isSupported]
  );

  /**
   * 列出使用者所有 Passkeys（使用新的 API 服務）
   */
  const listCredentials = useCallback(async (): Promise<PasskeyCredential[]> => {
    if (!isSupported) {
      setError('您的瀏覽器不支援 Passkey');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const credentials = await passkeyAPI.listCredentials();
      return credentials;
    } catch (err) {
      handleError(err, '取得 Passkey 列表');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, handleError]);

  /**
   * 更新 Passkey 裝置名稱（使用新的 API 服務）
   */
  const updateCredentialName = useCallback(
    async (credentialId: string, newName: string) => {
      if (!isSupported) {
        setError('您的瀏覽器不支援 Passkey');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await passkeyAPI.updateCredentialName(credentialId, newName);
        // 成功更新，可以在這裡顯示成功訊息
        console.log('[usePasskey] 裝置名稱已更新');
      } catch (err) {
        handleError(err, '更新 Passkey 名稱');
      } finally {
        setIsLoading(false);
      }
    },
    [isSupported, handleError]
  );

  /**
   * 刪除 Passkey（使用新的 API 服務）
   */
  const deleteCredential = useCallback(async (credentialId: string) => {
    if (!isSupported) {
      setError('您的瀏覽器不支援 Passkey');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await passkeyAPI.deleteCredential(credentialId);
      console.log('[usePasskey] Passkey 已刪除');
    } catch (err) {
      handleError(err, '刪除 Passkey');
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, handleError]);

  return {
    isLoading,
    error,
    isSupported,
    registerNewUserWithPasskey,
    authenticateWithPasskey,
    registerPasskey,
    listCredentials,
    updateCredentialName,
    deleteCredential,
    clearError,
  };
}
