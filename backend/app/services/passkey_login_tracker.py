"""
Passkey Login Tracker - 追蹤每日首次 Passkey 登入（Task 11.3）

使用 Redis 快取追蹤每日首次 Passkey 登入，如果 Redis 不可用，
則降級使用資料庫欄位追蹤。
"""

import logging
from datetime import datetime, timedelta
from typing import Optional
from redis import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User

logger = logging.getLogger(__name__)


class PasskeyLoginTracker:
    """Passkey 登入追蹤服務（支援 Redis 和資料庫降級）"""

    def __init__(self, redis_client: Optional[Redis] = None):
        """
        初始化 Passkey 登入追蹤器

        Args:
            redis_client: Redis 客戶端（可選）
        """
        self.redis = redis_client
        self.window_hours = 24  # 追蹤 24 小時（一天）

    async def is_first_passkey_login_today(
        self,
        user_id: str,
        db: AsyncSession
    ) -> bool:
        """
        檢查是否為今日首次 Passkey 登入

        使用 Redis 快取追蹤（如果可用），否則降級使用資料庫

        Args:
            user_id: 使用者 ID
            db: 資料庫 session

        Returns:
            bool: True 表示今日首次登入，False 表示今日已登入過
        """
        today = datetime.now().date().isoformat()

        # 嘗試使用 Redis（效能較佳）
        if self.redis:
            try:
                return await self._check_first_login_redis(user_id, today)
            except Exception as e:
                logger.warning(
                    f"Redis 檢查失敗，降級使用資料庫追蹤: {e}",
                    extra={"user_id": user_id}
                )
                # Redis 失敗，降級使用資料庫
                return await self._check_first_login_database(user_id, db)

        # 沒有 Redis，直接使用資料庫
        return await self._check_first_login_database(user_id, db)

    async def _check_first_login_redis(
        self,
        user_id: str,
        today: str
    ) -> bool:
        """
        使用 Redis 檢查今日首次登入

        Args:
            user_id: 使用者 ID
            today: 今日日期字串（ISO format）

        Returns:
            bool: True 表示首次登入
        """
        key = f"passkey_login:{user_id}:{today}"

        # 檢查 key 是否存在
        exists = self.redis.exists(key)

        if not exists:
            # 首次登入，設定 key（24 小時過期）
            self.redis.setex(key, 86400, "1")
            logger.info(
                f"記錄 Passkey 首次登入（Redis）",
                extra={"user_id": user_id, "date": today}
            )
            return True

        # 今日已登入過
        return False

    async def _check_first_login_database(
        self,
        user_id: str,
        db: AsyncSession
    ) -> bool:
        """
        使用資料庫檢查今日首次登入（降級方案）

        注意：需要在 users 表中有 last_passkey_login_date 欄位

        Args:
            user_id: 使用者 ID
            db: 資料庫 session

        Returns:
            bool: True 表示首次登入
        """
        # 查詢使用者
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            logger.warning(f"使用者不存在: {user_id}")
            return False

        today = datetime.now().date()

        # 檢查 last_passkey_login_date 欄位（如果存在）
        # 注意：此欄位需要在資料庫 migration 中新增
        last_login_date = getattr(user, "last_passkey_login_date", None)

        if last_login_date != today:
            # 首次登入或不是今天，更新日期
            try:
                # 嘗試更新欄位（如果存在）
                if hasattr(user, "last_passkey_login_date"):
                    user.last_passkey_login_date = today
                    await db.commit()
                    logger.info(
                        f"記錄 Passkey 首次登入（資料庫）",
                        extra={"user_id": user_id, "date": today.isoformat()}
                    )
                    return True
                else:
                    logger.warning(
                        f"users 表缺少 last_passkey_login_date 欄位，"
                        f"無法追蹤每日登入",
                        extra={"user_id": user_id}
                    )
                    # 欄位不存在時，預設為首次登入（安全降級）
                    return True
            except Exception as e:
                logger.error(
                    f"資料庫更新失敗: {e}",
                    extra={"user_id": user_id},
                    exc_info=True
                )
                await db.rollback()
                # 更新失敗時，預設為首次登入（安全降級）
                return True

        # 今日已登入過
        return False

    async def record_passkey_login(
        self,
        user_id: str,
        db: AsyncSession
    ) -> None:
        """
        記錄 Passkey 登入（用於強制標記登入）

        Args:
            user_id: 使用者 ID
            db: 資料庫 session
        """
        today = datetime.now().date().isoformat()

        # 嘗試使用 Redis
        if self.redis:
            try:
                key = f"passkey_login:{user_id}:{today}"
                self.redis.setex(key, 86400, "1")
                logger.debug(f"記錄 Passkey 登入（Redis）: {user_id}")
                return
            except Exception as e:
                logger.warning(f"Redis 記錄失敗: {e}")

        # 降級使用資料庫
        try:
            result = await db.execute(
                select(User).where(User.id == user_id)
            )
            user = result.scalar_one_or_none()

            if user and hasattr(user, "last_passkey_login_date"):
                user.last_passkey_login_date = datetime.now().date()
                await db.commit()
                logger.debug(f"記錄 Passkey 登入（資料庫）: {user_id}")
        except Exception as e:
            logger.error(f"資料庫記錄失敗: {e}", exc_info=True)
            await db.rollback()
