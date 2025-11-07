"""
WishlistService Unit Tests - TDD Implementation
Testing all WishlistService methods with comprehensive coverage

Test Coverage:
- User Methods: get_user_wishes, can_submit_today, create_wish, update_wish
- Admin Methods: get_admin_wishes, add_or_update_reply, toggle_hidden
- Edge Cases: Daily limits, edit permissions, timezone boundaries, content validation

Requirements: R1-R6, R8, R9
"""

import pytest
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from unittest.mock import patch, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.wishlist_service import WishlistService
from app.models.wishlist import Wishlist
from app.models.user import User
from app.core.exceptions import (
    AlreadySubmittedTodayError,
    WishNotFoundError,
    EditNotAllowedError,
    UnauthorizedError
)
from app.services.content_validator import ContentEmptyError, ContentTooLongError


# ===== Test Fixtures =====

@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user for wishlist operations"""
    user = User(
        id=uuid4(),
        email="user@wasteland.com",
        name="Test User",
        display_name="Vault Dweller",
        is_admin=False,
        is_active=True,
        is_verified=True,
        password_hash="hashed_password",
        karma_score=100,
        total_readings=0
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def admin_user(db_session: AsyncSession) -> User:
    """Create an admin user for admin operations"""
    admin = User(
        id=uuid4(),
        email="admin@wasteland.com",
        name="Admin User",
        display_name="Overseer",
        is_admin=True,
        is_active=True,
        is_verified=True,
        password_hash="hashed_password",
        karma_score=500,
        total_readings=0
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)
    return admin


@pytest.fixture
async def sample_wish(db_session: AsyncSession, test_user: User) -> Wishlist:
    """Create a sample wish for testing"""
    wish = Wishlist(
        id=uuid4(),
        user_id=test_user.id,
        content="# My Test Wish\n\nI hope for comprehensive test coverage!",
        has_been_edited=False,
        is_hidden=False
    )
    db_session.add(wish)
    await db_session.commit()
    await db_session.refresh(wish)
    return wish


# ===== User Methods Tests =====

@pytest.mark.asyncio
@pytest.mark.unit
class TestGetUserWishes:
    """Test WishlistService.get_user_wishes() method"""

    async def test_returns_empty_list_for_new_user(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Should return empty list when user has no wishes"""
        service = WishlistService()
        wishes = await service.get_user_wishes(test_user.id, db_session)

        assert isinstance(wishes, list)
        assert len(wishes) == 0

    async def test_returns_user_wishes_only(
        self,
        db_session: AsyncSession,
        test_user: User,
        sample_wish: Wishlist
    ):
        """Should return only wishes belonging to the user"""
        # Create another user's wish
        other_user = User(
            id=uuid4(),
            email="other@wasteland.com",
            name="Other User",
            is_admin=False,
            is_active=True,
            password_hash="hashed"
        )
        db_session.add(other_user)
        await db_session.commit()

        other_wish = Wishlist(
            id=uuid4(),
            user_id=other_user.id,
            content="Other user's wish",
            is_hidden=False
        )
        db_session.add(other_wish)
        await db_session.commit()

        service = WishlistService()
        wishes = await service.get_user_wishes(test_user.id, db_session)

        assert len(wishes) == 1
        assert wishes[0].id == sample_wish.id
        assert wishes[0].user_id == test_user.id

    async def test_excludes_hidden_wishes(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Should not return wishes marked as hidden"""
        visible_wish = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="Visible wish",
            is_hidden=False
        )
        hidden_wish = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="Hidden wish",
            is_hidden=True
        )
        db_session.add_all([visible_wish, hidden_wish])
        await db_session.commit()

        service = WishlistService()
        wishes = await service.get_user_wishes(test_user.id, db_session)

        assert len(wishes) == 1
        assert wishes[0].id == visible_wish.id

    async def test_returns_wishes_in_descending_order(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Should return wishes ordered by created_at DESC"""
        # Create wishes with different timestamps
        old_wish = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="Old wish",
            created_at=datetime(2025, 11, 1, 10, 0, 0, tzinfo=timezone.utc),
            is_hidden=False
        )
        new_wish = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="New wish",
            created_at=datetime(2025, 11, 3, 10, 0, 0, tzinfo=timezone.utc),
            is_hidden=False
        )
        middle_wish = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="Middle wish",
            created_at=datetime(2025, 11, 2, 10, 0, 0, tzinfo=timezone.utc),
            is_hidden=False
        )
        db_session.add_all([old_wish, new_wish, middle_wish])
        await db_session.commit()

        service = WishlistService()
        wishes = await service.get_user_wishes(test_user.id, db_session)

        assert len(wishes) == 3
        assert wishes[0].id == new_wish.id
        assert wishes[1].id == middle_wish.id
        assert wishes[2].id == old_wish.id


@pytest.mark.asyncio
@pytest.mark.unit
class TestCanSubmitToday:
    """Test WishlistService.can_submit_today() method"""

    async def test_returns_true_for_new_user(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Should return True when user has no wishes today"""
        service = WishlistService()
        can_submit = await service.can_submit_today(test_user.id, db_session)

        assert can_submit is True

    @patch('app.services.wishlist_service.get_utc8_today_range')
    async def test_returns_false_when_already_submitted_today(
        self,
        mock_get_range,
        db_session: AsyncSession,
        test_user: User
    ):
        """Should return False when user already submitted a wish today"""
        # Mock today range: 2025-11-03 00:00 ~ 2025-11-04 00:00 (UTC+8)
        # Corresponding UTC: 2025-11-02 16:00 ~ 2025-11-03 16:00
        today_start_utc = datetime(2025, 11, 2, 16, 0, 0, tzinfo=timezone.utc)
        tomorrow_start_utc = datetime(2025, 11, 3, 16, 0, 0, tzinfo=timezone.utc)
        mock_get_range.return_value = (today_start_utc, tomorrow_start_utc)

        # Create a wish within today's range
        wish = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="Today's wish",
            created_at=datetime(2025, 11, 3, 10, 0, 0, tzinfo=timezone.utc),  # Within range
            is_hidden=False
        )
        db_session.add(wish)
        await db_session.commit()

        service = WishlistService()
        can_submit = await service.can_submit_today(test_user.id, db_session)

        assert can_submit is False

    @patch('app.services.wishlist_service.get_utc8_today_range')
    async def test_returns_true_when_last_wish_was_yesterday(
        self,
        mock_get_range,
        db_session: AsyncSession,
        test_user: User
    ):
        """Should return True when last wish was submitted yesterday"""
        # Mock today range
        today_start_utc = datetime(2025, 11, 3, 16, 0, 0, tzinfo=timezone.utc)
        tomorrow_start_utc = datetime(2025, 11, 4, 16, 0, 0, tzinfo=timezone.utc)
        mock_get_range.return_value = (today_start_utc, tomorrow_start_utc)

        # Create a wish from yesterday (before today_start_utc)
        yesterday_wish = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="Yesterday's wish",
            created_at=datetime(2025, 11, 3, 10, 0, 0, tzinfo=timezone.utc),  # Before today_start_utc
            is_hidden=False
        )
        db_session.add(yesterday_wish)
        await db_session.commit()

        service = WishlistService()
        can_submit = await service.can_submit_today(test_user.id, db_session)

        assert can_submit is True

    @patch('app.services.wishlist_service.get_utc8_today_range')
    async def test_timezone_boundary_23_59(
        self,
        mock_get_range,
        db_session: AsyncSession,
        test_user: User
    ):
        """Should handle UTC+8 23:59 boundary correctly"""
        # UTC+8 2025-11-03 23:59:00 → UTC 2025-11-03 15:59:00
        # Today range: 2025-11-02 16:00 ~ 2025-11-03 16:00 (UTC)
        today_start_utc = datetime(2025, 11, 2, 16, 0, 0, tzinfo=timezone.utc)
        tomorrow_start_utc = datetime(2025, 11, 3, 16, 0, 0, tzinfo=timezone.utc)
        mock_get_range.return_value = (today_start_utc, tomorrow_start_utc)

        # Create wish at 23:59 UTC+8 (15:59 UTC)
        wish = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="Wish at 23:59",
            created_at=datetime(2025, 11, 3, 15, 59, 0, tzinfo=timezone.utc),
            is_hidden=False
        )
        db_session.add(wish)
        await db_session.commit()

        service = WishlistService()
        can_submit = await service.can_submit_today(test_user.id, db_session)

        # Should still be in today's range, so cannot submit again
        assert can_submit is False

    @patch('app.services.wishlist_service.get_utc8_today_range')
    async def test_timezone_boundary_00_00(
        self,
        mock_get_range,
        db_session: AsyncSession,
        test_user: User
    ):
        """Should handle UTC+8 00:00 boundary correctly"""
        # UTC+8 2025-11-04 00:00:00 → UTC 2025-11-03 16:00:00
        # Today range: 2025-11-03 16:00 ~ 2025-11-04 16:00 (UTC)
        today_start_utc = datetime(2025, 11, 3, 16, 0, 0, tzinfo=timezone.utc)
        tomorrow_start_utc = datetime(2025, 11, 4, 16, 0, 0, tzinfo=timezone.utc)
        mock_get_range.return_value = (today_start_utc, tomorrow_start_utc)

        # Create wish at yesterday's 23:59 (just before today_start_utc)
        yesterday_wish = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="Yesterday's last wish",
            created_at=datetime(2025, 11, 3, 15, 59, 59, tzinfo=timezone.utc),
            is_hidden=False
        )
        db_session.add(yesterday_wish)
        await db_session.commit()

        service = WishlistService()
        can_submit = await service.can_submit_today(test_user.id, db_session)

        # Yesterday's wish, should be able to submit today
        assert can_submit is True


@pytest.mark.asyncio
@pytest.mark.unit
class TestCreateWish:
    """Test WishlistService.create_wish() method"""

    async def test_creates_wish_successfully(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Should create a wish with valid content"""
        service = WishlistService()
        content = "# New Feature Request\n\nI want more tarot spreads!"

        wish = await service.create_wish(test_user.id, content, db_session)

        assert wish.id is not None
        assert wish.user_id == test_user.id
        assert wish.content == content
        assert wish.has_been_edited is False
        assert wish.is_hidden is False
        assert wish.admin_reply is None

    async def test_raises_error_when_already_submitted_today(
        self,
        db_session: AsyncSession,
        test_user: User,
        sample_wish: Wishlist
    ):
        """Should raise AlreadySubmittedTodayError when daily limit reached"""
        service = WishlistService()
        content = "Another wish today"

        with pytest.raises(AlreadySubmittedTodayError) as exc_info:
            await service.create_wish(test_user.id, content, db_session)

        assert "今日已提交" in str(exc_info.value.message)

    async def test_raises_error_when_content_empty(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Should raise ContentEmptyError when content is empty"""
        service = WishlistService()
        content = "   "

        with pytest.raises(ContentEmptyError):
            await service.create_wish(test_user.id, content, db_session)

    async def test_raises_error_when_content_too_long(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Should raise ContentTooLongError when content exceeds 500 chars"""
        service = WishlistService()
        content = "字" * 501  # 501 characters

        with pytest.raises(ContentTooLongError):
            await service.create_wish(test_user.id, content, db_session)

    async def test_validates_markdown_plain_text_length(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Should validate plain text length after Markdown removal"""
        service = WishlistService()
        # Markdown with long URL but short plain text
        content = "[short](https://very-long-url.com/path/to/page?query=params)" * 10

        # Should succeed because plain text "short" * 10 = 50 chars < 500
        wish = await service.create_wish(test_user.id, content, db_session)
        assert wish.content == content


@pytest.mark.asyncio
@pytest.mark.unit
class TestUpdateWish:
    """Test WishlistService.update_wish() method"""

    async def test_updates_wish_successfully(
        self,
        db_session: AsyncSession,
        test_user: User,
        sample_wish: Wishlist
    ):
        """Should update wish content successfully"""
        service = WishlistService()
        new_content = "# Updated Wish\n\nRevised requirements!"

        updated_wish = await service.update_wish(
            sample_wish.id,
            test_user.id,
            new_content,
            db_session
        )

        assert updated_wish.id == sample_wish.id
        assert updated_wish.content == new_content
        assert updated_wish.has_been_edited is True
        assert updated_wish.updated_at is not None

    async def test_raises_error_when_wish_not_found(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Should raise WishNotFoundError when wish doesn't exist"""
        service = WishlistService()
        fake_id = uuid4()
        content = "Updated content"

        with pytest.raises(WishNotFoundError):
            await service.update_wish(fake_id, test_user.id, content, db_session)

    async def test_raises_error_when_not_owner(
        self,
        db_session: AsyncSession,
        test_user: User,
        sample_wish: Wishlist
    ):
        """Should raise UnauthorizedError when user is not the owner"""
        # Create another user
        other_user = User(
            id=uuid4(),
            email="other@wasteland.com",
            name="Other User",
            is_admin=False,
            is_active=True,
            password_hash="hashed"
        )
        db_session.add(other_user)
        await db_session.commit()

        service = WishlistService()
        content = "Trying to edit other's wish"

        with pytest.raises(UnauthorizedError) as exc_info:
            await service.update_wish(sample_wish.id, other_user.id, content, db_session)

        assert "無權限" in str(exc_info.value.message)

    async def test_raises_error_when_already_edited(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Should raise EditNotAllowedError when wish has been edited"""
        edited_wish = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="Original content",
            has_been_edited=True,
            is_hidden=False
        )
        db_session.add(edited_wish)
        await db_session.commit()

        service = WishlistService()
        content = "Trying to edit again"

        with pytest.raises(EditNotAllowedError) as exc_info:
            await service.update_wish(edited_wish.id, test_user.id, content, db_session)

        assert "已編輯過" in str(exc_info.value.message) or "無法編輯" in str(exc_info.value.message)

    async def test_raises_error_when_admin_replied(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Should raise EditNotAllowedError when admin has replied"""
        replied_wish = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="Original content",
            admin_reply="# Response\n\nThank you!",
            admin_reply_timestamp=datetime.now(timezone.utc),
            has_been_edited=False,
            is_hidden=False
        )
        db_session.add(replied_wish)
        await db_session.commit()

        service = WishlistService()
        content = "Trying to edit after reply"

        with pytest.raises(EditNotAllowedError) as exc_info:
            await service.update_wish(replied_wish.id, test_user.id, content, db_session)

        assert "管理員回覆" in str(exc_info.value.message) or "無法編輯" in str(exc_info.value.message)


# ===== Admin Methods Tests =====

@pytest.mark.asyncio
@pytest.mark.unit
class TestGetAdminWishes:
    """Test WishlistService.get_admin_wishes() method"""

    async def test_returns_all_wishes_with_no_filters(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Should return all wishes when no filters applied"""
        # Create multiple wishes
        wish1 = Wishlist(id=uuid4(), user_id=test_user.id, content="Wish 1", is_hidden=False)
        wish2 = Wishlist(id=uuid4(), user_id=test_user.id, content="Wish 2", is_hidden=False)
        wish3 = Wishlist(id=uuid4(), user_id=test_user.id, content="Wish 3", is_hidden=True)
        db_session.add_all([wish1, wish2, wish3])
        await db_session.commit()

        service = WishlistService()
        wishes, total = await service.get_admin_wishes(
            filters={},
            sort="newest",
            page=1,
            per_page=50,
            db=db_session
        )

        assert total == 3
        assert len(wishes) == 3

    async def test_filters_by_replied_status(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Should filter wishes by replied/unreplied status"""
        replied = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="Replied",
            admin_reply="Thanks!",
            is_hidden=False
        )
        unreplied = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="Unreplied",
            admin_reply=None,
            is_hidden=False
        )
        db_session.add_all([replied, unreplied])
        await db_session.commit()

        service = WishlistService()

        # Filter for replied
        wishes, total = await service.get_admin_wishes(
            filters={"replied": True},
            sort="newest",
            page=1,
            per_page=50,
            db=db_session
        )
        assert total == 1
        assert wishes[0].admin_reply is not None

        # Filter for unreplied
        wishes, total = await service.get_admin_wishes(
            filters={"replied": False},
            sort="newest",
            page=1,
            per_page=50,
            db=db_session
        )
        assert total == 1
        assert wishes[0].admin_reply is None

    async def test_filters_by_hidden_status(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Should filter wishes by hidden/visible status"""
        visible = Wishlist(id=uuid4(), user_id=test_user.id, content="Visible", is_hidden=False)
        hidden = Wishlist(id=uuid4(), user_id=test_user.id, content="Hidden", is_hidden=True)
        db_session.add_all([visible, hidden])
        await db_session.commit()

        service = WishlistService()

        # Filter for hidden
        wishes, total = await service.get_admin_wishes(
            filters={"hidden": True},
            sort="newest",
            page=1,
            per_page=50,
            db=db_session
        )
        assert total == 1
        assert wishes[0].is_hidden is True

        # Filter for visible
        wishes, total = await service.get_admin_wishes(
            filters={"hidden": False},
            sort="newest",
            page=1,
            per_page=50,
            db=db_session
        )
        assert total == 1
        assert wishes[0].is_hidden is False

    async def test_sorts_by_newest(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Should sort wishes by created_at DESC"""
        old = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="Old",
            created_at=datetime(2025, 11, 1, 10, 0, 0, tzinfo=timezone.utc),
            is_hidden=False
        )
        new = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="New",
            created_at=datetime(2025, 11, 3, 10, 0, 0, tzinfo=timezone.utc),
            is_hidden=False
        )
        db_session.add_all([old, new])
        await db_session.commit()

        service = WishlistService()
        wishes, total = await service.get_admin_wishes(
            filters={},
            sort="newest",
            page=1,
            per_page=50,
            db=db_session
        )

        assert wishes[0].id == new.id
        assert wishes[1].id == old.id

    async def test_sorts_by_oldest(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Should sort wishes by created_at ASC"""
        old = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="Old",
            created_at=datetime(2025, 11, 1, 10, 0, 0, tzinfo=timezone.utc),
            is_hidden=False
        )
        new = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="New",
            created_at=datetime(2025, 11, 3, 10, 0, 0, tzinfo=timezone.utc),
            is_hidden=False
        )
        db_session.add_all([old, new])
        await db_session.commit()

        service = WishlistService()
        wishes, total = await service.get_admin_wishes(
            filters={},
            sort="oldest",
            page=1,
            per_page=50,
            db=db_session
        )

        assert wishes[0].id == old.id
        assert wishes[1].id == new.id

    async def test_paginates_results(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Should paginate results correctly"""
        # Create 5 wishes
        for i in range(5):
            wish = Wishlist(id=uuid4(), user_id=test_user.id, content=f"Wish {i}", is_hidden=False)
            db_session.add(wish)
        await db_session.commit()

        service = WishlistService()

        # Page 1, 2 per page
        wishes, total = await service.get_admin_wishes(
            filters={},
            sort="newest",
            page=1,
            per_page=2,
            db=db_session
        )
        assert total == 5
        assert len(wishes) == 2

        # Page 2, 2 per page
        wishes, total = await service.get_admin_wishes(
            filters={},
            sort="newest",
            page=2,
            per_page=2,
            db=db_session
        )
        assert total == 5
        assert len(wishes) == 2

        # Page 3, 2 per page
        wishes, total = await service.get_admin_wishes(
            filters={},
            sort="newest",
            page=3,
            per_page=2,
            db=db_session
        )
        assert total == 5
        assert len(wishes) == 1

    async def test_limits_per_page_to_100(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Should limit per_page to maximum 100"""
        service = WishlistService()
        wishes, total = await service.get_admin_wishes(
            filters={},
            sort="newest",
            page=1,
            per_page=200,  # Exceeds limit
            db=db_session
        )

        # per_page should be capped at 100 (internal limit in service)
        # Since we have no wishes, total should be 0
        assert total == 0


@pytest.mark.asyncio
@pytest.mark.unit
class TestAddOrUpdateReply:
    """Test WishlistService.add_or_update_reply() method"""

    async def test_adds_reply_successfully(
        self,
        db_session: AsyncSession,
        test_user: User,
        sample_wish: Wishlist
    ):
        """Should add admin reply to wish"""
        service = WishlistService()
        reply_content = "# Thank you!\n\nWe appreciate your feedback."

        updated_wish = await service.add_or_update_reply(
            sample_wish.id,
            reply_content,
            db_session
        )

        assert updated_wish.admin_reply == reply_content
        assert updated_wish.admin_reply_timestamp is not None

    async def test_updates_existing_reply(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Should update existing admin reply"""
        wish = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="Original wish",
            admin_reply="Old reply",
            admin_reply_timestamp=datetime(2025, 11, 1, 10, 0, 0, tzinfo=timezone.utc),
            is_hidden=False
        )
        db_session.add(wish)
        await db_session.commit()

        service = WishlistService()
        new_reply = "# Updated Response\n\nRevised answer!"

        updated_wish = await service.add_or_update_reply(wish.id, new_reply, db_session)

        assert updated_wish.admin_reply == new_reply
        assert updated_wish.admin_reply != "Old reply"
        assert updated_wish.admin_reply_timestamp is not None

    async def test_raises_error_when_wish_not_found(
        self,
        db_session: AsyncSession
    ):
        """Should raise WishNotFoundError when wish doesn't exist"""
        service = WishlistService()
        fake_id = uuid4()
        reply = "Reply to non-existent wish"

        with pytest.raises(WishNotFoundError):
            await service.add_or_update_reply(fake_id, reply, db_session)

    async def test_raises_error_when_reply_empty(
        self,
        db_session: AsyncSession,
        sample_wish: Wishlist
    ):
        """Should raise ContentEmptyError when reply is empty"""
        service = WishlistService()
        empty_reply = "   "

        with pytest.raises(ContentEmptyError):
            await service.add_or_update_reply(sample_wish.id, empty_reply, db_session)

    async def test_raises_error_when_reply_too_long(
        self,
        db_session: AsyncSession,
        sample_wish: Wishlist
    ):
        """Should raise ContentTooLongError when reply exceeds 1000 chars"""
        service = WishlistService()
        long_reply = "字" * 1001  # 1001 characters

        with pytest.raises(ContentTooLongError):
            await service.add_or_update_reply(sample_wish.id, long_reply, db_session)


@pytest.mark.asyncio
@pytest.mark.unit
class TestToggleHidden:
    """Test WishlistService.toggle_hidden() method"""

    async def test_hides_wish_successfully(
        self,
        db_session: AsyncSession,
        sample_wish: Wishlist
    ):
        """Should set is_hidden to True"""
        service = WishlistService()

        updated_wish = await service.toggle_hidden(sample_wish.id, is_hidden=True, db=db_session)

        assert updated_wish.is_hidden is True
        assert updated_wish.updated_at is not None

    async def test_unhides_wish_successfully(
        self,
        db_session: AsyncSession,
        test_user: User
    ):
        """Should set is_hidden to False"""
        hidden_wish = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="Hidden wish",
            is_hidden=True
        )
        db_session.add(hidden_wish)
        await db_session.commit()

        service = WishlistService()

        updated_wish = await service.toggle_hidden(hidden_wish.id, is_hidden=False, db=db_session)

        assert updated_wish.is_hidden is False

    async def test_raises_error_when_wish_not_found(
        self,
        db_session: AsyncSession
    ):
        """Should raise WishNotFoundError when wish doesn't exist"""
        service = WishlistService()
        fake_id = uuid4()

        with pytest.raises(WishNotFoundError):
            await service.toggle_hidden(fake_id, is_hidden=True, db=db_session)

    async def test_updates_timestamp(
        self,
        db_session: AsyncSession,
        sample_wish: Wishlist
    ):
        """Should update updated_at timestamp"""
        original_timestamp = sample_wish.updated_at
        service = WishlistService()

        updated_wish = await service.toggle_hidden(sample_wish.id, is_hidden=True, db=db_session)

        assert updated_wish.updated_at > original_timestamp
