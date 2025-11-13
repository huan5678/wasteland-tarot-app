import type { Metadata } from 'next'
import ClientPage from './client-page'

export const metadata: Metadata = {
  title: '廢土塔羅 | Fallout 主題塔羅占卜 - 核戰後的靈性指引',
  description: '結合 Fallout 世界觀的獨特塔羅占卜體驗。在廢土世界中尋找生存智慧與靈性指引，透過量子演算法與塔羅牌解讀你的廢土命運。',
}

export default function HomePage() {
  return <ClientPage />
}
