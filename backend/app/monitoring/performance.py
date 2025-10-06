"""
Performance monitoring and metrics collection
"""

import time
import psutil
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from dataclasses import dataclass, asdict
from functools import wraps

import logging

logger = logging.getLogger(__name__)


@dataclass
class PerformanceMetrics:
    """Performance metrics data structure"""
    timestamp: float
    duration_ms: float
    memory_usage_mb: float
    cpu_percent: float
    endpoint: Optional[str] = None
    user_id: Optional[str] = None
    status_code: Optional[int] = None
    error: Optional[str] = None


class PerformanceMonitor:
    """Performance monitoring and baseline management"""

    def __init__(self):
        self.metrics: List[PerformanceMetrics] = []
        self.baselines: Dict[str, Dict[str, float]] = {
            "api_response_time": {
                "target": 200.0,  # ms
                "warning": 500.0,  # ms
                "critical": 1000.0  # ms
            },
            "memory_usage": {
                "target": 100.0,  # MB
                "warning": 200.0,  # MB
                "critical": 500.0  # MB
            },
            "cpu_usage": {
                "target": 20.0,  # %
                "warning": 50.0,  # %
                "critical": 80.0  # %
            },
            "database_query_time": {
                "target": 50.0,  # ms
                "warning": 100.0,  # ms
                "critical": 300.0  # ms
            },
            "concurrent_requests": {
                "target": 50,  # concurrent requests
                "warning": 100,
                "critical": 200
            }
        }

    def add_metric(self, metric: PerformanceMetrics):
        """Add a performance metric"""
        self.metrics.append(metric)

        # Keep only last 1000 metrics in memory
        if len(self.metrics) > 1000:
            self.metrics = self.metrics[-1000:]

    def get_baseline(self, metric_name: str) -> Dict[str, float]:
        """Get baseline values for a metric"""
        return self.baselines.get(metric_name, {})

    def check_threshold(self, metric_name: str, value: float) -> str:
        """Check if a value exceeds thresholds"""
        baseline = self.get_baseline(metric_name)

        if value >= baseline.get("critical", float('inf')):
            return "critical"
        elif value >= baseline.get("warning", float('inf')):
            return "warning"
        elif value <= baseline.get("target", 0):
            return "good"
        else:
            return "acceptable"

    def get_recent_metrics(self, minutes: int = 5) -> List[PerformanceMetrics]:
        """Get metrics from the last N minutes"""
        cutoff_time = time.time() - (minutes * 60)
        return [m for m in self.metrics if m.timestamp >= cutoff_time]

    def calculate_averages(self, minutes: int = 5) -> Dict[str, float]:
        """Calculate average metrics for the last N minutes"""
        recent_metrics = self.get_recent_metrics(minutes)

        if not recent_metrics:
            return {}

        total_duration = sum(m.duration_ms for m in recent_metrics)
        total_memory = sum(m.memory_usage_mb for m in recent_metrics)
        total_cpu = sum(m.cpu_percent for m in recent_metrics)
        count = len(recent_metrics)

        return {
            "avg_response_time_ms": total_duration / count,
            "avg_memory_usage_mb": total_memory / count,
            "avg_cpu_percent": total_cpu / count,
            "total_requests": count
        }

    def get_performance_summary(self) -> Dict[str, Any]:
        """Get comprehensive performance summary"""
        recent_5min = self.calculate_averages(5)
        recent_1hour = self.calculate_averages(60)

        summary = {
            "timestamp": datetime.utcnow().isoformat(),
            "baselines": self.baselines,
            "recent_5min": recent_5min,
            "recent_1hour": recent_1hour,
            "current_system": self._get_current_system_metrics(),
            "health_status": self._calculate_health_status(recent_5min)
        }

        return summary

    def _get_current_system_metrics(self) -> Dict[str, float]:
        """Get current system metrics"""
        process = psutil.Process()

        return {
            "cpu_percent": process.cpu_percent(),
            "memory_mb": process.memory_info().rss / 1024 / 1024,
            "memory_percent": process.memory_percent(),
            "num_threads": process.num_threads(),
            "num_fds": process.num_fds() if hasattr(process, 'num_fds') else 0
        }

    def _calculate_health_status(self, metrics: Dict[str, float]) -> str:
        """Calculate overall health status"""
        if not metrics:
            return "unknown"

        response_time_status = self.check_threshold(
            "api_response_time",
            metrics.get("avg_response_time_ms", 0)
        )
        memory_status = self.check_threshold(
            "memory_usage",
            metrics.get("avg_memory_usage_mb", 0)
        )
        cpu_status = self.check_threshold(
            "cpu_usage",
            metrics.get("avg_cpu_percent", 0)
        )

        statuses = [response_time_status, memory_status, cpu_status]

        if "critical" in statuses:
            return "critical"
        elif "warning" in statuses:
            return "warning"
        elif all(s in ["good", "acceptable"] for s in statuses):
            return "healthy"
        else:
            return "unknown"


# Global performance monitor instance
performance_monitor = PerformanceMonitor()


@asynccontextmanager
async def monitor_performance(
    endpoint: str = None,
    user_id: str = None
):
    """Context manager to monitor performance of code blocks"""
    start_time = time.time()
    start_memory = psutil.Process().memory_info().rss / 1024 / 1024
    start_cpu = psutil.Process().cpu_percent()

    error = None
    status_code = None

    try:
        yield
    except Exception as e:
        error = str(e)
        raise
    finally:
        end_time = time.time()
        end_memory = psutil.Process().memory_info().rss / 1024 / 1024
        duration_ms = (end_time - start_time) * 1000

        metric = PerformanceMetrics(
            timestamp=end_time,
            duration_ms=duration_ms,
            memory_usage_mb=end_memory,
            cpu_percent=psutil.Process().cpu_percent(),
            endpoint=endpoint,
            user_id=user_id,
            status_code=status_code,
            error=error
        )

        performance_monitor.add_metric(metric)

        # Log warnings if thresholds exceeded
        response_time_status = performance_monitor.check_threshold(
            "api_response_time", duration_ms
        )
        memory_status = performance_monitor.check_threshold(
            "memory_usage", end_memory
        )

        if response_time_status == "critical":
            logger.warning(
                f"Critical response time: {duration_ms:.2f}ms for {endpoint}"
            )
        if memory_status == "critical":
            logger.warning(
                f"Critical memory usage: {end_memory:.2f}MB"
            )


def monitor_endpoint(func):
    """Decorator to monitor endpoint performance"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        endpoint_name = f"{func.__module__}.{func.__name__}"

        async with monitor_performance(endpoint=endpoint_name):
            return await func(*args, **kwargs)

    return wrapper


class LoadTestResult:
    """Load test result container"""

    def __init__(self):
        self.start_time: Optional[float] = None
        self.end_time: Optional[float] = None
        self.total_requests: int = 0
        self.successful_requests: int = 0
        self.failed_requests: int = 0
        self.response_times: List[float] = []
        self.errors: List[str] = []

    @property
    def duration(self) -> float:
        if self.start_time and self.end_time:
            return self.end_time - self.start_time
        return 0.0

    @property
    def requests_per_second(self) -> float:
        if self.duration > 0:
            return self.total_requests / self.duration
        return 0.0

    @property
    def average_response_time(self) -> float:
        if self.response_times:
            return sum(self.response_times) / len(self.response_times)
        return 0.0

    @property
    def success_rate(self) -> float:
        if self.total_requests > 0:
            return self.successful_requests / self.total_requests
        return 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "duration": self.duration,
            "total_requests": self.total_requests,
            "successful_requests": self.successful_requests,
            "failed_requests": self.failed_requests,
            "requests_per_second": self.requests_per_second,
            "average_response_time": self.average_response_time,
            "success_rate": self.success_rate,
            "min_response_time": min(self.response_times) if self.response_times else 0,
            "max_response_time": max(self.response_times) if self.response_times else 0,
            "errors": self.errors[:10]  # Include first 10 errors
        }


async def run_load_test(
    test_function,
    concurrent_users: int = 10,
    duration_seconds: int = 30,
    **test_kwargs
) -> LoadTestResult:
    """Run a load test with specified parameters"""

    result = LoadTestResult()
    result.start_time = time.time()

    async def worker():
        """Single worker function"""
        while time.time() - result.start_time < duration_seconds:
            try:
                start = time.time()
                await test_function(**test_kwargs)
                end = time.time()

                result.total_requests += 1
                result.successful_requests += 1
                result.response_times.append((end - start) * 1000)  # Convert to ms

            except Exception as e:
                result.total_requests += 1
                result.failed_requests += 1
                result.errors.append(str(e))

            # Small delay to prevent overwhelming
            await asyncio.sleep(0.01)

    # Run concurrent workers
    tasks = [asyncio.create_task(worker()) for _ in range(concurrent_users)]

    try:
        await asyncio.gather(*tasks, return_exceptions=True)
    finally:
        result.end_time = time.time()

    return result


def generate_performance_report() -> str:
    """Generate a detailed performance report"""
    summary = performance_monitor.get_performance_summary()

    report = f"""
# Performance Report - {summary['timestamp']}

## Overall Health Status
**Status**: {summary['health_status'].upper()}

## Performance Baselines
{_format_baselines(summary['baselines'])}

## Recent Performance (5 minutes)
{_format_metrics(summary['recent_5min'])}

## Recent Performance (1 hour)
{_format_metrics(summary['recent_1hour'])}

## Current System Metrics
{_format_system_metrics(summary['current_system'])}

## Recommendations
{_generate_recommendations(summary)}
"""

    return report


def _format_baselines(baselines: Dict[str, Dict[str, float]]) -> str:
    """Format baseline values for report"""
    lines = []
    for metric, values in baselines.items():
        lines.append(f"**{metric.replace('_', ' ').title()}**:")
        lines.append(f"  - Target: {values.get('target', 'N/A')}")
        lines.append(f"  - Warning: {values.get('warning', 'N/A')}")
        lines.append(f"  - Critical: {values.get('critical', 'N/A')}")
        lines.append("")

    return "\n".join(lines)


def _format_metrics(metrics: Dict[str, float]) -> str:
    """Format metrics for report"""
    if not metrics:
        return "No data available"

    lines = []
    for key, value in metrics.items():
        lines.append(f"- **{key.replace('_', ' ').title()}**: {value:.2f}")

    return "\n".join(lines)


def _format_system_metrics(metrics: Dict[str, float]) -> str:
    """Format system metrics for report"""
    lines = []
    for key, value in metrics.items():
        lines.append(f"- **{key.replace('_', ' ').title()}**: {value:.2f}")

    return "\n".join(lines)


def _generate_recommendations(summary: Dict[str, Any]) -> str:
    """Generate performance recommendations"""
    recommendations = []

    health_status = summary.get('health_status', 'unknown')
    recent_metrics = summary.get('recent_5min', {})

    if health_status == 'critical':
        recommendations.append("🚨 **CRITICAL**: Immediate attention required!")
        recommendations.append("- Check error logs for issues")
        recommendations.append("- Consider scaling resources")
        recommendations.append("- Review recent deployments")

    elif health_status == 'warning':
        recommendations.append("⚠️ **WARNING**: Performance degradation detected")
        recommendations.append("- Monitor closely")
        recommendations.append("- Consider optimization")

    # Specific recommendations based on metrics
    avg_response_time = recent_metrics.get('avg_response_time_ms', 0)
    if avg_response_time > 500:
        recommendations.append("- **Response time**: Consider database query optimization")
        recommendations.append("- **Response time**: Implement caching strategies")

    avg_memory = recent_metrics.get('avg_memory_usage_mb', 0)
    if avg_memory > 200:
        recommendations.append("- **Memory**: Check for memory leaks")
        recommendations.append("- **Memory**: Consider increasing available memory")

    if not recommendations:
        recommendations.append("✅ System performing within acceptable parameters")
        recommendations.append("- Continue monitoring")
        recommendations.append("- Regular performance reviews recommended")

    return "\n".join(recommendations)