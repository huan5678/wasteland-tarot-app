"""remove_vault_number_from_user_tables

Revision ID: 98a5eb0f83ea
Revises: 3dc09dba0617
Create Date: 2025-10-14 00:52:15.002763

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '98a5eb0f83ea'
down_revision: Union[str, Sequence[str], None] = '3dc09dba0617'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Remove vault_number column from users and user_profiles tables.

    This field is purely cosmetic and causes data inconsistency issues
    between the two tables. It has no functional impact on the system.

    Note: WastelandCard.vault_number is NOT removed as it's a functional
    game attribute (e.g., The Fool is associated with Vault 111).
    """
    # Remove vault_number from users table
    op.drop_column('users', 'vault_number')

    # Remove vault_number from user_profiles table
    op.drop_column('user_profiles', 'vault_number')


def downgrade() -> None:
    """
    Restore vault_number column to users and user_profiles tables.

    This rollback allows reverting the migration if needed, though
    any data previously stored in these fields will not be recovered.
    """
    # Restore vault_number to users table
    op.add_column('users', sa.Column('vault_number', sa.Integer(), nullable=True))

    # Restore vault_number to user_profiles table
    op.add_column('user_profiles', sa.Column('vault_number', sa.Integer(), nullable=True))
