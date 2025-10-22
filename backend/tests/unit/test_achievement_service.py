"""
Unit tests for Achievement Service
測試成就系統服務層業務邏輯
"""

import pytest
import pytest_asyncio
from datetime import datetime, timedelta
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import text

from app.services.achievement_service import AchievementService
from app.models.achievement import (
    Achievement,
    UserAchievementProgress,
    AchievementCategory,
    AchievementRarity,
    AchievementStatus
)
from app.models.user import User, UserProfile


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
        await conn.run_sync(UserProfile.__table__.create)

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
async def sample_achievements(test_db):
    """建立範例成就資料"""
    achievements = [
        Achievement(
            id=uuid4(),
            code="FIRST_READING",
            name_zh_tw="廢土新手",
            description_zh_tw="完成你的第一次占卜",
            category=AchievementCategory.READING.value,
            rarity=AchievementRarity.COMMON.value,
            criteria={"type": "READING_COUNT", "target": 1},
            rewards={"karma_points": 50},
            is_hidden=False,
            is_active=True,
            display_order=1
        ),
        Achievement(
            id=uuid4(),
            code="READING_MASTER",
            name_zh_tw="占卜大師",
            description_zh_tw="完成 100 次占卜",
            category=AchievementCategory.READING.value,
            rarity=AchievementRarity.EPIC.value,
            criteria={"type": "READING_COUNT", "target": 100},
            rewards={"karma_points": 500, "title": "占卜大師"},
            is_hidden=False,
            is_active=True,
            display_order=2
        ),
        Achievement(
            id=uuid4(),
            code="SOCIAL_BUTTERFLY",
            name_zh_tw="社交達人",
            description_zh_tw="結交 10 位好友",
            category=AchievementCategory.SOCIAL.value,
            rarity=AchievementRarity.RARE.value,
            criteria={"type": "FRIEND_COUNT", "target": 10},
            rewards={"karma_points": 200},
            is_hidden=False,
            is_active=True,
            display_order=3
        ),
        Achievement(
            id=uuid4(),
            code="HIDDEN_MASTER",
            name_zh_tw="隱藏成就",
            description_zh_tw="神秘的隱藏成就",
            category=AchievementCategory.EXPLORATION.value,
            rarity=AchievementRarity.LEGENDARY.value,
            criteria={"type": "SECRET", "target": 1},
            rewards={"karma_points": 1000},
            is_hidden=True,
            is_active=True,
            display_order=4
        ),
    ]

    for achievement in achievements:
        test_db.add(achievement)

    await test_db.commit()

    # 刷新以取得 DB ID
    for achievement in achievements:
        await test_db.refresh(achievement)

    return achievements


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


# ===== Test 14.1.1: Query Achievements with Category Filter =====

@pytest.mark.asyncio
async def test_get_all_achievements_no_filter(test_db, sample_achievements):
    """測試查詢所有成就（不包含隱藏）"""
    service = AchievementService(test_db)

    achievements = await service.get_all_achievements(include_hidden=False)

    assert len(achievements) == 3  # 不包含隱藏成就
    assert all(not a.is_hidden for a in achievements)


@pytest.mark.asyncio
async def test_get_all_achievements_with_category_filter(test_db, sample_achievements):
    """測試查詢特定類別成就"""
    service = AchievementService(test_db)

    reading_achievements = await service.get_all_achievements(
        category=AchievementCategory.READING,
        include_hidden=False
    )

    assert len(reading_achievements) == 2
    assert all(a.category == AchievementCategory.READING.value for a in reading_achievements)


@pytest.mark.asyncio
async def test_get_all_achievements_include_hidden(test_db, sample_achievements):
    """測試查詢包含隱藏成就"""
    service = AchievementService(test_db)

    achievements = await service.get_all_achievements(include_hidden=True)

    assert len(achievements) == 4  # 包含隱藏成就
    hidden = [a for a in achievements if a.is_hidden]
    assert len(hidden) == 1
    assert hidden[0].code == "HIDDEN_MASTER"


# ===== Test 14.1.2: Query User Progress =====

@pytest.mark.asyncio
async def test_get_user_progress_with_data(test_db, sample_achievements, test_user):
    """測試查詢使用者進度（有進度資料）"""
    service = AchievementService(test_db)

    # 建立進度記錄
    progress = UserAchievementProgress(
        user_id=test_user.id,
        achievement_id=sample_achievements[0].id,
        current_progress=1,
        target_progress=1,
        status=AchievementStatus.UNLOCKED.value,
        unlocked_at=datetime.utcnow()
    )
    test_db.add(progress)
    await test_db.commit()

    user_progress = await service.get_user_progress(test_user.id)

    assert len(user_progress) == 1
    assert user_progress[0].status == AchievementStatus.UNLOCKED.value
    assert user_progress[0].current_progress == 1


@pytest.mark.asyncio
async def test_get_user_progress_empty(test_db, test_user):
    """測試查詢使用者進度（無資料）"""
    service = AchievementService(test_db)

    user_progress = await service.get_user_progress(test_user.id)

    assert len(user_progress) == 0


@pytest.mark.asyncio
async def test_get_user_progress_with_status_filter(test_db, sample_achievements, test_user):
    """測試查詢特定狀態的使用者進度"""
    service = AchievementService(test_db)

    # 建立不同狀態的進度
    progress_list = [
        UserAchievementProgress(
            user_id=test_user.id,
            achievement_id=sample_achievements[0].id,
            current_progress=1,
            target_progress=1,
            status=AchievementStatus.UNLOCKED.value,
            unlocked_at=datetime.utcnow()
        ),
        UserAchievementProgress(
            user_id=test_user.id,
            achievement_id=sample_achievements[1].id,
            current_progress=50,
            target_progress=100,
            status=AchievementStatus.IN_PROGRESS.value
        ),
    ]

    for p in progress_list:
        test_db.add(p)
    await test_db.commit()

    unlocked_progress = await service.get_user_progress(
        test_user.id,
        status=AchievementStatus.UNLOCKED
    )

    assert len(unlocked_progress) == 1
    assert unlocked_progress[0].status == AchievementStatus.UNLOCKED.value


# ===== Test 14.1.3: Achievement Unlock Flow =====

@pytest.mark.asyncio
async def test_unlock_achievements_for_user(test_db, sample_achievements, test_user):
    """測試成就解鎖流程"""
    service = AchievementService(test_db)

    # Mock AchievementChecker 的回傳
    with patch.object(service.checker, 'check_and_unlock_achievements', new_callable=AsyncMock) as mock_check:
        mock_check.return_value = [
            {
                'achievement': sample_achievements[0],
                'current_progress': 1,
                'target_progress': 1,
                'just_unlocked': True
            }
        ]

        newly_unlocked = await service.unlock_achievements_for_user(
            user_id=test_user.id,
            trigger_event='reading_completed',
            event_context={'reading_id': 'test-123'}
        )

        assert len(newly_unlocked) == 1
        assert newly_unlocked[0]['achievement'].code == "FIRST_READING"
        mock_check.assert_called_once()


# ===== Test 14.1.5: Reward Claiming =====

@pytest.mark.asyncio
async def test_claim_reward_success(test_db, sample_achievements, test_user):
    """測試成功領取獎勵"""
    service = AchievementService(test_db)

    # 建立已解鎖的成就進度
    progress = UserAchievementProgress(
        user_id=test_user.id,
        achievement_id=sample_achievements[0].id,
        current_progress=1,
        target_progress=1,
        status=AchievementStatus.UNLOCKED.value,
        unlocked_at=datetime.utcnow()
    )
    test_db.add(progress)
    await test_db.commit()

    # Mock Karma Service
    with patch.object(service.karma_service, 'add_karma', new_callable=AsyncMock) as mock_karma:
        result = await service.claim_reward(
            user_id=test_user.id,
            achievement_code="FIRST_READING"
        )

        assert result['success'] is True
        assert result['achievement_code'] == "FIRST_READING"
        assert result['rewards']['karma_points'] == 50
        mock_karma.assert_called_once()

    # 驗證狀態已更新
    await test_db.refresh(progress)
    assert progress.status == AchievementStatus.CLAIMED.value
    assert progress.claimed_at is not None


@pytest.mark.asyncio
async def test_claim_reward_not_unlocked(test_db, sample_achievements, test_user):
    """測試嘗試領取尚未解鎖的成就"""
    service = AchievementService(test_db)

    # 建立進行中的成就
    progress = UserAchievementProgress(
        user_id=test_user.id,
        achievement_id=sample_achievements[1].id,
        current_progress=50,
        target_progress=100,
        status=AchievementStatus.IN_PROGRESS.value
    )
    test_db.add(progress)
    await test_db.commit()

    with pytest.raises(ValueError, match="尚未解鎖"):
        await service.claim_reward(
            user_id=test_user.id,
            achievement_code="READING_MASTER"
        )


@pytest.mark.asyncio
async def test_claim_reward_already_claimed(test_db, sample_achievements, test_user):
    """測試嘗試重複領取獎勵"""
    service = AchievementService(test_db)

    # 建立已領取的成就
    progress = UserAchievementProgress(
        user_id=test_user.id,
        achievement_id=sample_achievements[0].id,
        current_progress=1,
        target_progress=1,
        status=AchievementStatus.CLAIMED.value,
        unlocked_at=datetime.utcnow(),
        claimed_at=datetime.utcnow()
    )
    test_db.add(progress)
    await test_db.commit()

    with pytest.raises(ValueError, match="已經領取"):
        await service.claim_reward(
            user_id=test_user.id,
            achievement_code="FIRST_READING"
        )


@pytest.mark.asyncio
async def test_claim_reward_achievement_not_found(test_db, test_user):
    """測試嘗試領取不存在的成就"""
    service = AchievementService(test_db)

    with pytest.raises(ValueError, match="找不到成就"):
        await service.claim_reward(
            user_id=test_user.id,
            achievement_code="NONEXISTENT"
        )


# ===== Test 14.1.6: Karma Service Failure Handling =====

@pytest.mark.asyncio
async def test_claim_reward_karma_failure(test_db, sample_achievements, test_user):
    """測試 Karma Service 失敗時的錯誤處理"""
    service = AchievementService(test_db)

    # 建立已解鎖的成就
    progress = UserAchievementProgress(
        user_id=test_user.id,
        achievement_id=sample_achievements[0].id,
        current_progress=1,
        target_progress=1,
        status=AchievementStatus.UNLOCKED.value,
        unlocked_at=datetime.utcnow()
    )
    test_db.add(progress)
    await test_db.commit()

    # Mock Karma Service 失敗
    with patch.object(service.karma_service, 'add_karma', side_effect=Exception("Karma service down")):
        with pytest.raises(ValueError, match="獎勵發放失敗"):
            await service.claim_reward(
                user_id=test_user.id,
                achievement_code="FIRST_READING"
            )

    # 驗證狀態保持 UNLOCKED（可重試）
    await test_db.refresh(progress)
    assert progress.status == AchievementStatus.UNLOCKED.value


# ===== Test 14.1.4: Initialize User Achievements =====

@pytest.mark.asyncio
async def test_initialize_user_achievements(test_db, sample_achievements, test_user):
    """測試初始化新使用者的成就進度"""
    service = AchievementService(test_db)

    await service.initialize_user_achievements(test_user.id)

    # 驗證所有成就（包含隱藏）都已建立進度記錄
    user_progress = await service.get_user_progress(test_user.id)

    assert len(user_progress) == 4  # 包含隱藏成就
    assert all(p.status == AchievementStatus.IN_PROGRESS.value for p in user_progress)
    assert all(p.current_progress == 0 for p in user_progress)


# ===== Test 14.1.7: Title Granting =====

@pytest.mark.asyncio
async def test_grant_title_new_profile(test_db, test_user):
    """測試授予稱號（新 Profile）"""
    service = AchievementService(test_db)

    await service._grant_title(test_user.id, "占卜大師")

    # 驗證 Profile 建立
    from sqlalchemy import select
    result = await test_db.execute(
        select(UserProfile).where(UserProfile.user_id == test_user.id)
    )
    profile = result.scalar_one()

    assert profile.current_title == "占卜大師"
    assert "占卜大師" in profile.unlocked_titles


@pytest.mark.asyncio
async def test_grant_title_existing_profile(test_db, test_user):
    """測試授予稱號（已有 Profile）"""
    service = AchievementService(test_db)

    # 建立現有 Profile
    profile = UserProfile(
        user_id=test_user.id,
        current_title="新手",
        unlocked_titles=["新手"]
    )
    test_db.add(profile)
    await test_db.commit()

    await service._grant_title(test_user.id, "大師")

    await test_db.refresh(profile)
    assert "大師" in profile.unlocked_titles
    assert len(profile.unlocked_titles) == 2
