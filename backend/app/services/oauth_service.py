"""
OAuth 使用者管理服務

處理 Google OAuth 使用者的建立和更新邏輯。
支援新使用者建立、現有使用者 OAuth 綁定、以及 OAuth 使用者查詢。
"""

import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User


async def create_or_update_oauth_user(
    db: AsyncSession,
    email: str,
    name: str | None,
    oauth_provider: str,
    oauth_id: str,
    profile_picture_url: str | None = None
) -> User:
    """
    建立或更新 OAuth 使用者

    處理三種情境：
    1. 新使用者：建立新的 OAuth 使用者記錄（password_hash=NULL）
    2. 現有使用者無 OAuth：更新 oauth_provider 和 oauth_id
    3. 現有 OAuth 使用者：直接返回

    Args:
        db: 資料庫 session
        email: 使用者 email
        name: 使用者名稱（若為 None 或空字串，使用 email 本地部分）
        oauth_provider: OAuth 提供者（例如："google"）
        oauth_id: OAuth 提供者的使用者 ID
        profile_picture_url: 使用者頭像 URL（可選）

    Returns:
        User: 建立或更新後的使用者物件

    Raises:
        ValueError: 若 email 格式無效

    Example:
        ```python
        user = create_or_update_oauth_user(
            db=db,
            email="user@gmail.com",
            name="John Doe",
            oauth_provider="google",
            oauth_id="google_123456",
            profile_picture_url="https://example.com/photo.jpg"
        )
        ```
    """
    # 驗證 email 格式
    if not _is_valid_email(email):
        raise ValueError(f"無效的 email 格式: {email}")

    # 處理缺失的 name：使用 email 本地部分
    if not name or name.strip() == "":
        name = email.split("@")[0]

    # 查詢現有使用者
    result = await db.execute(select(User).where(User.email == email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        # 情境 2 & 3: 現有使用者
        if existing_user.oauth_provider is None:
            # 情境 2: 現有使用者無 OAuth 資料，進行綁定
            existing_user.oauth_provider = oauth_provider
            existing_user.oauth_id = oauth_id
            if profile_picture_url:
                existing_user.profile_picture_url = profile_picture_url
            await db.commit()
            await db.refresh(existing_user)

        # 情境 3: 已有 OAuth 資料，直接返回
        return existing_user

    # 情境 1: 新使用者，建立記錄
    new_user = User(
        email=email,
        name=name,
        oauth_provider=oauth_provider,
        oauth_id=oauth_id,
        profile_picture_url=profile_picture_url,
        password_hash=None  # OAuth 使用者無密碼
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # 初始化 Karma（需求 3.4, 12.4）
    try:
        from app.services.karma_service import KarmaService
        import logging
        logger = logging.getLogger(__name__)

        karma_service = KarmaService(db)
        await karma_service.initialize_karma_for_user(str(new_user.id))
        logger.info(f"Karma initialized for new OAuth user: {new_user.id}")
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to initialize karma for OAuth user {new_user.id}: {str(e)}")
        # 不拋出錯誤，繼續完成註冊流程

    return new_user


async def get_oauth_user(
    db: AsyncSession,
    oauth_provider: str,
    oauth_id: str
) -> User | None:
    """
    根據 OAuth 提供者和 ID 查詢使用者

    Args:
        db: 資料庫 session
        oauth_provider: OAuth 提供者（例如："google"）
        oauth_id: OAuth 提供者的使用者 ID

    Returns:
        User | None: 找到的使用者物件，若不存在則返回 None

    Example:
        ```python
        user = await get_oauth_user(
            db=db,
            oauth_provider="google",
            oauth_id="google_123456"
        )
        if user:
            print(f"找到使用者: {user.email}")
        ```
    """
    result = await db.execute(
        select(User).where(
            User.oauth_provider == oauth_provider,
            User.oauth_id == oauth_id
        )
    )
    return result.scalar_one_or_none()


def _is_valid_email(email: str) -> bool:
    """
    驗證 email 格式

    使用正則表達式檢查 email 是否符合基本格式要求。

    Args:
        email: 要驗證的 email 字串

    Returns:
        bool: 格式正確返回 True，否則返回 False
    """
    if not email:
        return False

    # 基本 email 格式驗證
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))
