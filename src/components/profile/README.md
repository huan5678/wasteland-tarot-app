# Profile Components

個人檔案頁面相關元件集合。

---

## TitleSelector

個人稱號設定元件，遵循 Fallout/Wasteland 設計風格。

### 功能特點
- 顯示當前稱號
- 列出所有已解鎖稱號
- 允許選擇或取消稱號
- 即時更新顯示
- 完整的錯誤處理和成功提示

### 使用方式
```tsx
import { TitleSelector } from '@/components/profile/TitleSelector'

<TitleSelector />
```

### 相關 Store
- `useTitleStore` (`@/lib/stores/titleStore`) - 管理稱號狀態和 API 呼叫

### API Endpoints
- `GET /api/v1/users/me/titles` - 獲取使用者的稱號列表
- `PUT /api/v1/users/me/title` - 設定使用者的當前稱號

### 設計規範
- 遵循 Pip-Boy 綠色主題 (#00ff88)
- 使用 PixelIcon 圖示系統
- 自動繼承 Cubic 11 字體
- 響應式布局
- 無障礙支援（ARIA labels）

### Profile 頁面整合

在 Profile 頁面中顯示當前稱號：
```tsx
import { useTitleStore } from '@/lib/stores/titleStore'

const currentTitle = useTitleStore(s => s.currentTitle)

// 在使用者名稱下方顯示
{currentTitle && (
  <span className="block text-base font-normal text-pip-boy-green/80 mt-1">
    [{currentTitle}]
  </span>
)}
```

---

## AvatarUpload 元件使用指南

## 快速開始

```tsx
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { useAuthStore } from '@/lib/authStore'

function MyComponent() {
  const user = useAuthStore(s => s.user)
  const updateAvatarUrl = useAuthStore(s => s.updateAvatarUrl)

  return (
    <AvatarUpload
      currentAvatarUrl={user?.avatar_url}
      onUploadSuccess={(newAvatarUrl) => {
        updateAvatarUrl(newAvatarUrl)
      }}
    />
  )
}
```

## Props

| Prop | 類型 | 必填 | 說明 |
|------|------|------|------|
| `currentAvatarUrl` | `string \| null \| undefined` | 否 | 當前頭像 URL |
| `onUploadSuccess` | `(newAvatarUrl: string) => void` | 否 | 上傳成功回調 |

## 功能特色

- ✅ 圖片裁切（1:1 正方形）
- ✅ 拖放上傳
- ✅ 即時檔案驗證
- ✅ Fallout 風格 UI
- ✅ Loading 狀態
- ✅ 錯誤/成功訊息
- ✅ 無障礙支援

## 支援格式

- JPEG / JPG
- PNG
- WebP
- GIF

**最大檔案大小**: 5 MB

## 依賴

- `react-image-crop` v11.0.10
- `@/components/ui/icons` (PixelIcon)
- `@/lib/api/services` (profileAPI)

## 樣式

使用 `AvatarUpload.module.css` 實現 Fallout 風格客製化：
- Pip-Boy Green 裁切框
- 螢光效果
- 終端機風格按鈕

## 注意事項

1. **後端 API 必須運行**: 確保 `/api/v1/users/avatar` 端點可用
2. **使用者必須登入**: 元件會自動使用 httpOnly cookies 認證
3. **字體自動繼承**: 使用 Cubic 11 字體，無需手動指定

## 範例場景

### 1. Profile 頁面

```tsx
<AvatarUpload
  currentAvatarUrl={user?.avatar_url}
  onUploadSuccess={(newAvatarUrl) => {
    updateAvatarUrl(newAvatarUrl)
  }}
/>
```

### 2. OAuth 使用者優先顯示 Google 頭像

```tsx
<AvatarUpload
  currentAvatarUrl={isOAuthUser && profilePicture ? profilePicture : user?.avatar_url}
  onUploadSuccess={(newAvatarUrl) => {
    updateAvatarUrl(newAvatarUrl)
  }}
/>
```

### 3. 自訂上傳成功處理

```tsx
<AvatarUpload
  currentAvatarUrl={user?.avatar_url}
  onUploadSuccess={(newAvatarUrl) => {
    updateAvatarUrl(newAvatarUrl)
    showToast('頭像更新成功！')
    trackEvent('avatar_uploaded')
  }}
/>
```

## 檔案結構

```
src/components/profile/
├── AvatarUpload.tsx          # 主元件
├── AvatarUpload.module.css   # Fallout 風格樣式
└── README.md                  # 本文件
```

## 技術細節

詳細實作說明請參考：
`/AVATAR_UPLOAD_IMPLEMENTATION.md`
