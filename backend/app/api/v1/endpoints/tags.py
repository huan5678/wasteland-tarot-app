"""
Tags API Endpoints

Provides endpoints for tag management (CRUD, merge, rename, statistics).
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.tag_management_service import TagManagementService


router = APIRouter()


# Pydantic Schemas
class TagPatchRequest(BaseModel):
    """Request to update reading tags."""
    tags: List[str] = Field(..., min_items=1, max_items=20, description="List of tags")


class TagMergeRequest(BaseModel):
    """Request to merge tags."""
    source_tags: List[str] = Field(..., min_items=1, description="Tags to merge")
    target_tag: str = Field(..., min_length=1, max_length=50, description="Target tag")


class TagRenameRequest(BaseModel):
    """Request to rename a tag."""
    old_tag: str = Field(..., min_length=1, max_length=50, description="Current tag name")
    new_tag: str = Field(..., min_length=1, max_length=50, description="New tag name")


class TagBulkDeleteRequest(BaseModel):
    """Request to delete multiple tags."""
    tags: List[str] = Field(..., min_items=1, description="Tags to delete")


class TagStatistic(BaseModel):
    """Tag usage statistic."""
    tag: str
    count: int


class TagOperationResponse(BaseModel):
    """Response for tag operations."""
    success: bool
    message: str
    data: Dict[str, Any] = {}


@router.patch("/readings/{reading_id}/tags", response_model=Dict[str, List[str]])
async def update_reading_tags(
    reading_id: str,
    request: TagPatchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update tags for a specific reading.

    Replaces all existing tags with the provided list.
    """
    from app.models.reading_enhanced import CompletedReading, ReadingTag
    from sqlalchemy import select, delete

    # Verify reading belongs to user
    stmt = select(CompletedReading).where(
        CompletedReading.id == reading_id,
        CompletedReading.user_id == current_user.id
    )
    result = await db.execute(stmt)
    reading = result.scalar_one_or_none()

    if not reading:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reading not found"
        )

    # Check tag limit (20 max)
    if len(request.tags) > 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 20 tags per reading"
        )

    # Validate tag length
    for tag in request.tags:
        if not tag.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tags cannot be empty"
            )
        if len(tag) > 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tag length cannot exceed 50 characters"
            )

    # Delete existing tags
    delete_stmt = delete(ReadingTag).where(ReadingTag.reading_id == reading_id)
    await db.execute(delete_stmt)

    # Add new tags (deduplicated)
    unique_tags = list(set(tag.strip() for tag in request.tags))
    for tag in unique_tags:
        new_tag = ReadingTag(reading_id=reading_id, tag=tag)
        db.add(new_tag)

    await db.commit()

    return {"tags": unique_tags}


@router.get("/readings/tags", response_model=List[TagStatistic])
async def get_user_tags(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all tags for the current user with usage counts.

    Returns tags sorted by usage count (descending).
    """
    service = TagManagementService(db)
    stats = await service.get_tag_usage_statistics(current_user.id)
    return stats


@router.post("/readings/tags/merge", response_model=TagOperationResponse)
async def merge_tags(
    request: TagMergeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Merge multiple tags into a single target tag.

    All readings with source tags will be updated to use the target tag.
    If a reading already has the target tag, duplicates are removed.
    """
    service = TagManagementService(db)

    try:
        result = await service.merge_tags(
            user_id=current_user.id,
            source_tags=request.source_tags,
            target_tag=request.target_tag
        )

        return TagOperationResponse(
            success=True,
            message=f"Successfully merged {result['merged_count']} tags, affecting {result['readings_affected']} readings",
            data=result
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to merge tags: {str(e)}"
        )


@router.post("/readings/tags/rename", response_model=TagOperationResponse)
async def rename_tag(
    request: TagRenameRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Rename a tag across all readings.

    If the new tag name already exists on a reading, duplicates are removed.
    """
    service = TagManagementService(db)

    try:
        result = await service.rename_tag(
            user_id=current_user.id,
            old_tag=request.old_tag,
            new_tag=request.new_tag
        )

        return TagOperationResponse(
            success=True,
            message=f"Successfully renamed tag, affecting {result['readings_affected']} readings",
            data=result
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rename tag: {str(e)}"
        )


@router.post("/readings/tags/bulk-delete", response_model=TagOperationResponse)
async def bulk_delete_tags(
    request: TagBulkDeleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete multiple tags in bulk.

    Removes specified tags from all readings.
    """
    service = TagManagementService(db)

    try:
        result = await service.bulk_delete_tags(
            user_id=current_user.id,
            tags=request.tags
        )

        return TagOperationResponse(
            success=True,
            message=f"Successfully deleted {result['tags_deleted']} tags, affecting {result['readings_affected']} readings",
            data=result
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete tags: {str(e)}"
        )
