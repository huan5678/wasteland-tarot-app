# 需求文件

## 專案描述（輸入）
整合 Google OAuth 與 Passkey 無密碼認證系統。允許用戶使用 Google 帳號快速註冊後，可選擇升級為 Passkey 認證。支援三種登入方式：(1) Google OAuth 一鍵登入，(2) Passkey 生物辨識登入，(3) Email/密碼傳統登入。整合現有的 Supabase OAuth 設定和 WebAuthn 實作，確保所有認證方式能共存並提供一致的使用體驗。特別功能：首次 Google 登入後引導用戶註冊 Passkey，以獲得更快速的生物辨識登入體驗。

## 簡介

本需求文件定義廢土塔羅平台的**多層次認證生態系統**，整合 Google OAuth 與 Passkey 無密碼認證技術。此功能建立在現有的 Supabase OAuth（`backend/app/api/oauth.py`）和 WebAuthn 服務（`backend/app/services/webauthn_service.py`）實作之上，專注於**整合層邏輯**和**升級引導流程**，而非重複開發基礎功能。

**商業價值：**
- **降低註冊門檻**：Google 一鍵註冊，無需記憶密碼（轉換率提升）
- **漸進式安全升級**：引導 OAuth 用戶升級為 Passkey 認證（體驗提升）
- **靈活認證選擇**：支援三種登入方式共存（用戶自主性）
- **技術領先**：結合社交登入與生物辨識（品牌形象）

**設計原則（Linus 哲學）：**
- **Good Taste**：統一的認證生態，消除特殊情況
- **Pragmatism**：重用現有實作，專注整合層
- **Never Break Userspace**：現有 Email/密碼用戶不受影響

---

## 需求

### 需求 1：Google OAuth 快速註冊（新用戶入口）

**目標**：作為一位新用戶，我希望使用 Google 帳號一鍵完成註冊，這樣我就不需要填寫註冊表單或記憶密碼，可以立即開始使用平台。

#### 驗收標準

1. WHEN 用戶訪問註冊頁面 THEN 認證服務 SHALL 顯示「使用 Google 註冊」按鈕（Pip-Boy 風格）
2. WHEN 用戶點擊「使用 Google 註冊」按鈕 THEN 前端服務 SHALL 呼叫 Supabase Auth SDK 的 `signInWithOAuth({ provider: 'google' })` 方法
3. WHEN Supabase SDK 初始化 OAuth 流程 THEN 瀏覽器 SHALL 重導向至 Google OAuth 授權頁面
4. WHEN 用戶在 Google 頁面完成授權 THEN Google SHALL 重導向至 Supabase 的回調 URL 並附帶授權碼
5. WHEN 前端收到 OAuth 回調並包含授權碼 THEN 前端服務 SHALL 將授權碼傳送至後端 `/api/auth/oauth/callback` 端點
6. WHEN 後端收到授權碼 THEN 後端服務 SHALL 使用 Supabase SDK 交換授權碼為 session（重試機制：最多 3 次，間隔 1/2/4 秒）
7. IF 授權碼交換失敗 THEN 後端服務 SHALL 回傳 `OAuthAuthorizationError` 並包含使用者友善訊息「Google 登入失敗，請稍後再試」
8. WHEN 後端成功取得 Supabase session THEN 後端服務 SHALL 提取使用者資料（email, name, profile_picture, oauth_id）
9. IF email 已存在於系統中且 `oauth_provider` 為 NULL THEN 後端服務 SHALL 回傳特殊狀態碼 `409 Conflict` 並包含訊息「此 email 已註冊，請使用現有方式登入後在帳號設定中連結 Google 帳號」
10. IF email 已存在於系統中且 `oauth_provider` 不為 NULL 但與當前 OAuth 提供者不同 THEN 後端服務 SHALL 回傳 `409 Conflict` 並包含現有認證方式資訊
11. IF email 不存在 THEN 後端服務 SHALL 建立新用戶記錄並包含：`email`, `name`, `oauth_provider='google'`, `oauth_id`, `profile_picture_url`, `password_hash=NULL`, `karma_score=50`
12. IF 前端收到 `409 Conflict` 回應 THEN 認證服務 SHALL 顯示「帳號整合引導」頁面（需求 8.5）
13. WHEN 用戶記錄建立成功（新用戶）THEN 後端服務 SHALL 初始化 Karma 系統並給予首次 OAuth 註冊獎勵 50 Karma
14. WHEN 後端完成用戶處理 THEN 後端服務 SHALL 產生 JWT tokens（access_token: 30分鐘, refresh_token: 7天）
15. WHEN 後端回傳 tokens THEN 前端服務 SHALL 儲存 tokens 至 httpOnly cookies 並更新 authStore 狀態（`authMethod: 'oauth'`, `hasOAuth: true`）
16. WHEN authStore 更新完成 THEN 認證服務 SHALL 檢查 `hasPasskey` 狀態
17. IF `hasPasskey === false` THEN 認證服務 SHALL 顯示 Passkey 升級引導 modal（需求 2）
18. IF `hasPasskey === true` THEN 認證服務 SHALL 直接導向至 dashboard

---

### 需求 2：Passkey 升級引導（首次 OAuth 登入後）

**目標**：作為一位剛使用 Google 註冊的用戶，我希望系統能引導我註冊 Passkey，這樣下次我就能使用更快速的生物辨識登入。

#### 驗收標準

1. WHEN 用戶首次完成 Google OAuth 註冊或登入且 `hasPasskey === false` THEN 認證服務 SHALL 顯示「升級至 Passkey」引導 modal
2. WHERE 引導 modal THE 認證服務 SHALL 顯示以下內容：
   - 標題：「升級至更快速的生物辨識登入」
   - 說明：「使用指紋或 Face ID 登入，無需每次點擊 Google 按鈕」
   - 選項 1：「立即設定 Passkey」按鈕（主要 CTA）
   - 選項 2：「稍後再說」連結（次要）
   - 底部提示：「您隨時可以在帳號設定中新增 Passkey」
3. IF 用戶點擊「立即設定 Passkey」按鈕 THEN 認證服務 SHALL 啟動 Passkey 註冊流程（重用 `passkey-authentication` spec 的需求 1）
4. WHEN Passkey 註冊流程啟動 THEN 前端服務 SHALL 呼叫後端 `/api/webauthn/register/options` 端點並傳入當前用戶的 `user_id`
5. WHEN 後端收到註冊請求 THEN 後端服務 SHALL 產生 WebAuthn registration options 並包含 `user.email` 和 `user.name`
6. WHEN 前端收到 registration options THEN 瀏覽器 SHALL 呼叫 `navigator.credentials.create()` 觸發生物辨識驗證
7. IF 瀏覽器不支援 WebAuthn THEN 認證服務 SHALL 顯示訊息「您的裝置不支援 Passkey，可以繼續使用 Google 登入」並自動關閉 modal（5 秒後）
8. WHEN 用戶完成生物辨識驗證 THEN 瀏覽器 SHALL 產生 attestation response 並傳送至後端 `/api/webauthn/register/verify` 端點
9. IF attestation 驗證成功 THEN 後端服務 SHALL 儲存 credential 至 `credentials` 表並關聯至當前用戶的 `user_id`
10. WHEN Passkey 註冊成功 THEN 認證服務 SHALL 更新 authStore 狀態（`hasPasskey: true`）並顯示成功訊息「Passkey 設定完成！下次您可以使用生物辨識快速登入」
11. WHEN 成功訊息顯示 2 秒後 THEN 認證服務 SHALL 關閉 modal 並導向至 dashboard
12. IF 用戶點擊「稍後再說」連結 THEN 認證服務 SHALL 關閉 modal 並導向至 dashboard（不再顯示引導，直到下次登入）
13. IF Passkey 註冊過程中發生任何錯誤 THEN 認證服務 SHALL 顯示錯誤訊息並提供「重試」或「跳過」選項

---

### 需求 3：登入頁面整合（三種認證方式共存）

**目標**：作為一位用戶，我希望在登入頁面能看到所有可用的登入方式，這樣我就能選擇最適合我的方式登入。

#### 驗收標準

1. WHEN 用戶訪問登入頁面（`/auth/login`）THEN 認證服務 SHALL 顯示以下認證選項：
   - Google OAuth 按鈕：「使用 Google 登入」（主要 CTA，Pip-Boy Green）
   - Passkey 按鈕：「使用 Passkey 登入」（次要 CTA）
   - Email/密碼表單：傳統登入方式（收合區塊，預設隱藏）
2. WHERE 登入頁面 THE 認證服務 SHALL 以視覺層級顯示推薦度：Google OAuth（最顯眼）> Passkey（次要）> Email/密碼（最不顯眼）
3. IF 瀏覽器支援 WebAuthn Conditional UI THEN 認證服務 SHALL 在 email 輸入框啟用 `autocomplete="webauthn"` 屬性
4. WHEN 用戶點擊 email 輸入框且瀏覽器支援 Conditional UI THEN 瀏覽器 SHALL 自動顯示可用的 Passkey credentials 在 autofill 選單中
5. IF 用戶選擇 autofill 選單中的 Passkey THEN 瀏覽器 SHALL 自動觸發生物辨識驗證並完成登入（無需點擊按鈕）
6. WHEN 用戶點擊「使用 Google 登入」按鈕 THEN 前端服務 SHALL 執行需求 1 的 OAuth 流程（步驟 2-16）
7. WHEN 用戶點擊「使用 Passkey 登入」按鈕 THEN 前端服務 SHALL 執行 Passkey 登入流程（重用 `passkey-authentication` spec 的需求 2）
8. WHEN 用戶展開 Email/密碼表單並提交 THEN 前端服務 SHALL 執行傳統登入流程（重用 `supabase-oauth-integration` spec 的需求 4）
9. WHEN 任一認證方式登入成功 THEN 認證服務 SHALL 更新 authStore 並記錄 `authMethod`（'oauth' | 'passkey' | 'password'）
10. WHEN 登入成功後 THEN 後端服務 SHALL 更新 `users.last_login_method` 欄位以追蹤認證方式偏好

---

### 需求 4：帳號設定頁面（多認證方式管理）

**目標**：作為一位已登入的用戶，我希望能在帳號設定中管理所有認證方式（新增、移除、切換），這樣我就能根據需求調整我的登入選項。

#### 驗收標準

1. WHEN 用戶訪問帳號設定頁面（`/profile` 或 `/settings`）THEN 認證服務 SHALL 顯示「認證方式管理」區塊
2. WHERE 認證方式管理區塊 THE 認證服務 SHALL 顯示當前啟用的認證方式狀態：
   - Google OAuth：顯示「已連結 Google 帳號」標籤 + Google profile picture（若 `hasOAuth === true`）
   - Passkey：顯示已註冊的 Passkeys 清單（若 `hasPasskey === true`）
   - Email/密碼：顯示「已設定密碼」標籤（若 `hasPassword === true`）
3. IF `hasOAuth === false` THEN 認證服務 SHALL 顯示「連結 Google 帳號」按鈕
4. WHEN 用戶點擊「連結 Google 帳號」按鈕 THEN 前端服務 SHALL 執行 OAuth 授權流程並更新現有帳號的 `oauth_provider` 和 `oauth_id` 欄位
5. IF `hasPasskey === false` THEN 認證服務 SHALL 顯示「新增 Passkey」按鈕（主要 CTA）
6. WHEN 用戶點擊「新增 Passkey」按鈕 THEN 認證服務 SHALL 執行 Passkey 註冊流程（重用 `passkey-authentication` spec 的需求 4，步驟 4-6）
7. IF `hasPassword === false` AND `hasOAuth === true` THEN 認證服務 SHALL 顯示「設定密碼」按鈕（備用認證方式）
8. WHEN 用戶點擊「設定密碼」按鈕 THEN 認證服務 SHALL 顯示密碼設定表單（包含密碼強度驗證）
9. WHEN 用戶提交密碼設定表單 THEN 後端服務 SHALL 驗證密碼強度（至少 8 字元）並更新 `users.password_hash` 欄位
10. IF `hasOAuth === true` AND 用戶想移除 Google 連結 THEN 認證服務 SHALL 檢查是否至少還有一種其他認證方式（`hasPasskey === true` OR `hasPassword === true`）
11. IF 只有 OAuth 一種認證方式 THEN 認證服務 SHALL 顯示警告訊息「您必須至少保留一種登入方式，請先設定 Passkey 或密碼」並阻止移除操作
12. IF 至少有兩種認證方式 THEN 認證服務 SHALL 允許移除 OAuth 連結並顯示確認對話框「確定要取消 Google 帳號連結？」
13. WHEN 用戶確認移除 OAuth 連結 THEN 後端服務 SHALL 將 `users.oauth_provider` 和 `users.oauth_id` 設為 NULL 並更新 authStore 狀態
14. WHEN 用戶在 Passkeys 清單中點擊「刪除」按鈕 THEN 認證服務 SHALL 執行刪除流程（重用 `passkey-authentication` spec 的需求 4，步驟 10-12）

---

### 需求 5：認證方式狀態同步（前後端一致性）

**目標**：作為開發者，我需要確保前端 authStore 的認證方式狀態與後端資料庫保持一致，這樣用戶才能看到正確的可用登入選項。

#### 驗收標準

1. WHEN 用戶登入成功（任一方式）THEN 後端服務 SHALL 在 JWT token payload 中包含認證方式資訊（`auth_method`, `has_passkey`, `has_password`, `has_oauth`）
2. WHEN 前端解析 JWT token THEN 前端服務 SHALL 提取認證方式資訊並更新 authStore 狀態
3. WHEN 用戶訪問帳號設定頁面 THEN 前端服務 SHALL 呼叫後端 `/api/auth/methods` 端點以取得最新的認證方式狀態
4. WHEN 後端收到認證方式查詢請求 THEN 後端服務 SHALL 查詢以下資料並回傳：
   - `hasOAuth`: `users.oauth_provider IS NOT NULL`
   - `hasPasskey`: `COUNT(credentials WHERE user_id = current_user) > 0`
   - `hasPassword`: `users.password_hash IS NOT NULL`
   - `oauthProvider`: `users.oauth_provider` 值
   - `profilePicture`: `users.profile_picture_url` 值
5. WHEN 前端收到認證方式狀態 THEN 前端服務 SHALL 呼叫 authStore 的 `setAuthMethodsState()` 方法更新狀態
6. IF 用戶新增或移除任一認證方式 THEN 前端服務 SHALL 立即呼叫 `refreshAuthMethods()` 方法同步最新狀態
7. WHEN 用戶登出 THEN 前端服務 SHALL 清除所有認證方式狀態（`hasPasskey`, `hasPassword`, `hasOAuth` 重設為 `false`）

---

### 需求 6：Passkey 優先引導策略（UX 優化）

**目標**：作為產品經理，我希望系統能主動引導更多用戶使用 Passkey 認證，這樣可以提升用戶體驗和平台安全性。

#### 驗收標準

1. WHEN OAuth 用戶首次登入且 `hasPasskey === false` THEN 認證服務 SHALL 顯示 Passkey 升級引導 modal（需求 2）
2. IF 用戶在升級引導中點擊「稍後再說」THEN 後端服務 SHALL 記錄 `passkey_prompt_skipped_at` 時間戳
3. WHEN OAuth 用戶第二次登入且距離上次跳過 Passkey 引導超過 7 天 THEN 認證服務 SHALL 再次顯示引導 modal（最多提醒 3 次）
4. IF 用戶已跳過 Passkey 引導 3 次 THEN 認證服務 SHALL 不再自動顯示引導 modal（但仍在帳號設定中顯示「新增 Passkey」按鈕）
5. WHEN 用戶在登入頁面且瀏覽器支援 WebAuthn THEN 認證服務 SHALL 優先顯示「使用 Passkey 登入」按鈕（視覺上比 Google OAuth 按鈕更突出）
6. IF 用戶同時擁有 OAuth 和 Passkey 認證方式 THEN 登入頁面 SHALL 顯示小提示「建議使用 Passkey 以獲得最快登入速度」
7. WHEN 用戶使用 Passkey 成功登入 THEN 後端服務 SHALL 給予額外 10 Karma 獎勵（每日首次）以鼓勵使用

---

### 需求 7：認證方式遷移與向後相容

**目標**：作為開發者，我需要確保現有用戶（Email/密碼）能平滑遷移至新的多認證方式系統，而不會遺失帳號或資料。

#### 驗收標準

1. WHEN 系統部署新功能 THEN 資料庫遷移 SHALL 確保現有 `users` 表的 `oauth_provider`, `oauth_id`, `profile_picture_url` 欄位已存在
2. IF 欄位不存在 THEN 資料庫遷移 SHALL 新增這些欄位並設定為 NULLABLE
3. WHEN 資料庫遷移執行 THEN 遷移腳本 SHALL 為所有現有用戶設定 `hasPassword = true`（因為現有用戶都有 `password_hash`）
4. WHEN 現有用戶（Email/密碼）登入 THEN 認證服務 SHALL 正常執行傳統登入流程（完全不受影響）
5. IF 現有用戶想新增 Google OAuth 連結 THEN 認證服務 SHALL 執行需求 4 的「連結 Google 帳號」流程（步驟 3-4）
6. IF 現有用戶想新增 Passkey THEN 認證服務 SHALL 執行需求 4 的「新增 Passkey」流程（步驟 5-6）
7. WHEN 現有用戶成功新增 OAuth 或 Passkey THEN 認證服務 SHALL 更新 authStore 並顯示成功訊息「已新增 {認證方式}，您現在有 {總數} 種登入方式」
8. IF 資料庫遷移失敗 THEN 遷移腳本 SHALL 提供 rollback 機制並記錄詳細錯誤日誌

---

### 需求 8：安全性與合規（多認證方式保護）

**目標**：作為安全工程師，我需要確保多認證方式系統符合安全最佳實踐，防止帳號劫持和認證繞過攻擊。

#### 驗收標準

1. WHEN 用戶嘗試連結 Google OAuth 至現有帳號（已登入狀態）THEN 後端服務 SHALL 驗證 OAuth email 與當前登入帳號的 email 一致
2. IF OAuth email 與當前帳號 email 不一致 THEN 後端服務 SHALL 拒絕連結並回傳錯誤訊息「Google 帳號的 email 與您的帳號不符」
3. WHEN 用戶嘗試使用 Google OAuth 註冊/登入且 email 已存在但 `oauth_provider` 為 NULL THEN 後端服務 SHALL 回傳 `409 Conflict` 並觸發帳號整合引導流程（需求 8.5）
4. WHEN 用戶嘗試使用 Google OAuth 註冊/登入且 email 已存在但 `oauth_provider` 為其他提供者（非 Google）THEN 後端服務 SHALL 回傳 `409 Conflict` 並觸發帳號整合引導流程（需求 8.5）
5. WHEN 用戶移除任一認證方式 THEN 後端服務 SHALL 驗證至少還有一種其他認證方式（防止帳號鎖定）
6. IF 用戶只剩一種認證方式 THEN 認證服務 SHALL 阻止移除操作並顯示警告訊息
7. WHEN 用戶連結 Google OAuth THEN 後端服務 SHALL 驗證 OAuth state 參數以防止 CSRF 攻擊
8. WHEN 系統偵測到可疑的認證方式變更（例如：短時間內多次新增/移除）THEN 後端服務 SHALL 記錄安全警報並可選擇性觸發 MFA 驗證
9. WHEN 用戶使用 Passkey 登入 THEN 後端服務 SHALL 驗證 counter 值以防止 credential 複製攻擊（重用 `passkey-authentication` spec 的需求 6，步驟 5-6）
10. WHERE 生產環境 THE 後端服務 SHALL 強制所有認證流程使用 HTTPS 並驗證 origin 正確性

---

### 需求 8.5：相同 Email 跨認證方式整合引導（帳號衝突解決）

**目標**：作為一位用戶，當我使用 Google 登入但該 email 已經用其他方式註冊過時，我希望系統能引導我整合這些認證方式，這樣我就能使用多種方式登入同一個帳號。

#### 驗收標準

1. WHEN 後端回傳 `409 Conflict` 狀態碼 THEN 回應 body SHALL 包含以下資訊：
   - `conflict_type`: "existing_account"
   - `email`: 衝突的 email 地址
   - `existing_auth_methods`: 現有帳號已啟用的認證方式清單（例如：`["password"]` 或 `["oauth_google"]`）
   - `suggested_action`: 建議的操作類型（"login_first" 或 "link_account"）
2. WHEN 前端收到 `409 Conflict` 回應 THEN 認證服務 SHALL 顯示「帳號整合引導」頁面
3. WHERE 帳號整合引導頁面 THE 認證服務 SHALL 顯示以下內容：
   - 標題：「此 Email 已註冊」
   - 說明：「您的 Google 帳號（{email}）已經在系統中註冊過，目前使用 {existing_methods} 登入」
   - 視覺化圖示：顯示現有認證方式圖示（使用 PixelIcon）
   - 兩個選項：
     * 選項 1（主要 CTA）：「使用 {existing_method} 登入並連結 Google 帳號」
     * 選項 2（次要）：「返回登入頁面」
4. IF 現有認證方式為 Email/密碼（`existing_auth_methods` 包含 "password"）THEN 引導頁面 SHALL 顯示：
   - 選項 1 文案：「使用密碼登入並連結 Google 帳號」
   - 內嵌登入表單：email（預填且禁用編輯）+ password 輸入框
   - 底部連結：「忘記密碼？」（導向密碼重設流程）
5. WHEN 用戶在引導頁面提交密碼登入 THEN 前端服務 SHALL 呼叫後端 `/api/auth/login` 端點並附帶 `link_oauth=true` 參數
6. WHEN 後端收到附帶 `link_oauth=true` 的登入請求 THEN 後端服務 SHALL 執行以下操作：
   - 驗證 email 和 password 正確性
   - IF 驗證成功 THEN 更新該用戶記錄並設定 `oauth_provider='google'` 和 `oauth_id`（從 session 中取得）
   - 產生 JWT tokens 並包含 `has_oauth=true` 標記
7. WHEN 用戶成功登入並連結 OAuth THEN 認證服務 SHALL 顯示成功訊息「Google 帳號已連結！您現在可以使用 Google 或密碼登入」
8. WHEN 成功訊息顯示 2 秒後 THEN 認證服務 SHALL 檢查 `hasPasskey` 狀態並決定是否顯示 Passkey 升級引導（需求 2）
9. IF 現有認證方式為其他 OAuth 提供者（例如：`existing_auth_methods` 包含 "oauth_facebook"）THEN 引導頁面 SHALL 顯示：
   - 選項 1 文案：「使用 {existing_provider} 登入並連結 Google 帳號」
   - 提示訊息：「您目前使用 {existing_provider} 登入，登入後可在帳號設定中新增 Google 登入」
   - 按鈕：「使用 {existing_provider} 登入」（觸發該 OAuth 流程）
10. IF 現有認證方式為 Passkey（`existing_auth_methods` 包含 "passkey"）THEN 引導頁面 SHALL 顯示：
    - 選項 1 文案：「使用 Passkey 登入並連結 Google 帳號」
    - 按鈕：「使用生物辨識登入」（觸發 Passkey 登入流程）
11. WHEN 用戶點擊「返回登入頁面」THEN 認證服務 SHALL 導向至登入頁面並清除 OAuth 回調狀態
12. IF 用戶在引導頁面登入失敗（密碼錯誤）THEN 認證服務 SHALL 顯示錯誤訊息並允許重試（最多 5 次）
13. IF 用戶在引導頁面連續失敗 5 次 THEN 認證服務 SHALL 鎖定登入功能 15 分鐘並建議「使用忘記密碼功能或聯繫支援」
14. WHEN 帳號整合引導流程成功完成 THEN 後端服務 SHALL 記錄事件至分析系統（`oauth_account_linked`, source: 'conflict_resolution'）

---

### 需求 9：監控與分析（認證方式使用追蹤）

**目標**：作為產品分析師，我需要追蹤各種認證方式的使用情況，這樣可以優化引導流程並提升轉換率。

#### 驗收標準

1. WHEN 用戶使用 Google OAuth 註冊 THEN 後端服務 SHALL 記錄事件至分析系統（`oauth_registration_success`, provider: 'google'）
2. WHEN 用戶使用 Google OAuth 登入 THEN 後端服務 SHALL 記錄事件至分析系統（`oauth_login_success`, provider: 'google'）
3. WHEN 用戶在 Passkey 升級引導中點擊「立即設定 Passkey」THEN 前端服務 SHALL 記錄事件（`passkey_upgrade_prompt_accepted`）
4. WHEN 用戶在 Passkey 升級引導中點擊「稍後再說」THEN 前端服務 SHALL 記錄事件（`passkey_upgrade_prompt_skipped`, skip_count: N）
5. WHEN 用戶成功完成 Passkey 升級 THEN 後端服務 SHALL 記錄事件（`passkey_upgrade_completed`, source: 'oauth_prompt'）
6. WHEN 用戶在帳號設定中新增 Passkey THEN 後端服務 SHALL 記錄事件（`passkey_upgrade_completed`, source: 'settings_manual'）
7. WHEN 用戶連結 Google OAuth 至現有帳號 THEN 後端服務 SHALL 記錄事件（`oauth_linked_to_existing_account`）
8. WHEN 系統偵測到帳號衝突（email 已存在）THEN 後端服務 SHALL 記錄事件（`oauth_account_conflict_detected`, existing_methods: [...], conflict_email: "xxx"）
9. WHEN 用戶在帳號整合引導頁面成功登入並連結 OAuth THEN 後端服務 SHALL 記錄事件（`oauth_conflict_resolved_success`, resolution_method: "password" | "passkey" | "oauth"）
10. WHEN 用戶在帳號整合引導頁面點擊「返回登入頁面」THEN 前端服務 SHALL 記錄事件（`oauth_conflict_resolution_abandoned`）
11. WHEN 用戶移除任一認證方式 THEN 後端服務 SHALL 記錄事件並包含移除原因（若用戶有填寫）
12. WHERE 管理後台 THE 系統 SHALL 提供認證方式統計儀表板，顯示：
   - 各認證方式的使用比例（OAuth / Passkey / Email-Password）
   - Passkey 升級引導的轉換率（接受率 / 跳過率）
   - 多認證方式用戶的比例（擁有 2+ 種認證方式的用戶）
   - 帳號衝突發生次數與解決成功率
13. WHEN 系統產生每週報告 THEN 後端服務 SHALL 計算並記錄關鍵指標：
    - OAuth 新用戶註冊數
    - Passkey 升級成功率
    - 各認證方式的登入頻率
    - 帳號衝突解決成功率（成功連結 / 總衝突數）

---

### 需求 10：錯誤處理與降級方案（跨認證方式容錯）

**目標**：作為使用者，當某種認證方式不可用時，我希望系統能引導我使用其他可用方式登入，這樣我就不會被鎖在外面。

#### 驗收標準

1. IF Google OAuth 服務暫時不可用 THEN 認證服務 SHALL 在登入頁面顯示警告訊息「Google 登入目前無法使用，請使用其他方式登入」
2. WHEN OAuth 服務不可用 THEN 認證服務 SHALL 自動隱藏「使用 Google 登入」按鈕並突出顯示其他認證選項
3. IF 用戶裝置不支援 WebAuthn THEN 認證服務 SHALL 隱藏所有 Passkey 相關按鈕並顯示小提示「您的裝置不支援 Passkey，可使用 Google 或密碼登入」
4. WHEN 用戶嘗試使用 Passkey 登入但 `navigator.credentials` 不存在 THEN 認證服務 SHALL 顯示錯誤訊息並自動切換至其他登入方式
5. IF 用戶嘗試使用不存在的認證方式（例如：帳號沒有 OAuth 連結但點擊 OAuth 按鈕）THEN 認證服務 SHALL 顯示訊息「您尚未連結 Google 帳號，請使用其他方式登入或註冊」
6. WHEN OAuth 授權流程中發生網路錯誤 THEN 認證服務 SHALL 顯示錯誤訊息並提供「重試」按鈕
7. IF OAuth 授權流程失敗超過 3 次 THEN 認證服務 SHALL 建議用戶「請檢查網路連線或改用其他登入方式」
8. WHEN Passkey 驗證失敗（生物辨識失敗或 credential 不匹配）THEN 認證服務 SHALL 顯示錯誤訊息並提供「重試」或「使用其他方式登入」選項
9. IF 用戶在登入頁面連續失敗 5 次（任何認證方式）THEN 認證服務 SHALL 暫時鎖定登入功能 15 分鐘並顯示「請稍後再試或聯繫支援」
10. WHEN 後端 WebAuthn 功能被停用（`WEBAUTHN_ENABLED=false`）THEN 後端服務 SHALL 回傳 501 Not Implemented 並前端自動隱藏所有 Passkey 選項

---

### 需求 11：使用者體驗優化（Pip-Boy 風格整合）

**目標**：作為使用者，我希望所有認證流程都符合廢土塔羅的 Fallout 主題，這樣可以獲得沉浸式的遊戲體驗。

#### 驗收標準

1. WHEN 用戶在登入頁面 THEN 認證服務 SHALL 使用 Pip-Boy 風格 UI 元件：
   - 按鈕：Pip-Boy Green (#00ff88) 主色調
   - 掃描線效果：背景動畫
   - 終端機字體：Cubic 11 字體
   - 圖示：PixelIcon 元件（禁止使用 lucide-react）
2. WHEN 用戶完成認證（任一方式）THEN 認證服務 SHALL 顯示 Pip-Boy 風格成功動畫（綠色掃描效果 + Geiger counter 音效）
3. WHEN Passkey 升級引導 modal 顯示 THEN 認證服務 SHALL 使用 Vault-Tec 風格設計：
   - 標題：Pip-Boy 字體
   - 圖示：使用 PixelIcon 的 `fingerprint` 或 `security` 圖示
   - 按鈕：Radiation Orange (#ff8800) CTA 按鈕
4. WHEN 生物辨識驗證進行中 THEN 認證服務 SHALL 顯示 Pip-Boy 風格載入動畫（旋轉的 Vault-Tec 齒輪 + 「正在掃描生物特徵...」文字）
5. WHERE 帳號設定頁面的認證方式管理區塊 THE 認證服務 SHALL 使用廢土主題卡片：
   - Google OAuth：顯示「Vault-Tec 授權連結」標題
   - Passkey：顯示「生物辨識掃描儀」標題
   - Email/密碼：顯示「傳統安全協議」標題
6. WHEN 用戶新增或移除認證方式成功 THEN 認證服務 SHALL 使用 Sonner toast 顯示成功訊息（Pip-Boy Green 配色）
7. IF 認證失敗 THEN 認證服務 SHALL 使用 Sonner toast 顯示錯誤訊息（Radiation Orange 配色 + 警報音效）
8. WHEN 用戶首次使用 Passkey THEN 認證服務 SHALL 給予「生物辨識先驅者」成就徽章（整合 `achievement-system` spec）

---

## 非功能性需求

### 效能需求

1. WHEN 用戶發起 OAuth 登入 THEN 系統 SHALL 在 2 秒內完成重導向至 Google 授權頁面
2. WHEN 用戶完成 OAuth 授權並回調 THEN 系統 SHALL 在 3 秒內完成用戶建立/更新並導向至 dashboard
3. WHEN 用戶使用 Passkey 登入 THEN 系統 SHALL 在 1.5 秒內完成驗證並導向至 dashboard（比 OAuth 更快）
4. WHEN authStore 呼叫 `refreshAuthMethods()` THEN 系統 SHALL 在 500ms 內完成查詢並更新狀態

### 可用性需求

1. WHEN 用戶在行動裝置上使用 OAuth 登入 THEN 系統 SHALL 提供行動裝置優化的體驗（響應式設計 + 觸控優化）
2. WHEN 用戶在行動裝置上使用 Passkey THEN 系統 SHALL 優先觸發裝置內建的生物辨識（Touch ID / Face ID）
3. WHERE 登入頁面存在 THE 系統 SHALL 支援鍵盤導航和螢幕閱讀器（WCAG AA 合規）
4. WHEN 用戶遇到錯誤 THEN 系統 SHALL 提供清楚的繁體中文錯誤訊息和建議操作

### 可擴展性需求

1. WHEN 未來需要新增其他 OAuth 提供者（Facebook, Apple）THEN 系統架構 SHALL 允許輕鬆擴展（只需新增 provider 配置）
2. WHERE 資料表設計 THE Schema SHALL 支援多重 OAuth 提供者綁定至同一使用者（例如：同時連結 Google 和 Apple）

---

## 驗收總結

本規格定義的功能將透過以下方式驗證：

1. **單元測試**：驗證個別認證方式的邏輯正確性
2. **整合測試**：驗證多認證方式共存的完整流程
3. **端到端測試**：使用 Playwright 測試完整的用戶旅程（OAuth 註冊 → Passkey 升級 → 多方式登入）
4. **手動測試**：在開發環境中測試 Pip-Boy 風格 UI 和 UX 流程

所有驗收標準必須通過才能視為此功能完成。
