"""
Unit tests for Achievement Checker
測試成就檢查引擎邏輯
"""

import pytest
import pytest_asyncio
from datetime import datetime, timedelta
from uuid import uuid4
from unittest.mock import AsyncMock, patch
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.services.achievement_checker import AchievementChecker
from app.models.achievement import (
    Achievement,
    UserAchievementProgress,
    AchievementCategory,
    AchievementRarity,
    AchievementStatus
)
from app.models.user import User
from app.models.user_analytics import AnalyticsEvent


@pytest_asyncio.fixture
async def test_db():
    """建立測試資料庫"""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False
    )

    # 建立測試表
    async with engine.begin() as conn:
        await conn.run_sync(Achievement.__table__.create)
        await conn.run_sync(UserAchievementProgress.__table__.create)
        await conn.run_sync(User.__table__.create)
        await conn.run_sync(AnalyticsEvent.__table__.create)

    # 建立 session
    async_session = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

    async with async_session() as session:
        yield session
        await session.rollback()

    await engine.dispose()


@pytest_asyncio.fixture
async def test_user(test_db):
    """建立測試使用者"""
    user = User(
        id=uuid4(),
        email="test@example.com",
        name="Test User",
        password_hash="hashed"
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user


@pytest_asyncio.fixture
async def sample_analytics_events(test_db, test_user):
    """建立範例 Analytics 事件"""
    events = []

    # 建立 5 次占卜事件
    for i in range(5):
        event = AnalyticsEvent(
            user_id=test_user.id,
            event_type='reading_completed',
            event_data={
                'reading_id': f'reading-{i}',
                'spread_type': 'three_card'
            },
            created_at=datetime.utcnow() - timedelta(days=i)
        )
        events.append(event)
        test_db.add(event)

    # 建立 3 次分享事件
    for i in range(3):
        event = AnalyticsEvent(
            user_id=test_user.id,
            event_type='reading_shared',
            event_data={'reading_id': f'reading-{i}'},
            created_at=datetime.utcnow() - timedelta(days=i)
        )
        events.append(event)
        test_db.add(event)

    # 建立連續登入事件（過去 7 天）
    for i in range(7):
        event = AnalyticsEvent(
            user_id=test_user.id,
            event_type='user_login',
            event_data={'login_method': 'password'},
            created_at=datetime.utcnow() - timedelta(days=i)
        )
        events.append(event)
        test_db.add(event)

    await test_db.commit()
    return events


# ===== Test 14.2.1: Reading Count Progress Calculation =====

@pytest.mark.asyncio
async def test_calculate_reading_count_progress(test_db, test_user, sample_analytics_events):
    """測試占卜次數條件的計算"""
    checker = AchievementChecker(test_db)

    # 建立占卜成就
    achievement = Achievement(
        id=uuid4(),
        code="FIRST_READING",
        name_zh_tw="廢土新手",
        criteria={"type": "READING_COUNT", "target": 1},
        rewards={"karma_points": 50},
        category=AchievementCategory.READING.value,
        rarity=AchievementRarity.COMMON.value,
        is_active=True
    )
    test_db.add(achievement)
    await test_db.commit()

    progress_data = await checker.check_achievement_progress(test_user.id, achievement)

    assert progress_data['current_progress'] == 5  # 5 次占卜事件
    assert progress_data['target_progress'] == 1
    assert progress_data['is_completed'] is True


# ===== Test 14.2.2: Progress with Additional Filters =====

@pytest.mark.asyncio
async def test_calculate_progress_with_spread_filter(test_db, test_user, sample_analytics_events):
    """測試帶額外篩選條件的進度計算"""
    checker = AchievementChecker(test_db)

    # 建立特定排列的成就
    achievement = Achievement(
        id=uuid4(),
        code="THREE_CARD_MASTER",
        name_zh_tw="三卡大師",
        criteria={
            "type": "READING_COUNT",
            "target": 10,
            "filters": {"spread_type": "three_card"}
        },
        rewards={"karma_points": 100},
        category=AchievementCategory.READING.value,
        rarity=AchievementRarity.RARE.value,
        is_active=True
    )
    test_db.add(achievement)
    await test_db.commit()

    progress_data = await checker.check_achievement_progress(test_user.id, achievement)

    # 所有測試事件都是 three_card
    assert progress_data['current_progress'] == 5
    assert progress_data['is_completed'] is False  # 未達 10 次


# ===== Test 14.2.3: Achievement Unlocking =====

@pytest.mark.asyncio
async def test_check_and_unlock_achievement(test_db, test_user, sample_analytics_events):
    """測試成就達成時的解鎖判斷"""
    checker = AchievementChecker(test_db)

    # 建立成就
    achievement = Achievement(
        id=uuid4(),
        code="FIRST_READING",
        name_zh_tw="廢土新手",
        criteria={"type": "READING_COUNT", "target": 1},
        rewards={"karma_points": 50},
        category=AchievementCategory.READING.value,
        rarity=AchievementRarity.COMMON.value,
        is_active=True
    )
    test_db.add(achievement)

    # 建立進行中的進度
    progress = UserAchievementProgress(
        user_id=test_user.id,
        achievement_id=achievement.id,
        current_progress=0,
        target_progress=1,
        status=AchievementStatus.IN_PROGRESS.value
    )
    test_db.add(progress)
    await test_db.commit()

    newly_unlocked = await checker.check_and_unlock_achievements(
        user_id=test_user.id,
        achievement_codes=["FIRST_READING"]
    )

    assert len(newly_unlocked) == 1
    assert newly_unlocked[0]['achievement'].code == "FIRST_READING"
    assert newly_unlocked[0]['just_unlocked'] is True

    # 驗證進度已更新
    await test_db.refresh(progress)
    assert progress.status == AchievementStatus.UNLOCKED.value
    assert progress.current_progress == 5
    assert progress.unlocked_at is not None


# ===== Test 14.2.4: In-Progress Status Maintained =====

@pytest.mark.asyncio
async def test_in_progress_status_maintained(test_db, test_user, sample_analytics_events):
    """測試未達成時的進行中狀態維持"""
    checker = AchievementChecker(test_db)

    # 建立需要 100 次占卜的成就
    achievement = Achievement(
        id=uuid4(),
        code="READING_MASTER",
        name_zh_tw="占卜大師",
        criteria={"type": "READING_COUNT", "target": 100},
        rewards={"karma_points": 500},
        category=AchievementCategory.READING.value,
        rarity=AchievementRarity.EPIC.value,
        is_active=True
    )
    test_db.add(achievement)

    progress = UserAchievementProgress(
        user_id=test_user.id,
        achievement_id=achievement.id,
        current_progress=0,
        target_progress=100,
        status=AchievementStatus.IN_PROGRESS.value
    )
    test_db.add(progress)
    await test_db.commit()

    newly_unlocked = await checker.check_and_unlock_achievements(
        user_id=test_user.id,
        achievement_codes=["READING_MASTER"]
    )

    assert len(newly_unlocked) == 0  # 未解鎖

    # 驗證狀態仍為進行中
    await test_db.refresh(progress)
    assert progress.status == AchievementStatus.IN_PROGRESS.value
    assert progress.current_progress == 5  # 進度有更新
    assert progress.unlocked_at is None


# ===== Test 14.2.5: Hidden Achievement Logic =====

@pytest.mark.asyncio
async def test_hidden_achievement_unlock(test_db, test_user, sample_analytics_events):
    """測試隱藏成就的解鎖邏輯"""
    checker = AchievementChecker(test_db)

    # 建立隱藏成就
    achievement = Achievement(
        id=uuid4(),
        code="SECRET_READER",
        name_zh_tw="秘密讀者",
        criteria={"type": "READING_COUNT", "target": 5},
        rewards={"karma_points": 300},
        category=AchievementCategory.READING.value,
        rarity=AchievementRarity.LEGENDARY.value,
        is_hidden=True,
        is_active=True
    )
    test_db.add(achievement)

    progress = UserAchievementProgress(
        user_id=test_user.id,
        achievement_id=achievement.id,
        current_progress=0,
        target_progress=5,
        status=AchievementStatus.IN_PROGRESS.value
    )
    test_db.add(progress)
    await test_db.commit()

    newly_unlocked = await checker.check_and_unlock_achievements(
        user_id=test_user.id,
        achievement_codes=["SECRET_READER"]
    )

    # 隱藏成就也能正常解鎖
    assert len(newly_unlocked) == 1
    assert newly_unlocked[0]['achievement'].is_hidden is True

    await test_db.refresh(progress)
    assert progress.status == AchievementStatus.UNLOCKED.value


# ===== Test 14.2.6: Consecutive Login Achievement =====

@pytest.mark.asyncio
async def test_consecutive_login_check(test_db, test_user, sample_analytics_events):
    """測試連續簽到成就的檢查"""
    checker = AchievementChecker(test_db)

    # 建立連續簽到成就
    achievement = Achievement(
        id=uuid4(),
        code="WEEK_WARRIOR",
        name_zh_tw="一週戰士",
        criteria={
            "type": "CONSECUTIVE_LOGIN",
            "target": 7
        },
        rewards={"karma_points": 200},
        category=AchievementCategory.BINGO.value,
        rarity=AchievementRarity.RARE.value,
        is_active=True
    )
    test_db.add(achievement)

    progress = UserAchievementProgress(
        user_id=test_user.id,
        achievement_id=achievement.id,
        current_progress=0,
        target_progress=7,
        status=AchievementStatus.IN_PROGRESS.value
    )
    test_db.add(progress)
    await test_db.commit()

    progress_data = await checker.check_achievement_progress(test_user.id, achievement)

    # 有連續 7 天登入事件
    assert progress_data['current_progress'] >= 7
    assert progress_data['is_completed'] is True


# ===== Test 14.2.7: Karma Threshold Achievement =====

@pytest.mark.asyncio
async def test_karma_threshold_check(test_db, test_user):
    """測試 Karma 門檻成就的檢查"""
    checker = AchievementChecker(test_db)

    # Mock 使用者的 karma_points
    test_user.karma_points = 1000
    await test_db.commit()

    # 建立 Karma 門檻成就
    achievement = Achievement(
        id=uuid4(),
        code="KARMA_RICH",
        name_zh_tw="Karma 富翁",
        criteria={
            "type": "KARMA_THRESHOLD",
            "target": 1000
        },
        rewards={"karma_points": 500, "title": "富翁"},
        category=AchievementCategory.KARMA.value,
        rarity=AchievementRarity.EPIC.value,
        is_active=True
    )
    test_db.add(achievement)
    await test_db.commit()

    progress_data = await checker.check_achievement_progress(test_user.id, achievement)

    assert progress_data['current_progress'] == 1000
    assert progress_data['target_progress'] == 1000
    assert progress_data['is_completed'] is True


# ===== Test 14.2.8: Event Type Filtering =====

@pytest.mark.asyncio
async def test_event_type_filtering(test_db, test_user, sample_analytics_events):
    """測試事件類型篩選邏輯"""
    checker = AchievementChecker(test_db)

    # 建立社交分享成就
    achievement = Achievement(
        id=uuid4(),
        code="SHARE_MASTER",
        name_zh_tw="分享達人",
        criteria={
            "type": "SHARE_COUNT",
            "target": 5
        },
        rewards={"karma_points": 150},
        category=AchievementCategory.SOCIAL.value,
        rarity=AchievementRarity.COMMON.value,
        is_active=True
    )
    test_db.add(achievement)
    await test_db.commit()

    progress_data = await checker.check_achievement_progress(test_user.id, achievement)

    # 應該只計算 reading_shared 事件
    assert progress_data['current_progress'] == 3
    assert progress_data['is_completed'] is False  # 未達 5 次


# ===== Test 14.2.9: Already Unlocked Achievement =====

@pytest.mark.asyncio
async def test_already_unlocked_not_relocked(test_db, test_user, sample_analytics_events):
    """測試已解鎖的成就不會重複解鎖"""
    checker = AchievementChecker(test_db)

    achievement = Achievement(
        id=uuid4(),
        code="FIRST_READING",
        name_zh_tw="廢土新手",
        criteria={"type": "READING_COUNT", "target": 1},
        rewards={"karma_points": 50},
        category=AchievementCategory.READING.value,
        rarity=AchievementRarity.COMMON.value,
        is_active=True
    )
    test_db.add(achievement)

    # 建立已解鎖的進度
    progress = UserAchievementProgress(
        user_id=test_user.id,
        achievement_id=achievement.id,
        current_progress=1,
        target_progress=1,
        status=AchievementStatus.UNLOCKED.value,
        unlocked_at=datetime.utcnow() - timedelta(days=1)
    )
    test_db.add(progress)
    await test_db.commit()

    newly_unlocked = await checker.check_and_unlock_achievements(
        user_id=test_user.id,
        achievement_codes=["FIRST_READING"]
    )

    # 不應該出現在 newly_unlocked 中
    assert len(newly_unlocked) == 0


# ===== Test 14.2.10: Multiple Achievements Unlock =====

@pytest.mark.asyncio
async def test_multiple_achievements_unlock(test_db, test_user, sample_analytics_events):
    """測試批次解鎖多個成就"""
    checker = AchievementChecker(test_db)

    # 建立兩個可解鎖的成就
    achievements = [
        Achievement(
            id=uuid4(),
            code="FIRST_READING",
            name_zh_tw="廢土新手",
            criteria={"type": "READING_COUNT", "target": 1},
            rewards={"karma_points": 50},
            category=AchievementCategory.READING.value,
            rarity=AchievementRarity.COMMON.value,
            is_active=True
        ),
        Achievement(
            id=uuid4(),
            code="READING_FAN",
            name_zh_tw="占卜愛好者",
            criteria={"type": "READING_COUNT", "target": 5},
            rewards={"karma_points": 100},
            category=AchievementCategory.READING.value,
            rarity=AchievementRarity.COMMON.value,
            is_active=True
        ),
    ]

    for ach in achievements:
        test_db.add(ach)
        progress = UserAchievementProgress(
            user_id=test_user.id,
            achievement_id=ach.id,
            current_progress=0,
            target_progress=ach.criteria['target'],
            status=AchievementStatus.IN_PROGRESS.value
        )
        test_db.add(progress)

    await test_db.commit()

    newly_unlocked = await checker.check_and_unlock_achievements(
        user_id=test_user.id,
        achievement_codes=["FIRST_READING", "READING_FAN"]
    )

    # 兩個成就都應該解鎖（都已達成條件）
    assert len(newly_unlocked) == 2
    codes = [u['achievement'].code for u in newly_unlocked]
    assert "FIRST_READING" in codes
    assert "READING_FAN" in codes
