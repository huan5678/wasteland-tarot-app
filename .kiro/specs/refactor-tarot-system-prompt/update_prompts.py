#!/usr/bin/env python3
"""
獨立的 AI System Prompt 更新腳本
不依賴專案環境，可直接執行

使用方式：
  python update_prompts.py

環境變數（或直接修改下方 DB_CONFIG）：
  DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
"""

import asyncio
import os
import sys
from datetime import datetime

try:
    import asyncpg
except ImportError:
    print("❌ 缺少 asyncpg 套件")
    print("請執行：pip install asyncpg")
    sys.exit(1)

# ============================================================================
# 資料庫連接配置（請修改為你的資料庫資訊）
# ============================================================================
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "database": os.getenv("DB_NAME", "postgres"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "your_password_here"),
}

# SQL 檔案路徑
SQL_FILE_PATH = "update_character_prompts.sql"


async def backup_characters(conn):
    """備份現有的 characters 資料"""
    print("\n📦 備份現有資料...")

    backup_query = """
    SELECT id, key, ai_system_prompt, ai_tone_description, ai_prompt_config
    FROM characters
    WHERE key IN ('pip_boy', 'vault_dweller', 'wasteland_trader', 'codsworth', 'super_mutant', 'ghoul')
    """

    try:
        rows = await conn.fetch(backup_query)
    except Exception as e:
        print(f"⚠️  備份查詢失敗：{e}")
        print("可能原因：characters 表尚未創建或沒有資料")
        return 0

    if not rows:
        print("⚠️  沒有找到需要備份的角色資料")
        return 0

    backup_file = f"backup_characters_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    with open(backup_file, 'w', encoding='utf-8') as f:
        for row in rows:
            f.write(f"{'='*60}\n")
            f.write(f"角色: {row['key']}\n")
            f.write(f"ID: {row['id']}\n")
            f.write(f"Prompt Length: {len(row['ai_system_prompt'] or '')}\n")
            f.write(f"Tone: {row['ai_tone_description']}\n")
            f.write(f"Config: {row['ai_prompt_config']}\n")
            f.write(f"{'='*60}\n\n")

            if row['ai_system_prompt']:
                f.write("完整 Prompt:\n")
                f.write(f"{row['ai_system_prompt']}\n\n")

    print(f"✅ 備份已儲存至：{backup_file}")
    print(f"   備份了 {len(rows)} 個角色的資料")
    return len(rows)


async def execute_sql_file(conn, sql_file_path):
    """執行 SQL 檔案"""
    print(f"\n🔄 執行 SQL 檔案：{sql_file_path}")

    try:
        with open(sql_file_path, 'r', encoding='utf-8') as f:
            sql = f.read()
    except FileNotFoundError:
        print(f"❌ SQL 檔案不存在：{sql_file_path}")
        print("請確認檔案路徑正確")
        return False

    # 分割 SQL 語句
    statements = sql.split(';')
    executed = 0
    failed = 0

    for i, statement in enumerate(statements):
        statement = statement.strip()

        # 跳過空語句、註解和 SELECT 驗證查詢
        if not statement or statement.startswith('--') or 'SELECT' in statement.upper():
            continue

        try:
            await conn.execute(statement)
            executed += 1
            print(f"  ✅ 語句 {executed} 執行成功")
        except Exception as e:
            failed += 1
            print(f"  ❌ 語句 {i+1} 執行失敗：{e}")

    print(f"\n✅ 執行完成：{executed} 個成功，{failed} 個失敗")
    return failed == 0


async def verify_update(conn):
    """驗證更新結果"""
    print("\n🔍 驗證更新結果...")

    verify_query = """
    SELECT
        key,
        LENGTH(ai_system_prompt) as prompt_length,
        ai_tone_description,
        ai_prompt_config->>'style' as style,
        SUBSTRING(ai_system_prompt, 1, 100) as prompt_preview
    FROM characters
    WHERE key IN ('pip_boy', 'vault_dweller', 'wasteland_trader', 'codsworth', 'super_mutant', 'ghoul')
    ORDER BY key
    """

    try:
        rows = await conn.fetch(verify_query)
    except Exception as e:
        print(f"❌ 驗證查詢失敗：{e}")
        return False

    if not rows:
        print("⚠️  沒有找到角色資料")
        return False

    print(f"\n{'角色':<20} | {'Prompt 長度':<12} | {'語調描述':<30} | {'風格':<20}")
    print("-" * 100)

    success_count = 0
    for row in rows:
        prompt_len = row['prompt_length'] or 0
        status = "✅" if prompt_len > 2000 else "❌"
        tone = (row['ai_tone_description'] or 'N/A')[:28]
        style = row['style'] or 'N/A'

        print(f"{status} {row['key']:<18} | {prompt_len:<12} | {tone:<30} | {style:<20}")

        if prompt_len > 2000:
            success_count += 1

    print(f"\n{'='*100}")
    if success_count == 6:
        print(f"✅ 成功：所有 6 個角色的 prompt 都已正確更新")
        return True
    else:
        print(f"⚠️  警告：只有 {success_count}/6 個角色更新成功")
        return False


async def main():
    """主執行函式"""
    print("=" * 60)
    print("🎲 廢土塔羅 AI System Prompt 更新腳本")
    print("=" * 60)
    print(f"\n版本: 1.0")
    print(f"日期: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # 顯示資料庫配置
    print(f"\n📋 資料庫配置：")
    print(f"   Host: {DB_CONFIG['host']}")
    print(f"   Port: {DB_CONFIG['port']}")
    print(f"   Database: {DB_CONFIG['database']}")
    print(f"   User: {DB_CONFIG['user']}")
    print(f"   Password: {'*' * len(DB_CONFIG['password'])}")

    # 連接資料庫
    print(f"\n🔌 連接資料庫...")
    try:
        conn = await asyncpg.connect(**DB_CONFIG, timeout=10)
        print("✅ 資料庫連接成功")
    except Exception as e:
        print(f"❌ 資料庫連接失敗：{e}")
        print("\n請檢查：")
        print("  1. 資料庫連接資訊是否正確（修改 DB_CONFIG）")
        print("  2. 資料庫是否正在運行")
        print("  3. 網路連接是否正常")
        print("  4. 防火牆是否允許連接")
        return 1

    try:
        # 備份
        backup_count = await backup_characters(conn)

        if backup_count == 0:
            print("\n⚠️  沒有找到現有的角色資料，可能是首次初始化")
            print("這是正常的，將繼續執行更新...")

        # 確認執行
        print("\n" + "=" * 60)
        print("⚠️  重要提醒")
        print("=" * 60)
        print("即將更新以下 6 個角色的 AI System Prompt：")
        print("  1. Pip-Boy（個人資訊處理器）")
        print("  2. Vault Dweller（避難所居民）")
        print("  3. Wasteland Trader（廢土商人）")
        print("  4. Codsworth（機器人管家）")
        print("  5. Super Mutant（超級變種人）")
        print("  6. Ghoul（屍鬼倖存者）")
        print("\n這會覆蓋現有的 ai_system_prompt, ai_tone_description, ai_prompt_config 欄位")

        if backup_count > 0:
            print(f"\n✅ 已備份現有資料，可隨時恢復")

        confirm = input("\n確定要繼續嗎？(yes/no): ")

        if confirm.lower() not in ['yes', 'y', '是']:
            print("\n❌ 已取消更新")
            return 0

        # 執行更新
        success = await execute_sql_file(conn, SQL_FILE_PATH)

        if not success:
            print("\n⚠️  SQL 執行過程中有錯誤")
            print("請檢查錯誤訊息並手動修復")
            return 1

        # 驗證
        verify_success = await verify_update(conn)

        print("\n" + "=" * 60)
        if verify_success:
            print("🎉 更新完成！")
            print("=" * 60)
            print("\n所有角色的 AI System Prompt 已成功更新")
            print("\n下一步：")
            print("  1. 重啟 API 服務以載入新的 prompt")
            print("  2. 測試 AI 解讀功能")
            print("  3. 參考 COMPARISON.md 了解新舊系統差異")
            return 0
        else:
            print("⚠️  更新完成，但部分角色可能未正確更新")
            print("=" * 60)
            print("\n請手動檢查資料庫，必要時從備份恢復")
            return 1

    except Exception as e:
        print(f"\n❌ 更新過程中發生錯誤：{e}")
        print("\n可以從備份檔案中恢復資料")
        return 1

    finally:
        await conn.close()
        print("\n✅ 資料庫連接已關閉")


if __name__ == "__main__":
    print("\n檢查依賴...")
    try:
        import asyncpg
        print("✅ asyncpg 已安裝")
    except ImportError:
        print("❌ 缺少 asyncpg 套件")
        print("\n請執行以下命令安裝：")
        print("  pip install asyncpg")
        print("\n或使用 uv：")
        print("  uv pip install asyncpg")
        sys.exit(1)

    # 檢查 SQL 檔案
    if not os.path.exists(SQL_FILE_PATH):
        print(f"\n❌ SQL 檔案不存在：{SQL_FILE_PATH}")
        print("請確認你在正確的目錄執行此腳本")
        print("\n正確的執行方式：")
        print("  cd .kiro/specs/refactor-tarot-system-prompt/")
        print("  python update_prompts.py")
        sys.exit(1)

    # 執行主函式
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
