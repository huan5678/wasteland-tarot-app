# 成就系統測試指南

## 📋 測試概覽

本指南提供完整的手動測試步驟，用於驗證成就系統後端功能的正確性。

**測試環境**: Development
**預計時間**: 30-45 分鐘
**必要條件**:
- 後端服務已啟動
- 資料庫連線正常
- 已執行 Alembic migrations

---

## 🚀 準備工作

### 1. 執行資料庫 Migration

```bash
cd backend

# 檢查當前 migration 版本
uv run alembic current

# 執行 migration (升級到最新版本)
uv run alembic upgrade head

# 驗證成就系統的表已建立
# (應該看到 achievements 和 user_achievement_progress 表)
```

### 2. 執行成就種子資料

```bash
cd backend

# 插入 15 個初始成就
python scripts/run_achievement_seeds.py
```

**預期輸出**:
```
🌱 Seeding achievements...
✅ Seed complete!
   New achievements: 15
   Updated achievements: 0
   Total achievements: 15
```

### 3. 啟動後端服務

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

### 4. 開啟 Swagger UI

瀏覽器訪問: `http://localhost:8000/docs`

應該看到新的 API 端點群組：**🏆 Achievements**

---

## 🧪 測試案例

### 測試案例 1: 查詢所有成就定義

**目標**: 驗證成就查詢 API 正常運作

**步驟**:
1. 在 Swagger UI 中找到 `GET /api/v1/achievements`
2. 點擊 "Try it out"
3. 不填寫任何參數 (預設查詢所有成就)
4. 點擊 "Execute"

**預期結果**:
- HTTP 狀態碼: `200 OK`
- 回應包含:
  ```json
  {
    "achievements": [...],  // 15 個成就 (14 個可見 + 1 個隱藏)
    "total": 14,  // 隱藏成就不計入
    "category_filter": null
  }
  ```
- 成就依 `display_order` 排序
- 隱藏成就 (MIDNIGHT_DIVINER) 不在列表中

**驗證點**:
- [ ] 回應包含 14 個成就 (MIDNIGHT_DIVINER 被過濾)
- [ ] 每個成就包含所有必要欄位 (id, code, name, description, etc.)
- [ ] `criteria` 和 `rewards` 為 JSON 物件

---

### 測試案例 2: 依分類查詢成就

**目標**: 驗證分類篩選功能

**步驟**:
1. 在 Swagger UI 中找到 `GET /api/v1/achievements`
2. 點擊 "Try it out"
3. 在 `category` 下拉選單中選擇 "READING"
4. 點擊 "Execute"

**預期結果**:
- HTTP 狀態碼: `200 OK`
- 回應包含:
  ```json
  {
    "achievements": [...],  // 4 個 READING 類別成就
    "total": 4,
    "category_filter": "READING"
  }
  ```
- 成就代碼: FIRST_READING, READING_APPRENTICE, CELTIC_CROSS_INITIATE, MAJOR_ARCANA_COLLECTOR

**驗證點**:
- [ ] 只返回 READING 類別的成就
- [ ] `category_filter` 正確顯示為 "READING"
- [ ] 所有成就的 `category` 欄位都是 "READING"

**重複測試其他分類**:
- SOCIAL (3 個)
- BINGO (3 個)
- KARMA (2 個)
- EXPLORATION (2 個，MIDNIGHT_DIVINER 被隱藏)

---

### 測試案例 3: 查詢使用者成就進度 (需要認證)

**目標**: 驗證使用者進度查詢 API

**前置條件**: 需要有效的 JWT token

**步驟**:
1. 先登入或註冊一個測試使用者
   - 使用 `POST /api/v1/auth/register` 或 `POST /api/v1/auth/login`
   - 取得 `access_token`

2. 在 Swagger UI 右上角點擊 "Authorize"
3. 輸入: `Bearer {your_access_token}`
4. 點擊 "Authorize" 和 "Close"

5. 找到 `GET /api/v1/achievements/progress`
6. 點擊 "Try it out"
7. 不填寫參數
8. 點擊 "Execute"

**預期結果**:
- HTTP 狀態碼: `200 OK`
- 回應包含:
  ```json
  {
    "user_id": "...",
    "total_achievements": 15,
    "unlocked_count": 0,  // 新使用者
    "claimed_count": 0,
    "in_progress_count": 15,
    "completion_percentage": 0.0,
    "achievements": [
      {
        "id": "",  // 臨時進度
        "achievement": {...},
        "current_progress": 0,
        "target_progress": 1,
        "progress_percentage": 0.0,
        "status": "IN_PROGRESS",
        "unlocked_at": null,
        "claimed_at": null
      },
      ...
    ]
  }
  ```

**驗證點**:
- [ ] 返回所有 15 個成就的進度 (包含隱藏成就，因為這是完整進度查詢)
- [ ] 新使用者的所有成就狀態為 "IN_PROGRESS"
- [ ] `current_progress` 都是 0
- [ ] `achievement` 物件包含完整的成就定義

---

### 測試案例 4: 領取獎勵 (失敗案例 - 尚未解鎖)

**目標**: 驗證錯誤處理 - 嘗試領取尚未解鎖的成就

**前置條件**: 已認證的使用者

**步驟**:
1. 確認已在 Swagger UI 中認證 (Bearer token)
2. 找到 `POST /api/v1/achievements/{code}/claim`
3. 點擊 "Try it out"
4. 在 `code` 欄位輸入: `FIRST_READING`
5. 點擊 "Execute"

**預期結果**:
- HTTP 狀態碼: `400 Bad Request`
- 錯誤回應:
  ```json
  {
    "detail": {
      "error": "ACHIEVEMENT_NOT_UNLOCKED",
      "message": "此成就尚未解鎖（進度: 0/1）",
      "detail": {
        "achievement_code": "FIRST_READING"
      },
      "timestamp": "2025-10-22T..."
    }
  }
  ```

**驗證點**:
- [ ] 正確返回 400 錯誤
- [ ] 錯誤訊息為繁體中文
- [ ] 錯誤類型為 "ACHIEVEMENT_NOT_UNLOCKED"
- [ ] 包含當前進度資訊

---

### 測試案例 5: 查詢成就總覽統計

**目標**: 驗證總覽統計 API

**前置條件**: 已認證的使用者

**步驟**:
1. 確認已在 Swagger UI 中認證
2. 找到 `GET /api/v1/achievements/summary`
3. 點擊 "Try it out"
4. 點擊 "Execute"

**預期結果**:
- HTTP 狀態碼: `200 OK`
- 回應包含:
  ```json
  {
    "user_id": "...",
    "overall": {
      "user_id": "...",
      "total_achievements": 15,
      "unlocked_count": 0,
      "claimed_count": 0,
      "in_progress_count": 15,
      "completion_percentage": 0.0
    },
    "by_category": {
      "READING": {
        "total": 4,
        "unlocked": 0,
        "claimed": 0,
        "completion_percentage": 0.0
      },
      "SOCIAL": {...},
      "BINGO": {...},
      "KARMA": {...},
      "EXPLORATION": {...}
    }
  }
  ```

**驗證點**:
- [ ] `overall` 顯示正確的總統計
- [ ] `by_category` 包含所有 5 個分類
- [ ] 各分類的數量總和 = 總成就數量 (15)

---

### 測試案例 6: 手動解鎖成就 (模擬進度)

**目標**: 驗證成就解鎖與獎勵領取的完整流程

**注意**: 由於尚未整合業務流程觸發，我們需要直接操作資料庫來模擬進度

#### 6.1 直接在資料庫中更新進度 (使用 SQL 或 Supabase Dashboard)

```sql
-- 假設你的 user_id 是 '123e4567-e89b-12d3-a456-426614174000'
-- 假設 FIRST_READING 成就的 id 是 '...'

-- 1. 建立進度記錄
INSERT INTO user_achievement_progress (
  id,
  user_id,
  achievement_id,
  current_progress,
  target_progress,
  status,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  '123e4567-e89b-12d3-a456-426614174000',  -- 你的 user_id
  id,
  1,  -- 達成目標
  1,
  'UNLOCKED',
  NOW(),
  NOW()
FROM achievements
WHERE code = 'FIRST_READING';

-- 2. 設定解鎖時間
UPDATE user_achievement_progress
SET unlocked_at = NOW()
WHERE achievement_id = (SELECT id FROM achievements WHERE code = 'FIRST_READING')
  AND user_id = '123e4567-e89b-12d3-a456-426614174000';
```

#### 6.2 驗證進度更新

**步驟**:
1. 重新查詢 `GET /api/v1/achievements/progress`
2. 找到 FIRST_READING 成就

**預期結果**:
```json
{
  "achievement": {
    "code": "FIRST_READING",
    ...
  },
  "current_progress": 1,
  "target_progress": 1,
  "progress_percentage": 100.0,
  "status": "UNLOCKED",
  "unlocked_at": "2025-10-22T...",
  "claimed_at": null
}
```

**驗證點**:
- [ ] 狀態變為 "UNLOCKED"
- [ ] `progress_percentage` 為 100.0
- [ ] `unlocked_at` 有值
- [ ] `claimed_at` 為 null

#### 6.3 領取獎勵

**步驟**:
1. 呼叫 `POST /api/v1/achievements/FIRST_READING/claim`

**預期結果**:
- HTTP 狀態碼: `200 OK`
- 回應:
  ```json
  {
    "success": true,
    "achievement_code": "FIRST_READING",
    "rewards": {
      "karma_points": 50,
      "title": "廢土占卜師"
    },
    "message": "獎勵領取成功！你獲得了 50 Karma 點數 和 「廢土占卜師」稱號",
    "claimed_at": "2025-10-22T..."
  }
  ```

**驗證點**:
- [ ] 成功領取獎勵
- [ ] 回應包含 Karma 點數和稱號
- [ ] 訊息為繁體中文

#### 6.4 驗證 Karma 點數增加

**步驟**:
1. 查詢使用者資料 `GET /api/v1/users/me` 或查看 users 表
2. 檢查 `karma_score` 是否增加了 50 點

**預期結果**:
- 使用者的 `karma_score` = 原始值 + 50

#### 6.5 驗證稱號授予

**步驟**:
1. 查詢 user_profiles 表
2. 檢查 `current_title` 和 `unlocked_titles`

**預期結果**:
- `current_title` = "廢土占卜師" (如果之前沒有稱號)
- `unlocked_titles` 包含 "廢土占卜師"

#### 6.6 重複領取 (應失敗)

**步驟**:
1. 再次呼叫 `POST /api/v1/achievements/FIRST_READING/claim`

**預期結果**:
- HTTP 狀態碼: `400 Bad Request`
- 錯誤類型: "ACHIEVEMENT_ALREADY_CLAIMED"
- 錯誤訊息: "此成就的獎勵已經領取過了"

---

## 🔍 深度測試 (可選)

### 測試成就檢查引擎

**目標**: 直接測試 `AchievementChecker` 的進度計算

**方法**: 撰寫 Python 腳本或使用 Jupyter Notebook

```python
import asyncio
from app.db.session import get_db_session
from app.services.achievement_checker import AchievementChecker
from uuid import UUID

async def test_checker():
    db = get_db_session()
    checker = AchievementChecker(db)

    user_id = UUID("123e4567-e89b-12d3-a456-426614174000")  # 你的 user_id

    # 獲取 FIRST_READING 成就
    from sqlalchemy import select
    from app.models.achievement import Achievement

    result = await db.execute(
        select(Achievement).where(Achievement.code == "FIRST_READING")
    )
    achievement = result.scalar_one()

    # 檢查進度
    progress = await checker.check_achievement_progress(user_id, achievement)
    print(f"Progress: {progress}")

    await db.close()

asyncio.run(test_checker())
```

**預期輸出**:
```python
Progress: {
    'current_progress': 0,  # 根據實際占卜次數
    'target_progress': 1,
    'is_completed': False
}
```

---

### 測試資料庫索引效能

**目標**: 驗證索引是否正確建立並提升查詢效能

```sql
-- 查看索引
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('achievements', 'user_achievement_progress')
ORDER BY tablename, indexname;

-- 分析查詢計劃 (應該使用索引)
EXPLAIN ANALYZE
SELECT * FROM user_achievement_progress
WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'
  AND status = 'IN_PROGRESS';
```

**預期**: Query plan 應顯示使用 `idx_user_achievement_user_status` 複合索引

---

## ✅ 測試檢查清單

### 基本功能測試
- [ ] Migration 成功執行
- [ ] 種子資料成功插入 (15 個成就)
- [ ] GET /achievements 返回 14 個成就 (隱藏成就被過濾)
- [ ] GET /achievements?category=READING 正確篩選
- [ ] GET /achievements/progress 需要認證
- [ ] GET /achievements/progress 返回完整進度 (包含臨時進度)
- [ ] GET /achievements/summary 返回正確統計
- [ ] POST /achievements/{code}/claim 驗證錯誤處理

### 錯誤處理測試
- [ ] 尚未解鎖時無法領取 (400 ACHIEVEMENT_NOT_UNLOCKED)
- [ ] 已領取時無法重複領取 (400 ACHIEVEMENT_ALREADY_CLAIMED)
- [ ] 不存在的成就代碼 (404 ACHIEVEMENT_NOT_FOUND)
- [ ] 未認證時無法查詢進度 (401 Unauthorized)

### 獎勵發放測試 (手動模擬)
- [ ] Karma 點數正確增加
- [ ] 稱號正確授予
- [ ] 成就狀態更新為 CLAIMED
- [ ] claimed_at 時間戳記正確

### 資料完整性測試
- [ ] 外鍵約束正常運作
- [ ] 檢查約束防止無效值
- [ ] 唯一約束防止重複 code

### 效能測試 (可選)
- [ ] 索引正確建立
- [ ] 查詢使用索引 (EXPLAIN ANALYZE)
- [ ] 大量資料下的查詢效能

---

## 🐛 常見問題與解決方案

### Q1: Migration 執行失敗

**錯誤**: `sqlalchemy.exc.OperationalError: could not translate host name`

**解決方案**:
- 檢查 `.env` 檔案中的 `DATABASE_URL` 是否正確
- 確認資料庫連線正常
- 確認網路連線

### Q2: 種子腳本執行失敗

**錯誤**: `ModuleNotFoundError: No module named 'app'`

**解決方案**:
```bash
# 確認在 backend 目錄下執行
cd backend
python scripts/run_achievement_seeds.py
```

### Q3: API 回應 401 Unauthorized

**原因**: JWT token 無效或過期

**解決方案**:
1. 重新登入獲取新的 token
2. 在 Swagger UI 中重新 Authorize
3. 確認 token 格式為 `Bearer {token}`

### Q4: 查詢進度時沒有資料

**原因**: 新使用者尚未初始化進度記錄

**解決方案**:
- 正常行為：API 會返回臨時進度物件 (current_progress = 0)
- 或手動呼叫 `AchievementService.initialize_user_achievements()`

---

## 📊 測試結果報告範本

```markdown
# 成就系統測試結果

**測試日期**: YYYY-MM-DD
**測試人員**: [姓名]
**環境**: Development

## 測試結果總覽

- 總測試案例: 6
- 通過: X
- 失敗: Y
- 跳過: Z

## 詳細結果

### 測試案例 1: 查詢所有成就定義
- 狀態: ✅ PASS / ❌ FAIL
- 備註: ...

### 測試案例 2: 依分類查詢成就
- 狀態: ✅ PASS / ❌ FAIL
- 備註: ...

... (其他測試案例)

## 發現的問題

1. [問題描述]
   - 嚴重程度: High/Medium/Low
   - 重現步驟: ...
   - 預期結果: ...
   - 實際結果: ...

## 建議改進

- ...

## 總結

...
```

---

**文檔版本**: 1.0
**最後更新**: 2025-10-22
