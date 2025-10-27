/**
 * E2E 測試：Passkey 管理流程
 *
 * 測試範圍：
 * - 列出所有 Passkeys
 * - 編輯 Passkey 名稱
 * - 刪除 Passkey
 * - 最後一個 Passkey 警告
 *
 * TDD 循環 14 - 階段 15.4
 */

import { test, expect, Page } from '@playwright/test';
import {
  setupVirtualAuthenticator,
  removeVirtualAuthenticator,
} from './helpers/webauthn';

/**
 * 模擬已登入狀態
 */
async function mockAuthenticatedUser(page: Page, context: any) {
  await context.addCookies([
    {
      name: 'access_token',
      value: 'mock-jwt-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  // Mock 用戶資料
  await page.addInitScript(() => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            username: 'Test User',
            karma_score: 100,
          },
          isAuthenticated: true,
          authMethod: 'passkey',
        },
        version: 3,
      })
    );
  });
}

test.describe('Passkey Management - 列表顯示', () => {
  test.beforeEach(async ({ page, context, browserName }) => {
    test.skip(
      browserName === 'webkit',
      'WebKit 不支援 Virtual Authenticator'
    );

    await setupVirtualAuthenticator(page);
    await mockAuthenticatedUser(page, context);
  });

  test.afterEach(async ({ page }) => {
    await removeVirtualAuthenticator(page);
  });

  test('應該顯示所有 Passkeys 列表', async ({ page }) => {
    // Mock API 回應（3 個 credentials）
    await page.route('**/api/v1/webauthn/credentials', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            credentials: [
              {
                id: 'credential-1',
                device_name: 'My iPhone',
                created_at: '2025-01-15T10:00:00Z',
                last_used_at: '2025-01-28T09:00:00Z',
                transports: ['internal'],
                counter: 10,
                aaguid: 'aaguid-1',
                device_type: 'platform',
              },
              {
                id: 'credential-2',
                device_name: 'YubiKey 5C',
                created_at: '2025-01-10T14:30:00Z',
                last_used_at: '2025-01-20T16:45:00Z',
                transports: ['usb', 'nfc'],
                counter: 5,
                aaguid: 'aaguid-2',
                device_type: 'cross-platform',
              },
              {
                id: 'credential-3',
                device_name: 'Chrome on Mac',
                created_at: '2025-01-05T08:15:00Z',
                last_used_at: '2025-01-05T08:20:00Z',
                transports: ['internal'],
                counter: 1,
                aaguid: 'aaguid-3',
                device_type: 'platform',
              },
            ],
          },
        }),
      });
    });

    await page.goto('/settings/passkeys');
    await page.waitForLoadState('networkidle');

    // 驗證顯示 3 個 credential cards
    const credentialCards = page.locator('[data-testid="passkey-card"]');
    await expect(credentialCards).toHaveCount(3);

    // 驗證顯示裝置名稱
    await expect(page.getByText('My iPhone')).toBeVisible();
    await expect(page.getByText('YubiKey 5C')).toBeVisible();
    await expect(page.getByText('Chrome on Mac')).toBeVisible();

    // 驗證顯示使用次數（counter）
    await expect(page.getByText(/使用.*10.*次|counter.*10/i)).toBeVisible();
  });

  test('應該在無 Passkeys 時顯示空狀態', async ({ page }) => {
    // Mock API 回應（空列表）
    await page.route('**/api/v1/webauthn/credentials', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            credentials: [],
          },
        }),
      });
    });

    await page.goto('/settings/passkeys');
    await page.waitForLoadState('networkidle');

    // 驗證顯示空狀態 UI
    await expect(
      page.getByText(/尚未設定.*passkey|沒有.*生物辨識/i)
    ).toBeVisible();

    // 驗證有「新增」按鈕
    const addButton = page.getByRole('button', { name: /新增.*passkey/i });
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();
  });

  test('應該依 last_used_at 降序排序', async ({ page }) => {
    await page.route('**/api/v1/webauthn/credentials', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            credentials: [
              {
                id: 'recent',
                device_name: 'Recently Used',
                created_at: '2025-01-01T00:00:00Z',
                last_used_at: '2025-01-28T12:00:00Z',
                transports: ['internal'],
                counter: 50,
              },
              {
                id: 'older',
                device_name: 'Older Device',
                created_at: '2025-01-01T00:00:00Z',
                last_used_at: '2025-01-15T12:00:00Z',
                transports: ['internal'],
                counter: 20,
              },
            ],
          },
        }),
      });
    });

    await page.goto('/settings/passkeys');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('[data-testid="passkey-card"]');

    // 第一個應該是 "Recently Used"
    const firstCard = cards.first();
    await expect(firstCard.getByText('Recently Used')).toBeVisible();

    // 第二個應該是 "Older Device"
    const secondCard = cards.nth(1);
    await expect(secondCard.getByText('Older Device')).toBeVisible();
  });
});

test.describe('Passkey Management - 編輯名稱', () => {
  test.beforeEach(async ({ page, context, browserName }) => {
    test.skip(
      browserName === 'webkit',
      'WebKit 不支援 Virtual Authenticator'
    );

    await setupVirtualAuthenticator(page);
    await mockAuthenticatedUser(page, context);

    // Mock credentials 列表
    await page.route('**/api/v1/webauthn/credentials', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            credentials: [
              {
                id: 'credential-1',
                device_name: 'Old Name',
                created_at: '2025-01-15T10:00:00Z',
                last_used_at: '2025-01-28T09:00:00Z',
                transports: ['internal'],
                counter: 10,
              },
            ],
          },
        }),
      });
    });

    await page.goto('/settings/passkeys');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await removeVirtualAuthenticator(page);
  });

  test('應該成功編輯 Passkey 名稱', async ({ page }) => {
    // 點擊編輯按鈕
    const editButton = page.locator('[data-testid="edit-passkey"]').first();
    await editButton.click();

    // 等待編輯對話框顯示
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 填寫新名稱
    const nameInput = dialog.locator('input[name="deviceName"]');
    await nameInput.clear();
    await nameInput.fill('My New iPhone');

    // Mock API 回應（更新成功）
    await page.route('**/api/v1/webauthn/credentials/credential-1/name', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            credential: {
              id: 'credential-1',
              device_name: 'My New iPhone',
              created_at: '2025-01-15T10:00:00Z',
              last_used_at: '2025-01-28T09:00:00Z',
              transports: ['internal'],
              counter: 10,
            },
          },
        }),
      });
    });

    // 提交
    const saveButton = dialog.getByRole('button', { name: /儲存|save/i });
    await saveButton.click();

    // 驗證成功訊息
    await expect(
      page.getByText(/更新成功|名稱已更新/i)
    ).toBeVisible({ timeout: 5000 });

    // 驗證對話框關閉
    await expect(dialog).not.toBeVisible();
  });

  test('應該驗證名稱不能為空', async ({ page }) => {
    const editButton = page.locator('[data-testid="edit-passkey"]').first();
    await editButton.click();

    const dialog = page.getByRole('dialog');
    const nameInput = dialog.locator('input[name="deviceName"]');

    // 清空名稱
    await nameInput.clear();

    const saveButton = dialog.getByRole('button', { name: /儲存|save/i });
    await saveButton.click();

    // 驗證顯示錯誤訊息
    await expect(
      dialog.getByText(/名稱.*必填|name.*required/i)
    ).toBeVisible();

    // 驗證對話框仍然開啟
    await expect(dialog).toBeVisible();
  });
});

test.describe('Passkey Management - 刪除 Passkey', () => {
  test.beforeEach(async ({ page, context, browserName }) => {
    test.skip(
      browserName === 'webkit',
      'WebKit 不支援 Virtual Authenticator'
    );

    await setupVirtualAuthenticator(page);
    await mockAuthenticatedUser(page, context);
  });

  test.afterEach(async ({ page }) => {
    await removeVirtualAuthenticator(page);
  });

  test('應該成功刪除 Passkey', async ({ page }) => {
    // Mock credentials 列表（2 個）
    await page.route('**/api/v1/webauthn/credentials', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            credentials: [
              {
                id: 'credential-1',
                device_name: 'Device 1',
                created_at: '2025-01-15T10:00:00Z',
                last_used_at: '2025-01-28T09:00:00Z',
                transports: ['internal'],
                counter: 10,
              },
              {
                id: 'credential-2',
                device_name: 'Device 2',
                created_at: '2025-01-10T10:00:00Z',
                last_used_at: '2025-01-20T09:00:00Z',
                transports: ['usb'],
                counter: 5,
              },
            ],
          },
        }),
      });
    });

    await page.goto('/settings/passkeys');
    await page.waitForLoadState('networkidle');

    // 點擊刪除按鈕
    const deleteButton = page.locator('[data-testid="delete-passkey"]').first();
    await deleteButton.click();

    // 等待確認對話框
    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible();

    // 驗證警告訊息
    await expect(
      confirmDialog.getByText(/確定.*刪除|delete.*confirm/i)
    ).toBeVisible();

    // Mock API 回應（刪除成功）
    await page.route('**/api/v1/webauthn/credentials/credential-1', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Passkey 已刪除',
          }),
        });
      }
    });

    // 確認刪除
    const confirmButton = confirmDialog.getByRole('button', {
      name: /確定.*刪除|confirm/i,
    });
    await confirmButton.click();

    // 驗證成功訊息
    await expect(
      page.getByText(/已刪除|刪除成功/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('應該在刪除最後一個 Passkey 時顯示額外警告', async ({ page }) => {
    // Mock credentials 列表（只有 1 個）
    await page.route('**/api/v1/webauthn/credentials', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            credentials: [
              {
                id: 'last-credential',
                device_name: 'Last Device',
                created_at: '2025-01-15T10:00:00Z',
                last_used_at: '2025-01-28T09:00:00Z',
                transports: ['internal'],
                counter: 10,
              },
            ],
          },
        }),
      });
    });

    await page.goto('/settings/passkeys');
    await page.waitForLoadState('networkidle');

    const deleteButton = page.locator('[data-testid="delete-passkey"]').first();
    await deleteButton.click();

    const confirmDialog = page.getByRole('dialog');

    // 驗證顯示最後一個 Passkey 的警告
    await expect(
      confirmDialog.getByText(/最後.*passkey|唯一.*認證方式/i)
    ).toBeVisible();

    // 驗證有額外的確認步驟（例如輸入確認文字）
    // 根據實際 UI 設計調整
  });

  test('應該在點擊取消時不刪除', async ({ page }) => {
    await page.route('**/api/v1/webauthn/credentials', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            credentials: [
              {
                id: 'credential-1',
                device_name: 'Device 1',
                created_at: '2025-01-15T10:00:00Z',
                last_used_at: '2025-01-28T09:00:00Z',
                transports: ['internal'],
                counter: 10,
              },
            ],
          },
        }),
      });
    });

    await page.goto('/settings/passkeys');
    await page.waitForLoadState('networkidle');

    const deleteButton = page.locator('[data-testid="delete-passkey"]').first();
    await deleteButton.click();

    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible();

    // 點擊取消
    const cancelButton = confirmDialog.getByRole('button', { name: /取消|cancel/i });
    await cancelButton.click();

    // 驗證對話框關閉
    await expect(confirmDialog).not.toBeVisible();

    // 驗證 Passkey 仍然存在
    await expect(page.getByText('Device 1')).toBeVisible();
  });
});

test.describe('Passkey Management - 載入與錯誤處理', () => {
  test.beforeEach(async ({ page, context, browserName }) => {
    test.skip(
      browserName === 'webkit',
      'WebKit 不支援 Virtual Authenticator'
    );

    await setupVirtualAuthenticator(page);
    await mockAuthenticatedUser(page, context);
  });

  test.afterEach(async ({ page }) => {
    await removeVirtualAuthenticator(page);
  });

  test('應該在載入時顯示載入指示器', async ({ page }) => {
    // 延遲 API 回應
    await page.route('**/api/v1/webauthn/credentials', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { credentials: [] },
        }),
      });
    });

    await page.goto('/settings/passkeys');

    // 驗證顯示載入指示器
    await expect(
      page.getByText(/載入中|loading|Pip-Boy.*掃描/i)
    ).toBeVisible({ timeout: 1000 });
  });

  test('應該在 API 錯誤時顯示錯誤訊息', async ({ page }) => {
    // Mock API 錯誤
    await page.route('**/api/v1/webauthn/credentials', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '伺服器錯誤',
          },
        }),
      });
    });

    await page.goto('/settings/passkeys');
    await page.waitForLoadState('networkidle');

    // 驗證顯示錯誤訊息
    await expect(
      page.getByText(/錯誤|失敗|無法.*載入/i)
    ).toBeVisible();

    // 驗證有重試按鈕
    const retryButton = page.getByRole('button', { name: /重試|retry/i });
    if (await retryButton.isVisible()) {
      await expect(retryButton).toBeEnabled();
    }
  });
});
