"""
Retry utilities for network operations and external service calls
Task 28: 網路錯誤重試邏輯
"""

import asyncio
import logging
from typing import TypeVar, Callable, Any, Optional
from functools import wraps

logger = logging.getLogger(__name__)

T = TypeVar('T')


class RetryConfig:
    """Configuration for retry behavior"""

    def __init__(
        self,
        max_attempts: int = 3,
        initial_delay: float = 0.5,
        max_delay: float = 10.0,
        exponential_base: float = 2.0,
        exceptions: tuple = (Exception,)
    ):
        """
        Args:
            max_attempts: Maximum number of retry attempts
            initial_delay: Initial delay in seconds before first retry
            max_delay: Maximum delay between retries
            exponential_base: Base for exponential backoff (2.0 = double delay each time)
            exceptions: Tuple of exceptions to catch and retry
        """
        self.max_attempts = max_attempts
        self.initial_delay = initial_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.exceptions = exceptions


async def retry_async(
    func: Callable[..., T],
    config: Optional[RetryConfig] = None,
    *args,
    **kwargs
) -> T:
    """
    Retry an async function with exponential backoff

    Args:
        func: Async function to retry
        config: Retry configuration (defaults to 3 attempts)
        *args: Positional arguments to pass to func
        **kwargs: Keyword arguments to pass to func

    Returns:
        Result of the function call

    Raises:
        Last exception encountered if all retries fail
    """
    if config is None:
        config = RetryConfig()

    last_exception = None

    for attempt in range(1, config.max_attempts + 1):
        try:
            result = await func(*args, **kwargs)
            if attempt > 1:
                logger.info(
                    f"Function {func.__name__} succeeded on attempt {attempt}"
                )
            return result

        except config.exceptions as e:
            last_exception = e

            if attempt == config.max_attempts:
                logger.error(
                    f"Function {func.__name__} failed after {config.max_attempts} attempts: {str(e)}"
                )
                raise

            # Calculate delay with exponential backoff
            delay = min(
                config.initial_delay * (config.exponential_base ** (attempt - 1)),
                config.max_delay
            )

            logger.warning(
                f"Function {func.__name__} failed on attempt {attempt}/{config.max_attempts}: {str(e)}. "
                f"Retrying in {delay:.2f}s..."
            )

            await asyncio.sleep(delay)

    # Should never reach here, but just in case
    if last_exception:
        raise last_exception
    raise RuntimeError("Retry logic error: no exception but no result")


def with_retry(config: Optional[RetryConfig] = None):
    """
    Decorator to add retry logic to async functions

    Usage:
        @with_retry(RetryConfig(max_attempts=3))
        async def fetch_data():
            ...
    """
    if config is None:
        config = RetryConfig()

    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            return await retry_async(func, config, *args, **kwargs)
        return wrapper
    return decorator


# Predefined retry configurations for common scenarios

OAUTH_RETRY_CONFIG = RetryConfig(
    max_attempts=3,
    initial_delay=1.0,
    max_delay=5.0,
    exponential_base=2.0,
    exceptions=(ConnectionError, TimeoutError)
)

SUPABASE_RETRY_CONFIG = RetryConfig(
    max_attempts=3,
    initial_delay=0.5,
    max_delay=3.0,
    exponential_base=2.0,
    exceptions=(ConnectionError, TimeoutError)
)

DATABASE_RETRY_CONFIG = RetryConfig(
    max_attempts=2,
    initial_delay=0.2,
    max_delay=1.0,
    exponential_base=2.0,
    exceptions=(ConnectionError,)
)
