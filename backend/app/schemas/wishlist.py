"""
Wishlist API Schemas - User Wish Management System

Provides data validation and serialization models for wishlist API.

Schemas:
- WishCreate: Create wish request (user-facing)
- WishUpdate: Update wish request (user-facing)
- AdminReplyRequest: Admin reply request (admin-facing)
- WishResponse: Wish response with all fields
- AdminWishListResponse: Paginated wish list for admin panel

Design Notes:
- Frontend limits: 500 chars plain text (wish), 1000 chars (admin reply)
- Backend validates raw Markdown: 10000 chars (wish), 20000 chars (admin reply)
- ContentValidator performs plain text length validation (1-500 for wish, 1-1000 for admin)
- Pydantic validates raw Markdown string length to prevent excessively large payloads
"""

from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime


# ==================== Request Schemas ====================

class WishCreate(BaseModel):
    """
    Create Wish Request Schema

    Used for creating a new wish (daily limit: 1 per day).

    Business Rules:
    - Content: 1-10,000 characters raw Markdown (required)
    - Frontend limits to 500 chars plain text after Markdown removal
    - Backend ContentValidator performs plain text validation
    """

    content: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Wish content in Markdown format (1-10,000 characters raw Markdown)",
        examples=["# My Wish\n\nI hope the platform adds more tarot spreads!"]
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "content": "# Feature Request\n\nI would love to see a **Celtic Cross** spread option with detailed interpretations!"
            }
        }
    )


class WishUpdate(BaseModel):
    """
    Update Wish Request Schema

    Used for editing an existing wish.

    Business Rules:
    - Content: 1-10,000 characters raw Markdown (required)
    - Can only edit if: no admin reply AND has_been_edited = false
    - After editing, has_been_edited is set to true (permanent lock)
    """

    content: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Updated wish content in Markdown format (1-10,000 characters raw Markdown)",
        examples=["# Updated Wish\n\nI've refined my original request..."]
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "content": "# Revised Feature Request\n\nAfter thinking more, I'd prefer a **Three-Card** spread with voice interpretation."
            }
        }
    )


class AdminReplyRequest(BaseModel):
    """
    Admin Reply Request Schema

    Used by admin to reply to a user's wish.

    Business Rules:
    - Reply: 1-20,000 characters raw Markdown (required)
    - Frontend limits to 1000 chars plain text after Markdown removal
    - Backend ContentValidator performs plain text validation
    - Can add or edit reply multiple times (no restrictions)
    """

    reply: str = Field(
        ...,
        min_length=1,
        max_length=20000,
        description="Admin reply content in Markdown format (1-20,000 characters raw Markdown)",
        examples=["# Response\n\nThank you for your feedback! We're working on it."]
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "reply": "# Thank you!\n\nWe appreciate your suggestion. The **Celtic Cross** spread is already on our roadmap for Q2 2025."
            }
        }
    )


# ==================== Response Schemas ====================

class WishResponse(BaseModel):
    """
    Wish Response Schema

    Returns complete wish data including metadata.

    Fields:
    - id: Wish UUID
    - user_id: Owner user UUID
    - content: Wish content (raw Markdown)
    - admin_reply: Admin reply content (raw Markdown, nullable)
    - created_at: Creation timestamp (UTC)
    - updated_at: Last update timestamp (UTC)
    - admin_reply_timestamp: Admin reply timestamp (UTC, nullable)
    - has_been_edited: Whether user has edited the wish (permanent lock)
    - is_hidden: Whether admin has archived/hidden this wish
    """

    id: UUID = Field(
        ...,
        description="Wish UUID"
    )

    user_id: UUID = Field(
        ...,
        description="Owner user UUID"
    )

    content: str = Field(
        ...,
        description="Wish content in Markdown format"
    )

    admin_reply: Optional[str] = Field(
        None,
        description="Admin reply content in Markdown format (null if no reply)"
    )

    created_at: datetime = Field(
        ...,
        description="Creation timestamp (ISO 8601, UTC)"
    )

    updated_at: datetime = Field(
        ...,
        description="Last update timestamp (ISO 8601, UTC)"
    )

    admin_reply_timestamp: Optional[datetime] = Field(
        None,
        description="Admin reply timestamp (ISO 8601, UTC, null if no reply)"
    )

    has_been_edited: bool = Field(
        ...,
        description="Whether user has edited the wish (true = permanent edit lock)"
    )

    is_hidden: bool = Field(
        ...,
        description="Whether admin has archived/hidden this wish"
    )

    model_config = ConfigDict(
        from_attributes=True,  # Allow ORM mode for SQLAlchemy models
        json_schema_extra={
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "user_id": "223e4567-e89b-12d3-a456-426614174000",
                "content": "# My Wish\n\nI hope for more tarot spreads!",
                "admin_reply": "# Response\n\nThank you! We're working on it.",
                "created_at": "2025-11-01T10:30:00Z",
                "updated_at": "2025-11-01T10:30:00Z",
                "admin_reply_timestamp": "2025-11-02T14:20:00Z",
                "has_been_edited": False,
                "is_hidden": False
            }
        }
    )


class AdminWishListResponse(BaseModel):
    """
    Admin Wish List Response Schema

    Returns paginated list of wishes with total count (for admin panel).

    Fields:
    - wishes: List of wish responses
    - total: Total number of wishes (for pagination)
    - page: Current page number (1-indexed)
    - per_page: Number of wishes per page (default: 50)
    """

    wishes: List[WishResponse] = Field(
        ...,
        description="List of wish entries"
    )

    total: int = Field(
        ...,
        description="Total number of wishes (for pagination)",
        ge=0
    )

    page: int = Field(
        ...,
        description="Current page number (1-indexed)",
        ge=1
    )

    per_page: int = Field(
        ...,
        description="Number of wishes per page",
        ge=1,
        le=100
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "wishes": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "user_id": "223e4567-e89b-12d3-a456-426614174000",
                        "content": "# Wish 1\n\nI want more features!",
                        "admin_reply": None,
                        "created_at": "2025-11-01T10:30:00Z",
                        "updated_at": "2025-11-01T10:30:00Z",
                        "admin_reply_timestamp": None,
                        "has_been_edited": False,
                        "is_hidden": False
                    },
                    {
                        "id": "223e4567-e89b-12d3-a456-426614174001",
                        "user_id": "323e4567-e89b-12d3-a456-426614174000",
                        "content": "# Wish 2\n\nGreat app!",
                        "admin_reply": "# Thanks!\n\nWe appreciate your feedback.",
                        "created_at": "2025-11-02T15:20:00Z",
                        "updated_at": "2025-11-02T15:20:00Z",
                        "admin_reply_timestamp": "2025-11-03T09:00:00Z",
                        "has_been_edited": False,
                        "is_hidden": False
                    }
                ],
                "total": 42,
                "page": 1,
                "per_page": 50
            }
        }
    )
