"""
Tests for Reading Share API Endpoints (Task 16.8)

Tests the social sharing features:
- POST /api/v1/readings/{id}/share (generate share link)
- GET /api/v1/share/{uuid} (view shared reading)
- DELETE /api/v1/share/{uuid} (revoke share)
- GET /api/v1/readings/{id}/shares (list user's shares)
"""

import pytest
from uuid import uuid4
from datetime import datetime, timedelta
from fastapi import status
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


# Override db fixtures to create only necessary tables
@pytest.fixture(scope="function")
def share_db_engine():
    """Create a test database engine for share tests"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Enable foreign key constraints for SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    # Import models AFTER engine creation
    from app.models.user import User
    from app.models.reading_enhanced import (
        SpreadTemplate,
        CompletedReading,
        InterpretationTemplate,
        ReadingCategory
    )
    from app.models.share import ReadingShare

    # Create all necessary tables (including dependencies)
    User.__table__.create(bind=engine, checkfirst=True)
    ReadingCategory.__table__.create(bind=engine, checkfirst=True)
    InterpretationTemplate.__table__.create(bind=engine, checkfirst=True)
    SpreadTemplate.__table__.create(bind=engine, checkfirst=True)
    CompletedReading.__table__.create(bind=engine, checkfirst=True)
    ReadingShare.__table__.create(bind=engine, checkfirst=True)

    yield engine

    # Drop tables after test
    engine.dispose()


@pytest.fixture(scope="function")
def db_session(share_db_engine):
    """Create a test database session for share tests"""
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=share_db_engine
    )

    session = TestingSessionLocal()
    yield session
    session.close()


@pytest.fixture(scope="function")
def db(db_session):
    """Alias for db_session"""
    return db_session


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database session override"""
    from fastapi.testclient import TestClient
    from app.main import app
    from app.db.database import get_db

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


class TestGenerateShareLink:
    """Test POST /api/v1/readings/{id}/share endpoint"""

    def test_generate_share_link_success(self, test_client, test_user, test_reading):
        """Should successfully generate a share link for a reading"""
        response = test_client.post(
            f"/api/v1/readings/{test_reading.id}/share",
            json={"require_password": False},
            headers={"Authorization": f"Bearer {test_user['access_token']}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "uuid" in data
        assert "url" in data
        assert data["url"].startswith("https://wasteland-tarot.com/share/")
        assert data["require_password"] is False
        assert data["access_count"] == 0
        assert data["is_active"] is True

    def test_generate_share_link_with_password(self, test_client, test_user, test_reading):
        """Should generate password-protected share link"""
        response = test_client.post(
            f"/api/v1/readings/{test_reading.id}/share",
            json={
                "require_password": True,
                "password": "1234"
            },
            headers={"Authorization": f"Bearer {test_user['access_token']}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert data["require_password"] is True
        assert "password" not in data  # Password should not be returned

    def test_generate_share_link_invalid_password_length(self, test_client, test_user, test_reading):
        """Should reject password less than 4 digits"""
        response = test_client.post(
            f"/api/v1/readings/{test_reading.id}/share",
            json={
                "require_password": True,
                "password": "123"  # Too short
            },
            headers={"Authorization": f"Bearer {test_user['access_token']}"}
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "密碼長度必須為 4-8 位數" in response.json()["detail"]

    def test_generate_share_link_password_too_long(self, test_client, test_user, test_reading):
        """Should reject password longer than 8 digits"""
        response = test_client.post(
            f"/api/v1/readings/{test_reading.id}/share",
            json={
                "require_password": True,
                "password": "123456789"  # Too long
            },
            headers={"Authorization": f"Bearer {test_user['access_token']}"}
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_generate_share_link_reading_not_found(self, test_client, test_user):
        """Should return 404 for non-existent reading"""
        fake_id = str(uuid4())
        response = test_client.post(
            f"/api/v1/readings/{fake_id}/share",
            json={"require_password": False},
            headers={"Authorization": f"Bearer {test_user['access_token']}"}
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_generate_share_link_not_owner(self, test_client, test_user, other_user_reading):
        """Should reject if user doesn't own the reading"""
        response = test_client.post(
            f"/api/v1/readings/{other_user_reading.id}/share",
            json={"require_password": False},
            headers={"Authorization": f"Bearer {test_user['access_token']}"}
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_generate_share_link_unauthenticated(self, test_client, test_reading):
        """Should require authentication"""
        response = test_client.post(
            f"/api/v1/readings/{test_reading.id}/share",
            json={"require_password": False}
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestViewSharedReading:
    """Test GET /api/v1/share/{uuid} endpoint"""

    def test_view_shared_reading_success(self, test_client, shared_reading):
        """Should successfully view a shared reading"""
        response = test_client.get(f"/api/v1/share/{shared_reading['uuid']}")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Verify reading content is present
        assert "question" in data
        assert "overall_interpretation" in data
        assert "card_positions" in data

        # Verify PII is stripped
        assert "user_id" not in data
        assert "karma_context" not in data
        assert "faction_influence" not in data

    def test_view_shared_reading_with_correct_password(self, test_client, password_protected_share):
        """Should allow access with correct password"""
        response = test_client.get(
            f"/api/v1/share/{password_protected_share['uuid']}",
            params={"password": "1234"}
        )

        assert response.status_code == status.HTTP_200_OK

    def test_view_shared_reading_with_incorrect_password(self, test_client, password_protected_share):
        """Should reject with incorrect password"""
        response = test_client.get(
            f"/api/v1/share/{password_protected_share['uuid']}",
            params={"password": "wrong"}
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "密碼錯誤" in response.json()["detail"]

    def test_view_shared_reading_password_required_but_not_provided(self, test_client, password_protected_share):
        """Should require password when set"""
        response = test_client.get(f"/api/v1/share/{password_protected_share['uuid']}")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "需要密碼" in response.json()["detail"]

    def test_view_shared_reading_increments_access_count(self, test_client, db_session, shared_reading):
        """Should increment access count on each view"""
        uuid = shared_reading['uuid']

        # First access
        response1 = test_client.get(f"/api/v1/share/{uuid}")
        assert response1.status_code == status.HTTP_200_OK

        # Second access
        response2 = test_client.get(f"/api/v1/share/{uuid}")
        assert response2.status_code == status.HTTP_200_OK

        # Verify access count increased
        share = db_session.query(ReadingShare).filter_by(uuid=uuid).first()
        assert share.access_count >= 2

    def test_view_shared_reading_not_found(self, test_client):
        """Should return 404 for non-existent share"""
        fake_uuid = str(uuid4())
        response = test_client.get(f"/api/v1/share/{fake_uuid}")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_view_revoked_share(self, test_client, revoked_share):
        """Should show revoked message for inactive shares"""
        response = test_client.get(f"/api/v1/share/{revoked_share['uuid']}")

        assert response.status_code == status.HTTP_410_GONE
        assert "此解讀已被擁有者撤回" in response.json()["detail"]


class TestRevokeShare:
    """Test DELETE /api/v1/share/{uuid} endpoint"""

    def test_revoke_share_success(self, test_client, test_user, shared_reading):
        """Should successfully revoke a share link"""
        response = test_client.delete(
            f"/api/v1/share/{shared_reading['uuid']}",
            headers={"Authorization": f"Bearer {test_user['access_token']}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert data["message"] == "分享連結已撤銷"
        assert data["uuid"] == shared_reading['uuid']

    def test_revoke_share_marks_inactive(self, test_client, test_user, db_session, shared_reading):
        """Should mark share as inactive in database"""
        uuid = shared_reading['uuid']

        response = test_client.delete(
            f"/api/v1/share/{uuid}",
            headers={"Authorization": f"Bearer {test_user['access_token']}"}
        )

        assert response.status_code == status.HTTP_200_OK

        # Verify share is inactive
        share = db_session.query(ReadingShare).filter_by(uuid=uuid).first()
        assert share.is_active is False

    def test_revoke_share_not_owner(self, test_client, test_user, other_user_share):
        """Should reject if user doesn't own the share"""
        response = test_client.delete(
            f"/api/v1/share/{other_user_share['uuid']}",
            headers={"Authorization": f"Bearer {test_user['access_token']}"}
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_revoke_share_not_found(self, test_client, test_user):
        """Should return 404 for non-existent share"""
        fake_uuid = str(uuid4())
        response = test_client.delete(
            f"/api/v1/share/{fake_uuid}",
            headers={"Authorization": f"Bearer {test_user['access_token']}"}
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_revoke_share_unauthenticated(self, test_client, shared_reading):
        """Should require authentication"""
        response = test_client.delete(f"/api/v1/share/{shared_reading['uuid']}")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestListUserShares:
    """Test GET /api/v1/readings/{id}/shares endpoint"""

    def test_list_user_shares_success(self, test_client, test_user, test_reading_with_multiple_shares):
        """Should list all shares for a reading"""
        reading_id = test_reading_with_multiple_shares['reading_id']
        response = test_client.get(
            f"/api/v1/readings/{reading_id}/shares",
            headers={"Authorization": f"Bearer {test_user['access_token']}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert len(data["shares"]) == 3

        for share in data["shares"]:
            assert "uuid" in share
            assert "url" in share
            assert "access_count" in share
            assert "is_active" in share
            assert "created_at" in share

    def test_list_user_shares_only_active(self, test_client, test_user, test_reading_with_mixed_shares):
        """Should optionally filter only active shares"""
        reading_id = test_reading_with_mixed_shares['reading_id']
        response = test_client.get(
            f"/api/v1/readings/{reading_id}/shares",
            params={"active_only": True},
            headers={"Authorization": f"Bearer {test_user['access_token']}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Should only return active shares
        assert all(share["is_active"] for share in data["shares"])

    def test_list_user_shares_not_owner(self, test_client, test_user, other_user_reading):
        """Should reject if user doesn't own the reading"""
        response = test_client.get(
            f"/api/v1/readings/{other_user_reading.id}/shares",
            headers={"Authorization": f"Bearer {test_user['access_token']}"}
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_list_user_shares_reading_not_found(self, test_client, test_user):
        """Should return 404 for non-existent reading"""
        fake_id = str(uuid4())
        response = test_client.get(
            f"/api/v1/readings/{fake_id}/shares",
            headers={"Authorization": f"Bearer {test_user['access_token']}"}
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_list_user_shares_empty_list(self, test_client, test_user, test_reading):
        """Should return empty list if no shares exist"""
        response = test_client.get(
            f"/api/v1/readings/{test_reading.id}/shares",
            headers={"Authorization": f"Bearer {test_user['access_token']}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert data["shares"] == []

    def test_list_user_shares_unauthenticated(self, test_client, test_reading):
        """Should require authentication"""
        response = test_client.get(f"/api/v1/readings/{test_reading.id}/shares")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ========== Fixtures ==========

@pytest.fixture
def test_user(db_session):
    """Create a test user and return authentication details"""
    from app.models.user import User

    user = User(
        id=uuid4(),  # UUID object, not string
        name="test_user",
        email="test@example.com",
        password_hash="fake_hash",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Mock access token for testing
    access_token = "test_access_token"

    return {
        "user": user,
        "access_token": access_token
    }


@pytest.fixture
def test_client(client, test_user):
    """Override authentication for test client"""
    from unittest.mock import patch
    from app.core.dependencies import get_current_user

    def mock_get_current_user():
        return test_user["user"]

    # Patch the dependency
    from app.main import app
    app.dependency_overrides[get_current_user] = mock_get_current_user

    yield client

    # Clean up
    app.dependency_overrides.clear()


@pytest.fixture
def test_reading(db_session, test_user):
    """Create a test reading"""
    from app.models.reading_enhanced import CompletedReading, SpreadTemplate

    spread = SpreadTemplate(
        id=uuid4(),  # UUID object
        name="single_wasteland",
        display_name="單卡廢土占卜",
        description="Test spread",
        spread_type="single_wasteland",
        card_count=1,
        positions=[]
    )
    db_session.add(spread)
    db_session.commit()

    reading = CompletedReading(
        id=uuid4(),  # UUID object
        user_id=test_user["user"].id,
        spread_template_id=spread.id,
        question="Test question?",
        character_voice_used="pip_boy",
        karma_context="neutral",
        overall_interpretation="Test interpretation"
    )
    db_session.add(reading)
    db_session.commit()
    db_session.refresh(reading)

    return reading


@pytest.fixture
def other_user_reading(db_session):
    """Create a reading belonging to another user"""
    from app.models.user import User
    from app.models.reading_enhanced import CompletedReading, SpreadTemplate

    other_user = User(
        id=uuid4(),  # UUID object
        name="other_user",
        email="other@example.com",
        password_hash="fake_hash"
    )
    db_session.add(other_user)
    db_session.commit()

    spread = SpreadTemplate(
        id=uuid4(),  # UUID object
        name="single_wasteland",
        display_name="單卡廢土占卜",
        description="Test spread",
        spread_type="single_wasteland",
        card_count=1,
        positions=[]
    )
    db_session.add(spread)
    db_session.commit()

    reading = CompletedReading(
        id=uuid4(),  # UUID object
        user_id=other_user.id,
        spread_template_id=spread.id,
        question="Other user's question?",
        character_voice_used="pip_boy",
        karma_context="neutral",
        overall_interpretation="Other interpretation"
    )
    db_session.add(reading)
    db_session.commit()
    db_session.refresh(reading)

    return reading


@pytest.fixture
def shared_reading(db_session, test_reading):
    """Create a publicly shared reading"""
    from app.models.share import ReadingShare

    share_uuid = str(uuid4())
    share = ReadingShare(
        id=str(uuid4()),
        uuid=share_uuid,
        reading_id=str(test_reading.id),
        password_hash=None,
        access_count=0,
        is_active=True
    )
    db_session.add(share)
    db_session.commit()

    return {
        "uuid": share_uuid,
        "reading_id": str(test_reading.id)
    }


@pytest.fixture
def password_protected_share(db_session, test_reading):
    """Create a password-protected share"""
    import bcrypt
    from app.models.share import ReadingShare

    share_uuid = str(uuid4())
    password = "1234"
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    share = ReadingShare(
        id=str(uuid4()),
        uuid=share_uuid,
        reading_id=str(test_reading.id),
        password_hash=password_hash,
        access_count=0,
        is_active=True
    )
    db_session.add(share)
    db_session.commit()

    return {
        "uuid": share_uuid,
        "reading_id": str(test_reading.id),
        "password": password
    }


@pytest.fixture
def revoked_share(db_session, test_reading):
    """Create a revoked (inactive) share"""
    from app.models.share import ReadingShare

    share_uuid = str(uuid4())
    share = ReadingShare(
        id=str(uuid4()),
        uuid=share_uuid,
        reading_id=str(test_reading.id),
        password_hash=None,
        access_count=5,
        is_active=False
    )
    db_session.add(share)
    db_session.commit()

    return {
        "uuid": share_uuid,
        "reading_id": str(test_reading.id)
    }


@pytest.fixture
def test_reading_with_multiple_shares(db_session, test_reading):
    """Create a reading with multiple active shares"""
    from app.models.share import ReadingShare

    reading_id = str(test_reading.id)

    for _ in range(3):
        share = ReadingShare(
            id=str(uuid4()),
            uuid=str(uuid4()),
            reading_id=reading_id,
            password_hash=None,
            access_count=0,
            is_active=True
        )
        db_session.add(share)

    db_session.commit()

    return {"reading_id": reading_id}


@pytest.fixture
def test_reading_with_mixed_shares(db_session, test_reading):
    """Create a reading with both active and inactive shares"""
    from app.models.share import ReadingShare

    reading_id = str(test_reading.id)

    # 2 active shares
    for _ in range(2):
        share = ReadingShare(
            id=str(uuid4()),
            uuid=str(uuid4()),
            reading_id=reading_id,
            password_hash=None,
            access_count=0,
            is_active=True
        )
        db_session.add(share)

    # 1 inactive share
    share = ReadingShare(
        id=str(uuid4()),
        uuid=str(uuid4()),
        reading_id=reading_id,
        password_hash=None,
        access_count=3,
        is_active=False
    )
    db_session.add(share)

    db_session.commit()

    return {"reading_id": reading_id}


@pytest.fixture
def other_user_share(db_session, other_user_reading):
    """Create a share belonging to another user"""
    from app.models.share import ReadingShare

    share_uuid = str(uuid4())
    share = ReadingShare(
        id=str(uuid4()),
        uuid=share_uuid,
        reading_id=str(other_user_reading.id),
        password_hash=None,
        access_count=0,
        is_active=True
    )
    db_session.add(share)
    db_session.commit()

    return {
        "uuid": share_uuid,
        "reading_id": str(other_user_reading.id)
    }
