"""
Tag Management Service

Provides utilities for tag merging, renaming, and bulk operations.
"""
from typing import List, Dict, Any
from sqlalchemy import select, func, and_, delete
from sqlalchemy.orm import Session

from app.models.reading_enhanced import ReadingTag, CompletedReading


class TagManagementService:
    """Service for managing tags (merge, rename, bulk operations)."""

    def __init__(self, db_session: Session):
        """Initialize service with database session."""
        self.db = db_session

    def merge_tags(
        self,
        user_id: str,
        source_tags: List[str],
        target_tag: str
    ) -> Dict[str, Any]:
        """
        Merge multiple tags into a single target tag.

        Args:
            user_id: User ID for isolation
            source_tags: List of tags to merge
            target_tag: Target tag name

        Returns:
            Dict with merged_count and readings_affected

        Raises:
            ValueError: If validation fails
        """
        # Validation
        if not source_tags:
            raise ValueError("Source tags cannot be empty")
        if not target_tag or not target_tag.strip():
            raise ValueError("Target tag cannot be empty")
        if target_tag in source_tags:
            raise ValueError("Target tag cannot be in source tags")

        target_tag = target_tag.strip()
        source_tags = [tag.strip() for tag in source_tags]

        # Get all affected readings
        stmt = (
            select(ReadingTag)
            .join(CompletedReading)
            .where(
                and_(
                    CompletedReading.user_id == user_id,
                    ReadingTag.tag.in_(source_tags)
                )
            )
        )
        affected_tags = self.db.execute(stmt).scalars().all()

        if not affected_tags:
            return {"merged_count": 0, "readings_affected": 0}

        # Track unique readings
        affected_reading_ids = set()

        for tag_obj in affected_tags:
            affected_reading_ids.add(tag_obj.reading_id)

            # Check if target tag already exists for this reading
            check_stmt = select(ReadingTag).where(
                and_(
                    ReadingTag.reading_id == tag_obj.reading_id,
                    ReadingTag.tag == target_tag
                )
            )
            existing_target = self.db.execute(check_stmt).scalar_one_or_none()

            if existing_target:
                # Target tag exists, just delete the source tag
                self.db.delete(tag_obj)
            else:
                # Replace source tag with target tag
                tag_obj.tag = target_tag

        self.db.commit()

        return {
            "merged_count": len(source_tags),
            "readings_affected": len(affected_reading_ids)
        }

    def rename_tag(
        self,
        user_id: str,
        old_tag: str,
        new_tag: str
    ) -> Dict[str, Any]:
        """
        Rename a tag across all user's readings.

        Args:
            user_id: User ID for isolation
            old_tag: Current tag name
            new_tag: New tag name

        Returns:
            Dict with readings_affected

        Raises:
            ValueError: If validation fails
        """
        # Validation
        if not old_tag or not old_tag.strip():
            raise ValueError("Old tag cannot be empty")
        if not new_tag or not new_tag.strip():
            raise ValueError("New tag cannot be empty")

        old_tag = old_tag.strip()
        new_tag = new_tag.strip()

        if old_tag == new_tag:
            raise ValueError("Old and new tags cannot be the same")

        # Get all instances of old tag for this user
        stmt = (
            select(ReadingTag)
            .join(CompletedReading)
            .where(
                and_(
                    CompletedReading.user_id == user_id,
                    ReadingTag.tag == old_tag
                )
            )
        )
        tags_to_rename = self.db.execute(stmt).scalars().all()

        if not tags_to_rename:
            return {"readings_affected": 0}

        affected_reading_ids = set()

        for tag_obj in tags_to_rename:
            affected_reading_ids.add(tag_obj.reading_id)

            # Check if new tag already exists for this reading
            check_stmt = select(ReadingTag).where(
                and_(
                    ReadingTag.reading_id == tag_obj.reading_id,
                    ReadingTag.tag == new_tag
                )
            )
            existing_new_tag = self.db.execute(check_stmt).scalar_one_or_none()

            if existing_new_tag:
                # New tag exists, just delete the old tag (merge behavior)
                self.db.delete(tag_obj)
            else:
                # Rename the tag
                tag_obj.tag = new_tag

        self.db.commit()

        return {"readings_affected": len(affected_reading_ids)}

    def bulk_delete_tags(
        self,
        user_id: str,
        tags: List[str]
    ) -> Dict[str, Any]:
        """
        Delete multiple tags in bulk.

        Args:
            user_id: User ID for isolation
            tags: List of tags to delete

        Returns:
            Dict with tags_deleted and readings_affected
        """
        if not tags:
            return {"tags_deleted": 0, "readings_affected": 0}

        tags = [tag.strip() for tag in tags]

        # Get all affected tags
        stmt = (
            select(ReadingTag)
            .join(CompletedReading)
            .where(
                and_(
                    CompletedReading.user_id == user_id,
                    ReadingTag.tag.in_(tags)
                )
            )
        )
        tags_to_delete = self.db.execute(stmt).scalars().all()

        affected_reading_ids = set(tag.reading_id for tag in tags_to_delete)

        # Delete all tags
        for tag_obj in tags_to_delete:
            self.db.delete(tag_obj)

        self.db.commit()

        return {
            "tags_deleted": len(tags),
            "readings_affected": len(affected_reading_ids)
        }

    def get_tag_usage_statistics(
        self,
        user_id: str
    ) -> List[Dict[str, Any]]:
        """
        Get usage statistics for all tags.

        Args:
            user_id: User ID for isolation

        Returns:
            List of dicts with tag name and count, sorted by count descending
        """
        stmt = (
            select(
                ReadingTag.tag,
                func.count(ReadingTag.id).label("count")
            )
            .join(CompletedReading)
            .where(CompletedReading.user_id == user_id)
            .group_by(ReadingTag.tag)
            .order_by(func.count(ReadingTag.id).desc())
        )

        rows = self.db.execute(stmt).all()

        return [
            {"tag": row.tag, "count": row.count}
            for row in rows
        ]

    def get_all_user_tags(self, user_id: str) -> List[str]:
        """
        Get all unique tags for a user.

        Args:
            user_id: User ID

        Returns:
            List of unique tag names
        """
        stmt = (
            select(ReadingTag.tag)
            .join(CompletedReading)
            .where(CompletedReading.user_id == user_id)
            .distinct()
        )

        return [row[0] for row in self.db.execute(stmt).all()]

    def get_reading_tags(self, reading_id: str) -> List[str]:
        """
        Get all tags for a specific reading.

        Args:
            reading_id: Reading ID

        Returns:
            List of tag names
        """
        stmt = select(ReadingTag.tag).where(ReadingTag.reading_id == reading_id)
        return [row[0] for row in self.db.execute(stmt).all()]
