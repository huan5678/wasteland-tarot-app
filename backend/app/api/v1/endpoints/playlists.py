"""Playlist management API endpoints."""

import logging
from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from supabase import Client

from app.core.supabase import get_supabase_client
from app.core.dependencies import get_current_user
from app.models.music import (
    Playlist,
    PlaylistCreate,
    PlaylistUpdate,
    PlaylistResponse,
    AddTrackRequest,
    ReorderTracksRequest,
)
from app.services import PlaylistService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "",
    response_model=List[PlaylistResponse],
    summary="查詢使用者播放清單",
    description="""
    查詢使用者所有播放清單（最多 5 個）

    邏輯:
    - JOIN playlist_tracks 和 music_tracks 取得完整播放清單內容
    - 排序: 預設播放清單優先 (is_default = TRUE)，其次按建立時間降序

    認證: Required (Bearer token)
    """,
)
async def get_user_playlists(
    supabase: Client = Depends(get_supabase_client),
    current_user: dict = Depends(get_current_user),
) -> List[PlaylistResponse]:
    """查詢使用者播放清單"""
    user_id = UUID(current_user["id"])
    service = PlaylistService(supabase)

    return await service.get_user_playlists(user_id=user_id)


@router.post(
    "",
    response_model=PlaylistResponse,
    status_code=status.HTTP_201_CREATED,
    summary="建立播放清單",
    description="""
    建立播放清單

    邏輯:
    - 檢查播放清單數量限制（最多 5 個）
    - 插入播放清單至 playlists 表
    - 觸發 Supabase Realtime 事件以同步至其他裝置

    認證: Required (Bearer token)
    """,
)
async def create_playlist(
    data: PlaylistCreate,
    supabase: Client = Depends(get_supabase_client),
    current_user: dict = Depends(get_current_user),
) -> PlaylistResponse:
    """建立播放清單"""
    user_id = UUID(current_user["id"])
    service = PlaylistService(supabase)

    playlist = await service.create_playlist(
        user_id=user_id,
        data=data,
    )

    return PlaylistResponse(**playlist.model_dump(), track_count=0)


@router.put(
    "/{playlist_id}",
    response_model=PlaylistResponse,
    summary="重新命名播放清單",
    description="""
    重新命名播放清單

    邏輯:
    - 驗證使用者認證、播放清單擁有權和請求 body (name)
    - 驗證名稱長度限制（最多 50 個字元）
    - 更新播放清單名稱

    認證: Required (Bearer token)
    """,
)
async def update_playlist(
    playlist_id: UUID,
    data: PlaylistUpdate,
    supabase: Client = Depends(get_supabase_client),
    current_user: dict = Depends(get_current_user),
) -> PlaylistResponse:
    """重新命名播放清單"""
    user_id = UUID(current_user["id"])
    service = PlaylistService(supabase)

    playlist = await service.update_playlist(
        user_id=user_id,
        playlist_id=playlist_id,
        data=data,
    )

    return PlaylistResponse(**playlist.model_dump(), track_count=0)


@router.delete(
    "/{playlist_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="刪除播放清單",
    description="""
    刪除播放清單

    邏輯:
    - 驗證使用者認證和播放清單擁有權
    - 禁止刪除預設播放清單 (is_default = TRUE)
    - 刪除播放清單時自動刪除 playlist_tracks 關聯記錄 (CASCADE DELETE)

    認證: Required (Bearer token)
    """,
)
async def delete_playlist(
    playlist_id: UUID,
    supabase: Client = Depends(get_supabase_client),
    current_user: dict = Depends(get_current_user),
) -> None:
    """刪除播放清單"""
    user_id = UUID(current_user["id"])
    service = PlaylistService(supabase)

    await service.delete_playlist(
        user_id=user_id,
        playlist_id=playlist_id,
    )


@router.post(
    "/{playlist_id}/tracks",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="加入音樂至播放清單",
    description="""
    加入音樂至播放清單

    邏輯:
    - 驗證使用者認證、播放清單擁有權和請求 body (track_id)
    - 檢查音樂是否已存在於播放清單（防止重複）
    - 計算新音樂的 position (MAX(position) + 1)
    - 插入至 playlist_tracks 表
    - 觸發 Supabase Realtime 事件

    認證: Required (Bearer token)
    """,
)
async def add_track_to_playlist(
    playlist_id: UUID,
    data: AddTrackRequest,
    supabase: Client = Depends(get_supabase_client),
    current_user: dict = Depends(get_current_user),
) -> None:
    """加入音樂至播放清單"""
    user_id = UUID(current_user["id"])
    service = PlaylistService(supabase)

    await service.add_track(
        user_id=user_id,
        playlist_id=playlist_id,
        data=data,
    )


@router.delete(
    "/{playlist_id}/tracks/{track_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="從播放清單移除音樂",
    description="""
    從播放清單移除音樂

    邏輯:
    - 驗證使用者認證和播放清單擁有權
    - 刪除 playlist_tracks 記錄
    - 重新計算剩餘音樂的 position（保持連續性）
    - 觸發 Supabase Realtime 事件

    認證: Required (Bearer token)
    """,
)
async def remove_track_from_playlist(
    playlist_id: UUID,
    track_id: UUID,
    supabase: Client = Depends(get_supabase_client),
    current_user: dict = Depends(get_current_user),
) -> None:
    """從播放清單移除音樂"""
    user_id = UUID(current_user["id"])
    service = PlaylistService(supabase)

    await service.remove_track(
        user_id=user_id,
        playlist_id=playlist_id,
        track_id=track_id,
    )


@router.put(
    "/{playlist_id}/reorder",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="調整播放清單音樂順序",
    description="""
    調整播放清單音樂順序

    邏輯:
    - 驗證使用者認證、播放清單擁有權和請求 body (trackIds 陣列)
    - 批次更新 playlist_tracks.position 欄位（使用 Supabase batch update）
    - 觸發 Supabase Realtime 事件

    認證: Required (Bearer token)
    """,
)
async def reorder_playlist_tracks(
    playlist_id: UUID,
    data: ReorderTracksRequest,
    supabase: Client = Depends(get_supabase_client),
    current_user: dict = Depends(get_current_user),
) -> None:
    """調整播放清單音樂順序"""
    user_id = UUID(current_user["id"])
    service = PlaylistService(supabase)

    await service.reorder_tracks(
        user_id=user_id,
        playlist_id=playlist_id,
        data=data,
    )
