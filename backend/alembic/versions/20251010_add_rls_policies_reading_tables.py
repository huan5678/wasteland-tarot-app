"""add_rls_policies_reading_tables

Revision ID: 20251010_rls_policies
Revises: 3118c80c0ade
Create Date: 2025-10-10 13:41:59

Add Row Level Security (RLS) policies for reading-related tables:
- reading_sessions: Protect incomplete reading sessions
- completed_readings: Protect completed readings with privacy controls
- session_events: Protect session event analytics data

Security Requirements:
1. Users can only access their own data
2. Support privacy levels for completed readings (private/friends/public)
3. Service role can perform administrative operations
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '20251010_rls_policies'
down_revision: Union[str, Sequence[str], None] = '3118c80c0ade'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add RLS policies for reading-related tables."""

    # ========================================================================
    # 1. ENABLE ROW LEVEL SECURITY
    # ========================================================================

    op.execute("ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE completed_readings ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE session_events ENABLE ROW LEVEL SECURITY")

    # ========================================================================
    # 2. READING_SESSIONS POLICIES (Incomplete Sessions)
    # ========================================================================

    # Policy 1: Users can view their own incomplete sessions
    op.execute("""
        CREATE POLICY "Users can view own incomplete sessions"
        ON reading_sessions
        FOR SELECT
        TO authenticated
        USING (auth.uid()::text = user_id)
    """)

    # Policy 2: Users can insert their own sessions
    op.execute("""
        CREATE POLICY "Users can create own sessions"
        ON reading_sessions
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid()::text = user_id)
    """)

    # Policy 3: Users can update their own sessions
    op.execute("""
        CREATE POLICY "Users can update own sessions"
        ON reading_sessions
        FOR UPDATE
        TO authenticated
        USING (auth.uid()::text = user_id)
        WITH CHECK (auth.uid()::text = user_id)
    """)

    # Policy 4: Users can delete their own sessions
    op.execute("""
        CREATE POLICY "Users can delete own sessions"
        ON reading_sessions
        FOR DELETE
        TO authenticated
        USING (auth.uid()::text = user_id)
    """)

    # Policy 5: Service role can cleanup old paused sessions
    op.execute("""
        CREATE POLICY "Service can cleanup old sessions"
        ON reading_sessions
        FOR DELETE
        TO service_role
        USING (
            status = 'paused'
            AND last_accessed_at < NOW() - INTERVAL '30 days'
        )
    """)

    # Policy 6: Service role full access
    op.execute("""
        CREATE POLICY "Service role full access to sessions"
        ON reading_sessions
        FOR ALL
        TO service_role
        USING (true)
    """)

    # ========================================================================
    # 3. COMPLETED_READINGS POLICIES (Finished Readings)
    # ========================================================================

    # Policy 1: Users can view their own readings
    op.execute("""
        CREATE POLICY "Users can view own readings"
        ON completed_readings
        FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id)
    """)

    # Policy 2: Users can view public readings
    op.execute("""
        CREATE POLICY "Users can view public readings"
        ON completed_readings
        FOR SELECT
        TO authenticated
        USING (
            privacy_level = 'public'
            AND allow_public_sharing = true
        )
    """)

    # Policy 3: Users can view friend-shared readings
    op.execute("""
        CREATE POLICY "Users can view friend shared readings"
        ON completed_readings
        FOR SELECT
        TO authenticated
        USING (
            privacy_level = 'friends'
            AND share_with_friends = true
            AND EXISTS (
                SELECT 1 FROM user_friendships
                WHERE (
                    (requester_id = auth.uid() AND recipient_id = completed_readings.user_id)
                    OR (recipient_id = auth.uid() AND requester_id = completed_readings.user_id)
                )
                AND status = 'accepted'
            )
        )
    """)

    # Policy 4: Users can view specifically shared readings
    op.execute("""
        CREATE POLICY "Users can view specifically shared readings"
        ON completed_readings
        FOR SELECT
        TO authenticated
        USING (
            auth.uid()::text = ANY(
                SELECT jsonb_array_elements_text(shared_with_users::jsonb)
            )
        )
    """)

    # Policy 5: Users can insert their own readings
    op.execute("""
        CREATE POLICY "Users can create own readings"
        ON completed_readings
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id)
    """)

    # Policy 6: Users can update their own readings (metadata only)
    op.execute("""
        CREATE POLICY "Users can update own readings"
        ON completed_readings
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id)
    """)

    # Policy 7: Users can delete their own readings
    op.execute("""
        CREATE POLICY "Users can delete own readings"
        ON completed_readings
        FOR DELETE
        TO authenticated
        USING (auth.uid() = user_id)
    """)

    # Policy 8: Anonymous users can view public readings
    op.execute("""
        CREATE POLICY "Anonymous can view public readings"
        ON completed_readings
        FOR SELECT
        TO anon
        USING (
            privacy_level = 'public'
            AND allow_public_sharing = true
        )
    """)

    # Policy 9: Service role full access
    op.execute("""
        CREATE POLICY "Service role full access to readings"
        ON completed_readings
        FOR ALL
        TO service_role
        USING (true)
    """)

    # ========================================================================
    # 4. SESSION_EVENTS POLICIES (Analytics & Audit Log)
    # ========================================================================

    # Policy 1: Users can view their own events
    op.execute("""
        CREATE POLICY "Users can view own events"
        ON session_events
        FOR SELECT
        TO authenticated
        USING (auth.uid()::text = user_id)
    """)

    # Policy 2: Users can insert their own events
    op.execute("""
        CREATE POLICY "Users can create own events"
        ON session_events
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid()::text = user_id)
    """)

    # Policy 3: Service role can access all events (for analytics)
    op.execute("""
        CREATE POLICY "Service can access all events"
        ON session_events
        FOR ALL
        TO service_role
        USING (true)
    """)

    # Note: No UPDATE or DELETE policies for session_events
    # Events are immutable audit logs

    # ========================================================================
    # 5. ADD TABLE COMMENTS FOR DOCUMENTATION
    # ========================================================================

    op.execute("""
        COMMENT ON TABLE reading_sessions IS
        'Stores incomplete/paused reading sessions for Save/Resume feature.
        Users can save progress and return later to complete their reading.

        Security: RLS enabled - users can only access their own sessions.
        Cleanup: Service role automatically removes sessions paused for >30 days.'
    """)

    op.execute("""
        COMMENT ON TABLE completed_readings IS
        'Stores fully completed readings with interpretations, social features,
        privacy settings, and user feedback.

        Privacy Levels:
        - private: Only visible to the owner
        - friends: Visible to accepted friends
        - public: Visible to all authenticated and anonymous users

        Security: RLS enabled with privacy-level controls.
        Social: Supports likes, shares, comments, and tags.'
    """)

    op.execute("""
        COMMENT ON TABLE session_events IS
        'Event tracking for reading sessions (analytics and debugging).
        Captures user interactions during sessions for UX optimization.

        Security: RLS enabled - users can only view their own events.
        Immutability: Events are audit logs and cannot be modified or deleted by users.'
    """)


def downgrade() -> None:
    """Remove RLS policies and table comments."""

    # ========================================================================
    # 1. DROP POLICIES
    # ========================================================================

    # reading_sessions policies
    op.execute('DROP POLICY IF EXISTS "Users can view own incomplete sessions" ON reading_sessions')
    op.execute('DROP POLICY IF EXISTS "Users can create own sessions" ON reading_sessions')
    op.execute('DROP POLICY IF EXISTS "Users can update own sessions" ON reading_sessions')
    op.execute('DROP POLICY IF EXISTS "Users can delete own sessions" ON reading_sessions')
    op.execute('DROP POLICY IF EXISTS "Service can cleanup old sessions" ON reading_sessions')
    op.execute('DROP POLICY IF EXISTS "Service role full access to sessions" ON reading_sessions')

    # completed_readings policies
    op.execute('DROP POLICY IF EXISTS "Users can view own readings" ON completed_readings')
    op.execute('DROP POLICY IF EXISTS "Users can view public readings" ON completed_readings')
    op.execute('DROP POLICY IF EXISTS "Users can view friend shared readings" ON completed_readings')
    op.execute('DROP POLICY IF EXISTS "Users can view specifically shared readings" ON completed_readings')
    op.execute('DROP POLICY IF EXISTS "Users can create own readings" ON completed_readings')
    op.execute('DROP POLICY IF EXISTS "Users can update own readings" ON completed_readings')
    op.execute('DROP POLICY IF EXISTS "Users can delete own readings" ON completed_readings')
    op.execute('DROP POLICY IF EXISTS "Anonymous can view public readings" ON completed_readings')
    op.execute('DROP POLICY IF EXISTS "Service role full access to readings" ON completed_readings')

    # session_events policies
    op.execute('DROP POLICY IF EXISTS "Users can view own events" ON session_events')
    op.execute('DROP POLICY IF EXISTS "Users can create own events" ON session_events')
    op.execute('DROP POLICY IF EXISTS "Service can access all events" ON session_events')

    # ========================================================================
    # 2. DISABLE RLS
    # ========================================================================

    op.execute("ALTER TABLE reading_sessions DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE completed_readings DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE session_events DISABLE ROW LEVEL SECURITY")

    # ========================================================================
    # 3. REMOVE COMMENTS
    # ========================================================================

    op.execute("COMMENT ON TABLE reading_sessions IS NULL")
    op.execute("COMMENT ON TABLE completed_readings IS NULL")
    op.execute("COMMENT ON TABLE session_events IS NULL")
