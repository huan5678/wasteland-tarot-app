# Phase 6 剩餘工作報告

**日期**: 2025-10-28
**狀態**: 部分完成 (約 30%)
**預估剩餘時間**: 12-16 小時

---

## 已完成工作 (本次執行)

### ✅ Task 11.2 前端事件追蹤整合 (100% 完成)

**新增檔案**:
- `/src/lib/analytics/authEventTracker.ts`: 前端認證事件追蹤 API 封裝

**修改檔案**:
1. `/src/hooks/usePasskeyUpgradePrompt.tsx` ✅
   - 整合點 A: `handleSetupPasskey` 開始時追蹤「接受升級」
   - 整合點 B: `handleSkip` 中追蹤「跳過升級」
   - 整合點 C: Passkey 註冊成功後追蹤「升級完成」(source: oauth_prompt)

2. `/src/components/auth/AccountConflictPage.tsx` ✅
   - 整合點: `handleBackToLogin` 中追蹤「放棄解決衝突」

3. `/src/components/auth/AuthMethodsManagement.tsx` ✅
   - 整合點: `handleAddPasskey` 成功後追蹤「升級完成」(source: settings)

4. `/backend/app/api/v1/endpoints/analytics.py` ✅
   - 新增 POST `/api/v1/analytics/auth-events` 端點
   - 接收前端事件並儲存到資料庫

**測試狀態**: ⚠️ 待測試

---

## 未完成工作

### 🔶 Task 11.2 後端事件追蹤整合 (20% 完成)

**已完成**:
- ✅ 導入 `AuthAnalyticsTracker` 到 `auth_method_coordinator.py`

**待完成整合點**:

#### 1. `backend/app/services/auth_method_coordinator.py`

**整合點 1: OAuth 註冊成功** (Line ~175)
```python
async def _create_new_oauth_user(self, oauth_data: Dict[str, Any], db: AsyncSession):
    # ... 建立新用戶邏輯 ...

    # 追蹤事件：OAuth 註冊成功
    try:
        tracker = AuthAnalyticsTracker(db)
        await tracker.track_oauth_registration_success(
            user_id=new_user.id,
            provider=oauth_data["oauth_provider"],
            metadata={
                "has_profile_picture": bool(oauth_data.get("profile_picture_url"))
            }
        )
    except Exception as e:
        logger.warning(f"Failed to track OAuth registration event: {e}")

    return {"success": True, "user": new_user, "conflict": None}
```

**整合點 2: OAuth 衝突偵測** (Line ~160)
```python
# 步驟 4: 建立衝突資訊
conflict_info = {
    "conflict_type": "existing_account",
    "email": email,
    "existing_auth_methods": existing_methods,
    "suggested_action": "login_first"
}

# 追蹤事件：帳號衝突偵測
try:
    tracker = AuthAnalyticsTracker(db)
    await tracker.track_oauth_conflict_detected(
        email=email,
        existing_methods=existing_methods,
        oauth_provider=oauth_provider,
        metadata={"oauth_id": oauth_id}
    )
except Exception as e:
    logger.warning(f"Failed to track conflict detection event: {e}")

return {"success": False, "user": None, "conflict": conflict_info}
```

**整合點 3: 密碼登入並連結 OAuth 成功** (Line ~230)
```python
async def login_with_password_and_link_oauth(self, ...):
    # ... 驗證密碼、連結 OAuth ...

    # 追蹤事件：OAuth 連結成功
    try:
        tracker = AuthAnalyticsTracker(db)
        await tracker.track_oauth_account_linked(
            user_id=user.id,
            oauth_provider=oauth_provider,
            source="password",
            metadata={"email": email}
        )

        await tracker.track_oauth_conflict_resolved(
            user_id=user.id,
            resolution_method="password",
            metadata={"oauth_provider": oauth_provider}
        )
    except Exception as e:
        logger.warning(f"Failed to track OAuth link event: {e}")
```

**整合點 4: Passkey 登入並連結 OAuth 成功** (Line ~280)
```python
async def login_with_passkey_and_link_oauth(self, ...):
    # ... Passkey 驗證、連結 OAuth ...

    # 追蹤事件：OAuth 連結成功 + 衝突解決
    try:
        tracker = AuthAnalyticsTracker(db)
        await tracker.track_oauth_account_linked(
            user_id=user.id,
            oauth_provider=oauth_provider,
            source="passkey",
            metadata={"email": user.email}
        )

        await tracker.track_oauth_conflict_resolved(
            user_id=user.id,
            resolution_method="passkey",
            metadata={"oauth_provider": oauth_provider}
        )
    except Exception as e:
        logger.warning(f"Failed to track OAuth link event: {e}")
```

#### 2. `backend/app/services/webauthn_service.py`

**整合點: Passkey 登入成功** (待確認行號)
```python
async def verify_authentication(self, ...):
    # ... 驗證 assertion ...

    # 追蹤事件：Passkey 登入成功
    try:
        tracker = AuthAnalyticsTracker(db)
        await tracker.track_oauth_login_success(
            user_id=user.id,
            provider="passkey",  # 特殊處理
            metadata={"credential_id": credential_id}
        )
    except Exception as e:
        logger.warning(f"Failed to track Passkey login event: {e}")
```

#### 3. `backend/app/api/v1/endpoints/oauth.py` 或 `auth.py`

**整合點: OAuth 回調處理**
```python
@router.post("/oauth/callback")
async def handle_oauth_callback(...):
    # ... OAuth 回調邏輯 ...

    result = await coordinator.handle_oauth_registration(oauth_data, db)

    if result["success"]:
        # OAuth 登入成功（現有用戶）
        if result["user"] existed before:
            try:
                tracker = AuthAnalyticsTracker(db)
                await tracker.track_oauth_login_success(
                    user_id=result["user"].id,
                    provider=oauth_data["oauth_provider"],
                    metadata={"email": result["user"].email}
                )
            except Exception as e:
                logger.warning(f"Failed to track OAuth login event: {e}")
```

---

### 🔴 Task 11.3 Karma 獎勵機制實作 (0% 完成)

**需要實作的內容**:

#### 1. 擴展 `KarmaRulesEngine` (backend/app/services/karma_service.py)

在 `KARMA_RULES` 字典中新增規則 (Line ~22):
```python
KARMA_RULES = {
    # ... 現有規則 ...

    KarmaChangeReason.OAUTH_REGISTRATION: {
        "base_change": 50,
        "max_per_day": 50,  # 單次獎勵
        "requires_verification": False,
        "multiplier_factors": []
    },
    KarmaChangeReason.PASSKEY_FIRST_REGISTRATION: {
        "base_change": 20,
        "max_per_day": 20,  # 單次獎勵
        "requires_verification": False,
        "multiplier_factors": []
    },
    KarmaChangeReason.PASSKEY_DAILY_LOGIN: {
        "base_change": 10,
        "max_per_day": 10,  # 每日首次
        "requires_verification": False,
        "multiplier_factors": []
    },
}
```

**注意**: 需要在 `app/models/social_features.py` 的 `KarmaChangeReason` enum 中新增對應值。

#### 2. 建立每日首次登入追蹤服務

**選項 A: 使用 Redis (推薦)**

建立 `backend/app/services/daily_login_tracker.py`:
```python
"""
每日首次登入追蹤器（使用 Redis）
"""

from datetime import datetime, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class DailyLoginTracker:
    """
    使用 Redis 追蹤每日首次 Passkey 登入

    Key 格式：daily_passkey_login:{user_id}:{date}
    TTL: 25 小時（跨時區容錯）
    """

    def __init__(self, redis_client):
        self.redis = redis_client

    async def record_passkey_login(self, user_id: str) -> bool:
        """
        記錄 Passkey 登入

        Returns:
            bool: True 表示今日首次登入，False 表示今日已登入過
        """
        today = datetime.utcnow().strftime("%Y-%m-%d")
        key = f"daily_passkey_login:{user_id}:{today}"

        # 檢查是否已存在
        exists = await self.redis.exists(key)

        if not exists:
            # 今日首次登入，設定 key 並設定過期時間
            await self.redis.setex(key, 25 * 3600, "1")  # 25 小時 TTL
            return True

        return False

    async def check_today_login(self, user_id: str) -> bool:
        """
        檢查今日是否已登入過

        Returns:
            bool: True 表示今日已登入過
        """
        today = datetime.utcnow().strftime("%Y-%m-%d")
        key = f"daily_passkey_login:{user_id}:{today}"

        exists = await self.redis.exists(key)
        return bool(exists)
```

**選項 B: 使用資料庫 (備選)**

在 `User` 模型中新增欄位：
```python
last_passkey_login_date = Column(Date, nullable=True)
```

然後在 WebAuthn Service 中檢查：
```python
from datetime import date

today = date.today()
is_first_login_today = (
    user.last_passkey_login_date is None or
    user.last_passkey_login_date < today
)

if is_first_login_today:
    user.last_passkey_login_date = today
    # 發放 Karma
```

#### 3. 整合到服務層

**整合點 1: OAuth 註冊** (auth_method_coordinator.py)
```python
async def _create_new_oauth_user(self, oauth_data: Dict[str, Any], db: AsyncSession):
    # ... 建立新用戶 ...

    # 發放 OAuth 註冊 Karma (+50)
    try:
        from app.services.karma_service import KarmaService
        from app.models.social_features import KarmaChangeReason

        karma_service = KarmaService(db)
        await karma_service.apply_karma_change(
            user_id=new_user.id,
            reason=KarmaChangeReason.OAUTH_REGISTRATION,
            reason_description="首次使用 Google 註冊",
            context={"oauth_provider": oauth_data["oauth_provider"]},
            triggered_by_action="oauth_registration"
        )

        logger.info(f"[Karma] OAuth 註冊獎勵已發放: user_id={new_user.id}, +50 Karma")
    except Exception as e:
        logger.warning(f"Failed to award OAuth registration Karma: {e}")
```

**整合點 2: Passkey 首次註冊** (webauthn_service.py)
```python
async def store_credential(self, ...):
    # ... 儲存 credential ...

    # 檢查是否為首次 Passkey 註冊
    existing_credentials_count = await db.execute(
        select(func.count(Credential.id)).where(Credential.user_id == user_id)
    )
    count = existing_credentials_count.scalar()

    if count == 1:  # 剛註冊的這個是第一個
        try:
            from app.services.karma_service import KarmaService
            from app.models.social_features import KarmaChangeReason

            karma_service = KarmaService(db)
            await karma_service.apply_karma_change(
                user_id=user_id,
                reason=KarmaChangeReason.PASSKEY_FIRST_REGISTRATION,
                reason_description="首次設定 Passkey",
                context={"credential_id": credential.id},
                triggered_by_action="passkey_registration"
            )

            logger.info(f"[Karma] Passkey 註冊獎勵已發放: user_id={user_id}, +20 Karma")
        except Exception as e:
            logger.warning(f"Failed to award Passkey registration Karma: {e}")
```

**整合點 3: Passkey 每日首次登入** (webauthn_service.py)
```python
async def verify_authentication(self, ...):
    # ... 驗證成功 ...

    # 檢查今日首次登入並發放 Karma
    try:
        from app.services.daily_login_tracker import DailyLoginTracker
        from app.services.karma_service import KarmaService
        from app.models.social_features import KarmaChangeReason
        from app.core.redis import get_redis_client  # 假設有 Redis client

        redis = get_redis_client()
        tracker = DailyLoginTracker(redis)

        is_first_login_today = await tracker.record_passkey_login(user.id)

        if is_first_login_today:
            karma_service = KarmaService(db)
            await karma_service.apply_karma_change(
                user_id=user.id,
                reason=KarmaChangeReason.PASSKEY_DAILY_LOGIN,
                reason_description="今日首次使用 Passkey 登入",
                context={"credential_id": credential.id, "login_time": datetime.utcnow().isoformat()},
                triggered_by_action="passkey_daily_login"
            )

            logger.info(f"[Karma] Passkey 每日登入獎勵已發放: user_id={user.id}, +10 Karma")
    except Exception as e:
        logger.warning(f"Failed to award Passkey daily login Karma: {e}")
```

---

### 🔴 Task 11.4 安全性控制和驗證 (0% 完成)

#### 1. Email 一致性驗證

**位置**: `auth_method_coordinator.py`

**整合點 1: 密碼登入並連結 OAuth** (Line ~230)
```python
async def login_with_password_and_link_oauth(
    self,
    email: str,
    password: str,
    oauth_provider: str,
    oauth_id: str,
    oauth_email: str,  # 新增參數
    profile_picture: Optional[str],
    db: AsyncSession
):
    # ... 密碼驗證邏輯 ...

    # Email 一致性驗證
    if user.email.lower() != oauth_email.lower():
        raise AuthenticationError(
            "OAuth 帳號的 email 與現有帳號不一致，無法連結",
            error_code="EMAIL_MISMATCH"
        )

    # ... 連結 OAuth ...
```

**整合點 2: Passkey 登入並連結 OAuth** (同上)

#### 2. OAuth State 參數驗證 (CSRF 防護)

**建立新服務**: `backend/app/services/oauth_state_service.py`

```python
"""
OAuth State 參數驗證服務（CSRF 防護）
"""

import secrets
from typing import Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class OAuthStateService:
    """
    管理 OAuth state 參數以防止 CSRF 攻擊

    使用 Redis 儲存 state，TTL 10 分鐘
    """

    def __init__(self, redis_client):
        self.redis = redis_client
        self.state_ttl = 600  # 10 分鐘

    async def generate_state(self, user_session_id: Optional[str] = None) -> str:
        """
        產生 OAuth state 參數

        Args:
            user_session_id: 使用者 session ID（可選）

        Returns:
            str: state token
        """
        state = secrets.token_urlsafe(32)
        key = f"oauth_state:{state}"

        data = {
            "created_at": datetime.utcnow().isoformat(),
            "user_session_id": user_session_id or "anonymous"
        }

        # 儲存到 Redis，設定 TTL
        await self.redis.setex(key, self.state_ttl, str(data))

        logger.info(f"[OAuth State] Generated state: {state[:8]}...")
        return state

    async def verify_and_consume_state(self, state: str) -> bool:
        """
        驗證並消費 state 參數（防止重複使用）

        Args:
            state: OAuth callback 回傳的 state

        Returns:
            bool: 驗證是否成功
        """
        key = f"oauth_state:{state}"

        # 檢查 state 是否存在
        exists = await self.redis.exists(key)

        if not exists:
            logger.warning(f"[OAuth State] Invalid or expired state: {state[:8]}...")
            return False

        # 刪除 state（一次性使用）
        await self.redis.delete(key)

        logger.info(f"[OAuth State] State verified and consumed: {state[:8]}...")
        return True
```

**整合到 OAuth 流程**:

```python
# 在發起 OAuth 流程時
@router.get("/auth/oauth/initiate")
async def initiate_oauth(
    provider: str,
    redis = Depends(get_redis_client)
):
    state_service = OAuthStateService(redis)
    state = await state_service.generate_state()

    # 使用 Supabase SDK 發起 OAuth，帶上 state
    # ...
    return {"redirect_url": oauth_url, "state": state}

# 在 OAuth callback 時
@router.post("/auth/oauth/callback")
async def oauth_callback(
    code: str,
    state: str,
    redis = Depends(get_redis_client),
    db: AsyncSession = Depends(get_db)
):
    # 驗證 state
    state_service = OAuthStateService(redis)
    is_valid = await state_service.verify_and_consume_state(state)

    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="無效的 state 參數，可能存在 CSRF 攻擊"
        )

    # ... 繼續 OAuth 流程 ...
```

#### 3. WebAuthn Counter 驗證

**位置**: `webauthn_service.py` (待確認行號)

```python
async def verify_authentication(self, assertion_response, db: AsyncSession):
    # ... 驗證 assertion ...

    # Counter 驗證（防止 credential 複製攻擊）
    if assertion_response.counter <= credential.counter:
        logger.error(
            f"[Security Alert] Credential counter anomaly detected: "
            f"user_id={user.id}, credential_id={credential.id}, "
            f"stored_counter={credential.counter}, received_counter={assertion_response.counter}"
        )
        raise AuthenticationError(
            "Passkey counter 值異常，可能存在安全風險",
            error_code="CREDENTIAL_COUNTER_ANOMALY"
        )

    # 更新 counter
    credential.counter = assertion_response.counter
    await db.commit()
```

#### 4. 至少一種認證方式驗證

**位置**: `auth_method_coordinator.py`

```python
async def can_remove_auth_method(
    self,
    user_id: str,
    method_type: str,  # "oauth", "passkey", "password"
    db: AsyncSession
) -> tuple[bool, str]:
    """
    檢查是否可以移除指定的認證方式

    Returns:
        (是否可移除, 錯誤訊息)
    """
    methods = await self.get_auth_methods(user_id, db)

    # 計算剩餘認證方式數量
    remaining_methods = []
    if methods.has_oauth and method_type != "oauth":
        remaining_methods.append("OAuth")
    if methods.has_passkey and method_type != "passkey":
        remaining_methods.append("Passkey")
    if methods.has_password and method_type != "password":
        remaining_methods.append("密碼")

    if len(remaining_methods) == 0:
        return False, "無法移除唯一的認證方式，請先新增其他登入方式"

    return True, ""
```

**整合到移除 API** (`backend/app/api/v1/endpoints/auth.py`):

```python
@router.delete("/oauth/unlink")
async def unlink_oauth(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    coordinator = AuthMethodCoordinatorService()

    # 檢查是否可移除
    can_remove, error_msg = await coordinator.can_remove_auth_method(
        user_id=current_user.id,
        method_type="oauth",
        db=db
    )

    if not can_remove:
        raise HTTPException(status_code=400, detail=error_msg)

    # ... 執行移除邏輯 ...
```

#### 5. 認證方式變更警報追蹤

**建立新服務**: `backend/app/services/auth_change_tracker.py`

```python
"""
認證方式變更追蹤器（安全警報）
"""

from datetime import datetime, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class AuthChangeTracker:
    """
    追蹤認證方式變更，偵測可疑活動

    警報規則：1 小時內 >= 3 次變更
    """

    def __init__(self, redis_client):
        self.redis = redis_client
        self.window_seconds = 3600  # 1 小時
        self.threshold = 3

    async def record_change(
        self,
        user_id: str,
        change_type: str  # "add_oauth", "remove_oauth", "add_passkey", etc.
    ) -> int:
        """
        記錄認證方式變更

        Returns:
            int: 1 小時內的變更次數
        """
        key = f"auth_changes:{user_id}"
        timestamp = datetime.utcnow().timestamp()

        # 使用 sorted set 記錄變更（score = timestamp）
        await self.redis.zadd(key, {f"{change_type}:{timestamp}": timestamp})

        # 移除 1 小時前的記錄
        one_hour_ago = timestamp - self.window_seconds
        await self.redis.zremrangebyscore(key, 0, one_hour_ago)

        # 計算 1 小時內的變更次數
        count = await self.redis.zcard(key)

        # 設定 key 過期時間（1 小時）
        await self.redis.expire(key, self.window_seconds)

        return count

    async def check_suspicious_activity(
        self,
        user_id: str
    ) -> tuple[bool, int]:
        """
        檢查是否有可疑的認證方式變更活動

        Returns:
            (是否可疑, 變更次數)
        """
        key = f"auth_changes:{user_id}"
        count = await self.redis.zcard(key)

        is_suspicious = count >= self.threshold

        if is_suspicious:
            # 獲取所有變更記錄
            changes = await self.redis.zrange(key, 0, -1, withscores=True)

            logger.warning(
                f"[安全警報] 使用者 {user_id} 在 1 小時內進行了 {count} 次認證方式變更",
                extra={
                    "user_id": user_id,
                    "change_count": count,
                    "alert_type": "suspicious_auth_changes",
                    "changes": [change[0] for change in changes]
                }
            )

        return is_suspicious, count
```

**整合到所有認證方式變更操作**:

```python
# 例如：連結 OAuth
async def link_oauth(...):
    # ... 連結邏輯 ...

    # 記錄變更並檢查可疑活動
    try:
        from app.services.auth_change_tracker import AuthChangeTracker
        from app.core.redis import get_redis_client

        redis = get_redis_client()
        tracker = AuthChangeTracker(redis)

        change_count = await tracker.record_change(user_id, "add_oauth")
        is_suspicious, count = await tracker.check_suspicious_activity(user_id)

        if is_suspicious:
            # 可選：發送警報通知、鎖定帳號、要求二次驗證等
            pass
    except Exception as e:
        logger.warning(f"Failed to track auth change: {e}")
```

---

## 測試驗證清單

### 後端測試

```bash
# Phase 6 相關測試
pytest backend/tests/unit/test_auth_analytics_tracking.py -v
pytest backend/tests/unit/test_karma_rewards.py -v
pytest backend/tests/unit/test_auth_security_controls.py -v

# 整合測試
pytest backend/tests/integration/test_auth_methods_api.py -v
pytest backend/tests/integration/test_oauth_callback.py -v
pytest backend/tests/integration/test_oauth_conflict.py -v
```

### 前端測試

```bash
# 認證相關元件測試
npm test src/components/auth/__tests__/
npm test src/hooks/__tests__/usePasskeyUpgradePrompt.test.tsx
```

### 手動測試流程

1. **OAuth 註冊流程**
   - 使用 Google OAuth 註冊新帳號
   - 檢查資料庫：user.karma_score = 50
   - 檢查分析事件：oauth_registration_success

2. **Passkey 升級引導**
   - 登入後觀察引導 modal
   - 點擊「立即設定」→ 檢查事件: passkey_upgrade_prompt_accepted
   - 完成 Passkey 註冊 → 檢查 Karma: +20, 事件: passkey_upgrade_completed (source: oauth_prompt)

3. **帳號衝突解決**
   - 建立已有密碼的測試帳號
   - 嘗試用相同 email 的 Google OAuth 登入
   - 觀察衝突頁面
   - 輸入密碼連結 → 檢查事件: oauth_conflict_resolved

4. **設定頁面新增 Passkey**
   - 前往 /settings?tab=security
   - 新增 Passkey → 檢查 Karma: +20, 事件: passkey_upgrade_completed (source: settings)

5. **每日首次 Passkey 登入**
   - 使用 Passkey 登入
   - 檢查 Karma: +10 (僅今日首次)
   - 再次登入 → Karma 不增加

6. **安全性驗證**
   - 嘗試移除唯一的認證方式 → 應被阻擋
   - 短時間內多次變更認證方式 → 檢查 log 中的安全警報

---

## 預估工時分配

| 任務 | 預估時間 | 優先級 |
|------|---------|--------|
| 後端事件追蹤整合 (4 個整合點) | 2-3 小時 | P1 |
| Karma 獎勵機制實作 (3 個整合點) | 3-4 小時 | P1 |
| 安全性控制實作 (5 個驗證點) | 4-5 小時 | P0 |
| 完整測試執行與修復 | 2-3 小時 | P0 |
| 文件更新與報告撰寫 | 1 小時 | P2 |
| **總計** | **12-16 小時** | - |

---

## 風險與注意事項

1. **Redis 依賴**: OAuth State 和每日登入追蹤需要 Redis。若專案無 Redis，需改用資料庫實作。
2. **Karma Enum**: 需確認 `KarmaChangeReason` enum 是否有新增對應值的機制。
3. **Counter 驗證**: WebAuthn counter 邏輯可能已存在，需檢查避免重複實作。
4. **測試覆蓋率**: Phase 6 測試框架已建立，但實作完成後需執行驗證。
5. **錯誤處理**: 所有事件追蹤和 Karma 發放都使用 try-except 確保失敗不影響主流程。

---

## 下一步建議

### 立即執行 (P0)
1. 完成安全性控制實作 (Task 11.4)
2. 執行現有測試確認基礎功能無破壞

### 短期執行 (P1)
3. 完成後端事件追蹤整合 (Task 11.2)
4. 完成 Karma 獎勵機制實作 (Task 11.3)
5. 執行完整測試套件驗證

### 最終驗證 (P2)
6. 手動測試所有流程
7. 更新 tasks.md 標記 Phase 6 完成
8. 生成最終報告

---

**報告生成時間**: 2025-10-28
**報告版本**: v1.0
