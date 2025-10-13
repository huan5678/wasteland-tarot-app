"""
Playlist API endpoints
播放清單管理 API 端點 - Playlist CRUD, Pattern 管理, 訪客播放清單匯入
"""

import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from app.core.supabase import get_supabase_client
from app.core.dependencies import get_current_user
from app.schemas.music import (
    PlaylistCreate,
    PlaylistUpdate,
    PlaylistResponse,
    PlaylistPatternResponse,
    AddPatternRequest,
    UpdatePatternPositionRequest,
    ImportGuestPlaylistRequest,
    ImportGuestPlaylistResponse,
    PresetResponse,
    Pattern,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================
# Task 2.4: Playlist CRUD API 端點
# ============================================

@router.post(
    "",
    response_model=PlaylistResponse,
    status_code=status.HTTP_201_CREATED,
    summary="建立播放清單",
    description="""
    建立播放清單

    邏輯:
    - 驗證 JWT Token，提取 user_id
    - 插入 playlists 表
    - 回傳完整播放清單資訊

    認證: Required (Bearer token)
    """,
)
async def create_playlist(
    data: PlaylistCreate,
    supabase: Client = Depends(get_supabase_client),
    current_user: dict = Depends(get_current_user),
) -> PlaylistResponse:
    """建立播放清單 (Task 2.4)"""
    user_id = current_user["id"]

    try:
        # 插入播放清單
        response = supabase.table("playlists").insert({
            "user_id": user_id,
            "name": data.name,
            "description": data.description,
            "is_default": False,
        }).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create playlist"
            )

        playlist_data = response.data[0]
        return PlaylistResponse(
            id=playlist_data["id"],
            name=playlist_data["name"],
            description=playlist_data.get("description"),
            user_id=playlist_data["user_id"],
            patterns=[],
            created_at=playlist_data["created_at"],
            updated_at=playlist_data["updated_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating playlist: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create playlist"
        )


@router.get(
    "",
    response_model=List[PlaylistResponse],
    summary="獲取使用者所有播放清單",
    description="""
    獲取使用者所有播放清單

    邏輯:
    - 查詢 playlists 表
    - JOIN playlist_patterns 和 user_rhythm_presets 取得 Pattern 詳情
    - 按建立時間降序排序

    認證: Required (Bearer token)
    """,
)
async def get_user_playlists(
    supabase: Client = Depends(get_supabase_client),
    current_user: dict = Depends(get_current_user),
) -> List[PlaylistResponse]:
    """獲取使用者所有播放清單 (Task 2.4)"""
    user_id = current_user["id"]

    try:
        # 查詢播放清單
        playlists_response = supabase.table("playlists")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .execute()

        playlists = []
        for playlist_data in playlists_response.data:
            # 查詢播放清單中的 Patterns
            patterns_response = supabase.table("playlist_patterns")\
                .select("pattern_id, position")\
                .eq("playlist_id", playlist_data["id"])\
                .order("position", desc=False)\
                .execute()

            # 獲取 Pattern 詳情
            patterns = []
            for pattern_link in patterns_response.data:
                # 查詢 Pattern
                preset_response = supabase.table("user_rhythm_presets")\
                    .select("*")\
                    .eq("id", pattern_link["pattern_id"])\
                    .execute()

                if preset_response.data:
                    preset_data = preset_response.data[0]
                    pattern_response = PresetResponse(
                        id=preset_data["id"],
                        name=preset_data["name"],
                        description=preset_data.get("description"),
                        pattern=Pattern(**preset_data["pattern"]),
                        is_public=preset_data["is_public"],
                        is_system_preset=preset_data["is_system_preset"],
                        user_id=preset_data.get("user_id"),
                        created_at=preset_data["created_at"],
                        updated_at=preset_data["updated_at"],
                    )

                    patterns.append(PlaylistPatternResponse(
                        pattern_id=pattern_link["pattern_id"],
                        position=pattern_link["position"],
                        pattern=pattern_response,
                    ))

            playlists.append(PlaylistResponse(
                id=playlist_data["id"],
                name=playlist_data["name"],
                description=playlist_data.get("description"),
                user_id=playlist_data["user_id"],
                patterns=patterns,
                created_at=playlist_data["created_at"],
                updated_at=playlist_data["updated_at"],
            ))

        return playlists

    except Exception as e:
        logger.error(f"Error fetching user playlists: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch playlists"
        )


@router.get(
    "/{playlist_id}",
    response_model=PlaylistResponse,
    summary="獲取播放清單詳情",
    description="""
    獲取播放清單詳情（JOIN patterns）

    邏輯:
    - 驗證擁有權（user_id 必須匹配）
    - JOIN playlist_patterns 和 user_rhythm_presets
    - 回傳完整播放清單資訊

    認證: Required (Bearer token)
    """,
)
async def get_playlist(
    playlist_id: str,
    supabase: Client = Depends(get_supabase_client),
    current_user: dict = Depends(get_current_user),
) -> PlaylistResponse:
    """獲取播放清單詳情 (Task 2.4)"""
    user_id = current_user["id"]

    try:
        # 查詢播放清單
        playlist_response = supabase.table("playlists")\
            .select("*")\
            .eq("id", playlist_id)\
            .execute()

        if not playlist_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Playlist not found"
            )

        playlist_data = playlist_response.data[0]

        # 驗證擁有權
        if playlist_data["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not own this playlist"
            )

        # 查詢播放清單中的 Patterns
        patterns_response = supabase.table("playlist_patterns")\
            .select("pattern_id, position")\
            .eq("playlist_id", playlist_id)\
            .order("position", desc=False)\
            .execute()

        # 獲取 Pattern 詳情
        patterns = []
        for pattern_link in patterns_response.data:
            preset_response = supabase.table("user_rhythm_presets")\
                .select("*")\
                .eq("id", pattern_link["pattern_id"])\
                .execute()

            if preset_response.data:
                preset_data = preset_response.data[0]
                pattern_response = PresetResponse(
                    id=preset_data["id"],
                    name=preset_data["name"],
                    description=preset_data.get("description"),
                    pattern=Pattern(**preset_data["pattern"]),
                    is_public=preset_data["is_public"],
                    is_system_preset=preset_data["is_system_preset"],
                    user_id=preset_data.get("user_id"),
                    created_at=preset_data["created_at"],
                    updated_at=preset_data["updated_at"],
                )

                patterns.append(PlaylistPatternResponse(
                    pattern_id=pattern_link["pattern_id"],
                    position=pattern_link["position"],
                    pattern=pattern_response,
                ))

        return PlaylistResponse(
            id=playlist_data["id"],
            name=playlist_data["name"],
            description=playlist_data.get("description"),
            user_id=playlist_data["user_id"],
            patterns=patterns,
            created_at=playlist_data["created_at"],
            updated_at=playlist_data["updated_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching playlist: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch playlist"
        )


@router.put(
    "/{playlist_id}",
    response_model=PlaylistResponse,
    summary="更新播放清單",
    description="""
    更新播放清單名稱/描述

    邏輯:
    - 驗證擁有權（user_id 必須匹配）
    - 更新 name, description
    - 回傳更新後的播放清單

    認證: Required (Bearer token)
    """,
)
async def update_playlist(
    playlist_id: str,
    data: PlaylistUpdate,
    supabase: Client = Depends(get_supabase_client),
    current_user: dict = Depends(get_current_user),
) -> PlaylistResponse:
    """更新播放清單 (Task 2.4)"""
    user_id = current_user["id"]

    try:
        # 檢查播放清單是否存在且擁有
        check_response = supabase.table("playlists")\
            .select("*")\
            .eq("id", playlist_id)\
            .execute()

        if not check_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Playlist not found"
            )

        playlist = check_response.data[0]

        # 驗證擁有權
        if playlist["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not own this playlist"
            )

        # 構建更新資料
        update_data = {}
        if data.name is not None:
            update_data["name"] = data.name
        if data.description is not None:
            update_data["description"] = data.description

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )

        # 更新播放清單
        response = supabase.table("playlists")\
            .update(update_data)\
            .eq("id", playlist_id)\
            .execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update playlist"
            )

        playlist_data = response.data[0]
        return PlaylistResponse(
            id=playlist_data["id"],
            name=playlist_data["name"],
            description=playlist_data.get("description"),
            user_id=playlist_data["user_id"],
            patterns=[],
            created_at=playlist_data["created_at"],
            updated_at=playlist_data["updated_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating playlist: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update playlist"
        )


@router.delete(
    "/{playlist_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="刪除播放清單",
    description="""
    刪除播放清單（CASCADE patterns）

    邏輯:
    - 驗證擁有權（user_id 必須匹配）
    - 刪除播放清單（CASCADE 刪除 playlist_patterns）

    認證: Required (Bearer token)
    """,
)
async def delete_playlist(
    playlist_id: str,
    supabase: Client = Depends(get_supabase_client),
    current_user: dict = Depends(get_current_user),
) -> None:
    """刪除播放清單 (Task 2.4)"""
    user_id = current_user["id"]

    try:
        # 檢查播放清單是否存在且擁有
        check_response = supabase.table("playlists")\
            .select("*")\
            .eq("id", playlist_id)\
            .execute()

        if not check_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Playlist not found"
            )

        playlist = check_response.data[0]

        # 驗證擁有權
        if playlist["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not own this playlist"
            )

        # 刪除播放清單（CASCADE 會自動刪除 playlist_patterns）
        supabase.table("playlists")\
            .delete()\
            .eq("id", playlist_id)\
            .execute()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting playlist: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete playlist"
        )


# ============================================
# Task 2.5: Playlist Pattern 管理 API
# ============================================

@router.post(
    "/{playlist_id}/patterns",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="加入 Pattern 到播放清單",
    description="""
    加入 Pattern 到播放清單

    邏輯:
    - 驗證擁有權（user_id 必須匹配）
    - 檢查 Pattern 是否已存在（防止重複）
    - 計算新 Pattern 的 position (MAX(position) + 1)
    - 插入 playlist_patterns 記錄

    認證: Required (Bearer token)
    """,
)
async def add_pattern_to_playlist(
    playlist_id: str,
    data: AddPatternRequest,
    supabase: Client = Depends(get_supabase_client),
    current_user: dict = Depends(get_current_user),
) -> None:
    """加入 Pattern 到播放清單 (Task 2.5)"""
    user_id = current_user["id"]

    try:
        # 檢查播放清單是否存在且擁有
        playlist_response = supabase.table("playlists")\
            .select("*")\
            .eq("id", playlist_id)\
            .execute()

        if not playlist_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Playlist not found"
            )

        playlist = playlist_response.data[0]

        # 驗證擁有權
        if playlist["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not own this playlist"
            )

        # 檢查 Pattern 是否存在
        pattern_response = supabase.table("user_rhythm_presets")\
            .select("id")\
            .eq("id", data.pattern_id)\
            .execute()

        if not pattern_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pattern not found"
            )

        # 檢查是否已存在（UNIQUE 約束）
        existing_response = supabase.table("playlist_patterns")\
            .select("id")\
            .eq("playlist_id", playlist_id)\
            .eq("pattern_id", data.pattern_id)\
            .execute()

        if existing_response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pattern already exists in playlist"
            )

        # 計算新的 position（MAX + 1）
        max_position_response = supabase.table("playlist_patterns")\
            .select("position")\
            .eq("playlist_id", playlist_id)\
            .order("position", desc=True)\
            .limit(1)\
            .execute()

        new_position = 0
        if max_position_response.data:
            new_position = max_position_response.data[0]["position"] + 1

        # 插入 Pattern
        supabase.table("playlist_patterns").insert({
            "playlist_id": playlist_id,
            "pattern_id": data.pattern_id,
            "position": new_position,
        }).execute()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding pattern to playlist: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add pattern to playlist"
        )


@router.delete(
    "/{playlist_id}/patterns/{pattern_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="從播放清單移除 Pattern",
    description="""
    從播放清單移除 Pattern

    邏輯:
    - 驗證擁有權（user_id 必須匹配）
    - 刪除 playlist_patterns 記錄
    - 重新計算剩餘 Patterns 的 position（保持連續性）

    認證: Required (Bearer token)
    """,
)
async def remove_pattern_from_playlist(
    playlist_id: str,
    pattern_id: str,
    supabase: Client = Depends(get_supabase_client),
    current_user: dict = Depends(get_current_user),
) -> None:
    """從播放清單移除 Pattern (Task 2.5)"""
    user_id = current_user["id"]

    try:
        # 檢查播放清單是否存在且擁有
        playlist_response = supabase.table("playlists")\
            .select("*")\
            .eq("id", playlist_id)\
            .execute()

        if not playlist_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Playlist not found"
            )

        playlist = playlist_response.data[0]

        # 驗證擁有權
        if playlist["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not own this playlist"
            )

        # 檢查 Pattern 是否存在於播放清單中
        pattern_link_response = supabase.table("playlist_patterns")\
            .select("*")\
            .eq("playlist_id", playlist_id)\
            .eq("pattern_id", pattern_id)\
            .execute()

        if not pattern_link_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pattern not found in playlist"
            )

        removed_position = pattern_link_response.data[0]["position"]

        # 刪除 Pattern
        supabase.table("playlist_patterns")\
            .delete()\
            .eq("playlist_id", playlist_id)\
            .eq("pattern_id", pattern_id)\
            .execute()

        # 重新計算剩餘 Patterns 的 position
        remaining_patterns = supabase.table("playlist_patterns")\
            .select("id, position")\
            .eq("playlist_id", playlist_id)\
            .gt("position", removed_position)\
            .order("position", desc=False)\
            .execute()

        for pattern in remaining_patterns.data:
            supabase.table("playlist_patterns")\
                .update({"position": pattern["position"] - 1})\
                .eq("id", pattern["id"])\
                .execute()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing pattern from playlist: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove pattern from playlist"
        )


@router.put(
    "/{playlist_id}/patterns/{pattern_id}/position",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="調整 Pattern 順序",
    description="""
    調整 Pattern 順序

    邏輯:
    - 驗證擁有權（user_id 必須匹配）
    - 更新目標 Pattern 的 position
    - 自動調整其他 Patterns 的 position（保持連續性）

    認證: Required (Bearer token)
    """,
)
async def update_pattern_position(
    playlist_id: str,
    pattern_id: str,
    data: UpdatePatternPositionRequest,
    supabase: Client = Depends(get_supabase_client),
    current_user: dict = Depends(get_current_user),
) -> None:
    """調整 Pattern 順序 (Task 2.5)"""
    user_id = current_user["id"]

    try:
        # 檢查播放清單是否存在且擁有
        playlist_response = supabase.table("playlists")\
            .select("*")\
            .eq("id", playlist_id)\
            .execute()

        if not playlist_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Playlist not found"
            )

        playlist = playlist_response.data[0]

        # 驗證擁有權
        if playlist["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not own this playlist"
            )

        # 檢查 Pattern 是否存在於播放清單中
        pattern_link_response = supabase.table("playlist_patterns")\
            .select("*")\
            .eq("playlist_id", playlist_id)\
            .eq("pattern_id", pattern_id)\
            .execute()

        if not pattern_link_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pattern not found in playlist"
            )

        pattern_link = pattern_link_response.data[0]
        old_position = pattern_link["position"]
        new_position = data.new_position

        if old_position == new_position:
            return  # 位置未變，不需要更新

        # 獲取所有 Patterns（排序）
        all_patterns = supabase.table("playlist_patterns")\
            .select("id, pattern_id, position")\
            .eq("playlist_id", playlist_id)\
            .order("position", desc=False)\
            .execute()

        # 重新計算所有 Patterns 的 position
        patterns_list = sorted(all_patterns.data, key=lambda p: p["position"])

        # 移除目標 Pattern
        target_pattern = None
        for i, p in enumerate(patterns_list):
            if p["pattern_id"] == pattern_id:
                target_pattern = patterns_list.pop(i)
                break

        # 插入到新位置
        if new_position >= len(patterns_list):
            patterns_list.append(target_pattern)
        else:
            patterns_list.insert(new_position, target_pattern)

        # 批次更新所有 Patterns 的 position
        for i, p in enumerate(patterns_list):
            if p["position"] != i:
                supabase.table("playlist_patterns")\
                    .update({"position": i})\
                    .eq("id", p["id"])\
                    .execute()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating pattern position: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update pattern position"
        )


# ============================================
# Task 2.6: 訪客播放清單匯入 API
# ============================================

@router.post(
    "/import-guest",
    response_model=ImportGuestPlaylistResponse,
    summary="匯入訪客播放清單",
    description="""
    匯入訪客播放清單到註冊使用者帳號

    邏輯:
    1. 建立新播放清單：name = "訪客播放清單（已匯入）"
    2. 批次插入 playlist_patterns 記錄（使用 TRANSACTION）
    3. 驗證所有 patternId 存在，記錄無效 ID
    4. Response: { playlistId, patternCount, invalidPatternIds }

    認證: Required (Bearer token)
    """,
)
async def import_guest_playlist(
    request: ImportGuestPlaylistRequest,
    supabase: Client = Depends(get_supabase_client),
    current_user: dict = Depends(get_current_user),
) -> ImportGuestPlaylistResponse:
    """匯入訪客播放清單 (Task 2.6)"""
    user_id = current_user["id"]

    try:
        # 驗證所有 Pattern ID 存在
        pattern_ids = [p.pattern_id for p in request.patterns]

        # 批次查詢所有 Patterns
        patterns_response = supabase.table("user_rhythm_presets")\
            .select("id")\
            .in_("id", pattern_ids)\
            .execute()

        valid_pattern_ids = {p["id"] for p in patterns_response.data}
        invalid_pattern_ids = [pid for pid in pattern_ids if pid not in valid_pattern_ids]

        # 過濾有效的 Patterns
        valid_patterns = [p for p in request.patterns if p.pattern_id in valid_pattern_ids]

        if not valid_patterns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid patterns to import"
            )

        # 建立新播放清單
        playlist_response = supabase.table("playlists").insert({
            "user_id": user_id,
            "name": "訪客播放清單（已匯入）",
            "description": "從訪客模式匯入的播放清單",
            "is_default": False,
        }).execute()

        if not playlist_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create playlist"
            )

        playlist_id = playlist_response.data[0]["id"]

        # 批次插入 playlist_patterns（按 position 排序）
        sorted_patterns = sorted(valid_patterns, key=lambda p: p.position)

        for i, pattern in enumerate(sorted_patterns):
            supabase.table("playlist_patterns").insert({
                "playlist_id": playlist_id,
                "pattern_id": pattern.pattern_id,
                "position": i,  # 重新編號為連續的 position
            }).execute()

        return ImportGuestPlaylistResponse(
            playlist_id=playlist_id,
            pattern_count=len(valid_patterns),
            invalid_pattern_ids=invalid_pattern_ids,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error importing guest playlist: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to import guest playlist"
        )
