"""add_dashboard_gamification_tables

Revision ID: a7962bf9c4ba
Revises: 6878ff58e800
Create Date: 2025-11-03 01:37:10.526816

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a7962bf9c4ba'
down_revision: Union[str, Sequence[str], None] = '6878ff58e800'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Dashboard Gamification System."""

    # ========================================
    # PHASE 1: Database Functions
    # ========================================

    # Function: update_updated_at_column() - CREATE OR REPLACE to handle existing function
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    # Function: calculate_level()
    op.execute("""
        CREATE OR REPLACE FUNCTION calculate_level(total_karma INTEGER)
        RETURNS INTEGER AS $$
        BEGIN
          RETURN FLOOR(total_karma / 500.0) + 1;
        END;
        $$ LANGUAGE plpgsql IMMUTABLE;
    """)

    # Function: calculate_karma_to_next_level()
    op.execute("""
        CREATE OR REPLACE FUNCTION calculate_karma_to_next_level(total_karma INTEGER)
        RETURNS INTEGER AS $$
        DECLARE
          current_level INTEGER;
          next_level_requirement INTEGER;
        BEGIN
          current_level := calculate_level(total_karma);
          next_level_requirement := current_level * 500;
          RETURN next_level_requirement - total_karma;
        END;
        $$ LANGUAGE plpgsql IMMUTABLE;
    """)

    # ========================================
    # PHASE 2: Karma System Tables
    # ========================================

    # Table: karma_logs
    op.create_table(
        'karma_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('action_type', sa.String(50), nullable=False),
        sa.Column('karma_amount', sa.Integer, nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('action_metadata', postgresql.JSONB, server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.CheckConstraint('karma_amount > 0', name='ck_karma_logs_positive_amount')
    )

    # Indexes for karma_logs
    op.create_index('idx_karma_logs_user_id', 'karma_logs', ['user_id'])
    op.create_index('idx_karma_logs_created_at', 'karma_logs', [sa.text('created_at DESC')])
    op.create_index('idx_karma_logs_action_type', 'karma_logs', ['action_type'])

    # Table: user_karma
    op.create_table(
        'user_karma',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('total_karma', sa.Integer, nullable=False, server_default=sa.text('0')),
        sa.Column('current_level', sa.Integer, nullable=False, server_default=sa.text('1')),
        sa.Column('karma_to_next_level', sa.Integer, nullable=False, server_default=sa.text('500')),
        sa.Column('rank', sa.Integer, nullable=True),
        sa.Column('last_karma_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.CheckConstraint('total_karma >= 0', name='ck_user_karma_nonnegative'),
        sa.CheckConstraint('current_level >= 1', name='ck_user_karma_min_level')
    )

    # Indexes for user_karma
    op.create_index('idx_user_karma_total', 'user_karma', [sa.text('total_karma DESC')])
    op.create_index('idx_user_karma_level', 'user_karma', [sa.text('current_level DESC')])

    # Trigger: user_karma updated_at
    op.execute("""
        CREATE TRIGGER update_user_karma_updated_at
        BEFORE UPDATE ON user_karma
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)

    # ========================================
    # PHASE 3: Tasks System Tables
    # ========================================

    # Table: daily_tasks (system configuration)
    op.create_table(
        'daily_tasks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('task_key', sa.String(50), unique=True, nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('target_value', sa.Integer, nullable=False),
        sa.Column('karma_reward', sa.Integer, nullable=False),
        sa.Column('display_order', sa.Integer, nullable=False, server_default=sa.text('0')),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default=sa.text('TRUE')),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.CheckConstraint('target_value > 0', name='ck_daily_tasks_positive_target'),
        sa.CheckConstraint('karma_reward > 0', name='ck_daily_tasks_positive_reward')
    )

    # Table: user_daily_tasks (user progress)
    op.create_table(
        'user_daily_tasks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('task_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('daily_tasks.id', ondelete='CASCADE'), nullable=False),
        sa.Column('task_key', sa.String(50), nullable=False),
        sa.Column('current_value', sa.Integer, nullable=False, server_default=sa.text('0')),
        sa.Column('target_value', sa.Integer, nullable=False),
        sa.Column('is_completed', sa.Boolean, nullable=False, server_default=sa.text('FALSE')),
        sa.Column('is_claimed', sa.Boolean, nullable=False, server_default=sa.text('FALSE')),
        sa.Column('completed_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('claimed_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('task_date', sa.Date, nullable=False, server_default=sa.text('CURRENT_DATE')),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.UniqueConstraint('user_id', 'task_id', 'task_date', name='uq_user_daily_task_date'),
        sa.CheckConstraint('current_value <= target_value', name='ck_user_daily_tasks_value_range')
    )

    # Indexes for user_daily_tasks
    op.create_index('idx_user_daily_tasks_user_date', 'user_daily_tasks', ['user_id', 'task_date'])
    op.create_index('idx_user_daily_tasks_date', 'user_daily_tasks', ['task_date'])

    # Trigger: user_daily_tasks updated_at
    op.execute("""
        CREATE TRIGGER update_user_daily_tasks_updated_at
        BEFORE UPDATE ON user_daily_tasks
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)

    # Table: weekly_tasks (system configuration)
    op.create_table(
        'weekly_tasks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('task_key', sa.String(50), unique=True, nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('target_value', sa.Integer, nullable=False),
        sa.Column('karma_reward', sa.Integer, nullable=False),
        sa.Column('display_order', sa.Integer, nullable=False, server_default=sa.text('0')),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default=sa.text('TRUE')),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.CheckConstraint('target_value > 0', name='ck_weekly_tasks_positive_target'),
        sa.CheckConstraint('karma_reward > 0', name='ck_weekly_tasks_positive_reward')
    )

    # Table: user_weekly_tasks (user progress)
    op.create_table(
        'user_weekly_tasks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('task_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('weekly_tasks.id', ondelete='CASCADE'), nullable=False),
        sa.Column('task_key', sa.String(50), nullable=False),
        sa.Column('current_value', sa.Integer, nullable=False, server_default=sa.text('0')),
        sa.Column('target_value', sa.Integer, nullable=False),
        sa.Column('is_completed', sa.Boolean, nullable=False, server_default=sa.text('FALSE')),
        sa.Column('is_claimed', sa.Boolean, nullable=False, server_default=sa.text('FALSE')),
        sa.Column('completed_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('claimed_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('week_start', sa.Date, nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.UniqueConstraint('user_id', 'task_id', 'week_start', name='uq_user_weekly_task_week'),
        sa.CheckConstraint('current_value <= target_value', name='ck_user_weekly_tasks_value_range')
    )

    # Indexes for user_weekly_tasks
    op.create_index('idx_user_weekly_tasks_user_week', 'user_weekly_tasks', ['user_id', 'week_start'])
    op.create_index('idx_user_weekly_tasks_week', 'user_weekly_tasks', ['week_start'])

    # Trigger: user_weekly_tasks updated_at
    op.execute("""
        CREATE TRIGGER update_user_weekly_tasks_updated_at
        BEFORE UPDATE ON user_weekly_tasks
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """)

    # ========================================
    # PHASE 4: Activity Statistics Tables
    # ========================================

    # Table: user_activity_stats
    op.create_table(
        'user_activity_stats',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('stat_date', sa.Date, nullable=False),

        # Reading activity
        sa.Column('readings_count', sa.Integer, nullable=False, server_default=sa.text('0')),
        sa.Column('unique_cards_collected', sa.Integer, nullable=False, server_default=sa.text('0')),

        # Social interactions
        sa.Column('shares_count', sa.Integer, nullable=False, server_default=sa.text('0')),
        sa.Column('likes_received', sa.Integer, nullable=False, server_default=sa.text('0')),
        sa.Column('comments_received', sa.Integer, nullable=False, server_default=sa.text('0')),

        # Login habits
        sa.Column('login_count', sa.Integer, nullable=False, server_default=sa.text('0')),
        sa.Column('login_duration_minutes', sa.Integer, nullable=False, server_default=sa.text('0')),

        # Task completion
        sa.Column('daily_tasks_completed', sa.Integer, nullable=False, server_default=sa.text('0')),
        sa.Column('weekly_tasks_completed', sa.Integer, nullable=False, server_default=sa.text('0')),

        # Karma stats
        sa.Column('karma_earned', sa.Integer, nullable=False, server_default=sa.text('0')),

        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.UniqueConstraint('user_id', 'stat_date', name='uq_user_activity_stats_date')
    )

    # Indexes for user_activity_stats
    op.create_index('idx_user_activity_stats_user_date', 'user_activity_stats', ['user_id', sa.text('stat_date DESC')])
    op.create_index('idx_user_activity_stats_date', 'user_activity_stats', [sa.text('stat_date DESC')])

    # Table: user_login_streaks
    op.create_table(
        'user_login_streaks',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('current_streak', sa.Integer, nullable=False, server_default=sa.text('0')),
        sa.Column('longest_streak', sa.Integer, nullable=False, server_default=sa.text('0')),
        sa.Column('last_login_date', sa.Date, nullable=True),
        sa.Column('milestone_3_claimed', sa.Boolean, nullable=False, server_default=sa.text('FALSE')),
        sa.Column('milestone_7_claimed', sa.Boolean, nullable=False, server_default=sa.text('FALSE')),
        sa.Column('milestone_30_claimed', sa.Boolean, nullable=False, server_default=sa.text('FALSE')),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.CheckConstraint('current_streak >= 0', name='ck_login_streaks_current_nonnegative'),
        sa.CheckConstraint('longest_streak >= 0', name='ck_login_streaks_longest_nonnegative')
    )


def downgrade() -> None:
    """Downgrade schema - Remove Dashboard Gamification System."""

    # Drop tables in reverse order (respecting foreign key constraints)
    op.drop_table('user_login_streaks')
    op.drop_table('user_activity_stats')
    op.drop_table('user_weekly_tasks')
    op.drop_table('weekly_tasks')
    op.drop_table('user_daily_tasks')
    op.drop_table('daily_tasks')
    op.drop_table('user_karma')
    op.drop_table('karma_logs')

    # Drop gamification-specific functions only (not update_updated_at_column - it's shared)
    op.execute("DROP FUNCTION IF EXISTS calculate_karma_to_next_level(INTEGER);")
    op.execute("DROP FUNCTION IF EXISTS calculate_level(INTEGER);")
    # Note: update_updated_at_column() is NOT dropped because it's used by other tables
