import type { Metadata } from 'next';
import { NewReadingContent } from './new-reading-content';

export const metadata: Metadata = {
  title: '新占卜 | 廢土塔羅 - 開始你的塔羅占卜旅程',
  description: '選擇牌陣類型，提出你的問題，透過 Vault-Tec 量子演算法獲得專屬的塔羅占卜解讀。支援多種牌陣類型，包含單張牌、三張牌、塞爾特十字等。',
};

export default function NewReadingPage() {
  return <NewReadingContent />;
}
