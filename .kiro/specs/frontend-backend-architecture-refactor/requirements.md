# 需求文件

## 簡介

本專案目前存在架構問題：前端直接使用 Supabase 客戶端存取資料庫和認證服務，違反了分層架構原則。正確的架構應該是前端完全透過後端 API 層進行所有資料操作，後端負責與 Supabase 互動。

此重構將確保：
- **安全性集中管理**：所有資料存取控制和認證邏輯集中在後端
- **職責清楚分離**：前端專注 UI/UX，後端專注業務邏輯和資料存取
- **可維護性提升**：單一資料存取點，更容易除錯和擴展
- **一致性保證**：所有資料操作經過統一的 API 層驗證和處理

## 需求

### 需求 1：前端移除 Supabase 直接存取
**目標：** 身為開發團隊，我希望前端不直接使用 Supabase 客戶端，改為透過後端 API 存取資料，以確保架構分層清晰且安全性集中管理

#### 驗收準則

1. WHEN 前端需要存取資料 THEN 前端 SHALL 透過後端 API endpoints 進行所有資料操作
2. WHEN 前端需要進行認證操作 THEN 前端 SHALL 使用後端提供的認證 API，而非直接呼叫 Supabase Auth
3. WHERE 前端程式碼中 THEN 前端 SHALL NOT 包含任何直接的 Supabase 資料庫查詢（`supabase.from()`）
4. WHERE OAuth 流程中 THEN 前端 SHALL 僅負責觸發 OAuth 重導向和接收回調，實際 token 交換 SHALL 由後端處理
5. WHEN 移除前端 Supabase 直接存取後 THEN 專案 SHALL 移除 `src/utils/supabase/client.ts` 和 `src/utils/supabase/server.ts` 等直接存取 Supabase 的工具檔案

### 需求 2：重構 Middleware 認證機制
**目標：** 身為系統架構師，我希望 Next.js middleware 不直接驗證 Supabase session，改為驗證後端發放的 JWT token，以確保認證邏輯集中在後端

#### 驗收準則

1. WHEN Next.js middleware 需要驗證使用者認證狀態 THEN middleware SHALL 透過後端 API 驗證 JWT token
2. WHEN middleware 檢查受保護路由 THEN middleware SHALL 使用後端提供的 session 驗證端點（如 `/api/v1/auth/verify`）
3. WHERE middleware 程式碼中 THEN middleware SHALL NOT 直接呼叫 Supabase `getUser()` 或 `getSession()`
4. IF 使用者的 JWT token 即將過期（< 5 分鐘）THEN middleware SHALL 呼叫後端 refresh token 端點以更新 token
5. WHEN middleware 驗證失敗 THEN middleware SHALL 清除客戶端 cookies 並重導向至登入頁

### 需求 3：統一認證流程至後端 API
**目標：** 身為使用者，我希望所有認證操作（OAuth、傳統登入、登出）都透過統一的後端 API，以獲得一致的安全性保護和使用者體驗

#### 驗收準則

1. WHEN 使用者進行 Google OAuth 登入 THEN 系統 SHALL 使用後端 `/api/v1/auth/oauth/callback` 處理授權碼交換
2. WHEN 使用者進行傳統 Email/Password 登入 THEN 系統 SHALL 呼叫後端 `/api/v1/auth/login` 進行認證
3. WHEN 使用者登出 THEN 系統 SHALL 呼叫後端 `/api/v1/auth/logout` 清除 session 和 cookies
4. WHERE 認證成功後 THEN 後端 SHALL 設定 httpOnly cookies 儲存 JWT tokens（access token 和 refresh token）
5. WHEN 前端需要當前使用者資訊 THEN 前端 SHALL 呼叫後端 `/api/v1/auth/me` 或 `/api/v1/users/me` 取得使用者資料
6. IF 後端檢測到 Supabase session 失效 THEN 後端 SHALL 自動清除對應的 JWT tokens 並返回 401 Unauthorized

### 需求 4：後端實作 Supabase 整合層
**目標：** 身為後端開發者，我希望後端提供完整的 Supabase 資料存取服務層，讓前端可以透過 RESTful API 存取所有必要的資料和功能

#### 驗收準則

1. WHEN 前端需要讀取 Wasteland Cards 資料 THEN 後端 SHALL 提供 `/api/v1/cards` 端點從 Supabase 查詢並返回資料
2. WHEN 前端需要建立或查詢 Readings THEN 後端 SHALL 提供 `/api/v1/readings` CRUD 端點
3. WHERE 後端 API endpoints 中 THEN 後端 SHALL 使用 Supabase Service Role Key 進行資料庫操作，確保 Row Level Security (RLS) 正確執行
4. WHEN 後端執行 Supabase 操作時 THEN 後端 SHALL 處理錯誤並返回標準化的 HTTP 錯誤回應（如 400, 401, 403, 500）
5. WHERE 使用者認證必要時 THEN 後端 SHALL 從 JWT token 解析使用者 ID，並將其用於 Supabase RLS 政策驗證

### 需求 5：更新前端 authStore 和 API 客戶端
**目標：** 身為前端開發者，我希望 authStore 和 API 客戶端完全改為使用後端 API，移除所有 Supabase 直接依賴，以簡化前端邏輯並提升可測試性

#### 驗收準則

1. WHEN authStore 執行登入操作 THEN authStore SHALL 呼叫後端 `/api/v1/auth/login` API
2. WHEN authStore 執行登出操作 THEN authStore SHALL 呼叫後端 `/api/v1/auth/logout` API 並清除本地 storage
3. WHERE authStore 中 THEN authStore SHALL NOT 引入任何 Supabase 客戶端程式碼（如 `@/utils/supabase/client`）
4. WHEN sessionManager 需要刷新 session THEN sessionManager SHALL 呼叫後端 `/api/v1/auth/refresh` 而非 Supabase `refreshSession()`
5. WHERE useOAuth hook 中 THEN useOAuth SHALL 保留 Supabase OAuth 重導向邏輯，但 SHALL 將 code exchange 委託給後端處理
6. WHEN API 客戶端發送請求 THEN API 客戶端 SHALL 自動包含後端設定的 httpOnly cookies，不再手動管理 tokens

### 需求 6：後端補充缺失的認證 API 端點
**目標：** 身為後端開發者，我希望後端提供完整的認證相關 API 端點，支援前端所有認證需求

#### 驗收準則

1. WHEN 系統啟動後 THEN 後端 SHALL 提供 `/api/v1/auth/verify` 端點用於驗證當前 JWT token 有效性
2. WHEN 前端需要刷新 token THEN 後端 SHALL 提供 `/api/v1/auth/refresh` 端點使用 refresh token 換取新的 access token
3. WHEN 使用者登入後需要取得個人資料 THEN 後端 SHALL 提供 `/api/v1/auth/me` 或 `/api/v1/users/me` 返回當前使用者完整資訊
4. WHERE 後端認證端點中 THEN 後端 SHALL 使用 httpOnly, Secure, SameSite=Lax cookies 儲存 JWT tokens
5. IF access token 已過期但 refresh token 仍有效 THEN 後端 SHALL 在 `/api/v1/auth/refresh` 自動刷新並返回新的 tokens

### 需求 7：資料遷移與相容性
**目標：** 身為專案維護者，我希望重構過程保持向後相容，不影響現有資料和已登入使用者的體驗

#### 驗收準則

1. WHEN 重構完成部署後 THEN 系統 SHALL 保留 Supabase 資料庫現有的所有資料（users, readings, cards 等）
2. WHERE Supabase Row Level Security (RLS) 政策已設定 THEN 後端 SHALL 確保所有資料存取遵守現有的 RLS 規則
3. IF 使用者在重構前已登入（Supabase session 存在）THEN 系統 SHALL 提供遷移機制將 Supabase session 轉換為後端 JWT session
4. WHEN 重構後首次登入 THEN 系統 SHALL 建立新的後端 JWT session 並清除舊的 Supabase client-side cookies
5. WHERE 資料庫 schema 中 THEN 重構 SHALL NOT 要求修改 Supabase 資料表結構，除非必要且有遷移腳本

### 需求 8：錯誤處理與日誌
**目標：** 身為運維人員，我希望系統提供完整的錯誤處理和日誌記錄，方便追蹤和除錯認證問題

#### 驗收準則

1. WHEN 後端 Supabase 操作失敗 THEN 後端 SHALL 記錄詳細的錯誤日誌（包含操作類型、錯誤訊息、使用者 ID）
2. WHEN 認證 API 返回錯誤 THEN 後端 SHALL 返回結構化的錯誤回應（包含 error code, message, detail）
3. WHERE 前端 API 呼叫失敗 THEN 前端 SHALL 透過 errorStore 統一處理並顯示使用者友善的錯誤訊息
4. IF 後端偵測到異常的認證請求（如 token 偽造）THEN 後端 SHALL 記錄安全警告日誌並拒絕請求
5. WHEN 系統發生認證相關錯誤 THEN 錯誤日誌 SHALL 包含足夠資訊以便追溯問題根源（timestamp, user_id, request_id, error_stack）

### 需求 9：測試覆蓋
**目標：** 身為品質保證人員，我希望所有重構的程式碼都有充分的測試覆蓋，確保功能正確性和穩定性

#### 驗收準則

1. WHEN 後端認證 API 開發完成 THEN 後端 SHALL 包含單元測試覆蓋所有認證端點（login, logout, refresh, verify, me）
2. WHEN 前端 authStore 重構完成 THEN 前端 SHALL 包含單元測試驗證所有 authStore actions（login, logout, initialize）
3. WHERE middleware 認證邏輯重構後 THEN 系統 SHALL 包含整合測試驗證受保護路由的存取控制
4. WHEN OAuth 流程重構完成 THEN 系統 SHALL 包含端對端測試模擬完整的 OAuth 登入流程
5. IF 重構涉及 API 行為變更 THEN 測試 SHALL 涵蓋邊界情況（token 過期、無效 token、網路錯誤等）

### 需求 10：文件更新
**目標：** 身為開發團隊成員，我希望所有架構變更都有清楚的文件說明，方便後續開發和維護

#### 驗收準則

1. WHEN 架構重構完成 THEN 系統 SHALL 更新 `.kiro/steering/structure.md` 說明新的認證流程和資料流向
2. WHEN 後端 API 新增端點 THEN 系統 SHALL 在 Swagger/OpenAPI 文件中記錄所有認證相關端點的請求/回應格式
3. WHERE CLAUDE.md 或 README.md 中 THEN 文件 SHALL 說明前端如何正確使用後端 API 進行認證和資料存取
4. WHEN 重構完成後 THEN 系統 SHALL 提供遷移指南（Migration Guide）說明開發者如何更新現有程式碼
5. IF 環境變數需要調整 THEN 文件 SHALL 更新 `.env.example` 並說明新的環境變數配置

## 非功能性需求

### 效能要求
- 後端 API 認證端點回應時間應 < 200ms（P95）
- Middleware token 驗證延遲應 < 50ms
- Supabase 查詢應使用連線池，避免連線數過多

### 安全性要求
- JWT tokens 必須使用 httpOnly, Secure, SameSite=Lax cookies
- Access token 有效期應設定為 15 分鐘
- Refresh token 有效期應設定為 7 天
- 後端必須驗證所有 JWT tokens 的簽章和過期時間
- Supabase Service Role Key 必須僅在後端使用，不可洩漏至前端

### 可維護性要求
- 所有認證相關程式碼應集中在明確的模組（如 `backend/app/services/auth_service.py`）
- 前端 API 客戶端應統一使用 `src/lib/api.ts`
- 錯誤處理應遵循專案現有的錯誤處理模式（使用 errorStore 和 custom exceptions）
