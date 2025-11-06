"""add_interpretation_audio_url_to_completed_readings

Revision ID: 85d8d71873ae
Revises: 429eefbfe0a5
Create Date: 2025-11-02 02:37:36.184599

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '85d8d71873ae'
down_revision: Union[str, Sequence[str], None] = '429eefbfe0a5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add interpretation_audio_url column to completed_readings table
    op.add_column(
        'completed_readings',
        sa.Column('interpretation_audio_url', sa.Text(), nullable=True)
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Remove interpretation_audio_url column from completed_readings table
    op.drop_column('completed_readings', 'interpretation_audio_url')
