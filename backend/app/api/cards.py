"""
Wasteland Cards API endpoints
Enhanced with user authentication support
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.wasteland_card_service import WastelandCardService
from app.core.dependencies import get_current_user, get_optional_user
from app.models.user import User
from app.models.wasteland_card import (
    WastelandCard,
    WastelandSuit,
    KarmaAlignment,
    CharacterVoice,
    FactionAlignment,
)
from app.core.exceptions import (
    InsufficientPermissionsError,
    ReadingLimitExceededError
)

router = APIRouter(prefix="/cards", tags=["cards"])


@router.get(
    "/",
    response_model=List[dict],
    summary="取得所有卡牌",
    description="取得完整的廢土塔羅牌組（78 張卡牌）",
    response_description="所有廢土塔羅卡牌的清單"
)
async def get_all_cards(db: AsyncSession = Depends(get_db)):
    """取得所有廢土卡牌"""
    service = WastelandCardService(db)
    cards = await service.get_all_cards()
    return [card.to_dict() for card in cards]


@router.get(
    "/{card_id}",
    response_model=dict,
    summary="依 ID 取得卡牌",
    description="依卡牌 ID 取得特定卡牌的詳細資訊",
    response_description="卡牌詳細資料",
    responses={
        200: {"description": "成功取得卡牌"},
        404: {"description": "找不到卡牌"}
    }
)
async def get_card_by_id(card_id: str, db: AsyncSession = Depends(get_db)):
    """依 ID 取得特定卡牌"""
    service = WastelandCardService(db)
    card = await service.get_card_by_id(card_id)
    if not card:
        raise HTTPException(status_code=404, detail="在廢土中找不到此卡牌")
    return card.to_dict()


@router.get(
    "/suit/{suit}",
    response_model=List[dict],
    summary="依花色取得卡牌",
    description="依指定花色篩選卡牌（大阿爾克那、核子可樂瓶、戰鬥武器、瓶蓋、輻射棒）",
    response_description="指定花色的所有卡牌"
)
async def get_cards_by_suit(suit: WastelandSuit, db: AsyncSession = Depends(get_db)):
    """依花色篩選卡牌"""
    service = WastelandCardService(db)
    cards = await service.filter_cards_by_suit(suit)
    return [card.to_dict() for card in cards]


@router.get(
    "/radiation/filter",
    response_model=List[dict],
    summary="依輻射等級篩選卡牌",
    description="依輻射等級範圍篩選卡牌（0.0 到 1.0）",
    response_description="符合輻射等級範圍的卡牌清單"
)
async def filter_cards_by_radiation(
    min_radiation: float = Query(0.0, ge=0.0, le=1.0, description="最低輻射等級"),
    max_radiation: float = Query(1.0, ge=0.0, le=1.0, description="最高輻射等級"),
    db: AsyncSession = Depends(get_db)
):
    """依輻射等級範圍篩選卡牌"""
    service = WastelandCardService(db)
    cards = await service.filter_cards_by_radiation_level(min_radiation, max_radiation)
    return [card.to_dict() for card in cards]


@router.get(
    "/search/fallout",
    response_model=List[dict],
    summary="搜尋 Fallout 元素",
    description="依 Fallout 遊戲特定元素搜尋卡牌（避難所、派系、角色等）",
    response_description="符合搜尋條件的卡牌清單"
)
async def search_fallout_elements(
    q: str = Query(..., min_length=1, description="搜尋關鍵字"),
    db: AsyncSession = Depends(get_db)
):
    """依 Fallout 特定元素搜尋卡牌"""
    service = WastelandCardService(db)
    cards = await service.search_by_fallout_elements(q)
    return [card.to_dict() for card in cards]


@router.get(
    "/threat/{min_threat}",
    response_model=List[dict],
    summary="依威脅等級取得卡牌",
    description="依威脅等級範圍取得卡牌（1 到 10）",
    response_description="符合威脅等級範圍的卡牌清單"
)
async def get_cards_by_threat_level(
    min_threat: int,
    max_threat: int = Query(10, ge=1, le=10, description="最高威脅等級"),
    db: AsyncSession = Depends(get_db)
):
    """依威脅等級範圍取得卡牌"""
    service = WastelandCardService(db)
    cards = await service.get_cards_by_threat_level(min_threat, max_threat)
    return [card.to_dict() for card in cards]


@router.get(
    "/major-arcana/",
    response_model=List[dict],
    summary="取得大阿爾克那卡牌",
    description="取得所有大阿爾克那（Major Arcana）卡牌（22 張主要牌）",
    response_description="所有大阿爾克那卡牌"
)
async def get_major_arcana(db: AsyncSession = Depends(get_db)):
    """取得所有大阿爾克那卡牌"""
    service = WastelandCardService(db)
    cards = await service.get_major_arcana_cards()
    return [card.to_dict() for card in cards]


@router.get(
    "/court-cards/",
    response_model=List[dict],
    summary="取得宮廷牌",
    description="取得所有宮廷牌（Court Cards）",
    response_description="所有宮廷牌"
)
async def get_court_cards(db: AsyncSession = Depends(get_db)):
    """取得所有宮廷牌"""
    service = WastelandCardService(db)
    cards = await service.get_court_cards()
    return [card.to_dict() for card in cards]


@router.post(
    "/draw",
    response_model=Dict[str, Any],
    summary="抽取卡牌",
    description="""
    使用輻射影響洗牌演算法抽取卡牌（需要認證）

    - **輻射因子**：影響隨機性的環境輻射值（0.0 到 1.0）
    - **業力影響**：使用者的業力對齊會影響卡牌選擇
    - **派系偏好**：派系陣營會影響抽牌概率
    """,
    response_description="抽取的卡牌及使用者資訊",
    responses={
        200: {"description": "成功抽取卡牌"},
        403: {"description": "權限不足"},
        429: {"description": "超過占卜次數限制"}
    }
)
async def draw_cards(
    num_cards: int = Query(1, ge=1, le=10, description="要抽取的卡牌數量"),
    radiation_factor: float = Query(0.5, ge=0.0, le=1.0, description="輻射影響因子"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """使用輻射影響洗牌抽取卡牌（需要認證）"""
    service = WastelandCardService(db)

    try:
        cards = await service.draw_cards_with_radiation_shuffle(
            num_cards=num_cards,
            radiation_factor=radiation_factor,
            user_id=current_user.id
        )

        return {
            "cards": [card.to_dict() for card in cards],
            "user_karma": current_user.karma_alignment().value,
            "user_faction": current_user.faction_alignment,
            "radiation_factor_used": radiation_factor,
            "message": f"為 {current_user.display_name} 抽取了 {len(cards)} 張卡牌"
        }
    except (InsufficientPermissionsError, ReadingLimitExceededError) as e:
        raise HTTPException(
            status_code=429 if "limit" in str(e).lower() else 403,
            detail=str(e)
        )


@router.get(
    "/stats/deck",
    response_model=dict,
    summary="取得牌組統計",
    description="取得完整的牌組統計資訊（花色分佈、輻射等級分佈、威脅等級分佈等）",
    response_description="牌組統計資料"
)
async def get_deck_statistics(db: AsyncSession = Depends(get_db)):
    """取得完整的牌組統計"""
    service = WastelandCardService(db)
    return await service.calculate_deck_statistics()


@router.get(
    "/stats/most-drawn",
    response_model=List[dict],
    summary="取得最常抽取的卡牌",
    description="取得最常被抽取的卡牌清單，並依抽取次數排序",
    response_description="最常抽取的卡牌清單"
)
async def get_most_drawn_cards(
    limit: int = Query(10, ge=1, le=50, description="回傳數量限制"),
    db: AsyncSession = Depends(get_db)
):
    """取得最常被抽取的卡牌"""
    service = WastelandCardService(db)
    cards = await service.get_most_drawn_cards(limit)
    return [card.to_dict() for card in cards]


@router.get(
    "/{card_id}/interpretation/karma/{karma}",
    response_model=dict,
    summary="取得業力對齊解讀",
    description="依業力對齊（Karma Alignment）取得卡牌解讀",
    response_description="基於業力對齊的卡牌解讀",
    responses={
        200: {"description": "成功取得解讀"},
        404: {"description": "找不到卡牌"}
    }
)
async def get_karma_interpretation(
    card_id: str,
    karma: KarmaAlignment,
    db: AsyncSession = Depends(get_db)
):
    """依業力對齊取得卡牌解讀"""
    service = WastelandCardService(db)
    card = await service.get_card_by_id(card_id)
    if not card:
        raise HTTPException(status_code=404, detail="在廢土中找不到此卡牌")

    interpretation = service.get_karma_interpretation(card, karma)
    return {
        "card_id": card_id,
        "karma": karma.value,
        "interpretation": interpretation
    }


@router.get(
    "/{card_id}/interpretation/voice/{voice}",
    response_model=dict,
    summary="取得角色聲音解讀",
    description="以特定 Fallout 角色的聲音風格取得卡牌解讀（Pip-Boy、Codsworth、廢土商人等）",
    response_description="特定角色聲音風格的卡牌解讀",
    responses={
        200: {"description": "成功取得解讀"},
        404: {"description": "找不到卡牌"}
    }
)
async def get_character_voice_interpretation(
    card_id: str,
    voice: CharacterVoice,
    db: AsyncSession = Depends(get_db)
):
    """以特定角色聲音取得卡牌解讀"""
    service = WastelandCardService(db)
    card = await service.get_card_by_id(card_id)
    if not card:
        raise HTTPException(status_code=404, detail="在廢土中找不到此卡牌")

    interpretation = service.get_character_voice_interpretation(card, voice)
    return {
        "card_id": card_id,
        "voice": voice.value,
        "interpretation": interpretation
    }


@router.get(
    "/{card_id}/significance/faction/{faction}",
    response_model=dict,
    summary="取得派系意義",
    description="取得卡牌對特定派系的意義（鋼鐵兄弟會、新加州共和國、凱撒軍團等）",
    response_description="卡牌對特定派系的意義",
    responses={
        200: {"description": "成功取得派系意義"},
        404: {"description": "找不到卡牌"}
    }
)
async def get_faction_significance(
    card_id: str,
    faction: FactionAlignment,
    db: AsyncSession = Depends(get_db)
):
    """取得卡牌對特定派系的意義"""
    service = WastelandCardService(db)
    card = await service.get_card_by_id(card_id)
    if not card:
        raise HTTPException(status_code=404, detail="在廢土中找不到此卡牌")

    significance = service.get_faction_significance(card, faction)
    return {
        "card_id": card_id,
        "faction": faction.value,
        "significance": significance
    }


# User-specific endpoints (require authentication)

@router.get(
    "/personalized/recommendations",
    response_model=List[dict],
    summary="取得個人化推薦卡牌",
    description="依使用者的業力、派系和歷史記錄取得個人化卡牌推薦",
    response_description="個人化推薦的卡牌清單"
)
async def get_personalized_cards(
    limit: int = Query(10, ge=1, le=20, description="推薦卡牌數量"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得使用者的個人化卡牌推薦"""
    service = WastelandCardService(db)
    cards = await service.get_personalized_cards_for_user(current_user.id, limit)
    return [card.to_dict() for card in cards]


@router.get(
    "/user/history",
    response_model=Dict[str, Any],
    summary="取得使用者抽牌歷史",
    description="取得使用者的抽牌歷史記錄和偏好設定",
    response_description="使用者抽牌歷史與偏好資料"
)
async def get_user_card_history(
    limit: int = Query(20, ge=1, le=50, description="歷史記錄數量限制"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得使用者的抽牌歷史和偏好"""
    service = WastelandCardService(db)
    history = await service.get_user_card_history(current_user.id, limit)
    return history


@router.get(
    "/user/karma-interpretation/{card_id}",
    response_model=dict,
    summary="取得使用者業力解讀",
    description="依目前使用者的業力對齊取得卡牌解讀",
    response_description="基於使用者業力的卡牌解讀",
    responses={
        200: {"description": "成功取得解讀"},
        404: {"description": "找不到卡牌"}
    }
)
async def get_user_karma_interpretation(
    card_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """依目前使用者的業力對齊取得卡牌解讀"""
    service = WastelandCardService(db)
    card = await service.get_card_by_id(card_id)
    if not card:
        raise HTTPException(status_code=404, detail="在廢土中找不到此卡牌")

    karma = current_user.karma_alignment()
    interpretation = service.get_karma_interpretation(card, karma)
    return {
        "card_id": card_id,
        "user_karma": karma.value,
        "interpretation": interpretation,
        "karma_score": current_user.karma_score
    }


@router.get(
    "/user/faction-significance/{card_id}",
    response_model=dict,
    summary="取得使用者派系意義",
    description="取得卡牌對目前使用者派系的意義",
    response_description="卡牌對使用者派系的意義",
    responses={
        200: {"description": "成功取得派系意義"},
        400: {"description": "使用者未設定派系陣營"},
        404: {"description": "找不到卡牌"}
    }
)
async def get_user_faction_significance(
    card_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取得卡牌對目前使用者派系的意義"""
    service = WastelandCardService(db)
    card = await service.get_card_by_id(card_id)
    if not card:
        raise HTTPException(status_code=404, detail="在廢土中找不到此卡牌")

    if not current_user.faction_alignment:
        raise HTTPException(status_code=400, detail="使用者未設定派系陣營")

    faction = FactionAlignment(current_user.faction_alignment)
    significance = service.get_faction_significance(card, faction)
    return {
        "card_id": card_id,
        "user_faction": faction.value,
        "significance": significance
    }