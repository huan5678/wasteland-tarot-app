"""
Phase 5: 人工品質評估 - 測試執行腳本

執行 30 個 AI 解讀測試案例，記錄結果用於人工評分
"""
import asyncio
import json
import csv
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import AsyncSessionLocal
from app.models.wasteland_card import WastelandCard, CharacterVoice, KarmaAlignment
from app.services.ai_interpretation_service import AIInterpretationService
from app.config import settings


# 測試案例定義（根據 PHASE5_TEST_PLAN.md）
# 使用資料庫中的實際牌卡名稱
TEST_CASES = [
    # Group 1: Major Arcana
    {"id": "T01", "card_name": "新手避難所居民", "character": CharacterVoice.PIP_BOY, "question_type": "職業發展"},
    {"id": "T02", "card_name": "新手避難所居民", "character": CharacterVoice.VAULT_DWELLER, "question_type": "個人成長"},
    {"id": "T03", "card_name": "科技專家", "character": CharacterVoice.WASTELAND_TRADER, "question_type": "重大決策"},
    {"id": "T04", "card_name": "科技專家", "character": CharacterVoice.CODSWORTH, "question_type": "感情關係"},
    {"id": "T05", "card_name": "輻射死神", "character": CharacterVoice.SUPER_MUTANT, "question_type": "內在探索"},
    {"id": "T06", "card_name": "輻射死神", "character": CharacterVoice.GHOUL, "question_type": "個人成長"},

    # Group 2: 輻射棒 (Wands/Fire/Action)
    {"id": "T07", "card_name": "輻射棒三", "character": CharacterVoice.PIP_BOY, "question_type": "職業發展"},
    {"id": "T08", "card_name": "輻射棒三", "character": CharacterVoice.VAULT_DWELLER, "question_type": "重大決策"},
    {"id": "T09", "card_name": "輻射棒王牌", "character": CharacterVoice.WASTELAND_TRADER, "question_type": "職業發展"},
    {"id": "T10", "card_name": "輻射棒王牌", "character": CharacterVoice.CODSWORTH, "question_type": "個人成長"},

    # Group 3: 可樂瓶 (Cups/Water/Emotion)
    {"id": "T11", "card_name": "可樂瓶王牌", "character": CharacterVoice.SUPER_MUTANT, "question_type": "感情關係"},
    {"id": "T12", "card_name": "可樂瓶王牌", "character": CharacterVoice.GHOUL, "question_type": "感情關係"},
    {"id": "T13", "card_name": "可樂瓶二", "character": CharacterVoice.PIP_BOY, "question_type": "感情關係"},
    {"id": "T14", "card_name": "可樂瓶二", "character": CharacterVoice.VAULT_DWELLER, "question_type": "感情關係"},

    # Group 4: 戰鬥武器 (Swords/Air/Mind)
    {"id": "T15", "card_name": "戰鬥武器王牌", "character": CharacterVoice.WASTELAND_TRADER, "question_type": "重大決策"},
    {"id": "T16", "card_name": "戰鬥武器王牌", "character": CharacterVoice.CODSWORTH, "question_type": "重大決策"},
    {"id": "T17", "card_name": "戰鬥武器三", "character": CharacterVoice.SUPER_MUTANT, "question_type": "內在探索"},
    {"id": "T18", "card_name": "戰鬥武器三", "character": CharacterVoice.GHOUL, "question_type": "內在探索"},

    # Group 5: 瓶蓋 (Pentacles/Earth/Material)
    {"id": "T19", "card_name": "瓶蓋王牌", "character": CharacterVoice.PIP_BOY, "question_type": "職業發展"},
    {"id": "T20", "card_name": "瓶蓋王牌", "character": CharacterVoice.VAULT_DWELLER, "question_type": "職業發展"},
    {"id": "T21", "card_name": "瓶蓋七", "character": CharacterVoice.WASTELAND_TRADER, "question_type": "職業發展"},
    {"id": "T22", "card_name": "瓶蓋七", "character": CharacterVoice.CODSWORTH, "question_type": "個人成長"},
    {"id": "T23", "card_name": "瓶蓋廢土騎士", "character": CharacterVoice.SUPER_MUTANT, "question_type": "職業發展"},
    {"id": "T24", "card_name": "瓶蓋廢土騎士", "character": CharacterVoice.GHOUL, "question_type": "職業發展"},

    # Group 6: 交叉驗證（廢土世界）
    {"id": "T25", "card_name": "廢土世界", "character": CharacterVoice.PIP_BOY, "question_type": "個人成長"},
    {"id": "T26", "card_name": "廢土世界", "character": CharacterVoice.VAULT_DWELLER, "question_type": "個人成長"},
    {"id": "T27", "card_name": "廢土世界", "character": CharacterVoice.WASTELAND_TRADER, "question_type": "職業發展"},
    {"id": "T28", "card_name": "廢土世界", "character": CharacterVoice.CODSWORTH, "question_type": "個人成長"},
    {"id": "T29", "card_name": "廢土世界", "character": CharacterVoice.SUPER_MUTANT, "question_type": "內在探索"},
    {"id": "T30", "card_name": "廢土世界", "character": CharacterVoice.GHOUL, "question_type": "內在探索"},
]


# 問題模板
QUESTION_TEMPLATES = {
    "職業發展": "我目前在工作上遇到瓶頸，不確定是否應該轉換跑道還是繼續深耕。這張牌給我什麼啟示？",
    "感情關係": "我和伴侶最近關係緊張，不知道問題出在哪裡。這張牌能幫助我理解嗎？",
    "個人成長": "我想更了解自己，找到人生方向。這張牌告訴我什麼？",
    "重大決策": "我面臨一個重要選擇，不知道該如何決定。這張牌給我什麼建議？",
    "內在探索": "我內心有些陰影和恐懼，想要更深入理解自己。這張牌揭示了什麼？",
}


async def find_card_by_name(session: AsyncSession, card_name: str) -> Optional[WastelandCard]:
    """根據名稱查找牌卡"""
    result = await session.execute(
        select(WastelandCard).where(WastelandCard.name == card_name)
    )
    return result.scalar_one_or_none()


async def run_single_test(
    session: AsyncSession,
    ai_service: AIInterpretationService,
    test_case: Dict,
    output_dir: Path
) -> Dict:
    """執行單一測試案例"""

    test_id = test_case["id"]
    card_name = test_case["card_name"]
    character = test_case["character"]
    question_type = test_case["question_type"]

    print(f"\n{'='*80}")
    print(f"執行測試：{test_id}")
    print(f"牌卡：{card_name} | 角色：{character.value} | 問題類型：{question_type}")
    print(f"{'='*80}")

    # 查找牌卡
    card = await find_card_by_name(session, card_name)
    if not card:
        print(f"❌ 找不到牌卡：{card_name}")
        return {
            "test_id": test_id,
            "status": "FAILED",
            "error": f"Card not found: {card_name}"
        }

    # 獲取問題
    question = QUESTION_TEMPLATES.get(question_type, "請解讀這張牌。")

    # 生成解讀
    start_time = datetime.now()

    try:
        interpretation = await ai_service.generate_interpretation(
            card=card,
            character_voice=character,
            question=question,
            karma=KarmaAlignment.NEUTRAL,  # 使用中性業力
            faction=None,
            position_meaning=None,
            timeout=60.0  # 60 秒超時
        )

        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        if interpretation:
            print(f"✅ 解讀生成成功（{duration:.2f}s）")
            print(f"\n【解讀內容】\n{interpretation}\n")

            # 儲存結果
            result = {
                "test_id": test_id,
                "card_name": card_name,
                "character": character.value,
                "question_type": question_type,
                "question": question,
                "interpretation": interpretation,
                "duration_seconds": duration,
                "timestamp": start_time.isoformat(),
                "status": "SUCCESS"
            }

            # 儲存為個別 JSON 檔案
            result_file = output_dir / f"{test_id}_{character.value}_{card_name}.json"
            with open(result_file, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)

            return result

        else:
            print(f"❌ 解讀生成失敗：返回 None")
            return {
                "test_id": test_id,
                "status": "FAILED",
                "error": "AI service returned None"
            }

    except asyncio.TimeoutError:
        print(f"❌ 解讀生成超時（> 60s）")
        return {
            "test_id": test_id,
            "status": "TIMEOUT",
            "error": "Timeout after 60s"
        }
    except Exception as e:
        print(f"❌ 解讀生成錯誤：{e}")
        import traceback
        traceback.print_exc()
        return {
            "test_id": test_id,
            "status": "ERROR",
            "error": str(e)
        }


async def main():
    """主執行函數"""

    print("=" * 80)
    print("Phase 5: 人工品質評估 - 測試執行")
    print("=" * 80)
    print()

    # 建立輸出目錄
    output_dir = Path(__file__).parent.parent / ".kiro/specs/refactor-tarot-system-prompt/phase5_results"
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"📂 輸出目錄：{output_dir}")
    print(f"📋 測試案例數：{len(TEST_CASES)}")
    print()

    # 初始化資料庫連線和 AI 服務
    async with AsyncSessionLocal() as session:
        ai_service = AIInterpretationService(
            settings=settings,
            db_session=session
        )

        if not ai_service.is_available():
            print("❌ AI 服務不可用！請檢查 API 金鑰設定。")
            return

        print(f"✅ AI 服務已就緒：{ai_service.provider.__class__.__name__}")
        print()

        # 執行所有測試
        results = []
        success_count = 0
        failed_count = 0

        for i, test_case in enumerate(TEST_CASES, 1):
            print(f"\n進度：{i}/{len(TEST_CASES)}")

            result = await run_single_test(session, ai_service, test_case, output_dir)
            results.append(result)

            if result.get("status") == "SUCCESS":
                success_count += 1
            else:
                failed_count += 1

            # 每 5 個測試暫停一下，避免 API rate limit
            if i % 5 == 0 and i < len(TEST_CASES):
                print("\n⏸️  暫停 5 秒...")
                await asyncio.sleep(5)

        # 生成總結報告
        print("\n" + "=" * 80)
        print("測試執行完成")
        print("=" * 80)
        print(f"✅ 成功：{success_count}/{len(TEST_CASES)}")
        print(f"❌ 失敗：{failed_count}/{len(TEST_CASES)}")
        print()

        # 儲存總結 CSV
        summary_file = output_dir / "test_summary.csv"
        with open(summary_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=[
                "test_id", "card_name", "character", "question_type",
                "status", "duration_seconds", "timestamp",
                # 評分欄位（待人工填寫）
                "score_psychology", "score_fallout", "score_character",
                "score_usefulness", "score_overall", "comments"
            ])
            writer.writeheader()

            for result in results:
                row = {
                    "test_id": result.get("test_id"),
                    "card_name": result.get("card_name", ""),
                    "character": result.get("character", ""),
                    "question_type": result.get("question_type", ""),
                    "status": result.get("status"),
                    "duration_seconds": result.get("duration_seconds", ""),
                    "timestamp": result.get("timestamp", ""),
                    # 評分欄位留空，待人工填寫
                    "score_psychology": "",
                    "score_fallout": "",
                    "score_character": "",
                    "score_usefulness": "",
                    "score_overall": "",
                    "comments": ""
                }
                writer.writerow(row)

        print(f"📊 測試總結已儲存：{summary_file}")
        print()
        print("下一步：")
        print("1. 開啟 test_summary.csv")
        print("2. 閱讀各個解讀（phase5_results/*.json）")
        print("3. 填寫 5 個評分欄位（1-5 分）")
        print("4. 執行分析腳本：python scripts/analyze_phase5_results.py")


if __name__ == "__main__":
    asyncio.run(main())
