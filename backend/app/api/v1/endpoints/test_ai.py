"""
Test AI Interpretation API endpoints
測試 AI 解讀功能的簡化 API
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import get_db
from app.models.wasteland_card import (
    WastelandCard,
    CharacterVoice,
    FactionAlignment,
    KarmaAlignment
)
from app.services.ai_interpretation_service import AIInterpretationService
from app.config import settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class InterpretationRequest(BaseModel):
    """AI 解讀請求"""
    question: str
    character_voice: str
    faction_alignment: str
    spread_type: str
    card_ids: List[str]
    provider: str = "openai"  # 預設使用 openai


@router.post(
    "/interpret/stream",
    summary="取得 AI 解讀（串流模式）",
    description="使用串流模式取得 AI 卡牌解讀，支援即時顯示"
)
async def interpret_cards_stream(
    request: InterpretationRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    取得 AI 卡牌解讀（串流模式）

    - question: 用戶問題
    - character_voice: 角色聲音 (pip_boy, codsworth, vault_dweller, super_mutant, wasteland_trader)
    - faction_alignment: 陣營傾向 (vault_dweller, brotherhood, ncr, legion, raiders, minutemen, railroad, institute, independent)
    - spread_type: 牌陣類型 (three_card, relationship, decision, celtic_cross)
    - card_ids: 卡牌 ID 列表
    """
    try:
        # 驗證 character_voice
        try:
            character = CharacterVoice(request.character_voice)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid character_voice: {request.character_voice}. Valid values: pip_boy, codsworth, vault_dweller, super_mutant, wasteland_trader"
            )

        # 驗證 faction_alignment
        try:
            faction = FactionAlignment(request.faction_alignment)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid faction_alignment: {request.faction_alignment}. Valid values: vault_dweller, brotherhood, ncr, legion, raiders, minutemen, railroad, institute, independent"
            )

        # 從資料庫讀取卡牌
        result = await db.execute(
            select(WastelandCard).where(WastelandCard.id.in_(request.card_ids))
        )
        cards = result.scalars().all()

        if len(cards) == 0:
            raise HTTPException(
                status_code=404,
                detail="No cards found with the provided IDs"
            )

        if len(cards) != len(request.card_ids):
            logger.warning(
                f"Requested {len(request.card_ids)} cards but found {len(cards)}"
            )

        # 創建 AI Service with specified provider
        # 根據 provider 參數創建對應的 AI service
        if request.provider == "gemini":
            # Gemini provider
            from app.services.ai_providers.factory import create_ai_provider
            provider = create_ai_provider(
                provider_name="gemini",
                api_key=settings.gemini_api_key or "",
                model=settings.gemini_model
            )
            if not provider or not provider.is_available():
                raise HTTPException(
                    status_code=503,
                    detail=f"Gemini AI provider is not available. Please check GEMINI_API_KEY configuration."
                )
            ai_service = AIInterpretationService(settings, db, provider=provider)
        elif request.provider == "openai":
            # OpenAI provider
            from app.services.ai_providers.factory import create_ai_provider
            provider = create_ai_provider(
                provider_name="openai",
                api_key=settings.openai_api_key or "",
                model=settings.openai_model,
                organization=settings.openai_organization
            )
            if not provider or not provider.is_available():
                raise HTTPException(
                    status_code=503,
                    detail=f"OpenAI provider is not available. Please check OPENAI_API_KEY configuration."
                )
            ai_service = AIInterpretationService(settings, db, provider=provider)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid provider: {request.provider}. Valid providers: openai, gemini"
            )

        # 使用多卡解讀串流
        async def generate_stream():
            try:
                async for chunk in ai_service.generate_multi_card_interpretation_stream(
                    cards=cards,
                    character_voice=character,
                    question=request.question,
                    karma=KarmaAlignment.NEUTRAL,  # 可以從 request 中獲取
                    faction=faction,
                    spread_type=request.spread_type
                ):
                    yield chunk
            except Exception as e:
                logger.error(f"Error in AI interpretation stream: {e}", exc_info=True)
                yield f"\n\n[Error: {str(e)}]"

        return StreamingResponse(
            generate_stream(),
            media_type="text/plain; charset=utf-8"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in interpret_cards_stream: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate interpretation: {str(e)}"
        )
