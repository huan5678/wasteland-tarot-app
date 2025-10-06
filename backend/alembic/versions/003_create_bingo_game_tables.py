"""create bingo game tables

Revision ID: 003_bingo
Revises: 002_analytics
Create Date: 2025-10-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '003_bingo'
down_revision: Union[str, Sequence[str], None] = '002_analytics'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - create bingo game tables."""

    # Create user_bingo_cards table
    op.create_table(
        'user_bingo_cards',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('month_year', sa.Date(), nullable=False),
        sa.Column('card_data', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('user_id', 'month_year', name='uq_user_month_card')
    )

    # Create indexes for user_bingo_cards
    op.create_index('idx_user_bingo_cards_user_month', 'user_bingo_cards', ['user_id', 'month_year'])
    op.create_index('idx_user_bingo_cards_month', 'user_bingo_cards', ['month_year'])
    op.create_index(
        'idx_user_bingo_cards_active',
        'user_bingo_cards',
        ['is_active'],
        postgresql_where=sa.text('is_active = true')
    )

    # Create daily_bingo_numbers table
    op.create_table(
        'daily_bingo_numbers',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('number', sa.Integer(), nullable=False),
        sa.Column('cycle_number', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('generated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('date'),
        sa.CheckConstraint('number >= 1 AND number <= 25', name='ck_number_range')
    )

    # Create indexes for daily_bingo_numbers
    op.create_index('idx_daily_numbers_date', 'daily_bingo_numbers', ['date'], unique=True)
    op.create_index('idx_daily_numbers_cycle', 'daily_bingo_numbers', ['cycle_number'])

    # Create user_number_claims table
    op.create_table(
        'user_number_claims',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('card_id', sa.String(length=36), nullable=False),
        sa.Column('daily_number_id', sa.String(length=36), nullable=False),
        sa.Column('claim_date', sa.Date(), nullable=False),
        sa.Column('number', sa.Integer(), nullable=False),
        sa.Column('claimed_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['card_id'], ['user_bingo_cards.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['daily_number_id'], ['daily_bingo_numbers.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('user_id', 'claim_date', name='uq_user_claim_date'),
        sa.CheckConstraint('number >= 1 AND number <= 25', name='ck_claim_number_range')
    )

    # Create indexes for user_number_claims
    op.create_index('idx_claims_user_date', 'user_number_claims', ['user_id', 'claim_date'])
    op.create_index('idx_claims_card', 'user_number_claims', ['card_id'])

    # Create bingo_rewards table
    op.create_table(
        'bingo_rewards',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('card_id', sa.String(length=36), nullable=False),
        sa.Column('month_year', sa.Date(), nullable=False),
        sa.Column('line_types', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('issued_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['card_id'], ['user_bingo_cards.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('user_id', 'month_year', name='uq_user_month_reward')
    )

    # Create indexes for bingo_rewards
    op.create_index('idx_rewards_user_month', 'bingo_rewards', ['user_id', 'month_year'])

    # Create monthly_reset_logs table
    op.create_table(
        'monthly_reset_logs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('reset_date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('reset_metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('executed_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("status IN ('SUCCESS', 'FAILED', 'PARTIAL')", name='ck_reset_status')
    )

    # Create indexes for monthly_reset_logs
    op.create_index('idx_reset_logs_date', 'monthly_reset_logs', ['reset_date'])
    op.create_index('idx_reset_logs_status', 'monthly_reset_logs', ['status'])

    # Create history tables for monthly data archiving

    # Create user_bingo_cards_history table
    op.create_table(
        'user_bingo_cards_history',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('month_year', sa.Date(), nullable=False),
        sa.Column('card_data', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at_original', sa.DateTime(timezone=True), nullable=False),
        sa.Column('archived_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for user_bingo_cards_history
    op.create_index('idx_cards_history_user_month', 'user_bingo_cards_history', ['user_id', 'month_year'])

    # Create user_number_claims_history table
    op.create_table(
        'user_number_claims_history',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('card_id', sa.String(length=36), nullable=False),
        sa.Column('claim_date', sa.Date(), nullable=False),
        sa.Column('number', sa.Integer(), nullable=False),
        sa.Column('claimed_at_original', sa.DateTime(timezone=True), nullable=False),
        sa.Column('archived_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for user_number_claims_history
    op.create_index('idx_claims_history_user_month', 'user_number_claims_history', ['user_id', 'claim_date'])

    # Create bingo_rewards_history table
    op.create_table(
        'bingo_rewards_history',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('month_year', sa.Date(), nullable=False),
        sa.Column('line_types', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('issued_at_original', sa.DateTime(timezone=True), nullable=False),
        sa.Column('archived_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for bingo_rewards_history
    op.create_index('idx_rewards_history_user_month', 'bingo_rewards_history', ['user_id', 'month_year'])


def downgrade() -> None:
    """Downgrade schema - drop bingo game tables."""

    # Drop history tables
    op.drop_index('idx_rewards_history_user_month', table_name='bingo_rewards_history')
    op.drop_table('bingo_rewards_history')

    op.drop_index('idx_claims_history_user_month', table_name='user_number_claims_history')
    op.drop_table('user_number_claims_history')

    op.drop_index('idx_cards_history_user_month', table_name='user_bingo_cards_history')
    op.drop_table('user_bingo_cards_history')

    # Drop monthly_reset_logs
    op.drop_index('idx_reset_logs_status', table_name='monthly_reset_logs')
    op.drop_index('idx_reset_logs_date', table_name='monthly_reset_logs')
    op.drop_table('monthly_reset_logs')

    # Drop bingo_rewards
    op.drop_index('idx_rewards_user_month', table_name='bingo_rewards')
    op.drop_table('bingo_rewards')

    # Drop user_number_claims
    op.drop_index('idx_claims_card', table_name='user_number_claims')
    op.drop_index('idx_claims_user_date', table_name='user_number_claims')
    op.drop_table('user_number_claims')

    # Drop daily_bingo_numbers
    op.drop_index('idx_daily_numbers_cycle', table_name='daily_bingo_numbers')
    op.drop_index('idx_daily_numbers_date', table_name='daily_bingo_numbers')
    op.drop_table('daily_bingo_numbers')

    # Drop user_bingo_cards
    op.drop_index('idx_user_bingo_cards_active', table_name='user_bingo_cards')
    op.drop_index('idx_user_bingo_cards_month', table_name='user_bingo_cards')
    op.drop_index('idx_user_bingo_cards_user_month', table_name='user_bingo_cards')
    op.drop_table('user_bingo_cards')
