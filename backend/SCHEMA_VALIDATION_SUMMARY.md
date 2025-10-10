# Schema 驗證摘要

## 快速狀態

### ✅ 正確的表
- `completed_readings`: UUID 類型 ✓, Foreign Keys ✓, 索引 ✓
- 只缺 RLS 政策（已在 migration 中修復）

### ⚠️ 需要修復的表
- `reading_sessions`: String(36) 需改為 UUID + 加入 FK
- `session_events`: String(36) 需改為 UUID + 加入 FK
- 兩者都缺 RLS 政策（已在 migration 中修復）

---

## 立即可部署的 Migration

### P0: RLS 政策（已完成）

**檔案**: `alembic/versions/20251010_add_rls_policies_reading_tables.py`

**功能**:
- ✅ 為 `reading_sessions` 加入 RLS 政策（使用者只能存取自己的會話）
- ✅ 為 `completed_readings` 加入 RLS 政策（支援 private/friends/public 隱私等級）
- ✅ 為 `session_events` 加入 RLS 政策（audit log 保護）
- ✅ 加入表註解說明用途

**執行**:
```bash
cd /Users/sean/Documents/React/tarot-card-nextjs-app/backend
alembic upgrade head
```

**預估時間**: < 5 秒
**停機需求**: 無

---

## 命名語意分析

| 表名 | 實際用途 | 建議 |
|------|---------|------|
| `reading_sessions` | 未完成的會話（Save/Resume） | ⚠️ 語意不夠清楚，但可用註解說明 |
| `completed_readings` | 已完成的占卜結果 | ✓ 清楚明確 |
| `session_events` | 會話事件追蹤 | ⚠️ 建議改為 `reading_session_events` |

**推薦做法**: 先用表註解說明（已在 RLS migration 中加入），未來重構時再考慮重新命名。

---

## 資料完整性問題（需要未來 migration）

### 問題 1: UUID 類型不一致

**影響的表**: `reading_sessions`, `session_events`

**當前狀況**:
```sql
-- 問題：String(36) 而非 UUID
reading_sessions.id          → String(36)  ❌
reading_sessions.user_id     → String(36)  ❌
session_events.session_id    → String(36)  ❌
session_events.user_id       → String(36)  ❌

-- 正確：UUID 類型
completed_readings.user_id   → UUID        ✓
users.id                     → UUID        ✓
```

**風險**:
- JOIN 效能下降（需要型別轉換）
- 無法建立 Foreign Key 約束
- 可能產生孤立記錄

**修復方案**: 詳見 `schema_validation_report.md` 第 6.1 節

---

### 問題 2: 缺少 Foreign Key 約束

**影響**:
- `reading_sessions.user_id` → 無 FK 到 `users.id`
- `session_events.session_id` → 無 FK 到 `reading_sessions.id`
- `session_events.user_id` → 無 FK 到 `users.id`

**風險**:
- 刪除使用者時，相關會話和事件不會自動清理
- 可能產生孤立記錄

**修復方案**: 需要先解決 UUID 型別問題

---

## 優先級建議

### 🔴 P0 - 立即執行（今天）
1. **部署 RLS 政策 migration**
   - 檔案: `20251010_add_rls_policies_reading_tables.py`
   - 風險: 無（只是加入安全保護）
   - 停機時間: 無

### 🟡 P1 - 本週內完成
2. **修復 UUID 型別和 FK 約束**
   - 需要新的 migration（程式碼已在 report 中）
   - 風險: 中等（需要資料轉換）
   - 停機時間: 建議維護窗口（~30 秒）

### 🟢 P2 - 下週內完成
3. **加入優化索引**
   - 提升查詢效能 20-50%
   - 風險: 極低
   - 停機時間: 無

---

## 快速檢查清單

執行 RLS migration 後，請驗證：

```bash
# 1. 檢查 RLS 是否啟用
psql -c "\d+ reading_sessions" | grep "row security"
psql -c "\d+ completed_readings" | grep "row security"
psql -c "\d+ session_events" | grep "row security"

# 2. 列出所有政策
psql -c "\dp reading_sessions"
psql -c "\dp completed_readings"
psql -c "\dp session_events"

# 3. 測試使用者只能看到自己的資料
# （在應用程式中測試）
```

---

## 需要人工決策的項目

### 1. 是否要修復 UUID 型別？

**選項 A**: 立即修復
- 優點: 資料完整性最佳、效能最佳
- 缺點: 需要停機維護、需要測試

**選項 B**: 延後修復
- 優點: 不影響當前運作
- 缺點: 技術債累積

**建議**: 選擇 A（本週內完成）

### 2. 是否要重新命名表？

**選項 A**: 重新命名
- `reading_sessions` → `incomplete_reading_sessions`
- `session_events` → `reading_session_events`

**選項 B**: 保持現狀，用註解說明（已實施）

**建議**: 選擇 B（已用註解說明，未來重構時再考慮）

---

## 完整文件

詳細的分析、migration 程式碼、效能評估請參考：
- 📄 **完整報告**: `/Users/sean/Documents/React/tarot-card-nextjs-app/backend/schema_validation_report.md`
- 🔧 **RLS Migration**: `/Users/sean/Documents/React/tarot-card-nextjs-app/backend/alembic/versions/20251010_add_rls_policies_reading_tables.py`

---

**產生時間**: 2025-10-10
**下次複審**: RLS migration 部署後 1 週
