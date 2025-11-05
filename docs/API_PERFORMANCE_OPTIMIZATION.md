# API Performance Optimization

## 問題描述

Dashboard 載入 readings API 時出現嚴重性能問題：
- 請求時間：3378ms（3.4秒）
- 警告等級：VERY SLOW REQUEST

## 根本原因分析

### 1. N+1 查詢問題
在 `backend/app/api/v1/endpoints/readings.py` 的 `get_readings` 端點中：

**原有問題**：
- 對每個 reading 如果缺少 spread_template，會執行額外的資料庫查詢
- 最多會產生 3 次額外查詢每個 reading：
  1. 按 ID 查詢 template
  2. 查詢 card count
  3. 按 card count 查詢 template

**影響**：
- 假設返回 20 條 readings，最壞情況下會產生 60 次額外查詢
- 總查詢時間 = 基礎查詢 + (N × 額外查詢時間)

### 2. 缺少資料庫索引
`completed_readings` 表缺少以下重要索引：
- `created_at` 欄位沒有索引（常用於排序）
- 缺少複合索引 `(user_id, created_at)`
- 缺少過濾條件的索引（voice, karma, favorite 等）

## 已實施的優化

### 1. 批次載入模板（修復 N+1 問題）

**檔案**：`backend/app/api/v1/endpoints/readings.py`

**變更**：
```python
# 優化前：在循環中對每個 reading 查詢
for reading in readings_data:
    if not reading.spread_template:
        # 3 次資料庫查詢...

# 優化後：一次查詢所有缺少的模板
missing_template_ids = [...]
templates_query = select(SpreadTemplateModel).where(
    SpreadTemplateModel.id.in_(missing_template_ids)
)
templates_map = {...}
```

**效果**：
- 從 O(N×3) 減少到 O(1) 次額外查詢
- 預期減少 90% 的查詢時間

### 2. 資料庫索引建議

**檔案**：`sql/add_readings_indexes.sql`

建議添加以下索引：
```sql
-- 最重要：user_id + created_at 複合索引（用於排序）
CREATE INDEX idx_completed_readings_user_created 
ON completed_readings(user_id, created_at DESC);

-- 過濾條件索引
CREATE INDEX idx_completed_readings_user_voice ON ...
CREATE INDEX idx_completed_readings_user_karma ON ...
CREATE INDEX idx_completed_readings_user_favorite ON ...
```

**執行方式**：
```bash
# 在 Supabase SQL Editor 中執行
psql < sql/add_readings_indexes.sql
```

## 預期性能改善

| 指標 | 優化前 | 優化後 | 改善 |
|------|--------|--------|------|
| 查詢次數 | 1 + (N×3) | 2 | -95% |
| 響應時間 | 3378ms | <500ms | -85% |
| CPU 使用 | 高 | 低 | -70% |

## 監控與驗證

### 1. 檢查日誌
```bash
# 觀察請求時間
grep "GET /api/v1/readings/" backend/logs/*.log | grep "WARNING\|CRITICAL"
```

### 2. 性能測試
```bash
# 測試 API 響應時間
time curl "http://localhost:8000/api/v1/readings/?page=1&page_size=20" \
  -H "Authorization: Bearer <token>"
```

### 3. 資料庫查詢分析
```sql
-- 在 Supabase SQL Editor 中執行
EXPLAIN ANALYZE
SELECT * FROM completed_readings 
WHERE user_id = '<uuid>' 
ORDER BY created_at DESC 
LIMIT 20;
```

## 其他優化建議

### 短期（已實施）
- ✅ 修復 N+1 查詢問題
- ⏳ 添加資料庫索引（需在 Supabase 執行）

### 中期
- [ ] 考慮添加 Redis 快取層
- [ ] 實施 GraphQL DataLoader 模式
- [ ] 添加分頁游標（cursor-based pagination）

### 長期
- [ ] 考慮使用 materialized views
- [ ] 實施讀寫分離
- [ ] 使用 CDN 快取公開的 readings

## 相關檔案

- 後端 API：`backend/app/api/v1/endpoints/readings.py`
- 資料模型：`backend/app/models/reading_enhanced.py`
- SQL 腳本：`sql/add_readings_indexes.sql`
- 前端 API：`src/lib/api.ts`

## 結論

通過修復 N+1 查詢問題和添加適當的資料庫索引，預期可以將 readings API 的響應時間從 3.4 秒降低到 500ms 以下，大幅改善用戶體驗。

---

**更新日期**：2025-11-05  
**狀態**：代碼優化已完成，等待資料庫索引部署
