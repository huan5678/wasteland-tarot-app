"""
Unit Tests for Reading Tags and Categories Models

Tests the database schema and business logic for:
- ReadingTag (many-to-many relationship)
- ReadingCategory (category definitions)
- Tag limit enforcement (maximum 20 tags per reading)

Note: These tests verify model structure and relationships.
Database-level constraints (triggers, check constraints) are verified
in integration tests with PostgreSQL.
"""

import pytest
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from uuid import uuid4

# Import models
try:
    from app.models.reading_enhanced import ReadingTag, ReadingCategory
    from app.models.user import User
    from app.models.reading_enhanced import CompletedReading
    MODELS_IMPORTED = True
except ImportError as e:
    MODELS_IMPORTED = False
    IMPORT_ERROR = str(e)


class TestReadingTagModel:
    """Test suite for ReadingTag model"""

    def test_create_reading_tag(self, db_session):
        """Test creating a reading tag"""
        # Create test user and reading
        user = User(
            username="test_user",
            email="test@example.com"
        )
        db_session.add(user)
        db_session.commit()

        reading = CompletedReading(
            user_id=user.id,
            question="Test question",
            character_voice_used="pip_boy",
            karma_context="neutral"
        )
        db_session.add(reading)
        db_session.commit()

        # Create tag
        tag = ReadingTag(
            reading_id=reading.id,
            tag="愛情"
        )
        db_session.add(tag)
        db_session.commit()

        # Verify
        assert tag.id is not None
        assert tag.reading_id == reading.id
        assert tag.tag == "愛情"
        assert tag.created_at is not None

    def test_tag_length_constraint(self, db_session):
        """Test tag length must be between 1-50 characters"""
        user = User(username="test_user", email="test@example.com")
        db_session.add(user)
        db_session.commit()

        reading = CompletedReading(
            user_id=user.id,
            question="Test",
            character_voice_used="pip_boy",
            karma_context="neutral"
        )
        db_session.add(reading)
        db_session.commit()

        # Test too long tag (> 50 characters)
        long_tag = "a" * 51
        invalid_tag = ReadingTag(
            reading_id=reading.id,
            tag=long_tag
        )
        db_session.add(invalid_tag)

        with pytest.raises(IntegrityError):
            db_session.commit()
        db_session.rollback()

    def test_unique_tag_per_reading(self, db_session):
        """Test that duplicate tags cannot be added to the same reading"""
        user = User(username="test_user", email="test@example.com")
        db_session.add(user)
        db_session.commit()

        reading = CompletedReading(
            user_id=user.id,
            question="Test",
            character_voice_used="pip_boy",
            karma_context="neutral"
        )
        db_session.add(reading)
        db_session.commit()

        # Add first tag
        tag1 = ReadingTag(
            reading_id=reading.id,
            tag="愛情"
        )
        db_session.add(tag1)
        db_session.commit()

        # Try to add duplicate tag
        tag2 = ReadingTag(
            reading_id=reading.id,
            tag="愛情"
        )
        db_session.add(tag2)

        with pytest.raises(IntegrityError):
            db_session.commit()
        db_session.rollback()

    def test_cascade_delete_on_reading_deletion(self, db_session):
        """Test that tags are deleted when reading is deleted"""
        user = User(username="test_user", email="test@example.com")
        db_session.add(user)
        db_session.commit()

        reading = CompletedReading(
            user_id=user.id,
            question="Test",
            character_voice_used="pip_boy",
            karma_context="neutral"
        )
        db_session.add(reading)
        db_session.commit()

        tag = ReadingTag(
            reading_id=reading.id,
            tag="愛情"
        )
        db_session.add(tag)
        db_session.commit()

        tag_id = tag.id

        # Delete reading
        db_session.delete(reading)
        db_session.commit()

        # Verify tag is also deleted
        deleted_tag = db_session.query(ReadingTag).filter_by(id=tag_id).first()
        assert deleted_tag is None

    def test_tag_limit_trigger(self, db_session):
        """Test that trigger enforces 20 tag limit per reading"""
        user = User(username="test_user", email="test@example.com")
        db_session.add(user)
        db_session.commit()

        reading = CompletedReading(
            user_id=user.id,
            question="Test",
            character_voice_used="pip_boy",
            karma_context="neutral"
        )
        db_session.add(reading)
        db_session.commit()

        # Add 20 tags (should succeed)
        for i in range(20):
            tag = ReadingTag(
                reading_id=reading.id,
                tag=f"tag{i}"
            )
            db_session.add(tag)
        db_session.commit()

        # Try to add 21st tag (should fail)
        extra_tag = ReadingTag(
            reading_id=reading.id,
            tag="tag20"
        )
        db_session.add(extra_tag)

        with pytest.raises(Exception) as exc_info:
            db_session.commit()
        assert "Maximum 20 tags per reading" in str(exc_info.value)
        db_session.rollback()


class TestReadingCategoryModel:
    """Test suite for ReadingCategory model"""

    def test_create_reading_category(self, db_session):
        """Test creating a reading category"""
        user = User(username="test_user", email="test@example.com")
        db_session.add(user)
        db_session.commit()

        category = ReadingCategory(
            user_id=user.id,
            name="愛情",
            color="#ff0000",
            description="愛情相關的解讀",
            icon="heart"
        )
        db_session.add(category)
        db_session.commit()

        # Verify
        assert category.id is not None
        assert category.user_id == user.id
        assert category.name == "愛情"
        assert category.color == "#ff0000"
        assert category.description == "愛情相關的解讀"
        assert category.icon == "heart"
        assert category.created_at is not None

    def test_unique_category_name_per_user(self, db_session):
        """Test that category names must be unique per user"""
        user = User(username="test_user", email="test@example.com")
        db_session.add(user)
        db_session.commit()

        # Add first category
        category1 = ReadingCategory(
            user_id=user.id,
            name="愛情",
            color="#ff0000"
        )
        db_session.add(category1)
        db_session.commit()

        # Try to add duplicate category name for same user
        category2 = ReadingCategory(
            user_id=user.id,
            name="愛情",
            color="#00ff00"
        )
        db_session.add(category2)

        with pytest.raises(IntegrityError):
            db_session.commit()
        db_session.rollback()

    def test_different_users_same_category_name(self, db_session):
        """Test that different users can have categories with the same name"""
        user1 = User(username="user1", email="user1@example.com")
        user2 = User(username="user2", email="user2@example.com")
        db_session.add_all([user1, user2])
        db_session.commit()

        category1 = ReadingCategory(
            user_id=user1.id,
            name="愛情",
            color="#ff0000"
        )
        category2 = ReadingCategory(
            user_id=user2.id,
            name="愛情",
            color="#00ff00"
        )
        db_session.add_all([category1, category2])
        db_session.commit()

        # Both should be created successfully
        assert category1.id is not None
        assert category2.id is not None

    def test_cascade_delete_on_user_deletion(self, db_session):
        """Test that categories are deleted when user is deleted"""
        user = User(username="test_user", email="test@example.com")
        db_session.add(user)
        db_session.commit()

        category = ReadingCategory(
            user_id=user.id,
            name="愛情",
            color="#ff0000"
        )
        db_session.add(category)
        db_session.commit()

        category_id = category.id

        # Delete user
        db_session.delete(user)
        db_session.commit()

        # Verify category is also deleted
        deleted_category = db_session.query(ReadingCategory).filter_by(id=category_id).first()
        assert deleted_category is None


class TestCompletedReadingWithTags:
    """Test suite for CompletedReading with tags and categories"""

    def test_reading_with_category(self, db_session):
        """Test associating a reading with a category"""
        user = User(username="test_user", email="test@example.com")
        db_session.add(user)
        db_session.commit()

        category = ReadingCategory(
            user_id=user.id,
            name="愛情",
            color="#ff0000"
        )
        db_session.add(category)
        db_session.commit()

        reading = CompletedReading(
            user_id=user.id,
            question="Test",
            character_voice_used="pip_boy",
            karma_context="neutral",
            category_id=category.id
        )
        db_session.add(reading)
        db_session.commit()

        # Verify
        assert reading.category_id == category.id
        # Test relationship (if defined)
        if hasattr(reading, 'category'):
            assert reading.category.name == "愛情"

    def test_reading_with_multiple_tags(self, db_session):
        """Test adding multiple tags to a reading"""
        user = User(username="test_user", email="test@example.com")
        db_session.add(user)
        db_session.commit()

        reading = CompletedReading(
            user_id=user.id,
            question="Test",
            character_voice_used="pip_boy",
            karma_context="neutral"
        )
        db_session.add(reading)
        db_session.commit()

        # Add multiple tags
        tags = ["愛情", "未來", "事業"]
        for tag_name in tags:
            tag = ReadingTag(
                reading_id=reading.id,
                tag=tag_name
            )
            db_session.add(tag)
        db_session.commit()

        # Verify
        reading_tags = db_session.query(ReadingTag).filter_by(reading_id=reading.id).all()
        assert len(reading_tags) == 3
        tag_names = [t.tag for t in reading_tags]
        assert set(tag_names) == set(tags)
