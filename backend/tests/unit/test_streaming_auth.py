"""
Backend 認證測試 - Streaming Endpoint Authentication

測試 AI 串流解讀端點的認證保護機制。

測試覆蓋範圍:
- Valid token → streaming succeeds
- Invalid token → 401 before SSE connection
- Missing token → 401 error
- Expired token → 401 error
- (Optional) Reading ownership check
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch
from fastapi import HTTPException
from fastapi.testclient import TestClient
import uuid

from app.core.security import create_access_token, create_refresh_token


class TestStreamingAuthValidToken:
    """測試有效 token 的串流成功情境"""

    @pytest.fixture
    def valid_user(self, db_session):
        """建立有效且啟用的測試使用者"""
        from app.models.user import User

        user = User(
            id=str(uuid.uuid4()),
            username="streaming_user",
            email="streaming@wasteland.com",
            hashed_password="fake_hash",
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    @pytest.fixture
    def valid_token(self, valid_user):
        """生成有效的 JWT access token"""
        return create_access_token(data={"sub": valid_user.id})

    @pytest.fixture
    def sample_card(self, db_session):
        """建立測試卡牌"""
        from app.models.wasteland_card import WastelandCard as WastelandCardModel, CharacterVoice

        card = WastelandCardModel(
            id=str(uuid.uuid4()),
            name="The Fool",
            arcana_type="major",
            fallout_backstory="A vault dweller stepping into the wasteland...",
            story_perspective="first_person",
            character_voice=CharacterVoice.PIP_BOY,
            image_url="/static/cards/fool.png",
            upright_meaning="New beginnings in the wasteland",
            reversed_meaning="Reckless decisions",
            symbolism="Vault suit, Pip-Boy, open vault door"
        )
        db_session.add(card)
        db_session.commit()
        db_session.refresh(card)
        return card

    def test_valid_token_cookie_streaming_succeeds(
        self, client, valid_token, sample_card, db_session
    ):
        """測試: Valid token via cookie → streaming succeeds"""
        # Set cookie with valid token
        client.cookies.set("access_token", valid_token)

        response = client.post(
            "/api/v1/readings/interpretation/stream",
            json={
                "card_id": sample_card.id,
                "question": "What does my future hold?",
                "character_voice": "pip_boy",
                "karma_alignment": "neutral"
            },
            stream=True
        )

        # Should not return 401
        assert response.status_code != 401, "Valid token should not return 401"

        # Should return streaming response (200) or service unavailable (503)
        # Note: 503 is acceptable if AI service is not configured in test environment
        assert response.status_code in [200, 503], \
            f"Expected 200 or 503, got {response.status_code}"

        # If 200, verify SSE content type
        if response.status_code == 200:
            assert response.headers["content-type"] == "text/event-stream"

    def test_valid_token_header_streaming_succeeds(
        self, client, valid_token, sample_card, db_session
    ):
        """測試: Valid token via Authorization header → streaming succeeds"""
        response = client.post(
            "/api/v1/readings/interpretation/stream",
            json={
                "card_id": sample_card.id,
                "question": "What does my future hold?",
                "character_voice": "pip_boy",
                "karma_alignment": "neutral"
            },
            headers={"Authorization": f"Bearer {valid_token}"},
            stream=True
        )

        # Should not return 401
        assert response.status_code != 401
        assert response.status_code in [200, 503]


class TestStreamingAuthInvalidToken:
    """測試無效 token 的 401 錯誤情境"""

    @pytest.fixture
    def sample_card(self, db_session):
        """建立測試卡牌"""
        from app.models.wasteland_card import WastelandCard as WastelandCardModel, CharacterVoice

        card = WastelandCardModel(
            id=str(uuid.uuid4()),
            name="The Fool",
            arcana_type="major",
            fallout_backstory="Test backstory",
            story_perspective="first_person",
            character_voice=CharacterVoice.PIP_BOY,
            image_url="/static/cards/fool.png",
            upright_meaning="Test meaning",
            reversed_meaning="Test reversed",
            symbolism="Test symbols"
        )
        db_session.add(card)
        db_session.commit()
        db_session.refresh(card)
        return card

    def test_invalid_token_returns_401_before_sse(self, client, sample_card):
        """測試: Invalid token → 401 before SSE connection"""
        invalid_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature"

        response = client.post(
            "/api/v1/readings/interpretation/stream",
            json={
                "card_id": sample_card.id,
                "question": "Test question",
                "character_voice": "pip_boy",
                "karma_alignment": "neutral"
            },
            headers={"Authorization": f"Bearer {invalid_token}"}
        )

        # Must return 401 before establishing SSE connection
        assert response.status_code == 401
        assert response.headers.get("content-type") != "text/event-stream"

        # Verify error detail
        error_data = response.json()
        assert "detail" in error_data
        assert "token" in error_data["detail"].lower() or \
               "invalid" in error_data["detail"].lower()

    def test_malformed_token_returns_401(self, client, sample_card):
        """測試: Malformed token format → 401 error"""
        malformed_token = "not.a.valid.jwt.token"

        response = client.post(
            "/api/v1/readings/interpretation/stream",
            json={
                "card_id": sample_card.id,
                "question": "Test question",
                "character_voice": "pip_boy",
                "karma_alignment": "neutral"
            },
            headers={"Authorization": f"Bearer {malformed_token}"}
        )

        assert response.status_code == 401

    def test_wrong_token_type_returns_401(self, client, sample_card, db_session):
        """測試: Refresh token instead of access token → 401 error"""
        from app.models.user import User

        # Create a user
        user = User(
            id=str(uuid.uuid4()),
            username="test_user",
            email="test@example.com",
            hashed_password="fake_hash",
            is_active=True
        )
        db_session.add(user)
        db_session.commit()

        # Create refresh token instead of access token
        refresh_token = create_refresh_token(data={"sub": user.id})

        response = client.post(
            "/api/v1/readings/interpretation/stream",
            json={
                "card_id": sample_card.id,
                "question": "Test question",
                "character_voice": "pip_boy",
                "karma_alignment": "neutral"
            },
            headers={"Authorization": f"Bearer {refresh_token}"}
        )

        # Should reject refresh token for access-only endpoint
        assert response.status_code == 401
        error_data = response.json()
        assert "token type" in error_data["detail"].lower()


class TestStreamingAuthMissingToken:
    """測試缺少 token 的 401 錯誤情境"""

    @pytest.fixture
    def sample_card(self, db_session):
        """建立測試卡牌"""
        from app.models.wasteland_card import WastelandCard as WastelandCardModel, CharacterVoice

        card = WastelandCardModel(
            id=str(uuid.uuid4()),
            name="The Fool",
            arcana_type="major",
            fallout_backstory="Test backstory",
            story_perspective="first_person",
            character_voice=CharacterVoice.PIP_BOY,
            image_url="/static/cards/fool.png",
            upright_meaning="Test meaning",
            reversed_meaning="Test reversed",
            symbolism="Test symbols"
        )
        db_session.add(card)
        db_session.commit()
        db_session.refresh(card)
        return card

    def test_missing_token_returns_401(self, client, sample_card):
        """測試: No token provided → 401 error"""
        response = client.post(
            "/api/v1/readings/interpretation/stream",
            json={
                "card_id": sample_card.id,
                "question": "Test question",
                "character_voice": "pip_boy",
                "karma_alignment": "neutral"
            }
            # No Authorization header, no cookie
        )

        assert response.status_code == 401
        assert response.headers.get("content-type") != "text/event-stream"

        error_data = response.json()
        assert "detail" in error_data
        assert "token" in error_data["detail"].lower() or \
               "access" in error_data["detail"].lower()

    def test_empty_authorization_header_returns_401(self, client, sample_card):
        """測試: Empty Authorization header → 401 error"""
        response = client.post(
            "/api/v1/readings/interpretation/stream",
            json={
                "card_id": sample_card.id,
                "question": "Test question",
                "character_voice": "pip_boy",
                "karma_alignment": "neutral"
            },
            headers={"Authorization": "Bearer "}
        )

        assert response.status_code == 401


class TestStreamingAuthExpiredToken:
    """測試過期 token 的 401 錯誤情境"""

    @pytest.fixture
    def expired_user(self, db_session):
        """建立測試使用者"""
        from app.models.user import User

        user = User(
            id=str(uuid.uuid4()),
            username="expired_user",
            email="expired@wasteland.com",
            hashed_password="fake_hash",
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    @pytest.fixture
    def expired_token(self, expired_user):
        """生成已過期的 JWT token"""
        # Create token that expired 1 hour ago
        return create_access_token(
            data={"sub": expired_user.id},
            expires_delta=timedelta(hours=-1)
        )

    @pytest.fixture
    def sample_card(self, db_session):
        """建立測試卡牌"""
        from app.models.wasteland_card import WastelandCard as WastelandCardModel, CharacterVoice

        card = WastelandCardModel(
            id=str(uuid.uuid4()),
            name="The Fool",
            arcana_type="major",
            fallout_backstory="Test backstory",
            story_perspective="first_person",
            character_voice=CharacterVoice.PIP_BOY,
            image_url="/static/cards/fool.png",
            upright_meaning="Test meaning",
            reversed_meaning="Test reversed",
            symbolism="Test symbols"
        )
        db_session.add(card)
        db_session.commit()
        db_session.refresh(card)
        return card

    def test_expired_token_returns_401(self, client, expired_token, sample_card):
        """測試: Expired token → 401 error"""
        response = client.post(
            "/api/v1/readings/interpretation/stream",
            json={
                "card_id": sample_card.id,
                "question": "Test question",
                "character_voice": "pip_boy",
                "karma_alignment": "neutral"
            },
            headers={"Authorization": f"Bearer {expired_token}"}
        )

        # Must return 401 for expired token
        assert response.status_code == 401
        assert response.headers.get("content-type") != "text/event-stream"

        error_data = response.json()
        assert "detail" in error_data
        # Should mention token is invalid or expired
        assert "token" in error_data["detail"].lower() or \
               "expired" in error_data["detail"].lower() or \
               "invalid" in error_data["detail"].lower()


class TestStreamingAuthInactiveUser:
    """測試停用帳號的 401 錯誤情境"""

    @pytest.fixture
    def inactive_user(self, db_session):
        """建立停用的測試使用者"""
        from app.models.user import User

        user = User(
            id=str(uuid.uuid4()),
            username="inactive_user",
            email="inactive@wasteland.com",
            hashed_password="fake_hash",
            is_active=False  # Inactive account
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    @pytest.fixture
    def inactive_token(self, inactive_user):
        """生成停用使用者的有效 token"""
        return create_access_token(data={"sub": inactive_user.id})

    @pytest.fixture
    def sample_card(self, db_session):
        """建立測試卡牌"""
        from app.models.wasteland_card import WastelandCard as WastelandCardModel, CharacterVoice

        card = WastelandCardModel(
            id=str(uuid.uuid4()),
            name="The Fool",
            arcana_type="major",
            fallout_backstory="Test backstory",
            story_perspective="first_person",
            character_voice=CharacterVoice.PIP_BOY,
            image_url="/static/cards/fool.png",
            upright_meaning="Test meaning",
            reversed_meaning="Test reversed",
            symbolism="Test symbols"
        )
        db_session.add(card)
        db_session.commit()
        db_session.refresh(card)
        return card

    def test_inactive_user_returns_401(self, client, inactive_token, sample_card):
        """測試: Valid token but inactive user → 401 error"""
        response = client.post(
            "/api/v1/readings/interpretation/stream",
            json={
                "card_id": sample_card.id,
                "question": "Test question",
                "character_voice": "pip_boy",
                "karma_alignment": "neutral"
            },
            headers={"Authorization": f"Bearer {inactive_token}"}
        )

        assert response.status_code == 401
        error_data = response.json()
        assert "inactive" in error_data["detail"].lower()


class TestStreamingAuthMultiCardEndpoint:
    """測試多卡串流端點的認證保護"""

    @pytest.fixture
    def valid_user(self, db_session):
        """建立有效且啟用的測試使用者"""
        from app.models.user import User

        user = User(
            id=str(uuid.uuid4()),
            username="multi_card_user",
            email="multicard@wasteland.com",
            hashed_password="fake_hash",
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    @pytest.fixture
    def valid_token(self, valid_user):
        """生成有效的 JWT access token"""
        return create_access_token(data={"sub": valid_user.id})

    @pytest.fixture
    def sample_cards(self, db_session):
        """建立多張測試卡牌"""
        from app.models.wasteland_card import WastelandCard as WastelandCardModel, CharacterVoice

        cards = []
        for i in range(3):
            card = WastelandCardModel(
                id=str(uuid.uuid4()),
                name=f"Card {i}",
                arcana_type="major",
                fallout_backstory=f"Backstory {i}",
                story_perspective="first_person",
                character_voice=CharacterVoice.PIP_BOY,
                image_url=f"/static/cards/card{i}.png",
                upright_meaning=f"Meaning {i}",
                reversed_meaning=f"Reversed {i}",
                symbolism=f"Symbols {i}"
            )
            db_session.add(card)
            cards.append(card)
        db_session.commit()
        for card in cards:
            db_session.refresh(card)
        return cards

    def test_multi_card_valid_token_succeeds(
        self, client, valid_token, sample_cards
    ):
        """測試: Multi-card endpoint with valid token → succeeds"""
        card_ids = [card.id for card in sample_cards]

        response = client.post(
            "/api/v1/readings/interpretation/stream-multi",
            json={
                "card_ids": card_ids,
                "question": "What does my three-card spread reveal?",
                "character_voice": "pip_boy",
                "karma_alignment": "neutral",
                "spread_type": "three_card"
            },
            headers={"Authorization": f"Bearer {valid_token}"},
            stream=True
        )

        # Should not return 401
        assert response.status_code != 401
        assert response.status_code in [200, 503]

    def test_multi_card_missing_token_returns_401(self, client, sample_cards):
        """測試: Multi-card endpoint without token → 401 error"""
        card_ids = [card.id for card in sample_cards]

        response = client.post(
            "/api/v1/readings/interpretation/stream-multi",
            json={
                "card_ids": card_ids,
                "question": "Test question",
                "character_voice": "pip_boy",
                "karma_alignment": "neutral",
                "spread_type": "three_card"
            }
            # No token
        )

        assert response.status_code == 401

    def test_multi_card_invalid_token_returns_401(self, client, sample_cards):
        """測試: Multi-card endpoint with invalid token → 401 error"""
        card_ids = [card.id for card in sample_cards]
        invalid_token = "invalid.token.here"

        response = client.post(
            "/api/v1/readings/interpretation/stream-multi",
            json={
                "card_ids": card_ids,
                "question": "Test question",
                "character_voice": "pip_boy",
                "karma_alignment": "neutral",
                "spread_type": "three_card"
            },
            headers={"Authorization": f"Bearer {invalid_token}"}
        )

        assert response.status_code == 401


class TestStreamingAuthErrorResponses:
    """測試認證錯誤的回應格式"""

    @pytest.fixture
    def sample_card(self, db_session):
        """建立測試卡牌"""
        from app.models.wasteland_card import WastelandCard as WastelandCardModel, CharacterVoice

        card = WastelandCardModel(
            id=str(uuid.uuid4()),
            name="The Fool",
            arcana_type="major",
            fallout_backstory="Test backstory",
            story_perspective="first_person",
            character_voice=CharacterVoice.PIP_BOY,
            image_url="/static/cards/fool.png",
            upright_meaning="Test meaning",
            reversed_meaning="Test reversed",
            symbolism="Test symbols"
        )
        db_session.add(card)
        db_session.commit()
        db_session.refresh(card)
        return card

    def test_auth_error_returns_json_not_sse(self, client, sample_card):
        """測試: Auth errors return JSON, not SSE format"""
        response = client.post(
            "/api/v1/readings/interpretation/stream",
            json={
                "card_id": sample_card.id,
                "question": "Test question",
                "character_voice": "pip_boy",
                "karma_alignment": "neutral"
            }
            # No token
        )

        assert response.status_code == 401

        # Should return JSON error, not SSE stream
        assert response.headers.get("content-type") == "application/json"
        assert response.headers.get("content-type") != "text/event-stream"

        # Should have standard FastAPI error format
        error_data = response.json()
        assert "detail" in error_data
        assert isinstance(error_data["detail"], str)

    def test_auth_error_includes_helpful_message(self, client, sample_card):
        """測試: Auth errors include user-friendly messages"""
        response = client.post(
            "/api/v1/readings/interpretation/stream",
            json={
                "card_id": sample_card.id,
                "question": "Test question",
                "character_voice": "pip_boy",
                "karma_alignment": "neutral"
            }
        )

        error_data = response.json()
        detail = error_data["detail"].lower()

        # Should mention access, token, or authentication
        assert any(keyword in detail for keyword in [
            "token", "access", "auth", "unauthorized"
        ])


class TestStreamingAuthLogging:
    """測試認證相關的 logging 行為"""

    @pytest.fixture
    def valid_user(self, db_session):
        """建立有效且啟用的測試使用者"""
        from app.models.user import User

        user = User(
            id=str(uuid.uuid4()),
            username="logging_test_user",
            email="logging@wasteland.com",
            hashed_password="fake_hash",
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    @pytest.fixture
    def valid_token(self, valid_user):
        """生成有效的 JWT access token"""
        return create_access_token(data={"sub": valid_user.id})

    @pytest.fixture
    def sample_card(self, db_session):
        """建立測試卡牌"""
        from app.models.wasteland_card import WastelandCard as WastelandCardModel, CharacterVoice

        card = WastelandCardModel(
            id=str(uuid.uuid4()),
            name="The Fool",
            arcana_type="major",
            fallout_backstory="Test backstory",
            story_perspective="first_person",
            character_voice=CharacterVoice.PIP_BOY,
            image_url="/static/cards/fool.png",
            upright_meaning="Test meaning",
            reversed_meaning="Test reversed",
            symbolism="Test symbols"
        )
        db_session.add(card)
        db_session.commit()
        db_session.refresh(card)
        return card

    def test_authenticated_request_logs_user_info(
        self, client, valid_token, sample_card, valid_user, caplog
    ):
        """測試: Authenticated streaming request logs user ID"""
        import logging
        caplog.set_level(logging.INFO)

        response = client.post(
            "/api/v1/readings/interpretation/stream",
            json={
                "card_id": sample_card.id,
                "question": "Test question",
                "character_voice": "pip_boy",
                "karma_alignment": "neutral"
            },
            headers={"Authorization": f"Bearer {valid_token}"},
            stream=True
        )

        # If request succeeded (200 or 503), check if user info was logged
        if response.status_code in [200, 503]:
            # Verify logging includes user information
            log_records = [record.message for record in caplog.records]
            assert any(valid_user.id in msg or valid_user.username in msg
                      for msg in log_records), \
                "Authenticated streaming session should log user information"
