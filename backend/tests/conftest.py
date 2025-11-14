"""
Pytest Configuration and Fixtures

Provides shared test fixtures for database sessions, test data, and utilities.
"""

# CRITICAL: Patch PostgreSQL-specific types BEFORE any model imports
from sqlalchemy import JSON, String
from sqlalchemy.types import TypeDecorator, Text
import sqlalchemy.dialects.postgresql.json as pgjson
import sqlalchemy.dialects.postgresql.array as pgarray
import sqlalchemy.dialects.postgresql as pgdialect

# Patch JSONB to use JSON for SQLite compatibility
pgjson.JSONB = JSON
pgdialect.JSONB = JSON

# Patch ARRAY to use Text (store as comma-separated string for SQLite)
class MockArray(TypeDecorator):
    """Mock ARRAY type for SQLite (stores as comma-separated text)"""
    impl = Text
    cache_ok = True

    def __init__(self, *args, **kwargs):
        """Accept any arguments to be compatible with ARRAY constructor"""
        super().__init__()

pgarray.ARRAY = MockArray
pgdialect.ARRAY = MockArray

# Now import the rest
import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from sqlalchemy.dialects import sqlite
import os
import sys

# Clear any pre-loaded model modules
if 'app.models.wasteland_card' in sys.modules:
    del sys.modules['app.models.wasteland_card']
if 'app.models.reading_enhanced' in sys.modules:
    del sys.modules['app.models.reading_enhanced']
if 'app.models.user' in sys.modules:
    del sys.modules['app.models.user']

# Now it's safe to import models
from app.models.base import BaseModel
from app.db.session import get_db

# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def db_engine():
    """Create a test database engine"""
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Enable foreign key constraints for SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    # Create all tables
    BaseModel.metadata.create_all(bind=engine)

    yield engine

    # Drop all tables after test
    BaseModel.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(scope="function")
def db_session(db_engine):
    """Create a test database session"""
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=db_engine
    )

    session = TestingSessionLocal()

    # Create trigger function and trigger for SQLite
    # Note: SQLite doesn't support PostgreSQL-style triggers,
    # so we'll need to handle tag limit validation differently in tests
    # For now, we'll rely on application-level validation

    yield session

    session.close()


@pytest.fixture(scope="function")
def db(db_session):
    """Alias for db_session to match test file conventions"""
    return db_session


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database session override"""
    from fastapi.testclient import TestClient
    from app.main import app

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def sample_user(db_session):
    """Create a sample user for testing"""
    from app.models.user import User
    import uuid

    user = User(
        id=str(uuid.uuid4()),
        username="test_user",
        email="test@example.com",
        hashed_password="fake_hashed_password"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def another_user(db_session):
    """Create another user for isolation testing"""
    from app.models.user import User
    import uuid

    user = User(
        id=str(uuid.uuid4()),
        username="another_user",
        email="another@example.com",
        hashed_password="fake_hashed_password"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def sample_reading_with_tags(db_session, sample_user):
    """Create a sample reading with tags"""
    from app.models.reading_enhanced import CompletedReading, ReadingTag
    import uuid

    reading = CompletedReading(
        id=str(uuid.uuid4()),
        user_id=sample_user.id,
        question="Test question",
        spread_type="single_card",
        cards_drawn=[],
        interpretation="Test interpretation"
    )
    db_session.add(reading)
    db_session.flush()

    # Add some tags
    tags = ["測試標籤1", "測試標籤2"]
    for tag in tags:
        reading_tag = ReadingTag(
            reading_id=reading.id,
            tag=tag
        )
        db_session.add(reading_tag)

    db_session.commit()
    db_session.refresh(reading)
    return reading
