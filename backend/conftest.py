# conftest.py - Comprehensive pytest configuration for Wasteland Tarot API

import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator, Generator
from unittest.mock import Mock, AsyncMock
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from httpx import AsyncClient
from faker import Faker
import uuid
from datetime import datetime, timedelta
import redis
import json

# Import your app and models (these will be created later)
# from app.main import app
# from app.database import get_db
# from app.models.base import Base
# from app.models.user import User
# from app.models.wasteland_card import WastelandCard
# from app.models.wasteland_reading import WastelandReading
# from app.models.karma_profile import KarmaProfile
# from app.models.faction_alignment import FactionAlignment
# from app.core.auth import create_access_token

fake = Faker()

# Test Database Configuration
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="session")
async def test_engine():
    """Create test database engine with in-memory SQLite."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        poolclass=StaticPool,
        connect_args={
            "check_same_thread": False,
        },
        echo=False,
    )

    # TODO: Uncomment when models are created
    # async with engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.create_all)

    yield engine
    await engine.dispose()

@pytest_asyncio.fixture(scope="function")
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a clean database session for each test."""
    async_session = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        # Start transaction
        trans = await session.begin()

        yield session

        # Rollback transaction after test
        await trans.rollback()

@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test client with database dependency override."""

    def get_test_db():
        return db_session

    # TODO: Uncomment when FastAPI app is created
    # app.dependency_overrides[get_db] = get_test_db

    async with AsyncClient(
        # app=app,  # TODO: Uncomment when app is created
        base_url="http://test"
    ) as client:
        yield client

    # TODO: Uncomment when app is created
    # app.dependency_overrides.clear()

# Mock Redis for testing
@pytest.fixture
def mock_redis():
    """Mock Redis client for testing."""
    mock_redis = Mock(spec=redis.Redis)
    mock_redis.get = Mock(return_value=None)
    mock_redis.set = Mock(return_value=True)
    mock_redis.delete = Mock(return_value=True)
    mock_redis.exists = Mock(return_value=False)
    return mock_redis

# Test User Fixtures
@pytest_asyncio.fixture
async def test_user_data():
    """Generate test user data."""
    return {
        "id": str(uuid.uuid4()),
        "email": fake.email(),
        "password": "TestPassword123!",
        "hashed_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBkh1nRWJJe6T2",  # TestPassword123!
        "display_name": fake.name(),
        "birth_date": fake.date_of_birth(minimum_age=18, maximum_age=80),
        "zodiac_sign": fake.random_element(elements=[
            "牡羊座", "金牛座", "雙子座", "巨蟹座", "獅子座", "處女座",
            "天秤座", "天蠍座", "射手座", "摩羯座", "水瓶座", "雙魚座"
        ]),
        "is_active": True,
        "is_verified": True,
        "premium_until": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession, test_user_data):
    """Create a test user in the database."""
    # TODO: Implement when User model is created
    # user = User(**test_user_data)
    # db_session.add(user)
    # await db_session.commit()
    # await db_session.refresh(user)
    # return user
    return test_user_data

@pytest.fixture
def auth_headers(test_user):
    """Generate authentication headers for test user."""
    # TODO: Implement when auth system is created
    # token = create_access_token(data={"sub": test_user["email"]})
    token = "test_token_placeholder"
    return {"Authorization": f"Bearer {token}"}

# Wasteland Card Fixtures
@pytest.fixture
def wasteland_card_data():
    """Generate comprehensive wasteland card test data."""
    return {
        "id": "vault-newbie",
        "name": "新手避難所居民",
        "name_en": "The Vault Newbie",
        "fallout_name": "新手避難所居民 (The Vault Newbie)",
        "original_name": "愚者",
        "number": 0,
        "suit": "major_arcana",
        "type": "major_arcana",
        "element": None,
        "astrology": "天王星",
        "imagery_description": "穿著藍色連身服的年輕避難所居民，手持Pip-Boy，眼中充滿對廢土的好奇與天真。背景是剛開啟的避難所大門，陽光透過門縫照射進來。",
        "symbolism": ["新開始", "無知的勇氣", "天真", "可能性", "冒險"],
        "upright_meaning": "新的開始、天真的勇氣、無限可能、對未知的好奇心、準備踏出舒適圈",
        "reversed_meaning": "魯莽行事、過度天真、缺乏計劃、拒絕承擔責任、害怕改變",
        "wasteland_context": "代表剛走出避難所的新手，對廢土世界充滿好奇但缺乏經驗",
        "pip_boy_scan_results": {
            "threat_level": "低",
            "resource_potential": "中",
            "radiation_reading": "安全範圍",
            "survival_tips": ["準備基本補給", "學習廢土常識", "尋找經驗豐富的導師"]
        },
        "fallout_elements": ["避難所科技", "新手探險", "學習成長", "環境適應"],
        "wasteland_elements": ["避難所科技", "社交互動", "學習成長", "環境適應"],
        "radiation_level": 0.1,
        "humor_elements": [
            "用戰前科學書籍的知識面對變種生物",
            "對輻射的天真樂觀態度",
            "把廢土當作戶外教學"
        ],
        "image_urls": {
            "front": "https://wasteland-cards.com/vault-newbie-front.jpg",
            "back": "https://wasteland-cards.com/vault-tec-back.jpg",
            "pixel_art": "https://wasteland-cards.com/vault-newbie-pixel.jpg"
        },
        "audio_cues": {
            "reveal": "vault-door-opening.mp3",
            "selection": "pip-boy-beep.mp3",
            "interpretation": "vault-dweller-voice.mp3"
        },
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

@pytest.fixture
def minor_arcana_card_data():
    """Generate minor arcana wasteland card data."""
    return {
        "id": "ace-nuka-cola-bottles",
        "name": "可樂瓶A",
        "name_en": "Ace of Nuka-Cola Bottles",
        "fallout_name": "可樂瓶A (Ace of Nuka-Cola Bottles)",
        "original_name": "聖杯A",
        "number": 1,
        "suit": "nuka_cola_bottles",
        "type": "minor_arcana",
        "element": "水",
        "imagery_description": "一個閃亮的Nuka-Cola瓶子從天而降，周圍環繞著治療輻射的藍色光芒",
        "upright_meaning": "新的情感開始、愛情機會、精神復甦、創意靈感",
        "reversed_meaning": "情感阻塞、錯失機會、心靈空虛、創意枯竭",
        "wasteland_context": "在廢土中找到珍貴的情感連結或治療機會",
        "radiation_level": 0.05,
        "suit_meaning": "情感、關係、輻射治療、社群連結",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

# Karma and Faction Fixtures
@pytest.fixture
def karma_profile_data():
    """Generate karma profile test data."""
    return {
        "user_id": str(uuid.uuid4()),
        "karma_level": "neutral",
        "karma_points": 0,
        "good_actions": 0,
        "evil_actions": 0,
        "neutral_actions": 0,
        "karma_title": "廢土居民",
        "karma_description": "在善惡之間保持平衡的普通廢土居民",
        "karma_effects": {
            "interpretation_bias": 0.0,
            "card_draw_influence": "balanced",
            "special_events": []
        },
        "achievements": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

@pytest.fixture
def faction_alignment_data():
    """Generate faction alignment test data."""
    return {
        "user_id": str(uuid.uuid4()),
        "primary_faction": "vault_dweller",
        "faction_scores": {
            "vault_dweller": 100,
            "brotherhood_of_steel": 0,
            "ncr": 0,
            "caesars_legion": 0,
            "raiders": 0
        },
        "faction_titles": {
            "vault_dweller": "避難所居民"
        },
        "faction_benefits": {
            "vault_dweller": ["科技解讀加成", "醫療相關解讀精準度提升"]
        },
        "reputation_modifiers": {},
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

# Reading and Spread Fixtures
@pytest.fixture
def single_card_reading_data():
    """Generate single card reading test data."""
    return {
        "id": str(uuid.uuid4()),
        "user_id": str(uuid.uuid4()),
        "spread_type": "single_card_reading",
        "question": "我應該探索這個廢墟嗎？",
        "question_category": "exploration_adventures",
        "context": {
            "focus_area": "survival",
            "mood": "cautious",
            "specific_concern": "資源獲取",
            "survival_priority": "safety_first"
        },
        "character_voice": "pip_boy_analysis",
        "shuffle_algorithm": "wasteland_fisher_yates",
        "cards_data": [
            {
                "position": 1,
                "card_id": "vault-newbie",
                "orientation": "upright",
                "position_meaning": "當前廢土指引",
                "radiation_influence": 0.1
            }
        ],
        "shuffle_data": {
            "algorithm_used": "wasteland_fisher_yates",
            "radiation_randomness": 0.15,
            "geiger_counter_seed": "click-click-beep-789",
            "shuffle_iterations": 78
        },
        "audio_cues": {
            "shuffle_sound": "geiger-counter-shuffle.mp3",
            "card_reveal": "vault-door-opening.mp3",
            "ambient": "wasteland-wind.mp3"
        },
        "status": "pending_interpretation",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

@pytest.fixture
def vault_tec_spread_data():
    """Generate Vault-Tec 3-card spread test data."""
    return {
        "id": str(uuid.uuid4()),
        "user_id": str(uuid.uuid4()),
        "spread_type": "vault_tec_spread",
        "question": "我的人生轉變將如何發展？",
        "question_category": "life_transitions",
        "character_voice": "vault_dweller_perspective",
        "cards_data": [
            {
                "position": 1,
                "card_id": "vault-newbie",
                "orientation": "upright",
                "position_meaning": "戰前狀況",
                "radiation_influence": 0.1
            },
            {
                "position": 2,
                "card_id": "tech-specialist",
                "orientation": "upright",
                "position_meaning": "當前狀況",
                "radiation_influence": 0.2
            },
            {
                "position": 3,
                "card_id": "wasteland-oracle",
                "orientation": "reversed",
                "position_meaning": "重建未來",
                "radiation_influence": 0.15
            }
        ],
        "status": "pending_interpretation",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

# Character Voice Fixtures
@pytest.fixture
def character_voices_data():
    """Generate character voice test data."""
    return [
        {
            "id": "pip_boy_analysis",
            "name": "Pip-Boy數據分析法",
            "description": "像Pip-Boy介面一樣系統化分析卡牌資訊",
            "personality": "系統化、數據導向、科技風格",
            "display_style": "綠色單色螢幕風格數據呈現",
            "example_phrases": [
                "掃描卡牌基本數據...",
                "分析元素屬性中...",
                "評估威脅等級...",
                "計算成功機率..."
            ],
            "interpretation_style": "系統化分析",
            "humor_level": "low",
            "technical_focus": True
        },
        {
            "id": "vault_dweller_perspective",
            "name": "避難所居民視角法",
            "description": "從剛走出避難所的天真視角解讀廢土現實",
            "personality": "天真、樂觀、好奇、科學導向",
            "humor_elements": [
                "用戰前常識理解戰後情況",
                "對危險事物的不當樂觀",
                "把輻射當作新鮮事物"
            ],
            "interpretation_style": "天真樂觀",
            "humor_level": "high",
            "technical_focus": False
        },
        {
            "id": "wasteland_trader_wisdom",
            "name": "廢土商人智慧法",
            "description": "用精明商人的實用主義解讀卡牌",
            "personality": "狡猾但可靠的商人語調",
            "focus_areas": [
                "資源價值評估",
                "風險收益分析",
                "交易機會識別",
                "市場趨勢預測"
            ],
            "interpretation_style": "實用主義",
            "humor_level": "medium",
            "technical_focus": False
        },
        {
            "id": "super_mutant_simplicity",
            "name": "超級變種人簡化法",
            "description": "用直接粗暴但意外精準的方式解讀",
            "personality": "直接、簡單、邏輯清晰",
            "characteristics": [
                "語言簡單直接",
                "邏輯出奇清晰",
                "忽略複雜細節",
                "專注核心問題"
            ],
            "interpretation_style": "直接簡單",
            "humor_level": "medium",
            "technical_focus": False
        }
    ]

# Mock AI Service
@pytest.fixture
def mock_ai_service():
    """Mock AI service for testing interpretations."""
    mock_service = AsyncMock()

    mock_service.generate_reading_interpretation.return_value = {
        "overall_message": "測試AI解讀內容...",
        "character_voice_style": {
            "voice": "pip_boy_analysis",
            "personality": "系統化分析",
            "delivery": "像Pip-Boy介面一樣系統化分析卡牌資訊"
        },
        "card_meanings": [
            {
                "card_id": "vault-newbie",
                "position": 1,
                "fallout_meaning": "測試卡牌解讀...",
                "survival_advice": "測試生存建議...",
                "pip_boy_analysis": {
                    "threat_assessment": "低風險",
                    "resource_evaluation": "中等收益潛力",
                    "radiation_scan": "環境輻射在安全範圍內",
                    "success_probability": "75%",
                    "recommended_action": "進行探索，但保持謹慎"
                }
            }
        ],
        "wasteland_wisdom": "測試廢土智慧...",
        "survival_priority": "安全第一",
        "recommended_actions": ["測試建議1", "測試建議2"],
        "companion_insights": [],
        "humor_elements": ["測試幽默元素"],
        "vault_boy_tips": ["測試Vault Boy提示"],
        "estimated_tokens": 500,
        "generation_time": 2.5
    }

    return mock_service

# Performance Testing Fixtures
@pytest.fixture
def performance_config():
    """Configuration for performance testing."""
    return {
        "max_response_time": 2.0,  # seconds
        "concurrent_users": 10,
        "requests_per_user": 5,
        "memory_limit_mb": 100,
        "cpu_limit_percent": 80
    }

# Database seeding for integration tests
@pytest_asyncio.fixture
async def seed_wasteland_cards(db_session: AsyncSession):
    """Seed database with full 78-card wasteland deck."""
    # TODO: Implement when models are created
    # This will create all 78 cards including:
    # - 22 Major Arcana (Fallout themed)
    # - 56 Minor Arcana (4 Fallout suits × 14 cards each)
    pass

@pytest_asyncio.fixture
async def seed_spreads(db_session: AsyncSession):
    """Seed database with all available spreads."""
    # TODO: Implement when models are created
    # This will create all 4 main spreads:
    # - Single Wasteland Reading
    # - Vault-Tec Spread
    # - Wasteland Survival Spread
    # - Brotherhood Council
    pass

# Test data validation helpers
def assert_wasteland_card_structure(card_data):
    """Validate wasteland card data structure."""
    required_fields = [
        "id", "name", "name_en", "fallout_name", "original_name",
        "number", "suit", "type", "upright_meaning", "reversed_meaning",
        "wasteland_context", "radiation_level", "image_urls", "audio_cues"
    ]

    for field in required_fields:
        assert field in card_data, f"Missing required field: {field}"

    assert isinstance(card_data["radiation_level"], (int, float))
    assert 0 <= card_data["radiation_level"] <= 1
    assert card_data["suit"] in [
        "major_arcana", "nuka_cola_bottles", "combat_weapons",
        "bottle_caps", "radiation_rods"
    ]

def assert_karma_profile_structure(karma_data):
    """Validate karma profile data structure."""
    required_fields = [
        "user_id", "karma_level", "karma_points", "good_actions",
        "evil_actions", "neutral_actions", "karma_title"
    ]

    for field in required_fields:
        assert field in karma_data, f"Missing required field: {field}"

    assert karma_data["karma_level"] in ["good", "neutral", "evil"]
    assert isinstance(karma_data["karma_points"], int)

def assert_reading_structure(reading_data):
    """Validate reading data structure."""
    required_fields = [
        "id", "user_id", "spread_type", "question", "cards_data",
        "character_voice", "status"
    ]

    for field in required_fields:
        assert field in reading_data, f"Missing required field: {field}"

    assert reading_data["spread_type"] in [
        "single_card_reading", "vault_tec_spread",
        "wasteland_survival_spread", "brotherhood_council"
    ]
    assert reading_data["status"] in [
        "pending_interpretation", "completed", "failed"
    ]