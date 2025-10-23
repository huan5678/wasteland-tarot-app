"""
Journal Schema Unit Tests - Tarot Journal System
Testing Pydantic schemas for journal API request/response validation
Follows TDD methodology: RED phase - tests written before implementation
"""

import pytest
from pydantic import ValidationError
from uuid import uuid4
from datetime import datetime
from typing import Dict, Any


# Valid mood tags whitelist (from requirements)
VALID_MOOD_TAGS = [
    "hopeful", "anxious", "reflective", "excited",
    "peaceful", "confused", "grateful", "uncertain"
]


@pytest.mark.unit
class TestJournalCreateSchema:
    """Test JournalCreate schema validation"""

    def test_import_journal_create_schema(self):
        """Test that JournalCreate schema can be imported"""
        from app.schemas.journal import JournalCreate
        assert JournalCreate is not None

    def test_valid_journal_create(self):
        """
        Test valid journal creation data passes validation.

        Valid data:
        - content: 1-10,000 characters
        - mood_tags: 0-5 tags from whitelist
        - is_private: boolean (optional, defaults to True)
        """
        from app.schemas.journal import JournalCreate

        valid_data = {
            "content": "# Today's Reading\n\nDrew the Fool card. Feeling hopeful about new beginnings!",
            "mood_tags": ["hopeful", "excited"],
            "is_private": True
        }

        journal = JournalCreate(**valid_data)

        assert journal.content == valid_data["content"]
        assert journal.mood_tags == valid_data["mood_tags"]
        assert journal.is_private is True

    def test_journal_create_minimal_data(self):
        """
        Test journal creation with minimal required data.

        Only content is required, mood_tags and is_private should have defaults.
        """
        from app.schemas.journal import JournalCreate

        minimal_data = {
            "content": "Minimal journal entry."
        }

        journal = JournalCreate(**minimal_data)

        assert journal.content == minimal_data["content"]
        assert journal.mood_tags == []  # Default empty list
        assert journal.is_private is True  # Default True

    def test_journal_create_content_empty_fails(self):
        """
        Test that empty content fails validation.

        Content must not be empty.
        """
        from app.schemas.journal import JournalCreate

        invalid_data = {
            "content": ""
        }

        with pytest.raises(ValidationError) as exc_info:
            JournalCreate(**invalid_data)

        errors = exc_info.value.errors()
        assert any("content" in str(error["loc"]) for error in errors)

    def test_journal_create_content_too_long_fails(self):
        """
        Test that content exceeding 10,000 characters fails validation.

        Business rule: Content max 10,000 characters.
        """
        from app.schemas.journal import JournalCreate

        invalid_data = {
            "content": "A" * 10001  # 10,001 characters
        }

        with pytest.raises(ValidationError) as exc_info:
            JournalCreate(**invalid_data)

        errors = exc_info.value.errors()
        assert any("content" in str(error["loc"]) for error in errors)
        assert any("10000" in str(error["msg"]) or "too long" in str(error["msg"]).lower() for error in errors)

    def test_journal_create_mood_tags_too_many_fails(self):
        """
        Test that more than 5 mood tags fail validation.

        Business rule: Max 5 mood tags per journal.
        """
        from app.schemas.journal import JournalCreate

        invalid_data = {
            "content": "Test content",
            "mood_tags": ["hopeful", "anxious", "reflective", "excited", "peaceful", "grateful"]  # 6 tags
        }

        with pytest.raises(ValidationError) as exc_info:
            JournalCreate(**invalid_data)

        errors = exc_info.value.errors()
        assert any("mood_tags" in str(error["loc"]) for error in errors)

    def test_journal_create_mood_tags_invalid_tag_fails(self):
        """
        Test that invalid mood tags (not in whitelist) fail validation.

        Only 8 predefined tags are allowed.
        """
        from app.schemas.journal import JournalCreate

        invalid_data = {
            "content": "Test content",
            "mood_tags": ["invalid_mood", "hopeful"]  # "invalid_mood" not in whitelist
        }

        with pytest.raises(ValidationError) as exc_info:
            JournalCreate(**invalid_data)

        errors = exc_info.value.errors()
        assert any("mood_tags" in str(error["loc"]) for error in errors)

    def test_journal_create_mood_tags_whitelist(self):
        """
        Test all 8 valid mood tags are accepted.

        Whitelist: hopeful, anxious, reflective, excited, peaceful, confused, grateful, uncertain
        """
        from app.schemas.journal import JournalCreate

        # Test with all 8 valid tags (but only 5 at a time due to max limit)
        valid_tags_batch1 = ["hopeful", "anxious", "reflective", "excited", "peaceful"]
        valid_tags_batch2 = ["confused", "grateful", "uncertain", "hopeful", "excited"]

        journal1 = JournalCreate(content="Test", mood_tags=valid_tags_batch1)
        assert journal1.mood_tags == valid_tags_batch1

        journal2 = JournalCreate(content="Test", mood_tags=valid_tags_batch2)
        assert journal2.mood_tags == valid_tags_batch2


@pytest.mark.unit
class TestJournalUpdateSchema:
    """Test JournalUpdate schema validation"""

    def test_import_journal_update_schema(self):
        """Test that JournalUpdate schema can be imported"""
        from app.schemas.journal import JournalUpdate
        assert JournalUpdate is not None

    def test_journal_update_all_fields(self):
        """
        Test updating all fields at once.

        JournalUpdate should support partial updates (all fields optional).
        """
        from app.schemas.journal import JournalUpdate

        update_data = {
            "content": "Updated content",
            "mood_tags": ["peaceful"],
            "is_private": False
        }

        journal_update = JournalUpdate(**update_data)

        assert journal_update.content == update_data["content"]
        assert journal_update.mood_tags == update_data["mood_tags"]
        assert journal_update.is_private is False

    def test_journal_update_partial_content_only(self):
        """
        Test updating only content field.

        Other fields should remain None/unset.
        """
        from app.schemas.journal import JournalUpdate

        update_data = {
            "content": "Only updating content"
        }

        journal_update = JournalUpdate(**update_data)

        assert journal_update.content == update_data["content"]
        assert journal_update.mood_tags is None
        assert journal_update.is_private is None

    def test_journal_update_partial_mood_tags_only(self):
        """
        Test updating only mood_tags field.
        """
        from app.schemas.journal import JournalUpdate

        update_data = {
            "mood_tags": ["grateful", "reflective"]
        }

        journal_update = JournalUpdate(**update_data)

        assert journal_update.content is None
        assert journal_update.mood_tags == update_data["mood_tags"]
        assert journal_update.is_private is None

    def test_journal_update_partial_privacy_only(self):
        """
        Test updating only is_private field.
        """
        from app.schemas.journal import JournalUpdate

        update_data = {
            "is_private": True
        }

        journal_update = JournalUpdate(**update_data)

        assert journal_update.content is None
        assert journal_update.mood_tags is None
        assert journal_update.is_private is True

    def test_journal_update_empty_data(self):
        """
        Test that completely empty update is allowed.

        This allows for checking if update is needed before processing.
        """
        from app.schemas.journal import JournalUpdate

        journal_update = JournalUpdate()

        assert journal_update.content is None
        assert journal_update.mood_tags is None
        assert journal_update.is_private is None

    def test_journal_update_content_too_long_fails(self):
        """
        Test that updating with content > 10,000 characters fails.
        """
        from app.schemas.journal import JournalUpdate

        invalid_data = {
            "content": "A" * 10001
        }

        with pytest.raises(ValidationError) as exc_info:
            JournalUpdate(**invalid_data)

        errors = exc_info.value.errors()
        assert any("content" in str(error["loc"]) for error in errors)

    def test_journal_update_mood_tags_too_many_fails(self):
        """
        Test that updating with > 5 mood tags fails.
        """
        from app.schemas.journal import JournalUpdate

        invalid_data = {
            "mood_tags": ["hopeful", "anxious", "reflective", "excited", "peaceful", "grateful"]
        }

        with pytest.raises(ValidationError) as exc_info:
            JournalUpdate(**invalid_data)

        errors = exc_info.value.errors()
        assert any("mood_tags" in str(error["loc"]) for error in errors)

    def test_journal_update_mood_tags_invalid_tag_fails(self):
        """
        Test that updating with invalid mood tag fails.
        """
        from app.schemas.journal import JournalUpdate

        invalid_data = {
            "mood_tags": ["invalid_tag"]
        }

        with pytest.raises(ValidationError) as exc_info:
            JournalUpdate(**invalid_data)

        errors = exc_info.value.errors()
        assert any("mood_tags" in str(error["loc"]) for error in errors)


@pytest.mark.unit
class TestJournalResponseSchema:
    """Test JournalResponse schema serialization"""

    def test_import_journal_response_schema(self):
        """Test that JournalResponse schema can be imported"""
        from app.schemas.journal import JournalResponse
        assert JournalResponse is not None

    def test_journal_response_serialization(self):
        """
        Test JournalResponse correctly serializes journal data.

        Should include:
        - id, reading_id, user_id (UUIDs)
        - content, mood_tags, is_private
        - created_at, updated_at (datetime)
        """
        from app.schemas.journal import JournalResponse

        response_data = {
            "id": uuid4(),
            "reading_id": uuid4(),
            "user_id": uuid4(),
            "content": "# Test Journal\n\nContent here.",
            "mood_tags": ["hopeful", "reflective"],
            "is_private": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        journal_response = JournalResponse(**response_data)

        assert journal_response.id == response_data["id"]
        assert journal_response.reading_id == response_data["reading_id"]
        assert journal_response.user_id == response_data["user_id"]
        assert journal_response.content == response_data["content"]
        assert journal_response.mood_tags == response_data["mood_tags"]
        assert journal_response.is_private is True
        assert journal_response.created_at == response_data["created_at"]
        assert journal_response.updated_at == response_data["updated_at"]

    def test_journal_response_to_dict(self):
        """
        Test JournalResponse can be converted to dict/JSON.

        Should use model_dump() in Pydantic v2.
        """
        from app.schemas.journal import JournalResponse

        response_data = {
            "id": uuid4(),
            "reading_id": uuid4(),
            "user_id": uuid4(),
            "content": "Test content",
            "mood_tags": ["peaceful"],
            "is_private": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        journal_response = JournalResponse(**response_data)
        json_data = journal_response.model_dump()

        assert "id" in json_data
        assert "content" in json_data
        assert "mood_tags" in json_data
        assert json_data["is_private"] is False


@pytest.mark.unit
class TestJournalListResponseSchema:
    """Test JournalListResponse schema for pagination"""

    def test_import_journal_list_response_schema(self):
        """Test that JournalListResponse schema can be imported"""
        from app.schemas.journal import JournalListResponse
        assert JournalListResponse is not None

    def test_journal_list_response_with_items(self):
        """
        Test JournalListResponse with multiple journal items.

        Should include:
        - items: List[JournalResponse]
        - total: int (total count for pagination)
        """
        from app.schemas.journal import JournalListResponse, JournalResponse

        journal_items = [
            JournalResponse(
                id=uuid4(),
                reading_id=uuid4(),
                user_id=uuid4(),
                content=f"Journal {i}",
                mood_tags=["hopeful"],
                is_private=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            for i in range(3)
        ]

        list_response = JournalListResponse(
            items=journal_items,
            total=10  # Total count in database
        )

        assert len(list_response.items) == 3
        assert list_response.total == 10

    def test_journal_list_response_empty(self):
        """
        Test JournalListResponse with empty list.

        Should handle empty results gracefully.
        """
        from app.schemas.journal import JournalListResponse

        list_response = JournalListResponse(
            items=[],
            total=0
        )

        assert list_response.items == []
        assert list_response.total == 0
