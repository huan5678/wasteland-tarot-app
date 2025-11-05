"""AI music generation API endpoints."""

import logging
from typing import Annotated, Dict, Any
from uuid import UUID

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from supabase import Client

from app.core.supabase import get_supabase_client
from app.core.dependencies import get_current_user
from app.models.music import QuotaResponse, MusicParameters
from app.models.user import User
from app.services.ai_service import AIService

logger = logging.getLogger(__name__)

router = APIRouter()


class GenerateMusicRequest(BaseModel):
    """AI 音樂生成請求模型"""

    prompt: str = Field(
        min_length=1,
        max_length=200,
        description="使用者輸入的自然語言描述",
        examples=["神秘的廢土夜晚，帶有合成器和電子鼓"],
    )


class GenerateMusicResponse(BaseModel):
    """AI 音樂生成回應模型"""

    success: bool = Field(description="生成是否成功")
    data: Dict[str, Any] = Field(
        description="生成結果",
        examples=[{
            "parameters": {
                "key": "A",
                "mode": "minor",
                "tempo": 80,
                "timbre": "sawtooth",
                "genre": ["synthwave", "industrial", "ambient"],
                "mood": ["mysterious", "dark", "atmospheric"],
            },
            "provider": "gemini",
            "quota_remaining": 15,
        }]
    )


@router.post(
    "/generate-music",
    response_model=GenerateMusicResponse,
    summary="AI 音樂生成",
    description="""
    AI 音樂生成（參數解析）

    邏輯:
    1. 驗證使用者認證和請求 body (prompt, userId)
    2. 驗證 prompt 長度限制（最多 200 字元）
    3. 查詢使用者配額 (user_ai_quotas)
    4. 若配額已用完，回傳 403 Forbidden
    5. 呼叫 LLM Provider Factory
    6. 驗證回傳的 MusicParameters JSON 格式
    7. 回傳參數（不扣配額，儲存時才扣）

    Multi-Provider 回退機制:
    - 第一優先: Google Gemini 2.5 Flash (10s timeout)
    - 第二優先: OpenAI GPT-4o-mini (10s timeout)
    - 最終回退: 預設參數

    認證: Required (Bearer token)
    """,
)
async def generate_music(
    data: GenerateMusicRequest,
    supabase: Client = Depends(get_supabase_client),
    current_user: User = Depends(get_current_user),
) -> GenerateMusicResponse:
    """AI 音樂生成（參數解析）"""
    user_id = UUID(current_user.id)
    service = AIService(supabase)

    result = await service.generate_music_parameters(
        user_id=user_id,
        prompt=data.prompt,
    )

    return GenerateMusicResponse(
        success=True,
        data={
            "parameters": result["parameters"].model_dump(),
            "provider": result["provider"],
            "quota_remaining": result["quota_remaining"],
        }
    )


@router.get(
    "/quota",
    response_model=QuotaResponse,
    summary="查詢配額",
    description="""
    查詢使用者 AI 音樂生成配額

    回傳:
    - quotaLimit: 配額上限（免費 20, 付費 100）
    - usedCount: 本月已使用次數
    - remaining: 剩餘配額
    - resetAt: 下次重置時間

    認證: Required (Bearer token)
    """,
)
async def get_quota(
    supabase: Client = Depends(get_supabase_client),
    current_user: User = Depends(get_current_user),
) -> QuotaResponse:
    """查詢配額"""
    user_id = UUID(current_user.id)
    service = AIService(supabase)

    return await service.get_user_quota(user_id=user_id)
