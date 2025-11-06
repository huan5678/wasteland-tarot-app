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
from .achievement import (
    AchievementCategory,
    AchievementRarity,
    AchievementStatus,
    AchievementCriteria,
    AchievementRewards,
    AchievementResponse,
    AchievementListResponse,
    UserAchievementProgressResponse,
    UserProgressSummaryResponse,
    ClaimRewardRequest,
    ClaimRewardResponse,
    AchievementUnlockNotification,
    AchievementErrorResponse,
    AchievementAlreadyClaimedError,
    AchievementNotUnlockedError,
)
from .journal import (
    JournalCreate,
    JournalUpdate,
    JournalResponse,
    JournalListResponse,
)
from .wishlist import (
    WishCreate,
    WishUpdate,
    AdminReplyRequest,
    WishResponse,
    AdminWishListResponse,
)
from .user import (
    UserTitlesResponse,
    UpdateTitleRequest,
    UpdateTitleResponse,
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
    # Achievement schemas
    "AchievementCategory",
    "AchievementRarity",
    "AchievementStatus",
    "AchievementCriteria",
    "AchievementRewards",
    "AchievementResponse",
    "AchievementListResponse",
    "UserAchievementProgressResponse",
    "UserProgressSummaryResponse",
    "ClaimRewardRequest",
    "ClaimRewardResponse",
    "AchievementUnlockNotification",
    "AchievementErrorResponse",
    "AchievementAlreadyClaimedError",
    "AchievementNotUnlockedError",
    # Journal schemas
    "JournalCreate",
    "JournalUpdate",
    "JournalResponse",
    "JournalListResponse",
    # Wishlist schemas
    "WishCreate",
    "WishUpdate",
    "AdminReplyRequest",
    "WishResponse",
    "AdminWishListResponse",
    # User schemas (Titles)
    "UserTitlesResponse",
    "UpdateTitleRequest",
    "UpdateTitleResponse",
]