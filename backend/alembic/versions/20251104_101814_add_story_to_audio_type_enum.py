"""add story to audio_type enum

Revision ID: 20251104_101814
Revises: 20251104_gpql23ivbb2v
Create Date: 2025-11-04 10:18:14

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20251104_101814'
down_revision = 'gpql23ivbb2v'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Add 'story' value to audio_type_enum
    """
    # PostgreSQL requires explicit ALTER TYPE to add enum values
    op.execute("ALTER TYPE audio_type_enum ADD VALUE IF NOT EXISTS 'story'")


def downgrade() -> None:
    """
    Remove 'story' value from audio_type_enum
    
    Note: PostgreSQL doesn't support removing enum values directly.
    This would require recreating the enum type and all dependent objects.
    For now, we keep the value in the enum even on downgrade.
    """
    # Cannot easily remove enum value in PostgreSQL without recreating the type
    # This is a safe no-op downgrade since having an unused enum value doesn't break anything
    pass
