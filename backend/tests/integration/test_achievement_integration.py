"""
Integration Tests for Achievement System
測試成就系統與其他系統的整合
"""

import pytest
import pytest_asyncio
from datetime import datetime, timedelta
from uuid import uuid4
from unittest.mock import AsyncMock, patch, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select

from app.services.achievement_service import AchievementService
from app.services.achievement_checker import AchievementChecker
from app.services.karma_service import KarmaService
from app.models.achievement import (
    Achievement,
    UserAchievementProgress,
    AchievementCategory,
    AchievementRarity,
    AchievementStatus
)
from app.models.user import User, UserProfile
from app.models.user_analytics import AnalyticsEvent
from app.models.social_features import KarmaHistory, KarmaChangeReason


@pytest_asyncio.fixture
async def test_db():
    """建立整合測試資料庫"""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False
    )

    # 建立所有相關表
    async with engine.begin() as conn:
        await conn.run_sync(Achievement.__table__.create)
        await conn.run_sync(UserAchievementProgress.__table__.create)
        await conn.run_sync(User.__table__.create)
        await conn.run_sync(UserProfile.__table__.create)
        await conn.run_sync(AnalyticsEvent.__table__.create)
        await conn.run_sync(KarmaHistory.__table__.create)

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
async def test_user_with_profile(test_db):
    """建立測試使用者和 Profile"""
    user = User(
        id=uuid4(),
        email="test@example.com",
        name="Test User",
        password_hash="hashed",
        karma_points=0
    )
    test_db.add(user)

    profile = UserProfile(
        user_id=user.id,
        current_title=None,
        unlocked_titles=[]
    )
    test_db.add(profile)

    await test_db.commit()
    await test_db.refresh(user)
    await test_db.refresh(profile)

    return user, profile


@pytest_asyncio.fixture
async def sample_achievement(test_db):
    """建立範例成就"""
    achievement = Achievement(
        id=uuid4(),
        code="FIRST_READING",
        name_zh_tw="廢土新手",
        description_zh_tw="完成你的第一次占卜",
        category=AchievementCategory.READING.value,
        rarity=AchievementRarity.COMMON.value,
        criteria={"type": "READING_COUNT", "target": 1},
        rewards={"karma_points": 50, "title": "廢土新手"},
        is_hidden=False,
        is_active=True,
        display_order=1
    )
    test_db.add(achievement)
    await test_db.commit()
    await test_db.refresh(achievement)
    return achievement


# ===== Test 15.1.1: User Registration Initialization =====

@pytest.mark.asyncio
async def test_user_registration_initializes_achievements(test_db):
    """測試使用者註冊時初始化成就進度"""
    # 建立成就
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
            code="SOCIAL_BUTTERFLY",
            name_zh_tw="社交達人",
            criteria={"type": "FRIEND_COUNT", "target": 10},
            rewards={"karma_points": 200},
            category=AchievementCategory.SOCIAL.value,
            rarity=AchievementRarity.RARE.value,
            is_active=True
        ),
    ]

    for ach in achievements:
        test_db.add(ach)
    await test_db.commit()

    # 建立新使用者
    user = User(
        id=uuid4(),
        email="newuser@example.com",
        name="New User",
        password_hash="hashed"
    )
    test_db.add(user)
    await test_db.commit()

    # 初始化成就
    achievement_service = AchievementService(test_db)
    await achievement_service.initialize_user_achievements(user.id)

    # 驗證所有成就都已初始化
    progress = await achievement_service.get_user_progress(user.id)

    assert len(progress) == 2
    assert all(p.status == AchievementStatus.IN_PROGRESS.value for p in progress)
    assert all(p.current_progress == 0 for p in progress)


# ===== Test 15.1.2: Reading Completion Triggers Achievement =====

@pytest.mark.asyncio
async def test_reading_completion_triggers_achievement_check(
    test_db,
    test_user_with_profile,
    sample_achievement
):
    """測試占卜完成觸發成就檢查的流程"""
    user, profile = test_user_with_profile

    # 初始化成就進度
    progress = UserAchievementProgress(
        user_id=user.id,
        achievement_id=sample_achievement.id,
        current_progress=0,
        target_progress=1,
        status=AchievementStatus.IN_PROGRESS.value
    )
    test_db.add(progress)
    await test_db.commit()

    # 建立占卜完成事件
    event = AnalyticsEvent(
        user_id=user.id,
        event_type='reading_completed',
        event_data={'reading_id': 'test-reading-123'},
        created_at=datetime.utcnow()
    )
    test_db.add(event)
    await test_db.commit()

    # 觸發成就檢查
    achievement_service = AchievementService(test_db)
    newly_unlocked = await achievement_service.unlock_achievements_for_user(
        user_id=user.id,
        trigger_event='reading_completed',
        event_context={'reading_id': 'test-reading-123'}
    )

    # 驗證成就已解鎖
    assert len(newly_unlocked) > 0
    assert newly_unlocked[0]['achievement'].code == "FIRST_READING"

    # 驗證進度更新
    await test_db.refresh(progress)
    assert progress.status == AchievementStatus.UNLOCKED.value
    assert progress.unlocked_at is not None


# ===== Test 15.1.3: Login Triggers Consecutive Checkin =====

@pytest.mark.asyncio
async def test_login_triggers_consecutive_checkin_achievement(test_db):
    """測試登入觸發連續簽到成就檢查的流程"""
    # 建立連續簽到成就
    achievement = Achievement(
        id=uuid4(),
        code="WEEK_WARRIOR",
        name_zh_tw="一週戰士",
        criteria={"type": "CONSECUTIVE_LOGIN", "target": 7},
        rewards={"karma_points": 200},
        category=AchievementCategory.BINGO.value,
        rarity=AchievementRarity.RARE.value,
        is_active=True
    )
    test_db.add(achievement)

    # 建立使用者
    user = User(
        id=uuid4(),
        email="test@example.com",
        name="Test User",
        password_hash="hashed"
    )
    test_db.add(user)

    # 建立進度
    progress = UserAchievementProgress(
        user_id=user.id,
        achievement_id=achievement.id,
        current_progress=0,
        target_progress=7,
        status=AchievementStatus.IN_PROGRESS.value
    )
    test_db.add(progress)

    await test_db.commit()

    # 建立連續 7 天登入事件
    for i in range(7):
        event = AnalyticsEvent(
            user_id=user.id,
            event_type='user_login',
            event_data={'login_method': 'password'},
            created_at=datetime.utcnow() - timedelta(days=6-i)
        )
        test_db.add(event)

    await test_db.commit()

    # 觸發登入成就檢查
    achievement_service = AchievementService(test_db)
    newly_unlocked = await achievement_service.unlock_achievements_for_user(
        user_id=user.id,
        trigger_event='login',
        event_context={'login_time': datetime.utcnow().isoformat()}
    )

    # 驗證成就解鎖
    assert any(u['achievement'].code == "WEEK_WARRIOR" for u in newly_unlocked)


# ===== Test 15.1.4: Karma Service Integration =====

@pytest.mark.asyncio
async def test_achievement_unlock_integrates_with_karma_service(
    test_db,
    test_user_with_profile,
    sample_achievement
):
    """測試成就解鎖時 Karma Service 的整合"""
    user, profile = test_user_with_profile

    # 建立已解鎖的成就
    progress = UserAchievementProgress(
        user_id=user.id,
        achievement_id=sample_achievement.id,
        current_progress=1,
        target_progress=1,
        status=AchievementStatus.UNLOCKED.value,
        unlocked_at=datetime.utcnow()
    )
    test_db.add(progress)
    await test_db.commit()

    # 領取獎勵（應該調用 Karma Service）
    achievement_service = AchievementService(test_db)

    # Mock Karma Service 以驗證調用
    with patch.object(achievement_service.karma_service, 'add_karma', new_callable=AsyncMock) as mock_karma:
        result = await achievement_service.claim_reward(
            user_id=user.id,
            achievement_code="FIRST_READING"
        )

        # 驗證 Karma Service 被調用
        mock_karma.assert_called_once_with(
            user_id=user.id,
            change_amount=50,
            reason=KarmaChangeReason.COMMUNITY_CONTRIBUTION,
            reason_description=f"完成成就「{sample_achievement.name_zh_tw}」",
            triggered_by_action=f"achievement_claim_{sample_achievement.code}"
        )

        assert result['rewards']['karma_points'] == 50


# ===== Test 15.1.5: Analytics Event Logging =====

@pytest.mark.asyncio
async def test_achievement_unlock_logs_analytics_event(
    test_db,
    test_user_with_profile,
    sample_achievement
):
    """測試成就解鎖時 Analytics 事件記錄的整合"""
    user, profile = test_user_with_profile

    # 建立進度
    progress = UserAchievementProgress(
        user_id=user.id,
        achievement_id=sample_achievement.id,
        current_progress=0,
        target_progress=1,
        status=AchievementStatus.IN_PROGRESS.value
    )
    test_db.add(progress)

    # 建立占卜事件
    reading_event = AnalyticsEvent(
        user_id=user.id,
        event_type='reading_completed',
        event_data={'reading_id': 'test-123'},
        created_at=datetime.utcnow()
    )
    test_db.add(reading_event)

    await test_db.commit()

    # 觸發成就解鎖
    achievement_service = AchievementService(test_db)
    newly_unlocked = await achievement_service.unlock_achievements_for_user(
        user_id=user.id,
        trigger_event='reading_completed',
        event_context={'reading_id': 'test-123'}
    )

    await test_db.commit()

    # 驗證 Analytics 事件已記錄
    result = await test_db.execute(
        select(AnalyticsEvent).where(
            AnalyticsEvent.user_id == user.id,
            AnalyticsEvent.event_type == 'achievement_unlocked'
        )
    )
    unlock_events = result.scalars().all()

    assert len(unlock_events) > 0
    assert unlock_events[0].event_data['achievement_code'] == "FIRST_READING"


# ===== Test 15.2.1: Migration Script Performance =====

@pytest.mark.asyncio
async def test_migration_script_calculates_historical_progress(test_db):
    """測試 Migration 腳本正確計算歷史進度"""
    # 建立使用者
    users = [
        User(
            id=uuid4(),
            email=f"user{i}@example.com",
            name=f"User {i}",
            password_hash="hashed"
        )
        for i in range(10)
    ]

    for user in users:
        test_db.add(user)

    # 建立成就
    achievement = Achievement(
        id=uuid4(),
        code="READING_FAN",
        name_zh_tw="占卜愛好者",
        criteria={"type": "READING_COUNT", "target": 5},
        rewards={"karma_points": 100},
        category=AchievementCategory.READING.value,
        rarity=AchievementRarity.COMMON.value,
        is_active=True
    )
    test_db.add(achievement)

    await test_db.commit()

    # 為每個使用者建立不同數量的歷史事件
    for i, user in enumerate(users):
        for j in range(i + 1):  # User 0: 1 event, User 1: 2 events, etc.
            event = AnalyticsEvent(
                user_id=user.id,
                event_type='reading_completed',
                event_data={'reading_id': f'reading-{j}'},
                created_at=datetime.utcnow() - timedelta(days=j)
            )
            test_db.add(event)

    await test_db.commit()

    # 執行 Migration（模擬 recalculate_user_progress）
    achievement_service = AchievementService(test_db)

    results = []
    for user in users:
        result = await achievement_service.recalculate_user_progress(user.id)
        results.append(result)

    # 驗證所有使用者的進度都正確計算
    assert len(results) == 10

    # 驗證 User 4 (5 events) 應該已解鎖
    result_4 = await test_db.execute(
        select(UserAchievementProgress).where(
            UserAchievementProgress.user_id == users[4].id,
            UserAchievementProgress.achievement_id == achievement.id
        )
    )
    progress_4 = result_4.scalar_one()

    assert progress_4.current_progress == 5
    assert progress_4.status == AchievementStatus.UNLOCKED.value


# ===== Test 15.2.2: Concurrent Progress Updates =====

@pytest.mark.asyncio
async def test_concurrent_progress_updates_maintain_consistency(test_db):
    """測試並發進度更新時的資料一致性"""
    import asyncio

    # 建立使用者和成就
    user = User(
        id=uuid4(),
        email="concurrent@example.com",
        name="Concurrent User",
        password_hash="hashed"
    )
    test_db.add(user)

    achievement = Achievement(
        id=uuid4(),
        code="CONCURRENT_TEST",
        name_zh_tw="並發測試",
        criteria={"type": "READING_COUNT", "target": 10},
        rewards={"karma_points": 100},
        category=AchievementCategory.READING.value,
        rarity=AchievementRarity.COMMON.value,
        is_active=True
    )
    test_db.add(achievement)

    progress = UserAchievementProgress(
        user_id=user.id,
        achievement_id=achievement.id,
        current_progress=0,
        target_progress=10,
        status=AchievementStatus.IN_PROGRESS.value
    )
    test_db.add(progress)

    await test_db.commit()

    # 模擬並發更新（建立多個 Analytics 事件）
    events = [
        AnalyticsEvent(
            user_id=user.id,
            event_type='reading_completed',
            event_data={'reading_id': f'reading-{i}'},
            created_at=datetime.utcnow() - timedelta(seconds=i)
        )
        for i in range(10)
    ]

    for event in events:
        test_db.add(event)

    await test_db.commit()

    # 重新計算進度
    achievement_service = AchievementService(test_db)
    result = await achievement_service.recalculate_user_progress(user.id)

    # 驗證最終進度正確
    await test_db.refresh(progress)
    assert progress.current_progress == 10
    assert progress.status == AchievementStatus.UNLOCKED.value
    assert result['newly_unlocked_count'] == 1
