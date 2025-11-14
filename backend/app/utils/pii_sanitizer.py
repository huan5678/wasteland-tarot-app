"""
PII Sanitizer Utility
Removes Personally Identifiable Information from data before sharing
Implements NFR-3.7: Remove PII from shared readings
"""

from typing import Dict, Any, List, Set


# PII fields that should be removed from shared data
PII_FIELDS: Set[str] = {
    "user_id",
    "user_email",
    "email",
    "user_ip",
    "ip_address",
    "phone_number",
    "user_phone",
    "address",
    "user_address",
    "full_name",
    "first_name",
    "last_name",
    "date_of_birth",
    "ssn",
    "credit_card",
    "passport_number",
    # Karma and faction data can be considered PII in some contexts
    "karma_level",
    "faction_affinity",
    "user_metadata",
}


def remove_pii_from_reading(reading_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Remove PII fields from reading data before sharing

    Args:
        reading_data: Dictionary containing reading information

    Returns:
        Dict with PII fields removed

    Example:
        >>> data = {"user_id": "123", "question": "Love?", "interpretation": "Yes"}
        >>> sanitized = remove_pii_from_reading(data)
        >>> "user_id" in sanitized
        False
        >>> sanitized["question"]
        'Love?'
    """
    if not isinstance(reading_data, dict):
        return reading_data

    # Create a new dict without PII fields
    sanitized = {
        key: value
        for key, value in reading_data.items()
        if key.lower() not in PII_FIELDS
    }

    return sanitized


def remove_pii_from_readings_list(readings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Remove PII from a list of readings

    Args:
        readings: List of reading dictionaries

    Returns:
        List of sanitized readings
    """
    return [remove_pii_from_reading(reading) for reading in readings]


def is_pii_field(field_name: str) -> bool:
    """
    Check if a field name represents PII

    Args:
        field_name: Name of the field to check

    Returns:
        True if field is considered PII
    """
    return field_name.lower() in PII_FIELDS


def sanitize_share_data(data: Dict[str, Any], include_question: bool = True) -> Dict[str, Any]:
    """
    Sanitize data for public sharing with optional question inclusion

    Args:
        data: Reading data to sanitize
        include_question: Whether to include the user's question

    Returns:
        Sanitized data safe for public sharing
    """
    sanitized = remove_pii_from_reading(data)

    if not include_question and "question" in sanitized:
        sanitized["question"] = "[Private Question]"

    return sanitized
