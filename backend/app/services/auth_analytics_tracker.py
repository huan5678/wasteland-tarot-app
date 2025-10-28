"""
認證分析事件追蹤器

為認證相關事件提供統一的追蹤介面，整合 UserAnalyticsService
"""

from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.user_analytics_service import UserAnalyticsService
import logging

logger = logging.getLogger(__name__)


class AuthAnalyticsTracker:
    """
    認證分析事件追蹤器

    職責：封裝認證相關事件的追蹤邏輯，提供統一介面
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.analytics_service = UserAnalyticsService(db)

    async def track_oauth_registration_success(
        self,
        user_id: str,
        provider: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        追蹤 OAuth 註冊成功事件

        需求 9: 監控與分析 - OAuth 註冊成功事件記錄
        """
        try:
            event_data = {
                "provider": provider,
                **(metadata or {})
            }

            await self.analytics_service.track_event(
                user_id=user_id,
                event_type="oauth_registration_success",
                event_category="authentication",
                event_action="register",
                event_data=event_data
            )

            logger.info(
                f"[事件追蹤] OAuth 註冊成功: user_id={user_id}, provider={provider}"
            )

        except Exception as e:
            # 事件追蹤失敗不應影響主流程
            logger.warning(f"OAuth 註冊事件追蹤失敗: {str(e)}")

    async def track_oauth_login_success(
        self,
        user_id: str,
        provider: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        追蹤 OAuth 登入成功事件

        需求 9: 監控與分析 - OAuth 登入成功事件記錄
        """
        try:
            event_data = {
                "provider": provider,
                **(metadata or {})
            }

            await self.analytics_service.track_event(
                user_id=user_id,
                event_type="oauth_login_success",
                event_category="authentication",
                event_action="login",
                event_data=event_data
            )

            logger.info(
                f"[事件追蹤] OAuth 登入成功: user_id={user_id}, provider={provider}"
            )

        except Exception as e:
            logger.warning(f"OAuth 登入事件追蹤失敗: {str(e)}")

    async def track_oauth_conflict_detected(
        self,
        email: str,
        existing_methods: list,
        oauth_provider: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        追蹤帳號衝突偵測事件

        需求 9: 監控與分析 - 帳號衝突偵測事件記錄
        """
        try:
            event_data = {
                "email": email,
                "existing_methods": existing_methods,
                "oauth_provider": oauth_provider,
                **(metadata or {})
            }

            # Note: user_id 在衝突情況下使用現有用戶的 ID（從 email 查詢）
            # 如果無法取得用戶 ID，則使用 "unknown"
            await self.analytics_service.track_event(
                user_id="system",  # 系統級事件
                event_type="oauth_account_conflict_detected",
                event_category="authentication",
                event_action="conflict_detected",
                event_data=event_data
            )

            logger.info(
                f"[事件追蹤] 帳號衝突偵測: email={email}, existing_methods={existing_methods}"
            )

        except Exception as e:
            logger.warning(f"帳號衝突事件追蹤失敗: {str(e)}")

    async def track_oauth_account_linked(
        self,
        user_id: str,
        oauth_provider: str,
        source: str,  # "password", "passkey", "conflict_resolution"
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        追蹤 OAuth 連結至現有帳號事件

        需求 9: 監控與分析 - OAuth 連結至現有帳號事件記錄
        """
        try:
            event_data = {
                "oauth_provider": oauth_provider,
                "source": source,
                **(metadata or {})
            }

            await self.analytics_service.track_event(
                user_id=user_id,
                event_type="oauth_linked_to_existing_account",
                event_category="authentication",
                event_action="link_oauth",
                event_data=event_data
            )

            logger.info(
                f"[事件追蹤] OAuth 連結成功: user_id={user_id}, provider={oauth_provider}, source={source}"
            )

        except Exception as e:
            logger.warning(f"OAuth 連結事件追蹤失敗: {str(e)}")

    async def track_oauth_conflict_resolved(
        self,
        user_id: str,
        resolution_method: str,  # "password", "passkey", "oauth"
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        追蹤帳號衝突解決成功事件

        需求 9: 監控與分析 - 帳號衝突解決成功事件記錄
        """
        try:
            event_data = {
                "resolution_method": resolution_method,
                **(metadata or {})
            }

            await self.analytics_service.track_event(
                user_id=user_id,
                event_type="oauth_conflict_resolved_success",
                event_category="authentication",
                event_action="resolve_conflict",
                event_data=event_data
            )

            logger.info(
                f"[事件追蹤] 帳號衝突解決成功: user_id={user_id}, method={resolution_method}"
            )

        except Exception as e:
            logger.warning(f"帳號衝突解決事件追蹤失敗: {str(e)}")

    async def track_auth_method_removed(
        self,
        user_id: str,
        method_type: str,  # "oauth", "passkey", "password"
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        追蹤認證方式移除事件

        需求 9: 監控與分析 - 認證方式移除事件記錄
        """
        try:
            event_data = {
                "method_type": method_type,
                **(metadata or {})
            }

            await self.analytics_service.track_event(
                user_id=user_id,
                event_type="auth_method_removed",
                event_category="authentication",
                event_action="remove_method",
                event_data=event_data
            )

            logger.info(
                f"[事件追蹤] 認證方式移除: user_id={user_id}, method={method_type}"
            )

        except Exception as e:
            logger.warning(f"認證方式移除事件追蹤失敗: {str(e)}")

    async def track_passkey_upgrade_prompt_accepted(
        self,
        user_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        追蹤 Passkey 升級引導接受事件

        需求 9: 監控與分析 - Passkey 升級引導接受事件記錄
        """
        try:
            event_data = metadata or {}

            await self.analytics_service.track_event(
                user_id=user_id,
                event_type="passkey_upgrade_prompt_accepted",
                event_category="authentication",
                event_action="accept_upgrade",
                event_data=event_data
            )

            logger.info(
                f"[事件追蹤] Passkey 升級引導接受: user_id={user_id}"
            )

        except Exception as e:
            logger.warning(f"Passkey 升級接受事件追蹤失敗: {str(e)}")

    async def track_passkey_upgrade_prompt_skipped(
        self,
        user_id: str,
        skip_count: int,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        追蹤 Passkey 升級引導跳過事件

        需求 9: 監控與分析 - Passkey 升級引導跳過事件記錄
        """
        try:
            event_data = {
                "skip_count": skip_count,
                **(metadata or {})
            }

            await self.analytics_service.track_event(
                user_id=user_id,
                event_type="passkey_upgrade_prompt_skipped",
                event_category="authentication",
                event_action="skip_upgrade",
                event_data=event_data
            )

            logger.info(
                f"[事件追蹤] Passkey 升級引導跳過: user_id={user_id}, skip_count={skip_count}"
            )

        except Exception as e:
            logger.warning(f"Passkey 升級跳過事件追蹤失敗: {str(e)}")

    async def track_passkey_upgrade_completed(
        self,
        user_id: str,
        source: str,  # "oauth_prompt", "settings_manual"
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        追蹤 Passkey 升級完成事件

        需求 9: 監控與分析 - Passkey 升級完成事件記錄
        """
        try:
            event_data = {
                "source": source,
                **(metadata or {})
            }

            await self.analytics_service.track_event(
                user_id=user_id,
                event_type="passkey_upgrade_completed",
                event_category="authentication",
                event_action="complete_upgrade",
                event_data=event_data
            )

            logger.info(
                f"[事件追蹤] Passkey 升級完成: user_id={user_id}, source={source}"
            )

        except Exception as e:
            logger.warning(f"Passkey 升級完成事件追蹤失敗: {str(e)}")
