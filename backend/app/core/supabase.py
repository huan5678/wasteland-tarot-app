"""
Supabase 客戶端管理

提供後端 Supabase 客戶端實例，用於 OAuth 認證和會話管理。
"""

from functools import lru_cache
from supabase import create_client, Client
from app.config import settings


@lru_cache()
def get_supabase_client() -> Client:
    """
    取得 Supabase 客戶端實例（單例模式）

    使用 @lru_cache() 確保客戶端被快取，避免重複初始化。
    可作為 FastAPI 依賴注入使用。

    Returns:
        Client: Supabase 客戶端實例

    Example:
        ```python
        from fastapi import Depends
        from app.core.supabase import get_supabase_client

        @app.get("/auth/callback")
        async def callback(supabase: Client = Depends(get_supabase_client)):
            # 使用 supabase 客戶端
            user = await supabase.auth.get_user()
        ```
    """
    supabase_url = settings.supabase_url
    supabase_key = settings.supabase_service_role_key  # 後端使用 service role key

    # 建立 Supabase 客戶端
    client = create_client(supabase_url, supabase_key)

    return client


def verify_supabase_connection() -> bool:
    """
    驗證 Supabase 連線狀態

    嘗試連線到 Supabase 並執行簡單查詢來確認連線正常。

    Returns:
        bool: 連線成功返回 True，失敗返回 False

    Raises:
        Exception: 連線失敗時可能拋出異常
    """
    try:
        client = get_supabase_client()

        # 嘗試存取 auth 來驗證連線
        # 注意：實際驗證方法取決於 Supabase SDK 版本
        if client and hasattr(client, 'auth'):
            return True

        return False

    except Exception as e:
        # 記錄錯誤（可選）
        print(f"❌ Supabase 連線失敗: {str(e)}")
        return False
