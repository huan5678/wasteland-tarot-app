"""
Wishlist API Endpoints - User Wish Management System

Provides 7 RESTful endpoints for user wish submission and admin management:
- User endpoints (3): GET, POST, PUT /api/v1/wishlist
- Admin endpoints (4): GET, PUT /api/v1/wishlist/admin/*

Requirements: R1-R6 (Wishlist Feature)
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.wishlist import (
    WishCreate,
    WishUpdate,
    WishResponse,
    AdminReplyRequest,
    AdminWishListResponse
)
from app.services.wishlist_service import WishlistService
from app.services.content_validator import ContentEmptyError, ContentTooLongError
from app.core.exceptions import (
    AlreadySubmittedTodayError,
    EditNotAllowedError,
    WishNotFoundError,
    UnauthorizedError
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# ===== User Endpoints (Task 3.1) =====


@router.get("", response_model=List[WishResponse])
async def get_user_wishes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    取得當前使用者的願望列表（未隱藏）

    Business Rules:
    - 僅回傳 is_hidden = false 的願望
    - 按 created_at 降序排列（最新的在最上方）
    - 使用 JWT 驗證使用者身份

    Returns:
        List[WishResponse]: 願望列表

    Requirements:
        - R2.1, R2.2: 願望歷史查詢功能
    """
    try:
        service = WishlistService()
        wishes = await service.get_user_wishes(current_user.id, db)

        logger.info(f"Retrieved {len(wishes)} wishes for user {current_user.id}")
        return wishes

    except Exception as e:
        logger.error(f"Error retrieving wishes for user {current_user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="取得願望列表時發生錯誤"
        )


@router.post("", response_model=WishResponse, status_code=status.HTTP_201_CREATED)
async def create_wish(
    wish_create: WishCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    提交新願望

    Business Rules:
    - 每日限制：每位使用者每天（UTC+8）只能提交一則願望
    - 內容驗證：純文字長度 1-500 字（移除 Markdown 語法後）
    - 自動設定：has_been_edited = false, is_hidden = false

    Args:
        wish_create: 願望內容（Markdown 格式）

    Returns:
        WishResponse: 新建立的願望

    Raises:
        HTTPException:
            - 409: 今日已提交願望
            - 400: 內容為空或超過長度限制

    Requirements:
        - R1: 願望提交功能
        - R9: 時區處理（UTC+8）
    """
    service = WishlistService()

    try:
        wish = await service.create_wish(current_user.id, wish_create.content, db)

        logger.info(f"User {current_user.id} created wish {wish.id}")
        return wish

    except AlreadySubmittedTodayError:
        logger.warning(f"User {current_user.id} attempted to submit multiple wishes today")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="今日已提交願望，明日再來許願吧"
        )

    except ContentTooLongError as e:
        logger.warning(f"User {current_user.id} submitted content too long: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    except ContentEmptyError:
        logger.warning(f"User {current_user.id} submitted empty content")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="願望內容不可為空"
        )

    except Exception as e:
        logger.error(f"Error creating wish for user {current_user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="提交願望時發生錯誤"
        )


@router.put("/{wish_id}", response_model=WishResponse)
async def update_wish(
    wish_id: UUID,
    wish_update: WishUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    編輯願望內容

    Business Rules:
    - 編輯條件：無管理員回覆 AND has_been_edited = false
    - 編輯後：has_been_edited 設為 true（永久鎖定，無法再次編輯）
    - 權限檢查：只能編輯自己的願望

    Args:
        wish_id: 願望 ID
        wish_update: 新內容（Markdown 格式）

    Returns:
        WishResponse: 更新後的願望

    Raises:
        HTTPException:
            - 404: 願望未找到
            - 403: 無權限編輯（已有回覆、已編輯過、或非擁有者）
            - 400: 內容為空或超過長度限制

    Requirements:
        - R3: 願望編輯功能
    """
    service = WishlistService()

    try:
        wish = await service.update_wish(wish_id, current_user.id, wish_update.content, db)

        logger.info(f"User {current_user.id} updated wish {wish_id}")
        return wish

    except WishNotFoundError:
        logger.warning(f"User {current_user.id} attempted to update non-existent wish {wish_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="願望未找到"
        )

    except UnauthorizedError as e:
        logger.warning(f"User {current_user.id} unauthorized to update wish {wish_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )

    except EditNotAllowedError as e:
        logger.warning(f"User {current_user.id} attempted to edit locked wish {wish_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )

    except ContentTooLongError as e:
        logger.warning(f"User {current_user.id} submitted content too long for wish {wish_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    except ContentEmptyError:
        logger.warning(f"User {current_user.id} submitted empty content for wish {wish_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="願望內容不可為空"
        )

    except Exception as e:
        logger.error(f"Error updating wish {wish_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="更新願望時發生錯誤"
        )


# ===== Admin Endpoints (Task 3.2) =====


@router.get("/admin", response_model=AdminWishListResponse)
async def get_admin_wishes(
    filter_status: str = Query("all", description="篩選狀態: all, replied, unreplied"),
    sort_order: str = Query("newest", description="排序: newest, oldest"),
    page: int = Query(1, ge=1, description="頁碼（從 1 開始）"),
    page_size: int = Query(50, ge=1, le=100, description="每頁筆數（1-100）"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    取得所有願望列表（管理員專用，支援篩選、排序、分頁）

    Business Rules:
    - 權限：僅管理員可存取（is_admin = true）
    - 篩選：replied/unreplied（根據 admin_reply 欄位）
    - 排序：newest/oldest（根據 created_at 欄位）
    - 分頁：預設每頁 50 筆，最多 100 筆

    Query Parameters:
        filter_status: 篩選狀態（all, replied, unreplied）
        sort_order: 排序方式（newest, oldest）
        page: 頁碼
        page_size: 每頁筆數

    Returns:
        AdminWishListResponse: 分頁願望列表與總數

    Raises:
        HTTPException:
            - 403: 需要管理員權限

    Requirements:
        - R4: 管理員願望管理功能
    """
    # 管理員權限檢查（手動檢查，因為沒有 get_current_admin_user dependency）
    if not current_user.is_admin:
        logger.warning(f"Non-admin user {current_user.id} attempted to access admin wishlist")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理員權限才能執行此操作"
        )

    try:
        # 建立篩選條件字典
        filters = {}
        if filter_status == "replied":
            filters["replied"] = True
        elif filter_status == "unreplied":
            filters["replied"] = False
        # filter_status == "all" 時不添加篩選條件

        service = WishlistService()
        wishes, total = await service.get_admin_wishes(
            filters=filters,
            sort=sort_order,
            page=page,
            per_page=page_size,
            db=db
        )

        logger.info(f"Admin {current_user.id} retrieved {len(wishes)} wishes (page {page}, total {total})")

        return AdminWishListResponse(
            wishes=wishes,
            total=total,
            page=page,
            per_page=page_size
        )

    except Exception as e:
        logger.error(f"Error retrieving admin wishes: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="取得願望列表時發生錯誤"
        )


@router.put("/admin/{wish_id}/reply", response_model=WishResponse)
async def add_admin_reply(
    wish_id: UUID,
    reply_request: AdminReplyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    新增或編輯管理員回覆

    Business Rules:
    - 權限：僅管理員可操作
    - 可多次編輯回覆（無次數限制）
    - 內容驗證：純文字長度 1-1000 字
    - 自動更新：admin_reply_timestamp

    Args:
        wish_id: 願望 ID
        reply_request: 回覆內容（Markdown 格式）

    Returns:
        WishResponse: 更新後的願望

    Raises:
        HTTPException:
            - 403: 需要管理員權限
            - 404: 願望未找到
            - 400: 回覆內容為空或超過長度限制

    Requirements:
        - R5: 管理員回覆功能
    """
    # 管理員權限檢查
    if not current_user.is_admin:
        logger.warning(f"Non-admin user {current_user.id} attempted to reply to wish {wish_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理員權限才能執行此操作"
        )

    service = WishlistService()

    try:
        wish = await service.add_or_update_reply(wish_id, reply_request.reply, db)

        logger.info(f"Admin {current_user.id} replied to wish {wish_id}")
        return wish

    except WishNotFoundError:
        logger.warning(f"Admin {current_user.id} attempted to reply to non-existent wish {wish_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="願望未找到"
        )

    except ContentTooLongError as e:
        logger.warning(f"Admin {current_user.id} submitted reply too long for wish {wish_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    except ContentEmptyError:
        logger.warning(f"Admin {current_user.id} submitted empty reply for wish {wish_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="管理員回覆不可為空"
        )

    except Exception as e:
        logger.error(f"Error adding reply to wish {wish_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="新增回覆時發生錯誤"
        )


@router.put("/admin/{wish_id}/hide", response_model=WishResponse)
async def hide_wish(
    wish_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    隱藏願望

    Business Rules:
    - 權限：僅管理員可操作
    - 設定 is_hidden = true
    - 隱藏後的願望不會出現在使用者端的願望列表
    - 自動更新 updated_at 時間戳記

    Args:
        wish_id: 願望 ID

    Returns:
        WishResponse: 更新後的願望

    Raises:
        HTTPException:
            - 403: 需要管理員權限
            - 404: 願望未找到

    Requirements:
        - R6: 隱藏/封存功能
    """
    # 管理員權限檢查
    if not current_user.is_admin:
        logger.warning(f"Non-admin user {current_user.id} attempted to hide wish {wish_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理員權限才能執行此操作"
        )

    service = WishlistService()

    try:
        wish = await service.toggle_hidden(wish_id, is_hidden=True, db=db)

        logger.info(f"Admin {current_user.id} hidden wish {wish_id}")
        return wish

    except WishNotFoundError:
        logger.warning(f"Admin {current_user.id} attempted to hide non-existent wish {wish_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="願望未找到"
        )

    except Exception as e:
        logger.error(f"Error hiding wish {wish_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="隱藏願望時發生錯誤"
        )


@router.put("/admin/{wish_id}/unhide", response_model=WishResponse)
async def unhide_wish(
    wish_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    取消隱藏願望

    Business Rules:
    - 權限：僅管理員可操作
    - 設定 is_hidden = false
    - 取消隱藏後的願望會重新出現在使用者端的願望列表
    - 自動更新 updated_at 時間戳記

    Args:
        wish_id: 願望 ID

    Returns:
        WishResponse: 更新後的願望

    Raises:
        HTTPException:
            - 403: 需要管理員權限
            - 404: 願望未找到

    Requirements:
        - R6: 隱藏/封存功能
    """
    # 管理員權限檢查
    if not current_user.is_admin:
        logger.warning(f"Non-admin user {current_user.id} attempted to unhide wish {wish_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理員權限才能執行此操作"
        )

    service = WishlistService()

    try:
        wish = await service.toggle_hidden(wish_id, is_hidden=False, db=db)

        logger.info(f"Admin {current_user.id} unhidden wish {wish_id}")
        return wish

    except WishNotFoundError:
        logger.warning(f"Admin {current_user.id} attempted to unhide non-existent wish {wish_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="願望未找到"
        )

    except Exception as e:
        logger.error(f"Error unhiding wish {wish_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="取消隱藏願望時發生錯誤"
        )
