"""add_token_extension_and_login_history_tables

Revision ID: eaa889269d9a
Revises: 782a2b0ab34f
Create Date: 2025-10-19 12:38:17.795956

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'eaa889269d9a'
down_revision: Union[str, Sequence[str], None] = '782a2b0ab34f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - add token extension and login history tracking tables."""

    # Create user_login_history table
    op.create_table(
        'user_login_history',
        sa.Column('id', sa.UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('login_date', sa.Date(), nullable=False),
        sa.Column('login_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'login_date', name='uq_user_login_date')
    )

    # Create indexes for user_login_history
    op.create_index(
        'idx_login_history_user_date',
        'user_login_history',
        ['user_id', sa.text('login_date DESC')],
        unique=False
    )
    op.create_index(
        op.f('ix_user_login_history_user_id'),
        'user_login_history',
        ['user_id'],
        unique=False
    )

    # Create token_extension_history table (using String with CHECK constraint)
    op.create_table(
        'token_extension_history',
        sa.Column('id', sa.UUID(), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('extension_type', sa.String(50), nullable=False),
        sa.Column('extended_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('extended_minutes', sa.Integer(), nullable=False),
        sa.Column('new_expiry_timestamp', sa.Integer(), nullable=False),
        sa.Column('old_expiry_timestamp', sa.Integer(), nullable=True),
        sa.Column('activity_duration', sa.Integer(), nullable=True),
        sa.Column('extension_metadata', sa.JSON(), nullable=True, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("extension_type IN ('activity', 'loyalty')", name='ck_extension_type')
    )

    # Create indexes for token_extension_history
    op.create_index(
        'idx_token_ext_user_type',
        'token_extension_history',
        ['user_id', 'extension_type'],
        unique=False
    )
    op.create_index(
        'idx_token_ext_date',
        'token_extension_history',
        [sa.text('extended_at DESC')],
        unique=False
    )
    op.create_index(
        op.f('ix_token_extension_history_user_id'),
        'token_extension_history',
        ['user_id'],
        unique=False
    )

    # Add new columns to users table
    op.add_column('users', sa.Column('loyalty_badge_unlocked', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('loyalty_streak_days', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('token_absolute_expiry', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema - remove token extension and login history tables."""

    # Remove new columns from users table
    op.drop_column('users', 'token_absolute_expiry')
    op.drop_column('users', 'loyalty_streak_days')
    op.drop_column('users', 'loyalty_badge_unlocked')

    # Drop indexes for token_extension_history
    op.drop_index(op.f('ix_token_extension_history_user_id'), table_name='token_extension_history')
    op.drop_index('idx_token_ext_date', table_name='token_extension_history')
    op.drop_index('idx_token_ext_user_type', table_name='token_extension_history')

    # Drop token_extension_history table (with CHECK constraint)
    op.drop_table('token_extension_history')

    # Drop indexes for user_login_history
    op.drop_index(op.f('ix_user_login_history_user_id'), table_name='user_login_history')
    op.drop_index('idx_login_history_user_date', table_name='user_login_history')

    # Drop user_login_history table
    op.drop_table('user_login_history')
