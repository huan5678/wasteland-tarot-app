/**
 * Rhythm Editor Page - 節奏編輯器頁面
 * Task 7.1: 整合所有節奏編輯器組件
 * Requirements 20.1-20.8
 */

import type { Metadata } from 'next';
import { RhythmEditorContent } from './rhythm-editor-content';

export const metadata: Metadata = {
  title: '節奏編輯器 | 廢土塔羅 - 自訂音效節奏',
  description: '自訂廢土塔羅的音效節奏與時間軸，創建獨特的聲音體驗。支援即時預覽與儲存個人化設定。',
};

export default function RhythmEditorPage() {
  return <RhythmEditorContent />;
}
