"""merge reading_journals and audio_url branches

Revision ID: 5a51727110a2
Revises: 2dd503a9f1d6, 85d8d71873ae
Create Date: 2025-11-02 10:11:07.994921

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5a51727110a2'
down_revision: Union[str, Sequence[str], None] = ('2dd503a9f1d6', '85d8d71873ae')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
