"""
User Service - Business logic for user management in Wasteland Tarot
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from app.models.user import User, UserProfile, UserPreferences
from app.models.wasteland_card import KarmaAlignment, CharacterVoice, FactionAlignment
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    create_verification_token,
    create_password_reset_token,
    verify_token
)
from app.core.exceptions import (
    UserNotFoundError,
    InvalidCredentialsError,
    UserAlreadyExistsError,
    AccountLockedError,
    AccountInactiveError,
    InvalidTokenError,
    OAuthUserCannotLoginError
)

logger = logging.getLogger(__name__)


class UserService:
    """Service for user management operations"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def create_user(
        self,
        email: str,
        password: str,
        name: str,
        **kwargs
    ) -> User:
        """
        建立新使用者（使用 email + password + name）

        Args:
            email: 使用者 email（必須唯一）
            password: 使用者密碼（至少 8 字元）
            name: 使用者名稱（1-50 字元）
            **kwargs: 其他選填欄位（faction_alignment, karma_score 等）

        Returns:
            User: 建立的使用者物件

        Raises:
            ValueError: email 格式無效、name 長度無效、密碼太短
            UserAlreadyExistsError: Email 已存在

        需求：
        - 5.1: 使用 email + password + name 註冊
        - 5.3: Email 格式驗證
        - 5.4: 檢查 email 唯一性
        - 13.5: 使用 bcrypt 雜湊密碼（成本因子 12）
        """
        import re

        # 驗證 email 格式
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not email or not re.match(email_pattern, email):
            raise ValueError(f"無效的 email 格式: {email}")

        # 驗證 name 長度（1-50 字元）
        if not name or len(name) < 1 or len(name) > 50:
            raise ValueError(f"name 長度必須在 1-50 字元之間，目前長度: {len(name)}")

        # 驗證密碼強度（至少 8 字元）
        if not password or len(password) < 8:
            raise ValueError("密碼長度必須至少 8 字元")

        # 檢查 email 是否已存在
        existing_email = await self.db.execute(
            select(User).where(User.email == email)
        )
        if existing_email.scalar_one_or_none():
            raise UserAlreadyExistsError(f"Email '{email}' 已被使用")

        # 使用 bcrypt 雜湊密碼（成本因子 12）
        password_hash = get_password_hash(password)

        # 建立使用者（傳統註冊：oauth_provider=NULL, oauth_id=NULL）
        user = User(
            email=email,
            name=name,
            password_hash=password_hash,
            oauth_provider=None,
            oauth_id=None,
            display_name=kwargs.get("display_name", name),
            faction_alignment=kwargs.get("faction_alignment", FactionAlignment.VAULT_DWELLER.value),
            karma_score=kwargs.get("karma_score", 50),
            wasteland_location=kwargs.get("wasteland_location"),
            is_active=True,
            is_verified=False
        )

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        # Create default profile and preferences for new user
        try:
            await self._create_default_profile(user.id)
            await self._create_default_preferences(user.id)
            await self.db.commit()
        except Exception as e:
            logger.error(f"Failed to create default profile/preferences for user {user.id}: {e}")
            # Don't fail registration if profile creation fails
            pass

        return user

    async def get_user_by_id(self, user_id: str) -> User:
        """Get user by ID with relationships"""
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.profile), selectinload(User.preferences))
            .where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise UserNotFoundError(f"User with ID '{user_id}' not found")
        return user

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        result = await self.db.execute(
            select(User)
            .where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def update_user_profile(self, user_id: str, profile_data: Dict[str, Any]) -> User:
        """Update user profile information"""
        user = await self.get_user_by_id(user_id)

        # Update basic user fields
        if "display_name" in profile_data:
            user.display_name = profile_data["display_name"]
        if "bio" in profile_data:
            user.bio = profile_data["bio"]
        if "faction_alignment" in profile_data:
            user.faction_alignment = profile_data["faction_alignment"]

        # Update or create profile
        if not user.profile:
            await self._create_default_profile(user_id)
            await self.db.refresh(user)

        profile = user.profile
        if "wasteland_location" in profile_data:
            profile.wasteland_location = profile_data["wasteland_location"]
        if "preferred_voice" in profile_data:
            profile.preferred_voice = profile_data["preferred_voice"]
        if "experience_level" in profile_data:
            profile.experience_level = profile_data["experience_level"]

        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_user_preferences(self, user_id: str, preferences_data: Dict[str, Any]) -> User:
        """Update user preferences"""
        user = await self.get_user_by_id(user_id)

        # Update or create preferences
        if not user.preferences:
            await self._create_default_preferences(user_id)
            await self.db.refresh(user)

        preferences = user.preferences
        for key, value in preferences_data.items():
            if hasattr(preferences, key):
                setattr(preferences, key, value)

        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def delete_user(self, user_id: str) -> bool:
        """Delete user and all associated data"""
        user = await self.get_user_by_id(user_id)
        await self.db.delete(user)
        await self.db.commit()
        return True

    async def get_user_reading_history(
        self,
        user_id: str,
        limit: int = 10,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get user's reading history with full details"""
        from app.models.reading_enhanced import CompletedReading as Reading

        # Query user's completed readings
        result = await self.db.execute(
            select(Reading)
            .where(Reading.user_id == user_id)
            .order_by(desc(Reading.created_at))
            .limit(limit)
            .offset(offset)
        )
        readings = result.scalars().all()

        # Convert to dictionaries
        reading_history = []
        for reading in readings:
            reading_dict = {
                "id": str(reading.id),
                "question": reading.question,
                "spread_type": reading.spread_template_id,
                "overall_interpretation": reading.overall_interpretation,
                "character_voice": reading.character_voice_used,
                "karma_context": reading.karma_context,
                "radiation_factor": reading.radiation_factor,
                "created_at": reading.created_at.isoformat() if reading.created_at else None,
                "is_favorite": reading.is_favorite,
                "user_satisfaction": reading.user_satisfaction,
                "privacy_level": reading.privacy_level
            }
            reading_history.append(reading_dict)

        return reading_history

    async def get_user_statistics(self, user_id: str) -> Dict[str, Any]:
        """Calculate user statistics"""
        from app.models.reading_enhanced import CompletedReading as Reading

        user = await self.get_user_by_id(user_id)

        # Get reading count
        reading_count_result = await self.db.execute(
            select(func.count(Reading.id)).where(Reading.user_id == user_id)
        )
        total_readings = reading_count_result.scalar() or 0

        # Calculate accuracy rate
        accuracy_rate = 0.0
        if total_readings > 0 and user.accurate_predictions:
            accuracy_rate = user.accurate_predictions / total_readings

        return {
            "total_readings": total_readings,
            "karma_alignment": user.karma_alignment().value,
            "faction_alignment": user.faction_alignment,
            "accuracy_rate": accuracy_rate,
            "community_points": user.community_points,
            "experience_level": user.experience_level,
            "favorite_cards": [],  # Would be calculated from reading history
            "achievements": user.profile.get_achievements() if user.profile else []
        }

    async def send_friend_request(self, sender_id: str, recipient_id: str) -> str:
        """Send friend request between users"""
        # In a real implementation, this would create a FriendRequest model
        # For now, we'll just return a mock request ID
        return f"friend_request_{sender_id}_{recipient_id}"

    async def accept_friend_request(self, request_id: str) -> bool:
        """Accept a friend request"""
        # In a real implementation, this would update the FriendRequest model
        # and create Friendship records
        return True

    async def get_user_friends(self, user_id: str) -> List[User]:
        """Get user's friends list"""
        # In a real implementation, this would query the Friendship table
        return []

    async def share_reading_with_friends(
        self,
        user_id: str,
        reading_id: str,
        friend_ids: List[str]
    ) -> bool:
        """Share a reading with friends"""
        # In a real implementation, this would update the Reading model
        # with shared_with_users field
        return True

    async def export_user_data(self, user_id: str) -> Dict[str, Any]:
        """Export user data for privacy compliance"""
        user = await self.get_user_by_id(user_id)
        return user.export_user_data(include_profile=True, include_preferences=True)

    async def anonymize_user_data(self, user_id: str) -> bool:
        """Anonymize user data while preserving analytics"""
        user = await self.get_user_by_id(user_id)

        # Anonymize personal data
        user.name = f"anonymous_{user.id[:8]}"
        user.email = "anonymized@domain.com"
        user.display_name = "Anonymous User"
        user.bio = None

        if user.profile:
            user.profile.bio = None
            user.profile.wasteland_location = "Unknown"

        await self.db.commit()
        return True

    async def cleanup_inactive_users(self, cutoff_date: datetime) -> Dict[str, int]:
        """Clean up inactive users older than cutoff date"""
        # In a real implementation, this would delete or anonymize old accounts
        return {"deleted_count": 0, "anonymized_count": 0}

    async def _create_default_profile(self, user_id: str) -> UserProfile:
        """Create default profile for user"""
        profile = UserProfile(
            user_id=user_id,
            preferred_voice=CharacterVoice.PIP_BOY.value,
            experience_level="Novice Survivor",
            total_readings=0,
            consecutive_days=0,
            rare_cards_found=0
        )
        self.db.add(profile)
        await self.db.commit()
        return profile

    async def _create_default_preferences(self, user_id: str) -> UserPreferences:
        """Create default preferences for user"""
        preferences = UserPreferences(
            user_id=user_id,
            default_character_voice=CharacterVoice.PIP_BOY.value,
            auto_save_readings=True,
            theme="dark_vault",
            terminal_effects=True,
            sound_effects=True
        )
        self.db.add(preferences)
        await self.db.commit()
        return preferences

    async def deactivate_user(self, user_id: str) -> User:
        """Deactivate a user account"""
        user = await self.get_user_by_id(user_id)
        user.is_active = False
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def activate_user(self, user_id: str) -> User:
        """Activate a user account"""
        user = await self.get_user_by_id(user_id)
        user.is_active = True
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def authenticate_user(self, email: str, password: str) -> User:
        """
        使用 email 和密碼進行認證

        Args:
            email: 使用者 email
            password: 使用者密碼

        Returns:
            User: 認證成功的使用者物件

        Raises:
            InvalidCredentialsError: email 或密碼錯誤（通用訊息）
            OAuthUserCannotLoginError: OAuth 使用者嘗試密碼登入
            AccountLockedError: 帳號被鎖定
            AccountInactiveError: 帳號未啟用

        需求：
        - 4.1: 使用 email 而非 username
        - 4.3: OAuth 使用者不允許密碼登入
        - 4.4: 檢查 password_hash 是否為 NULL
        - 4.5: 提示使用 OAuth 登入
        - 4.7: 使用通用錯誤訊息
        """
        # 使用 email 查詢使用者
        logger.info(f"Authenticating user: {email}")
        user = await self.get_user_by_email(email)
        logger.info(f"User found: {user.email if user else 'None'}")

        # 不存在的 email：返回通用錯誤訊息（不洩露帳號是否存在）
        if not user:
            raise InvalidCredentialsError("email 或密碼錯誤")

        # 檢查是否為 OAuth 使用者（password_hash 為 NULL）
        if user.password_hash is None:
            # 判斷 OAuth 提供者
            provider = user.oauth_provider or "OAuth"
            provider_display = {
                "google": "Google",
                "github": "GitHub",
                "facebook": "Facebook"
            }.get(provider.lower(), provider)

            raise OAuthUserCannotLoginError(provider=provider_display)

        # 檢查帳號是否被鎖定
        if user.is_account_locked():
            raise AccountLockedError()

        # 檢查帳號是否啟用
        if not user.is_active:
            raise AccountInactiveError()

        # 驗證密碼
        logger.info(f"Verifying password for user: {email}")
        password_verified = verify_password(password, user.password_hash)
        logger.info(f"Password verified: {password_verified}")
        if not password_verified:
            # 記錄失敗登入
            user.failed_login_attempts += 1
            user.last_failed_login = datetime.utcnow()

            # 5次失敗後鎖定帳號
            if user.failed_login_attempts >= 5:
                user.account_locked_until = datetime.utcnow() + timedelta(hours=1)

            await self.db.commit()

            # 返回通用錯誤訊息
            raise InvalidCredentialsError("email 或密碼錯誤")

        # 認證成功：重置失敗次數
        user.failed_login_attempts = 0
        user.last_login = datetime.utcnow()
        user.session_count += 1
        await self.db.commit()

        return user


class AuthenticationService:
    """Service for authentication operations"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.user_service = UserService(db_session)

    async def authenticate_user(self, email: str, password: str) -> User:
        """
        使用 email 和密碼進行認證

        Args:
            email: 使用者 email
            password: 使用者密碼

        Returns:
            User: 認證成功的使用者物件

        Raises:
            InvalidCredentialsError: email 或密碼錯誤（通用訊息）
            OAuthUserCannotLoginError: OAuth 使用者嘗試密碼登入
            AccountLockedError: 帳號被鎖定
            AccountInactiveError: 帳號未啟用

        需求：
        - 4.1: 使用 email 而非 username
        - 4.3: OAuth 使用者不允許密碼登入
        - 4.4: 檢查 password_hash 是否為 NULL
        - 4.5: 提示使用 OAuth 登入
        - 4.7: 使用通用錯誤訊息
        """
        # 使用 email 查詢使用者
        user = await self.user_service.get_user_by_email(email)

        # 不存在的 email：返回通用錯誤訊息（不洩露帳號是否存在）
        if not user:
            raise InvalidCredentialsError("email 或密碼錯誤")

        # 檢查是否為 OAuth 使用者（password_hash 為 NULL）
        if user.password_hash is None:
            # 判斷 OAuth 提供者
            provider = user.oauth_provider or "OAuth"
            provider_display = {
                "google": "Google",
                "github": "GitHub",
                "facebook": "Facebook"
            }.get(provider.lower(), provider)

            raise OAuthUserCannotLoginError(provider=provider_display)

        # 檢查帳號是否被鎖定
        if user.is_account_locked():
            raise AccountLockedError()

        # 檢查帳號是否啟用
        if not user.is_active:
            raise AccountInactiveError()

        # 驗證密碼
        if not verify_password(password, user.password_hash):
            # 記錄失敗登入
            user.failed_login_attempts += 1
            user.last_failed_login = datetime.utcnow()

            # 5次失敗後鎖定帳號
            if user.failed_login_attempts >= 5:
                user.account_locked_until = datetime.utcnow() + timedelta(hours=1)

            await self.db.commit()

            # 返回通用錯誤訊息
            raise InvalidCredentialsError("email 或密碼錯誤")

        # 認證成功：重置失敗次數
        user.failed_login_attempts = 0
        user.last_login = datetime.utcnow()
        user.session_count += 1
        await self.db.commit()

        return user

    async def register_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Register a new user and return tokens"""
        user = await self.user_service.create_user(**user_data)

        # Create tokens
        access_token = create_access_token({"sub": user.id})
        refresh_token = create_refresh_token({"sub": user.id})

        return {
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "display_name": user.display_name,
                "faction_alignment": user.faction_alignment,
                "karma_score": user.karma_score,
                "wasteland_location": user.wasteland_location,
                "is_verified": user.is_verified
            },
            "access_token": access_token,
            "refresh_token": refresh_token
        }

    async def login_user(self, email: str, password: str) -> Dict[str, Any]:
        """
        Login user and return tokens (使用 email + password)

        注意：此方法已被 authenticate_user() 取代，建議使用 authenticate_user()
        此方法保留以維持向後兼容性
        """
        # 使用新的 authenticate_user 方法
        user = await self.authenticate_user(email, password)

        # Create tokens
        access_token = create_access_token({"sub": user.id})
        refresh_token = create_refresh_token({"sub": user.id})

        return {
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "display_name": user.display_name,
                "faction_alignment": user.faction_alignment,
                "karma_score": user.karma_score,
                "is_verified": user.is_verified
            },
            "access_token": access_token,
            "refresh_token": refresh_token
        }

    async def refresh_access_token(self, refresh_token: str) -> Dict[str, str]:
        """Refresh access token using refresh token"""
        payload = verify_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise InvalidTokenError("Invalid refresh token")

        user_id = payload.get("sub")
        user = await self.user_service.get_user_by_id(user_id)

        # Create new tokens
        access_token = create_access_token({"sub": user.id})
        new_refresh_token = create_refresh_token({"sub": user.id})

        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token
        }

    async def logout_user(self, access_token: str) -> bool:
        """Logout user and invalidate token"""
        # In a real implementation, this would add the token to a blacklist
        return True

    async def is_token_valid(self, access_token: str) -> bool:
        """Check if access token is valid"""
        payload = verify_token(access_token)
        return payload is not None

    async def generate_verification_token(self, user_id: str) -> str:
        """Generate email verification token"""
        return create_verification_token(user_id)

    async def verify_user_email(self, verification_token: str) -> bool:
        """Verify user email using verification token"""
        payload = verify_token(verification_token)
        if not payload or payload.get("type") != "email_verification":
            return False

        user_id = payload.get("sub")
        user = await self.user_service.get_user_by_id(user_id)
        user.is_verified = True
        await self.db.commit()
        return True

    async def request_password_reset(self, email: str) -> str:
        """Request password reset token"""
        user = await self.user_service.get_user_by_email(email)
        if not user:
            # Don't reveal if email exists or not
            return create_password_reset_token(email)

        return create_password_reset_token(email)

    async def reset_password(self, reset_token: str, new_password: str) -> bool:
        """Reset user password using reset token"""
        payload = verify_token(reset_token)
        if not payload or payload.get("type") != "password_reset":
            return False

        email = payload.get("sub")
        user = await self.user_service.get_user_by_email(email)
        if not user:
            return False

        user.password_hash = get_password_hash(new_password)
        user.failed_login_attempts = 0  # Reset failed attempts
        user.account_locked_until = None  # Unlock account
        await self.db.commit()
        return True

    async def lock_user_account(self, user_id: str) -> bool:
        """Lock user account"""
        user = await self.user_service.get_user_by_id(user_id)
        user.account_locked_until = datetime.utcnow() + timedelta(hours=24)
        await self.db.commit()
        return True

    async def get_user_by_id(self, user_id: str) -> User:
        """Get user by ID (convenience method)"""
        return await self.user_service.get_user_by_id(user_id)