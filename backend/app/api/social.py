"""
Social API - Endpoints for friendship management, achievements, and community features
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.db.database import get_db
from app.services.social_service import SocialService
from app.core.dependencies import get_current_user, get_optional_user
from app.models.user import User
from app.models.social_features import AchievementCategory, FriendshipStatus
from app.core.exceptions import (
    UserNotFoundError,
    InsufficientPermissionsError,
    ResourceNotFoundError
)


# Pydantic models for request/response
class FriendRequestRequest(BaseModel):
    recipient_id: str = Field(..., description="User ID to send friend request to")
    how_they_met: str = Field("wasteland_encounter", description="How the users met")


class FriendRequestResponse(BaseModel):
    friendship_id: str = Field(..., description="Accept or reject this friendship")
    accept: bool = Field(..., description="True to accept, False to reject")
    custom_nickname: Optional[str] = Field(None, max_length=100, description="Custom nickname for friend")


class UserFriendshipResponse(BaseModel):
    id: str
    requester_id: str
    recipient_id: str
    status: str
    request_date: str
    response_date: Optional[str]
    friendship_duration_days: int
    custom_nickname: Optional[str]
    how_they_met: Optional[str]
    shared_faction: Optional[str]
    karma_compatibility: Optional[float]
    interaction_count: int
    is_active: bool

    class Config:
        from_attributes = True


class UserAchievementResponse(BaseModel):
    id: str
    achievement_id: str
    achievement_name: str
    achievement_category: str
    description: str
    progress_current: int
    progress_required: int
    progress_percentage: float
    is_completed: bool
    completion_date: Optional[str]
    karma_reward: int
    rarity: str
    fallout_reference: Optional[str]
    difficulty_rating: Optional[float]

    class Config:
        from_attributes = True


class CommunityEventResponse(BaseModel):
    id: str
    event_name: str
    event_type: str
    description: str
    short_description: Optional[str]
    start_date: str
    end_date: str
    max_participants: Optional[int]
    current_participants: int
    difficulty_level: str
    status: str
    is_currently_active: bool
    days_remaining: int
    participation_requirements: Optional[Dict[str, Any]]
    completion_rewards: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True


class LeaderboardEntryResponse(BaseModel):
    rank: int
    user_id: str
    display_name: str
    faction: Optional[str]
    completion_date: Optional[str]
    progress_time: Optional[float]  # Days to complete

    class Config:
        from_attributes = True


router = APIRouter(prefix="/social", tags=["social"])


# Friendship Management Endpoints
@router.post("/friends/request", response_model=Dict[str, Any])
async def send_friend_request(
    request_data: FriendRequestRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Send a friend request to another user"""
    service = SocialService(db)

    try:
        friendship = await service.send_friend_request(
            requester_id=current_user.id,
            recipient_id=request_data.recipient_id,
            how_they_met=request_data.how_they_met
        )

        return {
            "message": "Friend request sent successfully",
            "friendship_id": friendship.id,
            "recipient_id": request_data.recipient_id,
            "status": friendship.status
        }

    except UserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except InsufficientPermissionsError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending friend request: {str(e)}")


@router.post("/friends/respond", response_model=Dict[str, Any])
async def respond_to_friend_request(
    response_data: FriendRequestResponse,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Accept or reject a friend request"""
    service = SocialService(db)

    try:
        friendship = await service.respond_to_friend_request(
            friendship_id=response_data.friendship_id,
            user_id=current_user.id,
            accept=response_data.accept,
            custom_nickname=response_data.custom_nickname
        )

        return {
            "message": "Friend request accepted" if response_data.accept else "Friend request rejected",
            "friendship_id": friendship.id,
            "status": friendship.status,
            "friendship_anniversary": friendship.friendship_anniversary.isoformat() if friendship.friendship_anniversary else None
        }

    except ResourceNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except InsufficientPermissionsError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error responding to friend request: {str(e)}")


@router.get("/friends", response_model=List[UserFriendshipResponse])
async def get_my_friends(
    include_pending: bool = Query(False, description="Include pending friend requests"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's friends list"""
    service = SocialService(db)

    try:
        friendships = await service.get_user_friends(
            user_id=current_user.id,
            include_pending=include_pending
        )

        return [
            UserFriendshipResponse(
                id=friendship.id,
                requester_id=friendship.requester_id,
                recipient_id=friendship.recipient_id,
                status=friendship.status,
                request_date=friendship.request_date.isoformat() if friendship.request_date else "",
                response_date=friendship.response_date.isoformat() if friendship.response_date else None,
                friendship_duration_days=friendship.get_friendship_duration(),
                custom_nickname=friendship.custom_nickname,
                how_they_met=friendship.how_they_met,
                shared_faction=friendship.shared_faction,
                karma_compatibility=friendship.karma_compatibility,
                interaction_count=friendship.interaction_count,
                is_active=friendship.is_active_friendship()
            )
            for friendship in friendships
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving friends: {str(e)}")


@router.get("/friends/requests", response_model=List[Dict[str, Any]])
async def get_friend_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get pending friend requests for current user"""
    service = SocialService(db)

    try:
        requests = await service.get_friend_requests(current_user.id)

        return [
            {
                "friendship_id": request.id,
                "requester_id": request.requester_id,
                "requester_name": request.requester.get_sanitized_display_name() if request.requester else "Unknown",
                "request_date": request.request_date.isoformat() if request.request_date else "",
                "how_they_met": request.how_they_met,
                "shared_faction": request.shared_faction,
                "karma_compatibility": request.karma_compatibility
            }
            for request in requests
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving friend requests: {str(e)}")


@router.post("/friends/block", response_model=Dict[str, Any])
async def block_user(
    blocked_user_id: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Block a user"""
    service = SocialService(db)

    try:
        success = await service.block_user(
            blocker_id=current_user.id,
            blocked_id=blocked_user_id
        )

        return {
            "message": "User blocked successfully",
            "blocked_user_id": blocked_user_id,
            "success": success
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error blocking user: {str(e)}")


# Achievement Management Endpoints
@router.get("/achievements", response_model=List[UserAchievementResponse])
async def get_my_achievements(
    category: Optional[AchievementCategory] = Query(None, description="Filter by category"),
    completed_only: bool = Query(False, description="Show only completed achievements"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's achievements"""
    service = SocialService(db)

    try:
        achievements = await service.get_user_achievements(
            user_id=current_user.id,
            category_filter=category,
            completed_only=completed_only
        )

        return [
            UserAchievementResponse(
                id=achievement.id,
                achievement_id=achievement.achievement_id,
                achievement_name=achievement.achievement_name,
                achievement_category=achievement.achievement_category,
                description=achievement.description,
                progress_current=achievement.progress_current,
                progress_required=achievement.progress_required,
                progress_percentage=achievement.calculate_progress_percentage(),
                is_completed=achievement.is_completed,
                completion_date=achievement.completion_date.isoformat() if achievement.completion_date else None,
                karma_reward=achievement.karma_reward,
                rarity=achievement.rarity,
                fallout_reference=achievement.fallout_reference,
                difficulty_rating=achievement.difficulty_rating
            )
            for achievement in achievements
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving achievements: {str(e)}")


@router.post("/achievements/check", response_model=List[UserAchievementResponse])
async def check_my_achievements(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Check for new achievements and award them"""
    service = SocialService(db)

    try:
        new_achievements = await service.check_user_achievements(current_user.id)

        return [
            UserAchievementResponse(
                id=achievement.id,
                achievement_id=achievement.achievement_id,
                achievement_name=achievement.achievement_name,
                achievement_category=achievement.achievement_category,
                description=achievement.description,
                progress_current=achievement.progress_current,
                progress_required=achievement.progress_required,
                progress_percentage=achievement.calculate_progress_percentage(),
                is_completed=achievement.is_completed,
                completion_date=achievement.completion_date.isoformat() if achievement.completion_date else None,
                karma_reward=achievement.karma_reward,
                rarity=achievement.rarity,
                fallout_reference=achievement.fallout_reference,
                difficulty_rating=achievement.difficulty_rating
            )
            for achievement in new_achievements
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking achievements: {str(e)}")


@router.get("/achievements/{achievement_id}/leaderboard", response_model=List[LeaderboardEntryResponse])
async def get_achievement_leaderboard(
    achievement_id: str,
    limit: int = Query(50, ge=1, le=200, description="Number of entries to return"),
    db: AsyncSession = Depends(get_db)
):
    """Get leaderboard for specific achievement"""
    service = SocialService(db)

    try:
        leaderboard = await service.get_achievement_leaderboard(
            achievement_id=achievement_id,
            limit=limit
        )

        return [LeaderboardEntryResponse(**entry) for entry in leaderboard]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving achievement leaderboard: {str(e)}")


# Community Events Endpoints
@router.get("/events/active", response_model=List[CommunityEventResponse])
async def get_active_events(db: AsyncSession = Depends(get_db)):
    """Get currently active community events"""
    service = SocialService(db)

    try:
        events = await service.get_active_community_events()

        return [
            CommunityEventResponse(
                id=event.id,
                event_name=event.event_name,
                event_type=event.event_type,
                description=event.description,
                short_description=event.short_description,
                start_date=event.start_date.isoformat() if event.start_date else "",
                end_date=event.end_date.isoformat() if event.end_date else "",
                max_participants=event.max_participants,
                current_participants=event.current_participants,
                difficulty_level=event.difficulty_level,
                status=event.status,
                is_currently_active=event.is_currently_active(),
                days_remaining=event.get_days_remaining(),
                participation_requirements=event.participation_requirements,
                completion_rewards=event.completion_rewards
            )
            for event in events
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving active events: {str(e)}")


@router.get("/events/upcoming", response_model=List[CommunityEventResponse])
async def get_upcoming_events(
    limit: int = Query(10, ge=1, le=50, description="Number of events to return"),
    db: AsyncSession = Depends(get_db)
):
    """Get upcoming community events"""
    service = SocialService(db)

    try:
        events = await service.get_upcoming_community_events(limit=limit)

        return [
            CommunityEventResponse(
                id=event.id,
                event_name=event.event_name,
                event_type=event.event_type,
                description=event.description,
                short_description=event.short_description,
                start_date=event.start_date.isoformat() if event.start_date else "",
                end_date=event.end_date.isoformat() if event.end_date else "",
                max_participants=event.max_participants,
                current_participants=event.current_participants,
                difficulty_level=event.difficulty_level,
                status=event.status,
                is_currently_active=event.is_currently_active(),
                days_remaining=event.get_days_remaining(),
                participation_requirements=event.participation_requirements,
                completion_rewards=event.completion_rewards
            )
            for event in events
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving upcoming events: {str(e)}")


@router.post("/events/{event_id}/join", response_model=Dict[str, Any])
async def join_community_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Join a community event"""
    service = SocialService(db)

    try:
        success = await service.join_community_event(
            user_id=current_user.id,
            event_id=event_id
        )

        return {
            "message": "Successfully joined community event",
            "event_id": event_id,
            "user_id": current_user.id,
            "success": success
        }

    except ResourceNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except InsufficientPermissionsError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error joining event: {str(e)}")


# Social Statistics Endpoints
@router.get("/stats/my-social", response_model=Dict[str, Any])
async def get_my_social_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's social statistics"""
    service = SocialService(db)

    try:
        # Get friends count
        friends = await service.get_user_friends(current_user.id)
        friends_count = len([f for f in friends if f.is_active_friendship()])

        # Get achievements count
        achievements = await service.get_user_achievements(current_user.id, completed_only=True)
        achievements_count = len(achievements)

        # Get pending requests count
        pending_requests = await service.get_friend_requests(current_user.id)
        pending_count = len(pending_requests)

        return {
            "user_id": current_user.id,
            "friends_count": friends_count,
            "achievements_count": achievements_count,
            "pending_friend_requests": pending_count,
            "karma_score": current_user.karma_score,
            "karma_alignment": current_user.karma_alignment().value,
            "faction": current_user.faction_alignment,
            "total_readings": current_user.total_readings,
            "social_activity_score": friends_count * 10 + achievements_count * 5
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving social statistics: {str(e)}")


@router.get("/available-achievements", response_model=Dict[str, Any])
async def get_available_achievements():
    """Get list of all available achievements"""
    from app.services.social_service import AchievementEngine

    return {
        "achievements": {
            achievement_id: {
                "name": definition["name"],
                "description": definition["description"],
                "category": definition["category"].value,
                "criteria": definition["criteria"],
                "karma_reward": definition["karma_reward"],
                "rarity": definition["rarity"]
            }
            for achievement_id, definition in AchievementEngine.ACHIEVEMENT_DEFINITIONS.items()
        },
        "categories": [category.value for category in AchievementCategory],
        "rarity_levels": ["common", "uncommon", "rare", "legendary"]
    }