"""
時區處理工具 - Wishlist Feature

提供 UTC+8 時區計算功能：
- get_utc8_today_range(): 取得 UTC+8 今日範圍（轉換為 UTC）
- format_utc8_datetime(): 格式化 UTC 時間為 UTC+8 字串

符合需求：R9.1, R9.3, R9.4, R9.5
"""

from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple


# UTC+8 時區常數
UTC8 = timezone(timedelta(hours=8))


def get_utc8_today_range() -> Tuple[datetime, datetime]:
    """
    取得 UTC+8 今日的 UTC 時間範圍

    計算邏輯：
    1. 取得當前 UTC 時間
    2. 轉換為 UTC+8 時間
    3. 計算 UTC+8 今日 00:00:00
    4. 計算 UTC+8 明日 00:00:00
    5. 將兩個時間轉換回 UTC

    Returns:
        Tuple[datetime, datetime]: (today_start_utc, tomorrow_start_utc)
        - today_start_utc: UTC+8 今日 00:00:00 的 UTC 時間
        - tomorrow_start_utc: UTC+8 明日 00:00:00 的 UTC 時間

    Example:
        當前 UTC+8: 2025-11-03 09:00:00
        回傳:
        - start: 2025-11-02 16:00:00 UTC (對應 UTC+8 2025-11-03 00:00:00)
        - end: 2025-11-03 16:00:00 UTC (對應 UTC+8 2025-11-04 00:00:00)
    """
    # 取得當前 UTC 時間
    now_utc = datetime.now(timezone.utc)

    # 轉換為 UTC+8 時間
    now_utc8 = now_utc.astimezone(UTC8)

    # 計算 UTC+8 今日 00:00:00
    today_start_utc8 = now_utc8.replace(hour=0, minute=0, second=0, microsecond=0)

    # 計算 UTC+8 明日 00:00:00
    tomorrow_start_utc8 = today_start_utc8 + timedelta(days=1)

    # 轉換回 UTC
    today_start_utc = today_start_utc8.astimezone(timezone.utc)
    tomorrow_start_utc = tomorrow_start_utc8.astimezone(timezone.utc)

    return today_start_utc, tomorrow_start_utc


def format_utc8_datetime(dt: Optional[datetime]) -> Optional[str]:
    """
    將 UTC 時間格式化為 "YYYY-MM-DD HH:mm (UTC+8)" 格式

    Args:
        dt: UTC 時間（datetime 物件，timezone aware）

    Returns:
        str: 格式化後的字串，格式為 "YYYY-MM-DD HH:mm (UTC+8)"
        None: 如果輸入為 None

    Example:
        輸入 UTC: 2025-11-03 08:30:00 UTC
        輸出: "2025-11-03 16:30 (UTC+8)"
    """
    if dt is None:
        return None

    # 轉換為 UTC+8 時間
    dt_utc8 = dt.astimezone(UTC8)

    # 格式化為 "YYYY-MM-DD HH:mm (UTC+8)"
    return dt_utc8.strftime("%Y-%m-%d %H:%M (UTC+8)")
