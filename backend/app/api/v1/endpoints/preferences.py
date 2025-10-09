"""
User Preferences API Endpoints
Handles user preferences and settings management
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.user_preferences_service import UserPreferencesService

router = APIRouter()


# ==================== Schemas ====================

class VisualSettingsUpdate(BaseModel):
    """Visual settings update schema"""
    enable_animations: Optional[bool] = None
    enable_sound_effects: Optional[bool] = None
    enable_background_music: Optional[bool] = None
    background_opacity: Optional[int] = Field(None, ge=0, le=100)


class ReadingSettingsUpdate(BaseModel):
    """Reading settings update schema"""
    default_spread_type: Optional[str] = None
    auto_save_readings: Optional[bool] = None
    show_card_meanings: Optional[bool] = None
    show_keywords: Optional[bool] = None
    card_flip_animation_speed: Optional[int] = Field(None, ge=100, le=2000)


class InterpretationSettingsUpdate(BaseModel):
    """Interpretation settings update schema"""
    depth: Optional[str] = None
    style: Optional[str] = None
    preferred_character_voice: Optional[str] = None
    ai_provider_preference: Optional[str] = None


class NotificationSettingsUpdate(BaseModel):
    """Notification settings update schema"""
    enable_email_notifications: Optional[bool] = None
    enable_reading_reminders: Optional[bool] = None
    reminder_time: Optional[str] = None  # HH:MM format
    reminder_days: Optional[List[str]] = None


class PrivacySettingsUpdate(BaseModel):
    """Privacy settings update schema"""
    profile_visibility: Optional[str] = None
    allow_reading_sharing: Optional[bool] = None
    anonymous_analytics: Optional[bool] = None


class AccessibilitySettingsUpdate(BaseModel):
    """Accessibility settings update schema"""
    high_contrast_mode: Optional[bool] = None
    large_text_mode: Optional[bool] = None
    reduce_motion: Optional[bool] = None
    screen_reader_optimized: Optional[bool] = None


class ThemeUpdate(BaseModel):
    """Theme update schema"""
    theme: str


class AdaptiveSettingsContext(BaseModel):
    """Context for adaptive settings"""
    is_night_time: Optional[bool] = None
    is_mobile: Optional[bool] = None
    low_performance: Optional[bool] = None


# ==================== Endpoints ====================

@router.get("/")
async def get_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user preferences

    Returns all user preference settings organized by category
    """
    service = UserPreferencesService(db)
    preferences = service.get_or_create_preferences(current_user.id)

    return {
        "message": "Preferences retrieved successfully",
        "preferences": preferences.to_dict()
    }


@router.post("/reset", status_code=200)
async def reset_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Reset preferences to defaults

    Resets all user preferences to their default values
    """
    service = UserPreferencesService(db)
    preferences = service.reset_preferences(current_user.id)

    return {
        "message": "Preferences reset to defaults",
        "preferences": preferences.to_dict()
    }


@router.put("/theme", status_code=200)
async def update_theme(
    theme_data: ThemeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update theme preference

    Available themes: wasteland, vault_tec, mystical, classic
    """
    service = UserPreferencesService(db)

    try:
        preferences = service.update_theme(current_user.id, theme_data.theme)
        return {
            "message": "Theme updated successfully",
            "preferences": preferences.to_dict()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/visual", status_code=200)
async def update_visual_settings(
    settings: VisualSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update visual settings

    Includes animations, sound effects, background music, and opacity
    """
    service = UserPreferencesService(db)

    preferences = service.update_visual_settings(
        user_id=current_user.id,
        enable_animations=settings.enable_animations,
        enable_sound_effects=settings.enable_sound_effects,
        enable_background_music=settings.enable_background_music,
        background_opacity=settings.background_opacity
    )

    return {
        "message": "Visual settings updated successfully",
        "preferences": preferences.to_dict()
    }


@router.put("/reading", status_code=200)
async def update_reading_settings(
    settings: ReadingSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update reading settings

    Includes default spread, auto-save, card meanings display, and animation speed
    """
    service = UserPreferencesService(db)

    preferences = service.update_reading_settings(
        user_id=current_user.id,
        default_spread_type=settings.default_spread_type,
        auto_save_readings=settings.auto_save_readings,
        show_card_meanings=settings.show_card_meanings,
        show_keywords=settings.show_keywords,
        card_flip_animation_speed=settings.card_flip_animation_speed
    )

    return {
        "message": "Reading settings updated successfully",
        "preferences": preferences.to_dict()
    }


@router.put("/interpretation", status_code=200)
async def update_interpretation_settings(
    settings: InterpretationSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update interpretation settings

    Includes depth (simple/medium/deep), style (balanced/mystical/practical/psychological),
    character voice, and AI provider preference
    """
    service = UserPreferencesService(db)

    try:
        preferences = service.update_interpretation_settings(
            user_id=current_user.id,
            depth=settings.depth,
            style=settings.style,
            preferred_character_voice=settings.preferred_character_voice,
            ai_provider_preference=settings.ai_provider_preference
        )

        return {
            "message": "Interpretation settings updated successfully",
            "preferences": preferences.to_dict()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/notifications", status_code=200)
async def update_notification_settings(
    settings: NotificationSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update notification settings

    Includes email notifications, reading reminders, reminder time, and reminder days
    """
    service = UserPreferencesService(db)

    preferences = service.update_notification_settings(
        user_id=current_user.id,
        enable_email_notifications=settings.enable_email_notifications,
        enable_reading_reminders=settings.enable_reading_reminders,
        reminder_time=settings.reminder_time,
        reminder_days=settings.reminder_days
    )

    return {
        "message": "Notification settings updated successfully",
        "preferences": preferences.to_dict()
    }


@router.put("/privacy", status_code=200)
async def update_privacy_settings(
    settings: PrivacySettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update privacy settings

    Includes profile visibility, reading sharing, and anonymous analytics
    """
    service = UserPreferencesService(db)

    preferences = service.update_privacy_settings(
        user_id=current_user.id,
        profile_visibility=settings.profile_visibility,
        allow_reading_sharing=settings.allow_reading_sharing,
        anonymous_analytics=settings.anonymous_analytics
    )

    return {
        "message": "Privacy settings updated successfully",
        "preferences": preferences.to_dict()
    }


@router.put("/accessibility", status_code=200)
async def update_accessibility_settings(
    settings: AccessibilitySettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update accessibility settings

    Includes high contrast mode, large text, reduced motion, and screen reader optimization
    """
    service = UserPreferencesService(db)

    preferences = service.update_accessibility_settings(
        user_id=current_user.id,
        high_contrast_mode=settings.high_contrast_mode,
        large_text_mode=settings.large_text_mode,
        reduce_motion=settings.reduce_motion,
        screen_reader_optimized=settings.screen_reader_optimized
    )

    return {
        "message": "Accessibility settings updated successfully",
        "preferences": preferences.to_dict()
    }


@router.get("/history")
async def get_preference_history(
    preference_key: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get preference change history

    Returns a log of preference changes over time
    """
    service = UserPreferencesService(db)

    history = service.get_preference_history(
        user_id=current_user.id,
        preference_key=preference_key,
        limit=limit
    )

    return {
        "history": [h.to_dict() for h in history],
        "count": len(history)
    }


@router.post("/apply-recommended", status_code=200)
async def apply_recommended_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Apply recommended settings based on analytics

    Automatically adjusts preferences based on user behavior and analytics
    """
    from app.services.user_analytics_service import UserAnalyticsService

    # Get user analytics
    analytics_service = UserAnalyticsService(db)
    analytics = analytics_service.get_or_create_analytics(current_user.id)

    # Apply recommended settings
    preferences_service = UserPreferencesService(db)
    preferences = preferences_service.apply_recommended_settings(
        user_id=current_user.id,
        analytics_data=analytics.to_dict()
    )

    return {
        "message": "Recommended settings applied",
        "preferences": preferences.to_dict()
    }


@router.post("/adaptive", status_code=200)
async def get_adaptive_settings(
    context: AdaptiveSettingsContext,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get adaptive settings based on context

    Returns dynamically adjusted settings based on time of day, device, and performance
    """
    service = UserPreferencesService(db)

    settings = service.get_adaptive_settings(
        user_id=current_user.id,
        context=context.dict()
    )

    return {
        "message": "Adaptive settings retrieved",
        "settings": settings
    }
