"""
APScheduler 整合測試

需求對應: 需求 8.1, 8.2, 8.3, 8.4
Tasks: 9, 10, 11, 12
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from datetime import date


class TestSchedulerIntegration:
    """測試排程器整合"""

    def test_scheduler_initialization(self):
        """
        測試排程器初始化
        Task 9: 配置 APScheduler
        """
        from app.core.scheduler import get_scheduler

        scheduler = get_scheduler()

        assert scheduler is not None
        assert hasattr(scheduler, 'add_job')
        assert hasattr(scheduler, 'start')

    def test_cron_job_registration(self):
        """
        測試 Cron 任務註冊
        Task 9: 任務註冊機制
        """
        from app.core.scheduler import register_cron_job, get_scheduler

        scheduler = get_scheduler()

        def dummy_job():
            return "test"

        job_id = register_cron_job(
            scheduler,
            dummy_job,
            job_id='test-job',
            cron_expression='0 0 * * *'
        )

        assert job_id == 'test-job'

        # 清理
        scheduler.remove_job('test-job')

    @patch('app.services.daily_number_generator_service.DailyNumberGeneratorService')
    def test_daily_number_job_execution(self, mock_service):
        """
        測試每日號碼生成任務
        Task 10: 每日號碼生成定時任務
        """
        from app.jobs.daily_number_job import get_job_metadata

        metadata = get_job_metadata()

        assert metadata['job_id'] == 'daily-number-generation'
        assert metadata['cron'] == '0 0 * * *'
        assert metadata['retry_limit'] == 3

    def test_monthly_reset_job_metadata(self):
        """
        測試每月重置任務元資料
        Task 11: 每月重置排程器
        """
        from app.jobs.monthly_reset_job import get_job_metadata

        metadata = get_job_metadata()

        assert metadata['job_id'] == 'monthly-reset'
        assert metadata['cron'] == '0 0 1 * *'
        assert metadata['timezone'] == 'Asia/Taipei'

    def test_job_retry_configuration(self):
        """
        測試任務重試配置
        需求 8.4: 錯誤處理與重試
        """
        from app.core.scheduler import get_job_config

        config = get_job_config('daily-number-generation')

        assert config['retryLimit'] == 3
        assert config['retryDelay'] == 60
        assert config['retryBackoff'] == 2


@pytest.mark.asyncio
class TestMonthlyResetScheduler:
    """測試每月重置排程器"""

    @pytest.fixture
    async def mock_db(self):
        """模擬資料庫 session"""
        mock = AsyncMock()
        return mock

    async def test_monthly_reset_initialization(self, mock_db):
        """
        測試每月重置排程器初始化
        Task 11: 實作每月重置排程器
        """
        from app.services.monthly_reset_scheduler import MonthlyResetScheduler

        scheduler = MonthlyResetScheduler(mock_db)

        assert scheduler.db == mock_db

    async def test_partition_creation_logic(self, mock_db):
        """
        測試分區建立邏輯
        Task 12: 實作自動分區建立任務
        """
        from app.services.monthly_reset_scheduler import MonthlyResetScheduler

        scheduler = MonthlyResetScheduler(mock_db)

        # 模擬執行成功
        mock_db.execute = AsyncMock()
        mock_db.commit = AsyncMock()

        result = await scheduler.create_next_month_partition(date.today())

        # 驗證執行
        assert mock_db.execute.called
        assert mock_db.commit.called
