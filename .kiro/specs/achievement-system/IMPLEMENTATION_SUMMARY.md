# 成就系統後端實作總結

## 📋 專案概覽

**功能名稱**: Achievement System (成就系統)
**實作日期**: 2025-10-22
**開發階段**: Phase 1-3 (後端核心功能)
**程式碼行數**: ~3,000 行
**新增檔案**: 8 個
**Commits**: 5 個

---

## 🏗️ 架構設計

### 資料層 (Data Layer)

#### 資料模型

**1. Achievement (成就定義表)**
- 檔案: `backend/app/models/achievement.py`
- 欄位:
  - `id`: UUID 主鍵
  - `code`: 唯一識別碼 (如 "FIRST_READING")
  - `name_zh_tw`: 成就名稱（繁體中文）
  - `description_zh_tw`: 成就描述
  - `category`: 成就類別 (READING, SOCIAL, BINGO, KARMA, EXPLORATION)
  - `rarity`: 稀有度 (COMMON, RARE, EPIC, LEGENDARY)
  - `icon_name`: PixelIcon 圖示名稱
  - `criteria`: JSONB 解鎖條件
  - `rewards`: JSONB 獎勵內容
  - `is_hidden`: 是否為隱藏成就
  - `is_active`: 是否啟用
  - `display_order`: 顯示順序
  - `created_at`, `updated_at`: 時間戳記

**2. UserAchievementProgress (使用者成就進度表)**
- 檔案: `backend/app/models/achievement.py`
- 欄位:
  - `id`: UUID 主鍵
  - `user_id`: 使用者 ID (外鍵)
  - `achievement_id`: 成就 ID (外鍵)
  - `current_progress`: 當前進度
  - `target_progress`: 目標進度
  - `status`: 成就狀態 (IN_PROGRESS, UNLOCKED, CLAIMED)
  - `unlocked_at`: 解鎖時間
  - `claimed_at`: 領取時間
  - `created_at`, `updated_at`: 時間戳記

#### 資料庫遷移

- 檔案: `backend/alembic/versions/20251022_add_achievement_system_tables.py`
- Revision ID: `ach001_20251022`
- 包含:
  - 建立 `achievements` 表
  - 建立 `user_achievement_progress` 表
  - 6 個索引 (優化查詢效能)
  - 3 個檢查約束 (資料完整性)
  - 2 個外鍵約束 (CASCADE DELETE)

---

### 驗證層 (Validation Layer)

#### Pydantic Schemas

**檔案**: `backend/app/schemas/achievement.py`

**主要 Schemas**:
1. `AchievementResponse` - 成就定義回應
2. `AchievementListResponse` - 成就列表回應
3. `UserAchievementProgressResponse` - 使用者進度回應
4. `UserProgressSummaryResponse` - 進度總覽回應
5. `ClaimRewardRequest` - 領取獎勵請求
6. `ClaimRewardResponse` - 領取獎勵回應
7. `AchievementUnlockNotification` - 解鎖通知
8. `AchievementErrorResponse` - 錯誤回應
9. `AchievementAlreadyClaimedError` - 已領取錯誤
10. `AchievementNotUnlockedError` - 尚未解鎖錯誤

**特性**:
- 完整的欄位驗證
- JSON Schema 範例 (用於 Swagger 文檔)
- Type-safe 列舉 (Category, Rarity, Status)
- 自訂驗證器 (achievement_code 格式檢查)

---

### 業務邏輯層 (Business Logic Layer)

#### AchievementChecker (成就檢查引擎)

**檔案**: `backend/app/services/achievement_checker.py`

**核心方法**:
- `check_achievement_progress()` - 檢查單一成就進度
- `check_and_unlock_achievements()` - 批次檢查並解鎖成就
- `get_user_progress_summary()` - 獲取進度總覽

**支援的條件類型 (9 種)**:
1. `READING_COUNT` - 占卜次數
   - 篩選: spread_type, character_voice, start_date, end_date
2. `SOCIAL_SHARE` - 社交分享次數
3. `FRIEND_COUNT` - 好友數量
4. `BINGO_LINE` - Bingo 連線次數
   - 篩選: month_year
5. `CONSECUTIVE_LOGIN` - 連續簽到天數
6. `KARMA_THRESHOLD` - Karma 門檻
7. `CARD_VIEW` - 卡牌查看次數
   - 篩選: card_suit
8. `PLAYLIST_CREATE` - 播放清單建立數量
9. `TIME_BASED` - 時間相關
   - 篩選: time_range (midnight, morning, afternoon, evening)

**資料來源**:
- `CompletedReading` - 占卜記錄
- `UserAnalytics` - 使用者行為分析
- `UserFriendship` - 好友關係
- `BingoReward` - Bingo 獎勵
- `UserNumberClaim` - Bingo 簽到記錄
- `User` - Karma 分數
- `Playlist` - 播放清單

#### AchievementService (成就服務)

**檔案**: `backend/app/services/achievement_service.py`

**核心功能**:

**1. 查詢功能**:
- `get_all_achievements()` - 獲取所有成就定義
  - 支援分類篩選
  - 隱藏成就過濾
- `get_achievement_by_code()` - 根據代碼獲取成就
- `get_user_progress()` - 獲取使用者進度
- `get_user_progress_with_achievements()` - 包含成就定義的進度

**2. 解鎖功能**:
- `unlock_achievements_for_user()` - 事件觸發的成就解鎖
  - 事件類型: reading_completed, friend_added, reading_shared, bingo_line, login, card_viewed, playlist_created
  - 自動篩選相關成就
  - 記錄解鎖事件到 Analytics

**3. 獎勵發放**:
- `claim_reward()` - 領取成就獎勵
  - 驗證成就狀態 (必須是 UNLOCKED)
  - 發放 Karma 點數 (整合 KarmaService)
  - 授予稱號 (更新 UserProfile)
  - 處理錯誤與重試

**4. 批次操作**:
- `initialize_user_achievements()` - 初始化新使用者
- `recalculate_user_progress()` - 重新計算進度 (用於 Migration)

**錯誤處理**:
- 成就不存在
- 尚未解鎖
- 已經領取
- Karma 發放失敗 (標記為 PENDING，稍後重試)

---

### API 層 (API Layer)

#### REST API Endpoints

**檔案**: `backend/app/api/v1/endpoints/achievements.py`

**Endpoints**:

1. **GET /api/v1/achievements**
   - 功能: 獲取所有成就定義
   - 參數: `category` (可選)
   - 回應: `AchievementListResponse`
   - 特性:
     - 過濾隱藏成就
     - 依 display_order 排序
     - 分類篩選

2. **GET /api/v1/achievements/progress**
   - 功能: 獲取使用者成就進度
   - 參數: `category` (可選)
   - 回應: `UserProgressSummaryResponse`
   - 認證: 需要 JWT
   - 特性:
     - 包含成就定義
     - 隱藏成就過濾 (未解鎖前)
     - 進度百分比計算
     - 分類統計

3. **POST /api/v1/achievements/{code}/claim**
   - 功能: 領取成就獎勵
   - 參數: `code` (路徑參數)
   - 回應: `ClaimRewardResponse`
   - 認證: 需要 JWT
   - 狀態碼:
     - 200: 成功
     - 400: 尚未解鎖或已領取
     - 404: 成就不存在
     - 500: 獎勵發放失敗

4. **GET /api/v1/achievements/summary**
   - 功能: 獲取成就總覽統計
   - 回應: 總覽 + 各分類統計
   - 認證: 需要 JWT
   - 特性:
     - 總成就數量
     - 已解鎖/已領取/進行中數量
     - 完成百分比
     - 各分類的完成情況

**API 註冊**:
- 檔案: `backend/app/api/v1/api.py`
- Prefix: `/achievements`
- Tag: `🏆 Achievements`

---

### 資料初始化層 (Data Seeding Layer)

#### 初始成就定義

**檔案**: `backend/app/db/seeds/achievement_seeds.py`

**15 個初始成就**:

**READING 類別 (4 個)**:
1. FIRST_READING - 廢土新手 (COMMON, 50 Karma)
2. READING_APPRENTICE - 占卜學徒 (COMMON, 100 Karma)
3. CELTIC_CROSS_INITIATE - 凱爾特十字初體驗 (RARE, 150 Karma + 稱號)
4. MAJOR_ARCANA_COLLECTOR - 大阿卡納收藏家 (EPIC, 300 Karma + 稱號)

**SOCIAL 類別 (3 個)**:
5. FIRST_SHARE - 初次分享 (COMMON, 30 Karma)
6. SOCIAL_BUTTERFLY - 社交達人 (RARE, 200 Karma + 稱號)
7. FRIEND_COLLECTOR - 好友收集者 (COMMON, 80 Karma)

**BINGO 類別 (3 個)**:
8. BINGO_FIRST_TRY - Bingo 初體驗 (COMMON, 50 Karma)
9. BINGO_MASTER - Bingo 大師 (RARE, 250 Karma + 稱號)
10. DAILY_DEVOTEE - 每日虔誠者 (RARE, 150 Karma + 稱號)

**KARMA 類別 (2 個)**:
11. WASTELAND_SAINT - 廢土聖人 (EPIC, 500 Karma + 稱號)
12. BALANCED_SOUL - 平衡行者 (RARE, 200 Karma + 稱號)

**EXPLORATION 類別 (3 個)**:
13. CARD_EXPLORER - 卡牌收藏家 (RARE, 180 Karma)
14. MUSIC_LOVER - 音樂愛好者 (COMMON, 40 Karma)
15. MIDNIGHT_DIVINER - 午夜占卜師 (EPIC, 250 Karma + 稱號, **隱藏**)

**稀有度分布**:
- COMMON: 7 個 (47%)
- RARE: 5 個 (33%)
- EPIC: 3 個 (20%)

**Karma 獎勵範圍**: 30-500 點

#### 種子執行腳本

**檔案**: `backend/scripts/run_achievement_seeds.py`

**用法**:
```bash
# 插入/更新成就
python scripts/run_achievement_seeds.py

# 回滾（刪除所有初始成就）
python scripts/run_achievement_seeds.py --rollback
```

**功能**:
- 自動檢查並更新現有成就
- 支援幂等性 (可重複執行)
- 回滾支援 (清理測試資料)

---

## 🔗 整合點

### 現有系統整合

1. **KarmaService**:
   - 獎勵發放時呼叫 `add_karma()`
   - 使用 `KarmaChangeReason.COMMUNITY_CONTRIBUTION`
   - 記錄完整的 Karma 歷史

2. **Analytics Service**:
   - 成就解鎖時記錄 `AnalyticsEvent`
   - Event type: `achievement_unlocked`
   - 包含成就代碼、名稱、類別、稀有度

3. **Bingo System**:
   - 連線次數從 `BingoReward` 查詢
   - 連續簽到從 `UserNumberClaim` 計算

4. **Social Features**:
   - 好友數量從 `UserFriendship` 查詢 (ACCEPTED 狀態)
   - 分享次數從 `UserAnalytics.shares_count` 查詢

5. **UserProfile**:
   - 稱號獎勵更新 `current_title` 和 `unlocked_titles`
   - 自動建立 Profile (如果不存在)

### 待整合的業務流程

**尚未實作 (任務 6)**:
- 占卜完成時觸發成就檢查
- 登入時觸發連續簽到檢查
- 好友新增時觸發成就檢查
- 分享時觸發成就檢查
- Bingo 連線時觸發成就檢查

---

## 📊 資料庫索引優化

### achievements 表索引
- `idx_achievement_code` - code 欄位 (唯一索引)
- `idx_achievement_category` - category 欄位
- `idx_achievement_rarity` - rarity 欄位
- `idx_achievement_is_active` - is_active 欄位

### user_achievement_progress 表索引
- `idx_user_achievement_user_id` - user_id 欄位
- `idx_user_achievement_achievement_id` - achievement_id 欄位
- `idx_user_achievement_status` - status 欄位
- `idx_user_achievement_user_status` - (user_id, status) 複合索引 ⭐
- `idx_user_achievement_unlocked_at` - unlocked_at 欄位

**查詢優化**:
- 單使用者查詢: 使用 `user_id` 索引
- 分類篩選: JOIN `achievements` 使用 `category` 索引
- 狀態篩選: 使用 `user_id` + `status` 複合索引 (最優化)

---

## 🧪 測試建議

### 單元測試 (尚未實作)

**AchievementChecker**:
- 測試 9 種條件類型的計算邏輯
- 測試篩選條件的正確性
- 測試邊界情況 (0 進度、達標、超標)

**AchievementService**:
- 測試成就查詢功能
- 測試獎勵發放邏輯
- 測試錯誤處理 (尚未解鎖、已領取)
- 測試 Karma 發放失敗的重試機制

### 整合測試 (尚未實作)

**API Endpoints**:
- 測試 GET /achievements 的分類篩選
- 測試 GET /achievements/progress 的認證
- 測試 POST /achievements/{code}/claim 的完整流程
- 測試錯誤回應的格式

**資料庫**:
- 測試 Migration 的 upgrade 和 downgrade
- 測試外鍵約束 (CASCADE DELETE)
- 測試索引效能

### 手動測試步驟

見下方「測試指南」章節。

---

## 📝 已知限制與未來改進

### 已知限制

1. **尚未實作前端 UI**:
   - 成就卡片網格
   - 解鎖通知彈窗
   - 進度條與狀態指示

2. **尚未整合到業務流程**:
   - 占卜完成後的自動檢查
   - 登入時的連續簽到檢查

3. **快取層尚未實作**:
   - Redis 快取進度資料
   - 快取降級策略

4. **效能優化尚未完成**:
   - 背景任務處理 (超過 2 秒的檢查)
   - 批次回溯 Migration

### 未來改進方向

1. **效能優化**:
   - 實作 Redis 快取層 (5 分鐘 TTL)
   - 背景任務處理長時間檢查
   - 查詢效能監控

2. **功能擴充**:
   - 成就進度通知 (接近完成時提醒)
   - 成就排行榜
   - 成就分享功能
   - 更多隱藏成就

3. **資料分析**:
   - 成就解鎖率統計
   - 使用者參與度分析
   - 獎勵效果評估

---

## 📚 相關文檔

- **需求文檔**: `.kiro/specs/achievement-system/requirements.md`
- **設計文檔**: `.kiro/specs/achievement-system/design.md`
- **任務清單**: `.kiro/specs/achievement-system/tasks.md`
- **Spec 元數據**: `.kiro/specs/achievement-system/spec.json`

---

## 🎯 下一步行動

1. **立即行動**: 執行測試指南，驗證後端功能
2. **短期**: 整合成就檢查到業務流程 (任務 6)
3. **中期**: 實作前端 UI (任務 7-9)
4. **長期**: 撰寫測試、優化效能 (任務 12-20)

---

**生成日期**: 2025-10-22
**文檔版本**: 1.0
**作者**: Claude Code
