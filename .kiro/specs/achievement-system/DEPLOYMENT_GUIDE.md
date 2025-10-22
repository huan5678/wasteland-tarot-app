# 成就系統部署與測試指南

## 📋 目錄

1. [前置準備](#前置準備)
2. [資料庫部署](#資料庫部署)
3. [資料初始化](#資料初始化)
4. [歷史資料回溯](#歷史資料回溯)
5. [後端驗證](#後端驗證)
6. [前端驗證](#前端驗證)
7. [完整測試流程](#完整測試流程)
8. [常見問題排除](#常見問題排除)

---

## 前置準備

### 環境需求

- **Python**: 3.11+
- **Node.js**: 18+
- **PostgreSQL**: 14+
- **套件管理器**:
  - 後端: `uv`
  - 前端: `bun`

### 檢查資料庫連線

```bash
# 確認資料庫環境變數設定
cd backend
cat .env | grep DATABASE_URL

# 測試資料庫連線
psql $DATABASE_URL -c "SELECT version();"
```

---

## 資料庫部署

### Step 1: 檢查現有 Migration 狀態

```bash
cd /home/user/wasteland-tarot-app/backend

# 啟動虛擬環境
source .venv/bin/activate

# 檢查當前 migration 版本
alembic current

# 查看待執行的 migrations
alembic heads

# 查看 migration 歷史
alembic history
```

### Step 2: 執行成就系統 Migration

成就系統 migration 檔案：`alembic/versions/20251022_add_achievement_system_tables.py`

**Migration ID**: `ach001_20251022`
**前置條件**: `62677bc25018` (上一個 migration)

```bash
# 執行到最新版本
alembic upgrade head

# 或者只執行成就系統 migration
alembic upgrade ach001_20251022
```

### Step 3: 驗證資料表建立

```sql
-- 連接資料庫
psql $DATABASE_URL

-- 檢查 achievements 表
\d achievements

-- 檢查 user_achievement_progress 表
\d user_achievement_progress

-- 檢查索引
\di achievements*
\di user_achievement_progress*

-- 驗證約束
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid IN ('achievements'::regclass, 'user_achievement_progress'::regclass)
ORDER BY conname;
```

**預期結果**:
- `achievements` 表包含 15 個欄位
- `user_achievement_progress` 表包含 10 個欄位
- 共 9 個索引
- 5 個 CHECK 約束
- 2 個 FOREIGN KEY 約束

---

## 資料初始化

### Step 1: 執行成就定義種子資料

成就種子腳本會插入 15 個初始成就定義。

```bash
cd /home/user/wasteland-tarot-app/backend

# 執行種子腳本
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

### Step 2: 驗證成就資料

```sql
-- 檢查成就總數
SELECT COUNT(*) FROM achievements;
-- 預期: 15

-- 檢查各類別的成就數量
SELECT category, COUNT(*) as count
FROM achievements
GROUP BY category
ORDER BY category;
-- 預期:
--   READING: 4
--   SOCIAL: 3
--   BINGO: 3
--   KARMA: 2
--   EXPLORATION: 3

-- 檢查稀有度分佈
SELECT rarity, COUNT(*) as count
FROM achievements
GROUP BY rarity
ORDER BY rarity;
-- 預期:
--   COMMON: 10
--   RARE: 3
--   EPIC: 2
--   LEGENDARY: 0

-- 查看所有成就
SELECT code, name_zh_tw, category, rarity
FROM achievements
ORDER BY display_order;
```

### Step 3: 回滾測試（選用）

```bash
# 刪除所有種子資料
python scripts/run_achievement_seeds.py --rollback

# 重新插入
python scripts/run_achievement_seeds.py
```

---

## 歷史資料回溯

為現有使用者初始化成就進度。

### Step 1: 執行回溯腳本

```bash
cd /home/user/wasteland-tarot-app/backend

# 執行歷史資料回溯
python scripts/backfill_user_achievements.py
```

**預期輸出**:
```
📊 Starting achievement backfill...
   Total users: 150

Processing users:
[████████████████████] 150/150 (100%)

✅ Backfill complete!
   Users processed: 150
   Achievements initialized: 2250 (150 users × 15 achievements)
   Auto-unlocked achievements: 87
   Errors: 0

Execution time: 12.3s
```

### Step 2: 驗證回溯結果

```sql
-- 檢查總進度記錄數（應該是 users × achievements）
SELECT COUNT(*) FROM user_achievement_progress;

-- 檢查已解鎖成就數量
SELECT status, COUNT(*) as count
FROM user_achievement_progress
GROUP BY status;

-- 查看特定使用者的成就進度
SELECT
    u.email,
    a.code,
    a.name_zh_tw,
    uap.current_progress,
    uap.target_progress,
    uap.status,
    uap.unlocked_at
FROM user_achievement_progress uap
JOIN users u ON uap.user_id = u.id
JOIN achievements a ON uap.achievement_id = a.id
WHERE u.email = 'test@example.com'
ORDER BY a.display_order;
```

---

## 後端驗證

# 查看待執行的 migrations
.venv/bin/alembic heads

# 執行所有待處理的 migrations
.venv/bin/alembic upgrade head

# 驗證成就表格已建立
psql $DATABASE_URL -c "\\dt achievements"
psql $DATABASE_URL -c "\\dt user_achievement_progress"
```

**預期輸出**:
```
✅ Current revision: ach001_20251022
✅ 表格 'achievements' 已建立
✅ 表格 'user_achievement_progress' 已建立
```

### Step 2: 執行成就種子資料

初始化 15 個成就定義：

```bash
cd /home/user/wasteland-tarot-app/backend

# 執行種子腳本
.venv/bin/python scripts/run_achievement_seeds.py

# 驗證成就已插入
psql $DATABASE_URL -c "SELECT code, name_zh_tw, category, rarity FROM achievements ORDER BY display_order;"
```

**預期輸出**:
```
✅ Seed complete!
   New achievements: 15
   Updated achievements: 0
   Total achievements: 15
```

**成就列表**:

| 代碼 | 名稱 | 類別 | 稀有度 |
|------|------|------|--------|
| FIRST_READING | 廢土新手 | READING | COMMON |
| READING_APPRENTICE | 占卜學徒 | READING | COMMON |
| CELTIC_CROSS_INITIATE | 凱爾特十字初體驗 | READING | RARE |
| MAJOR_ARCANA_COLLECTOR | 大阿卡納收藏家 | READING | EPIC |
| FIRST_SHARE | 初次分享 | SOCIAL | COMMON |
| SOCIAL_BUTTERFLY | 社交達人 | SOCIAL | RARE |
| FRIEND_COLLECTOR | 好友收集者 | SOCIAL | COMMON |
| BINGO_FIRST_TRY | Bingo 初體驗 | BINGO | COMMON |
| BINGO_MASTER | Bingo 大師 | BINGO | RARE |
| DAILY_DEVOTEE | 每日虔誠者 | BINGO | RARE |
| WASTELAND_SAINT | 廢土聖人 | KARMA | EPIC |
| BALANCED_SOUL | 平衡行者 | KARMA | RARE |
| CARD_EXPLORER | 卡牌收藏家 | EXPLORATION | RARE |
| MUSIC_LOVER | 音樂愛好者 | EXPLORATION | COMMON |
| MIDNIGHT_DIVINER | 午夜占卜師 | EXPLORATION | EPIC (隱藏) |

### Step 3: 回滾選項（如需要）

```bash
# 僅刪除成就種子資料
.venv/bin/python scripts/run_achievement_seeds.py --rollback

# 完全回滾 migration（包含刪除表格）
.venv/bin/alembic downgrade -1
```

---

## 後端驗證

### 驗證 API Endpoints

#### 1. 查詢所有成就定義

```bash
# 查詢所有成就
curl -X GET "http://localhost:8000/api/v1/achievements" \\
  -H "Authorization: Bearer <YOUR_TOKEN>"

# 預期回應: 15 個成就定義的 JSON 陣列
```

#### 2. 查詢使用者進度

```bash
# 查詢當前使用者的成就進度
curl -X GET "http://localhost:8000/api/v1/achievements/progress" \\
  -H "Authorization: Bearer <YOUR_TOKEN>"

# 預期回應: 使用者的成就進度資料
```

#### 3. 領取成就獎勵

```bash
# 領取已解鎖的成就
curl -X POST "http://localhost:8000/api/v1/achievements/FIRST_READING/claim" \\
  -H "Authorization: Bearer <YOUR_TOKEN>"

# 預期回應: 成功訊息與獎勵內容
```

#### 4. 查詢成就總覽

```bash
# 查詢成就統計資料
curl -X GET "http://localhost:8000/api/v1/achievements/summary" \\
  -H "Authorization: Bearer <YOUR_TOKEN>"

# 預期回應: 總數、已解鎖數、完成度等統計
```

### 驗證業務流程整合

#### 測試占卜完成觸發成就

```bash
# 1. 建立一次占卜
curl -X POST "http://localhost:8000/api/v1/readings" \\
  -H "Authorization: Bearer <YOUR_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "spread_template_id": "...",
    "question": "測試成就系統",
    "character_voice": "PIP_BOY"
  }'

# 2. 檢查後端 log，應該看到：
# "User {user_id} unlocked N achievement(s) after completing reading..."

# 3. 查詢進度，FIRST_READING 應該已解鎖
curl -X GET "http://localhost:8000/api/v1/achievements/progress?category=READING" \\
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

#### 測試登入觸發成就

```bash
# 連續登入 7 天後，應該解鎖 DAILY_DEVOTEE
# 檢查 auth.py log:
# "User {user_id} unlocked N achievement(s) after login"
```

#### 測試 Bingo 觸發成就

```bash
# 完成 Bingo 三連線後
# 檢查 bingo.py log:
# "User {user_id} unlocked N achievement(s) after Bingo line completion"
```

#### 測試社交觸發成就

```bash
# 分享閱讀
curl -X POST "http://localhost:8000/api/v1/social/share" \\
  -H "Authorization: Bearer <YOUR_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "reading_id": "...",
    "title": "測試分享"
  }'

# 檢查 social.py log:
# "User {user_id} unlocked N achievement(s) after sharing reading..."
```

---

## 前端驗證

### 啟動開發伺服器

```bash
cd /home/user/wasteland-tarot-app

# 啟動前端
bun run dev

# 訪問: http://localhost:3000
```

### 測試成就頁面

#### 1. 訪問成就頁面

```
URL: http://localhost:3000/achievements
```

**驗證項目**:
- ✅ 頁面正常載入
- ✅ 顯示統計總覽（總數、已解鎖、已領取、完成度）
- ✅ 顯示類別篩選器（6 個類別）
- ✅ 顯示成就卡片網格
- ✅ 卡片包含：圖示、名稱、描述、稀有度、進度條（進行中狀態）

#### 2. 測試類別篩選

**步驟**:
1. 點擊「閱讀」類別
2. 應該只顯示 READING 類別的成就（4 個）
3. 點擊「全部」
4. 應該顯示所有成就（15 個）

#### 3. 測試成就卡片互動

**已解鎖狀態**:
- ✅ 卡片有發光邊框（Pip-Boy 綠色）
- ✅ 顯示「領取獎勵」按鈕
- ✅ 點擊按鈕後狀態變為「已領取」

**進行中狀態**:
- ✅ 顯示進度條
- ✅ 顯示當前進度 / 目標進度
- ✅ 顯示進度百分比

**已領取狀態**:
- ✅ 卡片透明度降低（opacity: 75%）
- ✅ 顯示領取時間

#### 4. 測試解鎖通知彈窗

**觸發方式**:
1. 完成一次占卜（如果是第一次）
2. 應該自動彈出「成就解鎖」通知

**驗證項目**:
- ✅ 彈窗位於右上角（top-20, right-4）
- ✅ 顯示成就圖示（帶發光動畫）
- ✅ 顯示成就名稱、描述
- ✅ 顯示獎勵內容（Karma 點數、稱號）
- ✅ 6 秒後自動消失
- ✅ 可手動關閉（X 按鈕）
- ✅ 多個成就依序顯示（間隔 100ms）

#### 5. 測試導航整合

**驗證項目**:
- ✅ Dashboard 側邊欄有「成就系統」連結
- ✅ 使用 trophy 圖示
- ✅ 點擊後導航到 /achievements 頁面

#### 6. 測試載入與錯誤狀態

**載入狀態**:
- ✅ 顯示旋轉 loader 圖示
- ✅ 顯示「載入成就資料中...」文字

**錯誤狀態**:
- ✅ 顯示錯誤圖示（alert-triangle，紅色，搖晃動畫）
- ✅ 顯示錯誤訊息
- ✅ 顯示「重試」按鈕
- ✅ 點擊重試後重新載入

#### 7. 測試響應式設計

**手機** (< 640px):
- ✅ 網格 1 列

**平板** (640px - 1024px):
- ✅ 網格 2 列

**桌機** (1024px - 1280px):
- ✅ 網格 3 列

**大螢幕** (> 1280px):
- ✅ 網格 4 列

---

## 完整測試流程

### 端到端測試腳本

以下腳本模擬完整的使用者旅程：

```bash
#!/bin/bash
# achievement-e2e-test.sh

# 設定環境變數
export API_BASE_URL="http://localhost:8000"
export TOKEN="<YOUR_AUTH_TOKEN>"

echo "🚀 開始成就系統端到端測試..."

# 1. 註冊/登入
echo "📝 Step 1: 使用者登入"
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/v1/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"password"}')
echo "✅ 登入成功"

# 2. 查詢初始成就狀態
echo "📊 Step 2: 查詢初始成就"
curl -s "$API_BASE_URL/api/v1/achievements/progress" \\
  -H "Authorization: Bearer $TOKEN" | jq '.total_achievements, .unlocked_count'

# 3. 完成第一次占卜（觸發 FIRST_READING）
echo "🔮 Step 3: 完成第一次占卜"
READING_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/v1/readings" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"spread_template_id":"...","question":"測試","character_voice":"PIP_BOY"}')
echo "✅ 占卜完成"

# 4. 驗證 FIRST_READING 已解鎖
echo "🏆 Step 4: 驗證成就解鎖"
sleep 2  # 等待成就系統處理
PROGRESS=$(curl -s "$API_BASE_URL/api/v1/achievements/progress?category=READING" \\
  -H "Authorization: Bearer $TOKEN")
echo "$PROGRESS" | jq '.achievements[] | select(.achievement.code == "FIRST_READING") | .status'
# 預期: "UNLOCKED"

# 5. 領取獎勵
echo "🎁 Step 5: 領取成就獎勵"
CLAIM_RESPONSE=$(curl -s -X POST "$API_BASE_URL/api/v1/achievements/FIRST_READING/claim" \\
  -H "Authorization: Bearer $TOKEN")
echo "$CLAIM_RESPONSE" | jq '.success, .rewards'
# 預期: success: true, rewards: {"karma_points":50,"title":"廢土占卜師"}

# 6. 驗證狀態變更為 CLAIMED
echo "✅ Step 6: 驗證領取狀態"
FINAL_STATUS=$(curl -s "$API_BASE_URL/api/v1/achievements/progress?category=READING" \\
  -H "Authorization: Bearer $TOKEN")
echo "$FINAL_STATUS" | jq '.achievements[] | select(.achievement.code == "FIRST_READING") | .status'
# 預期: "CLAIMED"

echo "🎉 端到端測試完成！"
```

### 執行測試

```bash
chmod +x achievement-e2e-test.sh
./achievement-e2e-test.sh
```

---

## 常見問題排除

### Q1: Migration 執行失敗

**問題**: `alembic upgrade head` 報錯

**解決方案**:
```bash
# 檢查 migration 歷史
.venv/bin/alembic history

# 檢查當前版本
.venv/bin/alembic current

# 如果版本不一致，手動指定目標版本
.venv/bin/alembic upgrade ach001_20251022
```

### Q2: 種子資料重複插入

**問題**: 執行種子腳本時報錯 "duplicate key value"

**解決方案**:
```bash
# 種子腳本有內建重複檢查，會自動更新而非插入
# 如果仍有問題，先回滾再重新插入
.venv/bin/python scripts/run_achievement_seeds.py --rollback
.venv/bin/python scripts/run_achievement_seeds.py
```

### Q3: 成就未自動解鎖

**檢查清單**:

1. **後端 log 檢查**:
```bash
# 檢查成就檢查邏輯是否被觸發
tail -f backend/logs/app.log | grep "unlock"
```

2. **資料庫檢查**:
```sql
-- 檢查使用者進度
SELECT * FROM user_achievement_progress
WHERE user_id = '<USER_ID>'
ORDER BY updated_at DESC;
```

3. **觸發事件檢查**:
- 確認業務流程已提交（commit）
- 確認 achievement_service.unlock_achievements_for_user() 被呼叫
- 確認 trigger_event 參數正確

### Q4: 前端無法載入成就

**檢查步驟**:

1. **開發者工具 Network Tab**:
   - 檢查 API 請求是否成功（200 OK）
   - 檢查回應內容是否正確

2. **Console Tab**:
   - 檢查是否有 JavaScript 錯誤
   - 檢查 achievementStore 狀態

3. **Redux DevTools / Zustand DevTools**:
```javascript
// 在 Console 執行
useAchievementStore.getState()
```

### Q5: 通知彈窗未顯示

**檢查項目**:

1. **AchievementNotificationInitializer 是否載入**:
```typescript
// layout.tsx 應包含:
<AchievementNotificationInitializer />
```

2. **newlyUnlockedAchievements 狀態**:
```javascript
// Console 檢查
useAchievementStore.getState().newlyUnlockedAchievements
```

3. **CSS 問題**:
- 檢查 z-index 是否被其他元素遮蓋
- 檢查 fixed positioning 是否正確

---

## 效能檢查點

### 資料庫查詢效能

```sql
-- 檢查索引使用情況
EXPLAIN ANALYZE
SELECT * FROM user_achievement_progress
WHERE user_id = '<USER_ID>' AND status = 'UNLOCKED';

-- 應該看到 Index Scan 而非 Seq Scan
```

### API 回應時間

```bash
# 測試 API 回應時間
time curl -X GET "$API_BASE_URL/api/v1/achievements/progress" \\
  -H "Authorization: Bearer $TOKEN"

# 目標: < 500ms (P95)
```

### 前端載入效能

```javascript
// 使用 Chrome DevTools Performance Tab
// 記錄頁面載入，檢查：
// - Initial load time
// - Time to Interactive (TTI)
// - First Contentful Paint (FCP)
```

---

## 部署檢查清單

部署到生產環境前，請確認：

### 後端
- [ ] Migrations 已執行
- [ ] 成就種子資料已插入
- [ ] API endpoints 可正常存取
- [ ] 業務流程整合已測試
- [ ] 錯誤處理已驗證
- [ ] Log 記錄正常運作

### 前端
- [ ] 成就頁面可正常訪問
- [ ] 類別篩選功能正常
- [ ] 卡片顯示正確
- [ ] 領取獎勵功能正常
- [ ] 通知彈窗正常顯示
- [ ] 響應式設計正常
- [ ] 導航連結正常

### 整合
- [ ] 占卜完成 → 成就解鎖 ✅
- [ ] 登入 → 連續簽到成就 ✅
- [ ] Bingo 連線 → 成就解鎖 ✅
- [ ] 分享閱讀 → 成就解鎖 ✅
- [ ] 新增好友 → 成就解鎖 ✅

### 效能
- [ ] API 回應時間 < 500ms (P95)
- [ ] 頁面載入時間 < 2s
- [ ] 無記憶體洩漏
- [ ] 無未處理的 Promise rejections

---

## 參考資料

- **需求文件**: `.kiro/specs/achievement-system/requirements.md`
- **設計文件**: `.kiro/specs/achievement-system/design.md`
- **任務清單**: `.kiro/specs/achievement-system/tasks.md`
- **實作總結**: `.kiro/specs/achievement-system/IMPLEMENTATION_SUMMARY.md`

---

*最後更新: 2025-01-22*
*版本: 1.0.0*
