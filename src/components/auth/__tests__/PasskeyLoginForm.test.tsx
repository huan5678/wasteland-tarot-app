/**
 * PasskeyLoginForm Component Tests
 * 測試使用 Passkey 登入的表單元件（Fallout 主題）
 *
 * Test-Driven Development (TDD) - 紅燈階段
 * 此測試會失敗，因為 PasskeyLoginForm 元件尚未實作
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasskeyLoginForm } from '../PasskeyLoginForm';
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

// Mock AuthStore
const mockSetUser = vi.fn();
const mockSetToken = vi.fn();
vi.mock('@/lib/authStore', () => ({
  useAuthStore: () => ({
    setUser: mockSetUser,
    setToken: mockSetToken,
  }),
}));

// Mock WebAuthn API
vi.mock('@/lib/webauthn/api', () => ({
  getAuthenticationOptions: vi.fn(),
  verifyAuthentication: vi.fn(),
}));

vi.mock('@/lib/webauthn/utils', () => ({
  isWebAuthnSupported: vi.fn(),
  isConditionalUISupported: vi.fn(),
}));

// Mock navigator.credentials
const mockGet = vi.fn();
(global as any).PublicKeyCredential = {
  isConditionalMediationAvailable: vi.fn().mockResolvedValue(true),
};
(global as any).navigator.credentials = {
  get: mockGet,
};

describe('PasskeyLoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (webauthnUtils.isWebAuthnSupported as vi.Mock).mockReturnValue(true);
    (webauthnUtils.isConditionalUISupported as vi.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('表單渲染 (Form Rendering)', () => {
    it('應該正確渲染表單基本元素', () => {
      render(<PasskeyLoginForm />);

      // 檢查表單標題
      expect(screen.getByRole('heading', { name: /passkey 登入|生物辨識登入/i })).toBeInTheDocument();
    });

    it('應該顯示 Email-guided 登入的 email 輸入欄位', () => {
      render(<PasskeyLoginForm showEmailField />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('autocomplete', 'email webauthn');
    });

    it('應該顯示「使用 Passkey 登入」按鈕', () => {
      render(<PasskeyLoginForm />);

      const loginButton = screen.getByRole('button', { name: /使用 passkey 登入|passkey 登入/i });
      expect(loginButton).toBeInTheDocument();
      expect(loginButton).not.toBeDisabled();
    });

    it('應該顯示 Fallout 主題說明文字', () => {
      render(<PasskeyLoginForm />);

      // 檢查 Pip-Boy 風格說明
      expect(screen.getByText(/生物辨識|vault-tec|pip-boy/i)).toBeInTheDocument();
    });
  });

  describe('Email-guided 登入流程 (Email-guided Login Flow)', () => {
    const mockAuthenticationOptions = {
      challenge: 'test-challenge',
      rpId: 'localhost',
      allowCredentials: [
        {
          id: 'credential-id',
          type: 'public-key' as const,
          transports: ['internal' as const],
        },
      ],
      timeout: 60000,
      userVerification: 'preferred' as const,
    };

    const mockCredential = {
      id: 'credential-id',
      rawId: new ArrayBuffer(8),
      type: 'public-key' as const,
      response: {
        clientDataJSON: new ArrayBuffer(8),
        authenticatorData: new ArrayBuffer(8),
        signature: new ArrayBuffer(8),
        userHandle: new ArrayBuffer(8),
      },
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    };

    const mockToken = 'test-jwt-token';

    it('應該在輸入 email 後使用 email-guided 登入', async () => {
      const user = userEvent.setup();
      (webauthnApi.getAuthenticationOptions as vi.Mock).mockResolvedValue({
        options: mockAuthenticationOptions,
      });
      mockGet.mockResolvedValue(mockCredential);
      (webauthnApi.verifyAuthentication as vi.Mock).mockResolvedValue({
        user: mockUser,
        access_token: mockToken,
      });

      render(<PasskeyLoginForm showEmailField />);

      const emailInput = screen.getByLabelText(/email/i);
      const loginButton = screen.getByRole('button', { name: /使用 passkey 登入|passkey 登入/i });

      // 輸入 email
      await user.type(emailInput, 'test@example.com');
      await user.click(loginButton);

      // 驗證 API 呼叫
      await waitFor(() => {
        expect(webauthnApi.getAuthenticationOptions).toHaveBeenCalledWith('test@example.com');
      });

      // 驗證瀏覽器 API 呼叫（不使用 conditional mediation）
      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith(expect.objectContaining({
          publicKey: expect.any(Object),
        }));
      });

      // 驗證後端驗證 API 呼叫
      await waitFor(() => {
        expect(webauthnApi.verifyAuthentication).toHaveBeenCalled();
      });

      // 驗證成功後的行為
      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalledWith(mockUser);
        expect(mockSetToken).toHaveBeenCalledWith(mockToken);
        expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringMatching(/登入成功/i));
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('應該在 email 格式錯誤時顯示驗證錯誤', async () => {
      const user = userEvent.setup();
      render(<PasskeyLoginForm showEmailField />);

      const emailInput = screen.getByLabelText(/email/i);
      const loginButton = screen.getByRole('button', { name: /使用 passkey 登入|passkey 登入/i });

      // 輸入無效的 email
      await user.type(emailInput, 'invalid-email');
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/email 格式不正確|invalid email/i)).toBeInTheDocument();
      });

      // API 不應該被呼叫
      expect(webauthnApi.getAuthenticationOptions).not.toHaveBeenCalled();
    });
  });

  describe('Usernameless 登入流程 (Usernameless Login Flow)', () => {
    const mockAuthenticationOptions = {
      challenge: 'test-challenge',
      rpId: 'localhost',
      allowCredentials: [], // Usernameless = 空的 allowCredentials
      timeout: 60000,
      userVerification: 'preferred' as const,
    };

    const mockCredential = {
      id: 'credential-id',
      rawId: new ArrayBuffer(8),
      type: 'public-key' as const,
      response: {
        clientDataJSON: new ArrayBuffer(8),
        authenticatorData: new ArrayBuffer(8),
        signature: new ArrayBuffer(8),
        userHandle: new ArrayBuffer(8),
      },
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    };

    const mockToken = 'test-jwt-token';

    it('應該在不輸入 email 的情況下使用 usernameless 登入', async () => {
      const user = userEvent.setup();
      (webauthnApi.getAuthenticationOptions as vi.Mock).mockResolvedValue({
        options: mockAuthenticationOptions,
      });
      mockGet.mockResolvedValue(mockCredential);
      (webauthnApi.verifyAuthentication as vi.Mock).mockResolvedValue({
        user: mockUser,
        access_token: mockToken,
      });

      render(<PasskeyLoginForm />);

      const loginButton = screen.getByRole('button', { name: /使用 passkey 登入|passkey 登入/i });

      // 不輸入 email，直接點擊登入
      await user.click(loginButton);

      // 驗證 API 呼叫（無 email）
      await waitFor(() => {
        expect(webauthnApi.getAuthenticationOptions).toHaveBeenCalledWith(undefined);
      });

      // 驗證成功後的行為
      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalledWith(mockUser);
        expect(mockSetToken).toHaveBeenCalledWith(mockToken);
        expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringMatching(/登入成功/i));
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Conditional UI 支援 (Conditional UI Support)', () => {
    it('應該在支援 Conditional UI 時啟用 email 輸入框 autofill', async () => {
      (webauthnUtils.isConditionalUISupported as vi.Mock).mockResolvedValue(true);

      render(<PasskeyLoginForm showEmailField />);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email/i);
        expect(emailInput).toHaveAttribute('autocomplete', 'email webauthn');
      });
    });

    it('應該在頁面載入時初始化 Conditional UI', async () => {
      (webauthnUtils.isConditionalUISupported as vi.Mock).mockResolvedValue(true);
      (webauthnApi.getAuthenticationOptions as vi.Mock).mockResolvedValue({
        options: {
          challenge: 'test-challenge',
          rpId: 'localhost',
          allowCredentials: [],
          timeout: 60000,
          userVerification: 'preferred' as const,
        },
      });
      mockGet.mockImplementation(() => new Promise(() => {})); // 永遠不 resolve（模擬等待用戶選擇）

      render(<PasskeyLoginForm showEmailField enableConditionalUI />);

      // 驗證 Conditional UI 初始化
      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith(expect.objectContaining({
          mediation: 'conditional',
        }));
      });
    });

    it('應該在不支援 Conditional UI 時降級為標準按鈕', async () => {
      (webauthnUtils.isConditionalUISupported as vi.Mock).mockResolvedValue(false);

      render(<PasskeyLoginForm showEmailField enableConditionalUI />);

      await waitFor(() => {
        // 應該顯示標準登入按鈕
        const loginButton = screen.getByRole('button', { name: /使用 passkey 登入|passkey 登入/i });
        expect(loginButton).toBeInTheDocument();
      });

      // Conditional UI 不應該初始化
      expect(mockGet).not.toHaveBeenCalledWith(expect.objectContaining({
        mediation: 'conditional',
      }));
    });
  });

  describe('錯誤處理 (Error Handling)', () => {
    it('應該在取得驗證選項失敗時顯示錯誤訊息', async () => {
      const user = userEvent.setup();
      (webauthnApi.getAuthenticationOptions as vi.Mock).mockRejectedValue(
        new Error('無法取得驗證選項')
      );

      render(<PasskeyLoginForm />);

      const loginButton = screen.getByRole('button', { name: /使用 passkey 登入|passkey 登入/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(expect.stringMatching(/無法取得驗證選項|錯誤/i));
      });
    });

    it('應該在使用者取消驗證時顯示提示', async () => {
      const user = userEvent.setup();
      (webauthnApi.getAuthenticationOptions as vi.Mock).mockResolvedValue({
        options: {
          challenge: 'test-challenge',
          rpId: 'localhost',
          allowCredentials: [],
          timeout: 60000,
          userVerification: 'preferred' as const,
        },
      });
      mockGet.mockRejectedValue(new DOMException('User cancelled', 'NotAllowedError'));

      render(<PasskeyLoginForm />);

      const loginButton = screen.getByRole('button', { name: /使用 passkey 登入|passkey 登入/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(expect.stringMatching(/取消|cancelled/i));
      });
    });

    it('應該在驗證失敗時顯示 Fallout 風格錯誤訊息', async () => {
      const user = userEvent.setup();
      (webauthnApi.getAuthenticationOptions as vi.Mock).mockResolvedValue({
        options: {
          challenge: 'test-challenge',
          rpId: 'localhost',
          allowCredentials: [],
          timeout: 60000,
          userVerification: 'preferred' as const,
        },
      });
      mockGet.mockResolvedValue({
        id: 'credential-id',
        rawId: new ArrayBuffer(8),
        type: 'public-key' as const,
        response: {
          clientDataJSON: new ArrayBuffer(8),
          authenticatorData: new ArrayBuffer(8),
          signature: new ArrayBuffer(8),
          userHandle: new ArrayBuffer(8),
        },
      });
      (webauthnApi.verifyAuthentication as vi.Mock).mockRejectedValue(
        new Error('生物辨識驗證失敗，請確認 Pip-Boy 功能正常')
      );

      render(<PasskeyLoginForm />);

      const loginButton = screen.getByRole('button', { name: /使用 passkey 登入|passkey 登入/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          expect.stringMatching(/生物辨識|pip-boy/i)
        );
      });
    });

    it('應該在逾時時顯示錯誤訊息', async () => {
      const user = userEvent.setup();
      (webauthnApi.getAuthenticationOptions as vi.Mock).mockResolvedValue({
        options: {
          challenge: 'test-challenge',
          rpId: 'localhost',
          allowCredentials: [],
          timeout: 60000,
          userVerification: 'preferred' as const,
        },
      });
      mockGet.mockRejectedValue(new DOMException('Timeout', 'NotAllowedError'));

      render(<PasskeyLoginForm />);

      const loginButton = screen.getByRole('button', { name: /使用 passkey 登入|passkey 登入/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(expect.stringMatching(/逾時|timeout/i));
      });
    });
  });

  describe('載入狀態 (Loading State)', () => {
    it('應該在驗證進行中顯示載入指示器', async () => {
      const user = userEvent.setup();
      (webauthnApi.getAuthenticationOptions as vi.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(<PasskeyLoginForm />);

      const loginButton = screen.getByRole('button', { name: /使用 passkey 登入|passkey 登入/i });
      await user.click(loginButton);

      // 檢查載入狀態
      await waitFor(() => {
        expect(screen.getByText(/驗證中|loading/i)).toBeInTheDocument();
      });

      // 按鈕應該被禁用
      expect(loginButton).toBeDisabled();
    });

    it('應該在驗證進行中顯示 Fallout 風格載入動畫', async () => {
      const user = userEvent.setup();
      (webauthnApi.getAuthenticationOptions as vi.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(<PasskeyLoginForm />);

      const loginButton = screen.getByRole('button', { name: /使用 passkey 登入|passkey 登入/i });
      await user.click(loginButton);

      // 檢查 Pip-Boy 載入動畫
      await waitFor(() => {
        const spinner = screen.getByTestId('pip-boy-loading-spinner');
        expect(spinner).toBeInTheDocument();
      });
    });
  });

  describe('瀏覽器相容性 (Browser Compatibility)', () => {
    it('應該在不支援 WebAuthn 時顯示降級 UI', () => {
      (webauthnUtils.isWebAuthnSupported as vi.Mock).mockReturnValue(false);

      render(<PasskeyLoginForm />);

      // 應該顯示降級訊息
      expect(screen.getByText(/瀏覽器不支援|不支援 passkey/i)).toBeInTheDocument();

      // 登入按鈕應該被禁用或隱藏
      const loginButton = screen.queryByRole('button', { name: /使用 passkey 登入|passkey 登入/i });
      if (loginButton) {
        expect(loginButton).toBeDisabled();
      }
    });

    it('應該在降級 UI 中建議使用支援的瀏覽器', () => {
      (webauthnUtils.isWebAuthnSupported as vi.Mock).mockReturnValue(false);

      render(<PasskeyLoginForm />);

      // 檢查建議文字
      expect(screen.getByText(/chrome|safari|firefox|edge/i)).toBeInTheDocument();
    });
  });

  describe('成功回調 (Success Callback)', () => {
    it('應該在登入成功後呼叫 onSuccess 回調', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = vi.fn();
      (webauthnApi.getAuthenticationOptions as vi.Mock).mockResolvedValue({
        options: {
          challenge: 'test-challenge',
          rpId: 'localhost',
          allowCredentials: [],
          timeout: 60000,
          userVerification: 'preferred' as const,
        },
      });
      mockGet.mockResolvedValue({
        id: 'credential-id',
        rawId: new ArrayBuffer(8),
        type: 'public-key' as const,
        response: {
          clientDataJSON: new ArrayBuffer(8),
          authenticatorData: new ArrayBuffer(8),
          signature: new ArrayBuffer(8),
          userHandle: new ArrayBuffer(8),
        },
      });
      (webauthnApi.verifyAuthentication as vi.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
        access_token: 'test-token',
      });

      render(<PasskeyLoginForm onSuccess={mockOnSuccess} />);

      const loginButton = screen.getByRole('button', { name: /使用 passkey 登入|passkey 登入/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(expect.objectContaining({
          user: expect.objectContaining({ id: 'user-123' }),
        }));
      });
    });
  });
});
