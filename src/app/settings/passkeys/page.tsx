/**
 * Passkey 管理頁面
 * 允許使用者查看、新增、編輯、刪除 Passkeys
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PixelIcon } from '@/components/ui/icons';
import { usePasskey } from '@/hooks/usePasskey';
import { useAuthStore } from '@/lib/authStore';

interface Credential {
  id: string;
  device_name: string;
  created_at: string;
  last_used_at: string | null;
  transports: string[];
}

export default function PasskeysPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    registerPasskey,
    listCredentials,
    updateCredentialName,
    deleteCredential,
    isLoading,
    error,
    isSupported,
    clearError,
  } = usePasskey();

  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingCredentials, setLoadingCredentials] = useState(true);

  // 檢查登入狀態
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  // 載入 Passkeys 列表
  const loadCredentials = async () => {
    setLoadingCredentials(true);
    try {
      const creds = await listCredentials();
      setCredentials(creds);
    } catch (err) {
      console.error('Failed to load credentials:', err);
    } finally {
      setLoadingCredentials(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadCredentials();
    }
  }, [user]);

  // 新增 Passkey
  const handleAddPasskey = async () => {
    clearError();
    try {
      await registerPasskey('我的新裝置');
      await loadCredentials(); // 重新載入列表
    } catch (err) {
      console.error('Failed to add passkey:', err);
    }
  };

  // 開始編輯裝置名稱
  const startEditing = (credential: Credential) => {
    setEditingId(credential.id);
    setEditingName(credential.device_name);
  };

  // 儲存裝置名稱
  const saveDeviceName = async (credentialId: string) => {
    if (!editingName.trim()) {
      return;
    }

    clearError();
    try {
      await updateCredentialName(credentialId, editingName);
      setEditingId(null);
      await loadCredentials(); // 重新載入列表
    } catch (err) {
      console.error('Failed to update credential name:', err);
    }
  };

  // 取消編輯
  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  // 確認刪除
  const confirmDelete = (credentialId: string) => {
    setDeletingId(credentialId);
  };

  // 執行刪除
  const handleDelete = async (credentialId: string) => {
    clearError();
    try {
      await deleteCredential(credentialId);
      setDeletingId(null);
      await loadCredentials(); // 重新載入列表
    } catch (err) {
      console.error('Failed to delete credential:', err);
    }
  };

  // 取消刪除
  const cancelDelete = () => {
    setDeletingId(null);
  };

  // 格式化日期
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '從未使用';
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return null; // 等待重導向
  }

  return (
    <div className="min-h-screen bg-wasteland-dark py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl text-pip-boy-green mb-2 flex items-center gap-3">
            <PixelIcon name="fingerprint" size={32} decorative />
            Passkey 管理終端機
          </h1>
          <p className="text-pip-boy-green/70 text-sm">
            管理你的生物辨識憑證（Touch ID、Face ID、Windows Hello）
          </p>
          <div className="w-full h-px bg-pip-boy-green mt-4 opacity-50"></div>
        </div>

        {/* 不支援警告 */}
        {!isSupported && (
          <div className="mb-6 p-4 border border-red-400 bg-red-900/20 text-red-400 text-sm flex items-center">
            <PixelIcon name="alert-triangle" size={20} className="mr-3" aria-label="警告" />
            你的瀏覽器不支援 Passkey，請使用最新版本的 Chrome、Safari、Edge 或 Firefox
          </div>
        )}

        {/* 錯誤訊息 */}
        {error && (
          <div className="mb-6 p-4 border border-red-400 bg-red-900/20 text-red-400 text-sm flex items-center">
            <PixelIcon name="alert-triangle" size={20} className="mr-3" aria-label="錯誤" />
            {error}
          </div>
        )}

        {/* 新增 Passkey 按鈕 */}
        <div className="mb-8">
          <button
            onClick={handleAddPasskey}
            disabled={!isSupported || isLoading}
            className="px-6 py-3 bg-pip-boy-green text-wasteland-dark font-bold text-sm hover:bg-pip-boy-green/80 focus:outline-none focus:ring-2 focus:ring-pip-boy-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <PixelIcon name="plus" size={20} decorative />
            {isLoading ? '處理中...' : '新增 Passkey'}
          </button>
        </div>

        {/* Passkeys 列表 */}
        <div className="bg-wasteland-dark border-2 border-pip-boy-green p-6">
          <h2 className="text-xl text-pip-boy-green mb-4">你的 Passkeys</h2>

          {loadingCredentials ? (
            <div className="py-8 text-center">
              <div className="inline-block w-8 h-8 border-2 border-pip-boy-green border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-pip-boy-green text-sm">載入中...</p>
            </div>
          ) : credentials.length === 0 ? (
            <div className="py-8 text-center">
              <PixelIcon name="fingerprint" size={64} className="mx-auto text-pip-boy-green/30 mb-4" decorative />
              <p className="text-pip-boy-green/70 text-sm">
                尚未設定 Passkey
              </p>
              <p className="text-pip-boy-green/50 text-xs mt-2">
                點擊上方按鈕新增你的第一個 Passkey
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {credentials.map((credential) => (
                <div
                  key={credential.id}
                  className="border border-pip-boy-green/50 bg-black p-4 hover:border-pip-boy-green transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* 裝置名稱 */}
                      {editingId === credential.id ? (
                        <div className="mb-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="w-full max-w-md px-3 py-2 bg-black border border-pip-boy-green text-pip-boy-green text-sm focus:outline-none focus:ring-1 focus:ring-pip-boy-green"
                            placeholder="輸入裝置名稱..."
                            autoFocus
                          />
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => saveDeviceName(credential.id)}
                              disabled={isLoading}
                              className="px-3 py-1 bg-pip-boy-green text-wasteland-dark text-xs hover:bg-pip-boy-green/80 disabled:opacity-50"
                            >
                              儲存
                            </button>
                            <button
                              onClick={cancelEditing}
                              disabled={isLoading}
                              className="px-3 py-1 bg-black border border-pip-boy-green text-pip-boy-green text-xs hover:bg-pip-boy-green/10 disabled:opacity-50"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <h3 className="text-lg text-pip-boy-green mb-2">
                          {credential.device_name}
                        </h3>
                      )}

                      {/* 裝置資訊 */}
                      <div className="space-y-1 text-pip-boy-green/70 text-xs">
                        <p>建立時間: {formatDate(credential.created_at)}</p>
                        <p>最後使用: {formatDate(credential.last_used_at)}</p>
                        {credential.transports && credential.transports.length > 0 && (
                          <p>傳輸方式: {credential.transports.join(', ')}</p>
                        )}
                      </div>
                    </div>

                    {/* 操作按鈕 */}
                    <div className="flex gap-2 ml-4">
                      {editingId !== credential.id && (
                        <>
                          <button
                            onClick={() => startEditing(credential)}
                            disabled={isLoading || deletingId === credential.id}
                            className="p-2 border border-pip-boy-green text-pip-boy-green hover:bg-pip-boy-green/10 disabled:opacity-50 transition-colors"
                            title="編輯名稱"
                          >
                            <PixelIcon name="edit" size={16} decorative />
                          </button>
                          <button
                            onClick={() => confirmDelete(credential.id)}
                            disabled={isLoading || credentials.length === 1}
                            className="p-2 border border-red-400 text-red-400 hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                            title={
                              credentials.length === 1
                                ? '無法刪除最後一個 Passkey'
                                : '刪除 Passkey'
                            }
                          >
                            <PixelIcon name="trash" size={16} decorative />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 刪除確認 */}
                  {deletingId === credential.id && (
                    <div className="mt-4 pt-4 border-t border-pip-boy-green/30">
                      <div className="flex items-center gap-2 text-red-400 text-sm mb-3">
                        <PixelIcon name="alert-triangle" size={20} decorative />
                        確定要刪除此 Passkey？此操作無法復原
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(credential.id)}
                          disabled={isLoading}
                          className="px-4 py-2 bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-50"
                        >
                          確認刪除
                        </button>
                        <button
                          onClick={cancelDelete}
                          disabled={isLoading}
                          className="px-4 py-2 bg-black border border-pip-boy-green text-pip-boy-green text-xs hover:bg-pip-boy-green/10 disabled:opacity-50"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 說明資訊 */}
        <div className="mt-8 p-4 border border-pip-boy-green/30 bg-pip-boy-green/5">
          <h3 className="text-pip-boy-green text-sm mb-2 flex items-center gap-2">
            <PixelIcon name="check-circle" size={16} decorative />
            關於 Passkeys
          </h3>
          <ul className="text-pip-boy-green/70 text-xs space-y-1 list-disc list-inside">
            <li>Passkey 使用生物辨識（指紋、Face ID）或裝置 PIN 碼</li>
            <li>比傳統密碼更安全，無法被釣魚攻擊</li>
            <li>可以在多個裝置上建立 Passkeys</li>
            <li>至少需要保留一個 Passkey 以維持無密碼登入</li>
            <li>刪除 Passkey 後該裝置將無法登入（除非重新設定）</li>
          </ul>
        </div>

        {/* 返回按鈕 */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/profile')}
            className="px-6 py-2 bg-black border border-pip-boy-green text-pip-boy-green text-sm hover:bg-pip-boy-green/10 transition-colors"
          >
            返回個人資料
          </button>
        </div>
      </div>
    </div>
  );
}
