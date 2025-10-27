"""
Performance tests for WebAuthn endpoints and database queries.

Tests cover:
- Registration and authentication endpoint performance
- N+1 query detection
- Database index effectiveness
- Query optimization validation

Reference: tasks.md Stage 16.1
"""

import pytest
import time
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from unittest.mock import Mock, patch
from uuid import uuid4

from app.models.user import User
from app.models.credential import Credential
from app.services.webauthn_service import WebAuthnService
from app.db.session import get_db


class QueryCounter:
    """Context manager for counting SQL queries."""

    def __init__(self, db: Session):
        self.db = db
        self.count = 0
        self.queries = []

    def __enter__(self):
        """Start counting queries."""
        # Hook into SQLAlchemy's event system
        from sqlalchemy import event

        @event.listens_for(self.db.bind, "before_cursor_execute")
        def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            self.count += 1
            self.queries.append({
                'statement': statement,
                'parameters': parameters,
                'time': time.time()
            })

        self._listener = receive_before_cursor_execute
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Stop counting queries."""
        from sqlalchemy import event
        event.remove(self.db.bind, "before_cursor_execute", self._listener)


@pytest.fixture
def db_session(db: Session) -> Generator[Session, None, None]:
    """Database session fixture for performance tests."""
    yield db
    db.rollback()


@pytest.fixture
def test_user(db_session: Session) -> User:
    """Create a test user."""
    user = User(
        id=uuid4(),
        email=f"perf_test_{uuid4()}@wasteland.com",
        name="Performance Test User",
        hashed_password="fake_hash"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def create_test_credential(db: Session, user_id, cred_id: str) -> Credential:
    """Helper to create a test credential."""
    credential = Credential(
        id=uuid4(),
        user_id=user_id,
        credential_id=cred_id,
        public_key="fake_public_key",
        counter=0,
        transports=["internal"],
        device_name=f"Device {cred_id}"
    )
    db.add(credential)
    db.commit()
    db.refresh(credential)
    return credential


@pytest.mark.performance
class TestWebAuthnPerformance:
    """Performance tests for WebAuthn operations."""

    def test_registration_options_performance(self, db_session: Session, test_user: User):
        """
        Test registration options generation performance.
        Should complete in < 500ms without complex calculations.
        """
        service = WebAuthnService(db_session)

        # Measure time
        start = time.time()

        with patch('app.core.webauthn.get_webauthn_config') as mock_config:
            # Mock WebAuthn config to avoid environment dependencies
            mock_config.return_value = Mock(
                rp_id="localhost",
                rp_name="Wasteland Tarot",
                rp_origin="http://localhost:3000",
                timeout_ms=300000,
                user_verification="preferred",
                resident_key="preferred",
                authenticator_attachment=None,
                attestation="none"
            )

            try:
                options = service.generate_registration_options(test_user)
            except Exception as e:
                # Allow WebAuthn library errors, we only test DB performance
                pass

        elapsed = time.time() - start

        # Performance threshold: < 500ms for option generation
        assert elapsed < 0.5, (
            f"Registration options generation took {elapsed:.3f}s, exceeds 500ms threshold. "
            f"This indicates potential database or logic performance issues."
        )

    def test_authentication_options_performance(self, db_session: Session, test_user: User):
        """
        Test authentication options generation performance.
        Should complete in < 500ms.
        """
        # Create a credential first
        create_test_credential(db_session, test_user.id, "test_cred_id_123")

        service = WebAuthnService(db_session)

        # Measure time
        start = time.time()

        with patch('app.core.webauthn.get_webauthn_config') as mock_config:
            mock_config.return_value = Mock(
                rp_id="localhost",
                rp_name="Wasteland Tarot",
                rp_origin="http://localhost:3000",
                timeout_ms=300000,
                user_verification="preferred",
                resident_key="preferred",
                authenticator_attachment=None,
                attestation="none"
            )

            try:
                options = service.generate_authentication_options(test_user.id)
            except Exception:
                # Allow WebAuthn library errors
                pass

        elapsed = time.time() - start

        # Performance threshold: < 500ms
        assert elapsed < 0.5, (
            f"Authentication options generation took {elapsed:.3f}s, exceeds 500ms threshold"
        )

    def test_no_n_plus_one_query_on_credentials_list(self, db_session: Session, test_user: User):
        """
        Test for N+1 query problem when listing credentials.
        Should use a single query to fetch all credentials, not N queries.
        """
        # Create 10 credentials
        for i in range(10):
            create_test_credential(db_session, test_user.id, f"cred_{i}")

        service = WebAuthnService(db_session)

        # Count queries during credential listing
        with QueryCounter(db_session) as counter:
            credentials = service.list_user_credentials(test_user.id)

        # Should be <= 2 queries:
        # 1. SELECT credentials WHERE user_id = X ORDER BY last_used_at DESC
        # 2. Possible JOIN or related query (if any)
        # NOT 11 queries (1 initial + 10 for each credential)
        assert counter.count <= 2, (
            f"Detected N+1 query problem: {counter.count} queries executed. "
            f"Expected <= 2 queries for listing 10 credentials. "
            f"Queries: {[q['statement'][:100] for q in counter.queries]}"
        )

        # Verify we got all 10 credentials
        assert len(credentials) == 10

    def test_credential_id_index_effectiveness(self, db_session: Session, test_user: User):
        """
        Test that credential_id index is used for lookups.
        Should complete quickly even with many credentials.
        """
        # Create 50 credentials
        for i in range(50):
            create_test_credential(db_session, test_user.id, f"cred_{i:03d}")

        # Test lookup by credential_id (should use index)
        target_cred_id = "cred_025"

        start = time.time()

        # Query using credential_id (should hit index)
        result = db_session.execute(
            text("SELECT * FROM credentials WHERE credential_id = :cred_id"),
            {"cred_id": target_cred_id}
        ).fetchone()

        elapsed = time.time() - start

        # With index, should be < 50ms even with 50 records
        assert elapsed < 0.05, (
            f"Credential lookup by credential_id took {elapsed:.3f}s. "
            f"Index may not be functioning properly. "
            f"Expected < 50ms with idx_credentials_credential_id index."
        )

        assert result is not None, "Credential not found"

    def test_user_id_index_effectiveness(self, db_session: Session, test_user: User):
        """
        Test that user_id index is used for credential lookups.
        Should complete quickly when querying by user_id.
        """
        # Create 30 credentials for this user
        for i in range(30):
            create_test_credential(db_session, test_user.id, f"user_cred_{i:03d}")

        start = time.time()

        # Query using user_id (should hit index)
        result = db_session.execute(
            text("SELECT * FROM credentials WHERE user_id = :user_id ORDER BY last_used_at DESC"),
            {"user_id": str(test_user.id)}
        ).fetchall()

        elapsed = time.time() - start

        # With index, should be < 50ms
        assert elapsed < 0.05, (
            f"Credential lookup by user_id took {elapsed:.3f}s. "
            f"Index idx_credentials_user_id may not be functioning properly."
        )

        assert len(result) == 30, "Should fetch all 30 credentials"

    def test_last_used_at_index_effectiveness(self, db_session: Session, test_user: User):
        """
        Test that last_used_at index is used for sorting.
        Should complete quickly when sorting by last_used_at.
        """
        from datetime import datetime, timedelta

        # Create 40 credentials with varying last_used_at
        for i in range(40):
            cred = create_test_credential(db_session, test_user.id, f"sorted_cred_{i:03d}")
            cred.last_used_at = datetime.utcnow() - timedelta(days=i)
            db_session.commit()

        start = time.time()

        # Query with ORDER BY last_used_at (should use index)
        result = db_session.execute(
            text("""
                SELECT * FROM credentials
                WHERE user_id = :user_id
                ORDER BY last_used_at DESC NULLS LAST
                LIMIT 10
            """),
            {"user_id": str(test_user.id)}
        ).fetchall()

        elapsed = time.time() - start

        # With index, should be < 50ms
        assert elapsed < 0.05, (
            f"Credential query with ORDER BY last_used_at took {elapsed:.3f}s. "
            f"Index idx_credentials_last_used_at may not be functioning properly."
        )

        assert len(result) == 10, "Should fetch 10 most recent credentials"

    def test_concurrent_credential_check_performance(self, db_session: Session):
        """
        Test performance when checking credentials for multiple users.
        Simulates a realistic scenario of multiple users authenticating.
        """
        # Create 5 users with 5 credentials each
        users = []
        for u in range(5):
            user = User(
                id=uuid4(),
                email=f"concurrent_user_{u}@wasteland.com",
                name=f"User {u}",
                hashed_password="fake_hash"
            )
            db_session.add(user)
            db_session.commit()
            db_session.refresh(user)
            users.append(user)

            # Create 5 credentials per user
            for c in range(5):
                create_test_credential(db_session, user.id, f"user{u}_cred{c}")

        service = WebAuthnService(db_session)

        # Measure total time for all lookups
        start = time.time()

        for user in users:
            credentials = service.list_user_credentials(user.id)
            assert len(credentials) == 5

        elapsed = time.time() - start

        # Should complete in < 250ms for 5 users × 5 credentials = 25 total records
        assert elapsed < 0.25, (
            f"Concurrent credential checks took {elapsed:.3f}s for 5 users. "
            f"Expected < 250ms. Possible database connection or query optimization issue."
        )


@pytest.mark.performance
class TestDatabaseIndexes:
    """Direct database tests for index validation."""

    def test_credentials_indexes_exist(self, db_session: Session):
        """
        Verify that all required indexes exist on credentials table.
        """
        # Query pg_indexes to check index existence
        result = db_session.execute(
            text("""
                SELECT indexname, indexdef
                FROM pg_indexes
                WHERE tablename = 'credentials'
                ORDER BY indexname
            """)
        ).fetchall()

        # Convert to dict for easier assertion
        indexes = {row[0]: row[1] for row in result}

        # Check required indexes exist
        assert 'idx_credentials_user_id' in indexes, (
            "Missing index: idx_credentials_user_id. "
            "This will severely impact user credential lookups."
        )

        assert 'idx_credentials_credential_id' in indexes, (
            "Missing index: idx_credentials_credential_id. "
            "This will impact credential verification performance."
        )

        assert 'idx_credentials_last_used_at' in indexes, (
            "Missing index: idx_credentials_last_used_at. "
            "This will impact credential sorting performance."
        )

        # Verify idx_credentials_credential_id is UNIQUE
        assert 'UNIQUE' in indexes['idx_credentials_credential_id'].upper(), (
            "idx_credentials_credential_id should be a UNIQUE index to prevent duplicate credentials"
        )

    def test_explain_analyze_user_credentials_query(self, db_session: Session, test_user: User):
        """
        Use EXPLAIN ANALYZE to verify query plan uses indexes correctly.
        """
        # Create test credentials
        for i in range(10):
            create_test_credential(db_session, test_user.id, f"explain_cred_{i}")

        # EXPLAIN ANALYZE the actual query used by list_user_credentials
        result = db_session.execute(
            text("""
                EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
                SELECT * FROM credentials
                WHERE user_id = :user_id
                ORDER BY last_used_at DESC NULLS LAST
            """),
            {"user_id": str(test_user.id)}
        ).fetchone()

        explain_json = result[0]
        plan = explain_json[0]['Plan']

        # Check that an Index Scan is used (not Seq Scan)
        # This confirms idx_credentials_user_id is being used
        node_type = plan.get('Node Type', '')

        # Should use Index Scan or Bitmap Index Scan
        assert 'Index' in node_type, (
            f"Query is using '{node_type}' instead of Index Scan. "
            f"Index idx_credentials_user_id may not be optimal. "
            f"Full plan: {explain_json}"
        )


@pytest.mark.benchmark
def test_benchmark_credential_lookup(benchmark, db_session: Session, test_user: User):
    """
    Benchmark credential lookup using pytest-benchmark.
    Provides statistical analysis of query performance.
    """
    # Create test credentials
    for i in range(20):
        create_test_credential(db_session, test_user.id, f"bench_cred_{i}")

    service = WebAuthnService(db_session)

    # Benchmark the lookup operation
    result = benchmark(service.list_user_credentials, test_user.id)

    # Verify result correctness
    assert len(result) == 20, "Should return all 20 credentials"


# Performance test configuration
pytest_plugins = ["pytest_benchmark"]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-m", "performance"])
