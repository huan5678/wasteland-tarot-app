"""fix_reading_sessions_uuid_and_fk

Convert reading_sessions and session_events to use UUID types and add Foreign Key constraints.

Revision ID: 3dc09dba0617
Revises: 20251010_rls_policies
Create Date: 2025-10-10 13:55:36.851590

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '3dc09dba0617'
down_revision: Union[str, Sequence[str], None] = '20251010_rls_policies'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Convert reading_sessions and session_events to use UUID and add FK constraints."""

    # Step 1: Clean up orphaned records
    print("Step 1: Cleaning up orphaned records...")
    op.execute("""
        DELETE FROM session_events
        WHERE session_id NOT IN (SELECT id FROM reading_sessions)
    """)

    op.execute("""
        DELETE FROM reading_sessions
        WHERE user_id NOT IN (SELECT id::text FROM users)
    """)

    # Step 2: Convert reading_sessions IDs to UUID
    print("Step 2: Converting reading_sessions to UUID...")
    op.execute("""
        -- Create temporary UUID columns
        ALTER TABLE reading_sessions
        ADD COLUMN id_uuid UUID DEFAULT gen_random_uuid(),
        ADD COLUMN user_id_uuid UUID;

        -- Populate UUID columns (validate existing UUIDs or generate new ones)
        UPDATE reading_sessions
        SET
            id_uuid = CASE
                WHEN id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                THEN id::uuid
                ELSE gen_random_uuid()
            END,
            user_id_uuid = user_id::uuid;
    """)

    # Step 3: Update session_events foreign keys
    print("Step 3: Updating session_events to match UUID...")
    op.execute("""
        ALTER TABLE session_events
        ADD COLUMN session_id_uuid UUID,
        ADD COLUMN user_id_uuid UUID,
        ADD COLUMN id_uuid UUID DEFAULT gen_random_uuid();

        UPDATE session_events se
        SET
            session_id_uuid = rs.id_uuid,
            user_id_uuid = rs.user_id_uuid
        FROM reading_sessions rs
        WHERE se.session_id = rs.id;
    """)

    # Step 4: Temporarily disable RLS to allow column modifications
    print("Step 4: Temporarily disabling RLS policies...")
    op.execute("ALTER TABLE reading_sessions DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE session_events DISABLE ROW LEVEL SECURITY")

    # Step 5: Drop old columns and rename new ones
    print("Step 5: Replacing old columns with UUID columns...")
    op.execute("""
        -- reading_sessions
        ALTER TABLE reading_sessions DROP COLUMN id CASCADE;
        ALTER TABLE reading_sessions DROP COLUMN user_id CASCADE;
        ALTER TABLE reading_sessions RENAME COLUMN id_uuid TO id;
        ALTER TABLE reading_sessions RENAME COLUMN user_id_uuid TO user_id;
        ALTER TABLE reading_sessions ADD PRIMARY KEY (id);

        -- session_events
        ALTER TABLE session_events DROP COLUMN id CASCADE;
        ALTER TABLE session_events DROP COLUMN session_id CASCADE;
        ALTER TABLE session_events DROP COLUMN user_id CASCADE;
        ALTER TABLE session_events RENAME COLUMN id_uuid TO id;
        ALTER TABLE session_events RENAME COLUMN session_id_uuid TO session_id;
        ALTER TABLE session_events RENAME COLUMN user_id_uuid TO user_id;
        ALTER TABLE session_events ADD PRIMARY KEY (id);
    """)

    # Step 6: Add foreign key constraints
    print("Step 6: Adding foreign key constraints...")
    op.create_foreign_key(
        'fk_reading_sessions_user_id',
        'reading_sessions', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )

    op.create_foreign_key(
        'fk_session_events_session_id',
        'session_events', 'reading_sessions',
        ['session_id'], ['id'],
        ondelete='CASCADE'
    )

    op.create_foreign_key(
        'fk_session_events_user_id',
        'session_events', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )

    # Step 7: Recreate indexes
    print("Step 7: Recreating indexes...")
    op.create_index(
        'idx_reading_sessions_user_id',
        'reading_sessions',
        ['user_id']
    )

    op.create_index(
        'idx_session_events_session_id',
        'session_events',
        ['session_id']
    )

    op.create_index(
        'idx_session_events_user_id',
        'session_events',
        ['user_id']
    )

    # Step 8: Re-enable RLS and recreate policies
    print("Step 8: Re-enabling RLS and recreating policies...")

    # Drop existing policies if they exist
    op.execute('DROP POLICY IF EXISTS "Users can view own incomplete sessions" ON reading_sessions')
    op.execute('DROP POLICY IF EXISTS "Users can create own sessions" ON reading_sessions')
    op.execute('DROP POLICY IF EXISTS "Users can update own sessions" ON reading_sessions')
    op.execute('DROP POLICY IF EXISTS "Users can delete own sessions" ON reading_sessions')
    op.execute('DROP POLICY IF EXISTS "Service can cleanup old sessions" ON reading_sessions')
    op.execute('DROP POLICY IF EXISTS "Service role full access to sessions" ON reading_sessions')
    op.execute('DROP POLICY IF EXISTS "Users can view own events" ON session_events')
    op.execute('DROP POLICY IF EXISTS "Users can create own events" ON session_events')
    op.execute('DROP POLICY IF EXISTS "Service can access all events" ON session_events')

    op.execute("ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE session_events ENABLE ROW LEVEL SECURITY")

    # Recreate reading_sessions policies with new UUID columns
    op.execute("""
        CREATE POLICY "Users can view own incomplete sessions"
        ON reading_sessions FOR SELECT TO authenticated
        USING (auth.uid() = user_id)
    """)

    op.execute("""
        CREATE POLICY "Users can create own sessions"
        ON reading_sessions FOR INSERT TO authenticated
        WITH CHECK (auth.uid() = user_id)
    """)

    op.execute("""
        CREATE POLICY "Users can update own sessions"
        ON reading_sessions FOR UPDATE TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id)
    """)

    op.execute("""
        CREATE POLICY "Users can delete own sessions"
        ON reading_sessions FOR DELETE TO authenticated
        USING (auth.uid() = user_id)
    """)

    op.execute("""
        CREATE POLICY "Service can cleanup old sessions"
        ON reading_sessions FOR DELETE TO service_role
        USING (
            status = 'paused'
            AND last_accessed_at < NOW() - INTERVAL '30 days'
        )
    """)

    op.execute("""
        CREATE POLICY "Service role full access to sessions"
        ON reading_sessions FOR ALL TO service_role
        USING (true)
    """)

    # Recreate session_events policies with new UUID columns
    op.execute("""
        CREATE POLICY "Users can view own events"
        ON session_events FOR SELECT TO authenticated
        USING (auth.uid() = user_id)
    """)

    op.execute("""
        CREATE POLICY "Users can create own events"
        ON session_events FOR INSERT TO authenticated
        WITH CHECK (auth.uid() = user_id)
    """)

    op.execute("""
        CREATE POLICY "Service can access all events"
        ON session_events FOR ALL TO service_role
        USING (true)
    """)

    print("✅ UUID conversion, FK constraints, and RLS policies completed successfully!")


def downgrade() -> None:
    """Revert back to String(36) types."""

    print("Reverting UUID conversion...")

    # Drop foreign keys
    op.drop_constraint('fk_session_events_user_id', 'session_events')
    op.drop_constraint('fk_session_events_session_id', 'session_events')
    op.drop_constraint('fk_reading_sessions_user_id', 'reading_sessions')

    # Drop indexes
    op.drop_index('idx_session_events_user_id', 'session_events')
    op.drop_index('idx_session_events_session_id', 'session_events')
    op.drop_index('idx_reading_sessions_user_id', 'reading_sessions')

    # Convert back to String(36)
    op.execute("""
        -- reading_sessions
        ALTER TABLE reading_sessions DROP COLUMN id CASCADE;
        ALTER TABLE reading_sessions DROP COLUMN user_id;
        ALTER TABLE reading_sessions
        ADD COLUMN id VARCHAR(36) DEFAULT gen_random_uuid()::text,
        ADD COLUMN user_id VARCHAR(36);

        -- session_events
        ALTER TABLE session_events DROP COLUMN id CASCADE;
        ALTER TABLE session_events DROP COLUMN session_id;
        ALTER TABLE session_events DROP COLUMN user_id;
        ALTER TABLE session_events
        ADD COLUMN id VARCHAR(36) DEFAULT gen_random_uuid()::text,
        ADD COLUMN session_id VARCHAR(36),
        ADD COLUMN user_id VARCHAR(36);

        -- Add primary keys
        ALTER TABLE reading_sessions ADD PRIMARY KEY (id);
        ALTER TABLE session_events ADD PRIMARY KEY (id);
    """)

    print("✅ Reverted to String(36) types successfully!")
