"""Fix wasteland_cards schema to match model

Revision ID: 007
Revises: dcb426b155c2
Create Date: 2025-10-04

Fixes 22 missing columns in wasteland_cards table and renames columns
to match the WastelandCard model definition.

Based on: tools/db_schema_check.py diagnostic results
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '007'
down_revision = 'dcb426b155c2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add missing columns and rename existing ones to match model"""

    # Step 1: Rename existing columns to match new naming convention
    # These columns exist in DB with old names, need to rename

    # Rename karma interpretation columns
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='wasteland_cards'
                      AND column_name='good_interpretation') THEN
                ALTER TABLE wasteland_cards
                RENAME COLUMN good_interpretation TO good_karma_interpretation;
            END IF;

            IF EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='wasteland_cards'
                      AND column_name='neutral_interpretation') THEN
                ALTER TABLE wasteland_cards
                RENAME COLUMN neutral_interpretation TO neutral_karma_interpretation;
            END IF;

            IF EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='wasteland_cards'
                      AND column_name='evil_interpretation') THEN
                ALTER TABLE wasteland_cards
                RENAME COLUMN evil_interpretation TO evil_karma_interpretation;
            END IF;
        END $$;
    """)

    # Rename character voice columns
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='wasteland_cards'
                      AND column_name='pip_boy_voice') THEN
                ALTER TABLE wasteland_cards
                RENAME COLUMN pip_boy_voice TO pip_boy_analysis;
            END IF;

            IF EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='wasteland_cards'
                      AND column_name='vault_dweller_voice') THEN
                ALTER TABLE wasteland_cards
                RENAME COLUMN vault_dweller_voice TO vault_dweller_perspective;
            END IF;

            IF EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='wasteland_cards'
                      AND column_name='wasteland_trader_voice') THEN
                ALTER TABLE wasteland_cards
                RENAME COLUMN wasteland_trader_voice TO wasteland_trader_wisdom;
            END IF;

            IF EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='wasteland_cards'
                      AND column_name='super_mutant_voice') THEN
                ALTER TABLE wasteland_cards
                RENAME COLUMN super_mutant_voice TO super_mutant_simplicity;
            END IF;

            IF EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='wasteland_cards'
                      AND column_name='codsworth_voice') THEN
                ALTER TABLE wasteland_cards
                RENAME COLUMN codsworth_voice TO codsworth_analysis;
            END IF;
        END $$;
    """)

    # Step 2: Add new columns that don't exist in DB

    # Add vault and faction columns
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name='wasteland_cards'
                          AND column_name='vault_number') THEN
                ALTER TABLE wasteland_cards ADD COLUMN vault_number INTEGER;
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name='wasteland_cards'
                          AND column_name='vault_dweller_significance') THEN
                ALTER TABLE wasteland_cards ADD COLUMN vault_dweller_significance TEXT;
            END IF;
        END $$;
    """)

    # Add visual and audio columns
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name='wasteland_cards'
                          AND column_name='image_url') THEN
                ALTER TABLE wasteland_cards ADD COLUMN image_url VARCHAR(500);
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name='wasteland_cards'
                          AND column_name='image_alt_text') THEN
                ALTER TABLE wasteland_cards ADD COLUMN image_alt_text TEXT;
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name='wasteland_cards'
                          AND column_name='background_image_url') THEN
                ALTER TABLE wasteland_cards ADD COLUMN background_image_url VARCHAR(500);
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name='wasteland_cards'
                          AND column_name='audio_cue_url') THEN
                ALTER TABLE wasteland_cards ADD COLUMN audio_cue_url VARCHAR(500);
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name='wasteland_cards'
                          AND column_name='geiger_sound_intensity') THEN
                ALTER TABLE wasteland_cards ADD COLUMN geiger_sound_intensity FLOAT DEFAULT 0.1;
            END IF;
        END $$;
    """)

    # Add pip-boy scan data (JSON)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name='wasteland_cards'
                          AND column_name='pip_boy_scan_data') THEN
                ALTER TABLE wasteland_cards ADD COLUMN pip_boy_scan_data JSONB;
            END IF;
        END $$;
    """)

    # Add gameplay mechanics columns
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name='wasteland_cards'
                          AND column_name='affects_luck_stat') THEN
                ALTER TABLE wasteland_cards ADD COLUMN affects_luck_stat BOOLEAN DEFAULT FALSE;
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name='wasteland_cards'
                          AND column_name='affects_charisma_stat') THEN
                ALTER TABLE wasteland_cards ADD COLUMN affects_charisma_stat BOOLEAN DEFAULT FALSE;
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name='wasteland_cards'
                          AND column_name='affects_intelligence_stat') THEN
                ALTER TABLE wasteland_cards ADD COLUMN affects_intelligence_stat BOOLEAN DEFAULT FALSE;
            END IF;
        END $$;
    """)

    # Add card metadata columns
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name='wasteland_cards'
                          AND column_name='draw_frequency') THEN
                ALTER TABLE wasteland_cards ADD COLUMN draw_frequency INTEGER DEFAULT 0;
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name='wasteland_cards'
                          AND column_name='total_appearances') THEN
                ALTER TABLE wasteland_cards ADD COLUMN total_appearances INTEGER DEFAULT 0;
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name='wasteland_cards'
                          AND column_name='last_drawn_at') THEN
                ALTER TABLE wasteland_cards ADD COLUMN last_drawn_at VARCHAR;
            END IF;
        END $$;
    """)

    # Step 3: Drop columns that are in DB but not in model
    # These are replaced by renamed columns above
    # First drop dependent views, then drop columns
    op.execute("""
        DO $$
        BEGIN
            -- Drop view if it exists
            DROP VIEW IF EXISTS popular_cards CASCADE;

            -- Drop old keyword columns if they still exist
            IF EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='wasteland_cards'
                      AND column_name='upright_keywords') THEN
                ALTER TABLE wasteland_cards DROP COLUMN upright_keywords CASCADE;
            END IF;

            IF EXISTS (SELECT 1 FROM information_schema.columns
                      WHERE table_name='wasteland_cards'
                      AND column_name='reversed_keywords') THEN
                ALTER TABLE wasteland_cards DROP COLUMN reversed_keywords CASCADE;
            END IF;
        END $$;
    """)


def downgrade() -> None:
    """Revert schema changes"""

    # Revert column renames
    op.execute("""
        ALTER TABLE wasteland_cards
        RENAME COLUMN good_karma_interpretation TO good_interpretation;

        ALTER TABLE wasteland_cards
        RENAME COLUMN neutral_karma_interpretation TO neutral_interpretation;

        ALTER TABLE wasteland_cards
        RENAME COLUMN evil_karma_interpretation TO evil_interpretation;

        ALTER TABLE wasteland_cards
        RENAME COLUMN pip_boy_analysis TO pip_boy_voice;

        ALTER TABLE wasteland_cards
        RENAME COLUMN vault_dweller_perspective TO vault_dweller_voice;

        ALTER TABLE wasteland_cards
        RENAME COLUMN wasteland_trader_wisdom TO wasteland_trader_voice;

        ALTER TABLE wasteland_cards
        RENAME COLUMN super_mutant_simplicity TO super_mutant_voice;

        ALTER TABLE wasteland_cards
        RENAME COLUMN codsworth_analysis TO codsworth_voice;
    """)

    # Drop added columns
    op.drop_column('wasteland_cards', 'vault_number')
    op.drop_column('wasteland_cards', 'vault_dweller_significance')
    op.drop_column('wasteland_cards', 'image_url')
    op.drop_column('wasteland_cards', 'image_alt_text')
    op.drop_column('wasteland_cards', 'background_image_url')
    op.drop_column('wasteland_cards', 'audio_cue_url')
    op.drop_column('wasteland_cards', 'geiger_sound_intensity')
    op.drop_column('wasteland_cards', 'pip_boy_scan_data')
    op.drop_column('wasteland_cards', 'affects_luck_stat')
    op.drop_column('wasteland_cards', 'affects_charisma_stat')
    op.drop_column('wasteland_cards', 'affects_intelligence_stat')
    op.drop_column('wasteland_cards', 'draw_frequency')
    op.drop_column('wasteland_cards', 'total_appearances')
    op.drop_column('wasteland_cards', 'last_drawn_at')

    # Restore old keyword columns
    op.add_column('wasteland_cards', sa.Column('upright_keywords', sa.TEXT()))
    op.add_column('wasteland_cards', sa.Column('reversed_keywords', sa.TEXT()))
