"""
TDD 單元測試 - Story Pydantic Schema

這些測試遵循 Red-Green-Refactor 循環：
1. 🔴 Red: 先寫失敗的測試（當前階段）
2. 🟢 Green: 實作最小功能讓測試通過
3. 🔵 Refactor: 優化代碼（保持測試綠燈）

測試範圍：
- Story schema 資料驗證
- StoryUpdateRequest schema
- WastelandCardWithStory schema（帶故事內容的卡牌）
- Pydantic validators（字數、陣營、時間格式）
"""

import pytest
from pydantic import ValidationError
from typing import Dict, Any


# ============================================================
# 🔵 Refactor: 共用測試資料常數
# ============================================================

# Vault 101 故事（238 字，符合 200-500 字要求）
VALID_STORY_VAULT_101 = (
    "在2277年10月23日的早晨，101號避難所的大門終於緩緩開啟。"
    "一個年輕的居民站在出口處，手持父親留下的Pip-Boy 3000，"
    "眼前是他從未見過的荒涼世界。首都廢土在核戰後已經過了200年，"
    "到處都是輻射、變種生物和危險的掠奪者。但他必須踏上這段旅程，"
    "去尋找失蹤的父親。Brotherhood of Steel的士兵告訴他，"
    "他的父親可能在進行一個名為「淨水計畫」的研究，"
    "這個計畫有可能改變整個首都廢土的命運，讓所有人都能獲得乾淨的水源。"
    "他深呼吸一口氣，踏出了避難所的第一步。"
)

# Vault 111 故事（214 字，符合 200-500 字要求）
VALID_STORY_VAULT_111 = (
    "在2287年的波士頓廢土，一個剛從111號避難所甦醒的倖存者，"
    "睜開眼睛發現世界已經過了210年。他的配偶被殺害，兒子被綁架，"
    "留下他獨自面對這個陌生又危險的新世界。"
    "在這個充滿超級變種人、強盜和輻射屍鬼的廢土中，"
    "他必須找到失蹤的兒子Shaun。Minutemen將軍Preston Garvey告訴他，"
    "有一個神秘的組織叫做Institute，他們擁有先進的科技，可能與綁架案有關。"
    "為了找回唯一的親人，他開始了在波士頓廢土的冒險旅程。"
)


class TestStorySchema:
    """🔴 Red: 測試 Story schema（預期失敗：schema 不存在）"""

    def test_import_story_schema(self):
        """測試能夠導入 Story schema"""
        # 預期失敗：schema 尚不存在
        from app.schemas.story import Story

        assert Story is not None

    def test_valid_story_schema(self):
        """測試有效的故事資料可成功驗證"""
        from app.schemas.story import Story

        # 恰好 200 字的故事背景
        valid_story_data = {
            "background": (
                "在2277年10月23日的早晨，101號避難所的大門終於緩緩開啟。"
                "一個年輕的居民站在出口處，手持父親留下的Pip-Boy 3000，"
                "眼前是他從未見過的荒涼世界。首都廢土在核戰後已經過了200年，"
                "到處都是輻射、變種生物和危險的掠奪者。但他必須踏上這段旅程，"
                "去尋找失蹤的父親。Brotherhood of Steel的士兵告訴他，"
                "他的父親可能在進行一個名為「淨水計畫」的研究，"
                "這個計畫有可能改變整個首都廢土的命運，讓所有人都能獲得乾淨的水源。"
            ),
            "character": "避難所居民 101 (Lone Wanderer)",
            "location": "Vault 101 出口、Springvale 小鎮廢墟",
            "timeline": "2277 年",
            "factions_involved": ["vault_dweller", "brotherhood"],
            "related_quest": "Escape! / Following in His Footsteps"
        }

        story = Story(**valid_story_data)

        assert story.background == valid_story_data["background"]
        assert story.character == valid_story_data["character"]
        assert story.timeline == valid_story_data["timeline"]
        assert "vault_dweller" in story.factions_involved
        assert "brotherhood" in story.factions_involved

    def test_story_background_min_length_validation(self):
        """測試故事背景字數不足（<200字）被拒絕"""
        from app.schemas.story import Story

        # 故事太短（約 60 字）
        invalid_data = {
            "background": "太短的故事。" * 10,
            "character": "測試角色",
            "timeline": "2277 年",
            "factions_involved": ["vault_dweller"]
        }

        with pytest.raises(ValidationError) as exc_info:
            Story(**invalid_data)

        # 驗證錯誤訊息包含字數要求
        errors = exc_info.value.errors()
        assert any("200" in str(error) or "字" in str(error) for error in errors)

    def test_story_background_max_length_validation(self):
        """測試故事背景字數超長（>500字）被拒絕"""
        from app.schemas.story import Story

        # 故事超長（約 600 字）
        invalid_data = {
            "background": "很長的故事。" * 100,
            "character": "測試角色",
            "timeline": "2277 年",
            "factions_involved": ["vault_dweller"]
        }

        with pytest.raises(ValidationError) as exc_info:
            Story(**invalid_data)

        # 驗證錯誤訊息包含字數要求
        errors = exc_info.value.errors()
        assert any("500" in str(error) or "字" in str(error) for error in errors)

    @pytest.mark.parametrize("timeline,should_pass", [
        ("戰前", True),
        ("戰後", True),
        ("2077 年", True),
        ("2277 年", True),
        ("2077", False),  # 缺少「年」
        ("2077年", False),  # 缺少空格
        ("200 年", False),  # 年份只有3位
        ("戰前戰後", False),  # 無效格式
    ])
    def test_story_timeline_format_validation(self, timeline: str, should_pass: bool):
        """測試時間格式驗證：「戰前」、「戰後」或「YYYY 年」"""
        from app.schemas.story import Story

        story_data = {
            "background": VALID_STORY_VAULT_101,
            "character": "測試角色",
            "timeline": timeline,
            "factions_involved": ["vault_dweller"]
        }

        if should_pass:
            story = Story(**story_data)
            assert story.timeline == timeline
            assert story.background == VALID_STORY_VAULT_101
        else:
            with pytest.raises(ValidationError) as exc_info:
                Story(**story_data)

            errors = exc_info.value.errors()
            assert any("timeline" in str(error).lower() or "時間" in str(error) for error in errors)

    @pytest.mark.parametrize("factions,should_pass", [
        (["vault_dweller"], True),
        (["brotherhood", "ncr"], True),
        (["minutemen", "railroad", "institute"], True),
        (["invalid_faction"], False),
        (["vault_dweller", "invalid"], False),
        ([], False),  # 空列表
    ])
    def test_story_factions_validation(self, factions: list, should_pass: bool):
        """測試陣營列表驗證"""
        from app.schemas.story import Story

        story_data = {
            "background": VALID_STORY_VAULT_101,
            "character": "測試角色",
            "timeline": "2277 年",
            "factions_involved": factions
        }

        if should_pass:
            story = Story(**story_data)
            assert story.factions_involved == factions
        else:
            with pytest.raises(ValidationError) as exc_info:
                Story(**story_data)

            errors = exc_info.value.errors()
            # 驗證錯誤訊息包含陣營相關資訊
            assert any(
                "faction" in str(error).lower() or "陣營" in str(error)
                for error in errors
            )

    def test_story_optional_fields(self):
        """測試可選欄位可以為 None"""
        from app.schemas.story import Story

        # 只提供必填欄位
        minimal_data = {
            "background": VALID_STORY_VAULT_101,
        }

        story = Story(**minimal_data)

        assert story.background == VALID_STORY_VAULT_101
        # 可選欄位應該有預設值或可為 None
        assert story.character is None
        assert story.location is None
        assert story.timeline is None
        assert story.factions_involved is None
        assert story.related_quest is None


class TestStoryUpdateRequest:
    """🔴 Red: 測試 StoryUpdateRequest schema（預期失敗：schema 不存在）"""

    def test_import_story_update_request(self):
        """測試能夠導入 StoryUpdateRequest schema"""
        from app.schemas.story import StoryUpdateRequest

        assert StoryUpdateRequest is not None

    def test_valid_story_update_request(self):
        """測試有效的故事更新請求"""
        from app.schemas.story import StoryUpdateRequest

        update_data = {
            "background": VALID_STORY_VAULT_111,
            "character": "新角色",
            "timeline": "2287 年",
            "factions_involved": ["minutemen", "railroad"]
        }

        request = StoryUpdateRequest(**update_data)

        assert request.background == VALID_STORY_VAULT_111
        assert request.character == "新角色"
        assert "minutemen" in request.factions_involved

    def test_story_update_partial_fields(self):
        """測試部分欄位更新（選填欄位）"""
        from app.schemas.story import StoryUpdateRequest

        # 只更新部分欄位
        partial_update = {
            "background": VALID_STORY_VAULT_111,
            "timeline": "2287 年"
        }

        request = StoryUpdateRequest(**partial_update)

        assert request.background == VALID_STORY_VAULT_111
        assert request.timeline == "2287 年"


class TestWastelandCardWithStory:
    """🔴 Red: 測試 WastelandCardWithStory schema（預期失敗：schema 不存在）"""

    def test_import_wasteland_card_with_story(self):
        """測試能夠導入 WastelandCardWithStory schema"""
        from app.schemas.cards import WastelandCardWithStory

        assert WastelandCardWithStory is not None

    def test_wasteland_card_with_story_structure(self):
        """測試帶故事的卡牌資料結構"""
        from app.schemas.cards import WastelandCardWithStory

        card_data = {
            "id": "test-card-001",
            "name": "新手避難所居民",
            "suit": "major_arcana",
            "number": 0,
            "upright_meaning": "新的開始",
            "reversed_meaning": "猶豫不決",
            "is_major_arcana": True,
            "is_court_card": False,
            # 故事內容
            "story": {
                "background": VALID_STORY_VAULT_101,
                "character": "避難所居民 101",
                "location": "Vault 101",
                "timeline": "2277 年",
                "factions_involved": ["vault_dweller", "brotherhood"],
                "related_quest": "Escape!"
            }
        }

        card = WastelandCardWithStory(**card_data)

        assert card.id == "test-card-001"
        assert card.name == "新手避難所居民"
        assert card.story is not None
        assert card.story.background == VALID_STORY_VAULT_101
        assert card.story.character == "避難所居民 101"

    def test_wasteland_card_without_story(self):
        """測試卡牌可以不包含故事內容"""
        from app.schemas.cards import WastelandCardWithStory

        card_data = {
            "id": "test-card-002",
            "name": "測試卡牌",
            "suit": "major_arcana",
            "upright_meaning": "測試",
            "reversed_meaning": "測試",
            "is_major_arcana": True,
            "is_court_card": False,
            # 不包含 story 欄位
        }

        card = WastelandCardWithStory(**card_data)

        assert card.id == "test-card-002"
        assert card.story is None  # story 應該是可選的

    def test_wasteland_card_with_audio_urls(self):
        """測試卡牌包含音檔 URL（用於 TTS 功能）"""
        from app.schemas.cards import WastelandCardWithStory

        card_data = {
            "id": "test-card-003",
            "name": "測試卡牌",
            "suit": "major_arcana",
            "upright_meaning": "測試",
            "reversed_meaning": "測試",
            "is_major_arcana": True,
            "is_court_card": False,
            # 音檔 URL（用於不同角色語音）
            "audio_urls": {
                "pip_boy": "/audio/story/card-003/pip_boy.mp3",
                "vault_dweller": "/audio/story/card-003/vault_dweller.mp3",
                "wasteland_trader": "/audio/story/card-003/wasteland_trader.mp3"
            }
        }

        card = WastelandCardWithStory(**card_data)

        assert card.audio_urls is not None
        assert "pip_boy" in card.audio_urls
        assert card.audio_urls["pip_boy"].endswith(".mp3")


class TestStorySchemaIntegration:
    """🔴 Red: 整合測試 - Story schema 與 WastelandCard 的整合"""

    def test_complete_card_with_story_serialization(self):
        """測試完整的卡牌（含故事）序列化為 JSON"""
        from app.schemas.cards import WastelandCardWithStory

        card_data = {
            "id": "wanderer-001",
            "name": "The Wanderer",
            "suit": "major_arcana",
            "number": 0,
            "upright_meaning": "New beginnings",
            "reversed_meaning": "Fear of change",
            "is_major_arcana": True,
            "is_court_card": False,
            "story": {
                "background": VALID_STORY_VAULT_101,
                "character": "Lone Wanderer",
                "location": "Capital Wasteland",
                "timeline": "2277 年",
                "factions_involved": ["vault_dweller", "brotherhood"],
                "related_quest": "Following in His Footsteps"
            },
            "audio_urls": {
                "pip_boy": "/audio/wanderer-001/pip_boy.mp3"
            }
        }

        card = WastelandCardWithStory(**card_data)

        # 序列化為 JSON
        card_json = card.model_dump()

        assert card_json["id"] == "wanderer-001"
        assert card_json["story"]["background"] == VALID_STORY_VAULT_101
        assert card_json["story"]["timeline"] == "2277 年"
        assert card_json["audio_urls"]["pip_boy"] == "/audio/wanderer-001/pip_boy.mp3"

    def test_story_schema_validation_integration(self):
        """測試 Story schema 的驗證邏輯與 WastelandCard 整合"""
        from app.schemas.cards import WastelandCardWithStory
        from pydantic import ValidationError

        # 故事背景太短（<200字）
        card_data = {
            "id": "test-card",
            "name": "Test",
            "suit": "major_arcana",
            "upright_meaning": "Test",
            "reversed_meaning": "Test",
            "is_major_arcana": True,
            "is_court_card": False,
            "story": {
                "background": "太短。",  # 遠少於 200 字
                "character": "Test",
                "timeline": "2277 年",
                "factions_involved": ["vault_dweller"]
            }
        }

        # 應該拋出驗證錯誤
        with pytest.raises(ValidationError) as exc_info:
            WastelandCardWithStory(**card_data)

        errors = exc_info.value.errors()
        # 驗證錯誤應該指向 story.background
        assert any("story" in str(error) and "background" in str(error) for error in errors)
