"""add updated_at trigger for reading_sessions

Revision ID: a93652ff3692
Revises: 609b4642ae8e
Create Date: 2025-10-01 14:38:52.234993

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a93652ff3692'
down_revision: Union[str, Sequence[str], None] = '609b4642ae8e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create trigger function and trigger for automatic updated_at timestamp."""
    # Create the trigger function
    op.execute("""
        CREATE OR REPLACE FUNCTION update_session_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    # Create the trigger on reading_sessions table
    op.execute("""
        CREATE TRIGGER update_session_timestamp
        BEFORE UPDATE ON reading_sessions
        FOR EACH ROW
        EXECUTE FUNCTION update_session_updated_at();
    """)


def downgrade() -> None:
    """Drop trigger and trigger function."""
    # Drop the trigger first
    op.execute("DROP TRIGGER IF EXISTS update_session_timestamp ON reading_sessions;")

    # Then drop the function
    op.execute("DROP FUNCTION IF EXISTS update_session_updated_at();")
