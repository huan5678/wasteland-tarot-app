"""
Monitoring and performance API endpoints
"""

from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse

from app.monitoring.performance import (
    performance_monitor,
    generate_performance_report,
    run_load_test,
    LoadTestResult
)
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/monitoring", tags=["monitoring"])


@router.get("/health", response_model=Dict[str, Any])
async def health_check():
    """Basic health check endpoint"""
    import psutil
    import time

    process = psutil.Process()

    return {
        "status": "healthy",
        "timestamp": time.time(),
        "uptime": time.time() - process.create_time(),
        "memory_usage_mb": process.memory_info().rss / 1024 / 1024,
        "cpu_percent": process.cpu_percent(),
        "num_threads": process.num_threads()
    }


@router.get("/performance", response_model=Dict[str, Any])
async def get_performance_metrics():
    """Get performance metrics summary"""
    return performance_monitor.get_performance_summary()


@router.get("/performance/baselines", response_model=Dict[str, Dict[str, float]])
async def get_performance_baselines():
    """Get performance baselines"""
    return performance_monitor.baselines


@router.get("/performance/recent", response_model=List[Dict[str, Any]])
async def get_recent_metrics(
    minutes: int = Query(5, ge=1, le=60, description="Number of minutes to look back")
):
    """Get recent performance metrics"""
    metrics = performance_monitor.get_recent_metrics(minutes)
    return [
        {
            "timestamp": m.timestamp,
            "duration_ms": m.duration_ms,
            "memory_usage_mb": m.memory_usage_mb,
            "cpu_percent": m.cpu_percent,
            "endpoint": m.endpoint,
            "status_code": m.status_code,
            "error": m.error
        }
        for m in metrics
    ]


@router.get("/performance/report", response_class=PlainTextResponse)
async def get_performance_report():
    """Get detailed performance report in markdown format"""
    return generate_performance_report()


@router.get("/performance/averages", response_model=Dict[str, float])
async def get_performance_averages(
    minutes: int = Query(5, ge=1, le=60, description="Number of minutes to average")
):
    """Get average performance metrics"""
    return performance_monitor.calculate_averages(minutes)


@router.post("/load-test/users", response_model=Dict[str, Any])
async def run_user_load_test(
    concurrent_users: int = Query(10, ge=1, le=50),
    duration_seconds: int = Query(30, ge=10, le=300),
    current_user: User = Depends(get_current_user)
):
    """Run load test for user operations (authenticated users only)"""
    from app.services.user_service import UserService
    from app.db.database import get_db

    async def test_user_operations():
        # Simulate user operations
        async for db in get_db():
            user_service = UserService(db)
            try:
                # Test user lookup (read operation)
                await user_service.get_user_by_id(current_user.id)
            finally:
                break

    result = await run_load_test(
        test_user_operations,
        concurrent_users=concurrent_users,
        duration_seconds=duration_seconds
    )

    return {
        "test_type": "user_operations",
        "parameters": {
            "concurrent_users": concurrent_users,
            "duration_seconds": duration_seconds
        },
        "results": result.to_dict()
    }


@router.post("/load-test/cards", response_model=Dict[str, Any])
async def run_card_load_test(
    concurrent_users: int = Query(10, ge=1, le=50),
    duration_seconds: int = Query(30, ge=10, le=300)
):
    """Run load test for card operations (public endpoint)"""
    from app.services.wasteland_card_service import WastelandCardService
    from app.db.database import get_db

    async def test_card_operations():
        # Simulate card operations
        async for db in get_db():
            card_service = WastelandCardService(db)
            try:
                # Test card retrieval
                await card_service.get_all_cards()
            finally:
                break

    result = await run_load_test(
        test_card_operations,
        concurrent_users=concurrent_users,
        duration_seconds=duration_seconds
    )

    return {
        "test_type": "card_operations",
        "parameters": {
            "concurrent_users": concurrent_users,
            "duration_seconds": duration_seconds
        },
        "results": result.to_dict()
    }


@router.get("/system/info", response_model=Dict[str, Any])
async def get_system_info():
    """Get detailed system information"""
    import platform
    import psutil
    import sys

    process = psutil.Process()

    return {
        "platform": {
            "system": platform.system(),
            "release": platform.release(),
            "version": platform.version(),
            "machine": platform.machine(),
            "processor": platform.processor()
        },
        "python": {
            "version": sys.version,
            "executable": sys.executable
        },
        "process": {
            "pid": process.pid,
            "name": process.name(),
            "status": process.status(),
            "create_time": process.create_time(),
            "num_threads": process.num_threads(),
            "memory_info": {
                "rss_mb": process.memory_info().rss / 1024 / 1024,
                "vms_mb": process.memory_info().vms / 1024 / 1024,
                "percent": process.memory_percent()
            },
            "cpu_times": {
                "user": process.cpu_times().user,
                "system": process.cpu_times().system
            }
        },
        "system": {
            "cpu_count": psutil.cpu_count(),
            "cpu_count_logical": psutil.cpu_count(logical=True),
            "memory_total_gb": psutil.virtual_memory().total / 1024 / 1024 / 1024,
            "memory_available_gb": psutil.virtual_memory().available / 1024 / 1024 / 1024,
            "memory_percent": psutil.virtual_memory().percent,
            "disk_usage": {
                "total_gb": psutil.disk_usage('/').total / 1024 / 1024 / 1024,
                "used_gb": psutil.disk_usage('/').used / 1024 / 1024 / 1024,
                "free_gb": psutil.disk_usage('/').free / 1024 / 1024 / 1024,
                "percent": psutil.disk_usage('/').percent
            }
        }
    }


@router.get("/alerts", response_model=List[Dict[str, Any]])
async def get_performance_alerts():
    """Get current performance alerts"""
    alerts = []
    recent_metrics = performance_monitor.calculate_averages(5)

    if not recent_metrics:
        return alerts

    # Check response time
    avg_response_time = recent_metrics.get('avg_response_time_ms', 0)
    response_status = performance_monitor.check_threshold('api_response_time', avg_response_time)

    if response_status in ['warning', 'critical']:
        alerts.append({
            "type": "response_time",
            "severity": response_status,
            "message": f"Average response time is {avg_response_time:.2f}ms",
            "threshold": performance_monitor.get_baseline('api_response_time'),
            "current_value": avg_response_time
        })

    # Check memory usage
    avg_memory = recent_metrics.get('avg_memory_usage_mb', 0)
    memory_status = performance_monitor.check_threshold('memory_usage', avg_memory)

    if memory_status in ['warning', 'critical']:
        alerts.append({
            "type": "memory_usage",
            "severity": memory_status,
            "message": f"Average memory usage is {avg_memory:.2f}MB",
            "threshold": performance_monitor.get_baseline('memory_usage'),
            "current_value": avg_memory
        })

    # Check CPU usage
    avg_cpu = recent_metrics.get('avg_cpu_percent', 0)
    cpu_status = performance_monitor.check_threshold('cpu_usage', avg_cpu)

    if cpu_status in ['warning', 'critical']:
        alerts.append({
            "type": "cpu_usage",
            "severity": cpu_status,
            "message": f"Average CPU usage is {avg_cpu:.2f}%",
            "threshold": performance_monitor.get_baseline('cpu_usage'),
            "current_value": avg_cpu
        })

    return alerts


@router.get("/metrics/export", response_class=PlainTextResponse)
async def export_metrics_prometheus():
    """Export metrics in Prometheus format"""
    summary = performance_monitor.get_performance_summary()

    prometheus_metrics = []

    # Add basic metrics
    if summary.get('recent_5min'):
        metrics = summary['recent_5min']
        prometheus_metrics.extend([
            f"wasteland_tarot_response_time_avg {metrics.get('avg_response_time_ms', 0)}",
            f"wasteland_tarot_memory_usage_mb {metrics.get('avg_memory_usage_mb', 0)}",
            f"wasteland_tarot_cpu_percent {metrics.get('avg_cpu_percent', 0)}",
            f"wasteland_tarot_total_requests {metrics.get('total_requests', 0)}"
        ])

    # Add system metrics
    if summary.get('current_system'):
        system = summary['current_system']
        prometheus_metrics.extend([
            f"wasteland_tarot_system_memory_mb {system.get('memory_mb', 0)}",
            f"wasteland_tarot_system_cpu_percent {system.get('cpu_percent', 0)}",
            f"wasteland_tarot_system_threads {system.get('num_threads', 0)}"
        ])

    return "\n".join(prometheus_metrics) + "\n"