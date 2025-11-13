import type { Metadata } from 'next'
import SettingsClientPage from './client-page'

export const metadata: Metadata = {
  title: '系統設定 | 自訂廢土塔羅體驗 | 廢土塔羅',
  description: '自訂你的廢土塔羅體驗設定，包含閱讀偏好、解讀風格、通知管理、隱私設定與帳號安全。打造專屬你的塔羅占卜環境。',
}

export default function SettingsPage() {
  return <SettingsClientPage />
}
