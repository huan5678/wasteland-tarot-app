import type { Metadata } from 'next'
import ReadingsClientPage from './client-page'

export const metadata: Metadata = {
  title: '占卜管理中心 | 個人占卜記錄與統計 | 廢土塔羅',
  description: '管理你的所有塔羅占卜記錄，查看占卜歷史、搜尋特定解讀、追蹤統計數據。完整的占卜檔案管理系統，讓你的靈性旅程清晰可見。',
}

export default function ReadingsPage() {
  return <ReadingsClientPage />
}
