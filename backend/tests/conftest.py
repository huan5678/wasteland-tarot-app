"""
Pytest configuration and shared fixtures for Wasteland Tarot API Tests
Provides fixtures for database, authentication, test client, and Fallout-themed test data
Enhanced with factory_boy integration for comprehensive test data generation
"""

import asyncio
import os
import tempfile
from typing import AsyncGenerator, Dict, Any, Generator, List
from unittest.mock import Mock, patch

# ⚠️ 重要：在任何其他導入之前載入測試環境變數
from dotenv import load_dotenv

# 清除前端環境變數，避免與後端 Pydantic Settings 衝突
# Pydantic Settings 在 case_sensitive=False 時會將 NEXT_PUBLIC_SUPABASE_ANON_KEY 解析為 supabase_anon_key
frontend_env_vars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
]
for var in frontend_env_vars:
    if var in os.environ:
        del os.environ[var]
        print(f"🧹 Removed frontend env var: {var}")

_test_env_path = os.path.join(os.path.dirname(__file__), "..", ".env.test")
_prod_env_path = os.path.join(os.path.dirname(__file__), "..", ".env")

# ⚠️ 策略：先載入 .env.test（預設），再載入 .env（覆蓋）
# 如果環境變數 USE_PRODUCTION_DB=true，則使用生產資料庫進行測試
if os.path.exists(_test_env_path) and os.getenv('USE_PRODUCTION_DB') != 'true':
    load_dotenv(_test_env_path, override=True)
    print(f"✅ Loaded test environment from: {_test_env_path}")
    print(f"   DATABASE_URL: {os.getenv('DATABASE_URL')[:60]}...")
elif os.path.exists(_prod_env_path):
    load_dotenv(_prod_env_path, override=True)
    print(f"✅ [PRODUCTION DB] Loaded from: {_prod_env_path}")
    print(f"   DATABASE_URL: {os.getenv('DATABASE_URL')[:60]}...")

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from sqlalchemy_utils import database_exists, create_database, drop_database

# Import factories
from tests.factories import (
    UserFactory, VaultDwellerFactory, BrotherhoodMemberFactory, RaiderFactory,
    ExperiencedUserFactory, NewUserFactory, HighKarmaUserFactory, LowKarmaUserFactory,
    UserProfileFactory, UserPreferencesFactory,
    WastelandCardFactory, MajorArcanaCardFactory, MinorArcanaCardFactory, CourtCardFactory,
    HighRadiationCardFactory, LowRadiationCardFactory,
    ReadingFactory, SingleCardReadingFactory, ThreeCardReadingFactory, BrotherhoodCouncilReadingFactory,
    AccurateReadingFactory, InaccurateReadingFactory, SharedReadingFactory,
    FalloutDataGenerator, create_complete_deck, create_faction_test_data,
    create_user_with_history, create_reading_variety_pack, reset_sequences
)

# Import app modules (these will be implemented later)
# from app.main import app
# from app.database import get_db, Base
# from app.models import User, WastelandTarotCard, KarmaProfile, FactionAlignment
# from app.auth import create_access_token, get_current_user
# from app.config import Settings


@pytest.fixture(scope="session")
def temp_db_url():
    """
    Create a database URL for testing.

    Uses PostgreSQL from .env.test (loaded at module import time).
    Falls back to SQLite if DATABASE_URL is not set or is not PostgreSQL.
    """
    print("\n🔍 temp_db_url fixture is being called")
    # .env.test 已在模組頂部載入，直接檢查環境變數
    pg_url = os.getenv("DATABASE_URL")
    print(f"   Current DATABASE_URL from env: {pg_url}")

    if pg_url and pg_url.startswith("postgresql"):
        print(f"✅ Using PostgreSQL test database: {pg_url[:50]}...")
        return pg_url

    # Fallback to SQLite
    temp_dir = tempfile.mkdtemp()
    db_path = os.path.join(temp_dir, "test_wasteland_tarot.db")
    sqlite_url = f"sqlite+aiosqlite:///{db_path}"
    print(f"⚠️  Using SQLite test database: {sqlite_url}")
    return sqlite_url


@pytest_asyncio.fixture
async def test_engine(temp_db_url):
    """Create async engine for testing with asyncpg configuration."""
    # Determine if we're using PostgreSQL or SQLite
    is_postgres = temp_db_url.startswith("postgresql")
    print(f"🔧 Creating test_engine with URL: {temp_db_url[:60]}...")
    print(f"   is_postgres: {is_postgres}")

    # Apply production-like asyncpg settings for PostgreSQL test environment
    # This prevents "another operation is in progress" errors
    connect_args = {}
    execution_options = {}

    if is_postgres:
        connect_args = {
            "statement_cache_size": 0,  # Disable statement cache (critical for poolers)
            "prepared_statement_cache_size": 0,
            "server_settings": {
                "jit": "off",
            }
        }
        execution_options = {
            "compiled_cache": None,  # Disable compiled statement cache
        }
        print(f"   ✓ Applied asyncpg configuration for PostgreSQL")

    engine = create_async_engine(
        temp_db_url,
        echo=False,
        future=True,
        pool_size=1,  # Minimize pool size for tests
        max_overflow=0,  # No overflow connections
        pool_pre_ping=True,  # Check connection health
        pool_recycle=3600,  # Recycle connections hourly
        connect_args=connect_args,
        execution_options=execution_options
    )
    print(f"   Engine dialect: {engine.dialect.name}")

    # Create tables
    try:
        # Import all models to ensure they're registered with Base.metadata
        from app.models import (
            User, UserProfile, UserPreferences,
            WastelandCard, SpreadTemplate, InterpretationTemplate,
            ReadingSession, ReadingCardPosition,
            UserAchievement, UserFriendship, KarmaHistory, CommunityEvent,
            UserAnalytics, AnalyticsEvent,
            UserBingoCard, DailyBingoNumber
        )
        from app.models.gamification import (
            KarmaLog, UserKarma,
            DailyTask, WeeklyTask, UserDailyTask, UserWeeklyTask,
            UserActivityStats, UserLoginStreak
        )
        from app.models.base import Base

        async with engine.begin() as conn:
            # Drop all tables first to ensure clean schema
            await conn.run_sync(Base.metadata.drop_all)
            # Then create all tables with current schema
            await conn.run_sync(Base.metadata.create_all)
    except ImportError as e:
        # If models aren't available, skip table creation
        print(f"Warning: Could not import models: {e}")
        pass
    except Exception as e:
        print(f"Error creating tables: {e}")
        raise

    yield engine

    # Force dispose of all connections to prevent event loop issues
    await engine.dispose(close=True)


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a database session for testing with production-like configuration."""
    async_session = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False
    )

    async with async_session() as session:
        # Skip database seeding - tests will create their own test data
        # Seeding can interfere with test isolation and cause UUID conflicts

        yield session

        # Cleanup: rollback any uncommitted changes
        # Note: session.close() is handled by the async context manager
        await session.rollback()


@pytest_asyncio.fixture
async def test_app() -> FastAPI:
    """Create FastAPI app instance for testing."""
    from app.main import app
    return app


@pytest_asyncio.fixture
async def async_client(test_app: FastAPI, db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create async HTTP client for API testing."""
    # 🔧 CRITICAL: Must import from session, not database!
    # dependencies.py uses: from app.db.session import get_db
    from app.db.session import get_db
    from httpx import ASGITransport

    # Override the database dependency for testing
    # get_db is an async generator, so override must also be async generator
    async def override_get_db():
        yield db_session

    test_app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    # Clean up the override
    test_app.dependency_overrides.clear()


# Wasteland Dweller (User) Fixtures
@pytest.fixture
def vault_dweller_data() -> Dict[str, Any]:
    """Basic vault dweller registration data."""
    return {
        "email": "vault101@vault-tec.com",
        "password": "RadAway123!",
        "karma": "neutral",
        "faction_alignment": "vault_dweller",
        "character_voice": "pip_boy_analysis",
        "radiation_resistance": 50
    }


@pytest.fixture
def brotherhood_member_data() -> Dict[str, Any]:
    """Brotherhood of Steel member data."""
    return {
        "email": "paladin@brotherhood.org",
        "password": "AdVictoriam!",
        "karma": "good",
        "faction_alignment": "brotherhood",
        "character_voice": "vault_dweller_perspective",
        "radiation_resistance": 75
    }


@pytest.fixture
def raider_data() -> Dict[str, Any]:
    """Raider faction member data."""
    return {
        "email": "boss@raiders.wasteland",
        "password": "NukaCola666",
        "karma": "evil",
        "faction_alignment": "raiders",
        "character_voice": "super_mutant_simplicity",
        "radiation_resistance": 25
    }


# Authentication Fixtures
@pytest.fixture
def mock_jwt_token() -> str:
    """Mock JWT token for testing."""
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ2YXVsdDEwMUB2YXVsdC10ZWMuY29tIiwiZXhwIjoxNzM3NjIwNDAwfQ.mock_signature"


@pytest.fixture
def auth_headers(mock_jwt_token: str) -> Dict[str, str]:
    """Authentication headers for API requests."""
    return {"Authorization": f"Bearer {mock_jwt_token}"}


# Wasteland Tarot Card Fixtures
@pytest.fixture
def vault_newbie_card() -> Dict[str, Any]:
    """The Vault Newbie (Fool) major arcana card."""
    return {
        "id": "major_00",
        "name": "新手避難所居民",
        "english_name": "The Vault Newbie",
        "original_name": "愚者",
        "arcana_type": "major",
        "number": 0,
        "suit": None,
        "element": None,
        "keywords": ["天真", "新開始", "無知即福", "適應能力"],
        "description": "剛走出避難所的居民，對廢土充滿天真幻想",
        "humor_twist": "戴著派對帽用Pip-Boy自拍，背景是輻射廢土",
        "radiation_level": 1,
        "image_front": "/cards/major-arcana/00-vault-newbie/card-front.webp",
        "image_back": "/cards/card-backs/default-vault-tec.webp",
        "pixel_art": "/cards/major-arcana/00-vault-newbie/pixel-art.png"
    }


@pytest.fixture
def nuka_cola_ace() -> Dict[str, Any]:
    """Ace of Nuka-Cola Bottles (Cups equivalent)."""
    return {
        "id": "nuka_ace",
        "name": "可樂瓶 A",
        "english_name": "Ace of Nuka-Cola Bottles",
        "arcana_type": "minor",
        "number": 1,
        "suit": "nuka_cola_bottles",
        "element": "water",
        "keywords": ["新發現", "未探索資源", "第一次接觸", "情感治療"],
        "description": "發現新的避難所或資源點",
        "humor_elements": ["可樂成癮症狀", "輻射愛情", "避難所居民的浪漫"],
        "radiation_level": 2,
        "wasteland_context": "發現新的避難所或資源點",
        "image_front": "/cards/minor-arcana/nuka-cola-bottles/ace/card-front.webp",
        "image_back": "/cards/card-backs/default-vault-tec.webp"
    }


@pytest.fixture
def combat_weapons_recruit() -> Dict[str, Any]:
    """Recruit of Combat Weapons (Page of Swords equivalent)."""
    return {
        "id": "weapons_recruit",
        "name": "戰鬥武器新兵",
        "english_name": "Combat Weapons Recruit",
        "arcana_type": "court",
        "rank": "recruit",
        "suit": "combat_weapons",
        "element": "wind",
        "keywords": ["初學者能量", "缺乏經驗", "學習者", "偵察兵"],
        "description": "經常犯新手錯誤但充滿熱忱",
        "humor_elements": ["武器故障的尷尬時刻", "和平主義者的困境"],
        "radiation_level": 3,
        "maturity": "缺乏經驗",
        "role": "學習者、信使、偵察兵"
    }


# Karma System Fixtures
@pytest.fixture
def good_karma_profile() -> Dict[str, Any]:
    """Good karma profile data."""
    return {
        "karma_level": "good",
        "karma_points": 850,
        "interpretation_tendency": "positive_optimistic",
        "karma_actions": [
            {"action": "helped_settlement", "karma_change": +50},
            {"action": "shared_resources", "karma_change": +25},
            {"action": "peaceful_resolution", "karma_change": +75}
        ]
    }


@pytest.fixture
def evil_karma_profile() -> Dict[str, Any]:
    """Evil karma profile data."""
    return {
        "karma_level": "evil",
        "karma_points": -650,
        "interpretation_tendency": "realistic_harsh",
        "karma_actions": [
            {"action": "raided_settlement", "karma_change": -100},
            {"action": "hoarded_resources", "karma_change": -50},
            {"action": "aggressive_takeover", "karma_change": -75}
        ]
    }


# Faction Alignment Fixtures
@pytest.fixture
def brotherhood_alignment() -> Dict[str, Any]:
    """Brotherhood of Steel faction alignment."""
    return {
        "faction": "brotherhood",
        "reputation": 75,
        "alignment_benefits": [
            "tech_specialist_interpretations",
            "scientific_analysis_bonus",
            "knowledge_preservation_focus"
        ],
        "faction_conflicts": ["raiders", "super_mutants"],
        "interpretation_style": "科技導向的理性分析"
    }


@pytest.fixture
def ncr_alignment() -> Dict[str, Any]:
    """NCR Republic faction alignment."""
    return {
        "faction": "ncr",
        "reputation": 60,
        "alignment_benefits": [
            "democratic_perspectives",
            "multi_angle_analysis",
            "diplomatic_solutions"
        ],
        "faction_conflicts": ["caesar_legion"],
        "interpretation_style": "民主投票式的多角度解讀"
    }


# Character Voice Fixtures
@pytest.fixture
def pip_boy_voice_config() -> Dict[str, Any]:
    """Pip-Boy analysis character voice configuration."""
    return {
        "voice_type": "pip_boy_analysis",
        "tone": "機械式、科學化、數據導向",
        "special_features": [
            "綠色單色螢幕風格",
            "掃描卡牌基本數據",
            "分析元素屬性",
            "評估威脅等級",
            "計算成功機率"
        ],
        "response_templates": [
            "根據 Pip-Boy 掃描結果...",
            "數據分析顯示...",
            "系統建議...",
            "威脅等級評估..."
        ]
    }


@pytest.fixture
def vault_dweller_voice_config() -> Dict[str, Any]:
    """Vault Dweller perspective voice configuration."""
    return {
        "voice_type": "vault_dweller_perspective",
        "tone": "單純、好奇、誤解現實",
        "humor_elements": [
            "用戰前常識理解戰後情況",
            "對危險事物的不當樂觀",
            "把輻射當作新鮮事物",
            "對變異生物的科學好奇"
        ],
        "response_templates": [
            "根據避難所生存手冊...",
            "戰前的經驗告訴我們...",
            "這讓我想起避難所裡...",
            "外面的世界真有趣..."
        ]
    }


# Divination Spread Fixtures
@pytest.fixture
def single_reading_config() -> Dict[str, Any]:
    """Single Wasteland Reading configuration."""
    return {
        "spread_type": "single_wasteland_reading",
        "card_count": 1,
        "positions": [
            {"name": "guidance", "description": "今日廢土運勢指引"}
        ],
        "use_cases": [
            "今日廢土運勢",
            "生存決策指引",
            "資源搜尋建議",
            "危險評估"
        ],
        "interpretation_style": "結合卡牌意義與當前廢土情勢分析",
        "humor_elements": [
            "輻射計數器式的運勢顯示",
            "Pip-Boy風格的數據呈現"
        ]
    }


@pytest.fixture
def vault_tec_spread_config() -> Dict[str, Any]:
    """Vault-Tec 3-card spread configuration."""
    return {
        "spread_type": "vault_tec_spread",
        "card_count": 3,
        "positions": [
            {"name": "past", "description": "戰前狀況 (Pre-War)"},
            {"name": "present", "description": "當前廢土 (Current Wasteland)"},
            {"name": "future", "description": "重建希望 (Rebuilding Hope)"}
        ],
        "description": "分析從戰前到重建的完整時間線",
        "interpretation_style": "用Vault-Tec風格的樂觀語調解讀嚴酷現實",
        "humor_twist": "即使在絕望情況下也保持企業式的樂觀"
    }


@pytest.fixture
def brotherhood_council_config() -> Dict[str, Any]:
    """Brotherhood Council 7-card spread configuration."""
    return {
        "spread_type": "brotherhood_council",
        "card_count": 7,
        "positions": [
            {"name": "elder_wisdom", "description": "長老智慧 (Elder Wisdom)"},
            {"name": "knight_courage", "description": "騎士勇氣 (Knight Courage)"},
            {"name": "scribe_knowledge", "description": "書記知識 (Scribe Knowledge)"},
            {"name": "initiate_enthusiasm", "description": "新兵熱忱 (Initiate Enthusiasm)"},
            {"name": "traditional_teaching", "description": "傳統教誨 (Traditional Teaching)"},
            {"name": "modern_challenge", "description": "現代挑戰 (Modern Challenge)"},
            {"name": "final_resolution", "description": "最終決議 (Final Resolution)"}
        ],
        "layout": "圓形議會桌佈局",
        "complexity": "high",
        "description": "模擬兄弟會議會的全面決策過程"
    }


# Audio System Fixtures
@pytest.fixture
def pip_boy_audio_config() -> Dict[str, Any]:
    """Pip-Boy audio system configuration."""
    return {
        "audio_category": "pip_boy",
        "sounds": {
            "startup": "/audio/pip-boy/startup.mp3",
            "menu_select": "/audio/pip-boy/menu-select.mp3",
            "menu_confirm": "/audio/pip-boy/menu-confirm.mp3",
            "data_access": "/audio/pip-boy/data-access.mp3",
            "error": "/audio/pip-boy/error.mp3",
            "shutdown": "/audio/pip-boy/shutdown.mp3"
        },
        "volume": 0.7,
        "enabled": True
    }


@pytest.fixture
def vault_audio_config() -> Dict[str, Any]:
    """Vault door and mechanical audio configuration."""
    return {
        "audio_category": "vault",
        "sounds": {
            "door_opening": "/audio/vault/door-opening.mp3",
            "door_closing": "/audio/vault/door-closing.mp3",
            "mechanical_whir": "/audio/vault/mechanical-whir.mp3",
            "air_lock": "/audio/vault/air-lock.mp3",
            "emergency_alarm": "/audio/vault/emergency-alarm.mp3",
            "all_clear": "/audio/vault/all-clear.mp3"
        },
        "volume": 0.8,
        "enabled": True
    }


# Mock External Services
@pytest.fixture
def mock_ai_interpretation_service():
    """Mock AI interpretation service for testing."""
    with patch('app.services.ai_service.generate_interpretation') as mock:
        mock.return_value = {
            "interpretation": "這是一個測試解讀，根據廢土生存法則，建議謹慎行事。",
            "character_voice": "pip_boy_analysis",
            "karma_influence": "neutral",
            "fallout_references": ["避難所科技", "輻射警告", "生存建議"],
            "humor_elements": ["Pip-Boy式的樂觀", "企業風格的建議"]
        }
        yield mock


@pytest.fixture
def mock_audio_service():
    """Mock audio service for testing."""
    with patch('app.services.audio_service.play_sound') as mock:
        mock.return_value = {"status": "played", "duration": 2.5}
        yield mock


@pytest.fixture
def mock_radiation_random():
    """Mock radiation-influenced random number generator."""
    with patch('app.services.divination.radiation_random') as mock:
        # Predictable sequence for testing
        mock.side_effect = [0.1, 0.3, 0.7, 0.9, 0.2, 0.8, 0.4]
        yield mock


# Database Cleanup
@pytest_asyncio.fixture(autouse=True)
async def cleanup_database(db_session):
    """Clean up database after each test."""
    yield
    # Cleanup will be implemented when we have actual models
    # await db_session.execute(text("DELETE FROM readings"))
    # await db_session.execute(text("DELETE FROM users"))
    # await db_session.commit()


# Performance Testing
@pytest.fixture
def performance_threshold():
    """Performance thresholds for testing."""
    return {
        "api_response_time": 2.0,  # seconds
        "card_shuffle_time": 0.5,  # seconds
        "interpretation_time": 3.0,  # seconds
        "database_query_time": 1.0,  # seconds
        "memory_usage_mb": 100  # MB
    }


# Test Data Collections
@pytest.fixture
def all_major_arcana_ids():
    """List of all major arcana card IDs for bulk testing."""
    return [
        "major_00", "major_01", "major_02", "major_03", "major_04",
        "major_05", "major_06", "major_07", "major_08", "major_09",
        "major_10", "major_11", "major_12", "major_13", "major_14",
        "major_15", "major_16", "major_17", "major_18", "major_19",
        "major_20", "major_21"
    ]


@pytest.fixture
def all_suits():
    """List of all wasteland tarot suits."""
    return ["nuka_cola_bottles", "combat_weapons", "bottle_caps", "radiation_rods"]


@pytest.fixture
def all_character_voices():
    """List of all available character voice types."""
    return [
        "pip_boy_analysis",
        "vault_dweller_perspective",
        "wasteland_trader_wisdom",
        "super_mutant_simplicity"
    ]


@pytest.fixture
def all_factions():
    """List of all faction alignments."""
    return ["brotherhood", "ncr", "caesar_legion", "raiders", "vault_dweller"]


@pytest.fixture
def all_karma_levels():
    """List of all karma levels."""
    return ["good", "neutral", "evil"]


# ==========================================
# Enhanced Factory-Based Fixtures
# ==========================================

@pytest.fixture(autouse=True)
def reset_factory_sequences():
    """Reset factory sequences before each test for predictable data"""
    reset_sequences()


# User Factories Fixtures
@pytest.fixture
def vault_dweller():
    """Create a Vault Dweller user for testing"""
    return VaultDwellerFactory()


@pytest.fixture
def brotherhood_member():
    """Create a Brotherhood of Steel member for testing"""
    return BrotherhoodMemberFactory()


@pytest.fixture
def raider():
    """Create a Raider user for testing"""
    return RaiderFactory()


@pytest.fixture
def experienced_user():
    """Create an experienced user with reading history"""
    return ExperiencedUserFactory()


@pytest.fixture
def new_user():
    """Create a new user with minimal activity"""
    return NewUserFactory()


@pytest.fixture
def high_karma_user():
    """Create a high karma (good) user"""
    return HighKarmaUserFactory()


@pytest.fixture
def low_karma_user():
    """Create a low karma (evil) user"""
    return LowKarmaUserFactory()


@pytest.fixture
def faction_test_users():
    """Create users from all factions for testing"""
    return create_faction_test_data()


# Card Factories Fixtures
@pytest.fixture
def sample_card():
    """Create a sample Wasteland card"""
    return WastelandCardFactory()


@pytest.fixture
def major_arcana_card():
    """Create a Major Arcana card"""
    return MajorArcanaCardFactory()


@pytest.fixture
def minor_arcana_card():
    """Create a Minor Arcana card"""
    return MinorArcanaCardFactory()


@pytest.fixture
def court_card():
    """Create a Court card"""
    return CourtCardFactory()


@pytest.fixture
def high_radiation_card():
    """Create a high radiation card"""
    return HighRadiationCardFactory()


@pytest.fixture
def low_radiation_card():
    """Create a low radiation card"""
    return LowRadiationCardFactory()


@pytest.fixture
def complete_deck():
    """Create a complete 78-card Wasteland deck"""
    return create_complete_deck()


@pytest.fixture
def mixed_radiation_deck():
    """Create a deck with varied radiation levels"""
    return [
        HighRadiationCardFactory(),
        HighRadiationCardFactory(),
        WastelandCardFactory(radiation_level=0.5),
        WastelandCardFactory(radiation_level=0.5),
        LowRadiationCardFactory(),
        LowRadiationCardFactory()
    ]


# Reading Factories Fixtures
@pytest.fixture
def sample_reading():
    """Create a sample reading"""
    return ReadingFactory()


@pytest.fixture
def single_card_reading():
    """Create a single card reading"""
    return SingleCardReadingFactory()


@pytest.fixture
def three_card_reading():
    """Create a three card reading"""
    return ThreeCardReadingFactory()


@pytest.fixture
def brotherhood_council_reading():
    """Create a Brotherhood Council reading"""
    return BrotherhoodCouncilReadingFactory()


@pytest.fixture
def accurate_reading():
    """Create a highly rated reading"""
    return AccurateReadingFactory()


@pytest.fixture
def inaccurate_reading():
    """Create a poorly rated reading"""
    return InaccurateReadingFactory()


@pytest.fixture
def shared_reading():
    """Create a publicly shared reading"""
    return SharedReadingFactory()


@pytest.fixture
def reading_variety_pack(vault_dweller):
    """Create a variety of different reading types for a user"""
    return create_reading_variety_pack(vault_dweller)


# User with History Fixtures
@pytest.fixture
def user_with_light_history():
    """Create a user with a small reading history"""
    return create_user_with_history(readings_count=5)


@pytest.fixture
def user_with_rich_history():
    """Create a user with extensive reading history"""
    return create_user_with_history(readings_count=25)


@pytest.fixture
def user_with_mixed_readings():
    """Create a user with various types of readings"""
    user = ExperiencedUserFactory()
    readings = [
        AccurateReadingFactory(user_id=user.id),
        AccurateReadingFactory(user_id=user.id),
        InaccurateReadingFactory(user_id=user.id),
        SharedReadingFactory(user_id=user.id),
        SingleCardReadingFactory(user_id=user.id),
        ThreeCardReadingFactory(user_id=user.id),
        BrotherhoodCouncilReadingFactory(user_id=user.id)
    ]
    return user, readings


# Performance Testing Fixtures
@pytest.fixture
def performance_test_users():
    """Create multiple users for performance testing"""
    return [UserFactory() for _ in range(10)]


@pytest.fixture
def performance_test_cards():
    """Create multiple cards for performance testing"""
    return [WastelandCardFactory() for _ in range(20)]


@pytest.fixture
def large_reading_dataset():
    """Create a large dataset of readings for performance testing"""
    users = [UserFactory() for _ in range(5)]
    readings = []
    for user in users:
        user_readings = [ReadingFactory(user_id=user.id) for _ in range(10)]
        readings.extend(user_readings)
    return users, readings


# Mock Data Fixtures
@pytest.fixture
def mock_ai_responses():
    """Mock AI responses for different scenarios"""
    return {
        "positive": "根據廢土的智慧，這張牌帶來希望和新的機會。Pip-Boy 分析顯示成功機率很高。",
        "neutral": "廢土的教訓告訴我們要保持謹慎。建議仔細評估所有選項。",
        "negative": "警告：前方可能有危險。建議準備好 RadAway 和 Stimpak。",
        "brotherhood": "兄弟會的知識指出這是學習新科技的時機。鋼鐵同盟將指引你的道路。",
        "raider": "廢土的法則很簡單：強者生存。準備好戰鬥或者尋找其他出路。"
    }


@pytest.fixture
def mock_card_shuffle_results():
    """Mock card shuffle results for testing"""
    return {
        "low_radiation": [LowRadiationCardFactory() for _ in range(3)],
        "high_radiation": [HighRadiationCardFactory() for _ in range(3)],
        "mixed": [
            LowRadiationCardFactory(),
            WastelandCardFactory(radiation_level=0.5),
            HighRadiationCardFactory()
        ]
    }


# Testing Scenario Fixtures
@pytest.fixture
def karma_progression_scenario():
    """Create a scenario for testing karma progression"""
    user = UserFactory(karma_score=50)  # Start neutral

    # Readings that could influence karma
    good_readings = [
        ReadingFactory(
            user_id=user.id,
            question="我應該幫助這個受傷的旅行者嗎？",
            interpretation="慈悲和幫助他人是廢土中的珍貴品質。"
        ),
        ReadingFactory(
            user_id=user.id,
            question="分享我的食物和水是明智的嗎？",
            interpretation="在廢土中，分享資源建立了寶貴的聯盟。"
        )
    ]

    return user, good_readings


@pytest.fixture
def faction_conflict_scenario():
    """Create a scenario for testing faction conflicts"""
    brotherhood_user = BrotherhoodMemberFactory()
    raider_user = RaiderFactory()

    conflict_readings = [
        ReadingFactory(
            user_id=brotherhood_user.id,
            question="我應該與劫掠者談判嗎？",
            interpretation="兄弟會的準則建議謹慎處理與劫掠者的關係。"
        ),
        ReadingFactory(
            user_id=raider_user.id,
            question="搶奪這個商隊值得嗎？",
            interpretation="廢土的規則：弱肉強食，但要考慮後果。"
        )
    ]

    return {
        "brotherhood_user": brotherhood_user,
        "raider_user": raider_user,
        "readings": conflict_readings
    }


@pytest.fixture
def radiation_exposure_scenario():
    """Create a scenario for testing radiation effects"""
    return {
        "clean_environment": [LowRadiationCardFactory() for _ in range(5)],
        "contaminated_environment": [HighRadiationCardFactory() for _ in range(5)],
        "geiger_counter_readings": [0.1, 0.3, 0.7, 0.9, 0.2, 0.8, 0.4],
        "radiation_effects": {
            "low": "安全區域，可以正常探索",
            "medium": "輻射警告，建議準備 RadAway",
            "high": "危險區域，立即撤離！"
        }
    }


# Data Validation Fixtures
@pytest.fixture
def fallout_theme_validation_data():
    """Data for validating Fallout theme consistency"""
    return {
        "authentic_terms": [
            "避難所", "廢土", "Pip-Boy", "兄弟會", "NCR", "輻射",
            "變種人", "死亡爪", "可樂量子", "瓶蓋", "監督"
        ],
        "inauthentic_terms": [
            "iPhone", "WiFi", "Facebook", "星際大戰", "哈利波特",
            "精靈", "魔法", "超級英雄", "時光機"
        ],
        "theme_categories": {
            "technology": ["Pip-Boy", "動力裝甲", "雷射武器", "核融合"],
            "factions": ["兄弟會", "NCR", "劫掠者", "英克雷"],
            "creatures": ["死亡爪", "變種人", "野屍鬼", "蟻後"],
            "locations": ["避難所", "廢土", "新維加斯", "首都廢土"]
        }
    }


# Error Testing Fixtures
@pytest.fixture
def error_test_scenarios():
    """Scenarios for testing error handling"""
    return {
        "invalid_user": {"user_id": "non_existent_user"},
        "invalid_card_count": {"num_cards": 0},
        "invalid_radiation": {"radiation_factor": 1.5},
        "invalid_voice": {"character_voice": "invalid_voice"},
        "corrupted_data": {"cards_drawn": [{"invalid": "data"}]},
        "oversized_question": {"question": "問" * 1000}
    }


# Integration Test Fixtures
@pytest.fixture
def end_to_end_test_data():
    """Complete test data for end-to-end testing"""
    users = {
        "newbie": NewUserFactory(),
        "veteran": ExperiencedUserFactory(),
        "brotherhood": BrotherhoodMemberFactory(),
        "raider": RaiderFactory()
    }

    cards = {
        "deck": create_complete_deck(),
        "high_rad": [HighRadiationCardFactory() for _ in range(5)],
        "low_rad": [LowRadiationCardFactory() for _ in range(5)]
    }

    questions = [
        "我今天的廢土運勢如何？",
        "這個避難所實驗安全嗎？",
        "我應該加入哪個派系？",
        "如何提升我的生存技能？",
        "下一步探索哪個區域？"
    ]

    return {
        "users": users,
        "cards": cards,
        "questions": questions
    }