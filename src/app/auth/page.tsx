/**
 * Auth Page - Unified Login/Register with Tabs
 * 統一的登入/註冊頁面，使用 Tabs 切換
 */

import { Metadata } from 'next'
import { AuthPageClient } from '@/components/auth/AuthPageClient'

export const metadata: Metadata = {
  title: 'Vault-Tec 終端機啟動 - 廢土塔羅',
  description: '訪問或建立你的 Pip-Boy 帳戶，開始你的廢土占卜旅程。',
}

export default function AuthPage() {
  return <AuthPageClient />
}
