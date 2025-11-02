"""
用戶 Profile API 端點

提供用戶資料查詢和更新功能
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, field_validator
import uuid
import httpx
import hashlib
from datetime import datetime

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.core.supabase import get_supabase_client
from app.models.user import User, UserProfile
from app.models.wasteland_card import FactionAlignment
from app.schemas.user import (
    UserTitlesResponse,
    UpdateTitleRequest,
    UpdateTitleResponse
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["users"])


class UpdateProfileRequest(BaseModel):
    """更新用戶 Profile 請求"""
    display_name: Optional[str] = None
    bio: Optional[str] = None
    faction_alignment: Optional[str] = None
    wasteland_location: Optional[str] = None

    @field_validator('faction_alignment')
    @classmethod
    def validate_faction_alignment(cls, v: Optional[str]) -> Optional[str]:
        """驗證陣營值在允許列表中"""
        if v is None:
            return v

        allowed_factions = [faction.value for faction in FactionAlignment]
        if v not in allowed_factions:
            raise ValueError(
                f'無效的陣營選擇。允許的選項: {", ".join(allowed_factions)}'
            )
        return v

    @field_validator('display_name')
    @classmethod
    def validate_display_name(cls, v: Optional[str]) -> Optional[str]:
        """驗證顯示名稱格式"""
        if v is None:
            return v

        if len(v) < 1 or len(v) > 100:
            raise ValueError('顯示名稱長度必須在 1-100 字元之間')

        # 防止 XSS - 移除危險字元
        dangerous_chars = ['<', '>', '{', '}', '\\', '|', '^', '~', '[', ']', '`']
        if any(char in v for char in dangerous_chars):
            raise ValueError('顯示名稱包含不允許的字元')

        return v


class ProfileResponse(BaseModel):
    """用戶 Profile 回應"""
    message: str
    user: Dict[str, Any]


class AvatarUploadResponse(BaseModel):
    """頭像上傳回應"""
    avatar_url: str
    message: str


@router.get("/me/profile", response_model=ProfileResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    取得當前登入用戶的完整 Profile

    需求對應：
    - 允許前端讀取用戶的 faction_alignment 等資訊

    Args:
        current_user: 從 JWT token 中提取的當前用戶
        db: 資料庫 session

    Returns:
        ProfileResponse: 包含用戶完整資料

    Raises:
        HTTPException: 404 - 用戶不存在
    """
    try:
        # 確保用戶存在於資料庫中（重新查詢以獲取最新資料）
        result = await db.execute(
            select(User).where(User.id == current_user.id)
        )
        user = result.scalar_one_or_none()

        if not user:
            logger.error(f"User not found: {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用戶不存在"
            )

        # 構建回應資料
        user_data = {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "display_name": user.display_name,
            "bio": user.bio,
            "avatar_url": user.avatar_url,
            "faction_alignment": user.faction_alignment,
            "karma_score": user.karma_score,
            "wasteland_location": user.wasteland_location,
            "experience_level": user.experience_level,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "is_premium": user.is_premium,
            "total_readings": user.total_readings,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.last_login.isoformat() if user.last_login else None,
        }

        # OAuth 用戶相關欄位
        if user.oauth_provider:
            user_data["oauth_provider"] = user.oauth_provider
            user_data["profile_picture_url"] = user.profile_picture_url

        logger.info(f"Profile retrieved successfully for user: {user.id}")

        return ProfileResponse(
            message="成功取得用戶資料",
            user=user_data
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving user profile: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="取得用戶資料時發生錯誤"
        )


@router.patch("/me/profile", response_model=ProfileResponse)
async def update_user_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    更新當前登入用戶的 Profile

    需求對應：
    - 允許用戶更新 faction_alignment（陣營選擇）
    - 允許更新其他 profile 欄位（顯示名稱、簡介等）

    Args:
        request: 更新請求資料
        current_user: 從 JWT token 中提取的當前用戶
        db: 資料庫 session

    Returns:
        ProfileResponse: 包含更新後的用戶資料

    Raises:
        HTTPException: 404 - 用戶不存在
        HTTPException: 400 - 無效的更新資料
    """
    try:
        # 確保用戶存在於資料庫中
        result = await db.execute(
            select(User).where(User.id == current_user.id)
        )
        user = result.scalar_one_or_none()

        if not user:
            logger.error(f"User not found for update: {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用戶不存在"
            )

        # 記錄更新前的狀態
        updated_fields = []

        # 更新允許的欄位
        if request.display_name is not None:
            user.display_name = request.display_name
            updated_fields.append("display_name")

        if request.bio is not None:
            user.bio = request.bio
            updated_fields.append("bio")

        if request.faction_alignment is not None:
            user.faction_alignment = request.faction_alignment
            updated_fields.append("faction_alignment")
            logger.info(f"User {user.id} changed faction to: {request.faction_alignment}")

        if request.wasteland_location is not None:
            user.wasteland_location = request.wasteland_location
            updated_fields.append("wasteland_location")

        # 如果沒有任何欄位需要更新
        if not updated_fields:
            logger.info(f"No fields to update for user: {user.id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="沒有提供需要更新的欄位"
            )

        # 提交更新
        await db.commit()
        await db.refresh(user)

        logger.info(f"Profile updated successfully for user {user.id}. Updated fields: {', '.join(updated_fields)}")

        # 構建回應資料
        user_data = {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "display_name": user.display_name,
            "bio": user.bio,
            "avatar_url": user.avatar_url,
            "faction_alignment": user.faction_alignment,
            "karma_score": user.karma_score,
            "wasteland_location": user.wasteland_location,
            "experience_level": user.experience_level,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "is_premium": user.is_premium,
            "total_readings": user.total_readings,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.last_login.isoformat() if user.last_login else None,
        }

        # OAuth 用戶相關欄位
        if user.oauth_provider:
            user_data["oauth_provider"] = user.oauth_provider
            user_data["profile_picture_url"] = user.profile_picture_url

        return ProfileResponse(
            message=f"成功更新用戶資料 ({', '.join(updated_fields)})",
            user=user_data
        )

    except HTTPException:
        raise
    except ValueError as e:
        # Pydantic 驗證錯誤
        logger.warning(f"Validation error updating profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating user profile: {str(e)}", exc_info=True)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="更新用戶資料時發生錯誤"
        )


# ==================== 頭像上傳 API ====================

# 允許的圖片 MIME types
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif"
}

# 最大檔案大小（5 MB）
MAX_FILE_SIZE = 5 * 1024 * 1024


@router.post("/avatar", response_model=AvatarUploadResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    上傳使用者頭像到 Supabase Storage

    流程：
    1. 驗證檔案類型（MIME type）
    2. 驗證檔案大小（最大 5 MB）
    3. 生成唯一的檔案名稱
    4. 上傳到 Supabase Storage 的 'avatars' bucket
    5. 刪除舊頭像（如果存在且不是 OAuth 頭像）
    6. 更新 users 表的 avatar_url
    7. 返回新的頭像 URL

    Args:
        file: 上傳的圖片檔案
        current_user: 當前登入用戶
        db: 資料庫 session

    Returns:
        AvatarUploadResponse: 包含新的頭像 URL

    Raises:
        HTTPException:
            - 400: 檔案類型不符、檔案過大、無檔案上傳
            - 500: Storage 上傳失敗、資料庫更新失敗
    """
    try:
        # 步驟 1: 驗證檔案類型
        if not file.content_type or file.content_type not in ALLOWED_MIME_TYPES:
            logger.warning(f"Invalid file type: {file.content_type}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"不支援的檔案類型。允許的類型: {', '.join(ALLOWED_MIME_TYPES)}"
            )

        # 步驟 2: 驗證檔案大小（讀取並檢查）
        file_content = await file.read()
        file_size = len(file_content)

        if file_size > MAX_FILE_SIZE:
            logger.warning(f"File too large: {file_size} bytes (max: {MAX_FILE_SIZE})")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"檔案過大。最大允許大小: {MAX_FILE_SIZE / (1024 * 1024):.1f} MB"
            )

        if file_size == 0:
            logger.warning("Empty file uploaded")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="檔案為空，請上傳有效的圖片檔案"
            )

        # 步驟 3: 生成唯一的檔案名稱
        # 格式: {user_id}_{timestamp}_{hash}.{ext}
        timestamp = int(datetime.utcnow().timestamp())
        file_hash = hashlib.md5(file_content).hexdigest()[:8]
        file_ext = file.content_type.split("/")[-1]
        if file_ext == "jpeg":
            file_ext = "jpg"

        file_name = f"{current_user.id}_{timestamp}_{file_hash}.{file_ext}"
        file_path = file_name  # 不需要 "avatars/" 前綴，Supabase SDK 會自動處理

        logger.info(f"Uploading avatar for user {current_user.id}: {file_path}")

        # 步驟 4: 上傳到 Supabase Storage
        supabase = get_supabase_client()

        try:
            # 上傳檔案到 'avatars' bucket
            upload_response = supabase.storage.from_("avatars").upload(
                path=file_path,
                file=file_content,
                file_options={
                    "content-type": file.content_type,
                    "upsert": "false"  # 不覆蓋同名檔案（檔名已唯一）
                }
            )

            logger.info(f"Avatar uploaded successfully: {file_path}")

        except Exception as upload_error:
            logger.error(f"Supabase Storage upload failed: {str(upload_error)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="頭像上傳失敗，請稍後再試"
            )

        # 步驟 5: 獲取公開 URL
        try:
            public_url = supabase.storage.from_("avatars").get_public_url(file_path)
            logger.info(f"Avatar public URL: {public_url}")

        except Exception as url_error:
            logger.error(f"Failed to get public URL: {str(url_error)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="無法獲取頭像 URL"
            )

        # 步驟 6: 刪除舊頭像（如果存在且不是 OAuth 頭像）
        old_avatar_url = current_user.avatar_url
        if old_avatar_url:
            # 判斷是否為 Supabase Storage 的頭像（不刪除 Google OAuth 頭像）
            if "supabase" in old_avatar_url and "/avatars/" in old_avatar_url:
                try:
                    # 提取舊檔案路徑（移除 query parameters）
                    old_file_path = old_avatar_url.split("/avatars/")[-1].split("?")[0]

                    # 刪除舊檔案
                    supabase.storage.from_("avatars").remove([old_file_path])
                    logger.info(f"Deleted old avatar: {old_file_path}")

                except Exception as delete_error:
                    # 刪除失敗不影響上傳流程
                    logger.warning(f"Failed to delete old avatar (non-fatal): {str(delete_error)}")

        # 步驟 7: 更新資料庫
        try:
            result = await db.execute(
                select(User).where(User.id == current_user.id)
            )
            user = result.scalar_one_or_none()

            if not user:
                logger.error(f"User not found for avatar update: {current_user.id}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="使用者不存在"
                )

            user.avatar_url = public_url
            await db.commit()
            await db.refresh(user)

            logger.info(f"Avatar URL updated in database for user {current_user.id}")

        except HTTPException:
            raise
        except Exception as db_error:
            await db.rollback()
            logger.error(f"Database update failed: {str(db_error)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="更新用戶資料失敗"
            )

        # 步驟 8: 返回結果
        return AvatarUploadResponse(
            avatar_url=public_url,
            message="頭像上傳成功"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Avatar upload error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="頭像上傳時發生錯誤"
        )


# ==================== 稱號管理 API ====================

@router.get("/me/titles", response_model=UserTitlesResponse)
async def get_user_titles(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    取得當前使用者的所有已解鎖稱號

    需求對應：
    - 回傳使用者當前使用的稱號
    - 回傳使用者已解鎖的所有稱號列表

    Args:
        current_user: 從 JWT token 中提取的當前用戶
        db: 資料庫 session

    Returns:
        UserTitlesResponse: 包含當前稱號和已解鎖稱號列表

    Raises:
        HTTPException: 500 - 資料庫查詢失敗
    """
    try:
        # 查詢用戶的 Profile
        result = await db.execute(
            select(UserProfile).where(UserProfile.user_id == current_user.id)
        )
        profile = result.scalar_one_or_none()

        # 如果沒有 Profile，回傳空資料
        if not profile:
            logger.info(f"No profile found for user {current_user.id}, returning empty titles")
            return UserTitlesResponse(
                current_title=None,
                unlocked_titles=[]
            )

        # 確保 unlocked_titles 是 list 類型
        unlocked_titles = profile.unlocked_titles if profile.unlocked_titles else []

        logger.info(f"Retrieved titles for user {current_user.id}: {len(unlocked_titles)} unlocked")

        return UserTitlesResponse(
            current_title=profile.current_title,
            unlocked_titles=unlocked_titles
        )

    except Exception as e:
        logger.error(f"Error retrieving user titles: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="取得稱號資料時發生錯誤"
        )


@router.put("/me/title", response_model=UpdateTitleResponse)
async def update_user_title(
    request: UpdateTitleRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    設定或取消當前稱號

    需求對應：
    - 允許使用者設定已解鎖的稱號為當前稱號
    - 允許使用者取消當前稱號（設為 null）
    - 驗證：只能設定已解鎖的稱號

    Args:
        request: 更新稱號請求（包含 title 欄位）
        current_user: 從 JWT token 中提取的當前用戶
        db: 資料庫 session

    Returns:
        UpdateTitleResponse: 包含更新結果、新的當前稱號和訊息

    Raises:
        HTTPException:
            - 400: 稱號未解鎖或無效
            - 404: 用戶 Profile 不存在
            - 500: 資料庫更新失敗
    """
    try:
        # 查詢用戶的 Profile
        result = await db.execute(
            select(UserProfile).where(UserProfile.user_id == current_user.id)
        )
        profile = result.scalar_one_or_none()

        # 如果沒有 Profile，先創建一個
        if not profile:
            profile = UserProfile(
                user_id=current_user.id,
                current_title=None,
                unlocked_titles=[]
            )
            db.add(profile)
            logger.info(f"Created new profile for user {current_user.id}")

        # 確保 unlocked_titles 是 list 類型
        if not profile.unlocked_titles:
            profile.unlocked_titles = []

        # 如果 request.title 是 None，表示取消稱號
        if request.title is None:
            profile.current_title = None
            await db.commit()
            await db.refresh(profile)

            logger.info(f"User {current_user.id} removed current title")

            return UpdateTitleResponse(
                success=True,
                current_title=None,
                message="已取消當前稱號"
            )

        # 驗證稱號是否已解鎖
        if request.title not in profile.unlocked_titles:
            logger.warning(f"User {current_user.id} attempted to set un-unlocked title: {request.title}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"稱號 '{request.title}' 尚未解鎖，無法設定"
            )

        # 設定新的當前稱號
        profile.current_title = request.title
        await db.commit()
        await db.refresh(profile)

        logger.info(f"User {current_user.id} set current title to: {request.title}")

        return UpdateTitleResponse(
            success=True,
            current_title=profile.current_title,
            message=f"已成功設定稱號為「{request.title}」"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user title: {str(e)}", exc_info=True)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="更新稱號時發生錯誤"
        )
