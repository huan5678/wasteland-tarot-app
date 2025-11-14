#!/usr/bin/env python3
"""
簡易卡牌數據種子腳本
⚠️  WARNING: This script is for SQLite development only!
⚠️  For Supabase production, use seed_supabase_cards.py instead!
"""

import asyncio
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.db.session import engine, AsyncSessionLocal
from app.models.wasteland_card import WastelandCard

async def seed_sample_cards():
    """添加示例塔羅牌到資料庫"""

    sample_cards = [
        {
            "id": str(uuid.uuid4()),
            "name": "愚者",
            "suit": "Major Arcana",
            "number": 0,
            "radiation_level": 0.1,
            "threat_level": 1,
            "vault_number": 111,
            "upright_meaning": "新的開始，純真，自由精神，冒險，以及對未來的樂觀。代表踏出第一步的勇氣。",
            "reversed_meaning": "魯莽，缺乏方向，天真過度，或者對危險缺乏意識。",
            "good_karma_interpretation": "你的善意將帶領你走向新的冒險。相信自己的直覺，勇敢踏出第一步。",
            "neutral_karma_interpretation": "是時候踏出舒適圈了。新的機會正在等待著你。",
            "evil_karma_interpretation": "小心過度的衝動可能帶來意想不到的後果。",
            "pip_boy_analysis": "「記錄顯示：新的任務即將開始。建議檢查裝備並準備踏上旅程。」",
            "vault_dweller_perspective": "從 Vault 中走出的第一天總是充滿未知，但這正是冒險的開始。",
            "wasteland_trader_wisdom": "年輕的旅行者，每個人都要走出第一步。我見過許多像你這樣的人。",
            "super_mutant_simplicity": "小人類開始大旅程！",
            "codsworth_analysis": "先生/小姐，新的冒險總是令人興奮的，不是嗎？",
            "brotherhood_significance": "每個騎士都曾是新兵。技術的力量始於學習的勇氣。",
            "ncr_significance": "民主需要公民的參與。每個人都可以為新加州共和國貢獻力量。",
            "legion_significance": "即使在凱撒軍團中，每個戰士都要證明自己的價值。",
            "raiders_significance": "新人？很好，更多的炮灰！",
            "vault_dweller_significance": "離開 Vault 的恐懼與興奮，這是每個居民都要面對的。",
            "image_url": "/images/cards/fool.png",
            "image_alt_text": "一個年輕人背著背包，站在懸崖邊，準備踏上冒險之旅",
            "background_image_url": "/images/backgrounds/wasteland_sunrise.png",
            "audio_cue_url": "/audio/cards/fool_entrance.mp3",
            "geiger_sound_intensity": 0.1,
            "pip_boy_scan_data": '{"radiation": "minimal", "threat": "low", "recommendation": "proceed"}',
            "wasteland_humor": "「我曾經像你一樣是個冒險家，直到我膝蓋中了一箭...等等，錯誤遊戲了。」",
            "nuka_cola_reference": "比一瓶新鮮的 Nuka-Cola 更令人興奮的只有新的冒險！",
            "fallout_easter_egg": "「War... War never changes. But adventures? They always begin the same way.」",
            "affects_luck_stat": True,
            "affects_charisma_stat": False,
            "affects_intelligence_stat": False,
            "special_ability": "增加 1 點幸運值，持續到下次占卜",
            "draw_frequency": 0,
            "total_appearances": 0,
            "last_drawn_at": None
        },
        {
            "id": str(uuid.uuid4()),
            "name": "魔術師",
            "suit": "Major Arcana",
            "number": 1,
            "radiation_level": 0.3,
            "threat_level": 3,
            "vault_number": 111,
            "upright_meaning": "意志力，創造力，技能，專注，以及將想法化為現實的能力。代表掌控自己命運的力量。",
            "reversed_meaning": "缺乏專注，誤用技能，缺乏明確目標，或者過度操控他人。",
            "good_karma_interpretation": "你擁有改變世界的力量。用你的技能去幫助他人。",
            "neutral_karma_interpretation": "專注於你的目標，你有能力實現任何想要的事情。",
            "evil_karma_interpretation": "強大的力量需要明智的使用。避免過度操控他人。",
            "pip_boy_analysis": "「能力檢測：技能等級提升。建議分配技能點以最大化效益。」",
            "vault_dweller_perspective": "在 Vault 中學會的技能，在廢土上同樣有用。",
            "wasteland_trader_wisdom": "會交易的人掌握廢土。技能就是貨幣。",
            "super_mutant_simplicity": "聰明小人類知道很多東西！",
            "codsworth_analysis": "您的技能組合相當令人印象深刻，先生/小姐。",
            "brotherhood_significance": "知識就是力量。技術掌握是兄弟會的核心。",
            "ncr_significance": "專業技能是建設新社會的基石。",
            "legion_significance": "軍事策略和戰術技巧是勝利的關鍵。",
            "raiders_significance": "會用槍、會鎖門、會搶劫，這些技能很實用！",
            "vault_dweller_significance": "Vault-Tec 的教育訓練確實派上用場了。",
            "image_url": "/images/cards/magician.png",
            "image_alt_text": "一個人站在工作台前，手中掌握著各種工具和材料",
            "background_image_url": "/images/backgrounds/workshop.png",
            "audio_cue_url": "/audio/cards/magician_craft.mp3",
            "geiger_sound_intensity": 0.3,
            "pip_boy_scan_data": '{"radiation": "low", "threat": "moderate", "recommendation": "utilize skills"}',
            "wasteland_humor": "「我可以修理任何東西...除了我的人際關係。」",
            "nuka_cola_reference": "就像調製完美的 Nuka-Cola Quantum，成功需要正確的配方。",
            "fallout_easter_egg": "「With great power comes great radiation exposure.」",
            "affects_luck_stat": False,
            "affects_charisma_stat": True,
            "affects_intelligence_stat": True,
            "special_ability": "增加 2 點智力值，持續到下次占卜",
            "draw_frequency": 0,
            "total_appearances": 0,
            "last_drawn_at": None
        },
        {
            "id": str(uuid.uuid4()),
            "name": "女教皇",
            "suit": "Major Arcana",
            "number": 2,
            "radiation_level": 0.2,
            "threat_level": 2,
            "vault_number": 111,
            "upright_meaning": "直覺，內在智慧，靈性，神秘知識，以及對內心聲音的信任。代表潛意識的力量。",
            "reversed_meaning": "忽視直覺，與內在智慧失去連結，或者過度依賴外在意見。",
            "good_karma_interpretation": "相信你的內在智慧。靜謐中能找到最好的答案。",
            "neutral_karma_interpretation": "現在是內省和學習的時候。傾聽你內心的聲音。",
            "evil_karma_interpretation": "隱藏的真相即將揭露。準備面對現實。",
            "pip_boy_analysis": "「感知檢測：直覺數值異常高。建議信任第六感。」",
            "vault_dweller_perspective": "在 Vault 的圖書館中，我學會了傾聽智慧的聲音。",
            "wasteland_trader_wisdom": "在這個世界，直覺能救你的命。我見過太多不聽直覺的人。",
            "super_mutant_simplicity": "聰明女人知道秘密！",
            "codsworth_analysis": "您似乎在沉思，先生/小姐。有什麼深刻的思考嗎？",
            "brotherhood_significance": "古老的知識和智慧是兄弟會最珍貴的資產。",
            "ncr_significance": "智慧的領導來自於傾聽和理解。",
            "legion_significance": "即使在戰場上，策略思考和直覺是必要的。",
            "raiders_significance": "老太婆總是知道些什麼...最好保持警惕。",
            "vault_dweller_significance": "Vault 中的教育不只是科學，還有人文智慧。",
            "image_url": "/images/cards/high_priestess.png",
            "image_alt_text": "一位智慧的女性坐在神秘的圖書館中，周圍環繞著古老的書籍",
            "background_image_url": "/images/backgrounds/library.png",
            "audio_cue_url": "/audio/cards/priestess_wisdom.mp3",
            "geiger_sound_intensity": 0.2,
            "pip_boy_scan_data": '{"radiation": "minimal", "threat": "low", "recommendation": "contemplate"}',
            "wasteland_humor": "「我預見到...你將在廢土上找到很多垃圾。令人震驚！」",
            "nuka_cola_reference": "就像 Nuka-Cola 的秘密配方，有些知識需要時間才能理解。",
            "fallout_easter_egg": "「The answers you seek are in another settlement.」",
            "affects_luck_stat": True,
            "affects_charisma_stat": False,
            "affects_intelligence_stat": True,
            "special_ability": "增加 1 點感知值和 1 點智力值",
            "draw_frequency": 0,
            "total_appearances": 0,
            "last_drawn_at": None
        }
    ]

    async with AsyncSessionLocal() as session:
        for card_data in sample_cards:
            # 檢查卡牌是否已存在
            existing_card = await session.get(WastelandCard, card_data["id"])
            if not existing_card:
                card = WastelandCard(**card_data)
                session.add(card)

        await session.commit()
        print(f"成功添加 {len(sample_cards)} 張示例卡牌到資料庫")

if __name__ == "__main__":
    print("開始添加示例卡牌...")
    asyncio.run(seed_sample_cards())
    print("完成！")