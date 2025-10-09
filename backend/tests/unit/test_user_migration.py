"""
Task 25: 資料庫遷移測試
測試 Alembic 遷移腳本的正確性和完整性
"""

import pytest
from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import AsyncSession
from alembic.config import Config
from alembic import command
from app.models.user import User
from app.models.social_features import KarmaHistory
from datetime import datetime, timezone


class TestUserTableMigration:
    """測試 users 表遷移"""

    @pytest.mark.asyncio
    async def test_users_table_exists(self, db_session: AsyncSession):
        """測試 users 表存在"""
        inspector = inspect(db_session.bind)
        tables = await db_session.run_sync(lambda sync_session: inspector.get_table_names())

        assert "users" in tables

    @pytest.mark.asyncio
    async def test_users_table_has_oauth_columns(self, db_session: AsyncSession):
        """測試 users 表包含 OAuth 相關欄位"""
        inspector = inspect(db_session.bind)
        columns = await db_session.run_sync(
            lambda sync_session: inspector.get_columns("users")
        )
        column_names = [col["name"] for col in columns]

        # OAuth 欄位
        assert "oauth_provider" in column_names
        assert "oauth_id" in column_names
        assert "is_oauth_user" in column_names

    @pytest.mark.asyncio
    async def test_users_table_has_email_column(self, db_session: AsyncSession):
        """測試 users 表有 email 欄位（取代 username 登入）"""
        inspector = inspect(db_session.bind)
        columns = await db_session.run_sync(
            lambda sync_session: inspector.get_columns("users")
        )
        column_names = [col["name"] for col in columns]

        assert "email" in column_names

    @pytest.mark.asyncio
    async def test_users_table_has_karma_columns(self, db_session: AsyncSession):
        """測試 users 表有 Karma 相關欄位"""
        inspector = inspect(db_session.bind)
        columns = await db_session.run_sync(
            lambda sync_session: inspector.get_columns("users")
        )
        column_names = [col["name"] for col in columns]

        assert "karma_score" in column_names
        assert "faction_alignment" in column_names

    @pytest.mark.asyncio
    async def test_users_table_password_hash_nullable(self, db_session: AsyncSession):
        """測試 password_hash 可為 NULL（支援 OAuth 使用者）"""
        inspector = inspect(db_session.bind)
        columns = await db_session.run_sync(
            lambda sync_session: inspector.get_columns("users")
        )

        password_hash_col = next(
            (col for col in columns if col["name"] == "password_hash"),
            None
        )

        assert password_hash_col is not None
        assert password_hash_col["nullable"] is True

    @pytest.mark.asyncio
    async def test_users_table_has_unique_constraints(self, db_session: AsyncSession):
        """測試 users 表有唯一性約束"""
        inspector = inspect(db_session.bind)
        constraints = await db_session.run_sync(
            lambda sync_session: inspector.get_unique_constraints("users")
        )

        constraint_columns = [
            set(constraint["column_names"]) for constraint in constraints
        ]

        # Email should be unique
        assert {"email"} in constraint_columns or \
               any("email" in cols for cols in constraint_columns)

    @pytest.mark.asyncio
    async def test_users_table_has_indexes(self, db_session: AsyncSession):
        """測試 users 表有適當的索引"""
        inspector = inspect(db_session.bind)
        indexes = await db_session.run_sync(
            lambda sync_session: inspector.get_indexes("users")
        )

        index_columns = [idx["column_names"] for idx in indexes]

        # Should have index on email for fast lookups
        assert any("email" in cols for cols in index_columns)


class TestOAuthUserMigration:
    """測試 OAuth 使用者遷移"""

    @pytest.mark.asyncio
    async def test_create_oauth_user_without_password(self, db_session: AsyncSession):
        """測試可以建立沒有密碼的 OAuth 使用者"""
        oauth_user = User(
            email="oauth@example.com",
            username="OAuth User",
            oauth_provider="google",
            oauth_id="google_123",
            is_oauth_user=True,
            password_hash=None  # No password
        )

        db_session.add(oauth_user)
        await db_session.commit()

        # Verify creation successful
        await db_session.refresh(oauth_user)
        assert oauth_user.id is not None
        assert oauth_user.password_hash is None

    @pytest.mark.asyncio
    async def test_create_traditional_user_with_password(self, db_session: AsyncSession):
        """測試可以建立有密碼的傳統使用者"""
        traditional_user = User(
            email="traditional@example.com",
            username="Traditional User",
            password_hash="hashed_password_here",
            oauth_provider=None,
            is_oauth_user=False
        )

        db_session.add(traditional_user)
        await db_session.commit()

        # Verify creation successful
        await db_session.refresh(traditional_user)
        assert traditional_user.id is not None
        assert traditional_user.password_hash is not None

    @pytest.mark.asyncio
    async def test_oauth_provider_and_id_combination_unique(self, db_session: AsyncSession):
        """測試 oauth_provider + oauth_id 組合唯一"""
        # Create first OAuth user
        user1 = User(
            email="user1@example.com",
            username="User 1",
            oauth_provider="google",
            oauth_id="google_unique_123",
            is_oauth_user=True
        )
        db_session.add(user1)
        await db_session.commit()

        # Try to create duplicate
        user2 = User(
            email="user2@example.com",
            username="User 2",
            oauth_provider="google",
            oauth_id="google_unique_123",  # Same provider + ID
            is_oauth_user=True
        )
        db_session.add(user2)

        # Should raise constraint violation
        with pytest.raises(Exception):  # IntegrityError or similar
            await db_session.commit()

    @pytest.mark.asyncio
    async def test_hybrid_user_has_both_password_and_oauth(self, db_session: AsyncSession):
        """測試混合使用者（密碼 + OAuth）"""
        hybrid_user = User(
            email="hybrid@example.com",
            username="Hybrid User",
            password_hash="hashed_password",
            oauth_provider="google",
            oauth_id="google_hybrid_456",
            is_oauth_user=False  # Originally traditional
        )

        db_session.add(hybrid_user)
        await db_session.commit()

        # Verify both fields exist
        await db_session.refresh(hybrid_user)
        assert hybrid_user.password_hash is not None
        assert hybrid_user.oauth_provider is not None
        assert hybrid_user.oauth_id is not None


class TestKarmaHistoryMigration:
    """測試 Karma History 表遷移"""

    @pytest.mark.asyncio
    async def test_karma_history_table_exists(self, db_session: AsyncSession):
        """測試 karma_history 表存在"""
        inspector = inspect(db_session.bind)
        tables = await db_session.run_sync(lambda sync_session: inspector.get_table_names())

        assert "karma_history" in tables or "user_karma_history" in tables

    @pytest.mark.asyncio
    async def test_karma_history_has_foreign_key_to_users(self, db_session: AsyncSession):
        """測試 karma_history 有外鍵連結到 users"""
        inspector = inspect(db_session.bind)

        # Get table name (could be karma_history or user_karma_history)
        tables = await db_session.run_sync(lambda sync_session: inspector.get_table_names())
        karma_table = "karma_history" if "karma_history" in tables else "user_karma_history"

        foreign_keys = await db_session.run_sync(
            lambda sync_session: inspector.get_foreign_keys(karma_table)
        )

        # Should have foreign key to users table
        user_fks = [fk for fk in foreign_keys if fk["referred_table"] == "users"]
        assert len(user_fks) > 0

    @pytest.mark.asyncio
    async def test_karma_history_records_oauth_user_flag(self, db_session: AsyncSession):
        """測試 karma_history 可記錄 OAuth 使用者標記"""
        # Create OAuth user
        oauth_user = User(
            email="karma_oauth@example.com",
            username="Karma OAuth User",
            oauth_provider="google",
            oauth_id="google_karma_789",
            is_oauth_user=True,
            karma_score=50
        )
        db_session.add(oauth_user)
        await db_session.commit()

        # Create karma history with action_context
        karma_history = KarmaHistory(
            user_id=oauth_user.id,
            karma_before=0,
            karma_after=50,
            karma_change=50,
            reason="system_initialization",
            action_context={"is_oauth_user": True}  # Track OAuth status
        )

        db_session.add(karma_history)
        await db_session.commit()

        # Verify stored correctly
        await db_session.refresh(karma_history)
        assert karma_history.action_context["is_oauth_user"] is True


class TestMigrationRollback:
    """測試遷移回滾"""

    @pytest.mark.asyncio
    async def test_migration_can_rollback(self):
        """測試遷移可以回滾"""
        # This is a placeholder for actual Alembic rollback testing
        # In practice, you would:
        # 1. Run migrations up to a specific version
        # 2. Verify schema
        # 3. Rollback
        # 4. Verify previous schema restored

        # Example (requires Alembic config):
        # alembic_cfg = Config("alembic.ini")
        # command.upgrade(alembic_cfg, "head")
        # command.downgrade(alembic_cfg, "-1")
        pass

    @pytest.mark.asyncio
    async def test_migration_idempotent(self):
        """測試遷移是冪等的（重複執行不出錯）"""
        # Placeholder for idempotency testing
        # Running same migration twice should not fail
        pass


class TestDataIntegrityAfterMigration:
    """測試遷移後資料完整性"""

    @pytest.mark.asyncio
    async def test_existing_users_preserve_data(self, db_session: AsyncSession):
        """測試現有使用者資料在遷移後保留"""
        # Create traditional user before "migration"
        user = User(
            email="preserve@example.com",
            username="Preserve User",
            password_hash="hashed_password",
            karma_score=75,
            faction_alignment="ncr"
        )
        db_session.add(user)
        await db_session.commit()
        user_id = user.id

        # Simulate reading after migration
        await db_session.refresh(user)

        # All data should be preserved
        assert user.email == "preserve@example.com"
        assert user.password_hash == "hashed_password"
        assert user.karma_score == 75
        assert user.faction_alignment == "ncr"

        # New OAuth fields should be NULL
        assert user.oauth_provider is None
        assert user.oauth_id is None

    @pytest.mark.asyncio
    async def test_default_values_for_new_columns(self, db_session: AsyncSession):
        """測試新欄位的預設值"""
        user = User(
            email="defaults@example.com",
            username="Defaults User",
            password_hash="hashed_password"
            # Don't specify oauth fields
        )
        db_session.add(user)
        await db_session.commit()

        await db_session.refresh(user)

        # OAuth fields should default to NULL
        assert user.oauth_provider is None
        assert user.oauth_id is None
        assert user.is_oauth_user is False  # Should default to False

    @pytest.mark.asyncio
    async def test_email_uniqueness_enforced(self, db_session: AsyncSession):
        """測試 email 唯一性約束強制執行"""
        # Create first user
        user1 = User(
            email="unique@example.com",
            username="User 1",
            password_hash="password1"
        )
        db_session.add(user1)
        await db_session.commit()

        # Try to create duplicate email
        user2 = User(
            email="unique@example.com",  # Same email
            username="User 2",
            password_hash="password2"
        )
        db_session.add(user2)

        # Should raise constraint violation
        with pytest.raises(Exception):
            await db_session.commit()


class TestMigrationPerformance:
    """測試遷移效能"""

    @pytest.mark.asyncio
    async def test_indexes_improve_query_performance(self, db_session: AsyncSession):
        """測試索引提升查詢效能"""
        # Create many users
        users = [
            User(
                email=f"user{i}@example.com",
                username=f"User {i}",
                password_hash="password"
            )
            for i in range(100)
        ]
        db_session.add_all(users)
        await db_session.commit()

        # Query by email should be fast (uses index)
        import time

        start = time.time()
        result = await db_session.execute(
            text("SELECT * FROM users WHERE email = :email"),
            {"email": "user50@example.com"}
        )
        user = result.first()
        duration = time.time() - start

        assert user is not None
        # Should complete quickly (< 100ms for indexed query)
        assert duration < 0.1

    @pytest.mark.asyncio
    async def test_foreign_key_indexes_exist(self, db_session: AsyncSession):
        """測試外鍵有對應索引（提升 JOIN 效能）"""
        inspector = inspect(db_session.bind)

        # Get karma_history table name
        tables = await db_session.run_sync(lambda sync_session: inspector.get_table_names())
        karma_table = "karma_history" if "karma_history" in tables else "user_karma_history"

        indexes = await db_session.run_sync(
            lambda sync_session: inspector.get_indexes(karma_table)
        )

        index_columns = [idx["column_names"] for idx in indexes]

        # Should have index on user_id for fast JOINs
        assert any("user_id" in cols for cols in index_columns)


class TestMigrationDocumentation:
    """測試遷移文件和版本"""

    def test_migration_files_have_docstrings(self):
        """測試遷移文件有說明文件"""
        import os
        from pathlib import Path

        # Get migration directory
        backend_dir = Path(__file__).parent.parent.parent
        migrations_dir = backend_dir / "alembic" / "versions"

        if migrations_dir.exists():
            migration_files = list(migrations_dir.glob("*.py"))

            for migration_file in migration_files:
                if migration_file.name == "__init__.py":
                    continue

                content = migration_file.read_text()

                # Should have docstring or comment explaining migration
                assert '"""' in content or "'''" in content or \
                       "# " in content, f"{migration_file.name} lacks documentation"

    def test_migration_version_numbers_sequential(self):
        """測試遷移版本號碼連續"""
        # This would check that migration revision IDs are properly linked
        # Requires reading Alembic migration files
        pass
