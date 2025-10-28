"""
單元測試：認證相關分析事件追蹤

測試需求：
- 測試 OAuth 註冊成功事件記錄
- 測試 OAuth 登入成功事件記錄
- 測試 Passkey 升級引導接受/跳過事件記錄
- 測試 Passkey 升級完成事件記錄（包含 source）
- 測試 OAuth 連結至現有帳號事件記錄
- 測試帳號衝突偵測事件記錄
- 測試帳號衝突解決成功/放棄事件記錄
- 測試認證方式移除事件記錄

Requirements: 需求 9
"""

import pytest
from datetime import datetime
from unittest.mock import AsyncMock, Mock, patch
from uuid import uuid4

from app.services.user_analytics_service import UserAnalyticsService


@pytest.mark.asyncio
class TestAuthAnalyticsTracking:
    """認證相關分析事件追蹤測試"""

    @pytest.fixture
    def analytics_service(self, db_session):
        """建立 analytics service fixture"""
        return UserAnalyticsService(db_session)

    @pytest.fixture
    def user_id(self):
        """建立測試用戶 ID"""
        return str(uuid4())

    async def test_track_oauth_registration_success(self, analytics_service, user_id):
        """測試 OAuth 註冊成功事件記錄"""
        # Arrange
        provider = "google"

        # Act
        event = analytics_service.track_event(
            user_id=user_id,
            event_type="oauth_registration_success",
            event_category="auth",
            event_action="register",
            event_data={
                "provider": provider,
                "timestamp": datetime.utcnow().isoformat(),
                "description": "使用者透過 Google 成功註冊"
            }
        )

        # Assert
        assert event is not None
        assert event.user_id == user_id
        assert event.event_type == "oauth_registration_success"
        assert event.event_category == "auth"
        assert event.event_action == "register"
        assert event.event_data["provider"] == provider
        assert "timestamp" in event.event_data

    async def test_track_oauth_login_success(self, analytics_service, user_id):
        """測試 OAuth 登入成功事件記錄"""
        # Arrange
        provider = "google"

        # Act
        event = analytics_service.track_event(
            user_id=user_id,
            event_type="oauth_login_success",
            event_category="auth",
            event_action="login",
            event_data={
                "provider": provider,
                "has_passkey": False
            }
        )

        # Assert
        assert event is not None
        assert event.event_type == "oauth_login_success"
        assert event.event_data["provider"] == provider
        assert event.event_data["has_passkey"] is False

    async def test_track_passkey_upgrade_prompt_accepted(self, analytics_service, user_id):
        """測試 Passkey 升級引導接受事件記錄"""
        # Act
        event = analytics_service.track_event(
            user_id=user_id,
            event_type="passkey_upgrade_prompt_accepted",
            event_category="auth",
            event_action="accept_prompt",
            event_data={
                "source": "oauth_prompt",
                "prompt_count": 1
            }
        )

        # Assert
        assert event is not None
        assert event.event_type == "passkey_upgrade_prompt_accepted"
        assert event.event_data["source"] == "oauth_prompt"
        assert event.event_data["prompt_count"] == 1

    async def test_track_passkey_upgrade_prompt_skipped(self, analytics_service, user_id):
        """測試 Passkey 升級引導跳過事件記錄"""
        # Arrange
        skip_count = 2

        # Act
        event = analytics_service.track_event(
            user_id=user_id,
            event_type="passkey_upgrade_prompt_skipped",
            event_category="auth",
            event_action="skip_prompt",
            event_data={
                "skip_count": skip_count,
                "source": "oauth_prompt"
            }
        )

        # Assert
        assert event is not None
        assert event.event_type == "passkey_upgrade_prompt_skipped"
        assert event.event_data["skip_count"] == skip_count
        assert event.event_data["source"] == "oauth_prompt"

    async def test_track_passkey_upgrade_completed_from_oauth_prompt(
        self, analytics_service, user_id
    ):
        """測試 Passkey 升級完成事件記錄（來自 OAuth 提示）"""
        # Act
        event = analytics_service.track_event(
            user_id=user_id,
            event_type="passkey_upgrade_completed",
            event_category="auth",
            event_action="upgrade_complete",
            event_data={
                "source": "oauth_prompt",
                "credential_id": "test_credential_123"
            }
        )

        # Assert
        assert event is not None
        assert event.event_type == "passkey_upgrade_completed"
        assert event.event_data["source"] == "oauth_prompt"
        assert "credential_id" in event.event_data

    async def test_track_passkey_upgrade_completed_from_settings(
        self, analytics_service, user_id
    ):
        """測試 Passkey 升級完成事件記錄（來自設定頁面）"""
        # Act
        event = analytics_service.track_event(
            user_id=user_id,
            event_type="passkey_upgrade_completed",
            event_category="auth",
            event_action="upgrade_complete",
            event_data={
                "source": "settings_manual",
                "credential_id": "test_credential_456"
            }
        )

        # Assert
        assert event is not None
        assert event.event_data["source"] == "settings_manual"

    async def test_track_oauth_linked_to_existing_account(
        self, analytics_service, user_id
    ):
        """測試 OAuth 連結至現有帳號事件記錄"""
        # Arrange
        provider = "google"
        existing_methods = ["password"]

        # Act
        event = analytics_service.track_event(
            user_id=user_id,
            event_type="oauth_linked_to_existing_account",
            event_category="auth",
            event_action="link_oauth",
            event_data={
                "provider": provider,
                "existing_auth_methods": existing_methods,
                "link_method": "password_login"
            }
        )

        # Assert
        assert event is not None
        assert event.event_type == "oauth_linked_to_existing_account"
        assert event.event_data["provider"] == provider
        assert event.event_data["existing_auth_methods"] == existing_methods
        assert event.event_data["link_method"] == "password_login"

    async def test_track_oauth_account_conflict_detected(
        self, analytics_service, user_id
    ):
        """測試帳號衝突偵測事件記錄"""
        # Arrange
        email = "test@example.com"
        existing_methods = ["password", "passkey"]

        # Act
        event = analytics_service.track_event(
            user_id=user_id,
            event_type="oauth_account_conflict_detected",
            event_category="auth",
            event_action="detect_conflict",
            event_data={
                "conflict_email": email,
                "existing_methods": existing_methods,
                "oauth_provider": "google"
            }
        )

        # Assert
        assert event is not None
        assert event.event_type == "oauth_account_conflict_detected"
        assert event.event_data["conflict_email"] == email
        assert event.event_data["existing_methods"] == existing_methods
        assert event.event_data["oauth_provider"] == "google"

    async def test_track_oauth_conflict_resolved_success_password(
        self, analytics_service, user_id
    ):
        """測試帳號衝突解決成功事件記錄（密碼登入）"""
        # Act
        event = analytics_service.track_event(
            user_id=user_id,
            event_type="oauth_conflict_resolved_success",
            event_category="auth",
            event_action="resolve_conflict",
            event_data={
                "resolution_method": "password",
                "oauth_provider": "google"
            }
        )

        # Assert
        assert event is not None
        assert event.event_type == "oauth_conflict_resolved_success"
        assert event.event_data["resolution_method"] == "password"

    async def test_track_oauth_conflict_resolved_success_passkey(
        self, analytics_service, user_id
    ):
        """測試帳號衝突解決成功事件記錄（Passkey 登入）"""
        # Act
        event = analytics_service.track_event(
            user_id=user_id,
            event_type="oauth_conflict_resolved_success",
            event_category="auth",
            event_action="resolve_conflict",
            event_data={
                "resolution_method": "passkey",
                "oauth_provider": "google",
                "credential_id": "test_credential_789"
            }
        )

        # Assert
        assert event is not None
        assert event.event_data["resolution_method"] == "passkey"
        assert "credential_id" in event.event_data

    async def test_track_oauth_conflict_resolution_abandoned(
        self, analytics_service, user_id
    ):
        """測試帳號衝突解決放棄事件記錄"""
        # Act
        event = analytics_service.track_event(
            user_id=user_id,
            event_type="oauth_conflict_resolution_abandoned",
            event_category="auth",
            event_action="abandon_conflict",
            event_data={
                "oauth_provider": "google",
                "existing_methods": ["password"]
            }
        )

        # Assert
        assert event is not None
        assert event.event_type == "oauth_conflict_resolution_abandoned"
        assert event.event_data["oauth_provider"] == "google"

    async def test_track_auth_method_removed(self, analytics_service, user_id):
        """測試認證方式移除事件記錄"""
        # Arrange
        method_type = "oauth"
        provider = "google"
        remaining_methods = ["password", "passkey"]

        # Act
        event = analytics_service.track_event(
            user_id=user_id,
            event_type="auth_method_removed",
            event_category="auth",
            event_action="remove_method",
            event_data={
                "method_type": method_type,
                "provider": provider,
                "remaining_auth_methods": remaining_methods
            }
        )

        # Assert
        assert event is not None
        assert event.event_type == "auth_method_removed"
        assert event.event_data["method_type"] == method_type
        assert event.event_data["provider"] == provider
        assert event.event_data["remaining_auth_methods"] == remaining_methods

    async def test_track_event_with_繁體中文_description(
        self, analytics_service, user_id
    ):
        """測試事件記錄使用繁體中文描述"""
        # Act
        event = analytics_service.track_event(
            user_id=user_id,
            event_type="oauth_registration_success",
            event_category="auth",
            event_action="register",
            event_data={
                "provider": "google",
                "description": "使用者透過 Google 成功註冊"
            }
        )

        # Assert
        assert event is not None
        assert "description" in event.event_data
        # 驗證繁體中文可以正確儲存
        assert "使用者" in event.event_data["description"]
        assert "成功註冊" in event.event_data["description"]
