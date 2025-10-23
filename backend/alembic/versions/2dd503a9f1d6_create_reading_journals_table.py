"""create_reading_journals_table

Revision ID: 2dd503a9f1d6
Revises: b0d1956133e1
Create Date: 2025-10-23 05:26:26.830788

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '2dd503a9f1d6'
down_revision: Union[str, Sequence[str], None] = 'b0d1956133e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Create reading_journals table with indexes."""
    # Create table
    op.create_table(
        'reading_journals',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('reading_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('mood_tags', postgresql.ARRAY(sa.Text()), server_default='{}', nullable=False),
        sa.Column('is_private', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),

        # Foreign Keys with ON DELETE CASCADE
        sa.ForeignKeyConstraint(['reading_id'], ['completed_readings.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),

        # UNIQUE constraint: one journal per reading per user
        sa.UniqueConstraint('reading_id', 'user_id', name='uq_reading_user_journal'),

        # CHECK constraints
        sa.CheckConstraint('LENGTH(content) <= 10000', name='check_content_length'),
        sa.CheckConstraint('ARRAY_LENGTH(mood_tags, 1) <= 5', name='check_mood_tags_count'),
    )

    # Create indexes for query optimization (Task 1.2)
    op.create_index('idx_reading_journals_user_id', 'reading_journals', ['user_id'])
    op.create_index('idx_reading_journals_reading_id', 'reading_journals', ['reading_id'])
    op.create_index('idx_reading_journals_user_created', 'reading_journals', [sa.text('user_id'), sa.text('created_at DESC')])


def downgrade() -> None:
    """Downgrade schema - Drop reading_journals table and indexes."""
    # Drop indexes first
    op.drop_index('idx_reading_journals_user_created', table_name='reading_journals')
    op.drop_index('idx_reading_journals_reading_id', table_name='reading_journals')
    op.drop_index('idx_reading_journals_user_id', table_name='reading_journals')

    # Drop table
    op.drop_table('reading_journals')
