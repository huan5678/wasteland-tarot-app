"""
Journal Service - Tarot Journal System

Provides CRUD operations for personal tarot reading journals.

TDD Green Phase: Implement functionality to pass tests

Features:
- create_journal(): Create a new journal for a completed reading
- list_journals(): List user's journals with pagination
- get_journal(): Get a single journal with details
- update_journal(): Update journal content/mood_tags/privacy
- delete_journal(): Delete a journal entry

Business Rules:
- One journal per reading per user (UNIQUE constraint)
- Content max 10,000 characters
- Max 5 mood tags per journal
- Only journal owner can access/modify their journals
- CASCADE deletion when reading or user is deleted
"""

from uuid import UUID
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from app.models.reading_journal import ReadingJournal
from app.models.reading_enhanced import CompletedReading


class JournalService:
    """Tarot journal service for managing reading journals"""

    # Business rule constants
    MAX_CONTENT_LENGTH = 10000
    MAX_MOOD_TAGS = 5

    def __init__(self, db_session: AsyncSession):
        """
        Initialize JournalService

        Args:
            db_session: Database session
        """
        self.db = db_session

    async def create_journal(
        self,
        reading_id: UUID,
        user_id: UUID,
        content: str,
        mood_tags: Optional[List[str]] = None,
        is_private: bool = True
    ) -> ReadingJournal:
        """
        Create a new journal entry for a completed reading.

        Business Rules:
        1. Reading must exist
        2. Reading must belong to the user (ownership validation)
        3. Content length must be <= 10,000 characters
        4. Mood tags count must be <= 5
        5. One journal per reading per user (enforced by DB UNIQUE constraint)

        Args:
            reading_id: UUID of the completed reading
            user_id: UUID of the current user
            content: Journal content in markdown format
            mood_tags: List of mood tags (max 5), defaults to empty list
            is_private: Privacy setting, defaults to True

        Returns:
            Created ReadingJournal instance

        Raises:
            HTTPException(404): Reading not found
            HTTPException(403): User is not the owner of the reading
            HTTPException(400): Content too long or too many mood tags
            HTTPException(409): Journal already exists for this reading

        Example:
            >>> journal_service = JournalService(db_session)
            >>> journal = await journal_service.create_journal(
            ...     reading_id=uuid4(),
            ...     user_id=uuid4(),
            ...     content="# Today's Reading\\n\\nThe Fool appeared!",
            ...     mood_tags=["hopeful", "excited"]
            ... )
        """
        # 1. Validate content length
        if len(content) > self.MAX_CONTENT_LENGTH:
            raise HTTPException(
                status_code=400,
                detail=f"Content too long. Maximum {self.MAX_CONTENT_LENGTH} characters allowed."
            )

        # 2. Validate mood tags count
        if mood_tags and len(mood_tags) > self.MAX_MOOD_TAGS:
            raise HTTPException(
                status_code=400,
                detail=f"Too many mood tags. Maximum {self.MAX_MOOD_TAGS} tags allowed."
            )

        # 3. Verify reading exists
        stmt = select(CompletedReading).where(CompletedReading.id == reading_id)
        result = await self.db.execute(stmt)
        reading = result.scalar_one_or_none()

        if not reading:
            raise HTTPException(
                status_code=404,
                detail="Reading not found"
            )

        # 4. Verify reading ownership
        if reading.user_id != user_id:
            raise HTTPException(
                status_code=403,
                detail="Not the owner of this reading"
            )

        # 5. Create journal instance
        journal = ReadingJournal(
            reading_id=reading_id,
            user_id=user_id,
            content=content,
            mood_tags=mood_tags or [],
            is_private=is_private
        )

        # 6. Save to database
        try:
            self.db.add(journal)
            await self.db.commit()
            await self.db.refresh(journal)
            return journal
        except IntegrityError as e:
            await self.db.rollback()
            # Check if it's a duplicate journal error (UNIQUE constraint)
            if "uq_reading_user_journal" in str(e).lower() or "unique constraint" in str(e).lower():
                raise HTTPException(
                    status_code=409,
                    detail="Journal already exists for this reading"
                )
            # Re-raise other integrity errors
            raise HTTPException(
                status_code=400,
                detail=f"Database constraint violation: {str(e)}"
            )

    async def list_journals(
        self,
        user_id: UUID,
        skip: int = 0,
        limit: int = 20
    ) -> List[ReadingJournal]:
        """
        List user's journals with pagination.

        Journals are sorted by created_at DESC (newest first).

        Args:
            user_id: UUID of the current user
            skip: Number of records to skip (for pagination)
            limit: Maximum number of records to return

        Returns:
            List of ReadingJournal instances with related reading data

        Example:
            >>> journals = await journal_service.list_journals(user_id, skip=0, limit=10)
        """
        stmt = (
            select(ReadingJournal)
            .where(ReadingJournal.user_id == user_id)
            .options(selectinload(ReadingJournal.reading))
            .order_by(desc(ReadingJournal.created_at))
            .offset(skip)
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        journals = result.scalars().all()
        return list(journals)

    async def get_journal(
        self,
        journal_id: UUID,
        user_id: UUID
    ) -> ReadingJournal:
        """
        Get a single journal by ID.

        Verifies ownership before returning.

        Args:
            journal_id: UUID of the journal
            user_id: UUID of the current user

        Returns:
            ReadingJournal instance with related reading data

        Raises:
            HTTPException(404): Journal not found
            HTTPException(403): User is not the owner of the journal

        Example:
            >>> journal = await journal_service.get_journal(journal_id, user_id)
        """
        stmt = (
            select(ReadingJournal)
            .where(ReadingJournal.id == journal_id)
            .options(selectinload(ReadingJournal.reading))
        )

        result = await self.db.execute(stmt)
        journal = result.scalar_one_or_none()

        if not journal:
            raise HTTPException(
                status_code=404,
                detail="Journal not found"
            )

        # Verify ownership
        if journal.user_id != user_id:
            raise HTTPException(
                status_code=403,
                detail="Not the owner of this journal"
            )

        return journal

    async def update_journal(
        self,
        journal_id: UUID,
        user_id: UUID,
        content: Optional[str] = None,
        mood_tags: Optional[List[str]] = None,
        is_private: Optional[bool] = None
    ) -> ReadingJournal:
        """
        Update journal content, mood tags, or privacy setting.

        Only allows updating specified fields (partial update).

        Args:
            journal_id: UUID of the journal
            user_id: UUID of the current user
            content: New content (optional)
            mood_tags: New mood tags (optional)
            is_private: New privacy setting (optional)

        Returns:
            Updated ReadingJournal instance

        Raises:
            HTTPException(404): Journal not found
            HTTPException(403): User is not the owner of the journal
            HTTPException(400): Content too long or too many mood tags

        Example:
            >>> journal = await journal_service.update_journal(
            ...     journal_id=uuid4(),
            ...     user_id=uuid4(),
            ...     content="Updated content",
            ...     mood_tags=["peaceful"]
            ... )
        """
        # 1. Get journal (includes ownership verification)
        journal = await self.get_journal(journal_id, user_id)

        # 2. Validate content if provided
        if content is not None:
            if len(content) > self.MAX_CONTENT_LENGTH:
                raise HTTPException(
                    status_code=400,
                    detail=f"Content too long. Maximum {self.MAX_CONTENT_LENGTH} characters allowed."
                )
            journal.content = content

        # 3. Validate mood tags if provided
        if mood_tags is not None:
            if len(mood_tags) > self.MAX_MOOD_TAGS:
                raise HTTPException(
                    status_code=400,
                    detail=f"Too many mood tags. Maximum {self.MAX_MOOD_TAGS} tags allowed."
                )
            journal.mood_tags = mood_tags

        # 4. Update privacy if provided
        if is_private is not None:
            journal.is_private = is_private

        # 5. Save changes
        await self.db.commit()
        await self.db.refresh(journal)
        return journal

    async def delete_journal(
        self,
        journal_id: UUID,
        user_id: UUID
    ) -> None:
        """
        Delete a journal entry.

        Verifies ownership before deletion.

        Args:
            journal_id: UUID of the journal
            user_id: UUID of the current user

        Raises:
            HTTPException(404): Journal not found
            HTTPException(403): User is not the owner of the journal

        Example:
            >>> await journal_service.delete_journal(journal_id, user_id)
        """
        # 1. Get journal (includes ownership verification)
        journal = await self.get_journal(journal_id, user_id)

        # 2. Delete journal
        await self.db.delete(journal)
        await self.db.commit()
