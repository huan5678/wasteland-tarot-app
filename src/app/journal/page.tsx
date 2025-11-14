/**
 * Journal Page
 * Main page for viewing and managing user's tarot journals
 */

import type { Metadata } from 'next';
import { JournalPageContent } from './journal-content';

export const metadata: Metadata = {
  title: '塔羅日誌 | 廢土塔羅 - 記錄你的占卜心得與靈性成長',
  description: '建立私人塔羅日誌，記錄每次占卜的感悟與反思。追蹤你的靈性成長軌跡，回顧過去的占卜體驗，深化塔羅學習。',
};

export default function JournalPagePage() {
  return <JournalPageContent />;
}
