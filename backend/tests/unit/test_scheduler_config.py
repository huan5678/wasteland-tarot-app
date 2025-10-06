"""
APScheduler 排程器配置測試

需求對應: 需求 8.1, 8.2
Task: Task 9 - 安裝並配置排程器
"""
import pytest
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock


class TestSchedulerConfiguration:
    """測試 APScheduler 排程器配置與初始化"""

    def test_scheduler_initialization(self):
        """
        測試排程器初始化
        需求 8.1: 配置排程器連接 PostgreSQL
        """
        from app.core.scheduler import get_scheduler

        scheduler = get_scheduler()

        assert scheduler is not None
        assert hasattr(scheduler, 'add_job')
        assert hasattr(scheduler, 'start')
        assert hasattr(scheduler, 'shutdown')

    def test_scheduler_jobstore_configured(self):
        """
        測試任務儲存配置
        需求 8.1: Job store 使用 PostgreSQL
        """
        from app.core.scheduler import get_scheduler

        scheduler = get_scheduler()

        # 驗證 jobstore 已配置
        assert 'default' in scheduler._jobstores
        jobstore = scheduler._jobstores['default']

        # 應該是 SQLAlchemyJobStore
        assert jobstore.__class__.__name__ == 'SQLAlchemyJobStore'

    def test_scheduler_start_and_shutdown(self):
        """
        測試排程器啟動與關閉
        需求 8.1: 排程器生命週期管理
        """
        from app.core.scheduler import get_scheduler

        scheduler = get_scheduler()

        # 啟動排程器
        scheduler.start()
        assert scheduler.running is True

        # 關閉排程器
        scheduler.shutdown()
        assert scheduler.running is False

    @patch('app.core.scheduler.BackgroundScheduler')
    def test_scheduler_connection_failure_handling(self, mock_scheduler_class):
        """
        測試排程器連接失敗處理
        需求 8.4: 錯誤處理
        """
        # 模擬連接失敗
        mock_instance = Mock()
        mock_instance.start.side_effect = Exception("Database connection failed")
        mock_scheduler_class.return_value = mock_instance

        from app.core.scheduler import initialize_scheduler

        # 應該拋出適當的錯誤
        with pytest.raises(Exception) as exc_info:
            scheduler = initialize_scheduler()
            scheduler.start()

        assert "connection" in str(exc_info.value).lower()

    def test_job_registration_cron_trigger(self):
        """
        測試 Cron 任務註冊機制
        需求 8.2: 任務註冊與排程
        """
        from app.core.scheduler import register_cron_job

        def dummy_job():
            return "test"

        scheduler = Mock()
        scheduler.add_job = Mock(return_value=Mock(id='test-job-id'))

        result = register_cron_job(
            scheduler,
            job_func=dummy_job,
            job_id="daily-test",
            cron_expression="0 0 * * *"
        )

        # 驗證 add_job 被呼叫
        scheduler.add_job.assert_called_once()
        assert result is not None

    def test_scheduler_timezone_utc8(self):
        """
        測試排程器時區配置為 UTC+8
        需求 8.1: 時區配置
        """
        from app.core.scheduler import get_scheduler
        import pytz

        scheduler = get_scheduler()

        # 檢查時區設定
        timezone = scheduler.timezone
        expected_tz = pytz.timezone('Asia/Taipei')  # UTC+8

        assert str(timezone) == str(expected_tz)
