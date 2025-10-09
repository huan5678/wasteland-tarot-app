"""
進階占卜 API - 進階占卜功能，包含解讀模板、牌陣模板與卡牌相輔效果偵測
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.db.database import get_db
from app.services.reading_enhanced_service import EnhancedReadingService
from app.core.dependencies import get_current_user, get_optional_user
from app.models.user import User
from app.models.wasteland_card import CharacterVoice, KarmaAlignment, FactionAlignment
from app.models.reading_enhanced import SpreadType
from app.core.exceptions import (
    UserNotFoundError,
    InsufficientPermissionsError,
    ResourceNotFoundError,
    ReadingLimitExceededError
)


# Pydantic models for request/response
class CreateReadingRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=500, description="占卜的問題")
    spread_template_id: str = Field(..., description="使用的牌陣模板 ID")
    character_voice: CharacterVoice = Field(..., description="解讀的角色聲音")
    radiation_factor: float = Field(0.5, ge=0.0, le=1.0, description="輻射影響因子")
    focus_area: Optional[str] = Field(None, max_length=100, description="占卜的焦點領域")


class ReadingFeedbackRequest(BaseModel):
    satisfaction: int = Field(..., ge=1, le=5, description="使用者滿意度評分（1-5）")
    accuracy: int = Field(..., ge=1, le=5, description="準確度評分（1-5）")
    helpfulness: int = Field(..., ge=1, le=5, description="實用性評分（1-5）")
    feedback: Optional[str] = Field(None, max_length=1000, description="額外回饋文字")


class SpreadTemplateResponse(BaseModel):
    id: str
    name: str
    display_name: str
    description: str
    card_count: int
    difficulty_level: str
    faction_preference: Optional[str]
    usage_count: int
    average_rating: float
    tags: List[str]

    class Config:
        from_attributes = True


class InterpretationTemplateResponse(BaseModel):
    id: str
    character_name: str
    character_voice: str
    tone: str
    vocabulary_style: str
    faction_alignment: Optional[str]
    usage_count: int
    average_rating: float

    class Config:
        from_attributes = True


class ReadingSessionResponse(BaseModel):
    id: str
    question: str
    focus_area: Optional[str]
    character_voice_used: str
    karma_context: str
    faction_influence: Optional[str]
    radiation_factor: float
    overall_interpretation: Optional[str]
    summary_message: Optional[str]
    prediction_confidence: Optional[float]
    session_duration: Optional[int]
    user_satisfaction: Optional[int]
    accuracy_rating: Optional[int]
    helpful_rating: Optional[int]
    overall_rating: float
    created_at: str

    class Config:
        from_attributes = True


class CardPositionResponse(BaseModel):
    position_number: int
    position_name: str
    position_meaning: str
    card_name: str
    is_reversed: bool
    position_interpretation: Optional[str]
    card_significance: Optional[str]
    radiation_influence: float
    user_resonance: Optional[int]

    class Config:
        from_attributes = True


class DetailedReadingResponse(BaseModel):
    reading: ReadingSessionResponse
    card_positions: List[CardPositionResponse]
    spread_info: Optional[SpreadTemplateResponse]
    character_info: Optional[InterpretationTemplateResponse]

    class Config:
        from_attributes = True


router = APIRouter(prefix="/readings", tags=["readings_enhanced"])


@router.get(
    "/spreads",
    response_model=List[SpreadTemplateResponse],
    summary="取得可用牌陣",
    description="取得所有可用的牌陣模板",
    response_description="牌陣模板清單"
)
async def get_available_spreads(
    difficulty: Optional[str] = Query(None, description="依難度等級篩選"),
    faction: Optional[str] = Query(None, description="依派系偏好篩選"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """取得可用的牌陣模板"""
    service = EnhancedReadingService(db)

    user_faction = None
    if current_user and current_user.faction_alignment:
        user_faction = current_user.faction_alignment

    spreads = await service.get_available_spreads(
        user_id=current_user.id if current_user else None,
        difficulty_level=difficulty,
        faction_preference=faction or user_faction
    )

    return [
        SpreadTemplateResponse(
            id=spread.id,
            name=spread.name,
            display_name=spread.display_name,
            description=spread.description,
            card_count=spread.card_count,
            difficulty_level=spread.difficulty_level,
            faction_preference=spread.faction_preference,
            usage_count=spread.usage_count,
            average_rating=spread.average_rating,
            tags=spread.tags or []
        )
        for spread in spreads
    ]


@router.get(
    "/interpreters",
    response_model=List[InterpretationTemplateResponse],
    summary="取得可用解讀者",
    description="取得所有可用的角色聲音解讀者",
    response_description="解讀者模板清單"
)
async def get_available_interpreters(db: AsyncSession = Depends(get_db)):
    """取得可用的角色聲音解讀者"""
    service = EnhancedReadingService(db)
    interpreters = await service.get_available_interpreters()

    return [
        InterpretationTemplateResponse(
            id=interpreter.id,
            character_name=interpreter.character_name,
            character_voice=interpreter.character_voice,
            tone=interpreter.tone,
            vocabulary_style=interpreter.vocabulary_style,
            faction_alignment=interpreter.faction_alignment,
            usage_count=interpreter.usage_count,
            average_rating=interpreter.get_average_rating()
        )
        for interpreter in interpreters
    ]


@router.post(
    "/create",
    response_model=ReadingSessionResponse,
    summary="建立進階占卜",
    description="建立新的進階占卜，包含解讀模板與相輔效果偵測",
    response_description="完整的占卜會話資訊"
)
async def create_enhanced_reading(
    reading_request: CreateReadingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """建立新的進階占卜，包含解讀模板與相輔效果偵測"""
    service = EnhancedReadingService(db)

    try:
        reading_session = await service.create_advanced_reading(
            user_id=current_user.id,
            question=reading_request.question,
            spread_template_id=reading_request.spread_template_id,
            character_voice=reading_request.character_voice,
            radiation_factor=reading_request.radiation_factor,
            focus_area=reading_request.focus_area
        )

        return ReadingSessionResponse(
            id=reading_session.id,
            question=reading_session.question,
            focus_area=reading_session.focus_area,
            character_voice_used=reading_session.character_voice_used,
            karma_context=reading_session.karma_context,
            faction_influence=reading_session.faction_influence,
            radiation_factor=reading_session.radiation_factor,
            overall_interpretation=reading_session.overall_interpretation,
            summary_message=reading_session.summary_message,
            prediction_confidence=reading_session.prediction_confidence,
            session_duration=reading_session.calculate_total_duration(),
            user_satisfaction=reading_session.user_satisfaction,
            accuracy_rating=reading_session.accuracy_rating,
            helpful_rating=reading_session.helpful_rating,
            overall_rating=reading_session.get_overall_rating(),
            created_at=reading_session.created_at.isoformat() if reading_session.created_at else ""
        )

    except UserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except InsufficientPermissionsError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ReadingLimitExceededError as e:
        raise HTTPException(status_code=429, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating reading: {str(e)}")


@router.get(
    "/{reading_id}",
    response_model=DetailedReadingResponse,
    summary="取得占卜詳細資訊",
    description="取得特定占卜的詳細資訊，包含卡牌位置與解讀",
    response_description="完整的占卜詳細資訊"
)
async def get_reading_details(
    reading_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得詳細的占卜資訊，包含卡牌位置與解讀"""
    service = EnhancedReadingService(db)

    reading = await service.get_reading_with_details(reading_id, current_user.id)
    if not reading:
        raise HTTPException(status_code=404, detail="Reading not found")

    # Convert card positions
    card_positions = []
    for position in reading.card_positions:
        card_positions.append(CardPositionResponse(
            position_number=position.position_number,
            position_name=position.position_name,
            position_meaning=position.position_meaning,
            card_name=position.card.name if position.card else "Unknown Card",
            is_reversed=position.is_reversed,
            position_interpretation=position.position_interpretation,
            card_significance=position.card_significance,
            radiation_influence=position.radiation_influence,
            user_resonance=position.user_resonance
        ))

    # Convert spread info
    spread_info = None
    if reading.spread_template:
        spread_info = SpreadTemplateResponse(
            id=reading.spread_template.id,
            name=reading.spread_template.name,
            display_name=reading.spread_template.display_name,
            description=reading.spread_template.description,
            card_count=reading.spread_template.card_count,
            difficulty_level=reading.spread_template.difficulty_level,
            faction_preference=reading.spread_template.faction_preference,
            usage_count=reading.spread_template.usage_count,
            average_rating=reading.spread_template.average_rating,
            tags=reading.spread_template.tags or []
        )

    # Convert character info
    character_info = None
    if reading.interpretation_template:
        character_info = InterpretationTemplateResponse(
            id=reading.interpretation_template.id,
            character_name=reading.interpretation_template.character_name,
            character_voice=reading.interpretation_template.character_voice,
            tone=reading.interpretation_template.tone,
            vocabulary_style=reading.interpretation_template.vocabulary_style,
            faction_alignment=reading.interpretation_template.faction_alignment,
            usage_count=reading.interpretation_template.usage_count,
            average_rating=reading.interpretation_template.get_average_rating()
        )

    return DetailedReadingResponse(
        reading=ReadingSessionResponse(
            id=reading.id,
            question=reading.question,
            focus_area=reading.focus_area,
            character_voice_used=reading.character_voice_used,
            karma_context=reading.karma_context,
            faction_influence=reading.faction_influence,
            radiation_factor=reading.radiation_factor,
            overall_interpretation=reading.overall_interpretation,
            summary_message=reading.summary_message,
            prediction_confidence=reading.prediction_confidence,
            session_duration=reading.calculate_total_duration(),
            user_satisfaction=reading.user_satisfaction,
            accuracy_rating=reading.accuracy_rating,
            helpful_rating=reading.helpful_rating,
            overall_rating=reading.get_overall_rating(),
            created_at=reading.created_at.isoformat() if reading.created_at else ""
        ),
        card_positions=card_positions,
        spread_info=spread_info,
        character_info=character_info
    )


@router.get(
    "/",
    response_model=List[ReadingSessionResponse],
    summary="取得使用者占卜記錄",
    description="取得使用者的占卜歷史記錄",
    response_description="占卜會話清單"
)
async def get_user_readings(
    limit: int = Query(20, ge=1, le=100, description="回傳的占卜數量"),
    offset: int = Query(0, ge=0, description="略過的占卜數量"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得使用者的占卜歷史記錄"""
    service = EnhancedReadingService(db)

    readings = await service.get_user_reading_history(
        user_id=current_user.id,
        limit=limit,
        offset=offset
    )

    return [
        ReadingSessionResponse(
            id=reading.id,
            question=reading.question,
            focus_area=reading.focus_area,
            character_voice_used=reading.character_voice_used,
            karma_context=reading.karma_context,
            faction_influence=reading.faction_influence,
            radiation_factor=reading.radiation_factor,
            overall_interpretation=reading.overall_interpretation,
            summary_message=reading.summary_message,
            prediction_confidence=reading.prediction_confidence,
            session_duration=reading.calculate_total_duration(),
            user_satisfaction=reading.user_satisfaction,
            accuracy_rating=reading.accuracy_rating,
            helpful_rating=reading.helpful_rating,
            overall_rating=reading.get_overall_rating(),
            created_at=reading.created_at.isoformat() if reading.created_at else ""
        )
        for reading in readings
    ]


@router.put(
    "/{reading_id}/feedback",
    response_model=Dict[str, Any],
    summary="提交占卜回饋",
    description="為占卜提交使用者回饋與評分",
    response_description="回饋提交結果"
)
async def submit_reading_feedback(
    reading_id: str,
    feedback_request: ReadingFeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """為占卜提交回饋"""
    service = EnhancedReadingService(db)

    success = await service.update_reading_feedback(
        reading_id=reading_id,
        user_id=current_user.id,
        satisfaction=feedback_request.satisfaction,
        accuracy=feedback_request.accuracy,
        helpfulness=feedback_request.helpfulness,
        feedback=feedback_request.feedback
    )

    if not success:
        raise HTTPException(status_code=404, detail="Reading not found")

    return {
        "message": "Feedback submitted successfully",
        "reading_id": reading_id,
        "overall_rating": (feedback_request.satisfaction + feedback_request.accuracy + feedback_request.helpfulness) / 3
    }


@router.get(
    "/stats/user",
    response_model=Dict[str, Any],
    summary="取得使用者占卜統計",
    description="取得使用者的占卜統計資料",
    response_description="占卜統計資訊"
)
async def get_user_reading_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得使用者的占卜統計"""
    # This would typically be in a separate service, but including here for completeness
    from sqlalchemy import func as sql_func

    # Get reading counts by character voice
    result = await db.execute(
        select(
            ReadingSession.character_voice_used,
            sql_func.count(ReadingSession.id).label('count')
        )
        .where(ReadingSession.user_id == current_user.id)
        .group_by(ReadingSession.character_voice_used)
    )
    voice_stats = {row[0]: row[1] for row in result.fetchall()}

    # Get average ratings
    result = await db.execute(
        select(
            sql_func.avg(ReadingSession.user_satisfaction).label('avg_satisfaction'),
            sql_func.avg(ReadingSession.accuracy_rating).label('avg_accuracy'),
            sql_func.avg(ReadingSession.helpful_rating).label('avg_helpfulness'),
            sql_func.count(ReadingSession.id).label('total_readings')
        )
        .where(ReadingSession.user_id == current_user.id)
    )
    stats_row = result.fetchone()

    return {
        "total_readings": stats_row[3] if stats_row else 0,
        "average_satisfaction": round(stats_row[0], 2) if stats_row and stats_row[0] else 0,
        "average_accuracy": round(stats_row[1], 2) if stats_row and stats_row[1] else 0,
        "average_helpfulness": round(stats_row[2], 2) if stats_row and stats_row[2] else 0,
        "character_voice_preferences": voice_stats,
        "user_karma": current_user.karma_alignment().value,
        "user_faction": current_user.faction_alignment
    }


@router.get(
    "/quick/single-card",
    response_model=Dict[str, Any],
    summary="快速單卡占卜",
    description="快速單張卡牌占卜端點",
    response_description="單卡占卜結果"
)
async def quick_single_card_reading(
    question: str = Query(..., min_length=1, max_length=500, description="占卜問題"),
    character_voice: CharacterVoice = Query(CharacterVoice.PIP_BOY, description="角色聲音"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """快速單卡占卜端點"""
    service = EnhancedReadingService(db)

    try:
        # Use the single wasteland spread template
        reading_session = await service.create_advanced_reading(
            user_id=current_user.id,
            question=question,
            spread_template_id="single_wasteland_reading",  # Assuming this exists
            character_voice=character_voice,
            radiation_factor=0.5
        )

        return {
            "reading_id": reading_session.id,
            "question": reading_session.question,
            "interpretation": reading_session.overall_interpretation,
            "summary": reading_session.summary_message,
            "confidence": reading_session.prediction_confidence,
            "character_voice": reading_session.character_voice_used,
            "karma_context": reading_session.karma_context
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating quick reading: {str(e)}")


# Legacy compatibility endpoints
@router.post(
    "/interpret/{character_voice}",
    response_model=Dict[str, Any],
    summary="角色特定解讀（舊版）",
    description="舊版端點，用於角色特定解讀",
    response_description="解讀結果"
)
async def character_specific_interpretation(
    character_voice: CharacterVoice,
    cards_data: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """角色特定解讀的舊版端點"""
    service = EnhancedReadingService(db)

    # This is a simplified version for backwards compatibility
    question = cards_data.get("question", "General guidance")

    try:
        reading_session = await service.create_advanced_reading(
            user_id=current_user.id,
            question=question,
            spread_template_id="single_wasteland_reading",
            character_voice=character_voice,
            radiation_factor=cards_data.get("radiation_factor", 0.5)
        )

        return {
            "interpretation": reading_session.overall_interpretation,
            "character_voice": character_voice.value,
            "message": reading_session.summary_message,
            "reading_id": reading_session.id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating interpretation: {str(e)}")