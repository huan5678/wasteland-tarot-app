"""add_title_fields_to_user_profile_simple

Revision ID: 6878ff58e800
Revises: 5a51727110a2
Create Date: 2025-11-02 21:37:53.021811

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6878ff58e800'
down_revision: Union[str, Sequence[str], None] = '5a51727110a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add title fields to user_profiles table."""
    # Add current_title column
    op.add_column('user_profiles', sa.Column('current_title', sa.String(length=100), nullable=True))

    # Add unlocked_titles column with JSON type
    op.add_column('user_profiles', sa.Column('unlocked_titles', sa.JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade schema - Remove title fields from user_profiles table."""
    # Remove the title columns
    op.drop_column('user_profiles', 'unlocked_titles')
    op.drop_column('user_profiles', 'current_title')
