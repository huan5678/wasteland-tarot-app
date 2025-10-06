"""
Social Features Models - Achievement system, friendships, and community features
"""

from sqlalchemy import Column, String, Integer, Float, Text, JSON, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from typing import List, Dict, Any, Optional
from enum import Enum as PyEnum
from datetime import datetime, timedelta
from .base import BaseModel


class AchievementCategory(str, PyEnum):
    """Categories for different types of achievements"""
    READING_MILESTONES = "reading_milestones"
    CONSISTENCY = "consistency"
    SOCIAL = "social"
    EXPLORATION = "exploration"
    ACCURACY = "accuracy"
    COLLECTION = "collection"
    COMMUNITY = "community"
    SPECIAL_EVENTS = "special_events"


class FriendshipStatus(str, PyEnum):
    """Status of friendship between users"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    BLOCKED = "blocked"
    REJECTED = "rejected"


class KarmaChangeReason(str, PyEnum):
    """Reasons for karma changes"""
    READING_ACCURACY = "reading_accuracy"
    HELPING_USERS = "helping_users"
    COMMUNITY_CONTRIBUTION = "community_contribution"
    NEGATIVE_BEHAVIOR = "negative_behavior"
    SHARING_WISDOM = "sharing_wisdom"
    FACTION_ACTIVITIES = "faction_activities"
    SPECIAL_EVENTS = "special_events"
    ADMIN_ADJUSTMENT = "admin_adjustment"
    SYSTEM_INITIALIZATION = "system_initialization"  # Task 29: 使用者註冊時的 Karma 初始化


class UserAchievement(BaseModel):
    """
    Gamification system with progress tracking for user achievements
    """

    __tablename__ = "user_achievements"

    # User and Achievement Info
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(String, nullable=False)
    achievement_name = Column(String(150), nullable=False)
    achievement_category = Column(String(50), nullable=False)

    # Achievement Details
    description = Column(Text, nullable=False)
    icon_url = Column(String(300))
    badge_image_url = Column(String(300))
    rarity = Column(String(20), default="common")  # common, uncommon, rare, legendary

    # Progress Tracking
    progress_current = Column(Integer, default=0)
    progress_required = Column(Integer, nullable=False)
    is_completed = Column(Boolean, default=False)
    completion_date = Column(DateTime(timezone=True))

    # Rewards and Recognition
    karma_reward = Column(Integer, default=0)
    experience_points = Column(Integer, default=0)
    special_privileges = Column(JSON, default=list)  # List of special privileges unlocked
    unlock_message = Column(Text)

    # Wasteland-specific Elements
    faction_exclusive = Column(String(50))  # Only available to specific faction members
    vault_origin = Column(Integer)  # Achievement tied to specific vault
    fallout_reference = Column(Text)  # Related Fallout lore or reference
    wasteland_significance = Column(Text)  # What this achievement means in the wasteland

    # Social Features
    is_public = Column(Boolean, default=True)  # Can others see this achievement
    show_on_profile = Column(Boolean, default=True)
    share_with_friends = Column(Boolean, default=True)
    announcement_sent = Column(Boolean, default=False)

    # Metadata
    difficulty_rating = Column(Float, default=1.0)  # 1.0 to 5.0
    estimated_time_hours = Column(Integer)  # Estimated time to complete
    tags = Column(JSON, default=list)
    prerequisites = Column(JSON, default=list)  # Other achievements required first

    # Relationships
    user = relationship("User")

    def calculate_progress_percentage(self) -> float:
        """Calculate completion percentage"""
        if self.progress_required <= 0:
            return 100.0
        return min(100.0, (self.progress_current / self.progress_required) * 100)

    def is_close_to_completion(self, threshold: float = 80.0) -> bool:
        """Check if achievement is close to completion"""
        return self.calculate_progress_percentage() >= threshold

    def get_estimated_completion_date(self) -> Optional[datetime]:
        """Estimate when achievement might be completed based on current progress"""
        if self.is_completed or self.progress_current <= 0:
            return None

        # Simple estimation based on current progress rate
        # This would be more sophisticated in a real implementation
        days_since_created = (datetime.utcnow() - self.created_at).days if self.created_at else 1
        progress_rate = self.progress_current / max(1, days_since_created)

        if progress_rate <= 0:
            return None

        remaining_progress = self.progress_required - self.progress_current
        estimated_days = remaining_progress / progress_rate

        return datetime.utcnow() + timedelta(days=estimated_days)

    def to_dict(self) -> Dict[str, Any]:
        """Convert achievement to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "achievement_id": self.achievement_id,
            "achievement_name": self.achievement_name,
            "achievement_category": self.achievement_category,
            "description": self.description,
            "icon_url": self.icon_url,
            "badge_image_url": self.badge_image_url,
            "rarity": self.rarity,
            "progress_current": self.progress_current,
            "progress_required": self.progress_required,
            "progress_percentage": self.calculate_progress_percentage(),
            "is_completed": self.is_completed,
            "completion_date": self.completion_date.isoformat() if self.completion_date else None,
            "karma_reward": self.karma_reward,
            "experience_points": self.experience_points,
            "special_privileges": self.special_privileges,
            "faction_exclusive": self.faction_exclusive,
            "vault_origin": self.vault_origin,
            "fallout_reference": self.fallout_reference,
            "wasteland_significance": self.wasteland_significance,
            "difficulty_rating": self.difficulty_rating,
            "estimated_time_hours": self.estimated_time_hours,
            "estimated_completion": self.get_estimated_completion_date().isoformat() if self.get_estimated_completion_date() else None,
            "tags": self.tags,
            "prerequisites": self.prerequisites,
            "is_close_to_completion": self.is_close_to_completion(),
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class UserFriendship(BaseModel):
    """
    Social system with privacy controls for user relationships
    """

    __tablename__ = "user_friendships"

    # Friendship Participants
    requester_id = Column(String, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Friendship Status
    status = Column(String(20), default=FriendshipStatus.PENDING.value)
    request_date = Column(DateTime(timezone=True), default=func.now())
    response_date = Column(DateTime(timezone=True))
    blocked_date = Column(DateTime(timezone=True))

    # Privacy and Sharing Settings
    share_reading_history = Column(Boolean, default=False)
    share_achievements = Column(Boolean, default=True)
    share_activity_feed = Column(Boolean, default=True)
    share_faction_info = Column(Boolean, default=True)
    share_location = Column(Boolean, default=False)

    # Interaction Features
    can_comment_on_readings = Column(Boolean, default=True)
    can_suggest_cards = Column(Boolean, default=True)
    can_view_private_readings = Column(Boolean, default=False)
    can_send_direct_messages = Column(Boolean, default=True)

    # Activity Tracking
    last_interaction = Column(DateTime(timezone=True))
    interaction_count = Column(Integer, default=0)
    mutual_readings_count = Column(Integer, default=0)  # Readings done together
    gifts_exchanged = Column(Integer, default=0)

    # Notes and Customization
    friendship_notes = Column(Text)  # Private notes about this friendship
    custom_nickname = Column(String(100))  # Custom nickname for this friend
    friendship_anniversary = Column(DateTime(timezone=True))

    # Wasteland Context
    how_they_met = Column(String(100))  # "met_in_vault", "wasteland_encounter", etc.
    shared_faction = Column(String(50))  # If they belong to same faction
    karma_compatibility = Column(Float)  # How compatible their karma is
    favorite_activities = Column(JSON, default=list)  # What they like to do together

    # Relationships
    requester = relationship("User", foreign_keys=[requester_id])
    recipient = relationship("User", foreign_keys=[recipient_id])

    # Unique constraint to prevent duplicate friendships
    __table_args__ = (UniqueConstraint('requester_id', 'recipient_id', name='unique_friendship'),)

    def is_active_friendship(self) -> bool:
        """Check if friendship is active"""
        return self.status == FriendshipStatus.ACCEPTED.value

    def is_blocked(self) -> bool:
        """Check if one user has blocked the other"""
        return self.status == FriendshipStatus.BLOCKED.value

    def get_friendship_duration(self) -> int:
        """Get friendship duration in days"""
        if not self.response_date:
            return 0
        return (datetime.utcnow() - self.response_date).days

    def calculate_interaction_frequency(self) -> float:
        """Calculate how frequently these users interact"""
        duration_days = self.get_friendship_duration()
        if duration_days <= 0:
            return 0.0
        return self.interaction_count / duration_days

    def get_compatibility_score(self) -> float:
        """Calculate overall compatibility score"""
        base_score = 0.5

        # Karma compatibility contributes to score
        if self.karma_compatibility:
            base_score += self.karma_compatibility * 0.3

        # Shared faction increases compatibility
        if self.shared_faction:
            base_score += 0.2

        # Interaction frequency
        freq = self.calculate_interaction_frequency()
        base_score += min(0.3, freq * 0.1)

        return min(1.0, base_score)

    def to_dict(self) -> Dict[str, Any]:
        """Convert friendship to dictionary"""
        return {
            "id": self.id,
            "requester_id": self.requester_id,
            "recipient_id": self.recipient_id,
            "status": self.status,
            "request_date": self.request_date.isoformat() if self.request_date else None,
            "response_date": self.response_date.isoformat() if self.response_date else None,
            "friendship_duration_days": self.get_friendship_duration(),
            "share_reading_history": self.share_reading_history,
            "share_achievements": self.share_achievements,
            "share_activity_feed": self.share_activity_feed,
            "share_faction_info": self.share_faction_info,
            "share_location": self.share_location,
            "can_comment_on_readings": self.can_comment_on_readings,
            "can_suggest_cards": self.can_suggest_cards,
            "can_view_private_readings": self.can_view_private_readings,
            "can_send_direct_messages": self.can_send_direct_messages,
            "last_interaction": self.last_interaction.isoformat() if self.last_interaction else None,
            "interaction_count": self.interaction_count,
            "mutual_readings_count": self.mutual_readings_count,
            "gifts_exchanged": self.gifts_exchanged,
            "custom_nickname": self.custom_nickname,
            "friendship_anniversary": self.friendship_anniversary.isoformat() if self.friendship_anniversary else None,
            "how_they_met": self.how_they_met,
            "shared_faction": self.shared_faction,
            "karma_compatibility": self.karma_compatibility,
            "favorite_activities": self.favorite_activities,
            "interaction_frequency": self.calculate_interaction_frequency(),
            "compatibility_score": self.get_compatibility_score(),
            "is_active": self.is_active_friendship(),
            "is_blocked": self.is_blocked(),
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class KarmaHistory(BaseModel):
    """
    Complete audit trail of karma changes with detailed reasoning
    """

    __tablename__ = "karma_history"

    # User and Change Info
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    karma_before = Column(Integer, nullable=False)
    karma_after = Column(Integer, nullable=False)
    karma_change = Column(Integer, nullable=False)  # Can be positive or negative

    # Change Context
    reason = Column(String(50), nullable=False)
    reason_description = Column(Text)
    triggered_by_action = Column(String(100))  # What action triggered this change
    related_reading_id = Column(String, ForeignKey("completed_readings.id"))
    related_user_id = Column(String, ForeignKey("users.id"))  # If change involves another user

    # Detailed Context
    action_context = Column(JSON)  # Additional context about the action
    faction_influence = Column(String(50))  # Which faction influenced this karma change
    location_context = Column(String(100))  # Where in the wasteland this happened
    multiplier_applied = Column(Float, default=1.0)  # Any multipliers applied

    # Verification and Validation
    is_verified = Column(Boolean, default=True)  # If change has been verified
    is_reversible = Column(Boolean, default=False)  # If this change can be undone
    admin_review_required = Column(Boolean, default=False)
    reviewed_by_admin = Column(String)  # Admin user ID who reviewed
    review_notes = Column(Text)

    # Impact Analysis
    alignment_before = Column(String(20))  # good, neutral, evil
    alignment_after = Column(String(20))
    alignment_changed = Column(Boolean, default=False)
    significant_threshold_crossed = Column(Boolean, default=False)  # Crossed major threshold

    # System Information
    automated_change = Column(Boolean, default=True)  # If change was automated
    rule_version = Column(String(20))  # Version of karma rules applied
    confidence_score = Column(Float)  # AI confidence in this karma assessment

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    related_reading = relationship("ReadingSession")
    related_user = relationship("User", foreign_keys=[related_user_id])

    def calculate_karma_delta(self) -> int:
        """Calculate the change in karma"""
        return self.karma_after - self.karma_before

    def is_positive_change(self) -> bool:
        """Check if this was a positive karma change"""
        return self.karma_change > 0

    def is_significant_change(self) -> bool:
        """Check if this was a significant karma change (>= 10 points)"""
        return abs(self.karma_change) >= 10

    def get_change_impact(self) -> str:
        """Get textual description of change impact"""
        abs_change = abs(self.karma_change)
        if abs_change >= 25:
            return "major"
        elif abs_change >= 10:
            return "significant"
        elif abs_change >= 5:
            return "moderate"
        else:
            return "minor"

    def get_karma_alignment(self, karma_score: int) -> str:
        """Convert karma score to alignment"""
        if karma_score >= 70:
            return "good"
        elif karma_score <= 30:
            return "evil"
        else:
            return "neutral"

    def to_dict(self) -> Dict[str, Any]:
        """Convert karma history to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "karma_before": self.karma_before,
            "karma_after": self.karma_after,
            "karma_change": self.karma_change,
            "karma_delta": self.calculate_karma_delta(),
            "reason": self.reason,
            "reason_description": self.reason_description,
            "triggered_by_action": self.triggered_by_action,
            "related_reading_id": self.related_reading_id,
            "related_user_id": self.related_user_id,
            "action_context": self.action_context,
            "faction_influence": self.faction_influence,
            "location_context": self.location_context,
            "multiplier_applied": self.multiplier_applied,
            "is_verified": self.is_verified,
            "is_reversible": self.is_reversible,
            "admin_review_required": self.admin_review_required,
            "reviewed_by_admin": self.reviewed_by_admin,
            "review_notes": self.review_notes,
            "alignment_before": self.alignment_before,
            "alignment_after": self.alignment_after,
            "alignment_changed": self.alignment_changed,
            "significant_threshold_crossed": self.significant_threshold_crossed,
            "automated_change": self.automated_change,
            "rule_version": self.rule_version,
            "confidence_score": self.confidence_score,
            "is_positive": self.is_positive_change(),
            "is_significant": self.is_significant_change(),
            "change_impact": self.get_change_impact(),
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class CommunityEvent(BaseModel):
    """
    Community events and activities in the wasteland
    """

    __tablename__ = "community_events"

    # Event Information
    event_name = Column(String(150), nullable=False)
    event_type = Column(String(50), nullable=False)  # "challenge", "celebration", "crisis", etc.
    description = Column(Text, nullable=False)
    short_description = Column(Text)

    # Event Timing
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    registration_deadline = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)

    # Participation
    max_participants = Column(Integer)
    current_participants = Column(Integer, default=0)
    participation_requirements = Column(JSON)  # Requirements to join
    participation_rewards = Column(JSON)  # Rewards for participation

    # Event Configuration
    faction_specific = Column(String(50))  # If event is for specific faction
    karma_requirements = Column(JSON)  # Karma requirements
    difficulty_level = Column(String(20), default="all_levels")
    special_rules = Column(JSON)  # Special rules for this event

    # Rewards and Recognition
    completion_rewards = Column(JSON)
    leaderboard_enabled = Column(Boolean, default=False)
    achievement_unlocked = Column(String)  # Achievement ID unlocked by this event
    special_badge = Column(String(200))  # Special badge for participants

    # Event Status
    status = Column(String(30), default="upcoming")  # upcoming, active, completed, cancelled
    completion_rate = Column(Float, default=0.0)  # Percentage of participants who completed
    success_metrics = Column(JSON)  # Metrics to measure event success

    def is_currently_active(self) -> bool:
        """Check if event is currently active"""
        now = datetime.utcnow()
        return self.start_date <= now <= self.end_date and self.is_active

    def can_user_participate(self, user_karma: int, user_faction: str) -> bool:
        """Check if user can participate in event"""
        # Check faction requirements
        if self.faction_specific and self.faction_specific != user_faction:
            return False

        # Check karma requirements
        if self.karma_requirements:
            min_karma = self.karma_requirements.get('min_karma', 0)
            max_karma = self.karma_requirements.get('max_karma', 100)
            if not (min_karma <= user_karma <= max_karma):
                return False

        # Check participant limits
        if self.max_participants and self.current_participants >= self.max_participants:
            return False

        return True

    def get_days_remaining(self) -> int:
        """Get number of days remaining for event"""
        if not self.is_currently_active():
            return 0
        delta = self.end_date - datetime.utcnow()
        return max(0, delta.days)

    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary"""
        return {
            "id": self.id,
            "event_name": self.event_name,
            "event_type": self.event_type,
            "description": self.description,
            "short_description": self.short_description,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "registration_deadline": self.registration_deadline.isoformat() if self.registration_deadline else None,
            "is_active": self.is_active,
            "max_participants": self.max_participants,
            "current_participants": self.current_participants,
            "participation_requirements": self.participation_requirements,
            "participation_rewards": self.participation_rewards,
            "faction_specific": self.faction_specific,
            "karma_requirements": self.karma_requirements,
            "difficulty_level": self.difficulty_level,
            "special_rules": self.special_rules,
            "completion_rewards": self.completion_rewards,
            "leaderboard_enabled": self.leaderboard_enabled,
            "achievement_unlocked": self.achievement_unlocked,
            "special_badge": self.special_badge,
            "status": self.status,
            "completion_rate": self.completion_rate,
            "success_metrics": self.success_metrics,
            "is_currently_active": self.is_currently_active(),
            "days_remaining": self.get_days_remaining(),
            "created_at": self.created_at.isoformat() if self.created_at else None
        }