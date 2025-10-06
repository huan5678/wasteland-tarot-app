"""
Task 23: 後端單元測試 - Karma 服務測試
測試 Karma 初始化功能
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.karma_service import KarmaService
from app.models.user import User
from app.models.social_features import KarmaHistory, KarmaChangeReason
from app.core.exceptions import UserNotFoundError


class TestKarmaServiceInitialization:
    """測試 KarmaService.initialize_karma_for_user() 方法"""

    @pytest.fixture
    def mock_db(self):
        """創建模擬的資料庫 session"""
        db = AsyncMock(spec=AsyncSession)
        return db

    @pytest.fixture
    def karma_service(self, mock_db):
        """創建 KarmaService 實例"""
        return KarmaService(mock_db)

    @pytest.mark.asyncio
    async def test_initialize_karma_for_new_user(self, karma_service, mock_db):
        """測試為新使用者初始化 Karma"""
        user_id = "test-user-123"

        # Mock user query (user exists, OAuth user)
        mock_user = User(
            id=user_id,
            email="test@example.com",
            oauth_provider="google",
            oauth_id="google-123",
            karma_score=0,
            faction_alignment="neutral"
        )

        # Mock karma history query (no existing history)
        mock_execute_result = MagicMock()
        mock_execute_result.scalar_one_or_none.return_value = None

        mock_db.execute.return_value = mock_execute_result
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        # Mock _get_user_with_validation
        with patch.object(karma_service, '_get_user_with_validation', return_value=mock_user):
            result = await karma_service.initialize_karma_for_user(user_id)

        # Verify karma initialized to 50
        assert mock_user.karma_score == 50

        # Verify karma history record was created
        assert mock_db.add.called
        karma_history_arg = mock_db.add.call_args[0][0]
        assert isinstance(karma_history_arg, KarmaHistory)
        assert karma_history_arg.user_id == user_id
        assert karma_history_arg.karma_before == 0
        assert karma_history_arg.karma_after == 50
        assert karma_history_arg.karma_change == 50
        assert karma_history_arg.reason == KarmaChangeReason.SYSTEM_INITIALIZATION.value
        assert karma_history_arg.reason_description == "使用者 Karma 系統初始化"

        # Verify OAuth user tracked in action_context
        assert karma_history_arg.action_context["is_oauth_user"] is True

        # Verify database operations
        assert mock_db.commit.called
        assert mock_db.refresh.called

    @pytest.mark.asyncio
    async def test_initialize_karma_for_traditional_user(self, karma_service, mock_db):
        """測試為傳統註冊使用者初始化 Karma"""
        user_id = "traditional-user-456"

        # Mock user query (traditional user, no OAuth)
        mock_user = User(
            id=user_id,
            email="traditional@example.com",
            oauth_provider=None,
            oauth_id=None,
            karma_score=0,
            faction_alignment="neutral"
        )

        # Mock karma history query (no existing history)
        mock_execute_result = MagicMock()
        mock_execute_result.scalar_one_or_none.return_value = None

        mock_db.execute.return_value = mock_execute_result
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        with patch.object(karma_service, '_get_user_with_validation', return_value=mock_user):
            result = await karma_service.initialize_karma_for_user(user_id)

        # Verify karma initialized to 50
        assert mock_user.karma_score == 50

        # Verify traditional user tracked in action_context
        karma_history_arg = mock_db.add.call_args[0][0]
        assert karma_history_arg.action_context["is_oauth_user"] is False

    @pytest.mark.asyncio
    async def test_initialize_karma_duplicate_prevention(self, karma_service, mock_db):
        """測試重複初始化防護（已初始化則返回 None）"""
        user_id = "existing-user-789"

        # Mock user query
        mock_user = User(
            id=user_id,
            email="existing@example.com",
            karma_score=75,
            faction_alignment="neutral"
        )

        # Mock karma history query (already has history)
        existing_history = KarmaHistory(
            user_id=user_id,
            karma_before=0,
            karma_after=50,
            karma_change=50,
            reason=KarmaChangeReason.SYSTEM_INITIALIZATION.value
        )
        mock_execute_result = MagicMock()
        mock_execute_result.scalar_one_or_none.return_value = existing_history

        mock_db.execute.return_value = mock_execute_result

        with patch.object(karma_service, '_get_user_with_validation', return_value=mock_user):
            result = await karma_service.initialize_karma_for_user(user_id)

        # Verify returns None (no initialization)
        assert result is None

        # Verify no database writes
        assert not mock_db.add.called
        assert not mock_db.commit.called

    @pytest.mark.asyncio
    async def test_initialize_karma_with_initial_score_50(self, karma_service, mock_db):
        """測試初始 Karma 分數為 50"""
        user_id = "new-user-abc"

        mock_user = User(
            id=user_id,
            email="new@example.com",
            karma_score=0,
            faction_alignment="neutral"
        )

        mock_execute_result = MagicMock()
        mock_execute_result.scalar_one_or_none.return_value = None

        mock_db.execute.return_value = mock_execute_result
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        with patch.object(karma_service, '_get_user_with_validation', return_value=mock_user):
            result = await karma_service.initialize_karma_for_user(user_id)

        # Verify initial karma is exactly 50
        assert mock_user.karma_score == 50

        karma_history_arg = mock_db.add.call_args[0][0]
        assert karma_history_arg.karma_after == 50
        assert karma_history_arg.karma_change == 50
        assert karma_history_arg.alignment_before == "neutral"
        assert karma_history_arg.alignment_after == "neutral"

    @pytest.mark.asyncio
    async def test_initialize_karma_automated_change_flag(self, karma_service, mock_db):
        """測試自動化變更標記"""
        user_id = "auto-user-def"

        mock_user = User(
            id=user_id,
            email="auto@example.com",
            karma_score=0,
            faction_alignment="neutral"
        )

        mock_execute_result = MagicMock()
        mock_execute_result.scalar_one_or_none.return_value = None

        mock_db.execute.return_value = mock_execute_result
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        with patch.object(karma_service, '_get_user_with_validation', return_value=mock_user):
            result = await karma_service.initialize_karma_for_user(user_id)

        karma_history_arg = mock_db.add.call_args[0][0]

        # Verify automated flags
        assert karma_history_arg.automated_change is True
        assert karma_history_arg.is_verified is True
        assert karma_history_arg.confidence_score == 1.0
        assert karma_history_arg.alignment_changed is False
        assert karma_history_arg.significant_threshold_crossed is False

    @pytest.mark.asyncio
    async def test_initialize_karma_user_not_found(self, karma_service, mock_db):
        """測試使用者不存在時拋出 UserNotFoundError"""
        user_id = "nonexistent-user-123"

        # Mock _get_user_with_validation raises UserNotFoundError
        with patch.object(
            karma_service,
            '_get_user_with_validation',
            side_effect=UserNotFoundError(user_id=user_id)
        ):
            with pytest.raises(UserNotFoundError):
                await karma_service.initialize_karma_for_user(user_id)

        # Verify no database writes
        assert not mock_db.add.called
        assert not mock_db.commit.called

    @pytest.mark.asyncio
    async def test_initialize_karma_triggered_by_action(self, karma_service, mock_db):
        """測試 triggered_by_action 記錄為 'user_registration'"""
        user_id = "registration-user-ghi"

        mock_user = User(
            id=user_id,
            email="registration@example.com",
            karma_score=0,
            faction_alignment="neutral"
        )

        mock_execute_result = MagicMock()
        mock_execute_result.scalar_one_or_none.return_value = None

        mock_db.execute.return_value = mock_execute_result
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        with patch.object(karma_service, '_get_user_with_validation', return_value=mock_user):
            result = await karma_service.initialize_karma_for_user(user_id)

        karma_history_arg = mock_db.add.call_args[0][0]
        assert karma_history_arg.triggered_by_action == "user_registration"

    @pytest.mark.asyncio
    async def test_initialize_karma_faction_influence(self, karma_service, mock_db):
        """測試 faction_influence 記錄使用者的 faction_alignment"""
        user_id = "faction-user-jkl"

        # User with specific faction
        mock_user = User(
            id=user_id,
            email="faction@example.com",
            karma_score=0,
            faction_alignment="brotherhood_of_steel"
        )

        mock_execute_result = MagicMock()
        mock_execute_result.scalar_one_or_none.return_value = None

        mock_db.execute.return_value = mock_execute_result
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        with patch.object(karma_service, '_get_user_with_validation', return_value=mock_user):
            result = await karma_service.initialize_karma_for_user(user_id)

        karma_history_arg = mock_db.add.call_args[0][0]
        assert karma_history_arg.faction_influence == "brotherhood_of_steel"
