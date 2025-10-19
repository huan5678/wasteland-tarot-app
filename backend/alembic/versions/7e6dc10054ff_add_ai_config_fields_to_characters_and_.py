"""add_ai_config_fields_to_characters_and_factions

Revision ID: 7e6dc10054ff
Revises: eaa889269d9a
Create Date: 2025-10-19 13:05:00.739263

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '7e6dc10054ff'
down_revision: Union[str, Sequence[str], None] = 'eaa889269d9a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add AI configuration fields to characters and factions."""
    # ### AI Configuration Fields ###

    # Add AI configuration fields to characters table
    op.add_column('characters', sa.Column('ai_system_prompt', sa.Text(), nullable=True))
    op.add_column('characters', sa.Column('ai_tone_description', sa.String(length=200), nullable=True))
    op.add_column('characters', sa.Column('ai_prompt_config', sa.JSON(), nullable=True))

    # Add AI style configuration field to factions table
    op.add_column('factions', sa.Column('ai_style_config', sa.JSON(), nullable=True))

    # Fix metadata reserved word issue in token_extension_history
    op.add_column('token_extension_history', sa.Column('extension_metadata', sa.JSON(), nullable=True))
    op.add_column('token_extension_history', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True))
    op.drop_column('token_extension_history', 'metadata')

    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema - Remove AI configuration fields."""
    # ### Rollback AI Configuration Fields ###

    # Restore old metadata field in token_extension_history
    op.add_column('token_extension_history', sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), server_default=sa.text("'{}'::json"), autoincrement=False, nullable=True))
    op.drop_column('token_extension_history', 'updated_at')
    op.drop_column('token_extension_history', 'extension_metadata')

    # Remove AI configuration fields from factions table
    op.drop_column('factions', 'ai_style_config')

    # Remove AI configuration fields from characters table
    op.drop_column('characters', 'ai_prompt_config')
    op.drop_column('characters', 'ai_tone_description')
    op.drop_column('characters', 'ai_system_prompt')

    # ### end Alembic commands ###
