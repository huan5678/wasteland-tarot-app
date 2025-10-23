"""
JournalService Unit Tests - Tarot Journal System
Testing journal CRUD operations with business logic validation
Follows TDD methodology: RED phase - tests written before implementation
"""

import pytest
import uuid
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException


@pytest.mark.unit
@pytest.mark.asyncio
class TestJournalServiceCreate:
    """Test JournalService.create_journal() method"""

    @pytest.fixture
    def mock_db(self):
        """Create mock database session"""
        db = AsyncMock(spec=AsyncSession)
        return db

    @pytest.fixture
    def journal_service(self, mock_db):
        """Create JournalService instance (will be implemented)"""
        from app.services.journal_service import JournalService
        return JournalService(mock_db)

    @pytest.mark.asyncio
    async def test_create_journal_success(self, journal_service, mock_db):
        """
        Test successful journal creation with valid data.

        Business Rules:
        - Reading must exist and belong to the user
        - Content length <= 10,000 characters
        - Mood tags count <= 5
        - One journal per reading per user (UNIQUE constraint)
        """
        user_id = uuid.uuid4()
        reading_id = uuid.uuid4()
        content = "# Today's Reading\n\nThe Fool appeared today!"
        mood_tags = ["hopeful", "excited"]

        # Mock reading exists and belongs to user
        from app.models.reading_enhanced import CompletedReading
        mock_reading = CompletedReading(
            id=reading_id,
            user_id=user_id,
            question="Test question",
            character_voice_used="pip_boy",
            karma_context="neutral"
        )

        # Mock database query for reading
        mock_execute_result = MagicMock()
        mock_execute_result.scalar_one_or_none.return_value = mock_reading
        mock_db.execute.return_value = mock_execute_result

        # Mock database operations
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        # Execute
        result = await journal_service.create_journal(
            reading_id=reading_id,
            user_id=user_id,
            content=content,
            mood_tags=mood_tags,
            is_private=True
        )

        # Verify journal was created
        assert mock_db.add.called
        journal_arg = mock_db.add.call_args[0][0]
        assert journal_arg.reading_id == reading_id
        assert journal_arg.user_id == user_id
        assert journal_arg.content == content
        assert journal_arg.mood_tags == mood_tags
        assert journal_arg.is_private is True

        # Verify database operations
        assert mock_db.commit.called
        assert mock_db.refresh.called

        # Verify return value contains journal data
        assert result is not None
        assert "id" in result or hasattr(result, "id")

    @pytest.mark.asyncio
    async def test_create_journal_duplicate_fails(self, journal_service, mock_db):
        """
        Test duplicate journal creation fails with IntegrityError.

        Constraint: UNIQUE (reading_id, user_id)
        Expected: 409 Conflict error
        """
        user_id = uuid.uuid4()
        reading_id = uuid.uuid4()

        # Mock reading exists
        from app.models.reading_enhanced import CompletedReading
        mock_reading = CompletedReading(
            id=reading_id,
            user_id=user_id,
            question="Test question",
            character_voice_used="pip_boy",
            karma_context="neutral"
        )

        mock_execute_result = MagicMock()
        mock_execute_result.scalar_one_or_none.return_value = mock_reading
        mock_db.execute.return_value = mock_execute_result

        # Mock database raises IntegrityError on duplicate
        mock_db.commit = AsyncMock(
            side_effect=IntegrityError("UNIQUE constraint failed", None, None)
        )

        # Verify raises HTTPException with 409 Conflict
        with pytest.raises(HTTPException) as exc_info:
            await journal_service.create_journal(
                reading_id=reading_id,
                user_id=user_id,
                content="Duplicate journal",
                mood_tags=[],
                is_private=True
            )

        assert exc_info.value.status_code == 409
        assert "already exists" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_create_journal_reading_not_found(self, journal_service, mock_db):
        """
        Test journal creation fails when reading doesn't exist.

        Expected: 404 Not Found error
        """
        user_id = uuid.uuid4()
        reading_id = uuid.uuid4()

        # Mock reading not found
        mock_execute_result = MagicMock()
        mock_execute_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_execute_result

        # Verify raises HTTPException with 404
        with pytest.raises(HTTPException) as exc_info:
            await journal_service.create_journal(
                reading_id=reading_id,
                user_id=user_id,
                content="Test content",
                mood_tags=[],
                is_private=True
            )

        assert exc_info.value.status_code == 404
        assert "reading not found" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_create_journal_reading_not_owned_by_user(self, journal_service, mock_db):
        """
        Test journal creation fails when reading doesn't belong to user.

        Expected: 403 Forbidden error
        """
        user_id = uuid.uuid4()
        other_user_id = uuid.uuid4()
        reading_id = uuid.uuid4()

        # Mock reading belongs to different user
        from app.models.reading_enhanced import CompletedReading
        mock_reading = CompletedReading(
            id=reading_id,
            user_id=other_user_id,  # Different user!
            question="Test question",
            character_voice_used="pip_boy",
            karma_context="neutral"
        )

        mock_execute_result = MagicMock()
        mock_execute_result.scalar_one_or_none.return_value = mock_reading
        mock_db.execute.return_value = mock_execute_result

        # Verify raises HTTPException with 403
        with pytest.raises(HTTPException) as exc_info:
            await journal_service.create_journal(
                reading_id=reading_id,
                user_id=user_id,
                content="Test content",
                mood_tags=[],
                is_private=True
            )

        assert exc_info.value.status_code == 403
        assert "not the owner" in exc_info.value.detail.lower() or "forbidden" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_create_journal_content_too_long(self, journal_service, mock_db):
        """
        Test journal creation fails when content exceeds 10,000 characters.

        Expected: 400 Bad Request error
        """
        user_id = uuid.uuid4()
        reading_id = uuid.uuid4()
        long_content = "A" * 10001  # 10,001 characters

        # Mock reading exists
        from app.models.reading_enhanced import CompletedReading
        mock_reading = CompletedReading(
            id=reading_id,
            user_id=user_id,
            question="Test question",
            character_voice_used="pip_boy",
            karma_context="neutral"
        )

        mock_execute_result = MagicMock()
        mock_execute_result.scalar_one_or_none.return_value = mock_reading
        mock_db.execute.return_value = mock_execute_result

        # Verify raises HTTPException with 400
        with pytest.raises(HTTPException) as exc_info:
            await journal_service.create_journal(
                reading_id=reading_id,
                user_id=user_id,
                content=long_content,
                mood_tags=[],
                is_private=True
            )

        assert exc_info.value.status_code == 400
        assert "content" in exc_info.value.detail.lower() and ("10000" in exc_info.value.detail or "too long" in exc_info.value.detail.lower())

    @pytest.mark.asyncio
    async def test_create_journal_too_many_mood_tags(self, journal_service, mock_db):
        """
        Test journal creation fails when mood_tags exceeds 5 tags.

        Expected: 400 Bad Request error
        """
        user_id = uuid.uuid4()
        reading_id = uuid.uuid4()
        too_many_tags = ["happy", "sad", "anxious", "hopeful", "peaceful", "excited"]  # 6 tags

        # Mock reading exists
        from app.models.reading_enhanced import CompletedReading
        mock_reading = CompletedReading(
            id=reading_id,
            user_id=user_id,
            question="Test question",
            character_voice_used="pip_boy",
            karma_context="neutral"
        )

        mock_execute_result = MagicMock()
        mock_execute_result.scalar_one_or_none.return_value = mock_reading
        mock_db.execute.return_value = mock_execute_result

        # Verify raises HTTPException with 400
        with pytest.raises(HTTPException) as exc_info:
            await journal_service.create_journal(
                reading_id=reading_id,
                user_id=user_id,
                content="Test content",
                mood_tags=too_many_tags,
                is_private=True
            )

        assert exc_info.value.status_code == 400
        assert "mood" in exc_info.value.detail.lower() and ("5" in exc_info.value.detail or "too many" in exc_info.value.detail.lower())


@pytest.mark.unit
@pytest.mark.asyncio
class TestJournalServiceQuery:
    """Test JournalService query methods (list, get)"""

    @pytest.fixture
    def mock_db(self):
        """Create mock database session"""
        db = AsyncMock(spec=AsyncSession)
        return db

    @pytest.fixture
    def journal_service(self, mock_db):
        """Create JournalService instance"""
        from app.services.journal_service import JournalService
        return JournalService(mock_db)

    @pytest.mark.asyncio
    async def test_list_journals_success(self, journal_service, mock_db):
        """
        Test listing user's journals with pagination.

        Expected: Returns list of journals sorted by created_at DESC
        """
        user_id = uuid.uuid4()

        # Mock journals
        from app.models.reading_journal import ReadingJournal
        mock_journals = [
            ReadingJournal(
                id=uuid.uuid4(),
                reading_id=uuid.uuid4(),
                user_id=user_id,
                content=f"Journal {i}",
                mood_tags=["hopeful"],
                is_private=True,
                created_at=datetime.utcnow()
            )
            for i in range(3)
        ]

        # Mock database query
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = mock_journals
        mock_db.execute.return_value = mock_result

        # Execute
        journals = await journal_service.list_journals(user_id, skip=0, limit=10)

        # Verify
        assert len(journals) == 3
        assert mock_db.execute.called

    @pytest.mark.asyncio
    async def test_list_journals_empty(self, journal_service, mock_db):
        """
        Test listing journals when user has no journals.

        Expected: Returns empty list
        """
        user_id = uuid.uuid4()

        # Mock empty result
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute.return_value = mock_result

        # Execute
        journals = await journal_service.list_journals(user_id, skip=0, limit=10)

        # Verify
        assert journals == []
        assert mock_db.execute.called

    @pytest.mark.asyncio
    async def test_get_journal_success(self, journal_service, mock_db):
        """
        Test getting a specific journal by ID.

        Expected: Returns journal with reading relationship loaded
        """
        user_id = uuid.uuid4()
        journal_id = uuid.uuid4()
        reading_id = uuid.uuid4()

        # Mock journal
        from app.models.reading_journal import ReadingJournal
        from app.models.reading_enhanced import CompletedReading

        mock_reading = CompletedReading(
            id=reading_id,
            user_id=user_id,
            question="Test question",
            character_voice_used="pip_boy",
            karma_context="neutral"
        )

        mock_journal = ReadingJournal(
            id=journal_id,
            reading_id=reading_id,
            user_id=user_id,
            content="Test content",
            mood_tags=["hopeful"],
            is_private=True
        )
        mock_journal.reading = mock_reading

        # Mock database query
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_journal
        mock_db.execute.return_value = mock_result

        # Execute
        journal = await journal_service.get_journal(journal_id, user_id)

        # Verify
        assert journal.id == journal_id
        assert journal.user_id == user_id
        assert journal.reading is not None
        assert mock_db.execute.called

    @pytest.mark.asyncio
    async def test_get_journal_not_found(self, journal_service, mock_db):
        """
        Test getting a journal that doesn't exist.

        Expected: 404 Not Found error
        """
        journal_id = uuid.uuid4()
        user_id = uuid.uuid4()

        # Mock journal not found
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        # Verify raises HTTPException with 404
        with pytest.raises(HTTPException) as exc_info:
            await journal_service.get_journal(journal_id, user_id)

        assert exc_info.value.status_code == 404
        assert "journal not found" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_get_journal_not_owned(self, journal_service, mock_db):
        """
        Test getting a journal that belongs to another user.

        Expected: 403 Forbidden error
        """
        user_id = uuid.uuid4()
        other_user_id = uuid.uuid4()
        journal_id = uuid.uuid4()

        # Mock journal belongs to different user
        from app.models.reading_journal import ReadingJournal
        mock_journal = ReadingJournal(
            id=journal_id,
            reading_id=uuid.uuid4(),
            user_id=other_user_id,  # Different user!
            content="Test content",
            mood_tags=[],
            is_private=True
        )

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_journal
        mock_db.execute.return_value = mock_result

        # Verify raises HTTPException with 403
        with pytest.raises(HTTPException) as exc_info:
            await journal_service.get_journal(journal_id, user_id)

        assert exc_info.value.status_code == 403
        assert "not the owner" in exc_info.value.detail.lower() or "journal" in exc_info.value.detail.lower()


@pytest.mark.unit
@pytest.mark.asyncio
class TestJournalServiceUpdateDelete:
    """Test JournalService update and delete methods"""

    @pytest.fixture
    def mock_db(self):
        """Create mock database session"""
        db = AsyncMock(spec=AsyncSession)
        return db

    @pytest.fixture
    def journal_service(self, mock_db):
        """Create JournalService instance"""
        from app.services.journal_service import JournalService
        return JournalService(mock_db)

    @pytest.mark.asyncio
    async def test_update_journal_success(self, journal_service, mock_db):
        """
        Test successfully updating journal content and mood tags.

        Expected: Journal is updated with new values
        """
        user_id = uuid.uuid4()
        journal_id = uuid.uuid4()

        # Mock existing journal
        from app.models.reading_journal import ReadingJournal
        mock_journal = ReadingJournal(
            id=journal_id,
            reading_id=uuid.uuid4(),
            user_id=user_id,
            content="Original content",
            mood_tags=["happy"],
            is_private=True
        )

        # Mock get_journal (will be called internally)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_journal
        mock_db.execute.return_value = mock_result
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        # Execute update
        updated_journal = await journal_service.update_journal(
            journal_id=journal_id,
            user_id=user_id,
            content="Updated content",
            mood_tags=["peaceful", "reflective"]
        )

        # Verify journal was updated
        assert mock_journal.content == "Updated content"
        assert mock_journal.mood_tags == ["peaceful", "reflective"]
        assert mock_db.commit.called
        assert mock_db.refresh.called

    @pytest.mark.asyncio
    async def test_update_journal_partial(self, journal_service, mock_db):
        """
        Test partial update (only updating some fields).

        Expected: Only specified fields are updated
        """
        user_id = uuid.uuid4()
        journal_id = uuid.uuid4()

        # Mock existing journal
        from app.models.reading_journal import ReadingJournal
        mock_journal = ReadingJournal(
            id=journal_id,
            reading_id=uuid.uuid4(),
            user_id=user_id,
            content="Original content",
            mood_tags=["happy"],
            is_private=True
        )

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_journal
        mock_db.execute.return_value = mock_result
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        # Update only is_private field
        await journal_service.update_journal(
            journal_id=journal_id,
            user_id=user_id,
            is_private=False  # Only update this field
        )

        # Verify only is_private changed
        assert mock_journal.is_private is False
        assert mock_journal.content == "Original content"  # Unchanged
        assert mock_journal.mood_tags == ["happy"]  # Unchanged

    @pytest.mark.asyncio
    async def test_update_journal_content_too_long(self, journal_service, mock_db):
        """
        Test updating with content exceeding 10,000 characters.

        Expected: 400 Bad Request error
        """
        user_id = uuid.uuid4()
        journal_id = uuid.uuid4()

        # Mock existing journal
        from app.models.reading_journal import ReadingJournal
        mock_journal = ReadingJournal(
            id=journal_id,
            reading_id=uuid.uuid4(),
            user_id=user_id,
            content="Original content",
            mood_tags=[],
            is_private=True
        )

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_journal
        mock_db.execute.return_value = mock_result

        long_content = "A" * 10001

        # Verify raises HTTPException with 400
        with pytest.raises(HTTPException) as exc_info:
            await journal_service.update_journal(
                journal_id=journal_id,
                user_id=user_id,
                content=long_content
            )

        assert exc_info.value.status_code == 400
        assert "content" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_update_journal_too_many_mood_tags(self, journal_service, mock_db):
        """
        Test updating with more than 5 mood tags.

        Expected: 400 Bad Request error
        """
        user_id = uuid.uuid4()
        journal_id = uuid.uuid4()

        # Mock existing journal
        from app.models.reading_journal import ReadingJournal
        mock_journal = ReadingJournal(
            id=journal_id,
            reading_id=uuid.uuid4(),
            user_id=user_id,
            content="Content",
            mood_tags=["happy"],
            is_private=True
        )

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_journal
        mock_db.execute.return_value = mock_result

        too_many_tags = ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"]

        # Verify raises HTTPException with 400
        with pytest.raises(HTTPException) as exc_info:
            await journal_service.update_journal(
                journal_id=journal_id,
                user_id=user_id,
                mood_tags=too_many_tags
            )

        assert exc_info.value.status_code == 400
        assert "mood" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_update_journal_not_found(self, journal_service, mock_db):
        """
        Test updating a journal that doesn't exist.

        Expected: 404 Not Found error (from get_journal)
        """
        user_id = uuid.uuid4()
        journal_id = uuid.uuid4()

        # Mock journal not found
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        # Verify raises HTTPException with 404
        with pytest.raises(HTTPException) as exc_info:
            await journal_service.update_journal(
                journal_id=journal_id,
                user_id=user_id,
                content="New content"
            )

        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_update_journal_not_owned(self, journal_service, mock_db):
        """
        Test updating a journal that belongs to another user.

        Expected: 403 Forbidden error (from get_journal)
        """
        user_id = uuid.uuid4()
        other_user_id = uuid.uuid4()
        journal_id = uuid.uuid4()

        # Mock journal belongs to different user
        from app.models.reading_journal import ReadingJournal
        mock_journal = ReadingJournal(
            id=journal_id,
            reading_id=uuid.uuid4(),
            user_id=other_user_id,  # Different user!
            content="Content",
            mood_tags=[],
            is_private=True
        )

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_journal
        mock_db.execute.return_value = mock_result

        # Verify raises HTTPException with 403
        with pytest.raises(HTTPException) as exc_info:
            await journal_service.update_journal(
                journal_id=journal_id,
                user_id=user_id,
                content="New content"
            )

        assert exc_info.value.status_code == 403

    @pytest.mark.asyncio
    async def test_delete_journal_success(self, journal_service, mock_db):
        """
        Test successfully deleting a journal.

        Expected: Journal is deleted from database
        """
        user_id = uuid.uuid4()
        journal_id = uuid.uuid4()

        # Mock existing journal
        from app.models.reading_journal import ReadingJournal
        mock_journal = ReadingJournal(
            id=journal_id,
            reading_id=uuid.uuid4(),
            user_id=user_id,
            content="Content",
            mood_tags=[],
            is_private=True
        )

        # Mock get_journal
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_journal
        mock_db.execute.return_value = mock_result
        mock_db.delete = AsyncMock()
        mock_db.commit = AsyncMock()

        # Execute delete
        await journal_service.delete_journal(journal_id, user_id)

        # Verify deletion operations
        assert mock_db.delete.called
        assert mock_db.commit.called

    @pytest.mark.asyncio
    async def test_delete_journal_not_found(self, journal_service, mock_db):
        """
        Test deleting a journal that doesn't exist.

        Expected: 404 Not Found error (from get_journal)
        """
        user_id = uuid.uuid4()
        journal_id = uuid.uuid4()

        # Mock journal not found
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        # Verify raises HTTPException with 404
        with pytest.raises(HTTPException) as exc_info:
            await journal_service.delete_journal(journal_id, user_id)

        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_journal_not_owned(self, journal_service, mock_db):
        """
        Test deleting a journal that belongs to another user.

        Expected: 403 Forbidden error (from get_journal)
        """
        user_id = uuid.uuid4()
        other_user_id = uuid.uuid4()
        journal_id = uuid.uuid4()

        # Mock journal belongs to different user
        from app.models.reading_journal import ReadingJournal
        mock_journal = ReadingJournal(
            id=journal_id,
            reading_id=uuid.uuid4(),
            user_id=other_user_id,  # Different user!
            content="Content",
            mood_tags=[],
            is_private=True
        )

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_journal
        mock_db.execute.return_value = mock_result

        # Verify raises HTTPException with 403
        with pytest.raises(HTTPException) as exc_info:
            await journal_service.delete_journal(journal_id, user_id)

        assert exc_info.value.status_code == 403
