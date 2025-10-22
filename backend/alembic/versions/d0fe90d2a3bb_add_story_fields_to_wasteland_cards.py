"""add_story_fields_to_wasteland_cards

Revision ID: d0fe90d2a3bb
Revises: 7e6dc10054ff
Create Date: 2025-10-21 19:44:26.325920

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = 'd0fe90d2a3bb'
down_revision: Union[str, Sequence[str], None] = '7e6dc10054ff'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """新增故事模式相關欄位到 wasteland_cards 表."""
    # 新增 6 個故事欄位，所有欄位設為 nullable=True 確保向後相容
    op.add_column('wasteland_cards', sa.Column('story_background', sa.Text(), nullable=True))
    op.add_column('wasteland_cards', sa.Column('story_character', sa.String(length=100), nullable=True))
    op.add_column('wasteland_cards', sa.Column('story_location', sa.String(length=100), nullable=True))
    op.add_column('wasteland_cards', sa.Column('story_timeline', sa.String(length=50), nullable=True))
    op.add_column('wasteland_cards', sa.Column('story_faction_involved', JSONB(), nullable=True))
    op.add_column('wasteland_cards', sa.Column('story_related_quest', sa.String(length=200), nullable=True))

    # 建立 GIN 索引以加速 JSONB 欄位查詢
    op.create_index(
        'idx_wasteland_cards_story_factions',
        'wasteland_cards',
        ['story_faction_involved'],
        postgresql_using='gin'
    )

    # 新增檢查約束驗證時間格式（戰前/戰後/YYYY年）
    op.create_check_constraint(
        'chk_story_timeline',
        'wasteland_cards',
        sa.text("story_timeline IS NULL OR story_timeline ~ '^(戰前|戰後|[0-9]{4} 年)$'")
    )


def downgrade() -> None:
    """移除故事模式相關欄位從 wasteland_cards 表."""
    # 移除檢查約束
    op.drop_constraint('chk_story_timeline', 'wasteland_cards', type_='check')

    # 移除 GIN 索引
    op.drop_index('idx_wasteland_cards_story_factions', table_name='wasteland_cards')

    # 完整回滾所有欄位（以相反順序移除）
    op.drop_column('wasteland_cards', 'story_related_quest')
    op.drop_column('wasteland_cards', 'story_faction_involved')
    op.drop_column('wasteland_cards', 'story_timeline')
    op.drop_column('wasteland_cards', 'story_location')
    op.drop_column('wasteland_cards', 'story_character')
    op.drop_column('wasteland_cards', 'story_background')
