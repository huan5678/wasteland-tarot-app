"""create reading_sessions table

Revision ID: a768304f644a
Revises:
Create Date: 2025-10-01 14:19:08.437944

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a768304f644a'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - create reading_sessions table."""
    op.create_table(
        'reading_sessions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('spread_type', sa.String(length=50), nullable=False),
        sa.Column('spread_config', sa.JSON(), nullable=True),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('session_state', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('last_accessed_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("status IN ('active', 'paused', 'complete')", name='session_status_check')
    )

    # Create indexes for query optimization
    op.create_index('idx_reading_sessions_user_id', 'reading_sessions', ['user_id'])
    op.create_index('idx_reading_sessions_status', 'reading_sessions', ['status'])
    op.create_index('idx_reading_sessions_created_at', 'reading_sessions', ['created_at'])
    op.create_index('idx_reading_sessions_user_status', 'reading_sessions', ['user_id', 'status'])


def downgrade() -> None:
    """Downgrade schema - drop reading_sessions table."""
    op.drop_index('idx_reading_sessions_user_status', table_name='reading_sessions')
    op.drop_index('idx_reading_sessions_created_at', table_name='reading_sessions')
    op.drop_index('idx_reading_sessions_status', table_name='reading_sessions')
    op.drop_index('idx_reading_sessions_user_id', table_name='reading_sessions')
    op.drop_table('reading_sessions')
