/**
 * PasskeyLoginForm Component - Fallout Themed Passkey Login
 * 支援 Email-guided、Usernameless 和 Conditional UI 登入
 * Pip-Boy 生物辨識驗證介面
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PixelIcon } from '@/components/ui/icons';
import { useAuthStore } from '@/lib/authStore';
import { toast } from 'sonner';
import {
  isWebAuthnSupported,
  isConditionalUISupported,
  convertCredentialRequestOptions,
  convertAuthenticationResponse } from
'@/lib/webauthn/utils';
import {
  getAuthenticationOptions,
  verifyAuthentication } from
'@/lib/webauthn/api';

// ============================================================================
// Types
// ============================================================================
import { Button } from "@/components/ui/button";
interface PasskeyLoginFormProps {
  /** 是否顯示 email 輸入欄位（Email-guided 登入） */
  showEmailField?: boolean;
  /** 是否啟用 Conditional UI (autofill) */
  enableConditionalUI?: boolean;
  /** 成功登入後的回調 */
  onSuccess?: (result: {user: any;access_token: string;}) => void;
}

interface FormData {
  email: string;
}

interface FormErrors {
  email?: string;
}

// ============================================================================
// Component
// ============================================================================

export function PasskeyLoginForm({
  showEmailField = false,
  enableConditionalUI = true,
  onSuccess
}: PasskeyLoginFormProps) {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();

  const [formData, setFormData] = useState<FormData>({ email: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [supportsConditionalUI, setSupportsConditionalUI] = useState(false);
  const [conditionalUIActive, setConditionalUIActive] = useState(false);

  // ========== 瀏覽器支援檢查 ==========

  useEffect(() => {
    setIsSupported(isWebAuthnSupported());

    if (enableConditionalUI && isWebAuthnSupported()) {
      isConditionalUISupported().then((supported) => {
        setSupportsConditionalUI(supported);
      });
    }
  }, [enableConditionalUI]);

  // ========== Conditional UI 初始化 ==========

  useEffect(() => {
    if (!enableConditionalUI || !supportsConditionalUI || conditionalUIActive) {
      return;
    }

    const initConditionalUI = async () => {
      try {
        setConditionalUIActive(true);

        // 取得驗證選項（usernameless）
        const options = await getAuthenticationOptions(undefined);

        // 轉換選項為瀏覽器格式
        const publicKeyOptions = convertCredentialRequestOptions(options);

        // 啟動 Conditional UI
        const credential = await navigator.credentials.get({
          publicKey: publicKeyOptions,
          mediation: 'conditional'
        });

        if (credential && credential.type === 'public-key') {
          // 驗證 credential
          await handleVerifyCredential(credential as PublicKeyCredential);
        }
      } catch (error: any) {
        // Conditional UI 錯誤不顯示 toast（靜默失敗）
        console.log('[PasskeyLoginForm] Conditional UI initialization error:', error.message);
      } finally {
        setConditionalUIActive(false);
      }
    };

    initConditionalUI();
  }, [enableConditionalUI, supportsConditionalUI, conditionalUIActive]);

  // ========== 表單驗證 ==========

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (showEmailField && formData.email) {
      // 如果有顯示 email 欄位且使用者輸入了 email，則驗證格式
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email 格式不正確';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [showEmailField, formData.email]);

  // ========== 驗證 Credential ==========

  const handleVerifyCredential = async (credential: PublicKeyCredential) => {
    try {
      setIsLoading(true);

      // 轉換 credential 為後端格式
      const authResponse = convertAuthenticationResponse(credential);

      // 驗證 credential
      const result = await verifyAuthentication(authResponse);

      // 更新全域狀態
      setUser(result.user);
      setToken(result.access_token);

      // 顯示成功訊息
      toast.success('Pip-Boy 生物辨識驗證成功！', {
        description: `歡迎回來，${result.user.name || 'Vault Dweller'}！`
      });

      // 呼叫 onSuccess 回調
      if (onSuccess) {
        onSuccess(result);
      }

      // 跳轉到 dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (error: any) {
      console.error('[PasskeyLoginForm] Verification error:', error);
      const errorMessage = error.message || '生物辨識驗證失敗，請確認 Pip-Boy 功能正常';
      toast.error('驗證失敗', { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // ========== 登入處理 ==========

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // 驗證表單
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // 決定使用 email-guided 還是 usernameless
      const email = showEmailField && formData.email ? formData.email : undefined;

      // Step 1: 取得驗證選項
      const options = await getAuthenticationOptions(email);

      // Step 2: 轉換選項為瀏覽器格式
      const publicKeyOptions = convertCredentialRequestOptions(options);

      // Step 3: 呼叫瀏覽器 WebAuthn API
      const credential = await navigator.credentials.get({
        publicKey: publicKeyOptions
      });

      if (!credential || credential.type !== 'public-key') {
        throw new Error('無效的憑證類型');
      }

      // Step 4: 轉換並驗證
      await handleVerifyCredential(credential as PublicKeyCredential);
    } catch (error: any) {
      // 處理不同類型的錯誤
      let errorMessage = '登入失敗';
      let errorDescription = '請稍後再試';
      let shouldShowError = true;

      if (error.name === 'NotAllowedError') {
        // NotAllowedError 通常表示用戶取消或拒絕操作
        // 這是正常的用戶行為，不應顯示錯誤訊息
        console.log('[PasskeyLoginForm] User cancelled or rejected authentication');
        shouldShowError = false;
      } else if (error.name === 'AbortError') {
        // AbortError 也是用戶主動取消
        console.log('[PasskeyLoginForm] User aborted authentication');
        shouldShowError = false;
      } else {
        // 其他錯誤才記錄到 console.error
        console.error('[PasskeyLoginForm] Login error:', error);
        if (error.message) {
          errorDescription = error.message;
        }
      }

      if (shouldShowError) {
        toast.error(errorMessage, { description: errorDescription });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ========== 輸入變更處理 ==========

  const handleInputChange = (field: keyof FormData) => (
  e: React.ChangeEvent<HTMLInputElement>) =>
  {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

    // 清除該欄位的錯誤
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // ========== 降級 UI（不支援 WebAuthn） ==========

  if (!isSupported) {
    return (
      <div className="bg-wasteland-dark border-2 border-red-400 rounded-none p-6 shadow-lg">
        <div className="text-center space-y-4">
          <PixelIcon
            name="alert-triangle"
            sizePreset="xl"
            variant="error"
            animation="wiggle"
            decorative />

          <h3 className="text-xl text-red-400">Pip-Boy 相容性問題</h3>
          <p className="text-pip-boy-green/70 text-sm">
            你的終端機不支援 Vault-Tec 生物辨識系統 (Passkey/WebAuthn)
          </p>
          <div className="text-xs text-pip-boy-green/50 space-y-1">
            <p>請升級至以下相容的終端機：</p>
            <ul className="list-disc list-inside">
              <li>Chrome 67+</li>
              <li>Safari 13+</li>
              <li>Firefox 60+</li>
              <li>Edge 18+</li>
            </ul>
          </div>
        </div>
      </div>);

  }

  // ========== 主要 UI ==========

  return (
    <div className="bg-wasteland-dark border-2 border-pip-boy-green rounded-none p-6 shadow-lg shadow-pip-boy-green/20">
      <form onSubmit={handleLogin} role="form">
        {/* 標題 */}
        <div className="text-center mb-6">
          <h2 className="text-2xl text-pip-boy-green mb-2">
            Pip-Boy 生物辨識登入
          </h2>
          <p className="text-pip-boy-green/70 text-sm">
            使用 Vault-Tec 認證的生物特徵進行快速存取
          </p>
        </div>

        {/* 載入狀態 */}
        {isLoading &&
        <div className="mb-4 p-3 border border-pip-boy-green bg-pip-boy-green/10 text-pip-boy-green text-sm">
            <div className="flex items-center gap-2">
              <div
              data-testid="pip-boy-loading-spinner"
              className="w-4 h-4 border-2 border-pip-boy-green border-t-transparent rounded-full animate-spin" />

              生物辨識驗證中...
            </div>
          </div>
        }

        {/* Email 輸入欄位（Email-guided 登入） */}
        {showEmailField &&
        <div className="mb-4">
            <label
            htmlFor="email"
            className="block text-pip-boy-green text-sm mb-2">

              Email 信箱（選填）
            </label>
            <input
            id="email"
            type="email"
            autoComplete={supportsConditionalUI ? 'email webauthn' : 'email'}
            className="w-full px-3 py-2 bg-black border border-pip-boy-green text-pip-boy-green placeholder-pip-boy-green/50 focus:outline-none focus:ring-1 focus:ring-pip-boy-green disabled:opacity-50"
            placeholder="輸入 Email 或留空使用快速登入..."
            value={formData.email}
            onChange={handleInputChange('email')}
            disabled={isLoading} />

            {errors.email &&
          <p className="mt-1 text-red-400 text-xs flex items-center">
                <PixelIcon
              name="alert-triangle"
              sizePreset="xs"
              variant="error"
              className="mr-1"
              decorative />

                {errors.email}
              </p>
          }
            <p className="mt-1 text-pip-boy-green/50 text-xs">
              💡 提示：留空 Email 將自動選擇你的 Pip-Boy
            </p>
          </div>
        }

        {/* 登入按鈕 */}
        <Button size="icon" variant="outline"
        type="submit"
        disabled={isLoading}
        className="w-full py-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2">

          <PixelIcon
            name="shield"
            sizePreset="sm"
            variant="warning"
            animation={isLoading ? 'pulse' : undefined}
            aria-label="生物辨識" />

          {isLoading ? '生物辨識掃描中...' : '使用 Passkey 登入'}
        </Button>

        {/* 說明文字 */}
        <div className="mt-4 p-3 border border-amber-500/30 bg-amber-500/5 text-amber-500/80 text-xs space-y-2">
          <p className="flex items-start gap-2">
            <PixelIcon name="info" sizePreset="xs" variant="warning" className="mt-0.5" decorative />
            <span>
              使用你的 Touch ID、Face ID、Windows Hello 或安全鑰匙進行快速登入
            </span>
          </p>
          {supportsConditionalUI && showEmailField &&
          <p className="flex items-start gap-2">
              <PixelIcon name="zap" sizePreset="xs" variant="warning" className="mt-0.5" decorative />
              <span>
                你的瀏覽器支援自動填入 - 點擊 Email 欄位即可快速選擇
              </span>
            </p>
          }
        </div>
      </form>
    </div>);

}