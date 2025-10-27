"""merge_multiple_heads

Revision ID: a4135f12e393
Revises: ach001_20251022, 449ca7bda63d, d0fe90d2a3bb
Create Date: 2025-10-27 20:48:02.443079

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a4135f12e393'
down_revision: Union[str, Sequence[str], None] = ('ach001_20251022', '449ca7bda63d', 'd0fe90d2a3bb')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
