"""
執行 Character AI Prompt SQL 更新腳本
"""
import asyncio
import sys
from pathlib import Path
from sqlalchemy import text
from app.db.database import AsyncSessionLocal


async def execute_sql_update():
    """執行 SQL 更新腳本"""

    # 讀取 SQL 檔案
    sql_file = Path(__file__).parent.parent.parent / '.kiro/specs/refactor-tarot-system-prompt/update_character_prompts.sql'

    print(f"📂 讀取 SQL 檔案：{sql_file}")

    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    print(f"📝 SQL 檔案大小：{len(sql_content)} 字元")

    # 分割 SQL 語句（因為 AsyncPG 不支援 multi-statement）
    statements = []
    current_stmt = []

    for line in sql_content.split('\n'):
        # 跳過註解和空行
        stripped = line.strip()
        if stripped.startswith('--') or not stripped:
            continue

        current_stmt.append(line)

        # 遇到分號則結束當前語句
        if stripped.endswith(';'):
            statements.append('\n'.join(current_stmt))
            current_stmt = []

    print(f"📝 解析得到 {len(statements)} 個 SQL 語句\n")

    async with AsyncSessionLocal() as session:
        try:
            print("🔄 執行 SQL 更新...")

            for i, stmt in enumerate(statements, 1):
                if 'UPDATE' in stmt:
                    # 提取角色 key
                    import re
                    match = re.search(r"key = '(\w+)'", stmt)
                    char_key = match.group(1) if match else "unknown"
                    print(f"  [{i}/{len(statements)}] 更新 {char_key}...", end=' ')

                await session.execute(text(stmt))

                if 'UPDATE' in stmt:
                    print("✓")

            await session.commit()
            print("\n✅ 所有 SQL 更新成功執行\n")

            # 驗證結果
            result = await session.execute(text("""
                SELECT key,
                       LENGTH(ai_system_prompt) as prompt_length,
                       ai_tone_description,
                       ai_prompt_config::text as config
                FROM characters
                WHERE key IN ('pip_boy', 'vault_dweller', 'wasteland_trader', 'codsworth', 'super_mutant', 'ghoul')
                ORDER BY
                    CASE key
                        WHEN 'pip_boy' THEN 1
                        WHEN 'vault_dweller' THEN 2
                        WHEN 'wasteland_trader' THEN 3
                        WHEN 'codsworth' THEN 4
                        WHEN 'super_mutant' THEN 5
                        WHEN 'ghoul' THEN 6
                    END
            """))

            print("📊 更新結果驗證：")
            print("=" * 90)
            print(f"{'角色':<20} | {'Prompt長度':<12} | 語調")
            print("=" * 90)

            for row in result:
                print(f"{row.key:<20} | {row.prompt_length:>5} 字元    | {row.ai_tone_description}")

            print("=" * 90)

        except Exception as e:
            await session.rollback()
            print(f"❌ SQL 執行失敗：{e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)


if __name__ == "__main__":
    asyncio.run(execute_sql_update())
