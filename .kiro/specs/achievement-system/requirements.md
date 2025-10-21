# Requirements Document

## Introduction

成就系統是 Wasteland Tarot 平台的遊戲化核心元件，旨在追蹤使用者在占卜、社交、Bingo 遊戲及探索活動中的進度，並透過視覺化徽章、稱號和 Karma 獎勵來提升使用者參與度與留存率。

### 業務價值
- **提升留存率**：透過里程碑式的成就解鎖，鼓勵使用者持續使用平台（目標：15-20% 留存率提升）
- **增強參與度**：成就系統創造額外的使用動機，提高平均每月占卜次數
- **社交分享**：使用者可分享解鎖成就，增加平台曝光度
- **數據洞察**：成就追蹤提供使用者行為數據，協助優化產品決策

### 目標使用者
- **新手使用者**：透過早期易達成的成就建立信心與習慣
- **活躍使用者**：中期成就維持參與熱情
- **核心使用者**：高難度成就提供長期目標

---

## Requirements

### Requirement 1: 成就定義與管理系統
**Objective:** 作為系統管理員，我希望能定義、配置和管理各類成就，以便靈活調整獎勵機制並支援未來擴展

#### Acceptance Criteria

1. WHEN 系統初始化時 THEN 成就系統 SHALL 載入至少 15 個預設成就定義，涵蓋占卜、社交、Bingo、Karma 和探索五大類別

2. WHERE 成就定義資料庫 THE 成就系統 SHALL 儲存每個成就的以下屬性：
   - 唯一識別碼（code）
   - 名稱（繁體中文）
   - 描述（繁體中文）
   - 類別（READING, SOCIAL, BINGO, KARMA, EXPLORATION）
   - 圖示名稱（RemixIcon）
   - 解鎖條件（JSON 格式）
   - 獎勵內容（Karma 點數、稱號）
   - 稀有度（COMMON, RARE, EPIC, LEGENDARY）
   - 隱藏狀態（是否在解鎖前可見）
   - 排序順序

3. IF 成就屬於隱藏類型 THEN 成就系統 SHALL 僅在使用者解鎖後才向前端回傳該成就資訊

4. WHEN 管理員新增或修改成就定義時 THEN 成就系統 SHALL 驗證解鎖條件的 JSON 格式正確性並儲存時間戳記

5. WHERE 成就條件類型為計數型（如「完成 N 次占卜」） THE 成就系統 SHALL 支援以下條件欄位：
   - `type`：條件類型（reading_count, share_count, friend_count 等）
   - `target`：目標數值
   - `additional_filters`：額外篩選條件（選填）

---

### Requirement 2: 使用者成就進度追蹤
**Objective:** 作為平台使用者，我希望系統自動追蹤我的各項活動進度，以便清楚知道距離解鎖成就還差多少

#### Acceptance Criteria

1. WHEN 使用者首次註冊帳號時 THEN 成就系統 SHALL 為該使用者初始化所有非隱藏成就的進度記錄，初始進度為 0

2. WHERE 使用者執行可追蹤行為（如完成占卜、加好友、簽到） THE 成就系統 SHALL 在該行為發生後 5 秒內更新相關成就的當前進度值

3. WHEN 使用者進度更新時 AND 該進度涉及多個成就 THEN 成就系統 SHALL 批次更新所有受影響的成就進度，確保資料一致性

4. IF 成就進度計算需要聚合歷史資料（如「總共完成 100 次占卜」） THEN 成就系統 SHALL 從 Analytics 資料表查詢統計數據而非即時計算

5. WHILE 成就進度未達成目標 THE 成就系統 SHALL 維持進度狀態為 `IN_PROGRESS` 並持續更新 `current_progress` 欄位

6. WHERE 效能考量 THE 成就系統 SHALL 將使用者進度快照儲存於 Redis cache，快取過期時間為 5 分鐘

---

### Requirement 3: 成就解鎖邏輯與觸發機制
**Objective:** 作為系統開發者，我希望在關鍵業務事件發生時自動觸發成就檢查，以確保使用者及時解鎖成就

#### Acceptance Criteria

1. WHEN 使用者完成占卜時 THEN 成就系統 SHALL 檢查所有 READING 類別成就的解鎖條件

2. WHEN 使用者登入系統時 THEN 成就系統 SHALL 檢查連續登入相關成就（如「連續簽到 7 天」）

3. WHEN 使用者新增好友時 THEN 成就系統 SHALL 檢查所有 SOCIAL 類別成就的解鎖條件

4. WHEN 使用者完成 Bingo 三連線時 THEN 成就系統 SHALL 檢查所有 BINGO 類別成就的解鎖條件

5. IF 使用者當前進度達到或超過成就目標值 AND 該成就尚未解鎖 THEN 成就系統 SHALL 執行解鎖流程：
   - 更新成就狀態為 `UNLOCKED`
   - 記錄解鎖時間戳記
   - 觸發獎勵發放邏輯
   - 回傳解鎖通知給前端

6. WHERE 單次事件可能觸發多個成就解鎖 THE 成就系統 SHALL 回傳所有新解鎖成就的列表供前端展示

7. WHEN 成就檢查邏輯執行時間超過 2 秒 THEN 成就系統 SHALL 改為異步後台處理，避免阻塞主要業務流程

---

### Requirement 4: 獎勵發放與整合
**Objective:** 作為平台使用者，我希望在解鎖成就時立即獲得承諾的獎勵，以增加成就感與參與動力

#### Acceptance Criteria

1. WHEN 成就解鎖時 AND 該成就包含 Karma 點數獎勵 THEN 成就系統 SHALL 呼叫 Karma Service 為使用者增加對應點數

2. WHEN 成就解鎖時 AND 該成就包含稱號獎勵 THEN 成就系統 SHALL 將稱號儲存至使用者 Profile 的 `available_titles` 欄位

3. IF Karma Service 回傳錯誤（如資料庫連線失敗） THEN 成就系統 SHALL 將獎勵發放標記為 `PENDING` 並記錄錯誤日誌，稍後重試

4. WHEN 使用者首次查看成就頁面時 THEN 成就系統 SHALL 檢查是否有 `UNLOCKED` 但未領取（`claimed_at` 為 null）的成就，並提示使用者領取

5. WHEN 使用者點擊「領取獎勵」按鈕時 THEN 成就系統 SHALL 更新成就狀態為 `CLAIMED` 並記錄領取時間戳記

6. WHERE 成就獎勵與其他系統整合（如 Bingo 獎勵） THE 成就系統 SHALL 使用統一的 Reward Notification 元件顯示獎勵內容

---

### Requirement 5: 前端 UI 展示系統
**Objective:** 作為平台使用者，我希望在視覺上清楚看到我的成就進度與已解鎖成就，以獲得即時反饋和成就感

#### Acceptance Criteria

1. WHEN 使用者訪問 `/profile/achievements` 頁面時 THEN 成就系統 SHALL 顯示所有非隱藏成就的卡片，包含：
   - 成就名稱與描述
   - 進度條（當前進度 / 目標進度）
   - 解鎖狀態（進行中 / 已解鎖 / 已領取）
   - 稀有度視覺標記

2. WHERE 成就稀有度不同 THE 前端 SHALL 套用對應的視覺效果：
   - COMMON：灰色邊框
   - RARE：藍色邊框 + 微光效果
   - EPIC：紫色邊框 + 脈衝動畫
   - LEGENDARY：金色邊框 + 旋轉光暈

3. WHEN 使用者解鎖新成就時 THEN 前端 SHALL 顯示 Pip-Boy 風格的解鎖彈窗，內容包含：
   - 成就圖示（發光動畫）
   - 成就名稱與描述
   - 獎勵內容（Karma +X、稱號）
   - 「領取獎勵」與「稍後查看」按鈕

4. IF 使用者在單次操作中解鎖多個成就 THEN 前端 SHALL 依序顯示解鎖彈窗，每個彈窗間隔 2 秒

5. WHERE 成就頁面載入時 THE 前端 SHALL 從後端 API 取得使用者所有成就進度並快取於 Zustand store

6. WHEN 使用者點擊成就卡片時 THEN 前端 SHALL 顯示詳細資訊 modal，包含解鎖條件、獎勵細節和解鎖時間（如已解鎖）

7. WHILE 成就進度更新中 THE 前端 SHALL 顯示載入指示器並停用相關操作按鈕

---

### Requirement 6: 歷史資料回溯與初始化
**Objective:** 作為系統管理員，我希望在成就系統上線時能自動計算既有使用者的成就進度，確保公平性與資料完整性

#### Acceptance Criteria

1. WHEN 成就系統首次部署時 THEN 系統 SHALL 執行一次性 migration script 為所有既有使用者計算初始成就進度

2. WHERE 歷史資料計算涉及大量使用者（>1000 人） THE migration script SHALL 採用分批處理策略，每批處理 100 位使用者

3. WHEN 計算使用者歷史進度時 THEN 系統 SHALL 從以下資料表聚合統計：
   - `completed_readings`：占卜次數、卡牌抽取記錄
   - `user_login_history`：登入天數
   - `user_bingo_cards` + `user_number_claims`：Bingo 活動數據
   - `shared_readings`：分享次數
   - `social_connections`：好友數量

4. IF 歷史資料計算發現使用者已達成某成就條件 THEN 系統 SHALL 自動將該成就標記為 `UNLOCKED` 但不發放獎勵（避免重複發放）

5. WHEN migration script 執行完成時 THEN 系統 SHALL 產生執行報告，包含：
   - 處理使用者總數
   - 解鎖成就總數
   - 執行時間
   - 錯誤日誌（如有）

6. WHERE migration 過程中發生錯誤 THE 系統 SHALL 記錄錯誤詳情並繼續處理下一批使用者，最後彙總所有錯誤

---

### Requirement 7: 效能與可擴展性
**Objective:** 作為系統架構師，我希望成就系統在高流量情境下仍能穩定運作，並支援未來新增更多成就

#### Acceptance Criteria

1. WHEN 單一 API 請求需要檢查成就解鎖條件時 THEN 系統 SHALL 僅檢查與該事件類型相關的成就（如占卜事件僅檢查 READING 類別）

2. WHERE 使用者進度查詢頻率高 THE 系統 SHALL 使用 Redis cache 儲存進度快照，減少資料庫查詢次數

3. WHEN Redis cache 失效或查詢失敗時 THEN 系統 SHALL 降級至直接查詢 PostgreSQL 資料庫

4. IF 成就檢查邏輯執行時間超過 2 秒 THEN 系統 SHALL 回傳異步任務 ID 給前端，並透過背景 job 完成檢查

5. WHEN 系統新增新成就定義時 THEN 系統 SHALL 自動為所有既有使用者初始化該成就的進度記錄（初始值為 0）

6. WHERE 成就數量增長至 50+ 個 THE 系統 SHALL 支援成就分類與標籤系統，方便使用者篩選與瀏覽

7. WHEN 同時有 1000+ 位使用者觸發成就檢查時 THEN 系統 SHALL 維持 API 回應時間中位數 < 500ms

---

### Requirement 8: 與現有系統整合
**Objective:** 作為系統開發者，我希望成就系統能無縫整合既有的 Karma、Bingo 和 Analytics 系統，避免資料衝突

#### Acceptance Criteria

1. WHEN 成就解鎖發放 Karma 獎勵時 THEN 成就系統 SHALL 呼叫 `karma_service.add_points()` 並在 Analytics 記錄 `achievement_unlocked` 事件

2. WHERE Karma Service 回傳成功回應 THE 成就系統 SHALL 在 Analytics 儲存以下資訊：
   - 使用者 ID
   - 成就代碼
   - 解鎖時間戳記
   - 獎勵內容

3. WHEN 使用者達成 Karma 相關成就（如「Karma 達到 100」）時 THEN 成就系統 SHALL 從 Karma Service 查詢當前 Karma 值而非自行計算

4. IF 成就系統與 Bingo 系統同時發放獎勵 THEN 前端 SHALL 使用統一的 `RewardNotification` 元件顯示通知，避免 UI 衝突

5. WHEN 成就系統需要使用者歷史行為數據時 THEN 系統 SHALL 優先從 `user_analytics` 資料表查詢聚合統計，而非即時掃描所有歷史記錄

6. WHERE 成就解鎖影響使用者 Profile（如新增稱號） THE 成就系統 SHALL 透過 User Service 更新 `UserProfile.available_titles` 欄位

---

### Requirement 9: 資料一致性與錯誤處理
**Objective:** 作為系統運維人員，我希望成就系統在異常情況下能保持資料一致性，並提供清晰的錯誤日誌

#### Acceptance Criteria

1. WHEN 成就解鎖流程中任何步驟失敗時 THEN 系統 SHALL 回滾該成就的狀態變更並記錄詳細錯誤日誌

2. IF 獎勵發放失敗（如 Karma Service 不可用） THEN 系統 SHALL 將成就狀態保持為 `UNLOCKED` 但 `claimed_at` 為 null，允許使用者稍後重試領取

3. WHERE 使用者刪除歷史占卜記錄 THE 成就系統 SHALL 不回溯減少進度值（進度只增不減原則）

4. WHEN 偵測到進度資料不一致（如快取與資料庫數值不符）時 THEN 系統 SHALL 以資料庫數值為準並清除快取

5. IF 使用者嘗試領取已領取的獎勵 THEN 系統 SHALL 回傳錯誤訊息「此成就獎勵已領取」並維持原狀態

6. WHEN 後台 cron job 執行定期成就檢查時 THEN 系統 SHALL 記錄執行時間、檢查成就數量和錯誤數量於系統日誌

---

### Requirement 10: 設計風格與無障礙性
**Objective:** 作為視障使用者，我希望成就系統的 UI 遵循 Fallout 主題並符合無障礙標準，以確保所有人都能使用

#### Acceptance Criteria

1. WHERE 成就頁面 UI 設計 THE 前端 SHALL 使用 Fallout Pip-Boy 配色方案：
   - 主色：Pip-Boy Green (#00ff88)
   - 強調色：Radiation Orange (#ff8800)
   - 背景：深灰/黑色系

2. WHEN 前端渲染成就卡片時 THEN 系統 SHALL 使用 Cubic 11 像素字體顯示文字內容

3. WHERE 成就圖示顯示 THE 前端 SHALL 使用 PixelIcon 元件（基於 RemixIcon），避免使用已移除的 lucide-react

4. WHEN 視障使用者使用螢幕閱讀器時 THEN 所有成就卡片 SHALL 包含適當的 ARIA 標籤：
   - `aria-label`：成就名稱與進度（如「廢土新手，進度 7/10」）
   - `role="article"`：成就卡片容器
   - `aria-live="polite"`：解鎖通知彈窗

5. IF 成就包含進度條 THEN 前端 SHALL 使用 `<progress>` HTML 元素或提供等效的 ARIA 屬性

6. WHERE 解鎖彈窗顯示 THE 前端 SHALL 確保鍵盤焦點陷阱（focus trap），使用者可使用 Tab 鍵在「領取」與「關閉」按鈕間切換，並可按 Esc 關閉彈窗

7. WHEN 成就稀有度透過顏色區分時 THEN 前端 SHALL 同時提供文字標籤（如「稀有」、「史詩」）以滿足色盲使用者需求

---

## Non-Functional Requirements

### 效能需求
- API 回應時間中位數 < 500ms（成就查詢）
- 成就檢查邏輯執行時間 < 2 秒（單次事件）
- 支援 1000+ 並發使用者同時觸發成就檢查
- Redis cache 命中率 > 80%

### 可用性需求
- 系統正常運行時間 > 99.5%
- 成就資料備份頻率：每日一次
- 獎勵發放失敗自動重試次數：3 次

### 安全性需求
- 成就解鎖邏輯完全在後端執行，前端不可篡改
- API endpoint 需驗證 JWT token
- 防止惡意使用者透過重複操作刷進度（加入冷卻時間或行為驗證）

### 可維護性需求
- 新增成就定義無需修改程式碼（純資料配置）
- 成就條件支援 JSON 格式，易於擴展
- 所有成就相關操作記錄於 Analytics 供後續分析

### 國際化需求
- 成就名稱與描述支援繁體中文（zh-TW）
- 資料結構預留多語言欄位（未來擴展）

---

## Success Metrics

### 使用者參與指標
- **首週解鎖率**：80%+ 使用者在首週解鎖至少 1 個成就
- **平均月解鎖數**：每位使用者平均解鎖 5+ 個成就/月
- **成就頁面訪問率**：60%+ 活躍使用者每月至少訪問一次成就頁面

### 留存率指標
- **7 日留存率提升**：15-20%（相較於無成就系統時期）
- **30 日留存率提升**：10-15%

### 技術指標
- **API 回應時間**：P95 < 1 秒
- **成就檢查準確率**：99.9%+（無誤解鎖或漏解鎖）
- **系統可用性**：99.5%+ uptime

---

## Appendix A: 初始成就列表（15 個）

### 占卜類別（READING）
1. **廢土新手**（COMMON）：完成 1 次占卜，獎勵 Karma +5
2. **占卜學徒**（COMMON）：完成 10 次占卜，獎勵 Karma +10 + 稱號「學徒」
3. **凱爾特十字初體驗**（COMMON）：完成首次 Celtic Cross 占卜，獎勵 Karma +15
4. **大阿卡納收藏家**（EPIC）：抽過所有 22 張大阿卡納，獎勵 Karma +100

### 社交類別（SOCIAL）
5. **初次分享**（COMMON）：分享 1 次閱讀，獎勵 Karma +5
6. **社交達人**（COMMON）：分享 10 次閱讀，獎勵 Karma +20
7. **好友收集者**（COMMON）：加 5 位好友，獎勵 Karma +15

### Bingo 類別（BINGO）
8. **Bingo 初體驗**（COMMON）：完成首次 Bingo 三連線，獎勵 Karma +10
9. **Bingo 大師**（RARE）：完成 3 次三連線，獎勵 Karma +50
10. **每日虔誠者**（COMMON）：連續簽到 7 天，獎勵 Karma +20

### Karma 類別（KARMA）
11. **廢土聖人**（EPIC）：Karma 達到 100（Very Good），獎勵稱號「聖人」
12. **平衡行者**（RARE）：保持 Karma 在 -10~+10 達 30 天，獎勵 Karma +20

### 探索類別（EXPLORATION）
13. **卡牌收藏家**（RARE）：查看所有 78 張牌的詳細頁面，獎勵 Karma +30
14. **音樂愛好者**（COMMON）：建立 3 個播放清單，獎勵 Karma +10
15. **午夜占卜師**（RARE，隱藏）：在 00:00-01:00 完成占卜，獎勵 Karma +15

---

## Appendix B: 資料模型概要

### Achievement（成就定義）
```
- id: UUID (PK)
- code: String (unique)
- name_zh_tw: String
- description_zh_tw: String
- category: Enum(READING, SOCIAL, BINGO, KARMA, EXPLORATION)
- icon: String (RemixIcon name)
- criteria: JSON
- rewards: JSON
- rarity: Enum(COMMON, RARE, EPIC, LEGENDARY)
- is_hidden: Boolean
- sort_order: Integer
- created_at: Timestamp
- updated_at: Timestamp
```

### UserAchievement（使用者成就進度）
```
- id: UUID (PK)
- user_id: UUID (FK to User)
- achievement_id: UUID (FK to Achievement)
- current_progress: Integer
- target_progress: Integer
- status: Enum(IN_PROGRESS, UNLOCKED, CLAIMED)
- unlocked_at: Timestamp (nullable)
- claimed_at: Timestamp (nullable)
- created_at: Timestamp
- updated_at: Timestamp
```

---

*本需求文件將在 Design 階段轉化為技術設計與實作計畫*
