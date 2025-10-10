"""
Sessions API Endpoints - Reading Save & Resume Feature

FastAPI routes for managing incomplete reading sessions with automatic saving,
offline sync, and multi-device conflict resolution.
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.session_service import SessionService
from app.schemas.sessions import (
    SessionCreateSchema,
    SessionUpdateSchema,
    SessionResponseSchema,
    SessionMetadataSchema,
    OfflineSessionSchema,
    ConflictResolutionSchema,
)
from app.core.exceptions import (
    UserNotFoundError,
    InvalidRequestError,
    ConflictError,
)

router = APIRouter()


@router.post(
    "",
    response_model=SessionResponseSchema,
    status_code=status.HTTP_201_CREATED,
    summary="建立新的占卜會話",
    description="建立一個新的未完成占卜會話，可以稍後恢復繼續",
    responses={
        201: {"description": "會話成功建立"},
        400: {"description": "請求資料無效"},
        401: {"description": "未授權"},
        404: {"description": "使用者不存在"},
        500: {"description": "伺服器錯誤"},
    }
)
async def create_session(
    session_data: SessionCreateSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> SessionResponseSchema:
    """
    建立新的占卜會話

    - **user_id**: 建立會話的使用者 UUID（從 JWT token 自動填入）
    - **spread_type**: 塔羅牌陣類型
    - **question**: 使用者的問題
    - **session_state**: 會話當前狀態（已抽取的卡牌等）
    """
    # Override user_id with authenticated user
    session_data.user_id = current_user.id

    service = SessionService(db)

    try:
        session = await service.create_session(session_data)
        return session
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except InvalidRequestError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"建立會話失敗: {str(e)}"
        )


@router.get(
    "",
    response_model=dict,
    summary="列出使用者的未完成會話",
    description="取得目前使用者所有未完成的占卜會話列表，支援分頁與狀態篩選",
    responses={
        200: {"description": "成功取得會話列表"},
        401: {"description": "未授權"},
        500: {"description": "伺服器錯誤"},
    }
)
async def list_sessions(
    limit: int = Query(default=10, ge=1, le=100, description="每頁回傳的會話數量"),
    offset: int = Query(default=0, ge=0, description="分頁偏移量"),
    status_filter: Optional[str] = Query(default=None, description="狀態篩選 (active, paused, complete)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    列出未完成會話

    回傳輕量級的會話 metadata（不包含完整 session_state），
    按 updated_at 降序排序。
    """
    service = SessionService(db)

    try:
        sessions, total_count = await service.list_incomplete_sessions(
            user_id=current_user.id,
            limit=limit,
            offset=offset,
            status=status_filter
        )

        return {
            "sessions": sessions,
            "total": total_count,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"取得會話列表失敗: {str(e)}"
        )


@router.get(
    "/{session_id}",
    response_model=SessionResponseSchema,
    summary="取得完整會話狀態",
    description="取得指定會話的完整狀態，包含所有 session_state 資料",
    responses={
        200: {"description": "成功取得會話"},
        401: {"description": "未授權"},
        404: {"description": "會話不存在"},
        500: {"description": "伺服器錯誤"},
    }
)
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> SessionResponseSchema:
    """
    取得完整會話狀態

    回傳會話的完整資料，包含 session_state、spread_config 等大型欄位。
    用於恢復會話時載入完整狀態。
    """
    service = SessionService(db)

    try:
        session = await service.get_session(session_id)

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"找不到會話 ID: {session_id}"
            )

        # Verify ownership
        if session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="您沒有權限存取此會話"
            )

        return session
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"取得會話失敗: {str(e)}"
        )


@router.patch(
    "/{session_id}",
    response_model=SessionResponseSchema,
    summary="更新會話狀態（自動儲存）",
    description="更新會話的部分或全部狀態，支援時間戳衝突檢測",
    responses={
        200: {"description": "成功更新會話"},
        400: {"description": "請求資料無效"},
        401: {"description": "未授權"},
        404: {"description": "會話不存在"},
        409: {"description": "會話衝突（其他裝置已修改）"},
        500: {"description": "伺服器錯誤"},
    }
)
async def update_session(
    session_id: str,
    update_data: SessionUpdateSchema,
    expected_updated_at: Optional[datetime] = Query(
        default=None,
        description="預期的 updated_at 時間戳（用於衝突檢測）"
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> SessionResponseSchema:
    """
    更新會話（自動儲存功能的核心端點）

    - 支援部分更新（只更新提供的欄位）
    - 如果提供 expected_updated_at，會檢查時間戳衝突
    - 衝突時回傳 409 狀態碼，client 需要處理衝突解決
    """
    service = SessionService(db)

    try:
        # First verify session exists and user owns it
        session = await service.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"找不到會話 ID: {session_id}"
            )

        if session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="您沒有權限修改此會話"
            )

        # Update session with conflict detection
        updated_session = await service.update_session(
            session_id=session_id,
            update_data=update_data,
            expected_updated_at=expected_updated_at
        )

        return updated_session

    except ConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except InvalidRequestError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新會話失敗: {str(e)}"
        )


@router.delete(
    "/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="刪除會話",
    description="永久刪除指定的占卜會話",
    responses={
        204: {"description": "成功刪除會話"},
        401: {"description": "未授權"},
        404: {"description": "會話不存在"},
        500: {"description": "伺服器錯誤"},
    }
)
async def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    刪除會話

    永久刪除指定會話並清除快取。
    用於使用者手動刪除不需要的會話。
    """
    service = SessionService(db)

    try:
        # Verify ownership
        session = await service.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"找不到會話 ID: {session_id}"
            )

        if session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="您沒有權限刪除此會話"
            )

        # Delete session
        await service.delete_session(session_id)

        return None  # 204 No Content

    except InvalidRequestError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"刪除會話失敗: {str(e)}"
        )


@router.post(
    "/{session_id}/complete",
    response_model=dict,
    summary="完成會話（轉換為已完成占卜）",
    description="將未完成會話標記為完成，並轉換為 Reading 記錄",
    responses={
        200: {"description": "成功完成會話"},
        401: {"description": "未授權"},
        404: {"description": "會話不存在"},
        400: {"description": "會話已完成"},
        500: {"description": "伺服器錯誤"},
    }
)
async def complete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    完成會話

    將未完成會話轉換為已完成的 Reading 記錄，
    並保留所有會話資料到占卜歷史。
    """
    service = SessionService(db)

    try:
        # Verify ownership
        session = await service.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"找不到會話 ID: {session_id}"
            )

        if session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="您沒有權限完成此會話"
            )

        # Complete session
        result = await service.complete_session(session_id)

        return result

    except InvalidRequestError as e:
        if "already completed" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"完成會話失敗: {str(e)}"
        )


@router.post(
    "/sync",
    response_model=dict,
    summary="同步離線會話",
    description="將離線建立的會話同步到伺服器，處理 ID 重新對應與衝突解決",
    responses={
        200: {"description": "成功同步會話"},
        400: {"description": "同步資料無效"},
        401: {"description": "未授權"},
        409: {"description": "檢測到衝突，需要解決"},
        500: {"description": "伺服器錯誤"},
    }
)
async def sync_offline_session(
    offline_data: OfflineSessionSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    同步離線會話

    處理在離線狀態下建立的會話同步到伺服器：
    - 將 client_id 重新對應到 server 產生的 UUID
    - 檢測衝突（基於時間戳與會話特徵）
    - 回傳衝突資訊供 client 解決
    """
    # Override user_id with authenticated user
    offline_data.user_id = current_user.id

    service = SessionService(db)

    try:
        session, conflicts = await service.sync_offline_session(offline_data)

        if conflicts:
            # Conflicts detected, return conflict information
            return {
                "status": "conflict",
                "session": session,
                "conflicts": conflicts,
                "client_id": offline_data.client_id,
                "server_id": session.id
            }

        # No conflicts, successful sync
        return {
            "status": "synced",
            "session": session,
            "client_id": offline_data.client_id,
            "server_id": session.id
        }

    except InvalidRequestError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"同步會話失敗: {str(e)}"
        )


@router.post(
    "/resolve-conflict",
    response_model=SessionResponseSchema,
    summary="解決會話衝突",
    description="使用指定策略解決多裝置同步衝突",
    responses={
        200: {"description": "成功解決衝突"},
        400: {"description": "解決方案資料無效"},
        401: {"description": "未授權"},
        404: {"description": "會話不存在"},
        500: {"description": "伺服器錯誤"},
    }
)
async def resolve_conflict(
    resolution_data: ConflictResolutionSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> SessionResponseSchema:
    """
    解決會話衝突

    支援三種解決策略：
    - **last-write-wins**: 使用最新時間戳的資料
    - **server-wins**: 始終使用伺服器資料
    - **client-wins**: 始終使用客戶端資料
    """
    # Override user_id in client_data
    resolution_data.client_data.user_id = current_user.id

    service = SessionService(db)

    try:
        # Verify ownership
        session = await service.get_session(resolution_data.session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"找不到會話 ID: {resolution_data.session_id}"
            )

        if session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="您沒有權限解決此會話的衝突"
            )

        # Resolve conflict
        resolved_session = await service.resolve_conflict(resolution_data)

        return resolved_session

    except InvalidRequestError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"解決衝突失敗: {str(e)}"
        )
