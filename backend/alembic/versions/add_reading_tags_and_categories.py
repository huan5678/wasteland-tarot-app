"""Add reading tags and categories system

Revision ID: b1c2d3e4f5g6
Revises: a7962bf9c4ba
Create Date: 2025-11-11 16:00:00.000000

Creates:
- reading_categories table for user-defined reading categories
- reading_tags table for many-to-many tag relationships
- Adds category_id to completed_readings
- Adds unique constraints and indexes
- Adds trigger for 20 tag limit enforcement
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'b1c2d3e4f5g6'
down_revision = 'a7962bf9c4ba'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create reading_categories table
    op.create_table(
        'reading_categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('color', sa.String(length=7), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'name', name='uq_reading_categories_user_name')
    )
    op.create_index(op.f('ix_reading_categories_user_id'), 'reading_categories', ['user_id'], unique=False)

    # Create reading_tags table
    op.create_table(
        'reading_tags',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('reading_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tag', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint('length(tag) >= 1 AND length(tag) <= 50', name='ck_reading_tags_tag_length'),
        sa.ForeignKeyConstraint(['reading_id'], ['completed_readings.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('reading_id', 'tag', name='uq_reading_tags_reading_tag')
    )
    op.create_index(op.f('ix_reading_tags_reading_id'), 'reading_tags', ['reading_id'], unique=False)
    op.create_index(op.f('ix_reading_tags_tag'), 'reading_tags', ['tag'], unique=False)

    # Add category_id to completed_readings
    op.add_column('completed_readings', sa.Column('category_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index(op.f('ix_completed_readings_category_id'), 'completed_readings', ['category_id'], unique=False)
    op.create_foreign_key('fk_completed_readings_category_id', 'completed_readings', 'reading_categories', ['category_id'], ['id'])

    # Create trigger function to enforce 20 tag limit
    op.execute("""
        CREATE OR REPLACE FUNCTION check_tag_limit()
        RETURNS TRIGGER AS $$
        BEGIN
            IF (SELECT COUNT(*) FROM reading_tags WHERE reading_id = NEW.reading_id) >= 20 THEN
                RAISE EXCEPTION 'Maximum 20 tags per reading';
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    # Create trigger
    op.execute("""
        CREATE TRIGGER enforce_tag_limit
        BEFORE INSERT ON reading_tags
        FOR EACH ROW EXECUTE FUNCTION check_tag_limit();
    """)


def downgrade() -> None:
    # Drop trigger and function
    op.execute('DROP TRIGGER IF EXISTS enforce_tag_limit ON reading_tags')
    op.execute('DROP FUNCTION IF EXISTS check_tag_limit()')

    # Remove category_id from completed_readings
    op.drop_constraint('fk_completed_readings_category_id', 'completed_readings', type_='foreignkey')
    op.drop_index(op.f('ix_completed_readings_category_id'), table_name='completed_readings')
    op.drop_column('completed_readings', 'category_id')

    # Drop reading_tags table
    op.drop_index(op.f('ix_reading_tags_tag'), table_name='reading_tags')
    op.drop_index(op.f('ix_reading_tags_reading_id'), table_name='reading_tags')
    op.drop_table('reading_tags')

    # Drop reading_categories table
    op.drop_index(op.f('ix_reading_categories_user_id'), table_name='reading_categories')
    op.drop_table('reading_categories')
