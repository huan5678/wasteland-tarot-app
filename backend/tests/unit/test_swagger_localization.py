"""
Schema 中文化單元測試

驗證所有 Pydantic Schema 模型是否正確翻譯為繁體中文。
測試內容包括：
1. Class docstring 為繁體中文
2. Field descriptions 為繁體中文
3. Enum 類別包含繁體中文註解
4. model_config 的範例說明為繁體中文
"""

import pytest
from app.schemas import cards, readings, spreads, voices, social, bingo, sessions, webauthn


class TestSchemaDocstrings:
    """測試 Schema 類別的 docstring 中文化"""

    def test_cards_schema_docstrings(self):
        """驗證 Cards Schema 的 docstring 為繁體中文"""
        # 測試主要類別的 docstring
        assert "卡牌" in cards.CardBase.__doc__ or "塔羅" in cards.CardBase.__doc__

    def test_readings_schema_docstrings(self):
        """驗證 Readings Schema 的 docstring 為繁體中文"""
        assert "占卜" in readings.ReadingCreate.__doc__

    def test_spreads_schema_docstrings(self):
        """驗證 Spreads Schema 的 docstring 為繁體中文"""
        assert "牌陣" in spreads.SpreadPosition.__doc__
        assert "牌位" in spreads.SpreadPosition.__doc__

    def test_voices_schema_docstrings(self):
        """驗證 Voices Schema 的 docstring 為繁體中文"""
        assert "角色" in voices.CharacterTemplate.__doc__ or "聲音" in voices.CharacterTemplate.__doc__

    def test_social_schema_docstrings(self):
        """驗證 Social Schema 的 docstring 為繁體中文"""
        assert "社群" in social.SocialStats.__doc__ or "統計" in social.SocialStats.__doc__

    def test_bingo_schema_docstrings(self):
        """驗證 Bingo Schema 的 docstring 為繁體中文"""
        assert "賓果" in bingo.BingoCardCreate.__doc__ or "卡" in bingo.BingoCardCreate.__doc__

    def test_sessions_schema_docstrings(self):
        """驗證 Sessions Schema 的 docstring 為繁體中文"""
        assert "會話" in sessions.SessionCreateSchema.__doc__ or "占卜" in sessions.SessionCreateSchema.__doc__

    def test_webauthn_schema_docstrings(self):
        """驗證 WebAuthn Schema 的 docstring 為繁體中文"""
        assert "使用者" in webauthn.NewUserRegistrationOptionsRequest.__doc__ or "註冊" in webauthn.NewUserRegistrationOptionsRequest.__doc__


class TestFieldDescriptions:
    """測試 Field descriptions 中文化"""

    def test_cards_field_descriptions(self):
        """驗證 Cards Schema 的 Field descriptions 為繁體中文"""
        # 取得 CardBase 的 field descriptions
        fields = cards.CardBase.model_fields

        # 檢查至少一個 field 包含繁體中文描述
        has_chinese = any(
            field.description and any(char >= '\u4e00' and char <= '\u9fff' for char in field.description)
            for field in fields.values()
        )
        assert has_chinese, "CardBase 應該至少有一個欄位包含繁體中文描述"

    def test_bingo_field_descriptions(self):
        """驗證 Bingo Schema 的 Field descriptions 為繁體中文"""
        fields = bingo.BingoCardCreate.model_fields

        # numbers field 應該包含繁體中文描述
        numbers_field = fields.get('numbers')
        assert numbers_field is not None
        assert numbers_field.description and any(
            char >= '\u4e00' and char <= '\u9fff' for char in numbers_field.description
        ), "numbers field 應該有繁體中文描述"

    def test_webauthn_field_descriptions(self):
        """驗證 WebAuthn Schema 的 Field descriptions 為繁體中文"""
        fields = webauthn.CredentialResponse.model_fields

        # 檢查多個 fields 包含繁體中文
        has_chinese = any(
            field.description and any(char >= '\u4e00' and char <= '\u9fff' for char in field.description)
            for field in fields.values()
        )
        assert has_chinese, "CredentialResponse 應該至少有一個欄位包含繁體中文描述"


class TestEnumLocalization:
    """測試 Enum 類別的中文化"""

    def test_spread_type_enum(self):
        """驗證 SpreadType Enum 包含繁體中文註解"""
        # 檢查 docstring
        assert spreads.SpreadType.__doc__ and any(
            char >= '\u4e00' and char <= '\u9fff' for char in spreads.SpreadType.__doc__
        ), "SpreadType Enum 應該有繁體中文 docstring"

    def test_voice_tone_enum(self):
        """驗證 VoiceTone Enum 包含繁體中文註解"""
        assert voices.VoiceTone.__doc__ and any(
            char >= '\u4e00' and char <= '\u9fff' for char in voices.VoiceTone.__doc__
        ), "VoiceTone Enum 應該有繁體中文 docstring"

    def test_social_action_type_enum(self):
        """驗證 SocialActionType Enum 包含繁體中文註解"""
        assert social.SocialActionType.__doc__ and any(
            char >= '\u4e00' and char <= '\u9fff' for char in social.SocialActionType.__doc__
        ), "SocialActionType Enum 應該有繁體中文 docstring"


class TestModelConfigExamples:
    """測試 model_config 的範例說明中文化"""

    def test_bingo_card_create_example(self):
        """驗證 BingoCardCreate 的 example 範例"""
        # 檢查 model_config 存在
        assert hasattr(bingo.BingoCardCreate, 'model_config')
        config = bingo.BingoCardCreate.model_config

        # 檢查有 json_schema_extra
        if 'json_schema_extra' in config:
            example = config['json_schema_extra'].get('example')
            assert example is not None, "BingoCardCreate 應該有範例"

    def test_credential_response_example(self):
        """驗證 CredentialResponse 的 config"""
        # 檢查 model_config 存在
        assert hasattr(webauthn.CredentialResponse, 'model_config')


class TestValidationMessages:
    """測試驗證訊息的中文化"""

    def test_bingo_card_validation_messages(self):
        """驗證 BingoCardCreate 的驗證錯誤訊息為繁體中文"""
        with pytest.raises(ValueError) as exc_info:
            # 嘗試建立無效的賓果卡（少於 5 列）
            bingo.BingoCardCreate(numbers=[[1, 2, 3, 4, 5]])

        error_message = str(exc_info.value)
        # 檢查錯誤訊息包含繁體中文
        has_chinese = any(char >= '\u4e00' and char <= '\u9fff' for char in error_message)
        assert has_chinese, f"驗證錯誤訊息應該包含繁體中文，但得到：{error_message}"

    def test_bingo_card_duplicate_validation(self):
        """驗證 BingoCardCreate 的重複數字驗證訊息為繁體中文"""
        with pytest.raises(ValueError) as exc_info:
            # 嘗試建立有重複數字的賓果卡
            bingo.BingoCardCreate(
                numbers=[
                    [1, 1, 1, 1, 1],
                    [2, 2, 2, 2, 2],
                    [3, 3, 3, 3, 3],
                    [4, 4, 4, 4, 4],
                    [5, 5, 5, 5, 5]
                ]
            )

        error_message = str(exc_info.value)
        has_chinese = any(char >= '\u4e00' and char <= '\u9fff' for char in error_message)
        assert has_chinese, f"重複驗證錯誤訊息應該包含繁體中文，但得到：{error_message}"


class TestKeyTerminology:
    """測試關鍵術語翻譯的一致性"""

    def test_spread_terminology(self):
        """驗證牌陣相關術語一致性"""
        # Spread → 牌陣
        assert "牌陣" in spreads.SpreadPosition.__doc__

    def test_reading_terminology(self):
        """驗證占卜相關術語一致性"""
        # Reading → 占卜
        assert "占卜" in readings.ReadingCreate.__doc__

    def test_voice_terminology(self):
        """驗證聲音相關術語一致性"""
        # Voice → 聲音
        assert "聲音" in voices.CharacterTemplate.__doc__ or "角色" in voices.CharacterTemplate.__doc__

    def test_bingo_terminology(self):
        """驗證賓果相關術語一致性"""
        # Bingo → 賓果
        assert "賓果" in bingo.BingoCardCreate.__doc__

    def test_session_terminology(self):
        """驗證會話相關術語一致性"""
        # Session → 會話
        assert "會話" in sessions.SessionCreateSchema.__doc__


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
