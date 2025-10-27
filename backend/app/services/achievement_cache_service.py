"""
Achievement Cache Service
成就系統 Redis 快取層（帶降級機制）
"""

import json
import logging
from typing import Optional, List, Dict, Any
from datetime import timedelta
from uuid import UUID

logger = logging.getLogger(__name__)


class AchievementCacheService:
    """
    成就系統快取服務

    提供 Redis 快取功能，並在 Redis 不可用時自動降級
    """

    # Cache TTL configurations
    USER_PROGRESS_TTL = timedelta(minutes=5)  # 使用者進度快取 5 分鐘
    ACHIEVEMENT_DEFINITIONS_TTL = timedelta(hours=1)  # 成就定義快取 1 小時

    # Cache key prefixes
    KEY_PREFIX_USER_PROGRESS = "achievement:user_progress"
    KEY_PREFIX_ACHIEVEMENTS = "achievement:definitions"
    KEY_PREFIX_USER_SUMMARY = "achievement:user_summary"

    def __init__(self):
        """初始化快取服務"""
        self.redis_client = None
        self.redis_available = False

        # 嘗試連接 Redis
        try:
            import redis
            from app.config import settings

            # 檢查是否配置了 Redis URL
            redis_url = getattr(settings, 'REDIS_URL', None)

            if redis_url:
                self.redis_client = redis.from_url(
                    redis_url,
                    decode_responses=True,
                    socket_connect_timeout=2,
                    socket_timeout=2
                )

                # 測試連接
                self.redis_client.ping()
                self.redis_available = True
                logger.info("✅ Redis cache enabled for achievement system")
            else:
                logger.info("ℹ️ Redis URL not configured, using database-only mode")

        except ImportError:
            logger.warning(
                "⚠️ redis package not installed. "
                "Install with: pip install redis"
            )
        except Exception as e:
            logger.warning(
                f"⚠️ Redis connection failed: {e}. "
                f"Achievement cache will fallback to database queries."
            )

    # ===== Cache Key Management =====

    def _make_user_progress_key(self, user_id: UUID) -> str:
        """建立使用者進度快取 key"""
        return f"{self.KEY_PREFIX_USER_PROGRESS}:{str(user_id)}"

    def _make_achievement_definitions_key(self) -> str:
        """建立成就定義快取 key"""
        return f"{self.KEY_PREFIX_ACHIEVEMENTS}:all"

    def _make_user_summary_key(self, user_id: UUID) -> str:
        """建立使用者統計摘要快取 key"""
        return f"{self.KEY_PREFIX_USER_SUMMARY}:{str(user_id)}"

    # ===== User Progress Cache (Task 12.1) =====

    async def get_user_progress_cache(
        self,
        user_id: UUID
    ) -> Optional[List[Dict[str, Any]]]:
        """
        從 Redis 讀取使用者進度快取

        Args:
            user_id: 使用者 ID

        Returns:
            快取的進度資料，或 None（快取未命中或 Redis 不可用）
        """
        if not self.redis_available:
            return None

        try:
            key = self._make_user_progress_key(user_id)
            cached_data = self.redis_client.get(key)

            if cached_data:
                logger.debug(f"✅ Cache HIT: User progress for {user_id}")
                return json.loads(cached_data)
            else:
                logger.debug(f"❌ Cache MISS: User progress for {user_id}")
                return None

        except Exception as e:
            logger.warning(f"Redis read failed for user {user_id}: {e}")
            return None

    async def set_user_progress_cache(
        self,
        user_id: UUID,
        progress_data: List[Dict[str, Any]]
    ) -> bool:
        """
        將使用者進度寫入 Redis 快取

        Args:
            user_id: 使用者 ID
            progress_data: 進度資料列表

        Returns:
            是否成功寫入快取
        """
        if not self.redis_available:
            return False

        try:
            key = self._make_user_progress_key(user_id)

            # 序列化資料（處理 UUID, datetime 等特殊類型）
            serialized_data = json.dumps(
                progress_data,
                default=self._json_serializer
            )

            # 寫入快取並設定 TTL
            self.redis_client.setex(
                key,
                self.USER_PROGRESS_TTL,
                serialized_data
            )

            logger.debug(f"✅ Cache SET: User progress for {user_id}")
            return True

        except Exception as e:
            logger.warning(f"Redis write failed for user {user_id}: {e}")
            return False

    async def invalidate_user_progress_cache(self, user_id: UUID) -> bool:
        """
        清除使用者進度快取

        Args:
            user_id: 使用者 ID

        Returns:
            是否成功清除快取
        """
        if not self.redis_available:
            return False

        try:
            key = self._make_user_progress_key(user_id)
            self.redis_client.delete(key)
            logger.debug(f"🗑️ Cache INVALIDATED: User progress for {user_id}")
            return True

        except Exception as e:
            logger.warning(f"Redis delete failed for user {user_id}: {e}")
            return False

    # ===== Achievement Definitions Cache (Task 12.3) =====

    async def get_achievement_definitions_cache(
        self
    ) -> Optional[List[Dict[str, Any]]]:
        """
        從 Redis 讀取成就定義快取

        Returns:
            快取的成就定義，或 None（快取未命中）
        """
        if not self.redis_available:
            return None

        try:
            key = self._make_achievement_definitions_key()
            cached_data = self.redis_client.get(key)

            if cached_data:
                logger.debug("✅ Cache HIT: Achievement definitions")
                return json.loads(cached_data)
            else:
                logger.debug("❌ Cache MISS: Achievement definitions")
                return None

        except Exception as e:
            logger.warning(f"Redis read failed for achievement definitions: {e}")
            return None

    async def set_achievement_definitions_cache(
        self,
        achievements: List[Dict[str, Any]]
    ) -> bool:
        """
        將成就定義寫入 Redis 快取

        Args:
            achievements: 成就定義列表

        Returns:
            是否成功寫入快取
        """
        if not self.redis_available:
            return False

        try:
            key = self._make_achievement_definitions_key()

            serialized_data = json.dumps(
                achievements,
                default=self._json_serializer
            )

            # 成就定義快取較長時間（1 小時）
            self.redis_client.setex(
                key,
                self.ACHIEVEMENT_DEFINITIONS_TTL,
                serialized_data
            )

            logger.debug("✅ Cache SET: Achievement definitions")
            return True

        except Exception as e:
            logger.warning(f"Redis write failed for achievement definitions: {e}")
            return False

    async def invalidate_achievement_definitions_cache(self) -> bool:
        """
        清除成就定義快取（管理員更新成就時使用）

        Returns:
            是否成功清除快取
        """
        if not self.redis_available:
            return False

        try:
            key = self._make_achievement_definitions_key()
            self.redis_client.delete(key)
            logger.info("🗑️ Cache INVALIDATED: Achievement definitions")
            return True

        except Exception as e:
            logger.warning(f"Redis delete failed for achievement definitions: {e}")
            return False

    # ===== User Summary Cache =====

    async def get_user_summary_cache(
        self,
        user_id: UUID
    ) -> Optional[Dict[str, Any]]:
        """
        從 Redis 讀取使用者統計摘要快取

        Args:
            user_id: 使用者 ID

        Returns:
            快取的統計摘要，或 None
        """
        if not self.redis_available:
            return None

        try:
            key = self._make_user_summary_key(user_id)
            cached_data = self.redis_client.get(key)

            if cached_data:
                logger.debug(f"✅ Cache HIT: User summary for {user_id}")
                return json.loads(cached_data)
            else:
                return None

        except Exception as e:
            logger.warning(f"Redis read failed for user summary {user_id}: {e}")
            return None

    async def set_user_summary_cache(
        self,
        user_id: UUID,
        summary: Dict[str, Any]
    ) -> bool:
        """
        將使用者統計摘要寫入 Redis 快取

        Args:
            user_id: 使用者 ID
            summary: 統計摘要資料

        Returns:
            是否成功寫入快取
        """
        if not self.redis_available:
            return False

        try:
            key = self._make_user_summary_key(user_id)

            serialized_data = json.dumps(
                summary,
                default=self._json_serializer
            )

            self.redis_client.setex(
                key,
                self.USER_PROGRESS_TTL,
                serialized_data
            )

            logger.debug(f"✅ Cache SET: User summary for {user_id}")
            return True

        except Exception as e:
            logger.warning(f"Redis write failed for user summary {user_id}: {e}")
            return False

    # ===== Utilities =====

    @staticmethod
    def _json_serializer(obj):
        """JSON 序列化輔助函式（處理特殊類型）"""
        from datetime import datetime
        from uuid import UUID

        if isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, UUID):
            return str(obj)
        else:
            raise TypeError(f"Type {type(obj)} not serializable")

    async def health_check(self) -> Dict[str, Any]:
        """
        Redis 健康檢查

        Returns:
            健康狀態資訊
        """
        if not self.redis_available:
            return {
                "redis_available": False,
                "status": "disabled",
                "message": "Redis not configured or not available"
            }

        try:
            self.redis_client.ping()

            # 獲取 Redis 資訊
            info = self.redis_client.info()

            return {
                "redis_available": True,
                "status": "healthy",
                "version": info.get("redis_version", "unknown"),
                "connected_clients": info.get("connected_clients", 0),
                "used_memory_human": info.get("used_memory_human", "unknown")
            }

        except Exception as e:
            self.redis_available = False
            return {
                "redis_available": False,
                "status": "unhealthy",
                "error": str(e)
            }


# 建立全域快取服務實例
achievement_cache = AchievementCacheService()
