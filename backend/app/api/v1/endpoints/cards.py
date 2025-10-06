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
from app.models.wasteland_card import WastelandCard as WastelandCardModel
from app.schemas.cards import (
    WastelandCard,
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
from app.core.exceptions import CardNotFoundError, RadiationOverloadError

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/",
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
    db: AsyncSession = Depends(get_db)
) -> CardListResponse:
    """
    取得完整的廢土塔羅牌組並支援進階篩選。

    此端點提供廢土塔羅牌組中所有 78 張卡牌的存取權限，
    並提供精密的篩選選項來建立自訂介面和專業的卡牌選擇工具。
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
    card_id: str = Path(..., description="唯一卡牌識別碼", example="wanderer-001"),
    include_stats: bool = Query(default=True, description="包含使用統計"),
    include_interpretations: bool = Query(default=True, description="包含角色解讀"),
    db: AsyncSession = Depends(get_db)
) -> WastelandCard:
    """
    取得特定卡牌的詳細資訊。

    回傳完整的卡牌資料，包含所有角色聲音解讀、
    派系意義和使用統計。
    """
    try:
        # Query for the specific card
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

        return WastelandCard(**card_dict)

    except CardNotFoundError:
        raise
    except Exception as e:
        logger.error(f"Error retrieving card {card_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="取得卡牌失敗")


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


@router.get(
    "/random",
    response_model=List[WastelandCard],
    summary="抽取隨機卡牌",
    description="""
    **從廢土塔羅牌組中抽取隨機卡牌**

    模擬抽取隨機卡牌並受各種影響：

    - **業力影響**：業力對齊影響卡牌選擇概率
    - **派系偏好**：派系陣營偏移卡牌選擇
    - **輻射因子**：環境輻射影響隨機性
    - **排除篩選**：排除大阿爾克那或特定花色
    - **多張卡牌**：一次最多抽取 10 張卡牌

    使用考慮 Fallout 背景設定和使用者情境的精密隨機化，
    提供更沉浸式的占卜體驗。
    """,
    response_description="隨機選擇的卡牌清單"
)
async def get_random_cards(
    count: int = Query(default=1, ge=1, le=10, description="要抽取的卡牌數量"),
    exclude_major_arcana: bool = Query(default=False, description="排除大阿爾克那卡牌"),
    karma_influence: Optional[KarmaAlignment] = Query(None, description="業力對齊影響"),
    faction_preference: Optional[FactionAlignment] = Query(None, description="派系偏好"),
    radiation_factor: float = Query(default=0.5, ge=0.0, le=1.0, description="輻射影響（0-1）"),
    allow_duplicates: bool = Query(default=False, description="允許多張抽牌中出現重複卡牌"),
    db: AsyncSession = Depends(get_db)
) -> List[WastelandCard]:
    """
    使用廢土影響抽取隨機卡牌。

    實作受業力和派系影響的隨機化，
    以選擇更符合主題的卡牌。
    """
    try:
        # Check radiation levels
        if radiation_factor > 0.9:
            raise RadiationOverloadError(radiation_factor)

        # Build base query
        query = select(WastelandCardModel)

        # Apply exclusion filters
        conditions = []
        if exclude_major_arcana:
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

        # Apply influences to card weights
        card_weights = []
        for card in available_cards:
            weight = 1.0

            # Karma influence
            if karma_influence:
                if hasattr(card, f"{karma_influence.value}_karma_interpretation") and \
                   getattr(card, f"{karma_influence.value}_karma_interpretation"):
                    weight *= 1.5

            # Faction influence
            if faction_preference:
                faction_field = f"{faction_preference.value}_significance"
                if hasattr(card, faction_field) and getattr(card, faction_field):
                    weight *= 1.3

            # Radiation influence (adds randomness)
            radiation_modifier = 1.0 + (random.random() - 0.5) * radiation_factor
            weight *= radiation_modifier

            card_weights.append(weight)

        # Select random cards
        selected_cards = []
        remaining_cards = list(zip(available_cards, card_weights))

        for _ in range(count):
            if not remaining_cards:
                break

            # Weighted random selection
            cards, weights = zip(*remaining_cards)
            selected_card = random.choices(cards, weights=weights, k=1)[0]
            selected_cards.append(selected_card)

            # Update statistics
            selected_card.draw_frequency += 1
            selected_card.total_appearances += 1

            # Remove card if no duplicates allowed
            if not allow_duplicates:
                remaining_cards = [(c, w) for c, w in remaining_cards if c != selected_card]

        # Commit statistics updates
        await db.commit()

        # Convert to Pydantic models
        result_cards = [WastelandCard(**card.to_dict()) for card in selected_cards]

        return result_cards

    except RadiationOverloadError:
        raise
    except Exception as e:
        logger.error(f"Error drawing random cards: {str(e)}")
        raise HTTPException(status_code=500, detail="抽取隨機卡牌失敗")


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

    - **Major Arcana**: 22 cards representing major life themes
    - **Nuka-Cola Bottles**: Cups equivalent - emotions, relationships
    - **Combat Weapons**: Swords equivalent - conflict, intellect
    - **Bottle Caps**: Pentacles equivalent - material matters, resources
    - **Radiation Rods**: Wands equivalent - energy, creativity, action

    Perfect for suit-specific studies and themed card collections.
    """,
    response_description="All cards from the specified suit"
)
async def get_cards_by_suit(
    suit: WastelandSuit = Path(..., description="Suit to retrieve"),
    sort_by: str = Query(default="number", description="Sort by: number, name, radiation_level"),
    sort_order: str = Query(default="asc", regex="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db)
) -> CardListResponse:
    """Get all cards from a specific suit."""
    try:
        query = select(WastelandCardModel).where(WastelandCardModel.suit == suit.value)

        # Apply sorting
        sort_column = getattr(WastelandCardModel, sort_by, WastelandCardModel.number)
        if sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        result = await db.execute(query)
        cards_data = result.scalars().all()

        cards = [WastelandCard(**card.to_dict()) for card in cards_data]

        return CardListResponse(
            cards=cards,
            total_count=len(cards),
            page=1,
            page_size=len(cards),
            has_more=False
        )

    except Exception as e:
        logger.error(f"Error retrieving suit {suit}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve suit cards")