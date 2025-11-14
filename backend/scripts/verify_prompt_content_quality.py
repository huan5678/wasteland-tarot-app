"""
Task 2.3: Verify Prompt Content Quality
驗證所有角色 Prompt 的內容品質

深度檢查項目：
1. 心理學深度：概念的準確性和應用
2. Tone 一致性：Tone description 與實際內容的匹配
3. 詞彙風格：與 config.vocabulary 的一致性
4. 結構完整性：Markdown 層次和邏輯
5. 角色特色：獨特性和辨識度
"""
import asyncio
import json
import re
from sqlalchemy import text
from app.db.session import AsyncSessionLocal


# 心理學概念深度檢查
JUNGIAN_CONCEPTS = {
    "基礎": ["榮格", "原型", "陰影"],
    "進階": ["個性化", "集體無意識", "自性", "整合", "投射"],
    "應用": ["陰影工作", "原型模式", "心理整合", "內在衝突"]
}

# Fallout 世界觀深度檢查
FALLOUT_CONCEPTS = {
    "基礎": ["廢土", "核", "輻射"],
    "進階": ["避難所", "戰後", "變種人", "輻射屍鬼"],
    "文化": ["Pip-Boy", "避難所科技", "Vault-Tec", "核戰", "生存"]
}

# Markdown 結構必要元素
REQUIRED_SECTIONS = ["# 角色", "## 核心", "## 解讀"]

# 預期的 vocabulary 與詞彙模式對應
VOCABULARY_PATTERNS = {
    "technical_psychological": ["分析", "數據", "系統", "評估", "診斷"],
    "personal_experiential": ["我", "感受", "經歷", "學習", "成長"],
    "business_metaphors": ["交易", "價值", "投資", "資源", "利益"],
    "domestic_metaphors": ["家", "照顧", "整理", "服務", "關懷"],
    "simple_powerful": ["強", "直接", "簡單", "力量", "明白"],
    "time_trauma_metaphors": ["時間", "歲月", "經歷", "見證", "倖存"]
}


async def verify_prompt_quality():
    """驗證所有角色的 Prompt 內容品質"""

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
        print("Task 2.3: Prompt 內容品質驗證報告")
        print("=" * 100)
        print()

        all_passed = True
        quality_scores = []

        for char in characters:
            char_key = char.key
            prompt = char.ai_system_prompt
            tone = char.ai_tone_description
            config_json = char.config_json
            config = json.loads(config_json) if config_json else {}

            print(f"🎯 分析角色：{char_key}")
            print("=" * 100)

            issues = []
            score = 0  # 總分 100

            # === 1. 心理學深度分析 (30 分) ===
            print("\n📚 1. 心理學深度分析")
            print("-" * 80)

            jungian_score = 0
            jungian_details = []

            # 基礎概念 (10 分)
            basic_found = [kw for kw in JUNGIAN_CONCEPTS["基礎"] if kw in prompt]
            if len(basic_found) >= 2:
                jungian_score += 10
                jungian_details.append(f"✅ 基礎概念：{', '.join(basic_found)} (10/10)")
            else:
                jungian_details.append(f"⚠️  基礎概念不足：{', '.join(basic_found)} (5/10)")
                jungian_score += 5
                issues.append("基礎榮格概念不足")

            # 進階概念 (10 分)
            advanced_found = [kw for kw in JUNGIAN_CONCEPTS["進階"] if kw in prompt]
            if len(advanced_found) >= 2:
                jungian_score += 10
                jungian_details.append(f"✅ 進階概念：{', '.join(advanced_found)} (10/10)")
            elif len(advanced_found) >= 1:
                jungian_details.append(f"⚠️  進階概念：{', '.join(advanced_found)} (5/10)")
                jungian_score += 5
            else:
                jungian_details.append(f"❌ 缺少進階概念 (0/10)")
                issues.append("缺少進階榮格概念")

            # 應用層面 (10 分)
            application_found = [kw for kw in JUNGIAN_CONCEPTS["應用"] if kw in prompt]
            if len(application_found) >= 1:
                jungian_score += 10
                jungian_details.append(f"✅ 應用層面：{', '.join(application_found)} (10/10)")
            else:
                jungian_details.append(f"⚠️  應用層面較弱 (0/10)")
                jungian_score += 0

            for detail in jungian_details:
                print(f"  {detail}")

            print(f"\n  心理學深度得分：{jungian_score}/30")
            score += jungian_score

            # === 2. Fallout 世界觀深度 (20 分) ===
            print("\n🌍 2. Fallout 世界觀深度")
            print("-" * 80)

            fallout_score = 0
            fallout_details = []

            # 基礎概念 (8 分)
            basic_fallout = [kw for kw in FALLOUT_CONCEPTS["基礎"] if kw in prompt]
            if len(basic_fallout) >= 2:
                fallout_score += 8
                fallout_details.append(f"✅ 基礎概念：{', '.join(basic_fallout)} (8/8)")
            else:
                fallout_details.append(f"⚠️  基礎概念不足：{', '.join(basic_fallout)} (4/8)")
                fallout_score += 4

            # 進階概念 (8 分)
            advanced_fallout = [kw for kw in FALLOUT_CONCEPTS["進階"] if kw in prompt]
            if len(advanced_fallout) >= 2:
                fallout_score += 8
                fallout_details.append(f"✅ 進階概念：{', '.join(advanced_fallout)} (8/8)")
            elif len(advanced_fallout) >= 1:
                fallout_details.append(f"⚠️  進階概念：{', '.join(advanced_fallout)} (4/8)")
                fallout_score += 4
            else:
                fallout_details.append(f"❌ 缺少進階概念 (0/8)")

            # 文化元素 (4 分)
            culture_fallout = [kw for kw in FALLOUT_CONCEPTS["文化"] if kw in prompt]
            if len(culture_fallout) >= 1:
                fallout_score += 4
                fallout_details.append(f"✅ 文化元素：{', '.join(culture_fallout)} (4/4)")
            else:
                fallout_details.append(f"⚠️  缺少文化元素 (0/4)")

            for detail in fallout_details:
                print(f"  {detail}")

            print(f"\n  Fallout 世界觀得分：{fallout_score}/20")
            score += fallout_score

            # === 3. Tone 一致性分析 (20 分) ===
            print("\n🎵 3. Tone 一致性分析")
            print("-" * 80)

            tone_score = 20  # 預設滿分，發現問題扣分
            tone_details = []

            # 分析 tone description 中的關鍵詞
            tone_keywords = tone.split("、") if tone else []
            tone_details.append(f"  Tone 定義：{tone}")
            tone_details.append(f"  關鍵特質：{', '.join(tone_keywords)}")

            # 簡單的一致性檢查（實際應用中可以更複雜）
            # 這裡檢查 prompt 是否包含與 tone 相關的詞彙
            if "理性" in tone and ("分析" not in prompt and "數據" not in prompt):
                tone_score -= 5
                issues.append("Tone 定義為理性，但 prompt 缺少分析性詞彙")

            if "溫和" in tone and "粗暴" in prompt:
                tone_score -= 5
                issues.append("Tone 定義為溫和，但 prompt 包含粗暴詞彙")

            if tone_score == 20:
                tone_details.append("  ✅ Tone 與內容一致")
            else:
                tone_details.append(f"  ⚠️  Tone 一致性有疑問 ({tone_score}/20)")

            for detail in tone_details:
                print(detail)

            print(f"\n  Tone 一致性得分：{tone_score}/20")
            score += tone_score

            # === 4. 詞彙風格一致性 (15 分) ===
            print("\n📖 4. 詞彙風格一致性")
            print("-" * 80)

            vocab_score = 0
            vocabulary_type = config.get("vocabulary", "unknown")

            if vocabulary_type in VOCABULARY_PATTERNS:
                expected_patterns = VOCABULARY_PATTERNS[vocabulary_type]
                found_patterns = [p for p in expected_patterns if p in prompt]

                if len(found_patterns) >= 3:
                    vocab_score = 15
                    print(f"  ✅ 詞彙風格：{vocabulary_type}")
                    print(f"  ✅ 符合模式：{', '.join(found_patterns)} ({len(found_patterns)}/{len(expected_patterns)})")
                elif len(found_patterns) >= 1:
                    vocab_score = 10
                    print(f"  ⚠️  詞彙風格：{vocabulary_type}")
                    print(f"  ⚠️  部分符合：{', '.join(found_patterns)} ({len(found_patterns)}/{len(expected_patterns)})")
                else:
                    vocab_score = 5
                    print(f"  ❌ 詞彙風格：{vocabulary_type}")
                    print(f"  ❌ 幾乎不符：未找到預期詞彙模式")
                    issues.append(f"詞彙風格與 {vocabulary_type} 配置不符")
            else:
                vocab_score = 10  # 未知類型給予基礎分
                print(f"  ⚠️  未知詞彙類型：{vocabulary_type}")

            print(f"\n  詞彙風格得分：{vocab_score}/15")
            score += vocab_score

            # === 5. 結構完整性 (15 分) ===
            print("\n🏗️  5. Markdown 結構完整性")
            print("-" * 80)

            structure_score = 0
            structure_details = []

            # 檢查必要章節
            missing_sections = [sec for sec in REQUIRED_SECTIONS if sec not in prompt]
            if not missing_sections:
                structure_score += 10
                structure_details.append("  ✅ 包含所有必要章節")
            else:
                structure_score += 5
                structure_details.append(f"  ⚠️  缺少章節：{', '.join(missing_sections)}")
                issues.append(f"缺少必要章節：{', '.join(missing_sections)}")

            # 檢查層次結構
            h1_count = prompt.count("# ")
            h2_count = prompt.count("## ")
            h3_count = prompt.count("### ")

            if h1_count >= 1 and h2_count >= 2:
                structure_score += 5
                structure_details.append(f"  ✅ 層次結構：H1={h1_count}, H2={h2_count}, H3={h3_count}")
            else:
                structure_details.append(f"  ⚠️  層次結構較弱：H1={h1_count}, H2={h2_count}, H3={h3_count}")

            for detail in structure_details:
                print(detail)

            print(f"\n  結構完整性得分：{structure_score}/15")
            score += structure_score

            # === 總分與評級 ===
            print("\n" + "=" * 100)
            print(f"📊 {char_key.upper()} 總分：{score}/100")

            if score >= 90:
                grade = "A (優秀)"
            elif score >= 80:
                grade = "B (良好)"
            elif score >= 70:
                grade = "C (及格)"
            else:
                grade = "D (需改進)"
                all_passed = False

            print(f"   評級：{grade}")

            if issues:
                print(f"\n⚠️  發現問題 ({len(issues)} 個)：")
                for issue in issues:
                    print(f"   - {issue}")
            else:
                print("\n✅ 無明顯問題")

            print("=" * 100)
            print()

            quality_scores.append({
                "character": char_key,
                "score": score,
                "grade": grade,
                "issues": issues
            })

        # === 總結報告 ===
        print("=" * 100)
        print("品質驗證總結")
        print("=" * 100)

        avg_score = sum(r["score"] for r in quality_scores) / len(quality_scores)
        print(f"\n平均分數：{avg_score:.1f}/100")
        print()

        print("各角色得分：")
        for r in quality_scores:
            print(f"  {r['character']:<20} {r['score']:>3}/100  {r['grade']}")

        print()

        if avg_score >= 80:
            print("✅ 整體品質優良，可以進入下一階段測試")
            print("\n下一步：Phase 3 - 額外單元測試（測試邊緣案例）")
        elif avg_score >= 70:
            print("⚠️  整體品質及格，但仍有改進空間")
            print("\n建議：針對低分角色進行內容優化")
        else:
            print("❌ 整體品質需要改進")
            print("\n建議：全面檢查並優化 Prompt 內容")

        print("=" * 100)

        return avg_score >= 70


if __name__ == "__main__":
    asyncio.run(verify_prompt_quality())
