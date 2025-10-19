"""
Audio Cache Service - Redis 音檔快取管理
提供高速音檔資訊快取，減少資料庫查詢和 TTS API 呼叫
"""

import json
from typing import Optional, Dict, Any
from datetime import timedelta
from redis import Redis
from app.config import get_settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)


class AudioCacheService:
    """
    音檔快取服務

    功能：
    1. 快取音檔 URL 和元資料
    2. 支援靜態卡牌解讀快取
    3. 支援動態解讀快取（文字 hash）
    4. 熱門音檔長期快取
    """

    def __init__(self, redis_client: Optional[Redis] = None):
        """
        初始化快取服務

        Args:
            redis_client: Redis 客戶端（可選）
        """
        self.redis = redis_client
        self.enabled = redis_client is not None

        # TTL 配置
        self.static_ttl = timedelta(days=30)      # 靜態卡牌解讀: 30 天
        self.dynamic_ttl = timedelta(days=7)      # 動態解讀: 7 天
        self.hot_ttl = None                       # 熱門音檔: 永久（無 TTL）

        if self.enabled:
            logger.info("[AudioCache] Redis cache enabled")
        else:
            logger.warning("[AudioCache] Redis cache disabled (no client)")

    def _generate_static_key(self, card_id: str, character_key: str) -> str:
        """
        生成靜態卡牌解讀快取 key

        Args:
            card_id: 卡牌 UUID
            character_key: 角色 key

        Returns:
            快取 key

        Example:
            audio:card:a1b2c3d4-...:super_mutant
        """
        return f"audio:card:{card_id}:{character_key}"

    def _generate_dynamic_key(self, text_hash: str) -> str:
        """
        生成動態解讀快取 key

        Args:
            text_hash: 文字 hash（完整 64 字元或前 16 字元）

        Returns:
            快取 key

        Example:
            audio:hash:f3a2b1c0d4e5f6a7
        """
        # 使用前 16 字元節省空間
        hash_prefix = text_hash[:16] if len(text_hash) > 16 else text_hash
        return f"audio:hash:{hash_prefix}"

    def get_static_audio(
        self,
        card_id: str,
        character_key: str
    ) -> Optional[Dict[str, Any]]:
        """
        取得靜態卡牌解讀快取

        Args:
            card_id: 卡牌 UUID
            character_key: 角色 key

        Returns:
            快取資料或 None

        Cache Data:
            {
                "url": str,
                "duration": float,
                "file_size": int,
                "audio_type": str,
                "generated_at": str
            }
        """
        if not self.enabled:
            return None

        try:
            key = self._generate_static_key(card_id, character_key)
            cached = self.redis.get(key)

            if cached:
                data = json.loads(cached)
                logger.debug(f"[AudioCache] HIT static: {key}")
                return data
            else:
                logger.debug(f"[AudioCache] MISS static: {key}")
                return None

        except Exception as e:
            logger.error(f"[AudioCache] Get static failed: {e}")
            return None

    def set_static_audio(
        self,
        card_id: str,
        character_key: str,
        url: str,
        duration: float,
        file_size: int,
        audio_type: str = "static_card",
        generated_at: Optional[str] = None,
        is_hot: bool = False
    ) -> bool:
        """
        設定靜態卡牌解讀快取

        Args:
            card_id: 卡牌 UUID
            character_key: 角色 key
            url: 音檔 URL
            duration: 時長（秒）
            file_size: 檔案大小（位元組）
            audio_type: 音檔類型
            generated_at: 生成時間（ISO 格式）
            is_hot: 是否為熱門音檔（永久快取）

        Returns:
            是否成功
        """
        if not self.enabled:
            return False

        try:
            key = self._generate_static_key(card_id, character_key)
            data = {
                "url": url,
                "duration": duration,
                "file_size": file_size,
                "audio_type": audio_type,
                "generated_at": generated_at
            }

            # 選擇 TTL
            ttl = self.hot_ttl if is_hot else self.static_ttl

            # 儲存到 Redis
            if ttl:
                self.redis.setex(key, ttl, json.dumps(data))
            else:
                self.redis.set(key, json.dumps(data))

            logger.debug(
                f"[AudioCache] SET static: {key}, "
                f"ttl={'永久' if not ttl else f'{ttl.days} 天'}"
            )
            return True

        except Exception as e:
            logger.error(f"[AudioCache] Set static failed: {e}")
            return False

    def get_dynamic_audio(
        self,
        text_hash: str
    ) -> Optional[Dict[str, Any]]:
        """
        取得動態解讀快取

        Args:
            text_hash: 文字 hash

        Returns:
            快取資料或 None
        """
        if not self.enabled:
            return None

        try:
            key = self._generate_dynamic_key(text_hash)
            cached = self.redis.get(key)

            if cached:
                data = json.loads(cached)
                logger.debug(f"[AudioCache] HIT dynamic: {key}")
                return data
            else:
                logger.debug(f"[AudioCache] MISS dynamic: {key}")
                return None

        except Exception as e:
            logger.error(f"[AudioCache] Get dynamic failed: {e}")
            return None

    def set_dynamic_audio(
        self,
        text_hash: str,
        url: str,
        duration: float,
        file_size: int,
        audio_type: str = "dynamic_reading",
        generated_at: Optional[str] = None
    ) -> bool:
        """
        設定動態解讀快取

        Args:
            text_hash: 文字 hash
            url: 音檔 URL
            duration: 時長（秒）
            file_size: 檔案大小（位元組）
            audio_type: 音檔類型
            generated_at: 生成時間（ISO 格式）

        Returns:
            是否成功
        """
        if not self.enabled:
            return False

        try:
            key = self._generate_dynamic_key(text_hash)
            data = {
                "url": url,
                "duration": duration,
                "file_size": file_size,
                "audio_type": audio_type,
                "generated_at": generated_at
            }

            # 動態解讀使用較短的 TTL
            self.redis.setex(key, self.dynamic_ttl, json.dumps(data))

            logger.debug(f"[AudioCache] SET dynamic: {key}, ttl={self.dynamic_ttl.days} 天")
            return True

        except Exception as e:
            logger.error(f"[AudioCache] Set dynamic failed: {e}")
            return False

    def invalidate_static_audio(
        self,
        card_id: str,
        character_key: str
    ) -> bool:
        """
        清除靜態卡牌解讀快取

        Args:
            card_id: 卡牌 UUID
            character_key: 角色 key

        Returns:
            是否成功
        """
        if not self.enabled:
            return False

        try:
            key = self._generate_static_key(card_id, character_key)
            deleted = self.redis.delete(key)
            logger.debug(f"[AudioCache] INVALIDATE static: {key}, deleted={deleted}")
            return deleted > 0

        except Exception as e:
            logger.error(f"[AudioCache] Invalidate static failed: {e}")
            return False

    def invalidate_dynamic_audio(
        self,
        text_hash: str
    ) -> bool:
        """
        清除動態解讀快取

        Args:
            text_hash: 文字 hash

        Returns:
            是否成功
        """
        if not self.enabled:
            return False

        try:
            key = self._generate_dynamic_key(text_hash)
            deleted = self.redis.delete(key)
            logger.debug(f"[AudioCache] INVALIDATE dynamic: {key}, deleted={deleted}")
            return deleted > 0

        except Exception as e:
            logger.error(f"[AudioCache] Invalidate dynamic failed: {e}")
            return False

    def get_cache_stats(self) -> Dict[str, Any]:
        """
        取得快取統計資訊

        Returns:
            {
                "enabled": bool,
                "total_keys": int,
                "static_keys": int,
                "dynamic_keys": int,
                "memory_used": str
            }
        """
        if not self.enabled:
            return {"enabled": False}

        try:
            # 取得所有 audio:* keys
            static_keys = len(self.redis.keys("audio:card:*"))
            dynamic_keys = len(self.redis.keys("audio:hash:*"))
            total_keys = static_keys + dynamic_keys

            # 取得記憶體使用（需要 Redis INFO 權限）
            try:
                info = self.redis.info("memory")
                memory_used = info.get("used_memory_human", "N/A")
            except:
                memory_used = "N/A"

            return {
                "enabled": True,
                "total_keys": total_keys,
                "static_keys": static_keys,
                "dynamic_keys": dynamic_keys,
                "memory_used": memory_used
            }

        except Exception as e:
            logger.error(f"[AudioCache] Get stats failed: {e}")
            return {"enabled": True, "error": str(e)}


# 單例模式
_audio_cache_instance: Optional[AudioCacheService] = None


def get_audio_cache_service(redis_client: Optional[Redis] = None) -> AudioCacheService:
    """取得 AudioCache 服務單例"""
    global _audio_cache_instance
    if _audio_cache_instance is None:
        _audio_cache_instance = AudioCacheService(redis_client)
    return _audio_cache_instance
