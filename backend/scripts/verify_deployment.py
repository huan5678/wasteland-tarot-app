#!/usr/bin/env python3
"""
Deployment Verification Script (Task 4.1)

This script verifies that a deployment is successful by:
1. Checking service health
2. Verifying TTS synthesis works
3. Checking metrics endpoint
4. Running smoke tests
"""

import os
import sys
import requests
import json
from pathlib import Path
from typing import Dict, Any, List, Tuple

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


class DeploymentVerifier:
    """Verify deployment is successful"""

    def __init__(self, base_url: str = None):
        """
        Initialize verifier

        Args:
            base_url: Base URL of the API (default: from env or localhost:8000)
        """
        self.base_url = base_url or os.getenv(
            "API_BASE_URL",
            "http://localhost:8000"
        )
        self.api_url = f"{self.base_url}/api/v1"
        self.errors: List[str] = []
        self.warnings: List[str] = []

    def check_health(self) -> bool:
        """Check service health endpoint"""
        try:
            response = requests.get(
                f"{self.api_url}/monitoring/health",
                timeout=5
            )
            if response.status_code == 200:
                print("✅ Health check passed")
                return True
            else:
                self.errors.append(f"Health check failed: {response.status_code}")
                return False
        except Exception as e:
            self.errors.append(f"Health check error: {e}")
            return False

    def check_metrics_endpoint(self) -> bool:
        """Check metrics endpoint is accessible"""
        try:
            response = requests.get(
                f"{self.api_url}/monitoring/metrics/prometheus",
                timeout=5
            )
            if response.status_code == 200:
                # Check for Chirp 3:HD metrics
                metrics_text = response.text
                has_chirp3_metrics = "tts_synthesis_total" in metrics_text
                if has_chirp3_metrics:
                    print("✅ Metrics endpoint accessible (Chirp 3:HD metrics present)")
                else:
                    self.warnings.append("Metrics endpoint accessible but Chirp 3:HD metrics not found")
                return True
            else:
                self.errors.append(f"Metrics endpoint failed: {response.status_code}")
                return False
        except Exception as e:
            self.errors.append(f"Metrics endpoint error: {e}")
            return False

    def check_tts_synthesis(self, use_chirp3: bool = False) -> bool:
        """Check TTS synthesis works"""
        try:
            payload = {
                "text": "Deployment verification test",
                "character_key": "pip_boy",
                "return_format": "base64"
            }

            if use_chirp3:
                payload["force_voice_model"] = "chirp3-hd"

            response = requests.post(
                f"{self.api_url}/audio/synthesize",
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                data = response.json()
                voice_model = data.get("voice_model", "unknown")
                expected_model = "chirp3-hd" if use_chirp3 else "wavenet"

                if voice_model == expected_model:
                    print(f"✅ TTS synthesis works ({voice_model})")
                    return True
                else:
                    self.warnings.append(
                        f"TTS synthesis works but wrong model: expected {expected_model}, got {voice_model}"
                    )
                    return True  # Still considered success
            else:
                self.errors.append(f"TTS synthesis failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.errors.append(f"TTS synthesis error: {e}")
            return False

    def check_environment_variables(self) -> bool:
        """Check Chirp 3:HD environment variables are set"""
        required_vars = [
            "CHIRP3_ENABLED",
            "CHIRP3_ROLLOUT_PERCENTAGE",
            "CHIRP3_ENABLED_CHARACTERS",
            "CHIRP3_FALLBACK_TO_WAVENET"
        ]

        missing = []
        for var in required_vars:
            if var not in os.environ:
                missing.append(var)

        if missing:
            self.warnings.append(f"Missing environment variables: {', '.join(missing)}")
            return False
        else:
            print("✅ All Chirp 3:HD environment variables set")
            return True

    def check_chirp3_configuration(self) -> Tuple[bool, Dict[str, Any]]:
        """Check Chirp 3:HD configuration"""
        config = {
            "enabled": os.getenv("CHIRP3_ENABLED", "false").lower() == "true",
            "rollout_percentage": int(os.getenv("CHIRP3_ROLLOUT_PERCENTAGE", "0")),
            "enabled_characters": os.getenv("CHIRP3_ENABLED_CHARACTERS", ""),
            "fallback_enabled": os.getenv("CHIRP3_FALLBACK_TO_WAVENET", "true").lower() == "true"
        }

        print("\n📋 Chirp 3:HD Configuration:")
        print(f"  Enabled: {config['enabled']}")
        print(f"  Rollout Percentage: {config['rollout_percentage']}%")
        print(f"  Enabled Characters: {config['enabled_characters'] or '(all)'}")
        print(f"  Fallback Enabled: {config['fallback_enabled']}")

        return True, config

    def verify_all(self) -> bool:
        """Run all verification checks"""
        print("🔍 Starting deployment verification...\n")

        checks = [
            ("Health Check", self.check_health),
            ("Metrics Endpoint", self.check_metrics_endpoint),
            ("TTS Synthesis (WaveNet)", lambda: self.check_tts_synthesis(use_chirp3=False)),
            ("Environment Variables", self.check_environment_variables),
        ]

        # Only check Chirp 3:HD synthesis if enabled
        chirp3_enabled = os.getenv("CHIRP3_ENABLED", "false").lower() == "true"
        if chirp3_enabled:
            checks.append(("TTS Synthesis (Chirp 3:HD)", lambda: self.check_tts_synthesis(use_chirp3=True)))

        all_passed = True
        for name, check_func in checks:
            print(f"\n🔎 {name}...")
            try:
                if not check_func():
                    all_passed = False
            except Exception as e:
                self.errors.append(f"{name} failed with exception: {e}")
                all_passed = False

        # Print configuration
        self.check_chirp3_configuration()

        # Print summary
        print("\n" + "=" * 60)
        print("📊 Verification Summary")
        print("=" * 60)

        if self.errors:
            print(f"\n❌ Errors ({len(self.errors)}):")
            for error in self.errors:
                print(f"  - {error}")
            all_passed = False

        if self.warnings:
            print(f"\n⚠️  Warnings ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"  - {warning}")

        if all_passed and not self.warnings:
            print("\n✅ All checks passed! Deployment verified.")
        elif all_passed:
            print("\n✅ All critical checks passed (with warnings).")
        else:
            print("\n❌ Deployment verification failed. Please fix errors above.")

        print("=" * 60)

        return all_passed


def main():
    """Main function"""
    import argparse

    parser = argparse.ArgumentParser(description="Verify deployment is successful")
    parser.add_argument(
        "--url",
        type=str,
        default=None,
        help="Base URL of the API (default: from API_BASE_URL env or localhost:8000)"
    )
    parser.add_argument(
        "--exit-on-error",
        action="store_true",
        help="Exit with non-zero code on error"
    )

    args = parser.parse_args()

    verifier = DeploymentVerifier(base_url=args.url)
    success = verifier.verify_all()

    if args.exit_on_error and not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
