"""
pg-boss 排程器設定測試

需求對應: 需求 8.1, 8.2
"""
import pytest
from unittest.mock import Mock, patch
from app.core.scheduler import SchedulerManager


class TestSchedulerSetup:
    """測試 pg-boss 排程器設定與初始化"""

    @pytest.fixture
    def mock_pg_boss(self):
        """模擬 pg-boss 實例"""
        with patch('app.core.scheduler.PgBoss') as mock:
            yield mock

    def test_scheduler_initialization(self, mock_pg_boss):
        """
        測試排程器初始化
        需求 8.1: 配置 pg-boss 連接 PostgreSQL
        """
        manager = SchedulerManager()

        # 驗證 pg-boss 被正確初始化
        assert manager.boss is not None
        mock_pg_boss.assert_called_once()

    def test_scheduler_connection_success(self, mock_pg_boss):
        """
        測試排程器連接成功
        需求 8.1: 驗證 pg-boss 連接成功
        """
        mock_instance = Mock()
        mock_pg_boss.return_value = mock_instance

        manager = SchedulerManager()
        result = manager.connect()

        assert result is True
        mock_instance.start.assert_called_once()

    def test_scheduler_connection_failure(self, mock_pg_boss):
        """
        測試排程器連接失敗處理
        需求 8.4: 錯誤處理與重試
        """
        mock_instance = Mock()
        mock_instance.start.side_effect = Exception("Connection failed")
        mock_pg_boss.return_value = mock_instance

        manager = SchedulerManager()

        with pytest.raises(Exception):
            manager.connect()

    def test_register_job_success(self, mock_pg_boss):
        """
        測試任務註冊機制
        需求 8.2: 任務註冊與排程
        """
        mock_instance = Mock()
        mock_pg_boss.return_value = mock_instance

        manager = SchedulerManager()
        manager.boss = mock_instance

        result = manager.register_job("test-job", Mock())

        assert result is True
        mock_instance.schedule.assert_called_once()

    def test_job_execution_with_retry(self, mock_pg_boss):
        """
        測試任務執行與重試機制
        需求 8.4: 自動重試最多 3 次
        """
        mock_instance = Mock()
        mock_instance.fetch = Mock(return_value={'id': '123', 'name': 'test-job'})
        mock_pg_boss.return_value = mock_instance

        manager = SchedulerManager()
        manager.boss = mock_instance

        # 配置任務應包含重試設定
        job_config = manager.get_job_config("daily-number-generation")

        assert job_config['retryLimit'] == 3
        assert job_config['retryDelay'] > 0
