"""add reading shares table

Revision ID: add_reading_shares_001
Revises: b1c2d3e4f5g6
Create Date: 2025-11-12 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_reading_shares_001'
down_revision = 'b1c2d3e4f5g6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create reading_shares table
    op.create_table(
        'reading_shares',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('uuid', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('reading_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('password_hash', sa.Text(), nullable=True),
        sa.Column('access_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['reading_id'], ['completed_readings.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('ix_reading_shares_uuid', 'reading_shares', ['uuid'], unique=True)
    op.create_index('ix_reading_shares_reading_id', 'reading_shares', ['reading_id'])


def downgrade() -> None:
    op.drop_index('ix_reading_shares_reading_id', table_name='reading_shares')
    op.drop_index('ix_reading_shares_uuid', table_name='reading_shares')
    op.drop_table('reading_shares')
