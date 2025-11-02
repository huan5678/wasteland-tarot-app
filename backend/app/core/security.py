"""
Security utilities for Wasteland Tarot API
Password hashing, JWT tokens, and authentication helpers
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import time
from passlib.context import CryptContext
from jose import JWTError, jwt
from app.config import settings

# Password hashing - Configure bcrypt to avoid version warnings
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__default_rounds=12
)


def get_password_hash(password: str) -> str:
    """Hash a password for storage"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)

    to_encode.update({
        "exp": expire,
        "iat": get_current_timestamp(),
        "type": "access"
    })
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """Create a JWT refresh token (longer expiry)"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({
        "exp": expire,
        "iat": get_current_timestamp(),
        "type": "refresh"
    })
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode a JWT token"""
    if not token:
        return None

    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except (JWTError, AttributeError, ValueError):
        return None


def create_verification_token(user_id: str) -> str:
    """Create an email verification token"""
    data = {"sub": user_id, "type": "email_verification"}
    expire = datetime.utcnow() + timedelta(hours=24)  # 24 hours for verification
    data.update({
        "exp": expire,
        "iat": get_current_timestamp()
    })
    return jwt.encode(data, settings.secret_key, algorithm=settings.algorithm)


def create_password_reset_token(email: str) -> str:
    """Create a password reset token"""
    data = {"sub": email, "type": "password_reset"}
    expire = datetime.utcnow() + timedelta(hours=2)  # 2 hours for password reset
    data.update({
        "exp": expire,
        "iat": get_current_timestamp()
    })
    return jwt.encode(data, settings.secret_key, algorithm=settings.algorithm)


def get_current_timestamp() -> int:
    """Get current timestamp as integer"""
    return int(time.time())


def get_access_token_cookie_settings() -> Dict[str, Any]:
    """
    Get cookie settings for access token
    httpOnly, secure, sameSite for CSRF protection

    Note: Do NOT set 'domain' for localhost - browsers handle it automatically
    Setting Domain=localhost can cause cookies to be rejected in modern browsers
    """
    cookie_settings = {
        "key": "access_token",
        "httponly": True,
        "secure": settings.environment == "production",  # HTTPS only in production
        "samesite": "lax",  # CSRF protection
        "max_age": settings.access_token_expire_minutes * 60,  # 7 days in seconds (10080 minutes * 60)
        "path": "/",  # CRITICAL: Ensure cookie is sent for all paths
    }

    return cookie_settings


def get_refresh_token_cookie_settings() -> Dict[str, Any]:
    """
    Get cookie settings for refresh token
    Longer expiry (30 days)

    Note: Do NOT set 'domain' for localhost - browsers handle it automatically
    Setting Domain=localhost can cause cookies to be rejected in modern browsers
    """
    cookie_settings = {
        "key": "refresh_token",
        "httponly": True,
        "secure": settings.environment == "production",
        "samesite": "lax",
        "max_age": settings.refresh_token_expire_days * 24 * 60 * 60,  # 30 days in seconds
        "path": "/",  # CRITICAL: Ensure cookie is sent for all paths
    }

    return cookie_settings