"""Playlist service layer."""

import logging
from typing import List, Optional
from uuid import UUID

from supabase import Client
from fastapi import HTTPException, status

from app.models.music import (
    Playlist,
    PlaylistCreate,
    PlaylistUpdate,
    PlaylistResponse,
    AddTrackRequest,
    ReorderTracksRequest,
)

logger = logging.getLogger(__name__)


class PlaylistService:
    """
    播放清單管理服務層

    處理播放清單 CRUD、音樂管理、順序調整。
    """

    def __init__(self, supabase: Client):
        """
        初始化服務

        Args:
            supabase: Supabase 客戶端
        """
        self.supabase = supabase

    async def get_user_playlists(
        self,
        user_id: UUID,
    ) -> List[PlaylistResponse]:
        """
        查詢使用者所有播放清單（最多 5 個）

        邏輯:
        - JOIN playlist_tracks 和 music_tracks
        - 排序: 預設播放清單優先 (is_default = TRUE)，其次按建立時間降序

        Args:
            user_id: 使用者 ID

        Returns:
            List[PlaylistResponse]: 播放清單列表

        Raises:
            HTTPException: 查詢失敗時拋出
        """
        try:
            # 查詢播放清單（含完整歌曲資訊）
            response = self.supabase.table("playlists") \
                .select("""
                    *,
                    playlist_tracks (
                        id,
                        track_id,
                        position,
                        added_at,
                        music_tracks (*)
                    )
                """) \
                .eq("user_id", str(user_id)) \
                .order("is_default", desc=True) \
                .order("created_at", desc=True) \
                .execute()

            # 轉換資料格式
            playlists = []
            for playlist_data in response.data:
                # 提取 tracks（按 position 排序）
                tracks = []
                if playlist_data.get("playlist_tracks"):
                    track_list = sorted(
                        playlist_data["playlist_tracks"],
                        key=lambda x: x["position"]
                    )
                    tracks = [t["music_tracks"] for t in track_list]

                playlists.append(
                    PlaylistResponse(
                        **{**playlist_data, "tracks": tracks},
                        track_count=len(tracks)
                    )
                )

            return playlists

        except Exception as e:
            logger.error(f"[PlaylistService] 查詢播放清單失敗: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="查詢播放清單失敗",
            )

    async def create_playlist(
        self,
        user_id: UUID,
        data: PlaylistCreate,
    ) -> Playlist:
        """
        建立播放清單

        邏輯:
        - 檢查數量限制（最多 5 個）
        - 插入播放清單

        Args:
            user_id: 使用者 ID
            data: 播放清單資料

        Returns:
            Playlist: 建立的播放清單

        Raises:
            HTTPException: 超過限制或建立失敗時拋出
        """
        try:
            # 檢查數量限制
            count_response = self.supabase.table("playlists") \
                .select("id", count="exact") \
                .eq("user_id", str(user_id)) \
                .execute()

            if count_response.count >= 5:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="已達播放清單上限（5 個），請刪除現有播放清單後再建立",
                )

            # 插入播放清單
            insert_data = data.model_dump()
            insert_data["user_id"] = str(user_id)
            insert_data["is_default"] = False

            response = self.supabase.table("playlists") \
                .insert(insert_data) \
                .execute()

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="建立播放清單失敗",
                )

            logger.info(f"[PlaylistService] 播放清單已建立: {response.data[0]['id']}")

            return Playlist(**response.data[0])

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[PlaylistService] 建立播放清單失敗: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="建立播放清單失敗",
            )

    async def update_playlist(
        self,
        user_id: UUID,
        playlist_id: UUID,
        data: PlaylistUpdate,
    ) -> Playlist:
        """
        重新命名播放清單

        Args:
            user_id: 使用者 ID
            playlist_id: 播放清單 ID
            data: 更新資料

        Returns:
            Playlist: 更新後的播放清單

        Raises:
            HTTPException: 更新失敗或無權限時拋出
        """
        try:
            # 更新播放清單
            update_data = data.model_dump(exclude_unset=True)

            response = self.supabase.table("playlists") \
                .update(update_data) \
                .eq("id", str(playlist_id)) \
                .eq("user_id", str(user_id)) \
                .execute()

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="播放清單不存在或無權限",
                )

            logger.info(f"[PlaylistService] 播放清單已更新: {playlist_id}")

            return Playlist(**response.data[0])

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[PlaylistService] 更新播放清單失敗: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="更新播放清單失敗",
            )

    async def delete_playlist(
        self,
        user_id: UUID,
        playlist_id: UUID,
    ) -> None:
        """
        刪除播放清單

        邏輯:
        - 檢查擁有權
        - 禁止刪除預設播放清單（is_default = TRUE）
        - CASCADE DELETE 自動處理 playlist_tracks

        Args:
            user_id: 使用者 ID
            playlist_id: 播放清單 ID

        Raises:
            HTTPException: 刪除失敗或無權限時拋出
        """
        try:
            # 檢查是否為預設播放清單
            check_response = self.supabase.table("playlists") \
                .select("is_default") \
                .eq("id", str(playlist_id)) \
                .eq("user_id", str(user_id)) \
                .execute()

            if not check_response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="播放清單不存在或無權限",
                )

            if check_response.data[0]["is_default"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="無法刪除預設播放清單",
                )

            # 刪除播放清單
            delete_response = self.supabase.table("playlists") \
                .delete() \
                .eq("id", str(playlist_id)) \
                .eq("user_id", str(user_id)) \
                .execute()

            if not delete_response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="刪除播放清單失敗",
                )

            logger.info(f"[PlaylistService] 播放清單已刪除: {playlist_id}")

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[PlaylistService] 刪除播放清單失敗: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="刪除播放清單失敗",
            )

    async def add_track(
        self,
        user_id: UUID,
        playlist_id: UUID,
        data: AddTrackRequest,
    ) -> None:
        """
        加入音樂至播放清單

        邏輯:
        - 檢查重複（409 Conflict）
        - 計算 position（MAX + 1）

        Args:
            user_id: 使用者 ID
            playlist_id: 播放清單 ID
            data: 加入請求資料

        Raises:
            HTTPException: 加入失敗或重複時拋出
        """
        try:
            # 檢查播放清單擁有權
            playlist_check = self.supabase.table("playlists") \
                .select("id") \
                .eq("id", str(playlist_id)) \
                .eq("user_id", str(user_id)) \
                .execute()

            if not playlist_check.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="播放清單不存在或無權限",
                )

            # 檢查是否已存在
            exists_check = self.supabase.table("playlist_tracks") \
                .select("id") \
                .eq("playlist_id", str(playlist_id)) \
                .eq("track_id", str(data.track_id)) \
                .execute()

            if exists_check.data:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="此歌曲已在播放清單中",
                )

            # 計算新的 position
            max_position_response = self.supabase.table("playlist_tracks") \
                .select("position") \
                .eq("playlist_id", str(playlist_id)) \
                .order("position", desc=True) \
                .limit(1) \
                .execute()

            max_position = 0
            if max_position_response.data:
                max_position = max_position_response.data[0]["position"]

            # 插入關聯
            insert_response = self.supabase.table("playlist_tracks") \
                .insert({
                    "playlist_id": str(playlist_id),
                    "track_id": str(data.track_id),
                    "position": max_position + 1,
                }) \
                .execute()

            if not insert_response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="加入音樂失敗",
                )

            logger.info(f"[PlaylistService] 音樂已加入播放清單: {data.track_id} -> {playlist_id}")

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[PlaylistService] 加入音樂失敗: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="加入音樂失敗",
            )

    async def remove_track(
        self,
        user_id: UUID,
        playlist_id: UUID,
        track_id: UUID,
    ) -> None:
        """
        從播放清單移除音樂

        邏輯:
        - 刪除關聯
        - 重新計算剩餘音樂的 position（保持連續）

        Args:
            user_id: 使用者 ID
            playlist_id: 播放清單 ID
            track_id: 音樂 ID

        Raises:
            HTTPException: 移除失敗或無權限時拋出
        """
        try:
            # 檢查播放清單擁有權
            playlist_check = self.supabase.table("playlists") \
                .select("id") \
                .eq("id", str(playlist_id)) \
                .eq("user_id", str(user_id)) \
                .execute()

            if not playlist_check.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="播放清單不存在或無權限",
                )

            # 刪除關聯
            delete_response = self.supabase.table("playlist_tracks") \
                .delete() \
                .eq("playlist_id", str(playlist_id)) \
                .eq("track_id", str(track_id)) \
                .execute()

            if not delete_response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="音樂不在此播放清單中",
                )

            # TODO: 重新計算 position（需要複雜的 SQL 或多次請求）
            # 目前先不實作，前端可以容忍 position 不連續

            logger.info(f"[PlaylistService] 音樂已從播放清單移除: {track_id} <- {playlist_id}")

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[PlaylistService] 移除音樂失敗: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="移除音樂失敗",
            )

    async def reorder_tracks(
        self,
        user_id: UUID,
        playlist_id: UUID,
        data: ReorderTracksRequest,
    ) -> None:
        """
        調整播放清單音樂順序

        邏輯:
        - 批次更新 playlist_tracks.position

        Args:
            user_id: 使用者 ID
            playlist_id: 播放清單 ID
            data: 調整順序請求資料

        Raises:
            HTTPException: 調整失敗或無權限時拋出
        """
        try:
            # 檢查播放清單擁有權
            playlist_check = self.supabase.table("playlists") \
                .select("id") \
                .eq("id", str(playlist_id)) \
                .eq("user_id", str(user_id)) \
                .execute()

            if not playlist_check.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="播放清單不存在或無權限",
                )

            # 批次更新 position（使用多次請求）
            for idx, track_id in enumerate(data.track_ids):
                update_response = self.supabase.table("playlist_tracks") \
                    .update({"position": idx + 1}) \
                    .eq("playlist_id", str(playlist_id)) \
                    .eq("track_id", str(track_id)) \
                    .execute()

                if not update_response.data:
                    logger.warning(
                        f"[PlaylistService] 更新 position 失敗: track_id={track_id}"
                    )

            logger.info(f"[PlaylistService] 播放清單順序已調整: {playlist_id}")

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[PlaylistService] 調整順序失敗: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="調整順序失敗",
            )
