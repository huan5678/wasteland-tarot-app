"""
認證方式變更追蹤服務

用於偵測可疑的認證方式變更活動（安全性需求）。
追蹤用戶在 1 小時內的認證方式變更次數，超過 3 次觸發安全警報。

使用 Redis Sorted Set 儲存變更記錄，支援時間視窗查詢。

參考：PHASE6_PROGRESS_REPORT.md Task 2.4
"""

import logging
from datetime import datetime, timedelta
from typing import Tuple, List, Dict, Any, Optional

logger = logging.getLogger(__name__)


class AuthChangeTracker:
    """認證方式變更追蹤服務，用於偵測可疑的認證方式變更活動"""

    def __init__(self, redis_client):
        """
        初始化 Auth Change Tracker

        Args:
            redis_client: Redis 客戶端實例（同步）
        """
        self.redis = redis_client
        self.window_hours = 1  # 追蹤時間視窗（1 小時）
        self.threshold = 3  # 觸發警報的閾值
        self.key_prefix = "auth_changes:"

    def record_change(
        self,
        user_id: str,
        change_type: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        記錄認證方式變更

        Args:
            user_id: 使用者 ID
            change_type: 變更類型
                - "add_oauth": 連結 OAuth
                - "remove_oauth": 移除 OAuth
                - "add_passkey": 新增 Passkey
                - "remove_passkey": 移除 Passkey
                - "set_password": 設定密碼
                - "change_password": 修改密碼
                - "remove_password": 移除密碼
            metadata: 可選的 metadata（用於日誌記錄）

        Returns:
            int: 當前時間視窗內的變更次數

        Example:
            ```python
            tracker = AuthChangeTracker(redis_client)
            count = tracker.record_change(
                user_id="user_123",
                change_type="add_oauth",
                metadata={"provider": "google"}
            )
            ```
        """
        try:
            key = f"{self.key_prefix}{user_id}"
            timestamp = datetime.now().timestamp()

            # 使用 Sorted Set 儲存變更記錄（score 為 timestamp）
            member = f"{change_type}:{timestamp}"
            self.redis.zadd(key, {member: timestamp})

            # 移除時間視窗外的記錄
            cutoff_time = (
                datetime.now() - timedelta(hours=self.window_hours)
            ).timestamp()
            self.redis.zremrangebyscore(key, 0, cutoff_time)

            # 計算當前數量
            count = self.redis.zcard(key)

            # 設定過期時間（時間視窗的 3 倍）
            self.redis.expire(key, self.window_hours * 3600 * 3)

            logger.info(
                f"記錄認證方式變更: user_id={user_id}, "
                f"change_type={change_type}, count={count}",
                extra={
                    "user_id": user_id,
                    "change_type": change_type,
                    "count": count,
                    "metadata": metadata
                }
            )

            return count

        except Exception as e:
            logger.error(f"記錄認證方式變更失敗: {e}")
            # Redis 錯誤不應阻擋主流程
            return 0

    def check_suspicious_activity(
        self,
        user_id: str
    ) -> Tuple[bool, int, List[str]]:
        """
        檢查是否有可疑的認證方式變更活動

        Args:
            user_id: 使用者 ID

        Returns:
            tuple[bool, int, list[str]]: (是否可疑, 變更次數, 變更類型列表)
                - is_suspicious: True 表示超過閾值（3 次）
                - change_count: 時間視窗內的變更次數
                - change_types: 變更類型列表

        Example:
            ```python
            tracker = AuthChangeTracker(redis_client)
            is_suspicious, count, types = tracker.check_suspicious_activity("user_123")

            if is_suspicious:
                # 觸發安全警報
                logger.warning(f"可疑活動：用戶 {user_id} 在 1 小時內變更 {count} 次")
            ```
        """
        try:
            key = f"{self.key_prefix}{user_id}"

            # 獲取時間視窗內的所有變更記錄
            changes = self.redis.zrange(key, 0, -1)
            count = len(changes)

            # 解析變更類型
            change_types = []
            for change in changes:
                if isinstance(change, bytes):
                    change = change.decode()
                # 格式：change_type:timestamp
                change_type = change.split(':')[0]
                change_types.append(change_type)

            # 判斷是否可疑
            is_suspicious = count >= self.threshold

            if is_suspicious:
                logger.warning(
                    f"🚨 安全警報：用戶 {user_id} 在 {self.window_hours} 小時內"
                    f"進行了 {count} 次認證方式變更",
                    extra={
                        "user_id": user_id,
                        "change_count": count,
                        "change_types": change_types,
                        "alert_type": "suspicious_auth_changes",
                        "window_hours": self.window_hours,
                        "threshold": self.threshold
                    }
                )

            return is_suspicious, count, change_types

        except Exception as e:
            logger.error(f"檢查可疑活動失敗: {e}")
            # Redis 錯誤時保守處理：假設沒有可疑活動
            return False, 0, []

    def get_change_history(
        self,
        user_id: str
    ) -> List[Dict[str, Any]]:
        """
        獲取用戶的認證方式變更歷史（時間視窗內）

        Args:
            user_id: 使用者 ID

        Returns:
            list[dict]: 變更歷史列表
                [
                    {
                        "change_type": "add_oauth",
                        "timestamp": 1674123456.789,
                        "datetime": "2023-01-19 12:34:56"
                    },
                    ...
                ]
        """
        try:
            key = f"{self.key_prefix}{user_id}"

            # 獲取所有變更記錄（包含 score）
            changes_with_scores = self.redis.zrange(key, 0, -1, withscores=True)

            history = []
            for change, score in changes_with_scores:
                if isinstance(change, bytes):
                    change = change.decode()

                change_type = change.split(':')[0]
                timestamp = score

                history.append({
                    "change_type": change_type,
                    "timestamp": timestamp,
                    "datetime": datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
                })

            return history

        except Exception as e:
            logger.error(f"獲取變更歷史失敗: {e}")
            return []

    def reset_changes(self, user_id: str) -> bool:
        """
        重置用戶的認證方式變更記錄（管理員功能）

        Args:
            user_id: 使用者 ID

        Returns:
            bool: True 表示重置成功
        """
        try:
            key = f"{self.key_prefix}{user_id}"
            deleted = self.redis.delete(key)

            logger.info(
                f"重置認證方式變更記錄: user_id={user_id}, deleted={deleted}"
            )

            return deleted > 0

        except Exception as e:
            logger.error(f"重置變更記錄失敗: {e}")
            return False
