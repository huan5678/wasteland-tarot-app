# Backend Health Check

## 概述

解決 Zeabur serverless backend 冷啟動問題的前端健康檢查機制。

## 問題

部署在 Zeabur 的應用遇到間歇性錯誤：後端休眠後需要冷啟動，用戶從任何頁面進入都可能遇到 API 請求失敗。

## 解決方案

在應用啟動時先檢查後端健康狀態，等待後端喚醒後再載入應用。

## 實作檔案

1. **Health Check API**: `src/app/api/v1/health/route.ts`
2. **Provider**: `src/components/providers/BackendHealthCheck.tsx`
3. **Integration**: `src/app/layout.tsx`

## 使用方式

### 開發環境

確保後端在 `http://localhost:8000` 運行：

```bash
# Terminal 1: Start backend
cd backend
uv run uvicorn main:app --reload

# Terminal 2: Start frontend
bun run dev
```

訪問 `http://localhost:3000`，應用會先執行 health check。

### 生產環境 (Zeabur)

設定環境變數：

```env
API_BASE_URL=http://wasteland-tarot-app.zeabur.internal:8080
```

部署後，應用會自動：
1. 檢查後端健康狀態
2. 如果後端休眠，顯示 Loading 並重試
3. 後端喚醒後，正常載入應用

## 特性

✅ 純前端解決方案（不修改後端）
✅ 適用於所有頁面入口
✅ 自動重試機制（最多 10 次）
✅ 使用者友善的 Loading 畫面
✅ Fallout 風格設計
✅ 詳細的錯誤處理

## 測試

### Local Health Check

```bash
# 測試 health endpoint
curl http://localhost:3000/api/v1/health

# 應回傳:
# {"status":"🟢 Healthy", "timestamp": ..., "components": {...}}
```

### Cold Start 模擬

```bash
# 1. 關閉後端
# 2. 訪問前端
# 3. 觀察 Loading 畫面
# 4. 啟動後端
# 5. 觀察應用正常載入
```

## 狀態

✅ 已完成實作
🚀 準備部署到 Zeabur
