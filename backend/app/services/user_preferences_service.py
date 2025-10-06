"""
User Preferences Service
Business logic for user preferences management
"""

from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
import uuid

from app.models.user import UserPreferences


class UserPreferencesService:
    """Service for user preferences management"""

    def __init__(self, db: Session):
        self.db = db

    # ==================== CRUD Operations ====================

    def get_or_create_preferences(self, user_id: str) -> UserPreferences:
        """Get or create user preferences"""
        preferences = self.db.query(UserPreferences).filter(
            UserPreferences.user_id == user_id
        ).first()

        if not preferences:
            preferences = UserPreferences(
                id=str(uuid.uuid4()),
                user_id=user_id
            )
            self.db.add(preferences)
            self.db.commit()
            self.db.refresh(preferences)

        return preferences

    def get_preferences(self, user_id: str) -> Optional[UserPreferences]:
        """Get user preferences"""
        return self.db.query(UserPreferences).filter(
            UserPreferences.user_id == user_id
        ).first()

    def update_preferences(
        self,
        user_id: str,
        updates: Dict[str, Any]
    ) -> UserPreferences:
        """Update user preferences"""
        preferences = self.get_or_create_preferences(user_id)

        # Update preferences
        for key, value in updates.items():
            if hasattr(preferences, key):
                setattr(preferences, key, value)

        self.db.commit()
        self.db.refresh(preferences)

        return preferences

    def reset_preferences(self, user_id: str) -> UserPreferences:
        """Reset preferences to defaults"""
        preferences = self.get_or_create_preferences(user_id)

        # Reset to defaults (matching existing model defaults)
        preferences.default_character_voice = "pip_boy"
        preferences.auto_save_readings = True
        preferences.share_readings_publicly = False
        preferences.favorite_spread_types = ["single_card", "three_card"]
        preferences.reading_reminder_time = None
        preferences.notification_frequency = "weekly"
        preferences.theme = "dark_vault"
        preferences.pip_boy_color = "green"
        preferences.terminal_effects = True
        preferences.sound_effects = True
        preferences.background_music = False
        preferences.preferred_card_back = "vault_tech"
        preferences.geiger_counter_volume = 0.5
        preferences.background_radiation_level = 0.2
        preferences.voice_volume = 0.8
        preferences.ambient_volume = 0.3
        preferences.public_profile = False
        preferences.allow_friend_requests = True
        preferences.share_reading_history = False
        preferences.data_collection_consent = True
        preferences.email_notifications = True
        preferences.daily_reading_reminder = False
        preferences.friend_activity_notifications = True
        preferences.community_updates = True
        preferences.high_contrast_mode = False
        preferences.large_text_mode = False
        preferences.screen_reader_mode = False
        preferences.reduced_motion = False

        self.db.commit()
        self.db.refresh(preferences)

        return preferences

    # ==================== Grouped Updates ====================

    def update_visual_settings(
        self,
        user_id: str,
        theme: Optional[str] = None,
        pip_boy_color: Optional[str] = None,
        terminal_effects: Optional[bool] = None,
        sound_effects: Optional[bool] = None,
        background_music: Optional[bool] = None,
        preferred_card_back: Optional[str] = None
    ) -> UserPreferences:
        """Update visual settings"""
        updates = {}
        if theme is not None:
            updates["theme"] = theme
        if pip_boy_color is not None:
            updates["pip_boy_color"] = pip_boy_color
        if terminal_effects is not None:
            updates["terminal_effects"] = terminal_effects
        if sound_effects is not None:
            updates["sound_effects"] = sound_effects
        if background_music is not None:
            updates["background_music"] = background_music
        if preferred_card_back is not None:
            updates["preferred_card_back"] = preferred_card_back

        return self.update_preferences(user_id, updates)

    def update_audio_settings(
        self,
        user_id: str,
        geiger_counter_volume: Optional[float] = None,
        background_radiation_level: Optional[float] = None,
        voice_volume: Optional[float] = None,
        ambient_volume: Optional[float] = None
    ) -> UserPreferences:
        """Update audio settings"""
        updates = {}
        if geiger_counter_volume is not None:
            updates["geiger_counter_volume"] = max(0.0, min(1.0, geiger_counter_volume))
        if background_radiation_level is not None:
            updates["background_radiation_level"] = max(0.0, min(1.0, background_radiation_level))
        if voice_volume is not None:
            updates["voice_volume"] = max(0.0, min(1.0, voice_volume))
        if ambient_volume is not None:
            updates["ambient_volume"] = max(0.0, min(1.0, ambient_volume))

        return self.update_preferences(user_id, updates)

    def update_reading_settings(
        self,
        user_id: str,
        default_character_voice: Optional[str] = None,
        auto_save_readings: Optional[bool] = None,
        share_readings_publicly: Optional[bool] = None,
        favorite_spread_types: Optional[list] = None,
        reading_reminder_time: Optional[str] = None,
        notification_frequency: Optional[str] = None
    ) -> UserPreferences:
        """Update reading settings"""
        updates = {}
        if default_character_voice is not None:
            updates["default_character_voice"] = default_character_voice
        if auto_save_readings is not None:
            updates["auto_save_readings"] = auto_save_readings
        if share_readings_publicly is not None:
            updates["share_readings_publicly"] = share_readings_publicly
        if favorite_spread_types is not None:
            updates["favorite_spread_types"] = favorite_spread_types
        if reading_reminder_time is not None:
            updates["reading_reminder_time"] = reading_reminder_time
        if notification_frequency is not None:
            updates["notification_frequency"] = notification_frequency

        return self.update_preferences(user_id, updates)

    def update_privacy_settings(
        self,
        user_id: str,
        public_profile: Optional[bool] = None,
        allow_friend_requests: Optional[bool] = None,
        share_reading_history: Optional[bool] = None,
        data_collection_consent: Optional[bool] = None
    ) -> UserPreferences:
        """Update privacy settings"""
        updates = {}
        if public_profile is not None:
            updates["public_profile"] = public_profile
        if allow_friend_requests is not None:
            updates["allow_friend_requests"] = allow_friend_requests
        if share_reading_history is not None:
            updates["share_reading_history"] = share_reading_history
        if data_collection_consent is not None:
            updates["data_collection_consent"] = data_collection_consent

        return self.update_preferences(user_id, updates)

    def update_notification_settings(
        self,
        user_id: str,
        email_notifications: Optional[bool] = None,
        daily_reading_reminder: Optional[bool] = None,
        friend_activity_notifications: Optional[bool] = None,
        community_updates: Optional[bool] = None
    ) -> UserPreferences:
        """Update notification settings"""
        updates = {}
        if email_notifications is not None:
            updates["email_notifications"] = email_notifications
        if daily_reading_reminder is not None:
            updates["daily_reading_reminder"] = daily_reading_reminder
        if friend_activity_notifications is not None:
            updates["friend_activity_notifications"] = friend_activity_notifications
        if community_updates is not None:
            updates["community_updates"] = community_updates

        return self.update_preferences(user_id, updates)

    def update_accessibility_settings(
        self,
        user_id: str,
        high_contrast_mode: Optional[bool] = None,
        large_text_mode: Optional[bool] = None,
        screen_reader_mode: Optional[bool] = None,
        reduced_motion: Optional[bool] = None
    ) -> UserPreferences:
        """Update accessibility settings"""
        updates = {}
        if high_contrast_mode is not None:
            updates["high_contrast_mode"] = high_contrast_mode
        if large_text_mode is not None:
            updates["large_text_mode"] = large_text_mode
        if screen_reader_mode is not None:
            updates["screen_reader_mode"] = screen_reader_mode
        if reduced_motion is not None:
            updates["reduced_motion"] = reduced_motion

        return self.update_preferences(user_id, updates)

    # ==================== Adaptive Experience ====================

    def apply_recommended_settings(
        self,
        user_id: str,
        analytics_data: Dict[str, Any]
    ) -> UserPreferences:
        """Apply recommended settings based on analytics"""
        preferences = self.get_or_create_preferences(user_id)

        # Set default character voice based on most used
        favorite_voice = analytics_data.get("favorite_character_voice")
        if favorite_voice and not preferences.default_character_voice:
            preferences.default_character_voice = favorite_voice

        # Set favorite spreads based on most used
        # This is already tracked in analytics, could enhance logic here

        # Adjust audio based on device type
        device_prefs = analytics_data.get("device_preferences", {})
        if device_prefs.get("mobile", 0) > device_prefs.get("desktop", 0):
            # Mobile users: lower background sounds
            preferences.background_radiation_level = 0.1
            preferences.ambient_volume = 0.2

        self.db.commit()
        self.db.refresh(preferences)

        return preferences

    def get_adaptive_settings(
        self,
        user_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Get adaptive settings based on context"""
        preferences = self.get_or_create_preferences(user_id)
        settings = preferences.to_dict()

        # Apply contextual adjustments
        if context:
            # Performance-based adjustments
            if context.get("low_performance"):
                settings["terminal_effects"] = False
                settings["sound_effects"] = False

            # Device-based adjustments
            if context.get("is_mobile"):
                settings["ambient_volume"] = min(settings.get("ambient_volume", 0.3), 0.2)

        return settings
