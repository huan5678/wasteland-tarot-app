"""
Journal API Endpoints - Tarot Journal System
Provides REST API for journal CRUD operations

Endpoints:
- POST /api/v1/readings/{reading_id}/journal - Create journal
- GET /api/v1/journals - List user's journals (paginated)
- GET /api/v1/journals/{journal_id} - Get single journal
- PUT /api/v1/journals/{journal_id} - Update journal
- DELETE /api/v1/journals/{journal_id} - Delete journal
"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.reading_journal import ReadingJournal
from app.services.journal_service import JournalService
from app.schemas.journal import (
    JournalCreate,
    JournalUpdate,
    JournalResponse,
    JournalListResponse
)

router = APIRouter()


# ==================== Endpoints ====================


@router.post(
    "/readings/{reading_id}/journal",
    response_model=JournalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="建立日記",
    description="為已完成的占卜建立個人日記。一個占卜只能有一筆日記。"
)
async def create_journal(
    reading_id: UUID,
    journal_data: JournalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ReadingJournal:
    """
    Create a journal entry for a completed reading.

    Business Rules:
    - One journal per reading per user (UNIQUE constraint)
    - Content: 1-10,000 characters
    - Mood tags: 0-5 tags from whitelist
    - Only journal owner can create

    Args:
        reading_id: UUID of the completed reading
        journal_data: Journal creation data (content, mood_tags, is_private)
        current_user: Authenticated user (from token)
        db: Database session

    Returns:
        ReadingJournal: Created journal with metadata

    Raises:
        HTTPException(404): Reading not found
        HTTPException(403): User doesn't own the reading
        HTTPException(400): Invalid data (content too long, too many tags)
        HTTPException(409): Journal already exists for this reading
    """
    service = JournalService(db)

    journal = await service.create_journal(
        reading_id=reading_id,
        user_id=current_user.id,
        content=journal_data.content,
        mood_tags=journal_data.mood_tags,
        is_private=journal_data.is_private
    )

    return journal


@router.get(
    "/journals",
    response_model=JournalListResponse,
    summary="列出日記",
    description="取得使用者的所有日記，支援分頁。依建立時間降序排列。"
)
async def list_journals(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> JournalListResponse:
    """
    List user's journal entries with pagination.

    Journals are sorted by created_at DESC (newest first).

    Args:
        skip: Number of records to skip (default: 0)
        limit: Maximum number of records to return (default: 20)
        current_user: Authenticated user
        db: Database session

    Returns:
        JournalListResponse: List of journals with total count
    """
    service = JournalService(db)

    journals = await service.list_journals(
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )

    # Get total count for pagination
    # (In a production app, you might want a separate count query)
    total = len(journals) if len(journals) < limit else skip + len(journals)

    return JournalListResponse(
        items=journals,
        total=total
    )


@router.get(
    "/journals/{journal_id}",
    response_model=JournalResponse,
    summary="取得單一日記",
    description="取得特定日記的詳細資料。僅日記擁有者可存取。"
)
async def get_journal(
    journal_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ReadingJournal:
    """
    Get a single journal entry by ID.

    Only the journal owner can access their journal.

    Args:
        journal_id: UUID of the journal
        current_user: Authenticated user
        db: Database session

    Returns:
        ReadingJournal: Journal with all details

    Raises:
        HTTPException(404): Journal not found
        HTTPException(403): User doesn't own the journal
    """
    service = JournalService(db)

    journal = await service.get_journal(
        journal_id=journal_id,
        user_id=current_user.id
    )

    return journal


@router.put(
    "/journals/{journal_id}",
    response_model=JournalResponse,
    summary="更新日記",
    description="更新日記內容、心情標籤或隱私設定。支援部分更新。"
)
async def update_journal(
    journal_id: UUID,
    journal_data: JournalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ReadingJournal:
    """
    Update a journal entry.

    Supports partial updates - only provided fields will be updated.

    Args:
        journal_id: UUID of the journal
        journal_data: Update data (all fields optional)
        current_user: Authenticated user
        db: Database session

    Returns:
        ReadingJournal: Updated journal

    Raises:
        HTTPException(404): Journal not found
        HTTPException(403): User doesn't own the journal
        HTTPException(400): Invalid data (content too long, too many tags)
    """
    service = JournalService(db)

    journal = await service.update_journal(
        journal_id=journal_id,
        user_id=current_user.id,
        content=journal_data.content,
        mood_tags=journal_data.mood_tags,
        is_private=journal_data.is_private
    )

    return journal


@router.delete(
    "/journals/{journal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="刪除日記",
    description="刪除指定的日記。僅日記擁有者可刪除。"
)
async def delete_journal(
    journal_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> None:
    """
    Delete a journal entry.

    Only the journal owner can delete their journal.

    Args:
        journal_id: UUID of the journal
        current_user: Authenticated user
        db: Database session

    Raises:
        HTTPException(404): Journal not found
        HTTPException(403): User doesn't own the journal
    """
    service = JournalService(db)

    await service.delete_journal(
        journal_id=journal_id,
        user_id=current_user.id
    )

    # FastAPI automatically returns 204 No Content when return type is None
    return None
