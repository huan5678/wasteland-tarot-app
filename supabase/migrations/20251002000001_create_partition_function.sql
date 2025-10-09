-- 建立每月分區的 SQL 函式
-- 供 Edge Function 呼叫使用

-- ============================================
-- 1. 建立分區建立函式
-- ============================================

CREATE OR REPLACE FUNCTION create_monthly_partition(
  table_name TEXT,
  partition_name TEXT,
  start_date DATE,
  end_date DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- 使用定義者權限執行
AS $$
BEGIN
  -- 檢查分區是否已存在
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = partition_name
    AND n.nspname = 'public'
  ) THEN
    RAISE NOTICE 'Partition % already exists', partition_name;
    RETURN FALSE;
  END IF;

  -- 建立分區
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
    partition_name,
    table_name,
    start_date,
    end_date
  );

  RAISE NOTICE 'Partition % created successfully', partition_name;
  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create partition %: %', partition_name, SQLERRM;
    RETURN FALSE;
END;
$$;

-- 授予執行權限給 service_role
GRANT EXECUTE ON FUNCTION create_monthly_partition(TEXT, TEXT, DATE, DATE) TO service_role;

-- ============================================
-- 2. 建立初始分區（當月與下月）
-- ============================================

-- 當月分區 (2025-10)
DO $$
DECLARE
  current_month_start DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  current_month_end DATE := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE;
  current_partition_name TEXT := 'user_bingo_cards_' || TO_CHAR(current_month_start, 'YYYY_MM');
BEGIN
  PERFORM create_monthly_partition(
    'user_bingo_cards',
    current_partition_name,
    current_month_start,
    current_month_end
  );
END $$;

-- 下月分區 (2025-11)
DO $$
DECLARE
  next_month_start DATE := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE;
  next_month_end DATE := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '2 months')::DATE;
  next_partition_name TEXT := 'user_bingo_cards_' || TO_CHAR(next_month_start, 'YYYY_MM');
BEGIN
  PERFORM create_monthly_partition(
    'user_bingo_cards',
    next_partition_name,
    next_month_start,
    next_month_end
  );
END $$;

-- ============================================
-- 3. 建立分區清理函式（可選）
-- ============================================

-- 刪除超過 N 個月的舊分區
CREATE OR REPLACE FUNCTION cleanup_old_partitions(
  table_name TEXT,
  months_to_keep INTEGER DEFAULT 6
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  partition_record RECORD;
  deleted_count INTEGER := 0;
  cutoff_date DATE := (CURRENT_DATE - (months_to_keep || ' months')::INTERVAL)::DATE;
BEGIN
  FOR partition_record IN
    SELECT
      c.relname AS partition_name,
      pg_get_expr(c.relpartbound, c.oid) AS partition_bound
    FROM pg_class c
    JOIN pg_inherits i ON i.inhrelid = c.oid
    JOIN pg_class p ON p.oid = i.inhparent
    WHERE p.relname = table_name
    AND c.relkind = 'r'
  LOOP
    -- 解析分區範圍 (簡化版本，假設命名格式為 table_YYYY_MM)
    -- 實際使用時建議加強解析邏輯
    IF partition_record.partition_name ~ '.*_[0-9]{4}_[0-9]{2}$' THEN
      -- 提取日期並檢查是否超過保留期限
      DECLARE
        partition_year TEXT := SUBSTRING(partition_record.partition_name FROM '([0-9]{4})_[0-9]{2}$');
        partition_month TEXT := SUBSTRING(partition_record.partition_name FROM '[0-9]{4}_([0-9]{2})$');
        partition_date DATE := (partition_year || '-' || partition_month || '-01')::DATE;
      BEGIN
        IF partition_date < cutoff_date THEN
          EXECUTE format('DROP TABLE IF EXISTS %I', partition_record.partition_name);
          deleted_count := deleted_count + 1;
          RAISE NOTICE 'Dropped old partition: %', partition_record.partition_name;
        END IF;
      END;
    END IF;
  END LOOP;

  RETURN deleted_count;
END;
$$;

-- 授予執行權限
GRANT EXECUTE ON FUNCTION cleanup_old_partitions(TEXT, INTEGER) TO service_role;

-- ============================================
-- 4. 查看現有分區
-- ============================================

-- 查看 user_bingo_cards 的所有分區
-- SELECT
--   c.relname AS partition_name,
--   pg_get_expr(c.relpartbound, c.oid) AS partition_bound
-- FROM pg_class c
-- JOIN pg_inherits i ON i.inhrelid = c.oid
-- JOIN pg_class p ON p.oid = i.inhparent
-- WHERE p.relname = 'user_bingo_cards'
-- ORDER BY c.relname;

-- ============================================
-- 5. 手動測試
-- ============================================

-- 測試建立分區
-- SELECT create_monthly_partition(
--   'user_bingo_cards',
--   'user_bingo_cards_2025_12',
--   '2025-12-01',
--   '2026-01-01'
-- );

-- 測試清理舊分區 (保留最近 6 個月)
-- SELECT cleanup_old_partitions('user_bingo_cards', 6);
