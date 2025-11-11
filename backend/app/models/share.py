"""
Reading Share Model

Manages anonymous sharing of tarot readings with optional password protection.
"""

from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.models.base import Base


class ReadingShare(Base):
    """Model for shared tarot readings"""

    __tablename__ = "reading_shares"

    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, index=True)
    uuid = Column(String, unique=True, nullable=False, index=True)  # Public share UUID
    reading_id = Column(String, ForeignKey("completed_readings.id"), nullable=False, index=True)
    password_hash = Column(Text, nullable=True)  # bcrypt hash if password protected
    access_count = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship
    reading = relationship("CompletedReading", back_populates="shares")
