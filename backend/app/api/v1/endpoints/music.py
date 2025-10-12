"""Music management API endpoints."""

import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from supabase import Client

from app.core.supabase import get_supabase_client
from app.core.dependencies import get_current_user
from app.models.music import (
    MusicTrack,
    MusicTrackCreate,
    MusicTrackResponse,
    MusicListResponse,
)
from app.services import MusicService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "",
    response_model=MusicListResponse,
    summary="查詢使用者音樂庫",
    description="""
    查詢使用者音樂庫（含系統音樂）

    邏輯:
    - 查詢使用者音樂 (user_id = auth.uid())
    - 加上系統音樂 (is_system = TRUE)
    - 支援分頁

    認證: Required (Bearer token)
    """,
)
async def get_user_music(
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    supabase: Client = Depends(get_supabase_client),
    current_user: dict = Depends(get_current_user),
) -> MusicListResponse:
    """查詢使用者音樂庫"""
    user_id = UUID(current_user["id"])
    service = MusicService(supabase)

    return await service.get_user_music(
        user_id=user_id,
        page=page,
        limit=limit,
    )


@router.post(
    "",
    response_model=MusicTrackResponse,
    status_code=status.HTTP_201_CREATED,
    summary="儲存 AI 生成音樂",
    description="""
    儲存 AI 生成音樂

    邏輯 (Saga Pattern):
    1. 檢查儲存配額 (最多 50 首)
    2. 插入音樂至 music_tracks
    3. 若為 AI 生成，更新 user_ai_quotas.used_count
    4. 若配額更新失敗，刪除已儲存音樂 (補償交易)

    認證: Required (Bearer token)
    """,
)
async def create_music(
    data: MusicTrackCreate,
    supabase: Client = Depends(get_supabase_client),
    current_user: dict = Depends(get_current_user),
) -> MusicTrackResponse:
    """儲存 AI 生成音樂"""
    user_id = UUID(current_user["id"])
    service = MusicService(supabase)

    music = await service.create_music(
        user_id=user_id,
        data=data,
    )

    return MusicTrackResponse(**music.model_dump())


@router.delete(
    "/{music_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="刪除音樂",
    description="""
    刪除音樂

    邏輯:
    - 檢查擁有權 (RLS 自動處理)
    - 禁止刪除系統音樂 (is_system = TRUE)
    - CASCADE DELETE 自動處理 playlist_tracks

    認證: Required (Bearer token)
    """,
)
async def delete_music(
    music_id: UUID,
    supabase: Client = Depends(get_supabase_client),
    current_user: dict = Depends(get_current_user),
) -> None:
    """刪除音樂"""
    user_id = UUID(current_user["id"])
    service = MusicService(supabase)

    await service.delete_music(
        user_id=user_id,
        music_id=music_id,
    )
