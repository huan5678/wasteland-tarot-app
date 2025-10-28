"""
OAuth State 參數管理服務

用於防止 CSRF 攻擊的 state 參數生成和驗證。
使用 Redis 儲存 state 參數，有效期 10 分鐘。

參考：PHASE6_PROGRESS_REPORT.md Task 2.2
"""

import secrets
import logging
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class OAuthStateService:
    """OAuth State 參數管理服務，用於防止 CSRF 攻擊"""

    def __init__(self, redis_client):
        """
        初始化 OAuth State Service

        Args:
            redis_client: Redis 客戶端實例
        """
        self.redis = redis_client
        self.state_ttl = 600  # 10 分鐘有效期
        self.key_prefix = "oauth_state:"

    def generate_state(
        self,
        user_session_id: Optional[str] = None
    ) -> str:
        """
        產生 OAuth state 參數並儲存到 Redis

        Args:
            user_session_id: 可選的使用者 session ID（用於追蹤）

        Returns:
            str: 32 bytes URL-safe token

        Raises:
            Exception: Redis 操作失敗時

        Example:
            ```python
            service = OAuthStateService(redis_client)
            state = service.generate_state()
            # 將 state 加入 OAuth authorization URL
            ```
        """
        try:
            # 產生 32 bytes URL-safe random token
            state = secrets.token_urlsafe(32)

            # 儲存到 Redis，value 為 session ID 或 "anonymous"
            key = f"{self.key_prefix}{state}"
            value = user_session_id or "anonymous"

            # 使用 setex 設定 10 分鐘過期時間（同步操作）
            self.redis.setex(key, self.state_ttl, value)

            logger.info(f"Generated OAuth state: {state[:8]}... (TTL={self.state_ttl}s)")
            return state

        except Exception as e:
            logger.error(f"Failed to generate OAuth state: {e}")
            raise

    def verify_and_consume_state(self, state: str) -> bool:
        """
        驗證 state 參數並刪除（一次性使用）

        Args:
            state: OAuth callback 回傳的 state 參數

        Returns:
            bool: True 表示 state 有效，False 表示無效或已過期

        Example:
            ```python
            service = OAuthStateService(redis_client)
            is_valid = service.verify_and_consume_state(state)

            if not is_valid:
                raise HTTPException(status_code=400, detail="Invalid state")
            ```
        """
        try:
            key = f"{self.key_prefix}{state}"

            # 檢查 state 是否存在（同步操作）
            exists = self.redis.exists(key)

            if exists:
                # 驗證成功：立即刪除（防止重放攻擊）
                self.redis.delete(key)
                logger.info(f"OAuth state verified and consumed: {state[:8]}...")
                return True
            else:
                # 驗證失敗：state 無效或已過期
                logger.warning(f"Invalid or expired OAuth state: {state[:8]}...")
                return False

        except Exception as e:
            logger.error(f"Failed to verify OAuth state: {e}")
            # Redis 錯誤時保守處理：拒絕驗證
            return False

    def cleanup_expired_states(self) -> int:
        """
        清理過期的 state 參數（可選，Redis TTL 會自動處理）

        Returns:
            int: 清理的 state 數量
        """
        try:
            # 掃描所有 oauth_state:* 的 key（同步操作）
            pattern = f"{self.key_prefix}*"
            cursor = 0
            deleted = 0

            while True:
                cursor, keys = self.redis.scan(cursor, match=pattern, count=100)

                for key in keys:
                    # 檢查 TTL，若已過期則刪除
                    ttl = self.redis.ttl(key)
                    if ttl == -2:  # -2 表示 key 不存在（已過期）
                        deleted += 1

                if cursor == 0:
                    break

            if deleted > 0:
                logger.info(f"Cleaned up {deleted} expired OAuth states")

            return deleted

        except Exception as e:
            logger.error(f"Failed to cleanup expired OAuth states: {e}")
            return 0
