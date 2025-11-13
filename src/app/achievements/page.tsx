import type { Metadata } from 'next'
import AchievementsClientPage from './client-page'

export const metadata: Metadata = {
  title: '廢土成就系統 | 解鎖挑戰獲得獎勵 | 廢土塔羅',
  description: '探索廢土世界，完成各類挑戰任務，解鎖成就勳章。追蹤你的占卜歷程、社交互動、賓果遊戲與探索進度，獲得業力點數與專屬獎勵。',
}

export default function AchievementsPage() {
  return <AchievementsClientPage />
}
