"""
廢土塔羅 API 自定義例外類別，整合 FastAPI 錯誤處理
"""

from typing import Any, Optional, Dict
from fastapi import HTTPException, status


class WastelandTarotException(HTTPException):
    """
    廢土塔羅 API 基礎例外類別，提供 Fallout 主題的錯誤處理
    """

    def __init__(
        self,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        message: str = "廢土中發生錯誤",
        error_code: str = "UNKNOWN_ERROR",
        details: Optional[Dict[str, Any]] = None,
    ):
        self.status_code = status_code
        self.message = message
        self.error_code = error_code
        self.details = details or {}

        # 呼叫父類別並傳遞錯誤訊息
        super().__init__(status_code=status_code, detail=message)


class CardNotFoundError(WastelandTarotException):
    """當指定卡牌在廢土牌組中找不到時拋出"""

    def __init__(self, card_id: str = None):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            message=f"在廢土牌組中找不到 ID 為 '{card_id}' 的卡牌" if card_id else "在廢土牌組中找不到該卡牌",
            error_code="CARD_NOT_FOUND",
            details={"card_id": card_id} if card_id else {}
        )


class ReadingNotFoundError(WastelandTarotException):
    """當占卜記錄找不到時拋出"""

    def __init__(self, reading_id: str = None):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            message=f"占卜記錄 '{reading_id}' 在廢土中遺失" if reading_id else "找不到占卜記錄",
            error_code="READING_NOT_FOUND",
            details={"reading_id": reading_id} if reading_id else {}
        )


class SpreadNotFoundError(WastelandTarotException):
    """當牌陣模板找不到時拋出"""

    def __init__(self, spread_id: str = None):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            message=f"避難所資料庫中找不到牌陣模板 '{spread_id}'" if spread_id else "找不到牌陣模板",
            error_code="SPREAD_NOT_FOUND",
            details={"spread_id": spread_id} if spread_id else {}
        )


class UserNotFoundError(WastelandTarotException):
    """當使用者找不到時拋出"""

    def __init__(self, user_id: str = None):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            message=f"避難所記錄中找不到居民 '{user_id}'" if user_id else "避難所記錄中找不到使用者",
            error_code="USER_NOT_FOUND",
            details={"user_id": user_id} if user_id else {}
        )


class InvalidCredentialsError(WastelandTarotException):
    """當登入憑證無效時拋出"""

    def __init__(self, message: str = None):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message=message or "偵測到無效的登入憑證。避難科技安全協議已啟動",
            error_code="INVALID_CREDENTIALS"
        )


class OAuthUserCannotLoginError(WastelandTarotException):
    """當 OAuth 使用者嘗試使用電子郵件/密碼登入時拋出"""

    def __init__(self, provider: str = "OAuth"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=f"此帳號已綁定 {provider} 登入，請使用 {provider} 登入",
            error_code="OAUTH_USER_LOGIN_ERROR",
            details={"oauth_provider": provider}
        )


# OAuth 相關例外

class OAuthAuthorizationError(WastelandTarotException):
    """當 OAuth 授權失敗時拋出"""

    def __init__(self, provider: str = "OAuth", reason: str = None):
        message = f"{provider} 登入授權失敗"
        if reason:
            message = f"{provider} 登入授權失敗：{reason}"
        else:
            message = f"{provider} 登入失敗，請稍後再試"

        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message=message,
            error_code="OAUTH_AUTHORIZATION_ERROR",
            details={"oauth_provider": provider, "reason": reason} if reason else {"oauth_provider": provider}
        )


class OAuthCallbackError(WastelandTarotException):
    """當 OAuth 回調處理失敗時拋出"""

    def __init__(self, provider: str = "OAuth", reason: str = None):
        message = f"{provider} 回調處理失敗"
        if reason:
            message = f"{provider} 回調處理失敗：{reason}"
        else:
            message = f"{provider} 登入處理失敗，請重新嘗試"

        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=message,
            error_code="OAUTH_CALLBACK_ERROR",
            details={"oauth_provider": provider, "reason": reason} if reason else {"oauth_provider": provider}
        )


class OAuthUserCreationError(WastelandTarotException):
    """當 OAuth 使用者建立或更新失敗時拋出"""

    def __init__(self, provider: str = "OAuth", reason: str = None):
        message = f"使用 {provider} 建立帳號失敗"
        if reason:
            message = f"使用 {provider} 建立帳號失敗：{reason}"
        else:
            message = f"帳號建立失敗，請稍後再試"

        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=message,
            error_code="OAUTH_USER_CREATION_ERROR",
            details={"oauth_provider": provider, "reason": reason} if reason else {"oauth_provider": provider}
        )


class EmailMismatchError(WastelandTarotException):
    """當 OAuth email 與當前帳號 email 不一致時拋出"""

    def __init__(self, user_email: str = None, oauth_email: str = None):
        message = "Google 帳號的 email 與您的帳號不符"
        if user_email and oauth_email:
            message = f"Google 帳號 ({oauth_email}) 與您的帳號 ({user_email}) 不符"

        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=message,
            error_code="EMAIL_MISMATCH_ERROR",
            details={"user_email": user_email, "oauth_email": oauth_email} if user_email and oauth_email else {}
        )


class OAuthStateValidationError(WastelandTarotException):
    """當 OAuth 狀態參數驗證失敗時拋出（CSRF 防護）"""

    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            message="OAuth 狀態驗證失敗，可能的 CSRF 攻擊",
            error_code="OAUTH_STATE_VALIDATION_ERROR"
        )


class SupabaseConnectionError(WastelandTarotException):
    """當 Supabase 連線失敗時拋出"""

    def __init__(self, operation: str = None):
        message = "Supabase 連線失敗，請稍後再試"
        if operation:
            message = f"Supabase {operation} 操作失敗"

        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            message=message,
            error_code="SUPABASE_CONNECTION_ERROR",
            details={"operation": operation} if operation else {}
        )


class UserAlreadyExistsError(WastelandTarotException):
    """當嘗試建立已存在的使用者時拋出"""

    def __init__(self, identifier: str = None):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            message=f"避難所居民 '{identifier}' 已註冊" if identifier else "使用者已存在於避難所資料庫",
            error_code="USER_ALREADY_EXISTS",
            details={"identifier": identifier} if identifier else {}
        )


class AccountLockedError(WastelandTarotException):
    """當帳號因登入失敗次數過多而被鎖定時拋出"""

    def __init__(self, lockout_duration: int = None):
        super().__init__(
            status_code=status.HTTP_423_LOCKED,
            message=f"因安全威脅，帳號已鎖定 {lockout_duration} 分鐘" if lockout_duration else "因多次登入失敗，帳號已被鎖定",
            error_code="ACCOUNT_LOCKED",
            details={"lockout_duration_minutes": lockout_duration} if lockout_duration else {}
        )


class AccountInactiveError(WastelandTarotException):
    """當嘗試使用已停用帳號登入時拋出"""

    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            message="避難所居民帳號已停用。請聯絡監督者重新啟用",
            error_code="ACCOUNT_INACTIVE"
        )


class InsufficientPermissionsError(WastelandTarotException):
    """當使用者缺少必要權限時拋出"""

    def __init__(self, required_permission: str = None):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            message=f"權限等級不足。需要：{required_permission}" if required_permission else "此操作的權限不足",
            error_code="INSUFFICIENT_PERMISSIONS",
            details={"required_permission": required_permission} if required_permission else {}
        )


class InvalidTokenError(WastelandTarotException):
    """當權杖無效或過期時拋出"""

    def __init__(self, reason: str = "expired"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message=f"存取權杖 {reason}。請重新驗證避難科技安全系統",
            error_code="INVALID_TOKEN",
            details={"reason": reason}
        )


class ReadingLimitExceededError(WastelandTarotException):
    """當使用者超過每日占卜次數限制時拋出"""

    def __init__(self, current_count: int = None, max_allowed: int = None):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            message=f"已達每日占卜次數上限（{current_count}/{max_allowed}）。卡牌需要休息，避難所居民" if current_count and max_allowed else "已超過每日占卜次數限制",
            error_code="READING_LIMIT_EXCEEDED",
            details={"current_count": current_count, "max_allowed": max_allowed} if current_count and max_allowed else {}
        )


class RadiationOverloadError(WastelandTarotException):
    """當輻射等級過高無法安全操作時拋出"""

    def __init__(self, radiation_level: float = None):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            message=f"輻射等級過高（{radiation_level:.2f}）。使用輻射消除劑後再試" if radiation_level else "偵測到輻射超載。系統暫時無法使用",
            error_code="RADIATION_OVERLOAD",
            details={"radiation_level": radiation_level} if radiation_level else {}
        )


class InvalidSpreadConfigurationError(WastelandTarotException):
    """當牌陣配置無效時拋出"""

    def __init__(self, issue: str = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            message=f"牌陣配置無效：{issue}" if issue else "牌陣配置無效",
            error_code="INVALID_SPREAD_CONFIGURATION",
            details={"issue": issue} if issue else {}
        )


class DatabaseConnectionError(WastelandTarotException):
    """當資料庫連線失敗時拋出"""

    def __init__(self):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            message="避難所資料庫連線中斷。廢土中的技術困難",
            error_code="DATABASE_CONNECTION_ERROR"
        )


class ExternalServiceError(WastelandTarotException):
    """當外部服務（如 Supabase）失敗時拋出"""

    def __init__(self, service_name: str = "external service"):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            message=f"{service_name} 暫時無法使用。請稍後再試",
            error_code="EXTERNAL_SERVICE_ERROR",
            details={"service_name": service_name}
        )


class ConflictError(WastelandTarotException):
    """當偵測到資源衝突時拋出（例如並行修改）"""

    def __init__(self, message: str = "偵測到資源衝突"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            message=message,
            error_code="CONFLICT_ERROR"
        )


class InvalidRequestError(WastelandTarotException):
    """當請求無效或格式錯誤時拋出"""

    def __init__(self, message: str = "無效的請求"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=message,
            error_code="INVALID_REQUEST"
        )


# 賓果遊戲例外

class CardAlreadyExistsError(WastelandTarotException):
    """當使用者嘗試建立賓果卡但本月已有賓果卡時拋出"""

    def __init__(self, message: str = None):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            message=message or "本月已設定賓果卡，無法重新設定",
            error_code="CARD_ALREADY_EXISTS"
        )


class NoCardFoundError(WastelandTarotException):
    """當找不到使用者的賓果卡時拋出"""

    def __init__(self, user_id: str = None, month: str = None):
        message = "尚未設定本月賓果卡"
        if month:
            message = f"{month} 賓果卡未找到"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            message=message,
            error_code="NO_CARD_FOUND",
            details={"user_id": user_id, "month": month} if user_id or month else {}
        )


class InvalidCardNumbersError(WastelandTarotException):
    """當賓果卡號碼無效時拋出"""

    def __init__(self, message: str = None, details: Dict[str, Any] = None):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=message or "賓果卡號碼不符合規則：必須包含 1-25 所有數字且不重複",
            error_code="INVALID_CARD_NUMBERS",
            details=details or {}
        )


class AlreadyClaimedError(WastelandTarotException):
    """當使用者嘗試領取今日已領取過的號碼時拋出"""

    def __init__(self, date_str: str = None):
        message = "今日已領取號碼"
        if date_str:
            message = f"{date_str} 的號碼已領取"
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            message=message,
            error_code="ALREADY_CLAIMED",
            details={"date": date_str} if date_str else {}
        )


class PastDateClaimError(WastelandTarotException):
    """當使用者嘗試領取過期日期的號碼時拋出"""

    def __init__(self, date_str: str = None):
        message = "無法領取過期日期的號碼"
        if date_str:
            message = f"無法領取 {date_str} 的號碼（已過期）"
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=message,
            error_code="PAST_DATE_CLAIM",
            details={"date": date_str} if date_str else {}
        )


class NoDailyNumberError(WastelandTarotException):
    """當每日號碼尚未產生時拋出"""

    def __init__(self, date_str: str = None):
        message = "今日號碼尚未產生"
        if date_str:
            message = f"{date_str} 的號碼尚未產生"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            message=message,
            error_code="NO_DAILY_NUMBER",
            details={"date": date_str} if date_str else {}
        )


# WebAuthn/Passkeys 例外（Fallout 主題錯誤訊息）

class WebAuthnRegistrationError(WastelandTarotException):
    """當 Passkey 註冊失敗時拋出"""

    def __init__(self, message: str = "生物辨識註冊失敗，請確認 Pip-Boy 功能正常"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=message,
            error_code="WEBAUTHN_REGISTRATION_ERROR"
        )


class WebAuthnAuthenticationError(WastelandTarotException):
    """當 Passkey 認證失敗時拋出"""

    def __init__(self, message: str = "生物辨識驗證失敗，請重新掃描 Pip-Boy"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message=message,
            error_code="WEBAUTHN_AUTHENTICATION_ERROR"
        )


class CredentialNotFoundError(WastelandTarotException):
    """當找不到憑證時拋出"""

    def __init__(self, message: str = "避難所資料庫中找不到此生物辨識記錄"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            message=message,
            error_code="CREDENTIAL_NOT_FOUND"
        )


class InvalidChallengeError(WastelandTarotException):
    """當 Challenge 驗證失敗時拋出"""

    def __init__(self, message: str = "安全驗證碼已過期，避難科技安全協議要求重新驗證"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=message,
            error_code="INVALID_CHALLENGE"
        )


class CounterError(WastelandTarotException):
    """當偵測到計數器回歸時拋出（可能是重放攻擊）"""

    def __init__(self, message: str = "偵測到異常的時間扭曲（可能的複製裝置攻擊），Pip-Boy 安全鎖啟動"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            message=message,
            error_code="COUNTER_ERROR"
        )


class MaxCredentialsReachedError(WastelandTarotException):
    """當使用者達到 Passkey 數量上限時拋出"""

    def __init__(self, current_count: int = 10, max_allowed: int = 10):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            message=f"已達到 Passkey 數量上限（{current_count}/{max_allowed}）。請先刪除不使用的 Pip-Boy 生物辨識記錄",
            error_code="MAX_CREDENTIALS_REACHED",
            details={"current_count": current_count, "max_allowed": max_allowed}
        )


# Token Extension 例外

class TokenExtensionError(WastelandTarotException):
    """當 Token 延長操作失敗時拋出"""

    def __init__(self, message: str = "Token 延長失敗"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=message,
            error_code="TOKEN_EXTENSION_ERROR"
        )


class MaxLifetimeExceededError(WastelandTarotException):
    """當 Token 已達最大生命週期（7天）時拋出"""

    def __init__(self, message: str = None):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            message=message or "Token 已達最大生命週期（7天），請重新登入",
            error_code="MAX_LIFETIME_EXCEEDED"
        )


class RateLimitExceededError(WastelandTarotException):
    """當 Token 延長次數超過速率限制時拋出"""

    def __init__(self, message: str = None, limit: int = 10, period: str = "24小時"):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            message=message or f"Token 延長次數已達上限（{period}內最多 {limit} 次）",
            error_code="RATE_LIMIT_EXCEEDED",
            details={"limit": limit, "period": period}
        )