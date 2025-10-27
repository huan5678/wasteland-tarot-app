/**
 * PasskeyRegistrationForm Component
 * 新用戶使用 Passkey 註冊的表單元件（Fallout 主題）
 *
 * 功能：
 * - Email 和名稱輸入
 * - WebAuthn 註冊流程
 * - 錯誤處理與使用者回饋
 * - 載入狀態
 * - Pip-Boy 主題 UI
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PixelIcon } from '@/components/ui/icons';
import { isWebAuthnSupported } from '@/lib/webauthn/utils';
import {
  getRegistrationOptions,
  verifyRegistration,
} from '@/lib/webauthn/api';
import type { RegistrationResponseJSON } from '@/lib/webauthn/types';

/**
 * 表單驗證 Schema（使用 Zod）
 */
const passkeyRegistrationSchema = z.object({
  email: z
    .string()
    .min(1, '請輸入 Email 地址')
    .email('Email 格式不正確，請確認 Pip-Boy 資料庫同步狀態'),
  name: z
    .string()
    .min(2, '名稱至少需要 2 個字元')
    .max(50, '名稱不能超過 50 個字元'),
});

type PasskeyRegistrationFormData = z.infer<typeof passkeyRegistrationSchema>;

/**
 * 註冊回應型別
 */
interface RegistrationResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    [key: string]: any;
  };
}

/**
 * Props
 */
interface PasskeyRegistrationFormProps {
  onSuccess?: (response: RegistrationResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * PasskeyRegistrationForm 元件
 */
export function PasskeyRegistrationForm({
  onSuccess,
  onError,
}: PasskeyRegistrationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  // React Hook Form
  const form = useForm<PasskeyRegistrationFormData>({
    resolver: zodResolver(passkeyRegistrationSchema),
    defaultValues: {
      email: '',
      name: '',
    },
  });

  // 檢查 WebAuthn 支援
  React.useEffect(() => {
    const supported = isWebAuthnSupported();
    setIsSupported(supported);

    if (!supported) {
      toast.error(
        '[Pip-Boy 警告] 你的瀏覽器不支援 Passkey 生物辨識功能。請升級避難所科技系統或改用 Email/密碼註冊。',
        { duration: 8000 }
      );
    }
  }, []);

  /**
   * 處理表單提交
   */
  const onSubmit = async (data: PasskeyRegistrationFormData) => {
    if (!isSupported) {
      toast.error('[Pip-Boy 錯誤] Passkey 功能不可用');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: 取得註冊選項
      const options = await getRegistrationOptions(data.email, data.name);

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

      // Step 4: 驗證註冊
      const result = await verifyRegistration(
        data.email,
        data.name,
        registrationResponse
      );

      // Step 5: 成功處理
      toast.success(
        '[Pip-Boy 成功] 生物辨識註冊完成！歡迎加入避難所，廢土旅者。',
        { duration: 5000 }
      );

      if (onSuccess) {
        onSuccess(result as RegistrationResponse);
      }

      // 導向 dashboard
      router.push('/dashboard');
    } catch (error: any) {
      // 處理不同類型的錯誤
      let errorMessage = '[Pip-Boy 錯誤] 註冊失敗，請重試';
      let shouldShowError = true;

      if (error.name === 'NotAllowedError') {
        // NotAllowedError 通常表示用戶取消或拒絕操作
        // 這是正常的用戶行為，不應顯示錯誤訊息
        console.log('[PasskeyRegistrationForm] User cancelled or rejected registration');
        shouldShowError = false;
      } else if (error.name === 'AbortError') {
        // AbortError 也是用戶主動取消
        console.log('[PasskeyRegistrationForm] User aborted registration');
        shouldShowError = false;
      } else {
        // 其他錯誤才記錄到 console.error
        console.error('[PasskeyRegistrationForm] Registration error:', error);

        if (error.name === 'NotSupportedError') {
          errorMessage = '[Pip-Boy 警告] 裝置不支援此生物辨識方式。請嘗試使用安全金鑰或改用 Email/密碼註冊。';
        } else if (error.name === 'InvalidStateError') {
          errorMessage = '[Pip-Boy 錯誤] 此裝置已註冊過 Passkey。請使用登入功能存取你的帳號。';
        } else if (error.message) {
          // 使用 API 回傳的錯誤訊息
          errorMessage = error.message;
        }
      }

      if (shouldShowError) {
        toast.error(errorMessage, { duration: 8000 });
      }

      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 如果不支援 WebAuthn，顯示降級 UI
  if (!isSupported) {
    return (
      <div className="space-y-4 rounded-md border border-border-secondary bg-bg-secondary p-6 text-center">
        <div className="flex justify-center">
          <PixelIcon
            name="alert-triangle"
            sizePreset="xl"
            variant="warning"
            aria-hidden="true"
          />
        </div>
        <h3 className="text-lg font-semibold text-text-primary">
          [Pip-Boy 警告] 不支援 Passkey 功能
        </h3>
        <p className="text-sm text-text-muted">
          你的瀏覽器不支援 Passkey 生物辨識功能。請升級至最新版瀏覽器或改用 Email/密碼註冊。
        </p>
        <Button
          variant="secondary"
          onClick={() => router.push('/auth/register')}
        >
          <PixelIcon name="mail" sizePreset="xs" />
          改用 Email/密碼註冊
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fallout 主題標題 */}
      <div className="space-y-2 text-center">
        <div className="flex justify-center">
          <PixelIcon
            name="fingerprint"
            sizePreset="xl"
            variant="primary"
            data-testid="passkey-icon"
            aria-hidden="true"
          />
        </div>
        <h2 className="text-2xl font-bold text-pip-boy-green">
          [Vault-Tec 避難所註冊系統]
        </h2>
        <p className="text-sm text-text-muted">
          使用 Pip-Boy 生物辨識技術註冊你的避難所帳號。支援指紋、Face ID 或安全金鑰。
        </p>
      </div>

      {/* 表單 */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Email 欄位 */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-pip-boy-green">
                  Email 地址 (避難所通訊網路)
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="wasteland-dweller@vault-tec.com"
                    autoComplete="email"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs text-text-muted">
                  用於接收避難所通知和帳號復原
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Name 欄位 */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-pip-boy-green">
                  名稱 (避難所居民識別碼)
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="廢土旅者"
                    autoComplete="name"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs text-text-muted">
                  將顯示在你的 Pip-Boy 介面上
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 提交按鈕 */}
          <Button
            type="submit"
            className="w-full"
            variant="default"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <PixelIcon
                  name="loader"
                  sizePreset="xs"
                  animation="spin"
                  decorative
                />
                <span>正在連接生物辨識掃描器...</span>
              </>
            ) : (
              <>
                <PixelIcon name="fingerprint" sizePreset="xs" decorative />
                <span>使用 Passkey 註冊</span>
              </>
            )}
          </Button>
        </form>
      </Form>

      {/* 安全說明 */}
      <div className="rounded-md border border-border-secondary bg-bg-secondary p-4">
        <div className="flex gap-3">
          <PixelIcon
            name="shield-check"
            sizePreset="sm"
            variant="success"
            aria-hidden="true"
          />
          <div className="space-y-1 text-xs text-text-muted">
            <p className="font-medium text-text-primary">
              [Vault-Tec 安全保證]
            </p>
            <p>
              你的生物辨識資料使用 FIDO2/WebAuthn 標準加密，僅儲存於你的裝置中。避難所伺服器無法存取你的指紋或 Face ID 資料。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
