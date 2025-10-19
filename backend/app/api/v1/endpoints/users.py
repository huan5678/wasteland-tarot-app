"""
用戶 Profile API 端點

提供用戶資料查詢和更新功能
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, field_validator
import uuid

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.wasteland_card import FactionAlignment
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
