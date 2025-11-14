import type { Metadata } from 'next';
import { UIShowcaseContent } from './ui-showcase-content';

export const metadata: Metadata = {
  title: 'UI 展示 | 廢土塔羅 - 元件與設計系統展示',
  description: '廢土塔羅設計系統展示頁面，包含所有 UI 元件、色彩系統、字體樣式與互動範例。供開發者參考與測試。',
};

export default function UIShowcase() {
  return <UIShowcaseContent />;
}
