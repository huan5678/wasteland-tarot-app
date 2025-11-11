"""
Share API Endpoints

Task 16.8: API endpoints for reading share functionality
Requirements: 10.2, 10.6, 10.7, 10.8
"""

import uuid as uuid_lib
import bcrypt
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.reading_enhanced import CompletedReading
from app.models.share import ReadingShare
from app.schemas.share import (
    ShareCreateRequest,
    ShareResponse,
    ShareViewRequest,
    ShareListItem,
)

router = APIRouter()


def strip_pii(reading_dict: dict) -> dict:
    """Strip personally identifiable information from reading data"""
    pii_fields = ['user_id', 'user_email', 'karma_at_reading', 'faction_affinities', 'user', 'karma', 'faction']

    # Remove top-level PII fields
    for field in pii_fields:
        reading_dict.pop(field, None)

    return reading_dict


@router.post("/readings/{id}/share", response_model=ShareResponse, status_code=status.HTTP_201_CREATED)
async def generate_share_link(
    id: str,
    request: ShareCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate anonymous share link for a reading.

    - **id**: Reading ID to share
    - **password**: Optional 4-8 digit password protection
    """
    # Get reading and verify ownership
    reading = db.query(CompletedReading).filter(CompletedReading.id == id).first()

    if not reading:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="找不到此解讀記錄",
        )

    # Check if reading is marked as deleted
    if hasattr(reading, 'deleted_at') and reading.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="找不到此解讀記錄",
        )

    # Verify ownership
    if str(reading.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="無權分享此解讀",
        )

    # Hash password if provided
    password_hash = None
    if request.password:
        password_hash = bcrypt.hashpw(request.password.encode(), bcrypt.gensalt()).decode()

    # Create share record
    share = ReadingShare(
        id=str(uuid_lib.uuid4()),
        uuid=str(uuid_lib.uuid4()),
        reading_id=id,
        password_hash=password_hash,
        access_count=0,
        is_active=True,
        created_at=datetime.utcnow(),
    )

    db.add(share)
    db.commit()
    db.refresh(share)

    # Generate share URL
    share_url = f"https://wasteland-tarot.com/share/{share.uuid}"

    return ShareResponse(
        uuid=share.uuid,
        share_url=share_url,
        has_password=password_hash is not None,
        access_count=share.access_count,
        created_at=share.created_at,
        is_active=share.is_active,
    )


@router.get("/share/{uuid}")
async def view_shared_reading(
    uuid: str,
    password_data: ShareViewRequest = Body(None),
    db: Session = Depends(get_db),
):
    """
    View a shared reading by its public UUID.

    - **uuid**: Public share UUID
    - **password**: Password if share is protected
    """
    # Get share record
    share = db.query(ReadingShare).filter(ReadingShare.uuid == uuid).first()

    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分享連結不存在",
        )

    # Check if share is active
    if not share.is_active:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="此解讀已被擁有者撤回",
        )

    # Check password if protected
    if share.password_hash:
        if not password_data or not password_data.password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="需要密碼",
            )

        # Verify password
        if not bcrypt.checkpw(password_data.password.encode(), share.password_hash.encode()):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="密碼錯誤",
            )

    # Increment access count
    share.access_count += 1
    db.commit()

    # Get reading data
    reading = db.query(CompletedReading).filter(CompletedReading.id == share.reading_id).first()

    if not reading:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="解讀記錄已被刪除",
        )

    # Convert to dict and strip PII
    reading_dict = {
        "id": reading.id,
        "question": reading.question,
        "cards_drawn": reading.card_positions if hasattr(reading, 'card_positions') else [],
        "interpretation": reading.overall_interpretation,
        "created_at": reading.created_at.isoformat() if reading.created_at else None,
    }

    reading_dict = strip_pii(reading_dict)

    return reading_dict


@router.delete("/share/{uuid}")
async def revoke_share(
    uuid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Revoke a share link.

    - **uuid**: Public share UUID to revoke
    """
    # Get share record
    share = db.query(ReadingShare).filter(ReadingShare.uuid == uuid).first()

    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分享連結不存在",
        )

    # Get reading to verify ownership
    reading = db.query(CompletedReading).filter(CompletedReading.id == share.reading_id).first()

    if not reading:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="解讀記錄不存在",
        )

    # Verify ownership
    if str(reading.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="無權撤回此分享",
        )

    # Mark as inactive (idempotent)
    share.is_active = False
    db.commit()

    return {"message": "已撤回分享連結"}


@router.get("/readings/{id}/shares", response_model=List[ShareListItem])
async def list_reading_shares(
    id: str,
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all share links for a reading.

    - **id**: Reading ID
    - **active_only**: Filter only active shares
    """
    # Get reading and verify ownership
    reading = db.query(CompletedReading).filter(CompletedReading.id == id).first()

    if not reading:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="找不到此解讀記錄",
        )

    # Verify ownership
    if str(reading.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="無權查看此解讀的分享記錄",
        )

    # Get shares
    query = db.query(ReadingShare).filter(ReadingShare.reading_id == id)

    if active_only:
        query = query.filter(ReadingShare.is_active == True)

    shares = query.order_by(ReadingShare.created_at.desc()).all()

    # Convert to response format
    share_list = [
        ShareListItem(
            uuid=share.uuid,
            access_count=share.access_count,
            is_active=share.is_active,
            created_at=share.created_at,
            has_password=share.password_hash is not None,
        )
        for share in shares
    ]

    return share_list
