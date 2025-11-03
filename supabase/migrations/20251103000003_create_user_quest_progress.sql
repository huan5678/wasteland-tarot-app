-- =============================================
-- Migration: 建立 user_quest_progress 資料表
-- Description: 使用者任務進度追蹤表，記錄任務狀態與完成情況
-- Requirements: unified-karma-system/Requirement 4
-- Task: 1.4
-- =============================================

-- 建立 user_quest_progress 資料表
CREATE TABLE IF NOT EXISTS user_quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,                                       -- 使用者 ID (FK to users)
  quest_id UUID NOT NULL,                                      -- 任務 ID (FK to quests)
  status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',             -- 任務狀態: AVAILABLE, IN_PROGRESS, COMPLETED, CLAIMED
  current_progress INTEGER NOT NULL DEFAULT 0,                 -- 當前進度值
  target_progress INTEGER NOT NULL,                            -- 目標進度值（從 quest.objectives.target 複製）
  available_at TIMESTAMP WITH TIME ZONE NOT NULL,              -- 任務可用時間
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,                -- 任務過期時間
  started_at TIMESTAMP WITH TIME ZONE,                         -- 任務開始時間
  completed_at TIMESTAMP WITH TIME ZONE,                       -- 任務完成時間
  claimed_at TIMESTAMP WITH TIME ZONE,                         -- 獎勵領取時間
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- 約束條件
  CONSTRAINT check_quest_status CHECK (status IN ('AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'CLAIMED')),
  CONSTRAINT check_progress_range CHECK (current_progress >= 0 AND current_progress <= target_progress),
  CONSTRAINT check_target_positive CHECK (target_progress > 0),
  CONSTRAINT check_time_sequence CHECK (available_at < expires_at),
  CONSTRAINT check_started_after_available CHECK (started_at IS NULL OR started_at >= available_at),
  CONSTRAINT check_completed_after_started CHECK (completed_at IS NULL OR (started_at IS NOT NULL AND completed_at >= started_at)),
  CONSTRAINT check_claimed_after_completed CHECK (claimed_at IS NULL OR (completed_at IS NOT NULL AND claimed_at >= completed_at)),
  
  -- 外鍵約束
  CONSTRAINT fk_user_quest_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_quest_progress_quest FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE,
  
  -- 唯一約束：每個使用者在同一時間段內只能有一次相同任務的記錄
  CONSTRAINT uq_user_quest_period UNIQUE (user_id, quest_id, available_at)
);

-- =============================================
-- 建立索引以優化查詢效能
-- =============================================

-- 索引 1: user_id (使用者任務查詢)
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_user ON user_quest_progress USING btree (user_id);

-- 索引 2: quest_id (任務進度統計)
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_quest ON user_quest_progress USING btree (quest_id);

-- 索引 3: status (任務狀態篩選)
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_status ON user_quest_progress USING btree (status);

-- 索引 4: user_id + status (使用者活躍任務查詢 - 最常用)
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_user_status ON user_quest_progress USING btree (user_id, status);

-- 索引 5: user_id + expires_at (過期任務清理)
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_user_expires ON user_quest_progress USING btree (user_id, expires_at);

-- 索引 6: available_at (時間範圍查詢)
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_available_at ON user_quest_progress USING btree (available_at);

-- 索引 7: expires_at (過期任務批次處理)
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_expires_at ON user_quest_progress USING btree (expires_at);

-- 索引 8: completed_at (統計與排行榜)
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_completed_at ON user_quest_progress USING btree (completed_at) WHERE completed_at IS NOT NULL;

-- 索引 9: user_id + quest_id (任務檢查，支援 UNIQUE 約束)
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_user_quest ON user_quest_progress USING btree (user_id, quest_id);

-- =============================================
-- 建立自動觸發器：更新 updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_user_quest_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_quest_progress_updated_at
  BEFORE UPDATE ON user_quest_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_user_quest_progress_updated_at();

-- =============================================
-- 建立自動觸發器：狀態轉換時間戳記
-- =============================================

CREATE OR REPLACE FUNCTION auto_set_quest_progress_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- 當任務從 AVAILABLE 變為 IN_PROGRESS 時，設定 started_at
  IF OLD.status = 'AVAILABLE' AND NEW.status = 'IN_PROGRESS' AND NEW.started_at IS NULL THEN
    NEW.started_at = NOW();
  END IF;
  
  -- 當任務變為 COMPLETED 時，設定 completed_at
  IF OLD.status != 'COMPLETED' AND NEW.status = 'COMPLETED' AND NEW.completed_at IS NULL THEN
    NEW.completed_at = NOW();
  END IF;
  
  -- 當任務變為 CLAIMED 時，設定 claimed_at
  IF OLD.status != 'CLAIMED' AND NEW.status = 'CLAIMED' AND NEW.claimed_at IS NULL THEN
    NEW.claimed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_set_quest_progress_timestamps
  BEFORE UPDATE ON user_quest_progress
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_quest_progress_timestamps();

-- =============================================
-- 建立視圖：活躍任務 (Active Quests)
-- =============================================

CREATE OR REPLACE VIEW v_active_quest_progress AS
SELECT 
  uqp.id,
  uqp.user_id,
  uqp.quest_id,
  q.code AS quest_code,
  q.name_zh_tw AS quest_name,
  q.type AS quest_type,
  q.category AS quest_category,
  q.difficulty AS quest_difficulty,
  uqp.status,
  uqp.current_progress,
  uqp.target_progress,
  ROUND(uqp.current_progress::NUMERIC / uqp.target_progress * 100, 2) AS progress_percentage,
  uqp.available_at,
  uqp.expires_at,
  (uqp.expires_at - NOW()) AS time_remaining,
  q.rewards,
  uqp.created_at,
  uqp.updated_at
FROM user_quest_progress uqp
JOIN quests q ON uqp.quest_id = q.id
WHERE 
  uqp.status IN ('AVAILABLE', 'IN_PROGRESS', 'COMPLETED')
  AND uqp.expires_at > NOW()
  AND q.is_active = TRUE;

-- 為視圖建立註釋
COMMENT ON VIEW v_active_quest_progress IS '活躍任務視圖：顯示未過期且未領取的任務，包含進度百分比與剩餘時間';

-- =============================================
-- 建立視圖：已完成任務統計 (Completed Quest Stats)
-- =============================================

CREATE OR REPLACE VIEW v_user_quest_stats AS
SELECT 
  user_id,
  COUNT(*) AS total_quests,
  COUNT(*) FILTER (WHERE status = 'CLAIMED') AS claimed_quests,
  COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed_unclaimed,
  COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') AS in_progress_quests,
  COUNT(*) FILTER (WHERE status = 'AVAILABLE') AS available_quests,
  COUNT(*) FILTER (WHERE expires_at < NOW() AND status NOT IN ('COMPLETED', 'CLAIMED')) AS expired_quests,
  SUM((q.rewards->>'karma_points')::INTEGER) FILTER (WHERE uqp.status = 'CLAIMED') AS total_karma_earned,
  MIN(uqp.claimed_at) AS first_claim_date,
  MAX(uqp.claimed_at) AS last_claim_date,
  COUNT(DISTINCT DATE(uqp.claimed_at)) AS active_days
FROM user_quest_progress uqp
JOIN quests q ON uqp.quest_id = q.id
GROUP BY user_id;

COMMENT ON VIEW v_user_quest_stats IS '使用者任務統計視圖：總任務數、完成數、獲得 Karma、活躍天數等';

-- =============================================
-- 資料驗證與統計
-- =============================================

DO $$
DECLARE
  table_exists BOOLEAN;
  index_count INTEGER;
  trigger_count INTEGER;
  view_count INTEGER;
BEGIN
  -- 檢查表是否建立成功
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_quest_progress'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE EXCEPTION 'user_quest_progress 表建立失敗';
  END IF;
  
  -- 檢查索引數量
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename = 'user_quest_progress';
  
  -- 檢查觸發器數量
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgrelid = 'user_quest_progress'::regclass;
  
  -- 檢查視圖數量
  SELECT COUNT(*) INTO view_count
  FROM pg_views
  WHERE viewname IN ('v_active_quest_progress', 'v_user_quest_stats');
  
  -- 輸出統計報告
  RAISE NOTICE '========================================';
  RAISE NOTICE 'user_quest_progress 表建立成功';
  RAISE NOTICE '========================================';
  RAISE NOTICE '表狀態: 已建立';
  RAISE NOTICE '索引數量: % (預期: 10)', index_count;
  RAISE NOTICE '觸發器數量: % (預期: 4)', trigger_count;
  RAISE NOTICE '視圖數量: % (預期: 2)', view_count;
  RAISE NOTICE '約束條件: 7 個 CHECK + 2 個 FK + 1 個 UNIQUE';
  RAISE NOTICE '========================================';
  
  -- 驗證必要條件
  IF index_count < 10 THEN
    RAISE WARNING '索引數量不足，預期至少 10 個';
  END IF;
  
  IF trigger_count < 4 THEN
    RAISE WARNING '觸發器數量不足，預期至少 4 個';
  END IF;
  
  IF view_count < 2 THEN
    RAISE WARNING '視圖數量不足，預期 2 個';
  END IF;
  
  RAISE NOTICE '資料驗證完成！';
END $$;
