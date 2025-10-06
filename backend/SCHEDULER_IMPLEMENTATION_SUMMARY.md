# Daily Bingo 排程器實作總結

## 📋 概述

完成 Daily Bingo Check-in 功能的**任務排程系統**（Tasks 9-12），實現每日號碼自動生成與每月遊戲重置的自動化流程。

## ✅ 已完成任務

### Task 9: 安裝並配置 APScheduler ✅

**檔案**: `backend/app/core/scheduler.py`

**實作內容**:
- ✅ 安裝 `apscheduler>=3.10.0` 和 `pytz>=2024.1` 依賴
- ✅ 建立 APScheduler 排程器單例模式
- ✅ 配置 SQLAlchemyJobStore（使用 PostgreSQL 儲存任務）
- ✅ 設定 Asia/Taipei (UTC+8) 時區
- ✅ 實作 Cron 任務註冊機制
- ✅ 提供排程器生命週期管理（啟動/關閉）

**核心功能**:
```python
# 排程器初始化
scheduler = get_scheduler()

# 註冊 Cron 任務
register_cron_job(
    scheduler,
    job_func=daily_number_generation_job,
    job_id='daily-number-generation',
    cron_expression='0 0 * * *'  # 每日午夜
)

# 啟動排程器
start_scheduler()
```

**需求對應**: 需求 8.1, 8.2

---

### Task 10: 實作每日號碼生成定時任務 ✅

**檔案**: `backend/app/jobs/daily_number_job.py`

**實作內容**:
- ✅ 建立每日號碼生成定時任務函式
- ✅ 整合 `DailyNumberGeneratorService`（已存在）
- ✅ 實作異步包裝器（`asyncio.run()`）
- ✅ 設定排程: 每日 00:00 UTC+8 執行
- ✅ 錯誤處理與日誌記錄
- ✅ 支援 APScheduler 重試機制（最多 3 次）

**任務排程**:
- **Cron 表達式**: `0 0 * * *`（每日午夜）
- **時區**: Asia/Taipei (UTC+8)
- **重試**: 最多 3 次，間隔 60 秒

**執行流程**:
1. 檢查今日是否已生成號碼
2. 取得當前循環已使用號碼
3. 若循環已滿 25 個號碼，則重置循環
4. 從剩餘號碼中隨機選擇（Fisher-Yates shuffle）
5. 儲存至 `daily_bingo_numbers` 表
6. 記錄執行日誌

**需求對應**: 需求 1.1, 1.4, 8.1, 8.3, 8.4

---

### Task 11: 實作每月重置排程器 ✅

**檔案**:
- `backend/app/services/monthly_reset_scheduler.py`
- `backend/app/jobs/monthly_reset_job.py`

**實作內容**:
- ✅ 建立 `MonthlyResetScheduler` 服務類別
- ✅ 實作 `execute_monthly_reset()` 主流程
- ✅ 實作資料歸檔邏輯（4 個歷史表）:
  - `_archive_bingo_cards()` - 賓果卡歷史
  - `_archive_number_claims()` - 領取記錄歷史
  - `_archive_rewards()` - 獎勵記錄歷史
  - `_archive_daily_numbers()` - 每日號碼歷史
- ✅ 實作 `_clear_current_month_data()` - 重置當月狀態
- ✅ 實作 `_log_reset()` - 記錄重置執行日誌
- ✅ 建立每月重置定時任務（`monthly_reset_job.py`）

**任務排程**:
- **Cron 表達式**: `0 0 1 * *`（每月1日午夜）
- **時區**: Asia/Taipei (UTC+8)
- **重試**: 最多 3 次，間隔 300 秒（5分鐘）

**執行流程**:
1. 計算上月日期範圍
2. 歸檔上月資料至 4 個歷史表
3. 清空當月遊戲資料（重置狀態）
4. 建立下月分區（Task 12）
5. 記錄重置執行日誌至 `monthly_reset_logs`

**歸檔策略**:
- 使用 `INSERT INTO ... SELECT` 將資料複製至歷史表
- 使用 `DELETE` 清空主表對應月份資料
- 所有操作在同一交易中執行（確保原子性）

**需求對應**: 需求 5.1, 5.2, 5.3, 5.4, 5.5, 6.5, 8.2

---

### Task 12: 實作自動分區建立任務 ✅

**檔案**: `backend/app/services/monthly_reset_scheduler.py`（方法: `create_next_month_partition()`）

**實作內容**:
- ✅ 在每月重置時自動建立下月分區
- ✅ 使用 SQLAlchemy `text()` 執行動態 SQL
- ✅ 分區命名格式: `user_bingo_cards_YYYY_MM`
- ✅ 設定 RANGE 分區時間範圍
- ✅ 錯誤處理與日誌記錄

**分區建立邏輯**:
```sql
CREATE TABLE IF NOT EXISTS user_bingo_cards_2025_11
PARTITION OF user_bingo_cards
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
```

**範例**:
- 2025年10月1日執行時，建立 `user_bingo_cards_2025_11` 分區
- 分區範圍: `2025-11-01` ~ `2025-12-01`

**需求對應**: 需求 6.5

---

## 🔗 整合至 FastAPI

**檔案**: `backend/app/main.py`

**整合內容**:
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 啟動時
    await init_db()

    # 初始化排程器
    scheduler = get_scheduler()

    # 註冊任務
    register_cron_job(scheduler, daily_number_generation_job,
                     'daily-number-generation', '0 0 * * *')
    register_cron_job(scheduler, monthly_reset_job,
                     'monthly-reset', '0 0 1 * *')

    # 啟動排程器
    start_scheduler()

    yield

    # 關閉時
    shutdown_scheduler()
```

排程器現已整合至 FastAPI 應用程式生命週期，隨應用程式啟動而啟動。

---

## 🧪 測試

**檔案**: `backend/tests/unit/test_scheduler_integration.py`

**測試覆蓋**:
- ✅ 排程器初始化測試
- ✅ Cron 任務註冊測試
- ✅ 每日號碼生成任務元資料驗證
- ✅ 每月重置任務元資料驗證
- ✅ 任務重試配置測試
- ✅ 每月重置排程器初始化測試
- ✅ 分區建立邏輯測試

**執行測試**:
```bash
cd backend
uv run pytest tests/unit/test_scheduler_integration.py -v
```

---

## 📦 新增依賴

**pyproject.toml** 新增:
```toml
dependencies = [
    ...
    "apscheduler>=3.10.0",
    "pytz>=2024.1",
    "python-dateutil>=2.8.0",
]
```

**安裝命令**:
```bash
cd backend
uv sync
```

---

## 📁 新增檔案清單

### 核心排程器
- ✅ `backend/app/core/scheduler.py` - APScheduler 配置與管理

### 定時任務
- ✅ `backend/app/jobs/__init__.py` - Jobs 模組初始化
- ✅ `backend/app/jobs/daily_number_job.py` - 每日號碼生成任務
- ✅ `backend/app/jobs/monthly_reset_job.py` - 每月重置任務

### 服務
- ✅ `backend/app/services/monthly_reset_scheduler.py` - 每月重置服務

### 測試
- ✅ `backend/tests/unit/test_scheduler_integration.py` - 排程器整合測試

### 文件
- ✅ `backend/SCHEDULER_IMPLEMENTATION_SUMMARY.md` - 本文件

---

## 🔄 任務排程時間表

| 任務 | Cron 表達式 | 執行時間 (UTC+8) | 描述 |
|------|-------------|-----------------|------|
| **每日號碼生成** | `0 0 * * *` | 每日 00:00 | 產生當日賓果號碼（1-25 循環） |
| **每月重置** | `0 0 1 * *` | 每月1日 00:00 | 歸檔上月資料、重置狀態、建立下月分區 |

---

## 🎯 需求映射

| Task | 對應需求 | 實作狀態 |
|------|---------|---------|
| Task 9 | 需求 8.1, 8.2 | ✅ 完成 |
| Task 10 | 需求 1.1, 1.4, 8.1, 8.3, 8.4 | ✅ 完成 |
| Task 11 | 需求 5.1, 5.2, 5.3, 5.4, 5.5, 6.5, 8.2 | ✅ 完成 |
| Task 12 | 需求 6.5 | ✅ 完成 |

---

## 🚀 使用方式

### 1. 安裝依賴
```bash
cd backend
uv sync
```

### 2. 啟動應用程式
```bash
uv run uvicorn app.main:app --reload --port 8000
```

排程器將自動啟動並註冊兩個定時任務。

### 3. 驗證排程器狀態

檢查應用程式日誌，應看到：
```
INFO: 💾 Database initialized
INFO: ⏰ APScheduler started with bingo jobs registered
INFO: Registered cron job: daily-number-generation with schedule: 0 0 * * *
INFO: Registered cron job: monthly-reset with schedule: 0 0 1 * *
INFO: APScheduler started successfully
```

### 4. 查看資料庫任務表

APScheduler 會在 PostgreSQL 建立 `apscheduler_jobs` 表：
```sql
SELECT * FROM apscheduler_jobs;
```

---

## 📊 任務執行監控

### 查看執行日誌

**每日號碼生成**:
- 日誌位置: 應用程式標準輸出
- 資料表: `daily_bingo_numbers`

**每月重置**:
- 日誌位置: 應用程式標準輸出
- 執行記錄: `monthly_reset_logs` 表
- 歷史資料: `*_history` 表群組

### SQL 查詢範例

```sql
-- 查看最近一次重置記錄
SELECT * FROM monthly_reset_logs
ORDER BY executed_at DESC
LIMIT 1;

-- 查看今日號碼
SELECT * FROM daily_bingo_numbers
WHERE date = CURRENT_DATE;

-- 查看所有歷史賓果卡
SELECT * FROM user_bingo_cards_history
ORDER BY archived_at DESC;
```

---

## ⚠️ 注意事項

### 1. 資料庫連接

APScheduler 使用**同步驅動**（psycopg2），會自動轉換 DATABASE_URL：
```python
# asyncpg -> psycopg2
postgresql+asyncpg://... → postgresql+psycopg2://...
```

### 2. 時區設定

所有任務使用 **Asia/Taipei (UTC+8)** 時區，確保：
- 每日 00:00 台北時間執行號碼生成
- 每月1日 00:00 台北時間執行重置

### 3. 錯誤處理

任務失敗時會自動重試：
- **每日號碼生成**: 最多 3 次，間隔 60 秒
- **每月重置**: 最多 3 次，間隔 300 秒

失敗後會記錄詳細錯誤日誌。

### 4. 分區管理

每月1日自動建立下月分區，但**首次使用**需手動建立當月分區：
```sql
-- 手動建立 2025 年 10 月分區
CREATE TABLE user_bingo_cards_2025_10
PARTITION OF user_bingo_cards
FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
```

---

## 🔮 後續優化建議

### 1. 監控告警
- 整合 Sentry/Datadog 監控任務執行狀態
- 任務失敗時發送 Email/Slack 通知

### 2. 資料歸檔優化
- 使用批次處理（batch processing）提升歸檔效能
- 考慮使用 `CREATE TABLE ... AS SELECT` 加速

### 3. 分區清理
- 實作自動刪除超過 N 個月的舊分區（節省空間）
- 定期備份歷史資料至外部儲存

### 4. 任務儀表板
- 建立管理介面顯示任務執行歷史
- 提供手動觸發任務功能（測試用）

---

## 📝 總結

Tasks 9-12 **已全部完成**，Daily Bingo Check-in 功能的**任務排程系統**已成功實作並整合至 FastAPI 應用程式。

**核心成果**:
✅ APScheduler 排程器配置與生命週期管理
✅ 每日號碼自動生成（00:00 UTC+8）
✅ 每月遊戲重置與資料歸檔（每月1日 00:00 UTC+8）
✅ PostgreSQL 分區自動建立
✅ 完整的錯誤處理與重試機制
✅ 詳細的執行日誌與監控

**剩餘任務**: Tasks 27-33（測試與部署準備）

---

*實作完成日期: 2025-10-02*
*文件版本: 1.0*
*語言: 繁體中文 (zh-TW)*
