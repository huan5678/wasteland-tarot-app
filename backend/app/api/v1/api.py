"""
Main API router for Wasteland Tarot API v1
Aggregates all endpoint routers with proper organization
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    cards,
    readings,
    readings_stream,
    spreads,
    voices,
    social,
    monitoring,
    analytics,
    preferences,
    bingo
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
    oauth.router,
    tags=["🔐 OAuth"]
)