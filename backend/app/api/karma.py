"""
Karma API - Endpoints for karma tracking and history management
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.db.database import get_db
from app.services.karma_service import KarmaService
from app.core.dependencies import get_current_user, get_optional_user
from app.models.user import User
from app.models.social_features import KarmaChangeReason
from app.models.wasteland_card import KarmaAlignment
from app.core.exceptions import (
    UserNotFoundError,
    InsufficientPermissionsError
)


# Pydantic models for request/response
class KarmaChangeRequest(BaseModel):
    user_id: str = Field(..., description="Target user ID")
    reason: KarmaChangeReason = Field(..., description="Reason for karma change")
    reason_description: str = Field(..., min_length=1, max_length=500, description="Detailed description")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context data")
    triggered_by_action: Optional[str] = Field(None, max_length=100, description="Action that triggered change")
    related_reading_id: Optional[str] = Field(None, description="Related reading ID")
    related_user_id: Optional[str] = Field(None, description="Related user ID")


class KarmaHistoryResponse(BaseModel):
    id: str
    karma_before: int
    karma_after: int
    karma_change: int
    reason: str
    reason_description: str
    triggered_by_action: Optional[str]
    faction_influence: Optional[str]
    alignment_before: str
    alignment_after: str
    alignment_changed: bool
    significant_threshold_crossed: bool
    automated_change: bool
    confidence_score: Optional[float]
    is_verified: bool
    created_at: str

    class Config:
        from_attributes = True


class KarmaStatisticsResponse(BaseModel):
    current_karma: int
    current_alignment: str
    total_changes: int
    total_karma_gained: int
    average_change: float
    biggest_gain: int
    biggest_loss: int
    changes_by_reason: Dict[str, Dict[str, int]]
    recent_alignment_changes: List[Dict[str, Any]]
    karma_trend_30d: int
    next_alignment_threshold: Dict[str, Any]

    class Config:
        from_attributes = True


class LeaderboardEntryResponse(BaseModel):
    rank: int
    user_id: str
    display_name: str
    karma_score: int
    alignment: str
    faction: Optional[str]
    total_readings: int

    class Config:
        from_attributes = True


class KarmaValidationResponse(BaseModel):
    is_valid: bool
    message: str
    daily_limit_used: Optional[int] = None
    daily_limit_max: Optional[int] = None

    class Config:
        from_attributes = True


router = APIRouter(prefix="/karma", tags=["karma"])


@router.get("/my-stats", response_model=KarmaStatisticsResponse)
async def get_my_karma_statistics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's karma statistics"""
    service = KarmaService(db)

    try:
        stats = await service.get_karma_statistics(current_user.id)
        return KarmaStatisticsResponse(**stats)

    except UserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving karma statistics: {str(e)}")


@router.get("/my-history", response_model=List[KarmaHistoryResponse])
async def get_my_karma_history(
    limit: int = Query(50, ge=1, le=200, description="Number of records to return"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    reason_filter: Optional[KarmaChangeReason] = Query(None, description="Filter by reason"),
    days_back: Optional[int] = Query(None, ge=1, le=365, description="Number of days back to search"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's karma change history"""
    service = KarmaService(db)

    date_from = None
    if days_back:
        date_from = datetime.utcnow() - timedelta(days=days_back)

    try:
        history = await service.get_user_karma_history(
            user_id=current_user.id,
            limit=limit,
            offset=offset,
            reason_filter=reason_filter,
            date_from=date_from
        )

        return [
            KarmaHistoryResponse(
                id=record.id,
                karma_before=record.karma_before,
                karma_after=record.karma_after,
                karma_change=record.karma_change,
                reason=record.reason,
                reason_description=record.reason_description,
                triggered_by_action=record.triggered_by_action,
                faction_influence=record.faction_influence,
                alignment_before=record.alignment_before,
                alignment_after=record.alignment_after,
                alignment_changed=record.alignment_changed,
                significant_threshold_crossed=record.significant_threshold_crossed,
                automated_change=record.automated_change,
                confidence_score=record.confidence_score,
                is_verified=record.is_verified,
                created_at=record.created_at.isoformat() if record.created_at else ""
            )
            for record in history
        ]

    except UserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving karma history: {str(e)}")


@router.get("/leaderboard", response_model=List[LeaderboardEntryResponse])
async def get_karma_leaderboard(
    limit: int = Query(50, ge=1, le=200, description="Number of entries to return"),
    faction_filter: Optional[str] = Query(None, description="Filter by faction"),
    alignment_filter: Optional[KarmaAlignment] = Query(None, description="Filter by alignment"),
    db: AsyncSession = Depends(get_db)
):
    """Get karma leaderboard"""
    service = KarmaService(db)

    try:
        leaderboard = await service.get_karma_leaderboard(
            limit=limit,
            faction_filter=faction_filter,
            alignment_filter=alignment_filter
        )

        return [LeaderboardEntryResponse(**entry) for entry in leaderboard]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving leaderboard: {str(e)}")


@router.get("/user/{user_id}/stats", response_model=KarmaStatisticsResponse)
async def get_user_karma_statistics(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get another user's karma statistics (requires friendship or admin)"""
    service = KarmaService(db)

    # TODO: Add friendship/admin check here
    # For now, only allow users to see their own stats
    if user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        stats = await service.get_karma_statistics(user_id)
        return KarmaStatisticsResponse(**stats)

    except UserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving karma statistics: {str(e)}")


@router.post("/apply-change", response_model=KarmaHistoryResponse)
async def apply_karma_change(
    karma_request: KarmaChangeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Apply karma change (admin only or specific automated systems)"""
    service = KarmaService(db)

    # Check permissions - only admins or system can apply karma changes
    if not current_user.is_admin:
        # In the future, this could be expanded to allow certain automated systems
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        karma_history = await service.apply_karma_change(
            user_id=karma_request.user_id,
            reason=karma_request.reason,
            reason_description=karma_request.reason_description,
            context=karma_request.context,
            triggered_by_action=karma_request.triggered_by_action,
            related_reading_id=karma_request.related_reading_id,
            related_user_id=karma_request.related_user_id,
            admin_override=current_user.is_admin
        )

        return KarmaHistoryResponse(
            id=karma_history.id,
            karma_before=karma_history.karma_before,
            karma_after=karma_history.karma_after,
            karma_change=karma_history.karma_change,
            reason=karma_history.reason,
            reason_description=karma_history.reason_description,
            triggered_by_action=karma_history.triggered_by_action,
            faction_influence=karma_history.faction_influence,
            alignment_before=karma_history.alignment_before,
            alignment_after=karma_history.alignment_after,
            alignment_changed=karma_history.alignment_changed,
            significant_threshold_crossed=karma_history.significant_threshold_crossed,
            automated_change=karma_history.automated_change,
            confidence_score=karma_history.confidence_score,
            is_verified=karma_history.is_verified,
            created_at=karma_history.created_at.isoformat() if karma_history.created_at else ""
        )

    except UserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except InsufficientPermissionsError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error applying karma change: {str(e)}")


@router.post("/validate-change", response_model=KarmaValidationResponse)
async def validate_karma_change(
    user_id: str = Body(..., embed=True),
    reason: KarmaChangeReason = Body(..., embed=True),
    requested_change: int = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Validate if a karma change request would be allowed"""
    service = KarmaService(db)

    # Check permissions - only admins can validate changes for other users
    if user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        is_valid, message = await service.validate_karma_change_request(
            user_id=user_id,
            reason=reason,
            requested_change=requested_change,
            admin_user_id=current_user.id if current_user.is_admin else None
        )

        return KarmaValidationResponse(
            is_valid=is_valid,
            message=message
        )

    except UserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error validating karma change: {str(e)}")


@router.post("/revert/{karma_history_id}", response_model=Dict[str, Any])
async def revert_karma_change(
    karma_history_id: str,
    reason: str = Body(..., min_length=1, max_length=500, embed=True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Revert a karma change (admin only)"""
    service = KarmaService(db)

    # Check admin permissions
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")

    try:
        success = await service.revert_karma_change(
            karma_history_id=karma_history_id,
            admin_user_id=current_user.id,
            reason=reason
        )

        if not success:
            raise HTTPException(status_code=404, detail="Karma history record not found")

        return {
            "message": "Karma change reverted successfully",
            "karma_history_id": karma_history_id,
            "reverted_by": current_user.id,
            "reason": reason
        }

    except InsufficientPermissionsError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reverting karma change: {str(e)}")


@router.get("/rules", response_model=Dict[str, Any])
async def get_karma_rules():
    """Get karma rules and thresholds information"""
    from app.services.karma_service import KarmaRulesEngine

    return {
        "karma_rules": {
            reason.value: {
                "base_change": rule["base_change"],
                "max_per_day": rule["max_per_day"],
                "requires_verification": rule["requires_verification"],
                "description": reason.value.replace("_", " ").title()
            }
            for reason, rule in KarmaRulesEngine.KARMA_RULES.items()
        },
        "alignment_thresholds": {
            "evil": "0-30",
            "neutral": "31-69",
            "good": "70-100"
        },
        "alignment_change_thresholds": KarmaRulesEngine.ALIGNMENT_THRESHOLDS,
        "karma_range": {
            "minimum": 0,
            "maximum": 100,
            "starting_value": 50
        }
    }


@router.get("/my-daily-limits", response_model=Dict[str, Any])
async def get_my_daily_karma_limits(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's daily karma limits and usage"""
    service = KarmaService(db)

    daily_limits = {}

    for reason in KarmaChangeReason:
        try:
            can_apply, daily_used = await service._check_daily_karma_limits(
                current_user.id, reason
            )

            rule = service.rules_engine.KARMA_RULES.get(reason)
            daily_limit = rule["max_per_day"] if rule else 0

            daily_limits[reason.value] = {
                "daily_limit": daily_limit,
                "daily_used": daily_used,
                "can_apply_more": can_apply,
                "remaining": daily_limit - daily_used if daily_limit > 0 else daily_limit - daily_used
            }

        except Exception:
            # Skip if error getting limits for this reason
            continue

    return {
        "user_id": current_user.id,
        "current_karma": current_user.karma_score,
        "current_alignment": current_user.karma_alignment().value,
        "daily_limits": daily_limits
    }