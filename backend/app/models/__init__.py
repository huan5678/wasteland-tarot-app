"""
Models package initialization
"""

from .base import Base, BaseModel
from .wasteland_card import (
    WastelandCard,
    WastelandSuit,
    KarmaAlignment,
    CharacterVoice,
    FactionAlignment,
)
from .user import (
    User,
    UserProfile,
    UserPreferences,
)
from .reading_enhanced import (
    SpreadTemplate,
    InterpretationTemplate,
    ReadingSession,
    ReadingCardPosition,
    CardSynergy,
    SpreadType,
    InterpretationStyle,
    CardSynergyType,
)
from .social_features import (
    UserAchievement,
    UserFriendship,
    KarmaHistory,
    CommunityEvent,
    AchievementCategory,
    FriendshipStatus,
    KarmaChangeReason,
)
from .reading_session import (
    SessionSave,
)
from .session_event import (
    SessionEvent,
)
from .user_analytics import (
    UserAnalytics,
    AnalyticsEvent,
    ReadingPattern,
    UserRecommendation,
)
from .bingo import (
    UserBingoCard,
    DailyBingoNumber,
    UserNumberClaim,
    BingoReward,
    MonthlyResetLog,
    UserBingoCardHistory,
    UserNumberClaimHistory,
    BingoRewardHistory,
)
from .credential import (
    Credential,
)

__all__ = [
    "Base",
    "BaseModel",
    # Wasteland Card Models
    "WastelandCard",
    "WastelandSuit",
    "KarmaAlignment",
    "CharacterVoice",
    "FactionAlignment",
    # User Models
    "User",
    "UserProfile",
    "UserPreferences",
    # Enhanced Reading Models
    "SpreadTemplate",
    "InterpretationTemplate",
    "ReadingSession",
    "ReadingCardPosition",
    "CardSynergy",
    "SpreadType",
    "InterpretationStyle",
    "CardSynergyType",
    # Social Features Models
    "UserAchievement",
    "UserFriendship",
    "KarmaHistory",
    "CommunityEvent",
    "AchievementCategory",
    "FriendshipStatus",
    "KarmaChangeReason",
    # Session Save/Resume Models
    "SessionSave",
    "SessionEvent",
    # Analytics Models
    "UserAnalytics",
    "AnalyticsEvent",
    "ReadingPattern",
    "UserRecommendation",
    # Bingo Game Models
    "UserBingoCard",
    "DailyBingoNumber",
    "UserNumberClaim",
    "BingoReward",
    "MonthlyResetLog",
    "UserBingoCardHistory",
    "UserNumberClaimHistory",
    "BingoRewardHistory",
    # WebAuthn/Passkey Models
    "Credential",
]