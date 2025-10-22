"""
TDD 測試 - 故事驗證服務

這些測試遵循 Red-Green-Refactor 循環：
1. 🔴 Red: 先寫失敗的測試（當前階段）
2. 🟢 Green: 寫最小實作讓測試通過
3. 🔵 Refactor: 優化代碼（保持測試綠燈）
"""

import pytest
from typing import Dict, Any


class TestStoryValidationService:
    """🔴 Red: 測試故事驗證服務（預期失敗：服務尚不存在）"""

    def test_import_validation_service(self):
        """測試能夠導入驗證服務（預期失敗）"""
        # 預期失敗：服務尚不存在
        from app.services.story_validation_service import StoryValidationService

        assert StoryValidationService is not None

    def test_validate_story_content_valid(self):
        """測試有效故事內容通過所有驗證（預期失敗）"""
        from app.services.story_validation_service import StoryValidationService

        service = StoryValidationService()

        # 建立恰好 200 字的故事背景
        story_text = (
            "在2277年的首都廢土，一個剛離開101號避難所的年輕居民踏上了尋找父親的旅程。"
            "這個世界已經被核戰爭摧毀了200年，到處都是變種生物和掠奪者。"
            "他手持Pip-Boy 3000，這個設備將成為他在廢土生存的關鍵工具。"
            "Brotherhood of Steel的士兵告訴他，他的父親可能在尋找一個叫做「淨水計畫」的東西。"
            "這個計畫的目標是要淨化整個首都廢土的水源，讓所有人都能喝到乾淨的水。"
            "然而，要完成這個計畫需要一個叫做G.E.C.K.的裝置。"
            "這個裝置據說藏在某個避難所中，但沒有人知道確切的位置。"
        )
        # 確保至少 200 字
        assert len(story_text) >= 200, f"Story text is only {len(story_text)} characters"

        valid_story = {
            "story_background": story_text,
            "story_character": "避難所居民 101",
            "story_location": "Vault 101 出口",
            "story_timeline": "2277 年",
            "story_faction_involved": ["vault_dweller", "brotherhood"],
            "story_related_quest": "Following in His Footsteps"
        }

        result = service.validate_story_content(valid_story)

        assert result.valid is True
        assert len(result.errors) == 0

    def test_validate_story_content_invalid_text_length_short(self):
        """測試字數不足（<200字）被拒絕"""
        from app.services.story_validation_service import StoryValidationService

        service = StoryValidationService()

        short_story = {
            "story_background": "太短的故事。",  # 遠少於200字
            "story_character": "測試角色",
            "story_location": "測試地點",
            "story_timeline": "戰前",
            "story_faction_involved": ["vault_dweller"],
            "story_related_quest": "Test Quest"
        }

        result = service.validate_story_content(short_story)

        assert result.valid is False
        assert any("200" in error and "字" in error for error in result.errors)

    def test_validate_story_content_invalid_text_length_long(self):
        """測試字數超長（>500字）被拒絕"""
        from app.services.story_validation_service import StoryValidationService

        service = StoryValidationService()

        long_story = {
            "story_background": "很長的故事。" * 100,  # 遠超過500字
            "story_character": "測試角色",
            "story_location": "測試地點",
            "story_timeline": "戰後",
            "story_faction_involved": ["ncr"],
            "story_related_quest": "Test Quest"
        }

        result = service.validate_story_content(long_story)

        assert result.valid is False
        assert any("500" in error and "字" in error for error in result.errors)

    def test_validate_story_content_invalid_faction(self):
        """測試無效陣營名稱被拒絕"""
        from app.services.story_validation_service import StoryValidationService

        service = StoryValidationService()

        # 建立足夠長的故事背景
        valid_length_text = "在廢土中生存需要智慧和勇氣。" * 50  # 約200字

        invalid_faction_story = {
            "story_background": valid_length_text,
            "story_character": "測試角色",
            "story_location": "測試地點",
            "story_timeline": "2277 年",
            "story_faction_involved": ["invalid_faction", "another_invalid"],
            "story_related_quest": "Test Quest"
        }

        result = service.validate_story_content(invalid_faction_story)

        assert result.valid is False
        assert any("faction" in error.lower() or "陣營" in error for error in result.errors)

    def test_validate_story_content_invalid_timeline(self):
        """測試無效時間格式被拒絕"""
        from app.services.story_validation_service import StoryValidationService

        service = StoryValidationService()

        valid_length_text = "在廢土中生存需要智慧和勇氣。" * 50

        invalid_timeline_story = {
            "story_background": valid_length_text,
            "story_character": "測試角色",
            "story_location": "測試地點",
            "story_timeline": "2077",  # 缺少「年」字
            "story_faction_involved": ["vault_dweller"],
            "story_related_quest": "Test Quest"
        }

        result = service.validate_story_content(invalid_timeline_story)

        assert result.valid is False
        assert any("timeline" in error.lower() or "時間" in error for error in result.errors)

    @pytest.mark.parametrize("timeline,should_pass", [
        ("戰前", True),
        ("戰後", True),
        ("2077 年", True),
        ("2277 年", True),
        ("2077", False),  # 缺少「年」
        ("2077年", False),  # 缺少空格
        ("200 年", False),  # 年份只有3位
    ])
    def test_validate_timeline_format(self, timeline: str, should_pass: bool):
        """測試時間格式驗證"""
        from app.services.story_validation_service import StoryValidationService

        service = StoryValidationService()
        result = service.validate_timeline_format(timeline)

        assert result == should_pass

    @pytest.mark.parametrize("vault_num,should_pass", [
        (1, True),
        (13, True),
        (101, True),
        (122, True),
        (0, False),  # Vault 0 不存在
        (123, False),  # 超過最大值
        (-1, False),  # 負數
        (None, True),  # None 是允許的（可選欄位）
    ])
    def test_validate_vault_number(self, vault_num, should_pass: bool):
        """測試 Vault 編號驗證（1-122）"""
        from app.services.story_validation_service import StoryValidationService

        service = StoryValidationService()
        result = service.validate_vault_number(vault_num)

        assert result == should_pass

    def test_validate_text_length_chinese(self):
        """測試繁體中文字數驗證（200-500字）"""
        from app.services.story_validation_service import StoryValidationService

        service = StoryValidationService()

        # 測試恰好200字
        text_200 = "廢" * 200
        assert service.validate_text_length(text_200) is True

        # 測試恰好500字
        text_500 = "土" * 500
        assert service.validate_text_length(text_500) is True

        # 測試199字（不足）
        text_199 = "故" * 199
        assert service.validate_text_length(text_199) is False

        # 測試501字（超長）
        text_501 = "事" * 501
        assert service.validate_text_length(text_501) is False

    def test_validate_faction_list(self):
        """測試陣營列表驗證"""
        from app.services.story_validation_service import StoryValidationService

        service = StoryValidationService()

        # 測試有效陣營
        assert service.validate_faction_list(["vault_dweller"]) is True
        assert service.validate_faction_list(["brotherhood", "ncr"]) is True
        assert service.validate_faction_list(["minutemen", "railroad", "institute"]) is True

        # 測試無效陣營
        assert service.validate_faction_list(["invalid_faction"]) is False
        assert service.validate_faction_list(["vault_dweller", "invalid"]) is False
        assert service.validate_faction_list([]) is False  # 空列表

    def test_validation_result_to_dict(self):
        """測試 ValidationResult 可以轉換為字典（用於 API 回應）"""
        from app.services.story_validation_service import ValidationResult

        result = ValidationResult(
            valid=False,
            errors=["字數不足", "陣營無效"],
            warnings=["建議添加更多細節"]
        )

        result_dict = result.to_dict()

        assert isinstance(result_dict, dict)
        assert result_dict["valid"] is False
        assert len(result_dict["errors"]) == 2
        assert len(result_dict["warnings"]) == 1


class TestValidationResultDataclass:
    """🔴 Red: 測試 ValidationResult 資料類別"""

    def test_validation_result_structure(self):
        """測試 ValidationResult 資料結構"""
        from app.services.story_validation_service import ValidationResult

        result = ValidationResult(
            valid=True,
            errors=[],
            warnings=[]
        )

        assert hasattr(result, "valid")
        assert hasattr(result, "errors")
        assert hasattr(result, "warnings")
        assert isinstance(result.errors, list)
        assert isinstance(result.warnings, list)

    def test_validation_result_with_errors(self):
        """測試帶有錯誤的 ValidationResult"""
        from app.services.story_validation_service import ValidationResult

        result = ValidationResult(
            valid=False,
            errors=["錯誤1", "錯誤2"],
            warnings=["警告1"]
        )

        assert result.valid is False
        assert len(result.errors) == 2
        assert "錯誤1" in result.errors
        assert len(result.warnings) == 1
