"""
Test Backend Performance Monitoring - Streaming Metrics

Tests for PerformanceMonitor streaming metrics tracking including:
- First-token latency recording
- Completion metrics recording (duration, token count)
- Error metrics tracking
- P95 latency calculation
- Per-provider metrics separation
"""

import pytest
import time
from app.monitoring.performance import (
    PerformanceMonitor,
    StreamingMetrics
)


class TestFirstTokenLatencyRecording:
    """Test first-token latency recording functionality"""

    def test_record_first_token_latency_basic(self):
        """Test basic first-token latency recording"""
        monitor = PerformanceMonitor()

        # Record a first token latency
        latency_ms = 1200.0
        monitor.record_first_token_latency(latency_ms)

        # Verify metric recorded
        assert len(monitor.streaming_metrics) == 1
        metric = monitor.streaming_metrics[0]
        assert metric.first_token_latency_ms == latency_ms
        assert metric.timestamp > 0
        assert metric.provider is None  # No provider specified
        assert metric.user_id is None

    def test_record_first_token_latency_with_provider(self):
        """Test first-token latency recording with AI provider"""
        monitor = PerformanceMonitor()

        # Record latency with provider
        latency_ms = 1500.0
        provider = "anthropic"
        monitor.record_first_token_latency(latency_ms, provider=provider)

        # Verify provider tracked
        metric = monitor.streaming_metrics[0]
        assert metric.first_token_latency_ms == latency_ms
        assert metric.provider == provider

    def test_record_first_token_latency_with_user_id(self):
        """Test first-token latency recording with user ID"""
        monitor = PerformanceMonitor()

        # Record latency with user ID
        latency_ms = 1800.0
        user_id = "user_123"
        monitor.record_first_token_latency(latency_ms, user_id=user_id)

        # Verify user ID tracked
        metric = monitor.streaming_metrics[0]
        assert metric.first_token_latency_ms == latency_ms
        assert metric.user_id == user_id

    def test_record_first_token_latency_multiple_providers(self):
        """Test recording latency for multiple providers"""
        monitor = PerformanceMonitor()

        # Record latencies for different providers
        providers_and_latencies = [
            ("anthropic", 1200.0),
            ("openai", 1500.0),
            ("gemini", 1800.0)
        ]

        for provider, latency in providers_and_latencies:
            monitor.record_first_token_latency(latency, provider=provider)

        # Verify all recorded
        assert len(monitor.streaming_metrics) == 3
        for i, (provider, latency) in enumerate(providers_and_latencies):
            assert monitor.streaming_metrics[i].provider == provider
            assert monitor.streaming_metrics[i].first_token_latency_ms == latency

    def test_record_first_token_latency_sliding_window(self):
        """Test sliding window keeps only last 1000 metrics"""
        monitor = PerformanceMonitor()

        # Record 1100 latency metrics
        for i in range(1100):
            monitor.record_first_token_latency(1000.0 + i)

        # Verify only last 1000 kept
        assert len(monitor.streaming_metrics) == 1000
        # First metric should have latency 1100.0 (1000.0 + 100)
        assert monitor.streaming_metrics[0].first_token_latency_ms == 1100.0
        # Last metric should have latency 2099.0 (1000.0 + 1099)
        assert monitor.streaming_metrics[-1].first_token_latency_ms == 2099.0

    def test_record_first_token_latency_threshold_warnings(self, caplog):
        """Test warning logs for high latency"""
        monitor = PerformanceMonitor()

        # Record warning level latency (>2000ms)
        with caplog.at_level("INFO"):
            monitor.record_first_token_latency(2500.0, provider="test_provider")

        # Verify warning logged
        assert "High first token latency" in caplog.text
        assert "2500.00ms" in caplog.text
        assert "test_provider" in caplog.text

    def test_record_first_token_latency_threshold_critical(self, caplog):
        """Test critical logs for very high latency"""
        monitor = PerformanceMonitor()

        # Record critical level latency (>5000ms)
        with caplog.at_level("WARNING"):
            monitor.record_first_token_latency(6000.0, provider="slow_provider")

        # Verify critical warning logged
        assert "Critical first token latency" in caplog.text
        assert "6000.00ms" in caplog.text
        assert "slow_provider" in caplog.text


class TestStreamingCompletionMetrics:
    """Test streaming completion metrics recording"""

    def test_record_streaming_completion_basic(self):
        """Test basic streaming completion recording"""
        monitor = PerformanceMonitor()

        # Record completion
        duration_ms = 5000.0
        token_count = 200
        monitor.record_streaming_completion(duration_ms, token_count)

        # Verify metric recorded
        assert len(monitor.streaming_metrics) == 1
        metric = monitor.streaming_metrics[0]
        assert metric.total_duration_ms == duration_ms
        assert metric.token_count == token_count
        assert metric.avg_tokens_per_second == 40.0  # 200 tokens / 5 seconds

    def test_record_streaming_completion_with_provider(self):
        """Test completion recording with AI provider"""
        monitor = PerformanceMonitor()

        # Record completion with provider
        duration_ms = 3000.0
        token_count = 150
        provider = "anthropic"
        monitor.record_streaming_completion(
            duration_ms, token_count, provider=provider
        )

        # Verify provider tracked
        metric = monitor.streaming_metrics[0]
        assert metric.provider == provider
        assert metric.avg_tokens_per_second == 50.0  # 150 tokens / 3 seconds

    def test_record_streaming_completion_with_user_id(self):
        """Test completion recording with user ID"""
        monitor = PerformanceMonitor()

        # Record completion with user ID
        duration_ms = 4000.0
        token_count = 180
        user_id = "user_456"
        monitor.record_streaming_completion(
            duration_ms, token_count, user_id=user_id
        )

        # Verify user ID tracked
        metric = monitor.streaming_metrics[0]
        assert metric.user_id == user_id

    def test_record_streaming_completion_multiple_sessions(self):
        """Test recording multiple completion sessions"""
        monitor = PerformanceMonitor()

        # Record multiple completions
        sessions = [
            (3000.0, 150, "anthropic"),
            (4000.0, 200, "openai"),
            (5000.0, 250, "gemini")
        ]

        for duration, tokens, provider in sessions:
            monitor.record_streaming_completion(duration, tokens, provider=provider)

        # Verify all recorded
        assert len(monitor.streaming_metrics) == 3
        for i, (duration, tokens, provider) in enumerate(sessions):
            assert monitor.streaming_metrics[i].total_duration_ms == duration
            assert monitor.streaming_metrics[i].token_count == tokens
            assert monitor.streaming_metrics[i].provider == provider

    def test_record_streaming_completion_zero_duration(self):
        """Test handling of zero duration (edge case)"""
        monitor = PerformanceMonitor()

        # Record with zero duration (should not crash)
        monitor.record_streaming_completion(0.0, 100)

        # Verify avg_tokens_per_second is 0 (not division error)
        metric = monitor.streaming_metrics[0]
        assert metric.avg_tokens_per_second == 0.0

    def test_record_streaming_completion_sliding_window(self):
        """Test sliding window for completion metrics"""
        monitor = PerformanceMonitor()

        # Record 1100 completion metrics
        for i in range(1100):
            monitor.record_streaming_completion(1000.0, 50 + i)

        # Verify only last 1000 kept
        assert len(monitor.streaming_metrics) == 1000
        # First metric should have token_count 150 (50 + 100)
        assert monitor.streaming_metrics[0].token_count == 150
        # Last metric should have token_count 1149 (50 + 1099)
        assert monitor.streaming_metrics[-1].token_count == 1149

    def test_record_streaming_completion_debug_log(self, caplog):
        """Test debug logging for completion"""
        monitor = PerformanceMonitor()

        # Record completion
        with caplog.at_level("DEBUG"):
            monitor.record_streaming_completion(
                5000.0, 200, provider="test_provider"
            )

        # Verify debug log
        assert "Streaming completed" in caplog.text
        assert "200 tokens" in caplog.text
        assert "5000.00ms" in caplog.text
        assert "40.00 tokens/sec" in caplog.text
        assert "test_provider" in caplog.text


class TestStreamingErrorMetrics:
    """Test streaming error metrics recording"""

    def test_record_streaming_error_basic(self):
        """Test basic error recording"""
        monitor = PerformanceMonitor()

        # Record error
        error_message = "Connection timeout"
        monitor.record_streaming_error(error_message)

        # Verify error recorded
        assert len(monitor.streaming_metrics) == 1
        metric = monitor.streaming_metrics[0]
        assert metric.error == error_message
        assert metric.timestamp > 0
        assert metric.provider is None
        assert metric.user_id is None

    def test_record_streaming_error_with_provider(self):
        """Test error recording with AI provider"""
        monitor = PerformanceMonitor()

        # Record error with provider
        error_message = "AI provider timeout"
        provider = "anthropic"
        monitor.record_streaming_error(error_message, provider=provider)

        # Verify provider tracked
        metric = monitor.streaming_metrics[0]
        assert metric.error == error_message
        assert metric.provider == provider

    def test_record_streaming_error_with_user_id(self):
        """Test error recording with user ID"""
        monitor = PerformanceMonitor()

        # Record error with user ID
        error_message = "Network error"
        user_id = "user_789"
        monitor.record_streaming_error(error_message, user_id=user_id)

        # Verify user ID tracked
        metric = monitor.streaming_metrics[0]
        assert metric.error == error_message
        assert metric.user_id == user_id

    def test_record_streaming_error_multiple_types(self):
        """Test recording different error types"""
        monitor = PerformanceMonitor()

        # Record different errors
        errors = [
            ("Connection timeout", "anthropic"),
            ("Rate limit exceeded", "openai"),
            ("Invalid response", "gemini")
        ]

        for error, provider in errors:
            monitor.record_streaming_error(error, provider=provider)

        # Verify all recorded
        assert len(monitor.streaming_metrics) == 3
        for i, (error, provider) in enumerate(errors):
            assert monitor.streaming_metrics[i].error == error
            assert monitor.streaming_metrics[i].provider == provider

    def test_record_streaming_error_sliding_window(self):
        """Test sliding window for error metrics"""
        monitor = PerformanceMonitor()

        # Record 1100 errors
        for i in range(1100):
            monitor.record_streaming_error(f"Error {i}")

        # Verify only last 1000 kept
        assert len(monitor.streaming_metrics) == 1000
        # First metric should be "Error 100"
        assert monitor.streaming_metrics[0].error == "Error 100"
        # Last metric should be "Error 1099"
        assert monitor.streaming_metrics[-1].error == "Error 1099"

    def test_record_streaming_error_log(self, caplog):
        """Test error logging"""
        monitor = PerformanceMonitor()

        # Record error
        with caplog.at_level("ERROR"):
            monitor.record_streaming_error(
                "Test error", provider="test_provider"
            )

        # Verify error logged
        assert "Streaming error" in caplog.text
        assert "Test error" in caplog.text
        assert "test_provider" in caplog.text


class TestP95LatencyCalculation:
    """Test P95 latency calculation"""

    def test_calculate_p95_latency_basic(self):
        """Test basic P95 calculation"""
        monitor = PerformanceMonitor()

        # Record 100 latencies (1000-1099ms)
        for i in range(100):
            monitor.record_first_token_latency(1000.0 + i)

        # Calculate P95 (95th percentile)
        p95 = monitor.calculate_streaming_p95_latency()

        # P95 should be at index 95 (0-indexed) = 1095.0
        assert p95 == 1095.0

    def test_calculate_p95_latency_no_metrics(self):
        """Test P95 calculation with no metrics"""
        monitor = PerformanceMonitor()

        # Calculate P95 with empty metrics
        p95 = monitor.calculate_streaming_p95_latency()

        # Should return 0.0
        assert p95 == 0.0

    def test_calculate_p95_latency_single_metric(self):
        """Test P95 calculation with single metric"""
        monitor = PerformanceMonitor()

        # Record single latency
        monitor.record_first_token_latency(1500.0)

        # Calculate P95
        p95 = monitor.calculate_streaming_p95_latency()

        # Should return the single value
        assert p95 == 1500.0

    def test_calculate_p95_latency_by_provider(self):
        """Test P95 calculation per provider"""
        monitor = PerformanceMonitor()

        # Record latencies for different providers
        # Anthropic: 1000-1099ms
        for i in range(100):
            monitor.record_first_token_latency(1000.0 + i, provider="anthropic")

        # OpenAI: 2000-2099ms
        for i in range(100):
            monitor.record_first_token_latency(2000.0 + i, provider="openai")

        # Calculate P95 for each provider
        p95_anthropic = monitor.calculate_streaming_p95_latency(provider="anthropic")
        p95_openai = monitor.calculate_streaming_p95_latency(provider="openai")

        # Verify separate tracking
        assert p95_anthropic == 1095.0
        assert p95_openai == 2095.0

    def test_calculate_p95_latency_mixed_metrics(self):
        """Test P95 calculation ignores non-latency metrics"""
        monitor = PerformanceMonitor()

        # Record 100 first-token latencies
        for i in range(100):
            monitor.record_first_token_latency(1000.0 + i)

        # Record 50 completion metrics (no first_token_latency)
        for i in range(50):
            monitor.record_streaming_completion(5000.0, 200)

        # Record 50 errors (no first_token_latency)
        for i in range(50):
            monitor.record_streaming_error("Test error")

        # Calculate P95 (should only use first-token metrics)
        p95 = monitor.calculate_streaming_p95_latency()

        # Should be based on 100 latency metrics only
        assert p95 == 1095.0

    def test_calculate_p95_latency_large_dataset(self):
        """Test P95 calculation with large dataset"""
        monitor = PerformanceMonitor()

        # Record 1000 latencies (1000-1999ms)
        for i in range(1000):
            monitor.record_first_token_latency(1000.0 + i)

        # Calculate P95
        p95 = monitor.calculate_streaming_p95_latency()

        # P95 should be at index 950 (0-indexed) = 1950.0
        assert p95 == 1950.0

    def test_calculate_p95_latency_unordered_data(self):
        """Test P95 calculation with unordered data"""
        monitor = PerformanceMonitor()

        # Record latencies in random order
        latencies = [1500.0, 1200.0, 1800.0, 1100.0, 1900.0, 1300.0, 1600.0, 1400.0, 1700.0, 2000.0]
        for latency in latencies:
            monitor.record_first_token_latency(latency)

        # Calculate P95 (should sort internally)
        p95 = monitor.calculate_streaming_p95_latency()

        # P95 index = int(10 * 0.95) = 9 (but capped at 9 since len-1)
        # Sorted latencies: [1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000]
        # Index 9 = 2000.0
        assert p95 == 2000.0


class TestProviderSeparation:
    """Test different AI provider metrics are tracked separately"""

    def test_provider_separation_first_token_latency(self):
        """Test first-token latency tracked per provider"""
        monitor = PerformanceMonitor()

        # Record latencies for different providers
        monitor.record_first_token_latency(1000.0, provider="anthropic")
        monitor.record_first_token_latency(1500.0, provider="openai")
        monitor.record_first_token_latency(2000.0, provider="gemini")

        # Calculate statistics per provider
        stats_anthropic = monitor.calculate_streaming_statistics(5, provider="anthropic")
        stats_openai = monitor.calculate_streaming_statistics(5, provider="openai")
        stats_gemini = monitor.calculate_streaming_statistics(5, provider="gemini")

        # Verify separate tracking
        assert stats_anthropic["total_streaming_requests"] == 1
        assert stats_openai["total_streaming_requests"] == 1
        assert stats_gemini["total_streaming_requests"] == 1

    def test_provider_separation_completion_metrics(self):
        """Test completion metrics tracked per provider"""
        monitor = PerformanceMonitor()

        # Record completions for different providers
        monitor.record_streaming_completion(3000.0, 150, provider="anthropic")
        monitor.record_streaming_completion(4000.0, 200, provider="openai")
        monitor.record_streaming_completion(5000.0, 250, provider="gemini")

        # Calculate statistics per provider
        stats_anthropic = monitor.calculate_streaming_statistics(5, provider="anthropic")
        stats_openai = monitor.calculate_streaming_statistics(5, provider="openai")
        stats_gemini = monitor.calculate_streaming_statistics(5, provider="gemini")

        # Verify token throughput separated
        assert stats_anthropic["avg_tokens_per_second"] == 50.0
        assert stats_openai["avg_tokens_per_second"] == 50.0
        assert stats_gemini["avg_tokens_per_second"] == 50.0

    def test_provider_separation_error_metrics(self):
        """Test error metrics tracked per provider"""
        monitor = PerformanceMonitor()

        # Record errors for different providers
        monitor.record_streaming_error("Error A", provider="anthropic")
        monitor.record_streaming_error("Error B", provider="openai")
        monitor.record_streaming_error("Error C", provider="openai")  # 2 errors for OpenAI

        # Calculate statistics per provider
        stats_anthropic = monitor.calculate_streaming_statistics(5, provider="anthropic")
        stats_openai = monitor.calculate_streaming_statistics(5, provider="openai")

        # Verify error count separated
        assert stats_anthropic["streaming_errors"] == 1
        assert stats_openai["streaming_errors"] == 2

    def test_provider_separation_performance_summary(self):
        """Test performance summary includes per-provider stats"""
        monitor = PerformanceMonitor()

        # Record mixed metrics for different providers
        monitor.record_first_token_latency(1200.0, provider="anthropic")
        monitor.record_streaming_completion(3000.0, 150, provider="anthropic")

        monitor.record_first_token_latency(1800.0, provider="openai")
        monitor.record_streaming_completion(4000.0, 200, provider="openai")

        # Get performance summary
        summary = monitor.get_performance_summary()

        # Verify per-provider stats included
        assert "streaming_by_provider" in summary
        assert "anthropic" in summary["streaming_by_provider"]
        assert "openai" in summary["streaming_by_provider"]

        # Verify stats are separate
        anthropic_stats = summary["streaming_by_provider"]["anthropic"]
        openai_stats = summary["streaming_by_provider"]["openai"]

        assert anthropic_stats["total_streaming_requests"] >= 1
        assert openai_stats["total_streaming_requests"] >= 1

    def test_provider_separation_none_provider(self):
        """Test metrics without provider are tracked separately"""
        monitor = PerformanceMonitor()

        # Record metrics with and without provider
        monitor.record_first_token_latency(1000.0, provider="anthropic")
        monitor.record_first_token_latency(1500.0)  # No provider

        # Calculate stats with provider filter
        stats_anthropic = monitor.calculate_streaming_statistics(5, provider="anthropic")

        # Verify only provider-specific metrics counted
        assert stats_anthropic["total_streaming_requests"] == 1


class TestStreamingStatistics:
    """Test comprehensive streaming statistics calculation"""

    def test_streaming_statistics_complete(self):
        """Test complete streaming statistics with all metric types"""
        monitor = PerformanceMonitor()

        # Record complete session
        monitor.record_first_token_latency(1200.0, provider="anthropic")
        monitor.record_streaming_completion(5000.0, 200, provider="anthropic")

        # Calculate statistics
        stats = monitor.calculate_streaming_statistics(5, provider="anthropic")

        # Verify all fields present
        assert "total_streaming_requests" in stats
        assert "avg_first_token_latency_ms" in stats
        assert "first_token_p95_ms" in stats
        assert "avg_tokens_per_second" in stats
        assert "total_tokens" in stats
        assert "streaming_error_rate" in stats
        assert "streaming_errors" in stats

    def test_streaming_statistics_empty(self):
        """Test streaming statistics with no metrics"""
        monitor = PerformanceMonitor()

        # Calculate statistics with no data
        stats = monitor.calculate_streaming_statistics(5)

        # Verify defaults
        assert stats["total_streaming_requests"] == 0
        assert stats["avg_first_token_latency_ms"] == 0.0
        assert stats["first_token_p95_ms"] == 0.0
        assert stats["avg_tokens_per_second"] == 0.0
        assert stats["total_tokens"] == 0
        assert stats["streaming_error_rate"] == 0.0
        assert stats["streaming_errors"] == 0

    def test_streaming_statistics_error_rate(self):
        """Test error rate calculation in statistics"""
        monitor = PerformanceMonitor()

        # Record 8 successful completions
        for i in range(8):
            monitor.record_streaming_completion(5000.0, 200)

        # Record 2 errors
        for i in range(2):
            monitor.record_streaming_error("Test error")

        # Calculate statistics
        stats = monitor.calculate_streaming_statistics(5)

        # Verify error rate
        assert stats["total_streaming_requests"] == 10
        assert stats["streaming_errors"] == 2
        assert stats["streaming_error_rate"] == 0.2  # 2/10 = 0.2

    def test_streaming_statistics_time_window(self):
        """Test time window filtering in statistics"""
        monitor = PerformanceMonitor()

        # Record recent metric
        monitor.record_first_token_latency(1200.0)

        # Manually add old metric (>5 minutes ago)
        old_metric = StreamingMetrics(
            timestamp=time.time() - 400,  # 6 minutes ago
            first_token_latency_ms=2000.0
        )
        monitor.streaming_metrics.insert(0, old_metric)

        # Calculate statistics for last 5 minutes
        stats = monitor.calculate_streaming_statistics(5)

        # Should only include recent metric (1 request)
        assert stats["total_streaming_requests"] == 1
        # Average should be 1200.0 (not including old 2000.0)
        assert stats["avg_first_token_latency_ms"] == 1200.0


class TestIntegrationScenarios:
    """Test realistic integration scenarios"""

    def test_complete_streaming_session(self):
        """Test tracking a complete streaming session"""
        monitor = PerformanceMonitor()

        # Simulate complete session
        provider = "anthropic"
        user_id = "user_123"

        # 1. Record first token
        monitor.record_first_token_latency(1200.0, provider=provider, user_id=user_id)

        # 2. Record completion
        monitor.record_streaming_completion(5000.0, 200, provider=provider, user_id=user_id)

        # Verify metrics recorded
        assert len(monitor.streaming_metrics) == 2

        # Calculate statistics
        stats = monitor.calculate_streaming_statistics(5, provider=provider)
        assert stats["total_streaming_requests"] == 2
        assert stats["avg_first_token_latency_ms"] == 1200.0
        assert stats["avg_tokens_per_second"] == 40.0

    def test_failed_streaming_session(self):
        """Test tracking a failed streaming session"""
        monitor = PerformanceMonitor()

        # Simulate failed session
        provider = "openai"
        user_id = "user_456"

        # 1. Record first token
        monitor.record_first_token_latency(1500.0, provider=provider, user_id=user_id)

        # 2. Record error (no completion)
        monitor.record_streaming_error("Connection timeout", provider=provider, user_id=user_id)

        # Calculate statistics
        stats = monitor.calculate_streaming_statistics(5, provider=provider)
        assert stats["total_streaming_requests"] == 2
        assert stats["streaming_errors"] == 1
        assert stats["streaming_error_rate"] == 0.5  # 1 error out of 2 requests

    def test_concurrent_streaming_sessions(self):
        """Test tracking multiple concurrent streaming sessions"""
        monitor = PerformanceMonitor()

        # Simulate 3 concurrent sessions
        sessions = [
            ("anthropic", "user_1", 1200.0, 3000.0, 150),
            ("openai", "user_2", 1500.0, 4000.0, 200),
            ("gemini", "user_3", 1800.0, 5000.0, 250)
        ]

        for provider, user_id, first_token, duration, tokens in sessions:
            monitor.record_first_token_latency(first_token, provider=provider, user_id=user_id)
            monitor.record_streaming_completion(duration, tokens, provider=provider, user_id=user_id)

        # Verify all tracked
        assert len(monitor.streaming_metrics) == 6  # 3 latencies + 3 completions

        # Verify per-provider statistics
        for provider, _, _, _, _ in sessions:
            stats = monitor.calculate_streaming_statistics(5, provider=provider)
            assert stats["total_streaming_requests"] == 2  # 1 latency + 1 completion per session

    def test_performance_summary_with_streaming(self):
        """Test performance summary includes streaming metrics"""
        monitor = PerformanceMonitor()

        # Record streaming metrics
        monitor.record_first_token_latency(1200.0, provider="anthropic")
        monitor.record_streaming_completion(5000.0, 200, provider="anthropic")

        # Get performance summary
        summary = monitor.get_performance_summary()

        # Verify streaming sections exist
        assert "streaming_5min" in summary
        assert "streaming_1hour" in summary
        assert "streaming_by_provider" in summary

        # Verify streaming metrics populated
        streaming_5min = summary["streaming_5min"]
        assert streaming_5min["total_streaming_requests"] > 0
        assert streaming_5min["avg_first_token_latency_ms"] > 0
        assert streaming_5min["avg_tokens_per_second"] > 0
