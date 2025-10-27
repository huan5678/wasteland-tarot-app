"""add_last_login_method_to_users

Revision ID: ea2669cc8d13
Revises: d0ae70563457
Create Date: 2025-10-27 23:29:36.432845

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ea2669cc8d13'
down_revision: Union[str, Sequence[str], None] = 'd0ae70563457'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add last_login_method column to users table
    op.add_column('users', sa.Column('last_login_method', sa.String(length=50), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove last_login_method column from users table
    op.drop_column('users', 'last_login_method')
