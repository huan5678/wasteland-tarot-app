"""
Logging middleware for FastAPI
Tracks all requests with detailed logging and performance metrics
"""

import time
import uuid
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.logging_config import (
    set_request_context,
    clear_request_context,
    get_logger,
    log_api_request,
    error_aggregator
)

logger = get_logger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that logs all HTTP requests with timing and context
    """

    def __init__(
        self,
        app: ASGIApp,
        log_request_body: bool = False,
        log_response_body: bool = False,
        exclude_paths: list[str] = None
    ):
        super().__init__(app)
        self.log_request_body = log_request_body
        self.log_response_body = log_response_body
        self.exclude_paths = exclude_paths or ['/health', '/metrics']

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip logging for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)

        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # Get user ID if authenticated
        user_id = None
        if hasattr(request.state, 'user'):
            user_id = getattr(request.state.user, 'id', None)

        # Set request context for logging
        set_request_context(request_id, user_id)

        # Start timing
        start_time = time.time()

        # Log request
        logger.info(
            f"Request started: {request.method} {request.url.path}",
            extra={
                'extra_data': {
                    'method': request.method,
                    'path': request.url.path,
                    'query_params': dict(request.query_params),
                    'client_host': request.client.host if request.client else None,
                    'user_agent': request.headers.get('user-agent')
                }
            }
        )

        # Log request body if enabled
        if self.log_request_body and request.method in ['POST', 'PUT', 'PATCH']:
            try:
                body = await request.body()
                if body:
                    logger.debug(
                        f"Request body: {body.decode('utf-8')[:1000]}",  # Limit size
                        extra={'extra_data': {'body_size': len(body)}}
                    )
            except Exception as e:
                logger.warning(f"Failed to log request body: {e}")

        # Process request
        response = None
        error = None
        try:
            response = await call_next(request)
        except Exception as e:
            error = e
            error_aggregator.add_error(
                error_type=type(e).__name__,
                message=str(e),
                context={
                    'method': request.method,
                    'path': request.url.path,
                    'request_id': request_id
                }
            )
            logger.error(
                f"Request failed: {request.method} {request.url.path}",
                exc_info=True,
                extra={
                    'extra_data': {
                        'error_type': type(e).__name__,
                        'error_message': str(e)
                    }
                }
            )
            raise
        finally:
            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000

            # Log response
            if response:
                status_code = response.status_code

                log_api_request(
                    logger,
                    method=request.method,
                    path=request.url.path,
                    status_code=status_code,
                    duration_ms=duration_ms,
                    user_id=user_id
                )

                # Add request ID to response headers
                response.headers['X-Request-ID'] = request_id

                # Log slow requests
                if duration_ms > 1000:  # > 1 second
                    logger.warning(
                        f"Slow request: {request.method} {request.url.path} ({duration_ms:.2f}ms)",
                        extra={
                            'extra_data': {
                                'duration_ms': duration_ms,
                                'threshold_exceeded': True
                            }
                        }
                    )

                # Log errors
                if status_code >= 500:
                    logger.error(
                        f"Server error: {request.method} {request.url.path} - {status_code}",
                        extra={
                            'extra_data': {
                                'status_code': status_code,
                                'duration_ms': duration_ms
                            }
                        }
                    )
                elif status_code >= 400:
                    logger.warning(
                        f"Client error: {request.method} {request.url.path} - {status_code}",
                        extra={
                            'extra_data': {
                                'status_code': status_code,
                                'duration_ms': duration_ms
                            }
                        }
                    )

            # Clear request context
            clear_request_context()

        return response


class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """
    Middleware that monitors endpoint performance and alerts on anomalies
    """

    def __init__(
        self,
        app: ASGIApp,
        slow_threshold_ms: float = 1000.0,
        very_slow_threshold_ms: float = 3000.0
    ):
        super().__init__(app)
        self.slow_threshold_ms = slow_threshold_ms
        self.very_slow_threshold_ms = very_slow_threshold_ms
        self.endpoint_metrics = {}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()

        response = await call_next(request)

        duration_ms = (time.time() - start_time) * 1000

        # Track metrics per endpoint
        endpoint_key = f"{request.method}:{request.url.path}"

        if endpoint_key not in self.endpoint_metrics:
            self.endpoint_metrics[endpoint_key] = {
                'count': 0,
                'total_duration': 0,
                'min_duration': float('inf'),
                'max_duration': 0
            }

        metrics = self.endpoint_metrics[endpoint_key]
        metrics['count'] += 1
        metrics['total_duration'] += duration_ms
        metrics['min_duration'] = min(metrics['min_duration'], duration_ms)
        metrics['max_duration'] = max(metrics['max_duration'], duration_ms)

        # Alert on very slow requests
        if duration_ms > self.very_slow_threshold_ms:
            logger.critical(
                f"VERY SLOW REQUEST: {endpoint_key} took {duration_ms:.2f}ms",
                extra={
                    'extra_data': {
                        'duration_ms': duration_ms,
                        'threshold': self.very_slow_threshold_ms,
                        'avg_duration': metrics['total_duration'] / metrics['count']
                    }
                }
            )
        elif duration_ms > self.slow_threshold_ms:
            logger.warning(
                f"Slow request: {endpoint_key} took {duration_ms:.2f}ms",
                extra={
                    'extra_data': {
                        'duration_ms': duration_ms,
                        'threshold': self.slow_threshold_ms
                    }
                }
            )

        return response

    def get_metrics_summary(self):
        """Get performance metrics summary"""
        summary = {}
        for endpoint, metrics in self.endpoint_metrics.items():
            avg_duration = metrics['total_duration'] / metrics['count'] if metrics['count'] > 0 else 0
            summary[endpoint] = {
                'count': metrics['count'],
                'avg_duration_ms': avg_duration,
                'min_duration_ms': metrics['min_duration'],
                'max_duration_ms': metrics['max_duration']
            }
        return summary
