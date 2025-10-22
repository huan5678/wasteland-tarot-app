"""
Test suite for Share API Endpoints (Phase 2: Reading Share Link)

TDD Red Phase: API endpoint 測試

Endpoints:
- POST /api/v1/readings/{reading_id}/share - 生成分享連結
- GET /api/v1/share/{share_token} - 獲取分享結果
"""

import pytest
from uuid import uuid4
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reading_enhanced import CompletedReading
from app.models.user import User


@pytest.mark.asyncio
class TestCreateShareLinkAPI:
    """測試 POST /api/v1/readings/{id}/share"""

    async def test_create_share_link_success(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict
    ):
        """測試成功生成分享連結"""
        # RED: API endpoint 尚未實作

        # 準備測試資料
        user_id = uuid4()
        user = User(id=user_id, email="test@example.com", username="testuser")
        db_session.add(user)

        reading = CompletedReading(
            id=uuid4(),
            user_id=user_id,
            question="Test question",
            character_voice_used="ghoul",
            karma_context="neutral"
        )
        db_session.add(reading)
        await db_session.commit()

        # 呼叫 API
        response = await async_client.post(
            f"/api/v1/readings/{reading.id}/share",
            headers=auth_headers
        )

        # 驗證回應
        assert response.status_code == 200
        data = response.json()

        assert 'share_token' in data
        assert 'share_url' in data
        assert 'created_at' in data

    async def test_create_share_link_unauthorized(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """測試未登入 (401)"""
        # RED: 測試會失敗

        reading_id = uuid4()

        response = await async_client.post(
            f"/api/v1/readings/{reading_id}/share"
        )

        assert response.status_code == 401

    async def test_create_share_link_not_owner(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession,
        auth_headers: dict
    ):
        """測試非擁有者 (403)"""
        # RED: 測試會失敗

        owner = User(id=uuid4(), email="owner@example.com", username="owner")
        other_user = User(id=uuid4(), email="other@example.com", username="other")
        db_session.add(owner)
        db_session.add(other_user)

        reading = CompletedReading(
            id=uuid4(),
            user_id=owner.id,
            question="Owner's reading",
            character_voice_used="ghoul",
            karma_context="neutral"
        )
        db_session.add(reading)
        await db_session.commit()

        # 其他用戶嘗試分享
        response = await async_client.post(
            f"/api/v1/readings/{reading.id}/share",
            headers=auth_headers  # 這個 header 是其他用戶的
        )

        assert response.status_code == 403

    async def test_create_share_link_not_found(
        self,
        async_client: AsyncClient,
        auth_headers: dict
    ):
        """測試 Reading 不存在 (404)"""
        # RED: 測試會失敗

        fake_id = uuid4()

        response = await async_client.post(
            f"/api/v1/readings/{fake_id}/share",
            headers=auth_headers
        )

        assert response.status_code == 404


@pytest.mark.asyncio
class TestGetSharedReadingAPI:
    """測試 GET /api/v1/share/{token}"""

    async def test_get_shared_reading_success(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """測試成功獲取分享結果"""
        # RED: 測試會失敗

        user = User(id=uuid4(), email="test@example.com", username="testuser")
        db_session.add(user)

        share_token = uuid4()
        reading = CompletedReading(
            id=uuid4(),
            user_id=user.id,
            question="Test question",
            character_voice_used="ghoul",
            karma_context="neutral",
            overall_interpretation="Test interpretation",
            share_token=share_token
        )
        db_session.add(reading)
        await db_session.commit()

        # 呼叫 API (無需登入)
        response = await async_client.get(f"/api/v1/share/{share_token}")

        # 驗證回應
        assert response.status_code == 200
        data = response.json()

        assert data['reading_id'] == str(reading.id)
        assert data['question'] == reading.question

    async def test_get_shared_reading_no_auth_required(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """測試無需登入即可訪問"""
        # RED: 測試會失敗

        user = User(id=uuid4(), email="test@example.com", username="testuser")
        db_session.add(user)

        share_token = uuid4()
        reading = CompletedReading(
            id=uuid4(),
            user_id=user.id,
            question="Test question",
            character_voice_used="ghoul",
            karma_context="neutral",
            share_token=share_token
        )
        db_session.add(reading)
        await db_session.commit()

        # 不傳 auth headers
        response = await async_client.get(f"/api/v1/share/{share_token}")

        assert response.status_code == 200

    async def test_get_shared_reading_no_private_data(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """測試不包含私密資料"""
        # RED: 測試會失敗

        user = User(id=uuid4(), email="secret@example.com", username="secretuser")
        db_session.add(user)

        share_token = uuid4()
        reading = CompletedReading(
            id=uuid4(),
            user_id=user.id,
            question="Test question",
            character_voice_used="ghoul",
            karma_context="neutral",
            share_token=share_token
        )
        db_session.add(reading)
        await db_session.commit()

        response = await async_client.get(f"/api/v1/share/{share_token}")

        assert response.status_code == 200
        data = response.json()

        # 確認不包含私密資料
        assert 'user_id' not in data
        assert 'user' not in data

    async def test_get_shared_reading_not_found(
        self,
        async_client: AsyncClient
    ):
        """測試 token 不存在 (404)"""
        # RED: 測試會失敗

        fake_token = uuid4()

        response = await async_client.get(f"/api/v1/share/{fake_token}")

        assert response.status_code == 404

    async def test_get_shared_reading_invalid_token(
        self,
        async_client: AsyncClient
    ):
        """測試無效的 token 格式 (422)"""
        # RED: 測試會失敗

        invalid_token = "invalid-token-format"

        response = await async_client.get(f"/api/v1/share/{invalid_token}")

        # FastAPI 會自動驗證 UUID 格式
        assert response.status_code in [400, 422]
