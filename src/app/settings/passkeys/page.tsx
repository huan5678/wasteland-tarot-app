/**
 * Passkey 管理頁面
 * 允許使用者查看、新增、編輯、刪除 Passkeys
 */

import type { Metadata } from 'next';
import { PasskeysPageContent } from './passkeys-content';

export const metadata: Metadata = {
  title: 'Passkey 管理 | 廢土塔羅 - 生物辨識登入設定',
  description: '管理你的 Passkey 認證金鑰，新增、編輯或刪除生物辨識登入方式。支援指紋、Face ID 與安全金鑰，提供無密碼登入體驗。',
};

export default function PasskeysPagePage() {
  return <PasskeysPageContent />;
}
