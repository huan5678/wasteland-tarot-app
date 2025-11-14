import type { Metadata } from 'next';
import { QuickReadingContent } from './quick-reading-content';

export const metadata: Metadata = {
  title: '快速占卜 | 廢土塔羅 - 免註冊體驗塔羅占卜',
  description: '無需註冊即可體驗廢土塔羅的核心功能。從 5 張大阿爾克那中選擇一張牌，獲得即時的占卜解讀與語音朗讀。適合新手快速了解塔羅占卜。',
};

export default function QuickReadingPage() {
  return <QuickReadingContent />;
}
