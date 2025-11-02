"""
Cards API endpoints for Wasteland Tarot
Comprehensive card management with rich documentation and examples
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
import random
import logging

from app.db.session import get_db
from app.models.user import User
from app.models.wasteland_card import WastelandCard as WastelandCardModel
from app.schemas.cards import (
    WastelandCard,
    WastelandCardWithStory,
    CardCreate,
    CardUpdate,
    CardSearchParams,
    CardListResponse,
    RandomCardParams,
    CardInterpretationRequest,
    CardInterpretationResponse,
    WastelandSuit,
    KarmaAlignment,
    CharacterVoice,
    FactionAlignment
)
from app.schemas.story import StoryUpdateRequest
from app.core.dependencies import get_current_active_user, get_supabase_client
from app.core.exceptions import CardNotFoundError, RadiationOverloadError
from app.services.wasteland_card_service import WastelandCardService
from app.services.story_audio_service import StoryAudioService
from app.services.tts_service import get_tts_service
from app.services.audio_storage_service import get_audio_storage_service
from supabase import Client

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================
# 🔵 Refactor: 共用輔助函式
# ============================================================

def build_story_dict(card_data: WastelandCardModel) -> Optional[Dict[str, Any]]:
    """
    從 WastelandCard model 構建 Story 字典

    Args:
        card_data: WastelandCard ORM 物件

    Returns:
        Story 字典，如果沒有故事資料則返回 None
    """
    if not card_data.story_background:
        return None

    return {
        "background": card_data.story_background,
        "character": card_data.story_character,
        "location": card_data.story_location,
        "timeline": card_data.story_timeline,
        "factions_involved": card_data.story_faction_involved or [],  # 確保永遠是 list
        "related_quest": card_data.story_related_quest
    }


@router.get(
    "",
    response_model=CardListResponse,
    summary="取得所有卡牌",
    description="""
    **取得完整的廢土塔羅牌組並支援篩選與分頁**

    取得完整的 78 張廢土塔羅牌組，並提供強大的篩選選項：

    - **分頁**：控制每頁大小和導覽
    - **花色篩選**：依大阿爾克那或特定小阿爾克那花色篩選
    - **業力對齊**：尋找與特定業力等級相容的卡牌
    - **輻射等級**：依環境輻射需求篩選
    - **威脅等級**：依危險度/難度評級篩選
    - **搜尋**：在卡牌名稱和含義中進行全文搜尋

    適用於：
    - 建立卡牌選擇介面
    - 建立篩選後的牌組檢視
    - 實作卡牌瀏覽器
    - 研究與分析工具
    """,
    response_description="已套用篩選的廢土塔羅卡牌分頁清單",
    responses={
        200: {
            "description": "成功取得卡牌",
            "content": {
                "application/json": {
                    "example": {
                        "cards": [
                            {
                                "id": "wanderer-001",
                                "name": "The Wanderer",
                                "suit": "major_arcana",
                                "number": 0,
                                "upright_meaning": "New beginnings in the wasteland",
                                "radiation_level": 0.3,
                                "is_major_arcana": True
                            }
                        ],
                        "total_count": 78,
                        "page": 1,
                        "page_size": 20,
                        "has_more": True
                    }
                }
            }
        },
        422: {"description": "無效的篩選參數"},
        500: {"description": "伺服器內部錯誤"}
    }
)
async def get_cards(
    page: int = Query(default=1, ge=1, description="頁碼（從 1 開始）"),
    page_size: int = Query(default=20, ge=1, le=100, description="每頁卡牌數量"),
    suit: Optional[WastelandSuit] = Query(None, description="依花色篩選"),
    karma_alignment: Optional[KarmaAlignment] = Query(None, description="依業力相容性篩選"),
    faction: Optional[FactionAlignment] = Query(None, description="依派系陣營篩選"),
    min_radiation: Optional[float] = Query(None, ge=0.0, le=1.0, description="最低輻射等級"),
    max_radiation: Optional[float] = Query(None, ge=0.0, le=1.0, description="最高輻射等級"),
    min_threat: Optional[int] = Query(None, ge=1, le=10, description="最低威脅等級"),
    max_threat: Optional[int] = Query(None, ge=1, le=10, description="最高威脅等級"),
    search: Optional[str] = Query(None, min_length=1, description="在卡牌名稱和含義中搜尋"),
    sort_by: str = Query(default="name", description="排序欄位：name、suit、radiation_level、threat_level"),
    sort_order: str = Query(default="asc", regex="^(asc|desc)$", description="排序順序"),
    include_story: bool = Query(default=False, description="包含完整故事內容（Story Mode）"),
    db: AsyncSession = Depends(get_db)
) -> CardListResponse:
    """
    取得完整的廢土塔羅牌組並支援進階篩選。

    此端點提供廢土塔羅牌組中所有 78 張卡牌的存取權限，
    並提供精密的篩選選項來建立自訂介面和專業的卡牌選擇工具。

    **Story Mode (Wasteland Story Mode)**:
    - 使用 `include_story=true` 參數取得所有卡牌的完整故事內容
    - 注意：批次查詢時建議保持 `include_story=false` 以優化性能
    - 對於需要故事的場景，建議先取得卡牌列表，再個別查詢故事
    """
    try:
        # Build base query
        query = select(WastelandCardModel)
        count_query = select(func.count(WastelandCardModel.id))

        # Apply filters
        conditions = []

        if suit:
            conditions.append(WastelandCardModel.suit == suit.value)

        if min_radiation is not None:
            conditions.append(WastelandCardModel.radiation_level >= min_radiation)

        if max_radiation is not None:
            conditions.append(WastelandCardModel.radiation_level <= max_radiation)

        if min_threat is not None:
            conditions.append(WastelandCardModel.threat_level >= min_threat)

        if max_threat is not None:
            conditions.append(WastelandCardModel.threat_level <= max_threat)

        if search:
            search_condition = or_(
                WastelandCardModel.name.ilike(f"%{search}%"),
                WastelandCardModel.upright_meaning.ilike(f"%{search}%"),
                WastelandCardModel.reversed_meaning.ilike(f"%{search}%")
            )
            conditions.append(search_condition)

        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))

        # Apply sorting
        sort_column = getattr(WastelandCardModel, sort_by, WastelandCardModel.name)
        if sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Get total count
        total_count_result = await db.execute(count_query)
        total_count = total_count_result.scalar()

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        # Execute query
        result = await db.execute(query)
        cards_data = result.scalars().all()

        # Convert to Pydantic models
        cards = []
        for card_data in cards_data:
            card_dict = card_data.to_dict()

            # 根據 include_story 決定是否包含故事資料
            if include_story:
                # 使用共用函式構建 Story 物件
                card_dict["story"] = build_story_dict(card_data)
                cards.append(WastelandCardWithStory(**card_dict))
            else:
                # 預設不包含故事（性能優化）
                cards.append(WastelandCard(**card_dict))

        has_more = (offset + len(cards)) < total_count

        return CardListResponse(
            cards=cards,
            total_count=total_count,
            page=page,
            page_size=page_size,
            has_more=has_more
        )

    except Exception as e:
        logger.error(f"Error retrieving cards: {str(e)}")
        raise HTTPException(status_code=500, detail="取得卡牌失敗")


async def _draw_cards_impl(
    count: int = Query(default=1, ge=1, le=10, description="要抽取的卡牌數量"),
    suit: Optional[WastelandSuit] = Query(None, description="指定花色（僅從此花色抽牌）"),
    exclude_major_arcana: bool = Query(default=False, description="排除大阿爾克那卡牌"),
    allow_duplicates: bool = Query(default=False, description="允許多張抽牌中出現重複卡牌"),
    db: AsyncSession = Depends(get_db)
) -> List[WastelandCard]:
    """
    使用完全客觀的隨機演算法抽取卡牌。

    不受任何使用者數據（業力、派系等）影響，
    確保每張卡牌被抽到的機率完全相同。

    支援從特定花色抽牌，適用於專門的占卜類型。

    未來可擴展為 POST 端點以記錄抽牌歷史。
    """
    try:
        # Build base query
        query = select(WastelandCardModel)

        # Apply filters
        conditions = []

        # Suit filter (inclusion - only cards from this suit)
        if suit:
            conditions.append(WastelandCardModel.suit == suit.value)

        # Exclusion filter (cannot use with suit parameter)
        if exclude_major_arcana:
            if suit and suit.value == "major_arcana":
                raise HTTPException(
                    status_code=422,
                    detail="無法同時指定 suit=major_arcana 和 exclude_major_arcana=true"
                )
            conditions.append(WastelandCardModel.suit != "major_arcana")

        if conditions:
            query = query.where(and_(*conditions))

        # Get available cards
        result = await db.execute(query)
        available_cards = list(result.scalars().all())

        if len(available_cards) < count and not allow_duplicates:
            raise HTTPException(
                status_code=422,
                detail=f"沒有足夠的唯一卡牌。需要：{count}，可用：{len(available_cards)}"
            )

        # Pure random selection using random.sample (Fisher-Yates internally)
        if allow_duplicates:
            # Random choice with replacement
            selected_cards = random.choices(available_cards, k=count)
        else:
            # Random sample without replacement
            selected_cards = random.sample(available_cards, k=count)

        # Update statistics
        for card in selected_cards:
            card.draw_frequency += 1
            card.total_appearances += 1

        # Commit statistics updates
        await db.commit()

        # Convert to Pydantic models
        result_cards = [WastelandCard(**card.to_dict()) for card in selected_cards]

        return result_cards

    except Exception as e:
        logger.error(f"Error drawing cards: {str(e)}")
        raise HTTPException(status_code=500, detail="抽取隨機卡牌失敗")


# Main endpoint with full path (RESTful resource naming)
@router.get(
    "/draws",
    response_model=List[WastelandCard],
    summary="抽取隨機卡牌",
    description="""
    **從廢土塔羅牌組中抽取隨機卡牌**

    此端點代表「抽牌結果」資源，符合 RESTful 設計原則。

    使用完全客觀的隨機演算法抽取卡牌：

    - **純隨機抽取**：不受任何使用者數據影響
    - **Fisher-Yates 洗牌**：使用標準演算法確保均勻分布
    - **花色篩選**：可指定只從特定花色抽取（如 major_arcana、nuka_cola_bottles）
    - **排除篩選**：可選擇排除大阿爾克那
    - **多張卡牌**：一次最多抽取 10 張卡牌

    注意：業力、派系等參數僅用於 AI 解牌時的風格調整，
    不影響卡牌抽取的隨機性。

    **未來擴展計畫**：
    - POST /api/v1/cards/draws - 創建並記錄抽牌（含用戶問題、session）
    - GET /api/v1/cards/draws/{id} - 查詢歷史抽牌記錄
    - GET /api/v1/cards/draws?user_id={id} - 查詢用戶抽牌歷史
    - DELETE /api/v1/cards/draws/{id} - 刪除抽牌記錄
    """,
    response_description="隨機選擇的卡牌清單",
    responses={
        200: {
            "description": "成功抽取卡牌",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": "7bc189ee-b2f9-4ed0-85ee-83183e337923",
                            "name": "可樂瓶六",
                            "suit": "nuka_cola_bottles",
                            "number": 6,
                            "upright_meaning": "情感和諧與滿足",
                            "radiation_level": 0.5,
                            "is_major_arcana": False
                        }
                    ]
                }
            }
        },
        422: {"description": "沒有足夠的卡牌可供抽取"},
        500: {"description": "伺服器內部錯誤"}
    }
)
async def draw_cards_plural(
    count: int = Query(default=1, ge=1, le=10, description="要抽取的卡牌數量"),
    suit: Optional[WastelandSuit] = Query(None, description="指定花色（僅從此花色抽牌）"),
    exclude_major_arcana: bool = Query(default=False, description="排除大阿爾克那卡牌"),
    allow_duplicates: bool = Query(default=False, description="允許多張抽牌中出現重複卡牌"),
    db: AsyncSession = Depends(get_db)
) -> List[WastelandCard]:
    """RESTful endpoint for drawing cards (plural resource)."""
    return await _draw_cards_impl(count, suit, exclude_major_arcana, allow_duplicates, db)


# Backwards compatibility alias (singular)
@router.get(
    "/draw",
    response_model=List[WastelandCard],
    summary="抽取隨機卡牌（別名）",
    description="""
    **向後相容的別名端點**

    此端點與 `/draws` 完全相同，僅為保持向後相容性而保留。
    建議新程式碼使用 `/draws` 端點。
    """,
    response_description="隨機選擇的卡牌清單",
    include_in_schema=False  # Hide from Swagger to avoid confusion
)
async def draw_cards_singular(
    count: int = Query(default=1, ge=1, le=10, description="要抽取的卡牌數量"),
    suit: Optional[WastelandSuit] = Query(None, description="指定花色（僅從此花色抽牌）"),
    exclude_major_arcana: bool = Query(default=False, description="排除大阿爾克那卡牌"),
    allow_duplicates: bool = Query(default=False, description="允許多張抽牌中出現重複卡牌"),
    db: AsyncSession = Depends(get_db)
) -> List[WastelandCard]:
    """Backwards compatibility alias for draw_cards."""
    return await _draw_cards_impl(count, suit, exclude_major_arcana, allow_duplicates, db)


@router.get(
    "/{card_id}",
    response_model=WastelandCard,
    summary="取得單一卡牌",
    description="""
    **取得特定廢土塔羅卡牌的詳細資訊**

    取得完整的卡牌詳細資料，包含：

    - **基本資訊**：名稱、花色、編號、含義
    - **Fallout 元素**：輻射等級、威脅等級、避難所關聯
    - **角色解讀**：所有角色聲音觀點
    - **派系意義**：不同派系的含義
    - **視覺元素**：圖片 URL 和音效提示
    - **統計資料**：使用數據和人氣指標
    - **風味內容**：廢土幽默和彩蛋

    適用於：
    - 卡牌詳細頁面
    - 占卜介面
    - 參考查詢
    - 角色聲音比較
    """,
    response_description="包含所有屬性和解讀的完整卡牌資訊",
    responses={
        200: {"description": "成功取得卡牌詳細資料"},
        404: {"description": "在廢土牌組中找不到卡牌"},
        500: {"description": "伺服器內部錯誤"}
    }
)
async def get_card(
    card_id: str = Path(..., description="唯一卡牌識別碼 (UUID)", example="550e8400-e29b-41d4-a716-446655440000"),
    include_stats: bool = Query(default=True, description="包含使用統計"),
    include_interpretations: bool = Query(default=True, description="包含角色解讀"),
    include_story: bool = Query(default=False, description="包含完整故事內容（Story Mode）"),
    db: AsyncSession = Depends(get_db),
    supabase: Client = Depends(get_supabase_client)
):
    """
    取得特定卡牌的詳細資訊。

    回傳完整的卡牌資料，包含所有角色聲音解讀、
    派系意義和使用統計。

    **Story Mode (Wasteland Story Mode)**:
    - 使用 `include_story=true` 參數取得完整故事內容
    - 包含 background, character, location, timeline, factions, quest 等故事欄位
    - 自動載入故事音檔 URL（如果有生成）
    - 回應包含 Cache-Control 和 ETag headers 以優化性能
    """
    try:
        # Query for the specific card by UUID
        query = select(WastelandCardModel).where(WastelandCardModel.id == card_id)
        result = await db.execute(query)
        card_data = result.scalar_one_or_none()

        if not card_data:
            raise CardNotFoundError(card_id)

        # Convert to dictionary and create Pydantic model
        card_dict = card_data.to_dict()

        # Optionally exclude certain fields
        if not include_stats:
            card_dict.pop('stats', None)
            card_dict.pop('draw_frequency', None)
            card_dict.pop('total_appearances', None)

        if not include_interpretations:
            card_dict.pop('character_voices', None)
            card_dict.pop('faction_meanings', None)

        # Update view count
        card_data.total_appearances += 1
        await db.commit()

        # 根據 include_story 決定返回的 schema
        if include_story:
            # 使用共用函式構建 Story 物件
            card_dict["story"] = build_story_dict(card_data)

            # 整合音檔 URL（Task 8.5）
            try:
                # 建立 StoryAudioService
                tts_service = get_tts_service()
                storage_service = get_audio_storage_service(supabase)
                story_audio_service = StoryAudioService(db, tts_service, storage_service, supabase)

                # 取得音檔 URL
                audio_urls = await story_audio_service.get_story_audio_urls(card_data.id)
                card_dict["audio_urls"] = audio_urls if audio_urls else None

            except Exception as e:
                logger.warning(f"Failed to load audio URLs for card {card_id}: {e}")
                # 不阻擋回應，只是沒有音檔
                card_dict["audio_urls"] = None

            # 使用 WastelandCardWithStory schema
            response_data = WastelandCardWithStory(**card_dict)

            # 設定快取 headers (使用 card_dict 避免 lazy loading 問題)
            headers = {
                "Cache-Control": "public, max-age=3600",
                "ETag": f'"{card_id}-{card_dict.get("updated_at", "v1")}"'
            }

            return JSONResponse(
                content=response_data.model_dump(mode='json'),
                headers=headers
            )
        else:
            # 預設不包含故事（性能優化）
            return WastelandCard(**card_dict)

    except CardNotFoundError:
        raise
    except Exception as e:
        logger.error(f"Error retrieving card {card_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"取得卡牌失敗: {str(e)}")


@router.get(
    "/search/advanced",
    response_model=CardListResponse,
    summary="進階卡牌搜尋",
    description="""
    **使用多重條件和智慧比對進行進階搜尋**

    在廢土塔羅牌組中執行精密搜尋：

    - **多欄位搜尋**：在名稱、含義和風味文字中搜尋
    - **業力相容性**：尋找與特定對齊相容的卡牌
    - **派系共鳴**：與特定派系產生共鳴的卡牌
    - **輻射容忍度**：依環境需求篩選
    - **角色聲音親和力**：與特定聲音搭配良好的卡牌
    - **遊戲機制**：依 S.P.E.C.I.A.L. 屬性效果篩選

    使用智慧比對演算法依相關性排序結果。
    """,
    response_description="依相關性評分排序的搜尋結果"
)
async def advanced_search(
    search_params: CardSearchParams = Body(
        ...,
        example={
            "query": "new beginning",
            "karma_alignment": "neutral",
            "faction": "vault_dweller",
            "min_radiation": 0.0,
            "max_radiation": 0.5,
            "min_threat": 1,
            "max_threat": 5
        }
    ),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
) -> CardListResponse:
    """
    使用多重條件執行進階搜尋。

    實作基於多重比對因素的智慧相關性排序。
    """
    try:
        # Build complex query based on search parameters
        query = select(WastelandCardModel)
        conditions = []

        # Text search with relevance scoring
        if search_params.query:
            search_term = f"%{search_params.query}%"
            text_conditions = or_(
                WastelandCardModel.name.ilike(search_term),
                WastelandCardModel.upright_meaning.ilike(search_term),
                WastelandCardModel.reversed_meaning.ilike(search_term),
                WastelandCardModel.wasteland_humor.ilike(search_term)
            )
            conditions.append(text_conditions)

        # Apply all other filters from the search params
        if search_params.suit:
            conditions.append(WastelandCardModel.suit == search_params.suit.value)

        if search_params.min_radiation is not None:
            conditions.append(WastelandCardModel.radiation_level >= search_params.min_radiation)

        if search_params.max_radiation is not None:
            conditions.append(WastelandCardModel.radiation_level <= search_params.max_radiation)

        if search_params.min_threat is not None:
            conditions.append(WastelandCardModel.threat_level >= search_params.min_threat)

        if search_params.max_threat is not None:
            conditions.append(WastelandCardModel.threat_level <= search_params.max_threat)

        # Apply conditions
        if conditions:
            query = query.where(and_(*conditions))

        # Get total count
        count_query = select(func.count(WastelandCardModel.id))
        if conditions:
            count_query = count_query.where(and_(*conditions))

        total_result = await db.execute(count_query)
        total_count = total_result.scalar()

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        # Execute query
        result = await db.execute(query)
        cards_data = result.scalars().all()

        # Convert to Pydantic models
        cards = [WastelandCard(**card_data.to_dict()) for card_data in cards_data]

        has_more = (offset + len(cards)) < total_count

        return CardListResponse(
            cards=cards,
            total_count=total_count,
            page=page,
            page_size=page_size,
            has_more=has_more
        )

    except Exception as e:
        logger.error(f"Error in advanced search: {str(e)}")
        raise HTTPException(status_code=500, detail="進階搜尋失敗")


@router.post(
    "/{card_id}/interpret",
    response_model=CardInterpretationResponse,
    summary="Get Character Interpretation",
    description="""
    **Get character-specific interpretation for a card**

    Request a detailed interpretation from a specific Fallout character:

    - **Character Voices**: Pip-Boy, Vault Dweller, Wasteland Trader, etc.
    - **Contextual Analysis**: Interpretation considers karma and situation
    - **Position Awareness**: Different meanings based on spread position
    - **Confidence Rating**: AI confidence in the interpretation quality
    - **Radiation Influence**: Environmental factors affect interpretation

    Each character provides unique perspectives based on their personality,
    expertise, and speaking patterns from the Fallout universe.
    """,
    response_description="Character-specific interpretation with confidence metrics"
)
async def get_card_interpretation(
    card_id: str = Path(..., description="Card to interpret"),
    interpretation_request: CardInterpretationRequest = Body(
        ...,
        example={
            "character_voice": "pip_boy",
            "karma_context": "neutral",
            "question_context": "What should I focus on this week?",
            "position_in_spread": "Present"
        }
    ),
    db: AsyncSession = Depends(get_db)
) -> CardInterpretationResponse:
    """
    Get character-specific interpretation for a card.

    Provides detailed interpretation from the perspective of a specific
    Fallout character, considering context and user situation.
    """
    try:
        # Get the card
        query = select(WastelandCardModel).where(WastelandCardModel.id == card_id)
        result = await db.execute(query)
        card_data = result.scalar_one_or_none()

        if not card_data:
            raise CardNotFoundError(card_id)

        # Generate character-specific interpretation
        interpretation = card_data.get_character_voice_interpretation(
            interpretation_request.character_voice
        )

        # If no specific interpretation exists, use base meaning with character flavor
        if not interpretation:
            base_meaning = card_data.upright_meaning
            character = interpretation_request.character_voice

            # Add character-specific flavor
            if character == CharacterVoice.PIP_BOY:
                interpretation = f"Data analysis indicates: {base_meaning}. Probability calculations suggest this represents significant variables in your current situation."
            elif character == CharacterVoice.SUPER_MUTANT:
                interpretation = f"CARD MEANS: {base_meaning.upper()}. SIMPLE BUT IMPORTANT."
            elif character == CharacterVoice.CODSWORTH:
                interpretation = f"I do believe, sir/madam, that this card suggests: {base_meaning}. Quite fascinating, if I may say so."
            else:
                interpretation = base_meaning

        # Calculate confidence based on various factors
        confidence = 0.8
        if hasattr(card_data, f"{interpretation_request.character_voice.value}_analysis"):
            confidence = 0.95
        if interpretation_request.karma_context:
            confidence += 0.05
        if interpretation_request.position_in_spread:
            confidence += 0.05

        confidence = min(confidence, 1.0)

        # Calculate radiation influence
        radiation_influence = card_data.radiation_level * random.uniform(0.8, 1.2)

        return CardInterpretationResponse(
            card_id=card_id,
            character_voice=interpretation_request.character_voice,
            interpretation=interpretation,
            context_applied=bool(interpretation_request.karma_context or interpretation_request.position_in_spread),
            confidence=confidence,
            radiation_influence=radiation_influence
        )

    except CardNotFoundError:
        raise
    except Exception as e:
        logger.error(f"Error interpreting card {card_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to interpret card")


@router.get(
    "/suits/{suit}",
    response_model=CardListResponse,
    summary="Get Cards by Suit",
    description="""
    **Get all cards from a specific suit**

    Retrieve all cards from one of the five Wasteland Tarot suits:

    - **Major Arcana**: Use 'major' or 'major_arcana' - 22 cards representing major life themes
    - **Nuka-Cola Bottles**: Use 'bottles' or 'nuka_cola_bottles' - emotions, relationships (Cups)
    - **Combat Weapons**: Use 'weapons' or 'combat_weapons' - conflict, intellect (Swords)
    - **Bottle Caps**: Use 'caps' or 'bottle_caps' - material matters, resources (Pentacles)
    - **Radiation Rods**: Use 'rods' or 'radiation_rods' - energy, creativity, action (Wands)

    Accepts both short route names (SEO-friendly) and full API enum values (backwards compatible).
    """,
    response_description="All cards from the specified suit"
)
async def get_cards_by_suit(
    suit: str = Path(..., description="Suit to retrieve (short name or full enum value)"),
    page: int = Query(default=1, ge=1, description="頁碼（從 1 開始）"),
    page_size: int = Query(default=8, ge=1, le=50, description="每頁卡牌數量（預設 8 張）"),
    sort_by: str = Query(default="number", description="Sort by: number, name, radiation_level"),
    sort_order: str = Query(default="asc", regex="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db)
) -> CardListResponse:
    """Get all cards from a specific suit with pagination (8 cards per page by default)."""
    try:
        # Map short route names to full API enum values (for SEO-friendly URLs)
        suit_mapping = {
            'major': 'major_arcana',
            'bottles': 'nuka_cola_bottles',
            'weapons': 'combat_weapons',
            'caps': 'bottle_caps',
            'rods': 'radiation_rods',
        }

        # Convert short name to full enum value if needed (backwards compatible)
        api_suit = suit_mapping.get(suit.lower(), suit)

        # Validate that the suit exists
        valid_suits = [s.value for s in WastelandSuit]
        if api_suit not in valid_suits:
            raise HTTPException(
                status_code=404,
                detail=f"Invalid suit: {suit}. Valid values: {', '.join(list(suit_mapping.keys()) + valid_suits)}"
            )

        # Base query
        query = select(WastelandCardModel).where(WastelandCardModel.suit == api_suit)
        count_query = select(func.count(WastelandCardModel.id)).where(WastelandCardModel.suit == api_suit)

        # Apply sorting
        sort_column = getattr(WastelandCardModel, sort_by, WastelandCardModel.number)
        if sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Get total count
        total_count_result = await db.execute(count_query)
        total_count = total_count_result.scalar()

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        # Execute query
        result = await db.execute(query)
        cards_data = result.scalars().all()

        cards = [WastelandCard(**card.to_dict()) for card in cards_data]

        has_more = (offset + len(cards)) < total_count

        return CardListResponse(
            cards=cards,
            total_count=total_count,
            page=page,
            page_size=page_size,
            has_more=has_more
        )

    except Exception as e:
        logger.error(f"Error retrieving suit {suit}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve suit cards")


# ============================================================
# Wasteland Story Mode Endpoints (Phase: 故事模式擴展)
# ============================================================

@router.post(
    "/{card_id}/story",
    response_model=WastelandCardWithStory,
    summary="更新卡牌故事內容",
    description="""
    **更新指定卡牌的 Wasteland Story Mode 故事內容**

    此端點允許認證使用者更新或新增卡牌的故事內容，包含：
    - **background**: 故事背景（200-500 字）
    - **character**: 主要角色
    - **location**: 故事發生地點
    - **timeline**: 時間線（「戰前」、「戰後」或「YYYY 年」）
    - **factions_involved**: 涉及的陣營列表
    - **related_quest**: 相關任務名稱

    **認證要求**:
    - 需要有效的 JWT token
    - 使用者帳號必須為啟用狀態

    **驗證規則**:
    - 故事背景必須為 200-500 字
    - 時間格式必須符合規範
    - 陣營必須為系統支援的有效陣營

    **部分更新**:
    - 支援只更新部分欄位
    - 未提供的欄位保持原值不變
    """,
    response_description="更新後的卡牌（包含完整故事內容）",
    responses={
        200: {"description": "成功更新故事內容"},
        400: {"description": "驗證失敗（故事內容不符合規範）"},
        401: {"description": "未認證或 token 無效"},
        404: {"description": "卡牌不存在"},
        500: {"description": "伺服器內部錯誤"}
    }
)
async def update_card_story(
    card_id: str = Path(..., description="卡牌 UUID"),
    story_update: StoryUpdateRequest = Body(
        ...,
        example={
            "background": (
                "在2287年的波士頓廢土，一個剛從111號避難所甦醒的倖存者，"
                "睜開眼睛發現世界已經過了210年。他的配偶被殺害，兒子被綁架，"
                "留下他獨自面對這個陌生又危險的新世界。"
                "在這個充滿超級變種人、強盜和輻射屍鬼的廢土中，"
                "他必須找到失蹤的兒子Shaun。Minutemen將軍Preston Garvey告訴他，"
                "有一個神秘的組織叫做Institute，他們擁有先進的科技，可能與綁架案有關。"
                "為了找回唯一的親人，他開始了在波士頓廢土的冒險旅程。"
            ),
            "character": "唯一倖存者 (Sole Survivor)",
            "location": "Vault 111、Sanctuary Hills",
            "timeline": "2287 年",
            "factions_involved": ["minutemen", "railroad", "institute"],
            "related_quest": "Out of Time"
        }
    ),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> WastelandCardWithStory:
    """
    更新卡牌的故事內容。

    需要認證。支援部分更新（只提供需要更新的欄位）。
    """
    try:
        # 建立 WastelandCardService
        card_service = WastelandCardService(db)

        # 將 StoryUpdateRequest 轉換為 dict（只包含非 None 欄位）
        story_data_raw = story_update.model_dump(exclude_none=True)

        # 轉換欄位名稱：API schema 使用 "background"，但 model 使用 "story_background"
        field_mapping = {
            "background": "story_background",
            "character": "story_character",
            "location": "story_location",
            "timeline": "story_timeline",
            "factions_involved": "story_faction_involved",
            "related_quest": "story_related_quest"
        }
        story_data = {
            field_mapping.get(key, key): value
            for key, value in story_data_raw.items()
        }

        # 呼叫 service 層更新故事
        updated_card = await card_service.update_story_content(
            card_id=card_id,
            story_data=story_data
        )

        # 構建故事物件返回（使用共用函式）
        card_dict = updated_card.to_dict()
        card_dict["story"] = build_story_dict(updated_card)
        return WastelandCardWithStory(**card_dict)

    except HTTPException:
        # 直接傳遞 HTTPException（來自 service 層）
        raise
    except CardNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating story for card {card_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="更新故事失敗")