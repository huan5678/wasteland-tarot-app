"""
Share endpoints - 占卜結果分享功能

Provides endpoints for generating share links and accessing shared reading results.

TDD Green Phase: 實作 API endpoints

Endpoints:
- POST /readings/{reading_id}/share - 生成分享連結 (需登入)
- GET /share/{share_token} - 獲取分享結果 (無需登入)
"""

from uuid import UUID
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.services.share_service import ShareService


router = APIRouter()


@router.post("/readings/{reading_id}/share", response_model=Dict[str, Any])
async def create_share_link(
    reading_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    生成或獲取占卜結果的分享連結

    需要登入，且只能分享自己的占卜。

    **權限:**
    - 需要登入
    - 必須是占卜的擁有者

    **冪等性:**
    - 重複呼叫會返回相同的 share_token

    **Args:**
    - reading_id: 占卜 ID (UUID)

    **Returns:**
    - share_token: 分享 token (UUID v4)
    - share_url: 完整的分享 URL
    - created_at: 占卜建立時間

    **Errors:**
    - 401: 未登入
    - 403: 不是占卜的擁有者
    - 404: Reading 不存在
    """
    share_service = ShareService(db)

    try:
        result = await share_service.generate_share_link(reading_id, current_user.id)
        return result
    except HTTPException:
        # Re-raise HTTP exceptions from service
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate share link: {str(e)}")


@router.get("/share/{share_token}", response_model=Dict[str, Any])
async def get_shared_reading(
    share_token: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    獲取公開的占卜結果

    **無需登入** - 任何人都可以用 share_token 查看占卜結果。

    **隱私保護:**
    - 自動過濾私密欄位 (user_id, user_email 等)
    - 只返回公開資料

    **Args:**
    - share_token: 分享 token (UUID)

    **Returns:**
    - reading_id: 占卜 ID
    - question: 占卜問題
    - character_voice_used: 使用的角色聲音
    - karma_context: 業力背景
    - overall_interpretation: 整體解讀
    - summary_message: 總結訊息
    - created_at: 占卜時間

    **不返回:**
    - user_id
    - user (relationship)

    **Errors:**
    - 404: Share link 不存在
    - 422: Token 格式錯誤 (FastAPI 自動驗證)
    """
    share_service = ShareService(db)

    try:
        result = await share_service.get_public_reading_data(share_token)
        return result
    except HTTPException:
        # Re-raise HTTP exceptions from service
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get shared reading: {str(e)}")
