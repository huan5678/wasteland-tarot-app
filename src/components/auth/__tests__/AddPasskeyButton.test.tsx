/**
 * AddPasskeyButton Component Tests
 * 測試已登入用戶新增 Passkey 的按鈕元件（Fallout 主題）
 *
 * Test-Driven Development (TDD) - 紅燈階段
 * 此測試會失敗，因為 AddPasskeyButton 元件尚未實作
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddPasskeyButton } from '../AddPasskeyButton';
import * as webauthnApi from '@/lib/webauthn/api';
import * as webauthnUtils from '@/lib/webauthn/utils';

// Mock Sonner toast
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

// Mock WebAuthn API
vi.mock('@/lib/webauthn/api', () => ({
  getRegistrationOptions: vi.fn(),
  verifyRegistration: vi.fn(),
  getAddCredentialOptions: vi.fn(),
  verifyAddCredential: vi.fn(),
}));

vi.mock('@/lib/webauthn/utils', () => ({
  isWebAuthnSupported: vi.fn(),
  isConditionalUISupported: vi.fn(),
}));

// Mock navigator.credentials
const mockCreate = vi.fn();
(global as any).PublicKeyCredential = {
  isConditionalMediationAvailable: vi.fn().mockResolvedValue(true),
};
(global as any).navigator.credentials = {
  create: mockCreate,
};

describe('AddPasskeyButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (webauthnUtils.isWebAuthnSupported as vi.Mock).mockReturnValue(true);
  });

  describe('按鈕渲染 (Button Rendering)', () => {
    it('應該渲染「新增 Passkey」按鈕', () => {
      render(<AddPasskeyButton />);

      const button = screen.getByRole('button', { name: /新增 passkey|add passkey/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it('應該顯示 PixelIcon 圖示', () => {
      render(<AddPasskeyButton />);

      // 檢查使用 RemixIcon 類別（PixelIcon 基於 RemixIcon）
      const icon = document.querySelector('[class*="ri-"]');
      expect(icon).toBeInTheDocument();
    });

    it('應該使用 Pip-Boy 主題樣式', () => {
      render(<AddPasskeyButton />);

      const button = screen.getByRole('button', { name: /新增 passkey|add passkey/i });
      expect(button).toHaveClass(/btn-pip-boy|btn-.*green/i);
    });
  });

  describe('Credential 數量上限檢查', () => {
    it('應該在達到 10 個上限時禁用按鈕', () => {
      render(<AddPasskeyButton credentialCount={10} />);

      const button = screen.getByRole('button', { name: /新增 passkey|add passkey/i });
      expect(button).toBeDisabled();
    });

    it('應該在達到上限時顯示提示訊息', () => {
      render(<AddPasskeyButton credentialCount={10} />);

      // 檢查提示訊息
      expect(screen.getByText(/已達.*上限|maximum.*reached|10.*passkey/i)).toBeInTheDocument();
    });

    it('應該在未達上限時啟用按鈕', () => {
      render(<AddPasskeyButton credentialCount={5} />);

      const button = screen.getByRole('button', { name: /新增 passkey|add passkey/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe('新增 Passkey 流程', () => {
    const mockExistingCredentials = [
      { id: 'cred-1', type: 'public-key' },
      { id: 'cred-2', type: 'public-key' },
    ];

    const mockRegistrationOptions = {
      challenge: 'mock-challenge',
      rp: { name: 'Wasteland Tarot', id: 'localhost' },
      user: {
        id: 'mock-user-id',
        name: 'test@example.com',
        displayName: '廢土旅者',
      },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      excludeCredentials: mockExistingCredentials,
      timeout: 60000,
      attestation: 'none',
    };

    const mockCredential = {
      id: 'new-credential-id',
      rawId: new ArrayBuffer(32),
      response: {
        clientDataJSON: new ArrayBuffer(128),
        attestationObject: new ArrayBuffer(256),
      },
      type: 'public-key',
    };

    it('應該成功執行新增 Passkey 流程', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = vi.fn();

      // Mock API 回應
      (webauthnApi.getAddCredentialOptions as vi.Mock).mockResolvedValue(mockRegistrationOptions);
      (webauthnApi.verifyAddCredential as vi.Mock).mockResolvedValue({
        success: true,
        credential: {
          id: 'new-credential-id',
          name: 'MacBook Touch ID',
          createdAt: '2025-10-27T12:00:00Z',
        },
      });

      mockCreate.mockResolvedValue(mockCredential);

      render(<AddPasskeyButton onSuccess={mockOnSuccess} />);

      const button = screen.getByRole('button', { name: /新增 passkey|add passkey/i });
      await user.click(button);

      // 檢查 API 呼叫
      await waitFor(() => {
        expect(webauthnApi.getAddCredentialOptions).toHaveBeenCalled();
      });

      // 檢查 WebAuthn API 呼叫
      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalled();
      });

      // 檢查驗證 API 呼叫
      await waitFor(() => {
        expect(webauthnApi.verifyAddCredential).toHaveBeenCalled();
      });

      // 檢查成功訊息
      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringMatching(/新增成功|added successfully/i));
      });

      // 檢查成功回調
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('應該在流程中包含 excludeCredentials 防止重複註冊', async () => {
      const user = userEvent.setup();

      (webauthnApi.getAddCredentialOptions as vi.Mock).mockResolvedValue(mockRegistrationOptions);
      mockCreate.mockResolvedValue(mockCredential);
      (webauthnApi.verifyAddCredential as vi.Mock).mockResolvedValue({ success: true });

      render(<AddPasskeyButton />);

      const button = screen.getByRole('button', { name: /新增 passkey|add passkey/i });
      await user.click(button);

      // 檢查 API 回應包含 excludeCredentials
      await waitFor(() => {
        const createCall = mockCreate.mock.calls[0][0];
        expect(createCall.excludeCredentials).toEqual(mockExistingCredentials);
      });
    });

    it('應該在新增進行中顯示載入狀態', async () => {
      const user = userEvent.setup();

      // Mock 延遲回應
      (webauthnApi.getAddCredentialOptions as vi.Mock).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(mockRegistrationOptions), 1000))
      );

      render(<AddPasskeyButton />);

      const button = screen.getByRole('button', { name: /新增 passkey|add passkey/i });
      await user.click(button);

      // 檢查載入狀態
      expect(button).toBeDisabled();
      expect(screen.getByText(/載入中|loading|處理中|processing/i)).toBeInTheDocument();
    });

    it('應該在達到上限時返回錯誤', async () => {
      const user = userEvent.setup();

      // Mock 上限錯誤
      (webauthnApi.getAddCredentialOptions as vi.Mock).mockRejectedValue(
        new Error('[Pip-Boy 錯誤] 已達到 Passkey 數量上限（10 個），請先刪除不使用的 Passkey')
      );

      render(<AddPasskeyButton />);

      const button = screen.getByRole('button', { name: /新增 passkey|add passkey/i });
      await user.click(button);

      // 檢查錯誤訊息
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(expect.stringMatching(/上限|maximum|10/i));
      });
    });

    it('應該在用戶取消驗證時顯示取消訊息', async () => {
      const user = userEvent.setup();

      (webauthnApi.getAddCredentialOptions as vi.Mock).mockResolvedValue(mockRegistrationOptions);

      // Mock 用戶取消
      const notAllowedError = new Error('User cancelled');
      (notAllowedError as any).name = 'NotAllowedError';
      mockCreate.mockRejectedValue(notAllowedError);

      render(<AddPasskeyButton />);

      const button = screen.getByRole('button', { name: /新增 passkey|add passkey/i });
      await user.click(button);

      // 檢查取消訊息
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(expect.stringMatching(/取消|cancelled/i));
      });
    });

    it('應該在驗證失敗時顯示錯誤訊息', async () => {
      const user = userEvent.setup();

      (webauthnApi.getAddCredentialOptions as vi.Mock).mockResolvedValue(mockRegistrationOptions);
      mockCreate.mockResolvedValue(mockCredential);

      // Mock 驗證失敗
      (webauthnApi.verifyAddCredential as vi.Mock).mockRejectedValue(
        new Error('[Pip-Boy 錯誤] 生物辨識驗證失敗')
      );

      render(<AddPasskeyButton />);

      const button = screen.getByRole('button', { name: /新增 passkey|add passkey/i });
      await user.click(button);

      // 檢查錯誤訊息
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(expect.stringMatching(/失敗|failed/i));
      });
    });
  });

  describe('不支援 WebAuthn 時的行為', () => {
    it('應該在不支援 WebAuthn 時隱藏按鈕', () => {
      (webauthnUtils.isWebAuthnSupported as vi.Mock).mockReturnValue(false);

      render(<AddPasskeyButton />);

      const button = screen.queryByRole('button', { name: /新增 passkey|add passkey/i });
      expect(button).not.toBeInTheDocument();
    });

    it('應該顯示不支援的提示訊息', () => {
      (webauthnUtils.isWebAuthnSupported as vi.Mock).mockReturnValue(false);

      render(<AddPasskeyButton showUnsupportedMessage />);

      expect(screen.getByText(/不支援|not supported|瀏覽器.*passkey/i)).toBeInTheDocument();
    });
  });

  describe('Props 配置', () => {
    it('應該支援自訂按鈕文字', () => {
      render(<AddPasskeyButton buttonText="註冊新的生物辨識裝置" />);

      const button = screen.getByRole('button', { name: /註冊新的生物辨識裝置/i });
      expect(button).toBeInTheDocument();
    });

    it('應該支援 disabled prop', () => {
      render(<AddPasskeyButton disabled />);

      const button = screen.getByRole('button', { name: /新增 passkey|add passkey/i });
      expect(button).toBeDisabled();
    });

    it('應該支援自訂 className', () => {
      render(<AddPasskeyButton className="custom-class" />);

      const button = screen.getByRole('button', { name: /新增 passkey|add passkey/i });
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Error Callback', () => {
    it('應該在錯誤時呼叫 onError 回調', async () => {
      const user = userEvent.setup();
      const mockOnError = vi.fn();

      (webauthnApi.getAddCredentialOptions as vi.Mock).mockRejectedValue(
        new Error('API Error')
      );

      render(<AddPasskeyButton onError={mockOnError} />);

      const button = screen.getByRole('button', { name: /新增 passkey|add passkey/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });
});
