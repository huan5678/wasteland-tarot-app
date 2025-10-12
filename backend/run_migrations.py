#!/usr/bin/env python3
"""
Run Supabase SQL Migrations
Executes all SQL migration files in order
"""

import os
import sys
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
import psycopg2

# Load environment variables
load_dotenv(".env.test")

def run_migrations():
    """Execute all SQL migrations in order."""

    # Get database URL
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ Error: DATABASE_URL must be set")
        sys.exit(1)

    # Convert asyncpg URL to psycopg2 format
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")

    print(f"✅ Connecting to database...")

    # Get all migration files
    migrations_dir = Path("supabase/migrations")
    if not migrations_dir.exists():
        print(f"❌ Error: Migrations directory not found: {migrations_dir}")
        sys.exit(1)

    migration_files = sorted(migrations_dir.glob("*.sql"))

    if not migration_files:
        print("⚠️  No migration files found")
        return

    print(f"\n🔍 Found {len(migration_files)} migration files:\n")

    # Connect to database
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = False  # Use transactions
        print("✅ Database connection established")
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        sys.exit(1)

    # Execute each migration
    for migration_file in migration_files:
        print(f"\n📝 Executing: {migration_file.name}")

        try:
            # Read SQL file
            with open(migration_file, 'r', encoding='utf-8') as f:
                sql_content = f.read()

            # Execute SQL
            with conn.cursor() as cur:
                cur.execute(sql_content)
            conn.commit()

            print(f"   ✅ Success")

        except psycopg2.Error as e:
            print(f"   ❌ PostgreSQL Error: {e}")
            conn.rollback()
            # Continue with next migration
            continue

        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            conn.rollback()
            continue

    # Close connection
    conn.close()
    print("\n✅ Database connection closed")

    print("\n✨ Migration complete!")
    print("\n📊 Verifying tables...")

    # Create Supabase client for verification
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase: Client = create_client(supabase_url, supabase_key)

    # Verify tables exist
    tables = ["music_tracks", "playlists", "playlist_tracks", "user_ai_quotas"]
    for table in tables:
        try:
            response = supabase.table(table).select("*").limit(1).execute()
            print(f"   ✅ {table}: Table exists and accessible")
        except Exception as e:
            # Try direct database query
            try:
                conn = psycopg2.connect(db_url)
                with conn.cursor() as cur:
                    cur.execute(f"SELECT COUNT(*) FROM public.{table}")
                    count = cur.fetchone()[0]
                conn.close()
                print(f"   ⚠️  {table}: Table exists (rows: {count}) but not in PostgREST cache")
                print(f"       → Run 'NOTIFY pgrst, 'reload schema'' or restart PostgREST")
            except Exception as db_e:
                print(f"   ❌ {table}: {str(db_e)}")

if __name__ == "__main__":
    run_migrations()
