"""
WebAuthn Service Module

Handles WebAuthn/FIDO2 Passkey registration and authentication logic.
This service is completely independent from OAuth and Email authentication.

Reference: docs/passkeys-architecture.md Section 5.1
"""

import os
import secrets
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime

from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
    options_to_json,
)
from webauthn.helpers.structs import (
    PublicKeyCredentialDescriptor,
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
    ResidentKeyRequirement,
    AuthenticatorAttachment,
    AttestationConveyancePreference,
    PublicKeyCredentialCreationOptions,
    PublicKeyCredentialRequestOptions,
)
from webauthn.helpers.cose import COSEAlgorithmIdentifier
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.user import User
from app.models.credential import Credential
from app.core.webauthn import get_webauthn_config
from app.core.exceptions import (
    WebAuthnRegistrationError,
    WebAuthnAuthenticationError,
    CredentialNotFoundError,
    InvalidChallengeError,
    CounterError,
    UserAlreadyExistsError,
    MaxCredentialsReachedError,
)


class WebAuthnService:
    """
    WebAuthn Service

    Provides methods for:
    - Passkey registration (create new credentials)
    - Passkey authentication (verify credentials)
    - Credential management (list, update, delete)
    """

    def __init__(self, db: Session):
        """
        Initialize WebAuthn service.

        Args:
            db: Database session
        """
        self.db = db
        self.config = get_webauthn_config()

    # ==================== Registration Methods ====================

    def generate_registration_options(
        self,
        user: User,
        device_name: Optional[str] = None
    ) -> PublicKeyCredentialCreationOptions:
        """
        Generate WebAuthn registration options for creating a new Passkey.

        Args:
            user: User object
            device_name: Optional device name (e.g., "MacBook Touch ID")

        Returns:
            PublicKeyCredentialCreationOptions: Registration options to send to client

        Raises:
            WebAuthnRegistrationError: If registration options cannot be generated

        Example:
            ```python
            options = service.generate_registration_options(user)
            return {"options": options_to_json(options)}
            ```
        """
        try:
            # Get existing credentials for this user
            existing_credentials = self._get_user_credentials(user.id)

            # Convert to PublicKeyCredentialDescriptor list
            exclude_credentials = [
                PublicKeyCredentialDescriptor(
                    id=bytes.fromhex(cred.credential_id),
                    transports=cred.transports or [],
                )
                for cred in existing_credentials
            ]

            # Generate user handle if not exists
            if not user.webauthn_user_handle:
                user.webauthn_user_handle = secrets.token_bytes(64)
                self.db.commit()

            # Create authenticator selection criteria
            authenticator_selection = AuthenticatorSelectionCriteria(
                authenticator_attachment=self._get_authenticator_attachment(),
                resident_key=self._get_resident_key_requirement(),
                user_verification=self._get_user_verification(),
            )

            # Generate registration options
            options = generate_registration_options(
                rp_id=self.config.rp_id,
                rp_name=self.config.rp_name,
                user_id=user.webauthn_user_handle,
                user_name=user.email,
                user_display_name=user.name or user.email,
                exclude_credentials=exclude_credentials,
                authenticator_selection=authenticator_selection,
                attestation=self._get_attestation_preference(),
                supported_pub_key_algs=self._get_supported_algorithms(),
                timeout=self.config.timeout_ms,
            )

            return options

        except Exception as e:
            raise WebAuthnRegistrationError(
                f"無法生成 Passkey 註冊選項: {str(e)}"
            ) from e

    def verify_registration_response(
        self,
        user: User,
        credential_id: str,
        client_data_json: str,
        attestation_object: str,
        device_name: Optional[str] = None,
        expected_challenge: bytes = None,
    ) -> Credential:
        """
        Verify WebAuthn registration response and create credential.

        Args:
            user: User object
            credential_id: Credential ID from client
            client_data_json: Client data JSON from client
            attestation_object: Attestation object from client
            device_name: Optional device name
            expected_challenge: Expected challenge value

        Returns:
            Credential: Created credential object

        Raises:
            WebAuthnRegistrationError: If verification fails
            InvalidChallengeError: If challenge is invalid

        Example:
            ```python
            credential = service.verify_registration_response(
                user=user,
                credential_id=response.credential_id,
                client_data_json=response.client_data_json,
                attestation_object=response.attestation_object,
                device_name="MacBook Touch ID",
                expected_challenge=stored_challenge
            )
            ```
        """
        try:
            # Verify the registration response
            verification = verify_registration_response(
                credential=attestation_object,
                expected_challenge=expected_challenge,
                expected_origin=self.config.origin,
                expected_rp_id=self.config.rp_id,
            )

            # Check if credential already exists (防止重複註冊)
            existing = self.db.execute(
                select(Credential).where(Credential.credential_id == credential_id)
            ).scalar_one_or_none()

            if existing:
                raise WebAuthnRegistrationError(
                    "此 Passkey 已經註冊過了"
                )

            # Create new credential
            credential = Credential(
                user_id=user.id,
                credential_id=credential_id,
                public_key=verification.credential_public_key.hex(),
                counter=verification.sign_count,
                transports=verification.credential_device_type,
                device_name=device_name or "未命名裝置",
                aaguid=verification.aaguid,
                backup_eligible=verification.credential_backed_up,
                backup_state=verification.credential_backed_up,
            )

            self.db.add(credential)
            self.db.commit()
            self.db.refresh(credential)

            return credential

        except WebAuthnRegistrationError:
            raise
        except Exception as e:
            self.db.rollback()
            raise WebAuthnRegistrationError(
                f"Passkey 註冊驗證失敗: {str(e)}"
            ) from e

    # ==================== Authentication Methods ====================

    def generate_authentication_options(
        self,
        user: Optional[User] = None
    ) -> PublicKeyCredentialRequestOptions:
        """
        Generate WebAuthn authentication options for Passkey login.

        Args:
            user: Optional user object (for email-guided login)
                  If None, generates options for usernameless login

        Returns:
            PublicKeyCredentialRequestOptions: Authentication options

        Raises:
            WebAuthnAuthenticationError: If options cannot be generated
            CredentialNotFoundError: If user has no credentials

        Example:
            ```python
            # Email-guided login
            options = service.generate_authentication_options(user)

            # Usernameless login
            options = service.generate_authentication_options()
            ```
        """
        try:
            allow_credentials = []

            if user:
                # Email-guided login: restrict to user's credentials
                credentials = self._get_user_credentials(user.id)

                if not credentials:
                    raise CredentialNotFoundError(
                        "此使用者尚未註冊任何 Passkey"
                    )

                allow_credentials = [
                    PublicKeyCredentialDescriptor(
                        id=bytes.fromhex(cred.credential_id),
                        transports=cred.transports or [],
                    )
                    for cred in credentials
                ]

            # Generate authentication options
            options = generate_authentication_options(
                rp_id=self.config.rp_id,
                allow_credentials=allow_credentials if allow_credentials else None,
                user_verification=self._get_user_verification(),
                timeout=self.config.timeout_ms,
            )

            return options

        except CredentialNotFoundError:
            raise
        except Exception as e:
            raise WebAuthnAuthenticationError(
                f"無法生成 Passkey 認證選項: {str(e)}"
            ) from e

    def verify_authentication_response(
        self,
        credential_id: str,
        client_data_json: str,
        authenticator_data: str,
        signature: str,
        expected_challenge: bytes,
    ) -> tuple[User, Credential]:
        """
        Verify WebAuthn authentication response.

        Args:
            credential_id: Credential ID from client
            client_data_json: Client data JSON from client
            authenticator_data: Authenticator data from client
            signature: Signature from client
            expected_challenge: Expected challenge value

        Returns:
            tuple[User, Credential]: Authenticated user and credential

        Raises:
            WebAuthnAuthenticationError: If verification fails
            CredentialNotFoundError: If credential not found
            CounterError: If counter regression detected (replay attack)
            InvalidChallengeError: If challenge is invalid

        Example:
            ```python
            user, credential = service.verify_authentication_response(
                credential_id=response.credential_id,
                client_data_json=response.client_data_json,
                authenticator_data=response.authenticator_data,
                signature=response.signature,
                expected_challenge=stored_challenge
            )
            ```
        """
        try:
            # Find credential
            credential = self.db.execute(
                select(Credential).where(Credential.credential_id == credential_id)
            ).scalar_one_or_none()

            if not credential:
                raise CredentialNotFoundError(
                    "找不到對應的 Passkey"
                )

            # Verify authentication response
            verification = verify_authentication_response(
                credential=authenticator_data,
                expected_challenge=expected_challenge,
                expected_origin=self.config.origin,
                expected_rp_id=self.config.rp_id,
                credential_public_key=bytes.fromhex(credential.public_key),
                credential_current_sign_count=credential.counter,
            )

            # Check counter (防止重放攻擊)
            new_counter = verification.new_sign_count
            try:
                credential.increment_counter(new_counter)
            except ValueError as e:
                # Counter regression detected!
                raise CounterError(str(e)) from e

            # Update last used timestamp
            credential.update_last_used()

            # Get associated user
            user = self.db.execute(
                select(User).where(User.id == credential.user_id)
            ).scalar_one()

            self.db.commit()

            return user, credential

        except (CredentialNotFoundError, CounterError):
            raise
        except Exception as e:
            self.db.rollback()
            raise WebAuthnAuthenticationError(
                f"Passkey 認證驗證失敗: {str(e)}"
            ) from e

    # ==================== Credential Management Methods ====================

    def list_user_credentials(self, user_id: UUID) -> List[Credential]:
        """
        List all credentials for a user.

        Args:
            user_id: User UUID

        Returns:
            List[Credential]: List of credentials

        Example:
            ```python
            credentials = service.list_user_credentials(user.id)
            for cred in credentials:
                print(f"{cred.device_name}: {cred.created_at}")
            ```
        """
        return self._get_user_credentials(user_id)

    def update_credential_name(
        self,
        credential_id: UUID,
        user_id: UUID,
        new_name: str
    ) -> Credential:
        """
        Update credential device name.

        Args:
            credential_id: Credential UUID
            user_id: User UUID (for authorization)
            new_name: New device name

        Returns:
            Credential: Updated credential

        Raises:
            CredentialNotFoundError: If credential not found or not owned by user

        Example:
            ```python
            credential = service.update_credential_name(
                credential_id=cred_id,
                user_id=user.id,
                new_name="MacBook Pro M1"
            )
            ```
        """
        credential = self.db.execute(
            select(Credential).where(
                Credential.id == credential_id,
                Credential.user_id == user_id
            )
        ).scalar_one_or_none()

        if not credential:
            raise CredentialNotFoundError(
                "找不到對應的 Passkey 或無權限操作"
            )

        credential.device_name = new_name
        self.db.commit()
        self.db.refresh(credential)

        return credential

    def delete_credential(
        self,
        credential_id: UUID,
        user_id: UUID
    ) -> None:
        """
        Delete a credential.

        Args:
            credential_id: Credential UUID
            user_id: User UUID (for authorization)

        Raises:
            CredentialNotFoundError: If credential not found or not owned by user
            WebAuthnRegistrationError: If trying to delete last authentication method

        Example:
            ```python
            service.delete_credential(
                credential_id=cred_id,
                user_id=user.id
            )
            ```
        """
        credential = self.db.execute(
            select(Credential).where(
                Credential.id == credential_id,
                Credential.user_id == user_id
            )
        ).scalar_one_or_none()

        if not credential:
            raise CredentialNotFoundError(
                "找不到對應的 Passkey 或無權限操作"
            )

        # Check if user has other authentication methods
        user = self.db.execute(
            select(User).where(User.id == user_id)
        ).scalar_one()

        remaining_credentials = len(self._get_user_credentials(user_id)) - 1
        has_password = user.password_hash is not None
        has_oauth = user.oauth_provider is not None

        if remaining_credentials == 0 and not has_password and not has_oauth:
            raise WebAuthnRegistrationError(
                "無法刪除最後一個認證方式，請先設定密碼或綁定其他登入方式"
            )

        self.db.delete(credential)
        self.db.commit()

    # ==================== New User Registration (Passwordless) ====================

    def register_new_user_with_passkey(
        self,
        email: str,
        name: str,
        credential_id: str,
        client_data_json: str,
        attestation_object: str,
        device_name: Optional[str],
        expected_challenge: bytes,
    ) -> tuple[User, Credential]:
        """
        Register a new user with Passkey (passwordless signup).

        This method creates a new user without password and immediately
        registers their first Passkey credential.

        Args:
            email: User email
            name: User display name
            credential_id: Credential ID from client
            client_data_json: Client data JSON from client
            attestation_object: Attestation object from client
            device_name: Optional device name
            expected_challenge: Expected challenge value

        Returns:
            tuple[User, Credential]: Created user and credential

        Raises:
            UserAlreadyExistsError: If email already exists
            WebAuthnRegistrationError: If registration fails

        Example:
            ```python
            user, credential = service.register_new_user_with_passkey(
                email="user@example.com",
                name="John Doe",
                credential_id=response.credential_id,
                client_data_json=response.client_data_json,
                attestation_object=response.attestation_object,
                device_name="MacBook Touch ID",
                expected_challenge=stored_challenge
            )
            ```
        """
        try:
            # 1. Check if email already exists
            existing_user = self.db.execute(
                select(User).where(User.email == email.lower())
            ).scalar_one_or_none()

            if existing_user:
                raise UserAlreadyExistsError(
                    f"此 email 已在避難所註冊，請使用生物辨識登入存取你的 Pip-Boy"
                )

            # 2. Create new user (passwordless)
            user = User(
                email=email.lower(),
                name=name,
                password_hash=None,  # No password
                oauth_provider=None,  # Not OAuth
                is_active=True,
                is_verified=False,  # Email verification can be added later
                webauthn_user_handle=secrets.token_bytes(64),  # Generate user handle
            )

            self.db.add(user)
            self.db.flush()  # Get user.id without committing

            # 3. Verify and create credential
            verification = verify_registration_response(
                credential=attestation_object,
                expected_challenge=expected_challenge,
                expected_origin=self.config.origin,
                expected_rp_id=self.config.rp_id,
            )

            # Check if credential already exists
            existing_cred = self.db.execute(
                select(Credential).where(Credential.credential_id == credential_id)
            ).scalar_one_or_none()

            if existing_cred:
                self.db.rollback()
                raise WebAuthnRegistrationError(
                    "此生物辨識裝置已在避難所系統中註冊，請使用不同的認證器"
                )

            # Create credential
            credential = Credential(
                user_id=user.id,
                credential_id=credential_id,
                public_key=verification.credential_public_key.hex(),
                counter=verification.sign_count,
                transports=verification.credential_device_type,
                device_name=device_name or "未命名裝置",
                aaguid=verification.aaguid,
                backup_eligible=verification.credential_backed_up,
                backup_state=verification.credential_backed_up,
            )

            self.db.add(credential)

            # 4. Initialize Karma (optional, can be done by caller)
            # Note: Karma initialization should be handled by the caller
            # to maintain separation of concerns

            self.db.commit()
            self.db.refresh(user)
            self.db.refresh(credential)

            return user, credential

        except UserAlreadyExistsError:
            self.db.rollback()
            raise
        except WebAuthnRegistrationError:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise WebAuthnRegistrationError(
                f"生物辨識註冊失敗：{str(e)}。請檢查 Pip-Boy 連線狀態"
            ) from e

    def generate_registration_options_for_new_user(
        self,
        email: str,
        name: str,
    ) -> PublicKeyCredentialCreationOptions:
        """
        Generate WebAuthn registration options for new user signup.

        Args:
            email: User email
            name: User display name

        Returns:
            PublicKeyCredentialCreationOptions: Registration options

        Raises:
            UserAlreadyExistsError: If email already exists
            WebAuthnRegistrationError: If options generation fails

        Example:
            ```python
            options = service.generate_registration_options_for_new_user(
                email="user@example.com",
                name="John Doe"
            )
            ```
        """
        try:
            # Check if email already exists
            existing_user = self.db.execute(
                select(User).where(User.email == email.lower())
            ).scalar_one_or_none()

            if existing_user:
                raise UserAlreadyExistsError(
                    f"此 email 已在避難所註冊，請使用生物辨識登入存取你的 Pip-Boy"
                )

            # Generate temporary user handle for registration
            temp_user_handle = secrets.token_bytes(64)

            # Create authenticator selection criteria
            authenticator_selection = AuthenticatorSelectionCriteria(
                authenticator_attachment=self._get_authenticator_attachment(),
                resident_key=self._get_resident_key_requirement(),
                user_verification=self._get_user_verification(),
            )

            # Generate registration options
            options = generate_registration_options(
                rp_id=self.config.rp_id,
                rp_name=self.config.rp_name,
                user_id=temp_user_handle,
                user_name=email,
                user_display_name=name,
                exclude_credentials=[],  # New user has no credentials
                authenticator_selection=authenticator_selection,
                attestation=self._get_attestation_preference(),
                supported_pub_key_algs=self._get_supported_algorithms(),
                timeout=self.config.timeout_ms,
            )

            return options

        except UserAlreadyExistsError:
            raise
        except Exception as e:
            raise WebAuthnRegistrationError(
                f"無法初始化生物辨識系統：{str(e)}。請確認 Pip-Boy 電源充足"
            ) from e

    # ==================== Helper Methods ====================

    def _get_user_credentials(self, user_id: UUID) -> List[Credential]:
        """Get all credentials for a user."""
        return self.db.execute(
            select(Credential)
            .where(Credential.user_id == user_id)
            .order_by(Credential.created_at.desc())
        ).scalars().all()

    def _get_authenticator_attachment(self) -> Optional[AuthenticatorAttachment]:
        """Get authenticator attachment preference from config."""
        attachment = self.config.authenticator_attachment
        if attachment == "platform":
            return AuthenticatorAttachment.PLATFORM
        elif attachment == "cross-platform":
            return AuthenticatorAttachment.CROSS_PLATFORM
        return None

    def _get_user_verification(self) -> UserVerificationRequirement:
        """Get user verification requirement from config."""
        verification = self.config.user_verification
        if verification == "required":
            return UserVerificationRequirement.REQUIRED
        elif verification == "discouraged":
            return UserVerificationRequirement.DISCOURAGED
        return UserVerificationRequirement.PREFERRED

    def _get_resident_key_requirement(self) -> ResidentKeyRequirement:
        """Get resident key requirement from config."""
        resident_key = self.config.resident_key
        if resident_key == "required":
            return ResidentKeyRequirement.REQUIRED
        elif resident_key == "discouraged":
            return ResidentKeyRequirement.DISCOURAGED
        return ResidentKeyRequirement.PREFERRED

    def _get_attestation_preference(self) -> AttestationConveyancePreference:
        """Get attestation conveyance preference from config."""
        attestation = self.config.attestation
        if attestation == "direct":
            return AttestationConveyancePreference.DIRECT
        elif attestation == "indirect":
            return AttestationConveyancePreference.INDIRECT
        elif attestation == "enterprise":
            return AttestationConveyancePreference.ENTERPRISE
        return AttestationConveyancePreference.NONE

    def _get_supported_algorithms(self) -> List[COSEAlgorithmIdentifier]:
        """Get supported COSE algorithm identifiers from config."""
        return [
            COSEAlgorithmIdentifier(alg_id)
            for alg_id in self.config.supported_algorithms
        ]

    # ==================== Credential Management Methods ====================

    def list_user_credentials(self, user_id: UUID) -> List[Credential]:
        """
        List all credentials for a user.

        Args:
            user_id: User ID

        Returns:
            List[Credential]: List of credentials ordered by last_used_at DESC

        Example:
            ```python
            credentials = service.list_user_credentials(user.id)
            for cred in credentials:
                print(f"{cred.device_name} - Last used: {cred.last_used_at}")
            ```
        """
        return self.db.execute(
            select(Credential)
            .where(Credential.user_id == user_id)
            .order_by(Credential.last_used_at.desc())
        ).scalars().all()

    def update_credential_name(
        self,
        credential_id: UUID,
        new_name: str,
        user_id: UUID
    ) -> Credential:
        """
        Update credential device name.

        Args:
            credential_id: Credential ID
            new_name: New device name
            user_id: User ID (for permission check)

        Returns:
            Credential: Updated credential

        Raises:
            CredentialNotFoundError: If credential not found or user doesn't own it

        Example:
            ```python
            updated = service.update_credential_name(
                credential_id=cred_id,
                new_name="MacBook Pro Touch ID",
                user_id=user.id
            )
            ```
        """
        # Query with user_id to prevent unauthorized access
        credential = self.db.execute(
            select(Credential).where(
                Credential.id == credential_id,
                Credential.user_id == user_id
            )
        ).scalar_one_or_none()

        if not credential:
            raise CredentialNotFoundError(
                "找不到對應的 Passkey 或無權限操作"
            )

        credential.device_name = new_name
        self.db.commit()
        self.db.refresh(credential)

        return credential

    def delete_credential(
        self,
        credential_id: UUID,
        user_id: UUID
    ) -> bool:
        """
        Delete a credential.

        Args:
            credential_id: Credential ID
            user_id: User ID (for permission check)

        Returns:
            bool: True if deleted successfully

        Raises:
            CredentialNotFoundError: If credential not found or user doesn't own it

        Example:
            ```python
            result = service.delete_credential(
                credential_id=cred_id,
                user_id=user.id
            )
            ```
        """
        # Query with user_id to prevent unauthorized access
        credential = self.db.execute(
            select(Credential).where(
                Credential.id == credential_id,
                Credential.user_id == user_id
            )
        ).scalar_one_or_none()

        if not credential:
            raise CredentialNotFoundError(
                "找不到對應的 Passkey 或無權限操作"
            )

        self.db.delete(credential)
        self.db.commit()

        return True

    def check_credential_limit(self, user_id: UUID) -> None:
        """
        Check if user has reached the maximum credential limit (10).

        Args:
            user_id: User ID

        Raises:
            MaxCredentialsReachedError: If user has 10 or more credentials

        Example:
            ```python
            service.check_credential_limit(user.id)  # Raises if >= 10
            ```
        """
        credentials = self.list_user_credentials(user_id)

        if len(credentials) >= 10:
            raise MaxCredentialsReachedError(
                current_count=len(credentials),
                max_allowed=10
            )
