/**
 * CredentialManagementPage Component
 * Passkey 管理頁面（Fallout 主題）
 *
 * 功能：
 * - 列出所有 credentials（依 last_used_at 降序）
 * - 顯示詳細資訊（device_name, created_at, last_used_at, transports 等）
 * - 內聯編輯 device_name（使用 Dialog）
 * - 刪除功能（含確認對話框，最後一個 credential 額外警告）
 * - 新增 Passkey（整合 AddPasskeyButton）
 * - 10 個上限提示（達到上限時禁用新增按鈕）
 * - 載入狀態、空狀態、錯誤處理
 * - Pip-Boy 主題 UI
 */

'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PixelIcon } from '@/components/ui/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CredentialCard } from './CredentialCard';
import { AddPasskeyButton } from './AddPasskeyButton';
import {
  getCredentials,
  updateCredentialName,
  deleteCredential,
} from '@/lib/webauthn/api';
import type { CredentialInfo } from '@/lib/webauthn/types';

/**
 * CredentialManagementPage 元件
 */
export function CredentialManagementPage() {
  const [credentials, setCredentials] = useState<CredentialInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 編輯對話框狀態
  const [editingCredential, setEditingCredential] = useState<CredentialInfo | null>(null);
  const [editName, setEditName] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);

  // 刪除對話框狀態
  const [deletingCredential, setDeletingCredential] = useState<CredentialInfo | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  /**
   * 載入 credentials
   */
  const loadCredentials = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getCredentials();

      // 依 last_used_at 降序排序
      const sorted = data.sort((a, b) => {
        if (!a.lastUsedAt) return 1;
        if (!b.lastUsedAt) return -1;
        return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
      });

      setCredentials(sorted);
    } catch (err: any) {
      console.error('[CredentialManagementPage] Load credentials error:', err);
      setError(err.message || '[Pip-Boy 錯誤] 無法載入 Passkey 列表');
      toast.error('[Pip-Boy 錯誤] 無法載入 Passkey 列表。請重試。');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 初始載入
   */
  useEffect(() => {
    loadCredentials();
  }, []);

  /**
   * 處理編輯按鈕點擊
   */
  const handleEditClick = (credential: CredentialInfo) => {
    setEditingCredential(credential);
    setEditName(credential.name);
    setIsEditDialogOpen(true);
  };

  /**
   * 處理編輯提交
   */
  const handleEditSubmit = async () => {
    if (!editingCredential || !editName.trim()) {
      toast.error('[Pip-Boy 警告] Passkey 名稱不能為空');
      return;
    }

    setIsEditLoading(true);

    try {
      const updated = await updateCredentialName(editingCredential.id, editName.trim());

      // 更新列表中的 credential
      setCredentials((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );

      toast.success('[Pip-Boy 成功] Passkey 名稱已更新！');
      setIsEditDialogOpen(false);
      setEditingCredential(null);
      setEditName('');
    } catch (err: any) {
      console.error('[CredentialManagementPage] Update credential error:', err);
      toast.error(err.message || '[Pip-Boy 錯誤] 無法更新 Passkey 名稱。請重試。');
    } finally {
      setIsEditLoading(false);
    }
  };

  /**
   * 處理刪除按鈕點擊
   */
  const handleDeleteClick = (credential: CredentialInfo) => {
    setDeletingCredential(credential);
    setIsDeleteDialogOpen(true);
  };

  /**
   * 處理刪除確認
   */
  const handleDeleteConfirm = async () => {
    if (!deletingCredential) return;

    setIsDeleteLoading(true);

    try {
      await deleteCredential(deletingCredential.id);

      // 從列表中移除
      setCredentials((prev) => prev.filter((c) => c.id !== deletingCredential.id));

      toast.success('[Pip-Boy 成功] Passkey 已刪除！');
      setIsDeleteDialogOpen(false);
      setDeletingCredential(null);
    } catch (err: any) {
      console.error('[CredentialManagementPage] Delete credential error:', err);
      toast.error(err.message || '[Pip-Boy 錯誤] 無法刪除 Passkey。請重試。');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  /**
   * 處理新增成功
   */
  const handleAddSuccess = () => {
    loadCredentials();
  };

  /**
   * 載入狀態
   */
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <PixelIcon name="loader" sizePreset="xl" animation="spin" variant="primary" decorative />
        <p className="text-text-muted">載入中，正在讀取避難所生物辨識資料庫...</p>
      </div>
    );
  }

  /**
   * 錯誤狀態
   */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <PixelIcon name="alert-triangle" sizePreset="xl" variant="error" decorative />
        <p className="text-error text-center">{error}</p>
        <Button onClick={loadCredentials} variant="default">
          <PixelIcon name="refresh-cw" sizePreset="xs" decorative />
          <span className="ml-2">重試</span>
        </Button>
      </div>
    );
  }

  const isMaxReached = credentials.length >= 10;

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="border-b border-pip-boy-green/30 pb-4">
        <h1 className="text-3xl font-bold text-pip-boy-green">
          [Pip-Boy] Passkey 管理
        </h1>
        <p className="text-text-muted mt-2">
          管理你的避難所生物辨識裝置（Passkeys）。最多可設定 10 個裝置。
        </p>
      </div>

      {/* 新增 Passkey 按鈕 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            已註冊的 Passkeys ({credentials.length}/10)
          </h2>
          {isMaxReached && (
            <p className="text-xs text-warning mt-1">
              [Pip-Boy 警告] 已達到 Passkey 數量上限（10 個），請先刪除不使用的 Passkey
            </p>
          )}
        </div>

        <AddPasskeyButton
          credentialCount={credentials.length}
          onSuccess={handleAddSuccess}
          showUnsupportedMessage
        />
      </div>

      {/* Credentials 列表 */}
      {credentials.length === 0 ? (
        // 空狀態
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4 border-2 border-dashed border-pip-boy-green/30 rounded-lg bg-background-card/50 p-8">
          <PixelIcon name="fingerprint" sizePreset="xxl" variant="muted" decorative />
          <p className="text-text-muted text-center text-lg">
            [Pip-Boy 提示] 尚未設定 Passkey
          </p>
          <p className="text-text-muted text-center text-sm">
            點擊上方「新增 Passkey」按鈕以註冊你的第一個生物辨識裝置
          </p>
        </div>
      ) : (
        // Credentials 卡片列表
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {credentials.map((credential) => (
            <CredentialCard
              key={credential.id}
              credential={credential}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* 編輯名稱對話框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="border-pip-boy-green border-2 bg-background-elevated">
          <DialogHeader>
            <DialogTitle className="text-pip-boy-green flex items-center">
              <PixelIcon name="edit" sizePreset="sm" variant="primary" decorative />
              <span className="ml-2">[Pip-Boy] 編輯 Passkey 名稱</span>
            </DialogTitle>
            <DialogDescription>
              為你的 Passkey 設定一個容易識別的名稱，例如「MacBook Touch ID」或「iPhone Face ID」。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">名稱</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="例如：MacBook Touch ID"
                className="mt-2"
                maxLength={50}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isEditLoading}
            >
              取消
            </Button>
            <Button
              variant="default"
              onClick={handleEditSubmit}
              disabled={isEditLoading || !editName.trim()}
            >
              {isEditLoading ? (
                <>
                  <PixelIcon name="loader" sizePreset="xs" animation="spin" decorative />
                  <span className="ml-2">儲存中...</span>
                </>
              ) : (
                <>
                  <PixelIcon name="check" sizePreset="xs" decorative />
                  <span className="ml-2">儲存</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="border-error border-2 bg-background-elevated">
          <DialogHeader>
            <DialogTitle className="text-error flex items-center">
              <PixelIcon name="alert-triangle" sizePreset="sm" variant="error" decorative />
              <span className="ml-2">[Pip-Boy 警告] 確定要刪除此 Passkey？</span>
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>你即將刪除 Passkey：</p>
              <p className="font-semibold text-text-primary">
                {deletingCredential?.name}
              </p>

              {credentials.length === 1 && (
                <div className="mt-4 p-3 bg-warning/10 border border-warning rounded-lg">
                  <p className="text-warning font-semibold">
                    ⚠️ 這是你最後一個 Passkey！
                  </p>
                  <p className="text-warning text-sm mt-1">
                    刪除後將無法使用 Passkey 登入。建議先設定密碼或新增其他 Passkey。
                  </p>
                </div>
              )}

              <p className="text-text-muted text-sm mt-2">
                刪除後無法復原，你將需要重新註冊此裝置。
              </p>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleteLoading}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleteLoading}
            >
              {isDeleteLoading ? (
                <>
                  <PixelIcon name="loader" sizePreset="xs" animation="spin" decorative />
                  <span className="ml-2">刪除中...</span>
                </>
              ) : (
                <>
                  <PixelIcon name="trash" sizePreset="xs" decorative />
                  <span className="ml-2">確定刪除</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
