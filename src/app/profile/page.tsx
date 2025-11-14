import type { Metadata } from 'next';
import { ProfilePageContent } from './profile-content';

export const metadata: Metadata = {
  title: '個人檔案 | 廢土塔羅 - Vault Dweller 資料管理',
  description: '管理你的 Vault Dweller 個人檔案，編輯帳號資訊、上傳頭像、查看成就徽章與業力等級。自訂你在廢土塔羅社群中的個人形象。',
};

export default function ProfilePagePage() {
  return <ProfilePageContent />;
}
