"""
Personalization Engine Integration Tests
Comprehensive testing for the personalized tarot reading experience,
integrating user preferences, AI interpretation, and contextual factors.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from typing import Dict, Any, List
from datetime import datetime, timedelta

from app.models.user import User
from app.models.reading_enhanced import Reading, UserProfile, UserPreferences
from app.models.wasteland_card import WastelandCard, KarmaAlignment, CharacterVoice, FactionAlignment
from app.services.reading_service import ReadingService
from app.services.wasteland_card_service import WastelandCardService


class TestPersonalizationEngine:
    """Integration tests for comprehensive personalization system"""

    @pytest.fixture
    def experienced_user(self) -> User:
        """Create an experienced user with rich personalization data"""
        user = User(
            id="experienced_user",
            username="wasteland_veteran",
            email="veteran@wasteland.com",
            karma_score=75,  # Good karma
            faction_alignment=FactionAlignment.BROTHERHOOD.value,
            daily_readings_count=5,
            total_readings=150,
            accurate_predictions=120,
            favorite_card_suit="combat_weapons",
            is_active=True,
            is_premium=True
        )

        profile = UserProfile(
            user_id=user.id,
            preferred_voice=CharacterVoice.PIP_BOY.value,
            vault_number=101,
            wasteland_location="Capital Wasteland",
            favorite_faction=FactionAlignment.BROTHERHOOD.value,
            experience_level="Master Survivor",
            favorite_card_suit="combat_weapons",
            preferred_reading_style="detailed_analysis",
            total_readings=150,
            consecutive_days=45,
            rare_cards_found=8
        )

        preferences = UserPreferences(
            user_id=user.id,
            default_character_voice=CharacterVoice.PIP_BOY.value,
            auto_save_readings=True,
            share_readings_publicly=False,
            favorite_spread_types=["brotherhood_council", "vault_tec_spread"],
            reading_reminder_time="09:00",
            notification_frequency="daily",
            theme="dark_vault",
            pip_boy_color="green",
            terminal_effects=True,
            sound_effects=True
        )

        user.profile = profile
        user.preferences = preferences

        return user

    @pytest.fixture
    def novice_user(self) -> User:
        """Create a novice user with minimal personalization data"""
        user = User(
            id="novice_user",
            username="vault_newbie",
            email="newbie@vault.com",
            karma_score=50,  # Neutral karma
            faction_alignment=FactionAlignment.VAULT_DWELLER.value,
            daily_readings_count=1,
            total_readings=3,
            accurate_predictions=2,
            is_active=True,
            is_premium=False
        )

        profile = UserProfile(
            user_id=user.id,
            preferred_voice=CharacterVoice.VAULT_DWELLER.value,
            vault_number=111,
            experience_level="Novice Survivor",
            total_readings=3,
            consecutive_days=3
        )

        preferences = UserPreferences(
            user_id=user.id,
            default_character_voice=CharacterVoice.VAULT_DWELLER.value,
            auto_save_readings=True,
            favorite_spread_types=["single_card"],
            theme="light_vault",
            pip_boy_color="amber"
        )

        user.profile = profile
        user.preferences = preferences

        return user

    @pytest.fixture
    def sample_cards(self) -> List[WastelandCard]:
        """Create sample cards with personalization attributes"""
        cards = [
            WastelandCard(
                id="tech_card",
                name="科技專家",
                english_name="The Tech Specialist",
                arcana_type="major",
                number=1,
                description="掌握科技知識的專家",
                keywords=["科技", "知識", "創新"],
                faction_relevance=[FactionAlignment.BROTHERHOOD.value],
                complexity_level="advanced",
                theme_tags=["科技", "學習", "發明"]
            ),
            WastelandCard(
                id="simple_card",
                name="新手避難所居民",
                english_name="The Vault Newbie",
                arcana_type="major",
                number=0,
                description="剛開始冒險的新手",
                keywords=["新開始", "天真", "潛力"],
                faction_relevance=[FactionAlignment.VAULT_DWELLER.value],
                complexity_level="beginner",
                theme_tags=["新開始", "學習", "成長"]
            ),
            WastelandCard(
                id="combat_card",
                name="戰鬥武器騎士",
                english_name="Knight of Combat Weapons",
                arcana_type="court",
                number=12,
                description="熟練的戰士和保護者",
                suit="combat_weapons",
                keywords=["戰鬥", "保護", "技能"],
                complexity_level="intermediate",
                theme_tags=["戰鬥", "保護", "勇氣"]
            )
        ]
        return cards

    @pytest.fixture
    def mock_historical_readings(self, experienced_user) -> List[Reading]:
        """Create mock historical readings for personalization analysis"""
        readings = []
        base_date = datetime.utcnow() - timedelta(days=30)

        for i in range(20):
            reading = Reading(
                id=f"historical_reading_{i}",
                user_id=experienced_user.id,
                question=f"Historical question {i}",
                spread_type="single_card" if i % 2 == 0 else "three_card",
                cards_drawn=[{"id": f"card_{i}", "name": f"Card {i}"}],
                interpretation=f"Historical interpretation {i}",
                character_voice=CharacterVoice.PIP_BOY.value,
                karma_context=KarmaAlignment.GOOD.value,
                accuracy_rating=4 if i % 3 == 0 else 5,
                user_feedback=f"Helpful reading {i}",
                tags=["tech", "combat"] if i % 2 == 0 else ["love", "future"],
                mood="career" if i % 3 == 0 else "love",
                created_at=base_date + timedelta(days=i)
            )
            readings.append(reading)

        return readings

    @pytest.mark.asyncio
    async def test_comprehensive_user_personalization(
        self,
        db_session,
        experienced_user,
        sample_cards,
        mock_historical_readings
    ):
        """
        測試綜合用戶個人化系統

        測試情境：
        - 整合所有個人化因素（Karma, Faction, Voice, History）
        - 基於歷史記錄的偏好學習
        - 動態個人化評分計算
        - 個人化建議的準確性驗證
        """
        reading_service = ReadingService(db_session)
        card_service = WastelandCardService(db_session)

        # Add historical readings to database
        for reading in mock_historical_readings:
            db_session.add(reading)
        await db_session.commit()

        # Mock personalization components
        with patch.object(reading_service, '_get_user_with_validation', return_value=experienced_user), \
             patch.object(card_service, 'draw_cards_with_radiation_shuffle', return_value=sample_cards[:1]), \
             patch.object(reading_service, '_check_daily_reading_limit'):

            # Create personalized reading
            reading_data = {
                "user_id": experienced_user.id,
                "question": "我的技術發展方向如何？",
                "reading_type": "brotherhood_council",
                "num_cards": 1,
                "character_voice": CharacterVoice.PIP_BOY,
                "radiation_factor": 0.6
            }

            reading = await reading_service.create_reading(reading_data)

            # Verify personalization factors are applied
            assert reading.user_id == experienced_user.id
            assert reading.character_voice == CharacterVoice.PIP_BOY.value
            assert reading.karma_context == KarmaAlignment.GOOD.value
            assert reading.faction_influence == FactionAlignment.BROTHERHOOD.value

            # Verify interpretation includes personalization
            interpretation = reading.interpretation
            assert "科技" in interpretation or "Tech" in interpretation  # Should mention tech (user's preference)
            assert "兄弟會" in interpretation or "Brotherhood" in interpretation  # Faction relevance
            assert len(interpretation) > 100  # Should be detailed for experienced user

    @pytest.mark.asyncio
    async def test_adaptive_complexity_matching(
        self,
        db_session,
        experienced_user,
        novice_user,
        sample_cards
    ):
        """
        測試適應性複雜度匹配

        測試情境：
        - 經驗用戶獲得複雜解釋
        - 新手用戶獲得簡化解釋
        - 複雜度評分的動態調整
        - 學習曲線的個人化適應
        """
        reading_service = ReadingService(db_session)

        # Test experienced user gets complex interpretation
        with patch.object(reading_service, '_get_user_with_validation', return_value=experienced_user):
            experienced_interpretation = await reading_service._generate_interpretation(
                user=experienced_user,
                cards=[sample_cards[0]],  # Tech card
                question="深度技術分析問題",
                character_voice=CharacterVoice.PIP_BOY
            )

        # Test novice user gets simplified interpretation
        with patch.object(reading_service, '_get_user_with_validation', return_value=novice_user):
            novice_interpretation = await reading_service._generate_interpretation(
                user=novice_user,
                cards=[sample_cards[1]],  # Simple card
                question="簡單的開始問題",
                character_voice=CharacterVoice.VAULT_DWELLER
            )

        # Verify complexity differences
        assert len(experienced_interpretation) > len(novice_interpretation)

        # Experienced user should get more detailed technical language
        assert "分析" in experienced_interpretation or "技術" in experienced_interpretation

        # Novice user should get more basic, encouraging language
        assert "新開始" in novice_interpretation or "學習" in novice_interpretation

    @pytest.mark.asyncio
    async def test_preference_learning_from_feedback(
        self,
        db_session,
        experienced_user,
        mock_historical_readings
    ):
        """
        測試從用戶回饋學習偏好

        測試情境：
        - 高評分解釋模式的識別
        - 用戶偏好標籤的提取
        - 負面回饋的避免模式
        - 偏好權重的動態調整
        """
        reading_service = ReadingService(db_session)

        # Add historical readings with feedback
        for reading in mock_historical_readings:
            db_session.add(reading)
        await db_session.commit()

        # Analyze user preferences from history
        preferences = await reading_service._analyze_user_preferences(experienced_user.id)

        # Should identify preferred themes from high-rated readings
        assert "preferred_themes" in preferences
        assert "preferred_voices" in preferences
        assert "preferred_complexity" in preferences

        # Should include themes from highly rated historical readings
        # (Based on our mock data: tech and combat themes with 4-5 star ratings)
        preferred_themes = preferences.get("preferred_themes", [])
        assert len(preferred_themes) > 0

        # Should identify most used character voice
        preferred_voices = preferences.get("preferred_voices", {})
        assert CharacterVoice.PIP_BOY.value in preferred_voices

    @pytest.mark.asyncio
    async def test_contextual_personalization_triggers(
        self,
        db_session,
        experienced_user,
        sample_cards
    ):
        """
        測試上下文觸發的個人化

        測試情境：
        - 時間敏感的個人化（早晨vs晚上）
        - 情緒狀態適應
        - 問題類型的個人化匹配
        - 環境因素的考量
        """
        reading_service = ReadingService(db_session)

        # Test morning reading (career-focused)
        morning_context = {
            "time_of_day": "morning",
            "user_energy": "high",
            "question_urgency": "medium",
            "environmental_factors": ["work_day", "productive_mood"]
        }

        with patch.object(reading_service, '_detect_context', return_value=morning_context):
            morning_interpretation = await reading_service._generate_interpretation(
                user=experienced_user,
                cards=[sample_cards[0]],
                question="今天的工作重點是什麼？",
                character_voice=CharacterVoice.PIP_BOY
            )

        # Test evening reading (reflection-focused)
        evening_context = {
            "time_of_day": "evening",
            "user_energy": "reflective",
            "question_urgency": "low",
            "environmental_factors": ["relaxed", "contemplative"]
        }

        with patch.object(reading_service, '_detect_context', return_value=evening_context):
            evening_interpretation = await reading_service._generate_interpretation(
                user=experienced_user,
                cards=[sample_cards[0]],
                question="今天學到了什麼？",
                character_voice=CharacterVoice.PIP_BOY
            )

        # Verify contextual differences
        assert morning_interpretation != evening_interpretation
        assert len(morning_interpretation) > 50
        assert len(evening_interpretation) > 50

    @pytest.mark.asyncio
    async def test_cross_user_personalization_isolation(
        self,
        db_session,
        experienced_user,
        novice_user,
        sample_cards
    ):
        """
        測試跨用戶個人化隔離

        測試情境：
        - 用戶間個人化資料不混淆
        - 個別用戶的偏好獨立性
        - 隱私保護驗證
        - 個人化模型的隔離性
        """
        reading_service = ReadingService(db_session)

        # Create readings for both users with same question
        same_question = "我的未來會如何？"

        # Experienced user reading
        with patch.object(reading_service, '_get_user_with_validation', return_value=experienced_user):
            experienced_reading = await reading_service._generate_interpretation(
                user=experienced_user,
                cards=[sample_cards[0]],
                question=same_question,
                character_voice=CharacterVoice.PIP_BOY
            )

        # Novice user reading
        with patch.object(reading_service, '_get_user_with_validation', return_value=novice_user):
            novice_reading = await reading_service._generate_interpretation(
                user=novice_user,
                cards=[sample_cards[1]],
                question=same_question,
                character_voice=CharacterVoice.VAULT_DWELLER
            )

        # Verify personalization isolation
        assert experienced_reading != novice_reading

        # Experienced user should get faction-relevant content
        assert ("兄弟會" in experienced_reading or
                "Brotherhood" in experienced_reading or
                "科技" in experienced_reading)

        # Novice user should get beginner-friendly content
        assert ("新手" in novice_reading or
                "開始" in novice_reading or
                "學習" in novice_reading)

    @pytest.mark.asyncio
    async def test_personalization_performance_impact(
        self,
        db_session,
        experienced_user,
        sample_cards
    ):
        """
        測試個人化對效能的影響

        測試情境：
        - 個人化計算的執行時間
        - 記憶體使用影響
        - 快取機制的效果
        - 大量用戶的擴展性
        """
        reading_service = ReadingService(db_session)

        # Measure personalization overhead
        start_time = datetime.now()

        # Generate personalized interpretation
        with patch.object(reading_service, '_get_user_with_validation', return_value=experienced_user):
            interpretation = await reading_service._generate_interpretation(
                user=experienced_user,
                cards=sample_cards,
                question="效能測試問題",
                character_voice=CharacterVoice.PIP_BOY
            )

        personalization_time = (datetime.now() - start_time).total_seconds()

        # Should complete within reasonable time
        assert personalization_time < 2.0
        assert len(interpretation) > 50

        # Test batch personalization performance
        start_time = datetime.now()

        batch_interpretations = []
        for i in range(5):
            with patch.object(reading_service, '_get_user_with_validation', return_value=experienced_user):
                batch_interpretation = await reading_service._generate_interpretation(
                    user=experienced_user,
                    cards=[sample_cards[i % len(sample_cards)]],
                    question=f"批次測試問題 {i}",
                    character_voice=CharacterVoice.PIP_BOY
                )
                batch_interpretations.append(batch_interpretation)

        batch_time = (datetime.now() - start_time).total_seconds()

        # Batch processing should be efficient
        assert batch_time < 5.0
        assert len(batch_interpretations) == 5

    @pytest.mark.asyncio
    async def test_personalization_edge_cases(
        self,
        db_session,
        sample_cards
    ):
        """
        測試個人化邊緣案例

        測試情境：
        - 無歷史記錄的新用戶
        - 資料不完整的用戶
        - 極端偏好的用戶
        - 系統降級模式
        """
        reading_service = ReadingService(db_session)

        # Test user with minimal data
        minimal_user = User(
            id="minimal_user",
            username="minimal",
            email="minimal@test.com",
            karma_score=50,
            is_active=True
        )

        # Should handle gracefully without profile/preferences
        interpretation = await reading_service._generate_interpretation(
            user=minimal_user,
            cards=[sample_cards[0]],
            question="最小用戶測試",
            character_voice=CharacterVoice.PIP_BOY
        )

        assert len(interpretation) > 50
        assert sample_cards[0].name in interpretation

        # Test user with conflicting preferences
        conflicted_user = User(
            id="conflicted_user",
            username="conflicted",
            email="conflicted@test.com",
            karma_score=50,
            faction_alignment=FactionAlignment.BROTHERHOOD.value,  # Tech-focused
            favorite_card_suit="nuka_cola_bottles",  # Emotion-focused
            is_active=True
        )

        conflicted_interpretation = await reading_service._generate_interpretation(
            user=conflicted_user,
            cards=[sample_cards[1]],
            question="衝突偏好測試",
            character_voice=CharacterVoice.VAULT_DWELLER
        )

        # Should handle conflicting preferences gracefully
        assert len(conflicted_interpretation) > 50

    @pytest.mark.asyncio
    async def test_personalization_data_privacy(
        self,
        db_session,
        experienced_user
    ):
        """
        測試個人化資料隱私保護

        測試情境：
        - 敏感資料的匿名化
        - 個人化資料的存取控制
        - 資料洩漏防護
        - 隱私設定的遵循
        """
        reading_service = ReadingService(db_session)

        # Test data export excludes sensitive personalization details
        user_data = experienced_user.export_user_data(
            include_profile=True,
            include_preferences=True
        )

        # Should not include internal personalization algorithms
        assert "personalization_weights" not in user_data
        assert "internal_scoring" not in user_data
        assert "algorithm_parameters" not in user_data

        # Should include user-controllable preferences
        assert "profile" in user_data
        assert "preferences" in user_data

        # Test personalization respects privacy settings
        experienced_user.preferences.data_collection_consent = False

        with patch.object(reading_service, '_get_user_with_validation', return_value=experienced_user):
            privacy_interpretation = await reading_service._generate_interpretation(
                user=experienced_user,
                cards=[sample_cards[0]],
                question="隱私測試問題",
                character_voice=CharacterVoice.PIP_BOY
            )

        # Should still work but with reduced personalization
        assert len(privacy_interpretation) > 50

    @pytest.mark.asyncio
    async def test_multi_dimensional_personalization_scoring(
        self,
        db_session,
        experienced_user,
        sample_cards
    ):
        """
        測試多維度個人化評分系統

        測試情境：
        - 多個個人化因素的權重計算
        - 動態評分調整
        - 個人化信心度評估
        - 評分系統的可解釋性
        """
        reading_service = ReadingService(db_session)

        # Mock personalization scoring system
        personalization_factors = {
            "karma_alignment": 0.8,      # Strong karma alignment
            "faction_relevance": 0.9,    # High faction relevance
            "historical_preference": 0.7, # Good historical match
            "complexity_match": 0.8,     # Appropriate complexity
            "theme_preference": 0.6,     # Moderate theme match
            "voice_familiarity": 0.9     # High voice familiarity
        }

        with patch.object(reading_service, '_calculate_personalization_score', return_value=personalization_factors):
            interpretation = await reading_service._generate_interpretation(
                user=experienced_user,
                cards=[sample_cards[0]],
                question="多維度評分測試",
                character_voice=CharacterVoice.PIP_BOY
            )

        # Should generate high-quality personalized interpretation
        assert len(interpretation) > 100
        assert "科技" in interpretation or "兄弟會" in interpretation

        # Test low personalization score handling
        low_score_factors = {
            "karma_alignment": 0.2,
            "faction_relevance": 0.1,
            "historical_preference": 0.3,
            "complexity_match": 0.4,
            "theme_preference": 0.2,
            "voice_familiarity": 0.1
        }

        with patch.object(reading_service, '_calculate_personalization_score', return_value=low_score_factors):
            low_score_interpretation = await reading_service._generate_interpretation(
                user=experienced_user,
                cards=[sample_cards[1]],
                question="低評分測試",
                character_voice=CharacterVoice.VAULT_DWELLER
            )

        # Should still provide meaningful interpretation despite low scores
        assert len(low_score_interpretation) > 50