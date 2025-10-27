/**
 * AddPasskeyButton Component
 * 已登入用戶新增 Passkey 的按鈕元件（Fallout 主題）
 *
 * 功能：
 * - 檢查 credential 數量上限（10 個）
 * - 呼叫 getAddCredentialOptions() API
 * - 整合 excludeCredentials 防止重複註冊
 * - 錯誤處理與使用者回饋
 * - Pip-Boy 主題 UI
 */

'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PixelIcon } from '@/components/ui/icons';
import { isWebAuthnSupported } from '@/lib/webauthn/utils';
import {
  getAddCredentialOptions,
  verifyAddCredential,
} from '@/lib/webauthn/api';
import type { RegistrationResponseJSON } from '@/lib/webauthn/types';

/**
 * 新增 Credential 回應型別
 */
interface AddCredentialResponse {
  success: boolean;
  credential: {
    id: string;
    name: string;
    createdAt: string;
  };
}

/**
 * Props
 */
interface AddPasskeyButtonProps {
  credentialCount?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  className?: string;
  buttonText?: string;
  showUnsupportedMessage?: boolean;
}

/**
 * AddPasskeyButton 元件
 */
export function AddPasskeyButton({
  credentialCount = 0,
  onSuccess,
  onError,
  disabled = false,
  className,
  buttonText = '新增 Passkey',
  showUnsupportedMessage = false,
}: AddPasskeyButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  // 檢查 WebAuthn 支援
  React.useEffect(() => {
    const supported = isWebAuthnSupported();
    setIsSupported(supported);
  }, []);

  // 檢查是否達到上限
  const isMaxReached = credentialCount >= 10;

  /**
   * 處理新增 Passkey
   */
  const handleAddPasskey = async () => {
    if (!isSupported) {
      toast.error('[Pip-Boy 錯誤] Passkey 功能不可用');
      return;
    }

    if (isMaxReached) {
      toast.error(
        '[Pip-Boy 警告] 已達到 Passkey 數量上限（10 個）。請先刪除不使用的 Passkey。',
        { duration: 6000 }
      );
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: 取得新增 credential 的註冊選項（包含 excludeCredentials）
      const options = await getAddCredentialOptions();

      // Step 2: 呼叫 WebAuthn API 進行生物辨識
      const credential = await navigator.credentials.create({
        publicKey: {
          ...options,
          challenge: Uint8Array.from(
            atob(options.challenge),
            (c) => c.charCodeAt(0)
          ),
          user: {
            ...options.user,
            id: Uint8Array.from(atob(options.user.id), (c) => c.charCodeAt(0)),
          },
          excludeCredentials: options.excludeCredentials?.map((cred) => ({
            ...cred,
            id: Uint8Array.from(atob(cred.id), (c) => c.charCodeAt(0)),
          })),
        } as PublicKeyCredentialCreationOptions,
      });

      if (!credential) {
        throw new Error('未取得生物辨識憑證');
      }

      // Step 3: 轉換 credential 為 JSON 格式
      const publicKeyCredential = credential as PublicKeyCredential;
      const response = publicKeyCredential.response as AuthenticatorAttestationResponse;

      const registrationResponse: RegistrationResponseJSON = {
        id: publicKeyCredential.id,
        rawId: btoa(String.fromCharCode(...new Uint8Array(publicKeyCredential.rawId)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, ''),
        response: {
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, ''),
          attestationObject: btoa(String.fromCharCode(...new Uint8Array(response.attestationObject)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, ''),
        },
        type: publicKeyCredential.type,
        clientExtensionResults: publicKeyCredential.getClientExtensionResults(),
      };

      // Step 4: 驗證新增的 credential
      const result = await verifyAddCredential(registrationResponse);

      // Step 5: 成功處理
      toast.success(
        '[Pip-Boy 成功] 新的生物辨識裝置已註冊！你現在可以使用此裝置登入避難所。',
        { duration: 5000 }
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('[AddPasskeyButton] Add credential error:', error);

      // 處理不同類型的錯誤
      let errorMessage = '[Pip-Boy 錯誤] 新增 Passkey 失敗，請重試';

      if (error.name === 'NotAllowedError') {
        errorMessage = '[Pip-Boy 通知] 生物辨識驗證已取消。';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = '[Pip-Boy 警告] 裝置不支援此生物辨識方式。';
      } else if (error.name === 'InvalidStateError') {
        errorMessage = '[Pip-Boy 錯誤] 此裝置已註冊過 Passkey，無法重複註冊。';
      } else if (error.message) {
        // 使用 API 回傳的錯誤訊息
        errorMessage = error.message;
      }

      toast.error(errorMessage, { duration: 8000 });

      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 如果不支援 WebAuthn，顯示降級 UI 或隱藏
  if (!isSupported) {
    if (showUnsupportedMessage) {
      return (
        <div className="text-center text-sm text-text-muted">
          [Pip-Boy 警告] 你的瀏覽器不支援 Passkey 功能
        </div>
      );
    }
    return null;
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleAddPasskey}
        variant="default"
        size="default"
        disabled={disabled || isLoading || isMaxReached}
        className={className}
      >
        {isLoading ? (
          <>
            <PixelIcon
              name="loader"
              sizePreset="xs"
              animation="spin"
              decorative
            />
            <span>連接生物辨識掃描器...</span>
          </>
        ) : (
          <>
            <PixelIcon name="fingerprint-add" sizePreset="xs" decorative />
            <span>{buttonText}</span>
          </>
        )}
      </Button>

      {isMaxReached && (
        <p className="text-xs text-error">
          [Pip-Boy 警告] 已達到 Passkey 數量上限（10 個），請先刪除不使用的 Passkey
        </p>
      )}
    </div>
  );
}
