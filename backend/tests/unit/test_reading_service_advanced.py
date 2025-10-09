"""
Reading Service Advanced Tests
Comprehensive testing for enhanced reading functionality including
AI interpretation, sharing, statistics, and advanced features.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from typing import Dict, Any, List
from datetime import datetime, timedelta

from app.models.user import User
from app.models.reading_enhanced import Reading, UserProfile, UserPreferences
from app.models.wasteland_card import WastelandCard, KarmaAlignment, CharacterVoice, FactionAlignment
from app.services.reading_service import ReadingService
from app.core.exceptions import (
    UserNotFoundError,
    ReadingLimitExceededError,
    InsufficientPermissionsError
)


class TestReadingServiceAdvanced:
    """Advanced test suite for ReadingService with AI integration"""

    @pytest.fixture
    def test_user(self) -> User:
        """Create a test user with complete profile"""
        user = User(
            id="test_user_123",
            username="vault_survivor",
            email="survivor@vault.com",
            karma_score=65,
            faction_alignment=FactionAlignment.VAULT_DWELLER.value,
            daily_readings_count=5,
            total_readings=25,
            is_active=True
        )

        profile = UserProfile(
            user_id=user.id,
            preferred_voice=CharacterVoice.PIP_BOY.value,
            vault_number=101,
            total_readings=25
        )

        preferences = UserPreferences(
            user_id=user.id,
            default_character_voice=CharacterVoice.PIP_BOY.value,
            auto_save_readings=True
        )

        user.profile = profile
        user.preferences = preferences

        return user

    @pytest.fixture
    def sample_reading_data(self) -> Dict[str, Any]:
        """Sample reading creation data"""
        return {
            "user_id": "test_user_123",
            "question": "我今天應該如何在廢土中生存？",
            "reading_type": "single_wasteland_reading",
            "num_cards": 1,
            "character_voice": CharacterVoice.PIP_BOY,
            "radiation_factor": 0.5
        }

    @pytest.fixture
    def mock_cards(self) -> List[WastelandCard]:
        """Create mock cards for testing"""
        return [
            WastelandCard(
                id="major_00",
                name="新手避難所居民",
                english_name="The Vault Newbie",
                arcana_type="major",
                number=0,
                description="新的開始和無限可能",
                suit=None
            ),
            WastelandCard(
                id="nuka_ace",
                name="可樂瓶 A",
                english_name="Ace of Nuka-Cola",
                arcana_type="minor",
                number=1,
                description="發現新的資源",
                suit="nuka_cola_bottles"
            )
        ]

    @pytest.fixture
    def mock_card_service(self, mock_cards):
        """Mock card service for testing"""
        mock_service = AsyncMock()
        mock_service.draw_cards_with_radiation_shuffle.return_value = mock_cards[:1]
        return mock_service

    @pytest.mark.asyncio
    async def test_create_reading_with_ai_interpretation(
        self,
        db_session,
        test_user,
        sample_reading_data,
        mock_card_service
    ):
        """
        測試建立包含 AI 解釋的占卜記錄

        測試情境：
        - 完整的 AI 解釋生成流程
        - 用戶個人化因素的整合
        - 占卜記錄的正確儲存
        - 用戶統計資料的更新
        """
        # Mock the card service and AI interpretation
        with patch.object(ReadingService, '_get_user_with_validation', return_value=test_user), \
             patch.object(ReadingService, '_check_daily_reading_limit'), \
             patch('app.services.wasteland_card_service.WastelandCardService') as mock_card_service_class:

            mock_card_service_class.return_value = mock_card_service

            service = ReadingService(db_session)

            # Create reading
            reading = await service.create_reading(sample_reading_data)

            # Verify reading creation
            assert reading is not None
            assert reading.user_id == sample_reading_data["user_id"]
            assert reading.question == sample_reading_data["question"]
            assert reading.spread_type == sample_reading_data["reading_type"]
            assert reading.character_voice == CharacterVoice.PIP_BOY.value
            assert reading.karma_context == KarmaAlignment.NEUTRAL.value  # User has karma 65

            # Verify cards data
            assert len(reading.cards_drawn) == 1
            assert reading.cards_drawn[0]["name"] == "新手避難所居民"
            assert reading.cards_drawn[0]["position"] == 0

            # Verify interpretation exists
            assert reading.interpretation is not None
            assert len(reading.interpretation) > 0

            # Verify user statistics update
            mock_card_service.draw_cards_with_radiation_shuffle.assert_called_once_with(
                num_cards=1,
                radiation_factor=0.5,
                user_id="test_user_123"
            )

    @pytest.mark.asyncio
    async def test_reading_history_with_pagination(
        self,
        db_session,
        test_user
    ):
        """
        測試分頁的占卜歷史查詢

        測試情境：
        - 大量歷史記錄的分頁處理
        - 排序功能（按時間、評分等）
        - 篩選功能（按類型、角色聲音等）
        - 效能最佳化
        """
        service = ReadingService(db_session)

        # Create multiple test readings
        test_readings = []
        for i in range(15):
            reading = Reading(
                id=f"reading_{i}",
                user_id=test_user.id,
                question=f"測試問題 {i}",
                spread_type="single_card" if i % 2 == 0 else "three_card",
                cards_drawn=[{"id": "card_1", "name": "測試牌"}],
                interpretation=f"測試解釋 {i}",
                character_voice=CharacterVoice.PIP_BOY.value if i % 2 == 0 else CharacterVoice.VAULT_DWELLER.value,
                created_at=datetime.utcnow() - timedelta(days=i)
            )
            test_readings.append(reading)
            db_session.add(reading)

        await db_session.commit()

        # Test pagination
        first_page = await service.get_user_reading_history(
            user_id=test_user.id,
            limit=5,
            offset=0
        )
        assert len(first_page) == 5

        second_page = await service.get_user_reading_history(
            user_id=test_user.id,
            limit=5,
            offset=5
        )
        assert len(second_page) == 5

        # Verify ordering (newest first)
        for i in range(len(first_page) - 1):
            assert first_page[i].created_at >= first_page[i + 1].created_at

        # Test filtering by spread type
        single_card_readings = await service.get_user_reading_history(
            user_id=test_user.id,
            filter_by_spread="single_card"
        )
        assert all(reading.spread_type == "single_card" for reading in single_card_readings)

        # Test filtering by character voice
        pip_boy_readings = await service.get_user_reading_history(
            user_id=test_user.id,
            filter_by_voice=CharacterVoice.PIP_BOY.value
        )
        assert all(reading.character_voice == CharacterVoice.PIP_BOY.value for reading in pip_boy_readings)

    @pytest.mark.asyncio
    async def test_reading_sharing_permissions(
        self,
        db_session,
        test_user
    ):
        """
        測試占卜記錄的分享權限管理

        測試情境：
        - 公開分享設定
        - 好友分享功能
        - 特定用戶分享
        - 權限驗證和存取控制
        """
        service = ReadingService(db_session)

        # Create test reading
        reading = Reading(
            id="shareable_reading",
            user_id=test_user.id,
            question="分享測試問題",
            spread_type="single_card",
            cards_drawn=[{"id": "card_1", "name": "測試牌"}],
            interpretation="分享測試解釋",
            is_private=True,
            allow_public_sharing=False,
            share_with_friends=False,
            shared_with_users=[]
        )
        db_session.add(reading)
        await db_session.commit()

        # Test sharing with specific users
        target_user_ids = ["user_1", "user_2", "user_3"]
        success = await service.share_reading(
            reading_id=reading.id,
            owner_id=test_user.id,
            target_user_ids=target_user_ids,
            message="分享給你們的特殊解讀"
        )

        assert success is True
        await db_session.refresh(reading)
        assert set(reading.shared_with_users) == set(target_user_ids)
        assert reading.share_with_friends is True

        # Test access permission check
        can_access_owner = await service._can_user_access_reading(test_user.id, reading)
        assert can_access_owner is True

        can_access_shared = await service._can_user_access_reading("user_1", reading)
        assert can_access_shared is True

        can_access_stranger = await service._can_user_access_reading("stranger", reading)
        assert can_access_stranger is False

        # Test public sharing
        reading.is_private = False
        reading.allow_public_sharing = True
        can_access_public = await service._can_user_access_reading("anyone", reading)
        assert can_access_public is True

    @pytest.mark.asyncio
    async def test_reading_statistics_calculation(
        self,
        db_session,
        test_user
    ):
        """
        測試占卜統計資料的計算

        測試情境：
        - 準確率統計
        - 偏好分析（牌組類型、角色聲音）
        - 占卜頻率分析
        - Karma 和派系影響統計
        """
        service = ReadingService(db_session)

        # Create test readings with various attributes
        test_readings_data = [
            {
                "spread_type": "single_card",
                "character_voice": CharacterVoice.PIP_BOY.value,
                "karma_context": KarmaAlignment.GOOD.value,
                "faction_influence": FactionAlignment.BROTHERHOOD.value,
                "accuracy_rating": 5,
                "created_at": datetime.utcnow() - timedelta(days=1)
            },
            {
                "spread_type": "three_card",
                "character_voice": CharacterVoice.VAULT_DWELLER.value,
                "karma_context": KarmaAlignment.NEUTRAL.value,
                "faction_influence": FactionAlignment.VAULT_DWELLER.value,
                "accuracy_rating": 4,
                "created_at": datetime.utcnow() - timedelta(days=2)
            },
            {
                "spread_type": "single_card",
                "character_voice": CharacterVoice.PIP_BOY.value,
                "karma_context": KarmaAlignment.GOOD.value,
                "faction_influence": FactionAlignment.BROTHERHOOD.value,
                "accuracy_rating": 3,
                "created_at": datetime.utcnow() - timedelta(days=3)
            }
        ]

        for i, reading_data in enumerate(test_readings_data):
            reading = Reading(
                id=f"stats_reading_{i}",
                user_id=test_user.id,
                question=f"統計測試問題 {i}",
                cards_drawn=[{"id": "card_1", "name": "測試牌"}],
                interpretation=f"統計測試解釋 {i}",
                **reading_data
            )
            db_session.add(reading)

        await db_session.commit()

        # Get statistics
        stats = await service.get_reading_statistics(test_user.id)

        # Verify basic statistics
        assert stats["total_readings"] == 3
        assert stats["average_accuracy"] == 4.0  # (5+4+3)/3

        # Verify spread type preferences
        spread_preferences = dict(stats["favorite_spread_types"])
        assert spread_preferences["single_card"] == 2
        assert spread_preferences["three_card"] == 1

        # Verify character voice usage
        assert stats["character_voice_usage"][CharacterVoice.PIP_BOY.value] == 2
        assert stats["character_voice_usage"][CharacterVoice.VAULT_DWELLER.value] == 1

        # Verify karma influence
        assert stats["karma_influence"][KarmaAlignment.GOOD.value] == 2
        assert stats["karma_influence"][KarmaAlignment.NEUTRAL.value] == 1

        # Verify faction influence
        assert stats["faction_influence"][FactionAlignment.BROTHERHOOD.value] == 2
        assert stats["faction_influence"][FactionAlignment.VAULT_DWELLER.value] == 1

    @pytest.mark.asyncio
    async def test_reading_trends_analysis(
        self,
        db_session,
        test_user
    ):
        """
        測試占卜趨勢分析

        測試情境：
        - 時間段內的占卜頻率
        - 熱門問題關鍵字分析
        - 準確率趨勢
        - 角色聲音使用趨勢
        """
        service = ReadingService(db_session)

        # Create readings across different dates
        base_date = datetime.utcnow() - timedelta(days=15)
        trend_readings = []

        for i in range(10):
            reading = Reading(
                id=f"trend_reading_{i}",
                user_id=test_user.id,
                question=f"愛情 關係 未來 測試問題 {i}",  # Keywords for analysis
                spread_type="single_card",
                cards_drawn=[{"id": "card_1", "name": "測試牌"}],
                interpretation=f"趨勢測試解釋 {i}",
                character_voice=CharacterVoice.PIP_BOY.value if i % 2 == 0 else CharacterVoice.VAULT_DWELLER.value,
                accuracy_rating=3 + (i % 3),  # Varying accuracy
                created_at=base_date + timedelta(days=i)
            )
            trend_readings.append(reading)
            db_session.add(reading)

        await db_session.commit()

        # Get trends for the month
        trends = await service.get_reading_trends(
            user_id=test_user.id,
            period="month"
        )

        # Verify trend data structure
        assert "reading_count_by_day" in trends
        assert "popular_questions" in trends
        assert "character_voice_usage" in trends
        assert "accuracy_trends" in trends
        assert trends["total_readings_in_period"] == 10

        # Verify popular questions analysis
        popular_words = dict(trends["popular_questions"])
        assert "愛情" in popular_words
        assert "關係" in popular_words
        assert "未來" in popular_words
        assert popular_words["愛情"] == 10  # Appears in all questions

        # Verify character voice trends
        voice_trends = trends["character_voice_usage"]
        assert voice_trends[CharacterVoice.PIP_BOY.value] == 5  # Even indices
        assert voice_trends[CharacterVoice.VAULT_DWELLER.value] == 5  # Odd indices

        # Verify accuracy trends
        accuracy_trends = trends["accuracy_trends"]
        assert len(accuracy_trends) == 10
        assert all("date" in trend and "accuracy" in trend for trend in accuracy_trends)

    @pytest.mark.asyncio
    async def test_reading_update_with_feedback(
        self,
        db_session,
        test_user
    ):
        """
        測試占卜記錄的用戶回饋更新

        測試情境：
        - 準確率評分更新
        - 用戶回饋文字
        - 標籤和心情更新
        - 分享設定修改
        """
        service = ReadingService(db_session)

        # Create test reading
        reading = Reading(
            id="feedback_reading",
            user_id=test_user.id,
            question="回饋測試問題",
            spread_type="single_card",
            cards_drawn=[{"id": "card_1", "name": "測試牌"}],
            interpretation="回饋測試解釋",
            accuracy_rating=None,
            user_feedback=None,
            tags=[],
            mood="general",
            is_private=True
        )
        db_session.add(reading)
        await db_session.commit()

        # Update with feedback
        update_data = {
            "accuracy_rating": 5,
            "user_feedback": "這個解讀非常準確，幫助我做了正確的決定！",
            "tags": ["準確", "有用", "愛情"],
            "mood": "love",
            "is_private": False,
            "allow_public_sharing": True
        }

        updated_reading = await service.update_reading(
            reading_id=reading.id,
            user_id=test_user.id,
            update_data=update_data
        )

        # Verify updates
        assert updated_reading.accuracy_rating == 5
        assert updated_reading.user_feedback == "這個解讀非常準確，幫助我做了正確的決定！"
        assert updated_reading.tags == ["準確", "有用", "愛情"]
        assert updated_reading.mood == "love"
        assert updated_reading.is_private is False
        assert updated_reading.allow_public_sharing is True

        # Test unauthorized update (different user)
        with pytest.raises(InsufficientPermissionsError):
            await service.update_reading(
                reading_id=reading.id,
                user_id="different_user",
                update_data={"accuracy_rating": 1}
            )

    @pytest.mark.asyncio
    async def test_reading_deletion_cascade(
        self,
        db_session,
        test_user
    ):
        """
        測試占卜記錄刪除的級聯處理

        測試情境：
        - 單一記錄刪除
        - 權限驗證
        - 相關資料清理
        - 統計資料更新
        """
        service = ReadingService(db_session)

        # Create test reading
        reading = Reading(
            id="deletable_reading",
            user_id=test_user.id,
            question="刪除測試問題",
            spread_type="single_card",
            cards_drawn=[{"id": "card_1", "name": "測試牌"}],
            interpretation="刪除測試解釋",
            shared_with_users=["user_1", "user_2"]
        )
        db_session.add(reading)
        await db_session.commit()

        # Verify reading exists
        found_reading = await service.get_reading_by_id(reading.id, test_user.id)
        assert found_reading is not None

        # Delete reading
        success = await service.delete_reading(reading.id, test_user.id)
        assert success is True

        # Verify reading is deleted
        with pytest.raises(ValueError):
            await service.get_reading_by_id(reading.id, test_user.id)

        # Test unauthorized deletion
        another_reading = Reading(
            id="another_reading",
            user_id=test_user.id,
            question="另一個測試問題",
            spread_type="single_card",
            cards_drawn=[{"id": "card_1", "name": "測試牌"}],
            interpretation="另一個測試解釋"
        )
        db_session.add(another_reading)
        await db_session.commit()

        with pytest.raises(InsufficientPermissionsError):
            await service.delete_reading(another_reading.id, "unauthorized_user")

    @pytest.mark.asyncio
    async def test_public_readings_access(
        self,
        db_session,
        test_user
    ):
        """
        測試公開占卜記錄的存取

        測試情境：
        - 公開記錄列表查詢
        - 分頁和排序
        - 隱私設定過濾
        - 社群功能整合
        """
        service = ReadingService(db_session)

        # Create mix of public and private readings
        public_reading = Reading(
            id="public_reading",
            user_id=test_user.id,
            question="公開測試問題",
            spread_type="single_card",
            cards_drawn=[{"id": "card_1", "name": "測試牌"}],
            interpretation="公開測試解釋",
            is_private=False,
            allow_public_sharing=True,
            created_at=datetime.utcnow()
        )

        private_reading = Reading(
            id="private_reading",
            user_id=test_user.id,
            question="私人測試問題",
            spread_type="single_card",
            cards_drawn=[{"id": "card_1", "name": "測試牌"}],
            interpretation="私人測試解釋",
            is_private=True,
            allow_public_sharing=False,
            created_at=datetime.utcnow() - timedelta(hours=1)
        )

        db_session.add(public_reading)
        db_session.add(private_reading)
        await db_session.commit()

        # Get public readings
        public_readings = await service.get_public_readings(limit=10, offset=0)

        # Should only include public readings
        public_ids = [reading.id for reading in public_readings]
        assert "public_reading" in public_ids
        assert "private_reading" not in public_ids

        # Verify all returned readings are actually public
        for reading in public_readings:
            assert reading.is_private is False
            assert reading.allow_public_sharing is True

    @pytest.mark.asyncio
    async def test_daily_reading_limit_enforcement(
        self,
        db_session,
        test_user,
        sample_reading_data
    ):
        """
        測試每日占卜限制的執行

        測試情境：
        - 一般用戶限制（20次/日）
        - 進階用戶限制（50次/日）
        - 限制重置機制
        - 錯誤處理
        """
        service = ReadingService(db_session)

        # Set user to maximum daily readings
        test_user.daily_readings_count = 20

        with patch.object(service, '_get_user_with_validation', return_value=test_user):
            # Should raise limit exceeded error
            with pytest.raises(ReadingLimitExceededError):
                await service._check_daily_reading_limit(test_user.id)

        # Test premium user (higher limit)
        test_user.is_premium = True
        test_user.daily_readings_count = 45  # Below premium limit

        with patch.object(service, '_get_user_with_validation', return_value=test_user):
            # Should not raise error
            await service._check_daily_reading_limit(test_user.id)

        # Test premium user at limit
        test_user.daily_readings_count = 50

        with patch.object(service, '_get_user_with_validation', return_value=test_user):
            with pytest.raises(ReadingLimitExceededError):
                await service._check_daily_reading_limit(test_user.id)

    @pytest.mark.asyncio
    async def test_reading_mood_detection(
        self,
        db_session
    ):
        """
        測試問題心情/類別自動偵測

        測試情境：
        - 愛情相關問題偵測
        - 事業相關問題偵測
        - 健康相關問題偵測
        - 財務相關問題偵測
        - 一般問題分類
        """
        service = ReadingService(db_session)

        # Test mood detection
        love_mood = service._detect_question_mood("我和他的關係會如何發展？")
        assert love_mood == "love"

        career_mood = service._detect_question_mood("我的工作前景怎麼樣？")
        assert career_mood == "career"

        health_mood = service._detect_question_mood("我的身體健康狀況如何？")
        assert health_mood == "health"

        financial_mood = service._detect_question_mood("我的瓶蓋收入會增加嗎？")
        assert financial_mood == "financial"

        future_mood = service._detect_question_mood("我的未來會如何？")
        assert future_mood == "future"

        past_mood = service._detect_question_mood("我過去的決定是否正確？")
        assert past_mood == "past"

        general_mood = service._detect_question_mood("今天天氣如何？")
        assert general_mood == "general"

    @pytest.mark.asyncio
    async def test_reading_service_error_handling(
        self,
        db_session,
        sample_reading_data
    ):
        """
        測試 ReadingService 的錯誤處理

        測試情境：
        - 用戶不存在的錯誤
        - 無效的占卜資料
        - 資料庫連線問題
        - 外部服務失敗
        """
        service = ReadingService(db_session)

        # Test user not found
        invalid_reading_data = sample_reading_data.copy()
        invalid_reading_data["user_id"] = "non_existent_user"

        with pytest.raises(UserNotFoundError):
            await service.create_reading(invalid_reading_data)

        # Test invalid reading data
        invalid_data = sample_reading_data.copy()
        invalid_data["num_cards"] = 0  # Invalid number of cards

        # Should handle gracefully or raise appropriate error
        with patch.object(service, '_get_user_with_validation') as mock_get_user:
            mock_user = User(id="test", username="test", email="test@test.com", is_active=True)
            mock_get_user.return_value = mock_user

            with patch.object(service, '_check_daily_reading_limit'):
                with patch.object(service.card_service, 'draw_cards_with_radiation_shuffle', return_value=[]):
                    reading = await service.create_reading(invalid_data)
                    # Should handle empty cards gracefully
                    assert "The wasteland reveals nothing" in reading.interpretation

    @pytest.mark.asyncio
    async def test_voice_trends_analysis(
        self,
        db_session
    ):
        """
        測試角色聲音使用趨勢分析

        測試情境：
        - 角色聲音使用頻率統計
        - 時間趨勢分析
        - 用戶偏好識別
        """
        service = ReadingService(db_session)

        # Create test readings with different voices
        test_readings = [
            Reading(
                user_id="user1",
                character_voice=CharacterVoice.PIP_BOY.value,
                question="測試",
                spread_type="single",
                cards_drawn=[],
                interpretation="測試"
            ),
            Reading(
                user_id="user1",
                character_voice=CharacterVoice.VAULT_DWELLER.value,
                question="測試",
                spread_type="single",
                cards_drawn=[],
                interpretation="測試"
            ),
            Reading(
                user_id="user1",
                character_voice=CharacterVoice.PIP_BOY.value,
                question="測試",
                spread_type="single",
                cards_drawn=[],
                interpretation="測試"
            )
        ]

        # Analyze voice trends
        voice_trends = service._analyze_voice_trends(test_readings)

        assert voice_trends[CharacterVoice.PIP_BOY.value] == 2
        assert voice_trends[CharacterVoice.VAULT_DWELLER.value] == 1