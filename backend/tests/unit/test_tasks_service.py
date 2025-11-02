"""
Unit Tests for Tasks Service
測試任務進度更新、完成邏輯、獎勵領取功能
"""

import pytest
from datetime import date, datetime, timedelta
from uuid import UUID, uuid4
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.gamification_tasks_service import (
    GamificationTasksService,
    update_task_progress,
    claim_task_reward,
    get_week_start,
)
from app.models.gamification import (
    DailyTask,
    WeeklyTask,
    UserDailyTask,
    UserWeeklyTask,
)
from app.models.user import User


# ========================================
# Common Fixtures
# ========================================

@pytest.fixture
async def test_user(db_session: AsyncSession):
    """Create a test user."""
    user_id = uuid4()
    user = User(
        id=user_id,
        email=f"test_{user_id.hex[:8]}@example.com",  # Unique email
        name=f"testuser_{user_id.hex[:8]}",
        password_hash="dummy_hash",
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


# ========================================
# Helper Function Tests
# ========================================

class TestGetWeekStart:
    """測試獲取週一日期的函數"""

    def test_get_week_start_monday(self):
        """測試週一返回自己"""
        monday = date(2025, 1, 6)  # 2025-01-06 是週一
        assert get_week_start(monday) == monday

    def test_get_week_start_tuesday(self):
        """測試週二返回週一"""
        tuesday = date(2025, 1, 7)  # 2025-01-07 是週二
        expected_monday = date(2025, 1, 6)
        assert get_week_start(tuesday) == expected_monday

    def test_get_week_start_sunday(self):
        """測試週日返回週一"""
        sunday = date(2025, 1, 12)  # 2025-01-12 是週日
        expected_monday = date(2025, 1, 6)
        assert get_week_start(sunday) == expected_monday


# ========================================
# Update Task Progress Tests
# ========================================

@pytest.mark.asyncio
class TestUpdateTaskProgress:
    """測試任務進度更新邏輯"""

    async def test_update_daily_task_progress_first_time(self, db_session, test_user, daily_task_reading):
        """測試首次更新每日任務進度"""
        user_id = test_user.id
        task_key = "daily_reading"

        # 執行更新
        result = await update_task_progress(
            db_session=db_session,
            user_id=user_id,
            task_key=task_key,
            increment=1
        )

        # 驗證結果
        assert result["success"] is True
        assert result["new_value"] == 1
        assert result["is_completed"] is True  # target_value = 1

    async def test_update_daily_task_progress_incremental(self, db_session, test_user, daily_task_reading):
        """測試遞增更新進度（目標值 > 1）"""
        # 修改任務目標值為 3
        daily_task_reading.target_value = 3
        db_session.add(daily_task_reading)
        await db_session.commit()

        user_id = test_user.id
        task_key = "daily_reading"

        # 第一次更新
        result1 = await update_task_progress(db_session, user_id, task_key, increment=1)
        assert result1["new_value"] == 1
        assert result1["is_completed"] is False

        # 第二次更新
        result2 = await update_task_progress(db_session, user_id, task_key, increment=1)
        assert result2["new_value"] == 2
        assert result2["is_completed"] is False

        # 第三次更新（完成）
        result3 = await update_task_progress(db_session, user_id, task_key, increment=1)
        assert result3["new_value"] == 3
        assert result3["is_completed"] is True

    async def test_update_task_progress_not_exceed_target(self, db_session, test_user, daily_task_reading):
        """測試進度不會超過目標值"""
        user_id = test_user.id
        task_key = "daily_reading"

        # 嘗試一次增加超過目標值
        result = await update_task_progress(db_session, user_id, task_key, increment=10)

        # 進度應該被限制在目標值
        assert result["new_value"] == 1  # target_value = 1
        assert result["is_completed"] is True

    async def test_update_weekly_task_progress(self, db_session, test_user, weekly_task_readings):
        """測試每週任務進度更新"""
        user_id = test_user.id
        task_key = "weekly_readings"

        # 第一次更新
        result = await update_task_progress(db_session, user_id, task_key, increment=1)
        assert result["success"] is True
        assert result["new_value"] == 1
        assert result["is_completed"] is False  # target_value = 5

    async def test_update_task_marks_completed_at(self, db_session, test_user, daily_task_reading):
        """測試完成時記錄 completed_at 時間"""
        user_id = test_user.id
        task_key = "daily_reading"

        # 執行更新（完成任務）
        await update_task_progress(db_session, user_id, task_key, increment=1)

        # 查詢 user_task 記錄
        from sqlalchemy import select
        stmt = select(UserDailyTask).where(
            UserDailyTask.user_id == user_id,
            UserDailyTask.task_key == task_key,
            UserDailyTask.task_date == date.today()
        )
        result = await db_session.execute(stmt)
        user_task = result.scalar_one()

        # 驗證 completed_at 已設定
        assert user_task.is_completed is True
        assert user_task.completed_at is not None
        assert isinstance(user_task.completed_at, datetime)

    async def test_update_invalid_task_key_raises_error(self, db_session, test_user):
        """測試無效的 task_key 拋出錯誤"""
        user_id = test_user.id
        task_key = "invalid_task_key"

        with pytest.raises(ValueError, match="Invalid or inactive task"):
            await update_task_progress(db_session, user_id, task_key, increment=1)

    async def test_update_inactive_task_raises_error(self, db_session, test_user, daily_task_reading):
        """測試停用的任務拋出錯誤"""
        # 停用任務
        daily_task_reading.is_active = False
        db_session.add(daily_task_reading)
        await db_session.commit()

        user_id = test_user.id
        task_key = "daily_reading"

        with pytest.raises(ValueError, match="Invalid or inactive task"):
            await update_task_progress(db_session, user_id, task_key, increment=1)


# ========================================
# Claim Task Reward Tests
# ========================================

@pytest.mark.asyncio
class TestClaimTaskReward:
    """測試任務獎勵領取邏輯"""

    async def test_claim_daily_task_reward_success(self, db_session, test_user, completed_daily_task):
        """測試成功領取每日任務獎勵"""
        user_id = test_user.id
        task_id = completed_daily_task.task_id

        # 領取獎勵
        result = await claim_task_reward(
            db_session=db_session,
            user_id=user_id,
            task_id=task_id,
            task_type="daily"
        )

        # 驗證結果
        assert result["success"] is True
        assert result["karma_earned"] == 20  # daily_reading reward
        assert result["total_karma"] > 0
        assert "完成任務" in result["message"]

    async def test_claim_task_updates_claimed_status(self, db_session, test_user, completed_daily_task):
        """測試領取後更新 is_claimed 狀態"""
        user_id = test_user.id
        task_id = completed_daily_task.task_id

        # 領取獎勵
        await claim_task_reward(db_session, user_id, task_id, task_type="daily")

        # 查詢 user_task 記錄
        from sqlalchemy import select
        stmt = select(UserDailyTask).where(
            UserDailyTask.user_id == user_id,
            UserDailyTask.task_id == task_id,
            UserDailyTask.task_date == date.today()
        )
        result = await db_session.execute(stmt)
        user_task = result.scalar_one()

        # 驗證狀態
        assert user_task.is_claimed is True
        assert user_task.claimed_at is not None
        assert isinstance(user_task.claimed_at, datetime)

    async def test_claim_task_not_completed_raises_error(self, db_session, test_user, uncompleted_daily_task):
        """測試未完成任務無法領取獎勵"""
        user_id = test_user.id
        task_id = uncompleted_daily_task.task_id

        with pytest.raises(ValueError, match="TASK_NOT_COMPLETED"):
            await claim_task_reward(db_session, user_id, task_id, task_type="daily")

    async def test_claim_task_already_claimed_raises_error(self, db_session, test_user, claimed_daily_task):
        """測試已領取任務無法重複領取（冪等性）"""
        user_id = test_user.id
        task_id = claimed_daily_task.task_id

        with pytest.raises(ValueError, match="TASK_ALREADY_CLAIMED"):
            await claim_task_reward(db_session, user_id, task_id, task_type="daily")

    async def test_claim_task_not_found_raises_error(self, db_session, test_user):
        """測試不存在的任務拋出錯誤"""
        user_id = test_user.id
        task_id = uuid4()  # 不存在的 task_id

        with pytest.raises(ValueError, match="Task not found"):
            await claim_task_reward(db_session, user_id, task_id, task_type="daily")

    async def test_claim_weekly_task_reward_success(self, db_session, test_user, completed_weekly_task):
        """測試成功領取每週任務獎勵"""
        user_id = test_user.id
        task_id = completed_weekly_task.task_id

        # 領取獎勵
        result = await claim_task_reward(
            db_session=db_session,
            user_id=user_id,
            task_id=task_id,
            task_type="weekly"
        )

        # 驗證結果
        assert result["success"] is True
        assert result["karma_earned"] == 50  # weekly_readings reward
        assert result["total_karma"] > 0

    async def test_claim_task_grants_karma(self, db_session, test_user, completed_daily_task):
        """測試領取任務會授予 Karma"""
        user_id = test_user.id
        task_id = completed_daily_task.task_id

        # 查詢 Karma 前的值
        from sqlalchemy import select
        from app.models.gamification import UserKarma
        stmt = select(UserKarma).where(UserKarma.user_id == user_id)
        result = await db_session.execute(stmt)
        user_karma_before = result.scalar_one_or_none()
        karma_before = user_karma_before.total_karma if user_karma_before else 0

        # 領取獎勵
        result = await claim_task_reward(db_session, user_id, task_id, task_type="daily")

        # 查詢 Karma 後的值
        await db_session.refresh(user_karma_before) if user_karma_before else None
        stmt = select(UserKarma).where(UserKarma.user_id == user_id)
        result = await db_session.execute(stmt)
        user_karma_after = result.scalar_one()

        # 驗證 Karma 增加
        assert user_karma_after.total_karma == karma_before + 20  # daily_reading reward


# ========================================
# Pytest Fixtures
# ========================================

@pytest.fixture
async def daily_task_reading(db_session):
    """建立每日任務：完成 1 次占卜"""
    task = DailyTask(
        task_key="daily_reading",
        name="完成 1 次占卜",
        description="進行一次塔羅占卜解讀",
        target_value=1,
        karma_reward=20,
        display_order=1,
        is_active=True
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    return task


@pytest.fixture
async def weekly_task_readings(db_session):
    """建立每週任務：完成 5 次占卜"""
    task = WeeklyTask(
        task_key="weekly_readings",
        name="完成 5 次占卜",
        description="進行 5 次塔羅占卜",
        target_value=5,
        karma_reward=50,
        display_order=1,
        is_active=True
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    return task


@pytest.fixture
async def completed_daily_task(db_session, test_user, daily_task_reading):
    """建立已完成但未領取的每日任務"""
    user_task = UserDailyTask(
        user_id=test_user.id,
        task_id=daily_task_reading.id,
        task_key=daily_task_reading.task_key,
        current_value=1,
        target_value=1,
        is_completed=True,
        is_claimed=False,
        completed_at=datetime.now(),
        task_date=date.today()
    )
    db_session.add(user_task)
    await db_session.commit()
    await db_session.refresh(user_task)
    return user_task


@pytest.fixture
async def uncompleted_daily_task(db_session, test_user, daily_task_reading):
    """建立未完成的每日任務"""
    user_task = UserDailyTask(
        user_id=test_user.id,
        task_id=daily_task_reading.id,
        task_key=daily_task_reading.task_key,
        current_value=0,
        target_value=1,
        is_completed=False,
        is_claimed=False,
        task_date=date.today()
    )
    db_session.add(user_task)
    await db_session.commit()
    await db_session.refresh(user_task)
    return user_task


@pytest.fixture
async def claimed_daily_task(db_session, test_user, daily_task_reading):
    """建立已領取的每日任務"""
    user_task = UserDailyTask(
        user_id=test_user.id,
        task_id=daily_task_reading.id,
        task_key=daily_task_reading.task_key,
        current_value=1,
        target_value=1,
        is_completed=True,
        is_claimed=True,
        completed_at=datetime.now(),
        claimed_at=datetime.now(),
        task_date=date.today()
    )
    db_session.add(user_task)
    await db_session.commit()
    await db_session.refresh(user_task)
    return user_task


@pytest.fixture
async def completed_weekly_task(db_session, test_user, weekly_task_readings):
    """建立已完成但未領取的每週任務"""
    user_task = UserWeeklyTask(
        user_id=test_user.id,
        task_id=weekly_task_readings.id,
        task_key=weekly_task_readings.task_key,
        current_value=5,
        target_value=5,
        is_completed=True,
        is_claimed=False,
        completed_at=datetime.now(),
        week_start=get_week_start(date.today())
    )
    db_session.add(user_task)
    await db_session.commit()
    await db_session.refresh(user_task)
    return user_task
