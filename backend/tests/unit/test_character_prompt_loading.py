"""
Unit Tests: Character Prompt Loading
測試 AIInterpretationService 能否正確載入角色 Prompt

TDD 策略：
- Phase 1 (紅燈): 測試應該失敗，因為資料庫中的 Prompt 長度不足
- Phase 2 (綠燈): 執行 SQL 更新後，測試應該通過
- Phase 3 (重構): 根據需要優化程式碼
"""

import pytest
from app.services.ai_interpretation_service import AIInterpretationService
from app.models.wasteland_card import CharacterVoice
from app.config import Settings


@pytest.mark.asyncio
class TestCharacterPromptLoading:
    """測試角色 Prompt 載入功能"""

    async def test_get_character_prompt_returns_valid_config(
        self, ai_service, db_session
    ):
        """驗證 Character Prompt 載入返回有效配置"""
        # Arrange
        character = CharacterVoice.PIP_BOY

        # Act
        prompt = await ai_service._get_character_prompt(character)

        # Assert
        assert prompt is not None, "Prompt 不應為 None"
        assert "system" in prompt, "Prompt 應包含 'system' 鍵"
        assert "tone" in prompt, "Prompt 應包含 'tone' 鍵"
        assert "config" in prompt, "Prompt 應包含 'config' 鍵"

    async def test_pip_boy_prompt_has_minimum_length(
        self, ai_service, db_session
    ):
        """
        驗證 Pip-Boy Prompt 長度符合規範

        依據 requirements.md NFR-1：
        - Pip-Boy：250-300 字（中文字，非字元）
        - 包含 Markdown 格式，總字元數約 1200-1800
        """
        # Arrange
        character = CharacterVoice.PIP_BOY

        # Act
        prompt = await ai_service._get_character_prompt(character)

        # Assert
        assert prompt is not None, "Pip-Boy Prompt 不應為 None"
        system_prompt = prompt["system"]

        # 驗證總字元數（包含 Markdown、空白）
        assert len(system_prompt) >= 1200, \
            f"Pip-Boy Prompt 應至少 1200 字元，實際長度: {len(system_prompt)}"
        assert len(system_prompt) <= 2000, \
            f"Pip-Boy Prompt 不應超過 2000 字元，實際長度: {len(system_prompt)}"

        # 驗證包含核心關鍵結構
        assert "# 角色" in system_prompt, "應包含角色定義"
        assert "## 核心" in system_prompt, "應包含核心原則"

    async def test_all_six_characters_have_prompts(
        self, ai_service, db_session
    ):
        """
        驗證所有 6 個角色都有 Prompt

        ⚠️ 預期部分失敗：
        - ghoul 角色目前沒有 Prompt（長度為 0）
        """
        # Arrange
        characters = [
            CharacterVoice.PIP_BOY,
            CharacterVoice.VAULT_DWELLER,
            CharacterVoice.WASTELAND_TRADER,
            CharacterVoice.CODSWORTH,
            CharacterVoice.SUPER_MUTANT,
            CharacterVoice.GHOUL
        ]

        # Act & Assert
        for character in characters:
            prompt = await ai_service._get_character_prompt(character)
            assert prompt is not None, f"{character.value} 應有 Prompt"
            assert len(prompt["system"]) > 0, \
                f"{character.value} Prompt 不應為空"

    async def test_prompt_contains_jungian_psychology_keywords(
        self, ai_service, db_session
    ):
        """
        驗證 Prompt 包含榮格心理學關鍵詞

        ⚠️ 預期失敗（TDD 紅燈階段）：
        - 當前 Prompt 是簡短描述，不包含心理學術語
        - 新 Prompt 應包含：原型、陰影、自性、集體無意識等概念
        """
        # Arrange
        character = CharacterVoice.PIP_BOY
        jungian_keywords = ["原型", "陰影", "個性化", "集體無意識", "自性"]

        # Act
        prompt = await ai_service._get_character_prompt(character)

        # Assert
        assert prompt is not None
        system_prompt = prompt["system"]
        found_keywords = [kw for kw in jungian_keywords if kw in system_prompt]
        assert len(found_keywords) >= 2, \
            f"Prompt 應包含至少 2 個榮格心理學關鍵詞，實際找到：{found_keywords}"

    async def test_prompt_contains_fallout_worldview(
        self, ai_service, db_session
    ):
        """
        驗證 Prompt 包含 Fallout 世界觀元素

        ⚠️ 預期可能失敗：
        - 新 Prompt 應深度整合 Fallout 設定
        - 包含：廢土、核戰後、輻射、避難所等概念
        """
        # Arrange
        character = CharacterVoice.PIP_BOY
        fallout_keywords = ["廢土", "核", "輻射", "避難所", "戰後"]

        # Act
        prompt = await ai_service._get_character_prompt(character)

        # Assert
        assert prompt is not None
        system_prompt = prompt["system"]
        found_keywords = [kw for kw in fallout_keywords if kw in system_prompt]
        assert len(found_keywords) >= 2, \
            f"Prompt 應包含至少 2 個 Fallout 關鍵詞，實際找到：{found_keywords}"

    async def test_tone_description_is_set(
        self, ai_service, db_session
    ):
        """驗證所有角色都有 tone_description 設定"""
        # Arrange
        characters = [
            CharacterVoice.PIP_BOY,
            CharacterVoice.VAULT_DWELLER,
            CharacterVoice.WASTELAND_TRADER,
            CharacterVoice.CODSWORTH,
            CharacterVoice.SUPER_MUTANT,
            CharacterVoice.GHOUL
        ]

        # Act & Assert
        for character in characters:
            prompt = await ai_service._get_character_prompt(character)
            assert prompt is not None, f"{character.value} 應有 Prompt"
            assert prompt["tone"] != "neutral", \
                f"{character.value} 應有自訂的 tone，不應為預設的 'neutral'"
            assert len(prompt["tone"]) > 0, \
                f"{character.value} tone 不應為空"
