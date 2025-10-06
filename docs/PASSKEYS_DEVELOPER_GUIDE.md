# Passkeys 開發者指南

## 目錄

- [架構概覽](#架構概覽)
- [後端實作](#後端實作)
- [前端實作](#前端實作)
- [安全機制](#安全機制)
- [擴展指南](#擴展指南)
- [測試策略](#測試策略)
- [部署注意事項](#部署注意事項)

---

## 架構概覽

### 技術棧

**後端**:
- FastAPI (Python 3.11+)
- py_webauthn (v2.4.0) - WebAuthn 伺服器端實作
- SQLAlchemy - ORM
- PostgreSQL / Supabase - 資料庫

**前端**:
- Next.js 14+ (App Router)
- React 18+
- TypeScript
- @simplewebauthn/types - WebAuthn 類型定義

### 資料流程

```
使用者註冊流程（無密碼）:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────>│   FastAPI   │────>│  Database   │
│             │     │             │     │             │
│ 1. 請求選項 │     │ 2. 產生     │     │ 3. 檢查     │
│             │     │   challenge │     │   email     │
│             │     │             │     │   重複      │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │ 4. 返回選項       │
       │<──────────────────│
       │                   │
       │ 5. 使用者生物     │
       │    辨識驗證       │
       │                   │
       │ 6. 提交憑證       │
       │──────────────────>│
                           │
                           │ 7. 驗證憑證
                           │ 8. 建立使用者
                           │ 9. 建立憑證
                           │ 10. 初始化 Karma
                           │ 11. 生成 JWT
                           │
                      ┌────┴────┐
                      │ Success │
                      └─────────┘
```

---

## 後端實作

### 資料庫模型

#### User Model (`app/models/user.py`)

```python
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=True)  # 可為 NULL（Passkey 使用者）
    oauth_provider = Column(String, nullable=True)
    webauthn_user_handle = Column(LargeBinary, nullable=True)  # 64 bytes

    # 關聯
    credentials = relationship("Credential", back_populates="user")
```

#### Credential Model (`app/models/credential.py`)

```python
class Credential(Base):
    __tablename__ = "credentials"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    credential_id = Column(String, unique=True, nullable=False, index=True)
    public_key = Column(Text, nullable=False)  # hex 編碼
    counter = Column(Integer, default=0)  # 防重放攻擊
    transports = Column(String, nullable=True)  # JSON array
    device_name = Column(String, nullable=True)
    aaguid = Column(String, nullable=True)
    backup_eligible = Column(Boolean, default=False)
    backup_state = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)

    # 關聯
    user = relationship("User", back_populates="credentials")
```

---

### WebAuthn 服務層

#### WebAuthnService (`app/services/webauthn_service.py`)

**核心方法**:

##### 1. 產生註冊選項（新使用者）

```python
def generate_registration_options_for_new_user(
    self,
    email: str,
    name: str,
) -> PublicKeyCredentialCreationOptions:
    """
    為新使用者產生 WebAuthn 註冊選項

    Args:
        email: 使用者 email
        name: 使用者顯示名稱

    Returns:
        PublicKeyCredentialCreationOptions: 註冊選項

    Raises:
        UserAlreadyExistsError: 如果 email 已存在
    """
    # 1. 檢查 email 是否已存在
    existing_user = self.db.execute(
        select(User).where(User.email == email.lower())
    ).scalar_one_or_none()

    if existing_user:
        raise UserAlreadyExistsError(f"Email {email} 已被註冊")

    # 2. 產生臨時 user_handle（64 bytes random）
    temp_user_handle = secrets.token_bytes(64)

    # 3. 建立認證器選擇標準
    authenticator_selection = AuthenticatorSelectionCriteria(
        authenticator_attachment=self._get_authenticator_attachment(),
        resident_key=self._get_resident_key_requirement(),
        user_verification=self._get_user_verification(),
    )

    # 4. 產生註冊選項
    options = generate_registration_options(
        rp_id=self.config.rp_id,
        rp_name=self.config.rp_name,
        user_id=temp_user_handle,
        user_name=email,
        user_display_name=name,
        exclude_credentials=[],  # 新使用者無現有憑證
        authenticator_selection=authenticator_selection,
        attestation=self._get_attestation_preference(),
        supported_pub_key_algs=self._get_supported_algorithms(),
        timeout=self.config.timeout_ms,
    )

    return options
```

##### 2. 註冊新使用者

```python
def register_new_user_with_passkey(
    self,
    email: str,
    name: str,
    credential_id: str,
    client_data_json: str,
    attestation_object: str,
    device_name: Optional[str],
    expected_challenge: bytes,
) -> tuple[User, Credential]:
    """
    使用 Passkey 註冊新使用者（無密碼）

    Args:
        email: 使用者 email
        name: 使用者名稱
        credential_id: Base64URL 編碼的憑證 ID
        client_data_json: Base64URL 編碼的 client data
        attestation_object: Base64URL 編碼的 attestation object
        device_name: 裝置名稱
        expected_challenge: 預期的 challenge（來自 session）

    Returns:
        tuple[User, Credential]: 建立的使用者和憑證

    Raises:
        UserAlreadyExistsError: 如果 email 已存在
        WebAuthnRegistrationError: 如果驗證失敗
    """
    # 1. 檢查 email 是否已存在
    existing_user = self.db.execute(
        select(User).where(User.email == email.lower())
    ).scalar_one_or_none()

    if existing_user:
        raise UserAlreadyExistsError(f"Email {email} 已被註冊")

    # 2. 建立新使用者（無密碼）
    user = User(
        email=email.lower(),
        name=name,
        password_hash=None,  # 無密碼
        oauth_provider=None,  # 非 OAuth
        is_active=True,
        is_verified=False,
        webauthn_user_handle=secrets.token_bytes(64),  # 產生 user_handle
    )

    self.db.add(user)
    self.db.flush()  # 取得 user.id

    # 3. 驗證 attestation response
    verification = verify_registration_response(
        credential=attestation_object,
        expected_challenge=expected_challenge,
        expected_origin=self.config.origin,
        expected_rp_id=self.config.rp_id,
    )

    # 4. 建立憑證
    credential = Credential(
        user_id=user.id,
        credential_id=credential_id,
        public_key=verification.credential_public_key.hex(),
        counter=verification.sign_count,
        transports=verification.credential_device_type,
        device_name=device_name or "未命名裝置",
        aaguid=verification.aaguid,
        backup_eligible=verification.credential_backed_up,
        backup_state=verification.credential_backed_up,
    )

    self.db.add(credential)
    self.db.commit()
    self.db.refresh(user)
    self.db.refresh(credential)

    return user, credential
```

---

### API 端點

#### POST /api/webauthn/register-new/options

**請求**:
```json
{
  "email": "user@example.com",
  "name": "User Name"
}
```

**回應**:
```json
{
  "options": {
    "challenge": "base64url_encoded_challenge",
    "rp": {
      "id": "example.com",
      "name": "Example App"
    },
    "user": {
      "id": "base64url_encoded_user_handle",
      "name": "user@example.com",
      "displayName": "User Name"
    },
    "pubKeyCredParams": [...],
    "timeout": 60000,
    "attestation": "none",
    "authenticatorSelection": {...}
  },
  "challenge": "hex_encoded_challenge"
}
```

#### POST /api/webauthn/register-new/verify

**請求**:
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "credential_id": "base64url_encoded_id",
  "client_data_json": "base64url_encoded_data",
  "attestation_object": "base64url_encoded_object",
  "device_name": "iPhone 15"
}
```

**回應**:
```json
{
  "success": true,
  "access_token": "jwt_token",
  "refresh_token": "jwt_token",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "name": "User Name"
  },
  "credential": {
    "id": 456,
    "device_name": "iPhone 15",
    "created_at": "2025-10-03T12:00:00Z"
  },
  "message": "Passkey 註冊成功，歡迎加入！"
}
```

---

## 前端實作

### WebAuthn 工具函式 (`src/lib/webauthn.ts`)

#### Base64URL 編解碼

```typescript
export function base64URLEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function base64URLDecode(base64url: string): ArrayBuffer {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (base64.length % 4)) % 4;
  base64 += '='.repeat(padLength);

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
```

#### 開始註冊

```typescript
export async function startRegistration(
  options: PublicKeyCredentialCreationOptionsJSON
): Promise<RegistrationResponseJSON> {
  if (!isWebAuthnSupported()) {
    throw new Error('您的瀏覽器不支援 Passkey');
  }

  // 轉換選項格式
  const publicKeyOptions: PublicKeyCredentialCreationOptions = {
    challenge: base64URLDecode(options.challenge as unknown as string),
    rp: options.rp,
    user: {
      id: base64URLDecode(options.user.id as unknown as string),
      name: options.user.name,
      displayName: options.user.displayName,
    },
    pubKeyCredParams: options.pubKeyCredParams,
    timeout: options.timeout,
    excludeCredentials: options.excludeCredentials?.map((cred) => ({
      id: base64URLDecode(cred.id as unknown as string),
      type: cred.type,
      transports: cred.transports,
    })),
    authenticatorSelection: options.authenticatorSelection,
    attestation: options.attestation,
  };

  // 呼叫瀏覽器 API
  const credential = await navigator.credentials.create({
    publicKey: publicKeyOptions,
  }) as PublicKeyCredential;

  // 格式化回應
  const response = credential.response as AuthenticatorAttestationResponse;

  return {
    id: credential.id,
    rawId: base64URLEncode(credential.rawId),
    response: {
      clientDataJSON: base64URLEncode(response.clientDataJSON),
      attestationObject: base64URLEncode(response.attestationObject),
      transports: (response as any).getTransports?.() || [],
    },
    type: credential.type,
    clientExtensionResults: credential.getClientExtensionResults(),
    authenticatorAttachment: (credential as any).authenticatorAttachment,
  };
}
```

---

### usePasskey Hook (`src/hooks/usePasskey.ts`)

```typescript
export function usePasskey(): UsePasskeyReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();

  const isSupported = isWebAuthnSupported();

  const registerNewUserWithPasskey = useCallback(
    async (email: string, name: string, deviceName?: string) => {
      if (!isSupported) {
        setError('您的瀏覽器不支援 Passkey');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Step 1: 取得註冊選項
        const optionsResponse = await fetch(`${API_BASE_URL}/api/webauthn/register-new/options`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, name }),
        });

        if (!optionsResponse.ok) {
          const errorData = await optionsResponse.json();
          throw new Error(errorData.detail || '取得註冊選項失敗');
        }

        const { options } = await optionsResponse.json();

        // Step 2: 呼叫瀏覽器 WebAuthn API
        const credential = await startRegistration(options);

        // Step 3: 提交憑證驗證
        const verifyResponse = await fetch(`${API_BASE_URL}/api/webauthn/register-new/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email,
            name,
            credential_id: credential.id,
            client_data_json: credential.response.clientDataJSON,
            attestation_object: credential.response.attestationObject,
            device_name: deviceName || '我的裝置',
          }),
        });

        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json();
          throw new Error(errorData.detail || '註冊失敗');
        }

        const { user, access_token } = await verifyResponse.json();

        // Step 4: 更新狀態並跳轉
        setUser(user);
        setToken(access_token);
        router.push('/profile');
      } catch (err: any) {
        const errorMessage = getLocalizedErrorMessage(err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [isSupported, router, setUser, setToken]
  );

  return {
    isLoading,
    error,
    isSupported,
    registerNewUserWithPasskey,
    // ... 其他方法
  };
}
```

---

## 安全機制

### 1. Challenge 驗證

**流程**:
1. 伺服器產生隨機 challenge（32 bytes）
2. 儲存在 session 中（單次使用）
3. 客戶端簽名 challenge
4. 伺服器驗證簽名和 challenge 一致性
5. 驗證後立即刪除 challenge

**防護**:
- 防重放攻擊
- 防中間人攻擊

### 2. Origin 驗證

```python
verification = verify_registration_response(
    credential=attestation_object,
    expected_challenge=expected_challenge,
    expected_origin=self.config.origin,  # 驗證來源
    expected_rp_id=self.config.rp_id,    # 驗證 RP ID
)
```

**防護**:
- 防釣魚攻擊
- 確保憑證只能在正確的網域使用

### 3. Counter 驗證

```python
credential.counter = verification.sign_count

# 每次使用時
if current_counter <= stored_counter:
    raise SignatureCounterError("可能的 credential 複製攻擊")
```

**防護**:
- 防憑證複製
- 防憑證匯出攻擊

### 4. User Handle

```python
webauthn_user_handle = secrets.token_bytes(64)  # 64 bytes random
```

**用途**:
- Usernameless 登入的唯一識別
- 不洩漏使用者資訊
- 支援跨裝置同步

---

## 擴展指南

### 新增 Passkey 登入功能

1. **後端**: 實作驗證端點

```python
@router.post("/authenticate/options")
async def generate_authentication_options(
    request: Request,
    email: Optional[str] = None,
    service: WebAuthnService = Depends(get_webauthn_service)
):
    # 產生驗證選項
    if email:
        # Email-guided
        options = service.generate_authentication_options_for_user(email)
    else:
        # Usernameless
        options = service.generate_usernameless_authentication_options()

    store_challenge_in_session(request, options.challenge)
    return {"options": options_to_json(options)}
```

2. **前端**: 實作驗證流程

```typescript
const authenticateWithPasskey = async (email?: string) => {
  // 1. 取得驗證選項
  const options = await fetch('/api/webauthn/authenticate/options', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }).then(r => r.json());

  // 2. 呼叫瀏覽器 API
  const credential = await startAuthentication(options, !email);

  // 3. 提交驗證
  const result = await fetch('/api/webauthn/authenticate/verify', {
    method: 'POST',
    body: JSON.stringify(credential),
  }).then(r => r.json());

  return result;
};
```

---

### 支援安全金鑰（FIDO2）

修改認證器選擇標準:

```python
authenticator_selection = AuthenticatorSelectionCriteria(
    authenticator_attachment=None,  # 允許所有類型
    resident_key="preferred",       # 優先使用 resident key
    user_verification="preferred",  # 優先使用 user verification
)
```

---

### 新增 Attestation 驗證

```python
def verify_attestation(
    self,
    attestation_object: bytes,
    fmt: str,
) -> bool:
    """驗證 attestation statement"""
    if fmt == "none":
        return True  # 不要求 attestation

    # 實作特定格式的 attestation 驗證
    # 例如: packed, fido-u2f, android-key, etc.
    pass
```

---

## 測試策略

### 單元測試

```python
# backend/tests/unit/test_webauthn_service.py

def test_generate_registration_options_new_user(webauthn_service, mock_db):
    """測試為新使用者產生註冊選項"""
    mock_db.execute.return_value.scalar_one_or_none.return_value = None

    options = webauthn_service.generate_registration_options_for_new_user(
        email="new@example.com",
        name="New User"
    )

    assert options is not None
    assert hasattr(options, 'challenge')
    assert options.user.name == "new@example.com"
```

### 整合測試

```python
# backend/tests/integration/test_passkey_registration_flow.py

def test_complete_registration_flow(client: TestClient):
    """測試完整註冊流程"""
    # 1. 取得選項
    options_response = client.post(
        "/api/webauthn/register-new/options",
        json={"email": "test@example.com", "name": "Test User"}
    )
    assert options_response.status_code == 200

    # 2. 模擬驗證
    with patch('app.services.webauthn_service.verify_registration_response'):
        verify_response = client.post(
            "/api/webauthn/register-new/verify",
            json={...}
        )
        assert verify_response.status_code == 201
```

### 端對端測試（可選）

```typescript
// e2e/passkey-registration.spec.ts

test('使用者可以使用 Passkey 註冊', async ({ page, context }) => {
  // 需要使用 Virtual Authenticator API
  await context.addVirtualAuthenticator({
    protocol: 'ctap2',
    transport: 'internal',
    hasResidentKey: true,
    hasUserVerification: true,
  });

  await page.goto('/auth/register');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="name"]', 'Test User');
  await page.click('button:has-text("使用 Passkey 註冊")');

  // 驗證成功跳轉
  await expect(page).toHaveURL('/profile');
});
```

---

## 部署注意事項

### 1. HTTPS 必須

WebAuthn 僅在 HTTPS 環境下運作（localhost 除外）

**Nginx 配置**:
```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. RP ID 配置

**生產環境** (`.env`):
```bash
WEBAUTHN_RP_ID=example.com
WEBAUTHN_RP_NAME=Example App
WEBAUTHN_ORIGIN=https://example.com
```

**開發環境** (`.env.local`):
```bash
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME=Example App (Dev)
WEBAUTHN_ORIGIN=http://localhost:3000
```

### 3. Session 管理

確保 session 的安全性:

```python
from starlette.middleware.sessions import SessionMiddleware

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    session_cookie="session",
    max_age=3600,  # 1 hour
    same_site="lax",
    https_only=True,  # 生產環境必須
)
```

### 4. CORS 配置

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

### 5. 資料庫遷移

```bash
# 建立遷移
alembic revision --autogenerate -m "Add webauthn_user_handle to users"

# 執行遷移
alembic upgrade head
```

### 6. 監控和日誌

```python
import logging

logger = logging.getLogger(__name__)

def register_new_user_with_passkey(...):
    try:
        # ... 註冊邏輯
        logger.info(f"New user registered via Passkey: {email}")
    except Exception as e:
        logger.error(f"Passkey registration failed: {email}, error: {e}")
        raise
```

---

## 效能優化

### 1. 快取 User Handle

```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_user_handle(user_id: int) -> bytes:
    """快取 user_handle 查詢"""
    user = db.query(User).filter(User.id == user_id).first()
    return user.webauthn_user_handle
```

### 2. 批次查詢憑證

```python
def get_user_credentials(user_id: int) -> List[Credential]:
    """一次查詢所有憑證"""
    return db.query(Credential).filter(
        Credential.user_id == user_id
    ).all()
```

### 3. 前端預載入

```typescript
// 預先檢查瀏覽器支援
useEffect(() => {
  const checkSupport = async () => {
    const supported = isWebAuthnSupported();
    const conditionalUI = await isConditionalUISupported();
    // 快取結果
  };
  checkSupport();
}, []);
```

---

## 常見陷阱

### ❌ 錯誤: 直接儲存 ArrayBuffer

```typescript
// 錯誤
fetch('/api', {
  body: JSON.stringify({ id: credential.rawId })  // ArrayBuffer 無法序列化
});

// 正確
fetch('/api', {
  body: JSON.stringify({ id: base64URLEncode(credential.rawId) })
});
```

### ❌ 錯誤: 忘記驗證 Challenge

```python
# 錯誤
verification = verify_registration_response(
    credential=attestation_object,
    # 沒有驗證 challenge！
)

# 正確
verification = verify_registration_response(
    credential=attestation_object,
    expected_challenge=expected_challenge,
    expected_origin=self.config.origin,
    expected_rp_id=self.config.rp_id,
)
```

### ❌ 錯誤: RP ID 不一致

```python
# 註冊時
rp_id = "example.com"

# 驗證時
rp_id = "www.example.com"  # 不一致！憑證無效
```

---

## 更多資源

- [WebAuthn Spec](https://www.w3.org/TR/webauthn-2/)
- [py_webauthn 文件](https://github.com/duo-labs/py_webauthn)
- [SimpleWebAuthn 文件](https://simplewebauthn.dev/)
- [FIDO Alliance](https://fidoalliance.org/specifications/)

---

**版本**: 1.0.0
**最後更新**: 2025-10-03
