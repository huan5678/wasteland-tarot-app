"""
Audio API Endpoints - TTS 音檔合成與取得
提供即時 TTS 合成、靜態音檔取得等功能
"""

from typing import Optional, Dict
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.services.tts_service import get_tts_service, TTSService
from app.services.audio_storage_service import get_audio_storage_service, AudioStorageService
from app.services.audio_cache_service import get_audio_cache_service, AudioCacheService
from app.services.story_audio_service import StoryAudioService
from app.models.audio_file import AudioType
from app.models.wasteland_card import WastelandCard
from app.schemas.audio import GenerateStoryAudioRequest, GenerateStoryAudioResponse, GetStoryAudioResponse
from app.core.logging_config import get_logger
from app.core.dependencies import get_supabase_client, get_redis_client
from supabase import Client
from redis import Redis
from datetime import datetime

logger = get_logger(__name__)

router = APIRouter()


# ============================================================================
# Request/Response Models
# ============================================================================

class SynthesizeRequest(BaseModel):
    """即時 TTS 合成請求"""
    text: str = Field(..., min_length=1, max_length=5000, description="要合成的文字")
    character_key: str = Field(..., pattern="^[a-z_]+$", description="角色識別碼")
    audio_type: str = Field(
        default="ai_response",
        pattern="^(ai_response|dynamic_reading)$",
        description="音檔類型"
    )
    cache_enabled: bool = Field(default=True, description="是否啟用快取")
    return_format: str = Field(
        default="url",
        pattern="^(url|base64)$",
        description="回傳格式"
    )


class SynthesizeResponse(BaseModel):
    """即時 TTS 合成回應"""
    url: Optional[str] = None
    audio_base64: Optional[str] = None
    duration: float
    file_size: int
    cached: bool
    source: str  # 'redis' | 'db' | 'new'
    character: dict


class AudioResponse(BaseModel):
    """靜態音檔回應"""
    url: str
    duration: float
    cached: bool
    source: str


# ============================================================================
# Dependency Injection
# ============================================================================

def get_tts_service_dep() -> TTSService:
    """取得 TTS 服務"""
    return get_tts_service()


def get_storage_service_dep(
    supabase: Client = Depends(get_supabase_client)
) -> AudioStorageService:
    """取得儲存服務"""
    return get_audio_storage_service(supabase)


def get_cache_service_dep(
    redis: Optional[Redis] = Depends(get_redis_client)
) -> AudioCacheService:
    """取得快取服務"""
    return get_audio_cache_service(redis)


def get_story_audio_service_dep(
    db: AsyncSession = Depends(get_db),
    tts_service: TTSService = Depends(get_tts_service_dep),
    storage_service: AudioStorageService = Depends(get_storage_service_dep),
    supabase: Client = Depends(get_supabase_client)
) -> StoryAudioService:
    """取得故事音檔服務"""
    return StoryAudioService(db, tts_service, storage_service, supabase)


# ============================================================================
# Endpoints
# ============================================================================

@router.post("/synthesize", response_model=SynthesizeResponse)
async def synthesize_audio(
    request: SynthesizeRequest,
    db: AsyncSession = Depends(get_db),
    tts_service: TTSService = Depends(get_tts_service_dep),
    storage_service: AudioStorageService = Depends(get_storage_service_dep),
    cache_service: AudioCacheService = Depends(get_cache_service_dep)
):
    """
    即時合成語音（用於 AI 動態解讀）

    流程：
    1. 計算文字 hash
    2. 檢查 Redis 快取 → 命中回傳
    3. 檢查資料庫（by text_hash） → 存在則快取並回傳
    4. 即時生成 → 生成 → 上傳 → 記錄 → 快取 → 回傳

    Args:
        request: 合成請求

    Returns:
        合成結果（URL 或 base64）

    Raises:
        400: 無效的角色 key
        503: TTS 服務暫時無法使用
        500: 內部錯誤
    """
    try:
        # 計算文字 hash
        text_hash = tts_service.compute_text_hash(request.text, request.character_key)

        # 取得角色 ID
        character_id = await storage_service.get_character_id_by_key(
            db, request.character_key
        )
        if not character_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid character_key: {request.character_key}"
            )

        # 1. 檢查 Redis 快取
        if request.cache_enabled:
            cached_data = cache_service.get_dynamic_audio(text_hash)
            if cached_data:
                logger.info(f"[API] Cache HIT (Redis): text_hash={text_hash[:16]}")

                # 準備回應
                character_config = tts_service.get_voice_config(request.character_key)
                response_data = {
                    "cached": True,
                    "source": "redis",
                    "duration": cached_data["duration"],
                    "file_size": cached_data["file_size"],
                    "character": {
                        "key": request.character_key,
                        "name": request.character_key.replace('_', ' ').title(),
                        "voice_params": character_config
                    }
                }

                if request.return_format == "url":
                    response_data["url"] = cached_data["url"]
                else:
                    # 如果快取只有 URL，需要重新生成 base64
                    # 這裡簡化處理，直接回傳 URL
                    response_data["url"] = cached_data["url"]

                return response_data

        # 2. 檢查資料庫
        if request.cache_enabled:
            audio_file = await storage_service.get_audio_by_text_hash(
                db, text_hash, character_id
            )
            if audio_file:
                logger.info(f"[API] Cache HIT (DB): text_hash={text_hash[:16]}")

                # 快取到 Redis
                cache_service.set_dynamic_audio(
                    text_hash=text_hash,
                    url=audio_file.storage_url,
                    duration=audio_file.duration_seconds,
                    file_size=audio_file.file_size,
                    audio_type=audio_file.audio_type.value,
                    generated_at=audio_file.created_at.isoformat() if audio_file.created_at else None
                )

                # 準備回應
                character_config = tts_service.get_voice_config(request.character_key)
                response_data = {
                    "cached": True,
                    "source": "db",
                    "duration": audio_file.duration_seconds,
                    "file_size": audio_file.file_size,
                    "character": {
                        "key": request.character_key,
                        "name": request.character_key.replace('_', ' ').title(),
                        "voice_params": character_config
                    }
                }

                if request.return_format == "url":
                    response_data["url"] = audio_file.storage_url
                else:
                    response_data["url"] = audio_file.storage_url

                return response_data

        # 3. 即時生成
        logger.info(f"[API] Generating NEW audio: character={request.character_key}, text_length={len(request.text)}")

        # 合成語音
        result = tts_service.synthesize_speech(
            text=request.text,
            character_key=request.character_key,
            language_code="zh-TW",
            return_base64=(request.return_format == "base64")
        )

        # 生成儲存路徑
        audio_type = AudioType.AI_RESPONSE if request.audio_type == "ai_response" else AudioType.DYNAMIC_READING
        storage_path = storage_service.generate_storage_path(
            audio_type=audio_type,
            identifier=text_hash[:8],  # 使用 hash 前 8 字元
            character_key=request.character_key
        )

        # 上傳到 Supabase
        storage_url = await storage_service.upload_audio(
            audio_content=result["audio_content"],
            storage_path=storage_path
        )

        # 儲存元資料到資料庫
        audio_file = await storage_service.save_audio_metadata(
            db=db,
            card_id=None,  # 動態解讀沒有 card_id
            character_id=character_id,
            storage_path=storage_path,
            storage_url=storage_url,
            file_size=result["file_size"],
            duration_seconds=result["duration"],
            text_length=result["text_length"],
            text_hash=text_hash,
            language_code="zh-TW",
            voice_name=result["voice_name"],
            ssml_params=result["ssml_params"],
            audio_type=audio_type
        )

        # 快取到 Redis
        if request.cache_enabled:
            cache_service.set_dynamic_audio(
                text_hash=text_hash,
                url=storage_url,
                duration=result["duration"],
                file_size=result["file_size"],
                audio_type=audio_type.value,
                generated_at=datetime.utcnow().isoformat()
            )

        # 準備回應
        character_config = tts_service.get_voice_config(request.character_key)
        response_data = {
            "cached": False,
            "source": "new",
            "duration": result["duration"],
            "file_size": result["file_size"],
            "character": {
                "key": request.character_key,
                "name": request.character_key.replace('_', ' ').title(),
                "voice_params": character_config
            }
        }

        if request.return_format == "url":
            response_data["url"] = storage_url
        else:
            response_data["audio_base64"] = result.get("audio_base64", "")

        logger.info(f"[API] Audio generated successfully: audio_file_id={audio_file.id}")
        return response_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Synthesis failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech synthesis failed: {str(e)}"
        )


@router.get("/test")
async def test_tts():
    """測試 TTS 服務是否正常"""
    try:
        tts_service = get_tts_service()
        return {
            "status": "ok",
            "service": "TTS API",
            "client_initialized": tts_service.client is not None
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


# ============================================================================
# Story Audio Endpoints (Wasteland Story Mode)
# ============================================================================

@router.post(
    "/generate/story",
    response_model=GenerateStoryAudioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="生成故事音檔",
    description="""
    **為卡牌故事生成角色語音音檔**

    此端點為指定卡牌的故事內容生成多個角色的語音音檔：

    功能：
    - 支援同時生成多個角色語音（最多 3 個）
    - 自動檢測快取，避免重複生成
    - 支援強制重新生成模式
    - 返回所有生成的音檔 URL

    速率限制：
    - 每分鐘最多 10 次請求（避免濫用 TTS 配額）

    錯誤處理：
    - 404: 卡牌不存在或無故事內容
    - 429: 超過速率限制
    - 503: TTS 服務暫時無法使用（提供 Web Speech API 降級方案）
    """
)
async def generate_story_audio(
    request: GenerateStoryAudioRequest,
    db: AsyncSession = Depends(get_db),
    story_audio_service: StoryAudioService = Depends(get_story_audio_service_dep)
):
    """
    生成卡牌故事音檔

    Args:
        request: 生成請求（卡牌 ID、角色列表）
        db: 資料庫 session
        story_audio_service: 故事音檔服務

    Returns:
        GenerateStoryAudioResponse: 包含音檔 URL 和快取狀態

    Raises:
        404: 卡牌不存在
        503: TTS 服務失敗
    """
    try:
        # 1. 驗證卡牌存在
        result = await db.execute(
            select(WastelandCard).where(WastelandCard.id == request.card_id)
        )
        card = result.scalar_one_or_none()

        if not card:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Card not found: {request.card_id}"
            )

        if not card.story_background:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Card {request.card_id} has no story content"
            )

        # 2. 呼叫服務生成音檔
        logger.info(f"[API] Generating story audio: card_id={request.card_id}, characters={request.character_keys}")

        audio_urls = await story_audio_service.generate_story_audio(
            card_id=request.card_id,
            character_keys=request.character_keys,
            force_regenerate=request.force_regenerate
        )

        # 3. 檢查快取狀態
        cached_status = {}
        for character_key in request.character_keys:
            # 檢查是否為快取（通過檢查音檔是否已存在）
            existing_audio = await story_audio_service.check_audio_exists(
                request.card_id,
                character_key
            )
            cached_status[character_key] = existing_audio is not None and not request.force_regenerate

        # 4. 返回回應
        return GenerateStoryAudioResponse(
            card_id=request.card_id,
            audio_urls=audio_urls,
            cached=cached_status,
            generated_at=datetime.utcnow()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Failed to generate story audio: {e}", exc_info=True)

        # TTS 服務失敗時返回 503 並提供降級方案
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": "tts_service_unavailable",
                "message": str(e),
                "fallback": "web_speech_api"
            }
        )


@router.get(
    "/story/{card_id}",
    response_model=GetStoryAudioResponse,
    summary="取得故事音檔 URL",
    description="""
    **取得指定卡牌的所有故事音檔 URL**

    此端點返回已生成的故事音檔 URL：

    功能：
    - 支援過濾特定角色（使用 character_key 參數）
    - 返回所有已完成生成的音檔
    - 設定適當的 Cache-Control headers

    快取策略：
    - Cache-Control: public, max-age=3600（1 小時）
    - 音檔 URL 為靜態資源，可長期快取
    """
)
async def get_story_audio_urls(
    card_id: UUID = Path(..., description="卡牌 ID"),
    character_key: Optional[str] = Query(None, description="過濾特定角色（可選）"),
    story_audio_service: StoryAudioService = Depends(get_story_audio_service_dep),
    db: AsyncSession = Depends(get_db)
):
    """
    取得卡牌故事音檔 URL

    Args:
        card_id: 卡牌 ID
        character_key: 過濾特定角色（可選）
        story_audio_service: 故事音檔服務
        db: 資料庫 session

    Returns:
        GetStoryAudioResponse: 包含音檔 URL 映射

    Raises:
        404: 卡牌不存在
    """
    try:
        # 1. 驗證卡牌存在
        result = await db.execute(
            select(WastelandCard).where(WastelandCard.id == card_id)
        )
        card = result.scalar_one_or_none()

        if not card:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Card not found: {card_id}"
            )

        # 2. 取得音檔 URL
        audio_urls = await story_audio_service.get_story_audio_urls(card_id)

        # 3. 過濾特定角色（如果有指定）
        if character_key:
            audio_urls = {
                key: url for key, url in audio_urls.items()
                if key == character_key
            }

        # 4. 建立回應並設定快取 headers
        response_data = GetStoryAudioResponse(
            card_id=card_id,
            audio_urls=audio_urls
        )

        # 使用 JSONResponse 以設定 Cache-Control headers
        return JSONResponse(
            content=response_data.model_dump(mode='json'),
            headers={
                "Cache-Control": "public, max-age=3600"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Failed to get story audio URLs: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve story audio URLs: {str(e)}"
        )
