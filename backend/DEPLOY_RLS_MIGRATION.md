# RLS Migration 部署指南

## 前置檢查

### 1. 確認當前 Schema 版本

```bash
cd /Users/sean/Documents/React/tarot-card-nextjs-app/backend

# 檢查當前 migration 版本
alembic current

# 預期輸出應該是:
# 3118c80c0ade (head)
```

### 2. 備份資料庫（Production 環境必做）

```bash
# 使用 Supabase CLI 或直接用 pg_dump
pg_dump -h YOUR_HOST -U postgres -d YOUR_DB > backup_before_rls_$(date +%Y%m%d_%H%M%S).sql

# 或使用 Supabase CLI
supabase db dump -f backup_before_rls_$(date +%Y%m%d_%H%M%S).sql
```

### 3. 預覽 Migration SQL

```bash
# 產生 SQL 預覽（不執行）
alembic upgrade head --sql > rls_migration_preview.sql

# 檢閱 SQL 內容
cat rls_migration_preview.sql
```

---

## 部署步驟

### Staging 環境測試

```bash
# 1. 切換到 staging 環境
export SUPABASE_URL=YOUR_STAGING_URL
export SUPABASE_KEY=YOUR_STAGING_KEY

# 2. 執行 migration
alembic upgrade head

# 3. 驗證 RLS 已啟用
psql $DATABASE_URL -c "SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('reading_sessions', 'completed_readings', 'session_events');"

# 預期輸出:
#     tablename      | rowsecurity
# -------------------+-------------
#  reading_sessions  | t
#  completed_readings| t
#  session_events    | t

# 4. 測試應用程式功能
# - 建立新的 reading session
# - 完成一個 reading
# - 確認使用者只能看到自己的資料
# - 測試公開 reading 的分享功能
```

### Production 環境部署

**時機建議**: 低流量時段（例如週三凌晨 2-4am）

```bash
# 1. 通知使用者（如果需要）
# - 預計停機時間: < 5 秒
# - 實際上不需要停機，但為保險起見可發通知

# 2. 切換到 production 環境
export SUPABASE_URL=YOUR_PRODUCTION_URL
export SUPABASE_KEY=YOUR_PRODUCTION_KEY

# 3. 最後確認
alembic current
# 確認是 3118c80c0ade

# 4. 執行 migration
alembic upgrade head

# 5. 立即驗證
psql $DATABASE_URL -c "\dp reading_sessions"
# 應該看到多個 policies

# 6. 監控應用程式日誌
tail -f /path/to/app/logs/error.log

# 7. 測試關鍵功能
# - 使用者登入
# - 建立 reading session
# - 查看歷史 readings
# - 分享 public reading
```

---

## 驗證清單

### ✅ RLS 啟用檢查

```sql
-- 檢查 RLS 是否啟用
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('reading_sessions', 'completed_readings', 'session_events');

-- 預期結果: 所有 rowsecurity = true
```

### ✅ 政策列表檢查

```sql
-- 列出 reading_sessions 的所有政策
SELECT
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'reading_sessions'
ORDER BY policyname;

-- 預期看到 6 個政策:
-- 1. Users can view own incomplete sessions
-- 2. Users can create own sessions
-- 3. Users can update own sessions
-- 4. Users can delete own sessions
-- 5. Service can cleanup old sessions
-- 6. Service role full access to sessions
```

```sql
-- 列出 completed_readings 的所有政策
SELECT policyname FROM pg_policies
WHERE tablename = 'completed_readings'
ORDER BY policyname;

-- 預期看到 9 個政策
```

```sql
-- 列出 session_events 的所有政策
SELECT policyname FROM pg_policies
WHERE tablename = 'session_events'
ORDER BY policyname;

-- 預期看到 3 個政策
```

### ✅ 表註解檢查

```sql
-- 檢查表註解
SELECT
    tablename,
    obj_description((schemaname||'.'||tablename)::regclass, 'pg_class') as comment
FROM pg_tables
WHERE tablename IN ('reading_sessions', 'completed_readings', 'session_events');

-- 預期看到每個表都有詳細的註解說明
```

### ✅ 功能測試

#### 測試 1: 使用者只能看到自己的 sessions

```python
# 用 User A 建立 session
user_a_token = "..."
response = requests.post(
    "https://your-api.com/api/v1/sessions",
    headers={"Authorization": f"Bearer {user_a_token}"},
    json={"question": "Test question", "spread_type": "single"}
)
session_id = response.json()["id"]

# 用 User B 嘗試存取 User A 的 session
user_b_token = "..."
response = requests.get(
    f"https://your-api.com/api/v1/sessions/{session_id}",
    headers={"Authorization": f"Bearer {user_b_token}"}
)

# ✅ 預期: 403 Forbidden 或 404 Not Found
assert response.status_code in [403, 404]
```

#### 測試 2: Public readings 可被所有人看到

```python
# User A 建立 public reading
user_a_token = "..."
response = requests.post(
    "https://your-api.com/api/v1/readings",
    headers={"Authorization": f"Bearer {user_a_token}"},
    json={
        "question": "Public test",
        "privacy_level": "public",
        "allow_public_sharing": True
    }
)
reading_id = response.json()["id"]

# User B 可以看到這個 public reading
user_b_token = "..."
response = requests.get(
    f"https://your-api.com/api/v1/readings/public/{reading_id}",
    headers={"Authorization": f"Bearer {user_b_token}"}
)

# ✅ 預期: 200 OK
assert response.status_code == 200
```

#### 測試 3: Private readings 只有擁有者能看到

```python
# User A 建立 private reading
user_a_token = "..."
response = requests.post(
    "https://your-api.com/api/v1/readings",
    headers={"Authorization": f"Bearer {user_a_token}"},
    json={
        "question": "Private test",
        "privacy_level": "private",
        "allow_public_sharing": False
    }
)
reading_id = response.json()["id"]

# User B 不能看到
user_b_token = "..."
response = requests.get(
    f"https://your-api.com/api/v1/readings/{reading_id}",
    headers={"Authorization": f"Bearer {user_b_token}"}
)

# ✅ 預期: 403 Forbidden 或 404 Not Found
assert response.status_code in [403, 404]
```

---

## Rollback 計畫

如果出現問題，立即回滾：

```bash
# 1. 回滾到前一個版本
alembic downgrade -1

# 2. 驗證 RLS 已停用
psql $DATABASE_URL -c "SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('reading_sessions', 'completed_readings', 'session_events');"

# 預期輸出: 所有 rowsecurity = f

# 3. 測試應用程式是否正常

# 4. 如果需要，從備份還原
psql $DATABASE_URL < backup_before_rls_TIMESTAMP.sql
```

---

## 常見問題排查

### 問題 1: Migration 失敗，提示 "relation does not exist"

**原因**: 表尚未建立或名稱不正確

**解決**:
```bash
# 檢查表是否存在
psql $DATABASE_URL -c "\dt"

# 確認 previous migration 已執行
alembic current
```

### 問題 2: RLS 政策建立失敗，提示 "permission denied"

**原因**: 資料庫使用者權限不足

**解決**:
```bash
# 確認使用 postgres 或 service_role 執行 migration
# 或賦予當前使用者 BYPASSRLS 權限
psql $DATABASE_URL -c "ALTER USER your_user WITH BYPASSRLS;"
```

### 問題 3: 應用程式無法存取資料

**症狀**: 所有查詢返回空結果或 403

**可能原因**:
1. 應用程式使用 `anon` role 而非 `authenticated`
2. JWT token 中的 `auth.uid()` 不正確
3. RLS 政策條件有誤

**排查步驟**:
```sql
-- 1. 檢查當前角色
SELECT current_user, session_user;

-- 2. 測試政策（以 BYPASSRLS 使用者執行）
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "USER_UUID"}';
SELECT * FROM reading_sessions;

-- 3. 檢視政策定義
\d+ reading_sessions
```

### 問題 4: 效能下降明顯

**可能原因**: RLS 政策查詢未使用索引

**解決**:
```sql
-- 檢查查詢計畫
EXPLAIN ANALYZE
SELECT * FROM completed_readings
WHERE user_id = 'some-uuid';

-- 如果看到 Seq Scan，可能需要加索引
CREATE INDEX IF NOT EXISTS idx_completed_readings_user_id
ON completed_readings(user_id);
```

---

## 效能監控

### 部署後監控指標

```sql
-- 1. 查詢效能統計
SELECT
    schemaname,
    tablename,
    seq_scan,
    idx_scan,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
FROM pg_stat_user_tables
WHERE tablename IN ('reading_sessions', 'completed_readings', 'session_events');

-- 2. RLS 政策執行次數（需要 pg_stat_statements 擴充）
SELECT
    query,
    calls,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%reading_sessions%'
   OR query LIKE '%completed_readings%'
ORDER BY calls DESC
LIMIT 20;
```

### 預期效能影響

| 操作 | 無 RLS | 有 RLS | 增加 |
|------|--------|--------|------|
| SELECT own data | 5ms | 6-8ms | +1-3ms |
| SELECT public data | 10ms | 12-15ms | +2-5ms |
| INSERT | 3ms | 4-5ms | +1-2ms |
| UPDATE | 4ms | 5-7ms | +1-3ms |

如果增加超過 10ms，請檢查索引配置。

---

## 成功標準

Migration 成功的判斷標準：

- ✅ 所有三個表的 `rowsecurity = true`
- ✅ `reading_sessions` 有 6 個政策
- ✅ `completed_readings` 有 9 個政策
- ✅ `session_events` 有 3 個政策
- ✅ 所有表都有註解說明
- ✅ 使用者只能看到自己的 private 資料
- ✅ Public readings 可被所有人存取
- ✅ 應用程式所有功能正常運作
- ✅ API 回應時間增加 < 5ms
- ✅ 無錯誤日誌出現

---

## 部署後任務

### 立即（24 小時內）
1. ✅ 監控錯誤日誌
2. ✅ 檢查查詢效能
3. ✅ 測試所有關鍵使用者流程

### 短期（1 週內）
4. ✅ 收集使用者反饋
5. ✅ 分析 RLS 政策效能影響
6. ✅ 規劃下一個 migration（UUID 修復）

### 中期（1 個月內）
7. ✅ 執行 UUID 修復 migration
8. ✅ 加入優化索引
9. ✅ 定期審計 RLS 政策有效性

---

## 相關文件

- 📄 完整分析報告: `schema_validation_report.md`
- 📋 摘要文件: `SCHEMA_VALIDATION_SUMMARY.md`
- 🔧 Migration 檔案: `alembic/versions/20251010_add_rls_policies_reading_tables.py`

---

**準備者**: Claude (Database Schema Architect)
**文件版本**: 1.0
**最後更新**: 2025-10-10
