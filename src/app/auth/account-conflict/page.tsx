/**
 * Account Conflict Resolution Page
 * Route: /auth/account-conflict
 * Handles OAuth account conflict resolution (Task 7)
 */

import type { Metadata } from 'next';
import { AccountConflictPageContent } from './account-conflict-content';

export const metadata: Metadata = {
  title: '帳號衝突 | 廢土塔羅 - 帳號合併處理',
  description: '偵測到帳號衝突。請選擇合併現有帳號或創建新帳號。我們將協助你安全地處理帳號問題。',
};

export default function AccountConflictRoute() {
  return <AccountConflictPageContent />;
}
