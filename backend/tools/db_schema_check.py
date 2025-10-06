"""
Database Schema Diagnostic Tool
Compares SQLAlchemy models with actual Supabase database schema
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import create_async_engine
from app.config import get_settings
from app.models.base import Base
from app.models import wasteland_card, reading_enhanced, user, social_features


class SchemaChecker:
    """Check database schema against SQLAlchemy models"""

    def __init__(self):
        self.settings = get_settings()
        self.engine = create_async_engine(self.settings.database_url, echo=False)
        self.issues = []

    async def get_existing_tables(self):
        """Get list of tables that exist in database"""
        async with self.engine.connect() as conn:
            result = await conn.execute(text("""
                SELECT tablename
                FROM pg_tables
                WHERE schemaname = 'public'
                ORDER BY tablename
            """))
            return [row[0] for row in result]

    async def get_table_columns(self, table_name: str):
        """Get columns for a specific table"""
        async with self.engine.connect() as conn:
            result = await conn.execute(text("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = :table_name
                ORDER BY ordinal_position
            """), {"table_name": table_name})
            return {
                row[0]: {
                    "type": row[1],
                    "nullable": row[2] == "YES"
                }
                for row in result
            }

    def get_model_columns(self, model):
        """Get columns from SQLAlchemy model"""
        columns = {}
        for column in model.__table__.columns:
            columns[column.name] = {
                "type": str(column.type),
                "nullable": column.nullable
            }
        return columns

    async def check_table(self, model, table_name: str):
        """Check if table and columns match model"""
        print(f"\n{'='*80}")
        print(f"Checking table: {table_name}")
        print(f"{'='*80}")

        # Get model columns
        model_columns = self.get_model_columns(model)
        print(f"\nModel defines {len(model_columns)} columns")

        # Check if table exists
        existing_tables = await self.get_existing_tables()
        if table_name not in existing_tables:
            print(f"❌ ERROR: Table '{table_name}' does not exist in database!")
            self.issues.append(f"Table '{table_name}' is missing")
            print(f"\n📝 Model expects these columns:")
            for col_name in sorted(model_columns.keys()):
                print(f"  - {col_name}")
            return

        # Get database columns
        db_columns = await self.get_table_columns(table_name)
        print(f"Database has {len(db_columns)} columns")

        # Check for missing columns
        missing_columns = set(model_columns.keys()) - set(db_columns.keys())
        if missing_columns:
            print(f"\n❌ Missing columns in database:")
            for col in sorted(missing_columns):
                col_info = model_columns[col]
                print(f"  - {col} ({col_info['type']}, nullable={col_info['nullable']})")
                self.issues.append(f"{table_name}.{col} is missing")

        # Check for extra columns
        extra_columns = set(db_columns.keys()) - set(model_columns.keys())
        if extra_columns:
            print(f"\n⚠️  Extra columns in database (not in model):")
            for col in sorted(extra_columns):
                print(f"  - {col}")

        # Check for matching columns
        matching_columns = set(model_columns.keys()) & set(db_columns.keys())
        if matching_columns:
            print(f"\n✅ Matching columns: {len(matching_columns)}")
            if len(matching_columns) <= 10:
                for col in sorted(matching_columns):
                    print(f"  ✓ {col}")

        if not missing_columns and not extra_columns:
            print(f"\n✅ Table '{table_name}' schema is correct!")

    async def run_checks(self):
        """Run all schema checks"""
        print("\n" + "="*80)
        print("DATABASE SCHEMA DIAGNOSTIC TOOL")
        print("="*80)
        print(f"Database URL: {self.settings.database_url.split('@')[1] if '@' in self.settings.database_url else 'hidden'}")
        print(f"Environment: {self.settings.environment}")

        # Get all tables in database
        existing_tables = await self.get_existing_tables()
        print(f"\n📊 Database has {len(existing_tables)} tables:")
        for table in existing_tables:
            print(f"  - {table}")

        # Check each model
        models_to_check = [
            (wasteland_card.WastelandCard, "wasteland_cards"),
            # Add more models as needed
        ]

        for model, table_name in models_to_check:
            try:
                await self.check_table(model, table_name)
            except Exception as e:
                print(f"\n❌ Error checking {table_name}: {e}")
                self.issues.append(f"Error checking {table_name}: {e}")

        # Print summary
        print("\n" + "="*80)
        print("SUMMARY")
        print("="*80)
        if self.issues:
            print(f"\n❌ Found {len(self.issues)} issues:")
            for i, issue in enumerate(self.issues, 1):
                print(f"  {i}. {issue}")
            print(f"\n🔧 Recommended action:")
            print(f"  Run: alembic revision --autogenerate -m 'fix_schema_issues'")
            print(f"  Then: alembic upgrade head")
        else:
            print("\n✅ All schemas are correct!")

        await self.engine.dispose()


async def main():
    checker = SchemaChecker()
    await checker.run_checks()


if __name__ == "__main__":
    asyncio.run(main())
