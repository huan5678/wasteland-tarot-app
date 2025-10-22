"""
Test suite for add_share_token migration (Phase 1: Reading Share Link)

TDD Red Phase: 這些測試應該失敗，因為 migration 尚未實作

Requirements tested:
- share_token 欄位存在於 completed_readings 表
- share_token 是 UUID 類型
- share_token 允許 NULL
- share_token 有 UNIQUE 約束
- idx_completed_readings_share_token 索引存在
"""

import pytest
from sqlalchemy import text
from uuid import uuid4
from datetime import datetime


@pytest.mark.asyncio
class TestAddShareTokenMigration:
    """測試 share_token migration 的結構"""

    async def test_share_token_column_exists(self, db_session):
        """測試 share_token 欄位存在於 completed_readings 表"""
        # RED: 這個測試應該失敗，因為欄位尚未建立
        result = await db_session.execute(
            text(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'completed_readings' AND column_name = 'share_token'
                """
            )
        )
        column = result.fetchone()

        assert column is not None, "share_token column should exist in completed_readings table"

    async def test_share_token_is_uuid_type(self, db_session):
        """測試 share_token 是 UUID 類型"""
        # RED: 這個測試應該失敗
        result = await db_session.execute(
            text(
                """
                SELECT data_type
                FROM information_schema.columns
                WHERE table_name = 'completed_readings' AND column_name = 'share_token'
                """
            )
        )
        row = result.fetchone()

        assert row is not None, "share_token column must exist"
        assert row[0].lower() == 'uuid', f"share_token should be UUID type, got {row[0]}"

    async def test_share_token_is_nullable(self, db_session):
        """測試 share_token 允許 NULL"""
        # RED: 這個測試應該失敗
        result = await db_session.execute(
            text(
                """
                SELECT is_nullable
                FROM information_schema.columns
                WHERE table_name = 'completed_readings' AND column_name = 'share_token'
                """
            )
        )
        row = result.fetchone()

        assert row is not None, "share_token column must exist"
        assert row[0] == 'YES', "share_token should allow NULL values"

    async def test_share_token_has_unique_index(self, db_session):
        """測試 share_token 有 UNIQUE 索引"""
        # RED: 這個測試應該失敗
        result = await db_session.execute(
            text(
                """
                SELECT indexname, indexdef
                FROM pg_indexes
                WHERE tablename = 'completed_readings'
                  AND indexdef LIKE '%share_token%'
                  AND indexdef LIKE '%UNIQUE%'
                """
            )
        )
        index = result.fetchone()

        assert index is not None, "share_token should have a UNIQUE index"

    async def test_share_token_index_name(self, db_session):
        """測試索引名稱正確"""
        # RED: 這個測試應該失敗
        result = await db_session.execute(
            text(
                """
                SELECT indexname
                FROM pg_indexes
                WHERE tablename = 'completed_readings'
                  AND indexname LIKE '%share_token%'
                """
            )
        )
        indexes = result.fetchall()

        assert len(indexes) > 0, "Should have at least one index on share_token"


@pytest.mark.asyncio
class TestShareTokenDataOperations:
    """測試 share_token 的資料操作"""

    async def test_insert_reading_without_share_token(self, db_session):
        """測試可以插入沒有 share_token 的 reading (NULL)"""
        # RED: 這個測試應該失敗，因為欄位尚未建立
        reading_id = uuid4()
        user_id = uuid4()

        # 插入一筆沒有 share_token 的 reading
        await db_session.execute(
            text(
                """
                INSERT INTO completed_readings
                (id, user_id, question, character_voice_used, karma_context, created_at, updated_at)
                VALUES
                (:id, :user_id, :question, :character_voice, :karma, :created_at, :updated_at)
                """
            ),
            {
                'id': reading_id,
                'user_id': user_id,
                'question': 'Test question',
                'character_voice': 'ghoul',
                'karma': 'neutral',
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
        )
        await db_session.commit()

        # 驗證插入成功，share_token 為 NULL
        result = await db_session.execute(
            text("SELECT share_token FROM completed_readings WHERE id = :id"),
            {'id': reading_id}
        )
        row = result.fetchone()
        assert row is not None, "Reading should be inserted"
        assert row[0] is None, "share_token should be NULL"

    async def test_insert_reading_with_share_token(self, db_session):
        """測試可以插入有 share_token 的 reading"""
        # RED: 這個測試應該失敗
        reading_id = uuid4()
        user_id = uuid4()
        share_token = uuid4()

        # 插入一筆有 share_token 的 reading
        await db_session.execute(
            text(
                """
                INSERT INTO completed_readings
                (id, user_id, question, character_voice_used, karma_context, share_token, created_at, updated_at)
                VALUES
                (:id, :user_id, :question, :character_voice, :karma, :share_token, :created_at, :updated_at)
                """
            ),
            {
                'id': reading_id,
                'user_id': user_id,
                'question': 'Test question',
                'character_voice': 'ghoul',
                'karma': 'neutral',
                'share_token': share_token,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
        )
        await db_session.commit()

        # 驗證插入成功，share_token 正確
        result = await db_session.execute(
            text("SELECT share_token FROM completed_readings WHERE id = :id"),
            {'id': reading_id}
        )
        row = result.fetchone()
        assert row is not None, "Reading should be inserted"
        assert row[0] == share_token, "share_token should match inserted value"

    async def test_duplicate_share_token_rejected(self, db_session):
        """測試重複的 share_token 會被拒絕 (UNIQUE constraint)"""
        # RED: 這個測試應該失敗
        share_token = uuid4()

        # 插入第一筆 reading
        await db_session.execute(
            text(
                """
                INSERT INTO completed_readings
                (id, user_id, question, character_voice_used, karma_context, share_token, created_at, updated_at)
                VALUES
                (:id, :user_id, :question, :character_voice, :karma, :share_token, :created_at, :updated_at)
                """
            ),
            {
                'id': uuid4(),
                'user_id': uuid4(),
                'question': 'First reading',
                'character_voice': 'ghoul',
                'karma': 'neutral',
                'share_token': share_token,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
        )
        await db_session.commit()

        # 嘗試插入第二筆有相同 share_token 的 reading (應該失敗)
        with pytest.raises(Exception):  # IntegrityError or similar
            await db_session.execute(
                text(
                    """
                    INSERT INTO completed_readings
                    (id, user_id, question, character_voice_used, karma_context, share_token, created_at, updated_at)
                    VALUES
                    (:id, :user_id, :question, :character_voice, :karma, :share_token, :created_at, :updated_at)
                    """
                ),
                {
                    'id': uuid4(),
                    'user_id': uuid4(),
                    'question': 'Second reading with duplicate token',
                    'character_voice': 'ghoul',
                    'karma': 'neutral',
                    'share_token': share_token,  # 重複的 token
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
            )
            await db_session.commit()

    async def test_query_by_share_token(self, db_session):
        """測試用 share_token 查詢"""
        # RED: 這個測試應該失敗
        share_token = uuid4()
        reading_id = uuid4()

        # 插入一筆 reading
        await db_session.execute(
            text(
                """
                INSERT INTO completed_readings
                (id, user_id, question, character_voice_used, karma_context, share_token, created_at, updated_at)
                VALUES
                (:id, :user_id, :question, :character_voice, :karma, :share_token, :created_at, :updated_at)
                """
            ),
            {
                'id': reading_id,
                'user_id': uuid4(),
                'question': 'Test reading',
                'character_voice': 'ghoul',
                'karma': 'neutral',
                'share_token': share_token,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
        )
        await db_session.commit()

        # 用 share_token 查詢
        result = await db_session.execute(
            text("SELECT id FROM completed_readings WHERE share_token = :token"),
            {'token': share_token}
        )
        row = result.fetchone()

        assert row is not None, "Should find reading by share_token"
        assert row[0] == reading_id, "Should return correct reading_id"
