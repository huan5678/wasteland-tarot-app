"""upgrade_user_karma_dual_score

Revision ID: gpql23ivbb2v
Revises: a7962bf9c4ba
Create Date: 2025-11-04 00:20:00.000000

Task 1.1: Upgrade existing user_karma table to support dual-score system
- Add alignment_karma (0-100) for faction alignment
- Migrate total_karma from User.karma_score
- Add alignment_category generated column
- Update constraints and indexes
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import text

# revision identifiers
revision = 'gpql23ivbb2v'
down_revision = 'a7962bf9c4ba'
branch_labels = None
depends_on = None


def upgrade():
    """Upgrade user_karma table to dual-score system"""
    
    # Step 1: Add id column as primary key (user_id will become unique FK)
    op.execute("ALTER TABLE user_karma DROP CONSTRAINT IF EXISTS user_karma_pkey")
    op.add_column('user_karma', sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False))
    op.create_primary_key('user_karma_pkey', 'user_karma', ['id'])
    op.create_unique_constraint('uq_user_karma_user_id', 'user_karma', ['user_id'])
    
    # Step 2: Add alignment_karma column
    op.add_column('user_karma', 
        sa.Column('alignment_karma', sa.Integer(), nullable=False, server_default='50',
                  comment='Alignment karma (0-100): affects faction affinity, character voice, AI tone')
    )
    
    # Step 3: Migrate data from User.karma_score to alignment_karma
    op.execute("""
        UPDATE user_karma uk
        SET alignment_karma = COALESCE(u.karma_score, 50)
        FROM users u
        WHERE uk.user_id = u.id
    """)
    
    # Step 4: Add alignment_category generated column  
    op.execute("""
        ALTER TABLE user_karma 
        ADD COLUMN alignment_category VARCHAR(20) 
        GENERATED ALWAYS AS (
            CASE 
                WHEN alignment_karma >= 80 THEN 'very_good'
                WHEN alignment_karma >= 60 THEN 'good'
                WHEN alignment_karma >= 40 THEN 'neutral'
                WHEN alignment_karma >= 20 THEN 'evil'
                ELSE 'very_evil'
            END
        ) STORED
    """)
    
    # Step 5: Add/update constraints
    op.create_check_constraint('check_alignment_karma_range', 'user_karma', 'alignment_karma >= 0 AND alignment_karma <= 100')
    op.drop_constraint('ck_user_karma_nonnegative', 'user_karma', type_='check')
    op.create_check_constraint('check_total_karma_positive', 'user_karma', 'total_karma >= 0')
    op.drop_constraint('ck_user_karma_min_level', 'user_karma', type_='check')
    op.create_check_constraint('check_current_level_range', 'user_karma', 'current_level >= 1 AND current_level <= 100')
    
    # Step 6: Remove old columns
    op.drop_column('user_karma', 'karma_to_next_level')
    op.drop_column('user_karma', 'rank')
    op.drop_column('user_karma', 'last_karma_at')
    
    # Step 7: Add new indexes
    op.create_index('idx_user_karma_alignment_category', 'user_karma', ['alignment_category'])
    op.create_index('idx_user_karma_total_karma', 'user_karma', ['total_karma'])
    op.create_index('idx_user_karma_current_level', 'user_karma', ['current_level'])
    
    # Step 8: Update trigger
    op.execute("""
        CREATE OR REPLACE FUNCTION update_user_karma_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    op.execute("DROP TRIGGER IF EXISTS trigger_update_user_karma_updated_at ON user_karma")
    op.execute("""
        CREATE TRIGGER trigger_update_user_karma_updated_at
        BEFORE UPDATE ON user_karma
        FOR EACH ROW
        EXECUTE FUNCTION update_user_karma_updated_at();
    """)
    
    # Step 9: Mark User.karma_score as deprecated
    op.execute("COMMENT ON COLUMN users.karma_score IS 'DEPRECATED: Use user_karma.alignment_karma instead. Will be removed after 2025-02-03.'")
    
    print("✅ user_karma table upgraded to dual-score system")


def downgrade():
    """Rollback to original user_karma structure"""
    
    # Remove new indexes
    op.drop_index('idx_user_karma_current_level', table_name='user_karma')
    op.drop_index('idx_user_karma_total_karma', table_name='user_karma')
    op.drop_index('idx_user_karma_alignment_category', table_name='user_karma')
    
    # Restore old columns
    op.add_column('user_karma', sa.Column('karma_to_next_level', sa.Integer(), nullable=False, server_default='500'))
    op.add_column('user_karma', sa.Column('rank', sa.Integer(), nullable=True))
    op.add_column('user_karma', sa.Column('last_karma_at', sa.DateTime(timezone=True), nullable=True))
    
    # Remove new columns
    op.drop_column('user_karma', 'alignment_category')
    op.drop_column('user_karma', 'alignment_karma')
    
    # Restore old constraints
    op.drop_constraint('check_current_level_range', 'user_karma', type_='check')
    op.create_check_constraint('ck_user_karma_min_level', 'user_karma', 'current_level >= 1')
    op.drop_constraint('check_total_karma_positive', 'user_karma', type_='check')
    op.create_check_constraint('ck_user_karma_nonnegative', 'user_karma', 'total_karma >= 0')
    op.drop_constraint('check_alignment_karma_range', 'user_karma', type_='check')
    
    # Restore user_id as primary key
    op.drop_constraint('uq_user_karma_user_id', 'user_karma', type_='unique')
    op.drop_constraint('user_karma_pkey', 'user_karma', type_='primary')
    op.drop_column('user_karma', 'id')
    op.create_primary_key('user_karma_pkey', 'user_karma', ['user_id'])
    
    # Remove deprecation comment
    op.execute("COMMENT ON COLUMN users.karma_score IS NULL")
    
    print("✅ Rollback successful")
