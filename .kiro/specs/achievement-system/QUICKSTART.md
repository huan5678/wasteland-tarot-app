# 成就系統快速入門指南

## 🚀 一鍵部署（生產環境）

```bash
cd /home/user/wasteland-tarot-app/backend

# Step 1: 執行資料庫 migrations
alembic upgrade head

# Step 2: 驗證資料庫狀態
python scripts/verify_achievement_database.py

# Step 3: 插入成就定義種子資料
python scripts/run_achievement_seeds.py

# Step 4: 為現有使用者初始化成就進度
python scripts/backfill_user_achievements.py

# Step 5: 重啟後端服務
# (視你的部署方式而定，例如：systemctl restart wasteland-api)
```

## ✅ 驗證檢查清單

執行完上述步驟後，請確認：

### 1. 資料庫檢查

```sql
-- 檢查成就定義數量
SELECT COUNT(*) FROM achievements;
-- 預期: 15

-- 檢查使用者進度記錄
SELECT COUNT(*) FROM user_achievement_progress;
-- 預期: 使用者數量 × 15

-- 檢查已解鎖成就數量
SELECT status, COUNT(*) FROM user_achievement_progress GROUP BY status;
```

### 2. API 測試

```bash
# 取得所有成就列表
curl -X GET "http://localhost:8000/api/v1/achievements" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 取得使用者成就進度
curl -X GET "http://localhost:8000/api/v1/achievements/progress" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 領取成就獎勵
curl -X POST "http://localhost:8000/api/v1/achievements/FIRST_READING/claim" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. 前端測試

1. 訪問 `/achievements` 頁面
2. 確認可以看到所有成就
3. 確認搜尋功能正常
4. 確認類別篩選正常
5. 點擊成就卡片，確認 Modal 顯示正常
6. 對於已解鎖成就，確認可以領取獎勵

### 4. Dashboard 檢查

1. 訪問 `/dashboard` 頁面
2. 確認「最近獲得成就」區塊顯示
3. 點擊成就卡片可跳轉到 `/achievements`

### 5. Profile 檢查

1. 訪問 `/profile` 頁面
2. 確認「成就系統」區塊顯示
3. 確認統計數據正確
4. 確認進度條正常
5. 確認最近解鎖成就列表顯示

## 🔄 回滾流程

如果需要回滾成就系統：

```bash
cd /home/user/wasteland-tarot-app/backend

# 1. 刪除成就種子資料
python scripts/run_achievement_seeds.py --rollback

# 2. 回滾資料庫 migration
alembic downgrade 62677bc25018

# 這會刪除 achievements 和 user_achievement_progress 兩個資料表
```

## 📊 監控與維護

### 定期檢查

```sql
-- 檢查成就解鎖率
SELECT
    a.code,
    a.name_zh_tw,
    COUNT(CASE WHEN uap.status = 'UNLOCKED' OR uap.status = 'CLAIMED' THEN 1 END) as unlocked_count,
    COUNT(*) as total_users,
    ROUND(COUNT(CASE WHEN uap.status = 'UNLOCKED' OR uap.status = 'CLAIMED' THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as unlock_rate_pct
FROM achievements a
LEFT JOIN user_achievement_progress uap ON a.id = uap.achievement_id
GROUP BY a.id, a.code, a.name_zh_tw
ORDER BY unlock_rate_pct DESC;

-- 檢查成就領取率
SELECT
    a.code,
    a.name_zh_tw,
    COUNT(CASE WHEN uap.status = 'CLAIMED' THEN 1 END) as claimed_count,
    COUNT(CASE WHEN uap.status = 'UNLOCKED' THEN 1 END) as unclaimed_count,
    ROUND(COUNT(CASE WHEN uap.status = 'CLAIMED' THEN 1 END)::numeric /
          NULLIF(COUNT(CASE WHEN uap.status = 'UNLOCKED' OR uap.status = 'CLAIMED' THEN 1 END)::numeric, 0) * 100, 2) as claim_rate_pct
FROM achievements a
LEFT JOIN user_achievement_progress uap ON a.id = uap.achievement_id
GROUP BY a.id, a.code, a.name_zh_tw
ORDER BY claim_rate_pct DESC;
```

### 性能優化建議

1. **定期清理快取**: 如果使用 Redis，定期檢查快取命中率
2. **索引維護**: 定期執行 `REINDEX` 維護索引效能
3. **統計資訊更新**: 定期執行 `ANALYZE achievements, user_achievement_progress`

## 🆘 常見問題

### Q1: Migration 執行失敗

**A**: 檢查前置 migration 是否已執行：
```bash
alembic current
alembic history
```

### Q2: 種子資料插入失敗

**A**: 檢查是否已執行 migration：
```bash
python scripts/verify_achievement_database.py
```

### Q3: 歷史資料回溯執行緩慢

**A**: 使用分批處理，每次處理 50 個使用者。如果仍然緩慢，可以：
- 檢查資料庫連線性能
- 檢查索引是否正確建立
- 考慮在低峰期執行

### Q4: 前端無法載入成就資料

**A**: 檢查：
1. 後端 API 是否正常運行
2. 瀏覽器 Console 是否有錯誤
3. 網路請求是否成功（檢查 Network tab）
4. Token 是否有效

## 📚 進階功能

### 自訂成就

1. 在 `achievement_seeds.py` 中添加新成就定義
2. 執行 `python scripts/run_achievement_seeds.py` 更新資料庫
3. 新成就會自動對所有使用者生效（下次檢查時）

### 手動觸發成就檢查

```python
from app.services.achievement_service import AchievementService

# 在任何業務邏輯中
achievement_service = AchievementService(db)
newly_unlocked = await achievement_service.unlock_achievements_for_user(
    user_id=user_id,
    trigger_event='custom_event',
    event_context={'key': 'value'}
)
```

## 🎯 下一步

- [ ] 設定監控與告警（例如：成就解鎖率異常降低）
- [ ] 建立成就分析儀表板
- [ ] 規劃季節性成就活動
- [ ] 收集使用者反饋優化成就系統
