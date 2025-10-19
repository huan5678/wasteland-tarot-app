"""add_ai_interpretation_tracking_to_completed_readings

Revision ID: 62677bc25018
Revises: 1ae75f9f8af6
Create Date: 2025-10-17 20:37:44.830226

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '62677bc25018'
down_revision: Union[str, Sequence[str], None] = '1ae75f9f8af6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add AI interpretation tracking columns to completed_readings table
    op.add_column('completed_readings', sa.Column('ai_interpretation_requested', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('completed_readings', sa.Column('ai_interpretation_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('completed_readings', sa.Column('ai_interpretation_provider', sa.String(50), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove AI interpretation tracking columns from completed_readings table
    op.drop_column('completed_readings', 'ai_interpretation_provider')
    op.drop_column('completed_readings', 'ai_interpretation_at')
    op.drop_column('completed_readings', 'ai_interpretation_requested')
