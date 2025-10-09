"""
Monitoring and logging endpoints
Provides access to logs, metrics, and error aggregation
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime, timedelta

from app.core.logging_config import error_aggregator, get_logger
from app.monitoring.performance import performance_monitor, generate_performance_report

logger = get_logger(__name__)
router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/metrics")
async def get_metrics():
    """
    Get current performance metrics
    """
    try:
        summary = performance_monitor.get_performance_summary()
        return {
            "status": "success",
            "data": summary
        }
    except Exception as e:
        logger.error(f"Failed to get metrics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve metrics")


@router.get("/metrics/averages")
async def get_metrics_averages(
    minutes: int = Query(default=5, ge=1, le=1440, description="Time window in minutes")
):
    """
    Get average metrics for specified time window
    """
    try:
        averages = performance_monitor.calculate_averages(minutes)
        return {
            "status": "success",
            "time_window_minutes": minutes,
            "data": averages
        }
    except Exception as e:
        logger.error(f"Failed to get metric averages: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve metric averages")


@router.get("/errors")
async def get_errors(
    limit: Optional[int] = Query(default=50, ge=1, le=1000, description="Maximum number of errors to return")
):
    """
    Get recent errors from error aggregator
    """
    try:
        errors = error_aggregator.get_errors(limit)
        return {
            "status": "success",
            "count": len(errors),
            "data": errors
        }
    except Exception as e:
        logger.error(f"Failed to get errors: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve errors")


@router.get("/errors/summary")
async def get_error_summary():
    """
    Get error summary statistics
    """
    try:
        summary = error_aggregator.get_error_summary()
        return {
            "status": "success",
            "data": summary
        }
    except Exception as e:
        logger.error(f"Failed to get error summary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve error summary")


@router.post("/errors/clear")
async def clear_errors():
    """
    Clear error aggregator (admin only)
    """
    try:
        error_aggregator.clear()
        logger.info("Error aggregator cleared")
        return {
            "status": "success",
            "message": "Errors cleared"
        }
    except Exception as e:
        logger.error(f"Failed to clear errors: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to clear errors")


@router.get("/performance/report")
async def get_performance_report():
    """
    Get detailed performance report
    """
    try:
        report = generate_performance_report()
        return {
            "status": "success",
            "data": report
        }
    except Exception as e:
        logger.error(f"Failed to generate performance report: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate performance report")


@router.post("/logs/batch")
async def receive_log_batch(logs: dict):
    """
    Receive batch of logs from frontend
    """
    try:
        events = logs.get('events', [])
        errors = logs.get('errors', [])

        logger.info(
            f"Received log batch: {len(events)} events, {len(errors)} errors",
            extra={
                'extra_data': {
                    'event_count': len(events),
                    'error_count': len(errors)
                }
            }
        )

        # Process errors
        for error in errors:
            error_aggregator.add_error(
                error_type=error.get('type', 'unknown'),
                message=error.get('payload', {}).get('message', 'No message'),
                context={
                    'source': 'frontend',
                    'user_id': error.get('user_id'),
                    'session_id': error.get('session_id'),
                    'timestamp': error.get('ts')
                }
            )

        return {
            "status": "success",
            "processed": {
                "events": len(events),
                "errors": len(errors)
            }
        }
    except Exception as e:
        logger.error(f"Failed to process log batch: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process log batch")


@router.post("/logs/errors")
async def receive_error_log(error: dict):
    """
    Receive single error log from frontend
    """
    try:
        error_aggregator.add_error(
            error_type=error.get('type', 'frontend_error'),
            message=error.get('payload', {}).get('message', 'No message'),
            context={
                'source': 'frontend',
                'stack': error.get('stack'),
                'user_id': error.get('user_id'),
                'session_id': error.get('session_id'),
                'timestamp': error.get('ts'),
                'url': error.get('payload', {}).get('context', {}).get('url'),
                'user_agent': error.get('payload', {}).get('context', {}).get('user_agent')
            }
        )

        logger.error(
            f"Frontend error: {error.get('payload', {}).get('message')}",
            extra={'extra_data': {'error': error}}
        )

        return {"status": "success"}
    except Exception as e:
        logger.error(f"Failed to process error log: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process error log")
