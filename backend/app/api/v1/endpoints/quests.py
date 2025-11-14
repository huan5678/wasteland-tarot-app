"""
Quest API Endpoints (Task 3.3)
/api/v1/quests/* - Quest assignment, progress, and rewards
"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Path, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.quest_service import QuestService
from app.services.unified_karma_service import UnifiedKarmaService


router = APIRouter(prefix="/quests", tags=["🎯 Quest System"])


@router.get("/daily")
async def get_daily_quests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    取得我的每日任務
    
    若尚未分配今日任務，自動分配（1 固定 + 2 隨機）
    
    Returns:
        - quests: 任務列表
        - count: 任務數量
    """
    quest_service = QuestService(db)
    
    # Try to get existing daily quests
    quests = await quest_service.get_user_active_quests(
        user_id=current_user.id,
        quest_type=QuestService.QUEST_TYPE_DAILY
    )
    
    # If no quests found, assign new daily quests
    if not quests:
        assigned = await quest_service.assign_daily_quests(current_user.id)
        quests = await quest_service.get_user_active_quests(
            user_id=current_user.id,
            quest_type=QuestService.QUEST_TYPE_DAILY
        )
    
    return {
        "success": True,
        "data": {
            "quests": quests,
            "count": len(quests)
        }
    }


@router.get("/weekly")
async def get_weekly_quests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    取得我的每週任務
    
    若尚未分配本週任務，自動分配（1 固定 + 2 困難隨機）
    
    Returns:
        - quests: 任務列表
        - count: 任務數量
    """
    quest_service = QuestService(db)
    
    # Try to get existing weekly quests
    quests = await quest_service.get_user_active_quests(
        user_id=current_user.id,
        quest_type=QuestService.QUEST_TYPE_WEEKLY
    )
    
    # If no quests found, assign new weekly quests
    if not quests:
        assigned = await quest_service.assign_weekly_quests(current_user.id)
        quests = await quest_service.get_user_active_quests(
            user_id=current_user.id,
            quest_type=QuestService.QUEST_TYPE_WEEKLY
        )
    
    return {
        "success": True,
        "data": {
            "quests": quests,
            "count": len(quests)
        }
    }


@router.get("/all")
async def get_all_active_quests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    取得我的所有活躍任務（每日 + 每週）
    
    Returns:
        - daily_quests: 每日任務列表
        - weekly_quests: 每週任務列表
        - total_count: 總任務數
    """
    quest_service = QuestService(db)
    
    daily_quests = await quest_service.get_user_active_quests(
        user_id=current_user.id,
        quest_type=QuestService.QUEST_TYPE_DAILY
    )
    
    weekly_quests = await quest_service.get_user_active_quests(
        user_id=current_user.id,
        quest_type=QuestService.QUEST_TYPE_WEEKLY
    )
    
    return {
        "success": True,
        "data": {
            "daily_quests": daily_quests,
            "weekly_quests": weekly_quests,
            "total_count": len(daily_quests) + len(weekly_quests)
        }
    }


@router.post("/{progress_id}/claim")
async def claim_quest_rewards(
    progress_id: UUID = Path(..., description="Quest progress ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    領取任務獎勵
    
    Args:
        progress_id: 任務進度 ID
    
    Returns:
        - quest_name: 任務名稱
        - rewards: 獎勵詳情
        - karma_granted: 已發放的 karma 數量
    """
    quest_service = QuestService(db)
    karma_service = UnifiedKarmaService(db)
    
    # Claim rewards
    rewards = await quest_service.claim_quest_rewards(
        user_id=current_user.id,
        progress_id=progress_id
    )
    
    if not rewards:
        raise HTTPException(
            status_code=400,
            detail="Quest not found or not completable"
        )
    
    # Grant karma rewards
    karma_points = rewards["rewards"].get("karma_points", 0)
    
    if karma_points > 0:
        await karma_service.add_karma(
            user_id=current_user.id,
            action_type="quest_completion",
            alignment_change=karma_points,
            total_change=karma_points,
            description=f"Claimed quest: {rewards['quest_name']}",
            metadata={"quest_progress_id": str(progress_id)}
        )
    
    return {
        "success": True,
        "data": {
            "quest_name": rewards["quest_name"],
            "rewards": rewards["rewards"],
            "karma_granted": karma_points,
            "claimed_at": rewards["claimed_at"].isoformat()
        }
    }


@router.get("/stats")
async def get_quest_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    取得我的任務統計
    
    Returns:
        - completed_total: 總完成任務數
        - completed_daily: 完成每日任務數
        - completed_weekly: 完成每週任務數
        - active_quests: 當前活躍任務數
        - total_karma_earned: 從任務獲得的總 karma
    """
    quest_service = QuestService(db)
    stats = await quest_service.get_user_quest_stats(current_user.id)
    
    return {
        "success": True,
        "data": stats
    }


@router.post("/progress/update")
async def update_quest_progress_manual(
    quest_code: str = Body(..., embed=True, description="Quest code"),
    increment: int = Body(1, embed=True, description="Progress increment"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    手動更新任務進度（僅供測試或管理員使用）
    
    正常情況下，任務進度應由業務事件自動觸發更新
    
    Args:
        quest_code: 任務代碼
        increment: 進度增量（預設 1）
    
    Returns:
        - progress: 更新後的進度資訊
    """
    quest_service = QuestService(db)
    
    progress = await quest_service.update_quest_progress(
        user_id=current_user.id,
        quest_code=quest_code,
        progress_increment=increment
    )
    
    if not progress:
        raise HTTPException(
            status_code=404,
            detail="Quest not found or not active"
        )
    
    return {
        "success": True,
        "data": progress
    }
