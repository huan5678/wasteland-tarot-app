"""Add standard tarot name fields

Revision ID: add_standard_tarot_names
Revises: 
Create Date: 2025-11-05 16:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_standard_tarot_names'
down_revision = '20251104_101814'  # Latest migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add standard tarot name columns to wasteland_cards table"""
    op.add_column('wasteland_cards', 
        sa.Column('standard_tarot_name', sa.String(100), nullable=True, 
                  comment='Standard English tarot card name (e.g., "Six of Swords")')
    )
    op.add_column('wasteland_cards', 
        sa.Column('standard_tarot_name_zh', sa.String(100), nullable=True,
                  comment='Standard Chinese tarot card name (e.g., "寶劍六")')
    )
    op.add_column('wasteland_cards', 
        sa.Column('standard_suit', sa.String(50), nullable=True,
                  comment='Standard tarot suit (Major Arcana, Cups, Swords, Pentacles, Wands)')
    )


def downgrade() -> None:
    """Remove standard tarot name columns"""
    op.drop_column('wasteland_cards', 'standard_suit')
    op.drop_column('wasteland_cards', 'standard_tarot_name_zh')
    op.drop_column('wasteland_cards', 'standard_tarot_name')
