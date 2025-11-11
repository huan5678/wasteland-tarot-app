"""
Unit Tests for Reading Tags and Categories Model Structure

Tests that the new models have the correct structure and attributes.
These are lightweight tests that don't require database setup.
"""

import pytest
from sqlalchemy import Column, inspect
from sqlalchemy.dialects.postgresql import UUID


class TestReadingTagModelStructure:
    """Test ReadingTag model structure"""

    def test_reading_tag_model_exists(self):
        """Test that ReadingTag model can be imported"""
        from app.models.reading_enhanced import ReadingTag
        assert ReadingTag is not None

    def test_reading_tag_has_required_columns(self):
        """Test that ReadingTag has all required columns"""
        from app.models.reading_enhanced import ReadingTag

        # Get model columns
        mapper = inspect(ReadingTag)
        column_names = [col.key for col in mapper.columns]

        # Verify required columns exist
        assert 'id' in column_names
        assert 'reading_id' in column_names
        assert 'tag' in column_names
        assert 'created_at' in column_names

    def test_reading_tag_has_tablename(self):
        """Test that ReadingTag has correct table name"""
        from app.models.reading_enhanced import ReadingTag
        assert ReadingTag.__tablename__ == 'reading_tags'

    def test_reading_tag_has_to_dict_method(self):
        """Test that ReadingTag has to_dict method"""
        from app.models.reading_enhanced import ReadingTag
        assert hasattr(ReadingTag, 'to_dict')
        assert callable(ReadingTag.to_dict)


class TestReadingCategoryModelStructure:
    """Test ReadingCategory model structure"""

    def test_reading_category_model_exists(self):
        """Test that ReadingCategory model can be imported"""
        from app.models.reading_enhanced import ReadingCategory
        assert ReadingCategory is not None

    def test_reading_category_has_required_columns(self):
        """Test that ReadingCategory has all required columns"""
        from app.models.reading_enhanced import ReadingCategory

        # Get model columns
        mapper = inspect(ReadingCategory)
        column_names = [col.key for col in mapper.columns]

        # Verify required columns exist
        assert 'id' in column_names
        assert 'user_id' in column_names
        assert 'name' in column_names
        assert 'color' in column_names
        assert 'description' in column_names
        assert 'icon' in column_names
        assert 'created_at' in column_names

    def test_reading_category_has_tablename(self):
        """Test that ReadingCategory has correct table name"""
        from app.models.reading_enhanced import ReadingCategory
        assert ReadingCategory.__tablename__ == 'reading_categories'

    def test_reading_category_has_to_dict_method(self):
        """Test that ReadingCategory has to_dict method"""
        from app.models.reading_enhanced import ReadingCategory
        assert hasattr(ReadingCategory, 'to_dict')
        assert callable(ReadingCategory.to_dict)


class TestCompletedReadingCategoryRelationship:
    """Test CompletedReading has category relationship"""

    def test_completed_reading_has_category_id(self):
        """Test that CompletedReading has category_id column"""
        from app.models.reading_enhanced import CompletedReading

        # Get model columns
        mapper = inspect(CompletedReading)
        column_names = [col.key for col in mapper.columns]

        assert 'category_id' in column_names

    def test_completed_reading_has_tags_relationship(self):
        """Test that CompletedReading has tags relationship"""
        from app.models.reading_enhanced import CompletedReading

        # Get relationships
        mapper = inspect(CompletedReading)
        relationships = mapper.relationships.keys()

        assert 'tags' in relationships
        assert 'category' in relationships


class TestUserCategoryRelationship:
    """Test User has reading_categories relationship"""

    def test_user_has_reading_categories_relationship(self):
        """Test that User has reading_categories relationship"""
        from app.models.user import User

        # Get relationships
        mapper = inspect(User)
        relationships = mapper.relationships.keys()

        assert 'reading_categories' in relationships
