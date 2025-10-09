# FastAPI 後端開發測試計劃 - 廢土塔羅系統

## 概述

基於 Fallout 主題塔羅牌系統需求，本文件詳細規劃廢土塔羅解讀平台的 FastAPI 後端開發策略，包含 78 張廢土主題卡牌、多種角色解讀風格、Karma 系統、派系對齊系統等完整功能。

## 技術棧確認

```python
# 核心框架
FastAPI >= 0.115.0
Python >= 3.11
Uvicorn[standard] >= 0.25.0

# 資料庫相關
SQLAlchemy >= 2.0.0
asyncpg >= 0.29.0
alembic >= 1.13.0
psycopg2-binary >= 2.9.9

# 資料驗證與序列化
pydantic >= 2.5.0
pydantic-settings >= 2.1.0

# 認證與安全
python-jose[cryptography] >= 3.3.0
passlib[bcrypt] >= 1.7.4
python-multipart >= 0.0.6

# Redis 與快取
redis >= 5.0.0
fastapi-cache2 >= 0.2.0

# AI 服務整合
openai >= 1.6.0
httpx >= 0.26.0

# 測試框架
pytest >= 7.4.0
pytest-asyncio >= 0.23.0
pytest-cov >= 4.1.0
httpx >= 0.26.0  # for TestClient
faker >= 21.0.0

# 開發工具
black >= 23.12.0
isort >= 5.13.0
flake8 >= 6.1.0
mypy >= 1.8.0
```

## 1. API 架構設計

### 1.1 專案結構

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 應用入口
│   ├── config.py              # 配置管理
│   ├── database.py            # 資料庫連接
│   ├── dependencies.py        # 依賴注入
│   ├── exceptions.py          # 異常處理
│   ├── middleware.py          # 中間件
│   ├──
│   ├── api/                   # API 路由
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── router.py
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── wasteland_cards.py      # 廢土卡牌系統
│   │   │   ├── wasteland_readings.py   # 廢土解讀系統
│   │   │   ├── karma_system.py         # Karma 系統
│   │   │   ├── faction_alignment.py    # 派系對齊系統
│   │   │   ├── character_voices.py     # 角色解讀風格
│   │   │   ├── companion_insights.py   # 夥伴見解系統
│   │   │   ├── special_events.py       # 特殊事件
│   │   │   ├── audio_system.py         # 音效系統
│   │   │   ├── community.py
│   │   │   └── admin.py
│   │
│   ├── core/                  # 核心功能
│   │   ├── __init__.py
│   │   ├── auth.py           # 認證邏輯
│   │   ├── security.py       # 安全工具
│   │   ├── cache.py          # 快取管理
│   │   ├── email.py          # 郵件服務
│   │   └── background.py     # 背景任務
│   │
│   ├── models/               # 資料模型
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── user.py
│   │   ├── wasteland_card.py           # 廢土卡牌模型
│   │   ├── wasteland_reading.py        # 廢土解讀模型
│   │   ├── karma_profile.py            # Karma 檔案模型
│   │   ├── faction_alignment.py        # 派系對齊模型
│   │   ├── character_preference.py     # 角色偏好模型
│   │   ├── companion_insight.py        # 夥伴見解模型
│   │   ├── special_event.py            # 特殊事件模型
│   │   ├── audio_cue.py                # 音效提示模型
│   │   └── community.py
│   │
│   ├── schemas/              # Pydantic 模型
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── wasteland_card.py
│   │   ├── wasteland_reading.py
│   │   ├── karma_system.py
│   │   ├── faction_alignment.py
│   │   ├── character_voice.py
│   │   ├── companion_insight.py
│   │   ├── special_event.py
│   │   ├── audio_system.py
│   │   └── common.py
│   │
│   ├── services/             # 業務邏輯
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── wasteland_card_service.py   # 廢土卡牌服務
│   │   ├── wasteland_shuffle_service.py # 廢土洗牌算法
│   │   ├── karma_service.py            # Karma 系統服務
│   │   ├── faction_service.py          # 派系系統服務
│   │   ├── character_voice_service.py  # 角色聲音服務
│   │   ├── companion_service.py        # 夥伴服務
│   │   ├── wasteland_ai_service.py     # 廢土 AI 解讀服務
│   │   ├── audio_service.py            # 音效服務
│   │   ├── special_event_service.py    # 特殊事件服務
│   │   ├── reading_service.py
│   │   └── community_service.py
│   │
│   ├── utils/                # 工具函數
│   │   ├── __init__.py
│   │   ├── logger.py
│   │   ├── helpers.py
│   │   └── validators.py
│   │
│   └── tests/                # 測試檔案
│       ├── __init__.py
│       ├── conftest.py
│       ├── unit/
│       ├── integration/
│       └── e2e/
│
├── migrations/               # 資料庫遷移
├── scripts/                 # 部署腳本
├── docker/                  # Docker 配置
├── requirements.txt
├── requirements-dev.txt
├── Dockerfile
├── docker-compose.yml
├── alembic.ini
├── pytest.ini
└── .env.example
```

### 1.2 配置管理

```python
# app/config.py
from pydantic_settings import BaseSettings
from typing import Optional, List
import secrets

class Settings(BaseSettings):
    # 應用配置
    PROJECT_NAME: str = "Tarot Reading Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # 安全配置
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # 資料庫配置
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: int = 5432

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Redis 配置
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_EXPIRE_IN_SECONDS: int = 3600

    # 外部 API
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o-mini"

    # CORS 設定
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # 郵件服務
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = 587
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

    # 日誌配置
    LOG_LEVEL: str = "INFO"

    # 限流配置
    RATE_LIMIT_PER_MINUTE: int = 60
    PREMIUM_RATE_LIMIT_PER_MINUTE: int = 120

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

## 2. 資料庫設計

### 2.1 SQLAlchemy 模型設計

```python
# app/models/base.py
from sqlalchemy import Column, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
import uuid

Base = declarative_base()

class TimestampMixin:
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class UUIDMixin:
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
```

```python
# app/models/user.py
from sqlalchemy import Column, String, Boolean, Integer, Date, JSON
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin, UUIDMixin

class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)

    # 關聯關係
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    readings = relationship("TarotReading", back_populates="user")
    posts = relationship("CommunityPost", back_populates="author")

class UserProfile(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "user_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    display_name = Column(String(100))
    birth_date = Column(Date)
    zodiac_sign = Column(String(20))
    avatar_url = Column(String(500))

    # 遊戲化元素
    level = Column(Integer, default=1)
    experience = Column(Integer, default=0)
    streak_days = Column(Integer, default=0)
    total_readings = Column(Integer, default=0)

    # 偏好設定
    preferences = Column(JSON, default=dict)

    # 關聯關係
    user = relationship("User", back_populates="profile")
```

```python
# app/models/wasteland_card.py
from sqlalchemy import Column, String, Text, Integer, JSON, Boolean, Float
from .base import Base, UUIDMixin

class WastelandTarotCard(Base, UUIDMixin):
    __tablename__ = "wasteland_tarot_cards"

    # 基本卡牌信息
    name = Column(String(100), nullable=False)  # 中文名稱
    name_en = Column(String(100), nullable=False)  # 英文名稱
    fallout_name = Column(String(100), nullable=False)  # Fallout 主題名稱
    number = Column(Integer)
    suit = Column(String(50))  # major_arcana, nuka_cola_bottles, combat_weapons, bottle_caps, radiation_rods

    # 廢土主題描述
    description = Column(Text)
    fallout_description = Column(Text)  # Fallout 背景故事
    humor_twist = Column(Text)  # 幽默轉折

    # 關鍵詞和意義
    keywords = Column(JSON)  # {upright: [], reversed: []}
    fallout_keywords = Column(JSON)  # Fallout 專屬關鍵詞

    # 象徵意義
    imagery = Column(JSON)  # {main_symbols: [], colors: [], description: ""}
    fallout_imagery = Column(JSON)  # Fallout 主題象徵

    # 解讀內容
    interpretations = Column(JSON)  # {general: "", survival: "", resources: "", relationships: "", exploration: "", rebuilding: ""}

    # 廢土特殊屬性
    radiation_level = Column(Float, default=0.0)  # 輻射等級 (影響隨機性)
    survival_category = Column(String(50))  # 生存分類
    wasteland_elements = Column(JSON)  # 廢土元素列表

    # 圖片資源
    image_urls = Column(JSON)  # {front: "", back: "", pixel_art: ""}

    # 音效資源
    audio_cues = Column(JSON)  # {reveal: "", selection: "", interpretation: ""}

    is_active = Column(Boolean, default=True)

class WastelandTarotSpread(Base, UUIDMixin):
    __tablename__ = "wasteland_tarot_spreads"

    name = Column(String(100), nullable=False)
    fallout_name = Column(String(100), nullable=False)  # Fallout 主題名稱
    description = Column(Text)
    fallout_description = Column(Text)  # Fallout 主題描述
    cards_count = Column(Integer, nullable=False)
    difficulty = Column(String(20))  # beginner, intermediate, advanced
    estimated_time = Column(String(20))  # "5分鐘", "15分鐘"

    # 牌位配置
    positions = Column(JSON)  # [{position: 1, name: "", fallout_name: "", description: ""}, ...]
    suitable_for = Column(JSON)  # ["生存決策", "資源管理", "人際關係", "探索冒險", "重建規劃"]

    # 廢土特殊屬性
    spread_type = Column(String(50))  # single_card_reading, vault_tech_spread, wasteland_survival_spread, brotherhood_council
    layout_style = Column(String(50))  # linear, circular, custom
    pip_boy_interface = Column(Boolean, default=True)  # 是否使用 Pip-Boy 風格界面

    is_active = Column(Boolean, default=True)

class KarmaProfile(Base, UUIDMixin):
    __tablename__ = "karma_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Karma 等級
    karma_level = Column(String(20), default="neutral")  # good, neutral, evil
    karma_points = Column(Integer, default=0)  # -1000 to +1000

    # Karma 歷史
    karma_changes = Column(JSON, default=list)  # [{action: "", points: 0, timestamp: "", reason: ""}]

    # 解讀傾向調整
    interpretation_bias = Column(JSON, default=dict)  # {optimism: 0.0, realism: 0.0, pragmatism: 0.0}

    # 統計信息
    total_good_actions = Column(Integer, default=0)
    total_neutral_actions = Column(Integer, default=0)
    total_evil_actions = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class FactionAlignment(Base, UUIDMixin):
    __tablename__ = "faction_alignments"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # 派系親和度 (0-100)
    brotherhood_affinity = Column(Integer, default=50)      # 鋼鐵兄弟會
    ncr_affinity = Column(Integer, default=50)              # NCR 共和國
    caesar_legion_affinity = Column(Integer, default=50)    # 凱撒軍團
    raiders_affinity = Column(Integer, default=50)          # 掠奪者
    vault_dweller_affinity = Column(Integer, default=50)    # 避難所居民

    # 主要派系
    primary_faction = Column(String(50), default="vault_dweller")

    # 派系聲望歷史
    faction_history = Column(JSON, default=list)  # [{faction: "", action: "", reputation_change: 0, timestamp: ""}]

    # 解讀風格影響
    interpretation_style = Column(JSON, default=dict)  # 根據派系調整解讀風格

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class CharacterPreference(Base, UUIDMixin):
    __tablename__ = "character_preferences"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # 解讀角色偏好
    preferred_voice = Column(String(50), default="pip_boy_analysis")  # pip_boy_analysis, vault_dweller_perspective, wasteland_trader_wisdom, super_mutant_simplicity

    # 角色使用統計
    voice_usage_stats = Column(JSON, default=dict)  # {voice_name: usage_count}

    # 角色適應性設定
    adaptive_voice = Column(Boolean, default=True)  # 是否根據情境自動調整角色

    # 解讀複雜度偏好
    complexity_preference = Column(String(20), default="medium")  # simple, medium, complex

    # 幽默元素偏好
    humor_level = Column(String(20), default="medium")  # low, medium, high

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

```python
# app/models/wasteland_reading.py
from sqlalchemy import Column, String, Text, JSON, ForeignKey, Enum as SQLEnum, Float, Integer, Boolean
from sqlalchemy.orm import relationship
from enum import Enum
from .base import Base, UUIDMixin, TimestampMixin

class WastelandReadingStatus(Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    RADIATION_STORM = "radiation_storm"  # 特殊事件狀態

class WastelandTarotReading(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "wasteland_tarot_readings"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    spread_id = Column(UUID(as_uuid=True), ForeignKey("wasteland_tarot_spreads.id"), nullable=False)

    # 問題相關
    question = Column(Text)
    question_category = Column(String(50))  # survival_decisions, resource_management, wasteland_relationships, exploration_adventures, rebuilding_plans
    context = Column(JSON)  # {focus_area: "", mood: "", specific_concern: "", survival_priority: ""}

    # 抽牌結果
    cards_data = Column(JSON)  # [{position: 1, card_id: "", orientation: "upright", radiation_influence: 0.0}, ...]

    # 廢土特殊機制
    shuffle_algorithm = Column(String(50), default="wasteland_fisher_yates")  # 使用的洗牌算法
    radiation_randomness = Column(Float, default=0.0)  # 輻射影響的隨機性
    geiger_counter_seed = Column(String(100))  # 蓋革計數器種子

    # AI 解讀
    interpretation_data = Column(JSON)
    character_voice = Column(String(50))  # pip_boy_analysis, vault_dweller_perspective, etc.
    humor_elements = Column(JSON, default=list)  # 幽默元素列表
    ai_confidence = Column(Float)

    # Karma 和派系影響
    karma_influence = Column(JSON, default=dict)  # {level: "", adjustment: 0.0}
    faction_influence = Column(JSON, default=dict)  # {primary_faction: "", bias: 0.0}

    # 夥伴見解
    companion_insights = Column(JSON, default=list)  # [{companion: "", insight: "", relevance: 0.0}]

    # 特殊事件
    special_event = Column(String(50))  # rad_storm_reading, holiday_special, faction_war, new_settlement
    event_modifiers = Column(JSON, default=dict)  # 事件修正器

    # 音效和視覺
    audio_cues_played = Column(JSON, default=list)  # 播放的音效列表
    pip_boy_interface_used = Column(Boolean, default=True)
    vault_boy_reactions = Column(JSON, default=list)  # Vault Boy 反應列表

    # 狀態和元數據
    status = Column(SQLEnum(WastelandReadingStatus), default=WastelandReadingStatus.PENDING)
    tags = Column(JSON, default=list)  # ["生存", "重要", "探索"]
    survival_rating = Column(Integer)  # 1-5 生存難度評級
    notes = Column(Text)

    # 廢土統計
    radiation_exposure = Column(Float, default=0.0)  # 本次解讀的輻射暴露
    caps_earned = Column(Integer, default=0)  # 獲得的瓶蓋
    experience_gained = Column(Integer, default=0)  # 獲得的經驗值

    # 關聯關係
    user = relationship("User", back_populates="wasteland_readings")
    spread = relationship("WastelandTarotSpread")

class CompanionInsight(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "companion_insights"

    reading_id = Column(UUID(as_uuid=True), ForeignKey("wasteland_tarot_readings.id"), nullable=False)
    companion_name = Column(String(50), nullable=False)  # dogmeat, nick_valentine, piper, codsworth, strong

    # 見解內容
    insight_text = Column(Text, nullable=False)
    relevance_score = Column(Float, default=0.0)  # 0.0 - 1.0
    humor_level = Column(String(20), default="medium")  # low, medium, high

    # 夥伴特性
    companion_personality = Column(JSON, default=dict)  # {loyalty: 0.0, intelligence: 0.0, humor: 0.0}
    interaction_style = Column(String(50))  # supportive, analytical, humorous, direct

    # 觸發條件
    trigger_cards = Column(JSON, default=list)  # 觸發此見解的卡牌
    trigger_context = Column(JSON, default=dict)  # 觸發情境

class SpecialEvent(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "special_events"

    event_name = Column(String(100), nullable=False)
    event_type = Column(String(50), nullable=False)  # rad_storm, holiday, faction_war, settlement

    # 事件描述
    description = Column(Text, nullable=False)
    flavor_text = Column(Text)  # 風味文字

    # 事件效果
    card_modifiers = Column(JSON, default=dict)  # 對卡牌的修正
    interpretation_modifiers = Column(JSON, default=dict)  # 對解讀的修正
    audio_effects = Column(JSON, default=list)  # 特殊音效

    # 觸發條件
    trigger_conditions = Column(JSON, default=dict)  # 觸發條件
    duration_hours = Column(Integer, default=24)  # 事件持續時間

    # 狀態
    is_active = Column(Boolean, default=True)
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
```

### 2.2 資料庫遷移設定

```python
# migrations/env.py
from alembic import context
from sqlalchemy import engine_from_config, pool
from logging.config import fileConfig
import os
import sys

# 添加 app 路徑
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.models import Base
from app.config import settings

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline():
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = settings.DATABASE_URL

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

## 3. 認證授權系統

### 3.1 JWT 認證實作

```python
# app/core/auth.py
from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self):
        self.pwd_context = pwd_context

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """驗證密碼"""
        return self.pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        """生成密碼雜湊"""
        return self.pwd_context.hash(password)

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """創建訪問 token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    def create_refresh_token(self, data: dict) -> str:
        """創建刷新 token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    def verify_token(self, token: str, token_type: str = "access") -> dict:
        """驗證 token"""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            if payload.get("type") != token_type:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type"
                )
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )

auth_service = AuthService()
```

### 3.2 依賴注入和權限檢查

```python
# app/dependencies.py
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_session
from app.models.user import User
from app.core.auth import auth_service

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_session)
) -> User:
    """獲取當前用戶"""
    payload = auth_service.verify_token(credentials.credentials)
    user_id = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """獲取當前活躍用戶"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

async def get_premium_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """獲取高級用戶"""
    if not current_user.is_premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium subscription required"
        )
    return current_user

# 權限裝飾器
def require_permissions(*permissions):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # 實作權限檢查邏輯
            return await func(*args, **kwargs)
        return wrapper
    return decorator
```

## 4. 業務邏輯層

### 4.1 塔羅牌抽牌邏輯

```python
# app/services/tarot_service.py
import random
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.tarot import TarotCard, TarotSpread
from app.schemas.tarot import CardDrawResult, ReadingCreate

class TarotService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_available_cards(self) -> List[TarotCard]:
        """獲取可用牌卡"""
        result = await self.session.execute(
            select(TarotCard).where(TarotCard.is_active == True)
        )
        return result.scalars().all()

    async def get_spread_by_id(self, spread_id: str) -> Optional[TarotSpread]:
        """根據 ID 獲取牌陣"""
        result = await self.session.execute(
            select(TarotSpread).where(TarotSpread.id == spread_id)
        )
        return result.scalar_one_or_none()

    async def draw_cards(self, spread_id: str, user_seed: Optional[str] = None) -> List[CardDrawResult]:
        """抽牌邏輯"""
        spread = await self.get_spread_by_id(spread_id)
        if not spread:
            raise ValueError("Invalid spread ID")

        cards = await self.get_available_cards()
        if len(cards) < spread.cards_count:
            raise ValueError("Not enough cards available")

        # 設置隨機種子（可用於重現抽牌結果）
        if user_seed:
            random.seed(user_seed)

        # 隨機抽牌
        drawn_cards = random.sample(cards, spread.cards_count)

        results = []
        for i, card in enumerate(drawn_cards):
            # 隨機決定正逆位
            orientation = random.choice(["upright", "reversed"])

            result = CardDrawResult(
                position=i + 1,
                card=card,
                orientation=orientation,
                position_meaning=spread.positions[i]["description"] if spread.positions else ""
            )
            results.append(result)

        return results

    async def get_card_interpretation(self, card: TarotCard, orientation: str, context: dict) -> str:
        """獲取牌卡解讀"""
        base_meaning = card.interpretations.get("general", "")

        if orientation == "reversed":
            keywords = card.keywords.get("reversed", [])
        else:
            keywords = card.keywords.get("upright", [])

        # 根據問題類別調整解讀
        category = context.get("question_category", "general")
        if category in card.interpretations:
            category_meaning = card.interpretations[category]
            return f"{base_meaning}\n\n針對{category}：{category_meaning}"

        return base_meaning
```

### 4.2 AI 解讀服務

```python
# app/services/ai_service.py
import json
from typing import Dict, List
from openai import AsyncOpenAI
from app.config import settings
from app.models.tarot import TarotCard
from app.schemas.reading import AIInterpretation

class AIService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL

    async def generate_reading_interpretation(
        self,
        question: str,
        cards_data: List[Dict],
        context: Dict,
        user_profile: Dict = None
    ) -> AIInterpretation:
        """生成 AI 解讀"""

        # 構建提示詞
        prompt = self._build_interpretation_prompt(question, cards_data, context, user_profile)

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._get_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )

            content = response.choices[0].message.content
            interpretation_data = json.loads(content)

            return AIInterpretation(**interpretation_data)

        except Exception as e:
            # 日誌記錄錯誤
            logger.error(f"AI interpretation failed: {e}")
            # 返回基礎解讀
            return self._get_fallback_interpretation(cards_data)

    def _get_system_prompt(self) -> str:
        """系統提示詞"""
        return """你是一位專業的塔羅牌解讀師，具有豐富的牌卡知識和直覺洞察力。
        請根據用戶的問題和抽到的牌卡，提供深入、個人化的解讀。

        回應格式必須是有效的 JSON，包含以下欄位：
        {
            "overall_message": "整體訊息（200-300字）",
            "card_meanings": [
                {
                    "card_id": "牌卡ID",
                    "position": 位置編號,
                    "meaning": "牌卡含義解釋",
                    "advice": "具體建議",
                    "keywords": ["關鍵詞1", "關鍵詞2"]
                }
            ],
            "practical_advice": ["實用建議1", "實用建議2"],
            "reflection_questions": ["反思問題1", "反思問題2"],
            "lucky_elements": {
                "color": "幸運顏色",
                "number": 幸運數字,
                "direction": "幸運方位",
                "time": "幸運時段"
            }
        }

        請確保解讀內容：
        1. 積極正面，給予希望和指導
        2. 具體實用，提供可行建議
        3. 個人化，結合用戶背景
        4. 深度洞察，超越表面意義
        5. 使用繁體中文
        """

    def _build_interpretation_prompt(
        self, question: str, cards_data: List[Dict], context: Dict, user_profile: Dict = None
    ) -> str:
        """構建解讀提示詞"""

        prompt = f"""
        用戶問題：{question}
        問題類別：{context.get('question_category', '一般')}
        關注領域：{context.get('focus_area', '整體')}
        當前心情：{context.get('mood', '平靜')}

        抽到的牌卡：
        """

        for card_data in cards_data:
            card_info = card_data.get('card', {})
            prompt += f"""
        位置 {card_data['position']}：{card_info.get('name', '')} ({card_data['orientation']})
        - 編號：{card_info.get('number', '')}
        - 牌組：{card_info.get('suit', '')}
        - 位置意義：{card_data.get('position_meaning', '')}
        """

        if user_profile:
            prompt += f"""

        用戶背景：
        - 星座：{user_profile.get('zodiac_sign', '')}
        - 等級：{user_profile.get('level', 1)}
        - 總解讀次數：{user_profile.get('total_readings', 0)}
        """

        return prompt

    def _get_fallback_interpretation(self, cards_data: List[Dict]) -> AIInterpretation:
        """備用解讀（當 AI 服務失敗時）"""
        return AIInterpretation(
            overall_message="感謝你的耐心，目前我們的解讀服務暫時不可用。請稍後再試，或參考牌卡的基本含義進行自我解讀。",
            card_meanings=[
                {
                    "card_id": card["card"]["id"],
                    "position": card["position"],
                    "meaning": "請參考牌卡的基本含義",
                    "advice": "相信你的直覺",
                    "keywords": ["直覺", "信任"]
                }
                for card in cards_data
            ],
            practical_advice=["相信自己的直覺", "保持開放的心態"],
            reflection_questions=["這張牌對你意味著什麼？", "你的內心有什麼感受？"],
            lucky_elements={
                "color": "白色",
                "number": 7,
                "direction": "東方",
                "time": "清晨"
            }
        )

    async def estimate_tokens(self, text: str) -> int:
        """估算 token 數量"""
        # 簡單估算：中文約 1.5 字符 = 1 token
        return len(text) // 1.5

    async def get_usage_cost(self, input_tokens: int, output_tokens: int) -> float:
        """計算 API 使用成本"""
        # 根據 OpenAI 定價計算
        input_cost = input_tokens * 0.00015 / 1000  # $0.00015 per 1K tokens
        output_cost = output_tokens * 0.0006 / 1000  # $0.0006 per 1K tokens
        return input_cost + output_cost
```

## 5. 快取策略

### 5.1 Redis 快取實作

```python
# app/core/cache.py
import json
import pickle
from typing import Any, Optional, Union
from redis.asyncio import Redis
from app.config import settings

class CacheService:
    def __init__(self):
        self.redis = Redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
        self.default_expire = settings.CACHE_EXPIRE_IN_SECONDS

    async def get(self, key: str) -> Optional[Any]:
        """獲取快取"""
        try:
            value = await self.redis.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None

    async def set(self, key: str, value: Any, expire: Optional[int] = None) -> bool:
        """設置快取"""
        try:
            expire_time = expire or self.default_expire
            serialized_value = json.dumps(value, ensure_ascii=False, default=str)
            return await self.redis.setex(key, expire_time, serialized_value)
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """刪除快取"""
        try:
            return await self.redis.delete(key) > 0
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False

    async def exists(self, key: str) -> bool:
        """檢查快取是否存在"""
        try:
            return await self.redis.exists(key) > 0
        except Exception as e:
            logger.error(f"Cache exists error: {e}")
            return False

    # 專用快取方法
    async def cache_user_profile(self, user_id: str, profile: dict, expire: int = 3600):
        """快取用戶資料"""
        key = f"user_profile:{user_id}"
        return await self.set(key, profile, expire)

    async def get_user_profile(self, user_id: str) -> Optional[dict]:
        """獲取用戶資料快取"""
        key = f"user_profile:{user_id}"
        return await self.get(key)

    async def cache_tarot_cards(self, cards: list, expire: int = 86400):
        """快取塔羅牌資料（24小時）"""
        key = "tarot_cards:all"
        return await self.set(key, cards, expire)

    async def get_tarot_cards(self) -> Optional[list]:
        """獲取塔羅牌快取"""
        key = "tarot_cards:all"
        return await self.get(key)

    async def cache_reading_result(self, reading_id: str, result: dict, expire: int = 7200):
        """快取解讀結果（2小時）"""
        key = f"reading_result:{reading_id}"
        return await self.set(key, result, expire)

    async def invalidate_user_cache(self, user_id: str):
        """清除用戶相關快取"""
        patterns = [
            f"user_profile:{user_id}",
            f"user_readings:{user_id}:*",
            f"user_stats:{user_id}"
        ]

        for pattern in patterns:
            if "*" in pattern:
                keys = await self.redis.keys(pattern)
                if keys:
                    await self.redis.delete(*keys)
            else:
                await self.delete(pattern)

cache_service = CacheService()
```

### 5.2 快取裝飾器

```python
# app/utils/cache_decorators.py
import functools
from typing import Callable, Any
from app.core.cache import cache_service

def cache_result(expire: int = 3600, key_prefix: str = ""):
    """快取函數結果的裝飾器"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            # 生成快取鍵
            cache_key = f"{key_prefix}:{func.__name__}:{hash(str(args) + str(kwargs))}"

            # 嘗試從快取獲取
            cached_result = await cache_service.get(cache_key)
            if cached_result is not None:
                return cached_result

            # 執行函數並快取結果
            result = await func(*args, **kwargs)
            await cache_service.set(cache_key, result, expire)

            return result
        return wrapper
    return decorator

def invalidate_cache(patterns: list):
    """清除快取的裝飾器"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            result = await func(*args, **kwargs)

            # 清除相關快取
            for pattern in patterns:
                # 支援從函數參數中獲取值
                if "{" in pattern and "}" in pattern:
                    # 簡單的模板替換
                    formatted_pattern = pattern.format(*args, **kwargs)
                    await cache_service.delete(formatted_pattern)
                else:
                    await cache_service.delete(pattern)

            return result
        return wrapper
    return decorator
```

## 6. 測試計劃

### 6.1 測試配置

```python
# pytest.ini
[tool:pytest]
testpaths = app/tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    -v
    --strict-markers
    --strict-config
    --cov=app
    --cov-report=term-missing
    --cov-report=html:htmlcov
    --cov-report=xml
    --cov-fail-under=80
asyncio_mode = auto

markers =
    unit: Unit tests
    integration: Integration tests
    e2e: End-to-end tests
    slow: Slow tests
    auth: Authentication tests
    ai: AI service tests
```

```python
# app/tests/conftest.py
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import get_session
from app.models.base import Base
from app.config import settings

# 測試資料庫 URL
TEST_DATABASE_URL = "postgresql+asyncpg://test:test@localhost:5432/test_tarot_db"

@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """創建事件循環"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def test_engine():
    """創建測試資料庫引擎"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=True,
        poolclass=StaticPool,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()

@pytest.fixture
async def session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """創建測試資料庫會話"""
    TestSessionLocal = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )

    async with TestSessionLocal() as session:
        yield session
        await session.rollback()

@pytest.fixture
async def client(session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """創建測試客戶端"""
    def get_test_session():
        return session

    app.dependency_overrides[get_session] = get_test_session

    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()

@pytest.fixture
async def test_user(session: AsyncSession):
    """創建測試用戶"""
    from app.models.user import User, UserProfile
    from app.core.auth import auth_service

    user = User(
        email="test@example.com",
        password_hash=auth_service.get_password_hash("testpassword123"),
        is_verified=True,
        is_active=True
    )
    session.add(user)
    await session.flush()

    profile = UserProfile(
        user_id=user.id,
        display_name="測試用戶",
        level=1,
        experience=0
    )
    session.add(profile)
    await session.commit()

    return user

@pytest.fixture
async def auth_headers(test_user):
    """獲取認證標頭"""
    from app.core.auth import auth_service

    token = auth_service.create_access_token({"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def mock_openai():
    """模擬 OpenAI API"""
    import pytest_mock
    # 實作 OpenAI API 模擬
    pass
```

### 6.2 單元測試

```python
# app/tests/unit/test_auth_service.py
import pytest
from datetime import timedelta
from app.core.auth import AuthService

class TestAuthService:
    def setup_method(self):
        self.auth_service = AuthService()

    def test_password_hashing(self):
        """測試密碼雜湊"""
        password = "testpassword123"
        hashed = self.auth_service.get_password_hash(password)

        assert hashed != password
        assert self.auth_service.verify_password(password, hashed)
        assert not self.auth_service.verify_password("wrongpassword", hashed)

    def test_create_access_token(self):
        """測試訪問 token 創建"""
        data = {"sub": "user_id_123"}
        token = self.auth_service.create_access_token(data)

        assert isinstance(token, str)
        assert len(token) > 0

        # 驗證 token
        payload = self.auth_service.verify_token(token)
        assert payload["sub"] == "user_id_123"
        assert payload["type"] == "access"

    def test_create_refresh_token(self):
        """測試刷新 token 創建"""
        data = {"sub": "user_id_123"}
        token = self.auth_service.create_refresh_token(data)

        assert isinstance(token, str)

        # 驗證 token
        payload = self.auth_service.verify_token(token, "refresh")
        assert payload["sub"] == "user_id_123"
        assert payload["type"] == "refresh"

    def test_token_expiration(self):
        """測試 token 過期"""
        data = {"sub": "user_id_123"}

        # 創建立即過期的 token
        expired_token = self.auth_service.create_access_token(
            data, expires_delta=timedelta(seconds=-1)
        )

        # 驗證應該失敗
        with pytest.raises(HTTPException):
            self.auth_service.verify_token(expired_token)

    def test_invalid_token(self):
        """測試無效 token"""
        with pytest.raises(HTTPException):
            self.auth_service.verify_token("invalid_token")
```

```python
# app/tests/unit/test_tarot_service.py
import pytest
from unittest.mock import AsyncMock, patch
from app.services.tarot_service import TarotService
from app.models.tarot import TarotCard, TarotSpread

class TestTarotService:
    @pytest.fixture
    def mock_session(self):
        return AsyncMock()

    @pytest.fixture
    def tarot_service(self, mock_session):
        return TarotService(mock_session)

    @pytest.fixture
    def sample_cards(self):
        return [
            TarotCard(
                id="fool",
                name="愚者",
                number=0,
                suit="major_arcana",
                keywords={"upright": ["新開始"], "reversed": ["魯莽"]},
                interpretations={"general": "新的開始"}
            ),
            TarotCard(
                id="magician",
                name="魔術師",
                number=1,
                suit="major_arcana",
                keywords={"upright": ["創造力"], "reversed": ["操控"]},
                interpretations={"general": "創造的力量"}
            )
        ]

    @pytest.fixture
    def sample_spread(self):
        return TarotSpread(
            id="single_card",
            name="單牌解讀",
            cards_count=1,
            positions=[{"position": 1, "description": "指導"}]
        )

    async def test_draw_cards_success(self, tarot_service, mock_session, sample_cards, sample_spread):
        """測試成功抽牌"""
        # 模擬資料庫查詢
        mock_session.execute.return_value.scalar_one_or_none.return_value = sample_spread
        mock_session.execute.return_value.scalars.return_value.all.return_value = sample_cards

        with patch('random.sample', return_value=[sample_cards[0]]):
            with patch('random.choice', return_value="upright"):
                result = await tarot_service.draw_cards("single_card")

        assert len(result) == 1
        assert result[0].position == 1
        assert result[0].card.name == "愚者"
        assert result[0].orientation == "upright"

    async def test_draw_cards_invalid_spread(self, tarot_service, mock_session):
        """測試無效牌陣"""
        mock_session.execute.return_value.scalar_one_or_none.return_value = None

        with pytest.raises(ValueError, match="Invalid spread ID"):
            await tarot_service.draw_cards("invalid_spread")

    async def test_draw_cards_insufficient_cards(self, tarot_service, mock_session, sample_spread):
        """測試牌卡數量不足"""
        # 牌陣需要 1 張牌，但沒有可用牌卡
        mock_session.execute.return_value.scalar_one_or_none.return_value = sample_spread
        mock_session.execute.return_value.scalars.return_value.all.return_value = []

        with pytest.raises(ValueError, match="Not enough cards available"):
            await tarot_service.draw_cards("single_card")
```

### 6.3 整合測試

```python
# app/tests/integration/test_auth_endpoints.py
import pytest
from httpx import AsyncClient

class TestAuthEndpoints:

    async def test_register_success(self, client: AsyncClient):
        """測試成功註冊"""
        user_data = {
            "email": "newuser@example.com",
            "password": "strongpassword123",
            "confirm_password": "strongpassword123",
            "profile": {
                "display_name": "新用戶",
                "birth_date": "1990-01-01",
                "zodiac_sign": "摩羯座"
            }
        }

        response = await client.post("/api/v1/auth/register", json=user_data)

        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert "user_id" in data
        assert "message" in data

    async def test_register_duplicate_email(self, client: AsyncClient, test_user):
        """測試重複郵箱註冊"""
        user_data = {
            "email": test_user.email,
            "password": "password123",
            "confirm_password": "password123"
        }

        response = await client.post("/api/v1/auth/register", json=user_data)

        assert response.status_code == 400
        data = response.json()
        assert "email" in data["detail"].lower()

    async def test_login_success(self, client: AsyncClient, test_user):
        """測試成功登入"""
        login_data = {
            "email": test_user.email,
            "password": "testpassword123"
        }

        response = await client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data

    async def test_login_invalid_credentials(self, client: AsyncClient, test_user):
        """測試無效憑證登入"""
        login_data = {
            "email": test_user.email,
            "password": "wrongpassword"
        }

        response = await client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == 401

    async def test_refresh_token(self, client: AsyncClient, test_user):
        """測試刷新 token"""
        # 先登入獲取 refresh token
        login_response = await client.post("/api/v1/auth/login", json={
            "email": test_user.email,
            "password": "testpassword123"
        })

        refresh_token = login_response.json()["refresh_token"]

        # 使用 refresh token 獲取新的 access token
        response = await client.post("/api/v1/auth/refresh", json={
            "refresh_token": refresh_token
        })

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
```

```python
# app/tests/integration/test_tarot_endpoints.py
import pytest
from httpx import AsyncClient

class TestTarotEndpoints:

    async def test_get_decks(self, client: AsyncClient):
        """測試獲取牌組"""
        response = await client.get("/api/v1/tarot/decks")

        assert response.status_code == 200
        data = response.json()
        assert "decks" in data
        assert isinstance(data["decks"], list)

    async def test_get_card_by_id(self, client: AsyncClient):
        """測試根據 ID 獲取牌卡"""
        # 假設 "the-fool" 存在
        response = await client.get("/api/v1/tarot/cards/the-fool")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "the-fool"
        assert "name" in data
        assert "interpretations" in data

    async def test_draw_cards_authenticated(self, client: AsyncClient, auth_headers):
        """測試認證用戶抽牌"""
        draw_data = {
            "spread_type": "single_card",
            "question": "今天對我的建議是什麼？",
            "question_category": "daily_guidance",
            "context": {
                "focus_area": "general",
                "mood": "curious"
            }
        }

        response = await client.post(
            "/api/v1/tarot/draw",
            json=draw_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "reading_id" in data
        assert "cards" in data
        assert len(data["cards"]) == 1
        assert data["status"] == "pending_interpretation"

    async def test_draw_cards_unauthenticated(self, client: AsyncClient):
        """測試未認證用戶抽牌"""
        draw_data = {
            "spread_type": "single_card",
            "question": "測試問題"
        }

        response = await client.post("/api/v1/tarot/draw", json=draw_data)

        assert response.status_code == 401

    async def test_get_ai_interpretation(self, client: AsyncClient, auth_headers, mock_openai):
        """測試 AI 解讀"""
        # 首先抽牌
        draw_response = await client.post(
            "/api/v1/tarot/draw",
            json={
                "spread_type": "single_card",
                "question": "測試問題"
            },
            headers=auth_headers
        )

        reading_id = draw_response.json()["reading_id"]

        # 獲取 AI 解讀
        response = await client.post(
            "/api/v1/tarot/interpret",
            json={"reading_id": reading_id},
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "interpretation" in data
        assert "overall_message" in data["interpretation"]
        assert "card_meanings" in data["interpretation"]
```

### 6.4 效能測試

```python
# app/tests/performance/test_load.py
import pytest
import asyncio
import time
from httpx import AsyncClient

class TestPerformance:

    @pytest.mark.slow
    async def test_concurrent_requests(self, client: AsyncClient, auth_headers):
        """測試併發請求"""
        async def make_request():
            response = await client.get("/api/v1/tarot/decks", headers=auth_headers)
            return response.status_code

        # 模擬 50 個併發請求
        start_time = time.time()
        tasks = [make_request() for _ in range(50)]
        results = await asyncio.gather(*tasks)
        end_time = time.time()

        # 檢查所有請求都成功
        assert all(status == 200 for status in results)

        # 檢查響應時間（應該在 5 秒內完成）
        duration = end_time - start_time
        assert duration < 5.0

    @pytest.mark.slow
    async def test_ai_interpretation_performance(self, client: AsyncClient, auth_headers, mock_openai):
        """測試 AI 解讀效能"""
        # 抽牌
        draw_response = await client.post(
            "/api/v1/tarot/draw",
            json={"spread_type": "single_card", "question": "效能測試"},
            headers=auth_headers
        )

        reading_id = draw_response.json()["reading_id"]

        # 測試 AI 解讀響應時間
        start_time = time.time()
        response = await client.post(
            "/api/v1/tarot/interpret",
            json={"reading_id": reading_id},
            headers=auth_headers
        )
        end_time = time.time()

        assert response.status_code == 200

        # AI 解讀應該在 10 秒內完成
        duration = end_time - start_time
        assert duration < 10.0

    async def test_database_query_performance(self, session):
        """測試資料庫查詢效能"""
        from sqlalchemy import select, text
        from app.models.tarot import TarotCard

        # 測試簡單查詢
        start_time = time.time()
        result = await session.execute(select(TarotCard).limit(10))
        cards = result.scalars().all()
        end_time = time.time()

        assert len(cards) <= 10
        assert (end_time - start_time) < 1.0  # 應該在 1 秒內完成

        # 測試複雜查詢
        start_time = time.time()
        result = await session.execute(
            text("""
                SELECT tc.*, tr.created_at
                FROM tarot_cards tc
                LEFT JOIN tarot_readings tr ON tc.id = ANY(
                    SELECT jsonb_array_elements(tr.cards_data)->>'card_id'
                )
                ORDER BY tr.created_at DESC
                LIMIT 20
            """)
        )
        records = result.fetchall()
        end_time = time.time()

        assert (end_time - start_time) < 2.0  # 複雜查詢應該在 2 秒內完成
```

## 7. 監控與日誌

### 7.1 結構化日誌

```python
# app/utils/logger.py
import json
import logging
import sys
from datetime import datetime
from typing import Any, Dict
from pythonjsonlogger import jsonlogger

class CustomJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record: Dict[str, Any], record: logging.LogRecord, message_dict: Dict[str, Any]):
        super().add_fields(log_record, record, message_dict)

        # 添加時間戳
        log_record['timestamp'] = datetime.utcnow().isoformat()

        # 添加日誌等級
        log_record['level'] = record.levelname

        # 添加模組信息
        log_record['module'] = record.module
        log_record['function'] = record.funcName
        log_record['line'] = record.lineno

        # 添加請求 ID（如果有）
        if hasattr(record, 'request_id'):
            log_record['request_id'] = record.request_id

        # 添加用戶 ID（如果有）
        if hasattr(record, 'user_id'):
            log_record['user_id'] = record.user_id

def setup_logging():
    """設置日誌配置"""

    # 創建 logger
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # 清除現有 handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)

    # 創建 console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)

    # 設置 JSON 格式
    formatter = CustomJsonFormatter(
        '%(timestamp)s %(level)s %(module)s %(function)s %(message)s'
    )
    console_handler.setFormatter(formatter)

    logger.addHandler(console_handler)

    return logger

# 創建應用 logger
app_logger = setup_logging()

class LoggerService:
    def __init__(self):
        self.logger = app_logger

    def info(self, message: str, **kwargs):
        """記錄信息日誌"""
        extra = kwargs
        self.logger.info(message, extra=extra)

    def error(self, message: str, **kwargs):
        """記錄錯誤日誌"""
        extra = kwargs
        self.logger.error(message, extra=extra)

    def warning(self, message: str, **kwargs):
        """記錄警告日誌"""
        extra = kwargs
        self.logger.warning(message, extra=extra)

    def debug(self, message: str, **kwargs):
        """記錄調試日誌"""
        extra = kwargs
        self.logger.debug(message, extra=extra)

    def log_user_action(self, user_id: str, action: str, details: Dict[str, Any] = None):
        """記錄用戶行為"""
        self.info(
            f"User action: {action}",
            user_id=user_id,
            action=action,
            details=details or {}
        )

    def log_api_call(self, endpoint: str, method: str, status_code: int, duration: float, user_id: str = None):
        """記錄 API 調用"""
        self.info(
            f"API call: {method} {endpoint}",
            endpoint=endpoint,
            method=method,
            status_code=status_code,
            duration=duration,
            user_id=user_id
        )

    def log_ai_usage(self, user_id: str, tokens_used: int, cost: float, model: str):
        """記錄 AI 使用情況"""
        self.info(
            "AI API usage",
            user_id=user_id,
            tokens_used=tokens_used,
            cost=cost,
            model=model,
            category="ai_usage"
        )

logger = LoggerService()
```

### 7.2 中間件和錯誤處理

```python
# app/middleware.py
import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.utils.logger import logger

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 生成請求 ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # 記錄請求開始
        start_time = time.time()

        # 獲取用戶 ID（如果已認證）
        user_id = getattr(request.state, 'user_id', None)

        logger.info(
            f"Request started: {request.method} {request.url.path}",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            user_id=user_id
        )

        # 處理請求
        response = await call_next(request)

        # 計算處理時間
        duration = time.time() - start_time

        # 記錄請求完成
        logger.log_api_call(
            endpoint=request.url.path,
            method=request.method,
            status_code=response.status_code,
            duration=duration,
            user_id=user_id
        )

        # 添加響應頭
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = str(duration)

        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.request_counts = {}

    async def dispatch(self, request: Request, call_next):
        # 簡單的內存限流實作（生產環境應使用 Redis）
        client_ip = request.client.host
        current_time = int(time.time() // 60)  # 每分鐘重置

        key = f"{client_ip}:{current_time}"

        if key in self.request_counts:
            self.request_counts[key] += 1
        else:
            self.request_counts[key] = 1

        if self.request_counts[key] > self.requests_per_minute:
            logger.warning(
                f"Rate limit exceeded for {client_ip}",
                client_ip=client_ip,
                requests=self.request_counts[key]
            )
            return Response(
                content="Rate limit exceeded",
                status_code=429,
                headers={"Retry-After": "60"}
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(self.requests_per_minute - self.request_counts[key])

        return response
```

```python
# app/exceptions.py
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.utils.logger import logger

class TarotAppException(Exception):
    """應用基礎異常"""
    def __init__(self, message: str, error_code: str = None):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)

class AuthenticationError(TarotAppException):
    """認證錯誤"""
    pass

class AuthorizationError(TarotAppException):
    """授權錯誤"""
    pass

class ValidationError(TarotAppException):
    """驗證錯誤"""
    pass

class AIServiceError(TarotAppException):
    """AI 服務錯誤"""
    pass

async def tarot_app_exception_handler(request: Request, exc: TarotAppException):
    """應用異常處理器"""
    logger.error(
        f"Application error: {exc.message}",
        request_id=getattr(request.state, 'request_id', None),
        error_code=exc.error_code,
        path=request.url.path
    )

    return JSONResponse(
        status_code=400,
        content={
            "error": {
                "code": exc.error_code or "APPLICATION_ERROR",
                "message": exc.message,
                "request_id": getattr(request.state, 'request_id', None)
            }
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """驗證異常處理器"""
    logger.error(
        "Validation error",
        request_id=getattr(request.state, 'request_id', None),
        errors=exc.errors(),
        path=request.url.path
    )

    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": exc.errors(),
                "request_id": getattr(request.state, 'request_id', None)
            }
        }
    )

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """HTTP 異常處理器"""
    logger.error(
        f"HTTP error: {exc.status_code}",
        request_id=getattr(request.state, 'request_id', None),
        status_code=exc.status_code,
        detail=exc.detail,
        path=request.url.path
    )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail,
                "request_id": getattr(request.state, 'request_id', None)
            }
        }
    )
```

## 8. Docker 容器化

### 8.1 Dockerfile

```dockerfile
# Dockerfile
FROM python:3.11-slim

# 設置工作目錄
WORKDIR /app

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 複製依賴文件
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 複製應用程式碼
COPY . .

# 創建非 root 用戶
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# 暴露端口
EXPOSE 8000

# 健康檢查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 啟動命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 8.2 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:password@db:5432/tarot_db
      - REDIS_URL=redis://redis:6379/0
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - db
      - redis
    volumes:
      - ./app:/app/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=tarot_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init_db.sql:/docker-entrypoint-initdb.d/init_db.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
```

### 8.3 多階段建構（生產環境）

```dockerfile
# Dockerfile.prod
# 第一階段：建構
FROM python:3.11-slim as builder

WORKDIR /app

# 安裝建構依賴
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 安裝 Python 依賴
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# 第二階段：運行
FROM python:3.11-slim

WORKDIR /app

# 安裝運行時依賴
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 複製 Python 依賴
COPY --from=builder /root/.local /root/.local

# 確保腳本在 PATH 中
ENV PATH=/root/.local/bin:$PATH

# 複製應用程式碼
COPY . .

# 創建非 root 用戶
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# 暴露端口
EXPOSE 8000

# 健康檢查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 啟動命令
CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

## 9. CI/CD 配置

### 9.1 GitHub Actions

```yaml
# .github/workflows/backend-ci.yml
name: Backend CI/CD

on:
  push:
    branches: [ main, develop ]
    paths: [ 'backend/**' ]
  pull_request:
    branches: [ main ]
    paths: [ 'backend/**' ]

env:
  PYTHON_VERSION: '3.11'
  POSTGRES_PASSWORD: postgres
  POSTGRES_USER: postgres
  POSTGRES_DB: test_tarot_db

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_USER: postgres
          POSTGRES_DB: test_tarot_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v4

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: ${{ env.PYTHON_VERSION }}
        cache: 'pip'

    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements-dev.txt

    - name: Run linting
      run: |
        cd backend
        black --check .
        isort --check-only .
        flake8 .
        mypy app

    - name: Run tests
      env:
        DATABASE_URL: postgresql+asyncpg://postgres:postgres@localhost:5432/test_tarot_db
        REDIS_URL: redis://localhost:6379/0
        SECRET_KEY: test-secret-key
        OPENAI_API_KEY: test-api-key
      run: |
        cd backend
        pytest --cov=app --cov-report=xml --cov-report=term

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage.xml
        flags: backend
        name: backend-coverage

  security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: ${{ env.PYTHON_VERSION }}

    - name: Install security tools
      run: |
        pip install bandit safety

    - name: Run security checks
      run: |
        cd backend
        bandit -r app/ -f json -o bandit-report.json
        safety check --json --output safety-report.json

    - name: Upload security reports
      uses: actions/upload-artifact@v3
      with:
        name: security-reports
        path: backend/*-report.json

  build:
    needs: [test, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Login to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Build and push
      uses: docker/build-push-action@v5
      with:
        context: ./backend
        file: ./backend/Dockerfile.prod
        push: true
        tags: |
          ghcr.io/${{ github.repository }}/backend:latest
          ghcr.io/${{ github.repository }}/backend:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
    - name: Deploy to Zeabur
      env:
        ZEABUR_TOKEN: ${{ secrets.ZEABUR_TOKEN }}
      run: |
        curl -fsSL https://zeabur.com/install.sh | bash
        zeabur auth login --token $ZEABUR_TOKEN
        cd backend && zeabur deploy
```

## 10. 成本控制和安全性

### 10.1 AI API 成本監控

```python
# app/services/cost_monitoring.py
from typing import Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.cache import cache_service

class CostMonitoringService:
    def __init__(self):
        self.daily_limit = 100.0  # $100 per day
        self.user_daily_limit = 5.0  # $5 per user per day
        self.token_costs = {
            "gpt-4o-mini": {"input": 0.00015/1000, "output": 0.0006/1000},
            "gpt-4o": {"input": 0.005/1000, "output": 0.015/1000}
        }

    async def check_cost_limits(self, user_id: str, estimated_cost: float) -> bool:
        """檢查成本限制"""
        # 檢查用戶每日限制
        user_daily_cost = await self.get_user_daily_cost(user_id)
        if user_daily_cost + estimated_cost > self.user_daily_limit:
            return False

        # 檢查全域每日限制
        total_daily_cost = await self.get_total_daily_cost()
        if total_daily_cost + estimated_cost > self.daily_limit:
            return False

        return True

    async def record_usage(self, user_id: str, model: str, input_tokens: int, output_tokens: int, cost: float):
        """記錄使用情況"""
        usage_key = f"ai_usage:{user_id}:{datetime.now().strftime('%Y-%m-%d')}"

        # 更新每日成本
        await self.update_daily_cost(user_id, cost)

        # 記錄詳細使用情況
        usage_data = {
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost": cost,
            "timestamp": datetime.now().isoformat()
        }

        await cache_service.set(usage_key, usage_data, expire=86400)

    async def get_user_daily_cost(self, user_id: str) -> float:
        """獲取用戶每日成本"""
        cost_key = f"daily_cost:{user_id}:{datetime.now().strftime('%Y-%m-%d')}"
        cached_cost = await cache_service.get(cost_key)
        return float(cached_cost) if cached_cost else 0.0

    async def update_daily_cost(self, user_id: str, additional_cost: float):
        """更新每日成本"""
        cost_key = f"daily_cost:{user_id}:{datetime.now().strftime('%Y-%m-%d')}"
        current_cost = await self.get_user_daily_cost(user_id)
        new_cost = current_cost + additional_cost
        await cache_service.set(cost_key, new_cost, expire=86400)

cost_monitoring = CostMonitoringService()
```

### 10.2 安全性配置

```python
# app/core/security.py
from fastapi import Security, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import secrets
import hashlib
import hmac

class SecurityService:
    def __init__(self):
        self.api_keys = {}

    def generate_api_key(self, user_id: str) -> str:
        """生成 API 金鑰"""
        key = secrets.token_urlsafe(32)
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        self.api_keys[key_hash] = user_id
        return key

    def verify_webhook_signature(self, payload: bytes, signature: str, secret: str) -> bool:
        """驗證 Webhook 簽名"""
        expected_signature = hmac.new(
            secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(signature, expected_signature)

    def sanitize_input(self, text: str) -> str:
        """清理用戶輸入"""
        dangerous_chars = ['<', '>', '"', "'", '&', '\x00']
        for char in dangerous_chars:
            text = text.replace(char, '')
        return text.strip()

security_service = SecurityService()
```

## 11. 結論

這份 FastAPI 後端開發測試文件提供了完整的開發指南，涵蓋：

### 技術架構亮點
- **現代化框架**: 基於 FastAPI 的高效能 Python Web 框架
- **異步設計**: SQLAlchemy 2.0 異步 ORM 和完整的異步處理
- **安全認證**: JWT 認證和細粒度權限控制系統
- **智能快取**: Redis 多層快取策略和自動失效機制
- **AI 整合**: OpenAI API 智能整合和成本控制

### 品質保證措施
- **測試覆蓋**: 全面的單元、整合、效能測試
- **自動化流程**: 完整的 CI/CD 和程式碼品質檢查
- **安全掃描**: 程式碼安全分析和漏洞檢測
- **監控告警**: 實時監控和告警系統

### 生產就緒特性
- **容器化部署**: Docker 多階段建構和容器編排
- **負載均衡**: Nginx 反向代理和負載分散
- **結構化日誌**: JSON 格式日誌和分散式追蹤
- **成本監控**: AI API 使用監控和限制
- **安全防護**: 多層安全防護和攻擊防禦

### 開發效率工具
- **清晰架構**: 模組化設計和依賴注入
- **開發環境**: 完整的本地開發和測試環境
- **API 文檔**: 自動生成的 OpenAPI 文檔
- **代碼品質**: 自動化格式化和靜態分析

### 可擴展性設計
- **微服務友好**: 模組化設計支援未來拆分
- **資料庫優化**: 查詢優化和索引策略
- **快取策略**: 多層快取和資料一致性保證
- **API 版本控制**: 向後相容的版本管理

這個後端架構設計確保了高效能、高可用性和良好的開發體驗，為塔羅牌解讀平台提供了堅實的技術基礎，可以支撐從 MVP 到大規模生產環境的各個階段需求。

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "\u5206\u6790\u5c08\u6848\u6587\u4ef6\u4e26\u5efa\u7acb\u5f8c\u7aef\u67b6\u69cb\u8a2d\u8a08", "status": "completed", "activeForm": "\u5206\u6790\u5c08\u6848\u6587\u4ef6\u4e26\u5efa\u7acb\u5f8c\u7aef\u67b6\u69cb\u8a2d\u8a08"}, {"content": "\u8a2d\u8a08 FastAPI \u5c08\u6848\u7d50\u69cb\u548c\u76ee\u9304\u7d44\u7e54", "status": "completed", "activeForm": "\u8a2d\u8a08 FastAPI \u5c08\u6848\u7d50\u69cb\u548c\u76ee\u9304\u7d44\u7e54"}, {"content": "\u5efa\u7acb\u8cc7\u6599\u5eab schema \u548c SQLAlchemy \u6a21\u578b\u8a2d\u8a08", "status": "completed", "activeForm": "\u5efa\u7acb\u8cc7\u6599\u5eab schema \u548c SQLAlchemy \u6a21\u578b\u8a2d\u8a08"}, {"content": "\u5be6\u4f5c JWT \u8a8d\u8b49\u548c\u6b0a\u9650\u7ba1\u7406\u7cfb\u7d71", "status": "completed", "activeForm": "\u5be6\u4f5c JWT \u8a8d\u8b49\u548c\u6b0a\u9650\u7ba1\u7406\u7cfb\u7d71"}, {"content": "\u958b\u767c\u5854\u7f85\u724c\u6838\u5fc3\u696d\u52d9\u908f\u8f2f\u548c API \u7aef\u9ede", "status": "completed", "activeForm": "\u958b\u767c\u5854\u7f85\u724c\u6838\u5fc3\u696d\u52d9\u908f\u8f2f\u548c API \u7aef\u9ede"}, {"content": "\u6574\u5408 OpenAI API \u548c AI \u89e3\u8b80\u529f\u80fd", "status": "completed", "activeForm": "\u6574\u5408 OpenAI API \u548c AI \u89e3\u8b80\u529f\u80fd"}, {"content": "\u8a2d\u8a08 Redis \u5feb\u53d6\u7b56\u7565\u548c\u5be6\u4f5c", "status": "completed", "activeForm": "\u8a2d\u8a08 Redis \u5feb\u53d6\u7b56\u7565\u548c\u5be6\u4f5c"}, {"content": "\u5efa\u7acb\u5168\u9762\u7684\u6e2c\u8a66\u5957\u4ef6\uff08\u55ae\u5143\u3001\u6574\u5408\u3001API \u6e2c\u8a66\uff09", "status": "completed", "activeForm": "\u5efa\u7acb\u5168\u9762\u7684\u6e2c\u8a66\u5957\u4ef6\uff08\u55ae\u5143\u3001\u6574\u5408\u3001API \u6e2c\u8a66\uff09"}, {"content": "\u8a2d\u8a08\u932f\u8aa4\u8655\u7406\u548c\u65e5\u8a8c\u7cfb\u7d71", "status": "in_progress", "activeForm": "\u8a2d\u8a08\u932f\u8aa4\u8655\u7406\u548c\u65e5\u8a8c\u7cfb\u7d71"}, {"content": "\u5efa\u7acb Docker \u5bb9\u5668\u5316\u548c CI/CD \u914d\u7f6e", "status": "pending", "activeForm": "\u5efa\u7acb Docker \u5bb9\u5668\u5316\u548c CI/CD \u914d\u7f6e"}]