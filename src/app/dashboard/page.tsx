import type { Metadata } from 'next'
import DashboardClientPage from './client-page'

export const metadata: Metadata = {
  title: 'Pip-Boy 控制台 | 個人資料管理系統 | 廢土塔羅',
  description: '查看你的占卜統計、業力狀態、最近占卜記錄與成就進度。管理你的 Vault Dweller 個人檔案，追蹤廢土生存歷程與靈性成長。',
}

export default function DashboardPage() {
  return <DashboardClientPage />
}
