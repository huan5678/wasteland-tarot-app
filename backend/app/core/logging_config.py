"""
Enhanced logging configuration for the application
Implements structured logging with request tracking and error aggregation
"""

import logging
import sys
import json
import time
from typing import Any, Dict, Optional
from datetime import datetime
from pathlib import Path
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from contextvars import ContextVar

# Context variables for request tracking
request_id_var: ContextVar[Optional[str]] = ContextVar('request_id', default=None)
user_id_var: ContextVar[Optional[str]] = ContextVar('user_id', default=None)


class StructuredFormatter(logging.Formatter):
    """
    Custom formatter that outputs JSON structured logs
    """

    def format(self, record: logging.LogRecord) -> str:
        # Base log structure
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }

        # Add request context if available
        request_id = request_id_var.get()
        user_id = user_id_var.get()

        if request_id:
            log_data['request_id'] = request_id
        if user_id:
            log_data['user_id'] = user_id

        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = {
                'type': record.exc_info[0].__name__ if record.exc_info[0] else None,
                'message': str(record.exc_info[1]) if record.exc_info[1] else None,
                'traceback': self.formatException(record.exc_info)
            }

        # Add extra fields
        if hasattr(record, 'extra_data'):
            log_data['extra'] = record.extra_data

        # Add performance metrics if present
        if hasattr(record, 'duration_ms'):
            log_data['duration_ms'] = record.duration_ms

        if hasattr(record, 'endpoint'):
            log_data['endpoint'] = record.endpoint

        if hasattr(record, 'status_code'):
            log_data['status_code'] = record.status_code

        return json.dumps(log_data, default=str)


class ColoredConsoleFormatter(logging.Formatter):
    """
    Colored formatter for console output (development)
    """

    COLORS = {
        'DEBUG': '\033[36m',      # Cyan
        'INFO': '\033[32m',       # Green
        'WARNING': '\033[33m',    # Yellow
        'ERROR': '\033[31m',      # Red
        'CRITICAL': '\033[35m',   # Magenta
    }
    RESET = '\033[0m'

    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, self.RESET)
        record.levelname = f"{color}{record.levelname}{self.RESET}"

        # Add request context
        request_id = request_id_var.get()
        user_id = user_id_var.get()

        context_parts = []
        if request_id:
            context_parts.append(f"req={request_id[:8]}")
        if user_id:
            context_parts.append(f"user={user_id[:8]}")

        context = f"[{' '.join(context_parts)}]" if context_parts else ""

        # Format with context
        formatted = super().format(record)
        if context:
            formatted = f"{context} {formatted}"

        return formatted


class RequestContextFilter(logging.Filter):
    """
    Filter that adds request context to log records
    """

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_var.get()
        record.user_id = user_id_var.get()
        return True


def setup_logging(
    level: str = "INFO",
    log_dir: Optional[Path] = None,
    enable_json: bool = False,
    enable_file: bool = True
) -> None:
    """
    Setup application logging configuration

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_dir: Directory for log files
        enable_json: Use JSON structured logging
        enable_file: Enable file logging
    """

    # Create log directory if needed
    if enable_file and log_dir:
        log_dir.mkdir(parents=True, exist_ok=True)

    # Root logger configuration
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper()))

    # Remove existing handlers
    root_logger.handlers.clear()

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)

    if enable_json:
        console_handler.setFormatter(StructuredFormatter())
    else:
        console_formatter = ColoredConsoleFormatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        console_handler.setFormatter(console_formatter)

    console_handler.addFilter(RequestContextFilter())
    root_logger.addHandler(console_handler)

    # File handlers
    if enable_file and log_dir:
        # General log file (rotating by size)
        general_handler = RotatingFileHandler(
            log_dir / "app.log",
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5
        )
        general_handler.setLevel(logging.INFO)
        general_handler.setFormatter(StructuredFormatter())
        general_handler.addFilter(RequestContextFilter())
        root_logger.addHandler(general_handler)

        # Error log file (rotating by time)
        error_handler = TimedRotatingFileHandler(
            log_dir / "error.log",
            when='midnight',
            interval=1,
            backupCount=30
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(StructuredFormatter())
        error_handler.addFilter(RequestContextFilter())
        root_logger.addHandler(error_handler)

        # Performance log file
        perf_handler = RotatingFileHandler(
            log_dir / "performance.log",
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=3
        )
        perf_handler.setLevel(logging.INFO)
        perf_handler.setFormatter(StructuredFormatter())
        perf_handler.addFilter(RequestContextFilter())

        # Add custom logger for performance
        perf_logger = logging.getLogger('performance')
        perf_logger.addHandler(perf_handler)

    logging.info(f"Logging configured: level={level}, json={enable_json}, file={enable_file}")


def set_request_context(request_id: str, user_id: Optional[str] = None) -> None:
    """Set request context for logging"""
    request_id_var.set(request_id)
    if user_id:
        user_id_var.set(user_id)


def clear_request_context() -> None:
    """Clear request context"""
    request_id_var.set(None)
    user_id_var.set(None)


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance with the given name

    Args:
        name: Logger name (usually __name__)

    Returns:
        Logger instance
    """
    return logging.getLogger(name)


class LoggerAdapter(logging.LoggerAdapter):
    """
    Custom logger adapter that adds extra context to all log calls
    """

    def process(self, msg: str, kwargs: Dict[str, Any]) -> tuple:
        # Merge extra data
        extra = kwargs.get('extra', {})
        extra['request_id'] = request_id_var.get()
        extra['user_id'] = user_id_var.get()
        kwargs['extra'] = extra
        return msg, kwargs


def get_logger_with_context(name: str, **context: Any) -> LoggerAdapter:
    """
    Get a logger adapter with additional context

    Args:
        name: Logger name
        **context: Additional context to include in all logs

    Returns:
        LoggerAdapter instance
    """
    logger = logging.getLogger(name)
    return LoggerAdapter(logger, context)


# Performance logging helpers
def log_performance(
    logger: logging.Logger,
    operation: str,
    duration_ms: float,
    **extra: Any
) -> None:
    """
    Log performance metric

    Args:
        logger: Logger instance
        operation: Operation name
        duration_ms: Duration in milliseconds
        **extra: Additional metadata
    """
    logger.info(
        f"Performance: {operation} completed in {duration_ms:.2f}ms",
        extra={
            'extra_data': {
                'operation': operation,
                'duration_ms': duration_ms,
                **extra
            }
        }
    )


def log_api_request(
    logger: logging.Logger,
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    **extra: Any
) -> None:
    """
    Log API request

    Args:
        logger: Logger instance
        method: HTTP method
        path: Request path
        status_code: Response status code
        duration_ms: Request duration in milliseconds
        **extra: Additional metadata
    """
    logger.info(
        f"{method} {path} - {status_code} ({duration_ms:.2f}ms)",
        extra={
            'extra_data': {
                'method': method,
                'path': path,
                'status_code': status_code,
                'duration_ms': duration_ms,
                **extra
            }
        }
    )


# Error aggregation
class ErrorAggregator:
    """
    Aggregates errors for reporting and alerting
    """

    def __init__(self, max_errors: int = 1000):
        self.errors: list = []
        self.max_errors = max_errors
        self.error_counts: Dict[str, int] = {}

    def add_error(
        self,
        error_type: str,
        message: str,
        context: Optional[Dict[str, Any]] = None
    ) -> None:
        """Add an error to the aggregator"""
        error_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'type': error_type,
            'message': message,
            'context': context or {},
            'request_id': request_id_var.get(),
            'user_id': user_id_var.get()
        }

        self.errors.append(error_entry)

        # Maintain max size
        if len(self.errors) > self.max_errors:
            self.errors.pop(0)

        # Update counts
        self.error_counts[error_type] = self.error_counts.get(error_type, 0) + 1

    def get_errors(self, limit: Optional[int] = None) -> list:
        """Get recent errors"""
        if limit:
            return self.errors[-limit:]
        return self.errors.copy()

    def get_error_summary(self) -> Dict[str, Any]:
        """Get error summary statistics"""
        return {
            'total_errors': len(self.errors),
            'by_type': self.error_counts.copy(),
            'recent_errors': self.errors[-10:] if self.errors else []
        }

    def clear(self) -> None:
        """Clear all errors"""
        self.errors.clear()
        self.error_counts.clear()


# Global error aggregator instance
error_aggregator = ErrorAggregator()
