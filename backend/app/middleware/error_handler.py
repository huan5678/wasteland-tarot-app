"""
錯誤處理系統 - 統一處理 FastAPI 異常
將所有異常轉換為標準化的 JSON 格式，並整合 Fallout 主題錯誤訊息
"""

import logging
import traceback
from datetime import datetime, timezone
from typing import Dict, Any

from fastapi import Request, HTTPException, FastAPI
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import WastelandTarotException, CounterError

logger = logging.getLogger(__name__)

# 敏感欄位清單（不應該出現在錯誤回應中）
SENSITIVE_FIELDS = {
    "password",
    "password_hash",
    "api_key",
    "secret",
    "token",
    "access_token",
    "refresh_token",
    "private_key",
    "credential",
}


def _sanitize_details(details: Dict[str, Any]) -> Dict[str, Any]:
    """
    清理敏感資訊
    將敏感欄位的值替換為 [REDACTED]
    """
    if not details:
        return {}

    sanitized = {}
    for key, value in details.items():
        if key.lower() in SENSITIVE_FIELDS:
            sanitized[key] = "[REDACTED]"
        else:
            sanitized[key] = value

    return sanitized


def _log_error(
    request: Request,
    exc: Exception,
    status_code: int,
    error_code: str,
) -> None:
    """
    記錄錯誤日誌

    - CounterError: CRITICAL 級別（安全警報）
    - 認證失敗: WARNING 級別
    - 其他錯誤: ERROR 級別
    """
    # 取得請求資訊
    client_ip = request.client.host if request.client else "unknown"
    method = request.method
    url = str(request.url)
    user_agent = request.headers.get("user-agent", "unknown")

    log_message = (
        f"[{error_code}] {method} {url} - "
        f"Status: {status_code} - "
        f"Client: {client_ip} - "
        f"User-Agent: {user_agent}"
    )

    # 根據異常類型決定日誌級別
    if isinstance(exc, CounterError):
        # Counter 錯誤是安全警報，使用 CRITICAL
        logger.critical(
            f"🚨 SECURITY ALERT: {log_message}",
            exc_info=True,
            extra={
                "error_code": error_code,
                "client_ip": client_ip,
                "method": method,
                "url": url,
                "user_agent": user_agent,
            },
        )
    elif status_code >= 500:
        # 伺服器錯誤
        logger.error(
            log_message,
            exc_info=True,
            extra={
                "error_code": error_code,
                "traceback": traceback.format_exc(),
            },
        )
    elif status_code == 401 or status_code == 403:
        # 認證/授權失敗
        logger.warning(
            log_message,
            extra={
                "error_code": error_code,
                "client_ip": client_ip,
            },
        )
    else:
        # 其他客戶端錯誤（4xx）
        logger.info(
            log_message,
            extra={
                "error_code": error_code,
            },
        )


async def wasteland_tarot_exception_handler(
    request: Request, exc: WastelandTarotException
) -> JSONResponse:
    """
    處理 WastelandTarotException
    """
    status_code = exc.status_code
    error_code = exc.error_code
    message = exc.message
    details = _sanitize_details(exc.details)

    # 記錄日誌
    _log_error(request, exc, status_code, error_code)

    # 建立統一錯誤回應
    error_response = {
        "success": False,
        "error": {
            "code": error_code,
            "message": message,
            "details": details,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        },
    }

    return JSONResponse(
        status_code=status_code,
        content=error_response,
    )


async def http_exception_handler(
    request: Request, exc: HTTPException
) -> JSONResponse:
    """
    處理標準 HTTPException
    """
    status_code = exc.status_code
    error_code = "HTTP_ERROR"
    message = exc.detail
    details = {}

    # 記錄日誌
    _log_error(request, exc, status_code, error_code)

    # 建立統一錯誤回應
    error_response = {
        "success": False,
        "error": {
            "code": error_code,
            "message": message,
            "details": details,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        },
    }

    return JSONResponse(
        status_code=status_code,
        content=error_response,
    )


async def general_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """
    處理所有未預期的異常
    """
    status_code = 500
    error_code = "INTERNAL_SERVER_ERROR"
    message = "廢土中發生未預期的錯誤，避難所工程師正在修復"
    details = {}

    # 記錄日誌
    _log_error(request, exc, status_code, error_code)

    # 建立統一錯誤回應
    error_response = {
        "success": False,
        "error": {
            "code": error_code,
            "message": message,
            "details": details,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        },
    }

    return JSONResponse(
        status_code=status_code,
        content=error_response,
    )


def register_error_handlers(app: FastAPI) -> None:
    """
    註冊所有錯誤處理器到 FastAPI 應用程式
    """
    app.add_exception_handler(WastelandTarotException, wasteland_tarot_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)


# Fallout 風格錯誤訊息映射（可選擇性使用）
FALLOUT_ERROR_MESSAGES = {
    "BROWSER_NOT_SUPPORTED": "偵測到過時的 Pip-Boy 韌體，請升級至最新版本以支援生物辨識技術",
    "NETWORK_ERROR": "輻射干擾導致通訊中斷，請稍後重試",
    "TIMEOUT_ERROR": "避難所伺服器忙碌中，請稍後再試",
    "HTTPS_REQUIRED": "避難科技安全協議要求加密連線（HTTPS）",
    "USER_CANCELLED": "避難所居民取消了操作",
}


def get_fallout_error_message(error_code: str) -> str:
    """
    取得 Fallout 風格錯誤訊息
    如果沒有對應的 Fallout 訊息，回傳原始錯誤碼
    """
    return FALLOUT_ERROR_MESSAGES.get(error_code, error_code)
