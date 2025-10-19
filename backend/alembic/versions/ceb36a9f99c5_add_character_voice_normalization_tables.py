"""add_character_voice_normalization_tables

Revision ID: ceb36a9f99c5
Revises: fa259ec10851
Create Date: 2025-10-18 16:47:51.249271

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'ceb36a9f99c5'
down_revision: Union[str, Sequence[str], None] = 'fa259ec10851'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Create characters table
    op.create_table(
        'characters',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('key', sa.String(length=50), nullable=False, comment='角色唯一識別碼 (如 pip_boy, vault_dweller)'),
        sa.Column('name', sa.String(length=100), nullable=False, comment='角色顯示名稱'),
        sa.Column('description', sa.Text(), nullable=True, comment='角色描述'),
        sa.Column('personality', sa.String(length=200), nullable=True, comment='角色性格特點'),
        sa.Column('voice_style', sa.Text(), nullable=True, comment='角色說話風格'),
        sa.Column('theme_color', sa.String(length=7), nullable=True, comment='角色主題顏色 (HEX)'),
        sa.Column('icon_name', sa.String(length=50), nullable=True, comment='圖示名稱'),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False, comment='是否啟用'),
        sa.Column('sort_order', sa.Integer(), server_default=sa.text('0'), nullable=False, comment='排序順序'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key', name='uq_characters_key'),
        comment='角色定義表 - 儲存所有可用的角色聲音資訊'
    )

    # Create index on key for faster lookups
    op.create_index('ix_characters_key', 'characters', ['key'])
    op.create_index('ix_characters_is_active', 'characters', ['is_active'])
    op.create_index('ix_characters_sort_order', 'characters', ['sort_order'])

    # 2. Create factions table
    op.create_table(
        'factions',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('key', sa.String(length=50), nullable=False, comment='陣營唯一識別碼 (如 vault_dweller, brotherhood)'),
        sa.Column('name', sa.String(length=100), nullable=False, comment='陣營顯示名稱'),
        sa.Column('description', sa.Text(), nullable=True, comment='陣營描述'),
        sa.Column('alignment', sa.String(length=20), nullable=True, comment='陣營傾向 (如 lawful_good, chaotic_neutral)'),
        sa.Column('icon_name', sa.String(length=50), nullable=True, comment='圖示名稱'),
        sa.Column('theme_color', sa.String(length=7), nullable=True, comment='陣營主題顏色 (HEX)'),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False, comment='是否啟用'),
        sa.Column('sort_order', sa.Integer(), server_default=sa.text('0'), nullable=False, comment='排序順序'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key', name='uq_factions_key'),
        comment='陣營定義表 - 儲存所有可用的陣營資訊'
    )

    # Create index on key for faster lookups
    op.create_index('ix_factions_key', 'factions', ['key'])
    op.create_index('ix_factions_is_active', 'factions', ['is_active'])
    op.create_index('ix_factions_sort_order', 'factions', ['sort_order'])

    # 3. Create faction_characters junction table (many-to-many)
    op.create_table(
        'faction_characters',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('faction_id', postgresql.UUID(as_uuid=True), nullable=False, comment='陣營 ID'),
        sa.Column('character_id', postgresql.UUID(as_uuid=True), nullable=False, comment='角色 ID'),
        sa.Column('priority', sa.Integer(), server_default=sa.text('0'), nullable=False, comment='角色在該陣營中的優先順序 (數字越小優先級越高)'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['faction_id'], ['factions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['character_id'], ['characters.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('faction_id', 'character_id', name='uq_faction_characters_faction_character'),
        comment='陣營-角色關聯表 - 定義每個陣營可以使用哪些角色聲音'
    )

    # Create indexes for efficient lookups
    op.create_index('ix_faction_characters_faction_id', 'faction_characters', ['faction_id'])
    op.create_index('ix_faction_characters_character_id', 'faction_characters', ['character_id'])
    op.create_index('ix_faction_characters_priority', 'faction_characters', ['priority'])

    # 4. Create card_interpretations table
    op.create_table(
        'card_interpretations',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('card_id', postgresql.UUID(as_uuid=True), nullable=False, comment='卡牌 ID'),
        sa.Column('character_id', postgresql.UUID(as_uuid=True), nullable=False, comment='角色 ID'),
        sa.Column('interpretation_text', sa.Text(), nullable=False, comment='解讀文字內容'),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False, comment='是否啟用'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['card_id'], ['wasteland_cards.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['character_id'], ['characters.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('card_id', 'character_id', name='uq_card_interpretations_card_character'),
        comment='卡牌角色解讀表 - 儲存每張卡牌的各個角色解讀內容'
    )

    # Create indexes for efficient lookups
    op.create_index('ix_card_interpretations_card_id', 'card_interpretations', ['card_id'])
    op.create_index('ix_card_interpretations_character_id', 'card_interpretations', ['character_id'])
    op.create_index('ix_card_interpretations_is_active', 'card_interpretations', ['is_active'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop tables in reverse order (respecting foreign key constraints)
    op.drop_index('ix_card_interpretations_is_active', 'card_interpretations')
    op.drop_index('ix_card_interpretations_character_id', 'card_interpretations')
    op.drop_index('ix_card_interpretations_card_id', 'card_interpretations')
    op.drop_table('card_interpretations')

    op.drop_index('ix_faction_characters_priority', 'faction_characters')
    op.drop_index('ix_faction_characters_character_id', 'faction_characters')
    op.drop_index('ix_faction_characters_faction_id', 'faction_characters')
    op.drop_table('faction_characters')

    op.drop_index('ix_factions_sort_order', 'factions')
    op.drop_index('ix_factions_is_active', 'factions')
    op.drop_index('ix_factions_key', 'factions')
    op.drop_table('factions')

    op.drop_index('ix_characters_sort_order', 'characters')
    op.drop_index('ix_characters_is_active', 'characters')
    op.drop_index('ix_characters_key', 'characters')
    op.drop_table('characters')
