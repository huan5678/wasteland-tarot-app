"""
Card Interpretations API Endpoints
卡牌解讀管理 API - 提供完整的 CRUD 操作和批量操作
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
from uuid import UUID

from app.db.session import get_db
from app.models import CardInterpretation, WastelandCard, Character
from app.schemas.character_voice import (
    CardInterpretationCreate,
    CardInterpretationUpdate,
    CardInterpretationResponse,
    CardInterpretationWithDetails,
    BulkInterpretationCreate,
    BulkOperationResponse,
)

router = APIRouter()


@router.get("/", response_model=List[CardInterpretationResponse])
async def get_interpretations(
    card_id: Optional[UUID] = Query(None, description="篩選卡牌 ID"),
    character_id: Optional[UUID] = Query(None, description="篩選角色 ID"),
    is_active: Optional[bool] = Query(None, description="篩選啟用狀態"),
    skip: int = Query(0, ge=0, description="跳過筆數"),
    limit: int = Query(100, ge=1, le=1000, description="限制筆數"),
    db: AsyncSession = Depends(get_db),
):
    """
    取得卡牌解讀列表

    - **card_id**: 篩選特定卡牌（可選）
    - **character_id**: 篩選特定角色（可選）
    - **is_active**: 篩選啟用狀態（可選）
    - **skip**: 分頁跳過筆數
    - **limit**: 分頁限制筆數
    """
    query = select(CardInterpretation)

    # 篩選條件
    if card_id is not None:
        query = query.where(CardInterpretation.card_id == card_id)

    if character_id is not None:
        query = query.where(CardInterpretation.character_id == character_id)

    if is_active is not None:
        query = query.where(CardInterpretation.is_active == is_active)

    # 排序和分頁
    query = query.order_by(CardInterpretation.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    interpretations = result.scalars().all()

    return interpretations


@router.get("/with-details", response_model=List[CardInterpretationWithDetails])
async def get_interpretations_with_details(
    card_id: Optional[UUID] = Query(None, description="篩選卡牌 ID"),
    character_id: Optional[UUID] = Query(None, description="篩選角色 ID"),
    is_active: Optional[bool] = Query(None, description="篩選啟用狀態"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    """
    取得卡牌解讀列表（含詳細資訊）

    包含角色名稱、角色 key 和卡牌名稱
    """
    query = select(CardInterpretation)

    if card_id is not None:
        query = query.where(CardInterpretation.card_id == card_id)

    if character_id is not None:
        query = query.where(CardInterpretation.character_id == character_id)

    if is_active is not None:
        query = query.where(CardInterpretation.is_active == is_active)

    query = query.order_by(CardInterpretation.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    interpretations = result.scalars().all()

    # 為每個解讀載入詳細資訊
    interpretations_with_details = []
    for interp in interpretations:
        # 載入角色資訊
        char_query = select(Character).where(Character.id == interp.character_id)
        char_result = await db.execute(char_query)
        character = char_result.scalar_one_or_none()

        # 載入卡牌資訊
        card_query = select(WastelandCard).where(WastelandCard.id == interp.card_id)
        card_result = await db.execute(card_query)
        card = card_result.scalar_one_or_none()

        interp_dict = interp.to_dict()
        interp_dict["character_name"] = character.name if character else None
        interp_dict["character_key"] = character.key if character else None
        interp_dict["card_name"] = card.name if card else None
        interpretations_with_details.append(interp_dict)

    return interpretations_with_details


@router.get("/{interpretation_id}", response_model=CardInterpretationResponse)
async def get_interpretation(
    interpretation_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    根據 ID 取得單一卡牌解讀
    """
    query = select(CardInterpretation).where(CardInterpretation.id == interpretation_id)
    result = await db.execute(query)
    interpretation = result.scalar_one_or_none()

    if not interpretation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"找不到 ID 為 {interpretation_id} 的卡牌解讀"
        )

    return interpretation


@router.get("/by-card/{card_id}", response_model=List[CardInterpretationWithDetails])
async def get_interpretations_by_card(
    card_id: UUID,
    is_active: Optional[bool] = Query(None, description="篩選啟用狀態"),
    db: AsyncSession = Depends(get_db),
):
    """
    取得特定卡牌的所有角色解讀

    - **card_id**: 卡牌 ID
    - **is_active**: 篩選啟用狀態（可選）

    回傳該卡牌的所有角色解讀，包含角色詳細資訊
    """
    # 驗證卡牌存在
    card_query = select(WastelandCard).where(WastelandCard.id == card_id)
    card_result = await db.execute(card_query)
    card = card_result.scalar_one_or_none()

    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"找不到 ID 為 {card_id} 的卡牌"
        )

    # 查詢該卡牌的所有解讀
    query = select(CardInterpretation).where(CardInterpretation.card_id == card_id)

    if is_active is not None:
        query = query.where(CardInterpretation.is_active == is_active)

    result = await db.execute(query)
    interpretations = result.scalars().all()

    # 載入角色詳細資訊
    interpretations_with_details = []
    for interp in interpretations:
        char_query = select(Character).where(Character.id == interp.character_id)
        char_result = await db.execute(char_query)
        character = char_result.scalar_one_or_none()

        interp_dict = interp.to_dict()
        interp_dict["character_name"] = character.name if character else None
        interp_dict["character_key"] = character.key if character else None
        interp_dict["card_name"] = card.name
        interpretations_with_details.append(interp_dict)

    return interpretations_with_details


@router.get("/by-character/{character_id}", response_model=List[CardInterpretationWithDetails])
async def get_interpretations_by_character(
    character_id: UUID,
    is_active: Optional[bool] = Query(None, description="篩選啟用狀態"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    """
    取得特定角色的所有卡牌解讀

    - **character_id**: 角色 ID
    - **is_active**: 篩選啟用狀態（可選）

    回傳該角色對所有卡牌的解讀，包含卡牌詳細資訊
    """
    # 驗證角色存在
    char_query = select(Character).where(Character.id == character_id)
    char_result = await db.execute(char_query)
    character = char_result.scalar_one_or_none()

    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"找不到 ID 為 {character_id} 的角色"
        )

    # 查詢該角色的所有解讀
    query = select(CardInterpretation).where(CardInterpretation.character_id == character_id)

    if is_active is not None:
        query = query.where(CardInterpretation.is_active == is_active)

    query = query.order_by(CardInterpretation.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    interpretations = result.scalars().all()

    # 載入卡牌詳細資訊
    interpretations_with_details = []
    for interp in interpretations:
        card_query = select(WastelandCard).where(WastelandCard.id == interp.card_id)
        card_result = await db.execute(card_query)
        card = card_result.scalar_one_or_none()

        interp_dict = interp.to_dict()
        interp_dict["character_name"] = character.name
        interp_dict["character_key"] = character.key
        interp_dict["card_name"] = card.name if card else None
        interpretations_with_details.append(interp_dict)

    return interpretations_with_details


@router.get(
    "/card/{card_id}/character/{character_id}",
    response_model=CardInterpretationWithDetails
)
async def get_interpretation_by_card_and_character(
    card_id: UUID,
    character_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    取得特定卡牌+角色的解讀

    - **card_id**: 卡牌 ID
    - **character_id**: 角色 ID

    回傳該卡牌在該角色視角下的解讀
    """
    # 查詢解讀
    query = select(CardInterpretation).where(
        and_(
            CardInterpretation.card_id == card_id,
            CardInterpretation.character_id == character_id
        )
    )
    result = await db.execute(query)
    interpretation = result.scalar_one_or_none()

    if not interpretation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"找不到卡牌 {card_id} 和角色 {character_id} 的解讀"
        )

    # 載入詳細資訊
    char_query = select(Character).where(Character.id == character_id)
    char_result = await db.execute(char_query)
    character = char_result.scalar_one_or_none()

    card_query = select(WastelandCard).where(WastelandCard.id == card_id)
    card_result = await db.execute(card_query)
    card = card_result.scalar_one_or_none()

    interp_dict = interpretation.to_dict()
    interp_dict["character_name"] = character.name if character else None
    interp_dict["character_key"] = character.key if character else None
    interp_dict["card_name"] = card.name if card else None

    return interp_dict


@router.post("/", response_model=CardInterpretationResponse, status_code=status.HTTP_201_CREATED)
async def create_interpretation(
    interpretation_data: CardInterpretationCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    建立新的卡牌解讀

    需要提供：
    - **card_id**: 卡牌 ID
    - **character_id**: 角色 ID
    - **interpretation_text**: 解讀文字內容
    - **is_active**: 是否啟用（可選，預設為 True）
    """
    # 驗證卡牌存在
    card_query = select(WastelandCard).where(WastelandCard.id == interpretation_data.card_id)
    card_result = await db.execute(card_query)
    card = card_result.scalar_one_or_none()

    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"找不到 ID 為 {interpretation_data.card_id} 的卡牌"
        )

    # 驗證角色存在
    char_query = select(Character).where(Character.id == interpretation_data.character_id)
    char_result = await db.execute(char_query)
    character = char_result.scalar_one_or_none()

    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"找不到 ID 為 {interpretation_data.character_id} 的角色"
        )

    # 檢查該卡牌+角色的解讀是否已存在
    existing_query = select(CardInterpretation).where(
        and_(
            CardInterpretation.card_id == interpretation_data.card_id,
            CardInterpretation.character_id == interpretation_data.character_id
        )
    )
    existing_result = await db.execute(existing_query)
    existing_interp = existing_result.scalar_one_or_none()

    if existing_interp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"卡牌 '{card.name}' 已有角色 '{character.name}' 的解讀"
        )

    # 建立新解讀
    new_interpretation = CardInterpretation(**interpretation_data.model_dump())
    db.add(new_interpretation)
    await db.commit()
    await db.refresh(new_interpretation)

    return new_interpretation


@router.post("/bulk", response_model=BulkOperationResponse)
async def create_interpretations_bulk(
    bulk_data: BulkInterpretationCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    批量建立卡牌解讀

    為一張卡牌建立多個角色的解讀

    **請求格式**:
    ```json
    {
        "card_id": "uuid",
        "interpretations": [
            {
                "character_id": "uuid",
                "interpretation_text": "解讀內容"
            },
            ...
        ]
    }
    ```
    """
    # 驗證卡牌存在
    card_query = select(WastelandCard).where(WastelandCard.id == bulk_data.card_id)
    card_result = await db.execute(card_query)
    card = card_result.scalar_one_or_none()

    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"找不到 ID 為 {bulk_data.card_id} 的卡牌"
        )

    success_count = 0
    failed_count = 0
    errors = []

    for idx, interp_data in enumerate(bulk_data.interpretations):
        try:
            character_id = UUID(interp_data["character_id"])
            interpretation_text = interp_data["interpretation_text"]

            # 驗證角色存在
            char_query = select(Character).where(Character.id == character_id)
            char_result = await db.execute(char_query)
            character = char_result.scalar_one_or_none()

            if not character:
                errors.append(f"索引 {idx}: 找不到角色 ID {character_id}")
                failed_count += 1
                continue

            # 檢查是否已存在
            existing_query = select(CardInterpretation).where(
                and_(
                    CardInterpretation.card_id == bulk_data.card_id,
                    CardInterpretation.character_id == character_id
                )
            )
            existing_result = await db.execute(existing_query)
            existing_interp = existing_result.scalar_one_or_none()

            if existing_interp:
                errors.append(f"索引 {idx}: 卡牌 '{card.name}' 已有角色 '{character.name}' 的解讀")
                failed_count += 1
                continue

            # 建立新解讀
            new_interpretation = CardInterpretation(
                card_id=bulk_data.card_id,
                character_id=character_id,
                interpretation_text=interpretation_text,
                is_active=True
            )
            db.add(new_interpretation)
            success_count += 1

        except Exception as e:
            errors.append(f"索引 {idx}: {str(e)}")
            failed_count += 1

    # 提交所有成功的解讀
    if success_count > 0:
        await db.commit()

    return {
        "success_count": success_count,
        "failed_count": failed_count,
        "errors": errors
    }


@router.put("/{interpretation_id}", response_model=CardInterpretationResponse)
async def update_interpretation(
    interpretation_id: UUID,
    interpretation_data: CardInterpretationUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    更新卡牌解讀

    可以更新：
    - **interpretation_text**: 解讀文字內容
    - **is_active**: 是否啟用
    """
    # 查找解讀
    query = select(CardInterpretation).where(CardInterpretation.id == interpretation_id)
    result = await db.execute(query)
    interpretation = result.scalar_one_or_none()

    if not interpretation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"找不到 ID 為 {interpretation_id} 的卡牌解讀"
        )

    # 更新欄位
    update_data = interpretation_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(interpretation, field, value)

    await db.commit()
    await db.refresh(interpretation)

    return interpretation


@router.delete("/{interpretation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_interpretation(
    interpretation_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    刪除卡牌解讀

    ⚠️  注意：刪除操作不可復原
    """
    # 查找解讀
    query = select(CardInterpretation).where(CardInterpretation.id == interpretation_id)
    result = await db.execute(query)
    interpretation = result.scalar_one_or_none()

    if not interpretation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"找不到 ID 為 {interpretation_id} 的卡牌解讀"
        )

    # 刪除解讀
    await db.delete(interpretation)
    await db.commit()

    return None


@router.get("/stats/summary", response_model=dict)
async def get_interpretation_stats(
    db: AsyncSession = Depends(get_db),
):
    """
    取得解讀統計摘要

    回傳：
    - 總解讀數
    - 啟用解讀數
    - 停用解讀數
    - 有解讀的卡牌數
    - 有解讀的角色數
    """
    # 總解讀數
    total_query = select(func.count(CardInterpretation.id))
    total_result = await db.execute(total_query)
    total_count = total_result.scalar()

    # 啟用解讀數
    active_query = select(func.count(CardInterpretation.id)).where(
        CardInterpretation.is_active == True
    )
    active_result = await db.execute(active_query)
    active_count = active_result.scalar()

    # 停用解讀數
    inactive_count = total_count - active_count

    # 有解讀的卡牌數
    cards_query = select(func.count(func.distinct(CardInterpretation.card_id)))
    cards_result = await db.execute(cards_query)
    cards_count = cards_result.scalar()

    # 有解讀的角色數
    characters_query = select(func.count(func.distinct(CardInterpretation.character_id)))
    characters_result = await db.execute(characters_query)
    characters_count = characters_result.scalar()

    return {
        "total_interpretations": total_count,
        "active_interpretations": active_count,
        "inactive_interpretations": inactive_count,
        "cards_with_interpretations": cards_count,
        "characters_with_interpretations": characters_count,
    }
