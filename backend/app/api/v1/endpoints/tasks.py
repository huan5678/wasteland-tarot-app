"""
Gamification Tasks API Endpoints
/api/v1/tasks/* - Daily/Weekly tasks operations
"""

import logging
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime, timedelta, timezone, date
from zoneinfo import ZoneInfo

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.models.gamification import (
    DailyTask,
    UserDailyTask,
    WeeklyTask,
    UserWeeklyTask
)
from app.schemas.tasks import (
    TaskResponse,
    DailyTasksListResponse,
    WeeklyTasksListResponse,
    ClaimTaskRewardResponse,
    UpdateTaskProgressRequest,
    UpdateTaskProgressResponse,
    TaskError
)
from app.services.gamification_tasks_service import (
    GamificationTasksService,
    get_week_start,
    calculate_weekly_task_progress
)


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tasks", tags=["📋 Tasks System"])


def calculate_progress_percentage(current: int, target: int) -> int:
    """Calculate progress percentage."""
    if target == 0:
        return 0
    percentage = int((current / target) * 100)
    return min(percentage, 100)


def get_next_day_midnight(tz: ZoneInfo = ZoneInfo("Asia/Taipei")) -> datetime:
    """Get next day 00:00 in specified timezone."""
    now = datetime.now(tz)
    next_day = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    return next_day


def get_next_monday_midnight(tz: ZoneInfo = ZoneInfo("Asia/Taipei")) -> datetime:
    """Get next Monday 00:00 in specified timezone."""
    now = datetime.now(tz)
    days_until_monday = (7 - now.weekday()) % 7
    if days_until_monday == 0:  # 如果今天是週一
        days_until_monday = 7
    next_monday = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=days_until_monday)
    return next_monday


@router.get("/daily", response_model=DailyTasksListResponse)
async def get_daily_tasks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    獲取每日任務列表

    Returns:
        - tasks: 每日任務列表（含進度）
        - reset_time: 重置時間
        - completed_count: 已完成任務數
        - total_count: 總任務數
    """
    # 獲取所有每日任務定義
    result = await db.execute(
        select(DailyTask).order_by(DailyTask.display_order)
    )
    daily_tasks = result.scalars().all()

    # 獲取用戶任務進度
    result = await db.execute(
        select(UserDailyTask).where(UserDailyTask.user_id == current_user.id)
    )
    user_tasks = {ut.task_id: ut for ut in result.scalars().all()}

    # 組裝響應
    task_responses: List[TaskResponse] = []
    completed_count = 0

    for task in daily_tasks:
        user_task = user_tasks.get(task.id)
        current_value = user_task.current_value if user_task else 0
        is_completed = user_task.is_completed if user_task else False
        is_claimed = user_task.is_claimed if user_task else False

        if is_completed:
            completed_count += 1

        task_responses.append(TaskResponse(
            id=str(user_task.id) if user_task else str(task.id),
            task_key=task.task_key,
            name=task.name,
            description=task.description,
            target_value=task.target_value,
            current_value=current_value,
            karma_reward=task.karma_reward,
            is_completed=is_completed,
            is_claimed=is_claimed,
            progress_percentage=calculate_progress_percentage(current_value, task.target_value)
        ))

    # 計算重置時間（明天 00:00 UTC+8）
    reset_time = get_next_day_midnight()

    return DailyTasksListResponse(
        tasks=task_responses,
        reset_time=reset_time.isoformat(),
        completed_count=completed_count,
        total_count=len(daily_tasks)
    )


@router.get("/weekly", response_model=WeeklyTasksListResponse)
async def get_weekly_tasks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    獲取每週任務列表（使用動態計算進度）

    Returns:
        - tasks: 每週任務列表（含進度）
        - reset_time: 重置時間
        - completed_count: 已完成任務數
        - total_count: 總任務數

    Note:
        current_value 從原始資料動態計算（Source of Truth）
        is_completed/is_claimed 從 user_weekly_tasks 查詢
    """
    # 獲取所有每週任務定義
    result = await db.execute(
        select(WeeklyTask).order_by(WeeklyTask.display_order)
    )
    weekly_tasks = result.scalars().all()

    # 獲取當前週一日期
    week_start = get_week_start(date.today())

    # 獲取用戶任務進度（本週）- 只用於查詢完成/領取狀態
    result = await db.execute(
        select(UserWeeklyTask).where(
            and_(
                UserWeeklyTask.user_id == current_user.id,
                UserWeeklyTask.week_start == week_start
            )
        )
    )
    user_tasks = {ut.task_id: ut for ut in result.scalars().all()}

    # 組裝響應
    task_responses: List[TaskResponse] = []
    completed_count = 0
    need_update_tasks = []  # 記錄需要更新完成狀態的任務

    for task in weekly_tasks:
        user_task = user_tasks.get(task.id)

        # ✅ 動態計算進度（Source of Truth）
        try:
            current_value = await calculate_weekly_task_progress(
                db_session=db,
                user_id=current_user.id,
                task_key=task.task_key,
                week_start=week_start
            )
        except Exception as e:
            logger.error(f"Failed to calculate progress for task {task.task_key}: {e}")
            current_value = 0

        # 查詢完成/領取狀態
        is_completed = user_task.is_completed if user_task else False
        is_claimed = user_task.is_claimed if user_task else False

        # 自動標記完成（如果達成目標但尚未標記）
        if current_value >= task.target_value and not is_completed:
            if user_task:
                # 已有記錄，更新完成狀態
                user_task.is_completed = True
                user_task.completed_at = datetime.now(timezone.utc)
                need_update_tasks.append(user_task)
            else:
                # 沒有記錄，建立新記錄
                user_task = UserWeeklyTask(
                    user_id=current_user.id,
                    task_id=task.id,
                    task_key=task.task_key,
                    current_value=current_value,  # 儲存當前值（雖然不使用，但為了相容性）
                    target_value=task.target_value,
                    week_start=week_start,
                    is_completed=True,
                    completed_at=datetime.now(timezone.utc)
                )
                db.add(user_task)
                need_update_tasks.append(user_task)

            is_completed = True

        if is_completed:
            completed_count += 1

        task_responses.append(TaskResponse(
            id=str(user_task.id) if user_task else str(task.id),
            task_key=task.task_key,
            name=task.name,
            description=task.description,
            target_value=task.target_value,
            current_value=current_value,  # ✅ 使用動態計算的值
            karma_reward=task.karma_reward,
            is_completed=is_completed,
            is_claimed=is_claimed,
            progress_percentage=calculate_progress_percentage(current_value, task.target_value)
        ))

    # 批次提交更新
    if need_update_tasks:
        await db.commit()
        logger.info(f"Auto-completed {len(need_update_tasks)} weekly tasks for user {current_user.id}")

    # 計算重置時間（下週一 00:00 UTC+8）
    reset_time = get_next_monday_midnight()

    return WeeklyTasksListResponse(
        tasks=task_responses,
        reset_time=reset_time.isoformat(),
        completed_count=completed_count,
        total_count=len(weekly_tasks)
    )


@router.post("/daily/{task_id}/claim", response_model=ClaimTaskRewardResponse)
async def claim_daily_task_reward(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    領取每日任務獎勵

    Args:
        task_id: 用戶每日任務 ID

    Returns:
        success: 是否成功
        karma_earned: 獲得的 Karma
        total_karma: 總 Karma
        message: 提示訊息

    Raises:
        404: 任務不存在
        400: 任務未完成或已領取
    """
    service = GamificationTasksService(db_session=db)

    try:
        result = await service.claim_task_reward(
            user_id=current_user.id,
            user_task_id=task_id,
            task_type="daily"
        )

        return ClaimTaskRewardResponse(
            success=result["success"],
            karma_earned=result["karma_earned"],
            total_karma=result["total_karma"],
            message=result["message"]
        )

    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "TASK_NOT_FOUND", "message": error_msg}
            )
        elif "not completed" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "TASK_NOT_COMPLETED", "message": "任務尚未完成，無法領取獎勵"}
            )
        elif "already claimed" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "ALREADY_CLAIMED", "message": "獎勵已領取，無法重複領取"}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "CLAIM_FAILED", "message": error_msg}
            )


@router.post("/weekly/{task_id}/claim", response_model=ClaimTaskRewardResponse)
async def claim_weekly_task_reward(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    領取每週任務獎勵

    Args:
        task_id: 用戶每週任務 ID

    Returns:
        success: 是否成功
        karma_earned: 獲得的 Karma
        total_karma: 總 Karma
        message: 提示訊息

    Raises:
        404: 任務不存在
        400: 任務未完成或已領取
    """
    service = GamificationTasksService(db_session=db)

    try:
        result = await service.claim_task_reward(
            user_id=current_user.id,
            user_task_id=task_id,
            task_type="weekly"
        )

        return ClaimTaskRewardResponse(
            success=result["success"],
            karma_earned=result["karma_earned"],
            total_karma=result["total_karma"],
            message=result["message"]
        )

    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "TASK_NOT_FOUND", "message": error_msg}
            )
        elif "not completed" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "TASK_NOT_COMPLETED", "message": "任務尚未完成，無法領取獎勵"}
            )
        elif "already claimed" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "ALREADY_CLAIMED", "message": "獎勵已領取，無法重複領取"}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "CLAIM_FAILED", "message": error_msg}
            )


@router.post("/progress", response_model=UpdateTaskProgressResponse)
async def update_task_progress(
    request: UpdateTaskProgressRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    更新任務進度（內部 API）

    Args:
        user_id: 用戶 ID
        task_key: 任務唯一鍵
        increment: 進度增量

    Returns:
        success: 是否成功
        new_value: 新的進度值
        is_completed: 是否已完成

    Note:
        此 API 為內部使用，應由其他服務調用
        未來應加入內部認證機制
    """
    service = GamificationTasksService(db_session=db)

    try:
        user_id = UUID(request.user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "INVALID_USER_ID", "message": "無效的用戶 ID"}
        )

    try:
        result = await service.update_task_progress(
            user_id=user_id,
            task_key=request.task_key,
            increment=request.increment
        )

        return UpdateTaskProgressResponse(
            success=result["success"],
            new_value=result["new_value"],
            is_completed=result["is_completed"]
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "UPDATE_FAILED", "message": str(e)}
        )
