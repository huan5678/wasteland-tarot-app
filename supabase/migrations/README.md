# Supabase Migrations - 播放清單音樂播放器

本目錄包含播放清單音樂播放器功能的 Supabase 資料庫 migration 檔案。

## Migration 檔案列表

| Migration 檔案 | 建立內容 | 對應 Task |
|--------------|---------|----------|
| `20250111000000_create_music_tracks.sql` | music_tracks 資料表 (音樂庫) | Task 1.1 |
| `20250111000001_create_playlists.sql` | playlists 資料表 (播放清單) | Task 1.2 |
| `20250111000002_create_playlist_tracks.sql` | playlist_tracks 關聯表 (多對多) | Task 1.3 |
| `20250111000003_create_user_ai_quotas.sql` | user_ai_quotas 配額追蹤表 | Task 1.4 |
| `20250111000004_setup_pg_cron_quota_reset.sql` | pg_cron 月度配額重置任務 | Task 1.5 |

## 部署步驟

### 1. 前置需求

- Supabase CLI 已安裝 (`npm install -g supabase`)
- Supabase 專案已建立並連結至本地

### 2. 本地測試 (推薦)

在正式部署前,建議先在本地測試 migrations:

```bash
# 啟動本地 Supabase 服務
supabase start

# 重置資料庫至乾淨狀態
supabase db reset

# 驗證所有 migrations 正確執行
supabase db diff
```

### 3. 部署至 Supabase 雲端

```bash
# 確認已登入 Supabase CLI
supabase login

# 連結至你的 Supabase 專案
supabase link --project-ref YOUR_PROJECT_REF

# 部署所有 migrations
supabase db push

# 驗證部署結果
supabase db diff
```

### 4. 驗證部署

部署完成後,執行以下 SQL 查詢驗證:

```sql
-- 1. 檢查所有表是否正確建立
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('music_tracks', 'playlists', 'playlist_tracks', 'user_ai_quotas', 'cron_job_logs');

-- 2. 檢查系統音樂是否已初始化 (應該有 4 首)
SELECT COUNT(*) as system_tracks_count
FROM music_tracks
WHERE is_system = TRUE;

-- 3. 檢查 pg_cron 任務是否正確建立
SELECT * FROM cron.job WHERE jobname = 'monthly-ai-quota-reset';

-- 4. 檢查所有索引是否正確建立
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('music_tracks', 'playlists', 'playlist_tracks', 'user_ai_quotas')
ORDER BY tablename, indexname;

-- 5. 檢查 RLS 政策是否正確啟用
SELECT tablename, policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('music_tracks', 'playlists', 'playlist_tracks', 'user_ai_quotas')
ORDER BY tablename, policyname;
```

## 資料庫架構總覽

### music_tracks (音樂庫)
- 儲存使用者 AI 生成音樂和系統預設音樂
- 包含 4 個索引 (user_id, created_at, parameters GIN, is_system)
- RLS 政策: 使用者僅能存取自己的音樂、系統音樂和公開音樂
- 初始化 4 首系統預設音樂: Synthwave, Divination, Lo-fi, Ambient

### playlists (播放清單)
- 每位使用者最多 5 個播放清單
- 每位使用者有唯一的預設播放清單 (is_default = TRUE)
- RLS 政策: 使用者僅能存取自己的播放清單
- 自動為新使用者建立「我的最愛」預設播放清單

### playlist_tracks (播放清單歌曲關聯)
- 多對多關聯表 (playlist_id ↔ track_id)
- UNIQUE 約束: 同一播放清單不可重複加入同一首歌
- 自動計算 position (順序號)
- 刪除後自動重新計算剩餘歌曲的 position
- 自動將 4 首系統音樂加入新使用者的預設播放清單

### user_ai_quotas (AI 生成配額追蹤)
- 追蹤每位使用者的月度 AI 生成配額
- 預設配額: 20 次/月 (免費使用者)
- 自動為新使用者建立配額記錄
- 提供輔助函數: check_quota_available(), increment_quota_usage(), get_remaining_quota()

### cron_job_logs (排程任務日誌)
- 記錄 pg_cron 排程任務的執行結果
- 用於監控月度配額重置任務

## 重要功能

### 自動觸發器

1. **update_updated_at_column()**: 自動更新 updated_at 欄位 (套用至所有表)
2. **create_default_playlist_for_new_user()**: 新使用者自動建立預設播放清單
3. **add_system_tracks_to_default_playlist()**: 新使用者預設播放清單自動加入 4 首系統音樂
4. **check_playlist_limit()**: 檢查播放清單數量限制 (最多 5 個)
5. **auto_calculate_position()**: 自動計算新音樂的 position
6. **reorder_positions_after_delete()**: 刪除後自動重新計算 position
7. **create_quota_for_new_user()**: 新使用者自動建立配額記錄

### pg_cron 排程任務

- **任務名稱**: monthly-ai-quota-reset
- **執行時間**: 每月 1 日 00:00 (Cron: `0 0 1 * *`)
- **功能**: 重置所有使用者的 AI 生成配額 (used_count = 0, reset_at = next month)
- **錯誤處理**: 失敗時記錄至 cron_job_logs 表

## 手動測試函數

### 測試配額重置

```sql
-- 手動觸發配額重置 (用於測試)
SELECT * FROM manual_reset_ai_quotas();

-- 查看配額重置日誌
SELECT * FROM cron_job_logs
WHERE job_name = 'monthly_quota_reset'
ORDER BY execution_time DESC
LIMIT 10;
```

### 查詢排程任務狀態

```sql
-- 查詢 pg_cron 任務狀態
SELECT * FROM get_cron_job_status();
```

### 測試配額功能

```sql
-- 檢查使用者配額是否足夠
SELECT check_quota_available('USER_ID_HERE');

-- 取得使用者剩餘配額
SELECT get_remaining_quota('USER_ID_HERE');

-- 增加配額使用次數
SELECT increment_quota_usage('USER_ID_HERE');
```

## 回滾 Migrations (謹慎使用)

如果需要回滾 migrations,請按照相反順序執行:

```sql
-- 1. 刪除 pg_cron 任務
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'monthly-ai-quota-reset';
DROP TABLE IF EXISTS cron_job_logs;

-- 2. 刪除 user_ai_quotas 表
DROP TABLE IF EXISTS user_ai_quotas;

-- 3. 刪除 playlist_tracks 表
DROP TABLE IF EXISTS playlist_tracks;

-- 4. 刪除 playlists 表
DROP TABLE IF EXISTS playlists;

-- 5. 刪除 music_tracks 表
DROP TABLE IF EXISTS music_tracks;

-- 6. 刪除所有觸發函數
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS create_default_playlist_for_new_user();
DROP FUNCTION IF EXISTS add_system_tracks_to_default_playlist();
DROP FUNCTION IF EXISTS check_playlist_limit();
DROP FUNCTION IF EXISTS auto_calculate_position();
DROP FUNCTION IF EXISTS reorder_positions_after_delete();
DROP FUNCTION IF EXISTS create_quota_for_new_user();
DROP FUNCTION IF EXISTS check_quota_available(UUID);
DROP FUNCTION IF EXISTS increment_quota_usage(UUID);
DROP FUNCTION IF EXISTS get_remaining_quota(UUID);
DROP FUNCTION IF EXISTS reset_monthly_ai_quotas();
DROP FUNCTION IF EXISTS manual_reset_ai_quotas();
DROP FUNCTION IF EXISTS get_cron_job_status();
```

## 疑難排解

### 問題 1: pg_cron 擴充未安裝

**錯誤訊息**: `extension "pg_cron" does not exist`

**解決方案**:
```sql
-- 在 Supabase Dashboard 的 SQL Editor 中執行
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### 問題 2: 系統音樂未初始化

**檢查方法**:
```sql
SELECT COUNT(*) FROM music_tracks WHERE is_system = TRUE;
```

**解決方案**: 重新執行 migration `20250111000000_create_music_tracks.sql` 中的 INSERT 語句

### 問題 3: RLS 政策阻擋查詢

**檢查方法**:
```sql
SELECT * FROM pg_policies WHERE tablename = 'music_tracks';
```

**解決方案**: 確保使用者已正確登入,並檢查 RLS 政策條件

## 相關文件

- 需求文件: `.kiro/specs/playlist-music-player/requirements.md`
- 技術設計: `.kiro/specs/playlist-music-player/design.md`
- 實作計畫: `.kiro/specs/playlist-music-player/tasks.md`

## 聯絡資訊

如有問題,請參考專案 README 或聯絡開發團隊。
