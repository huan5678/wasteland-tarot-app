"""merge_migration_branches

Revision ID: dcb426b155c2
Revises: 006, a93652ff3692
Create Date: 2025-10-04 13:05:46.283069

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dcb426b155c2'
down_revision: Union[str, Sequence[str], None] = ('006', 'a93652ff3692')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
