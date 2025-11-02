"""
Gamification Karma Service
Handles Karma granting, level calculation, and level-up events for the Dashboard Gamification System
"""

from typing import Dict, Any, Optional
from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.models.gamification import KarmaLog, UserKarma
from app.models.user import User
from app.core.exceptions import UserNotFoundError


def calculate_level(total_karma: int) -> int:
    """
    計算用戶等級：Level = floor(total_karma / 500) + 1

    Args:
        total_karma: 總 Karma 數量

    Returns:
        int: 用戶等級 (最低為 1)

    Examples:
        >>> calculate_level(0)
        1
        >>> calculate_level(499)
        1
        >>> calculate_level(500)
        2
        >>> calculate_level(1000)
        3
    """
    return int(total_karma // 500) + 1


def calculate_karma_to_next_level(total_karma: int) -> int:
    """
    計算到下一級所需的 Karma

    Args:
        total_karma: 當前總 Karma

    Returns:
        int: 到下一級所需的 Karma 數量

    Examples:
        >>> calculate_karma_to_next_level(0)
        500
        >>> calculate_karma_to_next_level(250)
        250
        >>> calculate_karma_to_next_level(500)
        500
    """
    current_level = calculate_level(total_karma)
    next_level_requirement = current_level * 500
    return next_level_requirement - total_karma


class GamificationKarmaService:
    """
    Gamification Karma Service
    處理遊戲化 Karma 系統的核心邏輯
    """

    def __init__(self, db_session: AsyncSession):
        """
        初始化 Karma 服務

        Args:
            db_session: 資料庫會話
        """
        self.db = db_session

    async def grant_karma(
        self,
        user_id: UUID,
        action_type: str,
        karma_amount: int,
        description: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        授予用戶 Karma

        Args:
            user_id: 用戶 ID
            action_type: 行為類型 (e.g., 'complete_reading', 'daily_login')
            karma_amount: Karma 數量 (必須為正整數)
            description: 描述
            metadata: 額外資訊 (reading_id, task_id, etc.)

        Returns:
            Dict[str, Any]: {
                "success": True,
                "total_karma": 1260,
                "level_changed": False,
                "new_level": 3
            }

        Raises:
            UserNotFoundError: 用戶不存在
            ValueError: Karma 數量無效
            SQLAlchemyError: 資料庫錯誤
        """
        # 驗證 Karma 數量
        if karma_amount <= 0:
            raise ValueError(f"Karma amount must be positive, got {karma_amount}")

        # 開始事務
        try:
            # 1. 驗證用戶存在
            user = await self._get_user_by_id(user_id)

            # 2. 獲取或建立 UserKarma 記錄
            user_karma = await self._get_or_create_user_karma(user_id)

            # 3. 記錄 Karma log
            karma_log = KarmaLog(
                user_id=user_id,
                action_type=action_type,
                karma_amount=karma_amount,
                description=description,
                action_metadata=metadata or {}
            )
            self.db.add(karma_log)

            # 4. 計算新的 Karma 和等級
            old_level = user_karma.current_level
            new_total_karma = user_karma.total_karma + karma_amount
            new_level = calculate_level(new_total_karma)
            new_karma_to_next = calculate_karma_to_next_level(new_total_karma)

            # 5. 更新 UserKarma
            user_karma.total_karma = new_total_karma
            user_karma.current_level = new_level
            user_karma.karma_to_next_level = new_karma_to_next
            user_karma.last_karma_at = datetime.now(timezone.utc)

            # 6. 提交事務
            await self.db.commit()
            await self.db.refresh(user_karma)

            # 7. 檢查是否升級
            level_changed = new_level > old_level

            # 8. 如果升級，觸發升級事件
            if level_changed:
                await self.trigger_level_up_event(user_id, new_level)

            return {
                "success": True,
                "total_karma": new_total_karma,
                "level_changed": level_changed,
                "new_level": new_level
            }

        except SQLAlchemyError as e:
            await self.db.rollback()
            raise RuntimeError(f"Failed to grant karma: {str(e)}") from e

    async def trigger_level_up_event(self, user_id: UUID, new_level: int) -> bool:
        """
        觸發升級事件

        Args:
            user_id: 用戶 ID
            new_level: 新等級

        Returns:
            bool: 是否成功觸發事件

        Notes:
            未來可擴展為發送通知、解鎖成就、授予獎勵等
        """
        # TODO: 實作升級事件邏輯
        # - 發送升級通知
        # - 解鎖成就
        # - 授予升級獎勵
        # - 記錄升級日誌

        # 目前只是記錄日誌
        print(f"[LEVEL UP] User {user_id} reached level {new_level}")

        return True

    async def _get_user_by_id(self, user_id: UUID) -> User:
        """
        獲取用戶並驗證存在性

        Args:
            user_id: 用戶 ID

        Returns:
            User: 用戶對象

        Raises:
            UserNotFoundError: 用戶不存在
        """
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise UserNotFoundError(f"User with ID {user_id} not found")

        return user

    async def _get_or_create_user_karma(self, user_id: UUID) -> UserKarma:
        """
        獲取或建立 UserKarma 記錄

        Args:
            user_id: 用戶 ID

        Returns:
            UserKarma: 用戶 Karma 記錄
        """
        result = await self.db.execute(
            select(UserKarma).where(UserKarma.user_id == user_id)
        )
        user_karma = result.scalar_one_or_none()

        if not user_karma:
            # 建立新的 UserKarma 記錄
            user_karma = UserKarma(
                user_id=user_id,
                total_karma=0,
                current_level=1,
                karma_to_next_level=500
            )
            self.db.add(user_karma)
            await self.db.flush()  # 確保 ID 生成

        return user_karma
