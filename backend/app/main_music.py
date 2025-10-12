"""
Music API Test Server - Minimal FastAPI for testing Music endpoints
專門用於測試 Playlist Music Player API
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings

# Import only music router
from app.api.v1 import music_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    print("✅ Music API Server starting...")
    yield
    # Shutdown
    print("👋 Music API Server shutting down...")


# Create FastAPI app
app = FastAPI(
    title="Playlist Music Player API",
    description="Music Management & AI Generation API for Wasteland Tarot",
    version="1.0.0",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    lifespan=lifespan,
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include music router
app.include_router(music_router.router, prefix="/api/v1")

# Basic endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Playlist Music Player API",
        "version": "1.0.0",
        "docs": "/api/v1/docs",
        "endpoints": {
            "music": "/api/v1/music",
            "playlists": "/api/v1/playlists",
            "ai": "/api/v1/ai"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "music-api",
        "version": "1.0.0"
    }
