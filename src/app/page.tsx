import type { Metadata } from 'next'
import ClientPage from './client-page'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '廢土塔羅 | Fallout 主題塔羅占卜 - 核戰後的靈性指引',
    description: '結合 Fallout 世界觀的獨特塔羅占卜體驗。在廢土世界中尋找生存智慧與靈性指引，透過量子演算法與塔羅牌解讀你的廢土命運。',
    keywords: ['塔羅占卜', 'Fallout', '廢土', '量子演算法', 'Pip-Boy', 'Vault-Tec', '線上占卜', '塔羅牌'],
    openGraph: {
      title: '廢土塔羅 - 核戰後的靈性指引',
      description: '結合 Fallout 世界觀的獨特塔羅占卜體驗',
      type: 'website',
    },
  }
}

export default function HomePage() {
  return <ClientPage />
}
