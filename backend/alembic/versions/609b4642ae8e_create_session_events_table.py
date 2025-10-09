"""create session_events table

Revision ID: 609b4642ae8e
Revises: a768304f644a
Create Date: 2025-10-01 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '609b4642ae8e'
down_revision: Union[str, Sequence[str], None] = 'a768304f644a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - create session_events table."""
    op.create_table(
        'session_events',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('session_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('event_data', sa.JSON(), nullable=True),
        sa.Column('device_info', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for analytics queries
    op.create_index('idx_events_session', 'session_events', ['session_id', sa.text('created_at DESC')])
    op.create_index('idx_events_user_type', 'session_events', ['user_id', 'event_type', sa.text('created_at DESC')])
    op.create_index('idx_events_type_created', 'session_events', ['event_type', sa.text('created_at DESC')])


def downgrade() -> None:
    """Downgrade schema - drop session_events table."""
    op.drop_index('idx_events_type_created', table_name='session_events')
    op.drop_index('idx_events_user_type', table_name='session_events')
    op.drop_index('idx_events_session', table_name='session_events')
    op.drop_table('session_events')
