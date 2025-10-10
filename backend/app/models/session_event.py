"""
SQLAlchemy model for session_events table.

This model tracks events during reading sessions for analytics and debugging.
"""

from sqlalchemy import Column, String, Integer, Text, DateTime, Index, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid as uuid_pkg

from app.models.base import Base


class SessionEvent(Base):
    """
    SessionEvent model for tracking session actions and analytics.

    Captures user interactions during reading sessions for analytics,
    debugging, and user experience optimization.

    This is an immutable audit log - events cannot be modified or deleted by users.
    """

    __tablename__ = "session_events"

    # Primary key - UUID type to match database
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_pkg.uuid4)

    # Foreign keys - UUID types with FK constraints
    session_id = Column(UUID(as_uuid=True), ForeignKey("reading_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Event information
    event_type = Column(String(50), nullable=False)
    event_data = Column(JSONB, nullable=False, default=dict, server_default='{}')

    # Card context
    card_position = Column(Integer, nullable=True)

    # Event timestamp
    timestamp = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, server_default='NOW()')

    # Device/browser info
    user_agent = Column(Text, nullable=True)
    ip_address = Column(INET, nullable=True)

    # Created timestamp
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, server_default='NOW()')

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
            'id': str(self.id),  # Convert UUID to string
            'session_id': str(self.session_id),  # Convert UUID to string
            'user_id': str(self.user_id),  # Convert UUID to string
            'event_type': self.event_type,
            'event_data': self.event_data,
            'card_position': self.card_position,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'user_agent': self.user_agent,
            'ip_address': str(self.ip_address) if self.ip_address else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
