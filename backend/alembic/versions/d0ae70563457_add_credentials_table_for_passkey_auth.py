"""add_credentials_table_for_passkey_auth

建立 credentials 資料表以支援 WebAuthn passkey 認證
- 新增 credentials 資料表：儲存 WebAuthn 憑證（passkeys）
- 新增 users.last_login_method 欄位：記錄最後登入方式（"email", "oauth", "passkey"）

Revision ID: d0ae70563457
Revises: a4135f12e393
Create Date: 2025-10-27 20:50:56.851354

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ARRAY


# revision identifiers, used by Alembic.
revision: str = 'd0ae70563457'
down_revision: Union[str, Sequence[str], None] = 'a4135f12e393'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    建立 WebAuthn credentials 資料表和相關欄位（冪等性設計）

    1. 建立 credentials 資料表（如果不存在）
    2. 建立必要索引（如果不存在）
    3. 新增 users.last_login_method 欄位（如果不存在）
    """

    # 取得資料庫連接來執行原生 SQL
    connection = op.get_bind()

    # 1. 建立 credentials 資料表（使用 CREATE TABLE IF NOT EXISTS）
    connection.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS credentials (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            credential_id TEXT NOT NULL UNIQUE,
            public_key TEXT NOT NULL,
            counter BIGINT NOT NULL DEFAULT 0,
            transports TEXT[],
            device_name TEXT,
            aaguid UUID,
            backup_eligible BOOLEAN NOT NULL DEFAULT false,
            backup_state BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_used_at TIMESTAMP
        )
    """))

    # 2. 建立索引（使用 CREATE INDEX IF NOT EXISTS）
    connection.execute(sa.text("""
        CREATE INDEX IF NOT EXISTS idx_credentials_user_id ON credentials(user_id)
    """))
    connection.execute(sa.text("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_credentials_credential_id ON credentials(credential_id)
    """))
    connection.execute(sa.text("""
        CREATE INDEX IF NOT EXISTS idx_credentials_last_used_at ON credentials(last_used_at)
    """))

    # 3. 新增 users.last_login_method 欄位（使用 ADD COLUMN IF NOT EXISTS）
    connection.execute(sa.text("""
        ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_method TEXT
    """))


def downgrade() -> None:
    """
    回滾 WebAuthn credentials 相關變更

    1. 移除 users.last_login_method 欄位
    2. 刪除索引
    3. 刪除 credentials 資料表
    """

    # 1. 移除 users.last_login_method 欄位
    op.drop_column('users', 'last_login_method')

    # 2. 刪除索引（按建立順序反向刪除）
    op.drop_index('idx_credentials_last_used_at', table_name='credentials')
    op.drop_index('idx_credentials_credential_id', table_name='credentials')
    op.drop_index('idx_credentials_user_id', table_name='credentials')

    # 3. 刪除 credentials 資料表
    op.drop_table('credentials')
