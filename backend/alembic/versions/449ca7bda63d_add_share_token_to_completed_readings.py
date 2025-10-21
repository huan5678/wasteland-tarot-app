"""add_share_token_to_completed_readings

Add share_token column to completed_readings table for reading share link feature.

This migration supports the "Share Reading Results" feature by adding:
- share_token column (UUID, nullable, unique) for generating shareable links
- Unique index on share_token for fast lookups

TDD Green Phase: 讓測試通過的最簡單實作

Revision ID: 449ca7bda63d
Revises: 7e6dc10054ff
Create Date: 2025-10-21 10:11:48.236667
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = '449ca7bda63d'
down_revision: Union[str, Sequence[str], None] = '7e6dc10054ff'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Upgrade schema.

    Add share_token column to completed_readings table:
    - Type: UUID (PostgreSQL native UUID type)
    - Nullable: True (not all readings need to be shared)
    - Unique: True (each share link must be unique)
    - Index: Unique index for fast lookups
    """
    # Add share_token column
    op.add_column(
        'completed_readings',
        sa.Column('share_token', UUID(as_uuid=True), nullable=True)
    )

    # Create unique index on share_token
    op.create_index(
        'idx_completed_readings_share_token',
        'completed_readings',
        ['share_token'],
        unique=True
    )


def downgrade() -> None:
    """
    Downgrade schema.

    Remove share_token column and index from completed_readings table.
    """
    # Drop index first (must drop index before dropping column)
    op.drop_index('idx_completed_readings_share_token', table_name='completed_readings')

    # Drop share_token column
    op.drop_column('completed_readings', 'share_token')
