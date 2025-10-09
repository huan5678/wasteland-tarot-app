# 需求文件

## 簡介

本規格定義了 Wasteland Tarot 平台的認證系統重構與 Supabase OAuth 整合功能。此功能包含兩個主要部分：

1. **Supabase OAuth 整合**：實作 Google 第三方登入功能，利用已在 Supabase 控制台配置的 Google OAuth 認證
2. **認證系統重構**：將現有的 username + password 登入方式改為 email + password，並將 username 欄位重構為 name（顯示名稱/暱稱）

此功能的商業價值在於：
- 降低使用者註冊門檻（一鍵 Google 登入）
- 簡化登入流程（使用 email 而非 username）
- 提升使用者體驗（統一的認證機制）
- 確保資料一致性（整合 OAuth 和傳統登入使用者）

## 使用者需求說明（原始輸入）

替我構思使用Supabase上的第三方登入作為登入的方法, 目前已經從網站上面開好Google登入也都填好相關認證在網站之中。

也同時替我修正目前的使用者系統不需要再讓使用者輸入username來登入了, 使用email配合password的方式登入, 把username的欄位換成name就好了讓使用者輸入名稱或是暱稱就可以了, 同時整合目前使用者的表, 確保使用者使用google帳號登入時可以正確建立資料。

## 需求

### 需求 1：OAuth 提供者設定

**使用者故事**：身為系統管理員，我希望系統能正確載入 Supabase OAuth 設定，以便使用者可以透過 Google 帳號登入。

#### 驗收標準

1. WHEN 應用程式初始化 THEN 系統 SHALL 從環境變數載入 Supabase OAuth 設定（SUPABASE_URL, SUPABASE_ANON_KEY）
2. IF Google OAuth 憑證遺失或無效 THEN 系統 SHALL 顯示明確的設定錯誤訊息
3. WHEN 系統啟動 THEN 系統 SHALL 驗證 Supabase 客戶端連線狀態
4. WHERE 在開發環境 THE 系統 SHALL 提供詳細的 OAuth 設定除錯資訊

---

### 需求 2：Google OAuth 認證流程

**使用者故事**：身為使用者，我希望能夠使用 Google 帳號快速登入，而不需要建立新的帳號密碼。

#### 驗收標準

1. WHEN 使用者點擊「使用 Google 登入」按鈕 THEN 系統 SHALL 重導向至 Supabase Google OAuth 授權頁面
2. WHEN OAuth 回調被接收並包含授權碼 THEN 系統 SHALL 將授權碼交換為存取令牌
3. IF 使用者成功授權 THEN 系統 SHALL 從 Google 取得使用者基本資訊（email, name, profile picture）
4. WHEN 新使用者完成 OAuth 授權 THEN 系統 SHALL 使用 Google 帳號資訊建立新使用者記錄
5. IF OAuth 授權被使用者拒絕 THEN 系統 SHALL 顯示友善的取消訊息並返回登入頁面
6. WHERE OAuth 回調 URL 不在白名單中 THE 系統 SHALL 拒絕請求並記錄安全事件

---

### 需求 3：OAuth 使用者資料建立與整合

**使用者故事**：身為使用者，我希望使用 Google 登入時，系統能自動建立我的帳號並保留我的 Google 資訊。

#### 驗收標準

1. WHEN 使用者首次使用 Google 登入 THEN 系統 SHALL 檢查 email 是否已存在於使用者表中
2. IF 使用者記錄不存在 THEN 系統 SHALL 建立新使用者記錄包含：
   - email（來自 Google）
   - name（來自 Google display name）
   - oauth_provider = 'google'
   - oauth_id（Google user ID）
   - password_hash = NULL
   - karma_level = 'Neutral'（預設值）
3. IF 相同 email 的使用者已存在但 oauth_provider 為 NULL THEN 系統 SHALL 更新該使用者記錄並設定 oauth_provider 和 oauth_id
4. WHEN OAuth 使用者成功建立 THEN 系統 SHALL 初始化該使用者的 karma 系統為中立等級
5. IF Google 未提供 name 資訊 THEN 系統 SHALL 使用 email 的本地部分作為預設 name

---

### 需求 4：傳統登入方式重構（Email + Password）

**使用者故事**：身為使用者，我希望使用 email 和 password 登入，而不需要記住額外的 username。

#### 驗收標準

1. WHEN 使用者在登入表單輸入憑證 THEN 系統 SHALL 接受 email 和 password 作為登入欄位
2. IF 使用者輸入的 email 格式無效 THEN 系統 SHALL 顯示即時驗證錯誤訊息
3. WHEN 使用者提交 email + password THEN 系統 SHALL 使用 email 查詢使用者記錄
4. IF 使用者記錄存在且 password_hash 不為 NULL THEN 系統 SHALL 驗證 password 與儲存的 password_hash
5. IF 密碼驗證成功 THEN 系統 SHALL 建立使用者會話並返回 JWT token
6. IF email 不存在或密碼不匹配 THEN 系統 SHALL 顯示通用錯誤訊息「Email 或密碼錯誤」（避免洩露帳號存在資訊）
7. WHEN 使用者嘗試使用 email + password 登入但該帳號為 OAuth 帳號（password_hash = NULL）THEN 系統 SHALL 提示使用者使用 Google 登入

---

### 需求 5：使用者註冊流程重構

**使用者故事**：身為新使用者，我希望使用 email 註冊帳號，並能自訂我的顯示名稱。

#### 驗收標準

1. WHEN 使用者訪問註冊頁面 THEN 系統 SHALL 顯示包含 email、password、confirm_password、name 欄位的註冊表單
2. IF 使用者輸入的 email 已存在於系統中 THEN 系統 SHALL 顯示「此 Email 已被註冊」錯誤訊息
3. WHEN 使用者提交註冊表單 THEN 系統 SHALL 驗證：
   - Email 格式有效
   - Password 符合強度要求（至少 8 字元）
   - Password 和 Confirm Password 相符
   - Name 不為空且長度在 1-50 字元之間
4. IF 所有驗證通過 THEN 系統 SHALL 建立新使用者記錄包含：
   - email（唯一）
   - name（顯示名稱）
   - password_hash（bcrypt 加密後的密碼）
   - oauth_provider = NULL
   - oauth_id = NULL
   - karma_level = 'Neutral'
5. WHEN 使用者註冊成功 THEN 系統 SHALL 自動登入使用者並重導向至 dashboard

---

### 需求 6：使用者資料表 Schema 更新

**使用者故事**：身為開發者，我需要更新資料表結構以支援新的認證機制。

#### 驗收標準

1. WHEN 資料庫遷移執行 THEN 系統 SHALL 執行以下 schema 變更：
   - 移除 username 欄位（如果存在）
   - 新增或重構 name 欄位（VARCHAR(50), NOT NULL）
   - 新增 oauth_provider 欄位（VARCHAR(20), NULLABLE）
   - 新增 oauth_id 欄位（VARCHAR(255), NULLABLE）
   - 確保 email 欄位為 UNIQUE NOT NULL
   - 修改 password_hash 為 NULLABLE（OAuth 使用者可為 NULL）
2. IF 現有使用者表中有 username 資料 THEN 遷移腳本 SHALL 將 username 值複製到 name 欄位
3. WHEN 遷移完成 THEN 系統 SHALL 建立複合唯一索引於 (oauth_provider, oauth_id)
4. IF 遷移失敗 THEN 系統 SHALL 回滾所有變更並記錄詳細錯誤訊息

---

### 需求 7：統一會話管理

**使用者故事**：身為使用者，無論我使用 Google 登入或 email 登入，我都希望有一致的使用體驗。

#### 驗收標準

1. WHEN 使用者成功認證（OAuth 或 email/password）THEN 系統 SHALL 建立統一格式的會話 token
2. WHILE 使用者會話有效 THE 系統 SHALL 在 token 過期前自動刷新 token
3. IF 會話 token 過期且無法刷新 THEN 系統 SHALL 清除本地會話並提示使用者重新登入
4. WHEN 系統儲存會話 token THEN 系統 SHALL 使用 httpOnly cookies 以防止 XSS 攻擊
5. WHERE 使用者在行動裝置上 THE 系統 SHALL 提供適合行動裝置的 OAuth 重導向流程
6. IF CSRF token 驗證失敗 THEN 系統 SHALL 拒絕請求並清除可疑會話

---

### 需求 8：使用者檔案管理

**使用者故事**：身為使用者，我希望能查看和編輯我的個人資料，包括我的顯示名稱。

#### 驗收標準

1. WHEN 認證使用者訪問個人資料頁面 THEN 系統 SHALL 顯示：
   - Email（不可編輯）
   - Name（可編輯）
   - 頭像（如果是 Google 使用者則顯示 Google profile picture）
   - 登入方式（Google OAuth 或 Email/Password）
2. IF 使用者是 Google OAuth 使用者 THEN 系統 SHALL 顯示「已連結 Google 帳號」標籤
3. WHEN 使用者更新 name 欄位 THEN 系統 SHALL 驗證新名稱長度在 1-50 字元之間
4. IF 名稱驗證通過 THEN 系統 SHALL 更新使用者記錄並顯示成功訊息
5. WHERE 使用者資料無法從資料庫載入 THE 系統 SHALL 顯示錯誤訊息並提供重試選項

---

### 需求 9：路由保護與存取控制

**使用者故事**：身為使用者，我希望只有在登入後才能存取需要認證的功能。

#### 驗收標準

1. WHEN 未認證使用者嘗試存取受保護路由 THEN 系統 SHALL 重導向至登入頁面並保存原始 URL
2. WHEN 認證使用者存取受保護路由 THEN 系統 SHALL 允許存取並渲染頁面內容
3. IF 使用者會話在瀏覽受保護頁面時過期 THEN 系統 SHALL 顯示會話過期訊息並重導向至登入頁面
4. WHEN 使用者成功登入後 THEN 系統 SHALL 重導向至原始請求的 URL（如果有保存）
5. WHERE API 端點需要認證 THE 系統 SHALL 驗證請求中的 JWT token

---

### 需求 10：登出與會話清理

**使用者故事**：身為使用者，我希望能安全地登出系統並清除我的會話資料。

#### 驗收標準

1. WHEN 使用者點擊登出按鈕 THEN 系統 SHALL 執行以下操作：
   - 清除前端 Zustand authStore 狀態
   - 清除 httpOnly cookies
   - 呼叫 Supabase signOut API（如果是 OAuth 使用者）
   - 重導向至首頁
2. IF 登出過程中發生錯誤 THEN 系統 SHALL 仍然清除本地狀態並完成登出
3. WHEN 使用者登出後 THEN 系統 SHALL 確保所有受保護路由不可存取

---

### 需求 11：錯誤處理

**使用者故事**：身為使用者，當登入過程發生錯誤時，我希望能看到清楚的錯誤訊息。

#### 驗收標準

1. IF OAuth 授權流程失敗 THEN 系統 SHALL 顯示使用者友善的錯誤訊息（例如：「Google 登入失敗，請稍後再試」）
2. WHEN 網路錯誤發生於認證過程中 THEN 系統 SHALL 提供「重試」選項
3. IF Supabase API 返回錯誤 THEN 系統 SHALL 記錄詳細錯誤日誌並顯示通用錯誤訊息給使用者
4. WHERE 錯誤發生在 OAuth 回調處理 THE 系統 SHALL 安全地返回登入頁面並清除任何部分狀態
5. IF 使用者輸入無效憑證超過 5 次 THEN 系統 SHALL 暫時鎖定該帳號 15 分鐘並顯示鎖定訊息

---

### 需求 12：Wasteland Tarot 系統整合

**使用者故事**：身為使用者，我希望我的 Google 帳號能完整整合到 Wasteland Tarot 的所有功能中。

#### 驗收標準

1. WHEN 使用者首次使用 Google 登入 THEN 系統 SHALL 初始化該使用者的 Karma 系統為「中立」等級
2. WHEN 認證使用者執行塔羅占卜 THEN 系統 SHALL 將占卜記錄儲存至該使用者的閱讀歷史
3. IF 使用者有個人化偏好設定 THEN 系統 SHALL 關聯這些設定到使用者的 email（無論登入方式）
4. WHEN OAuth 使用者執行影響 Karma 的動作 THEN 系統 SHALL 正確追蹤並更新其 Karma 分數
5. WHERE 使用者有陣營親和度資料 THE 系統 SHALL 在占卜解讀中反映該使用者的陣營傾向

---

### 需求 13：前後端整合

**使用者故事**：身為開發者，我需要確保前端和後端的認證機制完全同步。

#### 驗收標準

1. WHEN 前端 LoginForm 元件提交登入請求 THEN 系統 SHALL 呼叫後端 `/api/auth/login` 端點
2. WHEN 前端執行 Google OAuth 流程 THEN 系統 SHALL 使用 Supabase 客戶端處理認證
3. IF 後端 JWT token 驗證失敗 THEN 前端 SHALL 清除本地認證狀態並提示重新登入
4. WHEN Zustand authStore 更新使用者狀態 THEN 系統 SHALL 同步更新所有依賴認證狀態的 UI 元件
5. WHERE 後端使用者服務（user_service.py）THE 系統 SHALL 提供統一的使用者 CRUD 操作支援 OAuth 和傳統登入使用者

---

### 需求 14：安全性要求

**使用者故事**：身為系統管理員，我需要確保認證系統符合安全最佳實踐。

#### 驗收標準

1. WHEN 系統儲存密碼 THEN 系統 SHALL 使用 bcrypt 進行雜湊處理（成本因子 >= 12）
2. WHEN 系統產生 JWT token THEN 系統 SHALL 設定合理的過期時間（存取令牌 30 分鐘，刷新令牌 7 天）
3. IF 偵測到可疑登入活動（例如：短時間內多次失敗嘗試）THEN 系統 SHALL 觸發速率限制
4. WHEN OAuth 回調包含 state 參數 THEN 系統 SHALL 驗證 state 值以防止 CSRF 攻擊
5. WHERE HTTPS 在生產環境中 THE 系統 SHALL 強制所有認證相關請求使用 HTTPS
6. IF 密碼重設功能被觸發 THEN 系統 SHALL 僅對非 OAuth 使用者（password_hash != NULL）提供此功能

---

### 需求 15：測試與驗證

**使用者故事**：身為 QA 工程師，我需要能夠驗證所有認證流程正常運作。

#### 驗收標準

1. WHEN 執行單元測試 THEN 系統 SHALL 涵蓋以下測試案例：
   - Google OAuth 流程（成功與失敗情境）
   - Email + Password 登入（有效與無效憑證）
   - 使用者註冊驗證邏輯
   - 會話管理與 token 刷新
   - 資料表遷移腳本
2. WHEN 執行整合測試 THEN 系統 SHALL 驗證前後端認證流程端到端運作
3. IF 測試環境需要 OAuth 測試 THEN 系統 SHALL 提供 mock Google OAuth 回應
4. WHERE 資料庫遷移被測試 THE 測試 SHALL 驗證舊資料正確遷移至新 schema

---

## 非功能性需求

### 效能需求

1. WHEN 使用者發起 OAuth 登入 THEN 系統 SHALL 在 2 秒內完成重導向
2. WHEN 使用者提交 email + password 登入 THEN 系統 SHALL 在 1 秒內返回結果
3. WHEN 會話 token 需要刷新 THEN 系統 SHALL 在背景執行不中斷使用者操作

### 可用性需求

1. WHEN 使用者在行動裝置上使用 OAuth 登入 THEN 系統 SHALL 提供行動裝置優化的體驗
2. WHEN 使用者遇到錯誤 THEN 系統 SHALL 提供清楚的繁體中文錯誤訊息和建議操作
3. WHERE 登入表單存在 THE 系統 SHALL 支援鍵盤導航和螢幕閱讀器

### 可擴展性需求

1. WHEN 未來需要新增其他 OAuth 提供者（Facebook、Twitter）THEN 系統架構 SHALL 允許輕鬆擴展
2. WHERE 資料表設計 THE Schema SHALL 支援多重 OAuth 提供者綁定至同一使用者

---

## 驗收總結

本規格定義的功能將透過以下方式驗證：

1. **單元測試**：驗證個別函式和元件的正確性
2. **整合測試**：驗證前後端認證流程的完整性
3. **手動測試**：在開發環境中測試完整的使用者流程
4. **資料遷移測試**：確保現有使用者資料正確遷移

所有驗收標準必須通過才能視為此功能完成。
