"""
Date Helpers - 日期處理工具函數
Common date manipulation utilities for bingo and other services
"""

from datetime import date
from typing import Optional


def get_month_start(target_date: Optional[date] = None) -> date:
    """
    取得指定日期的月份第一天

    Args:
        target_date: 目標日期（預設為今天）

    Returns:
        該月份的第一天

    Examples:
        >>> get_month_start(date(2025, 10, 15))
        date(2025, 10, 1)
        >>> get_month_start()  # 假設今天是 2025-11-21
        date(2025, 11, 1)
    """
    d = target_date or date.today()
    return d.replace(day=1)


def format_month_year(target_date: date) -> str:
    """
    格式化月份為 YYYY-MM 字串

    Args:
        target_date: 目標日期

    Returns:
        格式化的月份字串

    Examples:
        >>> format_month_year(date(2025, 10, 15))
        '2025-10'
    """
    return target_date.strftime('%Y-%m')


def parse_month_year(month_str: str) -> date:
    """
    解析 YYYY-MM 字串為月份第一天

    Args:
        month_str: 月份字串（格式：YYYY-MM）

    Returns:
        該月份的第一天

    Raises:
        ValueError: 格式不正確

    Examples:
        >>> parse_month_year('2025-10')
        date(2025, 10, 1)
    """
    year, month = month_str.split('-')
    return date(int(year), int(month), 1)
