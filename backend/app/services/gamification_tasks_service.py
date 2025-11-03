"""
Gamification Tasks Service
處理每日/每週任務的進度更新與獎勵領取邏輯
"""

from typing import Dict, Any
from datetime import date, datetime, timezone, timedelta
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from app.models.gamification import (
    DailyTask,
    WeeklyTask,
    UserDailyTask,
    UserWeeklyTask,
)
from app.services.gamification_karma_service import GamificationKarmaService
from app.core.exceptions import UserNotFoundError


def get_week_start(date_obj: date) -> date:
    """
    獲取指定日期所在週的週一日期

    Args:
        date_obj: 指定日期

    Returns:
        date: 該週週一的日期

    Examples:
        >>> get_week_start(date(2025, 1, 7))  # 週二
        date(2025, 1, 6)  # 週一
    """
    days_since_monday = date_obj.weekday()  # Monday = 0, Sunday = 6
    return date_obj - timedelta(days=days_since_monday)


async def update_task_progress(
    db_session: AsyncSession,
    user_id: UUID,
    task_key: str,
    increment: int = 1
) -> Dict[str, Any]:
    """
    更新任務進度

    Args:
        db_session: 資料庫會話
        user_id: 用戶 ID
        task_key: 任務 key（例如：daily_reading, weekly_readings）
        increment: 增加值（預設 1）

    Returns:
        Dict[str, Any]: {
            "success": True,
            "new_value": 1,
            "is_completed": True
        }

    Raises:
        ValueError: 任務無效或已停用
        SQLAlchemyError: 資料庫錯誤
    """
    today = date.today()

    try:
        # 判斷是每日還是每週任務
        if task_key.startswith("daily_"):
            # 每日任務
            stmt = select(DailyTask).where(DailyTask.task_key == task_key)
            result = await db_session.execute(stmt)
            task = result.scalar_one_or_none()

            if not task or not task.is_active:
                raise ValueError(f"Invalid or inactive task: {task_key}")

            # 獲取或建立 UserDailyTask 記錄
            stmt = select(UserDailyTask).where(
                UserDailyTask.user_id == user_id,
                UserDailyTask.task_id == task.id,
                UserDailyTask.task_date == today
            )
            result = await db_session.execute(stmt)
            user_task = result.scalar_one_or_none()

            if not user_task:
                # 建立新記錄（處理 race condition）
                try:
                    user_task = UserDailyTask(
                        user_id=user_id,
                        task_id=task.id,
                        task_key=task_key,
                        current_value=0,
                        target_value=task.target_value,
                        task_date=today
                    )
                    db_session.add(user_task)
                    await db_session.flush()
                except IntegrityError:
                    # 記錄被其他請求建立（race condition）
                    # Rollback 並重新查詢
                    await db_session.rollback()
                    result = await db_session.execute(stmt)
                    user_task = result.scalar_one_or_none()
                    if not user_task:
                        raise RuntimeError(f"Failed to create or fetch user task for {task_key}")

        else:
            # 每週任務
            week_start = get_week_start(today)
            stmt = select(WeeklyTask).where(WeeklyTask.task_key == task_key)
            result = await db_session.execute(stmt)
            task = result.scalar_one_or_none()

            if not task or not task.is_active:
                raise ValueError(f"Invalid or inactive task: {task_key}")

            # 獲取或建立 UserWeeklyTask 記錄
            stmt = select(UserWeeklyTask).where(
                UserWeeklyTask.user_id == user_id,
                UserWeeklyTask.task_id == task.id,
                UserWeeklyTask.week_start == week_start
            )
            result = await db_session.execute(stmt)
            user_task = result.scalar_one_or_none()

            if not user_task:
                # 建立新記錄
                user_task = UserWeeklyTask(
                    user_id=user_id,
                    task_id=task.id,
                    task_key=task_key,
                    current_value=0,
                    target_value=task.target_value,
                    week_start=week_start
                )
                db_session.add(user_task)
                await db_session.flush()

        # 更新進度（不超過目標值）
        new_value = min(user_task.current_value + increment, user_task.target_value)
        was_completed = user_task.is_completed
        is_now_completed = new_value >= user_task.target_value

        user_task.current_value = new_value

        # 檢查是否剛完成（但尚未領取）
        if not was_completed and is_now_completed:
            user_task.is_completed = True
            user_task.completed_at = datetime.now(timezone.utc)

        await db_session.commit()
        await db_session.refresh(user_task)

        return {
            "success": True,
            "new_value": new_value,
            "is_completed": is_now_completed
        }

    except SQLAlchemyError as e:
        await db_session.rollback()
        raise RuntimeError(f"Failed to update task progress: {str(e)}") from e


async def claim_task_reward(
    db_session: AsyncSession,
    user_id: UUID,
    user_task_id: UUID,  # ✅ 改為 user_task_id (UserDailyTask.id 或 UserWeeklyTask.id)
    task_type: str  # "daily" or "weekly"
) -> Dict[str, Any]:
    """
    領取任務獎勵

    Args:
        db_session: 資料庫會話
        user_id: 用戶 ID
        user_task_id: 用戶任務記錄 ID (UserDailyTask.id 或 UserWeeklyTask.id)
        task_type: 任務類型（daily/weekly）

    Returns:
        Dict[str, Any]: {
            "success": True,
            "karma_earned": 20,
            "total_karma": 1280,
            "message": "已領取任務獎勵：完成 1 次占卜"
        }

    Raises:
        ValueError: 任務未找到、未完成、或已領取
        SQLAlchemyError: 資料庫錯誤
    """
    today = date.today()

    try:
        # 根據任務類型查詢
        if task_type == "daily":
            # 直接查詢用戶任務記錄 (使用 user_task_id)
            stmt = select(UserDailyTask).where(
                UserDailyTask.id == user_task_id,
                UserDailyTask.user_id == user_id
            )
            result = await db_session.execute(stmt)
            user_task = result.scalar_one_or_none()

            if not user_task:
                raise ValueError("User task not found")

            # 查詢任務定義
            stmt = select(DailyTask).where(DailyTask.id == user_task.task_id)
            result = await db_session.execute(stmt)
            task = result.scalar_one_or_none()

            if not task:
                raise ValueError("Task definition not found")

        else:  # weekly
            # 直接查詢用戶任務記錄 (使用 user_task_id)
            stmt = select(UserWeeklyTask).where(
                UserWeeklyTask.id == user_task_id,
                UserWeeklyTask.user_id == user_id
            )
            result = await db_session.execute(stmt)
            user_task = result.scalar_one_or_none()

            if not user_task:
                raise ValueError("User task not found")

            # 查詢任務定義
            stmt = select(WeeklyTask).where(WeeklyTask.id == user_task.task_id)
            result = await db_session.execute(stmt)
            task = result.scalar_one_or_none()

            if not task:
                raise ValueError("Task definition not found")

        # 驗證任務狀態 (user_task 現在一定存在)
        # if not user_task:  # ← 移除這個檢查，因為上面已經檢查了
        #     raise ValueError("Task not found")

        if not user_task.is_completed:
            raise ValueError("TASK_NOT_COMPLETED: 任務尚未完成")

        if user_task.is_claimed:
            raise ValueError("TASK_ALREADY_CLAIMED: 獎勵已領取")

        # 標記為已領取
        user_task.is_claimed = True
        user_task.claimed_at = datetime.now(timezone.utc)

        # Flush to ensure user_task changes are in the transaction
        # (grant_karma will commit everything together)
        await db_session.flush()

        # 授予 Karma 獎勵 (grant_karma 會內部 commit，連同 user_task 一起提交)
        karma_service = GamificationKarmaService(db_session)
        karma_result = await karma_service.grant_karma(
            user_id=user_id,
            action_type="complete_task",
            karma_amount=task.karma_reward,
            description=f"完成任務：{task.name}",
            metadata={"task_id": str(task.id), "task_key": task.task_key}
        )

        return {
            "success": True,
            "karma_earned": task.karma_reward,
            "total_karma": karma_result["total_karma"],
            "message": f"已領取任務獎勵：{task.name}"
        }

    except SQLAlchemyError as e:
        await db_session.rollback()
        raise RuntimeError(f"Failed to claim task reward: {str(e)}") from e


class GamificationTasksService:
    """
    Gamification Tasks Service
    處理遊戲化任務系統的核心邏輯
    """

    def __init__(self, db_session: AsyncSession):
        """
        初始化 Tasks 服務

        Args:
            db_session: 資料庫會話
        """
        self.db = db_session

    async def update_task_progress(
        self,
        user_id: UUID,
        task_key: str,
        increment: int = 1
    ) -> Dict[str, Any]:
        """
        更新任務進度（Wrapper method）

        Args:
            user_id: 用戶 ID
            task_key: 任務 key
            increment: 增加值

        Returns:
            Dict[str, Any]: 更新結果
        """
        return await update_task_progress(
            db_session=self.db,
            user_id=user_id,
            task_key=task_key,
            increment=increment
        )

    async def claim_task_reward(
        self,
        user_id: UUID,
        user_task_id: UUID,  # ✅ 改為 user_task_id
        task_type: str
    ) -> Dict[str, Any]:
        """
        領取任務獎勵（Wrapper method）

        Args:
            user_id: 用戶 ID
            user_task_id: 用戶任務記錄 ID
            task_type: 任務類型

        Returns:
            Dict[str, Any]: 領取結果
        """
        return await claim_task_reward(
            db_session=self.db,
            user_id=user_id,
            user_task_id=user_task_id,  # ✅ 使用正確的參數名
            task_type=task_type
        )
