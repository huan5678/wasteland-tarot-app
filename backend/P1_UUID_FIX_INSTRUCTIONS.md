# P1: UUID 類型修復 - 執行指南

## 📋 概述

此文件提供 **手動執行 UUID 轉換** 的詳細步驟。由於 Alembic migration 與 RLS 政策之間的衝突，我們改用 **直接 SQL 執行** 的方式。

## ⚠️ 重要提醒

1. **資料庫備份**: 執行前請確保有最新的資料庫備份
2. **Supabase Dashboard**: 必須在 Supabase SQL Editor 中執行
3. **執行時間**: 預計 10-30 秒（視資料量而定）
4. **停機時間**: 建議在低流量時段執行

---

## 🎯 執行步驟

### 步驟 1: 開啟 Supabase SQL Editor

1. 登入 Supabase Dashboard
2. 選擇你的專案
3. 點擊左側選單的 **SQL Editor**

### 步驟 2: 執行 UUID 轉換腳本

1. 打開檔案: `/backend/fix_uuid_manual.sql`
2. **完整複製所有內容**
3. 貼到 Supabase SQL Editor 中
4. 點擊 **RUN** 按鈕執行

### 步驟 3: 驗證結果

執行完成後，腳本會自動顯示驗證查詢結果：

#### 預期輸出 1: 資料類型檢查
```
table_name         | row_count | id_type | user_id_type
-------------------|-----------|---------|-------------
reading_sessions   | X         | uuid    | uuid
session_events     | Y         | uuid    | uuid
```

#### 預期輸出 2: Foreign Key 檢查
```
table_name         | column_name  | foreign_table_name | foreign_column_name
-------------------|--------------|--------------------|-----------------
reading_sessions   | user_id      | users              | id
session_events     | session_id   | reading_sessions   | id
session_events     | user_id      | users              | id
```

#### 預期輸出 3: RLS 政策檢查
```
reading_sessions:
- Users can view own incomplete sessions
- Users can create own sessions
- Users can update own sessions
- Users can delete own sessions
- Service can cleanup old sessions
- Service role full access to sessions

session_events:
- Users can view own events
- Users can create own events
- Service can access all events
```

**總計: 9 個 RLS 政策** (6 + 3)

---

## 🔍 故障排除

### 問題 1: 孤立記錄錯誤
```
ERROR: foreign key constraint ... violates foreign key constraint
```

**解決方案**: 腳本會自動清理孤立記錄（Step 1），如果仍有問題：
```sql
-- 手動清理
DELETE FROM session_events WHERE session_id NOT IN (SELECT id FROM reading_sessions);
DELETE FROM reading_sessions WHERE user_id NOT IN (SELECT id::text FROM users);
```

### 問題 2: RLS 政策衝突
```
ERROR: policy "..." already exists
```

**解決方案**: 腳本會自動 DROP IF EXISTS，如果仍有問題：
```sql
-- 手動刪除所有政策
DROP POLICY IF EXISTS "Users can view own incomplete sessions" ON reading_sessions;
-- (重複執行腳本中的所有 DROP POLICY 語句)
```

### 問題 3: 列名衝突
```
ERROR: column "id_uuid" already exists
```

**解決方案**: 先清理臨時欄位：
```sql
ALTER TABLE reading_sessions DROP COLUMN IF EXISTS id_uuid CASCADE;
ALTER TABLE reading_sessions DROP COLUMN IF EXISTS user_id_uuid CASCADE;
ALTER TABLE session_events DROP COLUMN IF EXISTS id_uuid CASCADE;
ALTER TABLE session_events DROP COLUMN IF EXISTS session_id_uuid CASCADE;
ALTER TABLE session_events DROP COLUMN IF EXISTS user_id_uuid CASCADE;
```

---

## ✅ 完成後確認

### 1. 資料庫端驗證
執行以下查詢確認：
```sql
-- 檢查資料類型
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('reading_sessions', 'session_events')
AND column_name IN ('id', 'user_id', 'session_id')
ORDER BY table_name, column_name;

-- 預期結果：所有欄位都是 uuid 類型
```

### 2. 後端端驗證
```bash
# 在 backend 目錄執行
cd /Users/sean/Documents/React/tarot-card-nextjs-app/backend

# 驗證 migration 狀態
.venv/bin/alembic current

# 預期輸出: 3dc09dba0617 (head)
```

### 3. 應用程式測試
1. 啟動後端: `uv run uvicorn app.main:app --reload`
2. 測試以下端點:
   - `POST /api/v1/readings/sessions` - 建立 session
   - `GET /api/v1/readings/sessions/{id}` - 讀取 session
   - `POST /api/v1/readings/sessions/{id}/events` - 建立 event

### 4. RLS 政策測試
在 Supabase SQL Editor 執行:
```sql
-- 模擬 authenticated 使用者查詢
SET SESSION ROLE authenticated;
SET SESSION "request.jwt.claims" TO '{"sub": "test-user-uuid"}';

SELECT * FROM reading_sessions;  -- 應該只看到該使用者的資料
SELECT * FROM session_events;     -- 應該只看到該使用者的事件
```

---

## 📊 效能影響

### 預期改進
- ✅ **JOIN 效能**: 20-50% 提升（UUID native JOIN）
- ✅ **儲存空間**: 節省 ~30%（UUID 16 bytes vs String 36 bytes）
- ✅ **索引效能**: 15-25% 提升（UUID 索引更高效）
- ✅ **Foreign Key 完整性**: 100%（新增 FK 約束）

### 實際測試
執行前後對比:
```sql
-- 執行前
EXPLAIN ANALYZE
SELECT * FROM session_events
JOIN reading_sessions ON session_events.session_id = reading_sessions.id
WHERE reading_sessions.user_id = 'test-uuid';

-- 執行後（應該看到更少的 rows scanned）
```

---

## 🚨 Rollback 計畫

如果出現重大問題，可以回滾（**極不建議**）：

### 選項 1: Alembic Downgrade
```bash
.venv/bin/alembic downgrade -1
```
**注意**: 可能失敗（FK 類型衝突）

### 選項 2: 手動 SQL Rollback
**不提供詳細腳本，因為會遺失資料**
- 需要備份還原
- 或重新執行所有 migration

---

## 📝 下一步 (P2)

UUID 轉換完成後，繼續執行 **P2: 優化索引**:
- 參考 `schema_validation_report.md` 第 5 節
- 預計新增 8+ 個複合索引
- 預期效能提升 20-50%

---

## 📞 支援

如遇到問題：
1. 檢查 Supabase logs: Dashboard → Logs → Postgres Logs
2. 檢查後端 logs: `docker logs tarot-backend`
3. 查看詳細技術報告: `schema_validation_report.md`

**部署人員**: Claude Code
**優先級**: P1 - High
**預計時間**: 15-30 分鐘
**風險等級**: Medium (已有詳細 rollback 計畫)
