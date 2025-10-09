"""
AI 驅動的塔羅解讀串流 API 端點
提供 AI 生成解讀的即時串流
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.wasteland_card import (
    WastelandCard as WastelandCardModel,
    CharacterVoice,
    KarmaAlignment,
    FactionAlignment
)
from app.services.ai_interpretation_service import AIInterpretationService
from app.core.dependencies import get_ai_interpretation_service
from sqlalchemy import select

logger = logging.getLogger(__name__)
router = APIRouter()


class StreamInterpretationRequest(BaseModel):
    """串流解讀的請求模型"""
    card_id: str = Field(..., description="廢土卡牌的 ID")
    question: str = Field(..., description="使用者的問題", max_length=500)
    character_voice: CharacterVoice = Field(
        default=CharacterVoice.PIP_BOY,
        description="解讀的角色聲音"
    )
    karma_alignment: KarmaAlignment = Field(
        default=KarmaAlignment.NEUTRAL,
        description="業力情境"
    )
    faction_alignment: Optional[FactionAlignment] = Field(
        default=None,
        description="選用的派系影響"
    )
    position_meaning: Optional[str] = Field(
        default=None,
        description="牌陣中的選用位置（例如：'過去'、'現在'、'未來'）"
    )


class StreamMultiCardRequest(BaseModel):
    """串流多卡解讀的請求模型"""
    card_ids: list[str] = Field(..., description="牌陣中的卡牌 ID 清單")
    question: str = Field(..., description="使用者的問題", max_length=500)
    character_voice: CharacterVoice = Field(
        default=CharacterVoice.PIP_BOY,
        description="解讀的角色聲音"
    )
    karma_alignment: KarmaAlignment = Field(
        default=KarmaAlignment.NEUTRAL,
        description="業力情境"
    )
    faction_alignment: Optional[FactionAlignment] = Field(
        default=None,
        description="選用的派系影響"
    )
    spread_type: str = Field(
        default="three_card",
        description="牌陣佈局類型"
    )


@router.post(
    "/interpretation/stream",
    summary="串流單卡解讀",
    description="""
    **即時串流 AI 驅動的塔羅卡牌解讀**

    此端點產生並串流 Fallout 主題的塔羅卡牌解讀，
    隨著 AI 生成而串流，提供動態且引人入勝的使用者體驗。

    功能：
    - **即時串流**：文字隨產生而顯示
    - **角色聲音**：Pip-Boy、避難所居民、超級變種人等
    - **業力情境**：善良、中立或邪惡的影響
    - **派系影響**：鋼鐵兄弟會、NCR、凱撒軍團的觀點
    - **位置意義**：牌陣中的情境

    回應格式：
    - Server-Sent Events（SSE）格式
    - 每個區塊：`data: {text_chunk}\\n\\n`
    - 最終事件：`data: [DONE]\\n\\n`

    適用於：
    - 動態卡牌揭示體驗
    - 引人入勝的行動裝置互動
    - 即時敘事
    """,
    responses={
        200: {
            "description": "串流解讀",
            "content": {"text/event-stream": {"example": "data: 愚者代表...\n\n"}}
        },
        404: {"description": "找不到卡牌"},
        503: {"description": "AI 服務無法使用"}
    }
)
async def stream_card_interpretation(
    request: StreamInterpretationRequest,
    db: AsyncSession = Depends(get_db),
    ai_service: AIInterpretationService = Depends(get_ai_interpretation_service)
):
    """串流單卡解讀"""

    # Check if AI service is available
    if not ai_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="AI interpretation service is currently unavailable"
        )

    # Fetch card from database
    result = await db.execute(
        select(WastelandCardModel).where(WastelandCardModel.id == request.card_id)
    )
    card = result.scalar_one_or_none()

    if not card:
        raise HTTPException(status_code=404, detail=f"Card not found: {request.card_id}")

    async def generate_stream():
        """Generator function for streaming response"""
        try:
            # Stream interpretation chunks
            async for chunk in ai_service.generate_interpretation_stream(
                card=card,
                character_voice=request.character_voice,
                question=request.question,
                karma=request.karma_alignment,
                faction=request.faction_alignment,
                position_meaning=request.position_meaning
            ):
                # Format as SSE (Server-Sent Events)
                yield f"data: {chunk}\n\n"

            # Send completion signal
            yield "data: [DONE]\n\n"

        except Exception as e:
            logger.error(f"Error during streaming: {e}", exc_info=True)
            yield f"data: [ERROR] {str(e)}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


@router.post(
    "/interpretation/stream-multi",
    summary="串流多卡牌陣解讀",
    description="""
    **為牌陣中的多張卡牌串流 AI 解讀**

    為整個卡牌牌陣產生連貫的解讀，
    隨著 AI 生成而即時串流。

    功能：
    - **牌陣感知**：考慮卡牌位置與關聯性
    - **敘事流程**：跨所有卡牌講述完整故事
    - **角色聲音**：保持一致的個性
    - **業力與派系情境**：貫穿整個解讀

    牌陣類型：
    - `three_card`：過去、現在、未來
    - `celtic_cross`：10 張卡牌全面占卜
    - `relationship`：你、對方、關係
    - `decision`：選項與結果

    回應格式：
    - Server-Sent Events（SSE）格式
    - 每個區塊：`data: {text_chunk}\\n\\n`
    - 最終事件：`data: [DONE]\\n\\n`
    """,
    responses={
        200: {
            "description": "串流多卡解讀",
            "content": {"text/event-stream": {"example": "data: 檢視您的牌陣...\n\n"}}
        },
        404: {"description": "找不到一張或多張卡牌"},
        503: {"description": "AI 服務無法使用"}
    }
)
async def stream_multi_card_interpretation(
    request: StreamMultiCardRequest,
    db: AsyncSession = Depends(get_db),
    ai_service: AIInterpretationService = Depends(get_ai_interpretation_service)
):
    """串流多卡牌陣解讀"""

    # Check if AI service is available
    if not ai_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="AI interpretation service is currently unavailable"
        )

    # Validate we have cards
    if not request.card_ids or len(request.card_ids) == 0:
        raise HTTPException(status_code=400, detail="No cards provided")

    # Fetch all cards from database
    result = await db.execute(
        select(WastelandCardModel).where(WastelandCardModel.id.in_(request.card_ids))
    )
    cards = result.scalars().all()

    if len(cards) != len(request.card_ids):
        raise HTTPException(
            status_code=404,
            detail=f"Some cards not found. Expected {len(request.card_ids)}, found {len(cards)}"
        )

    # Maintain order of cards as requested
    card_map = {card.id: card for card in cards}
    ordered_cards = [card_map[card_id] for card_id in request.card_ids]

    async def generate_stream():
        """Generator function for streaming response"""
        try:
            # Stream multi-card interpretation chunks
            async for chunk in ai_service.generate_multi_card_interpretation_stream(
                cards=ordered_cards,
                character_voice=request.character_voice,
                question=request.question,
                karma=request.karma_alignment,
                faction=request.faction_alignment,
                spread_type=request.spread_type
            ):
                # Format as SSE
                yield f"data: {chunk}\n\n"

            # Send completion signal
            yield "data: [DONE]\n\n"

        except Exception as e:
            logger.error(f"Error during multi-card streaming: {e}", exc_info=True)
            yield f"data: [ERROR] {str(e)}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )