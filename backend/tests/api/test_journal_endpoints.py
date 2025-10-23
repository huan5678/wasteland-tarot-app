"""
Journal API Endpoints Integration Tests
Tests Phase 4: FastAPI routes for journal CRUD operations

Test Coverage:
- POST /api/v1/readings/{reading_id}/journal - Create journal
- GET /api/v1/journals - List user's journals (paginated)
- GET /api/v1/journals/{journal_id} - Get single journal
- PUT /api/v1/journals/{journal_id} - Update journal
- DELETE /api/v1/journals/{journal_id} - Delete journal

Following TDD methodology - tests written first
"""

import pytest
import pytest_asyncio
from datetime import datetime
from typing import Dict, Any
from uuid import uuid4
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reading_journal import ReadingJournal
from app.models.reading_enhanced import CompletedReading
from app.models.user import User
from app.core.security import get_password_hash


# Test fixtures

@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user for journal operations"""
    user = User(
        name="test_journal_user",
        email="journal_test@wasteland.com",
        password_hash=get_password_hash("test_password_123"),
        karma_score=50,
        faction_alignment="neutral"
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_reading(db_session: AsyncSession, test_user: User) -> CompletedReading:
    """Create a test completed reading for journal"""
    reading = CompletedReading(
        user_id=test_user.id,
        question="Test reading question",
        character_voice_used="pip_boy",
        karma_context="neutral",
        overall_interpretation="Test interpretation"
    )
    db_session.add(reading)
    await db_session.commit()
    await db_session.refresh(reading)
    return reading


@pytest_asyncio.fixture
async def test_journal(
    db_session: AsyncSession,
    test_user: User,
    test_reading: CompletedReading
) -> ReadingJournal:
    """Create a test journal entry"""
    journal = ReadingJournal(
        reading_id=test_reading.id,
        user_id=test_user.id,
        content="# Test Journal\n\nThis is a test journal entry.",
        mood_tags=["hopeful", "reflective"],
        is_private=True
    )
    db_session.add(journal)
    await db_session.commit()
    await db_session.refresh(journal)
    return journal


@pytest_asyncio.fixture
async def multiple_journals(
    db_session: AsyncSession,
    test_user: User
) -> list[ReadingJournal]:
    """Create multiple journal entries for pagination testing"""
    journals = []
    for i in range(5):
        # Create reading for each journal
        reading = CompletedReading(
            user_id=test_user.id,
            question=f"Reading {i}",
            character_voice_used="pip_boy",
            karma_context="neutral"
        )
        db_session.add(reading)
        await db_session.flush()

        # Create journal
        journal = ReadingJournal(
            reading_id=reading.id,
            user_id=test_user.id,
            content=f"# Journal {i}\n\nContent for journal {i}",
            mood_tags=["hopeful"],
            is_private=True
        )
        db_session.add(journal)
        journals.append(journal)

    await db_session.commit()
    return journals


# Test Class: Create Journal (Task 5.1)

@pytest.mark.api
class TestCreateJournal:
    """Test POST /api/v1/readings/{reading_id}/journal - Create journal"""

    async def test_create_journal_success(
        self,
        async_client: AsyncClient,
        test_reading: CompletedReading
    ):
        """
        Test successfully creating a journal entry.

        Expected: 201 Created with journal data
        """
        journal_data = {
            "content": "# Today's Reading\n\nDrew the Fool card. Feeling optimistic!",
            "mood_tags": ["hopeful", "excited"],
            "is_private": True
        }

        response = await async_client.post(
            f"/api/v1/readings/{test_reading.id}/journal",
            json=journal_data
        )

        assert response.status_code == 201
        data = response.json()

        assert "id" in data
        assert data["reading_id"] == str(test_reading.id)
        assert data["content"] == journal_data["content"]
        assert data["mood_tags"] == journal_data["mood_tags"]
        assert data["is_private"] is True
        assert "created_at" in data
        assert "updated_at" in data

    async def test_create_journal_minimal_data(
        self,
        async_client: AsyncClient,
        test_reading: CompletedReading
    ):
        """
        Test creating journal with only required fields.

        Expected: 201 Created with defaults applied
        """
        journal_data = {
            "content": "Minimal journal entry."
        }

        response = await async_client.post(
            f"/api/v1/readings/{test_reading.id}/journal",
            json=journal_data
        )

        assert response.status_code == 201
        data = response.json()

        assert data["content"] == journal_data["content"]
        assert data["mood_tags"] == []  # Default empty list
        assert data["is_private"] is True  # Default True

    async def test_create_journal_reading_not_found(
        self,
        async_client: AsyncClient
    ):
        """
        Test creating journal for non-existent reading.

        Expected: 404 Not Found
        """
        fake_reading_id = uuid4()
        journal_data = {
            "content": "Test content"
        }

        response = await async_client.post(
            f"/api/v1/readings/{fake_reading_id}/journal",
            json=journal_data
        )

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "reading not found" in data["detail"].lower()

    async def test_create_journal_duplicate_fails(
        self,
        async_client: AsyncClient,
        test_journal: ReadingJournal,
        test_reading: CompletedReading
    ):
        """
        Test creating duplicate journal for same reading.

        Business rule: One journal per reading per user (UNIQUE constraint)
        Expected: 409 Conflict
        """
        journal_data = {
            "content": "Duplicate journal attempt"
        }

        response = await async_client.post(
            f"/api/v1/readings/{test_reading.id}/journal",
            json=journal_data
        )

        assert response.status_code == 409
        data = response.json()
        assert "detail" in data
        assert "already exists" in data["detail"].lower()

    async def test_create_journal_content_too_long(
        self,
        async_client: AsyncClient,
        test_reading: CompletedReading
    ):
        """
        Test creating journal with content exceeding 10,000 characters.

        Expected: 400 Bad Request or 422 Unprocessable Entity
        """
        journal_data = {
            "content": "A" * 10001  # 10,001 characters
        }

        response = await async_client.post(
            f"/api/v1/readings/{test_reading.id}/journal",
            json=journal_data
        )

        assert response.status_code in [400, 422]
        data = response.json()
        assert "detail" in data

    async def test_create_journal_too_many_mood_tags(
        self,
        async_client: AsyncClient,
        test_reading: CompletedReading
    ):
        """
        Test creating journal with more than 5 mood tags.

        Expected: 400 Bad Request or 422 Unprocessable Entity
        """
        journal_data = {
            "content": "Test content",
            "mood_tags": ["hopeful", "anxious", "reflective", "excited", "peaceful", "grateful"]  # 6 tags
        }

        response = await async_client.post(
            f"/api/v1/readings/{test_reading.id}/journal",
            json=journal_data
        )

        assert response.status_code in [400, 422]

    async def test_create_journal_invalid_mood_tag(
        self,
        async_client: AsyncClient,
        test_reading: CompletedReading
    ):
        """
        Test creating journal with invalid mood tag (not in whitelist).

        Expected: 400 Bad Request or 422 Unprocessable Entity
        """
        journal_data = {
            "content": "Test content",
            "mood_tags": ["invalid_mood", "hopeful"]
        }

        response = await async_client.post(
            f"/api/v1/readings/{test_reading.id}/journal",
            json=journal_data
        )

        assert response.status_code in [400, 422]
        data = response.json()
        assert "detail" in data

    async def test_create_journal_missing_content(
        self,
        async_client: AsyncClient,
        test_reading: CompletedReading
    ):
        """
        Test creating journal without required content field.

        Expected: 422 Unprocessable Entity
        """
        journal_data = {
            "mood_tags": ["hopeful"]
            # Missing "content"
        }

        response = await async_client.post(
            f"/api/v1/readings/{test_reading.id}/journal",
            json=journal_data
        )

        assert response.status_code == 422


# Test Class: List Journals (Task 5.3)

@pytest.mark.api
class TestListJournals:
    """Test GET /api/v1/journals - List user's journals"""

    async def test_list_journals_success(
        self,
        async_client: AsyncClient,
        multiple_journals: list[ReadingJournal]
    ):
        """
        Test successfully listing user's journals.

        Expected: 200 OK with list of journals
        """
        response = await async_client.get("/api/v1/journals")

        assert response.status_code == 200
        data = response.json()

        assert "items" in data
        assert "total" in data
        assert len(data["items"]) == 5
        assert data["total"] == 5

    async def test_list_journals_pagination(
        self,
        async_client: AsyncClient,
        multiple_journals: list[ReadingJournal]
    ):
        """
        Test pagination parameters (skip, limit).

        Expected: Returns correct subset of journals
        """
        response = await async_client.get("/api/v1/journals?skip=2&limit=2")

        assert response.status_code == 200
        data = response.json()

        assert len(data["items"]) == 2
        assert data["total"] == 5  # Total count unchanged

    async def test_list_journals_empty(
        self,
        async_client: AsyncClient,
        test_user: User
    ):
        """
        Test listing journals when user has none.

        Expected: 200 OK with empty list
        """
        response = await async_client.get("/api/v1/journals")

        assert response.status_code == 200
        data = response.json()

        assert data["items"] == []
        assert data["total"] == 0

    async def test_list_journals_sorted_by_created_at(
        self,
        async_client: AsyncClient,
        multiple_journals: list[ReadingJournal]
    ):
        """
        Test journals are sorted by created_at DESC (newest first).

        Expected: Most recent journals appear first
        """
        response = await async_client.get("/api/v1/journals")

        assert response.status_code == 200
        data = response.json()

        items = data["items"]
        # Verify descending order
        for i in range(len(items) - 1):
            current_time = datetime.fromisoformat(items[i]["created_at"].replace("Z", "+00:00"))
            next_time = datetime.fromisoformat(items[i + 1]["created_at"].replace("Z", "+00:00"))
            assert current_time >= next_time


# Test Class: Get Single Journal (Task 5.3)

@pytest.mark.api
class TestGetJournal:
    """Test GET /api/v1/journals/{journal_id} - Get single journal"""

    async def test_get_journal_success(
        self,
        async_client: AsyncClient,
        test_journal: ReadingJournal
    ):
        """
        Test successfully getting a single journal.

        Expected: 200 OK with journal data
        """
        response = await async_client.get(f"/api/v1/journals/{test_journal.id}")

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == str(test_journal.id)
        assert data["content"] == test_journal.content
        assert data["mood_tags"] == test_journal.mood_tags
        assert data["is_private"] == test_journal.is_private

    async def test_get_journal_not_found(
        self,
        async_client: AsyncClient
    ):
        """
        Test getting non-existent journal.

        Expected: 404 Not Found
        """
        fake_journal_id = uuid4()
        response = await async_client.get(f"/api/v1/journals/{fake_journal_id}")

        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "journal not found" in data["detail"].lower()


# Test Class: Update Journal (Task 5.5)

@pytest.mark.api
class TestUpdateJournal:
    """Test PUT /api/v1/journals/{journal_id} - Update journal"""

    async def test_update_journal_success(
        self,
        async_client: AsyncClient,
        test_journal: ReadingJournal
    ):
        """
        Test successfully updating journal.

        Expected: 200 OK with updated journal
        """
        update_data = {
            "content": "# Updated Journal\n\nThis content has been updated.",
            "mood_tags": ["peaceful", "grateful"],
            "is_private": False
        }

        response = await async_client.put(
            f"/api/v1/journals/{test_journal.id}",
            json=update_data
        )

        assert response.status_code == 200
        data = response.json()

        assert data["content"] == update_data["content"]
        assert data["mood_tags"] == update_data["mood_tags"]
        assert data["is_private"] is False

    async def test_update_journal_partial(
        self,
        async_client: AsyncClient,
        test_journal: ReadingJournal
    ):
        """
        Test partial update (only some fields).

        Expected: Only specified fields are updated
        """
        original_content = test_journal.content
        original_tags = test_journal.mood_tags

        update_data = {
            "is_private": False  # Only update privacy
        }

        response = await async_client.put(
            f"/api/v1/journals/{test_journal.id}",
            json=update_data
        )

        assert response.status_code == 200
        data = response.json()

        assert data["is_private"] is False  # Updated
        assert data["content"] == original_content  # Unchanged
        assert data["mood_tags"] == original_tags  # Unchanged

    async def test_update_journal_not_found(
        self,
        async_client: AsyncClient
    ):
        """
        Test updating non-existent journal.

        Expected: 404 Not Found
        """
        fake_journal_id = uuid4()
        update_data = {
            "content": "Updated content"
        }

        response = await async_client.put(
            f"/api/v1/journals/{fake_journal_id}",
            json=update_data
        )

        assert response.status_code == 404

    async def test_update_journal_content_too_long(
        self,
        async_client: AsyncClient,
        test_journal: ReadingJournal
    ):
        """
        Test updating with content exceeding 10,000 characters.

        Expected: 400 Bad Request or 422 Unprocessable Entity
        """
        update_data = {
            "content": "A" * 10001
        }

        response = await async_client.put(
            f"/api/v1/journals/{test_journal.id}",
            json=update_data
        )

        assert response.status_code in [400, 422]

    async def test_update_journal_invalid_mood_tag(
        self,
        async_client: AsyncClient,
        test_journal: ReadingJournal
    ):
        """
        Test updating with invalid mood tag.

        Expected: 400 Bad Request or 422 Unprocessable Entity
        """
        update_data = {
            "mood_tags": ["invalid_tag"]
        }

        response = await async_client.put(
            f"/api/v1/journals/{test_journal.id}",
            json=update_data
        )

        assert response.status_code in [400, 422]


# Test Class: Delete Journal (Task 5.5)

@pytest.mark.api
class TestDeleteJournal:
    """Test DELETE /api/v1/journals/{journal_id} - Delete journal"""

    async def test_delete_journal_success(
        self,
        async_client: AsyncClient,
        test_journal: ReadingJournal
    ):
        """
        Test successfully deleting journal.

        Expected: 204 No Content
        """
        response = await async_client.delete(f"/api/v1/journals/{test_journal.id}")

        assert response.status_code == 204

        # Verify journal is deleted by trying to get it
        get_response = await async_client.get(f"/api/v1/journals/{test_journal.id}")
        assert get_response.status_code == 404

    async def test_delete_journal_not_found(
        self,
        async_client: AsyncClient
    ):
        """
        Test deleting non-existent journal.

        Expected: 404 Not Found
        """
        fake_journal_id = uuid4()
        response = await async_client.delete(f"/api/v1/journals/{fake_journal_id}")

        assert response.status_code == 404


# Test Class: Error Handling

@pytest.mark.api
class TestJournalErrorHandling:
    """Test comprehensive error handling across all journal endpoints"""

    async def test_invalid_uuid_format(
        self,
        async_client: AsyncClient
    ):
        """
        Test endpoints with invalid UUID format.

        Expected: 422 Unprocessable Entity
        """
        invalid_id = "not-a-uuid"
        response = await async_client.get(f"/api/v1/journals/{invalid_id}")

        assert response.status_code == 422

    async def test_error_response_format(
        self,
        async_client: AsyncClient
    ):
        """
        Test that all errors follow consistent format.

        Expected: Errors have "detail" field
        """
        fake_id = uuid4()
        response = await async_client.get(f"/api/v1/journals/{fake_id}")

        if response.status_code >= 400:
            data = response.json()
            assert "detail" in data
