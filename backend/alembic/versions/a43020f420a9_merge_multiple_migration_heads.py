"""merge multiple migration heads

Revision ID: a43020f420a9
Revises: add_standard_tarot_names, add_reading_shares_001
Create Date: 2025-11-12 00:50:32.432101

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a43020f420a9'
down_revision: Union[str, Sequence[str], None] = ('add_standard_tarot_names', 'add_reading_shares_001')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
