# 修復 completed_readings CASCADE DELETE

## 問題描述

測試發現 `completed_readings.user_id` 的 Foreign Key 約束缺少 `ON DELETE CASCADE`，導致無法刪除有 completed_readings 的使用者。

## 執行步驟

1. 打開 Supabase Dashboard
2. 前往 SQL Editor
3. 執行 `fix_completed_readings_cascade.sql` 的內容
4. 確認輸出顯示 `delete_rule = 'CASCADE'`

## 預期結果

```
table_name          | column_name | foreign_table_name | foreign_column_name | delete_rule
--------------------+-------------+--------------------+---------------------+------------
completed_readings  | user_id     | users              | id                  | CASCADE
```

## 驗證

執行後重新運行測試：
```bash
.venv/bin/python test_db_operations.py
```

預期所有 5 個測試應該全部通過。
