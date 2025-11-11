"""
Share API Endpoints Tests

Task 16.8: Create share API endpoints
Requirements: 10.2, 10.6, 10.7, 10.8

Test Suite covering:
- POST /api/v1/readings/{id}/share (generate share link)
- GET /api/v1/share/{uuid} (view shared reading)
- DELETE /api/v1/share/{uuid} (revoke share)
- GET /api/v1/readings/{id}/shares (list user's shares)
- Password protection
- Access tracking
- Privacy (PII stripping)
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.models.user import User
from app.models.reading_enhanced import CompletedReading
from app.models.share import ReadingShare
from datetime import datetime, timedelta
import uuid as uuid_lib

client = TestClient(app)


@pytest.fixture
def test_user(db: Session):
    """Create a test user"""
    user = User(
        id=str(uuid_lib.uuid4()),
        username="test_user",
        email="test@example.com",
        hashed_password="hashed_password_here",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_reading(db: Session, test_user: User):
    """Create a test reading"""
    reading = CompletedReading(
        id=str(uuid_lib.uuid4()),
        user_id=test_user.id,
        question="我的未來如何？",
        spread_type="single_card",
        cards_drawn=[
            {
                "id": "the-fool",
                "name": "愚者",
                "suit": "major_arcana",
                "position": "upright",
                "positionIndex": 0,
            }
        ],
        interpretation="根據愚者牌的指引，你正處於新旅程的開始...",
        created_at=datetime.utcnow(),
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading


@pytest.fixture
def auth_headers(test_user: User):
    """Generate authentication headers"""
    # Mock JWT token generation
    from app.core.security import create_access_token
    token = create_access_token(data={"sub": test_user.id})
    return {"Authorization": f"Bearer {token}"}


class TestGenerateShareLink:
    """Test POST /api/v1/readings/{id}/share"""

    def test_generate_share_link_success(self, db: Session, test_reading: CompletedReading, auth_headers: dict):
        """Should generate anonymous share link"""
        response = client.post(
            f"/api/v1/readings/{test_reading.id}/share",
            json={},
            headers=auth_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert "share_url" in data
        assert "uuid" in data
        assert data["share_url"].startswith("https://wasteland-tarot.com/share/")
        assert "access_count" in data
        assert data["access_count"] == 0

    def test_generate_share_link_with_password(self, db: Session, test_reading: CompletedReading, auth_headers: dict):
        """Should generate password-protected share link"""
        response = client.post(
            f"/api/v1/readings/{test_reading.id}/share",
            json={"password": "1234"},
            headers=auth_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert "share_url" in data
        assert "has_password" in data
        assert data["has_password"] is True

    def test_generate_share_link_invalid_password_length(self, db: Session, test_reading: CompletedReading, auth_headers: dict):
        """Should reject password outside 4-8 digit range"""
        # Too short
        response = client.post(
            f"/api/v1/readings/{test_reading.id}/share",
            json={"password": "123"},
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "密碼必須為 4-8 位數" in response.json()["detail"]

        # Too long
        response = client.post(
            f"/api/v1/readings/{test_reading.id}/share",
            json={"password": "123456789"},
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "密碼必須為 4-8 位數" in response.json()["detail"]

    def test_generate_share_link_reading_not_found(self, auth_headers: dict):
        """Should return 404 for non-existent reading"""
        response = client.post(
            f"/api/v1/readings/{uuid_lib.uuid4()}/share",
            json={},
            headers=auth_headers,
        )
        assert response.status_code == 404
        assert "找不到此解讀記錄" in response.json()["detail"]

    def test_generate_share_link_unauthorized(self, db: Session, test_reading: CompletedReading):
        """Should return 401 without authentication"""
        response = client.post(
            f"/api/v1/readings/{test_reading.id}/share",
            json={},
        )
        assert response.status_code == 401

    def test_generate_share_link_forbidden_other_user(self, db: Session, test_reading: CompletedReading):
        """Should return 403 when trying to share another user's reading"""
        # Create another user
        other_user = User(
            id=str(uuid_lib.uuid4()),
            username="other_user",
            email="other@example.com",
            hashed_password="hashed",
        )
        db.add(other_user)
        db.commit()

        from app.core.security import create_access_token
        token = create_access_token(data={"sub": other_user.id})
        headers = {"Authorization": f"Bearer {token}"}

        response = client.post(
            f"/api/v1/readings/{test_reading.id}/share",
            json={},
            headers=headers,
        )
        assert response.status_code == 403
        assert "無權分享此解讀" in response.json()["detail"]


class TestViewSharedReading:
    """Test GET /api/v1/share/{uuid}"""

    @pytest.fixture
    def test_share(self, db: Session, test_reading: CompletedReading):
        """Create a test share"""
        share = ReadingShare(
            id=str(uuid_lib.uuid4()),
            uuid=str(uuid_lib.uuid4()),
            reading_id=test_reading.id,
            created_at=datetime.utcnow(),
            is_active=True,
            access_count=0,
        )
        db.add(share)
        db.commit()
        db.refresh(share)
        return share

    def test_view_shared_reading_success(self, db: Session, test_share: ReadingShare):
        """Should return shared reading without PII"""
        response = client.get(f"/api/v1/share/{test_share.uuid}")

        assert response.status_code == 200
        data = response.json()
        assert "question" in data
        assert "cards_drawn" in data
        assert "interpretation" in data
        assert "user_id" not in data  # PII stripped
        assert "user_email" not in data  # PII stripped
        assert "karma" not in data  # PII stripped
        assert "faction" not in data  # PII stripped

    def test_view_shared_reading_increments_access_count(self, db: Session, test_share: ReadingShare):
        """Should increment access count on each view"""
        initial_count = test_share.access_count

        client.get(f"/api/v1/share/{test_share.uuid}")

        db.refresh(test_share)
        assert test_share.access_count == initial_count + 1

    def test_view_shared_reading_with_password(self, db: Session, test_reading: CompletedReading):
        """Should require password for protected shares"""
        import bcrypt
        hashed_password = bcrypt.hashpw("1234".encode(), bcrypt.gensalt()).decode()

        share = ReadingShare(
            id=str(uuid_lib.uuid4()),
            uuid=str(uuid_lib.uuid4()),
            reading_id=test_reading.id,
            password_hash=hashed_password,
            is_active=True,
            access_count=0,
        )
        db.add(share)
        db.commit()

        # Without password
        response = client.get(f"/api/v1/share/{share.uuid}")
        assert response.status_code == 401
        assert "需要密碼" in response.json()["detail"]

        # With wrong password
        response = client.get(f"/api/v1/share/{share.uuid}", json={"password": "wrong"})
        assert response.status_code == 401
        assert "密碼錯誤" in response.json()["detail"]

        # With correct password
        response = client.get(f"/api/v1/share/{share.uuid}", json={"password": "1234"})
        assert response.status_code == 200

    def test_view_shared_reading_not_found(self):
        """Should return 404 for non-existent share"""
        response = client.get(f"/api/v1/share/{uuid_lib.uuid4()}")
        assert response.status_code == 404
        assert "分享連結不存在" in response.json()["detail"]

    def test_view_revoked_share(self, db: Session, test_share: ReadingShare):
        """Should show revoked message for inactive shares"""
        test_share.is_active = False
        db.commit()

        response = client.get(f"/api/v1/share/{test_share.uuid}")
        assert response.status_code == 410
        assert "此解讀已被擁有者撤回" in response.json()["detail"]


class TestRevokeShare:
    """Test DELETE /api/v1/share/{uuid}"""

    @pytest.fixture
    def test_share(self, db: Session, test_reading: CompletedReading):
        """Create a test share"""
        share = ReadingShare(
            id=str(uuid_lib.uuid4()),
            uuid=str(uuid_lib.uuid4()),
            reading_id=test_reading.id,
            is_active=True,
            access_count=0,
        )
        db.add(share)
        db.commit()
        db.refresh(share)
        return share

    def test_revoke_share_success(self, db: Session, test_share: ReadingShare, auth_headers: dict):
        """Should revoke share successfully"""
        response = client.delete(
            f"/api/v1/share/{test_share.uuid}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert "已撤回分享連結" in response.json()["message"]

        # Verify share is inactive
        db.refresh(test_share)
        assert test_share.is_active is False

    def test_revoke_share_not_found(self, auth_headers: dict):
        """Should return 404 for non-existent share"""
        response = client.delete(
            f"/api/v1/share/{uuid_lib.uuid4()}",
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_revoke_share_unauthorized(self, db: Session, test_share: ReadingShare):
        """Should return 401 without authentication"""
        response = client.delete(f"/api/v1/share/{test_share.uuid}")
        assert response.status_code == 401

    def test_revoke_share_forbidden_other_user(self, db: Session, test_share: ReadingShare):
        """Should return 403 when trying to revoke another user's share"""
        other_user = User(
            id=str(uuid_lib.uuid4()),
            username="other_user",
            email="other@example.com",
            hashed_password="hashed",
        )
        db.add(other_user)
        db.commit()

        from app.core.security import create_access_token
        token = create_access_token(data={"sub": other_user.id})
        headers = {"Authorization": f"Bearer {token}"}

        response = client.delete(
            f"/api/v1/share/{test_share.uuid}",
            headers=headers,
        )
        assert response.status_code == 403


class TestListUserShares:
    """Test GET /api/v1/readings/{id}/shares"""

    @pytest.fixture
    def multiple_shares(self, db: Session, test_reading: CompletedReading):
        """Create multiple test shares"""
        shares = []
        for i in range(3):
            share = ReadingShare(
                id=str(uuid_lib.uuid4()),
                uuid=str(uuid_lib.uuid4()),
                reading_id=test_reading.id,
                is_active=i < 2,  # Make last one inactive
                access_count=i * 5,
                created_at=datetime.utcnow() - timedelta(days=i),
            )
            db.add(share)
            shares.append(share)
        db.commit()
        return shares

    def test_list_shares_success(self, db: Session, test_reading: CompletedReading, multiple_shares: list, auth_headers: dict):
        """Should list all shares for reading"""
        response = client.get(
            f"/api/v1/readings/{test_reading.id}/shares",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert all("uuid" in share for share in data)
        assert all("access_count" in share for share in data)
        assert all("is_active" in share for share in data)
        assert all("created_at" in share for share in data)

    def test_list_shares_only_active(self, db: Session, test_reading: CompletedReading, multiple_shares: list, auth_headers: dict):
        """Should filter only active shares when requested"""
        response = client.get(
            f"/api/v1/readings/{test_reading.id}/shares?active_only=true",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all(share["is_active"] for share in data)

    def test_list_shares_unauthorized(self, db: Session, test_reading: CompletedReading):
        """Should return 401 without authentication"""
        response = client.get(f"/api/v1/readings/{test_reading.id}/shares")
        assert response.status_code == 401

    def test_list_shares_forbidden_other_user(self, db: Session, test_reading: CompletedReading, multiple_shares: list):
        """Should return 403 when accessing another user's shares"""
        other_user = User(
            id=str(uuid_lib.uuid4()),
            username="other_user",
            email="other@example.com",
            hashed_password="hashed",
        )
        db.add(other_user)
        db.commit()

        from app.core.security import create_access_token
        token = create_access_token(data={"sub": other_user.id})
        headers = {"Authorization": f"Bearer {token}"}

        response = client.get(
            f"/api/v1/readings/{test_reading.id}/shares",
            headers=headers,
        )
        assert response.status_code == 403


class TestPrivacyAndSecurity:
    """Test privacy and security features"""

    def test_pii_stripped_from_shared_reading(self, db: Session, test_user: User):
        """Should strip all PII from shared readings"""
        reading = CompletedReading(
            id=str(uuid_lib.uuid4()),
            user_id=test_user.id,
            question="私密問題",
            spread_type="single_card",
            cards_drawn=[{"id": "the-fool"}],
            interpretation="解讀內容",
            karma_at_reading=50,
            faction_affinities={"Brotherhood": 80},
        )
        db.add(reading)

        share = ReadingShare(
            id=str(uuid_lib.uuid4()),
            uuid=str(uuid_lib.uuid4()),
            reading_id=reading.id,
            is_active=True,
        )
        db.add(share)
        db.commit()

        response = client.get(f"/api/v1/share/{share.uuid}")

        data = response.json()
        assert "user_id" not in data
        assert "karma_at_reading" not in data
        assert "faction_affinities" not in data
        assert "user" not in data

    def test_password_hashing_with_bcrypt(self, db: Session, test_reading: CompletedReading, auth_headers: dict):
        """Should hash passwords with bcrypt before storing"""
        response = client.post(
            f"/api/v1/readings/{test_reading.id}/share",
            json={"password": "1234"},
            headers=auth_headers,
        )

        assert response.status_code == 201

        # Verify password is hashed in database
        share_uuid = response.json()["uuid"]
        share = db.query(ReadingShare).filter(ReadingShare.uuid == share_uuid).first()

        assert share.password_hash is not None
        assert share.password_hash != "1234"  # Not plain text
        assert len(share.password_hash) > 50  # Bcrypt hash length

    def test_access_tracking_accuracy(self, db: Session, test_reading: CompletedReading, auth_headers: dict):
        """Should accurately track access count"""
        response = client.post(
            f"/api/v1/readings/{test_reading.id}/share",
            json={},
            headers=auth_headers,
        )
        share_uuid = response.json()["uuid"]

        # Access 5 times
        for _ in range(5):
            client.get(f"/api/v1/share/{share_uuid}")

        # Check access count
        response = client.get(
            f"/api/v1/readings/{test_reading.id}/shares",
            headers=auth_headers,
        )
        shares = response.json()
        share_data = next(s for s in shares if s["uuid"] == share_uuid)
        assert share_data["access_count"] == 5


class TestEdgeCases:
    """Test edge cases and error scenarios"""

    def test_generate_share_for_deleted_reading(self, db: Session, test_reading: CompletedReading, auth_headers: dict):
        """Should handle deleted readings gracefully"""
        test_reading.deleted_at = datetime.utcnow()
        db.commit()

        response = client.post(
            f"/api/v1/readings/{test_reading.id}/share",
            json={},
            headers=auth_headers,
        )
        assert response.status_code == 404

    def test_concurrent_share_generation(self, db: Session, test_reading: CompletedReading, auth_headers: dict):
        """Should handle concurrent share generation"""
        import concurrent.futures

        def create_share():
            return client.post(
                f"/api/v1/readings/{test_reading.id}/share",
                json={},
                headers=auth_headers,
            )

        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(create_share) for _ in range(5)]
            responses = [f.result() for f in futures]

        # All should succeed
        assert all(r.status_code == 201 for r in responses)

        # All should have unique UUIDs
        uuids = [r.json()["uuid"] for r in responses]
        assert len(set(uuids)) == 5

    def test_revoke_already_revoked_share(self, db: Session, test_reading: CompletedReading, auth_headers: dict):
        """Should handle revoking already revoked shares"""
        share = ReadingShare(
            id=str(uuid_lib.uuid4()),
            uuid=str(uuid_lib.uuid4()),
            reading_id=test_reading.id,
            is_active=False,  # Already revoked
        )
        db.add(share)
        db.commit()

        response = client.delete(
            f"/api/v1/share/{share.uuid}",
            headers=auth_headers,
        )
        # Should still return success (idempotent)
        assert response.status_code == 200
