"""
SQLAlchemy model for session_events table.

This model tracks events during reading sessions for analytics and debugging.
"""

from sqlalchemy import Column, String, JSON, DateTime, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.models.base import Base


class SessionEvent(Base):
    """
    SessionEvent model for tracking session actions and analytics.

    Captures user interactions during reading sessions for analytics,
    debugging, and user experience optimization.
    """

    __tablename__ = "session_events"

    # Primary key
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign keys
    session_id = Column(String(36), nullable=False, index=True)
    user_id = Column(String(36), nullable=False, index=True)

    # Event information
    event_type = Column(String(50), nullable=False)
    event_data = Column(JSON, nullable=True)
    device_info = Column(JSON, nullable=True)

    # Timestamp
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    # Table args with composite indexes for analytics queries
    __table_args__ = (
        Index('idx_events_session', 'session_id', 'created_at'),
        Index('idx_events_user_type', 'user_id', 'event_type', 'created_at'),
        Index('idx_events_type_created', 'event_type', 'created_at'),
    )

    def __repr__(self) -> str:
        return f"<SessionEvent(id={self.id}, session_id={self.session_id}, event_type={self.event_type})>"

    def to_dict(self) -> dict:
        """Convert model to dictionary for serialization."""
        return {
            'id': self.id,
            'session_id': self.session_id,
            'user_id': self.user_id,
            'event_type': self.event_type,
            'event_data': self.event_data,
            'device_info': self.device_info,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
