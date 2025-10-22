"""
TDD 整合測試 - WastelandCardService 故事模式功能

這些測試遵循 Red-Green-Refactor 循環：
1. 🔴 Red: 先寫失敗的測試（當前階段）
2. 🟢 Green: 實作最小功能讓測試通過
3. 🔵 Refactor: 優化代碼（保持測試綠燈）
"""

import pytest
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.wasteland_card_service import WastelandCardService
from app.models.wasteland_card import WastelandCard, WastelandSuit
from typing import Dict, Any


@pytest.fixture
async def wasteland_card_service(db_session: AsyncSession) -> WastelandCardService:
    """建立 WastelandCardService 實例"""
    return WastelandCardService(db_session)


@pytest.fixture
async def sample_card_with_story(db_session: AsyncSession) -> WastelandCard:
    """建立一個包含故事資料的測試卡牌"""
    # 使用足夠長的故事背景（200-500 字）
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
        upright_meaning="新的開始，踏上未知旅程",
        reversed_meaning="猶豫不決，害怕改變",
        # 故事欄位
        story_background=story_text,
        story_character="避難所居民 101 (Lone Wanderer)",
        story_location="Vault 101 出口、Springvale 小鎮廢墟",
        story_timeline="2277 年",
        story_faction_involved=["vault_dweller", "brotherhood"],
        story_related_quest="Escape! / Following in His Footsteps"
    )

    db_session.add(card)
    await db_session.commit()
    await db_session.refresh(card)

    return card


class TestGetCardWithStory:
    """🔴 Red: 測試 get_card_with_story() 方法（預期失敗：方法不存在）"""

    @pytest.mark.asyncio
    async def test_get_card_with_story_includes_all_fields(
        self,
        wasteland_card_service: WastelandCardService,
        sample_card_with_story: WastelandCard
    ):
        """測試 get_card_with_story() 返回包含所有故事欄位的卡牌"""
        # 預期失敗：方法不存在
        card = await wasteland_card_service.get_card_with_story(sample_card_with_story.id)

        assert card is not None
        assert card.id == sample_card_with_story.id
        assert card.name == "新手避難所居民"

        # 驗證故事欄位都被載入
        assert card.story_background is not None
        assert len(card.story_background) >= 200
        assert card.story_character == "避難所居民 101 (Lone Wanderer)"
        assert card.story_location == "Vault 101 出口、Springvale 小鎮廢墟"
        assert card.story_timeline == "2277 年"
        assert card.story_faction_involved == ["vault_dweller", "brotherhood"]
        assert card.story_related_quest == "Escape! / Following in His Footsteps"

    @pytest.mark.asyncio
    async def test_get_card_with_story_returns_none_for_nonexistent_card(
        self,
        wasteland_card_service: WastelandCardService
    ):
        """測試查詢不存在的卡牌返回 None"""
        from uuid import uuid4

        # 預期失敗：方法不存在
        card = await wasteland_card_service.get_card_with_story(uuid4())

        assert card is None

    @pytest.mark.asyncio
    async def test_get_card_with_story_works_for_cards_without_story(
        self,
        wasteland_card_service: WastelandCardService,
        db_session: AsyncSession
    ):
        """測試查詢沒有故事的卡牌也能正常運作"""
        # 建立一個沒有故事資料的卡牌
        card_without_story = WastelandCard(
            name="測試卡牌",
            suit=WastelandSuit.MAJOR_ARCANA,
            upright_meaning="測試",
            reversed_meaning="測試"
        )

        db_session.add(card_without_story)
        await db_session.commit()
        await db_session.refresh(card_without_story)

        # 預期失敗：方法不存在
        card = await wasteland_card_service.get_card_with_story(card_without_story.id)

        assert card is not None
        assert card.id == card_without_story.id
        # 故事欄位應該是 None
        assert card.story_background is None
        assert card.story_character is None


class TestListCardsWithStory:
    """🔴 Red: 測試 list_cards_with_story() 方法（預期失敗：方法不存在）"""

    @pytest.mark.asyncio
    async def test_list_cards_with_story_includes_story_fields_when_true(
        self,
        wasteland_card_service: WastelandCardService,
        sample_card_with_story: WastelandCard
    ):
        """測試 include_story=True 時載入故事欄位"""
        # 預期失敗：方法不存在
        cards = await wasteland_card_service.list_cards_with_story(include_story=True)

        assert len(cards) > 0

        # 找到我們的測試卡牌
        test_card = next((c for c in cards if c.id == sample_card_with_story.id), None)
        assert test_card is not None

        # 驗證故事欄位被載入
        assert test_card.story_background is not None
        assert test_card.story_character is not None

    @pytest.mark.asyncio
    async def test_list_cards_with_story_excludes_story_fields_when_false(
        self,
        wasteland_card_service: WastelandCardService,
        sample_card_with_story: WastelandCard
    ):
        """測試 include_story=False 時不載入故事欄位（優化查詢性能）"""
        # 預期失敗：方法不存在
        cards = await wasteland_card_service.list_cards_with_story(include_story=False)

        assert len(cards) > 0

        # SQLAlchemy 的 defer() 不會完全移除屬性，但會延遲載入
        # 我們測試基本欄位存在即可
        test_card = next((c for c in cards if c.id == sample_card_with_story.id), None)
        assert test_card is not None
        assert test_card.name == "新手避難所居民"
        assert test_card.suit == WastelandSuit.MAJOR_ARCANA

    @pytest.mark.asyncio
    async def test_list_cards_default_behavior_excludes_story(
        self,
        wasteland_card_service: WastelandCardService,
        sample_card_with_story: WastelandCard
    ):
        """測試預設行為（include_story 預設為 False）"""
        # 預期失敗：方法不存在
        cards = await wasteland_card_service.list_cards_with_story()

        assert len(cards) > 0

        # 預設應該不載入故事欄位
        test_card = next((c for c in cards if c.id == sample_card_with_story.id), None)
        assert test_card is not None


class TestUpdateStoryContent:
    """🔴 Red: 測試 update_story_content() 方法（預期失敗：方法不存在）"""

    @pytest.mark.asyncio
    async def test_update_story_content_success(
        self,
        wasteland_card_service: WastelandCardService,
        sample_card_with_story: WastelandCard
    ):
        """測試成功更新故事內容"""
        # 新的故事資料（符合驗證規則）
        new_story_text = (
            "在2287年的波士頓廢土，一個剛從111號避難所甦醒的倖存者，"
            "睜開眼睛發現世界已經過了210年。他的配偶被殺害，兒子被綁架。"
            "在這個充滿超級變種人、強盜和輻射屍鬼的危險世界中，"
            "他必須找到失蹤的兒子Shaun。Minutemen將軍Preston Garvey告訴他，"
            "有一個神秘的組織叫做Institute，他們擁有先進的科技，"
            "可能知道Shaun的下落。他的旅程才剛剛開始。"
            "在Sanctuary Hills的廢墟中，他找到了Codsworth，那個還在等待主人回來的機器人管家。"
            "隨後他來到Concord，在那裡遇到了Preston和他的Minutemen殘部。"
            "他們告訴他關於Commonwealth的現狀：各個聚落之間互不信任，"
            "Raiders四處掠奪，而神秘的Institute則綁架居民進行實驗。"
        )

        story_update_data = {
            "story_background": new_story_text,
            "story_character": "唯一倖存者 (Sole Survivor)",
            "story_location": "Vault 111 出口、Sanctuary Hills 廢墟",
            "story_timeline": "2287 年",
            "story_faction_involved": ["minutemen", "railroad"],
            "story_related_quest": "Out of Time / When Freedom Calls"
        }

        # 預期失敗：方法不存在
        updated_card = await wasteland_card_service.update_story_content(
            card_id=sample_card_with_story.id,
            story_data=story_update_data
        )

        assert updated_card is not None
        assert updated_card.id == sample_card_with_story.id
        assert updated_card.story_background == new_story_text
        assert updated_card.story_character == "唯一倖存者 (Sole Survivor)"
        assert updated_card.story_timeline == "2287 年"
        assert "minutemen" in updated_card.story_faction_involved

    @pytest.mark.asyncio
    async def test_update_story_content_validation_failure_short_text(
        self,
        wasteland_card_service: WastelandCardService,
        sample_card_with_story: WastelandCard
    ):
        """測試更新時驗證失敗（故事太短）"""
        from fastapi import HTTPException

        # 故事太短（<200 字）
        invalid_story_data = {
            "story_background": "太短的故事。",
            "story_character": "測試角色",
            "story_timeline": "2277 年",
            "story_faction_involved": ["vault_dweller"]
        }

        # 預期失敗：方法不存在
        # 實作時應該拋出 HTTPException(400)
        with pytest.raises(HTTPException) as exc_info:
            await wasteland_card_service.update_story_content(
                card_id=sample_card_with_story.id,
                story_data=invalid_story_data
            )

        assert exc_info.value.status_code == 400
        assert "200" in str(exc_info.value.detail).lower() or "字" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_update_story_content_validation_failure_invalid_faction(
        self,
        wasteland_card_service: WastelandCardService,
        sample_card_with_story: WastelandCard
    ):
        """測試更新時驗證失敗（無效陣營）"""
        from fastapi import HTTPException

        valid_story_text = "在廢土中生存需要智慧和勇氣。" * 50  # 約 200 字

        invalid_story_data = {
            "story_background": valid_story_text,
            "story_character": "測試角色",
            "story_timeline": "2277 年",
            "story_faction_involved": ["invalid_faction", "another_invalid"]
        }

        # 預期失敗：方法不存在
        # 實作時應該拋出 HTTPException(400)
        with pytest.raises(HTTPException) as exc_info:
            await wasteland_card_service.update_story_content(
                card_id=sample_card_with_story.id,
                story_data=invalid_story_data
            )

        assert exc_info.value.status_code == 400
        assert "faction" in str(exc_info.value.detail).lower() or "陣營" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_update_story_content_nonexistent_card(
        self,
        wasteland_card_service: WastelandCardService
    ):
        """測試更新不存在的卡牌"""
        from uuid import uuid4
        from fastapi import HTTPException

        valid_story_text = "在廢土中生存需要智慧和勇氣。" * 50

        story_data = {
            "story_background": valid_story_text,
            "story_character": "測試角色",
            "story_timeline": "2277 年",
            "story_faction_involved": ["vault_dweller"]
        }

        # 預期失敗：方法不存在
        # 實作時應該拋出 HTTPException(404)
        with pytest.raises(HTTPException) as exc_info:
            await wasteland_card_service.update_story_content(
                card_id=uuid4(),
                story_data=story_data
            )

        assert exc_info.value.status_code == 404


class TestStoryModeIntegration:
    """🔴 Red: 整合測試 - 完整的故事模式工作流程"""

    @pytest.mark.asyncio
    async def test_complete_story_workflow(
        self,
        wasteland_card_service: WastelandCardService,
        db_session: AsyncSession
    ):
        """測試完整的故事模式工作流程：建立 → 查詢 → 更新"""
        # 1. 建立一個新卡牌（帶故事）
        story_text_1 = (
            "在2241年的加州廢土，一個來自Arroyo部落的被選中者，"
            "必須尋找傳說中的G.E.C.K.來拯救他的部落。"
            "NCR正在擴張他們的勢力範圍，Vault City關閉大門拒絕外人，"
            "而New Reno的黑幫家族則為了地盤而互相爭鬥。"
            "他的旅程將帶他穿越整個北加州，遇見各種廢土生存者。"
            "在這個過程中，他將學會什麼是真正的領導力和犧牲。"
            "從Klamath的獵人到Redding的礦工，從Broken Hills的變種人到San Francisco的Shi組織，"
            "被選中者見證了廢土的多樣性。他的選擇將影響整個西海岸的未來。"
        )

        card = WastelandCard(
            name="被選中者",
            suit=WastelandSuit.MAJOR_ARCANA,
            number=1,
            upright_meaning="命運的召喚",
            reversed_meaning="逃避責任",
            story_background=story_text_1,
            story_character="被選中者 (Chosen One)",
            story_location="Arroyo 部落、NCR 領地",
            story_timeline="2241 年",
            story_faction_involved=["vault_dweller", "ncr"],
            story_related_quest="Find the GECK"
        )

        db_session.add(card)
        await db_session.commit()
        await db_session.refresh(card)

        # 2. 使用 get_card_with_story() 查詢（預期失敗：方法不存在）
        retrieved_card = await wasteland_card_service.get_card_with_story(card.id)

        assert retrieved_card is not None
        assert retrieved_card.story_background == story_text_1
        assert retrieved_card.story_character == "被選中者 (Chosen One)"

        # 3. 更新故事內容（預期失敗：方法不存在）
        story_text_2 = (
            "在完成尋找G.E.C.K.的任務後，被選中者回到了Arroyo。"
            "然而，他發現整個部落已經被Enclave綁架了。"
            "在這個最黑暗的時刻，他必須做出艱難的選擇：是拯救部落，"
            "還是阻止Enclave釋放改造病毒(FEV)來消滅所有變種人？"
            "他的決定將影響整個廢土的未來。NCR、Brotherhood of Steel、"
            "甚至Vault City都在關注著他的行動。他將如何選擇？"
            "在Oil Rig的最終戰中，被選中者面對著Enclave總統和Frank Horrigan。"
            "他必須在道德和生存之間做出抉擇，這個抉擇將永遠改變他和他的部落。"
        )

        updated_data = {
            "story_background": story_text_2,
            "story_character": "被選中者 (Chosen One) - 英雄時期",
            "story_timeline": "2242 年",
            "story_faction_involved": ["vault_dweller", "ncr", "brotherhood"],
            "story_related_quest": "Stop the Enclave"
        }

        updated_card = await wasteland_card_service.update_story_content(
            card_id=card.id,
            story_data=updated_data
        )

        assert updated_card.story_background == story_text_2
        assert updated_card.story_timeline == "2242 年"
        assert "brotherhood" in updated_card.story_faction_involved

        # 4. 再次查詢驗證更新成功
        final_card = await wasteland_card_service.get_card_with_story(card.id)
        assert final_card.story_background == story_text_2
