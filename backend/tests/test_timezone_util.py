"""
測試 TimezoneUtil - UTC+8 時區處理工具

測試內容：
- get_utc8_today_range(): 取得 UTC+8 今日範圍（UTC 時間）
- format_utc8_datetime(): 格式化 UTC 時間為 UTC+8 字串
- 邊界情況測試（23:59, 00:00）
"""

import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import patch
from app.utils.timezone_util import get_utc8_today_range, format_utc8_datetime


class TestGetUtc8TodayRange:
    """測試 get_utc8_today_range 函式"""

    def test_returns_tuple_of_two_datetimes(self):
        """應回傳包含兩個 datetime 物件的 tuple"""
        result = get_utc8_today_range()
        assert isinstance(result, tuple)
        assert len(result) == 2
        assert isinstance(result[0], datetime)
        assert isinstance(result[1], datetime)

    def test_start_is_before_end(self):
        """開始時間應早於結束時間"""
        start, end = get_utc8_today_range()
        assert start < end

    def test_difference_is_exactly_24_hours(self):
        """開始與結束時間相差應正好 24 小時"""
        start, end = get_utc8_today_range()
        diff = end - start
        assert diff == timedelta(days=1)

    def test_times_are_in_utc_timezone(self):
        """回傳的時間應為 UTC 時區"""
        start, end = get_utc8_today_range()
        assert start.tzinfo == timezone.utc
        assert end.tzinfo == timezone.utc

    @patch('app.utils.timezone_util.datetime')
    def test_utc8_morning_9am(self, mock_datetime):
        """
        測試 UTC+8 早上 9:00
        UTC+8: 2025-11-03 09:00:00
        應回傳：
        - start: 2025-11-03 00:00:00 UTC+8 → 2025-11-02 16:00:00 UTC
        - end: 2025-11-04 00:00:00 UTC+8 → 2025-11-03 16:00:00 UTC
        """
        # Mock 當前時間為 UTC+8 的 2025-11-03 09:00:00
        # 對應 UTC 時間為 2025-11-03 01:00:00
        mock_now_utc = datetime(2025, 11, 3, 1, 0, 0, tzinfo=timezone.utc)
        mock_datetime.now.return_value = mock_now_utc
        mock_datetime.side_effect = lambda *args, **kwargs: datetime(*args, **kwargs)

        start, end = get_utc8_today_range()

        # UTC+8 的今天 00:00 對應 UTC 前一天 16:00
        expected_start = datetime(2025, 11, 2, 16, 0, 0, tzinfo=timezone.utc)
        # UTC+8 的明天 00:00 對應 UTC 當天 16:00
        expected_end = datetime(2025, 11, 3, 16, 0, 0, tzinfo=timezone.utc)

        assert start == expected_start
        assert end == expected_end

    @patch('app.utils.timezone_util.datetime')
    def test_utc8_boundary_23_59(self, mock_datetime):
        """
        測試 UTC+8 邊界情況：23:59
        UTC+8: 2025-11-03 23:59:00
        應仍屬於 2025-11-03，下一秒 (00:00) 才是新的一天
        """
        # Mock 當前時間為 UTC+8 的 2025-11-03 23:59:00
        # 對應 UTC 時間為 2025-11-03 15:59:00
        mock_now_utc = datetime(2025, 11, 3, 15, 59, 0, tzinfo=timezone.utc)
        mock_datetime.now.return_value = mock_now_utc
        mock_datetime.side_effect = lambda *args, **kwargs: datetime(*args, **kwargs)

        start, end = get_utc8_today_range()

        # 應仍屬於 2025-11-03 的範圍
        expected_start = datetime(2025, 11, 2, 16, 0, 0, tzinfo=timezone.utc)
        expected_end = datetime(2025, 11, 3, 16, 0, 0, tzinfo=timezone.utc)

        assert start == expected_start
        assert end == expected_end

    @patch('app.utils.timezone_util.datetime')
    def test_utc8_boundary_00_00(self, mock_datetime):
        """
        測試 UTC+8 邊界情況：00:00 (新一天的開始)
        UTC+8: 2025-11-04 00:00:00
        應屬於 2025-11-04
        """
        # Mock 當前時間為 UTC+8 的 2025-11-04 00:00:00
        # 對應 UTC 時間為 2025-11-03 16:00:00
        mock_now_utc = datetime(2025, 11, 3, 16, 0, 0, tzinfo=timezone.utc)
        mock_datetime.now.return_value = mock_now_utc
        mock_datetime.side_effect = lambda *args, **kwargs: datetime(*args, **kwargs)

        start, end = get_utc8_today_range()

        # 應屬於 2025-11-04 的範圍
        expected_start = datetime(2025, 11, 3, 16, 0, 0, tzinfo=timezone.utc)
        expected_end = datetime(2025, 11, 4, 16, 0, 0, tzinfo=timezone.utc)

        assert start == expected_start
        assert end == expected_end

    @patch('app.utils.timezone_util.datetime')
    def test_utc8_one_second_before_midnight(self, mock_datetime):
        """
        測試 UTC+8 午夜前一秒：23:59:59
        應仍屬於當日
        """
        # Mock 當前時間為 UTC+8 的 2025-11-03 23:59:59
        # 對應 UTC 時間為 2025-11-03 15:59:59
        mock_now_utc = datetime(2025, 11, 3, 15, 59, 59, tzinfo=timezone.utc)
        mock_datetime.now.return_value = mock_now_utc
        mock_datetime.side_effect = lambda *args, **kwargs: datetime(*args, **kwargs)

        start, end = get_utc8_today_range()

        expected_start = datetime(2025, 11, 2, 16, 0, 0, tzinfo=timezone.utc)
        expected_end = datetime(2025, 11, 3, 16, 0, 0, tzinfo=timezone.utc)

        assert start == expected_start
        assert end == expected_end


class TestFormatUtc8Datetime:
    """測試 format_utc8_datetime 函式"""

    def test_formats_utc_datetime_to_utc8_string(self):
        """應將 UTC 時間格式化為 UTC+8 字串"""
        # UTC 時間：2025-11-03 08:30:00
        # UTC+8 時間：2025-11-03 16:30:00
        dt_utc = datetime(2025, 11, 3, 8, 30, 0, tzinfo=timezone.utc)
        result = format_utc8_datetime(dt_utc)

        assert result == "2025-11-03 16:30 (UTC+8)"

    def test_formats_utc_midnight_to_utc8(self):
        """UTC 午夜應轉換為 UTC+8 早上 8:00"""
        # UTC 時間：2025-11-03 00:00:00
        # UTC+8 時間：2025-11-03 08:00:00
        dt_utc = datetime(2025, 11, 3, 0, 0, 0, tzinfo=timezone.utc)
        result = format_utc8_datetime(dt_utc)

        assert result == "2025-11-03 08:00 (UTC+8)"

    def test_formats_utc_16_00_to_utc8_midnight(self):
        """UTC 16:00 應轉換為 UTC+8 午夜"""
        # UTC 時間：2025-11-03 16:00:00
        # UTC+8 時間：2025-11-04 00:00:00
        dt_utc = datetime(2025, 11, 3, 16, 0, 0, tzinfo=timezone.utc)
        result = format_utc8_datetime(dt_utc)

        assert result == "2025-11-04 00:00 (UTC+8)"

    def test_formats_with_leading_zeros(self):
        """應包含前導零（如 09:05）"""
        # UTC 時間：2025-11-03 01:05:00
        # UTC+8 時間：2025-11-03 09:05:00
        dt_utc = datetime(2025, 11, 3, 1, 5, 0, tzinfo=timezone.utc)
        result = format_utc8_datetime(dt_utc)

        assert result == "2025-11-03 09:05 (UTC+8)"

    def test_handles_year_boundary(self):
        """應正確處理跨年邊界"""
        # UTC 時間：2025-12-31 20:00:00
        # UTC+8 時間：2026-01-01 04:00:00
        dt_utc = datetime(2025, 12, 31, 20, 0, 0, tzinfo=timezone.utc)
        result = format_utc8_datetime(dt_utc)

        assert result == "2026-01-01 04:00 (UTC+8)"

    def test_handles_none_datetime(self):
        """應處理 None 輸入"""
        result = format_utc8_datetime(None)
        assert result is None
