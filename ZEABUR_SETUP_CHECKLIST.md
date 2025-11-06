# Zeabur 部署設置檢查清單

## ✅ 前端服務 (Frontend Service) 環境變數

在 Zeabur Dashboard → Frontend Service → Environment Variables 中設置：

```bash
# ✅ 1. 後端 API (使用內部域名 - 伺服器端專用)
API_BASE_URL=http://wasteland-tarot-app.zeabur.internal:8080

# ✅ 2. Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://aelwaolzpraxmzjqdiyw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_anon_key

# ✅ 3. 網站 URL
NEXT_PUBLIC_SITE_URL=https://wt.ai-404.app

# ✅ 4. 功能開關 (可選)
NEXT_PUBLIC_BINGO_ENABLE=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_DEBUG_MODE=false
```

### ⚠️ 重要注意事項

- ❌ **不要**設置 `NEXT_PUBLIC_API_URL` 或 `NEXT_PUBLIC_API_BASE_URL`
- ✅ **使用** `API_BASE_URL` (沒有 NEXT_PUBLIC_ 前綴)
- ✅ 後端服務名稱應該與 Zeabur 中的實際服務名稱一致
- ✅ 端口應該與後端服務的 HTTP 端口一致 (通常是 8080)

## ✅ 後端服務 (Backend Service) 配置

### 1. Private Network 設置

確保後端服務在 Zeabur 中配置了 Private Network：

```
Settings → Private → Enable
Host: wasteland-tarot-app.zeabur.internal
Port: HTTP:8080
```

### 2. 環境變數

```bash
# 資料庫
DATABASE_URL=postgresql://user:pass@host:port/db

# 安全
SECRET_KEY=你的_secure_random_key
ENVIRONMENT=production

# CORS (允許前端域名)
FRONTEND_URL=https://wt.ai-404.app

# AI API Keys
ANTHROPIC_API_KEY=sk-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
```

## 🔍 驗證步驟

### 1. 檢查靜態資源

打開網站，檢查 Chrome DevTools → Console：

```
✅ 沒有 404 錯誤 (CSS/JS 正常載入)
❌ 如果有 404: 重新部署前端服務
```

### 2. 檢查 API 連接

打開網站，檢查 Chrome DevTools → Network：

```
✅ /api/v1/* 請求返回 200 或 401 (正常)
❌ 如果顯示 "URL scheme not supported": 
   → 檢查前端環境變數 API_BASE_URL
   → 確保客戶端代碼使用相對路徑 /api/v1/*
```

### 3. 檢查後端健康狀態

在終端執行：

```bash
# 方法 1: 通過前端 proxy
curl https://wt.ai-404.app/api/v1/health

# 方法 2: 如果後端有公開 URL (不推薦用於生產環境)
curl https://backend-public-url/api/v1/health
```

預期結果：
```json
{
  "status": "healthy",
  "timestamp": "2024-11-05T..."
}
```

### 4. 測試認證流程

1. ✅ 註冊新用戶
2. ✅ 登入
3. ✅ 檢查 cookies (Chrome DevTools → Application → Cookies)
   - 應該看到 `access_token` 和 `refresh_token`
4. ✅ 訪問需要認證的頁面 (如 /dashboard)

## 🐛 常見錯誤排查

### 錯誤 1: 靜態資源 404

**症狀**: CSS/JS 找不到

**解決**:
```bash
# 檢查 zbpack.json
cat zbpack.json

# 應該包含:
"build_command": "... && cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/"
```

### 錯誤 2: URL scheme not supported

**症狀**: Console 顯示 `wasteland-tarot-app.zeabur.internal is not supported`

**原因**: 客戶端代碼直接使用了內部域名

**解決**:
1. 檢查前端環境變數，確保使用 `API_BASE_URL` (不是 NEXT_PUBLIC_)
2. 確保客戶端代碼使用相對路徑: `/api/v1/*`
3. 檢查這些文件:
   - `src/lib/api/client.ts` (應該使用空字符串作為 baseURL)
   - 任何直接 fetch API 的組件 (應該使用 `/api/v1/*`)

### 錯誤 3: 502 Bad Gateway

**症狀**: API 請求返回 502

**可能原因**:
1. 後端服務未運行
2. 內部域名配置錯誤
3. 端口不匹配

**解決**:
1. 檢查後端服務日誌
2. 確認後端 Private Network 設置正確
3. 確認 `API_BASE_URL` 中的端口與後端服務一致

## 📝 架構圖

```
┌─────────────┐
│   瀏覽器     │
└──────┬──────┘
       │ /api/v1/* (相對路徑)
       ↓
┌─────────────────────────────────┐
│   Next.js Frontend (Zeabur)    │
│  ┌───────────────────────────┐  │
│  │   API Route Proxy         │  │
│  │   /api/v1/[...path]       │  │
│  │                           │  │
│  │   使用 API_BASE_URL       │  │
│  │   (server-side only)      │  │
│  └───────────┬───────────────┘  │
└──────────────┼──────────────────┘
               │ http://wasteland-tarot-app.zeabur.internal:8080
               ↓
       ┌───────────────────┐
       │  FastAPI Backend  │
       │    (Private)      │
       └───────────────────┘
```

## 🎯 成功標準

- [x] 網站正常載入，樣式正確
- [x] 沒有 404 錯誤
- [x] 沒有 "URL scheme not supported" 錯誤
- [x] 可以註冊新用戶
- [x] 可以登入/登出
- [x] Cookie 正確設置
- [x] Dashboard 頁面正常顯示
- [x] API 請求正常工作

## 📚 相關文檔

- [ZEABUR_DEPLOYMENT_GUIDE.md](./ZEABUR_DEPLOYMENT_GUIDE.md) - 完整部署指南
- [.env.zeabur.example](./.env.zeabur.example) - 環境變數範例
- [DOCKER_DEPLOYMENT_PLAN.md](./DOCKER_DEPLOYMENT_PLAN.md) - Docker 部署計劃
