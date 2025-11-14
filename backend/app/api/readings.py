"""
占卜 API 端點 - 已認證的塔羅占卜功能
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from app.db.session import get_db
from app.services.reading_service import ReadingService
from app.core.dependencies import get_current_user, get_optional_user
from app.models.user import User
from app.models.wasteland_card import CharacterVoice
from app.core.exceptions import (
    ReadingLimitExceededError,
    InsufficientPermissionsError,
    UserNotFoundError
)

router = APIRouter(prefix="/readings", tags=["readings"])


class CreateReadingRequest(BaseModel):
    question: str
    spread_type: str = "single_card"
    num_cards: int = Field(default=1, ge=1, le=10)
    character_voice: Optional[CharacterVoice] = None
    radiation_factor: float = Field(default=0.5, ge=0.0, le=1.0)


class UpdateReadingRequest(BaseModel):
    user_feedback: Optional[str] = None
    accuracy_rating: Optional[float] = None
    tags: Optional[List[str]] = None
    mood: Optional[str] = None
    notes: Optional[str] = None
    is_private: Optional[bool] = None
    allow_public_sharing: Optional[bool] = None
    is_favorite: Optional[bool] = None


@router.post(
    "/",
    response_model=Dict[str, Any],
    summary="建立新占卜（簡易 API）",
    description="為已認證使用者建立新的塔羅占卜會話",
    response_description="成功建立的占卜資訊"
)
async def create_reading_simple(
    reading_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """為已認證使用者建立新占卜（簡易 API）"""
    reading_service = ReadingService(db)

    try:
        # Add user_id to reading data
        reading_data_with_user = {
            **reading_data,
            "user_id": current_user.id
        }

        reading = await reading_service.create_reading(reading_data_with_user)

        return {
            "id": reading.id,
            "question": reading.question,
            "spread_type": reading.spread_type,
            "cards_drawn": reading.cards_drawn,
            "interpretation": reading.interpretation,
            "character_voice": reading.character_voice,
            "karma_context": reading.karma_context,
            "faction_influence": reading.faction_influence,
            "created_at": reading.created_at,
            "mood": reading.mood
        }
    except ReadingLimitExceededError as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create reading: {str(e)}"
        )


@router.post(
    "/create",
    response_model=Dict[str, Any],
    summary="建立新占卜",
    description="為已認證使用者建立詳細的塔羅占卜會話",
    response_description="完整的占卜資訊與解讀"
)
async def create_reading(
    reading_data: CreateReadingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """為已認證使用者建立新占卜"""
    reading_service = ReadingService(db)

    try:
        reading = await reading_service.create_reading({
            "user_id": current_user.id,
            "question": reading_data.question,
            "reading_type": reading_data.spread_type,
            "num_cards": reading_data.num_cards,
            "character_voice": reading_data.character_voice,
            "radiation_factor": reading_data.radiation_factor,
            "cards_drawn": [],  # Will be populated by service
            "interpretations": {}  # Will be populated by service
        })

        return {
            "reading": {
                "id": reading.id,
                "question": reading.question,
                "spread_type": reading.spread_type,
                "cards_drawn": reading.cards_drawn,
                "interpretation": reading.interpretation,
                "character_voice": reading.character_voice,
                "karma_context": reading.karma_context,
                "faction_influence": reading.faction_influence,
                "created_at": reading.created_at,
                "mood": reading.mood
            },
            "message": "Reading created successfully"
        }
    except ReadingLimitExceededError as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create reading: {str(e)}"
        )


@router.get(
    "/",
    response_model=List[Dict[str, Any]],
    summary="取得使用者占卜記錄",
    description="取得目前使用者的占卜歷史記錄，並支援篩選與分頁",
    response_description="占卜記錄清單"
)
async def get_user_readings(
    limit: int = Query(10, ge=1, le=50, description="每頁數量"),
    offset: int = Query(0, ge=0, description="起始位置"),
    filter_by_spread: Optional[str] = Query(None, description="依牌陣類型篩選"),
    filter_by_voice: Optional[str] = Query(None, description="依角色聲音篩選"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得目前使用者的占卜歷史記錄"""
    reading_service = ReadingService(db)

    readings = await reading_service.get_user_reading_history(
        user_id=current_user.id,
        limit=limit,
        offset=offset,
        filter_by_spread=filter_by_spread,
        filter_by_voice=filter_by_voice
    )

    return [
        {
            "id": reading.id,
            "question": reading.question,
            "spread_type": reading.spread_type,
            "cards_drawn": reading.cards_drawn,
            "character_voice": reading.character_voice,
            "mood": reading.mood,
            "accuracy_rating": reading.accuracy_rating,
            "created_at": reading.created_at,
            "is_private": reading.is_private,
            "is_favorite": getattr(reading, 'is_favorite', False),
            "notes": getattr(reading, 'notes', None) or getattr(reading, 'context_notes', None)
        }
        for reading in readings
    ]


@router.get(
    "/{reading_id}",
    response_model=Dict[str, Any],
    summary="依 ID 取得占卜",
    description="依 ID 取得特定占卜的完整資訊",
    response_description="完整的占卜資訊"
)
async def get_reading_by_id(
    reading_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """依 ID 取得特定占卜"""
    reading_service = ReadingService(db)

    try:
        reading = await reading_service.get_reading_by_id(reading_id, current_user.id)

        return {
            "id": reading.id,
            "question": reading.question,
            "spread_type": reading.spread_type,
            "cards_drawn": reading.cards_drawn,
            "interpretation": reading.interpretation,
            "character_voice": reading.character_voice,
            "karma_context": reading.karma_context,
            "faction_influence": reading.faction_influence,
            "user_feedback": reading.user_feedback,
            "accuracy_rating": reading.accuracy_rating,
            "tags": reading.tags,
            "mood": reading.mood,
            "is_private": reading.is_private,
            "allow_public_sharing": reading.allow_public_sharing,
            "created_at": reading.created_at,
            "reading_duration": reading.reading_duration,
            "is_favorite": getattr(reading, 'is_favorite', False),
            "notes": getattr(reading, 'notes', None) or getattr(reading, 'context_notes', None)
        }
    except InsufficientPermissionsError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put(
    "/{reading_id}",
    response_model=Dict[str, Any],
    summary="更新占卜",
    description="更新占卜並添加使用者回饋",
    response_description="更新後的占卜資訊"
)
async def update_reading(
    reading_id: str,
    update_data: UpdateReadingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """以使用者回饋更新占卜"""
    reading_service = ReadingService(db)

    try:
        reading = await reading_service.update_reading(
            reading_id=reading_id,
            user_id=current_user.id,
            update_data=update_data.model_dump(exclude_none=True)
        )

        return {
            "reading": {
                "id": reading.id,
                "user_feedback": reading.user_feedback,
                "accuracy_rating": reading.accuracy_rating,
                "tags": reading.tags,
                "mood": reading.mood,
                "is_private": reading.is_private,
                "allow_public_sharing": reading.allow_public_sharing,
                "is_favorite": getattr(reading, 'is_favorite', False)
            },
            "message": "Reading updated successfully"
        }
    except InsufficientPermissionsError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete(
    "/{reading_id}",
    summary="刪除占卜",
    description="刪除特定的占卜記錄",
    response_description="刪除成功訊息"
)
async def delete_reading(
    reading_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """刪除占卜"""
    reading_service = ReadingService(db)

    try:
        success = await reading_service.delete_reading(reading_id, current_user.id)
        if success:
            return {"message": "Reading deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to delete reading"
            )
    except InsufficientPermissionsError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get(
    "/public/shared",
    response_model=List[Dict[str, Any]],
    summary="取得公開分享的占卜",
    description="取得所有公開分享的占卜記錄",
    response_description="公開占卜清單"
)
async def get_public_readings(
    limit: int = Query(20, ge=1, le=100, description="每頁數量"),
    offset: int = Query(0, ge=0, description="起始位置"),
    user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """取得公開分享的占卜"""
    reading_service = ReadingService(db)

    readings = await reading_service.get_public_readings(limit=limit, offset=offset)

    return [
        {
            "id": reading.id,
            "question": reading.question,
            "spread_type": reading.spread_type,
            "cards_drawn": reading.cards_drawn,
            "interpretation": reading.interpretation if not reading.is_private else None,
            "character_voice": reading.character_voice,
            "mood": reading.mood,
            "created_at": reading.created_at,
            "user_id": reading.user_id if user else None  # Only show user_id if viewer is authenticated
        }
        for reading in readings
    ]


@router.get(
    "/statistics/personal",
    response_model=Dict[str, Any],
    summary="取得個人占卜統計",
    description="取得目前使用者的詳細占卜統計資料",
    response_description="占卜統計資訊"
)
async def get_user_reading_statistics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得目前使用者的詳細占卜統計資料"""
    reading_service = ReadingService(db)

    statistics = await reading_service.get_reading_statistics(current_user.id)
    return statistics


@router.get(
    "/trends/analysis",
    response_model=Dict[str, Any],
    summary="取得占卜趨勢分析",
    description="取得目前使用者的占卜趨勢分析",
    response_description="占卜趨勢資料"
)
async def get_reading_trends(
    period: str = Query("month", regex="^(week|month|year)$", description="時間週期（week/month/year）"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得目前使用者的占卜趨勢分析"""
    reading_service = ReadingService(db)

    trends = await reading_service.get_reading_trends(
        user_id=current_user.id,
        period=period
    )
    return trends


class ShareReadingRequest(BaseModel):
    target_user_ids: List[str]
    message: Optional[str] = None


@router.post(
    "/{reading_id}/share",
    response_model=Dict[str, str],
    summary="分享占卜",
    description="將占卜分享給特定使用者",
    response_description="分享成功訊息"
)
async def share_reading(
    reading_id: str,
    share_data: ShareReadingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """將占卜分享給特定使用者"""
    reading_service = ReadingService(db)

    try:
        success = await reading_service.share_reading(
            reading_id=reading_id,
            owner_id=current_user.id,
            target_user_ids=share_data.target_user_ids,
            message=share_data.message
        )

        if success:
            return {"message": "Reading shared successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to share reading"
            )
    except InsufficientPermissionsError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )