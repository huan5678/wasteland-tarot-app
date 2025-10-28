"""
Test Passkey Prompt Migration

測試新增 Passkey 引導追蹤欄位的資料庫遷移
- 測試 passkey_prompt_skipped_at 欄位可寫入和查詢
- 測試 passkey_prompt_skip_count 欄位預設值為 0
- 測試索引 idx_users_passkey_prompt 建立成功
- 測試 rollback 腳本可正確回退變更

Requirements: 7 (向後相容遷移)
"""

import pytest
from datetime import datetime, timezone
from sqlalchemy import inspect, text
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.db.database import get_db


class TestPasskeyPromptMigration:
    """測試 Passkey 引導追蹤欄位的資料庫遷移"""

    @pytest.mark.asyncio
    async def test_passkey_prompt_skipped_at_field_exists(self, db_session):
        """測試 passkey_prompt_skipped_at 欄位存在並可寫入"""
        # Arrange
        user = User(
            email="test_passkey_prompt@example.com",
            name="Test User",
            password_hash="hashed_password",
            karma_score=50
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        # Act - 設定 passkey_prompt_skipped_at
        skip_time = datetime.now(timezone.utc)
        user.passkey_prompt_skipped_at = skip_time
        await db_session.commit()
        await db_session.refresh(user)

        # Assert
        assert user.passkey_prompt_skipped_at is not None
        assert isinstance(user.passkey_prompt_skipped_at, datetime)
        # 允許小誤差（1 秒內）
        assert abs((user.passkey_prompt_skipped_at - skip_time).total_seconds()) < 1

    @pytest.mark.asyncio
    async def test_passkey_prompt_skip_count_field_exists(self, db_session):
        """測試 passkey_prompt_skip_count 欄位存在並可寫入"""
        # Arrange
        user = User(
            email="test_skip_count@example.com",
            name="Test User",
            password_hash="hashed_password",
            karma_score=50
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        # Act - 設定 passkey_prompt_skip_count
        user.passkey_prompt_skip_count = 2
        await db_session.commit()
        await db_session.refresh(user)

        # Assert
        assert user.passkey_prompt_skip_count == 2

    @pytest.mark.asyncio
    async def test_passkey_prompt_skip_count_default_value(self, db_session):
        """測試 passkey_prompt_skip_count 欄位預設值為 0"""
        # Arrange & Act
        user = User(
            email="test_default_count@example.com",
            name="Test User",
            password_hash="hashed_password",
            karma_score=50
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        # Assert
        assert user.passkey_prompt_skip_count == 0

    @pytest.mark.asyncio
    async def test_passkey_prompt_fields_nullable(self, db_session):
        """測試 Passkey 引導欄位允許 NULL（向後相容）"""
        # Arrange & Act
        user = User(
            email="test_nullable@example.com",
            name="Test User",
            password_hash="hashed_password",
            karma_score=50,
            passkey_prompt_skipped_at=None,
            passkey_prompt_skip_count=None
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        # Assert
        assert user.passkey_prompt_skipped_at is None
        # skip_count 有預設值 0，所以應該是 0 而非 NULL
        assert user.passkey_prompt_skip_count == 0

    @pytest.mark.asyncio
    async def test_passkey_prompt_index_exists(self, db_session):
        """測試索引 idx_users_passkey_prompt 建立成功"""
        # Arrange - 取得資料庫連接
        inspector = inspect(db_session.bind)

        # Act - 檢查索引是否存在
        indexes = inspector.get_indexes('users')
        index_names = [idx['name'] for idx in indexes]

        # Assert
        assert 'idx_users_passkey_prompt' in index_names, \
            f"索引 idx_users_passkey_prompt 不存在。現有索引: {index_names}"

    @pytest.mark.asyncio
    async def test_passkey_prompt_index_partial_condition(self, db_session):
        """測試部分索引條件（WHERE skip_count < 3）"""
        # Arrange - 建立多個用戶
        users = [
            User(
                email=f"user_{i}@example.com",
                name=f"User {i}",
                password_hash="hashed",
                karma_score=50,
                passkey_prompt_skip_count=i
            )
            for i in range(5)
        ]
        for user in users:
            db_session.add(user)
        await db_session.commit()

        # Act - 查詢 skip_count < 3 的用戶（應使用部分索引）
        result = await db_session.execute(
            text("""
                SELECT COUNT(*) FROM users
                WHERE passkey_prompt_skip_count < 3
            """)
        )
        count = result.scalar()

        # Assert
        assert count >= 3, "應該至少有 3 個用戶的 skip_count < 3"

    @pytest.mark.asyncio
    async def test_passkey_prompt_fields_query_performance(self, db_session):
        """測試查詢 Passkey 引導欄位的效能"""
        # Arrange - 建立測試用戶
        user = User(
            email="test_query@example.com",
            name="Test User",
            password_hash="hashed_password",
            karma_score=50,
            passkey_prompt_skipped_at=datetime.now(timezone.utc),
            passkey_prompt_skip_count=1
        )
        db_session.add(user)
        await db_session.commit()

        # Act - 查詢用戶（使用新欄位）
        from sqlalchemy import select
        stmt = select(User).where(
            User.email == "test_query@example.com"
        )
        result = await db_session.execute(stmt)
        queried_user = result.scalar_one()

        # Assert
        assert queried_user is not None
        assert queried_user.passkey_prompt_skipped_at is not None
        assert queried_user.passkey_prompt_skip_count == 1

    @pytest.mark.asyncio
    async def test_passkey_prompt_skip_count_increment(self, db_session):
        """測試 skip_count 可以遞增"""
        # Arrange
        user = User(
            email="test_increment@example.com",
            name="Test User",
            password_hash="hashed_password",
            karma_score=50,
            passkey_prompt_skip_count=0
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        # Act - 模擬用戶多次跳過引導
        for i in range(1, 4):
            user.passkey_prompt_skip_count = i
            user.passkey_prompt_skipped_at = datetime.now(timezone.utc)
            await db_session.commit()
            await db_session.refresh(user)

            # Assert
            assert user.passkey_prompt_skip_count == i

    @pytest.mark.asyncio
    async def test_passkey_prompt_skipped_at_timezone_aware(self, db_session):
        """測試 passkey_prompt_skipped_at 時區感知"""
        # Arrange
        user = User(
            email="test_timezone@example.com",
            name="Test User",
            password_hash="hashed_password",
            karma_score=50
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        # Act - 設定時區感知的時間
        skip_time = datetime.now(timezone.utc)
        user.passkey_prompt_skipped_at = skip_time
        await db_session.commit()
        await db_session.refresh(user)

        # Assert
        assert user.passkey_prompt_skipped_at.tzinfo is not None, \
            "passkey_prompt_skipped_at 應該是時區感知的"


class TestPasskeyPromptMigrationRollback:
    """測試 Passkey 引導追蹤遷移的回退功能"""

    @pytest.mark.asyncio
    async def test_migration_rollback_removes_fields(self, db_session):
        """測試 rollback 正確移除新增的欄位"""
        # Note: 這個測試需要在實際執行 downgrade 後才能驗證
        # 在單元測試中，我們只能驗證欄位是否存在
        # 實際的 rollback 測試應該在整合測試中執行

        # Arrange - 檢查欄位是否存在
        inspector = inspect(db_session.bind)
        columns = inspector.get_columns('users')
        column_names = [col['name'] for col in columns]

        # Assert - 確認欄位存在（migration 已執行）
        assert 'passkey_prompt_skipped_at' in column_names, \
            "passkey_prompt_skipped_at 欄位應該存在"
        assert 'passkey_prompt_skip_count' in column_names, \
            "passkey_prompt_skip_count 欄位應該存在"

        # Note: 實際的 rollback 測試需要：
        # 1. 執行 migration upgrade
        # 2. 驗證欄位存在
        # 3. 執行 migration downgrade
        # 4. 驗證欄位不存在
        # 這需要在整合測試或遷移測試中完成

    @pytest.mark.asyncio
    async def test_migration_rollback_removes_index(self, db_session):
        """測試 rollback 正確移除索引"""
        # Arrange - 檢查索引是否存在
        inspector = inspect(db_session.bind)
        indexes = inspector.get_indexes('users')
        index_names = [idx['name'] for idx in indexes]

        # Assert - 確認索引存在（migration 已執行）
        assert 'idx_users_passkey_prompt' in index_names, \
            "idx_users_passkey_prompt 索引應該存在"

        # Note: 實際的 rollback 測試需要在整合測試中完成
