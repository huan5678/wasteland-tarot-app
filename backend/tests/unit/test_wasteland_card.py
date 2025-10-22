"""
TDD 測試 - WastelandCard 模型故事欄位擴展

這些測試遵循 Red-Green-Refactor 循環：
1. 🔴 Red: 先寫失敗的測試（當前階段）
2. 🟢 Green: 寫最小實作讓測試通過
3. 🔵 Refactor: 優化代碼（保持測試綠燈）
"""

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.models.wasteland_card import WastelandCard, WastelandSuit, FactionAlignment


@pytest_asyncio.fixture
async def wasteland_card_session(db_session):
    """建立帶有 wasteland_cards 表的測試 session"""
    # 確保表存在
    await db_session.execute(text("""
        CREATE TABLE IF NOT EXISTS wasteland_cards (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL,
            suit VARCHAR(50) NOT NULL,
            number INTEGER,
            radiation_level FLOAT DEFAULT 0.0,
            threat_level INTEGER DEFAULT 1,
            vault_number INTEGER,
            upright_meaning TEXT NOT NULL,
            reversed_meaning TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))
    await db_session.commit()

    yield db_session

    # 清理測試數據
    await db_session.execute(text("DELETE FROM wasteland_cards"))
    await db_session.commit()


class TestWastelandCardStoryFields:
    """🔴 Red: 測試故事模式欄位（預期失敗）"""

    @pytest.mark.asyncio
    async def test_create_card_with_story_fields(self, wasteland_card_session: AsyncSession):
        """測試建立帶故事資料的卡牌（預期失敗：欄位尚不存在）"""
        # 建立帶故事資料的卡牌
        # 故事背景需要至少 200 字
        story_text = (
            "在2277年10月23日的早晨，101號避難所的大門終於緩緩開啟。"
            "一個年輕的居民站在出口處，手持父親留下的Pip-Boy 3000，"
            "眼前是他從未見過的荒涼世界。首都廢土在核戰後已經過了200年，"
            "到處都是輻射、變種生物和危險的掠奪者。但他必須踏上這段旅程，"
            "去尋找失蹤的父親。Brotherhood of Steel的士兵告訴他，"
            "他的父親可能在進行一個名為「淨水計畫」的研究，"
            "這個計畫有可能改變整個首都廢土的命運，讓所有人都能獲得乾淨的水源。"
        )

        card = WastelandCard(
            name="新手避難所居民",
            suit=WastelandSuit.MAJOR_ARCANA,
            number=0,
            radiation_level=0.2,
            upright_meaning="新的開始",
            reversed_meaning="猶豫不決",
            # 故事欄位（預期失敗：這些欄位還不存在）
            story_background=story_text,
            story_character="避難所居民 101",
            story_location="Vault 101 出口",
            story_timeline="2277 年",
            story_faction_involved=["vault_dweller", "brotherhood"],
            story_related_quest="Escape from Vault 101"
        )

        wasteland_card_session.add(card)
        await wasteland_card_session.commit()
        await wasteland_card_session.refresh(card)

        # 驗證故事欄位
        assert card.story_background is not None
        assert len(card.story_background) >= 200
        assert card.story_character == "避難所居民 101"
        assert card.story_location == "Vault 101 出口"
        assert card.story_timeline == "2277 年"
        assert card.story_faction_involved == ["vault_dweller", "brotherhood"]
        assert card.story_related_quest == "Escape from Vault 101"

    @pytest.mark.asyncio
    async def test_story_background_length_validation(self, wasteland_card_session: AsyncSession):
        """測試故事背景字數驗證（200-500字）"""
        # 測試字數不足（<200字，應該失敗）
        short_story = "太短的故事。" * 10  # 約60字

        # 預期驗證失敗 - 在物件建立時就會拋出錯誤
        with pytest.raises(ValueError, match="story_background.*200.*500"):
            card_short = WastelandCard(
                name="測試卡牌",
                suit=WastelandSuit.MAJOR_ARCANA,
                upright_meaning="測試",
                reversed_meaning="測試",
                story_background=short_story
            )

        # 測試字數過長（>500字，應該失敗）
        long_story = "很長的故事。" * 100  # 約500字

        # 預期驗證失敗 - 在物件建立時就會拋出錯誤
        with pytest.raises(ValueError, match="story_background.*200.*500"):
            card_long = WastelandCard(
                name="測試卡牌2",
                suit=WastelandSuit.MAJOR_ARCANA,
                upright_meaning="測試",
                reversed_meaning="測試",
                story_background=long_story
            )


class TestStoryTimelineValidation:
    """🔴 Red: 測試時間格式驗證（預期失敗）"""

    @pytest.mark.parametrize("timeline,should_pass", [
        ("戰前", True),
        ("戰後", True),
        ("2277 年", True),
        ("2100 年", True),
        ("2287 年", True),
        ("2077", False),  # 缺少「年」字，應該失敗
        ("戰前戰後", False),  # 格式錯誤，應該失敗
        ("2077年", False),  # 「年」前沒有空格，應該失敗
        ("200 年", False),  # 年份只有3位數，應該失敗
    ])
    @pytest.mark.asyncio
    async def test_timeline_format_validation(
        self,
        wasteland_card_session: AsyncSession,
        timeline: str,
        should_pass: bool
    ):
        """測試時間格式驗證（「戰前」、「戰後」、「YYYY 年」）"""
        if should_pass:
            # 應該通過驗證
            card = WastelandCard(
                name=f"測試卡牌_{timeline}",
                suit=WastelandSuit.MAJOR_ARCANA,
                upright_meaning="測試",
                reversed_meaning="測試",
                story_timeline=timeline
            )
            wasteland_card_session.add(card)
            await wasteland_card_session.commit()
            await wasteland_card_session.refresh(card)
            assert card.story_timeline == timeline
        else:
            # 應該失敗（在建立物件時就會拋出異常）
            with pytest.raises(ValueError, match="story_timeline.*format"):
                card = WastelandCard(
                    name=f"測試卡牌_{timeline}",
                    suit=WastelandSuit.MAJOR_ARCANA,
                    upright_meaning="測試",
                    reversed_meaning="測試",
                    story_timeline=timeline
                )


class TestStoryCharacterVoices:
    """🔴 Red: 測試根據陣營推導角色語音（預期失敗）"""

    @pytest.mark.parametrize("factions,expected_voices", [
        (
            ["vault_dweller"],
            ["pip_boy", "vault_dweller", "codsworth"]
        ),
        (
            ["brotherhood"],
            ["brotherhood_scribe", "brotherhood_paladin"]
        ),
        (
            ["ncr"],
            ["ncr_ranger"]
        ),
        (
            ["legion"],
            ["legion_centurion"]
        ),
        (
            ["raiders"],
            ["raider", "super_mutant"]
        ),
        (
            ["minutemen"],
            ["minuteman"]
        ),
        (
            ["railroad"],
            ["railroad_agent"]
        ),
        (
            ["institute"],
            ["institute_scientist"]
        ),
        (
            ["vault_dweller", "brotherhood"],
            ["pip_boy", "vault_dweller", "codsworth", "brotherhood_scribe", "brotherhood_paladin"]
        ),
    ])
    @pytest.mark.asyncio
    async def test_get_story_character_voices(
        self,
        wasteland_card_session: AsyncSession,
        factions: list,
        expected_voices: list
    ):
        """測試 get_story_character_voices() 方法根據陣營推導角色語音"""
        card = WastelandCard(
            name="測試卡牌",
            suit=WastelandSuit.MAJOR_ARCANA,
            upright_meaning="測試",
            reversed_meaning="測試",
            story_faction_involved=factions
        )

        wasteland_card_session.add(card)
        await wasteland_card_session.commit()
        await wasteland_card_session.refresh(card)

        # 呼叫 get_story_character_voices() 方法（預期失敗：方法不存在）
        voices = card.get_story_character_voices()

        # 驗證推導的語音
        assert isinstance(voices, list)
        assert len(voices) > 0

        # 驗證所有預期的語音都在結果中
        for expected_voice in expected_voices:
            assert expected_voice in voices, f"Expected voice '{expected_voice}' not found in {voices}"

    @pytest.mark.asyncio
    async def test_get_story_character_voices_with_no_factions(self, wasteland_card_session: AsyncSession):
        """測試無陣營時的預設語音"""
        card = WastelandCard(
            name="測試卡牌",
            suit=WastelandSuit.MAJOR_ARCANA,
            upright_meaning="測試",
            reversed_meaning="測試",
            story_faction_involved=None  # 無陣營
        )

        wasteland_card_session.add(card)
        await wasteland_card_session.commit()
        await wasteland_card_session.refresh(card)

        voices = card.get_story_character_voices()

        # 無陣營時應該返回通用角色
        assert isinstance(voices, list)
        assert "pip_boy" in voices
        assert "wasteland_trader" in voices


class TestStoryFactionValidation:
    """🔴 Red: 測試陣營列表驗證（預期失敗）"""

    @pytest.mark.parametrize("factions,should_pass", [
        (["vault_dweller"], True),
        (["brotherhood"], True),
        (["ncr"], True),
        (["vault_dweller", "brotherhood"], True),
        (["invalid_faction"], False),  # 無效陣營
        (["vault_dweller", "invalid"], False),  # 包含無效陣營
        ([], False),  # 空列表
    ])
    @pytest.mark.asyncio
    async def test_faction_list_validation(
        self,
        wasteland_card_session: AsyncSession,
        factions: list,
        should_pass: bool
    ):
        """測試陣營列表內容驗證"""
        if should_pass:
            card = WastelandCard(
                name="測試卡牌",
                suit=WastelandSuit.MAJOR_ARCANA,
                upright_meaning="測試",
                reversed_meaning="測試",
                story_faction_involved=factions
            )
            wasteland_card_session.add(card)
            await wasteland_card_session.commit()
            await wasteland_card_session.refresh(card)
            assert card.story_faction_involved == factions
        else:
            # 應該失敗（在建立物件時就會拋出異常）
            with pytest.raises(ValueError):
                card = WastelandCard(
                    name="測試卡牌",
                    suit=WastelandSuit.MAJOR_ARCANA,
                    upright_meaning="測試",
                    reversed_meaning="測試",
                    story_faction_involved=factions
                )


class TestStoryFieldsNullability:
    """🔴 Red: 測試故事欄位可為空（向後相容性）"""

    @pytest.mark.asyncio
    async def test_card_without_story_fields_should_work(self, wasteland_card_session: AsyncSession):
        """測試不提供故事欄位的卡牌應該正常建立（向後相容）"""
        card = WastelandCard(
            name="舊版卡牌",
            suit=WastelandSuit.MAJOR_ARCANA,
            number=0,
            radiation_level=0.2,
            upright_meaning="新的開始",
            reversed_meaning="猶豫不決"
            # 不提供任何故事欄位
        )

        wasteland_card_session.add(card)
        await wasteland_card_session.commit()
        await wasteland_card_session.refresh(card)

        # 驗證卡牌建立成功
        assert card.id is not None
        assert card.name == "舊版卡牌"

        # 驗證故事欄位為 None（預期失敗：欄位不存在）
        assert hasattr(card, "story_background")
        assert card.story_background is None
        assert hasattr(card, "story_character")
        assert card.story_character is None


# 注意：使用 conftest.py 中的 db_session fixture
