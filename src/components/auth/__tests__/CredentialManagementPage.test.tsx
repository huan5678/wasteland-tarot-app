/**
 * CredentialManagementPage 元件測試
 * 測試 Passkey 管理頁面的功能
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CredentialManagementPage } from '../CredentialManagementPage';
import type { CredentialInfo } from '@/lib/webauthn/types';

// Mock WebAuthn API
vi.mock('@/lib/webauthn/api', () => ({
  getCredentials: vi.fn(),
  updateCredentialName: vi.fn(),
  deleteCredential: vi.fn(),
}));

// Mock AddPasskeyButton 元件
vi.mock('../AddPasskeyButton', () => ({
  AddPasskeyButton: ({ onSuccess, credentialCount }: any) => (
    <button
      data-testid="add-passkey-button"
      onClick={() => onSuccess && onSuccess()}
      disabled={credentialCount >= 10}
    >
      新增 Passkey
    </button>
  ),
}));

// Mock PixelIcon
vi.mock('@/components/ui/icons', () => ({
  PixelIcon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`}>{name}</span>,
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import * as webauthnApi from '@/lib/webauthn/api';
import { toast } from 'sonner';

describe('CredentialManagementPage', () => {
  const mockCredentials: CredentialInfo[] = [
    {
      id: 'cred-1',
      name: 'MacBook Touch ID',
      createdAt: '2025-01-01T10:00:00Z',
      lastUsedAt: '2025-10-27T12:00:00Z',
      deviceType: 'platform',
      transports: ['internal'],
      falloutDeviceName: 'Pip-Boy 生物掃描器 (平台)',
    },
    {
      id: 'cred-2',
      name: 'iPhone Face ID',
      createdAt: '2025-02-01T10:00:00Z',
      lastUsedAt: '2025-10-26T08:00:00Z',
      deviceType: 'platform',
      transports: ['internal'],
      falloutDeviceName: 'Pip-Boy 生物掃描器 (平台)',
    },
    {
      id: 'cred-3',
      name: 'YubiKey 5',
      createdAt: '2025-03-01T10:00:00Z',
      lastUsedAt: undefined,
      deviceType: 'cross-platform',
      transports: ['usb', 'nfc'],
      falloutDeviceName: 'Vault-Tec 安全金鑰 (可移除)',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('頁面渲染', () => {
    it('應該正確渲染頁面標題', async () => {
      (webauthnApi.getCredentials as any).mockResolvedValue(mockCredentials);

      render(<CredentialManagementPage />);

      expect(screen.getByText(/Passkey 管理/i)).toBeInTheDocument();
    });

    it('應該顯示載入狀態', () => {
      (webauthnApi.getCredentials as any).mockImplementation(
        () => new Promise(() => {}) // 永不解析的 Promise
      );

      render(<CredentialManagementPage />);

      expect(screen.getByText(/載入中/i)).toBeInTheDocument();
    });

    it('應該在無 credentials 時顯示空狀態', async () => {
      (webauthnApi.getCredentials as any).mockResolvedValue([]);

      render(<CredentialManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/尚未設定 Passkey/i)).toBeInTheDocument();
      });
    });
  });

  describe('Credentials 列表顯示', () => {
    it('應該顯示所有 credentials', async () => {
      (getCredentials).mockResolvedValue(mockCredentials);

      render(<CredentialManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('MacBook Touch ID')).toBeInTheDocument();
        expect(screen.getByText('iPhone Face ID')).toBeInTheDocument();
        expect(screen.getByText('YubiKey 5')).toBeInTheDocument();
      });
    });

    it('應該顯示 credential 的建立日期', async () => {
      (getCredentials).mockResolvedValue([mockCredentials[0]]);

      render(<CredentialManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/2025-01-01/)).toBeInTheDocument();
      });
    });

    it('應該顯示 credential 的最後使用日期', async () => {
      (getCredentials).mockResolvedValue([mockCredentials[0]]);

      render(<CredentialManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/2025-10-27/)).toBeInTheDocument();
      });
    });

    it('應該顯示裝置類型圖示', async () => {
      (getCredentials).mockResolvedValue(mockCredentials);

      render(<CredentialManagementPage />);

      await waitFor(() => {
        // 平台裝置 (internal) 應顯示 fingerprint 圖示
        const fingerprintIcons = screen.getAllByTestId('icon-fingerprint');
        expect(fingerprintIcons.length).toBeGreaterThan(0);

        // 可移除裝置 (usb/nfc) 應顯示 usb 圖示
        expect(screen.getByTestId('icon-usb')).toBeInTheDocument();
      });
    });

    it('應該依 lastUsedAt 降序排序', async () => {
      (getCredentials).mockResolvedValue(mockCredentials);

      render(<CredentialManagementPage />);

      await waitFor(() => {
        const credentialNames = screen.getAllByRole('heading', { level: 3 });
        expect(credentialNames[0].textContent).toBe('MacBook Touch ID'); // 最近使用
        expect(credentialNames[1].textContent).toBe('iPhone Face ID');
        expect(credentialNames[2].textContent).toBe('YubiKey 5'); // 從未使用
      });
    });
  });

  describe('新增 Passkey 功能', () => {
    it('應該顯示「新增 Passkey」按鈕', async () => {
      (getCredentials).mockResolvedValue(mockCredentials);

      render(<CredentialManagementPage />);

      await waitFor(() => {
        expect(screen.getByTestId('add-passkey-button')).toBeInTheDocument();
      });
    });

    it('應該在達到 10 個上限時禁用新增按鈕', async () => {
      const maxCredentials = Array.from({ length: 10 }, (_, i) => ({
        ...mockCredentials[0],
        id: `cred-${i}`,
        name: `Credential ${i}`,
      }));

      (getCredentials).mockResolvedValue(maxCredentials);

      render(<CredentialManagementPage />);

      await waitFor(() => {
        const button = screen.getByTestId('add-passkey-button');
        expect(button).toBeDisabled();
      });
    });

    it('應該在新增成功後重新載入 credentials', async () => {
      (getCredentials).mockResolvedValue(mockCredentials);

      render(<CredentialManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('MacBook Touch ID')).toBeInTheDocument();
      });

      // 模擬新增成功
      const newCredential = {
        ...mockCredentials[0],
        id: 'cred-new',
        name: 'New Passkey',
      };
      (getCredentials).mockResolvedValue([
        ...mockCredentials,
        newCredential,
      ]);

      const addButton = screen.getByTestId('add-passkey-button');
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('New Passkey')).toBeInTheDocument();
      });
    });

    it('應該顯示上限警告訊息', async () => {
      const maxCredentials = Array.from({ length: 10 }, (_, i) => ({
        ...mockCredentials[0],
        id: `cred-${i}`,
        name: `Credential ${i}`,
      }));

      (getCredentials).mockResolvedValue(maxCredentials);

      render(<CredentialManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/已達到 Passkey 數量上限/i)).toBeInTheDocument();
      });
    });
  });

  describe('編輯 Passkey 名稱', () => {
    it('應該顯示編輯按鈕', async () => {
      (getCredentials).mockResolvedValue([mockCredentials[0]]);

      render(<CredentialManagementPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /編輯/i })).toBeInTheDocument();
      });
    });

    it('應該在點擊編輯按鈕時顯示編輯對話框', async () => {
      (getCredentials).mockResolvedValue([mockCredentials[0]]);

      render(<CredentialManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('MacBook Touch ID')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /編輯/i });
      await userEvent.click(editButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/名稱/i)).toBeInTheDocument();
    });

    it('應該成功更新 credential 名稱', async () => {
      (getCredentials).mockResolvedValue([mockCredentials[0]]);
      (updateCredentialName).mockResolvedValue({
        ...mockCredentials[0],
        name: 'Updated Name',
      });

      render(<CredentialManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('MacBook Touch ID')).toBeInTheDocument();
      });

      // 點擊編輯按鈕
      const editButton = screen.getByRole('button', { name: /編輯/i });
      await userEvent.click(editButton);

      // 輸入新名稱
      const input = screen.getByLabelText(/名稱/i);
      await userEvent.clear(input);
      await userEvent.type(input, 'Updated Name');

      // 提交
      const saveButton = screen.getByRole('button', { name: /儲存/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(webauthnApi.updateCredentialName).toHaveBeenCalledWith('cred-1', 'Updated Name');
        expect(toast.success).toHaveBeenCalled();
      });
    });

    it('應該處理更新失敗錯誤', async () => {
      (getCredentials).mockResolvedValue([mockCredentials[0]]);
      (updateCredentialName).mockRejectedValue(
        new Error('[Pip-Boy 錯誤] 無法更新 Passkey 名稱')
      );

      render(<CredentialManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('MacBook Touch ID')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /編輯/i });
      await userEvent.click(editButton);

      const input = screen.getByLabelText(/名稱/i);
      await userEvent.clear(input);
      await userEvent.type(input, 'Updated Name');

      const saveButton = screen.getByRole('button', { name: /儲存/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe('刪除 Passkey', () => {
    it('應該顯示刪除按鈕', async () => {
      (getCredentials).mockResolvedValue([mockCredentials[0]]);

      render(<CredentialManagementPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /刪除/i })).toBeInTheDocument();
      });
    });

    it('應該在點擊刪除按鈕時顯示確認對話框', async () => {
      (getCredentials).mockResolvedValue(mockCredentials);

      render(<CredentialManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('MacBook Touch ID')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /刪除/i });
      await userEvent.click(deleteButtons[0]);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/確定要刪除此 Passkey/i)).toBeInTheDocument();
    });

    it('應該在刪除最後一個 credential 時顯示額外警告', async () => {
      (getCredentials).mockResolvedValue([mockCredentials[0]]);

      render(<CredentialManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('MacBook Touch ID')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /刪除/i });
      await userEvent.click(deleteButton);

      expect(screen.getByText(/這是你最後一個 Passkey/i)).toBeInTheDocument();
      expect(screen.getByText(/刪除後將無法使用 Passkey 登入/i)).toBeInTheDocument();
    });

    it('應該成功刪除 credential', async () => {
      (getCredentials).mockResolvedValue(mockCredentials);
      (deleteCredential).mockResolvedValue(undefined);

      render(<CredentialManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('MacBook Touch ID')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /刪除/i });
      await userEvent.click(deleteButtons[0]);

      const confirmButton = screen.getByRole('button', { name: /確定刪除/i });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(webauthnApi.deleteCredential).toHaveBeenCalledWith('cred-1');
        expect(toast.success).toHaveBeenCalled();
      });
    });

    it('應該處理刪除失敗錯誤', async () => {
      (getCredentials).mockResolvedValue(mockCredentials);
      (deleteCredential).mockRejectedValue(
        new Error('[Pip-Boy 錯誤] 無法刪除 Passkey')
      );

      render(<CredentialManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('MacBook Touch ID')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /刪除/i });
      await userEvent.click(deleteButtons[0]);

      const confirmButton = screen.getByRole('button', { name: /確定刪除/i });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('應該在取消時關閉刪除對話框', async () => {
      (getCredentials).mockResolvedValue(mockCredentials);

      render(<CredentialManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('MacBook Touch ID')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /刪除/i });
      await userEvent.click(deleteButtons[0]);

      const cancelButton = screen.getByRole('button', { name: /取消/i });
      await userEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('錯誤處理', () => {
    it('應該處理 API 載入錯誤', async () => {
      (getCredentials).mockRejectedValue(
        new Error('[Pip-Boy 錯誤] 無法讀取避難所生物辨識資料庫')
      );

      render(<CredentialManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/無法載入 Passkey 列表/i)).toBeInTheDocument();
      });
    });

    it('應該顯示重試按鈕', async () => {
      (getCredentials).mockRejectedValue(
        new Error('[Pip-Boy 錯誤] 網路錯誤')
      );

      render(<CredentialManagementPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /重試/i })).toBeInTheDocument();
      });
    });

    it('應該在點擊重試按鈕後重新載入', async () => {
      (getCredentials)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockCredentials);

      render(<CredentialManagementPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /重試/i })).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /重試/i });
      await userEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('MacBook Touch ID')).toBeInTheDocument();
      });
    });
  });
});
