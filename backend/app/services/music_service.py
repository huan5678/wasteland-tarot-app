"""Music track service layer."""

import logging
from typing import List, Optional, Dict, Any
from uuid import UUID

from supabase import Client
from fastapi import HTTPException, status

from app.models.music import (
    MusicTrack,
    MusicTrackCreate,
    MusicTrackUpdate,
    MusicListResponse,
)

logger = logging.getLogger(__name__)


class MusicService:
    """
    音樂管理服務層

    處理音樂 CRUD 操作、配額檢查、Saga Pattern 補償交易。
    """

    def __init__(self, supabase: Client):
        """
        初始化服務

        Args:
            supabase: Supabase 客戶端
        """
        self.supabase = supabase

    async def get_user_music(
        self,
        user_id: UUID,
        page: int = 1,
        limit: int = 20,
    ) -> MusicListResponse:
        """
        查詢使用者音樂庫（含系統音樂）

        邏輯:
        - 查詢使用者音樂（user_id = auth.uid()）
        - 加上系統音樂（is_system = TRUE）
        - 支援分頁

        Args:
            user_id: 使用者 ID
            page: 頁碼（從 1 開始）
            limit: 每頁數量

        Returns:
            MusicListResponse: 音樂清單含分頁資訊

        Raises:
            HTTPException: 查詢失敗時拋出
        """
        try:
            # 計算 offset
            offset = (page - 1) * limit

            # 查詢使用者音樂 + 系統音樂
            response = self.supabase.table("music_tracks") \
                .select("*", count="exact") \
                .or_(f"user_id.eq.{user_id},is_system.eq.true") \
                .order("created_at", desc=True) \
                .range(offset, offset + limit - 1) \
                .execute()

            # 計算總頁數
            total = response.count or 0
            total_pages = (total + limit - 1) // limit

            return MusicListResponse(
                data=response.data,
                pagination={
                    "page": page,
                    "limit": limit,
                    "total": total,
                    "total_pages": total_pages,
                }
            )

        except Exception as e:
            logger.error(f"[MusicService] 查詢音樂失敗: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="查詢音樂失敗",
            )

    async def create_music(
        self,
        user_id: UUID,
        data: MusicTrackCreate,
    ) -> MusicTrack:
        """
        儲存 AI 生成音樂

        邏輯（Saga Pattern）:
        1. 檢查使用者儲存配額（最多 50 首）
        2. 插入音樂至 music_tracks
        3. 若為 AI 生成，更新 user_ai_quotas.used_quota
        4. 若配額更新失敗，刪除已儲存音樂（補償交易）

        Args:
            user_id: 使用者 ID
            data: 音樂資料

        Returns:
            MusicTrack: 建立的音樂

        Raises:
            HTTPException: 配額用盡或儲存失敗時拋出
        """
        music_id = None

        try:
            # Step 1: 檢查儲存配額（最多 50 首）
            count_response = self.supabase.table("music_tracks") \
                .select("id", count="exact") \
                .eq("user_id", str(user_id)) \
                .execute()

            if count_response.count >= 50:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="已達儲存上限（50 首），請刪除舊音樂以建立新音樂",
                )

            # Step 2: 插入音樂
            insert_data = data.model_dump()
            insert_data["user_id"] = str(user_id)
            insert_data["is_system"] = False
            insert_data["parameters"] = data.parameters.model_dump()

            music_response = self.supabase.table("music_tracks") \
                .insert(insert_data) \
                .execute()

            if not music_response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="儲存音樂失敗",
                )

            music_id = music_response.data[0]["id"]
            logger.info(f"[MusicService] 音樂已儲存: {music_id}")

            # Step 3: 更新 AI 配額（若為 AI 生成）
            if data.prompt:  # 有 prompt 表示為 AI 生成
                try:
                    quota_response = self.supabase.table("user_ai_quotas") \
                        .update({"used_quota": self.supabase.raw("used_quota + 1")}) \
                        .eq("user_id", str(user_id)) \
                        .execute()

                    if not quota_response.data:
                        # 補償交易：刪除已儲存的音樂
                        self.supabase.table("music_tracks") \
                            .delete() \
                            .eq("id", music_id) \
                            .execute()

                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="配額更新失敗，已回滾音樂儲存",
                        )

                    logger.info(f"[MusicService] 配額已更新: user_id={user_id}")

                except HTTPException:
                    raise
                except Exception as e:
                    # 補償交易：刪除已儲存的音樂
                    self.supabase.table("music_tracks") \
                        .delete() \
                        .eq("id", music_id) \
                        .execute()

                    logger.error(f"[MusicService] 配額更新失敗，已回滾: {str(e)}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="配額更新失敗，已回滾音樂儲存",
                    )

            return MusicTrack(**music_response.data[0])

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[MusicService] 建立音樂失敗: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="建立音樂失敗",
            )

    async def delete_music(
        self,
        user_id: UUID,
        music_id: UUID,
    ) -> None:
        """
        刪除音樂

        邏輯:
        - 檢查擁有權（RLS 自動處理）
        - 禁止刪除系統音樂（is_system = TRUE）
        - CASCADE DELETE 自動處理 playlist_tracks

        Args:
            user_id: 使用者 ID
            music_id: 音樂 ID

        Raises:
            HTTPException: 刪除失敗或無權限時拋出
        """
        try:
            # 檢查是否為系統音樂
            check_response = self.supabase.table("music_tracks") \
                .select("is_system") \
                .eq("id", str(music_id)) \
                .eq("user_id", str(user_id)) \
                .execute()

            if not check_response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="音樂不存在或無權限",
                )

            if check_response.data[0]["is_system"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="無法刪除系統音樂",
                )

            # 刪除音樂（CASCADE DELETE 自動處理 playlist_tracks）
            delete_response = self.supabase.table("music_tracks") \
                .delete() \
                .eq("id", str(music_id)) \
                .eq("user_id", str(user_id)) \
                .execute()

            if not delete_response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="刪除音樂失敗",
                )

            logger.info(f"[MusicService] 音樂已刪除: {music_id}")

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[MusicService] 刪除音樂失敗: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="刪除音樂失敗",
            )
