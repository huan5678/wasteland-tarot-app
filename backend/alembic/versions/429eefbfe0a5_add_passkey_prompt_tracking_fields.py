"""add_passkey_prompt_tracking_fields

新增 Passkey 引導追蹤欄位以支援智能引導流程
- 新增 users.passkey_prompt_skipped_at: 記錄用戶上次跳過 Passkey 引導的時間
- 新增 users.passkey_prompt_skip_count: 記錄用戶跳過 Passkey 引導的次數（預設 0）
- 建立部分索引 idx_users_passkey_prompt: 優化查詢需要提醒 Passkey 引導的用戶（WHERE skip_count < 3）

Revision ID: 429eefbfe0a5
Revises: ea2669cc8d13
Create Date: 2025-10-28 13:39:50.231094

Requirements: 需求 6 (Passkey 優先引導策略), 需求 7 (向後相容遷移)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '429eefbfe0a5'
down_revision: Union[str, Sequence[str], None] = 'ea2669cc8d13'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    新增 Passkey 引導追蹤欄位和索引（冪等性設計）

    1. 新增 users.passkey_prompt_skipped_at 欄位（TIMESTAMP WITH TIME ZONE, NULLABLE）
    2. 新增 users.passkey_prompt_skip_count 欄位（INTEGER, DEFAULT 0, NOT NULL）
    3. 建立部分索引 idx_users_passkey_prompt（WHERE passkey_prompt_skip_count < 3）

    冪等性：所有操作使用 IF NOT EXISTS，支援重複執行
    """
    # 取得資料庫連接來執行原生 SQL（支援 IF NOT EXISTS）
    connection = op.get_bind()

    # 1. 新增 passkey_prompt_skipped_at 欄位（使用 ADD COLUMN IF NOT EXISTS）
    connection.execute(sa.text("""
        ALTER TABLE users ADD COLUMN IF NOT EXISTS passkey_prompt_skipped_at TIMESTAMP WITH TIME ZONE
    """))

    # 2. 新增 passkey_prompt_skip_count 欄位（使用 ADD COLUMN IF NOT EXISTS）
    connection.execute(sa.text("""
        ALTER TABLE users ADD COLUMN IF NOT EXISTS passkey_prompt_skip_count INTEGER DEFAULT 0 NOT NULL
    """))

    # 3. 建立部分索引（WHERE skip_count < 3）以優化查詢效能
    # 部分索引只索引 skip_count < 3 的用戶，減少索引大小並提升查詢速度
    connection.execute(sa.text("""
        CREATE INDEX IF NOT EXISTS idx_users_passkey_prompt
        ON users(passkey_prompt_skipped_at, passkey_prompt_skip_count)
        WHERE passkey_prompt_skip_count < 3
    """))


def downgrade() -> None:
    """
    回滾 Passkey 引導追蹤相關變更

    1. 刪除部分索引 idx_users_passkey_prompt
    2. 移除 users.passkey_prompt_skip_count 欄位
    3. 移除 users.passkey_prompt_skipped_at 欄位

    注意：按建立順序反向刪除，確保安全回退
    """
    # 1. 刪除索引
    op.drop_index('idx_users_passkey_prompt', table_name='users')

    # 2. 移除 passkey_prompt_skip_count 欄位
    op.drop_column('users', 'passkey_prompt_skip_count')

    # 3. 移除 passkey_prompt_skipped_at 欄位
    op.drop_column('users', 'passkey_prompt_skipped_at')
