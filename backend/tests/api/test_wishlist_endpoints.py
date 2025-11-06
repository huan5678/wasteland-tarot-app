"""
Wishlist API Endpoints Tests - TDD Implementation
Testing all 7 wishlist endpoints (3 user + 4 admin)
"""

import pytest
from typing import Dict, Any
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4
from datetime import datetime

from app.models.user import User
from app.models.wishlist import Wishlist
from app.core.security import create_access_token


# ===== Test Fixtures =====

@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user"""
    user = User(
        id=uuid4(),
        email="user@vault101.com",
        name="Test User",
        display_name="Vault Dweller",
        is_admin=False,
        is_active=True,
        is_verified=True,
        hashed_password="hashed_password",
        karma_score=100,
        total_readings=0
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def admin_user(db_session: AsyncSession) -> User:
    """Create an admin user"""
    admin = User(
        id=uuid4(),
        email="admin@vault101.com",
        name="Admin User",
        display_name="Overseer",
        is_admin=True,
        is_active=True,
        is_verified=True,
        hashed_password="hashed_password",
        karma_score=500,
        total_readings=0
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)
    return admin


@pytest.fixture
def user_auth_headers(test_user: User) -> Dict[str, str]:
    """Generate auth headers for test user"""
    token = create_access_token(data={"sub": test_user.email, "user_id": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_auth_headers(admin_user: User) -> Dict[str, str]:
    """Generate auth headers for admin user"""
    token = create_access_token(data={"sub": admin_user.email, "user_id": str(admin_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def sample_wish(db_session: AsyncSession, test_user: User) -> Wishlist:
    """Create a sample wish for testing"""
    wish = Wishlist(
        id=uuid4(),
        user_id=test_user.id,
        content="# My First Wish\n\nI hope for more tarot spreads!",
        has_been_edited=False,
        is_hidden=False
    )
    db_session.add(wish)
    await db_session.commit()
    await db_session.refresh(wish)
    return wish


# ===== User Endpoints Tests (Task 3.1) =====

@pytest.mark.asyncio
@pytest.mark.api
class TestUserWishlistEndpoints:
    """Test user-facing wishlist endpoints (GET, POST, PUT /api/v1/wishlist)"""

    async def test_get_user_wishes_empty(
        self,
        async_client: AsyncClient,
        user_auth_headers: Dict[str, str]
    ):
        """Test GET /api/v1/wishlist - empty list"""
        response = await async_client.get(
            "/api/v1/wishlist",
            headers=user_auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    async def test_get_user_wishes_with_data(
        self,
        async_client: AsyncClient,
        user_auth_headers: Dict[str, str],
        sample_wish: Wishlist
    ):
        """Test GET /api/v1/wishlist - with existing wishes"""
        response = await async_client.get(
            "/api/v1/wishlist",
            headers=user_auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["id"] == str(sample_wish.id)
        assert data[0]["content"] == sample_wish.content
        assert data[0]["has_been_edited"] is False
        assert data[0]["admin_reply"] is None

    async def test_get_user_wishes_hides_hidden(
        self,
        async_client: AsyncClient,
        user_auth_headers: Dict[str, str],
        db_session: AsyncSession,
        test_user: User
    ):
        """Test GET /api/v1/wishlist - hides hidden wishes"""
        # Create visible wish
        visible_wish = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="Visible wish",
            is_hidden=False
        )
        # Create hidden wish
        hidden_wish = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="Hidden wish",
            is_hidden=True
        )
        db_session.add_all([visible_wish, hidden_wish])
        await db_session.commit()

        response = await async_client.get(
            "/api/v1/wishlist",
            headers=user_auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == str(visible_wish.id)

    async def test_create_wish_success(
        self,
        async_client: AsyncClient,
        user_auth_headers: Dict[str, str]
    ):
        """Test POST /api/v1/wishlist - successful creation"""
        wish_data = {
            "content": "# Feature Request\n\nI want more **tarot spreads**!"
        }

        response = await async_client.post(
            "/api/v1/wishlist",
            json=wish_data,
            headers=user_auth_headers
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "id" in data
        assert data["content"] == wish_data["content"]
        assert data["has_been_edited"] is False
        assert data["admin_reply"] is None
        assert data["is_hidden"] is False

    async def test_create_wish_empty_content(
        self,
        async_client: AsyncClient,
        user_auth_headers: Dict[str, str]
    ):
        """Test POST /api/v1/wishlist - empty content"""
        wish_data = {"content": "   "}

        response = await async_client.post(
            "/api/v1/wishlist",
            json=wish_data,
            headers=user_auth_headers
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "空" in response.json()["detail"]

    async def test_create_wish_content_too_long(
        self,
        async_client: AsyncClient,
        user_auth_headers: Dict[str, str]
    ):
        """Test POST /api/v1/wishlist - content too long"""
        # Create content with >500 plain text characters
        wish_data = {"content": "A" * 501}

        response = await async_client.post(
            "/api/v1/wishlist",
            json=wish_data,
            headers=user_auth_headers
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "超過長度限制" in response.json()["detail"]

    async def test_create_wish_already_submitted_today(
        self,
        async_client: AsyncClient,
        user_auth_headers: Dict[str, str],
        sample_wish: Wishlist
    ):
        """Test POST /api/v1/wishlist - already submitted today"""
        wish_data = {"content": "Another wish"}

        response = await async_client.post(
            "/api/v1/wishlist",
            json=wish_data,
            headers=user_auth_headers
        )

        assert response.status_code == status.HTTP_409_CONFLICT
        assert "今日已提交" in response.json()["detail"]

    async def test_create_wish_unauthorized(
        self,
        async_client: AsyncClient
    ):
        """Test POST /api/v1/wishlist - without authentication"""
        wish_data = {"content": "Wish without auth"}

        response = await async_client.post(
            "/api/v1/wishlist",
            json=wish_data
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_update_wish_success(
        self,
        async_client: AsyncClient,
        user_auth_headers: Dict[str, str],
        sample_wish: Wishlist
    ):
        """Test PUT /api/v1/wishlist/{wish_id} - successful update"""
        update_data = {"content": "# Updated Wish\n\nRevised content!"}

        response = await async_client.put(
            f"/api/v1/wishlist/{sample_wish.id}",
            json=update_data,
            headers=user_auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == str(sample_wish.id)
        assert data["content"] == update_data["content"]
        assert data["has_been_edited"] is True

    async def test_update_wish_not_found(
        self,
        async_client: AsyncClient,
        user_auth_headers: Dict[str, str]
    ):
        """Test PUT /api/v1/wishlist/{wish_id} - wish not found"""
        fake_id = uuid4()
        update_data = {"content": "Updated content"}

        response = await async_client.put(
            f"/api/v1/wishlist/{fake_id}",
            json=update_data,
            headers=user_auth_headers
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "未找到" in response.json()["detail"]

    async def test_update_wish_unauthorized_other_user(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        sample_wish: Wishlist
    ):
        """Test PUT /api/v1/wishlist/{wish_id} - unauthorized (other user's wish)"""
        # Create another user
        other_user = User(
            id=uuid4(),
            email="other@vault.com",
            name="Other User",
            is_admin=False,
            is_active=True,
            hashed_password="hashed"
        )
        db_session.add(other_user)
        await db_session.commit()

        # Generate token for other user
        other_token = create_access_token(data={"sub": other_user.email, "user_id": str(other_user.id)})
        other_headers = {"Authorization": f"Bearer {other_token}"}

        update_data = {"content": "Trying to edit other's wish"}

        response = await async_client.put(
            f"/api/v1/wishlist/{sample_wish.id}",
            json=update_data,
            headers=other_headers
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "無權限" in response.json()["detail"]

    async def test_update_wish_already_edited(
        self,
        async_client: AsyncClient,
        user_auth_headers: Dict[str, str],
        db_session: AsyncSession,
        test_user: User
    ):
        """Test PUT /api/v1/wishlist/{wish_id} - already edited"""
        # Create wish that has been edited
        edited_wish = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="Original content",
            has_been_edited=True
        )
        db_session.add(edited_wish)
        await db_session.commit()

        update_data = {"content": "Trying to edit again"}

        response = await async_client.put(
            f"/api/v1/wishlist/{edited_wish.id}",
            json=update_data,
            headers=user_auth_headers
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "已編輯過" in response.json()["detail"] or "無法編輯" in response.json()["detail"]

    async def test_update_wish_has_admin_reply(
        self,
        async_client: AsyncClient,
        user_auth_headers: Dict[str, str],
        db_session: AsyncSession,
        test_user: User
    ):
        """Test PUT /api/v1/wishlist/{wish_id} - has admin reply"""
        # Create wish with admin reply
        replied_wish = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="Original content",
            admin_reply="# Response\n\nThank you!",
            admin_reply_timestamp=datetime.utcnow()
        )
        db_session.add(replied_wish)
        await db_session.commit()

        update_data = {"content": "Trying to edit after reply"}

        response = await async_client.put(
            f"/api/v1/wishlist/{replied_wish.id}",
            json=update_data,
            headers=user_auth_headers
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "管理員回覆" in response.json()["detail"] or "無法編輯" in response.json()["detail"]


# ===== Admin Endpoints Tests (Task 3.2) =====

@pytest.mark.asyncio
@pytest.mark.api
class TestAdminWishlistEndpoints:
    """Test admin wishlist endpoints (GET, PUT /api/v1/wishlist/admin/*)"""

    async def test_get_admin_wishes_all(
        self,
        async_client: AsyncClient,
        admin_auth_headers: Dict[str, str],
        db_session: AsyncSession,
        test_user: User
    ):
        """Test GET /api/v1/wishlist/admin - get all wishes"""
        # Create multiple wishes
        wish1 = Wishlist(id=uuid4(), user_id=test_user.id, content="Wish 1", is_hidden=False)
        wish2 = Wishlist(id=uuid4(), user_id=test_user.id, content="Wish 2", is_hidden=False)
        wish3 = Wishlist(id=uuid4(), user_id=test_user.id, content="Wish 3", is_hidden=True)
        db_session.add_all([wish1, wish2, wish3])
        await db_session.commit()

        response = await async_client.get(
            "/api/v1/wishlist/admin",
            headers=admin_auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "wishes" in data
        assert "total" in data
        assert "page" in data
        assert "per_page" in data
        assert data["total"] == 3
        assert len(data["wishes"]) == 3

    async def test_get_admin_wishes_filter_replied(
        self,
        async_client: AsyncClient,
        admin_auth_headers: Dict[str, str],
        db_session: AsyncSession,
        test_user: User
    ):
        """Test GET /api/v1/wishlist/admin - filter by replied status"""
        # Create wishes with and without replies
        replied = Wishlist(id=uuid4(), user_id=test_user.id, content="Replied", admin_reply="Thanks!")
        unreplied = Wishlist(id=uuid4(), user_id=test_user.id, content="Unreplied", admin_reply=None)
        db_session.add_all([replied, unreplied])
        await db_session.commit()

        # Filter for replied
        response = await async_client.get(
            "/api/v1/wishlist/admin?filter_status=replied",
            headers=admin_auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 1
        assert data["wishes"][0]["admin_reply"] is not None

        # Filter for unreplied
        response = await async_client.get(
            "/api/v1/wishlist/admin?filter_status=unreplied",
            headers=admin_auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 1
        assert data["wishes"][0]["admin_reply"] is None

    async def test_get_admin_wishes_sort_oldest(
        self,
        async_client: AsyncClient,
        admin_auth_headers: Dict[str, str],
        db_session: AsyncSession,
        test_user: User
    ):
        """Test GET /api/v1/wishlist/admin - sort by oldest"""
        response = await async_client.get(
            "/api/v1/wishlist/admin?sort_order=oldest",
            headers=admin_auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # Should be sorted by created_at ASC
        if len(data["wishes"]) > 1:
            dates = [w["created_at"] for w in data["wishes"]]
            assert dates == sorted(dates)

    async def test_get_admin_wishes_pagination(
        self,
        async_client: AsyncClient,
        admin_auth_headers: Dict[str, str],
        db_session: AsyncSession,
        test_user: User
    ):
        """Test GET /api/v1/wishlist/admin - pagination"""
        # Create multiple wishes
        for i in range(5):
            wish = Wishlist(id=uuid4(), user_id=test_user.id, content=f"Wish {i}")
            db_session.add(wish)
        await db_session.commit()

        # Page 1, 2 per page
        response = await async_client.get(
            "/api/v1/wishlist/admin?page=1&page_size=2",
            headers=admin_auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["page"] == 1
        assert data["per_page"] == 2
        assert len(data["wishes"]) == 2

    async def test_get_admin_wishes_forbidden_non_admin(
        self,
        async_client: AsyncClient,
        user_auth_headers: Dict[str, str]
    ):
        """Test GET /api/v1/wishlist/admin - forbidden for non-admin"""
        response = await async_client.get(
            "/api/v1/wishlist/admin",
            headers=user_auth_headers
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "管理員權限" in response.json()["detail"]

    async def test_admin_reply_success(
        self,
        async_client: AsyncClient,
        admin_auth_headers: Dict[str, str],
        sample_wish: Wishlist
    ):
        """Test PUT /api/v1/wishlist/admin/{wish_id}/reply - successful reply"""
        reply_data = {"reply": "# Thank you!\n\nWe appreciate your feedback."}

        response = await async_client.put(
            f"/api/v1/wishlist/admin/{sample_wish.id}/reply",
            json=reply_data,
            headers=admin_auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == str(sample_wish.id)
        assert data["admin_reply"] == reply_data["reply"]
        assert data["admin_reply_timestamp"] is not None

    async def test_admin_reply_update_existing(
        self,
        async_client: AsyncClient,
        admin_auth_headers: Dict[str, str],
        db_session: AsyncSession,
        test_user: User
    ):
        """Test PUT /api/v1/wishlist/admin/{wish_id}/reply - update existing reply"""
        # Create wish with existing reply
        wish = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="Original",
            admin_reply="Old reply"
        )
        db_session.add(wish)
        await db_session.commit()

        new_reply = {"reply": "# Updated Reply\n\nNew response!"}

        response = await async_client.put(
            f"/api/v1/wishlist/admin/{wish.id}/reply",
            json=new_reply,
            headers=admin_auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["admin_reply"] == new_reply["reply"]

    async def test_admin_reply_forbidden_non_admin(
        self,
        async_client: AsyncClient,
        user_auth_headers: Dict[str, str],
        sample_wish: Wishlist
    ):
        """Test PUT /api/v1/wishlist/admin/{wish_id}/reply - forbidden for non-admin"""
        reply_data = {"reply": "Trying to reply as non-admin"}

        response = await async_client.put(
            f"/api/v1/wishlist/admin/{sample_wish.id}/reply",
            json=reply_data,
            headers=user_auth_headers
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    async def test_admin_hide_wish(
        self,
        async_client: AsyncClient,
        admin_auth_headers: Dict[str, str],
        sample_wish: Wishlist
    ):
        """Test PUT /api/v1/wishlist/admin/{wish_id}/hide - hide wish"""
        response = await async_client.put(
            f"/api/v1/wishlist/admin/{sample_wish.id}/hide",
            headers=admin_auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == str(sample_wish.id)
        assert data["is_hidden"] is True

    async def test_admin_unhide_wish(
        self,
        async_client: AsyncClient,
        admin_auth_headers: Dict[str, str],
        db_session: AsyncSession,
        test_user: User
    ):
        """Test PUT /api/v1/wishlist/admin/{wish_id}/unhide - unhide wish"""
        # Create hidden wish
        hidden_wish = Wishlist(
            id=uuid4(),
            user_id=test_user.id,
            content="Hidden",
            is_hidden=True
        )
        db_session.add(hidden_wish)
        await db_session.commit()

        response = await async_client.put(
            f"/api/v1/wishlist/admin/{hidden_wish.id}/unhide",
            headers=admin_auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == str(hidden_wish.id)
        assert data["is_hidden"] is False

    async def test_admin_hide_forbidden_non_admin(
        self,
        async_client: AsyncClient,
        user_auth_headers: Dict[str, str],
        sample_wish: Wishlist
    ):
        """Test PUT /api/v1/wishlist/admin/{wish_id}/hide - forbidden for non-admin"""
        response = await async_client.put(
            f"/api/v1/wishlist/admin/{sample_wish.id}/hide",
            headers=user_auth_headers
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
