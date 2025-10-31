"""
Social Service - Friendship management, achievement tracking, and community features
"""

from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc, asc
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.social_features import (
    UserFriendship,
    UserAchievement,
    CommunityEvent,
    EventParticipant,
    FriendshipStatus,
    AchievementCategory
)
from app.models.reading_enhanced import CompletedReading
from app.core.exceptions import (
    UserNotFoundError,
    InsufficientPermissionsError,
    ResourceNotFoundError
)


class AchievementEngine:
    """Engine for tracking and awarding achievements"""

    # Achievement definitions with criteria
    ACHIEVEMENT_DEFINITIONS = {
        "first_reading": {
            "name": "First Steps in the Wasteland",
            "description": "Complete your first tarot reading",
            "category": AchievementCategory.READING_MILESTONES,
            "criteria": {"readings_count": 1},
            "karma_reward": 5,
            "rarity": "common"
        },
        "ten_readings": {
            "name": "Wasteland Explorer",
            "description": "Complete 10 tarot readings",
            "category": AchievementCategory.READING_MILESTONES,
            "criteria": {"readings_count": 10},
            "karma_reward": 10,
            "rarity": "common"
        },
        "hundred_readings": {
            "name": "Master Diviner",
            "description": "Complete 100 tarot readings",
            "category": AchievementCategory.READING_MILESTONES,
            "criteria": {"readings_count": 100},
            "karma_reward": 25,
            "rarity": "rare"
        },
        "five_hundred_readings": {
            "name": "Wasteland Oracle",
            "description": "Complete 500 tarot readings",
            "category": AchievementCategory.READING_MILESTONES,
            "criteria": {"readings_count": 500},
            "karma_reward": 50,
            "rarity": "legendary"
        },
        "week_streak": {
            "name": "Consistent Survivor",
            "description": "Complete readings for 7 consecutive days",
            "category": AchievementCategory.CONSISTENCY,
            "criteria": {"consecutive_days": 7},
            "karma_reward": 10,
            "rarity": "uncommon"
        },
        "month_streak": {
            "name": "Dedicated Wanderer",
            "description": "Complete readings for 30 consecutive days",
            "category": AchievementCategory.CONSISTENCY,
            "criteria": {"consecutive_days": 30},
            "karma_reward": 25,
            "rarity": "rare"
        },
        "first_friend": {
            "name": "Wasteland Companion",
            "description": "Make your first friend in the wasteland",
            "category": AchievementCategory.SOCIAL,
            "criteria": {"friends_count": 1},
            "karma_reward": 5,
            "rarity": "common"
        },
        "ten_friends": {
            "name": "Social Butterfly",
            "description": "Make 10 friends in the wasteland",
            "category": AchievementCategory.SOCIAL,
            "criteria": {"friends_count": 10},
            "karma_reward": 15,
            "rarity": "uncommon"
        },
        "all_suits_explored": {
            "name": "Suit Master",
            "description": "Draw cards from all four suits in readings",
            "category": AchievementCategory.EXPLORATION,
            "criteria": {"suits_explored": 4},
            "karma_reward": 15,
            "rarity": "uncommon"
        },
        "high_accuracy": {
            "name": "Precise Prophet",
            "description": "Maintain 4.5+ average accuracy rating over 20 readings",
            "category": AchievementCategory.ACCURACY,
            "criteria": {"average_accuracy": 4.5, "min_readings": 20},
            "karma_reward": 20,
            "rarity": "rare"
        }
    }

    @classmethod
    def check_achievement_criteria(
        cls,
        achievement_id: str,
        user_stats: Dict[str, Any]
    ) -> bool:
        """Check if user meets criteria for specific achievement"""

        if achievement_id not in cls.ACHIEVEMENT_DEFINITIONS:
            return False

        definition = cls.ACHIEVEMENT_DEFINITIONS[achievement_id]
        criteria = definition["criteria"]

        for criterion, required_value in criteria.items():
            user_value = user_stats.get(criterion, 0)

            if criterion in ["readings_count", "friends_count", "consecutive_days", "suits_explored"]:
                if user_value < required_value:
                    return False
            elif criterion == "average_accuracy":
                min_readings = criteria.get("min_readings", 1)
                if user_stats.get("readings_count", 0) < min_readings or user_value < required_value:
                    return False

        return True


class SocialService:
    """Service for managing social features, achievements, and community interactions"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.achievement_engine = AchievementEngine()

    # Friendship Management
    async def send_friend_request(
        self,
        requester_id: str,
        recipient_id: str,
        how_they_met: str = "wasteland_encounter"
    ) -> UserFriendship:
        """Send a friend request"""

        if requester_id == recipient_id:
            raise ValueError("Cannot send friend request to yourself")

        # Check if users exist
        requester = await self._get_user_with_validation(requester_id)
        recipient = await self._get_user_with_validation(recipient_id)

        # Check if recipient allows friend requests
        if not recipient.allow_friend_requests:
            raise InsufficientPermissionsError("User does not accept friend requests")

        # Check if friendship already exists
        existing_friendship = await self._get_existing_friendship(requester_id, recipient_id)
        if existing_friendship:
            if existing_friendship.status == FriendshipStatus.PENDING.value:
                raise ValueError("Friend request already pending")
            elif existing_friendship.status == FriendshipStatus.ACCEPTED.value:
                raise ValueError("Users are already friends")
            elif existing_friendship.status == FriendshipStatus.BLOCKED.value:
                raise InsufficientPermissionsError("Cannot send friend request")

        # Calculate karma compatibility
        karma_compatibility = self._calculate_karma_compatibility(
            requester.karma_score, recipient.karma_score
        )

        # Create friendship record
        friendship = UserFriendship(
            requester_id=requester_id,
            recipient_id=recipient_id,
            status=FriendshipStatus.PENDING.value,
            request_date=datetime.utcnow(),
            how_they_met=how_they_met,
            shared_faction=requester.faction_alignment if requester.faction_alignment == recipient.faction_alignment else None,
            karma_compatibility=karma_compatibility
        )

        self.db.add(friendship)
        await self.db.commit()

        return friendship

    async def respond_to_friend_request(
        self,
        friendship_id: str,
        user_id: str,
        accept: bool,
        custom_nickname: str = None
    ) -> UserFriendship:
        """Accept or reject a friend request"""

        friendship = await self._get_friendship_by_id(friendship_id)
        if not friendship:
            raise ResourceNotFoundError("Friend request not found")

        # Only recipient can respond
        if friendship.recipient_id != user_id:
            raise InsufficientPermissionsError("Only the recipient can respond to this request")

        # Check if request is still pending
        if friendship.status != FriendshipStatus.PENDING.value:
            raise ValueError("Friend request is no longer pending")

        # Update friendship status
        if accept:
            friendship.status = FriendshipStatus.ACCEPTED.value
            friendship.response_date = datetime.utcnow()
            friendship.friendship_anniversary = datetime.utcnow()
            if custom_nickname:
                friendship.custom_nickname = custom_nickname

            # Check for friendship achievements
            await self._check_friendship_achievements(user_id)
            await self._check_friendship_achievements(friendship.requester_id)

        else:
            friendship.status = FriendshipStatus.REJECTED.value
            friendship.response_date = datetime.utcnow()

        await self.db.commit()
        return friendship

    async def get_user_friends(
        self,
        user_id: str,
        include_pending: bool = False
    ) -> List[UserFriendship]:
        """Get user's friends list"""

        query = select(UserFriendship).where(
            or_(
                UserFriendship.requester_id == user_id,
                UserFriendship.recipient_id == user_id
            )
        )

        if include_pending:
            query = query.where(
                UserFriendship.status.in_([
                    FriendshipStatus.ACCEPTED.value,
                    FriendshipStatus.PENDING.value
                ])
            )
        else:
            query = query.where(UserFriendship.status == FriendshipStatus.ACCEPTED.value)

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_friend_requests(self, user_id: str) -> List[UserFriendship]:
        """Get pending friend requests for user"""

        result = await self.db.execute(
            select(UserFriendship)
            .options(selectinload(UserFriendship.requester))
            .where(
                and_(
                    UserFriendship.recipient_id == user_id,
                    UserFriendship.status == FriendshipStatus.PENDING.value
                )
            )
            .order_by(desc(UserFriendship.request_date))
        )
        return result.scalars().all()

    async def block_user(self, blocker_id: str, blocked_id: str) -> bool:
        """Block a user (prevents friend requests and interactions)"""

        if blocker_id == blocked_id:
            raise ValueError("Cannot block yourself")

        # Check if friendship exists
        friendship = await self._get_existing_friendship(blocker_id, blocked_id)

        if friendship:
            friendship.status = FriendshipStatus.BLOCKED.value
            friendship.blocked_date = datetime.utcnow()
        else:
            # Create blocked relationship
            friendship = UserFriendship(
                requester_id=blocker_id,
                recipient_id=blocked_id,
                status=FriendshipStatus.BLOCKED.value,
                request_date=datetime.utcnow(),
                blocked_date=datetime.utcnow()
            )
            self.db.add(friendship)

        await self.db.commit()
        return True

    # Achievement Management
    async def check_user_achievements(self, user_id: str) -> List[UserAchievement]:
        """Check and award new achievements for user"""

        user_stats = await self._calculate_user_achievement_stats(user_id)
        new_achievements = []

        for achievement_id, definition in self.achievement_engine.ACHIEVEMENT_DEFINITIONS.items():
            # Check if user already has this achievement
            existing = await self._user_has_achievement(user_id, achievement_id)
            if existing:
                continue

            # Check if user meets criteria
            if self.achievement_engine.check_achievement_criteria(achievement_id, user_stats):
                achievement = await self._award_achievement(user_id, achievement_id, definition)
                new_achievements.append(achievement)

        return new_achievements

    async def get_user_achievements(
        self,
        user_id: str,
        category_filter: Optional[AchievementCategory] = None,
        completed_only: bool = False
    ) -> List[UserAchievement]:
        """Get user's achievements"""

        query = select(UserAchievement).where(UserAchievement.user_id == user_id)

        if category_filter:
            query = query.where(UserAchievement.achievement_category == category_filter.value)

        if completed_only:
            query = query.where(UserAchievement.is_completed == True)

        result = await self.db.execute(query.order_by(desc(UserAchievement.completion_date)))
        return result.scalars().all()

    async def get_achievement_leaderboard(
        self,
        achievement_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get leaderboard for specific achievement"""

        result = await self.db.execute(
            select(UserAchievement, User.display_name, User.faction_alignment)
            .join(User, UserAchievement.user_id == User.id)
            .where(
                and_(
                    UserAchievement.achievement_id == achievement_id,
                    UserAchievement.is_completed == True
                )
            )
            .order_by(asc(UserAchievement.completion_date))
            .limit(limit)
        )

        leaderboard = []
        for i, (achievement, display_name, faction) in enumerate(result.fetchall(), 1):
            leaderboard.append({
                "rank": i,
                "user_id": achievement.user_id,
                "display_name": display_name,
                "faction": faction,
                "completion_date": achievement.completion_date.isoformat() if achievement.completion_date else None,
                "progress_time": (achievement.completion_date - achievement.created_at).total_seconds() / 86400 if achievement.completion_date and achievement.created_at else None
            })

        return leaderboard

    # Community Events
    async def get_active_community_events(self) -> List[CommunityEvent]:
        """Get currently active community events"""

        now = datetime.utcnow()
        result = await self.db.execute(
            select(CommunityEvent).where(
                and_(
                    CommunityEvent.is_active == True,
                    CommunityEvent.start_date <= now,
                    CommunityEvent.end_date >= now
                )
            ).order_by(asc(CommunityEvent.end_date))
        )
        return result.scalars().all()

    async def get_upcoming_community_events(self, limit: int = 10) -> List[CommunityEvent]:
        """Get upcoming community events"""

        now = datetime.utcnow()
        result = await self.db.execute(
            select(CommunityEvent).where(
                and_(
                    CommunityEvent.is_active == True,
                    CommunityEvent.start_date > now
                )
            )
            .order_by(asc(CommunityEvent.start_date))
            .limit(limit)
        )
        return result.scalars().all()

    async def join_community_event(
        self,
        user_id: str,
        event_id: str
    ) -> bool:
        """Join a community event"""

        user = await self._get_user_with_validation(user_id)

        result = await self.db.execute(
            select(CommunityEvent).where(CommunityEvent.id == event_id)
        )
        event = result.scalar_one_or_none()

        if not event:
            raise ResourceNotFoundError("Community event not found")

        if not event.is_currently_active():
            raise ValueError("Event is not currently active")

        # Check if user can participate
        if not event.can_user_participate(user.karma_score, user.faction_alignment):
            raise InsufficientPermissionsError("User does not meet event requirements")

        # Check if event is full
        if event.max_participants and event.current_participants >= event.max_participants:
            raise InsufficientPermissionsError("Event is full")

        # P2.2: Check if user already joined
        existing_participant = await self.db.execute(
            select(EventParticipant).where(
                and_(
                    EventParticipant.user_id == user_id,
                    EventParticipant.event_id == event_id
                )
            )
        )
        if existing_participant.scalar_one_or_none():
            raise ValueError("User already joined this event")

        # P2.2: Create EventParticipant record
        participant = EventParticipant(
            user_id=user_id,
            event_id=event_id,
            status="joined",
            joined_at=datetime.utcnow(),
            last_activity_at=datetime.utcnow()
        )
        self.db.add(participant)

        # Increment participant counter
        event.current_participants += 1
        await self.db.commit()

        return True

    async def leave_community_event(
        self,
        user_id: str,
        event_id: str
    ) -> bool:
        """Leave a community event"""

        result = await self.db.execute(
            select(EventParticipant).where(
                and_(
                    EventParticipant.user_id == user_id,
                    EventParticipant.event_id == event_id
                )
            )
        )
        participant = result.scalar_one_or_none()

        if not participant:
            raise ResourceNotFoundError("Participation record not found")

        if not participant.is_active_participant():
            raise ValueError("User is not actively participating in this event")

        # Update participant status
        participant.status = "dropped"
        participant.last_activity_at = datetime.utcnow()

        # Decrement participant counter
        event_result = await self.db.execute(
            select(CommunityEvent).where(CommunityEvent.id == event_id)
        )
        event = event_result.scalar_one_or_none()
        if event:
            event.current_participants = max(0, event.current_participants - 1)

        await self.db.commit()
        return True

    async def get_event_participants(
        self,
        event_id: str,
        status_filter: Optional[str] = None,
        limit: int = 100
    ) -> List[EventParticipant]:
        """Get participants for a community event"""

        query = select(EventParticipant).where(EventParticipant.event_id == event_id)

        if status_filter:
            query = query.where(EventParticipant.status == status_filter)

        query = query.order_by(desc(EventParticipant.contribution_score)).limit(limit)

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_user_event_participation(
        self,
        user_id: str,
        active_only: bool = True
    ) -> List[EventParticipant]:
        """Get user's participation in community events"""

        query = select(EventParticipant).where(EventParticipant.user_id == user_id)

        if active_only:
            query = query.where(EventParticipant.status.in_(["joined", "completed"]))

        query = query.order_by(desc(EventParticipant.joined_at))

        result = await self.db.execute(query)
        return result.scalars().all()

    async def update_participant_progress(
        self,
        user_id: str,
        event_id: str,
        contribution: int = 0,
        completion_percentage: Optional[float] = None,
        performance_data: Optional[Dict[str, Any]] = None
    ) -> EventParticipant:
        """Update participant's progress and contribution"""

        result = await self.db.execute(
            select(EventParticipant).where(
                and_(
                    EventParticipant.user_id == user_id,
                    EventParticipant.event_id == event_id
                )
            )
        )
        participant = result.scalar_one_or_none()

        if not participant:
            raise ResourceNotFoundError("Participation record not found")

        # Update activity
        participant.update_activity(contribution=contribution, performance=performance_data)

        # Update completion percentage
        if completion_percentage is not None:
            participant.completion_percentage = min(100.0, max(0.0, completion_percentage))

            # Auto-complete if reached 100%
            if participant.completion_percentage >= 100.0:
                participant.complete()

        await self.db.commit()
        return participant

    async def get_event_leaderboard(
        self,
        event_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get leaderboard for community event"""

        result = await self.db.execute(
            select(EventParticipant, User.display_name, User.faction_alignment)
            .join(User, EventParticipant.user_id == User.id)
            .where(EventParticipant.event_id == event_id)
            .order_by(desc(EventParticipant.contribution_score))
            .limit(limit)
        )

        leaderboard = []
        for i, (participant, display_name, faction) in enumerate(result.fetchall(), 1):
            # Update ranking position
            participant.ranking_position = i

            leaderboard.append({
                "rank": i,
                "user_id": participant.user_id,
                "display_name": display_name,
                "faction": faction,
                "contribution_score": participant.contribution_score,
                "completion_percentage": participant.completion_percentage,
                "status": participant.status,
                "joined_at": participant.joined_at.isoformat() if participant.joined_at else None
            })

        await self.db.commit()
        return leaderboard

    async def complete_event_participation(
        self,
        user_id: str,
        event_id: str,
        bonus_rewards: Optional[Dict[str, Any]] = None
    ) -> EventParticipant:
        """Mark event participation as completed and claim rewards"""

        result = await self.db.execute(
            select(EventParticipant).where(
                and_(
                    EventParticipant.user_id == user_id,
                    EventParticipant.event_id == event_id
                )
            )
        )
        participant = result.scalar_one_or_none()

        if not participant:
            raise ResourceNotFoundError("Participation record not found")

        # Complete participation
        participant.complete()

        # Claim rewards
        if not participant.rewards_claimed:
            participant.rewards_claimed = True
            participant.rewards_claimed_at = datetime.utcnow()
            if bonus_rewards:
                participant.bonus_rewards = bonus_rewards

            # TODO: Apply rewards to user (karma, items, etc.)

        await self.db.commit()
        return participant

    # Helper Methods
    async def _get_user_with_validation(self, user_id: str) -> User:
        """Get user with validation"""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise UserNotFoundError(f"User with ID '{user_id}' not found")

        if not user.is_active:
            raise InsufficientPermissionsError("User account is not active")

        return user

    async def _get_existing_friendship(
        self,
        user1_id: str,
        user2_id: str
    ) -> Optional[UserFriendship]:
        """Get existing friendship between two users"""

        result = await self.db.execute(
            select(UserFriendship).where(
                or_(
                    and_(
                        UserFriendship.requester_id == user1_id,
                        UserFriendship.recipient_id == user2_id
                    ),
                    and_(
                        UserFriendship.requester_id == user2_id,
                        UserFriendship.recipient_id == user1_id
                    )
                )
            )
        )
        return result.scalar_one_or_none()

    async def _get_friendship_by_id(self, friendship_id: str) -> Optional[UserFriendship]:
        """Get friendship by ID"""
        result = await self.db.execute(
            select(UserFriendship).where(UserFriendship.id == friendship_id)
        )
        return result.scalar_one_or_none()

    def _calculate_karma_compatibility(self, karma1: int, karma2: int) -> float:
        """Calculate karma compatibility between two users"""
        karma_diff = abs(karma1 - karma2)
        # Higher compatibility for similar karma scores
        compatibility = max(0.0, 1.0 - (karma_diff / 100.0))
        return round(compatibility, 2)

    async def _check_friendship_achievements(self, user_id: str):
        """Check and award friendship-related achievements"""
        # Count active friendships
        result = await self.db.execute(
            select(func.count(UserFriendship.id)).where(
                and_(
                    or_(
                        UserFriendship.requester_id == user_id,
                        UserFriendship.recipient_id == user_id
                    ),
                    UserFriendship.status == FriendshipStatus.ACCEPTED.value
                )
            )
        )
        friends_count = result.scalar() or 0

        # Check friendship achievements
        await self.check_user_achievements(user_id)

    async def _calculate_user_achievement_stats(self, user_id: str) -> Dict[str, Any]:
        """Calculate user statistics for achievement checking"""

        # Get reading count
        result = await self.db.execute(
            select(func.count(CompletedReading.id)).where(CompletedReading.user_id == user_id)
        )
        readings_count = result.scalar() or 0

        # Get friends count
        result = await self.db.execute(
            select(func.count(UserFriendship.id)).where(
                and_(
                    or_(
                        UserFriendship.requester_id == user_id,
                        UserFriendship.recipient_id == user_id
                    ),
                    UserFriendship.status == FriendshipStatus.ACCEPTED.value
                )
            )
        )
        friends_count = result.scalar() or 0

        # Get average accuracy (if ratings exist)
        result = await self.db.execute(
            select(func.avg(CompletedReading.accuracy_rating)).where(
                and_(
                    CompletedReading.user_id == user_id,
                    CompletedReading.accuracy_rating.is_not(None)
                )
            )
        )
        average_accuracy = result.scalar() or 0

        # TODO: Calculate consecutive days, suits explored, etc.
        consecutive_days = 0  # Placeholder
        suits_explored = 4  # Placeholder - assume all suits explored

        return {
            "readings_count": readings_count,
            "friends_count": friends_count,
            "average_accuracy": average_accuracy,
            "consecutive_days": consecutive_days,
            "suits_explored": suits_explored
        }

    async def _user_has_achievement(self, user_id: str, achievement_id: str) -> bool:
        """Check if user already has specific achievement"""
        result = await self.db.execute(
            select(UserAchievement).where(
                and_(
                    UserAchievement.user_id == user_id,
                    UserAchievement.achievement_id == achievement_id
                )
            )
        )
        return result.scalar_one_or_none() is not None

    async def _award_achievement(
        self,
        user_id: str,
        achievement_id: str,
        definition: Dict[str, Any]
    ) -> UserAchievement:
        """Award achievement to user"""

        achievement = UserAchievement(
            user_id=user_id,
            achievement_id=achievement_id,
            achievement_name=definition["name"],
            achievement_category=definition["category"].value,
            description=definition["description"],
            progress_required=1,
            progress_current=1,
            is_completed=True,
            completion_date=datetime.utcnow(),
            karma_reward=definition["karma_reward"],
            rarity=definition["rarity"],
            fallout_reference=f"Achievement unlocked in the wasteland: {definition['name']}"
        )

        self.db.add(achievement)

        # Apply karma reward
        if definition["karma_reward"] > 0:
            user = await self._get_user_with_validation(user_id)
            user.karma_score = min(100, user.karma_score + definition["karma_reward"])

        await self.db.commit()
        return achievement