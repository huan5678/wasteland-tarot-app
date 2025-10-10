"""
User Analytics Models
Tracks user behavior and engagement patterns for personalization
"""
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import Column, String, Integer, DateTime, JSON, Float, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base


class UserAnalytics(Base):
    """
    User analytics and behavior tracking

    Tracks various user interactions and engagement metrics
    for personalization and recommendations
    """
    __tablename__ = "user_analytics"

    id = Column(String, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Session tracking
    session_count = Column(Integer, default=0)
    total_time_spent = Column(Integer, default=0)  # seconds
    avg_session_duration = Column(Float, default=0.0)
    last_active_at = Column(DateTime, default=datetime.utcnow)

    # Reading behavior
    readings_count = Column(Integer, default=0)
    favorite_spread_type = Column(String, nullable=True)
    favorite_character_voice = Column(String, nullable=True)
    avg_question_length = Column(Integer, default=0)

    # Card preferences
    most_drawn_cards = Column(JSON, default=list)  # List of card IDs with frequency
    card_study_time = Column(Integer, default=0)  # seconds spent on card library
    favorited_cards = Column(JSON, default=list)  # List of card IDs

    # Engagement metrics
    shares_count = Column(Integer, default=0)
    notes_count = Column(Integer, default=0)
    exports_count = Column(Integer, default=0)

    # Personalization data
    preferred_themes = Column(JSON, default=list)  # Wasteland themes user prefers
    reading_times = Column(JSON, default=list)  # Hours when user typically reads
    device_preferences = Column(JSON, default=dict)  # mobile vs desktop usage

    # Created/updated timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="analytics")
    events = relationship("AnalyticsEvent", back_populates="analytics", cascade="all, delete-orphan")

    # Indexes for efficient queries
    __table_args__ = (
        Index('idx_user_analytics_user_id', 'user_id'),
        Index('idx_user_analytics_last_active', 'last_active_at'),
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "session_count": self.session_count,
            "total_time_spent": self.total_time_spent,
            "avg_session_duration": self.avg_session_duration,
            "last_active_at": self.last_active_at.isoformat() if self.last_active_at else None,
            "readings_count": self.readings_count,
            "favorite_spread_type": self.favorite_spread_type,
            "favorite_character_voice": self.favorite_character_voice,
            "avg_question_length": self.avg_question_length,
            "most_drawn_cards": self.most_drawn_cards,
            "card_study_time": self.card_study_time,
            "favorited_cards": self.favorited_cards,
            "shares_count": self.shares_count,
            "notes_count": self.notes_count,
            "exports_count": self.exports_count,
            "preferred_themes": self.preferred_themes,
            "reading_times": self.reading_times,
            "device_preferences": self.device_preferences,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class AnalyticsEvent(Base):
    """
    Individual analytics events

    Stores granular user actions for detailed analysis
    """
    __tablename__ = "analytics_events"

    id = Column(String, primary_key=True)
    analytics_id = Column(String, ForeignKey("user_analytics.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Event details
    event_type = Column(String, nullable=False)  # e.g., "reading_created", "card_viewed"
    event_category = Column(String, nullable=False)  # e.g., "reading", "card", "social"
    event_action = Column(String, nullable=False)  # e.g., "create", "view", "share"

    # Event metadata
    event_data = Column(JSON, default=dict)  # Additional event-specific data
    session_id = Column(String, nullable=True)

    # Context
    device_type = Column(String, nullable=True)  # mobile, desktop, tablet
    browser = Column(String, nullable=True)
    platform = Column(String, nullable=True)  # OS

    # Timing
    duration = Column(Integer, nullable=True)  # Event duration in seconds
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    analytics = relationship("UserAnalytics", back_populates="events")
    user = relationship("User")

    # Indexes for efficient queries
    __table_args__ = (
        Index('idx_analytics_events_user_id', 'user_id'),
        Index('idx_analytics_events_type', 'event_type'),
        Index('idx_analytics_events_timestamp', 'timestamp'),
        Index('idx_analytics_events_session', 'session_id'),
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "analytics_id": self.analytics_id,
            "user_id": self.user_id,
            "event_type": self.event_type,
            "event_category": self.event_category,
            "event_action": self.event_action,
            "event_data": self.event_data,
            "session_id": self.session_id,
            "device_type": self.device_type,
            "browser": self.browser,
            "platform": self.platform,
            "duration": self.duration,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }


class ReadingPattern(Base):
    """
    Reading pattern analysis

    Stores analyzed patterns from user's reading history
    """
    __tablename__ = "reading_patterns"

    id = Column(String, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Pattern identification
    pattern_type = Column(String, nullable=False)  # e.g., "frequent_question", "card_combination"
    pattern_name = Column(String, nullable=False)
    pattern_data = Column(JSON, default=dict)

    # Pattern metrics
    frequency = Column(Integer, default=1)
    confidence_score = Column(Float, default=0.0)  # 0.0 to 1.0

    # Timestamps
    first_observed = Column(DateTime, default=datetime.utcnow)
    last_observed = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User")

    # Indexes
    __table_args__ = (
        Index('idx_reading_patterns_user_id', 'user_id'),
        Index('idx_reading_patterns_type', 'pattern_type'),
        Index('idx_reading_patterns_confidence', 'confidence_score'),
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "pattern_type": self.pattern_type,
            "pattern_name": self.pattern_name,
            "pattern_data": self.pattern_data,
            "frequency": self.frequency,
            "confidence_score": self.confidence_score,
            "first_observed": self.first_observed.isoformat() if self.first_observed else None,
            "last_observed": self.last_observed.isoformat() if self.last_observed else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class UserRecommendation(Base):
    """
    User-specific recommendations

    Stores generated recommendations for spreads, cards, and interpretations
    """
    __tablename__ = "user_recommendations"

    id = Column(String, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Recommendation details
    recommendation_type = Column(String, nullable=False)  # spread, card, theme, voice
    recommendation_data = Column(JSON, default=dict)

    # Recommendation metadata
    reason = Column(String, nullable=True)  # Why this was recommended
    confidence_score = Column(Float, default=0.0)
    priority = Column(Integer, default=0)  # Higher = more important

    # User interaction
    shown_count = Column(Integer, default=0)
    accepted_count = Column(Integer, default=0)
    rejected_count = Column(Integer, default=0)

    # Status
    is_active = Column(String, default="active")  # active, dismissed, accepted
    expires_at = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User")

    # Indexes
    __table_args__ = (
        Index('idx_user_recommendations_user_id', 'user_id'),
        Index('idx_user_recommendations_type', 'recommendation_type'),
        Index('idx_user_recommendations_active', 'is_active'),
        Index('idx_user_recommendations_priority', 'priority'),
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "recommendation_type": self.recommendation_type,
            "recommendation_data": self.recommendation_data,
            "reason": self.reason,
            "confidence_score": self.confidence_score,
            "priority": self.priority,
            "shown_count": self.shown_count,
            "accepted_count": self.accepted_count,
            "rejected_count": self.rejected_count,
            "is_active": self.is_active,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
