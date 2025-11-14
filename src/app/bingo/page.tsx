import type { Metadata } from 'next'
import BingoClientPage from './client-page'

export const metadata: Metadata = {
  title: '廢土賓果簽到 | 每日簽到領取號碼 | 廢土塔羅',
  description: '每日簽到領取隨機號碼，達成三連線獲得廢土幣獎勵。結合 Fallout 主題的趣味簽到系統，讓每日登入成為廢土冒險的一部分。',
}

export default function BingoPage() {
  return <BingoClientPage />
}
