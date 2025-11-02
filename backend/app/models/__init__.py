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
    UserLoginHistory,
    TokenExtensionHistory,
)
from .reading_enhanced import (
    SpreadTemplate,
    InterpretationTemplate,
    CompletedReading,
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
    ReadingSession,
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
from .character_voice import (
    Character,
    Faction,
    FactionCharacter,
    CardInterpretation,
)
from .audio_file import (
    AudioFile,
    AudioType,
    GenerationStatus,
)
from .achievement import (
    Achievement,
    UserAchievementProgress,
    AchievementCategory as NewAchievementCategory,
    AchievementRarity,
    AchievementStatus,
)
from .reading_journal import (
    ReadingJournal,
)
from .gamification import (
    KarmaLog,
    UserKarma,
    DailyTask,
    UserDailyTask,
    WeeklyTask,
    UserWeeklyTask,
    UserActivityStats,
    UserLoginStreak,
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
    # Character Voice System Models
    "Character",
    "Faction",
    "FactionCharacter",
    "CardInterpretation",
    # User Models
    "User",
    "UserProfile",
    "UserPreferences",
    "UserLoginHistory",
    "TokenExtensionHistory",
    # Enhanced Reading Models (Completed Readings)
    "SpreadTemplate",
    "InterpretationTemplate",
    "CompletedReading",
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
    # Session Save/Resume Models (In-Progress Readings)
    "ReadingSession",
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
    # Audio/TTS Models
    "AudioFile",
    "AudioType",
    "GenerationStatus",
    # Achievement System Models (New)
    "Achievement",
    "UserAchievementProgress",
    "NewAchievementCategory",
    "AchievementRarity",
    "AchievementStatus",
    # Journal Models
    "ReadingJournal",
    # Dashboard Gamification Models
    "KarmaLog",
    "UserKarma",
    "DailyTask",
    "UserDailyTask",
    "WeeklyTask",
    "UserWeeklyTask",
    "UserActivityStats",
    "UserLoginStreak",
]