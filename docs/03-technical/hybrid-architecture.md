# 混合前後端架構設計

## 🎯 架構概述

本專案採用前後端分離的混合架構，結合 Next.js 的優秀前端體驗和 FastAPI 的高效能後端處理。

## 🏗️ 技術棧

### 前端技術棧
```
Next.js 15          # React 框架
React 19           # UI 函式庫
TypeScript         # 型別安全
Tailwind CSS v4    # 樣式框架
shadcn/ui          # UI 組件庫
Zustand            # 狀態管理
React Query        # API 狀態管理
```

### 後端技術棧
```
FastAPI            # Python Web 框架
PostgreSQL         # 主資料庫
Redis              # 快取與會話儲存
SQLAlchemy         # ORM
Pydantic           # 資料驗證
JWT                # 認證機制
OpenAI API         # AI 解讀服務
```

## 🔄 架構遷移計劃

### 第一階段：基礎設施 (週 1-2)
- [ ] 建立 FastAPI 專案結構
- [ ] 設定 PostgreSQL 資料庫
- [ ] 配置 Redis 快取服務
- [ ] 實作 JWT 認證系統
- [ ] 建立基礎 API 文檔

### 第二階段：核心功能 (週 3-5)
- [ ] 遷移塔羅牌相關 API
- [ ] 實作用戶管理系統
- [ ] 建立占卜歷史功能
- [ ] 整合 OpenAI API 服務
- [ ] 前端 API 客戶端重構

### 第三階段：進階功能 (週 6-7)
- [ ] 實作社群功能
- [ ] 建立個人化推薦
- [ ] 效能最佳化
- [ ] 監控與日誌系統

## 📊 資料庫設計

### 核心資料表
```sql
-- 使用者表
users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- 塔羅牌表
tarot_cards (
  id SERIAL PRIMARY KEY,
  name VARCHAR,
  meaning_upright TEXT,
  meaning_reversed TEXT,
  image_url VARCHAR
)

-- 占卜記錄表
readings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  question TEXT,
  cards_drawn JSONB,
  interpretation TEXT,
  created_at TIMESTAMP
)
```

## 🔐 安全性考量

1. **認證機制**: JWT + Refresh Token
2. **API 限制**: Rate limiting 防止濫用
3. **資料驗證**: Pydantic 模型驗證
4. **CORS 配置**: 嚴格的跨域設定
5. **環境變數**: 敏感資訊環境變數管理

## 🚀 部署架構

```
┌─────────────────────────────────────────────┐
│              Zeabur Platform                 │
│  ┌──────────────┐      ┌──────────────┐    │
│  │   Frontend   │      │   Backend    │    │
│  │  Next.js 14  │ ───> │   FastAPI    │    │
│  │              │      │   Python     │    │
│  └──────────────┘      └──────────────┘    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│           Supabase Platform                  │
│  ┌──────────────┐  ┌──────────────┐        │
│  │  PostgreSQL  │  │  Edge Funcs  │        │
│  │   + pg_cron  │  │    (Deno)    │        │
│  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────┘
                    ↓
                Redis (Zeabur/Upstash)
```

## 📈 效能最佳化

1. **快取策略**:
   - Redis 快取常用塔羅牌資料
   - 占卜結果快取 24 小時
   - API 回應快取

2. **資料庫最佳化**:
   - 適當的索引設計
   - 查詢最佳化
   - 連接池管理

3. **API 設計**:
   - 分頁處理大量資料
   - 壓縮回應資料
   - 非同步處理長時間任務

## 🔍 監控與除錯

1. **日誌系統**: 結構化日誌記錄
2. **錯誤追蹤**: Sentry 整合
3. **效能監控**: API 回應時間監控
4. **健康檢查**: 定期健康狀態檢查

## 🎯 遷移策略

### 漸進式遷移
1. 保持現有 Next.js API routes 運作
2. 逐步建立對應的 FastAPI 端點
3. 前端逐步切換到新 API
4. 測試並驗證功能一致性
5. 移除舊的 API routes

### 風險緩解
- 功能開關控制新舊 API 切換
- 完整的測試覆蓋率
- 回滾計劃準備
- 監控關鍵指標

---

*此文件會隨著架構演進持續更新*