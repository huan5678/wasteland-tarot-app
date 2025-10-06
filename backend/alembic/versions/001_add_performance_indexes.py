"""Add performance indexes

Revision ID: 001_performance_indexes
Revises:
Create Date: 2025-10-01

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_performance_indexes'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add indexes for frequently queried columns"""

    # Reading Sessions Indexes
    op.create_index(
        'idx_reading_sessions_user_id',
        'reading_sessions',
        ['user_id'],
        unique=False
    )

    op.create_index(
        'idx_reading_sessions_created_at',
        'reading_sessions',
        ['created_at'],
        unique=False
    )

    op.create_index(
        'idx_reading_sessions_user_created',
        'reading_sessions',
        ['user_id', 'created_at'],
        unique=False
    )

    op.create_index(
        'idx_reading_sessions_spread_type',
        'reading_sessions',
        ['spread_type'],
        unique=False
    )

    op.create_index(
        'idx_reading_sessions_character_voice',
        'reading_sessions',
        ['character_voice'],
        unique=False
    )

    op.create_index(
        'idx_reading_sessions_karma_context',
        'reading_sessions',
        ['karma_context'],
        unique=False
    )

    # GIN index for tags array
    op.execute("""
        CREATE INDEX idx_reading_sessions_tags
        ON reading_sessions USING GIN (tags);
    """)

    # Full-text search index for question
    op.execute("""
        CREATE INDEX idx_reading_sessions_question_trgm
        ON reading_sessions USING gin (question gin_trgm_ops);
    """)

    # Users Indexes
    op.create_index(
        'idx_users_email',
        'users',
        ['email'],
        unique=True
    )

    op.create_index(
        'idx_users_username',
        'users',
        ['username'],
        unique=True
    )

    # Wasteland Cards Indexes
    op.create_index(
        'idx_wasteland_cards_card_type',
        'wasteland_cards',
        ['card_type'],
        unique=False
    )

    op.create_index(
        'idx_wasteland_cards_suit',
        'wasteland_cards',
        ['suit'],
        unique=False
    )

    # Spread Templates Indexes
    op.create_index(
        'idx_spread_templates_is_active',
        'spread_templates',
        ['is_active'],
        unique=False
    )

    op.create_index(
        'idx_spread_templates_difficulty',
        'spread_templates',
        ['difficulty_level'],
        unique=False
    )


def downgrade() -> None:
    """Remove performance indexes"""

    # Reading Sessions Indexes
    op.drop_index('idx_reading_sessions_user_id', table_name='reading_sessions')
    op.drop_index('idx_reading_sessions_created_at', table_name='reading_sessions')
    op.drop_index('idx_reading_sessions_user_created', table_name='reading_sessions')
    op.drop_index('idx_reading_sessions_spread_type', table_name='reading_sessions')
    op.drop_index('idx_reading_sessions_character_voice', table_name='reading_sessions')
    op.drop_index('idx_reading_sessions_karma_context', table_name='reading_sessions')

    # GIN indexes
    op.execute("DROP INDEX IF EXISTS idx_reading_sessions_tags;")
    op.execute("DROP INDEX IF EXISTS idx_reading_sessions_question_trgm;")

    # Users Indexes
    op.drop_index('idx_users_email', table_name='users')
    op.drop_index('idx_users_username', table_name='users')

    # Wasteland Cards Indexes
    op.drop_index('idx_wasteland_cards_card_type', table_name='wasteland_cards')
    op.drop_index('idx_wasteland_cards_suit', table_name='wasteland_cards')

    # Spread Templates Indexes
    op.drop_index('idx_spread_templates_is_active', table_name='spread_templates')
    op.drop_index('idx_spread_templates_difficulty', table_name='spread_templates')
