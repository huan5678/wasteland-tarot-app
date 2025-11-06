"""
Chirp 3:HD Rollout Monitoring Script (Phase 4)

Monitor Chirp 3:HD rollout metrics and generate reports.
"""

import os
import sys
import time
import requests
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, Optional

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


class Chirp3RolloutMonitor:
    """Monitor Chirp 3:HD rollout metrics"""

    def __init__(self, metrics_url: str = None):
        """
        Initialize monitor

        Args:
            metrics_url: Prometheus metrics endpoint URL
                Default: http://localhost:8000/api/v1/monitoring/metrics/prometheus
        """
        self.metrics_url = metrics_url or os.getenv(
            "METRICS_URL",
            "http://localhost:8000/api/v1/monitoring/metrics/prometheus"
        )

    def fetch_metrics(self) -> str:
        """Fetch Prometheus metrics"""
        try:
            response = requests.get(self.metrics_url, timeout=10)
            response.raise_for_status()
            return response.text
        except Exception as e:
            print(f"❌ Failed to fetch metrics: {e}")
            return ""

    def parse_metric(self, metrics_text: str, metric_name: str) -> Dict[str, float]:
        """
        Parse Prometheus metric value

        Args:
            metrics_text: Prometheus metrics text
            metric_name: Metric name to parse

        Returns:
            Dictionary of label combinations to values
        """
        result = {}
        for line in metrics_text.split('\n'):
            if line.startswith(metric_name):
                # Parse Prometheus format: metric_name{labels} value
                if '{' in line:
                    label_part = line.split('{')[1].split('}')[0]
                    value_part = line.split('}')[1].strip()
                    value = float(value_part)
                    result[label_part] = value
                else:
                    # No labels
                    parts = line.split()
                    if len(parts) >= 2:
                        result[''] = float(parts[1])
        return result

    def get_synthesis_success_rate(self, metrics_text: str) -> float:
        """Calculate synthesis success rate"""
        total_metrics = self.parse_metric(metrics_text, "tts_synthesis_total")

        success_count = sum(
            v for k, v in total_metrics.items()
            if 'status="success"' in k
        )
        total_count = sum(total_metrics.values())

        if total_count == 0:
            return 0.0

        return (success_count / total_count) * 100

    def get_average_synthesis_time(self, metrics_text: str) -> float:
        """Calculate average synthesis time"""
        duration_sum = self.parse_metric(metrics_text, "tts_synthesis_duration_seconds_sum")
        duration_count = self.parse_metric(metrics_text, "tts_synthesis_duration_seconds_count")

        total_sum = sum(duration_sum.values())
        total_count = sum(duration_count.values())

        if total_count == 0:
            return 0.0

        return total_sum / total_count

    def get_fallback_rate(self, metrics_text: str) -> float:
        """Calculate fallback rate"""
        fallback_metrics = self.parse_metric(metrics_text, "tts_chirp3_fallback_total")
        chirp3_total = self.parse_metric(metrics_text, "tts_synthesis_total")

        fallback_count = sum(fallback_metrics.values())
        chirp3_count = sum(
            v for k, v in chirp3_total.items()
            if 'voice_model="chirp3-hd"' in k
        )

        if chirp3_count == 0:
            return 0.0

        return (fallback_count / chirp3_count) * 100

    def get_model_distribution(self, metrics_text: str) -> Dict[str, int]:
        """Get voice model distribution"""
        total_metrics = self.parse_metric(metrics_text, "tts_synthesis_total")

        distribution = {
            "chirp3-hd": 0,
            "wavenet": 0
        }

        for label, value in total_metrics.items():
            if 'voice_model="chirp3-hd"' in label:
                distribution["chirp3-hd"] += int(value)
            elif 'voice_model="wavenet"' in label:
                distribution["wavenet"] += int(value)

        return distribution

    def generate_report(self) -> Dict[str, Any]:
        """Generate monitoring report"""
        print("📊 Fetching metrics...")
        metrics_text = self.fetch_metrics()

        if not metrics_text:
            return {
                "error": "Failed to fetch metrics",
                "timestamp": datetime.now().isoformat()
            }

        success_rate = self.get_synthesis_success_rate(metrics_text)
        avg_time = self.get_average_synthesis_time(metrics_text)
        fallback_rate = self.get_fallback_rate(metrics_text)
        distribution = self.get_model_distribution(metrics_text)

        report = {
            "timestamp": datetime.now().isoformat(),
            "metrics_url": self.metrics_url,
            "synthesis_success_rate": round(success_rate, 2),
            "average_synthesis_time": round(avg_time, 3),
            "fallback_rate": round(fallback_rate, 2),
            "model_distribution": distribution,
            "status": "healthy" if success_rate > 95 and avg_time < 2.0 and fallback_rate < 5 else "warning"
        }

        return report

    def print_report(self, report: Dict[str, Any]):
        """Print formatted report"""
        print("\n" + "=" * 60)
        print("📊 Chirp 3:HD Rollout Monitoring Report")
        print("=" * 60)
        print(f"⏰ Timestamp: {report.get('timestamp', 'N/A')}")
        print()

        if "error" in report:
            print(f"❌ Error: {report['error']}")
            return

        print("📈 Key Metrics:")
        print(f"  ✅ Synthesis Success Rate: {report['synthesis_success_rate']}%")
        print(f"  ⏱️  Average Synthesis Time: {report['average_synthesis_time']}s")
        print(f"  🔄 Fallback Rate: {report['fallback_rate']}%")
        print()

        print("🎙️  Model Distribution:")
        distribution = report.get('model_distribution', {})
        total = sum(distribution.values())
        if total > 0:
            chirp3_pct = (distribution.get('chirp3-hd', 0) / total) * 100
            wavenet_pct = (distribution.get('wavenet', 0) / total) * 100
            print(f"  Chirp 3:HD: {distribution.get('chirp3-hd', 0)} ({chirp3_pct:.1f}%)")
            print(f"  WaveNet:    {distribution.get('wavenet', 0)} ({wavenet_pct:.1f}%)")
        else:
            print("  No data available")
        print()

        print("🎯 Status Checks:")
        success_rate = report['synthesis_success_rate']
        avg_time = report['average_synthesis_time']
        fallback_rate = report['fallback_rate']

        checks = [
            (success_rate > 95, f"Success Rate > 95%: {success_rate:.1f}%"),
            (avg_time < 2.0, f"Avg Time < 2s: {avg_time:.2f}s"),
            (fallback_rate < 5, f"Fallback Rate < 5%: {fallback_rate:.1f}%")
        ]

        for check, message in checks:
            status = "✅" if check else "⚠️"
            print(f"  {status} {message}")

        print()
        overall_status = report.get('status', 'unknown')
        status_icon = "✅" if overall_status == "healthy" else "⚠️"
        print(f"{status_icon} Overall Status: {overall_status.upper()}")
        print("=" * 60 + "\n")


def main():
    """Main function"""
    import argparse

    parser = argparse.ArgumentParser(description="Monitor Chirp 3:HD rollout metrics")
    parser.add_argument(
        "--url",
        type=str,
        default=None,
        help="Prometheus metrics URL"
    )
    parser.add_argument(
        "--watch",
        action="store_true",
        help="Watch mode: refresh every 60 seconds"
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=60,
        help="Refresh interval in seconds (default: 60)"
    )

    args = parser.parse_args()

    monitor = Chirp3RolloutMonitor(metrics_url=args.url)

    if args.watch:
        print(f"👀 Watching metrics (refresh every {args.interval}s)...")
        print("Press Ctrl+C to stop\n")

        try:
            while True:
                report = monitor.generate_report()
                monitor.print_report(report)
                time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\n👋 Monitoring stopped")
    else:
        report = monitor.generate_report()
        monitor.print_report(report)


if __name__ == "__main__":
    main()
