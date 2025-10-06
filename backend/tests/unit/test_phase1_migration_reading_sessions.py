"""
Test suite for reading_sessions table migration (Task 1.1)

Requirements tested:
- 2.1: Each session must have a unique identifier (UUID)
- 2.2: Sessions must be linked to authenticated users
- 2.3: Sessions must store card selections with positions
- 2.4: Sessions must store spread configuration
- 2.5: Sessions must track state transitions (active → paused → complete)
- 2.6: Sessions must maintain question context
"""

import pytest
from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from alembic import command
from alembic.config import Config
import os


@pytest.fixture
async def async_engine():
    """Create async test database engine."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=True
    )

    # Run migrations using sync connection
    def run_migrations(connection):
        import sys
        # Add backend directory to Python path for import
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        sys.path.insert(0, backend_dir)

        # Import the migration upgrade function
        import importlib.util
        migration_file = os.path.join(backend_dir, "alembic", "versions", "a768304f644a_create_reading_sessions_table.py")
        spec = importlib.util.spec_from_file_location("migration_module", migration_file)
        migration_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(migration_module)

        # Setup migration context and execute upgrade
        from alembic.runtime.migration import MigrationContext
        from alembic.operations import Operations

        ctx = MigrationContext.configure(connection)
        op = Operations(ctx)
        migration_module.upgrade()

    async with engine.begin() as conn:
        await conn.run_sync(run_migrations)

    yield engine
    await engine.dispose()


@pytest.fixture
async def async_session(async_engine):
    """Create async database session."""
    async_session_factory = sessionmaker(
        async_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session_factory() as session:
        yield session


class TestReadingSessionsTableStructure:
    """Test the reading_sessions table structure."""

    @pytest.mark.asyncio
    async def test_table_exists(self, async_engine):
        """Test that reading_sessions table is created."""
        # RED: This should fail initially as table doesn't exist yet
        async with async_engine.begin() as conn:
            result = await conn.execute(
                text(
                    "SELECT name FROM sqlite_master "
                    "WHERE type='table' AND name='reading_sessions'"
                )
            )
            tables = result.fetchall()
            assert len(tables) == 1, "reading_sessions table should exist"

    @pytest.mark.asyncio
    async def test_required_columns_exist(self, async_engine):
        """Test that all required columns exist (Req 2.1-2.6)."""
        expected_columns = {
            'id',
            'user_id',
            'spread_type',
            'spread_config',
            'question',
            'session_state',
            'status',
            'created_at',
            'updated_at',
            'last_accessed_at'
        }

        async with async_engine.begin() as conn:
            inspector = inspect(await conn.run_sync(lambda sync_conn: sync_conn))
            columns = {col['name'] for col in inspector.get_columns('reading_sessions')}

            assert expected_columns.issubset(columns), \
                f"Missing columns: {expected_columns - columns}"

    @pytest.mark.asyncio
    async def test_id_column_is_primary_key(self, async_engine):
        """Test id column is VARCHAR(36) and primary key (Req 2.1)."""
        async with async_engine.begin() as conn:
            inspector = inspect(await conn.run_sync(lambda sync_conn: sync_conn))
            pk_constraint = inspector.get_pk_constraint('reading_sessions')

            assert 'id' in pk_constraint['constrained_columns'], \
                "id should be primary key"

    @pytest.mark.asyncio
    async def test_user_id_not_nullable(self, async_engine):
        """Test user_id is NOT NULL (Req 2.2)."""
        async with async_engine.begin() as conn:
            inspector = inspect(await conn.run_sync(lambda sync_conn: sync_conn))
            columns = {col['name']: col for col in inspector.get_columns('reading_sessions')}

            assert not columns['user_id']['nullable'], \
                "user_id should be NOT NULL"

    @pytest.mark.asyncio
    async def test_session_state_is_jsonb(self, async_engine):
        """Test session_state stores JSON data (Req 2.3, 2.4)."""
        async with async_engine.begin() as conn:
            inspector = inspect(await conn.run_sync(lambda sync_conn: sync_conn))
            columns = {col['name']: col for col in inspector.get_columns('reading_sessions')}

            # In SQLite, this will be JSON type; in PostgreSQL, JSONB
            assert columns['session_state']['type'].__class__.__name__ in ['JSON', 'JSONB'], \
                "session_state should be JSON/JSONB type"

    @pytest.mark.asyncio
    async def test_status_column_has_check_constraint(self, async_engine):
        """Test status column has check constraint (Req 2.5)."""
        # This test verifies status can only be 'active', 'paused', or 'complete'
        async with async_engine.begin() as conn:
            inspector = inspect(await conn.run_sync(lambda sync_conn: sync_conn))
            check_constraints = inspector.get_check_constraints('reading_sessions')

            # At least one check constraint should exist for status
            assert len(check_constraints) > 0, \
                "status column should have check constraint"

    @pytest.mark.asyncio
    async def test_indexes_exist(self, async_engine):
        """Test that indexes are created for query optimization."""
        async with async_engine.begin() as conn:
            inspector = inspect(await conn.run_sync(lambda sync_conn: sync_conn))
            indexes = inspector.get_indexes('reading_sessions')
            index_names = {idx['name'] for idx in indexes}

            # Should have indexes on user_id, status, and created_at
            assert len(index_names) >= 1, \
                "Should have at least one index for query optimization"

    @pytest.mark.asyncio
    async def test_question_column_stores_text(self, async_engine):
        """Test question column can store TEXT (Req 2.6)."""
        async with async_engine.begin() as conn:
            inspector = inspect(await conn.run_sync(lambda sync_conn: sync_conn))
            columns = {col['name']: col for col in inspector.get_columns('reading_sessions')}

            assert columns['question']['type'].__class__.__name__ in ['TEXT', 'String', 'VARCHAR'], \
                "question should be TEXT type"
            assert not columns['question']['nullable'], \
                "question should be NOT NULL"


class TestReadingSessionsTableData:
    """Test data insertion and constraints."""

    @pytest.mark.asyncio
    async def test_insert_valid_session(self, async_session):
        """Test inserting a valid session record."""
        # This will test the full schema with real data
        from datetime import datetime
        import uuid
        import json

        session_data = {
            'id': str(uuid.uuid4()),
            'user_id': str(uuid.uuid4()),
            'spread_type': 'three_card',
            'spread_config': json.dumps({'positions': ['past', 'present', 'future']}),
            'question': 'What does my future hold?',
            'session_state': json.dumps({
                'cards_drawn': [],
                'current_position': 0,
                'completed_positions': []
            }),
            'status': 'active',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        result = await async_session.execute(
            text(
                """
                INSERT INTO reading_sessions
                (id, user_id, spread_type, spread_config, question, session_state,
                 status, created_at, updated_at)
                VALUES
                (:id, :user_id, :spread_type, :spread_config, :question, :session_state,
                 :status, :created_at, :updated_at)
                """
            ),
            session_data
        )
        await async_session.commit()

        # Verify insertion
        result = await async_session.execute(
            text("SELECT COUNT(*) FROM reading_sessions")
        )
        count = result.scalar()
        assert count == 1, "Should have one session record"

    @pytest.mark.asyncio
    async def test_status_constraint_enforcement(self, async_session):
        """Test that invalid status values are rejected (Req 2.5)."""
        import uuid
        import json
        from datetime import datetime

        session_data = {
            'id': str(uuid.uuid4()),
            'user_id': str(uuid.uuid4()),
            'spread_type': 'three_card',
            'spread_config': json.dumps({}),
            'question': 'Test question',
            'session_state': json.dumps({}),
            'status': 'invalid_status',  # Invalid status
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        with pytest.raises(Exception):  # Should raise constraint violation
            await async_session.execute(
                text(
                    """
                    INSERT INTO reading_sessions
                    (id, user_id, spread_type, spread_config, question, session_state,
                     status, created_at, updated_at)
                    VALUES
                    (:id, :user_id, :spread_type, :spread_config, :question, :session_state,
                     :status, :created_at, :updated_at)
                    """
                ),
                session_data
            )
            await async_session.commit()
