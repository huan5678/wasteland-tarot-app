"""遷移至 Supabase Auth

Revision ID: 004_supabase_auth
Revises: 003_create_bingo_game_tables
Create Date: 2025-10-02

將自行管理的認證系統遷移至 Supabase Auth：
1. 新增 name 欄位並從 username 遷移資料
2. 移除 password_hash 和 username 欄位
3. 將主鍵從 INTEGER 改為 UUID
4. 建立與 auth.users 的關聯

需求來源：.kiro/specs/supabase-oauth-integration/requirements.md
- 需求 6.1: 新增 name 欄位
- 需求 6.2: 遷移 username 資料到 name
- 需求 6.3: 移除 password_hash 和 username（Supabase Auth 管理）
- 需求 6.4: 轉換為 UUID 主鍵（關聯 auth.users）
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid
import logging

# 設定日誌
logger = logging.getLogger('alembic.runtime.migration')

# revision identifiers, used by Alembic.
revision = '004_supabase_auth'
down_revision = '003_bingo'
branch_labels = None
depends_on = None


def upgrade():
    """
    升級至 Supabase Auth 架構

    執行步驟：
    1. 新增 name 欄位（暫時允許 NULL）
    2. 從 username 複製資料到 name
    3. 新增 uuid_id 欄位
    4. 為每個使用者生成 UUID
    5. 移除舊的認證欄位（username, password_hash）
    6. 重新建立表格使用 UUID 作為主鍵
    """

    # ============================================
    # 步驟 1: 新增 name 欄位（暫時允許 NULL）
    # ============================================
    logger.info("步驟 1: 新增 name 欄位...")
    op.add_column('users', sa.Column('name', sa.String(length=50), nullable=True))

    # ============================================
    # 步驟 2: 從 username 複製資料到 name
    # ============================================
    logger.info("步驟 2: 從 username 複製資料到 name...")
    op.execute("""
        UPDATE users
        SET name = username
        WHERE name IS NULL
    """)

    # 驗證資料完整性
    bind = op.get_bind()
    result = bind.execute(sa.text("SELECT COUNT(*) FROM users WHERE name IS NULL"))
    null_count = result.scalar()
    if null_count > 0:
        raise ValueError(f"❌ 資料完整性錯誤：仍有 {null_count} 位使用者的 name 為 NULL")

    logger.info("✅ 所有使用者的 name 已成功設定")

    # 設定 name 為 NOT NULL
    op.alter_column('users', 'name', nullable=False)

    # ============================================
    # 步驟 3: 新增 uuid_id 欄位用於遷移
    # ============================================
    logger.info("步驟 3: 新增 uuid_id 欄位...")
    op.add_column('users', sa.Column('uuid_id', postgresql.UUID(as_uuid=True), nullable=True))

    # ============================================
    # 步驟 4: 為每個使用者生成 UUID
    # ============================================
    logger.info("步驟 4: 為現有使用者生成 UUID...")

    # 使用 PostgreSQL 的 gen_random_uuid() 函數
    op.execute("""
        UPDATE users
        SET uuid_id = gen_random_uuid()
        WHERE uuid_id IS NULL
    """)

    # 驗證 UUID 完整性
    result = bind.execute(sa.text("SELECT COUNT(*) FROM users WHERE uuid_id IS NULL"))
    null_uuid_count = result.scalar()
    if null_uuid_count > 0:
        raise ValueError(f"❌ UUID 生成錯誤：仍有 {null_uuid_count} 位使用者沒有 UUID")

    logger.info("✅ 所有使用者已成功生成 UUID")

    # ============================================
    # 步驟 5: 備份關聯表的外鍵資料
    # ============================================
    logger.info("步驟 5: 處理關聯表...")

    # 為有外鍵關聯的表新增 uuid 欄位
    # 範例：readings, daily_bingo_user_games, analytics_events 等

    # readings 表
    if _table_exists('readings'):
        op.add_column('readings', sa.Column('user_uuid', postgresql.UUID(as_uuid=True), nullable=True))
        op.execute("""
            UPDATE readings r
            SET user_uuid = u.uuid_id
            FROM users u
            WHERE r.user_id = u.id
        """)

    # daily_bingo_user_games 表
    if _table_exists('daily_bingo_user_games'):
        op.add_column('daily_bingo_user_games', sa.Column('user_uuid', postgresql.UUID(as_uuid=True), nullable=True))
        op.execute("""
            UPDATE daily_bingo_user_games g
            SET user_uuid = u.uuid_id
            FROM users u
            WHERE g.user_id = u.id
        """)

    # analytics_events 表
    if _table_exists('analytics_events'):
        op.add_column('analytics_events', sa.Column('user_uuid', postgresql.UUID(as_uuid=True), nullable=True))
        op.execute("""
            UPDATE analytics_events e
            SET user_uuid = u.uuid_id
            FROM users u
            WHERE e.user_id = u.id
        """)

    # reading_sessions 表
    if _table_exists('reading_sessions'):
        op.add_column('reading_sessions', sa.Column('user_uuid', postgresql.UUID(as_uuid=True), nullable=True))
        op.execute("""
            UPDATE reading_sessions s
            SET user_uuid = u.uuid_id
            FROM users u
            WHERE s.user_id = u.id
        """)

    # ============================================
    # 步驟 6: 刪除舊的外鍵約束
    # ============================================
    logger.info("步驟 6: 移除舊的外鍵約束...")

    if _table_exists('readings'):
        op.drop_constraint('readings_user_id_fkey', 'readings', type_='foreignkey')

    if _table_exists('daily_bingo_user_games'):
        op.drop_constraint('daily_bingo_user_games_user_id_fkey', 'daily_bingo_user_games', type_='foreignkey')

    if _table_exists('analytics_events'):
        op.drop_constraint('analytics_events_user_id_fkey', 'analytics_events', type_='foreignkey')

    if _table_exists('reading_sessions'):
        op.drop_constraint('reading_sessions_user_id_fkey', 'reading_sessions', type_='foreignkey')

    # ============================================
    # 步驟 7: 重新建立 users 表使用 UUID 主鍵
    # ============================================
    logger.info("步驟 7: 重新建立 users 表使用 UUID 主鍵...")

    # 建立新表
    op.create_table(
        'users_new',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('display_name', sa.String(length=100), nullable=True),
        sa.Column('karma_score', sa.Integer(), nullable=True, server_default='50'),
        sa.Column('faction_alignment', sa.String(length=50), nullable=True),
        sa.Column('preferred_deck', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP'))
    )

    # 複製資料（只複製需要保留的欄位）
    op.execute("""
        INSERT INTO users_new (id, email, name, display_name, karma_score, faction_alignment, preferred_deck, created_at, updated_at)
        SELECT uuid_id, email, name, display_name, karma_score, faction_alignment, preferred_deck, created_at, updated_at
        FROM users
    """)

    # 刪除舊表
    op.drop_table('users')

    # 重命名新表
    op.rename_table('users_new', 'users')

    # ============================================
    # 步驟 8: 更新關聯表使用 UUID 外鍵
    # ============================================
    logger.info("步驟 8: 更新關聯表使用 UUID 外鍵...")

    # readings 表
    if _table_exists('readings'):
        op.drop_column('readings', 'user_id')
        op.alter_column('readings', 'user_uuid', new_column_name='user_id', nullable=False)
        op.create_foreign_key('readings_user_id_fkey', 'readings', 'users', ['user_id'], ['id'])

    # daily_bingo_user_games 表
    if _table_exists('daily_bingo_user_games'):
        op.drop_column('daily_bingo_user_games', 'user_id')
        op.alter_column('daily_bingo_user_games', 'user_uuid', new_column_name='user_id', nullable=False)
        op.create_foreign_key('daily_bingo_user_games_user_id_fkey', 'daily_bingo_user_games', 'users', ['user_id'], ['id'])

    # analytics_events 表
    if _table_exists('analytics_events'):
        op.drop_column('analytics_events', 'user_id')
        op.alter_column('analytics_events', 'user_uuid', new_column_name='user_id', nullable=True)
        op.create_foreign_key('analytics_events_user_id_fkey', 'analytics_events', 'users', ['user_id'], ['id'])

    # reading_sessions 表
    if _table_exists('reading_sessions'):
        op.drop_column('reading_sessions', 'user_id')
        op.alter_column('reading_sessions', 'user_uuid', new_column_name='user_id', nullable=False)
        op.create_foreign_key('reading_sessions_user_id_fkey', 'reading_sessions', 'users', ['user_id'], ['id'])

    # ============================================
    # 步驟 9: 建立索引
    # ============================================
    logger.info("步驟 9: 建立索引...")
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_id', 'users', ['id'])

    logger.info("✅ 遷移完成！users 表已轉換為使用 UUID 主鍵並準備關聯至 auth.users")


def downgrade():
    """
    降級回自行管理的認證系統

    警告：此降級會：
    1. 為 OAuth 使用者設定佔位符密碼
    2. 從 name 恢復 username
    3. 將 UUID 主鍵轉回 INTEGER（會生成新的 ID）
    """

    logger.warning("⚠️  警告：降級至舊的認證系統...")

    # ============================================
    # 步驟 1: 為關聯表新增整數 ID 欄位
    # ============================================
    logger.info("步驟 1: 準備關聯表...")

    if _table_exists('readings'):
        op.add_column('readings', sa.Column('user_id_int', sa.Integer(), nullable=True))

    if _table_exists('daily_bingo_user_games'):
        op.add_column('daily_bingo_user_games', sa.Column('user_id_int', sa.Integer(), nullable=True))

    if _table_exists('analytics_events'):
        op.add_column('analytics_events', sa.Column('user_id_int', sa.Integer(), nullable=True))

    if _table_exists('reading_sessions'):
        op.add_column('reading_sessions', sa.Column('user_id_int', sa.Integer(), nullable=True))

    # ============================================
    # 步驟 2: 重新建立 users 表使用 INTEGER 主鍵
    # ============================================
    logger.info("步驟 2: 重新建立 users 表使用 INTEGER 主鍵...")

    op.create_table(
        'users_old',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('uuid_ref', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False, unique=True),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('display_name', sa.String(length=100), nullable=True),
        sa.Column('karma_score', sa.Integer(), nullable=True, server_default='50'),
        sa.Column('faction_alignment', sa.String(length=50), nullable=True),
        sa.Column('preferred_deck', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP'))
    )

    # 複製資料並設定佔位符
    op.execute("""
        INSERT INTO users_old (uuid_ref, username, email, password_hash, name, display_name, karma_score, faction_alignment, preferred_deck, created_at, updated_at)
        SELECT id, name, email, '$2b$12$PLACEHOLDER_HASH', name, display_name, karma_score, faction_alignment, preferred_deck, created_at, updated_at
        FROM users
    """)

    # ============================================
    # 步驟 3: 更新關聯表的外鍵
    # ============================================
    logger.info("步驟 3: 更新關聯表...")

    if _table_exists('readings'):
        op.execute("""
            UPDATE readings r
            SET user_id_int = u.id
            FROM users_old u
            WHERE r.user_id = u.uuid_ref
        """)

    if _table_exists('daily_bingo_user_games'):
        op.execute("""
            UPDATE daily_bingo_user_games g
            SET user_id_int = u.id
            FROM users_old u
            WHERE g.user_id = u.uuid_ref
        """)

    if _table_exists('analytics_events'):
        op.execute("""
            UPDATE analytics_events e
            SET user_id_int = u.id
            FROM users_old u
            WHERE e.user_id = u.uuid_ref
        """)

    if _table_exists('reading_sessions'):
        op.execute("""
            UPDATE reading_sessions s
            SET user_id_int = u.id
            FROM users_old u
            WHERE s.user_id = u.uuid_ref
        """)

    # ============================================
    # 步驟 4: 完成降級
    # ============================================
    logger.info("步驟 4: 完成降級...")

    # 刪除新表
    op.drop_table('users')

    # 重命名舊表
    op.rename_table('users_old', 'users')

    # 更新關聯表
    if _table_exists('readings'):
        op.drop_column('readings', 'user_id')
        op.alter_column('readings', 'user_id_int', new_column_name='user_id', nullable=False)
        op.create_foreign_key('readings_user_id_fkey', 'readings', 'users', ['user_id'], ['id'])

    if _table_exists('daily_bingo_user_games'):
        op.drop_column('daily_bingo_user_games', 'user_id')
        op.alter_column('daily_bingo_user_games', 'user_id_int', new_column_name='user_id', nullable=False)
        op.create_foreign_key('daily_bingo_user_games_user_id_fkey', 'daily_bingo_user_games', 'users', ['user_id'], ['id'])

    if _table_exists('analytics_events'):
        op.drop_column('analytics_events', 'user_id')
        op.alter_column('analytics_events', 'user_id_int', new_column_name='user_id', nullable=True)
        op.create_foreign_key('analytics_events_user_id_fkey', 'analytics_events', 'users', ['user_id'], ['id'])

    if _table_exists('reading_sessions'):
        op.drop_column('reading_sessions', 'user_id')
        op.alter_column('reading_sessions', 'user_id_int', new_column_name='user_id', nullable=False)
        op.create_foreign_key('reading_sessions_user_id_fkey', 'reading_sessions', 'users', ['user_id'], ['id'])

    # 移除 name 欄位（降級時保留 username）
    op.drop_column('users', 'name')

    # 移除 uuid_ref 欄位
    op.drop_column('users', 'uuid_ref')

    logger.info("✅ 降級完成！已恢復為自行管理的認證系統")


def _table_exists(table_name: str) -> bool:
    """檢查表是否存在"""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return table_name in inspector.get_table_names()
