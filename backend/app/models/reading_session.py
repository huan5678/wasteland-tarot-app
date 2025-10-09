"""
SQLAlchemy model for reading_sessions table.

This model represents an incomplete reading session that can be saved and resumed.

NOTE: This class is temporarily named SessionSave to avoid conflict with the legacy
ReadingSession model in reading_enhanced.py. The legacy model incorrectly uses the
'reading_sessions' table name. Once the legacy code is refactored, this should be
renamed back to ReadingSession to match the design specification.
"""

from sqlalchemy import Column, String, Text, JSON, DateTime, CheckConstraint, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.models.base import Base


class SessionSave(Base):
    """
    SessionSave model for incomplete reading sessions (save/resume feature).

    Allows users to save incomplete readings and resume them later.
    Supports offline-first architecture with sync capabilities.

    This model uses the reading_sessions table which stores incomplete sessions.
    It should eventually be renamed to ReadingSession once legacy models are refactored.
    """

    __tablename__ = "reading_sessions"

    # Primary key
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # User relationship
    user_id = Column(String(36), nullable=False, index=True)

    # Spread configuration
    spread_type = Column(String(50), nullable=False)
    spread_config = Column(JSON, nullable=True)

    # Reading context
    question = Column(Text, nullable=False)

    # Session state (cards drawn, positions, etc.)
    session_state = Column(JSON, nullable=False)

    # Status tracking
    status = Column(
        String(20),
        nullable=False,
        default='active',
        server_default='active'
    )

    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_accessed_at = Column(DateTime(timezone=True), nullable=True)

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
        return f"<SessionSave(id={self.id}, user_id={self.user_id}, status={self.status})>"

    def to_dict(self) -> dict:
        """Convert model to dictionary for serialization."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'spread_type': self.spread_type,
            'spread_config': self.spread_config,
            'question': self.question,
            'session_state': self.session_state,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_accessed_at': self.last_accessed_at.isoformat() if self.last_accessed_at else None,
        }
