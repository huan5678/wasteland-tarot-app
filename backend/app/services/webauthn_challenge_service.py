"""
WebAuthn Challenge Storage Service

提供 WebAuthn challenge 的儲存和檢索功能，支援 Redis 和 Session 降級策略。

安全性考量：
- Challenge 為一次性使用（single-use）
- 預設 TTL 為 5 分鐘（防止 replay attack）
- 使用 Redis 儲存以支援分散式部署
- Redis 不可用時自動降級到 Session Storage

使用範例：
    ```python
    from app.services.webauthn_challenge_service import WebAuthnChallengeService

    service = WebAuthnChallengeService()

    # 儲存 challenge
    await service.store_challenge(user_id, challenge_bytes)

    # 取得並刪除 challenge（單次使用）
    challenge = await service.get_and_delete_challenge(user_id)
    ```
"""

import logging
from typing import Optional
from datetime import timedelta

from fastapi import Request

from app.core.redis import get_async_redis_client

logger = logging.getLogger(__name__)


class WebAuthnChallengeService:
    """
    WebAuthn Challenge 儲存服務

    提供安全的 challenge 儲存機制，支援：
    - Redis 儲存（生產環境推薦）
    - Session 儲存（降級方案）
    - 自動過期（5 分鐘 TTL）
    - 單次使用（get-and-delete 模式）
    """

    # Challenge TTL（5 分鐘）
    CHALLENGE_TTL = timedelta(minutes=5)

    # Redis key 前綴
    REDIS_KEY_PREFIX = "webauthn:challenge:"

    def __init__(self):
        """初始化 WebAuthn Challenge Service"""
        pass

    def _get_redis_key(self, identifier: str) -> str:
        """
        生成 Redis key

        Args:
            identifier: 用戶識別碼（user_id 或 session_id）

        Returns:
            完整的 Redis key
        """
        return f"{self.REDIS_KEY_PREFIX}{identifier}"

    async def store_challenge(
        self,
        identifier: str,
        challenge: bytes,
        request: Optional[Request] = None
    ) -> bool:
        """
        儲存 challenge（支援 Redis 和 Session 降級）

        Args:
            identifier: 用戶識別碼（通常是 user_id 或 email）
            challenge: WebAuthn challenge（原始 bytes）
            request: FastAPI Request 物件（用於 Session 降級）

        Returns:
            是否成功儲存

        Note:
            - 優先使用 Redis 儲存
            - Redis 不可用時降級到 Session Storage
            - 如果兩者都不可用，記錄錯誤並返回 False
        """
        challenge_hex = challenge.hex()

        # 嘗試使用 Redis 儲存
        redis_client = await get_async_redis_client()
        if redis_client:
            try:
                redis_key = self._get_redis_key(identifier)
                ttl_seconds = int(self.CHALLENGE_TTL.total_seconds())

                await redis_client.setex(
                    redis_key,
                    ttl_seconds,
                    challenge_hex
                )

                logger.info(
                    f"✅ Challenge stored in Redis: {identifier} "
                    f"(TTL: {ttl_seconds}s)"
                )
                return True

            except Exception as e:
                logger.error(f"❌ Failed to store challenge in Redis: {e}")
                logger.warning("⚠️  Attempting Session Storage fallback...")

        # 降級到 Session Storage
        if request:
            try:
                if not hasattr(request, "session"):
                    request.session = {}

                session_key = f"webauthn_challenge_{identifier}"
                request.session[session_key] = challenge_hex

                logger.warning(
                    f"⚠️  Challenge stored in Session (fallback): {identifier}"
                )
                return True

            except Exception as e:
                logger.error(f"❌ Failed to store challenge in Session: {e}")

        # 兩者都失敗
        logger.error(
            f"❌ Failed to store challenge: {identifier} "
            "(Redis and Session unavailable)"
        )
        return False

    async def get_and_delete_challenge(
        self,
        identifier: str,
        request: Optional[Request] = None
    ) -> Optional[bytes]:
        """
        取得並刪除 challenge（單次使用模式）

        Args:
            identifier: 用戶識別碼（通常是 user_id 或 email）
            request: FastAPI Request 物件（用於 Session 降級）

        Returns:
            Challenge bytes，如果不存在或已過期則返回 None

        Note:
            - Challenge 為一次性使用，取得後立即刪除
            - 優先從 Redis 取得
            - Redis 不可用時降級到 Session Storage
        """
        # 嘗試從 Redis 取得
        redis_client = await get_async_redis_client()
        if redis_client:
            try:
                redis_key = self._get_redis_key(identifier)

                # 使用 pipeline 確保原子性操作
                pipe = redis_client.pipeline()
                pipe.get(redis_key)
                pipe.delete(redis_key)
                results = await pipe.execute()

                challenge_hex = results[0]

                if challenge_hex:
                    logger.info(
                        f"✅ Challenge retrieved from Redis: {identifier}"
                    )
                    return bytes.fromhex(challenge_hex)
                else:
                    logger.warning(
                        f"⚠️  Challenge not found in Redis: {identifier} "
                        "(expired or not exists)"
                    )
                    # 繼續嘗試 Session Storage（可能是降級儲存的）

            except Exception as e:
                logger.error(
                    f"❌ Failed to get challenge from Redis: {e}"
                )
                logger.warning("⚠️  Attempting Session Storage fallback...")

        # 降級到 Session Storage
        if request and hasattr(request, "session"):
            try:
                session_key = f"webauthn_challenge_{identifier}"
                challenge_hex = request.session.get(session_key)

                if challenge_hex:
                    # 刪除（單次使用）
                    del request.session[session_key]

                    logger.warning(
                        f"⚠️  Challenge retrieved from Session (fallback): "
                        f"{identifier}"
                    )
                    return bytes.fromhex(challenge_hex)

            except Exception as e:
                logger.error(
                    f"❌ Failed to get challenge from Session: {e}"
                )

        # 未找到 challenge
        logger.warning(
            f"⚠️  Challenge not found: {identifier} "
            "(not in Redis or Session)"
        )
        return None

    async def delete_challenge(
        self,
        identifier: str,
        request: Optional[Request] = None
    ) -> bool:
        """
        刪除 challenge（手動清理）

        Args:
            identifier: 用戶識別碼
            request: FastAPI Request 物件（用於 Session 降級）

        Returns:
            是否成功刪除

        Note:
            通常不需要手動呼叫，get_and_delete_challenge 已包含刪除邏輯。
            此方法主要用於錯誤處理或清理場景。
        """
        deleted = False

        # 從 Redis 刪除
        redis_client = await get_async_redis_client()
        if redis_client:
            try:
                redis_key = self._get_redis_key(identifier)
                result = await redis_client.delete(redis_key)
                deleted = result > 0

                if deleted:
                    logger.info(f"✅ Challenge deleted from Redis: {identifier}")

            except Exception as e:
                logger.error(f"❌ Failed to delete challenge from Redis: {e}")

        # 從 Session 刪除
        if request and hasattr(request, "session"):
            try:
                session_key = f"webauthn_challenge_{identifier}"
                if session_key in request.session:
                    del request.session[session_key]
                    deleted = True
                    logger.info(
                        f"✅ Challenge deleted from Session: {identifier}"
                    )

            except Exception as e:
                logger.error(
                    f"❌ Failed to delete challenge from Session: {e}"
                )

        return deleted


# 單例實例（可選）
_challenge_service: Optional[WebAuthnChallengeService] = None


def get_challenge_service() -> WebAuthnChallengeService:
    """
    獲取 WebAuthn Challenge Service 實例（單例模式）

    Returns:
        WebAuthnChallengeService 實例
    """
    global _challenge_service

    if _challenge_service is None:
        _challenge_service = WebAuthnChallengeService()

    return _challenge_service
