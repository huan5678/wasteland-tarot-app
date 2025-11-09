# 🎉 Passkeys 後端基礎 - 100% 完成總結

**完成日期**: 2025-10-03
**完成任務**: Tasks 31-37 (7/7)
**總程式碼**: ~2,200+ 行生產程式碼
**總進度**: 37/47 (79%)

---

## 📊 完成階段總覽

### ✅ Phase 1: 架構設計與規劃 (Task 31)

**檔案**: `docs/passkeys-architecture.md` (492 行)

**內容**:
- 三重認證機制架構（Email/Password + OAuth + Passkeys）
- 資料庫 schema 設計（credentials 表設計）
- 使用者流程設計（註冊、登入、管理）
- 後端/前端技術架構規劃
- WebAuthn 參數配置詳解
- Challenge 管理策略（Redis vs Cookie）
- 安全考量（防重放攻擊、憑證劫持）
- 錯誤處理和例外映射
- 瀏覽器相容性與降級方案
- 測試策略
- 部署檢查清單

**設計原則**:
- ✅ 獨立模組：不影響現有 OAuth 和 Email 認證
- ✅ 漸進增強：不支援的瀏覽器可降級使用其他方式
- ✅ 多認證器：使用者可註冊多個 Passkey
- ✅ 安全優先：符合 FIDO2 標準和最佳實踐

---

### ✅ Phase 2: 資料庫架構 (Tasks 32-33)

#### Task 32: Alembic 遷移腳本

**檔案**: `backend/alembic/versions/006_add_webauthn_support.py` (108 行)

**實作內容**:
1. **Users 表擴展**:
   ```sql
   ALTER TABLE users ADD COLUMN webauthn_user_handle BYTEA UNIQUE;
   CREATE INDEX idx_users_webauthn_handle ON users(webauthn_user_handle);
   ```

2. **Credentials 表建立**:
   ```sql
   CREATE TABLE credentials (
       id UUID PRIMARY KEY,
       user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       credential_id TEXT UNIQUE NOT NULL,  -- Base64URL encoded
       public_key TEXT NOT NULL,            -- CBOR encoded
       counter BIGINT NOT NULL DEFAULT 0,
       transports TEXT[],
       device_name TEXT,
       aaguid UUID,
       backup_eligible BOOLEAN DEFAULT false,
       backup_state BOOLEAN DEFAULT false,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       last_used_at TIMESTAMP
   );
   ```

3. **索引建立**:
   - `idx_credentials_user_id`: 快速查詢使用者憑證
   - `idx_credentials_credential_id`: 唯一性約束
   - `idx_credentials_last_used`: 按最後使用時間排序

#### Task 33: Credential SQLAlchemy 模型

**檔案**: `backend/app/models/credential.py` (192 行)

**核心功能**:
- ✅ 完整的 SQLAlchemy 欄位定義
- ✅ User 模型關聯（多對一）
- ✅ 安全方法：`increment_counter()` 防重放攻擊
- ✅ 屬性：`is_platform_authenticator`, `is_roaming_authenticator`
- ✅ 資料序列化：`to_dict()` 排除敏感資料
- ✅ 時間戳管理：`update_last_used()`

**Counter 驗證邏輯**:
```python
def increment_counter(self, new_counter: int) -> bool:
    if new_counter <= self.counter:
        raise ValueError(
            f"Counter regression detected! Current: {self.counter}, New: {new_counter}. "
            f"This may indicate a cloned credential or replay attack."
        )
    self.counter = new_counter
    return True
```

**User 模型更新**:
- 新增 `webauthn_user_handle` 欄位（LargeBinary(64)）
- 新增 `credentials` 關聯（一對多）

---

### ✅ Phase 3: WebAuthn 核心配置 (Task 34)

#### WebAuthn 配置模組

**檔案**: `backend/app/core/webauthn.py` (265 行)

**功能**:
1. **環境變數配置** (10 個變數):
   - `WEBAUTHN_ENABLED`: Feature flag（預設 false）
   - `WEBAUTHN_RP_ID`: Relying Party ID（domain only）
   - `WEBAUTHN_RP_NAME`: 顯示名稱
   - `WEBAUTHN_ORIGIN`: 完整 origin URL
   - `WEBAUTHN_CHALLENGE_TTL`: Challenge 過期時間
   - `WEBAUTHN_AUTHENTICATOR_ATTACHMENT`: platform/cross-platform
   - `WEBAUTHN_USER_VERIFICATION`: required/preferred/discouraged
   - `WEBAUTHN_RESIDENT_KEY`: required/preferred/discouraged
   - `WEBAUTHN_TIMEOUT_MS`: 操作逾時時間
   - `WEBAUTHN_ATTESTATION`: none/indirect/direct/enterprise

2. **配置驗證器**:
   ```python
   @field_validator("rp_id")
   def validate_rp_id(cls, v: str) -> str:
       # RP_ID 必須是 domain only（無 protocol、無 port）
       if "://" in v:
           raise ValueError("RP_ID must not contain protocol")
       if ":" in v:
           raise ValueError("RP_ID must not contain port")
       return v.lower()

   @field_validator("origin")
   def validate_origin(cls, v: str) -> str:
       # Origin 必須包含 protocol
       if not v.startswith(("http://", "https://")):
           raise ValueError("Origin must include protocol")
       return v
   ```

3. **輔助函式**:
   - `get_authenticator_selection()`: 認證器選擇標準
   - `get_supported_pub_key_algs()`: 支援的演算法（ES256, RS256）
   - `is_webauthn_enabled()`: 檢查功能是否啟用

**環境變數範例** (`.env.example`):
```bash
WEBAUTHN_ENABLED=false
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME=Wasteland Tarot
WEBAUTHN_ORIGIN=http://localhost:3000
WEBAUTHN_CHALLENGE_TTL=300
WEBAUTHN_AUTHENTICATOR_ATTACHMENT=platform
WEBAUTHN_USER_VERIFICATION=preferred
WEBAUTHN_RESIDENT_KEY=preferred
WEBAUTHN_TIMEOUT_MS=60000
WEBAUTHN_ATTESTATION=none
```

**依賴安裝**:
```toml
# backend/pyproject.toml
dependencies = [
    # ... existing dependencies
    "webauthn>=2.4.0",
]
```

---

### ✅ Phase 4: WebAuthn 服務層 (Tasks 35-36)

**檔案**: `backend/app/services/webauthn_service.py` (500+ 行)

#### 註冊服務 (Task 35)

**功能**:
1. **生成註冊選項** (`generate_registration_options()`):
   ```python
   def generate_registration_options(
       self,
       user: User,
       device_name: Optional[str] = None
   ) -> PublicKeyCredentialCreationOptions:
       # 1. 取得使用者現有憑證（避免重複註冊）
       # 2. 生成 webauthn_user_handle（如果不存在）
       # 3. 建立 authenticator selection criteria
       # 4. 呼叫 py_webauthn.generate_registration_options()
       # 5. 返回 registration options（含 challenge）
   ```

2. **驗證註冊回應** (`verify_registration_response()`):
   ```python
   def verify_registration_response(
       self,
       user: User,
       credential_id: str,
       client_data_json: str,
       attestation_object: str,
       device_name: Optional[str] = None,
       expected_challenge: bytes = None,
   ) -> Credential:
       # 1. 驗證 attestation response
       # 2. 檢查 credential_id 是否已存在
       # 3. 建立 Credential 物件並儲存
       # 4. 返回新建立的憑證
   ```

#### 認證服務 (Task 36)

**功能**:
1. **生成認證選項** (`generate_authentication_options()`):
   ```python
   def generate_authentication_options(
       self,
       user: Optional[User] = None
   ) -> PublicKeyCredentialRequestOptions:
       # 支援兩種模式：
       # 1. Email-guided login: 提供 user，限制使用者憑證
       # 2. Usernameless login: 不提供 user，允許所有憑證
   ```

2. **驗證認證回應** (`verify_authentication_response()`):
   ```python
   def verify_authentication_response(
       self,
       credential_id: str,
       client_data_json: str,
       authenticator_data: str,
       signature: str,
       expected_challenge: bytes,
   ) -> tuple[User, Credential]:
       # 1. 查詢憑證
       # 2. 驗證 assertion response
       # 3. 檢查 counter（防重放攻擊）
       # 4. 更新 last_used_at
       # 5. 返回 (user, credential)
   ```

#### 憑證管理服務

**功能**:
1. **列出憑證** (`list_user_credentials()`): 取得使用者所有 Passkeys
2. **更新名稱** (`update_credential_name()`): 修改裝置名稱
3. **刪除憑證** (`delete_credential()`):
   - 安全檢查：不能刪除最後一個認證方式
   - 檢查使用者是否有其他登入方式（密碼或 OAuth）

---

### ✅ Phase 5: API 端點與 Schemas (Task 37)

#### Pydantic Schemas

**檔案**: `backend/app/schemas/webauthn.py` (150+ 行)

**Schemas 清單**:
1. **註冊相關**:
   - `RegistrationOptionsRequest`: 請求註冊選項
   - `RegistrationOptionsResponse`: 返回 registration options
   - `RegistrationVerificationRequest`: 提交註冊回應
   - `RegistrationVerificationResponse`: 註冊成功回應

2. **認證相關**:
   - `AuthenticationOptionsRequest`: 請求認證選項（可選 email）
   - `AuthenticationOptionsResponse`: 返回 authentication options
   - `AuthenticationVerificationRequest`: 提交認證回應
   - `AuthenticationVerificationResponse`: 認證成功回應（含 JWT tokens）

3. **憑證管理**:
   - `CredentialResponse`: 憑證資訊（隱藏敏感資料）
   - `CredentialListResponse`: 憑證列表
   - `UpdateCredentialNameRequest`: 更新名稱請求
   - `UpdateCredentialNameResponse`: 更新成功回應
   - `DeleteCredentialResponse`: 刪除成功回應

4. **使用者回應**:
   - `UserResponse`: 認證後返回的使用者資訊

#### API 端點

**檔案**: `backend/app/api/webauthn.py` (500+ 行)

**端點清單** (7 個端點):

1. **`POST /api/webauthn/register/options`**:
   - 需要認證（已登入使用者）
   - 生成 registration options
   - 儲存 challenge（session storage）
   - 返回 options 給前端

2. **`POST /api/webauthn/register/verify`**:
   - 需要認證
   - 驗證 attestation response
   - 儲存憑證
   - 返回憑證資訊

3. **`POST /api/webauthn/authenticate/options`**:
   - 不需要認證
   - 支援 Email-guided 和 Usernameless 登入
   - 生成 authentication options
   - 返回 options 給前端

4. **`POST /api/webauthn/authenticate/verify`**:
   - 不需要認證
   - 驗證 assertion response
   - 建立 JWT session（httpOnly cookies）
   - 返回使用者資訊

5. **`GET /api/webauthn/credentials`**:
   - 需要認證
   - 返回使用者所有 Passkeys 清單

6. **`PATCH /api/webauthn/credentials/{credential_id}/name`**:
   - 需要認證
   - 更新憑證名稱

7. **`DELETE /api/webauthn/credentials/{credential_id}`**:
   - 需要認證
   - 刪除憑證（安全檢查）

**Challenge 管理**:
```python
def store_challenge_in_session(request: Request, challenge: bytes):
    """儲存 challenge（暫時使用 session，TODO: Redis）"""
    if not hasattr(request, "session"):
        request.session = {}
    request.session["webauthn_challenge"] = challenge.hex()

def get_challenge_from_session(request: Request) -> Optional[bytes]:
    """取得並刪除 challenge（單次使用）"""
    if hasattr(request, "session") and "webauthn_challenge" in request.session:
        challenge_hex = request.session["webauthn_challenge"]
        del request.session["webauthn_challenge"]  # Single-use
        return bytes.fromhex(challenge_hex)
    return None
```

**Feature Flag 檢查**:
```python
def check_webauthn_enabled():
    """檢查 WebAuthn 功能是否啟用"""
    if not is_webauthn_enabled():
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Passkey 功能目前未啟用"
        )
```

#### 例外類別

**檔案**: `backend/app/core/exceptions.py` (新增 5 個例外)

**例外清單**:
1. `WebAuthnRegistrationError`: Passkey 註冊失敗（400）
2. `WebAuthnAuthenticationError`: Passkey 認證失敗（401）
3. `CredentialNotFoundError`: 找不到憑證（404）
4. `InvalidChallengeError`: Challenge 驗證失敗（400）
5. `CounterError`: Counter 驗證失敗，可能是重放攻擊（403）

---

## 🔑 核心技術實作

### 後端技術

- **WebAuthn 標準**: FIDO2/WebAuthn Level 2
- **Python 套件**: py_webauthn >= 2.4.0
- **資料庫**: PostgreSQL (credentials 表 + webauthn_user_handle)
- **ORM**: SQLAlchemy（Credential 模型）
- **配置管理**: Pydantic Settings
- **API 框架**: FastAPI
- **認證**: JWT tokens + httpOnly cookies

### 安全機制

1. **防重放攻擊**:
   - ✅ Counter 驗證（每次認證遞增）
   - ✅ Challenge 單次使用（驗證後立即刪除）
   - ✅ Origin 和 RP_ID 一致性檢查

2. **憑證安全**:
   - ✅ `credential_id` 唯一性約束
   - ✅ `webauthn_user_handle` 唯一性約束
   - ✅ `user_id` 外鍵關聯（CASCADE DELETE）

3. **資料隱私**:
   - ✅ `to_dict()` 隱藏敏感資料（public_key 不回傳）
   - ✅ `credential_id` 截斷顯示（僅顯示前 20 字元）

4. **認證方式保護**:
   - ✅ 不能刪除最後一個認證方式
   - ✅ 檢查使用者是否有 password 或 OAuth

---

## 📁 檔案清單

### 核心實作檔案

```
backend/
├── docs/
│   └── passkeys-architecture.md (492 行) ✨
├── alembic/versions/
│   └── 006_add_webauthn_support.py (108 行) ✨
├── app/
│   ├── models/
│   │   ├── credential.py (192 行) ✨
│   │   └── user.py (更新：+2 欄位)
│   ├── core/
│   │   ├── webauthn.py (265 行) ✨
│   │   └── exceptions.py (更新：+5 例外)
│   ├── services/
│   │   └── webauthn_service.py (500+ 行) ✨
│   ├── api/
│   │   └── webauthn.py (500+ 行) ✨
│   └── schemas/
│       └── webauthn.py (150+ 行) ✨
├── pyproject.toml (更新：+1 依賴)
└── .env.example (更新：+10 變數)
```

**總計**: 11 個檔案（7 個新增，4 個更新）

### 程式碼統計

| 類型 | 檔案數 | 程式碼行數 |
|------|--------|-----------|
| 架構文件 | 1 | ~492 |
| 資料庫遷移 | 1 | ~108 |
| 模型 | 1 | ~192 |
| 配置 | 1 | ~265 |
| 服務層 | 1 | ~500 |
| API 端點 | 1 | ~500 |
| Schemas | 1 | ~150 |
| 例外類別 | 1 | ~60 |
| **總計** | **8** | **~2,267** |

---

## ✅ 功能完整性

### Passkey 註冊流程（已登入使用者）

```
1. 使用者訪問設定頁面
2. 點擊「新增 Passkey」
3. 前端呼叫 POST /api/webauthn/register/options
   ↓
4. 後端生成 registration options（含 challenge）
5. 後端儲存 challenge（session）
6. 前端收到 options
   ↓
7. 前端呼叫 navigator.credentials.create()
8. 瀏覽器觸發生物辨識（Touch ID, Face ID, etc.）
9. 認證器建立憑證
   ↓
10. 前端呼叫 POST /api/webauthn/register/verify
11. 後端驗證 attestation response
12. 後端檢查 challenge
13. 後端儲存憑證
    ↓
14. 返回成功訊息
15. 前端顯示新增的 Passkey
```

### Passkey 登入流程

#### Email-guided 登入

```
1. 使用者訪問登入頁面
2. 輸入 Email
3. 前端呼叫 POST /api/webauthn/authenticate/options (含 email)
   ↓
4. 後端檢查使用者是否有 Passkey
5. 後端生成 authentication options（限制使用者憑證）
6. 後端儲存 challenge
   ↓
7. 前端呼叫 navigator.credentials.get()
8. 瀏覽器顯示使用者的 Passkeys
9. 使用者選擇並完成生物辨識
   ↓
10. 前端呼叫 POST /api/webauthn/authenticate/verify
11. 後端驗證 assertion response
12. 後端檢查 challenge
13. 後端驗證 counter（防重放）
14. 後端更新 last_used_at
    ↓
15. 後端生成 JWT tokens
16. 後端設定 httpOnly cookies
17. 返回使用者資訊
18. 前端自動登入
```

#### Usernameless 登入

```
1. 使用者訪問登入頁面
2. 點擊「使用 Passkey 登入」（無需輸入 Email）
3. 前端呼叫 POST /api/webauthn/authenticate/options (無 email)
   ↓
4. 後端生成 authentication options（允許所有憑證）
5. 後端儲存 challenge
   ↓
6. 前端呼叫 navigator.credentials.get()
7. 瀏覽器顯示已儲存的所有 Passkeys（Autofill UI）
8. 使用者選擇並完成生物辨識
   ↓
9. 前端呼叫 POST /api/webauthn/authenticate/verify
10. 後端根據 credential_id 查詢使用者
11. （後續流程同 Email-guided 登入）
```

### 憑證管理流程

```
設定頁面 → Passkeys 管理
           ├─ GET /api/webauthn/credentials
           │  └─ 列出所有已註冊的 Passkeys
           │     - 裝置名稱
           │     - 註冊日期
           │     - 最後使用時間
           │     - 認證器類型（平台/漫遊）
           │     - 備份狀態
           │
           ├─ PATCH /api/webauthn/credentials/{id}/name
           │  └─ 更新裝置名稱
           │
           ├─ DELETE /api/webauthn/credentials/{id}
           │  └─ 刪除 Passkey
           │     - 檢查是否為最後一個認證方式
           │     - 需要二次確認
           │
           └─ POST /api/webauthn/register/options
              └─ 新增 Passkey 按鈕
```

---

## 🎯 獨立模組設計驗證

### 不影響現有程式碼

✅ **新增檔案**（7 個）:
- `docs/passkeys-architecture.md`
- `backend/alembic/versions/006_add_webauthn_support.py`
- `backend/app/models/credential.py`
- `backend/app/core/webauthn.py`
- `backend/app/services/webauthn_service.py`
- `backend/app/api/webauthn.py`
- `backend/app/schemas/webauthn.py`

✅ **最小更新**（4 個）:
- `backend/app/models/user.py`: 僅新增 2 欄位和 1 個關聯（不影響現有功能）
- `backend/app/core/exceptions.py`: 僅新增 5 個例外類別（不修改現有例外）
- `backend/pyproject.toml`: 僅新增 1 個依賴
- `backend/.env.example`: 僅新增 10 個環境變數

✅ **OAuth 程式碼零影響**:
- `backend/app/api/oauth.py`: 未修改
- `backend/app/services/oauth_service.py`: 未修改
- `src/hooks/useOAuth.ts`: 未修改
- `src/lib/authStore.ts`: 未修改

✅ **Email 認證零影響**:
- `backend/app/api/auth.py`: 未修改
- `backend/app/services/user_service.py`: 未修改

### Feature Flag 控制

```bash
# 開發環境（預設關閉）
WEBAUTHN_ENABLED=false

# 若要啟用 Passkeys
WEBAUTHN_ENABLED=true
WEBAUTHN_RP_ID=localhost
WEBAUTHN_ORIGIN=http://localhost:3000
```

**行為**:
- `WEBAUTHN_ENABLED=false`: 所有 WebAuthn 端點返回 501 Not Implemented
- `WEBAUTHN_ENABLED=true`: WebAuthn 功能啟用

---

## 🚀 部署準備

### 環境變數檢查清單

**開發環境** (`.env.local`):
```bash
✅ WEBAUTHN_ENABLED=false  # 預設關閉
✅ WEBAUTHN_RP_ID=localhost
✅ WEBAUTHN_RP_NAME=Wasteland Tarot
✅ WEBAUTHN_ORIGIN=http://localhost:3000
✅ WEBAUTHN_CHALLENGE_TTL=300
✅ WEBAUTHN_AUTHENTICATOR_ATTACHMENT=platform
✅ WEBAUTHN_USER_VERIFICATION=preferred
✅ WEBAUTHN_RESIDENT_KEY=preferred
✅ WEBAUTHN_TIMEOUT_MS=60000
✅ WEBAUTHN_ATTESTATION=none
```

**生產環境** (`.env`):
```bash
⏳ WEBAUTHN_ENABLED=false  # 保持關閉直到前端完成
⏳ WEBAUTHN_RP_ID=wasteland-tarot.com  # 實際域名（無 www）
⏳ WEBAUTHN_RP_NAME=Wasteland Tarot
⏳ WEBAUTHN_ORIGIN=https://wasteland-tarot.com  # HTTPS required
⏳ WEBAUTHN_CHALLENGE_TTL=300
⏳ WEBAUTHN_AUTHENTICATOR_ATTACHMENT=platform
⏳ WEBAUTHN_USER_VERIFICATION=preferred
⏳ WEBAUTHN_RESIDENT_KEY=preferred
⏳ WEBAUTHN_TIMEOUT_MS=60000
⏳ WEBAUTHN_ATTESTATION=none
```

### 資料庫遷移

```bash
# 執行遷移
cd backend
alembic upgrade head

# 驗證
psql -d tarot_production -c "SELECT * FROM credentials LIMIT 1;"
psql -d tarot_production -c "SELECT webauthn_user_handle FROM users LIMIT 1;"
```

### 依賴安裝

```bash
# 使用 uv 安裝
cd backend
uv sync

# 驗證
python -c "import webauthn; print(webauthn.__version__)"
# 預期輸出: 2.4.0 或更高
```

---

## 🔜 下一步：Tasks 38-47

### 剩餘任務清單

**Frontend 整合** (Tasks 38-44):
- ⏳ Task 38: 實作 Passkey 註冊無密碼流程（新使用者）
- ⏳ Task 39: 建立前端 WebAuthn 工具（`src/lib/webauthn.ts`）
- ⏳ Task 40: 實作 usePasskey Hook（`src/hooks/usePasskey.ts`）
- ⏳ Task 41: 更新 LoginForm 加入 Passkey 選項
- ⏳ Task 42: 更新 RegisterForm 加入 Passkey 選項
- ⏳ Task 43: Passkey 管理頁面（`src/app/settings/passkeys/page.tsx`）
- ⏳ Task 44: Conditional UI 實作（瀏覽器 autofill）

**測試與文件** (Tasks 45-47):
- ⏳ Task 45: Passkey 錯誤處理和使用者提示
- ⏳ Task 46: Passkey 整合測試
- ⏳ Task 47: 文件和使用者指南

### 實作順序建議

1. **Task 39**: 前端 WebAuthn 工具（最基礎）
2. **Task 40**: usePasskey Hook（封裝 API 呼叫）
3. **Task 41**: LoginForm 整合（Passkey 登入按鈕）
4. **Task 43**: Passkey 管理頁面（憑證列表、新增、刪除）
5. **Task 38**: 新使用者無密碼註冊（需要 Task 39-40 完成）
6. **Task 42**: RegisterForm 整合（Passkey 註冊選項）
7. **Task 44**: Conditional UI（進階功能）
8. **Task 45-47**: 錯誤處理、測試、文件

---

## 📚 參考資源

- **WebAuthn 規範**: https://www.w3.org/TR/webauthn-2/
- **FIDO2 標準**: https://fidoalliance.org/fido2/
- **py_webauthn 文件**: https://github.com/duo-labs/py_webauthn
- **SimpleWebAuthn 文件**: https://simplewebauthn.dev/
- **架構文件**: `docs/passkeys-architecture.md`

---

**專案狀態**: ✅ **Passkeys 後端 100% 完成，可開始前端整合**
**總進度**: 37/47 (79%)
**下一個里程碑**: Tasks 38-47（前端整合與測試）
