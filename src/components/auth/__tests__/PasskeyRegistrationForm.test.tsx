/**
 * PasskeyRegistrationForm Component Tests
 * 測試使用 Passkey 註冊的表單元件（Fallout 主題）
 *
 * Test-Driven Development (TDD) - 紅燈階段
 * 此測試會失敗，因為 PasskeyRegistrationForm 元件尚未實作
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasskeyRegistrationForm } from '../PasskeyRegistrationForm';
import * as webauthnApi from '@/lib/webauthn/api';
import * as webauthnUtils from '@/lib/webauthn/utils';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

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

describe('PasskeyRegistrationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(webauthnUtils.isWebAuthnSupported).mockReturnValue(true);
  });

  describe('表單渲染 (Form Rendering)', () => {
    it('應該正確渲染 email 和 name 輸入欄位', () => {
      render(<PasskeyRegistrationForm />);

      // 檢查 email 欄位
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('autocomplete', 'email');

      // 檢查 name 欄位
      const nameInput = screen.getByLabelText(/名稱|name/i);
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toHaveAttribute('type', 'text');
      expect(nameInput).toHaveAttribute('autocomplete', 'name');
    });

    it('應該顯示「使用 Passkey 註冊」按鈕', () => {
      render(<PasskeyRegistrationForm />);

      const submitButton = screen.getByRole('button', { name: /使用 passkey 註冊|passkey 註冊/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
    });

    it('應該顯示 Fallout 主題標題和說明文字', () => {
      render(<PasskeyRegistrationForm />);

      // 檢查 Pip-Boy 風格標題
      expect(screen.getByText(/避難所|vault|pip-boy/i)).toBeInTheDocument();

      // 檢查說明文字
      expect(screen.getByText(/生物辨識|biometric|fingerprint|face id/i)).toBeInTheDocument();
    });
  });

  describe('表單驗證 (Form Validation)', () => {
    it('應該驗證 email 格式', async () => {
      const user = userEvent.setup();
      render(<PasskeyRegistrationForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /使用 passkey 註冊|passkey 註冊/i });

      // 輸入無效的 email
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email 格式不正確|invalid email/i)).toBeInTheDocument();
      });
    });

    it('應該驗證 name 不能為空', async () => {
      const user = userEvent.setup();
      render(<PasskeyRegistrationForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /使用 passkey 註冊|passkey 註冊/i });

      // 只輸入 email，不輸入 name
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/名稱.*必填|name.*required/i)).toBeInTheDocument();
      });
    });

    it('應該驗證 name 長度至少 2 個字元', async () => {
      const user = userEvent.setup();
      render(<PasskeyRegistrationForm />);

      const nameInput = screen.getByLabelText(/名稱|name/i);
      const submitButton = screen.getByRole('button', { name: /使用 passkey 註冊|passkey 註冊/i });

      // 輸入過短的 name
      await user.type(nameInput, 'A');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/名稱.*至少.*2|name.*at least.*2/i)).toBeInTheDocument();
      });
    });
  });

  describe('WebAuthn 註冊流程 (Registration Flow)', () => {
    const mockRegistrationOptions = {
      challenge: 'mock-challenge',
      rp: { name: 'Wasteland Tarot', id: 'localhost' },
      user: {
        id: 'mock-user-id',
        name: 'test@example.com',
        displayName: '廢土旅者',
      },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      timeout: 60000,
      attestation: 'none',
    };

    const mockCredential = {
      id: 'mock-credential-id',
      rawId: new ArrayBuffer(32),
      response: {
        clientDataJSON: new ArrayBuffer(128),
        attestationObject: new ArrayBuffer(256),
      },
      type: 'public-key',
    };

    it('應該成功執行完整的註冊流程', async () => {
      const user = userEvent.setup();

      // Mock API 回應
      vi.mocked(webauthnApi.getRegistrationOptions).mockResolvedValue(mockRegistrationOptions);
      vi.mocked(webauthnApi.verifyRegistration).mockResolvedValue({
        success: true,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: '廢土旅者',
        },
      });

      // Mock navigator.credentials.create
      mockCreate.mockResolvedValue(mockCredential);

      render(<PasskeyRegistrationForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/名稱|name/i);
      const submitButton = screen.getByRole('button', { name: /使用 passkey 註冊|passkey 註冊/i });

      // 填寫表單
      await user.type(emailInput, 'test@example.com');
      await user.type(nameInput, '廢土旅者');
      await user.click(submitButton);

      // 檢查 API 呼叫
      await waitFor(() => {
        expect(webauthnApi.getRegistrationOptions).toHaveBeenCalledWith('test@example.com', '廢土旅者');
      });

      // 檢查 WebAuthn API 呼叫
      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalled();
      });

      // 檢查驗證 API 呼叫
      await waitFor(() => {
        expect(webauthnApi.verifyRegistration).toHaveBeenCalled();
      });

      // 檢查成功訊息
      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringMatching(/註冊成功|registration successful/i));
      });

      // 檢查導向 dashboard
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('應該在註冊進行中顯示載入指示器', async () => {
      const user = userEvent.setup();

      // Mock 延遲回應
      (webauthnApi.getRegistrationOptions as vi.Mock).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(mockRegistrationOptions), 1000))
      );

      render(<PasskeyRegistrationForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/名稱|name/i);
      const submitButton = screen.getByRole('button', { name: /使用 passkey 註冊|passkey 註冊/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(nameInput, '廢土旅者');
      await user.click(submitButton);

      // 檢查載入狀態
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/載入中|loading|處理中|processing/i)).toBeInTheDocument();
    });

    it('應該在 email 已註冊時顯示錯誤訊息', async () => {
      const user = userEvent.setup();

      // Mock API 錯誤
      (webauthnApi.getRegistrationOptions as vi.Mock).mockRejectedValue(
        new Error('[Pip-Boy 錯誤] 此 email 已在避難所註冊，請使用生物辨識登入存取你的 Pip-Boy')
      );

      render(<PasskeyRegistrationForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/名稱|name/i);
      const submitButton = screen.getByRole('button', { name: /使用 passkey 註冊|passkey 註冊/i });

      await user.type(emailInput, 'existing@example.com');
      await user.type(nameInput, '廢土旅者');
      await user.click(submitButton);

      // 檢查錯誤訊息
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(expect.stringMatching(/email.*已註冊|email.*already/i));
      });
    });

    it('應該在用戶取消驗證時顯示取消訊息', async () => {
      const user = userEvent.setup();

      (webauthnApi.getRegistrationOptions as vi.Mock).mockResolvedValue(mockRegistrationOptions);

      // Mock 用戶取消
      const notAllowedError = new Error('User cancelled');
      (notAllowedError as any).name = 'NotAllowedError';
      mockCreate.mockRejectedValue(notAllowedError);

      render(<PasskeyRegistrationForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/名稱|name/i);
      const submitButton = screen.getByRole('button', { name: /使用 passkey 註冊|passkey 註冊/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(nameInput, '廢土旅者');
      await user.click(submitButton);

      // 檢查取消訊息
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(expect.stringMatching(/取消|cancelled/i));
      });
    });

    it('應該在驗證失敗時顯示錯誤訊息', async () => {
      const user = userEvent.setup();

      (webauthnApi.getRegistrationOptions as vi.Mock).mockResolvedValue(mockRegistrationOptions);
      mockCreate.mockResolvedValue(mockCredential);

      // Mock 驗證失敗
      (webauthnApi.verifyRegistration as vi.Mock).mockRejectedValue(
        new Error('[Pip-Boy 錯誤] 生物辨識註冊失敗，請確認 Pip-Boy 功能正常')
      );

      render(<PasskeyRegistrationForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/名稱|name/i);
      const submitButton = screen.getByRole('button', { name: /使用 passkey 註冊|passkey 註冊/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(nameInput, '廢土旅者');
      await user.click(submitButton);

      // 檢查錯誤訊息
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(expect.stringMatching(/註冊失敗|registration failed/i));
      });
    });
  });

  describe('不支援 WebAuthn 時的降級處理', () => {
    it('應該在不支援 WebAuthn 時顯示降級訊息', () => {
      (webauthnUtils.isWebAuthnSupported as vi.Mock).mockReturnValue(false);

      render(<PasskeyRegistrationForm />);

      // 檢查降級訊息
      expect(screen.getByText(/不支援|not supported|瀏覽器.*不.*passkey/i)).toBeInTheDocument();

      // 檢查建議使用其他方式
      expect(screen.getByText(/email.*密碼|email.*password|其他.*註冊/i)).toBeInTheDocument();

      // 檢查註冊按鈕被隱藏或禁用
      const submitButton = screen.queryByRole('button', { name: /使用 passkey 註冊|passkey 註冊/i });
      expect(submitButton).toBeNull();
    });
  });

  describe('成功回調 (Success Callback)', () => {
    it('應該在註冊成功後呼叫 onSuccess 回調', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = jest.fn();

      const mockRegistrationOptions = {
        challenge: 'mock-challenge',
        rp: { name: 'Wasteland Tarot', id: 'localhost' },
        user: {
          id: 'mock-user-id',
          name: 'test@example.com',
          displayName: '廢土旅者',
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      };

      (webauthnApi.getRegistrationOptions as vi.Mock).mockResolvedValue(mockRegistrationOptions);
      mockCreate.mockResolvedValue({
        id: 'mock-credential-id',
        rawId: new ArrayBuffer(32),
        response: {
          clientDataJSON: new ArrayBuffer(128),
          attestationObject: new ArrayBuffer(256),
        },
        type: 'public-key',
      });

      const mockResponse = {
        success: true,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: '廢土旅者',
        },
      };
      (webauthnApi.verifyRegistration as vi.Mock).mockResolvedValue(mockResponse);

      render(<PasskeyRegistrationForm onSuccess={mockOnSuccess} />);

      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/名稱|name/i);
      const submitButton = screen.getByRole('button', { name: /使用 passkey 註冊|passkey 註冊/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(nameInput, '廢土旅者');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith({
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: expect.objectContaining({
            id: 'user-123',
            email: 'test@example.com',
          }),
        });
      });
    });
  });

  describe('Fallout 主題樣式', () => {
    it('應該使用 Pip-Boy 綠色主題', () => {
      render(<PasskeyRegistrationForm />);

      const submitButton = screen.getByRole('button', { name: /使用 passkey 註冊|passkey 註冊/i });

      // 檢查按鈕使用 Pip-Boy 風格類別
      expect(submitButton).toHaveClass(/btn-pip-boy|btn-.*green/i);
    });

    it('應該使用 PixelIcon 圖示而非 lucide-react', () => {
      render(<PasskeyRegistrationForm />);

      // 檢查使用 RemixIcon 類別（PixelIcon 基於 RemixIcon）
      const icon = screen.getByTestId('passkey-icon') || document.querySelector('[class*="ri-"]');
      expect(icon).toBeInTheDocument();

      // 確保沒有 lucide-react 類別
      const lucideIcon = document.querySelector('[class*="lucide"]');
      expect(lucideIcon).not.toBeInTheDocument();
    });
  });
});
