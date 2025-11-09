#!/usr/bin/env python3
"""
Supabase Connection Validation and Schema Analysis
Comprehensive validation of Wasteland Tarot database configuration
"""

import os
import json
from typing import Dict, List, Any, Optional
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

class SupabaseValidator:
    """Comprehensive Supabase database validator for Wasteland Tarot"""

    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self.anon_key = os.getenv("SUPABASE_KEY")

        if not all([self.supabase_url, self.service_key, self.anon_key]):
            raise ValueError("Missing required Supabase environment variables")

        self.service_client: Client = create_client(self.supabase_url, self.service_key)
        self.anon_client: Client = create_client(self.supabase_url, self.anon_key)

        self.validation_results = {}

    def validate_environment(self) -> Dict[str, Any]:
        """Validate environment configuration"""
        print("🔧 ENVIRONMENT VALIDATION")
        print("=" * 50)

        env_check = {
            "supabase_url": bool(self.supabase_url),
            "service_role_key": bool(self.service_key),
            "anon_key": bool(self.anon_key),
            "database_url": bool(os.getenv("DATABASE_URL")),
            "project_name": os.getenv("PROJECT_NAME", "Not Set")
        }

        for key, value in env_check.items():
            status = "✅" if value else "❌"
            print(f"  {status} {key}: {value}")

        # URL format validation
        if self.supabase_url:
            if not self.supabase_url.startswith("https://") or not ".supabase.co" in self.supabase_url:
                print("  ⚠️  Supabase URL format may be incorrect")
            else:
                print("  ✅ Supabase URL format valid")

        self.validation_results["environment"] = env_check
        return env_check

    def validate_connections(self) -> Dict[str, Any]:
        """Test database connections with different permission levels"""
        print("\n🔌 CONNECTION VALIDATION")
        print("=" * 50)

        connection_results = {}

        # Test service role connection
        try:
            result = self.service_client.table('wasteland_cards').select('id', count='exact').limit(1).execute()
            connection_results["service_role"] = {
                "status": "success",
                "total_cards": result.count,
                "can_read": True,
                "error": None
            }
            print(f"  ✅ Service Role: Connected ({result.count} cards accessible)")
        except Exception as e:
            connection_results["service_role"] = {
                "status": "failed",
                "error": str(e),
                "can_read": False
            }
            print(f"  ❌ Service Role: Failed - {e}")

        # Test anonymous connection
        try:
            result = self.anon_client.table('wasteland_cards').select('id', count='exact').limit(1).execute()
            connection_results["anonymous"] = {
                "status": "success",
                "total_cards": result.count,
                "can_read": True,
                "error": None
            }
            print(f"  ✅ Anonymous: Connected ({result.count} cards accessible)")
        except Exception as e:
            connection_results["anonymous"] = {
                "status": "failed",
                "error": str(e),
                "can_read": False
            }
            print(f"  ❌ Anonymous: Failed - {e}")

        self.validation_results["connections"] = connection_results
        return connection_results

    def validate_schema_structure(self) -> Dict[str, Any]:
        """Validate wasteland_cards table structure"""
        print("\n📋 SCHEMA STRUCTURE VALIDATION")
        print("=" * 50)

        try:
            # Get a sample card to check structure
            result = self.service_client.table('wasteland_cards').select("*").limit(1).execute()

            if not result.data:
                print("  ❌ No cards found in database")
                return {"status": "failed", "reason": "empty_table"}

            sample_card = result.data[0]

            # Expected required fields based on schema
            required_fields = [
                'id', 'name', 'suit', 'number', 'upright_meaning', 'reversed_meaning',
                'radiation_level', 'threat_level', 'upright_keywords', 'reversed_keywords'
            ]

            # Expected optional enhanced fields
            enhanced_fields = [
                'pip_boy_voice', 'vault_dweller_voice', 'wasteland_trader_voice',
                'super_mutant_voice', 'codsworth_voice', 'good_interpretation',
                'neutral_interpretation', 'evil_interpretation', 'brotherhood_significance',
                'ncr_significance', 'legion_significance', 'raiders_significance',
                'wasteland_humor', 'nuka_cola_reference', 'fallout_easter_egg', 'special_ability'
            ]

            schema_validation = {
                "total_fields": len(sample_card),
                "required_fields": {},
                "enhanced_fields": {},
                "missing_required": [],
                "missing_enhanced": []
            }

            # Check required fields
            for field in required_fields:
                present = field in sample_card
                schema_validation["required_fields"][field] = present
                if not present:
                    schema_validation["missing_required"].append(field)

            # Check enhanced fields
            for field in enhanced_fields:
                present = field in sample_card
                schema_validation["enhanced_fields"][field] = present
                if not present:
                    schema_validation["missing_enhanced"].append(field)

            # Report results
            missing_req = len(schema_validation["missing_required"])
            missing_enh = len(schema_validation["missing_enhanced"])

            if missing_req == 0:
                print(f"  ✅ All {len(required_fields)} required fields present")
            else:
                print(f"  ❌ Missing {missing_req} required fields: {schema_validation['missing_required']}")

            if missing_enh == 0:
                print(f"  ✅ All {len(enhanced_fields)} enhanced fields present")
            else:
                print(f"  ⚠️  Missing {missing_enh} enhanced fields: {schema_validation['missing_enhanced']}")

            print(f"  📊 Total fields in table: {schema_validation['total_fields']}")

            # Show sample field values
            print(f"  📄 Sample card: {sample_card.get('name', 'Unknown')} ({sample_card.get('suit', 'Unknown')})")

            self.validation_results["schema"] = schema_validation
            return schema_validation

        except Exception as e:
            print(f"  ❌ Schema validation failed: {e}")
            return {"status": "failed", "error": str(e)}

    def validate_card_data_completeness(self) -> Dict[str, Any]:
        """Validate card data completeness and distribution"""
        print("\n🃏 CARD DATA VALIDATION")
        print("=" * 50)

        try:
            # Get all cards
            result = self.service_client.table('wasteland_cards').select('*').execute()
            cards = result.data

            if not cards:
                print("  ❌ No cards found")
                return {"status": "failed", "reason": "no_cards"}

            # Analyze card distribution
            suit_counts = {}
            total_cards = len(cards)

            for card in cards:
                suit = card.get('suit', 'unknown')
                suit_counts[suit] = suit_counts.get(suit, 0) + 1

            # Expected tarot deck structure: 22 Major + 14x4 Minor = 78 cards
            expected_structure = {
                'major_arcana': 22,
                'nuka_cola_bottles': 14,
                'combat_weapons': 14,
                'bottle_caps': 14,
                'radiation_rods': 14
            }

            print(f"  📊 Total cards: {total_cards}/78 expected")

            structure_valid = True
            for suit, expected_count in expected_structure.items():
                actual_count = suit_counts.get(suit, 0)
                status = "✅" if actual_count == expected_count else "❌"
                print(f"  {status} {suit}: {actual_count}/{expected_count}")
                if actual_count != expected_count:
                    structure_valid = False

            # Check for unknown suits
            unknown_suits = [suit for suit in suit_counts if suit not in expected_structure]
            if unknown_suits:
                print(f"  ⚠️  Unknown suits found: {unknown_suits}")
                structure_valid = False

            # Check data quality for random sample
            sample_cards = cards[:3]  # Check first 3 cards
            quality_issues = []

            for card in sample_cards:
                if not card.get('upright_meaning'):
                    quality_issues.append(f"Card {card.get('id')} missing upright_meaning")
                if not card.get('reversed_meaning'):
                    quality_issues.append(f"Card {card.get('id')} missing reversed_meaning")
                if not card.get('upright_keywords'):
                    quality_issues.append(f"Card {card.get('id')} missing upright_keywords")

            if quality_issues:
                print(f"  ⚠️  Data quality issues found:")
                for issue in quality_issues:
                    print(f"    - {issue}")
            else:
                print(f"  ✅ Data quality check passed for sample cards")

            validation_data = {
                "total_cards": total_cards,
                "expected_total": 78,
                "suit_distribution": suit_counts,
                "structure_valid": structure_valid,
                "quality_issues": quality_issues,
                "completion_percentage": (total_cards / 78) * 100
            }

            self.validation_results["card_data"] = validation_data
            return validation_data

        except Exception as e:
            print(f"  ❌ Card data validation failed: {e}")
            return {"status": "failed", "error": str(e)}

    def validate_rls_policies(self) -> Dict[str, Any]:
        """Test Row Level Security policies"""
        print("\n🔒 RLS POLICY VALIDATION")
        print("=" * 50)

        rls_results = {}

        # Test card reading with anonymous client (should work - cards are public)
        try:
            result = self.anon_client.table('wasteland_cards').select('id, name').limit(1).execute()
            rls_results["anon_card_read"] = {
                "status": "success" if result.data else "no_data",
                "accessible": bool(result.data)
            }
            print(f"  ✅ Anonymous card reading: {'Allowed' if result.data else 'No data'}")
        except Exception as e:
            rls_results["anon_card_read"] = {"status": "failed", "error": str(e)}
            print(f"  ❌ Anonymous card reading: Failed - {e}")

        # Test writing with anonymous client (should fail)
        try:
            test_card = {
                "id": "rls_test_card",
                "name": "RLS Test",
                "suit": "MAJOR_ARCANA",
                "number": 99,
                "upright_meaning": "Test",
                "reversed_meaning": "Test"
            }
            result = self.anon_client.table('wasteland_cards').insert(test_card).execute()
            rls_results["anon_card_write"] = {"status": "unexpected_success", "security_issue": True}
            print(f"  ❌ Anonymous card writing: Allowed (SECURITY ISSUE!)")

            # Clean up test data
            self.service_client.table('wasteland_cards').delete().eq('id', 'rls_test_card').execute()

        except Exception as e:
            rls_results["anon_card_write"] = {"status": "correctly_blocked", "error": str(e)}
            print(f"  ✅ Anonymous card writing: Correctly blocked")

        # Test service role writing (should work)
        try:
            test_card = {
                "id": "service_test_card",
                "name": "Service Test",
                "suit": "MAJOR_ARCANA",
                "number": 99,
                "upright_meaning": "Test",
                "reversed_meaning": "Test"
            }
            result = self.service_client.table('wasteland_cards').insert(test_card).execute()
            rls_results["service_card_write"] = {"status": "success"}
            print(f"  ✅ Service role card writing: Allowed")

            # Clean up test data
            self.service_client.table('wasteland_cards').delete().eq('id', 'service_test_card').execute()

        except Exception as e:
            rls_results["service_card_write"] = {"status": "failed", "error": str(e)}
            print(f"  ❌ Service role card writing: Failed - {e}")

        self.validation_results["rls_policies"] = rls_results
        return rls_results

    def run_full_validation(self) -> Dict[str, Any]:
        """Run complete validation suite"""
        print("🏗️ SUPABASE WASTELAND TAROT DATABASE VALIDATION")
        print("=" * 70)
        print(f"Timestamp: {datetime.now().isoformat()}")
        print()

        # Run all validation steps
        self.validate_environment()
        self.validate_connections()
        self.validate_schema_structure()
        self.validate_card_data_completeness()
        self.validate_rls_policies()

        # Generate summary
        print("\n📊 VALIDATION SUMMARY")
        print("=" * 50)

        env_ok = all(self.validation_results.get("environment", {}).values())
        connections_ok = all(
            conn.get("status") == "success"
            for conn in self.validation_results.get("connections", {}).values()
        )
        schema_ok = len(self.validation_results.get("schema", {}).get("missing_required", [])) == 0
        cards_ok = self.validation_results.get("card_data", {}).get("structure_valid", False)
        rls_ok = (
            self.validation_results.get("rls_policies", {}).get("anon_card_read", {}).get("status") == "success" and
            self.validation_results.get("rls_policies", {}).get("anon_card_write", {}).get("status") == "correctly_blocked"
        )

        print(f"  {'✅' if env_ok else '❌'} Environment Configuration")
        print(f"  {'✅' if connections_ok else '❌'} Database Connections")
        print(f"  {'✅' if schema_ok else '❌'} Schema Structure")
        print(f"  {'✅' if cards_ok else '❌'} Card Data Completeness")
        print(f"  {'✅' if rls_ok else '❌'} RLS Policies")

        overall_status = all([env_ok, connections_ok, schema_ok, cards_ok, rls_ok])
        print(f"\n🎯 Overall Status: {'✅ PASS' if overall_status else '❌ ISSUES FOUND'}")

        if not overall_status:
            print("\n🔧 RECOMMENDED ACTIONS:")
            if not env_ok:
                print("  - Check .env file configuration")
            if not connections_ok:
                print("  - Verify Supabase project settings and API keys")
            if not schema_ok:
                print("  - Run database migration to update schema")
            if not cards_ok:
                print("  - Run card seeding script to complete deck")
            if not rls_ok:
                print("  - Review and apply RLS policies")

        self.validation_results["summary"] = {
            "overall_status": overall_status,
            "environment": env_ok,
            "connections": connections_ok,
            "schema": schema_ok,
            "card_data": cards_ok,
            "rls_policies": rls_ok,
            "timestamp": datetime.now().isoformat()
        }

        return self.validation_results

    def generate_connection_example(self) -> str:
        """Generate Python connection example code"""
        return '''
# Supabase Connection Example for Wasteland Tarot
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class WastelandTarotDB:
    def __init__(self):
        # Get credentials from environment
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self.anon_key = os.getenv("SUPABASE_KEY")

        # Create clients for different permission levels
        self.service_client = create_client(self.supabase_url, self.service_key)
        self.anon_client = create_client(self.supabase_url, self.anon_key)

    def get_random_card(self) -> dict:
        """Get a random card for reading"""
        try:
            # Use anonymous client for reading cards (RLS allows this)
            result = self.anon_client.table('wasteland_cards')\\
                .select('*')\\
                .eq('is_active', True)\\
                .limit(1)\\
                .execute()

            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error fetching card: {e}")
            return None

    def get_cards_by_suit(self, suit: str) -> list:
        """Get all cards of a specific suit"""
        try:
            result = self.anon_client.table('wasteland_cards')\\
                .select('*')\\
                .eq('suit', suit)\\
                .eq('is_active', True)\\
                .order('number')\\
                .execute()

            return result.data
        except Exception as e:
            print(f"Error fetching cards by suit: {e}")
            return []

    def create_reading_session(self, user_id: str, question: str) -> str:
        """Create a new reading session (requires service role)"""
        try:
            session_data = {
                "user_id": user_id,
                "question": question,
                "session_state": "in_progress",
                "character_voice": "pip_boy"
            }

            result = self.service_client.table('reading_sessions')\\
                .insert(session_data)\\
                .execute()

            return result.data[0]['id'] if result.data else None
        except Exception as e:
            print(f"Error creating reading session: {e}")
            return None

# Usage example
db = WastelandTarotDB()

# Get a random card
card = db.get_random_card()
if card:
    print(f"Drew card: {card['name']} ({card['suit']})")
    print(f"Upright meaning: {card['upright_meaning']}")

# Get all Major Arcana cards
major_cards = db.get_cards_by_suit('major_arcana')
print(f"Found {len(major_cards)} Major Arcana cards")
'''

def main():
    """Main validation runner"""
    try:
        validator = SupabaseValidator()
        results = validator.run_full_validation()

        # Optionally save results to file
        with open('validation_results.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)

        print(f"\n💾 Detailed results saved to: validation_results.json")

        # Generate connection example
        example_code = validator.generate_connection_example()
        with open('supabase_connection_example.py', 'w', encoding='utf-8') as f:
            f.write(example_code)

        print(f"📝 Connection example saved to: supabase_connection_example.py")

    except Exception as e:
        print(f"❌ Validation failed: {e}")
        return 1

    return 0

if __name__ == "__main__":
    exit(main())