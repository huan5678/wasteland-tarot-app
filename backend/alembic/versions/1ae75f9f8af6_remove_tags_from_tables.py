"""remove_tags_from_tables

Revision ID: 1ae75f9f8af6
Revises: 5952ef20305d
Create Date: 2025-10-15 22:25:01.310023

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1ae75f9f8af6'
down_revision: Union[str, Sequence[str], None] = '5952ef20305d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove tags column from spread_templates, completed_readings, and user_achievements tables."""
    # Remove tags column from spread_templates
    op.drop_column('spread_templates', 'tags')

    # Remove tags column from completed_readings
    op.drop_column('completed_readings', 'tags')

    # Remove tags column from user_achievements
    op.drop_column('user_achievements', 'tags')


def downgrade() -> None:
    """Add back tags column to spread_templates, completed_readings, and user_achievements tables."""
    # Add back tags column to spread_templates
    op.add_column('spread_templates', sa.Column('tags', sa.JSON(), nullable=True))

    # Add back tags column to completed_readings
    op.add_column('completed_readings', sa.Column('tags', sa.JSON(), nullable=True))

    # Add back tags column to user_achievements
    op.add_column('user_achievements', sa.Column('tags', sa.JSON(), nullable=True))
