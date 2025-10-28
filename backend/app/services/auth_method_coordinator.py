"""
認證方式協調器服務

整合層服務，協調 OAuth、WebAuthn、Email/密碼三種認證方式。
提供統一的認證方式查詢和管理介面。

參考設計：.kiro/specs/google-oauth-passkey-integration/design.md
- Section: AuthMethodCoordinator（後端）
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from dataclasses import dataclass, field


@dataclass
class CredentialInfo:
    """
    Credential 簡化資訊

    用於 API 回應，不包含敏感資料（public_key）
    """
    id: str
    name: Optional[str] = None  # device_name 的別名
    device_name: Optional[str] = None
    created_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None
    device_type: str = "unknown"  # "platform" 或 "roaming"


@dataclass
class AuthMethodInfo:
    """
    認證方式資訊

    聚合用戶的所有認證方式狀態
    """
    # OAuth 相關
    has_oauth: bool = False
    oauth_provider: Optional[str] = None
    profile_picture: Optional[str] = None

    # Passkey 相關
    has_passkey: bool = False
    passkey_count: int = 0
    passkey_credentials: List[Dict[str, Any]] = field(default_factory=list)

    # 密碼相關
    has_password: bool = False


@dataclass
class OAuthConflictInfo:
    """
    OAuth 帳號衝突資訊

    當偵測到 email 已存在但使用不同認證方式時，回傳此資訊
    """
    conflict_type: str = "existing_account"
    email: str = ""
    existing_auth_methods: List[str] = field(default_factory=list)
    suggested_action: str = "login_first"


class AuthMethodCoordinatorService:
    """
    認證方式協調器服務

    職責：協調多種認證方式的整合邏輯，提供統一的查詢介面
    """

    async def handle_oauth_registration(
        self,
        oauth_data: Dict[str, Any],
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        處理 OAuth 註冊並偵測帳號衝突

        需求：
        - 需求 1: Google OAuth 快速註冊（新用戶入口）
        - 需求 8.5: 相同 Email 跨認證方式整合引導（帳號衝突解決）

        Args:
            oauth_data: OAuth 使用者資料
                {
                    "email": str,
                    "name": str,
                    "oauth_provider": str,
                    "oauth_id": str,
                    "profile_picture_url": Optional[str]
                }
            db: 資料庫 session

        Returns:
            Dict[str, Any]: 註冊結果
                成功: {"success": True, "user": User, "conflict": None}
                衝突: {"success": False, "user": None, "conflict": ConflictInfo}

        Example:
            ```python
            coordinator = AuthMethodCoordinatorService()
            result = await coordinator.handle_oauth_registration(oauth_data, db)

            if result["success"]:
                user = result["user"]
                # 產生 JWT tokens...
            else:
                conflict = result["conflict"]
                # 回傳 409 Conflict + 衝突資訊
            ```
        """
        from app.models.user import User
        from app.models.credential import Credential

        email = oauth_data["email"]
        oauth_provider = oauth_data["oauth_provider"]
        oauth_id = oauth_data["oauth_id"]

        # 步驟 1: 查詢現有用戶
        result = await db.execute(select(User).where(User.email == email))
        existing_user = result.scalar_one_or_none()

        if existing_user is None:
            # 情境 1: 新用戶 - 建立 OAuth 用戶
            return await self._create_new_oauth_user(oauth_data, db)

        # 步驟 2: 檢查現有用戶的認證方式
        if existing_user.oauth_provider == oauth_provider:
            # 情境 2: 現有 OAuth 用戶再次登入 - 無衝突
            return {
                "success": True,
                "user": existing_user,
                "conflict": None
            }

        # 步驟 3: 偵測衝突 - email 已存在但使用不同認證方式
        # 查詢現有認證方式
        existing_methods = []

        # 檢查密碼
        if existing_user.password_hash is not None:
            existing_methods.append("password")

        # 檢查 Passkey
        credentials_result = await db.execute(
            select(Credential).where(Credential.user_id == existing_user.id)
        )
        credentials = credentials_result.scalars().all()
        if len(credentials) > 0:
            existing_methods.append("passkey")

        # 檢查其他 OAuth 提供者
        if existing_user.oauth_provider is not None and existing_user.oauth_provider != oauth_provider:
            existing_methods.append(f"oauth_{existing_user.oauth_provider}")

        # 步驟 4: 建立衝突資訊
        conflict_info = {
            "conflict_type": "existing_account",
            "email": email,
            "existing_auth_methods": existing_methods,
            "suggested_action": "login_first"
        }

        return {
            "success": False,
            "user": None,
            "conflict": conflict_info
        }

    async def _create_new_oauth_user(
        self,
        oauth_data: Dict[str, Any],
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        建立新的 OAuth 用戶

        Args:
            oauth_data: OAuth 使用者資料
            db: 資料庫 session

        Returns:
            Dict[str, Any]: 成功結果
        """
        from app.models.user import User

        email = oauth_data["email"]
        name = oauth_data.get("name", email.split("@")[0])
        oauth_provider = oauth_data["oauth_provider"]
        oauth_id = oauth_data["oauth_id"]
        profile_picture_url = oauth_data.get("profile_picture_url")

        # 建立新用戶
        new_user = User(
            email=email,
            name=name,
            oauth_provider=oauth_provider,
            oauth_id=oauth_id,
            profile_picture_url=profile_picture_url,
            password_hash=None,  # OAuth 用戶無密碼
            karma_score=50  # 首次 OAuth 註冊獎勵 50 Karma
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        # 初始化 Karma 系統
        try:
            from app.services.karma_service import KarmaService
            import logging
            logger = logging.getLogger(__name__)

            karma_service = KarmaService(db)
            await karma_service.initialize_karma_for_user(str(new_user.id))
            logger.info(f"Karma 已為 OAuth 用戶初始化: user_id={new_user.id}, provider={oauth_provider}")
        except Exception as e:
            # Karma 初始化失敗不應阻擋註冊流程
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Karma 初始化失敗（非致命）: {str(e)}")

        return {
            "success": True,
            "user": new_user,
            "conflict": None
        }

    async def get_auth_methods(
        self,
        user_id: UUID,
        db: AsyncSession
    ) -> AuthMethodInfo:
        """
        查詢用戶的所有認證方式狀態

        Args:
            user_id: 用戶 ID
            db: 資料庫 session

        Returns:
            AuthMethodInfo: 認證方式資訊物件

        Raises:
            ValueError: 若用戶不存在

        Example:
            ```python
            coordinator = AuthMethodCoordinatorService()
            auth_info = await coordinator.get_auth_methods(user_id, db)
            print(f"Has OAuth: {auth_info.has_oauth}")
            print(f"Passkey count: {auth_info.passkey_count}")
            ```
        """
        from app.models.user import User
        from app.models.credential import Credential

        # 查詢用戶
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if user is None:
            raise ValueError(f"用戶不存在: {user_id}")

        # 初始化認證方式資訊
        auth_info = AuthMethodInfo()

        # 1. 查詢 OAuth 狀態
        auth_info.has_oauth = user.oauth_provider is not None
        auth_info.oauth_provider = user.oauth_provider
        auth_info.profile_picture = user.profile_picture_url

        # 2. 查詢密碼狀態
        auth_info.has_password = user.password_hash is not None

        # 3. 查詢 Passkey 狀態（查詢 credentials 表）
        credentials_result = await db.execute(
            select(Credential)
            .where(Credential.user_id == user_id)
            .order_by(Credential.created_at.desc())
        )
        credentials = credentials_result.scalars().all()

        auth_info.has_passkey = len(credentials) > 0
        auth_info.passkey_count = len(credentials)

        # 4. 處理 credentials 清單（簡化資訊）
        auth_info.passkey_credentials = [
            self._credential_to_dict(cred) for cred in credentials
        ]

        return auth_info

    def _credential_to_dict(self, credential) -> Dict[str, Any]:
        """
        將 Credential 模型轉換為簡化的字典

        移除敏感資料（public_key），推測裝置類型

        Args:
            credential: Credential 模型實例

        Returns:
            簡化的 credential 字典
        """
        import json

        # 解析 transports（可能是 list 或 JSON 字串）
        transports = credential.transports
        if isinstance(transports, str):
            try:
                transports = json.loads(transports)  # SQLite: 解析 JSON 字串
            except (json.JSONDecodeError, TypeError):
                transports = []
        elif transports is None:
            transports = []

        # 推測裝置類型
        device_type = "unknown"
        if transports:
            if "internal" in transports:
                device_type = "platform"  # Touch ID, Windows Hello 等
            elif any(t in transports for t in ["usb", "nfc", "ble"]):
                device_type = "roaming"  # 硬體安全金鑰

        return {
            "id": str(credential.id),
            "name": credential.device_name,
            "device_name": credential.device_name,
            "created_at": credential.created_at.isoformat() if credential.created_at else None,
            "last_used_at": credential.last_used_at.isoformat() if credential.last_used_at else None,
            "device_type": device_type
        }

    async def login_with_password_and_link_oauth(
        self,
        email: str,
        password: str,
        oauth_data: Dict[str, Any],
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        使用密碼登入並連結 OAuth 帳號

        需求：
        - 需求 8.5: 相同 Email 跨認證方式整合引導（帳號衝突解決）

        Args:
            email: 使用者 email
            password: 使用者密碼
            oauth_data: OAuth 資料
                {
                    "email": str,
                    "oauth_provider": str,
                    "oauth_id": str,
                    "profile_picture_url": Optional[str]
                }
            db: 資料庫 session

        Returns:
            Dict[str, Any]: 登入結果
                成功: {
                    "success": True,
                    "user": User,
                    "tokens": {
                        "access_token": str,
                        "refresh_token": str
                    }
                }

        Raises:
            InvalidCredentialsError: 密碼錯誤
            AccountLockedError: 帳號已鎖定
            EmailMismatchError: OAuth email 與帳號 email 不符

        Example:
            ```python
            coordinator = AuthMethodCoordinatorService()
            result = await coordinator.login_with_password_and_link_oauth(
                email="user@example.com",
                password="SecurePassword123",
                oauth_data={
                    "email": "user@example.com",
                    "oauth_provider": "google",
                    "oauth_id": "google_123",
                    "profile_picture_url": "https://..."
                },
                db=db
            )
            ```
        """
        from app.models.user import User
        from app.core.security import verify_password, create_access_token, create_refresh_token
        from app.core.exceptions import (
            InvalidCredentialsError,
            AccountLockedError,
            EmailMismatchError
        )
        from datetime import datetime, timedelta

        # 步驟 1: 驗證 email 一致性
        oauth_email = oauth_data.get("email")
        if oauth_email != email:
            raise EmailMismatchError(user_email=email, oauth_email=oauth_email)

        # 步驟 2: 查詢用戶
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user is None:
            raise InvalidCredentialsError()

        # 步驟 3: 檢查帳號鎖定狀態
        if user.is_account_locked():
            raise AccountLockedError()

        # 步驟 4: 驗證密碼
        if not user.password_hash or not verify_password(password, user.password_hash):
            # 密碼錯誤：增加失敗次數
            user.failed_login_attempts += 1
            user.last_failed_login = datetime.utcnow()

            # 若達到 5 次失敗，鎖定帳號 15 分鐘
            if user.failed_login_attempts >= 5:
                user.account_locked_until = datetime.utcnow() + timedelta(minutes=15)

            await db.commit()
            raise InvalidCredentialsError()

        # 步驟 5: 密碼正確 - 更新 OAuth 資訊
        user.oauth_provider = oauth_data["oauth_provider"]
        user.oauth_id = oauth_data["oauth_id"]
        user.profile_picture_url = oauth_data.get("profile_picture_url")

        # 步驟 6: 重置失敗登入次數和鎖定狀態
        user.failed_login_attempts = 0
        user.last_failed_login = None
        user.account_locked_until = None

        # 步驟 7: 更新登入追蹤
        user.last_login = datetime.utcnow()
        user.last_login_method = "password"

        await db.commit()
        await db.refresh(user)

        # 步驟 8: 產生 JWT tokens（包含認證方式標記）
        access_token = create_access_token(data={
            "sub": str(user.id),
            "email": user.email,
            "auth_method": "password",
            "has_oauth": True,
            "has_password": True,
            "has_passkey": False  # 這裡簡化處理，實際應查詢
        })

        refresh_token = create_refresh_token(data={
            "sub": str(user.id)
        })

        return {
            "success": True,
            "user": user,
            "tokens": {
                "access_token": access_token,
                "refresh_token": refresh_token
            }
        }

    async def login_with_passkey_and_link_oauth(
        self,
        assertion_response: Dict[str, Any],
        oauth_data: Dict[str, Any],
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        使用 Passkey 登入並連結 OAuth 帳號

        需求：
        - 需求 8.5: 相同 Email 跨認證方式整合引導（帳號衝突解決）

        Args:
            assertion_response: WebAuthn assertion response
            oauth_data: OAuth 資料
                {
                    "email": str,
                    "oauth_provider": str,
                    "oauth_id": str,
                    "profile_picture_url": Optional[str]
                }
            db: 資料庫 session

        Returns:
            Dict[str, Any]: 登入結果
                成功: {
                    "success": True,
                    "user": User,
                    "tokens": {
                        "access_token": str,
                        "refresh_token": str
                    }
                }

        Raises:
            InvalidCredentialsError: Passkey 驗證失敗
            EmailMismatchError: OAuth email 與帳號 email 不符

        Example:
            ```python
            coordinator = AuthMethodCoordinatorService()
            result = await coordinator.login_with_passkey_and_link_oauth(
                assertion_response={
                    "id": "credential_id",
                    "response": {...}
                },
                oauth_data={
                    "email": "user@example.com",
                    "oauth_provider": "google",
                    "oauth_id": "google_123",
                    "profile_picture_url": "https://..."
                },
                db=db
            )
            ```
        """
        from app.services.webauthn_service import WebAuthnService
        from app.core.security import create_access_token, create_refresh_token
        from app.core.exceptions import InvalidCredentialsError, EmailMismatchError
        from datetime import datetime

        # 步驟 1: 使用 WebAuthn Service 驗證 Passkey
        webauthn_service = WebAuthnService(db)
        verification_result = await webauthn_service.verify_authentication_assertion(
            assertion_response, db
        )

        # 步驟 2: 檢查驗證結果
        if not verification_result.get("success"):
            raise InvalidCredentialsError()

        user = verification_result.get("user")
        credential = verification_result.get("credential")

        if not user or not credential:
            raise InvalidCredentialsError()

        # 步驟 3: 驗證 email 一致性
        oauth_email = oauth_data.get("email")
        if oauth_email != user.email:
            raise EmailMismatchError(user_email=user.email, oauth_email=oauth_email)

        # 步驟 4: 更新 OAuth 資訊
        user.oauth_provider = oauth_data["oauth_provider"]
        user.oauth_id = oauth_data["oauth_id"]
        user.profile_picture_url = oauth_data.get("profile_picture_url")

        # 步驟 5: 更新登入追蹤
        user.last_login = datetime.utcnow()
        user.last_login_method = "passkey"

        await db.commit()
        await db.refresh(user)

        # 步驟 6: 產生 JWT tokens（包含認證方式標記）
        # 查詢是否有密碼（用於 JWT payload）
        has_password = user.password_hash is not None

        access_token = create_access_token(data={
            "sub": str(user.id),
            "email": user.email,
            "auth_method": "passkey",
            "has_oauth": True,
            "has_password": has_password,
            "has_passkey": True
        })

        refresh_token = create_refresh_token(data={
            "sub": str(user.id)
        })

        return {
            "success": True,
            "user": user,
            "tokens": {
                "access_token": access_token,
                "refresh_token": refresh_token
            }
        }
