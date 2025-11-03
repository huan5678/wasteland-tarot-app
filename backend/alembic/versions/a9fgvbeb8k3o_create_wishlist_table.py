"""create wishlist table

建立願望資料表以支援使用者願望功能
- 建立 wishlist 資料表：儲存使用者願望與管理員回覆
- 設定 user_id 外鍵關聯至 users.id (CASCADE 刪除)
- 建立效能優化索引：user_id、created_at、is_hidden、複合索引
- 建立 CHECK 約束：確保內容與回覆非空白
- 建立 updated_at 自動更新觸發器

Revision ID: a9fgvbeb8k3o
Revises: 429eefbfe0a5
Create Date: 2025-11-03 00:00:00.000000

Requirements: R8.2 (資料管理)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a9fgvbeb8k3o'
down_revision: Union[str, Sequence[str], None] = '429eefbfe0a5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    建立 wishlist 資料表和相關索引、約束、觸發器

    Table Structure:
    - id: UUID 主鍵
    - user_id: UUID 外鍵 (關聯 users.id, CASCADE)
    - content: TEXT 願望內容 (非空)
    - admin_reply: TEXT 管理員回覆 (nullable)
    - created_at: TIMESTAMPTZ 建立時間
    - updated_at: TIMESTAMPTZ 更新時間 (自動更新)
    - admin_reply_timestamp: TIMESTAMPTZ 管理員回覆時間 (nullable)
    - has_been_edited: BOOLEAN 是否已編輯 (預設 false)
    - is_hidden: BOOLEAN 是否隱藏 (預設 false)
    """

    # 取得資料庫連接來執行原生 SQL（用於建立 CHECK 約束與觸發器）
    connection = op.get_bind()

    # 1. 建立 wishlist 資料表
    op.create_table(
        'wishlist',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),

        # 外鍵關聯
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),

        # 內容欄位
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('admin_reply', sa.Text(), nullable=True),

        # 時間戳記欄位
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('admin_reply_timestamp', sa.DateTime(timezone=True), nullable=True),

        # 狀態欄位
        sa.Column('has_been_edited', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_hidden', sa.Boolean(), nullable=False, server_default='false'),

        # 外鍵約束
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )

    # 2. 建立 CHECK 約束（確保內容與回覆非空白）
    connection.execute(sa.text("""
        ALTER TABLE wishlist
        ADD CONSTRAINT check_content_not_empty CHECK (LENGTH(TRIM(content)) > 0)
    """))

    connection.execute(sa.text("""
        ALTER TABLE wishlist
        ADD CONSTRAINT check_reply_not_empty CHECK (admin_reply IS NULL OR LENGTH(TRIM(admin_reply)) > 0)
    """))

    # 3. 建立效能優化索引
    # 單一欄位索引
    op.create_index('idx_wishlist_user_id', 'wishlist', ['user_id'])
    op.create_index('idx_wishlist_created_at', 'wishlist', [sa.text('created_at DESC')])
    op.create_index('idx_wishlist_is_hidden', 'wishlist', ['is_hidden'])

    # 複合索引（user_id + created_at DESC）- 優化使用者願望列表查詢
    op.create_index('idx_wishlist_user_created', 'wishlist', ['user_id', sa.text('created_at DESC')])

    # 4. 建立 updated_at 自動更新函式（如果不存在）
    connection.execute(sa.text("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """))

    # 5. 建立 updated_at 觸發器
    connection.execute(sa.text("""
        CREATE TRIGGER trigger_wishlist_updated_at
        BEFORE UPDATE ON wishlist
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    """))


def downgrade() -> None:
    """
    回滾 wishlist 相關變更

    Steps:
    1. 刪除觸發器
    2. 刪除索引
    3. 刪除 CHECK 約束
    4. 刪除 wishlist 資料表

    Note: update_updated_at_column() 函式不刪除，因為可能被其他表使用
    """

    connection = op.get_bind()

    # 1. 刪除觸發器
    connection.execute(sa.text("""
        DROP TRIGGER IF EXISTS trigger_wishlist_updated_at ON wishlist;
    """))

    # 2. 刪除索引（按建立順序反向刪除）
    op.drop_index('idx_wishlist_user_created', table_name='wishlist')
    op.drop_index('idx_wishlist_is_hidden', table_name='wishlist')
    op.drop_index('idx_wishlist_created_at', table_name='wishlist')
    op.drop_index('idx_wishlist_user_id', table_name='wishlist')

    # 3. 刪除 CHECK 約束
    connection.execute(sa.text("""
        ALTER TABLE wishlist DROP CONSTRAINT IF EXISTS check_reply_not_empty;
    """))

    connection.execute(sa.text("""
        ALTER TABLE wishlist DROP CONSTRAINT IF EXISTS check_content_not_empty;
    """))

    # 4. 刪除 wishlist 資料表
    op.drop_table('wishlist')
