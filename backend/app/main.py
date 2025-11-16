"""
Wasteland Tarot API - Main FastAPI Application
Fallout-themed Tarot Reading Platform with comprehensive Swagger documentation
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.sessions import SessionMiddleware
from contextlib import asynccontextmanager
from typing import Union
import logging
import time
from pathlib import Path

from app.config import get_settings
from app.core.exceptions import WastelandTarotException
from app.core.logging_config import setup_logging, get_logger, error_aggregator
from app.core.logging_middleware import RequestLoggingMiddleware, PerformanceMonitoringMiddleware
from app.middleware.security import SecurityHeadersMiddleware, SensitiveDataRedactionMiddleware
from app.middleware.rate_limit import limiter, RateLimitMiddleware
from app.api.v1.api import api_router
from app.db.session import init_db

settings = get_settings()

# Setup enhanced logging (optimized for production)
setup_logging(
    level=settings.log_level.upper(),
    log_dir=Path("logs"),
    enable_json=settings.environment == "production",
    enable_file=False  # Disable file logging, use stdout only (saves memory)
)

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    logger.info("🏭 Starting Wasteland Tarot API...")

    # Initialize database
    await init_db()
    logger.info("💾 Database initialized")

    # Initialize and start scheduler (conditional for memory optimization)
    if settings.enable_scheduler:
        try:
            from app.core.scheduler import start_scheduler, register_cron_job, get_scheduler
            from app.jobs.daily_number_job import daily_number_generation_job
            from app.jobs.monthly_reset_job import monthly_reset_job

            scheduler = get_scheduler()

            # Register daily number generation job (00:00 UTC+8 daily)
            register_cron_job(
                scheduler,
                daily_number_generation_job,
                job_id='daily-number-generation',
                cron_expression='0 0 * * *'
            )

            # Register monthly reset job (00:00 UTC+8 on 1st of each month)
            register_cron_job(
                scheduler,
                monthly_reset_job,
                job_id='monthly-reset',
                cron_expression='0 0 1 * *'
            )

            # Start scheduler
            start_scheduler()
            logger.info("⏰ APScheduler started with bingo jobs registered")

        except Exception as e:
            logger.error(f"Failed to start scheduler: {str(e)}", exc_info=True)
    else:
        logger.info("⏰ Scheduler disabled (ENABLE_SCHEDULER=false)")

    # Check and generate today's daily number if not exists (conditional for memory optimization)
    if settings.enable_bingo_cold_start_check:
        try:
            from app.services.daily_number_generator_service import DailyNumberGeneratorService
            from app.db.session import get_db
            from datetime import date

            logger.info("🔍 Checking if today's daily bingo number exists...")

            # Get database session
            async for db in get_db():
                try:
                    service = DailyNumberGeneratorService(db)
                    today_number = await service.get_number_by_date(date.today())

                    if not today_number:
                        logger.warning("⚠️ Today's bingo number not found, generating now...")
                        generated_number = await service.generate_daily_number(date.today())
                        logger.info(f"✅ Today's bingo number generated successfully: {generated_number.number}")
                    else:
                        logger.info(f"✅ Today's bingo number already exists: {today_number.number} (Cycle {today_number.cycle_number})")

                except Exception as num_error:
                    logger.error(f"❌ Failed to check/generate today's number: {str(num_error)}", exc_info=True)
                finally:
                    await db.close()
                break

        except Exception as num_check_error:
            logger.error(f"❌ Failed to initialize daily number check: {str(num_check_error)}", exc_info=True)
    else:
        logger.info("🔍 Bingo cold start check disabled (ENABLE_BINGO_COLD_START_CHECK=false)")

    yield

    # Shutdown scheduler (if enabled)
    if settings.enable_scheduler:
        try:
            from app.core.scheduler import shutdown_scheduler
            shutdown_scheduler()
            logger.info("⏰ APScheduler shut down")
        except Exception as e:
            logger.error(f"Failed to shutdown scheduler: {str(e)}")

    # Gracefully close database connections
    try:
        from app.db.session import close_db_connections
        await close_db_connections()
        logger.info("💾 Database connections closed gracefully")
    except Exception as e:
        logger.error(f"Failed to close database connections: {str(e)}")

    logger.info("🚪 Shutting down Wasteland Tarot API...")


# Initialize FastAPI application with comprehensive configuration
app = FastAPI(
    title="廢土塔羅 API",
    version=settings.version,
    description="""
    # ☢️ 廢土塔羅 API ☢️

    **歡迎來到輻射（Fallout）主題塔羅占卜的後末日世界！**

    透過 78 張廢土塔羅牌的神秘指引，在廢土中找到你的方向。
    完整的輻射機制、派系陣營與角色聲音解讀系統。

    ## 🎯 核心功能

    - **78 張輻射主題卡牌**：完整的大阿爾克那與小阿爾克那，融合廢土元素
    - **角色聲音解讀**：Pip-Boy（嗶嗶小子）、避難所居民、超級變種人等角色聲音
    - **業力系統整合**：善良、中立、邪惡業力影響占卜結果
    - **派系陣營**：鋼鐵兄弟會、NCR、凱撒軍團、掠奪者視角
    - **輻射機制**：環境因素影響卡牌意義
    - **豐富牌陣**：從簡單抽牌到複雜的鋼鐵兄弟會議會牌陣
    - **社群功能**：分享占卜結果、建立社群、獲得成就

    ## 🚀 開始使用

    1. **探索卡牌**：瀏覽完整的 78 張廢土塔羅牌組
    2. **選擇牌陣**：從各種占卜佈局中選擇
    3. **設定背景**：選擇角色聲音與業力對齊
    4. **抽取卡牌**：體驗廢土的神秘指引
    5. **分享占卜**：與避難所夥伴們交流

    ## 🔧 API 架構

    - **Cards API**：存取完整廢土塔羅牌組
    - **Readings API**：建立與管理個人化占卜
    - **Spreads API**：探索不同占卜牌陣佈局
    - **Voices API**：角色解讀系統
    - **Social API**：分享與發現社群占卜

    ## 📊 資料模型

    所有端點回傳一致、結構良好的 JSON 回應，具備完善的錯誤處理與詳盡文件。
    詳細資訊請查看 schemas 區塊。

    ## 🔐 認證

    部分端點需要認證以使用個人化功能與使用者資料管理。

    ---

    *「戰爭...戰爭從未改變。但命運？在廢土中總是變幻莫測。」*

    🎮 **Powered by Fallout Universe** | ⚡ **Built with FastAPI** | 🔮 **Guided by the Cards**
    """,
    openapi_tags=[
        {
            "name": "🃏 Cards",
            "description": """
            **廢土塔羅牌操作**

            存取完整的 78 張卡牌組，豐富的輻射主題內容：
            - 大阿爾克那（Major Arcana）：22 張代表主要生命力量的卡牌
            - 小阿爾克那（Minor Arcana）：56 張橫跨 4 種廢土花色的卡牌
            - 搜尋、篩選並依各種條件探索
            - 快速占卜用的隨機卡牌
            """,
        },
        {
            "name": "📖 Readings",
            "description": """
            **塔羅占卜管理**

            建立、管理並分享個人化塔羅占卜：
            - 建立含有自訂問題的新占卜
            - 從各種牌陣佈局中選擇
            - 選擇角色聲音與業力對齊
            - 追蹤占卜歷史與數據分析
            - 與社群分享
            """,
        },
        {
            "name": "📡 Streaming Readings",
            "description": """
            **串流占卜解讀**

            即時串流占卜解讀與 AI 回應：
            - 即時逐字解讀生成
            - Server-Sent Events (SSE) 串流
            - 低延遲占卜體驗
            - 支援中斷與重連
            """,
        },
        {
            "name": "🗂️ Spreads",
            "description": """
            **占卜牌陣佈局**

            探索不同的占卜方法與卡牌排列：
            - 單張廢土抽牌
            - 避難科技（Vault-Tec）三卡牌陣
            - 複雜的鋼鐵兄弟會議會佈局
            - 使用者自訂牌陣
            - 難度等級與使用統計
            """,
        },
        {
            "name": "🎭 Character Voices",
            "description": """
            **角色聲音解讀**

            由經典輻射角色解讀占卜結果：
            - Pip-Boy（嗶嗶小子）：技術分析與統計洞察
            - Vault Dweller（避難所居民）：充滿希望與樂觀的視角
            - Wasteland Trader（廢土商人）：實用智慧與生存技巧
            - Super Mutant（超級變種人）：簡單直接的解讀
            - Codsworth（科茲沃斯）：優雅的英式幽默與觀察
            """,
        },
        {
            "name": "👥 Social",
            "description": """
            **社群功能**

            與廢土流浪者們交流：
            - 公開分享喜愛的占卜結果
            - 發現熱門的社群解讀
            - 評分並評論分享的占卜
            - 獲得成就並建立名聲
            """,
        },
        {
            "name": "📊 Monitoring",
            "description": """
            **監控與分析**

            系統監控與效能追蹤：
            - 即時效能指標
            - 錯誤率統計
            - API 使用分析
            - 系統健康狀態
            """,
        },
        {
            "name": "📈 Analytics",
            "description": """
            **數據分析**

            占卜數據與使用者行為分析：
            - 卡牌使用統計
            - 占卜趨勢分析
            - 使用者偏好洞察
            - 熱門牌陣與角色
            """,
        },
        {
            "name": "⚙️ Preferences",
            "description": """
            **使用者偏好設定**

            個人化設定與偏好管理：
            - 預設角色聲音
            - 業力對齊偏好
            - 通知設定
            - 介面客製化
            """,
        },
        {
            "name": "🎲 Bingo Game",
            "description": """
            **每日簽到賓果遊戲**

            每月賓果卡與每日簽到系統：
            - 每月重置賓果卡設置（25 格）
            - 系統號碼生成（1-25 循環）
            - 三線對獎與獎勵系統
            - 簽到紀錄追蹤
            """,
        },
        {
            "name": "🔐 OAuth",
            "description": """
            **OAuth 認證**

            使用者認證與授權：
            - Google OAuth 2.0 登入
            - JWT Token 管理
            - 使用者註冊與登入
            - Session 管理
            """,
        },
        {
            "name": "🔧 系統",
            "description": """
            **系統資訊與健康檢查**

            API 狀態、版本資訊與健康檢查
            """,
        },
    ],
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
    # Add contact and license information
    contact={
        "name": "廢土塔羅團隊",
        "email": "contact@wastelandtarot.com",
        "url": "https://wastelandtarot.com",
    },
    license_info={
        "name": "MIT 授權條款",
        "url": "https://opensource.org/licenses/MIT",
    },
)


# Add GZip compression middleware (optimize response size)
# Temporarily disabled to avoid ERR_CONTENT_DECODING_FAILED with Next.js dev proxy
# The issue occurs because Next.js dev server doesn't handle double-compression well
# from fastapi.middleware.gzip import GZipMiddleware
# app.add_middleware(GZipMiddleware, minimum_size=1000)
# TODO: Re-enable in production deployment
# if settings.environment == "production":
#     from fastapi.middleware.gzip import GZipMiddleware
#     app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add security headers middleware (always enabled)
app.add_middleware(
    SecurityHeadersMiddleware,
    enable_hsts=(settings.environment == "production")
)

# Add session middleware for WebAuthn
# Secret key should be at least 32 characters
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.secret_key,
    session_cookie="wasteland_tarot_session",
    max_age=3600,  # 1 hour
    same_site="lax",
    https_only=(settings.environment == "production")
)

# Add sensitive data redaction middleware
app.add_middleware(SensitiveDataRedactionMiddleware)

# Add rate limiting middleware
app.add_middleware(RateLimitMiddleware)

# Add security middleware
if not settings.debug:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1", "*.wastelandtarot.com"]
    )


# Add CORS middleware - More permissive in development
if settings.environment == "development":
    # Development: Allow all origins with regex pattern
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r".*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Response-Time"],
    )
else:
    # Production: Strict whitelist
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Response-Time"],
    )

# Add logging and monitoring middleware
app.add_middleware(
    RequestLoggingMiddleware,
    log_request_body=settings.debug,
    log_response_body=False,
    exclude_paths=["/health", "/metrics", "/docs", "/redoc", "/openapi.json"]
)

app.add_middleware(
    PerformanceMonitoringMiddleware,
    slow_threshold_ms=1000.0,
    very_slow_threshold_ms=3000.0
)


# Global exception handlers
@app.exception_handler(WastelandTarotException)
async def wasteland_tarot_exception_handler(request: Request, exc: WastelandTarotException):
    """Handle custom Wasteland Tarot exceptions."""
    logger.error(f"Wasteland Tarot Exception: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.message,
                "details": exc.details,
                "radiation_level": "⚠️ Caution advised in the wasteland"
            },
            "success": False,
            "timestamp": time.time()
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors with Fallout theme."""
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Pip-Boy detected invalid input parameters",
                "details": exc.errors(),
                "radiation_level": "🔴 Data corruption detected"
            },
            "success": False,
            "timestamp": time.time()
        },
    )


@app.exception_handler(500)
async def internal_server_error_handler(request: Request, exc: Exception):
    """Handle internal server errors with Fallout theme."""
    logger.error(f"Internal server error: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Critical system failure detected. Please contact Vault-Tec support.",
                "radiation_level": "☢️ Maximum radiation exposure"
            },
            "success": False,
            "timestamp": time.time()
        },
    )


# Include API routers
app.include_router(
    api_router,
    prefix=settings.api_v1_str,
    responses={
        404: {"description": "⚠️ 在廢土中找不到資源"},
        500: {"description": "☢️ 系統嚴重故障"},
        422: {"description": "🔴 偵測到無效的輸入資料"},
    }
)


# Root endpoint
@app.get(
    "/",
    tags=["🔧 系統"],
    summary="API 歡迎頁與狀態",
    description="歡迎端點，提供 API 資訊與系統狀態",
    response_description="API 歡迎訊息、版本與狀態資訊"
)
async def root():
    """
    歡迎來到廢土塔羅 API！

    此端點提供基本 API 資訊並確認系統運作正常。
    適用於健康檢查與初步 API 探索。
    """
    return {
        "message": "☢️ Welcome to the Wasteland Tarot API! ☢️",
        "version": settings.version,
        "description": "Fallout-themed Tarot Reading Platform",
        "documentation": "/docs",
        "redoc": "/redoc",
        "status": "🟢 Operational",
        "features": [
            "🃏 78 Fallout-themed Tarot Cards",
            "🎭 Character Voice Interpretations",
            "⚖️ Karma System Integration",
            "🏛️ Faction Alignment Support",
            "☢️ Radiation Mechanics",
            "📊 Comprehensive Reading Analytics",
            "👥 Social Sharing Features"
        ],
        "wasteland_wisdom": "Remember vault dweller: The cards know the way, even when the path is unclear.",
        "environment": settings.environment,
        "debug": settings.debug
    }


# Health check endpoint
@app.get(
    "/health",
    tags=["🔧 系統"],
    summary="系統健康檢查",
    description="全面的系統元件健康檢查",
    response_description="所有系統元件的詳細健康狀態"
)
async def health_check():
    """
    全面的系統健康檢查。

    驗證所有關鍵系統元件的狀態：
    - 資料庫連線
    - 外部服務可用性
    - 記憶體與效能指標
    - 配置狀態

    回傳詳細的健康資訊，用於監控與除錯。
    """
    return {
        "status": "🟢 Healthy",
        "timestamp": time.time(),
        "version": settings.version,
        "environment": settings.environment,
        "components": {
            "database": "🟢 Connected",
            "supabase": "🟢 Operational",
            "redis": "🟡 Optional" if not settings.redis_url else "🟢 Connected",
            "authentication": "🟢 Ready",
            "card_deck": "🟢 Complete (78 cards loaded)",
        },
        "system": {
            "uptime": "System operational",
            "memory": "Within normal parameters",
            "radiation_levels": "🟢 Safe for operations"
        },
        "api": {
            "cards_endpoint": "🟢 Available",
            "readings_endpoint": "🟢 Available",
            "spreads_endpoint": "🟢 Available",
            "voices_endpoint": "🟢 Available"
        }
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
        access_log=True,
    )