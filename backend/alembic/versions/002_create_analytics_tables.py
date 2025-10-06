"""create analytics tables

Revision ID: 002_analytics
Revises: 001_add_performance_indexes
Create Date: 2025-10-01 (Task 10.1.2)

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_analytics'
down_revision: Union[str, Sequence[str], None] = '001_performance_indexes'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - create analytics tables."""

    # Create user_analytics table
    op.create_table(
        'user_analytics',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),

        # Session tracking
        sa.Column('session_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_time_spent', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('avg_session_duration', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('last_session_at', sa.DateTime(), nullable=True),

        # Reading behavior
        sa.Column('readings_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('favorite_spread_type', sa.String(length=50), nullable=True),
        sa.Column('favorite_character_voice', sa.String(length=50), nullable=True),
        sa.Column('most_drawn_cards', sa.JSON(), nullable=False),
        sa.Column('card_study_time', sa.JSON(), nullable=False),
        sa.Column('favorited_cards', sa.JSON(), nullable=False),

        # Interaction metrics
        sa.Column('shares_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('notes_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('exports_count', sa.Integer(), nullable=False, server_default='0'),

        # Personalization data
        sa.Column('preferred_themes', sa.JSON(), nullable=False),
        sa.Column('reading_times', sa.JSON(), nullable=False),
        sa.Column('device_preferences', sa.JSON(), nullable=False),

        # Timestamps
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),

        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )

    # Create indexes for user_analytics
    op.create_index('idx_user_analytics_user_id', 'user_analytics', ['user_id'], unique=True)
    op.create_index('idx_user_analytics_last_session', 'user_analytics', ['last_session_at'])

    # Create analytics_events table
    op.create_table(
        'analytics_events',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),

        # Event details
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('event_category', sa.String(length=50), nullable=False),
        sa.Column('event_action', sa.String(length=50), nullable=False),
        sa.Column('event_data', sa.JSON(), nullable=False),

        # Session and context
        sa.Column('session_id', sa.String(length=100), nullable=True),
        sa.Column('device_type', sa.String(length=20), nullable=True),
        sa.Column('browser', sa.String(length=50), nullable=True),
        sa.Column('platform', sa.String(length=50), nullable=True),

        # Timing
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('duration', sa.Integer(), nullable=True),

        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )

    # Create indexes for analytics_events
    op.create_index('idx_analytics_events_user_id', 'analytics_events', ['user_id'])
    op.create_index('idx_analytics_events_timestamp', 'analytics_events', ['timestamp'])
    op.create_index('idx_analytics_events_event_type', 'analytics_events', ['event_type'])
    op.create_index('idx_analytics_events_session', 'analytics_events', ['session_id'])
    op.create_index('idx_analytics_events_category', 'analytics_events', ['event_category'])

    # Create reading_patterns table
    op.create_table(
        'reading_patterns',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),

        # Pattern details
        sa.Column('pattern_type', sa.String(length=50), nullable=False),
        sa.Column('pattern_data', sa.JSON(), nullable=False),
        sa.Column('frequency', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('confidence_score', sa.Float(), nullable=False, server_default='0.0'),

        # Timestamps
        sa.Column('first_observed_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('last_observed_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),

        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )

    # Create indexes for reading_patterns
    op.create_index('idx_reading_patterns_user_id', 'reading_patterns', ['user_id'])
    op.create_index('idx_reading_patterns_type', 'reading_patterns', ['pattern_type'])
    op.create_index('idx_reading_patterns_confidence', 'reading_patterns', ['confidence_score'])

    # Create user_recommendations table
    op.create_table(
        'user_recommendations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),

        # Recommendation details
        sa.Column('recommendation_type', sa.String(length=50), nullable=False),
        sa.Column('recommendation_data', sa.JSON(), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('priority', sa.Integer(), nullable=False, server_default='0'),

        # User interaction
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('shown_at', sa.DateTime(), nullable=True),
        sa.Column('accepted_at', sa.DateTime(), nullable=True),
        sa.Column('rejected_at', sa.DateTime(), nullable=True),

        # Timestamps
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=True),

        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )

    # Create indexes for user_recommendations
    op.create_index('idx_user_recommendations_user_id', 'user_recommendations', ['user_id'])
    op.create_index('idx_user_recommendations_type', 'user_recommendations', ['recommendation_type'])
    op.create_index('idx_user_recommendations_active', 'user_recommendations', ['is_active'])
    op.create_index('idx_user_recommendations_priority', 'user_recommendations', ['priority'])


def downgrade() -> None:
    """Downgrade schema - drop analytics tables."""

    # Drop user_recommendations
    op.drop_index('idx_user_recommendations_priority', table_name='user_recommendations')
    op.drop_index('idx_user_recommendations_active', table_name='user_recommendations')
    op.drop_index('idx_user_recommendations_type', table_name='user_recommendations')
    op.drop_index('idx_user_recommendations_user_id', table_name='user_recommendations')
    op.drop_table('user_recommendations')

    # Drop reading_patterns
    op.drop_index('idx_reading_patterns_confidence', table_name='reading_patterns')
    op.drop_index('idx_reading_patterns_type', table_name='reading_patterns')
    op.drop_index('idx_reading_patterns_user_id', table_name='reading_patterns')
    op.drop_table('reading_patterns')

    # Drop analytics_events
    op.drop_index('idx_analytics_events_category', table_name='analytics_events')
    op.drop_index('idx_analytics_events_session', table_name='analytics_events')
    op.drop_index('idx_analytics_events_event_type', table_name='analytics_events')
    op.drop_index('idx_analytics_events_timestamp', table_name='analytics_events')
    op.drop_index('idx_analytics_events_user_id', table_name='analytics_events')
    op.drop_table('analytics_events')

    # Drop user_analytics
    op.drop_index('idx_user_analytics_last_session', table_name='user_analytics')
    op.drop_index('idx_user_analytics_user_id', table_name='user_analytics')
    op.drop_table('user_analytics')
