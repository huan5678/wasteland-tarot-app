"""
資料遷移腳本 - 從前端硬編碼檔案匯入角色、陣營和解讀資料
Migration script to import character, faction, and interpretation data from frontend files
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models import Character, Faction, FactionCharacter, WastelandCard, CardInterpretation
from app.config import settings
import uuid


# 角色資料（從 src/data/voices.ts）
CHARACTERS_DATA = [
    # 通用角色
    {
        'key': 'pip_boy',
        'name': 'Pip-Boy',
        'description': 'Vault-Tec 個人資訊處理器，提供技術分析和數據報告',
        'personality': '理性、數據導向、精確',
        'voice_style': '技術性、客觀、提供統計數據',
        'theme_color': '#00ff88',
        'icon_name': 'device',
        'sort_order': 1,
    },
    {
        'key': 'vault_dweller',
        'name': '避難所居民',
        'description': '來自避難所的樂觀居民，對外界充滿好奇',
        'personality': '樂觀、好奇、友善',
        'voice_style': '友好、充滿希望、對未來保持樂觀',
        'theme_color': '#0ea5e9',
        'icon_name': 'home',
        'sort_order': 2,
    },
    {
        'key': 'wasteland_trader',
        'name': '廢土商人',
        'description': '經驗豐富的商人，提供實用建議',
        'personality': '實用、精明、務實',
        'voice_style': '實際、商業化、關注利益',
        'theme_color': '#f59e0b',
        'icon_name': 'coin',
        'sort_order': 3,
    },
    {
        'key': 'codsworth',
        'name': 'Codsworth',
        'description': '忠誠的機器人管家，保持著戰前的優雅',
        'personality': '優雅、忠誠、老派',
        'voice_style': '禮貌、正式、帶有英式幽默',
        'theme_color': '#06b6d4',
        'icon_name': 'bot',
        'sort_order': 4,
    },
    # 廢土生物與掠奪者
    {
        'key': 'super_mutant',
        'name': '超級變種人',
        'description': '強壯但直率的變種人，用簡單的語言表達',
        'personality': '直接、簡單、強大',
        'voice_style': '簡單句式、直接、強調力量',
        'theme_color': '#ef4444',
        'icon_name': 'skull',
        'sort_order': 5,
    },
    {
        'key': 'ghoul',
        'name': '屍鬼',
        'description': '輻射變異的倖存者，擁有豐富的廢土經驗',
        'personality': '經驗豐富、諷刺、堅韌',
        'voice_style': '諷刺、世故、帶有黑色幽默',
        'theme_color': '#a3e635',
        'icon_name': 'ghost',
        'sort_order': 6,
    },
    {
        'key': 'raider',
        'name': '掠奪者',
        'description': '廢土的無法無天者，直言不諱',
        'personality': '粗暴、直接、無畏',
        'voice_style': '粗魯、威脅性、不守規矩',
        'theme_color': '#f97316',
        'icon_name': 'fire',
        'sort_order': 7,
    },
    # 鋼鐵兄弟會
    {
        'key': 'brotherhood_scribe',
        'name': '兄弟會書記員',
        'description': '鋼鐵兄弟會的知識守護者，專注於技術和歷史',
        'personality': '學術、嚴謹、技術導向',
        'voice_style': '學術性、詳細、技術性',
        'theme_color': '#3b82f6',
        'icon_name': 'book',
        'sort_order': 8,
    },
    {
        'key': 'brotherhood_paladin',
        'name': '兄弟會聖騎士',
        'description': '鋼鐵兄弟會的戰士，堅守紀律和榮譽',
        'personality': '榮譽、紀律、勇敢',
        'voice_style': '軍事化、正式、強調紀律',
        'theme_color': '#1e40af',
        'icon_name': 'shield',
        'sort_order': 9,
    },
    # NCR
    {
        'key': 'ncr_ranger',
        'name': 'NCR 遊騎兵',
        'description': '新加州共和國的精英戰士，經驗豐富且值得信賴',
        'personality': '專業、可靠、堅定',
        'voice_style': '專業、自信、保護性',
        'theme_color': '#d97706',
        'icon_name': 'star',
        'sort_order': 10,
    },
    # 凱薩軍團
    {
        'key': 'legion_centurion',
        'name': '軍團百夫長',
        'description': '凱薩軍團的指揮官，講求紀律和服從',
        'personality': '嚴格、權威、軍事化',
        'voice_style': '命令式、嚴厲、講求服從',
        'theme_color': '#dc2626',
        'icon_name': 'sword',
        'sort_order': 11,
    },
    # Fallout 4 陣營角色
    {
        'key': 'minuteman',
        'name': '民兵',
        'description': '保護人民的志願軍，充滿正義感',
        'personality': '正義、保護、無私',
        'voice_style': '正義感、保護性、鼓舞人心',
        'theme_color': '#10b981',
        'icon_name': 'flag',
        'sort_order': 12,
    },
    {
        'key': 'railroad_agent',
        'name': '鐵路特工',
        'description': '地下鐵路的秘密特工，致力於解放合成人',
        'personality': '神秘、同情、謹慎',
        'voice_style': '神秘、謹慎、充滿同情',
        'theme_color': '#8b5cf6',
        'icon_name': 'lock',
        'sort_order': 13,
    },
    {
        'key': 'institute_scientist',
        'name': '學院科學家',
        'description': '學院的研究員,代表最先進的科技',
        'personality': '科學、理性、先進',
        'voice_style': '科學性、理性、前瞻性',
        'theme_color': '#06b6d4',
        'icon_name': 'flask',
        'sort_order': 14,
    },
]

# 陣營資料（從 src/lib/factionVoiceMapping.ts）
FACTIONS_DATA = [
    {
        'key': 'vault_dweller',
        'name': '避難所居民',
        'description': '科技派系，親近 Pip-Boy 和 Codsworth',
        'alignment': 'lawful_good',
        'theme_color': '#0ea5e9',
        'icon_name': 'home',
        'sort_order': 1,
    },
    {
        'key': 'brotherhood',
        'name': '鋼鐵兄弟會',
        'description': '軍事科技派系',
        'alignment': 'lawful_neutral',
        'theme_color': '#3b82f6',
        'icon_name': 'shield',
        'sort_order': 2,
    },
    {
        'key': 'ncr',
        'name': '新加州共和國',
        'description': '民主派系，重商貿',
        'alignment': 'neutral_good',
        'theme_color': '#d97706',
        'icon_name': 'flag',
        'sort_order': 3,
    },
    {
        'key': 'legion',
        'name': '凱薩軍團',
        'description': '軍事獨裁派系',
        'alignment': 'lawful_evil',
        'theme_color': '#dc2626',
        'icon_name': 'sword',
        'sort_order': 4,
    },
    {
        'key': 'raiders',
        'name': '掠奪者',
        'description': '混亂派系',
        'alignment': 'chaotic_evil',
        'theme_color': '#f97316',
        'icon_name': 'fire',
        'sort_order': 5,
    },
    {
        'key': 'minutemen',
        'name': '民兵組織',
        'description': '人民派系',
        'alignment': 'neutral_good',
        'theme_color': '#10b981',
        'icon_name': 'star',
        'sort_order': 6,
    },
    {
        'key': 'railroad',
        'name': '地下鐵路',
        'description': '解放派系',
        'alignment': 'chaotic_good',
        'theme_color': '#8b5cf6',
        'icon_name': 'lock',
        'sort_order': 7,
    },
    {
        'key': 'institute',
        'name': '學院',
        'description': '科學派系',
        'alignment': 'neutral_neutral',
        'theme_color': '#06b6d4',
        'icon_name': 'flask',
        'sort_order': 8,
    },
    {
        'key': 'independent',
        'name': '獨立派',
        'description': '中立派系，可接觸多種角色',
        'alignment': 'true_neutral',
        'theme_color': '#6b7280',
        'icon_name': 'user',
        'sort_order': 9,
    },
]

# 陣營-角色映射（從 src/lib/factionVoiceMapping.ts）
FACTION_CHARACTER_MAPPING = {
    'vault_dweller': ['pip_boy', 'vault_dweller', 'codsworth'],
    'brotherhood': ['pip_boy', 'brotherhood_scribe', 'brotherhood_paladin', 'codsworth'],
    'ncr': ['pip_boy', 'ncr_ranger', 'wasteland_trader'],
    'legion': ['pip_boy', 'legion_centurion', 'raider'],
    'raiders': ['pip_boy', 'raider', 'super_mutant'],
    'minutemen': ['pip_boy', 'minuteman', 'wasteland_trader', 'vault_dweller'],
    'railroad': ['pip_boy', 'railroad_agent', 'ghoul'],
    'institute': ['pip_boy', 'institute_scientist', 'codsworth'],
    'independent': ['pip_boy', 'vault_dweller', 'wasteland_trader', 'ghoul'],
}


async def migrate_data():
    """主要的資料遷移函數"""

    # 創建異步引擎（使用與 session.py 相同的 pgbouncer 配置）
    engine = create_async_engine(
        settings.database_url,
        echo=True,
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
        pool_pre_ping=True,
        connect_args={
            "statement_cache_size": 0,  # 禁用 asyncpg statement cache
            "prepared_statement_cache_size": 0,
            "prepared_statement_name_func": lambda: f"__pstmt_{uuid.uuid4().hex[:8]}__",
            "server_settings": {
                "jit": "off",
            }
        },
        execution_options={
            "compiled_cache": None,  # 禁用 compiled statement cache
        }
    )

    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        print("=" * 80)
        print("開始資料遷移")
        print("=" * 80)
        print()

        # === 1. 匯入角色資料 ===
        print("📝 匯入角色資料...")
        print("-" * 80)

        characters_map = {}  # 用於儲存 key -> Character 的映射

        for char_data in CHARACTERS_DATA:
            # 檢查角色是否已存在
            result = await session.execute(
                select(Character).where(Character.key == char_data['key'])
            )
            existing_char = result.scalar_one_or_none()

            if existing_char:
                print(f"  ⏭️  角色已存在: {char_data['key']}")
                characters_map[char_data['key']] = existing_char
            else:
                new_char = Character(**char_data)
                session.add(new_char)
                characters_map[char_data['key']] = new_char
                print(f"  ✅ 新增角色: {char_data['key']} - {char_data['name']}")

        await session.flush()  # 確保新角色獲得 ID

        print(f"\n總共處理 {len(CHARACTERS_DATA)} 個角色")
        print()

        # === 2. 匯入陣營資料 ===
        print("📝 匯入陣營資料...")
        print("-" * 80)

        factions_map = {}  # 用於儲存 key -> Faction 的映射

        for faction_data in FACTIONS_DATA:
            # 檢查陣營是否已存在
            result = await session.execute(
                select(Faction).where(Faction.key == faction_data['key'])
            )
            existing_faction = result.scalar_one_or_none()

            if existing_faction:
                print(f"  ⏭️  陣營已存在: {faction_data['key']}")
                factions_map[faction_data['key']] = existing_faction
            else:
                new_faction = Faction(**faction_data)
                session.add(new_faction)
                factions_map[faction_data['key']] = new_faction
                print(f"  ✅ 新增陣營: {faction_data['key']} - {faction_data['name']}")

        await session.flush()  # 確保新陣營獲得 ID

        print(f"\n總共處理 {len(FACTIONS_DATA)} 個陣營")
        print()

        # === 3. 匯入陣營-角色關聯 ===
        print("📝 匯入陣營-角色關聯...")
        print("-" * 80)

        association_count = 0

        for faction_key, character_keys in FACTION_CHARACTER_MAPPING.items():
            faction = factions_map.get(faction_key)
            if not faction:
                print(f"  ⚠️  找不到陣營: {faction_key}")
                continue

            for priority, char_key in enumerate(character_keys):
                character = characters_map.get(char_key)
                if not character:
                    print(f"  ⚠️  找不到角色: {char_key}")
                    continue

                # 檢查關聯是否已存在
                result = await session.execute(
                    select(FactionCharacter).where(
                        FactionCharacter.faction_id == faction.id,
                        FactionCharacter.character_id == character.id
                    )
                )
                existing_assoc = result.scalar_one_or_none()

                if existing_assoc:
                    print(f"  ⏭️  關聯已存在: {faction_key} -> {char_key}")
                else:
                    new_assoc = FactionCharacter(
                        faction_id=faction.id,
                        character_id=character.id,
                        priority=priority
                    )
                    session.add(new_assoc)
                    association_count += 1
                    print(f"  ✅ 新增關聯: {faction_key} -> {char_key} (優先級: {priority})")

        await session.commit()

        print(f"\n總共處理 {association_count} 個陣營-角色關聯")
        print()

        print("=" * 80)
        print("資料遷移完成！")
        print("=" * 80)
        print()
        print("📊 摘要:")
        print(f"  - 角色: {len(CHARACTERS_DATA)} 個")
        print(f"  - 陣營: {len(FACTIONS_DATA)} 個")
        print(f"  - 關聯: {association_count} 個")
        print()

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(migrate_data())
