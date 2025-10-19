"""remove_card_study_time_from_user_analytics

Revision ID: fa259ec10851
Revises: 62677bc25018
Create Date: 2025-10-17 23:00:57.764695

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fa259ec10851'
down_revision: Union[str, Sequence[str], None] = '62677bc25018'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
