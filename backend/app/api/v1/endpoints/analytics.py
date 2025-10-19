"""
Analytics API Endpoints
Handles user behavior tracking and analytics data
"""
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.user_analytics_service import UserAnalyticsService
from app.models.user_analytics import (
    UserAnalytics,
    AnalyticsEvent,
    ReadingPattern,
    UserRecommendation
)

router = APIRouter()


# ==================== Schemas ====================

class EventCreate(BaseModel):
    """Schema for creating an analytics event"""
    event_type: str
    event_category: str
    event_action: str
    event_data: dict = Field(default_factory=dict)
    session_id: Optional[str] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None
    platform: Optional[str] = None
    duration: Optional[int] = None


class EventBatch(BaseModel):
    """Schema for batch event tracking"""
    events: List[EventCreate]


class SessionUpdate(BaseModel):
    """Schema for session updates"""
    duration: int
    device_type: Optional[str] = None


class ReadingStatsUpdate(BaseModel):
    """Schema for reading statistics update"""
    spread_type: str
    character_voice: str
    question_length: int
    card_ids: List[str]


class QuestionRecommendationRequest(BaseModel):
    """Schema for question-based recommendation"""
    question: str


class InterpretationStyleRequest(BaseModel):
    """Schema for interpretation style recommendation"""
    card_ids: List[str]


class AnalyticsResponse(BaseModel):
    """Schema for analytics response"""
    user_analytics: dict
    recent_events: List[dict]
    patterns: List[dict]
    recommendations: List[dict]


# ==================== Endpoints ====================

@router.post("/events", status_code=201)
async def track_events(
    batch: EventBatch,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Track multiple analytics events

    This endpoint accepts a batch of events from the client
    """
    service = UserAnalyticsService(db)
    tracked_events = []

    for event_data in batch.events:
        try:
            event = service.track_event(
                user_id=current_user.id,
                event_type=event_data.event_type,
                event_category=event_data.event_category,
                event_action=event_data.event_action,
                event_data=event_data.event_data,
                session_id=event_data.session_id,
                device_type=event_data.device_type,
                browser=event_data.browser,
                platform=event_data.platform,
                duration=event_data.duration
            )
            tracked_events.append(event.to_dict())
        except Exception as e:
            # Log error but continue processing other events
            print(f"Error tracking event: {e}")
            continue

    return {
        "message": "Events tracked successfully",
        "tracked_count": len(tracked_events),
        "events": tracked_events
    }


@router.post("/session", status_code=200)
async def update_session(
    session_data: SessionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user session statistics
    """
    service = UserAnalyticsService(db)

    analytics = service.update_session_stats(
        user_id=current_user.id,
        session_duration=session_data.duration,
        device_type=session_data.device_type
    )

    return {
        "message": "Session updated successfully",
        "analytics": analytics.to_dict()
    }


@router.post("/reading", status_code=200)
async def update_reading_stats(
    reading_data: ReadingStatsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user reading statistics
    """
    service = UserAnalyticsService(db)

    analytics = service.update_reading_stats(
        user_id=current_user.id,
        spread_type=reading_data.spread_type,
        character_voice=reading_data.character_voice,
        question_length=reading_data.question_length,
        card_ids=reading_data.card_ids
    )

    return {
        "message": "Reading stats updated successfully",
        "analytics": analytics.to_dict()
    }


@router.get("/user", response_model=AnalyticsResponse)
async def get_user_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive analytics for current user
    """
    service = UserAnalyticsService(db)

    # Get user analytics
    analytics = service.get_or_create_analytics(current_user.id)

    # Get recent events
    recent_events = service.get_user_events(
        user_id=current_user.id,
        limit=50
    )

    # Get patterns
    patterns = service.get_user_patterns(current_user.id)

    # Get recommendations
    recommendations = service.get_user_recommendations(current_user.id)

    return {
        "user_analytics": analytics.to_dict(),
        "recent_events": [e.to_dict() for e in recent_events],
        "patterns": [p.to_dict() for p in patterns],
        "recommendations": [r.to_dict() for r in recommendations]
    }


@router.get("/events")
async def get_events(
    event_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = Query(100, le=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user events with optional filters
    """
    service = UserAnalyticsService(db)

    events = service.get_user_events(
        user_id=current_user.id,
        event_type=event_type,
        start_date=start_date,
        end_date=end_date,
        limit=limit
    )

    return {
        "events": [e.to_dict() for e in events],
        "count": len(events)
    }


@router.get("/statistics")
async def get_statistics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get event statistics for user
    """
    service = UserAnalyticsService(db)

    stats = service.get_event_statistics(
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date
    )

    return stats


@router.post("/patterns/analyze", status_code=200)
async def analyze_patterns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze user's reading patterns
    """
    service = UserAnalyticsService(db)

    patterns = service.analyze_reading_patterns(current_user.id)

    return {
        "message": "Pattern analysis completed",
        "patterns": [p.to_dict() for p in patterns],
        "count": len(patterns)
    }


@router.get("/patterns")
async def get_patterns(
    pattern_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's reading patterns
    """
    service = UserAnalyticsService(db)

    patterns = service.get_user_patterns(
        user_id=current_user.id,
        pattern_type=pattern_type
    )

    return {
        "patterns": [p.to_dict() for p in patterns],
        "count": len(patterns)
    }


@router.post("/recommendations/generate", status_code=200)
async def generate_recommendations(
    context: Optional[dict] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate personalized recommendations with optional context

    Context can include:
    - question: Current question text for spread recommendation
    - card_ids: Cards in current reading
    """
    service = UserAnalyticsService(db)

    recommendations = service.generate_recommendations(
        user_id=current_user.id,
        context=context
    )

    return {
        "message": "Recommendations generated",
        "recommendations": [r.to_dict() for r in recommendations],
        "count": len(recommendations)
    }


@router.post("/recommendations/spread-for-question", status_code=200)
async def get_spread_for_question(
    request: QuestionRecommendationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get spread recommendation based on question analysis
    """
    service = UserAnalyticsService(db)

    recommendation = service.get_spread_recommendation_for_question(
        user_id=current_user.id,
        question=request.question
    )

    if not recommendation:
        return {
            "message": "No specific recommendation",
            "recommendation": None
        }

    return {
        "message": "Spread recommendation generated",
        "recommendation": recommendation
    }


@router.post("/recommendations/interpretation-style", status_code=200)
async def get_interpretation_style(
    request: InterpretationStyleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get interpretation style recommendation based on user experience and cards
    """
    service = UserAnalyticsService(db)

    style = service.get_interpretation_style_recommendation(
        user_id=current_user.id,
        card_ids=request.card_ids
    )

    return {
        "message": "Interpretation style recommended",
        "style": style
    }


@router.get("/recommendations")
async def get_recommendations(
    recommendation_type: Optional[str] = None,
    is_active: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user recommendations
    """
    service = UserAnalyticsService(db)

    recommendations = service.get_user_recommendations(
        user_id=current_user.id,
        recommendation_type=recommendation_type,
        is_active=is_active
    )

    return {
        "recommendations": [r.to_dict() for r in recommendations],
        "count": len(recommendations)
    }


@router.post("/recommendations/{recommendation_id}/shown", status_code=200)
async def mark_recommendation_shown(
    recommendation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark recommendation as shown to user
    """
    service = UserAnalyticsService(db)

    recommendation = service.mark_recommendation_shown(recommendation_id)

    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    return {
        "message": "Recommendation marked as shown",
        "recommendation": recommendation.to_dict()
    }


@router.post("/recommendations/{recommendation_id}/accept", status_code=200)
async def accept_recommendation(
    recommendation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Accept a recommendation
    """
    service = UserAnalyticsService(db)

    recommendation = service.accept_recommendation(recommendation_id)

    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    return {
        "message": "Recommendation accepted",
        "recommendation": recommendation.to_dict()
    }


@router.post("/recommendations/{recommendation_id}/reject", status_code=200)
async def reject_recommendation(
    recommendation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Reject a recommendation
    """
    service = UserAnalyticsService(db)

    recommendation = service.reject_recommendation(recommendation_id)

    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    return {
        "message": "Recommendation rejected",
        "recommendation": recommendation.to_dict()
    }


@router.post("/cards/{card_id}/favorite", status_code=200)
async def favorite_card(
    card_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add card to favorites
    """
    service = UserAnalyticsService(db)

    analytics = service.add_favorited_card(current_user.id, card_id)

    return {
        "message": "Card added to favorites",
        "favorited_cards": analytics.favorited_cards
    }


@router.delete("/cards/{card_id}/favorite", status_code=200)
async def unfavorite_card(
    card_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove card from favorites
    """
    service = UserAnalyticsService(db)

    analytics = service.remove_favorited_card(current_user.id, card_id)

    return {
        "message": "Card removed from favorites",
        "favorited_cards": analytics.favorited_cards
    }


@router.post("/engagement/{metric_type}", status_code=200)
async def increment_engagement(
    metric_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Increment engagement metrics (share, note, export)
    """
    if metric_type not in ["share", "note", "export"]:
        raise HTTPException(status_code=400, detail="Invalid metric type")

    service = UserAnalyticsService(db)

    analytics = service.increment_engagement_metric(current_user.id, metric_type)

    return {
        "message": f"{metric_type.capitalize()} count incremented",
        "analytics": analytics.to_dict()
    }


# ==================== Token Extension Analytics ====================

class TokenExtensionEventCreate(BaseModel):
    """Schema for tracking token extension events"""
    extension_type: str = Field(..., description="Type: 'activity' or 'loyalty'")
    extension_minutes: int = Field(..., description="Minutes extended")
    success: bool = Field(..., description="Whether extension succeeded")
    reason: Optional[str] = Field(None, description="Reason for failure if not successful")
    metadata: dict = Field(default_factory=dict, description="Additional metadata")


class TokenExtensionStatsResponse(BaseModel):
    """Schema for token extension statistics response"""
    total_extensions: int
    activity_extensions: int
    loyalty_extensions: int
    total_minutes_extended: int
    average_extension_minutes: float
    success_rate: float
    last_extension: Optional[dict] = None
    daily_stats: List[dict] = Field(default_factory=list)


class TokenExtensionHistoryResponse(BaseModel):
    """Schema for token extension history response"""
    extensions: List[dict]
    total_count: int
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None


@router.post("/token-extensions/track", status_code=201)
async def track_token_extension(
    event: TokenExtensionEventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    追蹤 Token 延長事件

    記錄使用者的 token extension 事件，包含：
    - 延長類型（活躍度 or 忠誠度）
    - 延長時間
    - 成功/失敗狀態
    - 額外 metadata
    """
    service = UserAnalyticsService(db)

    # 建立事件資料
    event_data = {
        "extension_type": event.extension_type,
        "extension_minutes": event.extension_minutes,
        "success": event.success,
        "reason": event.reason,
        **event.metadata
    }

    # 追蹤事件
    tracked_event = service.track_event(
        user_id=current_user.id,
        event_type="token_extension",
        event_category="security",
        event_action=f"extend_token_{event.extension_type}",
        event_data=event_data
    )

    return {
        "message": "Token extension event tracked",
        "event": tracked_event.to_dict()
    }


@router.get("/token-extensions/stats", response_model=TokenExtensionStatsResponse)
async def get_token_extension_stats(
    start_date: Optional[datetime] = Query(None, description="統計起始日期"),
    end_date: Optional[datetime] = Query(None, description="統計結束日期"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    取得 Token 延長統計資料

    回傳指定時間範圍內的 token extension 統計，包含：
    - 總延長次數
    - 活躍度延長次數
    - 忠誠度延長次數
    - 總延長時間
    - 平均延長時間
    - 成功率
    - 每日統計趨勢
    """
    service = UserAnalyticsService(db)

    # 如果沒有指定日期範圍，預設為最近 30 天
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    # 取得所有 token extension 事件
    events = service.get_user_events(
        user_id=current_user.id,
        event_type="token_extension",
        start_date=start_date,
        end_date=end_date,
        limit=1000
    )

    # 計算統計資料
    total_extensions = len(events)
    activity_extensions = sum(1 for e in events if e.event_data.get("extension_type") == "activity")
    loyalty_extensions = sum(1 for e in events if e.event_data.get("extension_type") == "loyalty")

    successful_events = [e for e in events if e.event_data.get("success", False)]
    total_minutes_extended = sum(e.event_data.get("extension_minutes", 0) for e in successful_events)
    average_extension_minutes = total_minutes_extended / len(successful_events) if successful_events else 0
    success_rate = (len(successful_events) / total_extensions * 100) if total_extensions > 0 else 0

    # 最後一次延長
    last_extension = events[0].to_dict() if events else None

    # 每日統計（按日期分組）
    daily_stats_dict = {}
    for event in events:
        date_key = event.created_at.date().isoformat()
        if date_key not in daily_stats_dict:
            daily_stats_dict[date_key] = {
                "date": date_key,
                "total": 0,
                "activity": 0,
                "loyalty": 0,
                "minutes_extended": 0
            }

        daily_stats_dict[date_key]["total"] += 1
        ext_type = event.event_data.get("extension_type")
        if ext_type == "activity":
            daily_stats_dict[date_key]["activity"] += 1
        elif ext_type == "loyalty":
            daily_stats_dict[date_key]["loyalty"] += 1

        if event.event_data.get("success", False):
            daily_stats_dict[date_key]["minutes_extended"] += event.event_data.get("extension_minutes", 0)

    daily_stats = sorted(daily_stats_dict.values(), key=lambda x: x["date"])

    return {
        "total_extensions": total_extensions,
        "activity_extensions": activity_extensions,
        "loyalty_extensions": loyalty_extensions,
        "total_minutes_extended": total_minutes_extended,
        "average_extension_minutes": round(average_extension_minutes, 2),
        "success_rate": round(success_rate, 2),
        "last_extension": last_extension,
        "daily_stats": daily_stats
    }


@router.get("/token-extensions/history", response_model=TokenExtensionHistoryResponse)
async def get_token_extension_history(
    extension_type: Optional[str] = Query(None, description="篩選延長類型: activity, loyalty"),
    start_date: Optional[datetime] = Query(None, description="起始日期"),
    end_date: Optional[datetime] = Query(None, description="結束日期"),
    limit: int = Query(50, le=500, description="最多回傳筆數"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    取得 Token 延長歷史記錄

    回傳使用者的 token extension 歷史，可依據：
    - 延長類型（activity/loyalty）
    - 時間範圍
    - 筆數限制

    用於前端監控儀表板顯示詳細記錄
    """
    service = UserAnalyticsService(db)

    # 如果沒有指定日期範圍，預設為最近 30 天
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    # 取得事件
    events = service.get_user_events(
        user_id=current_user.id,
        event_type="token_extension",
        start_date=start_date,
        end_date=end_date,
        limit=limit
    )

    # 如果指定 extension_type，進行篩選
    if extension_type:
        events = [e for e in events if e.event_data.get("extension_type") == extension_type]

    # 轉換為 dict 並增強資訊
    extensions = []
    for event in events:
        ext_dict = event.to_dict()
        # 增加可讀性資訊
        ext_dict["readable_time"] = event.created_at.strftime("%Y-%m-%d %H:%M:%S")
        ext_dict["success_text"] = "成功" if event.event_data.get("success", False) else "失敗"
        ext_dict["type_text"] = "活躍度延長" if event.event_data.get("extension_type") == "activity" else "忠誠度延長"
        extensions.append(ext_dict)

    return {
        "extensions": extensions,
        "total_count": len(extensions),
        "period_start": start_date,
        "period_end": end_date
    }
