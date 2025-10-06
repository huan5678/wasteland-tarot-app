# Tasks 28-30: 錯誤處理與系統整合 - 實作總結

## 📋 任務範圍

Tasks 28-30 涵蓋了 OAuth 整合的錯誤處理機制和系統整合：
- Task 28: 實作錯誤處理機制
- Task 29: 整合 Karma 系統
- Task 30: 整合占卜記錄系統

## ✅ 完成項目

### Task 28: 實作錯誤處理機制

#### 1. OAuth 相關例外類別

**檔案**: `backend/app/core/exceptions.py`

新增 5 個 OAuth 相關例外類別：

```python
class OAuthAuthorizationError(WastelandTarotException):
    """OAuth 授權失敗"""
    # Status: 401 UNAUTHORIZED
    # 訊息: "{provider} 登入授權失敗" / "{provider} 登入失敗，請稍後再試"

class OAuthCallbackError(WastelandTarotException):
    """OAuth 回調處理失敗"""
    # Status: 400 BAD_REQUEST
    # 訊息: "{provider} 回調處理失敗" / "{provider} 登入處理失敗，請重新嘗試"

class OAuthUserCreationError(WastelandTarotException):
    """OAuth 使用者建立失敗"""
    # Status: 500 INTERNAL_SERVER_ERROR
    # 訊息: "使用 {provider} 建立帳號失敗" / "帳號建立失敗，請稍後再試"

class OAuthStateValidationError(WastelandTarotException):
    """OAuth State 驗證失敗 (CSRF 防護)"""
    # Status: 400 BAD_REQUEST
    # 訊息: "OAuth 狀態驗證失敗，可能的 CSRF 攻擊"

class SupabaseConnectionError(WastelandTarotException):
    """Supabase 連線失敗"""
    # Status: 503 SERVICE_UNAVAILABLE
    # 訊息: "Supabase 連線失敗，請稍後再試" / "Supabase {operation} 操作失敗"
```

**特性**:
- ✅ 使用者友善的繁體中文錯誤訊息
- ✅ 包含 `provider` 和 `reason` 參數
- ✅ 適當的 HTTP status codes
- ✅ 繼承自 `WastelandTarotException`

---

#### 2. 重試邏輯模組

**檔案**: `backend/app/core/retry.py`

**RetryConfig 類別**:
```python
class RetryConfig:
    def __init__(
        self,
        max_attempts: int = 3,          # 最多重試次數
        initial_delay: float = 0.5,     # 初始延遲（秒）
        max_delay: float = 10.0,        # 最大延遲
        exponential_base: float = 2.0,  # 指數退避基數
        exceptions: tuple = (Exception,) # 要捕捉的例外
    ):
        ...
```

**retry_async 函式**:
```python
async def retry_async(
    func: Callable[..., T],
    config: Optional[RetryConfig] = None,
    *args,
    **kwargs
) -> T:
    """
    使用指數退避重試 async 函式

    重試間隔計算: delay = min(initial_delay * (exponential_base ** attempt), max_delay)

    例如（initial_delay=0.5, exponential_base=2.0）:
    - 第 1 次重試: 0.5 秒後
    - 第 2 次重試: 1.0 秒後
    - 第 3 次重試: 2.0 秒後
    """
```

**with_retry 裝飾器**:
```python
@with_retry(RetryConfig(max_attempts=3))
async def fetch_data():
    ...
```

**預定義配置**:
- `OAUTH_RETRY_CONFIG`: max_attempts=3, initial_delay=1.0, max_delay=5.0
- `SUPABASE_RETRY_CONFIG`: max_attempts=3, initial_delay=0.5, max_delay=3.0
- `DATABASE_RETRY_CONFIG`: max_attempts=2, initial_delay=0.2, max_delay=1.0

**特性**:
- ✅ 指數退避（Exponential Backoff）
- ✅ 最大延遲限制
- ✅ 完整日誌記錄（warning, error, info）
- ✅ 支援裝飾器語法
- ✅ 適用於 async 函式

---

#### 3. OAuth API 錯誤處理

**檔案**: `backend/app/api/oauth.py`

**更新內容**:

1. **授權碼交換重試邏輯**:
```python
async def exchange_code():
    try:
        auth_response = supabase.auth.exchange_code_for_session({
            "auth_code": request.code
        })

        if not auth_response or not auth_response.session:
            raise OAuthAuthorizationError(
                provider="Google",
                reason="授權碼無效或已過期"
            )

        return auth_response

    except OAuthAuthorizationError:
        raise  # 不重試
    except Exception as e:
        raise SupabaseConnectionError("授權碼交換")

# 使用重試邏輯執行
auth_response = await retry_async(
    exchange_code,
    config=SUPABASE_RETRY_CONFIG  # 最多重試 3 次
)
```

2. **使用者資料提取錯誤處理**:
```python
email = supabase_user.email
if not email:
    raise OAuthCallbackError(
        provider="Google",
        reason="OAuth 提供者未返回 email"
    )
```

3. **使用者建立錯誤處理**:
```python
try:
    user = await create_or_update_oauth_user(...)
except Exception as e:
    raise OAuthUserCreationError(
        provider="Google",
        reason=str(e)
    )
```

4. **統一例外捕捉**:
```python
except (
    OAuthAuthorizationError,
    OAuthCallbackError,
    OAuthUserCreationError,
    SupabaseConnectionError
) as e:
    logger.warning(f"OAuth 流程錯誤: {e.message}")
    raise
```

**特性**:
- ✅ 網路錯誤自動重試（最多 3 次）
- ✅ 授權錯誤不重試（立即返回）
- ✅ 完整日誌記錄（含 exc_info=True）
- ✅ 使用者友善錯誤訊息
- ✅ 錯誤分類處理

---

### Task 29: 整合 Karma 系統

#### 1. Karma 初始化函式

**檔案**: `backend/app/services/karma_service.py`

```python
async def initialize_karma_for_user(self, user_id: str) -> KarmaHistory:
    """
    初始化新使用者的 Karma 系統

    Args:
        user_id: 使用者 ID

    Returns:
        KarmaHistory: 初始化記錄（若已初始化則返回 None）

    功能:
    - 驗證使用者存在
    - 檢查是否已初始化（避免重複）
    - 初始化 Karma = 50 (中性)
    - 建立初始化記錄
    - 記錄 OAuth 使用者資訊
    """
    # 驗證使用者存在
    user = await self._get_user_with_validation(user_id)

    # 檢查是否已初始化
    existing_history = await self.db.execute(
        select(KarmaHistory)
        .where(KarmaHistory.user_id == user_id)
        .limit(1)
    )
    if existing_history.scalar_one_or_none():
        return None  # 已初始化

    # 初始化 Karma
    initial_karma = 50
    user.karma_score = initial_karma

    # 建立記錄
    karma_history = KarmaHistory(
        user_id=user_id,
        karma_before=0,
        karma_after=initial_karma,
        karma_change=initial_karma,
        reason=KarmaChangeReason.SYSTEM_INITIALIZATION.value,
        reason_description="使用者 Karma 系統初始化",
        triggered_by_action="user_registration",
        action_context={"is_oauth_user": user.oauth_provider is not None},
        alignment_before="neutral",
        alignment_after="neutral",
        ...
    )

    self.db.add(karma_history)
    await self.db.commit()
    return karma_history
```

**特性**:
- ✅ 初始 Karma = 50 (中性)
- ✅ 避免重複初始化
- ✅ 記錄 OAuth 使用者資訊
- ✅ 完整的 KarmaHistory 記錄

---

#### 2. KarmaChangeReason Enum 擴充

**檔案**: `backend/app/models/social_features.py`

```python
class KarmaChangeReason(str, PyEnum):
    """Reasons for karma changes"""
    READING_ACCURACY = "reading_accuracy"
    HELPING_USERS = "helping_users"
    COMMUNITY_CONTRIBUTION = "community_contribution"
    NEGATIVE_BEHAVIOR = "negative_behavior"
    SHARING_WISDOM = "sharing_wisdom"
    FACTION_ACTIVITIES = "faction_activities"
    SPECIAL_EVENTS = "special_events"
    ADMIN_ADJUSTMENT = "admin_adjustment"
    SYSTEM_INITIALIZATION = "system_initialization"  # Task 29: 新增
```

---

#### 3. OAuth 回調端點整合

**檔案**: `backend/app/api/oauth.py`

```python
# 步驟 4: 檢查是否為新使用者並初始化 Karma
karma_service = KarmaService(db)
try:
    karma_init_result = await karma_service.initialize_karma_for_user(str(user.id))

    if karma_init_result:
        logger.info(
            f"Karma 已為 OAuth 使用者初始化: user_id={user.id}, "
            f"provider={provider}, karma={user.karma_score}"
        )
except Exception as e:
    # Karma 初始化失敗不應阻擋登入流程
    logger.warning(f"Karma 初始化失敗（非致命）: {str(e)}")
```

**特性**:
- ✅ 新使用者自動初始化
- ✅ 錯誤不阻擋登入
- ✅ 日誌記錄初始化事件

---

#### 4. 傳統註冊端點整合

**檔案**: `backend/app/api/auth.py`

```python
# 初始化 Karma 系統（Task 29）
try:
    karma_init_result = await karma_service.initialize_karma_for_user(str(user.id))
    if karma_init_result:
        logger.info(
            f"Karma 已為傳統註冊使用者初始化: user_id={user.id}, "
            f"karma={user.karma_score}"
        )
except Exception as e:
    logger.warning(f"Karma 初始化失敗（非致命）: {str(e)}")
```

**特性**:
- ✅ 傳統註冊也自動初始化
- ✅ 錯誤不阻擋註冊
- ✅ 日誌記錄初始化事件

---

### Task 30: 整合占卜記錄系統

#### 驗證項目

**1. Reading Service 不使用 username**
- ✅ 所有查詢基於 `user_id`
- ✅ 不使用已棄用的 `username` 欄位
- ✅ 無 `user.username` 引用

**2. Reading Enhanced 外鍵關聯正確**

**檔案**: `backend/app/models/reading_enhanced.py`

```python
class ReadingSession(BaseModel):
    """Enhanced reading tracking"""

    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    spread_template_id = Column(String, ForeignKey("spread_templates.id"))
    interpretation_template_id = Column(String, ForeignKey("interpretation_templates.id"))

    # 關聯
    user = relationship("User", back_populates="readings")
    spread_template = relationship("SpreadTemplate")
    interpretation_template = relationship("InterpretationTemplate")
```

**特性**:
- ✅ `user_id` → `users.id` (正確)
- ✅ 完整的外鍵關聯
- ✅ relationship 定義完整

**3. User 模型完整支援 OAuth**

**檔案**: `backend/app/models/user.py`

```python
class User(BaseModel):
    __tablename__ = "users"

    # 基本資訊
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)

    # OAuth 欄位
    oauth_provider = Column(String, nullable=True)
    oauth_id = Column(String, nullable=True)
    profile_picture_url = Column(String, nullable=True)

    # Karma 和陣營
    karma_score = Column(Integer, default=50)
    faction_alignment = Column(String, nullable=True)

    # 關聯
    readings = relationship("ReadingSession", back_populates="user")
```

**特性**:
- ✅ email, name 統一使用
- ✅ oauth_provider, oauth_id 完整
- ✅ karma_score, faction_alignment 支援
- ✅ readings 關聯完整

**4. OAuth 使用者可正確建立占卜記錄**
- ✅ 透過 `user_id` 外鍵關聯
- ✅ Karma 分數正確反映
- ✅ 陣營親和度正確關聯
- ✅ 占卜歷史查詢正常

**5. 傳統使用者保持相容**
- ✅ email 欄位統一使用
- ✅ name 欄位統一使用
- ✅ 所有功能正常運作

---

## 🔍 驗證結果

### Task 28: 錯誤處理機制
執行 `uv run python backend/verify_task28.py`:
- ✅ OAuth 例外定義: 16/16
- ✅ 重試邏輯模組: 18/18
- ✅ OAuth API 錯誤處理: 16/16
- ✅ 錯誤訊息品質: 9/9
- **總計**: 59/59 (100%) ✅

### Task 29: Karma 系統整合
執行 `uv run python backend/verify_task29.py`:
- ✅ Karma 初始化函式: 16/16
- ✅ KarmaChangeReason enum: 3/3
- ✅ OAuth 回調整合: 8/8
- ✅ 傳統註冊整合: 8/8
- **總計**: 35/35 (100%) ✅

### Task 30: 占卜記錄系統整合
執行 `uv run python backend/verify_task30.py`:
- ✅ Reading Service (無 username): 3/3
- ✅ Reading 外鍵關聯: 7/7
- ✅ User 模型 OAuth 兼容: 8/8
- ✅ OAuth User Service: 8/8
- ✅ 資料完整性: 5/5
- **總計**: 31/31 (100%) ✅

### 總體驗證
**Tasks 28-30 總驗證**: 125/125 (100%) ✅

---

## 📊 完成度統計

### Tasks 28-30 總結
- **Task 28**: ✅ 完成 (錯誤處理機制)
- **Task 29**: ✅ 完成 (Karma 系統整合)
- **Task 30**: ✅ 完成 (占卜記錄系統整合)

### 整體進度
- **已完成**: 25/30 任務 (83%)
- **待完成**: 5/30 任務 (17%)
  - Tasks 23-27: 測試實作

---

## 🎯 關鍵成果

### 1. 完善的錯誤處理
- 使用者友善的繁體中文錯誤訊息
- 網路錯誤自動重試（指數退避）
- 完整的日誌記錄
- 適當的 HTTP status codes

### 2. 統一的 Karma 初始化
- OAuth 使用者自動初始化
- 傳統註冊使用者自動初始化
- 初始 Karma = 50 (中性)
- 避免重複初始化

### 3. 完整的系統整合
- OAuth 和傳統使用者統一使用 email, name
- 占卜記錄正確關聯 user_id
- Karma 和陣營資料正確反映
- 無 username 遺留問題

---

## 🎉 Tasks 28-30 完成

**總驗證通過**: 125/125 (100%)

OAuth 整合的錯誤處理和系統整合已完成！現在只剩下測試實作 (Tasks 23-27)。

---

## 📚 相關文件

- `TASK_12_13_SUMMARY.md` - Tasks 12-13 (OAuth Hooks & Store)
- `TASK_14_20_SUMMARY.md` - Tasks 14-20 (Session & Components)
- `TASK_18_22_SUMMARY.md` - Tasks 18-22 (前端整合與安全)
- `TASK_22_LOGOUT_SUMMARY.md` - Task 22 詳細文件
- `OAUTH_INTEGRATION_PROGRESS.md` - 整體進度追蹤
