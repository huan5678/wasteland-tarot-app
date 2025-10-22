# AI System Prompt 資料庫更新 - 執行指南

## 前置檢查

在執行更新前，請確認：
- [ ] 你有資料庫的連接權限
- [ ] 資料庫已創建 `characters` 表（由之前的 migration 創建）
- [ ] 你知道資料庫的連接資訊（host, port, database, user, password）

---

## 方法 1：使用 psql 命令行（推薦）

### Step 1：備份現有資料

```bash
# 備份整個 characters 表
pg_dump -h <host> -p <port> -U <user> -d <database> -t characters \
  > backup_characters_$(date +%Y%m%d_%H%M%S).sql

# 或只備份 ai_system_prompt 欄位
psql -h <host> -p <port> -U <user> -d <database> <<EOF
COPY (
  SELECT id, key, ai_system_prompt, ai_tone_description, ai_prompt_config
  FROM characters
  WHERE key IN ('pip_boy', 'vault_dweller', 'wasteland_trader', 'codsworth', 'super_mutant', 'ghoul')
) TO STDOUT WITH CSV HEADER;
EOF > backup_character_prompts_$(date +%Y%m%d_%H%M%S).csv
```

### Step 2：執行更新腳本

```bash
# 執行 SQL 更新
psql -h <host> -p <port> -U <user> -d <database> \
  -f .kiro/specs/refactor-tarot-system-prompt/update_character_prompts.sql
```

### Step 3：驗證更新結果

```bash
psql -h <host> -p <port> -U <user> -d <database> <<EOF
SELECT
    key,
    LENGTH(ai_system_prompt) as prompt_length,
    ai_tone_description,
    ai_prompt_config->>'style' as style
FROM characters
WHERE key IN ('pip_boy', 'vault_dweller', 'wasteland_trader', 'codsworth', 'super_mutant', 'ghoul')
ORDER BY key;
EOF
```

**預期結果**：
```
        key         | prompt_length |     ai_tone_description      |      style
--------------------+---------------+------------------------------+-----------------
 codsworth          |          3500 | 溫文有禮、略帶英式正式感... | formal_caring
 ghoul              |          3600 | 滄桑、智慧、略帶苦澀...     | wise_survivor
 pip_boy            |          3200 | 理性、精確、溫和...         | analytical
 super_mutant       |          2800 | 直接、簡樸、有力...         | minimalist_direct
 vault_dweller      |          3800 | 真誠、略帶脆弱...           | narrative
 wasteland_trader   |          3300 | 精明、務實、幽默...         | pragmatic
```

---

## 方法 2：使用 Python 腳本

### Step 1：創建獨立更新腳本

創建文件 `update_prompts.py`：

```python
#!/usr/bin/env python3
"""
獨立的 AI System Prompt 更新腳本
不依賴專案環境，可直接執行
"""

import asyncio
import asyncpg
import os
from datetime import datetime

# 資料庫連接資訊（從環境變數或直接填寫）
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "database": os.getenv("DB_NAME", "postgres"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "your_password_here"),
}

async def backup_characters(conn):
    """備份現有的 characters 資料"""
    print("📦 備份現有資料...")

    backup_query = """
    SELECT id, key, ai_system_prompt, ai_tone_description, ai_prompt_config
    FROM characters
    WHERE key IN ('pip_boy', 'vault_dweller', 'wasteland_trader', 'codsworth', 'super_mutant', 'ghoul')
    """

    rows = await conn.fetch(backup_query)

    backup_file = f"backup_characters_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    with open(backup_file, 'w', encoding='utf-8') as f:
        for row in rows:
            f.write(f"=== {row['key']} ===\n")
            f.write(f"ID: {row['id']}\n")
            f.write(f"Prompt Length: {len(row['ai_system_prompt'] or '')}\n")
            f.write(f"Tone: {row['ai_tone_description']}\n")
            f.write(f"Config: {row['ai_prompt_config']}\n")
            f.write(f"\n{'-'*60}\n\n")

    print(f"✅ 備份已儲存至：{backup_file}")
    return len(rows)

async def execute_sql_file(conn, sql_file_path):
    """執行 SQL 檔案"""
    print(f"🔄 執行 SQL 檔案：{sql_file_path}")

    with open(sql_file_path, 'r', encoding='utf-8') as f:
        sql = f.read()

    # 執行 SQL（跳過驗證查詢）
    statements = sql.split(';')
    executed = 0

    for statement in statements:
        statement = statement.strip()
        if statement and not statement.startswith('--') and 'SELECT' not in statement:
            await conn.execute(statement)
            executed += 1

    print(f"✅ 已執行 {executed} 個 SQL 語句")

async def verify_update(conn):
    """驗證更新結果"""
    print("\n🔍 驗證更新結果...")

    verify_query = """
    SELECT
        key,
        LENGTH(ai_system_prompt) as prompt_length,
        ai_tone_description,
        ai_prompt_config->>'style' as style,
        SUBSTRING(ai_system_prompt, 1, 50) as prompt_preview
    FROM characters
    WHERE key IN ('pip_boy', 'vault_dweller', 'wasteland_trader', 'codsworth', 'super_mutant', 'ghoul')
    ORDER BY key
    """

    rows = await conn.fetch(verify_query)

    print(f"\n{'角色':<20} | {'Prompt 長度':<12} | {'風格':<20}")
    print("-" * 60)

    success_count = 0
    for row in rows:
        status = "✅" if row['prompt_length'] > 2000 else "⚠️"
        print(f"{status} {row['key']:<18} | {row['prompt_length']:<12} | {row['style'] or 'N/A':<20}")
        if row['prompt_length'] > 2000:
            success_count += 1

    print(f"\n✅ 成功更新：{success_count}/6 個角色")
    return success_count == 6

async def main():
    """主執行函式"""
    print("=" * 60)
    print("🎲 廢土塔羅 AI System Prompt 更新腳本")
    print("=" * 60)

    # 連接資料庫
    try:
        print(f"\n🔌 連接資料庫：{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
        conn = await asyncpg.connect(**DB_CONFIG)
        print("✅ 資料庫連接成功")
    except Exception as e:
        print(f"❌ 資料庫連接失敗：{e}")
        print("\n請檢查：")
        print("  1. 資料庫連接資訊是否正確")
        print("  2. 資料庫是否正在運行")
        print("  3. 網路連接是否正常")
        return

    try:
        # 備份
        backup_count = await backup_characters(conn)
        print(f"已備份 {backup_count} 個角色的資料")

        # 確認執行
        print("\n⚠️  即將更新資料庫，這會覆蓋現有的 ai_system_prompt 欄位")
        confirm = input("確定要繼續嗎？(yes/no): ")

        if confirm.lower() not in ['yes', 'y']:
            print("❌ 已取消更新")
            return

        # 執行更新
        sql_file = ".kiro/specs/refactor-tarot-system-prompt/update_character_prompts.sql"
        await execute_sql_file(conn, sql_file)

        # 驗證
        success = await verify_update(conn)

        if success:
            print("\n🎉 更新完成！所有角色的 prompt 已成功更新")
        else:
            print("\n⚠️  更新完成，但部分角色可能未正確更新，請手動檢查")

    except Exception as e:
        print(f"\n❌ 更新過程中發生錯誤：{e}")
        print("\n可以從備份檔案中恢復資料")

    finally:
        await conn.close()
        print("\n✅ 資料庫連接已關閉")

if __name__ == "__main__":
    # 安裝依賴：pip install asyncpg
    asyncio.run(main())
```

### Step 2：安裝依賴並執行

```bash
# 安裝依賴
pip install asyncpg

# 設定環境變數（或直接修改腳本中的 DB_CONFIG）
export DB_HOST="your_db_host"
export DB_PORT="5432"
export DB_NAME="postgres"
export DB_USER="postgres"
export DB_PASSWORD="your_password"

# 執行更新
python update_prompts.py
```

---

## 方法 3：使用 Supabase SQL Editor（如果使用 Supabase）

### Step 1：登入 Supabase Dashboard

訪問：https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor

### Step 2：打開 SQL Editor

點擊左側選單的「SQL Editor」

### Step 3：執行備份查詢

```sql
-- 備份查詢（複製結果並儲存）
SELECT
    id,
    key,
    ai_system_prompt,
    ai_tone_description,
    ai_prompt_config
FROM characters
WHERE key IN ('pip_boy', 'vault_dweller', 'wasteland_trader', 'codsworth', 'super_mutant', 'ghoul');
```

### Step 4：執行更新

複製 `.kiro/specs/refactor-tarot-system-prompt/update_character_prompts.sql` 的內容，
貼到 SQL Editor 中並點擊「Run」

### Step 5：驗證

```sql
SELECT
    key,
    LENGTH(ai_system_prompt) as prompt_length,
    ai_tone_description,
    ai_prompt_config->>'style' as style
FROM characters
WHERE key IN ('pip_boy', 'vault_dweller', 'wasteland_trader', 'codsworth', 'super_mutant', 'ghoul')
ORDER BY key;
```

---

## 方法 4：使用 Alembic Migration（推薦用於正式環境）

### Step 1：創建 Migration

```bash
cd backend

# 創建新的 migration
alembic revision -m "update_character_system_prompts"
```

### Step 2：編輯 Migration 檔案

在新創建的 `alembic/versions/XXXX_update_character_system_prompts.py` 中：

```python
"""update_character_system_prompts

Revision ID: XXXX
Revises: YYYY
Create Date: 2025-01-XX XX:XX:XX
"""
from alembic import op
import sqlalchemy as sa

revision = 'XXXX'
down_revision = 'YYYY'

def upgrade() -> None:
    # 讀取並執行 SQL 檔案
    sql_file = "../.kiro/specs/refactor-tarot-system-prompt/update_character_prompts.sql"
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql = f.read()

    # 移除驗證查詢（只保留 UPDATE 語句）
    statements = [s.strip() for s in sql.split(';') if s.strip() and 'UPDATE' in s]

    for statement in statements:
        op.execute(statement)

def downgrade() -> None:
    # 降級時恢復為空（因為沒有舊資料）
    op.execute("""
        UPDATE characters SET
            ai_system_prompt = NULL,
            ai_tone_description = NULL,
            ai_prompt_config = NULL
        WHERE key IN ('pip_boy', 'vault_dweller', 'wasteland_trader', 'codsworth', 'super_mutant', 'ghoul')
    """)
```

### Step 3：執行 Migration

```bash
# 升級
alembic upgrade head

# 如需回滾
alembic downgrade -1
```

---

## 回滾步驟（如果需要復原）

### 使用備份檔案回滾

```bash
# 如果使用 pg_dump 備份
psql -h <host> -p <port> -U <user> -d <database> < backup_characters_YYYYMMDD_HHMMSS.sql
```

### 手動清空 prompt

```sql
UPDATE characters SET
    ai_system_prompt = NULL,
    ai_tone_description = NULL,
    ai_prompt_config = NULL
WHERE key IN ('pip_boy', 'vault_dweller', 'wasteland_trader', 'codsworth', 'super_mutant', 'ghoul');
```

---

## 常見問題

### Q1: 執行後顯示「0 rows updated」

**原因**：`characters` 表中沒有對應的角色記錄

**解決**：先執行角色初始化 seed：
```bash
python backend/app/db/seed_data.py
```

### Q2: 出現 "column ai_system_prompt does not exist"

**原因**：資料庫 schema 未更新

**解決**：執行相關 migration：
```bash
cd backend
alembic upgrade head
```

### Q3: Prompt 長度為 0 或很短

**原因**：SQL 檔案編碼問題或執行不完整

**解決**：
1. 確認 SQL 檔案使用 UTF-8 編碼
2. 手動複製單個 UPDATE 語句執行
3. 檢查是否有 SQL 語法錯誤

### Q4: 如何只更新特定角色？

修改 SQL 檔案，只保留需要更新的角色的 UPDATE 語句：

```sql
-- 只更新 Pip-Boy
UPDATE characters
SET ai_system_prompt = '...'
WHERE key = 'pip_boy';
```

---

## 驗證清單

更新完成後，請確認：

- [ ] 6 個角色都已更新（pip_boy, vault_dweller, wasteland_trader, codsworth, super_mutant, ghoul）
- [ ] `ai_system_prompt` 長度在 2500-4500 之間
- [ ] `ai_tone_description` 不為空
- [ ] `ai_prompt_config` 包含 "style" 欄位
- [ ] 備份檔案已妥善保存

---

## 需要協助？

如果遇到問題：
1. 檢查備份檔案是否完整
2. 查看資料庫連接日誌
3. 手動執行單個 UPDATE 語句測試
4. 參考 `COMPARISON.md` 了解預期結果

---

**注意**：執行前請務必備份資料！
