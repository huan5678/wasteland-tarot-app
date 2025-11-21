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
    parts = month_str.split('-')
    if len(parts) != 2:
        raise ValueError(f"Invalid format: expected 'YYYY-MM', got '{month_str}'")
    
    try:
        year, month = int(parts[0]), int(parts[1])
    except ValueError as e:
        raise ValueError(f"Non-numeric values found in month_year format: {month_str}") from e
    
    if not (1 <= month <= 12):
        raise ValueError(f"Invalid month value: {month} in '{month_str}'")
    
    try:
        return date(year, month, 1)
    except ValueError as e:
        raise ValueError(f"Invalid date construction with year: {year} in '{month_str}'") from e
