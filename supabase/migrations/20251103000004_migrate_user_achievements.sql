-- =============================================
-- Migration: 遷移 user_achievements 至新結構
-- Description: 將舊版 user_achievements 資料轉換至 achievements + user_achievement_progress
-- Requirements: unified-karma-system/Requirement 2
-- Task: 1.5
-- =============================================

-- 步驟 1: 檢查舊表是否存在
DO $$
DECLARE
  old_table_exists BOOLEAN;
  old_table_count INTEGER;
BEGIN
  -- 檢查 user_achievements 表是否存在
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_achievements'
  ) INTO old_table_exists;
  
  IF old_table_exists THEN
    -- 統計舊表資料筆數
    EXECUTE 'SELECT COUNT(*) FROM user_achievements' INTO old_table_count;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '發現舊版 user_achievements 表';
    RAISE NOTICE '資料筆數: %', old_table_count;
    RAISE NOTICE '========================================';
    
    IF old_table_count > 0 THEN
      RAISE NOTICE '開始資料遷移...';
    ELSE
      RAISE NOTICE '表為空，跳過資料遷移';
    END IF;
  ELSE
    RAISE NOTICE '========================================';
    RAISE NOTICE 'user_achievements 表不存在';
    RAISE NOTICE '無需遷移，腳本結束';
    RAISE NOTICE '========================================';
  END IF;
END $$;

-- =============================================
-- 步驟 2: 建立遷移輔助函式
-- =============================================

CREATE OR REPLACE FUNCTION migrate_user_achievements_to_new_structure()
RETURNS TABLE (
  migrated_achievements INTEGER,
  migrated_progress INTEGER,
  skipped_records INTEGER,
  errors INTEGER
) AS $$
DECLARE
  v_old_record RECORD;
  v_achievement_id UUID;
  v_migrated_achievements INTEGER := 0;
  v_migrated_progress INTEGER := 0;
  v_skipped_records INTEGER := 0;
  v_errors INTEGER := 0;
BEGIN
  -- 檢查舊表是否存在
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_achievements') THEN
    RAISE NOTICE '舊表 user_achievements 不存在，無需遷移';
    RETURN QUERY SELECT 0, 0, 0, 0;
    RETURN;
  END IF;
  
  RAISE NOTICE '開始遷移 user_achievements 資料...';
  
  -- 遍歷舊表的所有記錄
  FOR v_old_record IN 
    SELECT * FROM user_achievements
  LOOP
    BEGIN
      -- 檢查 achievement 是否已存在於新表
      SELECT id INTO v_achievement_id
      FROM achievements
      WHERE code = v_old_record.achievement_id;
      
      -- 如果 achievement 不存在，建立新的 achievement 記錄
      IF v_achievement_id IS NULL THEN
        INSERT INTO achievements (
          code,
          name_zh_tw,
          description_zh_tw,
          category,
          rarity,
          icon_name,
          icon_image_url,
          criteria,
          rewards,
          is_hidden,
          is_active,
          display_order
        ) VALUES (
          v_old_record.achievement_id,
          v_old_record.achievement_name,
          v_old_record.description,
          v_old_record.achievement_category,
          UPPER(v_old_record.rarity),  -- 轉換為大寫 (common → COMMON)
          'award',  -- 預設圖示
          v_old_record.badge_image_url,
          jsonb_build_object(
            'type', 'GENERIC',
            'target', v_old_record.progress_required,
            'filters', '{}'::jsonb
          ),
          jsonb_build_object(
            'karma_points', COALESCE(v_old_record.karma_reward, 0),
            'experience_points', COALESCE(v_old_record.experience_points, 0),
            'special_privileges', COALESCE(v_old_record.special_privileges, '[]'::json)
          ),
          FALSE,  -- is_hidden
          TRUE,   -- is_active
          0       -- display_order
        )
        RETURNING id INTO v_achievement_id;
        
        v_migrated_achievements := v_migrated_achievements + 1;
        RAISE NOTICE '  ✓ 建立新 achievement: % (ID: %)', v_old_record.achievement_name, v_achievement_id;
      END IF;
      
      -- 檢查 user_achievement_progress 是否已存在
      IF NOT EXISTS (
        SELECT 1 FROM user_achievement_progress
        WHERE user_id = v_old_record.user_id
        AND achievement_id = v_achievement_id
      ) THEN
        -- 建立 user_achievement_progress 記錄
        INSERT INTO user_achievement_progress (
          user_id,
          achievement_id,
          current_progress,
          target_progress,
          status,
          unlocked_at,
          claimed_at,
          created_at,
          updated_at
        ) VALUES (
          v_old_record.user_id,
          v_achievement_id,
          v_old_record.progress_current,
          v_old_record.progress_required,
          CASE 
            WHEN v_old_record.is_completed AND v_old_record.karma_reward > 0 THEN 'CLAIMED'
            WHEN v_old_record.is_completed THEN 'UNLOCKED'
            ELSE 'IN_PROGRESS'
          END,
          v_old_record.completion_date,  -- unlocked_at
          CASE WHEN v_old_record.is_completed AND v_old_record.karma_reward > 0 
               THEN v_old_record.completion_date 
               ELSE NULL 
          END,  -- claimed_at
          v_old_record.created_at,
          v_old_record.updated_at
        );
        
        v_migrated_progress := v_migrated_progress + 1;
      ELSE
        v_skipped_records := v_skipped_records + 1;
        RAISE NOTICE '  ⚠ 跳過重複記錄: user_id=%, achievement=%', 
          v_old_record.user_id, v_old_record.achievement_name;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      RAISE WARNING '  ✗ 遷移記錄失敗: % (錯誤: %)', v_old_record.achievement_name, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '遷移完成！';
  RAISE NOTICE '  - 建立的 achievements: %', v_migrated_achievements;
  RAISE NOTICE '  - 遷移的 user_achievement_progress: %', v_migrated_progress;
  RAISE NOTICE '  - 跳過的記錄: %', v_skipped_records;
  RAISE NOTICE '  - 錯誤數量: %', v_errors;
  
  RETURN QUERY SELECT v_migrated_achievements, v_migrated_progress, v_skipped_records, v_errors;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 步驟 3: 執行資料遷移
-- =============================================

DO $$
DECLARE
  migration_result RECORD;
  old_table_exists BOOLEAN;
BEGIN
  -- 檢查舊表是否存在
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_achievements'
  ) INTO old_table_exists;
  
  IF NOT old_table_exists THEN
    RAISE NOTICE '舊表不存在，跳過遷移';
    RETURN;
  END IF;
  
  -- 執行遷移
  SELECT * INTO migration_result 
  FROM migrate_user_achievements_to_new_structure();
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '遷移統計';
  RAISE NOTICE '========================================';
  RAISE NOTICE '建立的 achievements: %', migration_result.migrated_achievements;
  RAISE NOTICE '遷移的 progress 記錄: %', migration_result.migrated_progress;
  RAISE NOTICE '跳過的記錄: %', migration_result.skipped_records;
  RAISE NOTICE '錯誤: %', migration_result.errors;
  RAISE NOTICE '========================================';
END $$;

-- =============================================
-- 步驟 4: 資料完整性驗證
-- =============================================

DO $$
DECLARE
  old_count INTEGER;
  new_achievements_count INTEGER;
  new_progress_count INTEGER;
  validation_passed BOOLEAN := TRUE;
BEGIN
  -- 檢查舊表是否存在
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_achievements') THEN
    RAISE NOTICE '舊表不存在，跳過驗證';
    RETURN;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '資料完整性驗證';
  RAISE NOTICE '========================================';
  
  -- 統計舊表資料
  EXECUTE 'SELECT COUNT(*) FROM user_achievements' INTO old_count;
  
  -- 統計新表資料
  SELECT COUNT(*) INTO new_achievements_count FROM achievements;
  SELECT COUNT(*) INTO new_progress_count FROM user_achievement_progress;
  
  RAISE NOTICE '舊表 user_achievements 記錄數: %', old_count;
  RAISE NOTICE '新表 achievements 記錄數: %', new_achievements_count;
  RAISE NOTICE '新表 user_achievement_progress 記錄數: %', new_progress_count;
  
  -- 驗證：user_achievement_progress 記錄數應該 >= 舊表記錄數
  IF new_progress_count < old_count THEN
    RAISE WARNING '⚠ 警告：新表記錄數少於舊表！可能有資料遺失';
    validation_passed := FALSE;
  ELSE
    RAISE NOTICE '✓ 記錄數驗證通過';
  END IF;
  
  -- 驗證：所有 user_achievement_progress 都有對應的 achievement
  IF EXISTS (
    SELECT 1 FROM user_achievement_progress uap
    LEFT JOIN achievements a ON uap.achievement_id = a.id
    WHERE a.id IS NULL
  ) THEN
    RAISE WARNING '⚠ 警告：發現孤立的 user_achievement_progress 記錄';
    validation_passed := FALSE;
  ELSE
    RAISE NOTICE '✓ 外鍵關聯驗證通過';
  END IF;
  
  -- 驗證：進度值合理性
  IF EXISTS (
    SELECT 1 FROM user_achievement_progress
    WHERE current_progress < 0 OR target_progress <= 0
  ) THEN
    RAISE WARNING '⚠ 警告：發現不合理的進度值';
    validation_passed := FALSE;
  ELSE
    RAISE NOTICE '✓ 進度值驗證通過';
  END IF;
  
  RAISE NOTICE '========================================';
  
  IF validation_passed THEN
    RAISE NOTICE '✅ 所有驗證通過！';
  ELSE
    RAISE WARNING '⚠️  部分驗證失敗，請檢查警告訊息';
  END IF;
END $$;

-- =============================================
-- 步驟 5: 重命名舊表
-- =============================================

DO $$
DECLARE
  old_table_exists BOOLEAN;
  deprecated_table_exists BOOLEAN;
BEGIN
  -- 檢查舊表是否存在
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_achievements'
  ) INTO old_table_exists;
  
  -- 檢查 deprecated 表是否已存在
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_achievements_deprecated'
  ) INTO deprecated_table_exists;
  
  IF old_table_exists THEN
    IF deprecated_table_exists THEN
      -- 如果 deprecated 表已存在，先刪除它
      RAISE NOTICE '刪除既有的 user_achievements_deprecated 表...';
      DROP TABLE user_achievements_deprecated CASCADE;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '重命名舊表';
    RAISE NOTICE '========================================';
    RAISE NOTICE '將 user_achievements 重命名為 user_achievements_deprecated';
    RAISE NOTICE '保留期限: 1 個月';
    RAISE NOTICE '========================================';
    
    -- 重命名表
    ALTER TABLE user_achievements RENAME TO user_achievements_deprecated;
    
    -- 新增註釋標記保留期限
    COMMENT ON TABLE user_achievements_deprecated IS 
      '已棄用的成就表，遷移完成日期: ' || CURRENT_DATE::TEXT || 
      '，預計刪除日期: ' || (CURRENT_DATE + INTERVAL '1 month')::TEXT;
    
    RAISE NOTICE '✅ 表已重命名為 user_achievements_deprecated';
  ELSE
    RAISE NOTICE '舊表不存在，無需重命名';
  END IF;
END $$;

-- =============================================
-- 步驟 6: 清理遷移輔助函式
-- =============================================

DROP FUNCTION IF EXISTS migrate_user_achievements_to_new_structure();

-- =============================================
-- 步驟 7: 建立清理腳本（僅輸出指令，不執行）
-- =============================================

DO $$
DECLARE
  delete_date DATE;
BEGIN
  delete_date := CURRENT_DATE + INTERVAL '1 month';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '清理腳本';
  RAISE NOTICE '========================================';
  RAISE NOTICE '在 % 之後，執行以下 SQL 刪除 deprecated 表:', delete_date;
  RAISE NOTICE '';
  RAISE NOTICE 'DROP TABLE IF EXISTS user_achievements_deprecated CASCADE;';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- =============================================
-- 最終統計報告
-- =============================================

DO $$
DECLARE
  achievements_count INTEGER;
  progress_count INTEGER;
  deprecated_exists BOOLEAN;
  deprecated_count INTEGER := 0;
BEGIN
  -- 統計新表資料
  SELECT COUNT(*) INTO achievements_count FROM achievements;
  SELECT COUNT(*) INTO progress_count FROM user_achievement_progress;
  
  -- 檢查 deprecated 表
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_achievements_deprecated'
  ) INTO deprecated_exists;
  
  IF deprecated_exists THEN
    EXECUTE 'SELECT COUNT(*) FROM user_achievements_deprecated' INTO deprecated_count;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔══════════════════════════════════════════════════════╗';
  RAISE NOTICE '║       Task 1.5 Migration Completion Summary          ║';
  RAISE NOTICE '╚══════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✅ 遷移完成！';
  RAISE NOTICE '';
  RAISE NOTICE '當前資料狀態:';
  RAISE NOTICE '  • achievements 表: % 筆記錄', achievements_count;
  RAISE NOTICE '  • user_achievement_progress 表: % 筆記錄', progress_count;
  
  IF deprecated_exists THEN
    RAISE NOTICE '  • user_achievements_deprecated 表: % 筆記錄 (保留 1 個月)', deprecated_count;
  ELSE
    RAISE NOTICE '  • user_achievements 表: 不存在（已遷移或未曾建立）';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '下一步:';
  RAISE NOTICE '  1. 驗證新表資料正確性';
  RAISE NOTICE '  2. 更新程式碼 imports (UserAchievement → UserAchievementProgress)';
  RAISE NOTICE '  3. 1 個月後刪除 user_achievements_deprecated 表';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;
