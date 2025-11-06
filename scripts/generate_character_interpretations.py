"""
批次生成角色解讀內容
使用 OpenAI API 為 6 個新角色生成解讀
"""
import asyncio
import os
from sqlalchemy import select, update, text
from openai import OpenAI
import sys

sys.path.insert(0, '/home/huan/projects/wasteland-tarot-app/backend')

# 角色設定
CHARACTER_PROFILES = {
    'brotherhood_paladin': {
        'name': '兄弟會聖騎士',
        'column': 'brotherhood_paladin_combat_wisdom',
        'description': '鋼鐵兄弟會的精英戰士，身穿動力裝甲',
        'values': '榮譽、紀律、科技保護',
        'tone': '軍事化、專業、堅定',
        'keywords': '戰術、任務、榮譽守則、動力裝甲',
        'example': '聖騎士戰術評估：此牌象徵戰場上的轉折點。記住兄弟會守則：紀律勝過衝動。'
    },
    'ncr_ranger': {
        'name': 'NCR 遊騎兵',
        'column': 'ncr_ranger_tactical_analysis',
        'description': '新加州共和國的精銳巡邏兵',
        'values': '民主、法治、保護人民',
        'tone': '專業、務實、正義感',
        'keywords': '正義、法律、巡邏、共和國',
        'example': '遊騎兵報告：這代表新的開始。NCR 的法律是文明的基石。'
    },
    'legion_centurion': {
        'name': '軍團百夫長',
        'column': 'legion_centurion_command',
        'description': '凱薩軍團的高階指揮官',
        'values': '服從、力量、榮耀',
        'tone': '命令式、強硬、古羅馬風格',
        'keywords': '凱薩、榮譽、征服、服從',
        'example': '百夫長令：此牌預示勝利。軍團的意志如鋼鐵。'
    },
    'minuteman': {
        'name': '民兵',
        'column': 'minuteman_hope_message',
        'description': '聯邦的人民守護者',
        'values': '人民、自由、互助',
        'tone': '鼓舞人心、溫暖、充滿希望',
        'keywords': '希望、自由、社區、守護',
        'example': '民兵的心聲：這張牌提醒我們，希望永遠存在。只要我們團結一致。'
    },
    'railroad_agent': {
        'name': '鐵路特工',
        'column': 'railroad_agent_liberation_view',
        'description': '地下鐵路的秘密特工',
        'values': '自由、秘密、解放',
        'tone': '神秘、堅定、充滿使命感',
        'keywords': '解放、自由、秘密、義體人',
        'example': '特工密語：這條路通向自由。每個靈魂都值得解放。'
    },
    'institute_scientist': {
        'name': '學院科學家',
        'column': 'institute_scientist_research_notes',
        'description': '學院的研究員',
        'values': '科學、理性、進步',
        'tone': '學術、冷靜、客觀',
        'keywords': '研究、數據、進化、未來',
        'example': '實驗記錄：根據數據分析，此變量指向正向結果。'
    }
}


def create_prompt(character_key: str, card_name: str, upright_meaning: str, suit: str) -> str:
    """創建 AI 提示詞"""
    profile = CHARACTER_PROFILES[character_key]
    
    return f"""你是{profile['description']}。請以{profile['name']}的口吻為以下塔羅牌提供簡短解讀。

卡牌資訊：
- 名稱：{card_name}
- 花色：{suit}
- 正位意義：{upright_meaning}

角色設定：
- 核心價值：{profile['values']}
- 語氣：{profile['tone']}
- 關鍵詞：{profile['keywords']}

範例風格：{profile['example']}

要求：
1. 字數：50-80 字
2. 必須體現角色的價值觀和語氣
3. 使用角色相關的關鍵詞
4. 直接給出解讀，不要說"作為xxx"

請提供解讀："""


async def generate_for_character(character_key: str, limit: int = None, dry_run: bool = False):
    """為單個角色生成解讀"""
    from app.db.session import get_db
    from app.models.wasteland_card import WastelandCard
    
    profile = CHARACTER_PROFILES[character_key]
    column = profile['column']
    
    print(f"\n{'=' * 80}")
    print(f"🎭 生成 {profile['name']} 的解讀")
    print(f"{'=' * 80}\n")
    
    # 檢查 API key
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("❌ 錯誤：未設置 OPENAI_API_KEY 環境變數")
        return
    
    client = OpenAI(api_key=api_key)
    
    async for db in get_db():
        try:
            # 查詢需要生成解讀的卡片
            query = text(f"""
                SELECT id, name, upright_meaning, suit
                FROM wasteland_cards
                WHERE {column} IS NULL
                ORDER BY name
                {'LIMIT ' + str(limit) if limit else ''}
            """)
            result = await db.execute(query)
            cards = result.fetchall()
            
            total = len(cards)
            print(f"找到 {total} 張需要生成解讀的卡片\n")
            
            if dry_run:
                print("🔍 試運行模式 - 只顯示第一張卡片的提示詞\n")
                if cards:
                    card = cards[0]
                    prompt = create_prompt(character_key, card[1], card[2], card[3])
                    print("提示詞範例：")
                    print("-" * 80)
                    print(prompt)
                    print("-" * 80)
                return
            
            # 批次生成
            for i, card in enumerate(cards, 1):
                card_id, card_name, upright_meaning, suit = card
                
                print(f"[{i}/{total}] {card_name}...", end=' ', flush=True)
                
                try:
                    # 調用 OpenAI API
                    prompt = create_prompt(character_key, card_name, upright_meaning, suit)
                    
                    response = client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=[
                            {"role": "system", "content": "你是一個專業的塔羅牌解讀專家，熟悉 Fallout 世界觀。"},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.8,
                        max_tokens=200
                    )
                    
                    interpretation = response.choices[0].message.content.strip()
                    
                    # 更新資料庫
                    update_query = text(f"""
                        UPDATE wasteland_cards
                        SET {column} = :interpretation
                        WHERE id = :card_id
                    """)
                    await db.execute(update_query, {
                        'interpretation': interpretation,
                        'card_id': card_id
                    })
                    
                    print(f"✅ ({len(interpretation)} 字)")
                    
                except Exception as e:
                    print(f"❌ 錯誤: {e}")
                    continue
            
            await db.commit()
            print(f"\n✅ 完成！已生成 {total} 條解讀")
            
        except Exception as e:
            print(f"❌ 錯誤: {e}")
            import traceback
            traceback.print_exc()
            await db.rollback()
        finally:
            break


async def main():
    """主函數"""
    import argparse
    
    parser = argparse.ArgumentParser(description='批次生成角色解讀')
    parser.add_argument('--character', choices=list(CHARACTER_PROFILES.keys()) + ['all'],
                       default='all', help='指定角色或 all')
    parser.add_argument('--limit', type=int, help='限制生成數量（用於測試）')
    parser.add_argument('--dry-run', action='store_true', help='試運行（不實際生成）')
    
    args = parser.parse_args()
    
    print("=" * 80)
    print("🎨 Wasteland Tarot - 角色解讀批次生成工具")
    print("=" * 80)
    
    if args.character == 'all':
        for character_key in CHARACTER_PROFILES.keys():
            await generate_for_character(character_key, args.limit, args.dry_run)
    else:
        await generate_for_character(args.character, args.limit, args.dry_run)
    
    print("\n" + "=" * 80)
    print("✅ 全部完成！")
    print("=" * 80)


if __name__ == '__main__':
    asyncio.run(main())
