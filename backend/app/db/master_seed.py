"""
Master Seeding Script for Wasteland Tarot
Coordinates the seeding of all data: cards, templates, achievements, synergies
"""

import asyncio
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.append(str(backend_dir))

from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import AsyncSessionLocal, init_db
from app.db.complete_wasteland_seed import create_complete_wasteland_deck
from app.db.interpretation_templates_seed import create_interpretation_templates
from app.db.spread_templates_seed import create_spread_templates


class MasterSeeder:
    """Coordinates all seeding operations for Wasteland Tarot"""

    def __init__(self):
        self.seeding_order = [
            ("Database Tables", self._init_database_tables),
            ("Complete Card Deck (78 cards)", create_complete_wasteland_deck),
            ("Interpretation Templates", create_interpretation_templates),
            ("Spread Templates", create_spread_templates),
            ("Sample Achievements", self._create_sample_achievements),
            ("Card Synergies", self._create_sample_synergies),
            ("Community Events", self._create_sample_events)
        ]

    async def run_complete_seeding(self) -> bool:
        """Run complete seeding process"""
        print("🎲 Starting Complete Wasteland Tarot Database Seeding")
        print("=" * 60)

        success_count = 0
        total_operations = len(self.seeding_order)

        async with AsyncSessionLocal() as session:
            for i, (description, seeding_function) in enumerate(self.seeding_order, 1):
                print(f"\n[{i}/{total_operations}] {description}...")
                print("-" * 40)

                try:
                    if seeding_function == self._init_database_tables:
                        result = await seeding_function()
                    else:
                        result = await seeding_function(session)

                    if result:
                        print(f"✅ {description} completed successfully!")
                        success_count += 1
                    else:
                        print(f"❌ {description} failed!")

                except Exception as e:
                    print(f"❌ Error in {description}: {e}")
                    continue

        print("\n" + "=" * 60)
        print(f"🎯 Seeding Summary: {success_count}/{total_operations} operations successful")

        if success_count == total_operations:
            print("🎉 Complete seeding process finished successfully!")
            print("\n📊 Database now contains:")
            print("   - 78 Fallout-themed tarot cards")
            print("   - 4 character voice interpretation templates")
            print("   - 6 spread templates for different reading styles")
            print("   - Sample achievements and synergies")
            print("   - Community events system")
            return True
        else:
            print(f"⚠️  Seeding completed with {total_operations - success_count} failures")
            return False

    async def _init_database_tables(self) -> bool:
        """Initialize database tables"""
        try:
            await init_db()
            print("Database tables initialized")
            return True
        except Exception as e:
            print(f"Database initialization failed: {e}")
            return False

    async def _create_sample_achievements(self, db: AsyncSession) -> bool:
        """Create sample achievements"""
        try:
            from app.models.social_features import UserAchievement, AchievementCategory

            achievements_data = [
                {
                    "id": "first_reading",
                    "achievement_name": "First Steps in the Wasteland",
                    "achievement_category": AchievementCategory.READING_MILESTONES.value,
                    "description": "Complete your first tarot reading in the wasteland",
                    "progress_required": 1,
                    "karma_reward": 5,
                    "experience_points": 10,
                    "rarity": "common",
                    "fallout_reference": "Every journey begins with a single step outside the vault.",
                    "vault_origin": 111
                },
                {
                    "id": "century_reader",
                    "achievement_name": "Master Diviner",
                    "achievement_category": AchievementCategory.READING_MILESTONES.value,
                    "description": "Complete 100 tarot readings",
                    "progress_required": 100,
                    "karma_reward": 25,
                    "experience_points": 100,
                    "rarity": "rare",
                    "fallout_reference": "Like finding 100 intact Nuka-Cola bottles in the wasteland.",
                    "estimated_time_hours": 50
                },
                {
                    "id": "month_streak",
                    "achievement_name": "Consistent Survivor",
                    "achievement_category": AchievementCategory.CONSISTENCY.value,
                    "description": "Complete daily readings for 30 consecutive days",
                    "progress_required": 30,
                    "karma_reward": 15,
                    "experience_points": 50,
                    "rarity": "uncommon",
                    "fallout_reference": "Surviving 30 days in the wasteland is no small feat.",
                    "special_privileges": ["daily_bonus", "priority_support"]
                },
                {
                    "id": "social_butterfly",
                    "achievement_name": "Wasteland Diplomat",
                    "achievement_category": AchievementCategory.SOCIAL.value,
                    "description": "Make 10 friends in the wasteland community",
                    "progress_required": 10,
                    "karma_reward": 20,
                    "experience_points": 75,
                    "rarity": "uncommon",
                    "fallout_reference": "Making friends in the wasteland is harder than finding pre-war tech.",
                    "faction_exclusive": None
                }
            ]

            created_count = 0
            for achievement_data in achievements_data:
                # Create achievement without user_id (this is a template)
                achievement = UserAchievement(
                    id=achievement_data["id"],
                    user_id="template",  # This will be replaced when users earn achievements
                    achievement_id=achievement_data["id"],
                    achievement_name=achievement_data["achievement_name"],
                    achievement_category=achievement_data["achievement_category"],
                    description=achievement_data["description"],
                    progress_required=achievement_data["progress_required"],
                    karma_reward=achievement_data["karma_reward"],
                    experience_points=achievement_data["experience_points"],
                    rarity=achievement_data["rarity"],
                    fallout_reference=achievement_data["fallout_reference"],
                    vault_origin=achievement_data.get("vault_origin"),
                    estimated_time_hours=achievement_data.get("estimated_time_hours"),
                    special_privileges=achievement_data.get("special_privileges", []),
                    faction_exclusive=achievement_data.get("faction_exclusive"),
                    is_completed=False,
                    progress_current=0
                )
                db.add(achievement)
                created_count += 1

            await db.commit()
            print(f"Created {created_count} sample achievements")
            return True

        except Exception as e:
            print(f"Error creating sample achievements: {e}")
            await db.rollback()
            return False

    async def _create_sample_synergies(self, db: AsyncSession) -> bool:
        """Create sample card synergies"""
        try:
            from app.models.reading_enhanced import CardSynergy, CardSynergyType

            synergies_data = [
                {
                    "id": "vault_newbie_tech_specialist",
                    "card_1_id": "vault_newbie_0",
                    "card_2_id": "tech_specialist_1",
                    "synergy_type": CardSynergyType.COMPLEMENTARY.value,
                    "strength_rating": 0.8,
                    "description": "新手的好奇心與技術專長相結合，創造學習和成長的完美條件。",
                    "combined_meaning": "新手學習技術的過程，從無知到精通的轉變。",
                    "wasteland_scenario": "避難所居民向技術專家學習如何在廢土生存的故事。",
                    "works_best_in_spreads": ["vault_tec_spread", "wasteland_survival"],
                    "faction_resonance": {
                        "brotherhood": "知識傳承的重要性",
                        "vault_dweller": "學習適應的過程"
                    }
                },
                {
                    "id": "radiation_storm_wasteland_oracle",
                    "card_1_id": "radiation_storm_7",
                    "card_2_id": "wasteland_oracle_2",
                    "synergy_type": CardSynergyType.AMPLIFICATION.value,
                    "strength_rating": 0.9,
                    "description": "輻射風暴增強了先知的預知能力，但也增加了危險性。",
                    "combined_meaning": "在危險中獲得更深刻的洞察力，代價是承受更大風險。",
                    "wasteland_scenario": "輻射風暴中，先知獲得了強大的預言能力。",
                    "works_best_in_spreads": ["single_wasteland", "brotherhood_council"],
                    "special_effects": {
                        "visual": "green_lightning_effect",
                        "audio": "enhanced_geiger_counter"
                    }
                }
            ]

            created_count = 0
            for synergy_data in synergies_data:
                synergy = CardSynergy(
                    id=synergy_data["id"],
                    card_1_id=synergy_data["card_1_id"],
                    card_2_id=synergy_data["card_2_id"],
                    synergy_type=synergy_data["synergy_type"],
                    strength_rating=synergy_data["strength_rating"],
                    description=synergy_data["description"],
                    combined_meaning=synergy_data["combined_meaning"],
                    wasteland_scenario=synergy_data["wasteland_scenario"],
                    works_best_in_spreads=synergy_data["works_best_in_spreads"],
                    faction_resonance=synergy_data["faction_resonance"],
                    special_effects=synergy_data.get("special_effects"),
                    occurrence_count=0,
                    user_ratings=[]
                )
                db.add(synergy)
                created_count += 1

            await db.commit()
            print(f"Created {created_count} sample card synergies")
            return True

        except Exception as e:
            print(f"Error creating sample synergies: {e}")
            await db.rollback()
            return False

    async def _create_sample_events(self, db: AsyncSession) -> bool:
        """Create sample community events"""
        try:
            from app.models.social_features import CommunityEvent
            from datetime import datetime, timedelta

            events_data = [
                {
                    "id": "wasteland_wanderer_week",
                    "event_name": "Wasteland Wanderer Week",
                    "event_type": "challenge",
                    "description": "一週內完成不同類型的占卜，探索廢土的各個層面。",
                    "short_description": "探索廢土，完成多樣化占卜挑戰。",
                    "start_date": datetime.utcnow() + timedelta(days=7),
                    "end_date": datetime.utcnow() + timedelta(days=14),
                    "max_participants": 500,
                    "participation_requirements": {
                        "min_readings": 5,
                        "min_karma": 0
                    },
                    "completion_rewards": {
                        "karma": 15,
                        "experience": 50,
                        "special_badge": "wasteland_explorer"
                    },
                    "difficulty_level": "all_levels",
                    "status": "upcoming"
                },
                {
                    "id": "brotherhood_knowledge_quest",
                    "event_name": "Brotherhood Knowledge Quest",
                    "event_type": "faction_event",
                    "description": "兄弟會專屬活動：收集古代知識，完成技術相關的占卜。",
                    "short_description": "兄弟會成員的知識收集任務。",
                    "start_date": datetime.utcnow() + timedelta(days=14),
                    "end_date": datetime.utcnow() + timedelta(days=21),
                    "max_participants": 100,
                    "faction_specific": "brotherhood",
                    "participation_requirements": {
                        "faction": "brotherhood",
                        "min_karma": 60
                    },
                    "completion_rewards": {
                        "karma": 25,
                        "experience": 100,
                        "special_privilege": "brotherhood_archives_access"
                    },
                    "difficulty_level": "intermediate",
                    "status": "upcoming"
                }
            ]

            created_count = 0
            for event_data in events_data:
                event = CommunityEvent(
                    id=event_data["id"],
                    event_name=event_data["event_name"],
                    event_type=event_data["event_type"],
                    description=event_data["description"],
                    short_description=event_data["short_description"],
                    start_date=event_data["start_date"],
                    end_date=event_data["end_date"],
                    max_participants=event_data["max_participants"],
                    faction_specific=event_data.get("faction_specific"),
                    participation_requirements=event_data["participation_requirements"],
                    completion_rewards=event_data["completion_rewards"],
                    difficulty_level=event_data["difficulty_level"],
                    status=event_data["status"],
                    current_participants=0,
                    completion_rate=0.0,
                    is_active=True
                )
                db.add(event)
                created_count += 1

            await db.commit()
            print(f"Created {created_count} sample community events")
            return True

        except Exception as e:
            print(f"Error creating sample events: {e}")
            await db.rollback()
            return False


async def run_master_seeding():
    """Main function to run complete seeding"""
    seeder = MasterSeeder()
    success = await seeder.run_complete_seeding()

    if success:
        print("\n🎉 Wasteland Tarot database is ready for action!")
        print("   You can now start the FastAPI server and begin readings.")
    else:
        print("\n⚠️  Seeding completed with some issues.")
        print("   Check the errors above and re-run specific seeding operations if needed.")

    return success


if __name__ == "__main__":
    print("🎲 Wasteland Tarot Master Seeding Script")
    print("This will populate the database with all necessary data.")

    confirm = input("\nProceed with complete seeding? (y/N): ").lower().strip()
    if confirm == 'y':
        asyncio.run(run_master_seeding())
    else:
        print("Seeding cancelled.")