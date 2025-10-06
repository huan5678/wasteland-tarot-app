"""
CSRF Protection Middleware
防止跨站請求偽造攻擊
"""

import secrets
from typing import Optional
from fastapi import Request, HTTPException, status
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.datastructures import MutableHeaders


class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """
    CSRF token 驗證中介層
    保護 POST/PUT/DELETE/PATCH 請求
    """

    def __init__(self, app, exclude_paths: Optional[list[str]] = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or [
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/oauth/callback",  # OAuth 回調使用 state 參數驗證
            "/docs",
            "/redoc",
            "/openapi.json",
        ]

    async def dispatch(self, request: Request, call_next):
        # 排除的路徑不需要 CSRF 驗證
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)

        # 只驗證狀態改變的請求
        if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
            # 從 cookie 取得 CSRF token
            csrf_token_cookie = request.cookies.get("csrf_token")

            # 從 header 取得 CSRF token
            csrf_token_header = request.headers.get("X-CSRF-Token")

            # 驗證 token 存在且相符
            if not csrf_token_cookie or not csrf_token_header:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CSRF token missing"
                )

            if csrf_token_cookie != csrf_token_header:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CSRF token invalid"
                )

        # 執行請求
        response = await call_next(request)

        # 為 GET 請求設定新的 CSRF token（如果不存在）
        if request.method == "GET" and not request.cookies.get("csrf_token"):
            csrf_token = generate_csrf_token()
            response.set_cookie(
                key="csrf_token",
                value=csrf_token,
                httponly=False,  # JavaScript 需要讀取以設定 header
                secure=True,  # 僅 HTTPS
                samesite="lax",
                max_age=86400,  # 24 hours
            )

        return response


def generate_csrf_token() -> str:
    """
    生成 CSRF token
    使用 secrets 模組確保安全性
    """
    return secrets.token_urlsafe(32)


def verify_oauth_state(state_cookie: str, state_param: str) -> bool:
    """
    驗證 OAuth state 參數
    防止 CSRF 攻擊
    """
    if not state_cookie or not state_param:
        return False
    return secrets.compare_digest(state_cookie, state_param)
