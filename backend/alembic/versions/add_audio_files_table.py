"""add_audio_files_table

Revision ID: 782a2b0ab34f
Revises: ceb36a9f99c5
Create Date: 2025-10-19 00:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '782a2b0ab34f'
down_revision: Union[str, Sequence[str], None] = 'ceb36a9f99c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - create audio_files table."""

    # Create Enum types using raw SQL with IF NOT EXISTS
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE audio_type_enum AS ENUM ('STATIC_CARD', 'DYNAMIC_READING', 'AI_RESPONSE');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE generation_status_enum AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Create audio_files table
    op.create_table(
        'audio_files',
        sa.Column('card_id', sa.UUID(), nullable=True),
        sa.Column('character_id', sa.UUID(), nullable=False),
        sa.Column('storage_path', sa.String(length=500), nullable=False),
        sa.Column('storage_url', sa.String(length=1000), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('duration_seconds', sa.Float(), nullable=False),
        sa.Column('text_length', sa.Integer(), nullable=False),
        sa.Column('text_hash', sa.String(length=64), nullable=False),
        sa.Column('language_code', sa.String(length=10), nullable=False),
        sa.Column('voice_name', sa.String(length=50), nullable=False),
        sa.Column('ssml_params', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('audio_type', postgresql.ENUM('STATIC_CARD', 'DYNAMIC_READING', 'AI_RESPONSE', name='audio_type_enum', create_type=False), nullable=False),
        sa.Column('generation_status', postgresql.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', name='generation_status_enum', create_type=False), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('access_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['card_id'], ['wasteland_cards.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['character_id'], ['characters.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('storage_path')
    )

    # Create indexes
    op.create_index(
        'idx_audio_access_count',
        'audio_files',
        ['access_count'],
        unique=False,
        postgresql_using='btree',
        postgresql_ops={'access_count': 'DESC'}
    )
    op.create_index(
        'idx_audio_card_character',
        'audio_files',
        ['card_id', 'character_id'],
        unique=True,
        postgresql_where=sa.text('card_id IS NOT NULL')
    )
    op.create_index(
        'idx_audio_failed',
        'audio_files',
        ['generation_status'],
        unique=False,
        postgresql_where=sa.text("generation_status = 'FAILED'")
    )
    op.create_index(
        'idx_audio_text_hash_character',
        'audio_files',
        ['text_hash', 'character_id'],
        unique=False
    )
    op.create_index(op.f('ix_audio_files_access_count'), 'audio_files', ['access_count'], unique=False)
    op.create_index(op.f('ix_audio_files_audio_type'), 'audio_files', ['audio_type'], unique=False)
    op.create_index(op.f('ix_audio_files_card_id'), 'audio_files', ['card_id'], unique=False)
    op.create_index(op.f('ix_audio_files_character_id'), 'audio_files', ['character_id'], unique=False)
    op.create_index(op.f('ix_audio_files_generation_status'), 'audio_files', ['generation_status'], unique=False)
    op.create_index(op.f('ix_audio_files_text_hash'), 'audio_files', ['text_hash'], unique=False)


def downgrade() -> None:
    """Downgrade schema - drop audio_files table."""

    # Drop indexes
    op.drop_index(op.f('ix_audio_files_text_hash'), table_name='audio_files')
    op.drop_index(op.f('ix_audio_files_generation_status'), table_name='audio_files')
    op.drop_index(op.f('ix_audio_files_character_id'), table_name='audio_files')
    op.drop_index(op.f('ix_audio_files_card_id'), table_name='audio_files')
    op.drop_index(op.f('ix_audio_files_audio_type'), table_name='audio_files')
    op.drop_index(op.f('ix_audio_files_access_count'), table_name='audio_files')
    op.drop_index('idx_audio_text_hash_character', table_name='audio_files')
    op.drop_index('idx_audio_failed', table_name='audio_files')
    op.drop_index('idx_audio_card_character', table_name='audio_files')
    op.drop_index('idx_audio_access_count', table_name='audio_files')

    # Drop table
    op.drop_table('audio_files')

    # Drop Enum types
    audio_type_enum = postgresql.ENUM(
        'STATIC_CARD', 'DYNAMIC_READING', 'AI_RESPONSE',
        name='audio_type_enum'
    )
    generation_status_enum = postgresql.ENUM(
        'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED',
        name='generation_status_enum'
    )

    audio_type_enum.drop(op.get_bind(), checkfirst=True)
    generation_status_enum.drop(op.get_bind(), checkfirst=True)
