"""
Gamification Karma API Endpoints
/api/v1/karma/* - Karma summary, logs, and operations
"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from datetime import datetime, timedelta, timezone

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.models.gamification import KarmaLog, UserKarma
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
    獲取用戶 Karma 總覽

    Returns:
        - total_karma: 總 Karma
        - current_level: 當前等級
        - karma_to_next_level: 到下一級所需 Karma
        - rank: 全服排名（可選）
        - today_earned: 今日獲得 Karma
        - level_title: 等級稱號
    """
    # 獲取 UserKarma
    result = await db.execute(
        select(UserKarma).where(UserKarma.user_id == current_user.id)
    )
    user_karma = result.scalar_one_or_none()

    if not user_karma:
        # 未初始化，返回默認值
        return KarmaSummaryResponse(
            total_karma=0,
            current_level=1,
            karma_to_next_level=500,
            rank=None,
            today_earned=0,
            level_title=get_level_title(1)
        )

    # 計算今日獲得 Karma
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    result = await db.execute(
        select(func.sum(KarmaLog.karma_amount))
        .where(
            KarmaLog.user_id == current_user.id,
            KarmaLog.created_at >= today_start
        )
    )
    today_earned = result.scalar() or 0

    return KarmaSummaryResponse(
        total_karma=user_karma.total_karma,
        current_level=user_karma.current_level,
        karma_to_next_level=user_karma.karma_to_next_level,
        rank=user_karma.rank,
        today_earned=today_earned,
        level_title=get_level_title(user_karma.current_level)
    )


@router.get("/logs", response_model=KarmaLogsListResponse)
async def get_karma_logs(
    page: int = Query(1, ge=1, description="頁碼"),
    limit: int = Query(20, ge=1, le=100, description="每頁數量"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    獲取用戶 Karma 記錄（分頁）

    Args:
        page: 頁碼（從 1 開始）
        limit: 每頁數量（1-100）

    Returns:
        logs: Karma 記錄列表
        pagination: 分頁資訊
    """
    offset = (page - 1) * limit

    # 獲取總數
    count_result = await db.execute(
        select(func.count(KarmaLog.id))
        .where(KarmaLog.user_id == current_user.id)
    )
    total = count_result.scalar() or 0

    # 獲取記錄
    result = await db.execute(
        select(KarmaLog)
        .where(KarmaLog.user_id == current_user.id)
        .order_by(desc(KarmaLog.created_at))
        .limit(limit)
        .offset(offset)
    )
    logs = result.scalars().all()

    # 轉換為 response model
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
