"""
Task 23: 後端單元測試 - 重試邏輯測試
測試重試邏輯模組
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock
from app.core.retry import (
    RetryConfig,
    retry_async,
    with_retry,
    OAUTH_RETRY_CONFIG,
    SUPABASE_RETRY_CONFIG,
    DATABASE_RETRY_CONFIG
)


class TestRetryConfig:
    """測試 RetryConfig 類別"""

    def test_default_config(self):
        """測試預設配置"""
        config = RetryConfig()

        assert config.max_attempts == 3
        assert config.initial_delay == 0.5
        assert config.max_delay == 10.0
        assert config.exponential_base == 2.0
        assert config.exceptions == (Exception,)

    def test_custom_config(self):
        """測試自訂配置"""
        config = RetryConfig(
            max_attempts=5,
            initial_delay=1.0,
            max_delay=20.0,
            exponential_base=3.0,
            exceptions=(ValueError, TypeError)
        )

        assert config.max_attempts == 5
        assert config.initial_delay == 1.0
        assert config.max_delay == 20.0
        assert config.exponential_base == 3.0
        assert config.exceptions == (ValueError, TypeError)


class TestRetryAsync:
    """測試 retry_async 函式"""

    @pytest.mark.asyncio
    async def test_successful_first_attempt(self):
        """測試第一次嘗試成功"""
        mock_func = AsyncMock(return_value="success")

        result = await retry_async(mock_func)

        assert result == "success"
        assert mock_func.call_count == 1

    @pytest.mark.asyncio
    async def test_retry_on_exception(self):
        """測試遇到例外時重試"""
        mock_func = AsyncMock(side_effect=[
            ConnectionError("First failure"),
            ConnectionError("Second failure"),
            "success"
        ])

        config = RetryConfig(
            max_attempts=3,
            initial_delay=0.01,  # 縮短延遲以加快測試
            exceptions=(ConnectionError,)
        )

        result = await retry_async(mock_func, config)

        assert result == "success"
        assert mock_func.call_count == 3

    @pytest.mark.asyncio
    async def test_max_attempts_exceeded(self):
        """測試超過最大重試次數"""
        mock_func = AsyncMock(side_effect=ConnectionError("Persistent failure"))

        config = RetryConfig(
            max_attempts=3,
            initial_delay=0.01,
            exceptions=(ConnectionError,)
        )

        with pytest.raises(ConnectionError, match="Persistent failure"):
            await retry_async(mock_func, config)

        assert mock_func.call_count == 3

    @pytest.mark.asyncio
    async def test_exponential_backoff(self):
        """測試指數退避延遲"""
        mock_func = AsyncMock(side_effect=[
            ValueError("Attempt 1"),
            ValueError("Attempt 2"),
            "success"
        ])

        config = RetryConfig(
            max_attempts=3,
            initial_delay=0.1,
            exponential_base=2.0,
            exceptions=(ValueError,)
        )

        start_time = asyncio.get_event_loop().time()
        result = await retry_async(mock_func, config)
        end_time = asyncio.get_event_loop().time()

        assert result == "success"
        # 第 1 次重試: 0.1s, 第 2 次重試: 0.2s = 總計至少 0.3s
        assert (end_time - start_time) >= 0.3

    @pytest.mark.asyncio
    async def test_max_delay_limit(self):
        """測試最大延遲限制"""
        mock_func = AsyncMock(side_effect=[
            ValueError("Attempt 1"),
            ValueError("Attempt 2"),
            "success"
        ])

        config = RetryConfig(
            max_attempts=3,
            initial_delay=10.0,
            max_delay=0.2,  # 最大延遲限制
            exponential_base=2.0,
            exceptions=(ValueError,)
        )

        start_time = asyncio.get_event_loop().time()
        result = await retry_async(mock_func, config)
        end_time = asyncio.get_event_loop().time()

        assert result == "success"
        # 延遲被限制在 0.2s * 2 = 0.4s
        assert (end_time - start_time) < 1.0

    @pytest.mark.asyncio
    async def test_only_retry_specified_exceptions(self):
        """測試只重試指定的例外"""
        mock_func = AsyncMock(side_effect=TypeError("Not retryable"))

        config = RetryConfig(
            max_attempts=3,
            initial_delay=0.01,
            exceptions=(ValueError,)  # 只重試 ValueError
        )

        with pytest.raises(TypeError, match="Not retryable"):
            await retry_async(mock_func, config)

        assert mock_func.call_count == 1  # 不重試


class TestWithRetryDecorator:
    """測試 with_retry 裝飾器"""

    @pytest.mark.asyncio
    async def test_decorator_success(self):
        """測試裝飾器成功情境"""
        @with_retry(RetryConfig(max_attempts=3, initial_delay=0.01))
        async def decorated_func():
            return "decorated success"

        result = await decorated_func()
        assert result == "decorated success"

    @pytest.mark.asyncio
    async def test_decorator_with_retry(self):
        """測試裝飾器重試情境"""
        call_count = 0

        @with_retry(RetryConfig(max_attempts=3, initial_delay=0.01))
        async def decorated_func():
            nonlocal call_count
            call_count += 1
            if call_count < 2:
                raise ConnectionError("Retry needed")
            return "success after retry"

        result = await decorated_func()
        assert result == "success after retry"
        assert call_count == 2


class TestPredefinedConfigs:
    """測試預定義配置"""

    def test_oauth_retry_config(self):
        """測試 OAUTH_RETRY_CONFIG"""
        assert OAUTH_RETRY_CONFIG.max_attempts == 3
        assert OAUTH_RETRY_CONFIG.initial_delay == 1.0
        assert OAUTH_RETRY_CONFIG.max_delay == 5.0
        assert OAUTH_RETRY_CONFIG.exponential_base == 2.0
        assert ConnectionError in OAUTH_RETRY_CONFIG.exceptions
        assert TimeoutError in OAUTH_RETRY_CONFIG.exceptions

    def test_supabase_retry_config(self):
        """測試 SUPABASE_RETRY_CONFIG"""
        assert SUPABASE_RETRY_CONFIG.max_attempts == 3
        assert SUPABASE_RETRY_CONFIG.initial_delay == 0.5
        assert SUPABASE_RETRY_CONFIG.max_delay == 3.0
        assert ConnectionError in SUPABASE_RETRY_CONFIG.exceptions
        assert TimeoutError in SUPABASE_RETRY_CONFIG.exceptions

    def test_database_retry_config(self):
        """測試 DATABASE_RETRY_CONFIG"""
        assert DATABASE_RETRY_CONFIG.max_attempts == 2
        assert DATABASE_RETRY_CONFIG.initial_delay == 0.2
        assert DATABASE_RETRY_CONFIG.max_delay == 1.0
        assert ConnectionError in DATABASE_RETRY_CONFIG.exceptions
