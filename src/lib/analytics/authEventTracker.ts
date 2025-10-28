/**
 * 前端認證事件追蹤器
 *
 * 負責追蹤前端認證相關事件，包括：
 * - Passkey 升級引導互動
 * - 帳號衝突解決流程
 * - 設定頁面認證方式管理
 */

interface AuthEventMetadata {
  [key: string]: any;
}

/**
 * 追蹤認證事件到後端
 */
export async function trackAuthEvent(
  eventType: string,
  metadata: AuthEventMetadata = {}
): Promise<void> {
  try {
    const token = localStorage.getItem('auth_token');

    // 未登入用戶不追蹤
    if (!token) {
      return;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/analytics/auth-events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          event_type: eventType,
          metadata: metadata,
        }),
      }
    );

    if (!response.ok) {
      console.warn(`Failed to track auth event: ${eventType}`, response.status);
    }
  } catch (error) {
    // 追蹤失敗不應影響主流程，僅記錄警告
    console.warn('Failed to track auth event:', eventType, error);
  }
}

/**
 * Passkey 升級引導接受
 */
export async function trackPasskeyUpgradeAccepted(skipCount: number): Promise<void> {
  await trackAuthEvent('passkey_upgrade_prompt_accepted', { skip_count: skipCount });
}

/**
 * Passkey 升級引導跳過
 */
export async function trackPasskeyUpgradeSkipped(skipCount: number): Promise<void> {
  await trackAuthEvent('passkey_upgrade_prompt_skipped', { skip_count: skipCount });
}

/**
 * Passkey 升級完成
 */
export async function trackPasskeyUpgradeCompleted(source: 'oauth_prompt' | 'settings'): Promise<void> {
  await trackAuthEvent('passkey_upgrade_completed', { source });
}

/**
 * 帳號衝突解決放棄
 */
export async function trackConflictResolutionAbandoned(existingMethods: string[]): Promise<void> {
  await trackAuthEvent('oauth_conflict_resolution_abandoned', {
    existing_methods: existingMethods,
  });
}
