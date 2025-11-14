"""
Counter Validation Tests

Tests for WebAuthn credential counter verification to prevent
replay attacks and credential cloning.

Reference: FIDO2/WebAuthn Specification - Signature Counter
"""

import pytest
import logging
from uuid import uuid4

from app.models.credential import Credential
from app.core.exceptions import CounterError


class TestCounterIncrement:
    """Test normal counter increment behavior"""

    def test_counter_normal_increment(self):
        """Counter should increment normally for valid authentication"""
        credential = Credential(
            id=uuid4(),
            user_id=uuid4(),
            credential_id="test_cred_123",
            public_key="test_public_key",
            counter=10
        )

        # Normal increment (10 -> 15)
        result = credential.increment_counter(15)

        assert result is True
        assert credential.counter == 15

    def test_counter_increment_by_one(self):
        """Counter can increment by 1"""
        credential = Credential(
            id=uuid4(),
            user_id=uuid4(),
            credential_id="test_cred_456",
            public_key="test_public_key",
            counter=100
        )

        # Increment by 1 (100 -> 101)
        result = credential.increment_counter(101)

        assert result is True
        assert credential.counter == 101

    def test_counter_large_increment(self):
        """Counter can have large increments (valid for some authenticators)"""
        credential = Credential(
            id=uuid4(),
            user_id=uuid4(),
            credential_id="test_cred_789",
            public_key="test_public_key",
            counter=50
        )

        # Large increment (50 -> 1000) - valid for some authenticators
        result = credential.increment_counter(1000)

        assert result is True
        assert credential.counter == 1000

    def test_counter_from_zero(self):
        """Counter can increment from 0 (initial state)"""
        credential = Credential(
            id=uuid4(),
            user_id=uuid4(),
            credential_id="test_cred_zero",
            public_key="test_public_key",
            counter=0  # Initial state
        )

        # First use (0 -> 1)
        result = credential.increment_counter(1)

        assert result is True
        assert credential.counter == 1


class TestCounterReplayProtection:
    """Test counter regression detection (replay attack protection)"""

    def test_counter_regression_raises_error(self):
        """Counter regression should raise CounterError"""
        credential = Credential(
            id=uuid4(),
            user_id=uuid4(),
            credential_id="test_cred_regression",
            public_key="test_public_key",
            counter=100
        )

        # Attempt counter regression (100 -> 50)
        with pytest.raises(CounterError, match="時間扭曲"):
            credential.increment_counter(50)

        # Counter should remain unchanged
        assert credential.counter == 100

    def test_counter_same_value_raises_error(self):
        """Same counter value should raise CounterError (replay attack)"""
        credential = Credential(
            id=uuid4(),
            user_id=uuid4(),
            credential_id="test_cred_replay",
            public_key="test_public_key",
            counter=100
        )

        # Attempt replay (100 -> 100)
        with pytest.raises(CounterError, match="時間扭曲"):
            credential.increment_counter(100)

        # Counter should remain unchanged
        assert credential.counter == 100

    def test_counter_zero_regression_raises_error(self):
        """Counter regression to 0 should raise CounterError"""
        credential = Credential(
            id=uuid4(),
            user_id=uuid4(),
            credential_id="test_cred_zero_regression",
            public_key="test_public_key",
            counter=50
        )

        # Attempt regression to 0 (50 -> 0)
        with pytest.raises(CounterError, match="時間扭曲"):
            credential.increment_counter(0)

        assert credential.counter == 50

    def test_counter_negative_value_raises_error(self):
        """Negative counter value should raise CounterError"""
        credential = Credential(
            id=uuid4(),
            user_id=uuid4(),
            credential_id="test_cred_negative",
            public_key="test_public_key",
            counter=10
        )

        # Attempt negative counter (10 -> -5)
        with pytest.raises(CounterError, match="時間扭曲"):
            credential.increment_counter(-5)

        assert credential.counter == 10


class TestCounterSecurityLogging:
    """Test security event logging for counter anomalies"""

    def test_counter_regression_logs_security_alert(self, caplog):
        """Counter regression should log security warning"""
        credential = Credential(
            id=uuid4(),
            user_id=uuid4(),
            credential_id="test_cred_log",
            public_key="test_public_key",
            counter=100
        )

        # Set log level to WARNING to capture security alerts
        with caplog.at_level(logging.WARNING):
            try:
                credential.increment_counter(50)
            except CounterError:
                pass  # Expected

        # Verify security alert was logged
        assert any("Counter regression detected" in record.message for record in caplog.records)
        assert any("replay attack" in record.message for record in caplog.records)

    def test_counter_regression_includes_credential_info(self, caplog):
        """Security log should include credential and user info"""
        credential_id = uuid4()
        user_id = uuid4()

        credential = Credential(
            id=credential_id,
            user_id=user_id,
            credential_id="test_cred_info",
            public_key="test_public_key",
            counter=200
        )

        with caplog.at_level(logging.WARNING):
            try:
                credential.increment_counter(100)
            except CounterError:
                pass

        # Log should include credential ID and user ID
        log_messages = "\n".join(record.message for record in caplog.records)
        assert str(credential_id) in log_messages
        assert str(user_id) in log_messages


class TestCounterErrorMessage:
    """Test Fallout-themed error messages"""

    def test_error_message_is_fallout_themed(self):
        """Error message should use Fallout terminology"""
        credential = Credential(
            id=uuid4(),
            user_id=uuid4(),
            credential_id="test_cred_fallout",
            public_key="test_public_key",
            counter=100
        )

        with pytest.raises(CounterError) as exc_info:
            credential.increment_counter(50)

        error_message = str(exc_info.value)

        # Check for Fallout-themed terms
        assert "時間扭曲" in error_message or "Pip-Boy" in error_message
        assert "安全鎖" in error_message or "複製裝置" in error_message

    def test_error_message_includes_counter_values(self):
        """Error message should include expected and actual counter values"""
        credential = Credential(
            id=uuid4(),
            user_id=uuid4(),
            credential_id="test_cred_values",
            public_key="test_public_key",
            counter=150
        )

        with pytest.raises(CounterError) as exc_info:
            credential.increment_counter(100)

        error_message = str(exc_info.value)

        # Error should mention the counter values
        assert "150" in error_message  # Current counter
        assert "100" in error_message  # Attempted counter


class TestCounterEdgeCases:
    """Test edge cases and boundary conditions"""

    def test_max_counter_value(self):
        """Counter should handle large values (up to BigInteger max)"""
        credential = Credential(
            id=uuid4(),
            user_id=uuid4(),
            credential_id="test_cred_max",
            public_key="test_public_key",
            counter=2**31 - 1  # Max 32-bit signed integer
        )

        # Should increment successfully
        result = credential.increment_counter(2**31)

        assert result is True
        assert credential.counter == 2**31

    def test_counter_multiple_increments(self):
        """Counter should handle multiple sequential increments"""
        credential = Credential(
            id=uuid4(),
            user_id=uuid4(),
            credential_id="test_cred_multi",
            public_key="test_public_key",
            counter=0
        )

        # Multiple increments
        for i in range(1, 11):
            result = credential.increment_counter(i)
            assert result is True
            assert credential.counter == i

    def test_counter_stays_unchanged_on_error(self):
        """Counter should not change if increment fails"""
        credential = Credential(
            id=uuid4(),
            user_id=uuid4(),
            credential_id="test_cred_unchanged",
            public_key="test_public_key",
            counter=50
        )

        original_counter = credential.counter

        # Attempt invalid increment
        try:
            credential.increment_counter(30)  # Regression
        except CounterError:
            pass

        # Counter should remain unchanged
        assert credential.counter == original_counter
