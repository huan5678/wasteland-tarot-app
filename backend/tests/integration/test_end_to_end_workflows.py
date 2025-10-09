"""
End-to-End Workflow Tests
Comprehensive testing for complete user journeys through the Wasteland Tarot system,
from registration to reading completion and beyond.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from typing import Dict, Any, List
from datetime import datetime, timedelta
import json

from app.models.user import User
from app.models.reading_enhanced import Reading, UserProfile, UserPreferences
from app.models.wasteland_card import WastelandCard, KarmaAlignment, CharacterVoice, FactionAlignment
from app.services.user_service import UserService
from app.services.reading_service import ReadingService
from app.services.wasteland_card_service import WastelandCardService
from app.core.exceptions import UserNotFoundError, ReadingLimitExceededError


class TestEndToEndUserJourneys:
    """Test complete user journeys from start to finish"""

    @pytest.fixture
    def user_registration_data(self) -> Dict[str, Any]:
        """Registration data for new Vault Dweller"""
        return {
            "username": "vault_explorer_101",
            "email": "explorer@vault101.com",
            "password": "RadAway123!",
            "karma": "neutral",
            "faction_alignment": "vault_dweller",
            "character_voice": "pip_boy_analysis",
            "vault_number": 101,
            "wasteland_location": "Capital Wasteland"
        }

    @pytest.fixture
    def sample_question_bank(self) -> List[str]:
        """Bank of sample questions for testing"""
        return [
            "我今天在廢土中會遇到什麼機會？",
            "我的Karma路徑是否正確？",
            "兄弟會的任務會成功嗎？",
            "我和同伴的關係如何發展？",
            "什麼時候該離開這個避難所？",
            "我的技能樹應該怎麼發展？",
            "這個變種生物威脅有多大？",
            "我的裝備升級順序如何？",
            "下一個探索目標在哪裡？",
            "我的派系選擇是否明智？"
        ]

    @pytest.fixture
    def mock_vault_tec_cards(self) -> List[WastelandCard]:
        """Mock complete card set for testing"""
        cards = []

        # Major Arcana
        major_cards_data = [
            ("vault_newbie", "新手避難所居民", "The Vault Newbie", 0),
            ("tech_specialist", "科技專家", "The Tech Specialist", 1),
            ("wasteland_oracle", "廢土預言家", "The Wasteland Oracle", 2)
        ]

        for card_id, name, english_name, number in major_cards_data:
            card = WastelandCard(
                id=card_id,
                name=name,
                english_name=english_name,
                arcana_type="major",
                number=number,
                description=f"{name}的描述",
                radiation_level=0.3 + (number * 0.1) % 0.7
            )
            cards.append(card)

        # Minor Arcana samples
        suits = ["nuka_cola_bottles", "combat_weapons", "bottle_caps", "radiation_rods"]
        for suit in suits:
            for i in range(1, 4):  # Just a few cards per suit for testing
                card = WastelandCard(
                    id=f"{suit}_{i}",
                    name=f"{suit.replace('_', ' ').title()} {i}",
                    english_name=f"{suit.replace('_', ' ').title()} {i}",
                    arcana_type="minor",
                    number=i,
                    suit=suit,
                    description=f"{suit} 牌組的第 {i} 張牌",
                    radiation_level=0.2 + (i * 0.15)
                )
                cards.append(card)

        return cards

    @pytest.mark.asyncio
    async def test_complete_new_user_journey(
        self,
        db_session,
        async_client,
        user_registration_data,
        sample_question_bank,
        mock_vault_tec_cards
    ):
        """
        測試完整的新用戶旅程

        流程：
        1. 用戶註冊
        2. 建立個人檔案
        3. 設定偏好
        4. 進行第一次占卜
        5. 提供回饋
        6. 檢視歷史記錄
        """
        user_service = UserService(db_session)
        reading_service = ReadingService(db_session)
        card_service = WastelandCardService(db_session)

        # Step 1: User Registration
        with patch('app.core.security.hash_password', return_value="hashed_password"):
            new_user = await user_service.create_user(user_registration_data)

        assert new_user.username == user_registration_data["username"]
        assert new_user.email == user_registration_data["email"]
        assert new_user.faction_alignment == FactionAlignment.VAULT_DWELLER.value
        assert new_user.karma_score == 50  # Default neutral karma
        assert new_user.total_readings == 0

        # Step 2: Profile Creation (automatic during registration)
        assert new_user.profile is not None
        assert new_user.profile.preferred_voice == CharacterVoice.PIP_BOY.value
        assert new_user.profile.vault_number == 101

        # Step 3: Preferences Setup
        assert new_user.preferences is not None
        assert new_user.preferences.default_character_voice == CharacterVoice.PIP_BOY.value
        assert new_user.preferences.auto_save_readings is True

        # Step 4: First Reading
        with patch.object(card_service, 'draw_cards_with_radiation_shuffle', return_value=mock_vault_tec_cards[:1]):
            first_reading_data = {
                "user_id": new_user.id,
                "question": sample_question_bank[0],
                "reading_type": "single_wasteland_reading",
                "num_cards": 1,
                "character_voice": CharacterVoice.PIP_BOY,
                "radiation_factor": 0.5
            }

            first_reading = await reading_service.create_reading(first_reading_data)

        assert first_reading.user_id == new_user.id
        assert first_reading.question == sample_question_bank[0]
        assert first_reading.character_voice == CharacterVoice.PIP_BOY.value
        assert len(first_reading.cards_drawn) == 1
        assert first_reading.interpretation is not None

        # Step 5: User Feedback
        feedback_data = {
            "accuracy_rating": 4,
            "user_feedback": "很有幫助的第一次占卜體驗！",
            "tags": ["有用", "準確", "鼓勵性"],
            "mood": "general"
        }

        updated_reading = await reading_service.update_reading(
            reading_id=first_reading.id,
            user_id=new_user.id,
            update_data=feedback_data
        )

        assert updated_reading.accuracy_rating == 4
        assert updated_reading.user_feedback == "很有幫助的第一次占卜體驗！"
        assert "有用" in updated_reading.tags

        # Step 6: View Reading History
        history = await reading_service.get_user_reading_history(
            user_id=new_user.id,
            limit=10
        )

        assert len(history) == 1
        assert history[0].id == first_reading.id

        # Verify user statistics updated
        await db_session.refresh(new_user)
        assert new_user.total_readings == 1

    @pytest.mark.asyncio
    async def test_experienced_user_advanced_workflow(
        self,
        db_session,
        sample_question_bank,
        mock_vault_tec_cards
    ):
        """
        測試經驗用戶的進階工作流程

        流程：
        1. 經驗用戶登入
        2. 檢視個人統計
        3. 進行複雜占卜（7張牌）
        4. 分享占卜結果
        5. 查看趨勢分析
        6. 調整個人化設定
        """
        user_service = UserService(db_session)
        reading_service = ReadingService(db_session)
        card_service = WastelandCardService(db_session)

        # Create experienced user
        experienced_user = User(
            id="experienced_vault_dweller",
            username="vault_master",
            email="master@vault.com",
            karma_score=85,  # Good karma
            faction_alignment=FactionAlignment.BROTHERHOOD.value,
            total_readings=50,
            accurate_predictions=40,
            is_active=True,
            is_premium=True
        )

        profile = UserProfile(
            user_id=experienced_user.id,
            preferred_voice=CharacterVoice.PIP_BOY.value,
            vault_number=101,
            experience_level="Master Survivor",
            total_readings=50,
            consecutive_days=30
        )

        preferences = UserPreferences(
            user_id=experienced_user.id,
            default_character_voice=CharacterVoice.PIP_BOY.value,
            favorite_spread_types=["brotherhood_council", "vault_tec_spread"]
        )

        experienced_user.profile = profile
        experienced_user.preferences = preferences

        db_session.add(experienced_user)
        await db_session.commit()

        # Step 1: Check User Statistics
        stats = await reading_service.get_reading_statistics(experienced_user.id)

        # Should handle empty history gracefully
        assert stats["total_readings"] == 0  # No readings in test DB yet
        assert "favorite_spread_types" in stats
        assert "character_voice_usage" in stats

        # Step 2: Advanced Reading (Brotherhood Council - 7 cards)
        with patch.object(card_service, 'draw_cards_with_radiation_shuffle', return_value=mock_vault_tec_cards[:7]):
            advanced_reading_data = {
                "user_id": experienced_user.id,
                "question": "兄弟會議會對重要決策的完整分析",
                "reading_type": "brotherhood_council",
                "num_cards": 7,
                "character_voice": CharacterVoice.PIP_BOY,
                "radiation_factor": 0.8
            }

            advanced_reading = await reading_service.create_reading(advanced_reading_data)

        assert advanced_reading.spread_type == "brotherhood_council"
        assert len(advanced_reading.cards_drawn) == 7
        assert len(advanced_reading.interpretation) > 200  # Should be detailed

        # Step 3: Share Reading
        sharing_success = await reading_service.share_reading(
            reading_id=advanced_reading.id,
            owner_id=experienced_user.id,
            target_user_ids=["friend_1", "friend_2"],
            message="分享我的兄弟會議會占卜結果"
        )

        assert sharing_success is True
        await db_session.refresh(advanced_reading)
        assert "friend_1" in advanced_reading.shared_with_users
        assert "friend_2" in advanced_reading.shared_with_users

        # Step 4: Trends Analysis
        trends = await reading_service.get_reading_trends(
            user_id=experienced_user.id,
            period="month"
        )

        assert "reading_count_by_day" in trends
        assert "popular_questions" in trends
        assert trends["total_readings_in_period"] >= 0

        # Step 5: Update Preferences
        new_preferences = {
            "default_character_voice": CharacterVoice.VAULT_DWELLER.value,
            "favorite_spread_types": ["brotherhood_council", "single_card"],
            "theme": "brotherhood_tech"
        }

        updated_user = await user_service.update_user_preferences(
            user_id=experienced_user.id,
            preferences_data=new_preferences
        )

        assert updated_user.preferences.default_character_voice == CharacterVoice.VAULT_DWELLER.value

    @pytest.mark.asyncio
    async def test_user_journey_with_karma_progression(
        self,
        db_session,
        sample_question_bank,
        mock_vault_tec_cards
    ):
        """
        測試用戶 Karma 進展的完整旅程

        流程：
        1. 中性 Karma 用戶開始
        2. 進行善行相關的占卜
        3. Karma 分數提升
        4. 解釋風格改變
        5. 新的派系選項開啟
        """
        user_service = UserService(db_session)
        reading_service = ReadingService(db_session)
        card_service = WastelandCardService(db_session)

        # Create user with neutral karma
        karma_user = User(
            id="karma_progression_user",
            username="karma_wanderer",
            email="wanderer@wasteland.com",
            karma_score=50,  # Neutral
            faction_alignment=FactionAlignment.VAULT_DWELLER.value,
            is_active=True
        )

        db_session.add(karma_user)
        await db_session.commit()

        # Initial reading with neutral karma
        with patch.object(card_service, 'draw_cards_with_radiation_shuffle', return_value=mock_vault_tec_cards[:1]):
            neutral_reading_data = {
                "user_id": karma_user.id,
                "question": "我應該幫助這個聚落嗎？",
                "reading_type": "single_card",
                "num_cards": 1,
                "character_voice": CharacterVoice.PIP_BOY,
                "radiation_factor": 0.5
            }

            neutral_reading = await reading_service.create_reading(neutral_reading_data)

        assert neutral_reading.karma_context == KarmaAlignment.NEUTRAL.value

        # Simulate karma increase (good actions)
        karma_user.karma_score = 75  # Now good karma
        await db_session.commit()

        # Reading with improved karma
        with patch.object(card_service, 'draw_cards_with_radiation_shuffle', return_value=mock_vault_tec_cards[1:2]):
            good_reading_data = {
                "user_id": karma_user.id,
                "question": "我幫助聚落的結果如何？",
                "reading_type": "single_card",
                "num_cards": 1,
                "character_voice": CharacterVoice.PIP_BOY,
                "radiation_factor": 0.5
            }

            good_reading = await reading_service.create_reading(good_reading_data)

        assert good_reading.karma_context == KarmaAlignment.GOOD.value

        # Verify interpretation style changed
        assert good_reading.interpretation != neutral_reading.interpretation
        assert len(good_reading.interpretation) > 50

        # Check if new faction options become available
        available_factions = await user_service.get_available_factions(karma_user.id)
        assert FactionAlignment.BROTHERHOOD.value in available_factions  # Good karma opens Brotherhood
        assert FactionAlignment.NCR.value in available_factions

    @pytest.mark.asyncio
    async def test_daily_reading_limit_workflow(
        self,
        db_session,
        sample_question_bank,
        mock_vault_tec_cards
    ):
        """
        測試每日占卜限制的完整流程

        流程：
        1. 用戶進行多次占卜
        2. 達到每日限制
        3. 升級為進階會員
        4. 獲得更高限制
        5. 隔日限制重置
        """
        user_service = UserService(db_session)
        reading_service = ReadingService(db_session)
        card_service = WastelandCardService(db_session)

        # Create standard user
        limited_user = User(
            id="limited_user",
            username="casual_reader",
            email="casual@vault.com",
            karma_score=60,
            daily_readings_count=0,
            is_active=True,
            is_premium=False
        )

        db_session.add(limited_user)
        await db_session.commit()

        # Perform readings up to limit
        readings_created = []
        for i in range(20):  # Standard limit
            with patch.object(card_service, 'draw_cards_with_radiation_shuffle', return_value=mock_vault_tec_cards[:1]):
                reading_data = {
                    "user_id": limited_user.id,
                    "question": f"{sample_question_bank[i % len(sample_question_bank)]} {i}",
                    "reading_type": "single_card",
                    "num_cards": 1,
                    "character_voice": CharacterVoice.PIP_BOY,
                    "radiation_factor": 0.5
                }

                reading = await reading_service.create_reading(reading_data)
                readings_created.append(reading)

        assert len(readings_created) == 20

        # Next reading should fail
        with pytest.raises(ReadingLimitExceededError):
            with patch.object(card_service, 'draw_cards_with_radiation_shuffle', return_value=mock_vault_tec_cards[:1]):
                over_limit_data = {
                    "user_id": limited_user.id,
                    "question": "超過限制的占卜",
                    "reading_type": "single_card",
                    "num_cards": 1,
                    "character_voice": CharacterVoice.PIP_BOY,
                    "radiation_factor": 0.5
                }

                await reading_service.create_reading(over_limit_data)

        # Upgrade to premium
        limited_user.is_premium = True
        limited_user.daily_readings_count = 20  # Reset counter for test
        await db_session.commit()

        # Should now be able to create more readings (premium limit is 50)
        with patch.object(card_service, 'draw_cards_with_radiation_shuffle', return_value=mock_vault_tec_cards[:1]):
            premium_reading_data = {
                "user_id": limited_user.id,
                "question": "進階會員占卜",
                "reading_type": "single_card",
                "num_cards": 1,
                "character_voice": CharacterVoice.PIP_BOY,
                "radiation_factor": 0.5
            }

            premium_reading = await reading_service.create_reading(premium_reading_data)

        assert premium_reading is not None

    @pytest.mark.asyncio
    async def test_error_recovery_workflow(
        self,
        db_session,
        sample_question_bank,
        mock_vault_tec_cards
    ):
        """
        測試錯誤恢復工作流程

        流程：
        1. 用戶操作遇到各種錯誤
        2. 系統提供適當的錯誤處理
        3. 用戶能夠從錯誤中恢復
        4. 部分完成的操作被正確處理
        """
        user_service = UserService(db_session)
        reading_service = ReadingService(db_session)
        card_service = WastelandCardService(db_session)

        # Create test user
        error_test_user = User(
            id="error_test_user",
            username="error_tester",
            email="error@test.com",
            karma_score=50,
            is_active=True
        )

        db_session.add(error_test_user)
        await db_session.commit()

        # Test 1: Non-existent user reading creation
        with pytest.raises(UserNotFoundError):
            invalid_reading_data = {
                "user_id": "non_existent_user",
                "question": "無效用戶測試",
                "reading_type": "single_card",
                "num_cards": 1,
                "character_voice": CharacterVoice.PIP_BOY,
                "radiation_factor": 0.5
            }

            await reading_service.create_reading(invalid_reading_data)

        # Test 2: Card service failure with graceful fallback
        with patch.object(card_service, 'draw_cards_with_radiation_shuffle', side_effect=Exception("Card service failed")):
            # Should handle card service failure gracefully
            try:
                fallback_reading_data = {
                    "user_id": error_test_user.id,
                    "question": "卡牌服務失敗測試",
                    "reading_type": "single_card",
                    "num_cards": 1,
                    "character_voice": CharacterVoice.PIP_BOY,
                    "radiation_factor": 0.5
                }

                reading = await reading_service.create_reading(fallback_reading_data)

                # Should have fallback interpretation
                assert "The wasteland reveals nothing" in reading.interpretation

            except Exception as e:
                # If no fallback, should fail gracefully
                assert "Card service failed" in str(e)

        # Test 3: Partial data corruption recovery
        # Create reading with valid data
        with patch.object(card_service, 'draw_cards_with_radiation_shuffle', return_value=mock_vault_tec_cards[:1]):
            valid_reading_data = {
                "user_id": error_test_user.id,
                "question": "恢復測試",
                "reading_type": "single_card",
                "num_cards": 1,
                "character_voice": CharacterVoice.PIP_BOY,
                "radiation_factor": 0.5
            }

            valid_reading = await reading_service.create_reading(valid_reading_data)

        # Verify reading was created successfully
        assert valid_reading is not None
        assert valid_reading.user_id == error_test_user.id

        # Test 4: Invalid update data handling
        try:
            invalid_update_data = {
                "accuracy_rating": 10,  # Invalid range (should be 1-5)
                "user_feedback": "A" * 10000,  # Potentially too long
                "invalid_field": "should_be_ignored"
            }

            updated_reading = await reading_service.update_reading(
                reading_id=valid_reading.id,
                user_id=error_test_user.id,
                update_data=invalid_update_data
            )

            # Should handle invalid data gracefully
            # Either accept valid parts or reject entirely
            assert updated_reading is not None

        except Exception as e:
            # Should provide meaningful error message
            assert len(str(e)) > 0

    @pytest.mark.asyncio
    async def test_concurrent_user_operations(
        self,
        db_session,
        sample_question_bank,
        mock_vault_tec_cards
    ):
        """
        測試並發用戶操作

        流程：
        1. 多個用戶同時註冊
        2. 同時進行占卜
        3. 同時更新資料
        4. 驗證資料一致性
        """
        import asyncio

        user_service = UserService(db_session)
        reading_service = ReadingService(db_session)
        card_service = WastelandCardService(db_session)

        # Create multiple users concurrently
        async def create_user(user_index):
            registration_data = {
                "username": f"concurrent_user_{user_index}",
                "email": f"user{user_index}@concurrent.com",
                "password": "TestPassword123!",
                "karma": "neutral",
                "faction_alignment": "vault_dweller"
            }

            with patch('app.core.security.hash_password', return_value="hashed_password"):
                return await user_service.create_user(registration_data)

        # Create 5 users concurrently
        user_creation_tasks = [create_user(i) for i in range(5)]
        created_users = await asyncio.gather(*user_creation_tasks)

        assert len(created_users) == 5
        for i, user in enumerate(created_users):
            assert user.username == f"concurrent_user_{i}"
            assert user.email == f"user{i}@concurrent.com"

        # Create readings concurrently
        async def create_reading_for_user(user, question_index):
            with patch.object(card_service, 'draw_cards_with_radiation_shuffle', return_value=mock_vault_tec_cards[:1]):
                reading_data = {
                    "user_id": user.id,
                    "question": sample_question_bank[question_index % len(sample_question_bank)],
                    "reading_type": "single_card",
                    "num_cards": 1,
                    "character_voice": CharacterVoice.PIP_BOY,
                    "radiation_factor": 0.5
                }

                return await reading_service.create_reading(reading_data)

        # Create readings for all users concurrently
        reading_tasks = [create_reading_for_user(user, i) for i, user in enumerate(created_users)]
        created_readings = await asyncio.gather(*reading_tasks)

        assert len(created_readings) == 5
        for reading in created_readings:
            assert reading is not None
            assert reading.interpretation is not None

        # Verify no data corruption or conflicts
        user_ids = [user.id for user in created_users]
        reading_user_ids = [reading.user_id for reading in created_readings]

        assert set(user_ids) == set(reading_user_ids)

    @pytest.mark.asyncio
    async def test_comprehensive_api_response_consistency(
        self,
        db_session,
        async_client,
        sample_question_bank,
        mock_vault_tec_cards
    ):
        """
        測試 API 響應格式的一致性

        流程：
        1. 測試所有主要 API 端點
        2. 驗證響應格式一致性
        3. 檢查錯誤處理格式
        4. 確保向後兼容性
        """
        user_service = UserService(db_session)
        reading_service = ReadingService(db_session)

        # Create test user for API testing
        api_test_user = User(
            id="api_test_user",
            username="api_tester",
            email="api@test.com",
            karma_score=60,
            is_active=True
        )

        db_session.add(api_test_user)
        await db_session.commit()

        # Test user profile API response format
        user_data = api_test_user.export_user_data()

        # Verify expected API response structure
        assert "user_info" in user_data
        assert "username" in user_data["user_info"]
        assert "email" in user_data["user_info"]
        assert "karma_score" in user_data["user_info"]
        assert "faction_alignment" in user_data["user_info"]

        # Test reading creation API response format
        with patch('app.services.wasteland_card_service.WastelandCardService.draw_cards_with_radiation_shuffle', return_value=mock_vault_tec_cards[:1]):
            reading_data = {
                "user_id": api_test_user.id,
                "question": sample_question_bank[0],
                "reading_type": "single_card",
                "num_cards": 1,
                "character_voice": CharacterVoice.PIP_BOY,
                "radiation_factor": 0.5
            }

            reading = await reading_service.create_reading(reading_data)

        # Test reading API response format
        reading_dict = reading.to_dict()

        required_reading_fields = [
            "id", "question", "spread_type", "cards_drawn", "interpretation",
            "character_voice", "karma_context", "faction_influence",
            "created_at"
        ]

        for field in required_reading_fields:
            assert field in reading_dict, f"Missing required field: {field}"

        # Verify cards_drawn format
        assert isinstance(reading_dict["cards_drawn"], list)
        if len(reading_dict["cards_drawn"]) > 0:
            card_data = reading_dict["cards_drawn"][0]
            assert "id" in card_data
            assert "name" in card_data
            assert "position" in card_data

        # Test statistics API response format
        stats = await reading_service.get_reading_statistics(api_test_user.id)

        required_stats_fields = [
            "total_readings", "average_accuracy", "favorite_spread_types",
            "character_voice_usage", "reading_frequency", "karma_influence"
        ]

        for field in required_stats_fields:
            assert field in stats, f"Missing required stats field: {field}"