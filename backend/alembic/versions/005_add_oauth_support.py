"""Add OAuth support to users table

Revision ID: 005_oauth_support
Revises: 004_supabase_auth
Create Date: 2025-10-03

添加 OAuth 認證支援：
1. 新增 password_hash 欄位（支援傳統登入）
2. 新增 oauth_provider 欄位
3. 新增 oauth_id 欄位
4. 新增 profile_picture_url 欄位
5. 建立 OAuth 唯一索引

需求來源：INTEGRATION_SUMMARY.md
- OAuth 使用者可以沒有 password_hash（NULL）
- 傳統使用者可以綁定 OAuth（更新 oauth_provider 和 oauth_id）
- 支援雙重登入：Email+Password 和 OAuth
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import logging

# 設定日誌
logger = logging.getLogger('alembic.runtime.migration')

# revision identifiers, used by Alembic.
revision = '005_oauth_support'
down_revision = '004_supabase_auth'
branch_labels = None
depends_on = None


def upgrade():
    """
    添加 OAuth 支援欄位到 users 表

    執行步驟：
    1. 新增 password_hash 欄位（nullable，支援 OAuth 使用者）
    2. 新增 OAuth 相關欄位
    3. 建立 OAuth 唯一索引
    """

    # ============================================
    # 步驟 1: 新增 password_hash 欄位
    # ============================================
    logger.info("步驟 1: 新增 password_hash 欄位...")
    op.add_column('users', sa.Column('password_hash', sa.String(length=255), nullable=True))

    # ============================================
    # 步驟 2: 新增 OAuth 欄位
    # ============================================
    logger.info("步驟 2: 新增 OAuth 相關欄位...")
    op.add_column('users', sa.Column('oauth_provider', sa.String(length=50), nullable=True))
    op.add_column('users', sa.Column('oauth_id', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('profile_picture_url', sa.String(length=500), nullable=True))

    # ============================================
    # 步驟 3: 建立 OAuth 唯一索引
    # ============================================
    logger.info("步驟 3: 建立 OAuth 唯一索引...")
    # 複合唯一索引：確保同一 OAuth 提供者的使用者 ID 唯一
    # 使用 partial index 只對非 NULL 值建立索引
    op.create_index(
        'ix_users_oauth',
        'users',
        ['oauth_provider', 'oauth_id'],
        unique=True,
        postgresql_where=sa.text('oauth_provider IS NOT NULL AND oauth_id IS NOT NULL')
    )

    logger.info("✅ OAuth 支援已成功添加到 users 表")


def downgrade():
    """
    移除 OAuth 支援欄位

    警告：此降級會：
    1. 移除所有 OAuth 綁定資料
    2. 移除 password_hash 欄位
    """

    logger.warning("⚠️  警告：移除 OAuth 支援...")

    # ============================================
    # 步驟 1: 移除 OAuth 索引
    # ============================================
    logger.info("步驟 1: 移除 OAuth 索引...")
    op.drop_index('ix_users_oauth', table_name='users')

    # ============================================
    # 步驟 2: 移除 OAuth 欄位
    # ============================================
    logger.info("步驟 2: 移除 OAuth 欄位...")
    op.drop_column('users', 'profile_picture_url')
    op.drop_column('users', 'oauth_id')
    op.drop_column('users', 'oauth_provider')

    # ============================================
    # 步驟 3: 移除 password_hash 欄位
    # ============================================
    logger.info("步驟 3: 移除 password_hash 欄位...")
    op.drop_column('users', 'password_hash')

    logger.info("✅ OAuth 支援已成功移除")
