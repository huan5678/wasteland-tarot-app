"""
Authentication Helper Functions

提供認證相關的輔助函式，用於檢查用戶認證方式和 Karma 獎勵整合。

Functions:
- user_has_passkey(): 檢查用戶是否有註冊 Passkey
- user_has_password(): 檢查用戶是否有設定密碼
- user_has_oauth(): 檢查用戶是否有 OAuth 連結
- award_first_passkey_registration_karma(): 首次 Passkey 註冊 Karma 獎勵
- award_first_passkey_login_karma(): 首次 Passkey 登入 Karma 獎勵
- award_add_passkey_karma(): 新增額外 Passkey Karma 獎勵
"""

from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.user import User
from app.models.credential import Credential
from app.models.social_features import KarmaHistory, KarmaChangeReason


# Karma 獎勵規則
KARMA_REWARDS = {
    "first_passkey_registration": 50,  # 首次註冊 Passkey
    "first_passkey_login": 20,         # 首次使用 Passkey 登入
    "add_passkey": 10,                 # 新增額外 Passkey
}


async def user_has_passkey(user_id: UUID, db: AsyncSession) -> bool:
    """
    檢查用戶是否有註冊 Passkey

    Args:
        user_id: 用戶 ID
        db: 資料庫 session

    Returns:
        bool: True 如果用戶有至少一個 passkey，否則 False
    """
    result = await db.execute(
        select(func.count(Credential.id))
        .where(Credential.user_id == user_id)
    )
    count = result.scalar()
    return count > 0


async def user_has_password(user_id: UUID, db: AsyncSession) -> bool:
    """
    檢查用戶是否有設定密碼

    Args:
        user_id: 用戶 ID
        db: 資料庫 session

    Returns:
        bool: True 如果用戶有密碼，否則 False (OAuth only 用戶)
    """
    result = await db.execute(
        select(User.password_hash)
        .where(User.id == user_id)
    )
    password_hash = result.scalar_one_or_none()
    return password_hash is not None


async def user_has_oauth(user_id: UUID, db: AsyncSession) -> bool:
    """
    檢查用戶是否有 OAuth 連結

    Args:
        user_id: 用戶 ID
        db: 資料庫 session

    Returns:
        bool: True 如果用戶有 OAuth 連結，否則 False
    """
    result = await db.execute(
        select(User.oauth_provider)
        .where(User.id == user_id)
    )
    oauth_provider = result.scalar_one_or_none()
    return oauth_provider is not None


async def _has_received_karma_reward(
    user_id: UUID,
    reason: str,
    db: AsyncSession
) -> bool:
    """
    檢查用戶是否已經領取過特定的 Karma 獎勵

    Args:
        user_id: 用戶 ID
        reason: Karma 變更原因（如 "passkey_first_registration"）
        db: 資料庫 session

    Returns:
        bool: True 如果已領取，False 如果尚未領取
    """
    result = await db.execute(
        select(func.count(KarmaHistory.id))
        .where(KarmaHistory.user_id == user_id)
        .where(KarmaHistory.reason == reason)
    )
    count = result.scalar()
    return count > 0


async def award_first_passkey_registration_karma(
    user_id: UUID,
    db: AsyncSession
) -> Optional[KarmaHistory]:
    """
    首次 Passkey 註冊獎勵 50 Karma

    只能領取一次，重複呼叫不會給予獎勵。

    Args:
        user_id: 用戶 ID
        db: 資料庫 session

    Returns:
        KarmaHistory: Karma 變更記錄，如果已領取則回傳 None
    """
    reason = "passkey_first_registration"

    # 檢查是否已領取
    if await _has_received_karma_reward(user_id, reason, db):
        return None

    # 獲取用戶
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        return None

    # 計算新的 Karma
    karma_before = user.karma_score
    karma_change = KARMA_REWARDS["first_passkey_registration"]
    karma_after = min(100, karma_before + karma_change)  # 上限 100

    # 更新用戶 Karma
    user.karma_score = karma_after

    # 建立 Karma 歷史記錄
    karma_history = KarmaHistory(
        user_id=user_id,
        karma_before=karma_before,
        karma_after=karma_after,
        karma_change=karma_change,
        reason=reason,
        reason_description="首次註冊 Passkey",
        triggered_by_action="passkey_registration",
        action_context={"is_first_passkey": True},
        faction_influence=user.faction_alignment,
        alignment_before=_get_alignment_from_karma(karma_before),
        alignment_after=_get_alignment_from_karma(karma_after),
        alignment_changed=_get_alignment_from_karma(karma_before) != _get_alignment_from_karma(karma_after),
        significant_threshold_crossed=False,
        automated_change=True,
        confidence_score=1.0,
        is_verified=True
    )

    db.add(karma_history)
    await db.commit()
    await db.refresh(karma_history)

    return karma_history


async def award_first_passkey_login_karma(
    user_id: UUID,
    db: AsyncSession
) -> Optional[KarmaHistory]:
    """
    首次 Passkey 登入獎勵 20 Karma

    只能領取一次，重複呼叫不會給予獎勵。

    Args:
        user_id: 用戶 ID
        db: 資料庫 session

    Returns:
        KarmaHistory: Karma 變更記錄，如果已領取則回傳 None
    """
    reason = "passkey_first_login"

    # 檢查是否已領取
    if await _has_received_karma_reward(user_id, reason, db):
        return None

    # 獲取用戶
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        return None

    # 計算新的 Karma
    karma_before = user.karma_score
    karma_change = KARMA_REWARDS["first_passkey_login"]
    karma_after = min(100, karma_before + karma_change)  # 上限 100

    # 更新用戶 Karma
    user.karma_score = karma_after

    # 建立 Karma 歷史記錄
    karma_history = KarmaHistory(
        user_id=user_id,
        karma_before=karma_before,
        karma_after=karma_after,
        karma_change=karma_change,
        reason=reason,
        reason_description="首次使用 Passkey 登入",
        triggered_by_action="passkey_authentication",
        action_context={"is_first_login": True},
        faction_influence=user.faction_alignment,
        alignment_before=_get_alignment_from_karma(karma_before),
        alignment_after=_get_alignment_from_karma(karma_after),
        alignment_changed=_get_alignment_from_karma(karma_before) != _get_alignment_from_karma(karma_after),
        significant_threshold_crossed=False,
        automated_change=True,
        confidence_score=1.0,
        is_verified=True
    )

    db.add(karma_history)
    await db.commit()
    await db.refresh(karma_history)

    return karma_history


async def award_add_passkey_karma(
    user_id: UUID,
    db: AsyncSession
) -> Optional[KarmaHistory]:
    """
    新增額外 Passkey 獎勵 10 Karma

    每次新增 passkey 都可獲得獎勵（無上限）。

    Args:
        user_id: 用戶 ID
        db: 資料庫 session

    Returns:
        KarmaHistory: Karma 變更記錄
    """
    reason = "passkey_add_additional"

    # 獲取用戶
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        return None

    # 計算新的 Karma
    karma_before = user.karma_score
    karma_change = KARMA_REWARDS["add_passkey"]
    karma_after = min(100, karma_before + karma_change)  # 上限 100

    # 更新用戶 Karma
    user.karma_score = karma_after

    # 建立 Karma 歷史記錄
    karma_history = KarmaHistory(
        user_id=user_id,
        karma_before=karma_before,
        karma_after=karma_after,
        karma_change=karma_change,
        reason=reason,
        reason_description="新增額外 Passkey",
        triggered_by_action="passkey_add",
        action_context={"is_additional_passkey": True},
        faction_influence=user.faction_alignment,
        alignment_before=_get_alignment_from_karma(karma_before),
        alignment_after=_get_alignment_from_karma(karma_after),
        alignment_changed=_get_alignment_from_karma(karma_before) != _get_alignment_from_karma(karma_after),
        significant_threshold_crossed=False,
        automated_change=True,
        confidence_score=1.0,
        is_verified=True
    )

    db.add(karma_history)
    await db.commit()
    await db.refresh(karma_history)

    return karma_history


def _get_alignment_from_karma(karma: int) -> str:
    """
    根據 Karma 分數取得陣營

    Args:
        karma: Karma 分數 (0-100)

    Returns:
        str: 陣營 ("good", "neutral", "evil")
    """
    if karma >= 70:
        return "good"
    elif karma <= 30:
        return "evil"
    else:
        return "neutral"
