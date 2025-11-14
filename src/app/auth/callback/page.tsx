/**
 * OAuth Callback Page
 * 處理 Google OAuth 授權回調
 */

import type { Metadata } from 'next';
import { CallbackPageContent } from './callback-content';

export const metadata: Metadata = {
  title: '登入處理中 | 廢土塔羅',
  description: '正在處理你的登入請求，請稍候。系統正在驗證你的帳號並建立安全連線。',
};

export default function CallbackPage() {
  return <CallbackPageContent />;
}
