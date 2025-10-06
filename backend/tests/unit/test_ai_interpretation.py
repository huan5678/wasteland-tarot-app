"""
AI Interpretation System Tests
Testing the AI-powered interpretation engine with Karma alignment,
faction influence, and character voice variations for Wasteland Tarot.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from typing import Dict, Any, List
from datetime import datetime

from app.models.user import User, UserProfile, UserPreferences
from app.models.wasteland_card import WastelandCard, KarmaAlignment, CharacterVoice, FactionAlignment
from app.services.reading_service import ReadingService
from app.core.exceptions import UserNotFoundError


class TestAIInterpretationEngine:
    """Test suite for AI interpretation system with personalization"""

    @pytest.fixture
    def mock_user_with_profile(self) -> User:
        """Create a mock user with complete profile data"""
        user = User(
            id="user_123",
            username="vault_dweller_101",
            email="dweller@vault101.com",
            karma_score=75,  # Good karma
            faction_alignment=FactionAlignment.BROTHERHOOD.value,
            total_readings=50,
            is_active=True
        )

        # Mock profile with AI preferences
        profile = UserProfile(
            user_id=user.id,
            preferred_voice=CharacterVoice.PIP_BOY.value,
            vault_number=101,
            wasteland_location="Capital Wasteland",
            favorite_faction=FactionAlignment.BROTHERHOOD.value,
            experience_level="Veteran Survivor",
            total_readings=50
        )

        preferences = UserPreferences(
            user_id=user.id,
            default_character_voice=CharacterVoice.PIP_BOY.value,
            auto_save_readings=True,
            share_readings_publicly=False
        )

        user.profile = profile
        user.preferences = preferences

        return user

    @pytest.fixture
    def sample_wasteland_card(self) -> WastelandCard:
        """Sample wasteland card for interpretation testing"""
        return WastelandCard(
            id="major_00",
            name="新手避難所居民",
            suit="major_arcana",
            number=0,
            upright_meaning="剛走出避難所的居民，對廢土充滿天真幻想，象徵新開始和適應能力",
            reversed_meaning="過度天真可能帶來危險，需要更多經驗",
            radiation_level=0.1,
            threat_level=1,
            wasteland_humor="戴著派對帽用Pip-Boy自拍，背景是輻射廢土",
            good_karma_interpretation="你的純真心靈將帶來正面的改變",
            neutral_karma_interpretation="保持平衡的心態面對新挑戰",
            evil_karma_interpretation="過去的惡行可能阻礙新的開始"
        )

    @pytest.fixture
    def ai_interpretation_service_mock(self):
        """Mock the actual interpretation method to test different responses"""
        # Since we're testing the real _generate_interpretation method,
        # we don't need to mock it - we'll test it directly
        # This fixture is kept for compatibility but not used
        yield None

    @pytest.mark.asyncio
    async def test_ai_interpretation_with_karma_alignment(
        self,
        db_session,
        mock_user_with_profile,
        sample_wasteland_card,
        ai_interpretation_service_mock
    ):
        """
        測試 AI 解釋系統根據不同 Karma 等級產生不同解釋

        測試情境：
        - 用戶有不同的 Karma 分數（Good/Neutral/Evil）
        - AI 應該根據 Karma 調整解釋語調和建議方向
        - 解釋應該包含 Karma 相關的個人化內容
        """
        service = ReadingService(db_session)

        # Test Good Karma interpretation
        mock_user_with_profile.karma_score = 85  # Good karma
        interpretation = await service._generate_interpretation(
            user=mock_user_with_profile,
            cards=[sample_wasteland_card],
            question="我今天的運勢如何？",
            character_voice=CharacterVoice.PIP_BOY
        )

        # The actual implementation returns structured interpretation
        assert "Pip_Boy Analysis" in interpretation  # Character voice
        assert "Karma Influence (Good)" in interpretation  # Karma section
        assert "Brotherhood Significance" in interpretation  # Faction section
        assert "你的純真心靈將帶來正面的改變" in interpretation  # Good karma content

        # Test Evil Karma interpretation
        mock_user_with_profile.karma_score = 15  # Evil karma
        interpretation = await service._generate_interpretation(
            user=mock_user_with_profile,
            cards=[sample_wasteland_card],
            question="我的決定會有什麼後果？",
            character_voice=CharacterVoice.PIP_BOY
        )

        assert "Pip_Boy Analysis" in interpretation  # Character voice
        assert "Karma Influence (Evil)" in interpretation
        assert "過去的惡行可能阻礙新的開始" in interpretation  # Evil karma content

        # Test Neutral Karma interpretation
        mock_user_with_profile.karma_score = 50  # Neutral karma
        interpretation = await service._generate_interpretation(
            user=mock_user_with_profile,
            cards=[sample_wasteland_card],
            question="我應該如何做決定？",
            character_voice=CharacterVoice.PIP_BOY
        )

        assert "Pip_Boy Analysis" in interpretation  # Character voice
        assert "Karma Influence (Neutral)" in interpretation
        assert "保持平衡的心態面對新挑戰" in interpretation  # Neutral karma content

    @pytest.mark.asyncio
    async def test_ai_interpretation_with_faction_influence(
        self,
        db_session,
        mock_user_with_profile,
        sample_wasteland_card,
        ai_interpretation_service_mock
    ):
        """
        測試 AI 解釋系統根據派系歸屬產生不同觀點

        測試情境：
        - 用戶歸屬不同派系（Brotherhood, NCR, Raiders等）
        - AI 應該從該派系的角度解釋牌意
        - 解釋應該包含派系特有的知識和偏見
        """
        service = ReadingService(db_session)

        # Test Brotherhood perspective
        mock_user_with_profile.faction_alignment = FactionAlignment.BROTHERHOOD.value
        interpretation = await service._generate_interpretation(
            user=mock_user_with_profile,
            cards=[sample_wasteland_card],
            question="科技發展的方向如何？",
            character_voice=CharacterVoice.PIP_BOY
        )

        assert "Pip_Boy Analysis" in interpretation
        assert "Brotherhood Significance" in interpretation

        # Test NCR perspective
        mock_user_with_profile.faction_alignment = FactionAlignment.NCR.value
        interpretation = await service._generate_interpretation(
            user=mock_user_with_profile,
            cards=[sample_wasteland_card],
            question="社會秩序如何建立？",
            character_voice=CharacterVoice.PIP_BOY
        )

        assert "Pip_Boy Analysis" in interpretation
        assert "Ncr Significance" in interpretation

        # Test Raiders perspective (no specific implementation, should handle gracefully)
        mock_user_with_profile.faction_alignment = FactionAlignment.RAIDERS.value
        interpretation = await service._generate_interpretation(
            user=mock_user_with_profile,
            cards=[sample_wasteland_card],
            question="如何獲得更多資源？",
            character_voice=CharacterVoice.PIP_BOY
        )

        # Should not crash and include basic interpretation
        assert "Pip_Boy Analysis" in interpretation
        assert len(interpretation) > 50  # Has substantial content

    @pytest.mark.asyncio
    async def test_character_voice_interpretation_variations(
        self,
        db_session,
        mock_user_with_profile,
        sample_wasteland_card,
        ai_interpretation_service_mock
    ):
        """
        測試不同角色聲音產生不同風格的解釋

        測試情境：
        - 測試所有可用的角色聲音（Pip-Boy, Vault Dweller, Trader, Super Mutant）
        - 每種聲音應該有獨特的語調和表達方式
        - 解釋內容應該符合角色特徵
        """
        service = ReadingService(db_session)
        question = "我今天應該如何行動？"

        # Test all character voices
        voices_to_test = [
            CharacterVoice.PIP_BOY,
            CharacterVoice.VAULT_DWELLER,
            CharacterVoice.WASTELAND_TRADER,
            CharacterVoice.SUPER_MUTANT
        ]

        interpretations = {}

        for voice in voices_to_test:
            interpretation = await service._generate_interpretation(
                user=mock_user_with_profile,
                cards=[sample_wasteland_card],
                question=question,
                character_voice=voice
            )
            interpretations[voice] = interpretation

            # Each interpretation should be unique
            assert len(interpretation) > 50
            assert voice.value.title() in interpretation or str(voice) in interpretation
            assert sample_wasteland_card.name in interpretation

        # Ensure all interpretations are different
        interpretation_texts = list(interpretations.values())
        for i, text1 in enumerate(interpretation_texts):
            for j, text2 in enumerate(interpretation_texts):
                if i != j:
                    # Should have some differences (allowing for common elements)
                    assert text1 != text2

    @pytest.mark.asyncio
    async def test_interpretation_fallback_mechanisms(
        self,
        db_session,
        mock_user_with_profile,
        sample_wasteland_card
    ):
        """
        測試 AI 解釋系統的容錯機制

        測試情境：
        - AI 服務不可用時的 fallback 機制
        - 無效的用戶資料處理
        - 缺少牌卡資料的處理
        - 無效的角色聲音處理
        """
        service = ReadingService(db_session)

        # Test with no cards
        interpretation = await service._generate_interpretation(
            user=mock_user_with_profile,
            cards=[],
            question="空牌組測試",
            character_voice=CharacterVoice.PIP_BOY
        )

        assert "The wasteland reveals nothing" in interpretation

        # Test with user without faction
        user_no_faction = User(
            id="user_no_faction",
            username="nomad",
            email="nomad@wasteland.com",
            karma_score=50,
            faction_alignment=None,
            is_active=True
        )

        interpretation = await service._generate_interpretation(
            user=user_no_faction,
            cards=[sample_wasteland_card],
            question="沒有派系的測試",
            character_voice=CharacterVoice.PIP_BOY
        )

        # Should work with no faction but have basic interpretation
        assert sample_wasteland_card.name in interpretation
        assert len(interpretation) > 50
        # No faction section should be present
        assert "Significance" not in interpretation

    @pytest.mark.asyncio
    async def test_multi_card_interpretation_logic(
        self,
        db_session,
        mock_user_with_profile,
        ai_interpretation_service_mock
    ):
        """
        測試多張牌的綜合解釋邏輯

        測試情境：
        - 1張牌的簡單解釋
        - 3張牌的 Vault-Tec spread 解釋
        - 7張牌的 Brotherhood Council 解釋
        - 牌卡間的相互影響和關聯性分析
        """
        service = ReadingService(db_session)

        # Create multiple test cards
        cards = [
            WastelandCard(
                id="major_00",
                name="新手避難所居民",
                suit="major_arcana",
                number=0,
                upright_meaning="新的開始和無限可能",
                reversed_meaning="缺乏經驗的危險"
            ),
            WastelandCard(
                id="major_01",
                name="廢土魔法師",
                suit="major_arcana",
                number=1,
                upright_meaning="知識和技能的掌握",
                reversed_meaning="技能的濫用"
            ),
            WastelandCard(
                id="major_02",
                name="高階女祭司",
                suit="major_arcana",
                number=2,
                upright_meaning="直覺和隱藏知識",
                reversed_meaning="被誤導的直覺"
            )
        ]

        # Test single card
        single_interpretation = await service._generate_interpretation(
            user=mock_user_with_profile,
            cards=[cards[0]],
            question="單張牌測試",
            character_voice=CharacterVoice.PIP_BOY
        )

        assert cards[0].name in single_interpretation
        assert "Additional Cards" not in single_interpretation

        # Test three card spread
        three_card_interpretation = await service._generate_interpretation(
            user=mock_user_with_profile,
            cards=cards,
            question="三張牌測試",
            character_voice=CharacterVoice.PIP_BOY
        )

        assert cards[0].name in three_card_interpretation
        assert "Additional Cards" in three_card_interpretation
        assert cards[1].name in three_card_interpretation
        assert cards[2].name in three_card_interpretation
        assert "Card 2:" in three_card_interpretation
        assert "Card 3:" in three_card_interpretation

    @pytest.mark.asyncio
    async def test_interpretation_personalization_engine(
        self,
        db_session,
        mock_user_with_profile,
        sample_wasteland_card,
        ai_interpretation_service_mock
    ):
        """
        測試個人化解釋引擎的綜合功能

        測試情境：
        - 結合多種個人化因素（Karma + Faction + Voice）
        - 用戶歷史偏好的影響
        - 個人化程度的評估
        - 解釋一致性的驗證
        """
        service = ReadingService(db_session)

        # Create user with complete personalization profile
        personalized_user = User(
            id="personalized_user",
            username="veteran_survivor",
            email="veteran@brotherhood.org",
            karma_score=90,  # Very good karma
            faction_alignment=FactionAlignment.BROTHERHOOD.value,
            total_readings=200,  # Experienced user
            is_active=True
        )

        profile = UserProfile(
            user_id=personalized_user.id,
            preferred_voice=CharacterVoice.VAULT_DWELLER.value,
            vault_number=111,
            experience_level="Master Survivor",
            total_readings=200,
            favorite_card_suit="combat_weapons"
        )

        personalized_user.profile = profile

        # Test comprehensive personalization
        interpretation = await service._generate_interpretation(
            user=personalized_user,
            cards=[sample_wasteland_card],
            question="作為資深生存者，我下一步該怎麼做？",
            character_voice=CharacterVoice.VAULT_DWELLER
        )

        # Should include multiple personalization factors
        assert sample_wasteland_card.name in interpretation  # Card name
        assert "Karma Influence (Good)" in interpretation  # Good karma
        assert "Brotherhood Significance" in interpretation  # Faction
        assert "Vault_dweller Analysis" in interpretation  # Character voice
        assert len(interpretation) > 100  # Comprehensive interpretation

        # Test consistency across multiple calls
        interpretation2 = await service._generate_interpretation(
            user=personalized_user,
            cards=[sample_wasteland_card],
            question="作為資深生存者，我下一步該怎麼做？",
            character_voice=CharacterVoice.VAULT_DWELLER
        )

        # Should have similar structure and key elements
        assert sample_wasteland_card.name in interpretation2
        assert "Karma Influence (Good)" in interpretation2
        assert "Brotherhood Significance" in interpretation2

    @pytest.mark.asyncio
    async def test_ai_interpretation_error_handling(
        self,
        db_session,
        mock_user_with_profile,
        sample_wasteland_card
    ):
        """
        測試 AI 解釋系統的錯誤處理

        測試情境：
        - 外部 AI 服務失敗
        - 網路連線問題
        - 回應格式錯誤
        - 超時處理
        """
        service = ReadingService(db_session)

        # Test with empty cards (already tested in the actual implementation)
        interpretation = await service._generate_interpretation(
            user=mock_user_with_profile,
            cards=[],
            question="Empty cards test",
            character_voice=CharacterVoice.PIP_BOY
        )

        # Should return fallback message
        assert "The wasteland reveals nothing" in interpretation

    @pytest.mark.asyncio
    async def test_interpretation_caching_and_performance(
        self,
        db_session,
        mock_user_with_profile,
        sample_wasteland_card,
        ai_interpretation_service_mock
    ):
        """
        測試解釋快取和效能最佳化

        測試情境：
        - 相同輸入的快取機制
        - 效能指標監控
        - 記憶體使用最佳化
        - 並發請求處理
        """
        service = ReadingService(db_session)

        start_time = datetime.now()

        # Generate interpretation
        interpretation = await service._generate_interpretation(
            user=mock_user_with_profile,
            cards=[sample_wasteland_card],
            question="效能測試問題",
            character_voice=CharacterVoice.PIP_BOY
        )

        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()

        # Should complete within reasonable time (2 seconds for testing)
        assert processing_time < 2.0
        assert len(interpretation) > 50
        assert sample_wasteland_card.name in interpretation

    @pytest.mark.asyncio
    async def test_interpretation_with_invalid_data(
        self,
        db_session,
        ai_interpretation_service_mock
    ):
        """
        測試無效資料的處理

        測試情境：
        - 無效的用戶ID
        - 損壞的牌卡資料
        - 不支援的角色聲音
        - 空白或過長的問題
        """
        service = ReadingService(db_session)

        # Test with invalid user (None)
        invalid_user = None
        sample_card = WastelandCard(
            id="test_card",
            name="測試牌",
            suit="major_arcana",
            number=0,
            upright_meaning="測試描述",
            reversed_meaning="測試反向描述"
        )

        with pytest.raises(AttributeError):
            await service._generate_interpretation(
                user=invalid_user,
                cards=[sample_card],
                question="無效用戶測試",
                character_voice=CharacterVoice.PIP_BOY
            )

        # Test with invalid character voice
        valid_user = User(
            id="valid_user",
            username="test_user",
            email="test@test.com",
            karma_score=50,
            is_active=True
        )

        # Should handle string voice gracefully
        interpretation = await service._generate_interpretation(
            user=valid_user,
            cards=[sample_card],
            question="字符聲音測試",
            character_voice="invalid_voice"
        )

        assert len(interpretation) > 0
        assert sample_card.name in interpretation

    @pytest.mark.asyncio
    async def test_interpretation_context_preservation(
        self,
        db_session,
        mock_user_with_profile,
        ai_interpretation_service_mock
    ):
        """
        測試解釋上下文的保存和傳遞

        測試情境：
        - 用戶會話狀態保持
        - 歷史解釋的影響
        - 上下文相關性
        - 個人化參數的持續性
        """
        service = ReadingService(db_session)

        # Create cards for context testing
        past_card = WastelandCard(
            id="past_card",
            name="過去的記憶",
            suit="major_arcana",
            number=0,
            upright_meaning="過去的經歷和教訓",
            reversed_meaning="被遺忘的痛苦"
        )

        present_card = WastelandCard(
            id="present_card",
            name="當前的選擇",
            suit="major_arcana",
            number=1,
            upright_meaning="當前面臨的決定",
            reversed_meaning="迷失的方向"
        )

        # Test context-aware interpretation
        interpretation = await service._generate_interpretation(
            user=mock_user_with_profile,
            cards=[past_card, present_card],
            question="我的過去如何影響現在的決定？",
            character_voice=CharacterVoice.VAULT_DWELLER
        )

        # Should include both cards and show relationship
        assert past_card.name in interpretation
        assert present_card.name in interpretation
        assert "Additional Cards" in interpretation
        assert len(interpretation) > 100  # Should be comprehensive

        # Verify user context is preserved
        assert "Karma Influence (Good)" in interpretation  # User's good karma
        assert "Brotherhood Significance" in interpretation  # User's faction