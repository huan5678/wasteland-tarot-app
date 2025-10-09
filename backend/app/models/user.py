"""
User Model - Wasteland Tarot User System
User authentication, profiles, and social features for the wasteland
"""

from sqlalchemy import Column, String, Integer, Float, Text, JSON, Boolean, DateTime, ForeignKey, Index, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import re
from .base import BaseModel
from .wasteland_card import KarmaAlignment, CharacterVoice, FactionAlignment


class User(BaseModel):
    """
    Wasteland Tarot User - Vault dwellers and wasteland wanderers
    """

    __tablename__ = "users"

    # Basic Authentication Info (OAuth 整合)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(50), nullable=False)  # 取代 username，用於顯示名稱
    password_hash = Column(String(255), nullable=True)  # 傳統登入使用，OAuth 使用者為 NULL

    # OAuth Authentication (需求 3.1: OAuth 使用者欄位)
    oauth_provider = Column(String(50), nullable=True)  # 'google', 'github', etc.
    oauth_id = Column(String(255), nullable=True)  # OAuth 提供者的使用者 ID
    profile_picture_url = Column(String(500), nullable=True)  # OAuth 提供的頭像 URL

    # WebAuthn/Passkeys Authentication (獨立模組，可選功能)
    webauthn_user_handle = Column(LargeBinary(64), nullable=True, unique=True)  # WebAuthn user handle for usernameless authentication

    # Profile Information
    display_name = Column(String(100))
    bio = Column(Text)
    avatar_url = Column(String(500))

    # Wasteland-specific Attributes
    faction_alignment = Column(String(50), default=FactionAlignment.VAULT_DWELLER.value)
    karma_score = Column(Integer, default=50)  # 0-100 scale
    vault_number = Column(Integer)
    wasteland_location = Column(String(100))
    experience_level = Column(String(50), default="Novice Survivor")

    # Account Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    is_premium = Column(Boolean, default=False)

    # Reading Statistics
    daily_readings_count = Column(Integer, default=0)
    total_readings = Column(Integer, default=0)
    accurate_predictions = Column(Integer, default=0)
    favorite_card_suit = Column(String(50))

    # Social Features
    allow_friend_requests = Column(Boolean, default=True)
    public_profile = Column(Boolean, default=False)
    joined_groups = Column(JSON, default=list)
    community_points = Column(Integer, default=0)

    # Security & Session Management
    last_login = Column(DateTime(timezone=True))
    session_count = Column(Integer, default=0)
    failed_login_attempts = Column(Integer, default=0)
    last_failed_login = Column(DateTime(timezone=True))
    account_locked_until = Column(DateTime(timezone=True))

    # Data Privacy
    data_collection_consent = Column(Boolean, default=True)
    marketing_consent = Column(Boolean, default=False)

    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    preferences = relationship("UserPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan")
    readings = relationship("ReadingSession", back_populates="user", cascade="all, delete-orphan")
    analytics = relationship("UserAnalytics", back_populates="user", uselist=False, cascade="all, delete-orphan")
    credentials = relationship("Credential", back_populates="user", cascade="all, delete-orphan")  # WebAuthn credentials

    def __repr__(self):
        return f"<User(name='{self.name}', email='{self.email}', faction='{self.faction_alignment}', karma={self.karma_score})>"

    def karma_alignment(self) -> KarmaAlignment:
        """Determine karma alignment based on karma score"""
        if self.karma_score >= 70:
            return KarmaAlignment.GOOD
        elif self.karma_score <= 30:
            return KarmaAlignment.EVIL
        else:
            return KarmaAlignment.NEUTRAL

    def is_brotherhood_member(self) -> bool:
        """Check if user is aligned with Brotherhood of Steel"""
        return self.faction_alignment == FactionAlignment.BROTHERHOOD.value

    def get_faction_rank(self) -> str:
        """Get user's rank within their faction"""
        # This would be more complex in a real implementation
        return "Initiate"  # Default rank

    def get_faction_benefits(self) -> Dict[str, Any]:
        """Get benefits based on faction alignment"""
        benefits = {
            FactionAlignment.BROTHERHOOD.value: {
                "tech_bonus": True,
                "energy_weapons_expertise": True,
                "power_armor_training": True
            },
            FactionAlignment.NCR.value: {
                "trade_bonus": True,
                "diplomatic_immunity": True,
                "republic_backing": True
            },
            FactionAlignment.LEGION.value: {
                "combat_bonus": True,
                "fear_resistance": True,
                "tribal_knowledge": True
            },
            FactionAlignment.RAIDERS.value: {
                "chaos_bonus": True,
                "intimidation": True,
                "scavenging_expertise": True
            },
            FactionAlignment.VAULT_DWELLER.value: {
                "pip_boy_access": True,
                "vault_tech_knowledge": True,
                "pure_genetics": True
            }
        }
        return benefits.get(self.faction_alignment, {})

    def can_create_reading(self) -> bool:
        """Check if user can create a new reading today"""
        max_daily_readings = 20
        if self.is_premium:
            max_daily_readings = 50
        return self.daily_readings_count < max_daily_readings

    def is_valid_email(self) -> bool:
        """驗證 email 格式"""
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(email_pattern, self.email) is not None

    def is_valid_name(self) -> bool:
        """驗證 name 格式（取代原本的 username 驗證）"""
        if not self.name or len(self.name) < 1 or len(self.name) > 50:
            return False
        # 允許更廣泛的字元（包含空格、中文等）
        # 只排除危險字元
        dangerous_chars = ['<', '>', '{', '}', '\\', '|', '^', '~', '[', ']', '`']
        return not any(char in self.name for char in dangerous_chars)

    def get_sanitized_display_name(self) -> str:
        """取得經過 XSS 防護的顯示名稱"""
        if not self.display_name:
            return self.name  # Fallback 使用 name 而非 username
        # 移除 HTML 標籤和危險字元
        import html
        sanitized = html.escape(self.display_name)
        return re.sub(r'<[^>]+>', '', sanitized)

    def is_session_valid(self) -> bool:
        """Check if user's session is valid"""
        if not self.last_login:
            return False
        # Session expires after 30 days
        expiry_time = self.last_login + timedelta(days=30)
        return datetime.utcnow() < expiry_time

    def is_account_locked(self) -> bool:
        """Check if account is locked due to failed login attempts"""
        if self.failed_login_attempts >= 5:
            return True
        if self.account_locked_until and datetime.utcnow() < self.account_locked_until:
            return True
        return False

    def can_send_friend_request_to(self, other_user: 'User') -> bool:
        """Check if user can send friend request to another user"""
        return (
            other_user.allow_friend_requests and
            self.id != other_user.id and
            self.is_active and
            other_user.is_active
        )

    def get_mutual_friends_with(self, other_user: 'User') -> List['User']:
        """Get mutual friends with another user"""
        # This would be implemented with proper friend relationship tables
        return []

    def is_community_member(self) -> bool:
        """Check if user is an active community member"""
        return len(self.joined_groups) > 0 or self.community_points > 0

    def get_community_rank(self) -> str:
        """Get user's community rank based on points"""
        if self.community_points >= 1000:
            return "Wasteland Legend"
        elif self.community_points >= 500:
            return "Veteran Survivor"
        elif self.community_points >= 100:
            return "Regular Member"
        else:
            return "Newcomer"

    def export_user_data(self, include_profile: bool = True, include_preferences: bool = True) -> Dict[str, Any]:
        """匯出使用者資料（隱私合規）"""
        data = {
            "user_info": {
                "name": self.name,  # 使用 name 而非 username
                "email": self.email,
                "display_name": self.display_name,
                "bio": self.bio,
                "faction_alignment": self.faction_alignment,
                "karma_score": self.karma_score,
                "total_readings": self.total_readings,
                "created_at": self.created_at.isoformat() if self.created_at else None,
                "last_login": self.last_login.isoformat() if self.last_login else None
            }
        }

        if include_profile and self.profile:
            data["profile"] = self.profile.to_dict()

        if include_preferences and self.preferences:
            data["preferences"] = self.preferences.to_dict()

        # Always include reading history
        data["reading_history"] = [reading.to_dict() for reading in self.readings]

        return data



class UserProfile(BaseModel):
    """
    Extended user profile with wasteland-specific information
    """

    __tablename__ = "user_profiles"

    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Wasteland Character Info
    preferred_voice = Column(String(50), default=CharacterVoice.PIP_BOY.value)
    vault_number = Column(Integer)
    wasteland_location = Column(String(100))
    favorite_faction = Column(String(50))
    experience_level = Column(String(50), default="Novice Survivor")

    # Reading Preferences
    favorite_card_suit = Column(String(50))
    preferred_reading_style = Column(String(50), default="detailed_analysis")
    total_readings = Column(Integer, default=0)
    consecutive_days = Column(Integer, default=0)
    rare_cards_found = Column(Integer, default=0)

    # Achievements and Statistics
    achievements = Column(JSON, default=list)
    badges_earned = Column(JSON, default=list)
    milestone_dates = Column(JSON, default={})

    # Social Stats
    friends_count = Column(Integer, default=0)
    readings_shared = Column(Integer, default=0)
    community_contributions = Column(Integer, default=0)

    # Relationship
    user = relationship("User", back_populates="profile")

    def get_achievements(self) -> List[str]:
        """Calculate and return user achievements"""
        achievements = []

        if self.total_readings >= 100:
            achievements.append("century_reader")
        if self.total_readings >= 500:
            achievements.append("master_diviner")

        if self.consecutive_days >= 30:
            achievements.append("month_streak")
        if self.consecutive_days >= 365:
            achievements.append("year_streak")

        if self.rare_cards_found >= 5:
            achievements.append("rare_collector")
        if self.rare_cards_found >= 20:
            achievements.append("legendary_finder")

        if self.friends_count >= 10:
            achievements.append("social_butterfly")

        return achievements

    def calculate_statistics(self) -> Dict[str, Any]:
        """Calculate profile statistics"""
        accuracy_rate = 0.0
        if self.total_readings > 0 and hasattr(self.user, 'accurate_predictions'):
            accuracy_rate = self.user.accurate_predictions / self.total_readings

        return {
            "total_readings": self.total_readings,
            "accuracy_rate": accuracy_rate,
            "consecutive_days": self.consecutive_days,
            "achievements_count": len(self.get_achievements()),
            "preferred_suit": self.favorite_card_suit,
            "experience_level": self.experience_level,
            "social_score": self.friends_count + self.readings_shared
        }

    def to_dict(self) -> Dict[str, Any]:
        """Convert profile to dictionary representation"""
        return {
            "user_id": self.user_id,
            "preferred_voice": self.preferred_voice,
            "vault_number": self.vault_number,
            "wasteland_location": self.wasteland_location,
            "favorite_faction": self.favorite_faction,
            "experience_level": self.experience_level,
            "favorite_card_suit": self.favorite_card_suit,
            "preferred_reading_style": self.preferred_reading_style,
            "total_readings": self.total_readings,
            "consecutive_days": self.consecutive_days,
            "rare_cards_found": self.rare_cards_found,
            "achievements": self.achievements,
            "badges_earned": self.badges_earned,
            "milestone_dates": self.milestone_dates,
            "friends_count": self.friends_count,
            "readings_shared": self.readings_shared,
            "community_contributions": self.community_contributions
        }


class UserPreferences(BaseModel):
    """
    User preferences for UI, notifications, and reading settings
    """

    __tablename__ = "user_preferences"

    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Reading Preferences
    default_character_voice = Column(String(50), default=CharacterVoice.PIP_BOY.value)
    auto_save_readings = Column(Boolean, default=True)
    share_readings_publicly = Column(Boolean, default=False)
    favorite_spread_types = Column(JSON, default=lambda: ["single_card", "three_card"])
    reading_reminder_time = Column(String(10))  # HH:MM format
    notification_frequency = Column(String(20), default="weekly")

    # UI Preferences
    theme = Column(String(50), default="dark_vault")
    pip_boy_color = Column(String(20), default="green")
    terminal_effects = Column(Boolean, default=True)
    sound_effects = Column(Boolean, default=True)
    background_music = Column(Boolean, default=False)
    preferred_card_back = Column(String(50), default="vault_tech")

    # Audio Settings
    geiger_counter_volume = Column(Float, default=0.5)
    background_radiation_level = Column(Float, default=0.2)
    voice_volume = Column(Float, default=0.8)
    ambient_volume = Column(Float, default=0.3)

    # Privacy Settings
    public_profile = Column(Boolean, default=False)
    allow_friend_requests = Column(Boolean, default=True)
    share_reading_history = Column(Boolean, default=False)
    data_collection_consent = Column(Boolean, default=True)

    # Notification Settings
    email_notifications = Column(Boolean, default=True)
    daily_reading_reminder = Column(Boolean, default=False)
    friend_activity_notifications = Column(Boolean, default=True)
    community_updates = Column(Boolean, default=True)

    # Accessibility
    high_contrast_mode = Column(Boolean, default=False)
    large_text_mode = Column(Boolean, default=False)
    screen_reader_mode = Column(Boolean, default=False)
    reduced_motion = Column(Boolean, default=False)

    # Relationship
    user = relationship("User", back_populates="preferences")

    def is_profile_public(self) -> bool:
        """Check if user profile is public"""
        return self.public_profile

    def allows_social_features(self) -> bool:
        """Check if user allows social features"""
        return self.allow_friend_requests

    def shares_data(self) -> bool:
        """Check if user shares reading history"""
        return self.share_reading_history

    def to_dict(self) -> Dict[str, Any]:
        """Convert preferences to dictionary representation"""
        return {
            "user_id": self.user_id,
            "default_character_voice": self.default_character_voice,
            "auto_save_readings": self.auto_save_readings,
            "share_readings_publicly": self.share_readings_publicly,
            "favorite_spread_types": self.favorite_spread_types,
            "reading_reminder_time": self.reading_reminder_time,
            "notification_frequency": self.notification_frequency,
            "theme": self.theme,
            "pip_boy_color": self.pip_boy_color,
            "terminal_effects": self.terminal_effects,
            "sound_effects": self.sound_effects,
            "background_music": self.background_music,
            "preferred_card_back": self.preferred_card_back,
            "geiger_counter_volume": self.geiger_counter_volume,
            "background_radiation_level": self.background_radiation_level,
            "voice_volume": self.voice_volume,
            "ambient_volume": self.ambient_volume,
            "public_profile": self.public_profile,
            "allow_friend_requests": self.allow_friend_requests,
            "share_reading_history": self.share_reading_history,
            "data_collection_consent": self.data_collection_consent,
            "email_notifications": self.email_notifications,
            "daily_reading_reminder": self.daily_reading_reminder,
            "friend_activity_notifications": self.friend_activity_notifications,
            "community_updates": self.community_updates,
            "high_contrast_mode": self.high_contrast_mode,
            "large_text_mode": self.large_text_mode,
            "screen_reader_mode": self.screen_reader_mode,
            "reduced_motion": self.reduced_motion
        }
