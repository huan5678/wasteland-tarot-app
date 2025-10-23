"""
Journal API Schemas - Tarot Journal System
Provides data validation and serialization models for journal API

Schemas:
- JournalCreate: Create journal request
- JournalUpdate: Update journal request (partial update)
- JournalResponse: Journal response with all fields
- JournalListResponse: Paginated journal list response
"""

from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, ConfigDict
from datetime import datetime


# Mood tags whitelist - only these 8 tags are allowed
VALID_MOOD_TAGS = [
    "hopeful",      # 充滿希望的
    "anxious",      # 焦慮的
    "reflective",   # 反思的
    "excited",      # 興奮的
    "peaceful",     # 平靜的
    "confused",     # 困惑的
    "grateful",     # 感恩的
    "uncertain"     # 不確定的
]


class JournalCreate(BaseModel):
    """
    Create Journal Request Schema

    Used for creating a new journal entry for a completed reading.

    Business Rules:
    - Content: 1-10,000 characters (required)
    - Mood tags: 0-5 tags from whitelist (optional, defaults to [])
    - Privacy: defaults to True
    """

    content: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Journal content in markdown format (1-10,000 characters)",
        examples=["# Today's Reading\n\nDrew the Fool card. Feeling hopeful about new beginnings!"]
    )

    mood_tags: List[str] = Field(
        default_factory=list,
        max_length=5,
        description="Mood tags (max 5, from predefined whitelist)",
        examples=[["hopeful", "excited"], ["reflective", "peaceful"]]
    )

    is_private: bool = Field(
        default=True,
        description="Privacy setting (True = private, False = public)"
    )

    @field_validator('mood_tags')
    @classmethod
    def validate_mood_tags_whitelist(cls, v: List[str]) -> List[str]:
        """
        Validate that all mood tags are from the whitelist.

        Raises:
            ValueError: If any tag is not in VALID_MOOD_TAGS
        """
        if not v:
            return v

        invalid_tags = [tag for tag in v if tag not in VALID_MOOD_TAGS]
        if invalid_tags:
            valid_tags_str = ", ".join(VALID_MOOD_TAGS)
            raise ValueError(
                f"Invalid mood tags: {invalid_tags}. "
                f"Allowed tags: {valid_tags_str}"
            )

        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "content": "# Today's Three-Card Reading\n\nPast: The Tower - represents recent upheaval\nPresent: The Star - hope and guidance\nFuture: The Sun - joy and success ahead\n\nReflection: This reading reminds me that even after difficult times, there is always hope.",
                "mood_tags": ["hopeful", "reflective"],
                "is_private": True
            }
        }
    )


class JournalUpdate(BaseModel):
    """
    Update Journal Request Schema

    Supports partial updates - all fields are optional.
    Only provided fields will be updated.

    Business Rules:
    - Content: 1-10,000 characters (if provided)
    - Mood tags: 0-5 tags from whitelist (if provided)
    - Privacy: boolean (if provided)
    """

    content: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=10000,
        description="Updated journal content (optional)"
    )

    mood_tags: Optional[List[str]] = Field(
        default=None,
        max_length=5,
        description="Updated mood tags (optional)"
    )

    is_private: Optional[bool] = Field(
        default=None,
        description="Updated privacy setting (optional)"
    )

    @field_validator('mood_tags')
    @classmethod
    def validate_mood_tags_whitelist(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """
        Validate that all mood tags are from the whitelist.

        Raises:
            ValueError: If any tag is not in VALID_MOOD_TAGS
        """
        if v is None or not v:
            return v

        invalid_tags = [tag for tag in v if tag not in VALID_MOOD_TAGS]
        if invalid_tags:
            valid_tags_str = ", ".join(VALID_MOOD_TAGS)
            raise ValueError(
                f"Invalid mood tags: {invalid_tags}. "
                f"Allowed tags: {valid_tags_str}"
            )

        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "content": "Updated reflection after re-reading the cards.",
                "mood_tags": ["peaceful", "grateful"],
                "is_private": False
            }
        }
    )


class JournalResponse(BaseModel):
    """
    Journal Response Schema

    Returns complete journal data including metadata.

    Fields:
    - id: Journal UUID
    - reading_id: Associated reading UUID
    - user_id: Owner user UUID
    - content: Journal content (markdown)
    - mood_tags: List of mood tags
    - is_private: Privacy setting
    - created_at: Creation timestamp
    - updated_at: Last update timestamp
    """

    id: UUID = Field(
        ...,
        description="Journal UUID"
    )

    reading_id: UUID = Field(
        ...,
        description="Associated reading UUID"
    )

    user_id: UUID = Field(
        ...,
        description="Owner user UUID"
    )

    content: str = Field(
        ...,
        description="Journal content in markdown format"
    )

    mood_tags: List[str] = Field(
        ...,
        description="Mood tags"
    )

    is_private: bool = Field(
        ...,
        description="Privacy setting"
    )

    created_at: datetime = Field(
        ...,
        description="Creation timestamp (ISO 8601)"
    )

    updated_at: datetime = Field(
        ...,
        description="Last update timestamp (ISO 8601)"
    )

    model_config = ConfigDict(
        from_attributes=True,  # Allow ORM mode for SQLAlchemy models
        json_schema_extra={
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "reading_id": "123e4567-e89b-12d3-a456-426614174001",
                "user_id": "123e4567-e89b-12d3-a456-426614174002",
                "content": "# Today's Reading\n\nThe Fool appeared...",
                "mood_tags": ["hopeful", "excited"],
                "is_private": True,
                "created_at": "2025-10-23T10:30:00Z",
                "updated_at": "2025-10-23T10:30:00Z"
            }
        }
    )


class JournalListResponse(BaseModel):
    """
    Journal List Response Schema

    Returns paginated list of journals with total count.

    Fields:
    - items: List of journal responses
    - total: Total number of journals (for pagination)
    """

    items: List[JournalResponse] = Field(
        ...,
        description="List of journal entries"
    )

    total: int = Field(
        ...,
        description="Total number of journals (for pagination)",
        ge=0
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "items": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "reading_id": "123e4567-e89b-12d3-a456-426614174001",
                        "user_id": "123e4567-e89b-12d3-a456-426614174002",
                        "content": "# Reading 1\n\nFirst journal entry...",
                        "mood_tags": ["hopeful"],
                        "is_private": True,
                        "created_at": "2025-10-23T10:30:00Z",
                        "updated_at": "2025-10-23T10:30:00Z"
                    },
                    {
                        "id": "223e4567-e89b-12d3-a456-426614174000",
                        "reading_id": "223e4567-e89b-12d3-a456-426614174001",
                        "user_id": "123e4567-e89b-12d3-a456-426614174002",
                        "content": "# Reading 2\n\nSecond journal entry...",
                        "mood_tags": ["reflective", "peaceful"],
                        "is_private": False,
                        "created_at": "2025-10-22T15:20:00Z",
                        "updated_at": "2025-10-22T15:20:00Z"
                    }
                ],
                "total": 10
            }
        }
    )
