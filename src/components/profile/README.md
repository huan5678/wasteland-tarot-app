# AvatarUpload 元件使用指南

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
