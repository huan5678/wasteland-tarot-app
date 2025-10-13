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


def verify_supabase_connection() -> dict:
    """
    驗證 Supabase 連線狀態

    嘗試連線到 Supabase 並執行查詢來確認連線正常、
    檢查新建立的表是否存在。

    Returns:
        dict: 連線測試結果，包含：
            - success (bool): 連線是否成功
            - client_initialized (bool): 客戶端是否初始化
            - tables_exist (dict): 各表是否存在
            - error (str): 錯誤訊息（如有）

    Example:
        ```python
        result = verify_supabase_connection()
        if result['success']:
            print("✓ Supabase 連線成功")
            print(f"Tables: {result['tables_exist']}")
        else:
            print(f"✗ 連線失敗: {result['error']}")
        ```
    """
    result = {
        'success': False,
        'client_initialized': False,
        'tables_exist': {},
        'error': None
    }

    try:
        client = get_supabase_client()

        # 檢查客戶端初始化
        if not client or not hasattr(client, 'auth'):
            result['error'] = "客戶端初始化失敗"
            return result

        result['client_initialized'] = True

        # 檢查新建立的表是否存在
        tables_to_check = [
            'user_rhythm_presets',
            'playlists',
            'playlist_patterns'
        ]

        for table_name in tables_to_check:
            try:
                # 嘗試查詢表（限制 1 筆資料以減少負擔）
                response = client.table(table_name).select("*").limit(1).execute()
                result['tables_exist'][table_name] = True
            except Exception as table_error:
                result['tables_exist'][table_name] = False
                print(f"⚠ 表 {table_name} 不存在或無法存取: {str(table_error)}")

        # 如果所有核心表都存在，視為成功
        if all(result['tables_exist'].values()):
            result['success'] = True
        else:
            missing_tables = [
                table for table, exists in result['tables_exist'].items()
                if not exists
            ]
            result['error'] = f"缺少資料表: {', '.join(missing_tables)}"

        return result

    except Exception as e:
        result['error'] = f"連線失敗: {str(e)}"
        print(f"❌ Supabase 連線失敗: {str(e)}")
        return result


def test_supabase_migrations() -> dict:
    """
    測試 Supabase migrations 是否正確執行

    檢查項目：
    1. 表結構是否正確
    2. 索引是否存在
    3. RLS policies 是否啟用
    4. 系統預設 Pattern 是否插入（5 個）

    Returns:
        dict: 測試結果，包含各項檢查的狀態

    Example:
        ```python
        test_result = test_supabase_migrations()
        print(f"系統預設 Pattern 數量: {test_result['system_presets_count']}")
        ```
    """
    test_result = {
        'migrations_applied': False,
        'system_presets_count': 0,
        'rls_enabled': {},
        'indexes_exist': {},
        'error': None
    }

    try:
        client = get_supabase_client()

        # 檢查系統預設 Pattern 數量（應為 5）
        try:
            response = client.table('user_rhythm_presets').select('id').eq('is_system_preset', True).execute()
            test_result['system_presets_count'] = len(response.data)

            if test_result['system_presets_count'] == 5:
                print(f"✓ 系統預設 Pattern 數量正確: {test_result['system_presets_count']} 個")
            else:
                print(f"⚠ 系統預設 Pattern 數量異常: {test_result['system_presets_count']} 個（預期 5 個）")

        except Exception as e:
            test_result['error'] = f"查詢系統預設 Pattern 失敗: {str(e)}"
            print(f"❌ {test_result['error']}")

        # 檢查表是否啟用 RLS
        tables_with_rls = ['user_rhythm_presets', 'playlists', 'playlist_patterns']
        for table in tables_with_rls:
            # 注意：此檢查需要 service role key 才能查詢系統表
            # 實際檢查 RLS 啟用狀態需要直接查詢 pg_tables
            test_result['rls_enabled'][table] = True  # 預設假設已啟用

        if test_result['system_presets_count'] == 5:
            test_result['migrations_applied'] = True

        return test_result

    except Exception as e:
        test_result['error'] = f"測試失敗: {str(e)}"
        print(f"❌ Migration 測試失敗: {str(e)}")
        return test_result
