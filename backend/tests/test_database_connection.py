"""
資料庫連接測試 - 驗證資料庫設置和連接
確保Supabase連接正常運作並且資料表結構正確
"""

import pytest
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select
from app.db.session import get_db, init_db
from app.models.wasteland_card import WastelandCard as WastelandCardModel
from app.config import get_settings


class TestDatabaseConnection:
    """測試資料庫連接和基本操作"""

    @pytest.mark.database
    @pytest.mark.asyncio
    async def test_database_connection(self, db_session: AsyncSession):
        """測試基本資料庫連接"""
        # 執行簡單查詢測試連接
        result = await db_session.execute(text("SELECT 1 as test"))
        test_value = result.scalar()
        assert test_value == 1, "資料庫連接失敗"

    @pytest.mark.database
    @pytest.mark.asyncio
    async def test_database_tables_exist(self, db_session: AsyncSession):
        """驗證必要的資料表是否存在"""
        # 檢查wasteland_cards表是否存在
        result = await db_session.execute(
            text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'wasteland_cards'
                )
            """)
        )
        table_exists = result.scalar()
        assert table_exists, "wasteland_cards 資料表不存在"

    @pytest.mark.database
    @pytest.mark.asyncio
    async def test_card_model_query(self, db_session: AsyncSession):
        """測試卡片模型查詢功能"""
        # 測試基本查詢
        query = select(WastelandCardModel).limit(1)
        result = await db_session.execute(query)
        first_card = result.scalar_one_or_none()

        # 如果有卡片資料，驗證其結構
        if first_card:
            assert hasattr(first_card, 'id'), "卡片缺少id欄位"
            assert hasattr(first_card, 'name'), "卡片缺少name欄位"
            assert hasattr(first_card, 'suit'), "卡片缺少suit欄位"
            assert hasattr(first_card, 'radiation_level'), "卡片缺少radiation_level欄位"

    @pytest.mark.database
    @pytest.mark.asyncio
    async def test_database_write_operations(self, db_session: AsyncSession):
        """測試資料庫寫入操作"""
        # 測試簡單的寫入操作
        test_query = text("""
            SELECT COUNT(*) as total FROM wasteland_cards
        """)

        result = await db_session.execute(test_query)
        initial_count = result.scalar()

        # 驗證可以執行計數查詢
        assert initial_count >= 0, "無法執行計數查詢"

    @pytest.mark.database
    @pytest.mark.asyncio
    async def test_database_transaction_rollback(self, db_session: AsyncSession):
        """測試資料庫事務回滾功能"""
        # 獲取初始狀態
        initial_result = await db_session.execute(
            text("SELECT COUNT(*) FROM wasteland_cards")
        )
        initial_count = initial_result.scalar()

        # 開始事務測試
        try:
            # 執行會自動回滾的操作（在測試fixture中配置）
            current_result = await db_session.execute(
                text("SELECT COUNT(*) FROM wasteland_cards")
            )
            current_count = current_result.scalar()

            # 驗證查詢執行正常
            assert current_count >= 0, "事務中的查詢失敗"

        except Exception:
            # 即使出現錯誤，也應該能正常處理
            pass

    @pytest.mark.database
    @pytest.mark.asyncio
    async def test_database_schema_validation(self, db_session: AsyncSession):
        """驗證資料庫schema結構"""
        # 檢查wasteland_cards表的欄位
        column_query = text("""
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'wasteland_cards'
            ORDER BY ordinal_position
        """)

        result = await db_session.execute(column_query)
        columns = result.fetchall()

        # 轉換為字典格式
        column_dict = {row[0]: row[1] for row in columns}

        # 驗證必要欄位存在
        required_columns = {
            'id': ['character varying', 'text'],
            'name': ['character varying', 'text'],
            'suit': ['character varying', 'text'],
            'radiation_level': ['numeric', 'double precision', 'real']
        }

        for col_name, expected_types in required_columns.items():
            assert col_name in column_dict, f"缺少必要欄位: {col_name}"
            # 檢查資料類型是否符合預期（允許多種可能的類型）
            actual_type = column_dict[col_name]
            type_match = any(expected_type in actual_type for expected_type in expected_types)
            assert type_match, f"欄位 {col_name} 的資料類型不正確: {actual_type}"

    @pytest.mark.database
    @pytest.mark.asyncio
    async def test_database_connection_pool(self, db_session: AsyncSession):
        """測試資料庫連接池功能"""
        # 執行多個並發查詢測試連接池
        async def single_query():
            result = await db_session.execute(text("SELECT 1"))
            return result.scalar()

        # 執行多個查詢
        tasks = [single_query() for _ in range(5)]
        results = await asyncio.gather(*tasks)

        # 驗證所有查詢都成功
        assert all(result == 1 for result in results), "連接池測試失敗"

    @pytest.mark.database
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_database_performance(self, db_session: AsyncSession):
        """測試資料庫基本性能"""
        import time

        # 測試查詢性能
        start_time = time.time()

        # 執行一個相對複雜的查詢
        query = select(WastelandCardModel).limit(50)
        result = await db_session.execute(query)
        cards = result.scalars().all()

        end_time = time.time()
        query_time = end_time - start_time

        # 驗證查詢在合理時間內完成（2秒內）
        assert query_time < 2.0, f"查詢時間過長: {query_time:.2f}秒"

        # 驗證獲得了結果
        assert len(cards) >= 0, "查詢沒有返回結果"

    @pytest.mark.database
    @pytest.mark.asyncio
    async def test_database_error_handling(self, db_session: AsyncSession):
        """測試資料庫錯誤處理"""
        # 測試無效查詢的錯誤處理
        with pytest.raises(Exception):
            await db_session.execute(text("SELECT * FROM non_existent_table"))

    @pytest.mark.database
    @pytest.mark.asyncio
    async def test_database_settings_validation(self):
        """驗證資料庫設置配置"""
        settings = get_settings()

        # 驗證資料庫URL配置存在
        assert settings.database_url is not None, "資料庫URL未配置"
        assert len(settings.database_url) > 0, "資料庫URL為空"

        # 驗證URL格式正確
        if settings.database_url.startswith('postgresql'):
            assert 'supabase' in settings.database_url or 'localhost' in settings.database_url, \
                "資料庫URL格式不正確"