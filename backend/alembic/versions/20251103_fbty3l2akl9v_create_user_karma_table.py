"""create_user_karma_table

Revision ID: fbty3l2akl9v
Revises: 6878ff58e800
Create Date: 2025-11-03 15:15:00.000000

Task 1.1: Create user_karma table and migrate data from User.karma_score
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = 'fbty3l2akl9v'
down_revision = '6878ff58e800'  # Latest migration from versions directory
branch_labels = None
depends_on = None


def upgrade():
    """
    Create user_karma table and migrate existing karma data
    """
    
    # Step 1: Create user_karma table
    op.create_table(
        'user_karma',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('alignment_karma', sa.Integer(), nullable=False, server_default='50', 
                  comment='Alignment karma (0-100): affects faction affinity, character voice, AI tone'),
        sa.Column('total_karma', sa.Integer(), nullable=False, server_default='50',
                  comment='Total karma (cumulative): used for level calculation, never decreases'),
        sa.Column('alignment_category', sa.String(length=20), nullable=True,
                  sa.Computed("""
                      CASE 
                          WHEN alignment_karma >= 80 THEN 'very_good'
                          WHEN alignment_karma >= 60 THEN 'good'
                          WHEN alignment_karma >= 40 THEN 'neutral'
                          WHEN alignment_karma >= 20 THEN 'evil'
                          ELSE 'very_evil'
                      END
                  """, persisted=True),
                  comment='Auto-calculated alignment category (GENERATED column)'),
        sa.Column('current_level', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('user_id'),
        sa.CheckConstraint('alignment_karma >= 0 AND alignment_karma <= 100', name='check_alignment_karma_range'),
        sa.CheckConstraint('total_karma >= 0', name='check_total_karma_positive'),
        sa.CheckConstraint('current_level >= 1 AND current_level <= 100', name='check_current_level_range')
    )
    
    # Step 2: Create indexes
    op.create_index('idx_user_karma_user_id', 'user_karma', ['user_id'], unique=True)
    op.create_index('idx_user_karma_alignment_category', 'user_karma', ['alignment_category'])
    op.create_index('idx_user_karma_total_karma', 'user_karma', ['total_karma'])
    op.create_index('idx_user_karma_current_level', 'user_karma', ['current_level'])
    
    # Step 3: Create trigger for updated_at
    op.execute("""
        CREATE OR REPLACE FUNCTION update_user_karma_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    op.execute("""
        CREATE TRIGGER trigger_update_user_karma_updated_at
        BEFORE UPDATE ON user_karma
        FOR EACH ROW
        EXECUTE FUNCTION update_user_karma_updated_at();
    """)
    
    # Step 4: Migrate data from users.karma_score to user_karma
    # For each user, create a user_karma record with alignment_karma = total_karma = karma_score
    op.execute("""
        INSERT INTO user_karma (user_id, alignment_karma, total_karma, current_level, created_at, updated_at)
        SELECT 
            id AS user_id,
            COALESCE(karma_score, 50) AS alignment_karma,
            COALESCE(karma_score, 50) AS total_karma,
            1 AS current_level,  -- Everyone starts at level 1 for now (will be calculated by LevelService later)
            created_at,
            updated_at
        FROM users
        ON CONFLICT (user_id) DO NOTHING
    """)
    
    # Step 5: Verify data integrity
    connection = op.get_bind()
    result = connection.execute(text("""
        SELECT 
            (SELECT COUNT(*) FROM users) AS user_count,
            (SELECT COUNT(*) FROM user_karma) AS karma_count
    """))
    row = result.fetchone()
    
    if row[0] != row[1]:
        raise Exception(f"Data integrity check failed: users({row[0]}) != user_karma({row[1]})")
    
    print(f"✅ Migration successful: {row[1]} records migrated from users.karma_score to user_karma")
    
    # Step 6: Mark User.karma_score as deprecated (keep column for backward compatibility)
    op.execute("""
        COMMENT ON COLUMN users.karma_score IS 'DEPRECATED: Use user_karma.alignment_karma instead. Will be removed after 2025-02-03.'
    """)


def downgrade():
    """
    Rollback: Remove user_karma table and restore User.karma_score
    """
    
    # Drop trigger
    op.execute("DROP TRIGGER IF EXISTS trigger_update_user_karma_updated_at ON user_karma")
    op.execute("DROP FUNCTION IF EXISTS update_user_karma_updated_at()")
    
    # Drop indexes
    op.drop_index('idx_user_karma_current_level', table_name='user_karma')
    op.drop_index('idx_user_karma_total_karma', table_name='user_karma')
    op.drop_index('idx_user_karma_alignment_category', table_name='user_karma')
    op.drop_index('idx_user_karma_user_id', table_name='user_karma')
    
    # Drop table (CASCADE will remove FK constraints)
    op.drop_table('user_karma')
    
    # Remove deprecation comment from User.karma_score
    op.execute("COMMENT ON COLUMN users.karma_score IS NULL")
    
    print("✅ Rollback successful: user_karma table removed")
