# Passkeys/WebAuthn 架構設計

**版本**: 1.0
**日期**: 2025-10-03
**狀態**: 設計階段

---

## 1. 概述

### 1.1 目標

實作 WebAuthn/FIDO2 無密碼認證系統，與現有 OAuth 和 Email/Password 認證並存，提供使用者更安全、便捷的登入體驗。

### 1.2 設計原則

- ✅ **獨立模組**: 不影響現有 OAuth 和 Email 認證
- ✅ **漸進增強**: 不支援的瀏覽器可降級使用其他方式
- ✅ **多認證器**: 使用者可註冊多個 Passkey
- ✅ **安全優先**: 符合 FIDO2 標準和最佳實踐

---

## 2. 三重認證機制

### 2.1 認證方式對比

| 方式 | 優點 | 缺點 | 使用情境 |
|------|------|------|----------|
| **Email + Password** | 通用、熟悉 | 密碼管理負擔、安全性較低 | 傳統使用者 |
| **Google OAuth** | 快速、無需密碼 | 依賴第三方、需要 Google 帳號 | 已有 Google 帳號使用者 |
| **Passkeys** | 最安全、最便捷 | 需要支援的裝置、使用者教育 | 現代裝置使用者 |

### 2.2 認證流程整合

```
使用者 → 登入頁面
         ├─ Email + Password 登入
         ├─ Google OAuth 登入
         └─ Passkey 登入 (條件顯示)
```

---

## 3. 資料庫架構

### 3.1 Schema 設計

#### 3.1.1 Users 表擴展

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS webauthn_user_handle BYTEA UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_webauthn_handle ON users(webauthn_user_handle);
```

**欄位說明**:
- `webauthn_user_handle`: 64 bytes 隨機值，作為 WebAuthn user handle
- 用途: 支援 usernameless authentication
- 唯一性: 每個使用者唯一

#### 3.1.2 Credentials 表（新建）

```sql
CREATE TABLE credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id TEXT UNIQUE NOT NULL,  -- Base64URL encoded
    public_key TEXT NOT NULL,            -- CBOR encoded public key
    counter BIGINT NOT NULL DEFAULT 0,   -- 簽名計數（防重放）
    transports TEXT[],                   -- ['usb', 'nfc', 'ble', 'internal']
    device_name TEXT,                    -- 使用者自訂裝置名稱
    aaguid UUID,                         -- Authenticator AAGUID
    backup_eligible BOOLEAN DEFAULT false,
    backup_state BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,

    CONSTRAINT fk_credentials_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_credentials_user_id ON credentials(user_id);
CREATE INDEX idx_credentials_credential_id ON credentials(credential_id);
CREATE INDEX idx_credentials_last_used ON credentials(last_used_at DESC);
```

**欄位說明**:
- `credential_id`: WebAuthn credential ID (唯一識別)
- `public_key`: 認證器公鑰（CBOR 編碼）
- `counter`: 簽名計數器（每次認證遞增，防重放攻擊）
- `transports`: 支援的傳輸方式（用於優化使用者體驗）
- `device_name`: 方便使用者識別（如 "MacBook Touch ID"）
- `aaguid`: 認證器型號識別碼
- `backup_eligible/backup_state`: 是否可備份（iCloud Keychain 等）

---

## 4. 使用者流程設計

### 4.1 註冊流程

#### 4.1.1 新使用者 Passkey 註冊（無密碼）

```
1. 使用者訪問註冊頁面
2. 選擇「使用 Passkey 註冊」
3. 輸入 Email 和 Name
4. 系統生成 registration options
5. 瀏覽器觸發生物辨識/安全金鑰
6. 認證器建立憑證
7. 前端傳送 attestation response
8. 後端驗證並建立使用者 + 憑證
9. 自動登入，初始化 Karma
```

**特點**:
- 完全無密碼
- `password_hash = NULL`
- `oauth_provider = NULL`
- 自動初始化 Karma 系統

#### 4.1.2 現有使用者綁定 Passkey

```
1. 已登入使用者訪問設定頁面
2. 點擊「新增 Passkey」
3. 系統生成 registration options
4. 瀏覽器觸發認證器
5. 認證器建立憑證
6. 後端驗證並儲存憑證
7. 顯示成功訊息
```

**特點**:
- 需要已認證狀態
- 可新增多個 Passkey
- 不影響現有登入方式

### 4.2 登入流程

#### 4.2.1 Email 引導登入（Autofill）

```
1. 使用者訪問登入頁面
2. 輸入 Email
3. 系統檢查該使用者是否有 Passkey
4. 若有，顯示「使用 Passkey 登入」按鈕
5. 點擊後觸發認證器
6. 認證器提供簽名
7. 後端驗證簽名和 counter
8. 建立會話並返回 token
```

#### 4.2.2 Usernameless 登入（條件式 UI）

```
1. 使用者訪問登入頁面
2. 點擊「使用 Passkey 登入」（無需輸入 Email）
3. 瀏覽器顯示已儲存的 Passkeys 列表
4. 使用者選擇並完成生物辨識
5. 認證器提供簽名和 user handle
6. 後端根據 credential_id 查詢使用者
7. 驗證簽名，建立會話
```

**特點**:
- 完全無需輸入任何資訊
- 依賴瀏覽器 autofill UI
- 需要 `webauthn_user_handle` 支援

### 4.3 管理流程

```
設定頁面 → Passkeys 管理
           ├─ 列出所有已註冊的 Passkeys
           ├─ 顯示裝置名稱、註冊日期、最後使用
           ├─ 允許編輯裝置名稱
           ├─ 允許刪除 Passkey
           └─ 新增 Passkey 按鈕
```

**安全機制**:
- 若只剩一個認證方式，警告使用者
- 刪除需要二次確認
- 記錄刪除事件（審計日誌）

---

## 5. 技術架構

### 5.1 後端架構

```
backend/app/
├── models/
│   └── credential.py          # Credential SQLAlchemy 模型
├── services/
│   └── webauthn_service.py    # WebAuthn 核心邏輯
├── api/
│   └── webauthn.py            # WebAuthn API 端點
├── core/
│   ├── webauthn.py            # WebAuthn 配置
│   └── exceptions.py          # WebAuthn 例外類別（擴展）
└── schemas/
    └── webauthn.py            # Pydantic schemas
```

**獨立性**:
- 新增檔案，不修改現有檔案
- 僅在 `main.py` 註冊新的 router
- 可選擇性載入（feature flag）

### 5.2 前端架構

```
src/
├── lib/
│   ├── webauthn.ts            # WebAuthn 工具函式
│   └── webauthnClient.ts      # SimpleWebAuthn 封裝
├── hooks/
│   └── usePasskey.ts          # Passkey React Hook
├── components/
│   └── passkeys/
│       ├── PasskeyLoginButton.tsx
│       ├── PasskeyRegisterButton.tsx
│       └── PasskeyManager.tsx
└── app/
    └── settings/
        └── passkeys/
            └── page.tsx       # Passkey 管理頁面
```

**獨立性**:
- 新增元件，不修改現有 LoginForm/RegisterForm 核心邏輯
- 透過條件渲染整合 Passkey 按鈕
- 可透過 feature flag 控制顯示

---

## 6. WebAuthn 參數配置

### 6.1 Relying Party (RP) 設定

```python
# backend/app/core/webauthn.py

class WebAuthnConfig:
    # Relying Party ID (域名，不含協議和埠號)
    RP_ID = os.getenv("WEBAUTHN_RP_ID", "localhost")

    # Relying Party Name (顯示名稱)
    RP_NAME = os.getenv("WEBAUTHN_RP_NAME", "Wasteland Tarot")

    # Origin (包含協議和埠號)
    ORIGIN = os.getenv("WEBAUTHN_ORIGIN", "http://localhost:3000")

    # Challenge TTL (秒)
    CHALLENGE_TTL = int(os.getenv("WEBAUTHN_CHALLENGE_TTL", "300"))

    # 支援的認證器類型
    AUTHENTICATOR_SELECTION = {
        "authenticatorAttachment": "platform",  # 偏好平台認證器
        "requireResidentKey": False,
        "residentKey": "preferred",  # 支援 discoverable credentials
        "userVerification": "preferred"
    }
```

### 6.2 環境變數

**開發環境 (`.env.local`)**:
```bash
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME=Wasteland Tarot
WEBAUTHN_ORIGIN=http://localhost:3000
WEBAUTHN_CHALLENGE_TTL=300
```

**生產環境 (`.env`)**:
```bash
WEBAUTHN_RP_ID=wasteland-tarot.com
WEBAUTHN_RP_NAME=Wasteland Tarot
WEBAUTHN_ORIGIN=https://wasteland-tarot.com
WEBAUTHN_CHALLENGE_TTL=300
```

---

## 7. Challenge 管理策略

### 7.1 Redis 儲存方案（推薦）

```python
# Key 格式
challenge_key = f"webauthn:challenge:{session_id}"

# 儲存（TTL = 5 分鐘）
redis_client.setex(challenge_key, 300, challenge_bytes)

# 驗證後刪除（防止重放）
redis_client.delete(challenge_key)
```

**優點**:
- 自動過期
- 高效能
- 支援分散式

**缺點**:
- 需要 Redis 運行

### 7.2 HTTP-Only Cookie 方案（備選）

```python
# 儲存
response.set_cookie(
    key="webauthn_challenge",
    value=base64_challenge,
    httponly=True,
    secure=True,
    samesite="lax",
    max_age=300
)

# 驗證後清除
response.delete_cookie("webauthn_challenge")
```

**優點**:
- 無需外部依賴
- 實作簡單

**缺點**:
- 安全性稍低
- 無法跨頁面共享

---

## 8. 安全考量

### 8.1 防重放攻擊

- ✅ 驗證 `counter` 遞增
- ✅ Challenge 單次使用（驗證後立即刪除）
- ✅ 檢查 `origin` 和 `rpId` 一致性

### 8.2 防憑證劫持

- ✅ `credential_id` 唯一性約束
- ✅ `webauthn_user_handle` 唯一性約束
- ✅ 綁定 `user_id` 外鍵關聯

### 8.3 審計日誌

記錄以下事件:
- Passkey 註冊（成功/失敗）
- Passkey 認證（成功/失敗）
- Passkey 刪除
- 可疑活動（counter 倒退）

---

## 9. 錯誤處理

### 9.1 後端例外類別

```python
class WebAuthnRegistrationError(Exception):
    """Passkey 註冊失敗"""
    status_code = 400

class WebAuthnAuthenticationError(Exception):
    """Passkey 認證失敗"""
    status_code = 401

class CredentialNotFoundError(Exception):
    """憑證不存在"""
    status_code = 404

class InvalidChallengeError(Exception):
    """Challenge 驗證失敗"""
    status_code = 400

class CounterError(Exception):
    """Counter 驗證失敗（可能是重放攻擊）"""
    status_code = 403
```

### 9.2 前端錯誤映射

| WebAuthn Error Code | 中文訊息 |
|---------------------|---------|
| `NotAllowedError` | Passkey 認證已取消 |
| `InvalidStateError` | 此 Passkey 已註冊 |
| `NotSupportedError` | 您的裝置不支援 Passkey |
| `SecurityError` | 安全錯誤，請確認網站設定 |
| `UnknownError` | 未知錯誤，請稍後再試 |

---

## 10. 瀏覽器相容性

### 10.1 支援檢測

```typescript
function isWebAuthnSupported(): boolean {
  return (
    window?.PublicKeyCredential !== undefined &&
    navigator?.credentials?.create !== undefined
  );
}
```

### 10.2 降級方案

- ❌ 不支援 WebAuthn: 隱藏 Passkey 選項
- ✅ 顯示提示: "您的瀏覽器不支援 Passkey，請使用 Email 或 Google 登入"
- ✅ 提供教育連結: "了解更多關於 Passkey"

---

## 11. 測試策略

### 11.1 單元測試

- ✅ WebAuthn service 邏輯測試
- ✅ Challenge 生成和驗證
- ✅ Counter 檢查邏輯
- ✅ 例外處理

### 11.2 整合測試

- ✅ 完整註冊流程（mock WebAuthn）
- ✅ 完整認證流程（mock WebAuthn）
- ✅ 憑證管理 CRUD

### 11.3 手動測試

- ✅ 各種認證器測試（Touch ID, Windows Hello, 安全金鑰）
- ✅ 各瀏覽器測試（Chrome, Safari, Firefox）
- ✅ 跨裝置同步測試（iCloud Keychain）

---

## 12. 部署檢查清單

### 12.1 開發環境

- [ ] Redis 已安裝並運行
- [ ] 環境變數已配置（`.env.local`）
- [ ] `RP_ID = localhost`
- [ ] `ORIGIN = http://localhost:3000`

### 12.2 生產環境

- [ ] HTTPS 已啟用
- [ ] 域名已確認
- [ ] `RP_ID = 實際域名`（不含 www）
- [ ] `ORIGIN = https://實際域名`
- [ ] Redis 生產環境配置
- [ ] 監控和日誌已設定

---

## 13. 未來擴展

### 13.1 企業功能（可選）

- Attestation 驗證（驗證認證器真實性）
- 企業政策管理
- 批量憑證撤銷

### 13.2 進階功能（可選）

- Conditional UI（瀏覽器 autofill）
- Cross-device authentication
- Passkey 備份和同步狀態顯示

---

## 14. 參考資源

- **WebAuthn 規範**: https://www.w3.org/TR/webauthn-2/
- **FIDO2 標準**: https://fidoalliance.org/fido2/
- **py_webauthn 文件**: https://duo-labs.github.io/py_webauthn/
- **SimpleWebAuthn 文件**: https://simplewebauthn.dev/

---

**版本歷史**:
- v1.0 (2025-10-03): 初始設計
