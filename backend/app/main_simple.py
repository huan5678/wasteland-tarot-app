"""
Simplified Wasteland Tarot API - Main FastAPI application with Supabase
Minimal version to test Supabase connectivity
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings

# Import only basic working modules
from app.api import cards  # Basic cards API
from app.api.v1 import music_router  # Music system API
from app.db.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    try:
        await init_db()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
    yield
    # Shutdown
    pass


# Create FastAPI app
app = FastAPI(
    title=f"{settings.project_name} (Simplified)",
    description=f"{settings.description} - Minimal version with Supabase",
    version=settings.version,
    openapi_url=f"{settings.api_v1_str}/openapi.json",
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

# Include only basic API routers that work
app.include_router(cards.router, prefix=settings.api_v1_str)
app.include_router(music_router.router, prefix=f"{settings.api_v1_str}")

# Add health check and basic endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to the Wasteland Tarot API (Simplified with Supabase)",
        "version": settings.version,
        "environment": settings.environment,
        "description": "Fallout-themed Tarot Reading Platform using Supabase",
        "database": "Supabase PostgreSQL",
        "status": "working"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "wasteland-tarot-api-simplified",
        "version": settings.version,
        "database": "supabase"
    }


@app.get("/api/v1/status")
async def api_status():
    """API status endpoint"""
    return {
        "api_status": "operational",
        "database": "supabase",
        "features": [
            "card_reading",
            "supabase_integration",
            "fallout_theming"
        ],
        "version": settings.version
    }