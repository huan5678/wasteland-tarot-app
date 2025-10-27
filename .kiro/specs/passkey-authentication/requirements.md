# Requirements Document

## Project Description (Input)
實作 passkey (WebAuthn) 無密碼登入系統，支援生物辨識（指紋、Face ID）和安全金鑰。包含註冊流程、登入流程、credential 管理，以及完整的前後端實作。確保符合 FIDO2/WebAuthn 標準，並提供良好的使用者體驗。

## Introduction

本需求文件定義廢土塔羅平台的 Passkey 無密碼認證系統。該系統建立在現有的 WebAuthn 基礎實作之上，完善註冊流程、登入流程、credential 管理功能，並確保符合 FIDO2/WebAuthn 標準，提供安全且流暢的使用者體驗。

**Business Value:**
- **提升安全性**: 消除密碼洩露風險，使用公鑰加密技術
- **改善用戶體驗**: 一鍵生物辨識登入，無需記憶密碼
- **降低支援成本**: 減少密碼重設、帳號鎖定等客服需求
- **技術領先**: 採用現代 FIDO2 標準，提升品牌形象

## Requirements

### Requirement 1: Passkey 註冊流程（新用戶首次註冊）

**Objective:** 作為一位新用戶，我希望能夠直接使用 passkey 完成帳號註冊，這樣我就不需要設定密碼，可以立即開始使用平台。

#### Acceptance Criteria

1. WHEN 用戶訪問註冊頁面 THEN 認證服務 SHALL 顯示「使用 Passkey 註冊」選項
2. WHEN 用戶點擊「使用 Passkey 註冊」按鈕 THEN 認證服務 SHALL 引導用戶輸入 email 地址和顯示名稱
3. IF email 已被註冊 THEN 認證服務 SHALL 顯示錯誤訊息「此 email 已被使用」並建議用戶改用登入功能
4. WHEN 用戶提交有效的 email 和顯示名稱 THEN 後端服務 SHALL 產生 WebAuthn registration options 並回傳給前端
5. WHEN 前端收到 registration options THEN 瀏覽器 SHALL 呼叫 `navigator.credentials.create()` 觸發生物辨識或安全金鑰驗證
6. IF 瀏覽器不支援 WebAuthn THEN 認證服務 SHALL 顯示降級選項「改用 email/密碼註冊」
7. WHEN 用戶完成生物辨識驗證 THEN 瀏覽器 SHALL 產生 attestation response 並傳送至後端進行驗證
8. WHEN 後端收到 attestation response THEN 後端服務 SHALL 驗證 signature、challenge、origin 的正確性
9. IF attestation 驗證成功 THEN 後端服務 SHALL 建立新用戶帳號、儲存 credential、產生 JWT tokens 並回傳給前端
10. WHEN 前端收到成功回應和 tokens THEN 認證服務 SHALL 儲存 tokens 至 authStore 並導向用戶至 dashboard
11. IF 註冊流程中任何步驟失敗 THEN 認證服務 SHALL 顯示具體錯誤訊息並允許用戶重試

### Requirement 2: Passkey 登入流程（已註冊用戶）

**Objective:** 作為一位已註冊的用戶，我希望能夠使用 passkey 快速登入，這樣我就不需要輸入密碼，可以立即存取我的帳號。

#### Acceptance Criteria

1. WHEN 用戶訪問登入頁面 THEN 認證服務 SHALL 顯示「使用 Passkey 登入」按鈕
2. WHEN 用戶點擊「使用 Passkey 登入」按鈕 THEN 後端服務 SHALL 產生 WebAuthn authentication options 並回傳給前端
3. WHEN 前端收到 authentication options THEN 瀏覽器 SHALL 呼叫 `navigator.credentials.get()` 觸發生物辨識或安全金鑰驗證
4. IF 用戶有多個 passkey THEN 瀏覽器 SHALL 顯示選擇器讓用戶選擇要使用的 credential
5. WHEN 用戶完成生物辨識驗證 THEN 瀏覽器 SHALL 產生 assertion response 並傳送至後端進行驗證
6. WHEN 後端收到 assertion response THEN 後端服務 SHALL 驗證 signature、challenge、origin 並查詢對應的用戶帳號
7. IF assertion 驗證成功且找到對應用戶 THEN 後端服務 SHALL 更新 credential 使用記錄（last_used_at, usage_count）並產生新的 JWT tokens
8. WHEN 前端收到成功回應和 tokens THEN 認證服務 SHALL 更新 authStore 狀態並導向用戶至 dashboard
9. IF 驗證失敗或找不到對應 credential THEN 認證服務 SHALL 顯示錯誤訊息並建議用戶嘗試其他登入方式
10. WHILE 登入流程進行中 THE 認證服務 SHALL 顯示載入指示器並禁用表單提交

### Requirement 3: Conditional UI（Autofill）支援

**Objective:** 作為一位使用者，我希望在登入表單中能夠自動填入可用的 passkey，這樣我就能更快速地登入而不需要額外點擊按鈕。

#### Acceptance Criteria

1. WHEN 用戶訪問登入頁面且瀏覽器支援 Conditional UI THEN 認證服務 SHALL 在 email 輸入框啟用 `autocomplete="webauthn"` 屬性
2. WHEN 用戶點擊 email 輸入框 THEN 瀏覽器 SHALL 自動顯示可用的 passkey credentials 在 autofill 選單中
3. IF 用戶選擇 autofill 選單中的 passkey THEN 瀏覽器 SHALL 自動觸發生物辨識驗證流程
4. WHEN 生物辨識驗證完成 THEN 認證服務 SHALL 自動提交登入請求並完成登入
5. IF 瀏覽器不支援 Conditional UI THEN 認證服務 SHALL 降級至標準的「使用 Passkey 登入」按鈕方式

### Requirement 4: Passkey 管理（已登入用戶）

**Objective:** 作為一位已登入的用戶，我希望能夠管理我的 passkeys（新增、重新命名、刪除），這樣我就能在多個裝置上使用不同的 passkeys 並保持帳號安全。

#### Acceptance Criteria

1. WHEN 用戶訪問帳號設定頁面 THEN 認證服務 SHALL 顯示「Passkeys 管理」區塊
2. WHEN 用戶進入 Passkeys 管理區塊 THEN 後端服務 SHALL 載入並顯示所有已註冊的 passkeys 清單
3. WHERE 每個 passkey 項目 THE 認證服務 SHALL 顯示：credential 名稱、建立日期、最後使用日期、裝置類型圖示（推測）
4. WHEN 用戶點擊「新增 Passkey」按鈕 THEN 認證服務 SHALL 啟動新增 passkey 的註冊流程（類似初次註冊但用於現有帳號）
5. WHEN 後端產生新增 passkey 的 registration options THEN 後端服務 SHALL 包含 `excludeCredentials` 參數以防止重複註冊相同的 authenticator
6. WHEN 用戶完成新增 passkey 的生物辨識驗證 THEN 後端服務 SHALL 儲存新的 credential 並重新載入 passkeys 清單
7. IF 用戶達到最大 passkey 數量限制（10 個）THEN 認證服務 SHALL 禁用「新增 Passkey」按鈕並顯示提示訊息
8. WHEN 用戶點擊 passkey 項目的編輯圖示 THEN 認證服務 SHALL 顯示重新命名對話框
9. WHEN 用戶提交新的 passkey 名稱 THEN 後端服務 SHALL 更新 credential 名稱並重新載入清單
10. WHEN 用戶點擊 passkey 項目的刪除圖示 THEN 認證服務 SHALL 顯示確認對話框「確定要刪除此 Passkey？」
11. IF 用戶確認刪除且這是最後一個 passkey THEN 認證服務 SHALL 額外警告「刪除後將無法使用 Passkey 登入，建議先設定 email/密碼登入」
12. WHEN 用戶確認刪除 THEN 後端服務 SHALL 從資料庫移除 credential 記錄並重新載入清單

### Requirement 5: 錯誤處理與降級方案

**Objective:** 作為一位使用者，當 passkey 功能不可用時，我希望系統能提供替代的認證方式，這樣我就能繼續使用平台而不會被鎖在外面。

#### Acceptance Criteria

1. IF 瀏覽器不支援 WebAuthn API THEN 認證服務 SHALL 隱藏所有 passkey 相關選項並顯示 email/密碼登入表單
2. IF 用戶的作業系統或裝置不支援生物辨識 THEN 認證服務 SHALL 允許用戶使用安全金鑰（USB/NFC authenticator）作為替代方案
3. WHEN WebAuthn API 呼叫失敗（`NotAllowedError`, `NotSupportedError`）THEN 認證服務 SHALL 顯示具體錯誤訊息並建議用戶改用其他認證方式
4. IF `navigator.credentials.create()` 逾時（超過 60 秒）THEN 認證服務 SHALL 顯示逾時訊息並允許用戶重試
5. IF 後端 WebAuthn 功能被停用（`WEBAUTHN_ENABLED=false`）THEN 後端服務 SHALL 回傳 501 Not Implemented 並包含降級提示訊息
6. WHEN 用戶取消生物辨識驗證 THEN 認證服務 SHALL 顯示「驗證已取消」訊息並保持在當前頁面
7. IF 認證過程中發生網路錯誤 THEN 認證服務 SHALL 顯示網路錯誤訊息並提供重試按鈕

### Requirement 6: 安全性與合規

**Objective:** 作為平台營運者，我希望 passkey 系統符合 FIDO2/WebAuthn 標準並遵循安全最佳實踐，這樣可以保護用戶資料並建立信任。

#### Acceptance Criteria

1. WHEN 後端產生 WebAuthn challenge THEN 後端服務 SHALL 使用密碼學安全的隨機數產生器（`secrets.token_bytes(32)`）
2. WHEN 後端儲存 challenge THEN 後端服務 SHALL 設定過期時間（預設 5 分鐘）並在驗證後立即刪除
3. WHEN 後端驗證 attestation 或 assertion THEN 後端服務 SHALL 驗證：challenge 一致性、origin 正確性、RP ID 正確性、signature 有效性
4. WHEN 後端儲存 credential THEN 後端服務 SHALL 儲存：credential_id, public_key, counter, transports, aaguid 並加密敏感欄位
5. WHEN 後端驗證 assertion THEN 後端服務 SHALL 檢查 counter 值以防止 credential 複製攻擊（counter 應遞增）
6. IF counter 值異常（減少或不變）THEN 後端服務 SHALL 記錄安全警告並可選擇性阻擋該次登入
7. WHEN 系統處理 WebAuthn 資料 THEN 後端服務 SHALL 使用 `py_webauthn` 官方函式庫進行所有加密操作
8. WHEN 前端傳送 credential 資料 THEN 前端服務 SHALL 使用 Base64URL 編碼（符合 WebAuthn 規範）
9. WHEN 系統記錄 passkey 活動 THEN 後端服務 SHALL 記錄：操作類型、時間戳、IP 地址、User Agent（用於安全稽核）
10. WHERE 生產環境 THE 後端服務 SHALL 強制使用 HTTPS 並驗證 origin 必須使用 `https://` 協定

### Requirement 7: 使用者體驗優化

**Objective:** 作為一位使用者，我希望 passkey 認證流程流暢且直觀，這樣我就能享受無縫的登入體驗。

#### Acceptance Criteria

1. WHEN 用戶首次使用 passkey THEN 認證服務 SHALL 顯示簡短的引導說明（什麼是 Passkey、如何使用）
2. WHEN 系統偵測到用戶裝置支援生物辨識 THEN 認證服務 SHALL 優先顯示「使用指紋/Face ID 登入」文案
3. WHEN 生物辨識驗證進行中 THEN 認證服務 SHALL 顯示動畫載入指示器並顯示提示文字「請完成生物辨識驗證」
4. IF 用戶在 Pip-Boy 風格 UI 中操作 THEN 認證服務 SHALL 使用廢土主題的圖示和配色（Pip-Boy Green #00ff88）
5. WHEN 註冊或登入成功 THEN 認證服務 SHALL 顯示成功動畫（Pip-Boy 風格）並自動導向 dashboard（延遲 0.5 秒）
6. WHEN 認證失敗 THEN 認證服務 SHALL 使用 Sonner toast 顯示錯誤訊息（位於畫面右上角）
7. WHERE passkey 管理頁面 THE 認證服務 SHALL 使用 PixelIcon 元件顯示裝置類型圖示（手機、電腦、USB 金鑰）
8. WHEN 用戶長時間未操作（超過 30 秒）且仍在認證流程中 THEN 認證服務 SHALL 顯示提示「需要協助嗎？」並提供支援連結

### Requirement 8: 整合現有認證系統

**Objective:** 作為開發者，我希望 passkey 系統能與現有的 email/密碼和 OAuth 認證方式共存，這樣用戶可以選擇最適合的登入方式。

#### Acceptance Criteria

1. WHEN 用戶帳號同時設定 passkey 和 email/密碼 THEN 認證服務 SHALL 允許用戶自由選擇任一方式登入
2. WHEN 已有 email/密碼的用戶想新增 passkey THEN 認證服務 SHALL 在帳號設定頁面提供「新增 Passkey」選項
3. WHEN 用戶新增 passkey 至現有帳號 THEN 後端服務 SHALL 關聯 credential 至現有的 `user_id`
4. IF 用戶使用 passkey 註冊但後來想設定密碼 THEN 認證服務 SHALL 允許用戶透過「設定密碼」功能新增密碼
5. WHEN 系統產生 JWT tokens THEN 後端服務 SHALL 在 token payload 中包含認證方式標記（`auth_method: "passkey"`）
6. WHEN 用戶使用不同認證方式登入 THEN 後端服務 SHALL 記錄認證方式至 `users.last_login_method` 欄位
7. IF 用戶帳號被停用或刪除 THEN 後端服務 SHALL 同時清除所有關聯的 passkey credentials
8. WHEN 系統計算 Karma 獎勵 THEN 後端服務 SHALL 給予首次使用 passkey 註冊或登入的用戶額外 50 Karma

### Requirement 9: 監控與分析

**Objective:** 作為平台營運者，我希望能追蹤 passkey 使用情況，這樣可以了解功能採用率並優化用戶體驗。

#### Acceptance Criteria

1. WHEN 用戶成功使用 passkey 註冊 THEN 後端服務 SHALL 記錄事件至分析系統（`passkey_registration_success`）
2. WHEN 用戶成功使用 passkey 登入 THEN 後端服務 SHALL 記錄事件至分析系統（`passkey_login_success`）
3. WHEN passkey 註冊或登入失敗 THEN 後端服務 SHALL 記錄失敗原因至錯誤追蹤系統並包含錯誤類型
4. WHEN 用戶刪除 passkey THEN 後端服務 SHALL 記錄刪除事件並包含刪除原因（如果用戶有填寫）
5. WHERE 管理後台 THE 系統 SHALL 提供 passkey 統計儀表板，顯示：註冊數、登入數、成功率、常見錯誤類型
6. WHEN 系統產生每日報告 THEN 後端服務 SHALL 計算並記錄：passkey 採用率（有使用 passkey 的用戶比例）
7. IF 特定 credential 發生多次驗證失敗 THEN 後端服務 SHALL 發送警報至安全團隊

### Requirement 10: 資料遷移與向後相容

**Objective:** 作為開發者，我希望能安全地部署 passkey 功能而不影響現有用戶，這樣可以確保零停機時間和平滑升級。

#### Acceptance Criteria

1. WHEN 系統部署 passkey 功能 THEN 資料庫遷移 SHALL 新增 `passkey_credentials` 資料表並包含所有必要欄位
2. WHEN 建立 `passkey_credentials` 資料表 THEN 資料庫遷移 SHALL 建立索引：`user_id`, `credential_id`, `last_used_at`
3. IF 資料庫已有舊版 WebAuthn 資料 THEN 資料庫遷移 SHALL 提供轉換腳本將資料遷移至新結構
4. WHEN 系統升級後 THEN 後端服務 SHALL 保持對舊版 API 端點的支援（如果有）並在文件中標記為 deprecated
5. WHEN 執行資料庫遷移 THEN 資料庫遷移 SHALL 包含 rollback 腳本以支援緊急回退
6. IF 功能旗標 `WEBAUTHN_ENABLED` 設為 false THEN 後端服務 SHALL 優雅地停用所有 passkey 功能而不影響其他認證方式
