"""
Unit tests for tag management utilities.

Tests tag merging, renaming, and bulk operations.
"""
import pytest
import uuid
from sqlalchemy.orm import Session

from app.models.reading_enhanced import CompletedReading, ReadingTag
from app.services.tag_management_service import TagManagementService


class TestTagManagement:
    """Test tag management utilities."""

    def _create_reading_with_tags(
        self, db_session: Session, user_id: str, tags: list
    ) -> CompletedReading:
        """Helper to create a reading with specific tags."""
        reading = CompletedReading(
            id=str(uuid.uuid4()),
            user_id=user_id,
            question="Test question",
            spread_type="single_card",
            cards_drawn=[],
            interpretation="Test interpretation"
        )
        db_session.add(reading)
        db_session.flush()

        for tag in tags:
            reading_tag = ReadingTag(
                reading_id=reading.id,
                tag=tag
            )
            db_session.add(reading_tag)

        db_session.commit()
        db_session.refresh(reading)
        return reading

    def test_merge_tags_success(
        self, db_session: Session, sample_user
    ):
        """Test merging multiple tags into one target tag."""
        # Arrange
        service = TagManagementService(db_session)

        # Create readings with different tags
        reading1 = self._create_reading_with_tags(
            db_session, sample_user.id, ["愛情", "事業"]
        )
        reading2 = self._create_reading_with_tags(
            db_session, sample_user.id, ["愛情", "健康"]
        )
        reading3 = self._create_reading_with_tags(
            db_session, sample_user.id, ["事業"]
        )

        # Act: Merge "愛情" and "事業" into "人生"
        result = service.merge_tags(
            user_id=sample_user.id,
            source_tags=["愛情", "事業"],
            target_tag="人生"
        )

        # Assert
        assert result["merged_count"] == 2
        assert result["readings_affected"] == 3

        all_tags = service.get_all_user_tags(sample_user.id)
        assert "愛情" not in all_tags
        assert "事業" not in all_tags
        assert "人生" in all_tags

        # Verify reading tags updated
        reading1_tags = service.get_reading_tags(reading1.id)
        assert "人生" in reading1_tags
        assert "健康" in reading1_tags
        assert len(reading1_tags) == 2

    def test_merge_tags_to_existing_tag(
        self, db_session: Session, sample_user
    ):
        """Test merging tags into an existing target tag."""
        # Arrange
        service = TagManagementService(db_session)
        reading1 = self._create_reading_with_tags(
            db_session, sample_user.id, ["愛情", "人生"]
        )
        reading2 = self._create_reading_with_tags(
            db_session, sample_user.id, ["事業", "人生"]
        )

        # Act: Merge "愛情" and "事業" into existing "人生"
        result = service.merge_tags(
            user_id=sample_user.id,
            source_tags=["愛情", "事業"],
            target_tag="人生"
        )

        # Assert
        assert result["merged_count"] == 2
        all_tags = service.get_all_user_tags(sample_user.id)
        assert "愛情" not in all_tags
        assert "事業" not in all_tags
        assert "人生" in all_tags

        # Verify no duplicate tags
        reading1_tags = service.get_reading_tags(reading1.id)
        assert reading1_tags.count("人生") == 1

    def test_rename_tag_success(
        self, db_session: Session, sample_user
    ):
        """Test renaming a tag across all readings."""
        # Arrange
        service = TagManagementService(db_session)
        reading1 = self._create_reading_with_tags(
            db_session, sample_user.id, ["舊標籤", "其他"]
        )
        reading2 = self._create_reading_with_tags(
            db_session, sample_user.id, ["舊標籤"]
        )

        # Act
        result = service.rename_tag(
            user_id=sample_user.id,
            old_tag="舊標籤",
            new_tag="新標籤"
        )

        # Assert
        assert result["readings_affected"] == 2
        all_tags = service.get_all_user_tags(sample_user.id)
        assert "舊標籤" not in all_tags
        assert "新標籤" in all_tags

        # Verify both readings updated
        reading1_tags = service.get_reading_tags(reading1.id)
        reading2_tags = service.get_reading_tags(reading2.id)
        assert "新標籤" in reading1_tags
        assert "新標籤" in reading2_tags

    def test_rename_tag_to_existing_tag(
        self, db_session: Session, sample_user
    ):
        """Test renaming tag to an existing tag name (should merge)."""
        # Arrange
        service = TagManagementService(db_session)
        reading = self._create_reading_with_tags(
            db_session, sample_user.id, ["舊標籤", "現有標籤"]
        )

        # Act: Rename to existing tag (effectively merges)
        result = service.rename_tag(
            user_id=sample_user.id,
            old_tag="舊標籤",
            new_tag="現有標籤"
        )

        # Assert
        reading_tags = service.get_reading_tags(reading.id)
        assert "舊標籤" not in reading_tags
        assert reading_tags.count("現有標籤") == 1  # No duplicates

    def test_bulk_delete_tags(
        self, db_session: Session, sample_user
    ):
        """Test bulk deletion of tags."""
        # Arrange
        service = TagManagementService(db_session)
        reading1 = self._create_reading_with_tags(
            db_session, sample_user.id, ["刪除1", "刪除2", "保留"]
        )
        reading2 = self._create_reading_with_tags(
            db_session, sample_user.id, ["刪除1", "保留"]
        )

        # Act
        result = service.bulk_delete_tags(
            user_id=sample_user.id,
            tags=["刪除1", "刪除2"]
        )

        # Assert
        assert result["tags_deleted"] == 2
        assert result["readings_affected"] == 2

        all_tags = service.get_all_user_tags(sample_user.id)
        assert "刪除1" not in all_tags
        assert "刪除2" not in all_tags
        assert "保留" in all_tags

        # Verify tags removed from readings
        reading1_tags = service.get_reading_tags(reading1.id)
        reading2_tags = service.get_reading_tags(reading2.id)
        assert reading1_tags == ["保留"]
        assert reading2_tags == ["保留"]

    def test_get_tag_usage_statistics(
        self, db_session: Session, sample_user
    ):
        """Test getting tag usage statistics."""
        # Arrange
        service = TagManagementService(db_session)
        self._create_reading_with_tags(
            db_session, sample_user.id, ["熱門", "其他"]
        )
        self._create_reading_with_tags(
            db_session, sample_user.id, ["熱門", "其他"]
        )
        self._create_reading_with_tags(
            db_session, sample_user.id, ["熱門"]
        )
        self._create_reading_with_tags(
            db_session, sample_user.id, ["其他"]
        )

        # Act
        stats = service.get_tag_usage_statistics(sample_user.id)

        # Assert
        assert len(stats) == 2
        assert stats[0]["tag"] == "熱門" or stats[0]["tag"] == "其他"
        assert stats[0]["count"] == 3
        assert stats[1]["tag"] == "熱門" or stats[1]["tag"] == "其他"
        assert stats[1]["count"] == 3

    def test_merge_tags_validation_error(
        self, db_session: Session, sample_user
    ):
        """Test merge tags with invalid input."""
        # Arrange
        service = TagManagementService(db_session)

        # Act & Assert: Empty source tags
        with pytest.raises(ValueError, match="Source tags cannot be empty"):
            service.merge_tags(
                user_id=sample_user.id,
                source_tags=[],
                target_tag="目標"
            )

        # Act & Assert: Empty target tag
        with pytest.raises(ValueError, match="Target tag cannot be empty"):
            service.merge_tags(
                user_id=sample_user.id,
                source_tags=["來源"],
                target_tag=""
            )

        # Act & Assert: Target tag in source tags
        with pytest.raises(ValueError, match="Target tag cannot be in source tags"):
            service.merge_tags(
                user_id=sample_user.id,
                source_tags=["標籤1", "標籤2"],
                target_tag="標籤1"
            )

    def test_rename_tag_validation_error(
        self, db_session: Session, sample_user
    ):
        """Test rename tag with invalid input."""
        # Arrange
        service = TagManagementService(db_session)

        # Act & Assert: Empty old tag
        with pytest.raises(ValueError, match="Old tag cannot be empty"):
            service.rename_tag(
                user_id=sample_user.id,
                old_tag="",
                new_tag="新標籤"
            )

        # Act & Assert: Empty new tag
        with pytest.raises(ValueError, match="New tag cannot be empty"):
            service.rename_tag(
                user_id=sample_user.id,
                old_tag="舊標籤",
                new_tag=""
            )

        # Act & Assert: Same old and new tag
        with pytest.raises(ValueError, match="Old and new tags cannot be the same"):
            service.rename_tag(
                user_id=sample_user.id,
                old_tag="標籤",
                new_tag="標籤"
            )

    def test_user_isolation_in_tag_operations(
        self, db_session: Session, sample_user, another_user
    ):
        """Test that tag operations don't affect other users' data."""
        # Arrange
        service = TagManagementService(db_session)
        user1_reading = self._create_reading_with_tags(
            db_session, sample_user.id, ["共同標籤"]
        )
        user2_reading = self._create_reading_with_tags(
            db_session, another_user.id, ["共同標籤"]
        )

        # Act: User 1 renames their tag
        service.rename_tag(
            user_id=sample_user.id,
            old_tag="共同標籤",
            new_tag="用戶1標籤"
        )

        # Assert: User 1's tag renamed, User 2's tag unchanged
        user1_tags = service.get_reading_tags(user1_reading.id)
        user2_tags = service.get_reading_tags(user2_reading.id)
        assert "用戶1標籤" in user1_tags
        assert "共同標籤" in user2_tags
