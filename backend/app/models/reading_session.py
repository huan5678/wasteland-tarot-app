"""
SQLAlchemy model for reading_sessions table.

This model represents an incomplete reading session that can be saved and resumed.
This is the primary model for in-progress reading sessions, allowing users to save
their progress and resume later.
"""

from sqlalchemy import Column, String, Text, JSON, Integer, DateTime, CheckConstraint, Index, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid as uuid_pkg

from app.models.base import Base


class ReadingSession(Base):
    """
    ReadingSession model for incomplete reading sessions (save/resume feature).

    Allows users to save incomplete readings and resume them later.
    Supports offline-first architecture with sync capabilities.

    This model uses the reading_sessions table which stores incomplete sessions.
    """

    __tablename__ = "reading_sessions"

    # Primary key - UUID type to match database
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid_pkg.uuid4)

    # User relationship - UUID type with FK constraint
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Spread configuration
    spread_type = Column(String(50), nullable=False)

    # Reading context
    question = Column(Text, nullable=True)

    # Card selection state - matching DB schema
    selected_cards = Column(JSONB, nullable=False, default=list, server_default='[]')
    current_position = Column(Integer, nullable=False, default=0, server_default='0')

    # Additional session metadata
    session_data = Column(JSONB, nullable=False, default=dict, server_default='{}')
    device_info = Column(JSONB, nullable=True)

    # Status tracking
    status = Column(
        String(20),
        nullable=False,
        default='active',
        server_default='active'
    )

    # Timestamps
    started_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, server_default='NOW()')
    last_accessed_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, server_default='NOW()')
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, server_default='NOW()')
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow, server_default='NOW()')

    # Relationships
    # Note: SessionEvent relationship will be added when SessionEvent model is created

    # Table constraints
    __table_args__ = (
        CheckConstraint("status IN ('active', 'paused', 'complete')", name='session_status_check'),
        Index('idx_reading_sessions_user_id', 'user_id'),
        Index('idx_reading_sessions_status', 'status'),
        Index('idx_reading_sessions_created_at', 'created_at'),
        Index('idx_reading_sessions_user_status', 'user_id', 'status'),
    )

    def __repr__(self) -> str:
        return f"<ReadingSession(id={self.id}, user_id={self.user_id}, status={self.status})>"

    def to_dict(self) -> dict:
        """Convert model to dictionary for serialization."""
        return {
            'id': str(self.id),  # Convert UUID to string
            'user_id': str(self.user_id),  # Convert UUID to string
            'spread_type': self.spread_type,
            'question': self.question,
            'selected_cards': self.selected_cards,
            'current_position': self.current_position,
            'session_data': self.session_data,
            'device_info': self.device_info,
            'status': self.status,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'last_accessed_at': self.last_accessed_at.isoformat() if self.last_accessed_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
