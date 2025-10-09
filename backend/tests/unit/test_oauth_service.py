"""
TDD: OAuth 使用者服務測試

遵循 TDD 紅-綠-重構循環：
1. Red: 定義 OAuth 使用者管理的預期行為
2. Green: 實作 backend/app/services/oauth_service.py
3. Refactor: 優化服務邏輯

測試需求來自：.kiro/specs/supabase-oauth-integration/requirements.md
- 需求 3.1: 建立或更新 OAuth 使用者
- 需求 3.2: 處理新使用者建立
- 需求 3.3: 處理現有使用者更新
- 需求 3.5: 處理 Google 未提供 name 的情況
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession


class TestOAuthServiceBehavior:
    """定義 OAuth 使用者服務的預期行為"""

    # ============================================
    # 測試 1: 應該能建立新的 OAuth 使用者
    # ============================================
    @pytest.mark.asyncio
    async def test_should_create_new_oauth_user(self, db_session: AsyncSession):
        """
        需求 3.1, 3.2: 應該能建立新的 Google OAuth 使用者

        預期行為：
        - 接收 email, name, oauth_provider, oauth_id, profile_picture_url
        - 建立新使用者記錄
        - password_hash 應該為 NULL
        - 返回建立的使用者物件
        """
        from app.services.oauth_service import create_or_update_oauth_user

        # 準備測試資料
        email = "newuser@gmail.com"
        name = "New User"
        oauth_provider = "google"
        oauth_id = "google_12345"
        profile_picture = "https://example.com/photo.jpg"

        # ✅ 執行：建立新 OAuth 使用者
        user = await create_or_update_oauth_user(
            db=db_session,
            email=email,
            name=name,
            oauth_provider=oauth_provider,
            oauth_id=oauth_id,
            profile_picture_url=profile_picture
        )

        # ✅ 驗證：使用者已建立
        assert user is not None, "應該返回使用者物件"
        assert user.email == email, "email 應該正確"
        assert user.name == name, "name 應該正確"
        assert user.oauth_provider == oauth_provider, "oauth_provider 應該正確"
        assert user.oauth_id == oauth_id, "oauth_id 應該正確"
        assert user.profile_picture_url == profile_picture, "profile_picture_url 應該正確"
        assert user.password_hash is None, "OAuth 使用者的 password_hash 應該為 NULL"

    # ============================================
    # 測試 2: 應該能更新現有使用者的 OAuth 資料
    # ============================================
    @pytest.mark.asyncio
    async def test_should_update_existing_user_with_oauth_data(self, db_session: AsyncSession):
        """
        需求 3.3: 若使用者存在但無 OAuth 資料，應該更新

        預期行為：
        - 使用者已存在但 oauth_provider 為 NULL
        - 更新 oauth_provider 和 oauth_id
        - 不改變其他欄位
        """
        from app.services.oauth_service import create_or_update_oauth_user
        from app.models.user import User

        # 準備：建立一個沒有 OAuth 資料的使用者
        existing_user = User(
            email="existing@example.com",
            name="Existing User",
            password_hash="some_hash",  # 傳統註冊使用者
            oauth_provider=None,
            oauth_id=None
        )
        db_session.add(existing_user)
        await db_session.commit()
        original_id = existing_user.id

        # ✅ 執行：更新 OAuth 資料
        updated_user = await create_or_update_oauth_user(
            db=db_session,
            email="existing@example.com",
            name="Existing User",
            oauth_provider="google",
            oauth_id="google_67890",
            profile_picture_url="https://example.com/pic.jpg"
        )

        # ✅ 驗證：使用者已更新
        assert updated_user.id == original_id, "應該更新相同使用者，不建立新記錄"
        assert updated_user.oauth_provider == "google", "oauth_provider 應該已更新"
        assert updated_user.oauth_id == "google_67890", "oauth_id 應該已更新"
        assert updated_user.password_hash == "some_hash", "password_hash 不應該改變"

    # ============================================
    # 測試 3: 應該返回已存在的 OAuth 使用者
    # ============================================
    @pytest.mark.asyncio
    async def test_should_return_existing_oauth_user(self, db_session: AsyncSession):
        """
        需求 3.1: 若 OAuth 使用者已存在，應該直接返回

        預期行為：
        - 使用者已有 OAuth 資料
        - 不建立新記錄
        - 返回現有使用者
        """
        from app.services.oauth_service import create_or_update_oauth_user
        from app.models.user import User

        # 準備：建立一個 OAuth 使用者
        oauth_user = User(
            email="oauth@example.com",
            name="OAuth User",
            oauth_provider="google",
            oauth_id="google_existing"
        )
        db_session.add(oauth_user)
        await db_session.commit()
        original_id = oauth_user.id

        # ✅ 執行：嘗試再次建立相同 OAuth 使用者
        result = await create_or_update_oauth_user(
            db=db_session,
            email="oauth@example.com",
            name="OAuth User",
            oauth_provider="google",
            oauth_id="google_existing",
            profile_picture_url="https://example.com/photo.jpg"
        )

        # ✅ 驗證：返回相同使用者
        assert result.id == original_id, "應該返回相同使用者，不建立新記錄"
        assert result.oauth_provider == "google", "OAuth 資料應該保持不變"

    # ============================================
    # 測試 4: 應該處理 Google 未提供 name 的情況
    # ============================================
    @pytest.mark.asyncio
    async def test_should_handle_missing_name_from_google(self, db_session: AsyncSession):
        """
        需求 3.5: Google 未提供 name 時，使用 email 本地部分

        預期行為：
        - name 參數為 None 或空字串
        - 從 email 提取本地部分作為 name
        - 例如：user@gmail.com → "user"
        """
        from app.services.oauth_service import create_or_update_oauth_user

        # ✅ 執行：建立 OAuth 使用者，但沒有 name
        user = await create_or_update_oauth_user(
            db=db_session,
            email="testuser@gmail.com",
            name=None,  # Google 未提供 name
            oauth_provider="google",
            oauth_id="google_noname",
            profile_picture_url=None
        )

        # ✅ 驗證：使用 email 本地部分作為 name
        assert user.name == "testuser", "應該使用 email 本地部分作為 name"

    # ============================================
    # 測試 5: 應該處理空 name 字串
    # ============================================
    @pytest.mark.asyncio
    async def test_should_handle_empty_name_string(self, db_session: AsyncSession):
        """
        需求 3.5: name 為空字串時，使用 email 本地部分

        預期行為：
        - name 為空字串
        - 從 email 提取本地部分
        """
        from app.services.oauth_service import create_or_update_oauth_user

        # ✅ 執行：建立 OAuth 使用者，name 為空字串
        user = await create_or_update_oauth_user(
            db=db_session,
            email="emptyname@example.com",
            name="",  # 空字串
            oauth_provider="google",
            oauth_id="google_empty",
            profile_picture_url=None
        )

        # ✅ 驗證：使用 email 本地部分
        assert user.name == "emptyname", "應該使用 email 本地部分"

    # ============================================
    # 測試 6: 應該提供查詢 OAuth 使用者的函式
    # ============================================
    @pytest.mark.asyncio
    async def test_should_provide_get_oauth_user_function(self, db_session: AsyncSession):
        """
        需求 3.1: 應該提供查詢 OAuth 使用者的函式

        預期行為：
        - 提供 get_oauth_user() 函式
        - 可以根據 oauth_provider 和 oauth_id 查詢
        - 找到時返回使用者，找不到時返回 None
        """
        from app.services.oauth_service import get_oauth_user, create_or_update_oauth_user

        # 準備：建立一個 OAuth 使用者
        await create_or_update_oauth_user(
            db=db_session,
            email="search@example.com",
            name="Search User",
            oauth_provider="google",
            oauth_id="google_search123",
            profile_picture_url=None
        )

        # ✅ 執行：查詢 OAuth 使用者
        user = await get_oauth_user(
            db=db_session,
            oauth_provider="google",
            oauth_id="google_search123"
        )

        # ✅ 驗證：找到使用者
        assert user is not None, "應該找到 OAuth 使用者"
        assert user.email == "search@example.com", "應該是正確的使用者"

        # ✅ 驗證：找不到時返回 None
        not_found = await get_oauth_user(
            db=db_session,
            oauth_provider="google",
            oauth_id="nonexistent"
        )
        assert not_found is None, "找不到時應該返回 None"

    # ============================================
    # 測試 7: 應該正確處理 profile_picture_url
    # ============================================
    @pytest.mark.asyncio
    async def test_should_handle_profile_picture_url(self, db_session: AsyncSession):
        """
        需求 3.1: 應該正確儲存 profile_picture_url

        預期行為：
        - 儲存 Google 提供的頭像 URL
        - 允許 NULL（未提供頭像）
        """
        from app.services.oauth_service import create_or_update_oauth_user

        # ✅ 測試有頭像的情況
        user_with_pic = await create_or_update_oauth_user(
            db=db_session,
            email="withpic@example.com",
            name="User With Pic",
            oauth_provider="google",
            oauth_id="google_pic123",
            profile_picture_url="https://lh3.googleusercontent.com/a/default-user"
        )
        assert user_with_pic.profile_picture_url is not None, "應該儲存頭像 URL"

        # ✅ 測試沒有頭像的情況
        user_no_pic = await create_or_update_oauth_user(
            db=db_session,
            email="nopic@example.com",
            name="User No Pic",
            oauth_provider="google",
            oauth_id="google_nopic456",
            profile_picture_url=None
        )
        assert user_no_pic.profile_picture_url is None, "允許沒有頭像"

    # ============================================
    # 測試 8: 應該驗證 email 格式
    # ============================================
    @pytest.mark.asyncio
    async def test_should_validate_email_format(self, db_session: AsyncSession):
        """
        需求 3.1: 應該驗證 email 格式

        預期行為：
        - 無效的 email 應該拋出錯誤
        - 有效的 email 應該接受
        """
        from app.services.oauth_service import create_or_update_oauth_user

        # ✅ 測試無效 email
        with pytest.raises(ValueError, match="email"):
            await create_or_update_oauth_user(
                db=db_session,
                email="invalid-email",  # 無效格式
                name="Test",
                oauth_provider="google",
                oauth_id="google_invalid",
                profile_picture_url=None
            )

        # ✅ 測試有效 email
        user = await create_or_update_oauth_user(
            db=db_session,
            email="valid@example.com",
            name="Valid User",
            oauth_provider="google",
            oauth_id="google_valid",
            profile_picture_url=None
        )
        assert user.email == "valid@example.com", "有效 email 應該被接受"


class TestOAuthServiceIntegration:
    """測試 OAuth 服務的整合行為"""

    @pytest.mark.asyncio
    async def test_full_oauth_flow_for_new_user(self, db_session: AsyncSession):
        """
        完整測試新使用者的 OAuth 流程

        場景：
        1. Google 返回使用者資料
        2. 建立新使用者
        3. 可以查詢到該使用者
        """
        from app.services.oauth_service import create_or_update_oauth_user, get_oauth_user

        # ✅ 步驟 1: 建立新 OAuth 使用者
        user = await create_or_update_oauth_user(
            db=db_session,
            email="newflow@example.com",
            name="Flow User",
            oauth_provider="google",
            oauth_id="google_flow123",
            profile_picture_url="https://example.com/flow.jpg"
        )

        assert user is not None
        user_id = user.id

        # ✅ 步驟 2: 可以查詢到該使用者
        found_user = await get_oauth_user(
            db=db_session,
            oauth_provider="google",
            oauth_id="google_flow123"
        )

        assert found_user is not None
        assert found_user.id == user_id
        assert found_user.email == "newflow@example.com"

    @pytest.mark.asyncio
    async def test_full_oauth_flow_for_existing_user(self, db_session: AsyncSession):
        """
        完整測試現有使用者的 OAuth 綁定流程

        場景：
        1. 使用者已透過 email 註冊
        2. 使用者使用 Google 登入
        3. OAuth 資料應該綁定到現有帳號
        """
        from app.services.oauth_service import create_or_update_oauth_user
        from app.models.user import User

        # ✅ 步驟 1: 建立傳統註冊使用者
        traditional_user = User(
            email="traditional@example.com",
            name="Traditional User",
            password_hash="bcrypt_hash_here"
        )
        db_session.add(traditional_user)
        await db_session.commit()
        original_id = traditional_user.id

        # ✅ 步驟 2: 使用者用相同 email 進行 Google 登入
        oauth_user = await create_or_update_oauth_user(
            db=db_session,
            email="traditional@example.com",
            name="Traditional User",
            oauth_provider="google",
            oauth_id="google_traditional",
            profile_picture_url="https://example.com/trad.jpg"
        )

        # ✅ 步驟 3: 驗證是同一個使用者，已綁定 OAuth
        assert oauth_user.id == original_id, "應該是同一個使用者"
        assert oauth_user.oauth_provider == "google", "應該已綁定 Google"
        assert oauth_user.password_hash == "bcrypt_hash_here", "密碼應該保留（支援雙重登入）"
