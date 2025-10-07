"""
Configuration settings for Wasteland Tarot API
Uses Pydantic Settings for environment variable management with Supabase
"""

from functools import lru_cache
from typing import List, Optional
from pydantic import Field, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with Supabase configuration."""

    # API Configuration
    api_v1_str: str = "/api/v1"
    project_name: str = "Wasteland Tarot API"
    version: str = "0.1.0"
    description: str = "Fallout-themed Tarot Reading Platform"

    # Security
    secret_key: str = Field(..., env="SECRET_KEY")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Supabase Configuration
    supabase_url: str = Field(..., env="SUPABASE_URL")
    supabase_key: str = Field(..., env="SUPABASE_KEY")
    supabase_service_role_key: str = Field(..., env="SUPABASE_SERVICE_ROLE_KEY")

    # Database Configuration
    database_url: str = Field(..., env="DATABASE_URL")
    db_host: str = Field(..., env="DB_HOST")
    db_port: int = Field(5432, env="DB_PORT")
    db_name: str = Field("postgres", env="DB_NAME")
    db_user: str = Field("postgres", env="DB_USER")
    db_password: str = Field(..., env="DB_PASSWORD")

    # Environment
    environment: str = Field("development", env="ENVIRONMENT")
    debug: bool = Field(False, env="DEBUG")

    # CORS
    backend_cors_origins: List[str] = Field(
        default=[
            "http://localhost:3000",
            "https://localhost:3000",
            "http://localhost:3001",
            "https://localhost:3001",
            "http://localhost",
            "https://localhost"
        ],
        env="BACKEND_CORS_ORIGINS"
    )

    # Redis Configuration (Optional for caching)
    redis_url: Optional[str] = Field(None, env="REDIS_URL")

    # Logging
    log_level: str = Field("INFO", env="LOG_LEVEL")
    enable_json_logging: bool = Field(False, env="ENABLE_JSON_LOGGING")
    log_dir: str = Field("logs", env="LOG_DIR")

    # Performance Monitoring
    slow_request_threshold_ms: float = Field(1000.0, env="SLOW_REQUEST_THRESHOLD_MS")
    very_slow_request_threshold_ms: float = Field(3000.0, env="VERY_SLOW_REQUEST_THRESHOLD_MS")

    # Wasteland Tarot Specific Settings
    max_cards_per_reading: int = 10
    max_readings_per_user_per_day: int = 20
    card_image_base_url: str = "/public/cards"
    audio_base_url: str = "/public/audio"

    # AI Interpretation Settings - Multi-Provider Support
    ai_enabled: bool = Field(False, env="AI_ENABLED")
    ai_provider: str = Field("openai", env="AI_PROVIDER")  # openai, gemini, anthropic

    # OpenAI Configuration
    openai_api_key: Optional[str] = Field(None, env="OPENAI_API_KEY")
    openai_model: str = Field("gpt-4o", env="OPENAI_MODEL")
    openai_organization: Optional[str] = Field(None, env="OPENAI_ORGANIZATION")

    # Google Gemini Configuration
    gemini_api_key: Optional[str] = Field(None, env="GEMINI_API_KEY")
    gemini_model: str = Field("gemini-1.5-pro", env="GEMINI_MODEL")

    # Anthropic Configuration (legacy support)
    anthropic_api_key: Optional[str] = Field(None, env="ANTHROPIC_API_KEY")
    anthropic_model: str = Field("claude-3-5-sonnet-20241022", env="ANTHROPIC_MODEL")

    # Legacy model field (for backward compatibility)
    ai_model: Optional[str] = Field(None, env="AI_MODEL")

    # Common AI Settings
    ai_max_tokens: int = Field(500, env="AI_MAX_TOKENS")
    ai_temperature: float = Field(0.8, env="AI_TEMPERATURE")
    ai_cache_ttl: int = Field(3600, env="AI_CACHE_TTL")  # 1 hour
    ai_fallback_to_template: bool = Field(True, env="AI_FALLBACK_TO_TEMPLATE")

    # Performance Settings
    database_pool_size: int = 20
    database_max_overflow: int = 0
    cache_expire_seconds: int = 3600  # 1 hour

    @validator("backend_cors_origins", pre=True)
    def assemble_cors_origins(cls, v):
        """Parse CORS origins from environment variable."""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    @validator("database_url", pre=True)
    def validate_database_url(cls, v: str, values: dict) -> str:
        """
        Validate database URL format and ensure correct driver.

        Args:
            v: Database URL string
            values: Other validated field values

        Returns:
            str: Validated database URL

        Raises:
            ValueError: If database URL format is invalid for the environment

        Notes:
            - Development/Testing: Allows PostgreSQL or SQLite
            - Production: Requires PostgreSQL with asyncpg driver
            - Automatically converts sync URLs to async format
        """
        if not v:
            raise ValueError("DATABASE_URL is required")

        # Allow SQLite for testing and development environments
        environment = values.get('environment', 'development')

        if environment in ['testing', 'development']:
            # Accept both PostgreSQL and SQLite
            valid_prefixes = (
                "postgresql://",
                "postgresql+asyncpg://",
                "sqlite://",
                "sqlite+aiosqlite://"
            )
            if v.startswith(valid_prefixes):
                return v
            raise ValueError(
                f"Invalid DATABASE_URL for {environment}: must start with one of {valid_prefixes}"
            )

        # Production environment validation
        if environment == 'production':
            if not v.startswith(("postgresql://", "postgresql+asyncpg://")):
                raise ValueError(
                    "DATABASE_URL must be a PostgreSQL URL for production use. "
                    "Use format: postgresql+asyncpg://user:pass@host:port/dbname"
                )

        return v

    @property
    def sync_database_url(self) -> str:
        """Get synchronous database URL for Alembic."""
        return self.database_url.replace("+asyncpg", "")

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.environment.lower() == "development"

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.environment.lower() == "production"

    class Config:
        env_file = ".env"
        case_sensitive = False


class TestSettings(Settings):
    """Test environment specific settings."""

    # Override required fields for testing
    secret_key: str = "test_secret_key_for_development_only_12345"
    supabase_url: str = "https://test.supabase.co"
    supabase_key: str = "test_key"
    supabase_service_role_key: str = "test_service_key"
    db_host: str = "localhost"
    db_password: str = "test_password"

    # Override database for testing - use SQLite for tests
    database_url: str = "sqlite+aiosqlite:///./test.db"

    # Test-specific settings
    environment: str = "testing"
    debug: bool = True
    access_token_expire_minutes: int = 5  # Shorter for tests
    max_readings_per_user_per_day: int = 100  # More permissive for tests

    # Disable external services in tests
    redis_url: Optional[str] = None

    class Config:
        env_file = ".env.test"


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()


@lru_cache()
def get_test_settings() -> TestSettings:
    """Get cached test settings."""
    return TestSettings()


# Export settings instance
settings = get_settings()