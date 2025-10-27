/**
 * WebAuthn E2E 測試輔助工具
 *
 * 功能：
 * - 設定 Virtual Authenticator（模擬 WebAuthn 裝置）
 * - 提供測試用的 credential 資料
 * - 管理測試資料庫
 */

import { Page, BrowserContext } from '@playwright/test';

/**
 * Virtual Authenticator 配置選項
 */
export interface VirtualAuthenticatorOptions {
  protocol?: 'ctap1/u2f' | 'ctap2';
  transport?: 'usb' | 'nfc' | 'ble' | 'internal';
  hasResidentKey?: boolean;
  hasUserVerification?: boolean;
  isUserVerified?: boolean;
  extensions?: string[];
}

/**
 * 設定 Virtual Authenticator
 *
 * 注意：Virtual Authenticator 只在 Chromium 和 Firefox 上完整支援
 * WebKit (Safari) 需要使用不同的測試策略
 *
 * @param page - Playwright Page 實例
 * @param options - 認證器配置選項
 */
export async function setupVirtualAuthenticator(
  page: Page,
  options: VirtualAuthenticatorOptions = {}
): Promise<void> {
  const {
    protocol = 'ctap2',
    transport = 'internal',
    hasResidentKey = true,
    hasUserVerification = true,
    isUserVerified = true,
    extensions = [],
  } = options;

  const context = page.context();

  // 使用 CDP (Chrome DevTools Protocol) 設定 Virtual Authenticator
  const client = await context.newCDPSession(page);

  try {
    // 啟用 WebAuthn 環境
    await client.send('WebAuthn.enable');

    // 添加 Virtual Authenticator
    // @ts-expect-error - CDP WebAuthn protocol types may not be up-to-date
    const { authenticatorId } = await client.send('WebAuthn.addVirtualAuthenticator', {
      options: {
        protocol,
        transport,
        hasResidentKey,
        hasUserVerification,
        isUserVerified,
        automaticPresenceSimulation: true, // 自動模擬用戶在場
        isUserConsenting: true, // 自動模擬用戶同意
        extensions,
      },
    });

    // 儲存 authenticatorId 到 page 上下文中，方便後續清理
    await page.evaluate((id) => {
      (window as any).__virtualAuthenticatorId = id;
    }, authenticatorId);

    console.log(`✅ Virtual Authenticator 已設定 (${protocol}, ${transport})`);
  } catch (error) {
    console.error('❌ 設定 Virtual Authenticator 失敗:', error);
    throw error;
  }
}

/**
 * 移除 Virtual Authenticator
 *
 * @param page - Playwright Page 實例
 */
export async function removeVirtualAuthenticator(page: Page): Promise<void> {
  try {
    const context = page.context();
    const client = await context.newCDPSession(page);

    // 取得 authenticatorId
    const authenticatorId = await page.evaluate(() => {
      return (window as any).__virtualAuthenticatorId;
    });

    if (authenticatorId) {
      await client.send('WebAuthn.removeVirtualAuthenticator', {
        authenticatorId,
      });
      console.log('✅ Virtual Authenticator 已移除');
    }

    // 停用 WebAuthn 環境
    await client.send('WebAuthn.disable');
  } catch (error) {
    console.error('❌ 移除 Virtual Authenticator 失敗:', error);
  }
}

/**
 * 清除 Virtual Authenticator 的所有 credentials
 *
 * @param page - Playwright Page 實例
 */
export async function clearVirtualAuthenticatorCredentials(page: Page): Promise<void> {
  try {
    const context = page.context();
    const client = await context.newCDPSession(page);

    const authenticatorId = await page.evaluate(() => {
      return (window as any).__virtualAuthenticatorId;
    });

    if (authenticatorId) {
      await client.send('WebAuthn.clearCredentials', {
        authenticatorId,
      });
      console.log('✅ Virtual Authenticator credentials 已清除');
    }
  } catch (error) {
    console.error('❌ 清除 credentials 失敗:', error);
  }
}

/**
 * 取得 Virtual Authenticator 的所有 credentials
 *
 * @param page - Playwright Page 實例
 * @returns credentials 陣列
 */
export async function getVirtualAuthenticatorCredentials(page: Page): Promise<any[]> {
  try {
    const context = page.context();
    const client = await context.newCDPSession(page);

    const authenticatorId = await page.evaluate(() => {
      return (window as any).__virtualAuthenticatorId;
    });

    if (!authenticatorId) {
      return [];
    }

    const { credentials } = await client.send('WebAuthn.getCredentials', {
      authenticatorId,
    });

    return credentials || [];
  } catch (error) {
    console.error('❌ 取得 credentials 失敗:', error);
    return [];
  }
}

/**
 * 等待 WebAuthn 請求完成
 *
 * @param page - Playwright Page 實例
 * @param timeout - 超時時間（毫秒）
 */
export async function waitForWebAuthnRequest(
  page: Page,
  timeout: number = 5000
): Promise<void> {
  try {
    // 等待 navigator.credentials.create() 或 navigator.credentials.get() 呼叫
    await page.waitForFunction(
      () => {
        return (window as any).__webauthnRequestInProgress === false;
      },
      { timeout }
    );
  } catch (error) {
    console.warn('⚠️  WebAuthn 請求超時');
  }
}

/**
 * 測試資料庫輔助函式
 */
export class TestDatabase {
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:8000') {
    this.baseURL = baseURL;
  }

  /**
   * 建立測試用戶（不使用 Passkey）
   */
  async createTestUser(userData: {
    email: string;
    username?: string;
    password: string;
  }): Promise<any> {
    // 注意：這需要後端提供測試用的 API
    // 或者在測試環境中直接操作資料庫
    console.log('📝 建立測試用戶:', userData.email);

    // TODO: 實作實際的資料庫操作
    // 這裡先返回模擬資料
    return {
      id: `test-user-${Date.now()}`,
      email: userData.email,
      username: userData.username || userData.email.split('@')[0],
    };
  }

  /**
   * 清空測試用戶的所有 credentials
   */
  async clearUserCredentials(userId: string): Promise<void> {
    console.log('🧹 清空用戶 credentials:', userId);
    // TODO: 實作實際的資料庫操作
  }

  /**
   * 建立測試用戶並新增指定數量的 Passkeys
   */
  async createUserWithPasskeys(
    userData: {
      email: string;
      username?: string;
    },
    passkeyCount: number
  ): Promise<any> {
    console.log(`📝 建立測試用戶（含 ${passkeyCount} 個 Passkeys）:`, userData.email);

    // TODO: 實作實際的資料庫操作
    return {
      id: `test-user-${Date.now()}`,
      email: userData.email,
      username: userData.username || userData.email.split('@')[0],
      credentialCount: passkeyCount,
    };
  }

  /**
   * 清理所有測試資料
   */
  async cleanup(): Promise<void> {
    console.log('🧹 清理測試資料');
    // TODO: 實作實際的資料庫清理
  }
}

/**
 * 模擬用戶取消 WebAuthn 驗證
 */
export async function simulateUserCancel(page: Page): Promise<void> {
  // 注意：Virtual Authenticator 預設會自動同意
  // 要模擬取消需要修改 authenticator 設定
  await page.evaluate(() => {
    // 這會導致 navigator.credentials API 拋出 NotAllowedError
    throw new DOMException('User cancelled', 'NotAllowedError');
  });
}

/**
 * 檢查瀏覽器是否支援 WebAuthn
 */
export async function checkWebAuthnSupport(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return (
      typeof window.PublicKeyCredential !== 'undefined' &&
      typeof navigator.credentials !== 'undefined' &&
      typeof navigator.credentials.create !== 'undefined'
    );
  });
}

/**
 * 檢查瀏覽器是否支援 Conditional UI
 */
export async function checkConditionalUISupport(page: Page): Promise<boolean> {
  return await page.evaluate(async () => {
    if (typeof window.PublicKeyCredential === 'undefined') {
      return false;
    }
    try {
      const available = await PublicKeyCredential.isConditionalMediationAvailable();
      return available === true;
    } catch {
      return false;
    }
  });
}
