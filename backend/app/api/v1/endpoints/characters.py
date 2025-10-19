"""
Characters API Endpoints
角色管理 API - 提供完整的 CRUD 操作
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import List, Optional
from uuid import UUID

from app.db.session import get_db
from app.models import Character, CardInterpretation
from app.schemas.character_voice import (
    CharacterCreate,
    CharacterUpdate,
    CharacterResponse,
    CharacterWithInterpretationsCount,
)

router = APIRouter()


@router.get("/", response_model=List[CharacterResponse])
async def get_characters(
    is_active: Optional[bool] = Query(None, description="篩選啟用狀態"),
    search: Optional[str] = Query(None, description="搜尋角色名稱或描述"),
    skip: int = Query(0, ge=0, description="跳過筆數"),
    limit: int = Query(100, ge=1, le=1000, description="限制筆數"),
    db: AsyncSession = Depends(get_db),
):
    """
    取得角色列表

    - **is_active**: 篩選啟用狀態（可選）
    - **search**: 搜尋角色名稱或描述（可選）
    - **skip**: 分頁跳過筆數
    - **limit**: 分頁限制筆數
    """
    query = select(Character)

    # 篩選條件
    if is_active is not None:
        query = query.where(Character.is_active == is_active)

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Character.name.ilike(search_pattern),
                Character.description.ilike(search_pattern),
                Character.key.ilike(search_pattern),
            )
        )

    # 排序和分頁
    query = query.order_by(Character.sort_order, Character.name).offset(skip).limit(limit)

    result = await db.execute(query)
    characters = result.scalars().all()

    return characters


@router.get("/with-counts", response_model=List[CharacterWithInterpretationsCount])
async def get_characters_with_counts(
    is_active: Optional[bool] = Query(None, description="篩選啟用狀態"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    """
    取得角色列表（含解讀數量）
    """
    query = select(Character)

    if is_active is not None:
        query = query.where(Character.is_active == is_active)

    query = query.order_by(Character.sort_order, Character.name).offset(skip).limit(limit)

    result = await db.execute(query)
    characters = result.scalars().all()

    # 為每個角色計算解讀數量
    characters_with_counts = []
    for character in characters:
        count_query = select(func.count(CardInterpretation.id)).where(
            CardInterpretation.character_id == character.id
        )
        count_result = await db.execute(count_query)
        count = count_result.scalar()

        character_dict = character.to_dict()
        character_dict["interpretations_count"] = count
        characters_with_counts.append(character_dict)

    return characters_with_counts


@router.get("/{character_id}", response_model=CharacterResponse)
async def get_character(
    character_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    根據 ID 取得單一角色
    """
    query = select(Character).where(Character.id == character_id)
    result = await db.execute(query)
    character = result.scalar_one_or_none()

    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"找不到 ID 為 {character_id} 的角色"
        )

    return character


@router.get("/by-key/{character_key}", response_model=CharacterResponse)
async def get_character_by_key(
    character_key: str,
    db: AsyncSession = Depends(get_db),
):
    """
    根據 key 取得單一角色
    """
    query = select(Character).where(Character.key == character_key)
    result = await db.execute(query)
    character = result.scalar_one_or_none()

    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"找不到 key 為 {character_key} 的角色"
        )

    return character


@router.post("/", response_model=CharacterResponse, status_code=status.HTTP_201_CREATED)
async def create_character(
    character_data: CharacterCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    建立新角色

    需要提供：
    - **key**: 唯一識別碼
    - **name**: 顯示名稱
    - 其他欄位為可選
    """
    # 檢查 key 是否已存在
    existing_query = select(Character).where(Character.key == character_data.key)
    existing_result = await db.execute(existing_query)
    existing_character = existing_result.scalar_one_or_none()

    if existing_character:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"角色 key '{character_data.key}' 已存在"
        )

    # 建立新角色
    new_character = Character(**character_data.model_dump())
    db.add(new_character)
    await db.commit()
    await db.refresh(new_character)

    return new_character


@router.put("/{character_id}", response_model=CharacterResponse)
async def update_character(
    character_id: UUID,
    character_data: CharacterUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    更新角色資訊

    可以更新任何欄位，只需提供要更新的欄位即可
    """
    # 查找角色
    query = select(Character).where(Character.id == character_id)
    result = await db.execute(query)
    character = result.scalar_one_or_none()

    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"找不到 ID 為 {character_id} 的角色"
        )

    # 如果要更新 key，檢查新 key 是否已被使用
    if character_data.key and character_data.key != character.key:
        existing_query = select(Character).where(Character.key == character_data.key)
        existing_result = await db.execute(existing_query)
        existing_character = existing_result.scalar_one_or_none()

        if existing_character:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"角色 key '{character_data.key}' 已存在"
            )

    # 更新欄位
    update_data = character_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(character, field, value)

    await db.commit()
    await db.refresh(character)

    return character


@router.delete("/{character_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_character(
    character_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    刪除角色

    ⚠️  注意：刪除角色會同時刪除所有相關的解讀記錄（CASCADE）
    """
    # 查找角色
    query = select(Character).where(Character.id == character_id)
    result = await db.execute(query)
    character = result.scalar_one_or_none()

    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"找不到 ID 為 {character_id} 的角色"
        )

    # 刪除角色
    await db.delete(character)
    await db.commit()

    return None
