"""
ReadingJournal Model - Tarot Journal System
User journaling for completed tarot readings
"""

from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from datetime import datetime
from .base import BaseModel


class ReadingJournal(BaseModel):
    """
    Personal journal entries for tarot readings.

    Users can write reflective journals after completing readings,
    including markdown content, mood tags, and privacy settings.

    Constraints:
    - One journal per reading per user (UNIQUE on reading_id, user_id)
    - Content limited to 10,000 characters
    - Maximum 5 mood tags per journal
    - CASCADE deletion when reading or user is deleted
    """

    __tablename__ = "reading_journals"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid())

    # Foreign Keys
    reading_id = Column(UUID(as_uuid=True), ForeignKey("completed_readings.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Journal Content
    content = Column(Text, nullable=False)  # Markdown text, max 10,000 characters
    mood_tags = Column(ARRAY(Text), nullable=False, server_default='{}')  # Max 5 tags
    is_private = Column(Boolean, nullable=False, server_default='true', default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    reading = relationship("CompletedReading", back_populates="journals")
    user = relationship("User", back_populates="journals")

    # Constraints
    __table_args__ = (
        UniqueConstraint('reading_id', 'user_id', name='uq_reading_user_journal'),
        CheckConstraint('LENGTH(content) <= 10000', name='check_content_length'),
        CheckConstraint('ARRAY_LENGTH(mood_tags, 1) <= 5', name='check_mood_tags_count'),
    )

    def __repr__(self):
        return f"<ReadingJournal(id={self.id}, reading_id={self.reading_id}, user_id={self.user_id}, created_at={self.created_at})>"

    def to_dict(self):
        """Convert journal to dictionary representation"""
        return {
            "id": str(self.id),
            "reading_id": str(self.reading_id),
            "user_id": str(self.user_id),
            "content": self.content,
            "mood_tags": self.mood_tags or [],
            "is_private": self.is_private,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
