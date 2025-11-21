/**
 * 認證方式管理元件
 *
 * 功能：
 * - 顯示當前啟用的認證方式（OAuth, Passkey, Password）
 * - 提供新增/移除認證方式的操作
 * - 確保至少保留一種認證方式
 * - Pip-Boy 風格 UI（Cubic 11 字體、廢土主題）
 *
 * 使用範圍：
 * - 帳號設定頁面（/profile 或 /settings）
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { AuthService } from '@/services/auth.service';
import { PixelIcon } from '@/components/ui/icons';
import { toast } from 'sonner';
import { useOAuth } from '@/hooks/useOAuth';
import { usePasskey } from '@/hooks/usePasskey';
import { trackPasskeyUpgradeCompleted } from '@/lib/analytics/authEventTracker';import { Button } from "@/components/ui/button";

interface PasskeyCredential {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
  device_type: string;
}

interface AuthMethodsState {
  has_oauth: boolean;
  has_passkey: boolean;
  has_password: boolean;
  oauth_provider?: string | null;
  profile_picture?: string | null;
  passkey_credentials?: PasskeyCredential[];
}

export function AuthMethodsManagement() {
  const {
    hasOAuth,
    hasPasskey,
    hasPassword,
    oauthProvider,
    profilePicture,
    refreshAuthMethods
  } = useAuthStore();

  // OAuth 和 Passkey hooks
  const { signInWithGoogle, loading: oauthLoading } = useOAuth();
  const { registerPasskey, deleteCredential, isLoading: passkeyLoading } = usePasskey();

  const [authMethods, setAuthMethods] = useState<AuthMethodsState>({
    has_oauth: hasOAuth,
    has_passkey: hasPasskey,
    has_password: hasPassword,
    oauth_provider: oauthProvider,
    profile_picture: profilePicture,
    passkey_credentials: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [showRemoveDialog, setShowRemoveDialog] = useState<string | null>(null);
  const [showSetPasswordDialog, setShowSetPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 載入認證方式詳細資訊
  useEffect(() => {
    const loadAuthMethods = async () => {
      setIsLoading(true);
      try {
        const methods = await AuthService.getAuthMethods();
        setAuthMethods(methods);
      } catch (error) {
        console.error('Failed to load auth methods:', error);
        toast.error('載入認證方式失敗');
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthMethods();
  }, []);

  // 計算當前啟用的認證方式數量
  const enabledMethodsCount =
  Number(authMethods.has_oauth) +
  Number(authMethods.has_passkey) +
  Number(authMethods.has_password);

  // 判斷某個認證方式是否可以移除（至少保留一種）
  const canRemove = (method: 'oauth' | 'passkey' | 'password'): boolean => {
    if (enabledMethodsCount <= 1) return false;

    // 特殊情況：如果有多個 Passkeys，可以刪除單個 credential
    if (method === 'passkey' && (authMethods.passkey_credentials?.length || 0) > 1) {
      return true;
    }

    return true;
  };

  // 處理連結 Google OAuth
  const handleLinkGoogleOAuth = async () => {
    try {
      toast.loading('正在連結 Google 帳號...');

      // 使用 useOAuth hook 啟動 OAuth 流程
      // 後端會自動檢測已登入狀態並連結 OAuth
      const result = await signInWithGoogle();

      if (result.success) {
        // OAuth 流程會自動重導向到 /auth/callback
        // callback 處理會呼叫後端 API 連結帳號
        toast.success('正在重導向至 Google 授權頁面...');
      } else {
        toast.error(result.error || '連結失敗，請稍後再試');
      }
    } catch (error) {
      console.error('Failed to link Google OAuth:', error);
      toast.error('連結失敗，請稍後再試');
    }
  };

  // 處理新增 Passkey
  const handleAddPasskey = async () => {
    try {
      toast.loading('正在設定 Passkey...');

      // 使用 usePasskey hook 註冊 Passkey
      await registerPasskey('新裝置');

      // 追蹤事件：從設定頁面新增 Passkey
      trackPasskeyUpgradeCompleted('settings').catch(console.warn);

      toast.success('Passkey 已新增！');

      // 重新載入認證方式
      await refreshAuthMethods();
      await loadAuthMethods();
    } catch (error) {
      console.error('Failed to add Passkey:', error);
      toast.error('設定失敗，請稍後再試');
    }
  };

  // 處理設定密碼
  const handleSetPassword = () => {
    setShowSetPasswordDialog(true);
  };

  // 處理密碼設定提交
  const handleSetPasswordSubmit = async () => {
    // 驗證密碼
    if (!newPassword || newPassword.length < 8) {
      toast.error('密碼長度至少需要 8 個字元');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('兩次輸入的密碼不一致');
      return;
    }

    try {
      toast.loading('正在設定密碼...');

      // 呼叫後端 API 設定密碼
      const response = await fetch('/api/v1/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ password: newPassword })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: '設定密碼失敗' }));
        throw new Error(error.detail || '設定密碼失敗');
      }

      toast.success('密碼已設定！');

      // 重新載入認證方式
      await refreshAuthMethods();
      await loadAuthMethods();

      // 關閉對話框並清空密碼
      setShowSetPasswordDialog(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Failed to set password:', error);
      toast.error(error.message || '設定密碼失敗，請稍後再試');
    }
  };

  // 處理移除 OAuth
  const handleRemoveOAuth = async () => {
    if (!canRemove('oauth')) {
      toast.error('您必須至少保留一種登入方式');
      return;
    }

    try {
      toast.loading('正在取消 Google 帳號連結...');

      // 呼叫後端 API 移除 OAuth 連結
      const response = await fetch('/api/v1/auth/oauth/unlink', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: '取消連結失敗' }));
        throw new Error(error.detail || '取消連結失敗');
      }

      toast.success('Google 帳號連結已取消');

      // 重新載入認證方式
      await refreshAuthMethods();
      await loadAuthMethods();

      setShowRemoveDialog(null);
    } catch (error: any) {
      console.error('Failed to remove OAuth:', error);
      toast.error(error.message || '取消連結失敗，請稍後再試');
    }
  };

  // 處理刪除 Passkey credential
  const handleDeletePasskey = async (credentialId: string) => {
    if (!canRemove('passkey')) {
      toast.error('您必須至少保留一種登入方式');
      return;
    }

    try {
      toast.loading('正在刪除 Passkey...');

      // 使用 usePasskey hook 刪除 Passkey
      await deleteCredential(credentialId);

      toast.success('Passkey 已刪除');

      // 重新載入認證方式
      await refreshAuthMethods();
      await loadAuthMethods();

      setShowRemoveDialog(null);
    } catch (error: any) {
      console.error('Failed to delete Passkey:', error);
      toast.error(error.message || '刪除失敗，請稍後再試');
    }
  };

  // 載入認證方式的輔助函式
  const loadAuthMethods = async () => {
    try {
      const methods = await authAPI.getAuthMethods();
      setAuthMethods(methods);
    } catch (error) {
      console.error('Failed to load auth methods:', error);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '從未使用';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays} 天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} 週前`;
    return date.toLocaleDateString('zh-TW');
  };

  // 取得裝置圖示
  const getDeviceIcon = (deviceType: string): string => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return 'mobile';
      case 'desktop':
        return 'desktop';
      case 'tablet':
        return 'tablet';
      default:
        return 'device';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <PixelIcon name="loader" animation="spin" variant="primary" sizePreset="lg" decorative />
        <span className="ml-4 text-pip-boy-green">載入認證方式...</span>
      </div>);

  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-pip-boy-green border-b-2 border-pip-boy-green pb-2">
        認證方式管理
      </h2>

      {/* OAuth 卡片 */}
      <div className="bg-black/50 border-2 border-pip-boy-green rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PixelIcon name="google" sizePreset="lg" variant="primary" aria-label="Google" />
            <div>
              <h3 className="text-xl font-bold text-radiation-orange">Vault-Tec 授權連結</h3>
              <p className="text-sm text-gray-400">社交登入整合</p>
            </div>
          </div>
          {authMethods.has_oauth && authMethods.profile_picture &&
          <img
            src={authMethods.profile_picture}
            alt="Google 頭像"
            className="w-12 h-12 rounded-full border-2 border-pip-boy-green" />

          }
        </div>

        {authMethods.has_oauth ?
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-pip-boy-green">
              <PixelIcon name="check" sizePreset="sm" variant="success" decorative />
              <span className="font-bold">已連結 Google 帳號</span>
            </div>
            {canRemove('oauth') &&
          <Button size="sm" variant="outline"
          onClick={() => setShowRemoveDialog('oauth')}
          className="btn">

                <PixelIcon name="close" sizePreset="xs" aria-label="移除" />
                取消連結
              </Button>
          }
          </div> :

        <Button size="default" variant="outline"
        onClick={handleLinkGoogleOAuth}
        className="btn w-full">

            <PixelIcon name="google" sizePreset="sm" aria-label="Google" />
            連結 Google 帳號
          </Button>
        }
      </div>

      {/* Passkey 卡片 */}
      <div className="bg-black/50 border-2 border-pip-boy-green rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3">
          <PixelIcon name="fingerprint" sizePreset="lg" variant="primary" aria-label="Passkey" />
          <div>
            <h3 className="text-xl font-bold text-radiation-orange">生物辨識掃描儀</h3>
            <p className="text-sm text-gray-400">Passkey 無密碼登入</p>
          </div>
        </div>

        {authMethods.has_passkey && authMethods.passkey_credentials && authMethods.passkey_credentials.length > 0 ?
        <div className="space-y-4">
            <div className="space-y-2">
              {authMethods.passkey_credentials.map((credential) =>
            <div
              key={credential.id}
              className="flex items-center justify-between bg-black/30 border border-pip-boy-green/30 rounded p-3">

                  <div className="flex items-center gap-3">
                    <PixelIcon
                  name={getDeviceIcon(credential.device_type)}
                  sizePreset="md"
                  variant="primary"
                  aria-label={credential.device_type}
                  data-testid={`icon-${getDeviceIcon(credential.device_type)}`} />

                    <div>
                      <p className="font-bold text-pip-boy-green">{credential.name}</p>
                      <p className="text-xs text-gray-400">
                        最後使用: {formatDate(credential.last_used_at)}
                      </p>
                    </div>
                  </div>
                  <Button size="icon" variant="link"
              onClick={() => setShowRemoveDialog(`passkey-${credential.id}`)}
              className="transition-colors"
              disabled={!canRemove('passkey')}>

                    <PixelIcon name="trash" sizePreset="sm" aria-label="刪除" />
                  </Button>
                </div>
            )}
            </div>
            <Button size="default" variant="default"
          onClick={handleAddPasskey}
          className="btn w-full">

              <PixelIcon name="plus" sizePreset="sm" aria-label="新增" />
              新增 Passkey
            </Button>
          </div> :

        <Button size="default" variant="default"
        onClick={handleAddPasskey}
        className="btn w-full">

            <PixelIcon name="fingerprint" sizePreset="sm" aria-label="Passkey" />
            新增 Passkey
          </Button>
        }
      </div>

      {/* 密碼卡片 */}
      <div className="bg-black/50 border-2 border-pip-boy-green rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3">
          <PixelIcon name="lock" sizePreset="lg" variant="primary" aria-label="密碼" />
          <div>
            <h3 className="text-xl font-bold text-radiation-orange">傳統安全協議</h3>
            <p className="text-sm text-gray-400">Email + 密碼登入</p>
          </div>
        </div>

        {authMethods.has_password ?
        <div className="flex items-center gap-2 text-pip-boy-green">
            <PixelIcon name="check" sizePreset="sm" variant="success" decorative />
            <span className="font-bold">已設定密碼</span>
          </div> :
        authMethods.has_oauth ?
        <Button size="default" variant="outline"
        onClick={handleSetPassword}
        className="btn w-full">

            <PixelIcon name="lock" sizePreset="sm" aria-label="密碼" />
            設定密碼
          </Button> :
        null}
      </div>

      {/* 移除確認對話框 */}
      {showRemoveDialog &&
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black border-4 border-pip-boy-green rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-radiation-orange mb-4">
              {showRemoveDialog === 'oauth' ?
            '確定要取消 Google 帳號連結？' :
            '確定要刪除此 Passkey？'}
            </h3>
            <p className="text-gray-400 mb-6">
              {showRemoveDialog === 'oauth' ?
            '取消連結後，您將無法使用 Google 登入。您仍可使用其他認證方式登入。' :
            '刪除後，您將無法使用此 Passkey 登入。您仍可使用其他 Passkeys 或認證方式登入。'}
            </p>
            <div className="flex gap-4">
              <Button size="default" variant="outline"
            onClick={() => setShowRemoveDialog(null)}
            className="btn flex-1">

                取消
              </Button>
              <Button size="default" variant="default"
            onClick={() => {
              if (showRemoveDialog === 'oauth') {
                handleRemoveOAuth();
              } else {
                const credentialId = showRemoveDialog.replace('passkey-', '');
                handleDeletePasskey(credentialId);
              }
            }}
            className="btn flex-1">

                確定
              </Button>
            </div>
          </div>
        </div>
      }

      {/* 設定密碼對話框 */}
      {showSetPasswordDialog &&
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black border-4 border-pip-boy-green rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-radiation-orange mb-4">設定密碼</h3>
            <p className="text-gray-400 mb-6">為你的帳號設定一組密碼，作為備用登入方式。</p>

            {/* 密碼輸入欄位 */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-pip-boy-green text-sm mb-2">
                  新密碼
                </label>
                <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="至少 8 個字元"
                className="w-full px-3 py-2 bg-black border border-pip-boy-green text-pip-boy-green focus:outline-none focus:ring-1 focus:ring-pip-boy-green"
                minLength={8} />

              </div>

              <div>
                <label className="block text-pip-boy-green text-sm mb-2">
                  確認密碼
                </label>
                <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次輸入密碼"
                className="w-full px-3 py-2 bg-black border border-pip-boy-green text-pip-boy-green focus:outline-none focus:ring-1 focus:ring-pip-boy-green"
                minLength={8} />

              </div>
            </div>

            {/* 按鈕 */}
            <div className="flex gap-4">
              <Button size="default" variant="outline"
            onClick={() => {
              setShowSetPasswordDialog(false);
              setNewPassword('');
              setConfirmPassword('');
            }}
            className="btn flex-1">

                取消
              </Button>
              <Button size="default" variant="default"
            onClick={handleSetPasswordSubmit}
            className="btn flex-1"
            disabled={!newPassword || !confirmPassword}>

                確定
              </Button>
            </div>
          </div>
        </div>
      }
    </div>);

}