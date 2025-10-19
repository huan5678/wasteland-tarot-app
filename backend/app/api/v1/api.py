"""
Main API router for Wasteland Tarot API v1
Aggregates all endpoint routers with proper organization
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    users,
    cards,
    readings,
    readings_stream,
    spreads,
    voices,
    social,
    monitoring,
    analytics,
    preferences,
    bingo,
    sessions,
    music,
    playlists,
    ai,
    characters,
    factions,
    card_interpretations,
    audio,
    test_ai,
)
from app.api import oauth

# Create main API router
api_router = APIRouter()

# Include all endpoint routers with their respective tags
# Authentication endpoints (new - for JWT verify, refresh, logout, me)
api_router.include_router(
    auth.router,
    tags=["🔐 認證"]
)

# User profile endpoints
api_router.include_router(
    users.router,
    tags=["👤 用戶資料"]
)

api_router.include_router(
    cards.router,
    prefix="/cards",
    tags=["🃏 Cards"]
)

api_router.include_router(
    readings.router,
    prefix="/readings",
    tags=["📖 Readings"]
)

api_router.include_router(
    readings_stream.router,
    prefix="/readings",
    tags=["📡 Streaming Readings"]
)

api_router.include_router(
    spreads.router,
    prefix="/spreads",
    tags=["🗂️ Spreads"]
)

api_router.include_router(
    voices.router,
    prefix="/voices",
    tags=["🎭 Character Voices"]
)

# Character Voice System Management (Normalized)
api_router.include_router(
    characters.router,
    prefix="/characters",
    tags=["🎭 角色管理"]
)

api_router.include_router(
    factions.router,
    prefix="/factions",
    tags=["🏰 陣營管理"]
)

api_router.include_router(
    card_interpretations.router,
    prefix="/interpretations",
    tags=["📝 卡牌解讀管理"]
)

api_router.include_router(
    social.router,
    prefix="/social",
    tags=["👥 Social"]
)

api_router.include_router(
    monitoring.router,
    prefix="/monitoring",
    tags=["📊 Monitoring"]
)

api_router.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["📈 Analytics"]
)

api_router.include_router(
    preferences.router,
    prefix="/preferences",
    tags=["⚙️ Preferences"]
)

api_router.include_router(
    bingo.router,
    prefix="/bingo",
    tags=["🎲 Bingo Game"]
)

api_router.include_router(
    sessions.router,
    prefix="/sessions",
    tags=["💾 Sessions"]
)

# Music system endpoints
api_router.include_router(
    music.router,
    prefix="/music",
    tags=["🎵 Music Tracks"]
)

api_router.include_router(
    playlists.router,
    prefix="/playlists",
    tags=["📀 Playlists"]
)

api_router.include_router(
    ai.router,
    prefix="/ai",
    tags=["🤖 AI Music Generation"]
)

# Audio/TTS endpoints
api_router.include_router(
    audio.router,
    prefix="/audio",
    tags=["🔊 TTS Audio"]
)

# Test AI Interpretation endpoints
api_router.include_router(
    test_ai.router,
    prefix="/test-ai",
    tags=["🧪 AI Testing"]
)

api_router.include_router(
    oauth.router,
    tags=["🔐 OAuth"]
)