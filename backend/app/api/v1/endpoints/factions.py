"""
Factions API Endpoints
陣營管理 API - 提供完整的 CRUD 操作和角色關聯管理
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import List, Optional
from uuid import UUID

from app.db.session import get_db
from app.models import Faction, Character, FactionCharacter
from app.schemas.character_voice import (
    FactionCreate,
    FactionUpdate,
    FactionResponse,
    FactionWithCharacters,
    FactionCharacterCreate,
    FactionCharacterUpdate,
    FactionCharacterResponse,
)

router = APIRouter()


@router.get("/", response_model=List[FactionResponse])
async def get_factions(
    is_active: Optional[bool] = Query(None, description="篩選啟用狀態"),
    search: Optional[str] = Query(None, description="搜尋陣營名稱或描述"),
    skip: int = Query(0, ge=0, description="跳過筆數"),
    limit: int = Query(100, ge=1, le=1000, description="限制筆數"),
    db: AsyncSession = Depends(get_db),
):
    """
    取得陣營列表

    - **is_active**: 篩選啟用狀態（可選）
    - **search**: 搜尋陣營名稱或描述（可選）
    - **skip**: 分頁跳過筆數
    - **limit**: 分頁限制筆數
    """
    query = select(Faction)

    # 篩選條件
    if is_active is not None:
        query = query.where(Faction.is_active == is_active)

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Faction.name.ilike(search_pattern),
                Faction.description.ilike(search_pattern),
                Faction.key.ilike(search_pattern),
                Faction.alignment.ilike(search_pattern),
            )
        )

    # 排序和分頁
    query = query.order_by(Faction.sort_order, Faction.name).offset(skip).limit(limit)

    result = await db.execute(query)
    factions = result.scalars().all()

    return factions


@router.get("/with-characters", response_model=List[FactionWithCharacters])
async def get_factions_with_characters(
    is_active: Optional[bool] = Query(None, description="篩選啟用狀態"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    """
    取得陣營列表（含關聯角色）
    """
    query = select(Faction)

    if is_active is not None:
        query = query.where(Faction.is_active == is_active)

    query = query.order_by(Faction.sort_order, Faction.name).offset(skip).limit(limit)

    result = await db.execute(query)
    factions = result.scalars().all()

    # 為每個陣營載入關聯的角色
    factions_with_characters = []
    for faction in factions:
        # 查詢該陣營的所有角色（依 priority 排序）
        char_query = (
            select(Character)
            .join(FactionCharacter, FactionCharacter.character_id == Character.id)
            .where(FactionCharacter.faction_id == faction.id)
            .order_by(FactionCharacter.priority, Character.sort_order)
        )
        char_result = await db.execute(char_query)
        characters = char_result.scalars().all()

        faction_dict = faction.to_dict()
        faction_dict["characters"] = [char.to_dict() for char in characters]
        factions_with_characters.append(faction_dict)

    return factions_with_characters


@router.get("/{faction_id}", response_model=FactionResponse)
async def get_faction(
    faction_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    根據 ID 取得單一陣營
    """
    query = select(Faction).where(Faction.id == faction_id)
    result = await db.execute(query)
    faction = result.scalar_one_or_none()

    if not faction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"找不到 ID 為 {faction_id} 的陣營"
        )

    return faction


@router.get("/by-key/{faction_key}", response_model=FactionResponse)
async def get_faction_by_key(
    faction_key: str,
    db: AsyncSession = Depends(get_db),
):
    """
    根據 key 取得單一陣營
    """
    query = select(Faction).where(Faction.key == faction_key)
    result = await db.execute(query)
    faction = result.scalar_one_or_none()

    if not faction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"找不到 key 為 {faction_key} 的陣營"
        )

    return faction


@router.post("/", response_model=FactionResponse, status_code=status.HTTP_201_CREATED)
async def create_faction(
    faction_data: FactionCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    建立新陣營

    需要提供：
    - **key**: 唯一識別碼
    - **name**: 顯示名稱
    - 其他欄位為可選
    """
    # 檢查 key 是否已存在
    existing_query = select(Faction).where(Faction.key == faction_data.key)
    existing_result = await db.execute(existing_query)
    existing_faction = existing_result.scalar_one_or_none()

    if existing_faction:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"陣營 key '{faction_data.key}' 已存在"
        )

    # 建立新陣營
    new_faction = Faction(**faction_data.model_dump())
    db.add(new_faction)
    await db.commit()
    await db.refresh(new_faction)

    return new_faction


@router.put("/{faction_id}", response_model=FactionResponse)
async def update_faction(
    faction_id: UUID,
    faction_data: FactionUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    更新陣營資訊

    可以更新任何欄位，只需提供要更新的欄位即可
    """
    # 查找陣營
    query = select(Faction).where(Faction.id == faction_id)
    result = await db.execute(query)
    faction = result.scalar_one_or_none()

    if not faction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"找不到 ID 為 {faction_id} 的陣營"
        )

    # 如果要更新 key，檢查新 key 是否已被使用
    if faction_data.key and faction_data.key != faction.key:
        existing_query = select(Faction).where(Faction.key == faction_data.key)
        existing_result = await db.execute(existing_query)
        existing_faction = existing_result.scalar_one_or_none()

        if existing_faction:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"陣營 key '{faction_data.key}' 已存在"
            )

    # 更新欄位
    update_data = faction_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(faction, field, value)

    await db.commit()
    await db.refresh(faction)

    return faction


@router.delete("/{faction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faction(
    faction_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    刪除陣營

    ⚠️  注意：刪除陣營會同時刪除所有相關的陣營-角色關聯（CASCADE）
    """
    # 查找陣營
    query = select(Faction).where(Faction.id == faction_id)
    result = await db.execute(query)
    faction = result.scalar_one_or_none()

    if not faction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"找不到 ID 為 {faction_id} 的陣營"
        )

    # 刪除陣營
    await db.delete(faction)
    await db.commit()

    return None


# ============================================================================
# Faction-Character Association Endpoints
# ============================================================================

@router.post(
    "/{faction_id}/characters/{character_id}",
    response_model=FactionCharacterResponse,
    status_code=status.HTTP_201_CREATED
)
async def add_character_to_faction(
    faction_id: UUID,
    character_id: UUID,
    priority: int = Query(0, ge=0, description="優先順序（數字越小優先級越高）"),
    db: AsyncSession = Depends(get_db),
):
    """
    將角色加入陣營

    - **faction_id**: 陣營 ID
    - **character_id**: 角色 ID
    - **priority**: 優先順序（可選，預設為 0）
    """
    # 驗證陣營存在
    faction_query = select(Faction).where(Faction.id == faction_id)
    faction_result = await db.execute(faction_query)
    faction = faction_result.scalar_one_or_none()

    if not faction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"找不到 ID 為 {faction_id} 的陣營"
        )

    # 驗證角色存在
    char_query = select(Character).where(Character.id == character_id)
    char_result = await db.execute(char_query)
    character = char_result.scalar_one_or_none()

    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"找不到 ID 為 {character_id} 的角色"
        )

    # 檢查關聯是否已存在
    existing_query = select(FactionCharacter).where(
        FactionCharacter.faction_id == faction_id,
        FactionCharacter.character_id == character_id
    )
    existing_result = await db.execute(existing_query)
    existing_assoc = existing_result.scalar_one_or_none()

    if existing_assoc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"陣營 '{faction.name}' 已包含角色 '{character.name}'"
        )

    # 建立新的關聯
    new_assoc = FactionCharacter(
        faction_id=faction_id,
        character_id=character_id,
        priority=priority
    )
    db.add(new_assoc)
    await db.commit()
    await db.refresh(new_assoc)

    return new_assoc


@router.put(
    "/{faction_id}/characters/{character_id}",
    response_model=FactionCharacterResponse
)
async def update_faction_character_priority(
    faction_id: UUID,
    character_id: UUID,
    priority: int = Query(..., ge=0, description="新的優先順序"),
    db: AsyncSession = Depends(get_db),
):
    """
    更新陣營-角色關聯的優先順序

    - **faction_id**: 陣營 ID
    - **character_id**: 角色 ID
    - **priority**: 新的優先順序（必填）
    """
    # 查找關聯
    query = select(FactionCharacter).where(
        FactionCharacter.faction_id == faction_id,
        FactionCharacter.character_id == character_id
    )
    result = await db.execute(query)
    assoc = result.scalar_one_or_none()

    if not assoc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"找不到陣營 {faction_id} 和角色 {character_id} 的關聯"
        )

    # 更新優先順序
    assoc.priority = priority
    await db.commit()
    await db.refresh(assoc)

    return assoc


@router.delete(
    "/{faction_id}/characters/{character_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def remove_character_from_faction(
    faction_id: UUID,
    character_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    從陣營中移除角色

    - **faction_id**: 陣營 ID
    - **character_id**: 角色 ID
    """
    # 查找關聯
    query = select(FactionCharacter).where(
        FactionCharacter.faction_id == faction_id,
        FactionCharacter.character_id == character_id
    )
    result = await db.execute(query)
    assoc = result.scalar_one_or_none()

    if not assoc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"找不到陣營 {faction_id} 和角色 {character_id} 的關聯"
        )

    # 刪除關聯
    await db.delete(assoc)
    await db.commit()

    return None


@router.get(
    "/{faction_id}/characters",
    response_model=List[FactionCharacterResponse]
)
async def get_faction_characters(
    faction_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    取得陣營的所有角色關聯

    - **faction_id**: 陣營 ID

    回傳依 priority 排序的角色關聯列表
    """
    # 驗證陣營存在
    faction_query = select(Faction).where(Faction.id == faction_id)
    faction_result = await db.execute(faction_query)
    faction = faction_result.scalar_one_or_none()

    if not faction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"找不到 ID 為 {faction_id} 的陣營"
        )

    # 查詢所有關聯
    query = (
        select(FactionCharacter)
        .where(FactionCharacter.faction_id == faction_id)
        .order_by(FactionCharacter.priority)
    )
    result = await db.execute(query)
    associations = result.scalars().all()

    return associations
