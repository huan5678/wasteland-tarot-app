"""
ReadingJournal Model Tests - Tarot Journal System
Testing journal model fields, constraints, relationships
Follows TDD methodology: RED phase - tests written before implementation
"""

import pytest
import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select


@pytest.mark.unit
@pytest.mark.asyncio
class TestReadingJournalModel:
    """Test ReadingJournal model functionality and constraints"""

    async def test_journal_model_fields_and_types(self, db_session: AsyncSession):
        """
        Test ReadingJournal model has all required fields with correct types.

        Expected fields:
        - id: UUID (primary key)
        - reading_id: UUID (foreign key, NOT NULL)
        - user_id: UUID (foreign key, NOT NULL)
        - content: str (NOT NULL, markdown text)
        - mood_tags: list[str] (array, default [])
        - is_private: bool (default True)
        - created_at: datetime (auto-generated)
        - updated_at: datetime (auto-generated)
        """
        # Import will fail until model is implemented (RED phase)
        from app.models.reading_journal import ReadingJournal
        from app.models.user import User
        from app.models.reading_enhanced import CompletedReading
        from app.core.security import get_password_hash

        # Create test user directly
        test_user = User(
            name="test_user",
            email="test@wasteland.com",
            password_hash=get_password_hash("test123")
        )
        db_session.add(test_user)
        await db_session.commit()
        await db_session.refresh(test_user)

        # Create test reading directly
        test_reading = CompletedReading(
            user_id=test_user.id,
            question="Test question",
            character_voice_used="pip_boy",
            karma_context="neutral"
        )
        db_session.add(test_reading)
        await db_session.commit()
        await db_session.refresh(test_reading)

        # Create journal instance
        journal = ReadingJournal(
            reading_id=test_reading.id,
            user_id=test_user.id,
            content="# Today's Reading\n\nDrew the Fool card today. Feeling hopeful!",
            mood_tags=["hopeful", "reflective"],
            is_private=True
        )

        # Test field types before saving
        assert isinstance(journal.reading_id, uuid.UUID)
        assert isinstance(journal.user_id, uuid.UUID)
        assert isinstance(journal.content, str)
        assert isinstance(journal.mood_tags, list)
        assert isinstance(journal.is_private, bool)

        # Save to database
        db_session.add(journal)
        await db_session.commit()
        await db_session.refresh(journal)

        # Test auto-generated fields
        assert journal.id is not None
        assert isinstance(journal.id, uuid.UUID)
        assert journal.created_at is not None
        assert isinstance(journal.created_at, datetime)
        assert journal.updated_at is not None
        assert isinstance(journal.updated_at, datetime)

    async def test_journal_foreign_key_relationships(self, db_session: AsyncSession):
        """
        Test foreign key relationships with CompletedReading and User.

        Should establish:
        - journal.reading -> CompletedReading relationship
        - journal.user -> User relationship
        """
        from app.models.reading_journal import ReadingJournal
        from tests.factories import UserFactory, SingleCardReadingFactory

        test_user = UserFactory.build()
        db_session.add(test_user)
        await db_session.commit()

        test_reading = SingleCardReadingFactory.build(user_id=test_user.id)
        db_session.add(test_reading)
        await db_session.commit()

        journal = ReadingJournal(
            reading_id=test_reading.id,
            user_id=test_user.id,
            content="Test journal content"
        )
        db_session.add(journal)
        await db_session.commit()
        await db_session.refresh(journal)

        # Test relationships are accessible
        assert journal.reading is not None
        assert journal.reading.id == test_reading.id
        assert journal.user is not None
        assert journal.user.id == test_user.id

    async def test_journal_unique_constraint_reading_user(self, db_session: AsyncSession):
        """
        Test UNIQUE constraint on (reading_id, user_id).

        Each user should only be able to create ONE journal per reading.
        Attempting to create a duplicate should raise IntegrityError.
        """
        from app.models.reading_journal import ReadingJournal
        from tests.factories import UserFactory, SingleCardReadingFactory

        test_user = UserFactory.build()
        db_session.add(test_user)
        await db_session.commit()

        test_reading = SingleCardReadingFactory.build(user_id=test_user.id)
        db_session.add(test_reading)
        await db_session.commit()

        # Create first journal (should succeed)
        journal1 = ReadingJournal(
            reading_id=test_reading.id,
            user_id=test_user.id,
            content="First journal entry"
        )
        db_session.add(journal1)
        await db_session.commit()

        # Attempt to create second journal for same reading+user (should fail)
        journal2 = ReadingJournal(
            reading_id=test_reading.id,  # Same reading
            user_id=test_user.id,        # Same user
            content="Second journal entry (should fail)"
        )
        db_session.add(journal2)

        with pytest.raises(IntegrityError) as exc_info:
            await db_session.commit()

        # Verify it's the unique constraint that failed
        assert "uq_reading_user_journal" in str(exc_info.value).lower() or "unique constraint" in str(exc_info.value).lower()
        await db_session.rollback()

    async def test_journal_check_constraint_content_length(self, db_session: AsyncSession):
        """
        Test CHECK constraint: content length <= 10,000 characters.

        Journals with content > 10,000 characters should fail validation.
        """
        from app.models.reading_journal import ReadingJournal
        from tests.factories import UserFactory, SingleCardReadingFactory

        test_user = UserFactory.build()
        db_session.add(test_user)
        await db_session.commit()

        test_reading = SingleCardReadingFactory.build(user_id=test_user.id)
        db_session.add(test_reading)
        await db_session.commit()

        # Create journal with content exceeding 10,000 characters
        long_content = "A" * 10001  # 10,001 characters
        journal = ReadingJournal(
            reading_id=test_reading.id,
            user_id=test_user.id,
            content=long_content
        )
        db_session.add(journal)

        with pytest.raises(IntegrityError) as exc_info:
            await db_session.commit()

        # Verify it's the content length check constraint
        assert "check_content_length" in str(exc_info.value).lower() or "check constraint" in str(exc_info.value).lower()
        await db_session.rollback()

    async def test_journal_check_constraint_mood_tags_count(self, db_session: AsyncSession):
        """
        Test CHECK constraint: mood_tags array length <= 5.

        Journals with more than 5 mood tags should fail validation.
        """
        from app.models.reading_journal import ReadingJournal
        from tests.factories import UserFactory, SingleCardReadingFactory

        test_user = UserFactory.build()
        db_session.add(test_user)
        await db_session.commit()

        test_reading = SingleCardReadingFactory.build(user_id=test_user.id)
        db_session.add(test_reading)
        await db_session.commit()

        # Create journal with > 5 mood tags
        too_many_tags = ["happy", "sad", "anxious", "hopeful", "peaceful", "excited"]  # 6 tags
        journal = ReadingJournal(
            reading_id=test_reading.id,
            user_id=test_user.id,
            content="Test content",
            mood_tags=too_many_tags
        )
        db_session.add(journal)

        with pytest.raises(IntegrityError) as exc_info:
            await db_session.commit()

        # Verify it's the mood tags count check constraint
        assert "check_mood_tags_count" in str(exc_info.value).lower() or "check constraint" in str(exc_info.value).lower()
        await db_session.rollback()

    async def test_journal_on_delete_cascade_reading(self, db_session: AsyncSession):
        """
        Test ON DELETE CASCADE: deleting a reading should delete associated journals.
        """
        from app.models.reading_journal import ReadingJournal
        from tests.factories import UserFactory, SingleCardReadingFactory

        test_user = UserFactory.build()
        db_session.add(test_user)
        await db_session.commit()

        test_reading = SingleCardReadingFactory.build(user_id=test_user.id)
        db_session.add(test_reading)
        await db_session.commit()

        journal = ReadingJournal(
            reading_id=test_reading.id,
            user_id=test_user.id,
            content="Test journal"
        )
        db_session.add(journal)
        await db_session.commit()
        journal_id = journal.id

        # Delete the reading
        await db_session.delete(test_reading)
        await db_session.commit()

        # Verify journal was also deleted (CASCADE)
        result = await db_session.execute(
            select(ReadingJournal).where(ReadingJournal.id == journal_id)
        )
        deleted_journal = result.scalar_one_or_none()
        assert deleted_journal is None

    async def test_journal_on_delete_cascade_user(self, db_session: AsyncSession):
        """
        Test ON DELETE CASCADE: deleting a user should delete associated journals.
        """
        from app.models.reading_journal import ReadingJournal
        from tests.factories import UserFactory, SingleCardReadingFactory

        test_user = UserFactory.build()
        db_session.add(test_user)
        await db_session.commit()

        test_reading = SingleCardReadingFactory.build(user_id=test_user.id)
        db_session.add(test_reading)
        await db_session.commit()

        journal = ReadingJournal(
            reading_id=test_reading.id,
            user_id=test_user.id,
            content="Test journal"
        )
        db_session.add(journal)
        await db_session.commit()
        journal_id = journal.id

        # Delete the user
        await db_session.delete(test_user)
        await db_session.commit()

        # Verify journal was also deleted (CASCADE)
        result = await db_session.execute(
            select(ReadingJournal).where(ReadingJournal.id == journal_id)
        )
        deleted_journal = result.scalar_one_or_none()
        assert deleted_journal is None

    async def test_journal_default_values(self, db_session: AsyncSession):
        """
        Test default values for optional fields.

        - mood_tags should default to empty array []
        - is_private should default to True
        """
        from app.models.reading_journal import ReadingJournal
        from tests.factories import UserFactory, SingleCardReadingFactory

        test_user = UserFactory.build()
        db_session.add(test_user)
        await db_session.commit()

        test_reading = SingleCardReadingFactory.build(user_id=test_user.id)
        db_session.add(test_reading)
        await db_session.commit()

        # Create journal without specifying mood_tags and is_private
        journal = ReadingJournal(
            reading_id=test_reading.id,
            user_id=test_user.id,
            content="Minimal journal"
        )
        db_session.add(journal)
        await db_session.commit()
        await db_session.refresh(journal)

        # Verify defaults
        assert journal.mood_tags == [] or journal.mood_tags is None  # Database default
        assert journal.is_private is True
