"""
Achievement System Monitoring & Alerting
成就系統監控與告警

提供：
- 效能指標收集
- 錯誤監控
- 健康檢查
- 告警觸發條件
"""

import logging
import time
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from collections import deque
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)


class AlertLevel(Enum):
    """告警級別"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class PerformanceMetrics:
    """效能指標"""
    # Achievement check metrics
    achievement_check_times: deque = field(default_factory=lambda: deque(maxlen=1000))
    achievement_check_failures: int = 0
    achievement_check_total: int = 0

    # API endpoint metrics
    api_response_times: Dict[str, deque] = field(default_factory=dict)
    api_call_counts: Dict[str, int] = field(default_factory=dict)
    api_error_counts: Dict[str, int] = field(default_factory=dict)

    # Cache metrics
    cache_hits: int = 0
    cache_misses: int = 0

    # Karma service metrics
    karma_service_calls: int = 0
    karma_service_failures: int = 0

    # Unlock metrics
    total_unlocks: int = 0
    failed_unlocks: int = 0

    # Timestamp
    start_time: datetime = field(default_factory=datetime.utcnow)


class AchievementMonitor:
    """
    成就系統監控器

    收集效能指標、監控錯誤、執行健康檢查
    """

    def __init__(self):
        self.metrics = PerformanceMetrics()
        self.alert_handlers = []
        self._last_health_check = None

    # ===== Metrics Recording =====

    def record_achievement_check(self, duration: float, success: bool = True):
        """
        記錄成就檢查指標

        Args:
            duration: 執行時間（秒）
            success: 是否成功
        """
        self.metrics.achievement_check_times.append(duration)
        self.metrics.achievement_check_total += 1

        if not success:
            self.metrics.achievement_check_failures += 1

        # 檢查是否超過閾值並觸發告警
        if duration > 2.0:  # 超過 2 秒
            self._trigger_alert(
                AlertLevel.WARNING,
                f"Slow achievement check: {duration:.2f}s",
                {
                    'duration': duration,
                    'threshold': 2.0
                }
            )

    def record_api_call(
        self,
        endpoint: str,
        duration: float,
        success: bool = True
    ):
        """
        記錄 API 呼叫指標

        Args:
            endpoint: API 端點名稱
            duration: 回應時間（秒）
            success: 是否成功
        """
        if endpoint not in self.metrics.api_response_times:
            self.metrics.api_response_times[endpoint] = deque(maxlen=1000)
            self.metrics.api_call_counts[endpoint] = 0
            self.metrics.api_error_counts[endpoint] = 0

        self.metrics.api_response_times[endpoint].append(duration)
        self.metrics.api_call_counts[endpoint] += 1

        if not success:
            self.metrics.api_error_counts[endpoint] += 1

            # 計算錯誤率
            error_rate = self.metrics.api_error_counts[endpoint] / self.metrics.api_call_counts[endpoint]

            if error_rate > 0.05:  # 錯誤率超過 5%
                self._trigger_alert(
                    AlertLevel.ERROR,
                    f"High error rate on {endpoint}: {error_rate*100:.2f}%",
                    {
                        'endpoint': endpoint,
                        'error_rate': error_rate,
                        'total_calls': self.metrics.api_call_counts[endpoint],
                        'errors': self.metrics.api_error_counts[endpoint]
                    }
                )

    def record_cache_hit(self):
        """記錄快取命中"""
        self.metrics.cache_hits += 1

    def record_cache_miss(self):
        """記錄快取未命中"""
        self.metrics.cache_misses += 1

        # 檢查快取命中率
        total = self.metrics.cache_hits + self.metrics.cache_misses

        if total >= 100:  # 至少 100 次查詢後才檢查
            hit_rate = self.metrics.cache_hits / total

            if hit_rate < 0.6:  # 命中率低於 60%
                self._trigger_alert(
                    AlertLevel.WARNING,
                    f"Low cache hit rate: {hit_rate*100:.2f}%",
                    {
                        'hit_rate': hit_rate,
                        'cache_hits': self.metrics.cache_hits,
                        'cache_misses': self.metrics.cache_misses
                    }
                )

    def record_karma_service_call(self, success: bool = True):
        """記錄 Karma Service 呼叫"""
        self.metrics.karma_service_calls += 1

        if not success:
            self.metrics.karma_service_failures += 1

            # 計算失敗率
            failure_rate = self.metrics.karma_service_failures / self.metrics.karma_service_calls

            if failure_rate > 0.1:  # 失敗率超過 10%
                self._trigger_alert(
                    AlertLevel.CRITICAL,
                    f"High Karma service failure rate: {failure_rate*100:.2f}%",
                    {
                        'failure_rate': failure_rate,
                        'total_calls': self.metrics.karma_service_calls,
                        'failures': self.metrics.karma_service_failures
                    }
                )

    def record_achievement_unlock(self, success: bool = True):
        """記錄成就解鎖"""
        self.metrics.total_unlocks += 1

        if not success:
            self.metrics.failed_unlocks += 1

    # ===== Statistics & Reporting =====

    def get_statistics(self) -> Dict[str, Any]:
        """
        獲取統計資訊

        Returns:
            統計指標字典
        """
        # 計算成就檢查統計
        check_times = list(self.metrics.achievement_check_times)
        check_times.sort()

        if check_times:
            avg_check_time = sum(check_times) / len(check_times)
            p95_check_time = check_times[int(len(check_times) * 0.95)] if len(check_times) > 20 else check_times[-1]
        else:
            avg_check_time = 0
            p95_check_time = 0

        # 計算快取命中率
        total_cache_queries = self.metrics.cache_hits + self.metrics.cache_misses
        cache_hit_rate = self.metrics.cache_hits / total_cache_queries if total_cache_queries > 0 else 0

        # 計算 Karma service 成功率
        karma_success_rate = (
            (self.metrics.karma_service_calls - self.metrics.karma_service_failures) / self.metrics.karma_service_calls
            if self.metrics.karma_service_calls > 0
            else 1.0
        )

        # 計算解鎖成功率
        unlock_success_rate = (
            (self.metrics.total_unlocks - self.metrics.failed_unlocks) / self.metrics.total_unlocks
            if self.metrics.total_unlocks > 0
            else 1.0
        )

        return {
            'timestamp': datetime.utcnow().isoformat(),
            'uptime_seconds': (datetime.utcnow() - self.metrics.start_time).total_seconds(),

            'achievement_checks': {
                'total': self.metrics.achievement_check_total,
                'failures': self.metrics.achievement_check_failures,
                'avg_time_ms': avg_check_time * 1000,
                'p95_time_ms': p95_check_time * 1000
            },

            'cache': {
                'hits': self.metrics.cache_hits,
                'misses': self.metrics.cache_misses,
                'hit_rate_percent': cache_hit_rate * 100
            },

            'karma_service': {
                'total_calls': self.metrics.karma_service_calls,
                'failures': self.metrics.karma_service_failures,
                'success_rate_percent': karma_success_rate * 100
            },

            'unlocks': {
                'total': self.metrics.total_unlocks,
                'failed': self.metrics.failed_unlocks,
                'success_rate_percent': unlock_success_rate * 100
            },

            'api_endpoints': {
                endpoint: {
                    'total_calls': self.metrics.api_call_counts[endpoint],
                    'errors': self.metrics.api_error_counts[endpoint],
                    'error_rate_percent': (
                        self.metrics.api_error_counts[endpoint] / self.metrics.api_call_counts[endpoint] * 100
                        if self.metrics.api_call_counts[endpoint] > 0 else 0
                    )
                }
                for endpoint in self.metrics.api_call_counts.keys()
            }
        }

    # ===== Health Check =====

    async def health_check(self) -> Dict[str, Any]:
        """
        執行健康檢查

        Returns:
            健康狀態資訊
        """
        from app.services.achievement_cache_service import achievement_cache

        self._last_health_check = datetime.utcnow()

        # 檢查快取健康
        cache_health = await achievement_cache.health_check()

        # 檢查效能指標
        stats = self.get_statistics()

        # 判斷整體健康狀態
        is_healthy = True
        issues = []

        # 檢查成就檢查失敗率
        if stats['achievement_checks']['total'] > 0:
            failure_rate = stats['achievement_checks']['failures'] / stats['achievement_checks']['total']

            if failure_rate > 0.1:
                is_healthy = False
                issues.append(f"High achievement check failure rate: {failure_rate*100:.2f}%")

        # 檢查 Karma service 成功率
        if stats['karma_service']['total_calls'] > 0:
            if stats['karma_service']['success_rate_percent'] < 90:
                is_healthy = False
                issues.append(f"Low Karma service success rate: {stats['karma_service']['success_rate_percent']:.2f}%")

        # 檢查快取命中率（如果 Redis 可用）
        if cache_health['redis_available']:
            if stats['cache']['hit_rate_percent'] < 60:
                issues.append(f"Low cache hit rate: {stats['cache']['hit_rate_percent']:.2f}%")

        return {
            'healthy': is_healthy,
            'timestamp': datetime.utcnow().isoformat(),
            'issues': issues,
            'cache_health': cache_health,
            'statistics': stats
        }

    # ===== Alerting =====

    def add_alert_handler(self, handler):
        """
        新增告警處理器

        Args:
            handler: 告警處理函式，接受 (level, message, context) 參數
        """
        self.alert_handlers.append(handler)

    def _trigger_alert(
        self,
        level: AlertLevel,
        message: str,
        context: Optional[Dict[str, Any]] = None
    ):
        """
        觸發告警

        Args:
            level: 告警級別
            message: 告警訊息
            context: 額外上下文資訊
        """
        alert_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': level.value,
            'message': message,
            'context': context or {},
            'system': 'achievement'
        }

        # 記錄到日誌
        log_level = {
            AlertLevel.INFO: logger.info,
            AlertLevel.WARNING: logger.warning,
            AlertLevel.ERROR: logger.error,
            AlertLevel.CRITICAL: logger.critical
        }[level]

        log_level(f"[ALERT] {message}", extra={'context': context})

        # 呼叫所有告警處理器
        for handler in self.alert_handlers:
            try:
                handler(level, message, context)
            except Exception as e:
                logger.error(f"Alert handler failed: {e}")

    def reset_metrics(self):
        """重置所有指標（用於測試或重新啟動）"""
        self.metrics = PerformanceMetrics()


# 建立全域監控器實例
achievement_monitor = AchievementMonitor()


# ===== Default Alert Handlers =====

def default_console_alert_handler(
    level: AlertLevel,
    message: str,
    context: Optional[Dict[str, Any]] = None
):
    """預設的控制台告警處理器"""
    level_emoji = {
        AlertLevel.INFO: "ℹ️",
        AlertLevel.WARNING: "⚠️",
        AlertLevel.ERROR: "❌",
        AlertLevel.CRITICAL: "🚨"
    }

    print(f"{level_emoji[level]} [{level.value.upper()}] {message}")

    if context:
        print(f"  Context: {context}")


# 預設啟用控制台告警
achievement_monitor.add_alert_handler(default_console_alert_handler)


# ===== Context Manager for Monitoring =====

class MonitoredOperation:
    """監控操作的 context manager"""

    def __init__(self, operation_name: str, monitor: AchievementMonitor = achievement_monitor):
        self.operation_name = operation_name
        self.monitor = monitor
        self.start_time = None

    def __enter__(self):
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start_time
        success = exc_type is None

        # 根據操作類型記錄指標
        if 'achievement_check' in self.operation_name:
            self.monitor.record_achievement_check(duration, success)
        elif 'api_' in self.operation_name:
            self.monitor.record_api_call(self.operation_name, duration, success)

        return False  # 不抑制異常
