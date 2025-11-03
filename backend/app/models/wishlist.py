"""
Wishlist Model - User Wish Management System
Stores user wishes and admin replies for the Wasteland Tarot platform
"""

from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from typing import Optional, Dict, Any
from .base import BaseModel


class Wishlist(BaseModel):
    """
    User Wishlist - Store user wishes and admin replies

    Supports daily wish submissions with Markdown content,
    admin replies, edit tracking, and hide/archive functionality.
    """

    __tablename__ = "wishlist"

    # Foreign Key
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Content Fields
    content = Column(Text, nullable=False)  # User wish content (Markdown)
    admin_reply = Column(Text, nullable=True)  # Admin reply content (Markdown)

    # Timestamp Fields
    # created_at and updated_at inherited from BaseModel
    admin_reply_timestamp = Column(DateTime(timezone=True), nullable=True)

    # Status Fields
    has_been_edited = Column(Boolean, nullable=False, server_default='false')
    is_hidden = Column(Boolean, nullable=False, server_default='false')

    # Relationships
    user = relationship("User", back_populates="wishes")

    # Indexes (additional to those in migration)
    __table_args__ = (
        Index('idx_wishlist_user_id', 'user_id'),
        Index('idx_wishlist_created_at', 'created_at'),
        Index('idx_wishlist_is_hidden', 'is_hidden'),
        Index('idx_wishlist_user_created', 'user_id', 'created_at'),
    )

    def __repr__(self):
        """Debug representation"""
        return (
            f"<Wishlist(id='{self.id}', user_id='{self.user_id}', "
            f"has_reply={self.admin_reply is not None}, "
            f"edited={self.has_been_edited}, hidden={self.is_hidden})>"
        )

    def has_admin_reply(self) -> bool:
        """Check if admin has replied to this wish"""
        return self.admin_reply is not None

    def can_be_edited(self) -> bool:
        """Check if wish can be edited by user"""
        return not self.has_been_edited and self.admin_reply is None

    def to_dict(self) -> Dict[str, Any]:
        """Convert wishlist instance to dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "content": self.content,
            "admin_reply": self.admin_reply,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "admin_reply_timestamp": self.admin_reply_timestamp.isoformat() if self.admin_reply_timestamp else None,
            "has_been_edited": self.has_been_edited,
            "is_hidden": self.is_hidden,
        }
