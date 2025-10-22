"""
Task 2.2: Verify Prompt Content Integrity
驗證所有角色 Prompt 的內容完整性

檢查項目：
1. Prompt 長度：1200-2000 字元
2. 必要關鍵詞：榮格心理學（原型、陰影、個性化等）
3. 必要關鍵詞：Fallout 世界觀（廢土、核、輻射等）
4. JSON config 結構完整性
5. Tone descriptions 設定狀態
"""
import asyncio
import json
from sqlalchemy import text
from app.db.database import AsyncSessionLocal


# 必要關鍵詞定義
JUNGIAN_KEYWORDS = ["榮格", "原型", "陰影", "個性化", "集體無意識", "自性"]
FALLOUT_KEYWORDS = ["廢土", "核", "輻射", "避難所", "戰後", "Fallout"]

# 必要的 JSON config 欄位
REQUIRED_CONFIG_FIELDS = ["style", "formality", "empathy_level", "vocabulary"]

# 所有角色
ALL_CHARACTERS = [
    "pip_boy",
    "vault_dweller",
    "wasteland_trader",
    "codsworth",
    "super_mutant",
    "ghoul"
]


async def verify_prompt_integrity():
    """驗證所有角色的 Prompt 內容完整性"""

    async with AsyncSessionLocal() as session:
        # 取得所有角色資料
        result = await session.execute(text("""
            SELECT
                key,
                ai_system_prompt,
                ai_tone_description,
                ai_prompt_config::text as config_json
            FROM characters
            WHERE key IN ('pip_boy', 'vault_dweller', 'wasteland_trader',
                         'codsworth', 'super_mutant', 'ghoul')
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

        characters = result.fetchall()

        print("=" * 100)
        print("Task 2.2: Prompt 內容完整性驗證報告")
        print("=" * 100)
        print()

        all_passed = True
        results = []

        for char in characters:
            char_key = char.key
            prompt = char.ai_system_prompt
            tone = char.ai_tone_description
            config_json = char.config_json

            print(f"🔍 檢查角色：{char_key}")
            print("-" * 100)

            issues = []

            # 1. 檢查 Prompt 長度
            prompt_length = len(prompt) if prompt else 0
            if prompt_length < 1200:
                issues.append(f"❌ Prompt 長度不足：{prompt_length} < 1200")
                all_passed = False
            elif prompt_length > 2000:
                issues.append(f"⚠️  Prompt 長度超出：{prompt_length} > 2000")
            else:
                print(f"✅ Prompt 長度：{prompt_length} 字元（符合 1200-2000 範圍）")

            # 2. 檢查榮格心理學關鍵詞
            jungian_found = [kw for kw in JUNGIAN_KEYWORDS if kw in prompt] if prompt else []
            if len(jungian_found) < 2:
                issues.append(f"❌ 榮格關鍵詞不足：找到 {len(jungian_found)} 個（需要至少 2 個）")
                all_passed = False
            else:
                print(f"✅ 榮格關鍵詞：找到 {len(jungian_found)} 個 - {', '.join(jungian_found)}")

            # 3. 檢查 Fallout 世界觀關鍵詞
            fallout_found = [kw for kw in FALLOUT_KEYWORDS if kw in prompt] if prompt else []
            if len(fallout_found) < 2:
                issues.append(f"❌ Fallout 關鍵詞不足：找到 {len(fallout_found)} 個（需要至少 2 個）")
                all_passed = False
            else:
                print(f"✅ Fallout 關鍵詞：找到 {len(fallout_found)} 個 - {', '.join(fallout_found)}")

            # 4. 檢查 Tone Description
            if not tone or len(tone.strip()) == 0:
                issues.append(f"❌ Tone Description 為空")
                all_passed = False
            else:
                print(f"✅ Tone Description：「{tone}」（{len(tone)} 字元）")

            # 5. 檢查 JSON Config 結構
            try:
                if config_json:
                    config = json.loads(config_json)
                    missing_fields = [field for field in REQUIRED_CONFIG_FIELDS if field not in config]

                    if missing_fields:
                        issues.append(f"❌ Config 缺少欄位：{', '.join(missing_fields)}")
                        all_passed = False
                    else:
                        print(f"✅ JSON Config：包含所有必要欄位 {REQUIRED_CONFIG_FIELDS}")
                        print(f"   → {config}")
                else:
                    issues.append(f"❌ JSON Config 為空")
                    all_passed = False
            except json.JSONDecodeError as e:
                issues.append(f"❌ JSON Config 解析失敗：{e}")
                all_passed = False

            # 顯示所有問題
            if issues:
                print()
                for issue in issues:
                    print(f"  {issue}")

            print()

            results.append({
                "character": char_key,
                "passed": len(issues) == 0,
                "issues": issues
            })

        # 總結報告
        print("=" * 100)
        print("驗證總結")
        print("=" * 100)

        passed_count = sum(1 for r in results if r["passed"])
        total_count = len(results)

        print(f"\n通過率：{passed_count}/{total_count} ({passed_count/total_count*100:.1f}%)")
        print()

        if all_passed:
            print("✅ 所有角色的 Prompt 內容完整性驗證通過！")
            print()
            print("下一步：Task 2.3 - 驗證 Prompt 內容品質")
        else:
            print("❌ 部分角色的 Prompt 需要修正")
            print()
            print("失敗的角色：")
            for r in results:
                if not r["passed"]:
                    print(f"  - {r['character']}: {len(r['issues'])} 個問題")

        print("=" * 100)

        return all_passed


if __name__ == "__main__":
    asyncio.run(verify_prompt_integrity())
