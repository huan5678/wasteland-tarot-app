"""add_achievement_system_tables

Revision ID: ach001_20251022
Revises: 62677bc25018
Create Date: 2025-10-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'ach001_20251022'
down_revision: Union[str, Sequence[str], None] = '62677bc25018'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Create achievement system tables."""

    # Create achievements table (成就定義表)
    op.create_table(
        'achievements',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),

        # Basic information
        sa.Column('code', sa.String(100), nullable=False, unique=True),
        sa.Column('name_zh_tw', sa.String(200), nullable=False),
        sa.Column('description_zh_tw', sa.Text(), nullable=False),

        # Category and rarity
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('rarity', sa.String(50), nullable=False, server_default='COMMON'),

        # Visual presentation
        sa.Column('icon_name', sa.String(100), nullable=False),

        # Unlock criteria (JSON)
        sa.Column('criteria', postgresql.JSONB(), nullable=False),

        # Rewards (JSON)
        sa.Column('rewards', postgresql.JSONB(), nullable=False),

        # Special attributes
        sa.Column('is_hidden', sa.Boolean(), server_default='false'),
        sa.Column('is_active', sa.Boolean(), server_default='true'),

        # Display order
        sa.Column('display_order', sa.Integer(), server_default='0'),

        # Constraints
        sa.CheckConstraint(
            "category IN ('READING', 'SOCIAL', 'BINGO', 'KARMA', 'EXPLORATION')",
            name='check_achievement_category'
        ),
        sa.CheckConstraint(
            "rarity IN ('COMMON', 'RARE', 'EPIC', 'LEGENDARY')",
            name='check_achievement_rarity'
        ),
    )

    # Create indexes for achievements table
    op.create_index('idx_achievement_code', 'achievements', ['code'])
    op.create_index('idx_achievement_category', 'achievements', ['category'])
    op.create_index('idx_achievement_rarity', 'achievements', ['rarity'])
    op.create_index('idx_achievement_is_active', 'achievements', ['is_active'])

    # Create user_achievement_progress table (使用者成就進度表)
    op.create_table(
        'user_achievement_progress',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),

        # Relations
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('achievement_id', postgresql.UUID(as_uuid=True), nullable=False),

        # Progress tracking
        sa.Column('current_progress', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('target_progress', sa.Integer(), nullable=False),

        # Status
        sa.Column('status', sa.String(50), nullable=False, server_default='IN_PROGRESS'),

        # Timestamps
        sa.Column('unlocked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('claimed_at', sa.DateTime(timezone=True), nullable=True),

        # Foreign keys
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['achievement_id'], ['achievements.id'], ondelete='CASCADE'),

        # Constraints
        sa.CheckConstraint(
            "status IN ('IN_PROGRESS', 'UNLOCKED', 'CLAIMED')",
            name='check_user_achievement_status'
        ),
        sa.CheckConstraint(
            'current_progress >= 0',
            name='check_current_progress_non_negative'
        ),
        sa.CheckConstraint(
            'target_progress > 0',
            name='check_target_progress_positive'
        ),
    )

    # Create indexes for user_achievement_progress table
    op.create_index('idx_user_achievement_user_id', 'user_achievement_progress', ['user_id'])
    op.create_index('idx_user_achievement_achievement_id', 'user_achievement_progress', ['achievement_id'])
    op.create_index('idx_user_achievement_status', 'user_achievement_progress', ['status'])
    op.create_index('idx_user_achievement_user_status', 'user_achievement_progress', ['user_id', 'status'])
    op.create_index('idx_user_achievement_unlocked_at', 'user_achievement_progress', ['unlocked_at'])


def downgrade() -> None:
    """Downgrade schema - Drop achievement system tables."""

    # Drop user_achievement_progress table
    op.drop_index('idx_user_achievement_unlocked_at', table_name='user_achievement_progress')
    op.drop_index('idx_user_achievement_user_status', table_name='user_achievement_progress')
    op.drop_index('idx_user_achievement_status', table_name='user_achievement_progress')
    op.drop_index('idx_user_achievement_achievement_id', table_name='user_achievement_progress')
    op.drop_index('idx_user_achievement_user_id', table_name='user_achievement_progress')
    op.drop_table('user_achievement_progress')

    # Drop achievements table
    op.drop_index('idx_achievement_is_active', table_name='achievements')
    op.drop_index('idx_achievement_rarity', table_name='achievements')
    op.drop_index('idx_achievement_category', table_name='achievements')
    op.drop_index('idx_achievement_code', table_name='achievements')
    op.drop_table('achievements')
