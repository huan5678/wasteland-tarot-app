# Task 22: 登出功能 - 實作總結

## 📋 任務概述

實作完整的登出功能，包含：
- 清除後端 httpOnly cookies (access_token, refresh_token)
- OAuth 使用者透過 Supabase 登出
- 清除前端所有本地狀態
- 自動重導向至首頁

## ✅ 完成項目

### 1. 後端 Logout 端點 (`app/api/auth.py`)

**檔案**: `backend/app/api/auth.py`

#### 新增匯入
```python
from fastapi import APIRouter, Depends, HTTPException, status, Response
from app.core.security import get_access_token_cookie_settings, get_refresh_token_cookie_settings
```

#### 更新 Logout 端點
```python
@router.post("/logout")
async def logout_user(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    登出使用者

    需求：
    - 7.1: 清除 httpOnly cookies（access_token, refresh_token）
    - 7.2: 對於 OAuth 使用者，前端需呼叫 supabase.auth.signOut()
    - 7.3: 清除所有本地狀態
    - 7.4: 重導向至首頁（前端處理）
    """
    # 清除 access_token cookie
    access_token_settings = get_access_token_cookie_settings()
    response.delete_cookie(
        key=access_token_settings["key"],
        path="/",
        domain=None,
        secure=access_token_settings["secure"],
        httponly=access_token_settings["httponly"],
        samesite=access_token_settings["samesite"]
    )

    # 清除 refresh_token cookie
    refresh_token_settings = get_refresh_token_cookie_settings()
    response.delete_cookie(
        key=refresh_token_settings["key"],
        path="/",
        domain=None,
        secure=refresh_token_settings["secure"],
        httponly=refresh_token_settings["httponly"],
        samesite=refresh_token_settings["samesite"]
    )

    return {
        "message": "登出成功",
        "is_oauth_user": current_user.oauth_provider is not None,
        "oauth_provider": current_user.oauth_provider
    }
```

**功能**:
- ✅ 清除 `access_token` httpOnly cookie
- ✅ 清除 `refresh_token` httpOnly cookie
- ✅ 返回 OAuth 使用者資訊供前端判斷
- ✅ 需要認證（透過 `get_current_user` dependency）

---

### 2. 前端 Auth Store 更新 (`src/lib/authStore.ts`)

**檔案**: `src/lib/authStore.ts`

#### 更新 Interface
```typescript
interface AuthState {
  // ... existing fields
  logout: () => Promise<void> // 改為 async
}
```

#### 實作完整 Logout 函式
```typescript
logout: async () => {
  const { token, isOAuthUser } = get()

  try {
    // 若為 OAuth 使用者，呼叫 Supabase signOut
    if (isOAuthUser && typeof window !== 'undefined') {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      await supabase.auth.signOut()
    }

    // 呼叫後端 logout API 清除 httpOnly cookies
    if (token) {
      try {
        await authAPI.logout(token)
      } catch (e) {
        console.error('Backend logout failed:', e)
        // 繼續執行本地登出，即使後端失敗
      }
    }
  } catch (e) {
    console.error('Logout error:', e)
  } finally {
    // 清除本地儲存
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem('pip-boy-remember')
    }

    // 清除 store 狀態
    set({
      user: null,
      token: null,
      isOAuthUser: false,
      oauthProvider: null,
      profilePicture: null,
      error: null
    })

    import('@/lib/actionTracker').then(m=>m.track('app:logout',{}))

    // 重導向至首頁
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }
}
```

**功能**:
- ✅ OAuth 使用者呼叫 `supabase.auth.signOut()`
- ✅ 呼叫後端 `/api/v1/auth/logout` 清除 cookies
- ✅ 清除所有 localStorage (TOKEN_KEY, USER_KEY, remember)
- ✅ 清除 Zustand store 所有認證狀態
- ✅ 錯誤處理 (即使後端失敗也完成本地登出)
- ✅ finally 區塊確保清理和重導向
- ✅ 自動重導向至首頁 (`/`)
- ✅ 追蹤登出事件

---

### 3. API Client 更新 (`src/lib/api.ts`)

**檔案**: `src/lib/api.ts`

#### 新增 Logout API 函式
```typescript
export const authAPI = {
  // ... existing methods

  // 登出
  logout: (token: string): Promise<{
    message: string;
    is_oauth_user: boolean;
    oauth_provider: string | null
  }> =>
    apiRequest('/api/v1/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }),
}
```

**功能**:
- ✅ 定義 logout API 函式
- ✅ 正確的型別定義
- ✅ Bearer token 認證
- ✅ POST 方法

---

### 4. Security Module Cookie Settings (已於 Task 19 完成)

**檔案**: `backend/app/core/security.py`

```python
def get_access_token_cookie_settings() -> Dict[str, Any]:
    return {
        "key": "access_token",
        "httponly": True,
        "secure": settings.environment == "production",
        "samesite": "lax",
        "max_age": settings.access_token_expire_minutes * 60,
    }

def get_refresh_token_cookie_settings() -> Dict[str, Any]:
    return {
        "key": "refresh_token",
        "httponly": True,
        "secure": settings.environment == "production",
        "samesite": "lax",
        "max_age": 7 * 24 * 60 * 60,  # 7 days
    }
```

---

## 🔍 驗證結果

執行 `uv run python backend/verify_task22.py`:

```
============================================================
Task 22 驗證：登出功能
============================================================

📋 驗證後端 logout 端點...
✅ 匯入 Response (14/14 檢查通過)

📋 驗證前端 authStore logout...
✅ logout 為 async (19/19 檢查通過)

📋 驗證 API client logout 函式...
✅ logout 函式存在 (6/6 檢查通過)

📋 驗證 security module cookie settings...
✅ access_token settings 函式 (9/9 檢查通過)

🎉 Task 22 驗證通過！
```

---

## 📊 登出流程

### OAuth 使用者登出流程
```
1. 使用者點擊登出按鈕
2. authStore.logout() 被呼叫
3. 判斷為 OAuth 使用者 (isOAuthUser === true)
4. 呼叫 supabase.auth.signOut()
   - Supabase 清除 sb-* cookies
   - 伺服器端會話被終止
5. 呼叫後端 /api/v1/auth/logout
   - 清除 access_token cookie
   - 清除 refresh_token cookie
6. 清除 localStorage (TOKEN_KEY, USER_KEY, remember)
7. 清除 Zustand store 狀態
8. 追蹤登出事件
9. 重導向至 / (首頁)
```

### 傳統認證使用者登出流程
```
1. 使用者點擊登出按鈕
2. authStore.logout() 被呼叫
3. 判斷為非 OAuth 使用者 (isOAuthUser === false)
4. 跳過 Supabase signOut
5. 呼叫後端 /api/v1/auth/logout
   - 清除 access_token cookie
   - 清除 refresh_token cookie
6. 清除 localStorage (TOKEN_KEY, USER_KEY, remember)
7. 清除 Zustand store 狀態
8. 追蹤登出事件
9. 重導向至 / (首頁)
```

---

## 🔐 安全特性

1. **httpOnly Cookies**: 防止 XSS 攻擊竊取 tokens
2. **Secure Flag**: 生產環境僅透過 HTTPS 傳輸
3. **SameSite=lax**: 防止 CSRF 攻擊
4. **完整清理**: 確保所有認證資訊被清除
5. **錯誤容忍**: 即使後端失敗也完成本地登出
6. **OAuth 整合**: 正確處理 Supabase OAuth 會話

---

## 📝 使用範例

### 在 React 元件中使用
```typescript
import { useAuthStore } from '@/lib/authStore'

function LogoutButton() {
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = async () => {
    try {
      await logout()
      // 登出成功，會自動重導向至首頁
    } catch (error) {
      console.error('Logout failed:', error)
      // 即使錯誤也會執行本地登出並重導向
    }
  }

  return (
    <button onClick={handleLogout}>
      登出
    </button>
  )
}
```

---

## ✅ Task 22 驗證檢查清單

### 後端 (14 項)
- [x] 匯入 Response
- [x] 匯入 cookie settings 函式
- [x] logout 端點存在
- [x] Response 參數
- [x] 需求 7.1-7.4 註解
- [x] 取得 access_token settings
- [x] 取得 refresh_token settings
- [x] 刪除 access_token cookie
- [x] 刪除 refresh_token cookie
- [x] 返回 OAuth 資訊

### 前端 Auth Store (19 項)
- [x] logout 型別為 Promise<void>
- [x] logout 實作為 async
- [x] 取得 isOAuthUser 狀態
- [x] OAuth 使用者判斷
- [x] 動態匯入 Supabase client
- [x] 呼叫 supabase.auth.signOut()
- [x] 呼叫後端 logout API
- [x] 錯誤處理
- [x] 清除所有 localStorage
- [x] 清除所有 store 狀態
- [x] finally 區塊
- [x] 重導向至首頁

### API Client (6 項)
- [x] logout 函式存在
- [x] 正確的參數和返回型別
- [x] 正確的 endpoint
- [x] POST 方法
- [x] Authorization header

### Security Module (9 項)
- [x] cookie settings 函式存在
- [x] 正確的 key, httponly, secure, samesite 設定
- [x] 正確的 max_age 設定

---

## 🎯 Task 22 完成

**總驗證通過**: 48/48 (100%)

Task 22 已完整實作並通過所有驗證！

---

## 📅 下一步

繼續 Tasks 23-30:
- Task 23: 後端單元測試
- Task 24: 後端整合測試
- Task 25: 資料庫遷移測試
- Task 26: 前端元件測試
- Task 27: E2E 測試
- Task 28: 全面錯誤處理
- Task 29: Karma 系統整合
- Task 30: Reading History 整合
