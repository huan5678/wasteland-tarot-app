# Zeabur 環境變數檢查清單

## 問題診斷

如果你在生產環境看到以下錯誤：
```
http://localhost:8000/api/v1/music/presets/public
Failed to load resource: net::ERR_FAILED
```

這表示瀏覽器嘗試連接 localhost，而不是使用 Next.js API proxy。

## 根本原因

**錯誤配置**：在 Zeabur 前端服務設定了 `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`

這個環境變數會讓瀏覽器端直接使用 localhost，導致生產環境無法連接。

## 正確配置

### Frontend Service（前端服務）環境變數

```bash
# ✅ 必須設定（伺服器端使用）
API_BASE_URL=http://wasteland-tarot-app.zeabur.internal:8080

# ❌ 不要設定（或完全移除）
# NEXT_PUBLIC_API_BASE_URL=  # <-- 不要設定這個

# ✅ 其他必要變數
NEXT_PUBLIC_SITE_URL=https://wt.ai-404.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# ✅ Feature Flags
NEXT_PUBLIC_BINGO_ENABLE=true
NEXT_PUBLIC_ENABLE_WEB_AUDIO=true
```

### Backend Service（後端服務）環境變數

```bash
DATABASE_URL=postgresql://...
SECRET_KEY=your_secure_random_key
ENVIRONMENT=production
FRONTEND_URL=https://wt.ai-404.app
```

## 架構說明

### 正確的請求流程

```
瀏覽器 (wt.ai-404.app)
  ↓
  fetch('/api/v1/music/presets/public')  ← 使用相對路徑
  ↓
Next.js Frontend (伺服器端)
  ↓
  使用 API_BASE_URL 轉發到後端
  ↓
Backend (wasteland-tarot-app.zeabur.internal:8080)
```

### 錯誤的請求流程（當設定了 NEXT_PUBLIC_API_BASE_URL 時）

```
瀏覽器 (wt.ai-404.app)
  ↓
  fetch('http://localhost:8000/api/v1/music/presets/public')  ← 錯誤！
  ↓
  ❌ ERR_FAILED (無法連接 localhost)
```

## 如何檢查

### 1. 檢查 Zeabur 環境變數

在 Zeabur Dashboard：
1. 進入你的專案
2. 選擇前端服務（Frontend Service）
3. 進入「Environment」或「Variables」標籤
4. 確認：
   - ✅ `API_BASE_URL` 已設定
   - ❌ `NEXT_PUBLIC_API_BASE_URL` **不存在**或為空

### 2. 檢查瀏覽器請求

打開瀏覽器開發者工具（F12）→ Network 標籤：

**正確的請求**：
```
Request URL: https://wt.ai-404.app/api/v1/music/presets/public
```

**錯誤的請求**：
```
Request URL: http://localhost:8000/api/v1/music/presets/public
```

### 3. 檢查 Service Worker

Service Worker 快取可能會保留舊的配置，清除快取：
1. 開發者工具 → Application 標籤
2. Service Workers → Unregister
3. Clear site data
4. 重新載入頁面

## 修復步驟

### 步驟 1：更新 Zeabur 環境變數

1. 到 Zeabur Dashboard
2. 前端服務 → Environment Variables
3. 移除或清空 `NEXT_PUBLIC_API_BASE_URL`
4. 確認 `API_BASE_URL` 設定正確

### 步驟 2：重新部署

環境變數更改後需要重新部署：
```bash
# 觸發重新部署（任一方式）
git commit --allow-empty -m "chore: trigger redeploy"
git push

# 或在 Zeabur Dashboard 手動觸發 Redeploy
```

### 步驟 3：清除瀏覽器快取

1. 清除 Service Worker
2. 清除網站資料
3. 硬性重新載入（Ctrl+Shift+R 或 Cmd+Shift+R）

### 步驟 4：驗證修復

1. 打開瀏覽器開發者工具
2. 重新載入首頁
3. 檢查 Network 標籤
4. 確認所有 API 請求使用相對路徑或正確的網域

## 為什麼這樣設計？

### 問題：CORS 和 Cookie

```
瀏覽器 (https://wt.ai-404.app:443)
  ↓
  直接請求後端 (http://backend.zeabur.internal:8080)
  ↓
  ❌ CORS 錯誤
  ❌ Cookie 不會被發送（不同來源）
```

### 解決方案：API Route Proxy

```
瀏覽器 (https://wt.ai-404.app:443)
  ↓
  相對路徑請求 (/api/v1/*)
  ↓
  Next.js API Route (同源，伺服器端)
  ↓
  轉發到後端 (http://backend.zeabur.internal:8080)
  ↓
  ✅ 沒有 CORS 問題
  ✅ Cookie 正常運作
```

## 常見問題

### Q: 為什麼不能在瀏覽器直接連接後端？

A:
1. **CORS 問題**：瀏覽器會阻擋跨來源請求
2. **Cookie 問題**：不同來源的 Cookie 不會被發送
3. **安全性**：暴露內部後端網址

### Q: API_BASE_URL 和 NEXT_PUBLIC_API_BASE_URL 有什麼差別？

A:
- `API_BASE_URL`：只在伺服器端可用，用於 Next.js API routes
- `NEXT_PUBLIC_API_BASE_URL`：會暴露到瀏覽器端，在生產環境**不應該設定**

### Q: 開發環境怎麼辦？

A: 開發環境可以設定 `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`，因為前後端都在本機。

```bash
# .env.local（開發環境）
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# .env.production（生產環境）
NEXT_PUBLIC_API_BASE_URL=  # 空字串或不設定
API_BASE_URL=http://wasteland-tarot-app.zeabur.internal:8080
```

## 參考文件

- `.env.production.example` - 生產環境範例
- `.env.zeabur.example` - Zeabur 部署範例
- `src/lib/api/client.ts:70-72` - API Client 配置邏輯
