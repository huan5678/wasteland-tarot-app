"""
Unified Karma API Endpoints (v2) - Task 3.1
/api/v1/karma/* - Karma summary, logs, history, and operations
Uses UnifiedKarmaService for all karma operations
"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, timezone

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.unified_karma_service import UnifiedKarmaService
from app.schemas.karma import (
    KarmaSummaryResponse,
    KarmaLogResponse,
    KarmaLogsListResponse,
    PaginationInfo
)


router = APIRouter(prefix="/karma", tags=["💫 Karma System"])


# 等級稱號映射
LEVEL_TITLES = {
    1: "Vault 新成員",
    2: "避難所探索者",
    3: "廢土流浪者",
    4: "終端機使用者",
    5: "Pip-Boy 專家",
    10: "廢土傳奇",
    20: "Vault 長老"
}


def get_level_title(level: int) -> str:
    """Get level title for given level."""
    if level >= 20:
        return LEVEL_TITLES[20]
    elif level >= 10:
        return LEVEL_TITLES[10]
    elif level >= 5:
        return LEVEL_TITLES[5]
    elif level in LEVEL_TITLES:
        return LEVEL_TITLES[level]
    else:
        return f"Level {level} Wanderer"


@router.get("/summary", response_model=KarmaSummaryResponse)
async def get_karma_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    獲取用戶 Karma 總覽（使用 UnifiedKarmaService）

    Returns:
        - alignment_karma: 陣營 Karma (0-100)
        - total_karma: 總累積 Karma
        - current_level: 當前等級
        - karma_to_next_level: 到下一級所需 Karma
        - alignment_category: 陣營分類
        - rank: 全服排名（可選）
        - today_earned: 今日獲得 Karma
    """
    karma_service = UnifiedKarmaService(db)
    summary = await karma_service.get_karma_summary(current_user.id)
    
    return KarmaSummaryResponse(
        alignment_karma=summary["alignment_karma"],
        total_karma=summary["total_karma"],
        current_level=summary["current_level"],
        karma_to_next_level=summary["karma_to_next_level"],
        alignment_category=summary["alignment_category"],
        rank=summary["rank"],
        today_earned=summary["today_earned"],
        level_title=get_level_title(summary["current_level"])
    )


@router.get("/logs", response_model=KarmaLogsListResponse)
async def get_karma_logs(
    page: int = Query(1, ge=1, description="頁碼"),
    limit: int = Query(20, ge=1, le=100, description="每頁數量"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    獲取用戶 Karma 記錄（分頁）- total_karma 追蹤

    Args:
        page: 頁碼（從 1 開始）
        limit: 每頁數量（1-100）

    Returns:
        logs: Karma 記錄列表
        pagination: 分頁資訊
    """
    karma_service = UnifiedKarmaService(db)
    offset = (page - 1) * limit
    
    logs = await karma_service.get_karma_logs(current_user.id, limit=limit, offset=offset)
    
    # Count total for pagination
    from sqlalchemy import select, func
    from app.models.gamification import KarmaLog
    count_result = await db.execute(
        select(func.count(KarmaLog.id)).where(KarmaLog.user_id == current_user.id)
    )
    total = count_result.scalar() or 0
    
    log_responses = [
        KarmaLogResponse(
            id=str(log.id),
            action_type=log.action_type,
            karma_amount=log.karma_amount,
            description=log.description or "",
            created_at=log.created_at.isoformat(),
            metadata=log.action_metadata or {}
        )
        for log in logs
    ]

    total_pages = (total + limit - 1) // limit if total > 0 else 1

    return KarmaLogsListResponse(
        logs=log_responses,
        pagination=PaginationInfo(
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages
        )
    )


@router.get("/history")
async def get_karma_history(
    page: int = Query(1, ge=1, description="頁碼"),
    limit: int = Query(20, ge=1, le=100, description="每頁數量"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    獲取用戶 Karma 歷史記錄（alignment_karma 變更審計）

    Returns alignment karma change history
    """
    karma_service = UnifiedKarmaService(db)
    offset = (page - 1) * limit
    
    history = await karma_service.get_karma_history(current_user.id, limit=limit, offset=offset)
    
    return {
        "history": [
            {
                "id": str(h.id),
                "change_amount": h.change_amount,
                "new_karma_value": h.new_karma_value,
                "reason": h.reason.value if hasattr(h.reason, 'value') else str(h.reason),
                "changed_at": h.changed_at.isoformat(),
                "context": h.context or {}
            }
            for h in history
        ],
        "page": page,
        "limit": limit
    }
