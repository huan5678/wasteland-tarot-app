"""rename_reading_session_id_to_completed_reading_id_in_card_positions

Revision ID: 5952ef20305d
Revises: 98a5eb0f83ea
Create Date: 2025-10-15 09:10:43.766635

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5952ef20305d'
down_revision: Union[str, Sequence[str], None] = '98a5eb0f83ea'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Rename reading_session_id to completed_reading_id in reading_card_positions table.

    This aligns the database schema with the normalized CompletedReading model design,
    where card positions belong to completed_readings rather than reading_sessions.
    """
    # Step 1: Drop the foreign key constraint (if exists)
    op.drop_constraint(
        'reading_card_positions_reading_session_id_fkey',
        'reading_card_positions',
        type_='foreignkey'
    )

    # Step 2: Rename the column
    op.alter_column(
        'reading_card_positions',
        'reading_session_id',
        new_column_name='completed_reading_id',
        existing_type=sa.UUID(),
        existing_nullable=False
    )

    # Step 3: Add the new foreign key constraint to completed_readings
    op.create_foreign_key(
        'reading_card_positions_completed_reading_id_fkey',
        'reading_card_positions',
        'completed_readings',
        ['completed_reading_id'],
        ['id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    """
    Revert completed_reading_id back to reading_session_id.
    """
    # Step 1: Drop the foreign key constraint
    op.drop_constraint(
        'reading_card_positions_completed_reading_id_fkey',
        'reading_card_positions',
        type_='foreignkey'
    )

    # Step 2: Rename the column back
    op.alter_column(
        'reading_card_positions',
        'completed_reading_id',
        new_column_name='reading_session_id',
        existing_type=sa.UUID(),
        existing_nullable=False
    )

    # Step 3: Restore the original foreign key constraint
    op.create_foreign_key(
        'reading_card_positions_reading_session_id_fkey',
        'reading_card_positions',
        'reading_sessions',
        ['reading_session_id'],
        ['id'],
        ondelete='CASCADE'
    )
