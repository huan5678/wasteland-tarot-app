"""
Pydantic schemas for Wasteland Tarot API
"""

from .sessions import (
    SessionCreateSchema,
    SessionUpdateSchema,
    SessionResponseSchema,
    SessionMetadataSchema,
    OfflineSessionSchema,
    ConflictResolutionSchema,
    ConflictInfoSchema,
)
from .bingo import (
    BingoCardCreate,
    BingoCardResponse,
    DailyNumberResponse,
    ClaimResponse,
    ClaimResponseWithReward,
    LineCheckResult,
    BingoStatusResponse,
    RewardResponse,
    BingoHistoryResponse,
    ErrorResponse,
    ClaimResult,
    ResetLogMetadata,
)

__all__ = [
    "SessionCreateSchema",
    "SessionUpdateSchema",
    "SessionResponseSchema",
    "SessionMetadataSchema",
    "OfflineSessionSchema",
    "ConflictResolutionSchema",
    "ConflictInfoSchema",
    # Bingo schemas
    "BingoCardCreate",
    "BingoCardResponse",
    "DailyNumberResponse",
    "ClaimResponse",
    "ClaimResponseWithReward",
    "LineCheckResult",
    "BingoStatusResponse",
    "RewardResponse",
    "BingoHistoryResponse",
    "ErrorResponse",
    "ClaimResult",
    "ResetLogMetadata",
]