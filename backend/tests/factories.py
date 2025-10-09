"""
Test Factories for Wasteland Tarot
Enhanced factory patterns for generating test data with factory_boy integration
and Fallout-themed data generation.
"""

import factory
import factory.fuzzy
from datetime import datetime, timedelta
from typing import List, Dict, Any
import random

from app.models.user import User, UserProfile, UserPreferences
from app.models.reading_enhanced import ReadingSession
from app.models.wasteland_card import WastelandCard, KarmaAlignment, CharacterVoice, FactionAlignment


# Fallout-themed data generators
class FalloutDataGenerator:
    """Generator for authentic Fallout-themed test data"""

    VAULT_NUMBERS = [13, 15, 21, 27, 34, 51, 69, 76, 81, 87, 92, 95, 101, 111, 114]

    WASTELAND_LOCATIONS = [
        "Capital Wasteland", "Mojave Desert", "Commonwealth",
        "New Vegas Strip", "Diamond City", "Goodneighbor",
        "Sanctuary Hills", "Megaton", "Rivet City", "Tenpenny Tower",
        "Nellis Air Force Base", "The Citadel", "Adams Air Force Base",
        "Vault City", "Necropolis", "The Hub", "Junktown"
    ]

    WASTELAND_USERNAMES = [
        "vault_dweller_{}", "wasteland_wanderer_{}", "lone_survivor_{}",
        "courier_six_{}", "chosen_one_{}", "tribal_hero_{}",
        "brotherhood_knight_{}", "ncr_ranger_{}", "raider_boss_{}",
        "ghoul_smoothskin_{}", "super_mutant_{}", "enclave_officer_{}"
    ]

    READING_QUESTIONS = [
        "我今天在廢土中會遇到什麼機會？",
        "這個避難所實驗安全嗎？",
        "我應該信任這個商人嗎？",
        "兄弟會的任務會成功嗎？",
        "我的Karma路徑是否正確？",
        "什麼時候該離開這個聚落？",
        "這個變種生物威脅有多大？",
        "我的裝備升級順序如何？",
        "下一個探索目標在哪裡？",
        "我和同伴的關係如何發展？"
    ]

    CARD_NAMES = [
        ("新手避難所居民", "The Vault Newbie"),
        ("科技專家", "The Tech Specialist"),
        ("廢土預言家", "The Wasteland Oracle"),
        ("農場主母", "The Farm Matriarch"),
        ("避難所監督", "The Overseer"),
        ("兄弟會長老", "The Brotherhood Elder"),
        ("廢土戀人", "The Wasteland Lovers"),
        ("裝甲車", "The Armored Vehicle"),
        ("正義執行者", "The Justice Enforcer"),
        ("廢土隱士", "The Wasteland Hermit")
    ]

    FALLOUT_INTERPRETATIONS = [
        "根據Pip-Boy掃描結果，建議謹慎行事。威脅等級：中等。",
        "避難所手冊第{}章建議在此情況下保持冷靜。",
        "兄弟會的科技知識指出這是一個關鍵時刻。",
        "廢土生存法則第一條：永遠保持警覺。",
        "Vault-Tec的樂觀建議：一切都會很好的！",
        "超級變種人的簡單智慧：強者生存。",
        "NCR的民主程序建議進行投票決定。",
        "劫掠者的生存哲學：拿取所需，保護所有。"
    ]

    @classmethod
    def random_vault_number(cls) -> int:
        return random.choice(cls.VAULT_NUMBERS)

    @classmethod
    def random_wasteland_location(cls) -> str:
        return random.choice(cls.WASTELAND_LOCATIONS)

    @classmethod
    def random_wasteland_username(cls) -> str:
        template = random.choice(cls.WASTELAND_USERNAMES)
        return template.format(random.randint(1, 999))

    @classmethod
    def random_reading_question(cls) -> str:
        return random.choice(cls.READING_QUESTIONS)

    @classmethod
    def random_card_name(cls) -> tuple:
        return random.choice(cls.CARD_NAMES)

    @classmethod
    def random_fallout_interpretation(cls) -> str:
        base = random.choice(cls.FALLOUT_INTERPRETATIONS)
        if "{}" in base:
            return base.format(random.randint(1, 20))
        return base


# Enhanced User Factory
class UserFactory(factory.Factory):
    """Factory for creating test users with Fallout theming"""

    class Meta:
        model = User

    id = factory.Sequence(lambda n: f"user_{n}")
    username = factory.LazyFunction(FalloutDataGenerator.random_wasteland_username)
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@vault-tec.com")
    password_hash = factory.Faker('sha256')

    # Fallout-specific attributes
    karma_score = factory.fuzzy.FuzzyInteger(0, 100)
    faction_alignment = factory.fuzzy.FuzzyChoice([f.value for f in FactionAlignment])
    vault_number = factory.LazyFunction(FalloutDataGenerator.random_vault_number)
    wasteland_location = factory.LazyFunction(FalloutDataGenerator.random_wasteland_location)
    experience_level = factory.fuzzy.FuzzyChoice([
        "Novice Survivor", "Experienced Wanderer", "Veteran Explorer", "Master Survivor", "Wasteland Legend"
    ])

    # Account status
    is_active = True
    is_verified = factory.Faker('boolean', chance_of_getting_true=80)
    is_premium = factory.Faker('boolean', chance_of_getting_true=20)

    # Statistics
    daily_readings_count = factory.fuzzy.FuzzyInteger(0, 15)
    total_readings = factory.fuzzy.FuzzyInteger(0, 200)
    accurate_predictions = factory.LazyAttribute(
        lambda obj: min(obj.total_readings, random.randint(0, obj.total_readings))
    )

    # Timestamps
    created_at = factory.Faker('date_time_between', start_date='-2y', end_date='now')
    last_login = factory.Faker('date_time_between', start_date='-30d', end_date='now')

    @factory.post_generation
    def create_profile(obj, create, extracted, **kwargs):
        """Automatically create user profile"""
        if not create:
            return

        UserProfileFactory(user_id=obj.id, **kwargs)

    @factory.post_generation
    def create_preferences(obj, create, extracted, **kwargs):
        """Automatically create user preferences"""
        if not create:
            return

        UserPreferencesFactory(user_id=obj.id, **kwargs)


class VaultDwellerFactory(UserFactory):
    """Factory for Vault Dweller users"""

    faction_alignment = FactionAlignment.VAULT_DWELLER.value
    karma_score = factory.fuzzy.FuzzyInteger(40, 80)  # Tend toward neutral/good
    experience_level = factory.fuzzy.FuzzyChoice([
        "Novice Survivor", "Experienced Wanderer"
    ])


class BrotherhoodMemberFactory(UserFactory):
    """Factory for Brotherhood of Steel members"""

    faction_alignment = FactionAlignment.BROTHERHOOD.value
    karma_score = factory.fuzzy.FuzzyInteger(60, 90)  # Tend toward good
    experience_level = factory.fuzzy.FuzzyChoice([
        "Experienced Wanderer", "Veteran Explorer", "Master Survivor"
    ])
    is_premium = factory.Faker('boolean', chance_of_getting_true=40)  # Higher premium rate


class RaiderFactory(UserFactory):
    """Factory for Raider users"""

    faction_alignment = FactionAlignment.RAIDERS.value
    karma_score = factory.fuzzy.FuzzyInteger(10, 50)  # Tend toward evil/neutral
    experience_level = factory.fuzzy.FuzzyChoice([
        "Experienced Wanderer", "Veteran Explorer"
    ])


# User Profile Factory
class UserProfileFactory(factory.Factory):
    """Factory for user profiles with Fallout theming"""

    class Meta:
        model = UserProfile

    user_id = factory.SubFactory(UserFactory)

    # Wasteland Character Info
    preferred_voice = factory.fuzzy.FuzzyChoice([v.value for v in CharacterVoice])
    vault_number = factory.LazyFunction(FalloutDataGenerator.random_vault_number)
    wasteland_location = factory.LazyFunction(FalloutDataGenerator.random_wasteland_location)
    favorite_faction = factory.fuzzy.FuzzyChoice([f.value for f in FactionAlignment])
    experience_level = factory.fuzzy.FuzzyChoice([
        "Novice Survivor", "Experienced Wanderer", "Veteran Explorer", "Master Survivor"
    ])

    # Reading Preferences
    favorite_card_suit = factory.fuzzy.FuzzyChoice([
        "nuka_cola_bottles", "combat_weapons", "bottle_caps", "radiation_rods"
    ])
    preferred_reading_style = factory.fuzzy.FuzzyChoice([
        "quick_insight", "detailed_analysis", "humor_focused", "lore_heavy"
    ])
    total_readings = factory.fuzzy.FuzzyInteger(0, 150)
    consecutive_days = factory.fuzzy.FuzzyInteger(0, 365)
    rare_cards_found = factory.fuzzy.FuzzyInteger(0, 15)

    # Social Stats
    friends_count = factory.fuzzy.FuzzyInteger(0, 50)
    readings_shared = factory.fuzzy.FuzzyInteger(0, 25)
    community_contributions = factory.fuzzy.FuzzyInteger(0, 100)


# User Preferences Factory
class UserPreferencesFactory(factory.Factory):
    """Factory for user preferences"""

    class Meta:
        model = UserPreferences

    user_id = factory.SubFactory(UserFactory)

    # Reading Preferences
    default_character_voice = factory.fuzzy.FuzzyChoice([v.value for v in CharacterVoice])
    auto_save_readings = factory.Faker('boolean', chance_of_getting_true=90)
    share_readings_publicly = factory.Faker('boolean', chance_of_getting_true=30)
    favorite_spread_types = factory.LazyFunction(
        lambda: random.sample(
            ["single_card", "three_card", "vault_tec_spread", "brotherhood_council"],
            k=random.randint(1, 3)
        )
    )

    # UI Preferences
    theme = factory.fuzzy.FuzzyChoice([
        "dark_vault", "light_vault", "brotherhood_tech", "raider_grime", "ncr_clean"
    ])
    pip_boy_color = factory.fuzzy.FuzzyChoice([
        "green", "amber", "blue", "red", "white"
    ])
    terminal_effects = factory.Faker('boolean', chance_of_getting_true=80)
    sound_effects = factory.Faker('boolean', chance_of_getting_true=70)
    background_music = factory.Faker('boolean', chance_of_getting_true=50)

    # Privacy Settings
    public_profile = factory.Faker('boolean', chance_of_getting_true=40)
    allow_friend_requests = factory.Faker('boolean', chance_of_getting_true=85)
    data_collection_consent = factory.Faker('boolean', chance_of_getting_true=75)


# Wasteland Card Factory
class WastelandCardFactory(factory.Factory):
    """Factory for creating Wasteland Cards with authentic Fallout theming"""

    class Meta:
        model = WastelandCard

    id = factory.Sequence(lambda n: f"card_{n}")
    name = factory.LazyFunction(lambda: FalloutDataGenerator.random_card_name()[0])
    english_name = factory.LazyFunction(lambda: FalloutDataGenerator.random_card_name()[1])
    arcana_type = factory.fuzzy.FuzzyChoice(["major", "minor", "court"])
    number = factory.LazyAttribute(lambda obj:
        random.randint(0, 21) if obj.arcana_type == "major" else random.randint(1, 14)
    )

    # Fallout-themed content
    description = factory.Faker('text', max_nb_chars=200)
    keywords = factory.LazyFunction(
        lambda: random.sample([
            "科技", "知識", "生存", "輻射", "變異", "希望", "危險", "探索",
            "友誼", "背叛", "權力", "自由", "秩序", "混亂", "治療", "毀滅"
        ], k=random.randint(2, 5))
    )

    radiation_level = factory.fuzzy.FuzzyFloat(0.0, 1.0)

    # Optional attributes
    suit = factory.Maybe(
        'arcana_type',
        yes_declaration=factory.fuzzy.FuzzyChoice([
            "nuka_cola_bottles", "combat_weapons", "bottle_caps", "radiation_rods"
        ]),
        no_declaration=None
    )

    element = factory.Maybe(
        'suit',
        yes_declaration=factory.fuzzy.FuzzyChoice(["火", "水", "土", "風"]),
        no_declaration=None
    )


class MajorArcanaCardFactory(WastelandCardFactory):
    """Factory for Major Arcana cards"""

    arcana_type = "major"
    number = factory.fuzzy.FuzzyInteger(0, 21)
    suit = None
    element = None


class MinorArcanaCardFactory(WastelandCardFactory):
    """Factory for Minor Arcana cards"""

    arcana_type = "minor"
    number = factory.fuzzy.FuzzyInteger(1, 10)
    suit = factory.fuzzy.FuzzyChoice([
        "nuka_cola_bottles", "combat_weapons", "bottle_caps", "radiation_rods"
    ])


class CourtCardFactory(WastelandCardFactory):
    """Factory for Court cards"""

    arcana_type = "court"
    number = factory.fuzzy.FuzzyInteger(11, 14)  # Page, Knight, Queen, King
    suit = factory.fuzzy.FuzzyChoice([
        "nuka_cola_bottles", "combat_weapons", "bottle_caps", "radiation_rods"
    ])


# Reading Factory
class ReadingFactory(factory.Factory):
    """Factory for creating readings with Fallout theming"""

    class Meta:
        model = ReadingSession

    id = factory.Sequence(lambda n: f"reading_{n}")
    user_id = factory.SubFactory(UserFactory)

    # Reading Content
    question = factory.LazyFunction(FalloutDataGenerator.random_reading_question)
    spread_type = factory.fuzzy.FuzzyChoice([
        "single_card", "three_card", "vault_tec_spread",
        "brotherhood_council", "wasteland_guidance"
    ])
    cards_drawn = factory.LazyFunction(lambda: [
        {
            "id": f"card_{random.randint(1, 78)}",
            "name": FalloutDataGenerator.random_card_name()[0],
            "position": i,
            "reversed": random.choice([True, False])
        }
        for i in range(random.randint(1, 7))
    ])
    interpretation = factory.LazyFunction(FalloutDataGenerator.random_fallout_interpretation)

    # Context Information
    character_voice = factory.fuzzy.FuzzyChoice([v.value for v in CharacterVoice])
    karma_context = factory.fuzzy.FuzzyChoice([k.value for k in KarmaAlignment])
    faction_influence = factory.fuzzy.FuzzyChoice([f.value for f in FactionAlignment])

    # Metadata
    tags = factory.LazyFunction(lambda: random.sample([
        "準確", "有用", "深刻", "有趣", "啟發性", "實用", "驚喜"
    ], k=random.randint(0, 3)))
    mood = factory.fuzzy.FuzzyChoice([
        "love", "career", "health", "financial", "future", "past", "general"
    ])
    reading_duration = factory.fuzzy.FuzzyInteger(30, 600)  # 30 seconds to 10 minutes

    # Privacy and Sharing
    is_private = factory.Faker('boolean', chance_of_getting_true=70)
    allow_public_sharing = factory.Faker('boolean', chance_of_getting_true=20)
    share_with_friends = factory.Faker('boolean', chance_of_getting_true=40)

    # Analytics
    accuracy_rating = factory.fuzzy.FuzzyInteger(1, 5)
    user_feedback = factory.Faker('text', max_nb_chars=100)
    helpful_votes = factory.fuzzy.FuzzyInteger(0, 10)

    # Timestamps
    created_at = factory.Faker('date_time_between', start_date='-1y', end_date='now')


class SingleCardReadingFactory(ReadingFactory):
    """Factory for single card readings"""

    spread_type = "single_card"
    cards_drawn = factory.LazyFunction(lambda: [
        {
            "id": f"card_{random.randint(1, 78)}",
            "name": FalloutDataGenerator.random_card_name()[0],
            "position": 0,
            "reversed": random.choice([True, False])
        }
    ])


class ThreeCardReadingFactory(ReadingFactory):
    """Factory for three card readings"""

    spread_type = "vault_tec_spread"
    cards_drawn = factory.LazyFunction(lambda: [
        {
            "id": f"card_{random.randint(1, 78)}",
            "name": FalloutDataGenerator.random_card_name()[0],
            "position": i,
            "reversed": random.choice([True, False])
        }
        for i in range(3)
    ])


class BrotherhoodCouncilReadingFactory(ReadingFactory):
    """Factory for Brotherhood Council (7-card) readings"""

    spread_type = "brotherhood_council"
    cards_drawn = factory.LazyFunction(lambda: [
        {
            "id": f"card_{random.randint(1, 78)}",
            "name": FalloutDataGenerator.random_card_name()[0],
            "position": i,
            "reversed": random.choice([True, False])
        }
        for i in range(7)
    ])
    character_voice = CharacterVoice.PIP_BOY.value
    karma_context = factory.fuzzy.FuzzyChoice([KarmaAlignment.NEUTRAL.value, KarmaAlignment.GOOD.value])


# Specialized Factories for Testing Scenarios

class HighKarmaUserFactory(UserFactory):
    """Factory for high karma (good) users"""
    karma_score = factory.fuzzy.FuzzyInteger(70, 100)


class LowKarmaUserFactory(UserFactory):
    """Factory for low karma (evil) users"""
    karma_score = factory.fuzzy.FuzzyInteger(0, 30)


class ExperiencedUserFactory(UserFactory):
    """Factory for experienced users with lots of readings"""
    total_readings = factory.fuzzy.FuzzyInteger(50, 300)
    accurate_predictions = factory.LazyAttribute(
        lambda obj: int(obj.total_readings * random.uniform(0.6, 0.9))
    )
    is_premium = True
    experience_level = factory.fuzzy.FuzzyChoice([
        "Veteran Explorer", "Master Survivor", "Wasteland Legend"
    ])


class NewUserFactory(UserFactory):
    """Factory for new users with minimal activity"""
    total_readings = factory.fuzzy.FuzzyInteger(0, 5)
    daily_readings_count = factory.fuzzy.FuzzyInteger(0, 2)
    accurate_predictions = factory.LazyAttribute(lambda obj: min(obj.total_readings, 2))
    is_premium = False
    experience_level = "Novice Survivor"


class HighRadiationCardFactory(WastelandCardFactory):
    """Factory for high radiation cards"""
    radiation_level = factory.fuzzy.FuzzyFloat(0.7, 1.0)
    keywords = factory.LazyFunction(lambda: [
        "輻射", "危險", "變異", "污染", "高能量"
    ])


class LowRadiationCardFactory(WastelandCardFactory):
    """Factory for low radiation cards"""
    radiation_level = factory.fuzzy.FuzzyFloat(0.0, 0.3)
    keywords = factory.LazyFunction(lambda: [
        "安全", "純淨", "治療", "希望", "平靜"
    ])


# Trait factories for specific testing scenarios

class AccurateReadingFactory(ReadingFactory):
    """Factory for highly rated readings"""
    accuracy_rating = factory.fuzzy.FuzzyInteger(4, 5)
    user_feedback = factory.fuzzy.FuzzyChoice([
        "非常準確的解讀！", "完全符合我的情況", "很有幫助的指導",
        "解釋得很清楚", "給了我很大的啟發"
    ])
    helpful_votes = factory.fuzzy.FuzzyInteger(3, 15)


class InaccurateReadingFactory(ReadingFactory):
    """Factory for poorly rated readings"""
    accuracy_rating = factory.fuzzy.FuzzyInteger(1, 2)
    user_feedback = factory.fuzzy.FuzzyChoice([
        "不太符合實際情況", "解釋過於模糊", "沒有幫助",
        "感覺很一般", "可能需要改進"
    ])
    helpful_votes = factory.fuzzy.FuzzyInteger(0, 2)


class SharedReadingFactory(ReadingFactory):
    """Factory for publicly shared readings"""
    is_private = False
    allow_public_sharing = True
    share_with_friends = True
    helpful_votes = factory.fuzzy.FuzzyInteger(5, 25)


# Batch factories for creating multiple related objects

def create_user_with_history(readings_count: int = 10, **kwargs) -> User:
    """Create a user with a reading history"""
    user = UserFactory(**kwargs)

    for _ in range(readings_count):
        ReadingFactory(user_id=user.id)

    return user


def create_complete_deck() -> List[WastelandCard]:
    """Create a complete 78-card Wasteland deck"""
    cards = []

    # Major Arcana (22 cards)
    for i in range(22):
        cards.append(MajorArcanaCardFactory(number=i))

    # Minor Arcana (56 cards)
    suits = ["nuka_cola_bottles", "combat_weapons", "bottle_caps", "radiation_rods"]
    for suit in suits:
        # Number cards (1-10)
        for number in range(1, 11):
            cards.append(MinorArcanaCardFactory(suit=suit, number=number))

        # Court cards (11-14)
        for number in range(11, 15):
            cards.append(CourtCardFactory(suit=suit, number=number))

    return cards


def create_faction_test_data() -> Dict[str, List[User]]:
    """Create users for each faction for testing"""
    return {
        "vault_dwellers": [VaultDwellerFactory() for _ in range(3)],
        "brotherhood": [BrotherhoodMemberFactory() for _ in range(3)],
        "raiders": [RaiderFactory() for _ in range(3)],
        "ncr": [UserFactory(faction_alignment=FactionAlignment.NCR.value) for _ in range(3)]
    }


def create_reading_variety_pack(user: User) -> List[ReadingSession]:
    """Create a variety of different reading types for a user"""
    return [
        SingleCardReadingFactory(user_id=user.id),
        ThreeCardReadingFactory(user_id=user.id),
        BrotherhoodCouncilReadingFactory(user_id=user.id),
        AccurateReadingFactory(user_id=user.id),
        InaccurateReadingFactory(user_id=user.id),
        SharedReadingFactory(user_id=user.id)
    ]


# Utility functions for test data generation

def reset_sequences():
    """Reset all factory sequences for predictable test data"""
    UserFactory._meta.sqlalchemy_session = None
    ReadingFactory._meta.sqlalchemy_session = None
    WastelandCardFactory._meta.sqlalchemy_session = None
    UserProfileFactory._meta.sqlalchemy_session = None
    UserPreferencesFactory._meta.sqlalchemy_session = None


def create_performance_test_data(users_count: int = 100, cards_count: int = 78) -> Dict[str, Any]:
    """Create large datasets for performance testing"""
    users = [UserFactory() for _ in range(users_count)]
    cards = [WastelandCardFactory() for _ in range(cards_count)]

    readings = []
    for user in users:
        reading_count = random.randint(1, 20)
        readings.extend([ReadingFactory(user_id=user.id) for _ in range(reading_count)])

    return {
        "users": users,
        "cards": cards,
        "readings": readings,
        "total_objects": len(users) + len(cards) + len(readings)
    }