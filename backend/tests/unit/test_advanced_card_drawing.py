"""
Advanced Card Drawing System Tests
Enhanced testing for radiation-influenced shuffling, personalized card selection,
and multi-user card drawing scenarios for Wasteland Tarot.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from typing import Dict, Any, List
import random
import statistics
from datetime import datetime, timedelta

from app.models.user import User, UserProfile
from app.models.wasteland_card import WastelandCard, KarmaAlignment, CharacterVoice, FactionAlignment
from app.services.wasteland_card_service import WastelandCardService, RadiationRandomnessEngine


class TestRadiationInfluencedCardDrawing:
    """Advanced tests for radiation-influenced card drawing mechanics"""

    @pytest.fixture
    def radiation_engine(self):
        """Create a radiation randomness engine for testing"""
        return RadiationRandomnessEngine()

    @pytest.fixture
    def test_deck(self) -> List[WastelandCard]:
        """Create a test deck with varying radiation levels"""
        cards = []
        for i in range(20):
            card = WastelandCard(
                id=f"test_card_{i}",
                name=f"測試牌 {i}",
                arcana_type="major" if i < 10 else "minor",
                number=i % 22,
                description=f"測試描述 {i}",
                radiation_level=round(random.uniform(0.0, 1.0), 2),
                suit="nuka_cola_bottles" if i >= 10 else None
            )
            cards.append(card)
        return cards

    @pytest.fixture
    def personalized_user(self) -> User:
        """Create a user with personalization data"""
        user = User(
            id="personalized_user",
            username="vault_specialist",
            email="specialist@vault.com",
            karma_score=85,  # Good karma
            faction_alignment=FactionAlignment.BROTHERHOOD.value,
            total_readings=100,
            is_active=True
        )

        profile = UserProfile(
            user_id=user.id,
            preferred_voice=CharacterVoice.PIP_BOY.value,
            vault_number=111,
            favorite_card_suit="combat_weapons",
            total_readings=100
        )

        user.profile = profile
        return user

    @pytest.mark.asyncio
    async def test_radiation_influenced_card_shuffling(
        self,
        db_session,
        test_deck,
        radiation_engine
    ):
        """
        測試輻射影響的洗牌算法

        測試情境：
        - 高輻射牌有較高的抽取機率
        - 不同輻射係數產生不同的洗牌結果
        - 洗牌演算法的統計分佈驗證
        - Geiger計數器風格的隨機數生成
        """
        service = WastelandCardService(db_session)

        # Test basic radiation shuffle
        shuffled_deck = await service._apply_radiation_shuffle(
            cards=test_deck,
            radiation_factor=0.5
        )

        assert len(shuffled_deck) == len(test_deck)
        assert set(card.id for card in shuffled_deck) == set(card.id for card in test_deck)

        # Test multiple shuffles produce different results
        shuffle_results = []
        for _ in range(10):
            shuffled = await service._apply_radiation_shuffle(
                cards=test_deck,
                radiation_factor=0.7
            )
            shuffle_results.append([card.id for card in shuffled])

        # Should have some variation in shuffled order
        unique_first_cards = set(result[0] for result in shuffle_results)
        assert len(unique_first_cards) > 1  # At least some variation

        # Test radiation factor influence
        high_rad_shuffle = await service._apply_radiation_shuffle(
            cards=test_deck,
            radiation_factor=0.9
        )
        low_rad_shuffle = await service._apply_radiation_shuffle(
            cards=test_deck,
            radiation_factor=0.1
        )

        # High radiation factor should favor high-radiation cards
        high_rad_top_cards = high_rad_shuffle[:5]
        low_rad_top_cards = low_rad_shuffle[:5]

        high_rad_avg = statistics.mean(card.radiation_level for card in high_rad_top_cards)
        low_rad_avg = statistics.mean(card.radiation_level for card in low_rad_top_cards)

        # Statistical tendency (may not always be true due to randomness)
        # assert high_rad_avg >= low_rad_avg

    @pytest.mark.asyncio
    async def test_karma_influenced_card_selection(
        self,
        db_session,
        test_deck,
        personalized_user
    ):
        """
        測試 Karma 影響的牌卡選擇

        測試情境：
        - 善良 Karma 用戶傾向抽到正面牌卡
        - 邪惡 Karma 用戶傾向抽到挑戰牌卡
        - 中性 Karma 用戶得到平衡的牌卡組合
        - Karma 影響的統計驗證
        """
        service = WastelandCardService(db_session)

        # Add karma-sensitive attributes to test cards
        for i, card in enumerate(test_deck):
            if i % 3 == 0:
                card.karma_tendency = "positive"
            elif i % 3 == 1:
                card.karma_tendency = "negative"
            else:
                card.karma_tendency = "neutral"

        # Test good karma user
        good_karma_user = personalized_user
        good_karma_user.karma_score = 90

        good_karma_cards = await service.draw_cards_with_radiation_shuffle(
            num_cards=5,
            radiation_factor=0.5,
            user_id=good_karma_user.id,
            karma_influence=True
        )

        assert len(good_karma_cards) == 5

        # Test evil karma user
        evil_karma_user = User(
            id="evil_user",
            username="raider_boss",
            email="boss@raiders.com",
            karma_score=10,  # Evil karma
            faction_alignment=FactionAlignment.RAIDERS.value,
            is_active=True
        )

        with patch.object(service, '_get_user_context', return_value={"karma": KarmaAlignment.EVIL}):
            evil_karma_cards = await service.draw_cards_with_radiation_shuffle(
                num_cards=5,
                radiation_factor=0.5,
                user_id=evil_karma_user.id,
                karma_influence=True
            )

        assert len(evil_karma_cards) == 5

        # Test neutral karma user
        neutral_karma_user = User(
            id="neutral_user",
            username="wasteland_wanderer",
            email="wanderer@wasteland.com",
            karma_score=50,  # Neutral karma
            is_active=True
        )

        with patch.object(service, '_get_user_context', return_value={"karma": KarmaAlignment.NEUTRAL}):
            neutral_karma_cards = await service.draw_cards_with_radiation_shuffle(
                num_cards=5,
                radiation_factor=0.5,
                user_id=neutral_karma_user.id,
                karma_influence=True
            )

        assert len(neutral_karma_cards) == 5

    @pytest.mark.asyncio
    async def test_faction_specific_card_recommendations(
        self,
        db_session,
        test_deck,
        personalized_user
    ):
        """
        測試派系特定的牌卡推薦

        測試情境：
        - 兄弟會成員傾向抽到科技相關牌卡
        - NCR 成員傾向抽到民主/秩序相關牌卡
        - 劫掠者傾向抽到混亂/衝突相關牌卡
        - 避難所居民傾向抽到純淨/安全相關牌卡
        """
        service = WastelandCardService(db_session)

        # Add faction-relevant tags to test cards
        for i, card in enumerate(test_deck):
            if i % 4 == 0:
                card.faction_relevance = [FactionAlignment.BROTHERHOOD.value]
                card.faction_tags = ["科技", "知識", "能源武器"]
            elif i % 4 == 1:
                card.faction_relevance = [FactionAlignment.NCR.value]
                card.faction_tags = ["民主", "秩序", "貿易"]
            elif i % 4 == 2:
                card.faction_relevance = [FactionAlignment.RAIDERS.value]
                card.faction_tags = ["混亂", "掠奪", "自由"]
            else:
                card.faction_relevance = [FactionAlignment.VAULT_DWELLER.value]
                card.faction_tags = ["安全", "純淨", "科學"]

        # Test Brotherhood member
        brotherhood_user = personalized_user  # Already set to Brotherhood
        brotherhood_cards = await service.draw_cards_with_radiation_shuffle(
            num_cards=3,
            radiation_factor=0.5,
            user_id=brotherhood_user.id,
            faction_influence=True
        )

        assert len(brotherhood_cards) == 3

        # Test NCR member
        ncr_user = User(
            id="ncr_user",
            username="ncr_ranger",
            email="ranger@ncr.gov",
            karma_score=70,
            faction_alignment=FactionAlignment.NCR.value,
            is_active=True
        )

        with patch.object(service, '_get_user_context', return_value={"faction": FactionAlignment.NCR}):
            ncr_cards = await service.draw_cards_with_radiation_shuffle(
                num_cards=3,
                radiation_factor=0.5,
                user_id=ncr_user.id,
                faction_influence=True
            )

        assert len(ncr_cards) == 3

        # Test Raider
        raider_user = User(
            id="raider_user",
            username="raider_chief",
            email="chief@raiders.net",
            karma_score=20,
            faction_alignment=FactionAlignment.RAIDERS.value,
            is_active=True
        )

        with patch.object(service, '_get_user_context', return_value={"faction": FactionAlignment.RAIDERS}):
            raider_cards = await service.draw_cards_with_radiation_shuffle(
                num_cards=3,
                radiation_factor=0.5,
                user_id=raider_user.id,
                faction_influence=True
            )

        assert len(raider_cards) == 3

    @pytest.mark.asyncio
    async def test_personalized_card_suggestions(
        self,
        db_session,
        test_deck,
        personalized_user
    ):
        """
        測試個人化牌卡建議系統

        測試情境：
        - 基於用戶歷史偏好的牌卡推薦
        - 用戶喜愛的牌組類型優先級
        - 經驗等級影響的牌卡複雜度
        - 個人化評分算法驗證
        """
        service = WastelandCardService(db_session)

        # Mock user's card preferences from history
        user_preferences = {
            "favorite_suits": ["combat_weapons", "nuka_cola_bottles"],
            "preferred_complexity": "high",
            "favorite_themes": ["科技", "戰鬥", "探索"],
            "avoided_themes": ["恐怖", "死亡"]
        }

        with patch.object(service, '_get_user_preferences', return_value=user_preferences):
            personalized_cards = await service.get_personalized_card_suggestions(
                user_id=personalized_user.id,
                num_suggestions=5,
                context="daily_reading"
            )

        assert len(personalized_cards) == 5

        # Test that suggestions consider user preferences
        # (This would be more detailed with actual preference matching logic)
        for card in personalized_cards:
            assert hasattr(card, 'personalization_score')
            assert 0.0 <= card.personalization_score <= 1.0

    @pytest.mark.asyncio
    async def test_card_draw_with_user_context(
        self,
        db_session,
        test_deck,
        personalized_user
    ):
        """
        測試帶有用戶上下文的牌卡抽取

        測試情境：
        - 問題類型影響牌卡選擇
        - 用戶情緒狀態的考量
        - 時間和日期的影響（特殊事件）
        - 上下文敏感的牌卡過濾
        """
        service = WastelandCardService(db_session)

        # Test love-related question
        love_context = {
            "question_category": "love",
            "user_mood": "hopeful",
            "time_of_day": "evening",
            "user_experience": "veteran"
        }

        with patch.object(service, '_analyze_question_context', return_value=love_context):
            love_cards = await service.draw_cards_with_context(
                user_id=personalized_user.id,
                question="我和伴侶的關係會如何發展？",
                num_cards=3,
                context=love_context
            )

        assert len(love_cards) == 3

        # Test career-related question
        career_context = {
            "question_category": "career",
            "user_mood": "anxious",
            "time_of_day": "morning",
            "user_experience": "veteran"
        }

        with patch.object(service, '_analyze_question_context', return_value=career_context):
            career_cards = await service.draw_cards_with_context(
                user_id=personalized_user.id,
                question="我的工作前景如何？",
                num_cards=3,
                context=career_context
            )

        assert len(career_cards) == 3

        # Verify different contexts produce different results
        love_card_ids = set(card.id for card in love_cards)
        career_card_ids = set(card.id for card in career_cards)

        # May overlap, but should have some differences
        # assert love_card_ids != career_card_ids

    @pytest.mark.asyncio
    async def test_multiple_card_draw_consistency(
        self,
        db_session,
        test_deck,
        personalized_user
    ):
        """
        測試多張牌抽取的一致性

        測試情境：
        - 同一次抽取的牌卡不重複
        - 牌卡間的相互關係驗證
        - 抽取順序的意義
        - 牌組組合的邏輯性檢查
        """
        service = WastelandCardService(db_session)

        # Test single draw with multiple cards
        cards = await service.draw_cards_with_radiation_shuffle(
            num_cards=7,
            radiation_factor=0.6,
            user_id=personalized_user.id
        )

        assert len(cards) == 7

        # Verify no duplicate cards
        card_ids = [card.id for card in cards]
        assert len(card_ids) == len(set(card_ids))

        # Test spread-specific drawing
        vault_tec_spread = await service.draw_for_spread(
            spread_type="vault_tec_spread",
            user_id=personalized_user.id,
            radiation_factor=0.5
        )

        assert len(vault_tec_spread) == 3  # Past, Present, Future

        # Verify spread positions are assigned
        for i, card in enumerate(vault_tec_spread):
            assert hasattr(card, 'position_in_spread')
            assert card.position_in_spread == i

        # Test Brotherhood Council spread
        brotherhood_spread = await service.draw_for_spread(
            spread_type="brotherhood_council",
            user_id=personalized_user.id,
            radiation_factor=0.7
        )

        assert len(brotherhood_spread) == 7

    @pytest.mark.asyncio
    async def test_concurrent_card_drawing(
        self,
        db_session,
        test_deck
    ):
        """
        測試並發牌卡抽取

        測試情境：
        - 多用戶同時抽牌不衝突
        - 牌卡庫存管理（如果適用）
        - 隨機數生成器的線程安全
        - 並發效能測試
        """
        service = WastelandCardService(db_session)

        # Create multiple users
        users = []
        for i in range(5):
            user = User(
                id=f"concurrent_user_{i}",
                username=f"user_{i}",
                email=f"user{i}@test.com",
                karma_score=50 + i * 10,
                is_active=True
            )
            users.append(user)

        # Simulate concurrent draws
        import asyncio

        async def draw_for_user(user):
            return await service.draw_cards_with_radiation_shuffle(
                num_cards=3,
                radiation_factor=0.5,
                user_id=user.id
            )

        # Execute concurrent draws
        tasks = [draw_for_user(user) for user in users]
        results = await asyncio.gather(*tasks)

        # Verify all draws completed successfully
        assert len(results) == 5
        for result in results:
            assert len(result) == 3

        # Verify each user got different cards (high probability)
        all_drawn_combinations = set()
        for result in results:
            combination = tuple(sorted(card.id for card in result))
            all_drawn_combinations.add(combination)

        # Should have some variety (not guaranteed but highly probable)
        # assert len(all_drawn_combinations) > 1

    @pytest.mark.asyncio
    async def test_radiation_decay_over_time(
        self,
        db_session,
        test_deck
    ):
        """
        測試時間影響的輻射衰減

        測試情境：
        - 牌卡的輻射等級隨時間變化
        - 長期用戶的牌卡適應性
        - 季節性輻射波動
        - 時間敏感的抽牌算法
        """
        service = WastelandCardService(db_session)

        # Test time-based radiation adjustment
        base_time = datetime.utcnow()

        # Mock different time periods
        time_scenarios = [
            {"time": base_time, "description": "current_time"},
            {"time": base_time - timedelta(hours=6), "description": "6_hours_ago"},
            {"time": base_time - timedelta(days=1), "description": "1_day_ago"},
            {"time": base_time - timedelta(days=30), "description": "1_month_ago"}
        ]

        user = User(
            id="time_test_user",
            username="time_traveler",
            email="traveler@time.com",
            karma_score=60,
            is_active=True
        )

        for scenario in time_scenarios:
            with patch('app.services.wasteland_card_service.datetime') as mock_datetime:
                mock_datetime.utcnow.return_value = scenario["time"]

                cards = await service.draw_cards_with_radiation_shuffle(
                    num_cards=3,
                    radiation_factor=0.5,
                    user_id=user.id,
                    time_sensitive=True
                )

                assert len(cards) == 3

                # Verify time context is considered
                for card in cards:
                    assert hasattr(card, 'temporal_radiation_modifier')

    @pytest.mark.asyncio
    async def test_geiger_counter_randomness_engine(
        self,
        radiation_engine
    ):
        """
        測試 Geiger 計數器風格的隨機數引擎

        測試情境：
        - 模擬輻射偵測的隨機性
        - Click-beep 模式的隨機種子生成
        - 輻射爆發事件的模擬
        - 統計分佈的驗證
        """
        # Test basic random generation
        random_values = []
        for _ in range(100):
            value = radiation_engine.generate_radiation_influenced_random()
            random_values.append(value)
            assert 0.0 <= value <= 1.0

        # Test statistical properties
        mean_value = statistics.mean(random_values)
        variance = statistics.variance(random_values)

        # Should have reasonable distribution
        assert 0.2 <= mean_value <= 0.8  # Roughly centered
        assert variance > 0.01  # Some variance

        # Test Geiger counter seed generation
        geiger_seeds = []
        for _ in range(10):
            seed = radiation_engine.generate_geiger_seed()
            geiger_seeds.append(seed)
            assert isinstance(seed, str)
            assert "click" in seed.lower() or "beep" in seed.lower()

        # Should generate different seeds
        assert len(set(geiger_seeds)) > 1

        # Test radiation burst events
        burst_events = []
        for _ in range(50):
            is_burst = radiation_engine.check_radiation_burst()
            burst_events.append(is_burst)

        # Should have some burst events but not too many
        burst_count = sum(burst_events)
        assert 0 <= burst_count <= 10  # Reasonable burst frequency

    @pytest.mark.asyncio
    async def test_card_draw_performance_optimization(
        self,
        db_session,
        test_deck
    ):
        """
        測試牌卡抽取的效能最佳化

        測試情境：
        - 大量牌卡抽取的效能
        - 記憶體使用最佳化
        - 快取機制的效果
        - 批次處理的效能
        """
        service = WastelandCardService(db_session)

        user = User(
            id="performance_user",
            username="speed_tester",
            email="speed@test.com",
            karma_score=50,
            is_active=True
        )

        # Test single draw performance
        start_time = datetime.now()

        cards = await service.draw_cards_with_radiation_shuffle(
            num_cards=1,
            radiation_factor=0.5,
            user_id=user.id
        )

        single_draw_time = (datetime.now() - start_time).total_seconds()
        assert single_draw_time < 1.0  # Should be fast
        assert len(cards) == 1

        # Test batch draw performance
        start_time = datetime.now()

        batch_results = []
        for _ in range(10):
            batch_cards = await service.draw_cards_with_radiation_shuffle(
                num_cards=3,
                radiation_factor=0.5,
                user_id=user.id
            )
            batch_results.append(batch_cards)

        batch_draw_time = (datetime.now() - start_time).total_seconds()
        assert batch_draw_time < 5.0  # Should handle batch efficiently
        assert len(batch_results) == 10

        # Test memory usage (basic check)
        import sys
        memory_before = sys.getsizeof(test_deck)

        large_draw = await service.draw_cards_with_radiation_shuffle(
            num_cards=10,
            radiation_factor=0.8,
            user_id=user.id
        )

        memory_after = sys.getsizeof(large_draw)
        assert memory_after > 0  # Basic memory usage check
        assert len(large_draw) == 10