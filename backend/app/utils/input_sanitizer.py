"""
Input Sanitizer Utility
Sanitizes user inputs to prevent XSS and injection attacks
Implements NFR-3.5: Validate all user inputs
"""

import re
import html
from typing import Optional


def sanitize_html_input(user_input: str) -> str:
    """
    Sanitize HTML input to prevent XSS attacks

    Args:
        user_input: Raw user input string

    Returns:
        Sanitized string with HTML entities escaped

    Example:
        >>> sanitize_html_input("<script>alert('XSS')</script>")
        '&lt;script&gt;alert(&#x27;XSS&#x27;)&lt;/script&gt;'
    """
    if not user_input:
        return ""

    # Escape HTML entities
    sanitized = html.escape(user_input)

    return sanitized


def sanitize_search_query(query: str, max_length: int = 100) -> str:
    """
    Sanitize search query input

    Args:
        query: Search query string
        max_length: Maximum allowed length

    Returns:
        Sanitized search query

    Notes:
        - Removes SQL injection patterns
        - Limits length
        - Escapes special characters
    """
    if not query:
        return ""

    # Truncate to max length
    query = query[:max_length]

    # Remove potentially dangerous SQL keywords (case-insensitive)
    dangerous_patterns = [
        r"\bDROP\b",
        r"\bDELETE\b",
        r"\bINSERT\b",
        r"\bUPDATE\b",
        r"\bEXEC\b",
        r"\bUNION\b",
        r";--",
        r"--",
        r"/\*",
        r"\*/",
    ]

    for pattern in dangerous_patterns:
        query = re.sub(pattern, "", query, flags=re.IGNORECASE)

    # Escape HTML
    query = html.escape(query)

    # Remove excessive whitespace
    query = " ".join(query.split())

    return query.strip()


def sanitize_tag_name(tag: str, max_length: int = 50) -> str:
    """
    Sanitize tag names

    Args:
        tag: Tag name string
        max_length: Maximum allowed length

    Returns:
        Sanitized tag name

    Rules:
        - Alphanumeric, spaces, hyphens, underscores only
        - No HTML or special characters
        - Trimmed whitespace
    """
    if not tag:
        return ""

    # Truncate
    tag = tag[:max_length]

    # Remove non-alphanumeric characters except spaces, hyphens, underscores
    tag = re.sub(r"[^\w\s-]", "", tag, flags=re.UNICODE)

    # Remove excessive whitespace
    tag = " ".join(tag.split())

    return tag.strip()


def validate_reading_question(question: str, max_length: int = 500) -> Optional[str]:
    """
    Validate and sanitize reading question

    Args:
        question: User's question string
        max_length: Maximum allowed length

    Returns:
        Sanitized question or None if invalid

    Validation rules:
        - Not empty after trimming
        - Within length limit
        - HTML escaped
    """
    if not question or not question.strip():
        return None

    question = question.strip()

    if len(question) > max_length:
        question = question[:max_length]

    # Sanitize HTML
    question = sanitize_html_input(question)

    return question if question else None


def sanitize_url_parameter(param: str) -> str:
    """
    Sanitize URL parameters to prevent injection

    Args:
        param: URL parameter value

    Returns:
        Sanitized parameter
    """
    if not param:
        return ""

    # Remove control characters and dangerous patterns
    param = re.sub(r"[\x00-\x1f\x7f]", "", param)

    # Escape HTML
    param = html.escape(param)

    return param.strip()
