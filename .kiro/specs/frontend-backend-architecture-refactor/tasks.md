# 實作計畫

## 階段 1：後端認證 API 開發

- [x] 1. 實作 JWT Cookie 管理機制
- [x] 1.1 建立 Cookie 安全配置工具函式
  - 實作 access token cookie 配置（httpOnly, secure, samesite=lax, 30分鐘）
  - 實作 refresh token cookie 配置（httpOnly, secure, samesite=lax, 7天）
  - 支援開發環境與生產環境的不同設定（secure flag 依環境調整）
  - _需求: 3.4, 6.4, 安全性要求_
  - **已完成**: 使用現有的 `get_access_token_cookie_settings()` 和 `get_refresh_token_cookie_settings()`

- [x] 1.2 實作 Cookie 設定和清除輔助函式
  - 提供統一的 cookie 設定介面給認證端點使用
  - 提供 cookie 清除功能（登出時使用）
  - 確保 cookie 路徑和域名設定正確
  - _需求: 3.3, 3.4_
  - **已完成**: 在 `security.py` 中已實作

- [ ] 2. 擴展 AuthenticationService 實作後端認證邏輯
- [ ] 2.1 實作 JWT token 驗證功能
  - 建立 token 解碼和驗證邏輯（檢查簽章、過期時間、token type）
  - 處理 token 驗證失敗的各種情況（過期、簽章錯誤、格式錯誤）
  - 從 token payload 提取使用者資訊
  - _需求: 6.1, 安全性要求_

- [ ] 2.2 實作 token 刷新邏輯
  - 驗證 refresh token 的有效性和類型
  - 使用 refresh token 生成新的 access token 和 refresh token
  - 處理 refresh token 過期或無效的情況
  - _需求: 6.2, 6.5_

- [ ] 2.3 更新 OAuth 回調處理邏輯
  - 整合 Supabase OAuth code exchange（使用 service role key）
  - 建立或更新使用者記錄（標記為 OAuth 使用者）
  - 生成 JWT tokens 並準備 cookie 回應
  - _需求: 3.1, 5.5_

- [x] 3. 建立新的認證 API 端點
- [x] 3.1 實作 POST /api/v1/auth/verify 端點
  - 從 request cookies 提取 access token
  - 驗證 token 有效性並返回使用者資訊
  - 處理 token 無效或過期的錯誤回應（401）
  - _需求: 2.2, 6.1_
  - **已完成**: 在 `app/api/v1/endpoints/auth.py` 實作

- [x] 3.2 實作 POST /api/v1/auth/refresh 端點
  - 從 request cookies 提取 refresh token
  - 驗證並刷新 tokens
  - 設定新的 access_token 和 refresh_token cookies
  - 處理刷新失敗的情況（401）
  - _需求: 2.4, 6.2, 6.5_
  - **已完成**: 在 `app/api/v1/endpoints/auth.py` 實作

- [ ] 3.3 更新 POST /api/v1/auth/oauth/callback 端點
  - 接收授權碼和 provider 參數
  - 呼叫 AuthenticationService 處理 OAuth callback
  - 設定 httpOnly cookies 儲存 JWT tokens
  - 返回使用者資訊和成功訊息
  - _需求: 3.1, 5.5_
  - **部分完成**: OAuth callback 已在 `app/api/oauth.py` 實作並使用 cookies

- [ ] 3.4 更新 POST /api/v1/auth/login 端點
  - 確保登入成功後設定 httpOnly cookies
  - 返回使用者資訊（不包含 tokens 在 response body）
  - 處理 OAuth 使用者嘗試密碼登入的情況
  - _需求: 3.2, 3.4_
  - **待實作**: 需要實作完整的傳統登入邏輯

- [x] 3.5 更新 POST /api/v1/auth/logout 端點
  - 清除 access_token 和 refresh_token cookies
  - 返回登出成功訊息和 OAuth 使用者標記
  - _需求: 3.3_
  - **已完成**: 在 `app/api/v1/endpoints/auth.py` 實作

- [x] 3.6 確保 GET /api/v1/auth/me 端點運作正常
  - 從 cookies 驗證使用者身份
  - 返回當前使用者完整資訊和統計資料
  - 處理未認證請求（401）
  - _需求: 3.5, 6.3_
  - **已完成**: 在 `app/api/v1/endpoints/auth.py` 實作

- [ ] 4. 建立 Supabase 整合服務層
- [ ] 4.1 建立 SupabaseService 基礎架構
  - 使用 service role key 初始化 Supabase 客戶端
  - 實作連線池管理和重試邏輯
  - 確保 service role key 僅在後端使用（環境變數）
  - _需求: 4.3, 安全性要求, 效能要求_

- [ ] 4.2 實作資料查詢功能
  - 建立統一的資料表查詢介面（支援 filters）
  - 確保 RLS policies 正確套用（傳遞 user_id context）
  - 處理查詢錯誤並返回標準化錯誤
  - _需求: 4.1, 4.4, 4.5_

- [ ] 4.3 實作資料寫入功能
  - 建立記錄插入介面（insert_record）
  - 建立記錄更新介面（update_record）
  - 建立記錄刪除介面（delete_record）
  - 確保所有寫入操作遵守 RLS policies
  - _需求: 4.2, 4.3, 4.5_

- [ ] 5. 更新現有資料 API 端點使用 SupabaseService
- [ ] 5.1 更新 GET /api/v1/cards 端點
  - 使用 SupabaseService 查詢 wasteland_cards
  - 從 JWT token 提取 user_id（如需要）
  - 實作分頁支援
  - _需求: 4.1, 1.1_

- [ ] 5.2 更新 /api/v1/readings 相關端點
  - 使用 SupabaseService 查詢和操作 readings
  - 確保使用者只能存取自己的 readings（RLS）
  - 實作 CRUD 操作（GET, POST, PUT, DELETE）
  - _需求: 4.2, 1.1_

- [ ] 6. 實作錯誤處理和日誌記錄
- [ ] 6.1 建立認證錯誤處理機制
  - 統一處理 token 驗證錯誤（InvalidTokenError）
  - 統一處理認證失敗錯誤（InvalidCredentialsError）
  - 返回結構化錯誤回應（包含 error code, message, detail）
  - _需求: 8.2, 8.4_

- [ ] 6.2 建立 Supabase 操作日誌
  - 記錄所有 Supabase 操作（查詢、插入、更新、刪除）
  - 記錄錯誤詳情（操作類型、錯誤訊息、user_id）
  - 包含足夠資訊以便追溯（timestamp, request_id, error_stack）
  - _需求: 8.1, 8.5_

- [ ] 6.3 建立安全警告日誌
  - 偵測異常認證請求（token 偽造、多次失敗登入）
  - 記錄安全警告並拒絕請求
  - 追蹤可疑活動（IP, user_agent, timestamp）
  - _需求: 8.4_

- [ ] 7. 撰寫後端單元測試
- [ ] 7.1 測試認證服務功能
  - 測試傳統登入流程（正確密碼、錯誤密碼、OAuth 使用者登入）
  - 測試 OAuth callback 處理（新使用者、現有使用者）
  - 測試 token 驗證和刷新邏輯
  - _需求: 9.1_

- [ ] 7.2 測試認證 API 端點
  - 測試 /auth/verify 端點（有效 token、無效 token、過期 token）
  - 測試 /auth/refresh 端點（有效 refresh token、過期 token）
  - 測試 /auth/login、/auth/logout、/auth/me 端點
  - _需求: 9.1_

- [ ] 7.3 測試 Supabase 整合層
  - 測試資料查詢功能（with RLS policies）
  - 測試資料寫入功能（insert, update, delete）
  - 測試錯誤處理和重試邏輯
  - _需求: 4.3, 4.4_

## 階段 2：前端重構

- [ ] 8. 重構 authStore 移除 Supabase 依賴
- [ ] 8.1 更新 login action 使用後端 API
  - 移除 Supabase 客戶端引用
  - 改為呼叫 POST /api/v1/auth/login（credentials: 'include'）
  - 從 response 更新 user 狀態（不再手動管理 tokens）
  - 處理登入錯誤（顯示錯誤訊息）
  - _需求: 5.1, 5.3_

- [ ] 8.2 更新 logout action 使用後端 API
  - 移除 Supabase signOut 呼叫
  - 改為呼叫 POST /api/v1/auth/logout
  - 清除 authStore 狀態和 localStorage
  - 重導向至首頁
  - _需求: 5.2, 5.3_

- [ ] 8.3 更新 initialize action 使用後端 API
  - 移除 localStorage token 檢查
  - 改為呼叫 GET /api/v1/auth/me（依賴 httpOnly cookies）
  - 根據回應更新 user 狀態
  - 處理未認證情況（401 表示未登入）
  - _需求: 5.3, 5.6_

- [ ] 8.4 更新 setOAuthUser action
  - 移除 localStorage token 儲存
  - 僅更新 authStore 的 user 狀態
  - 標記 isOAuthUser 和 oauthProvider
  - _需求: 5.3_

- [ ] 8.5 移除舊的 token 管理邏輯
  - 移除 refreshToken action（改由 API client 自動處理）
  - 移除 localStorage TOKEN_KEY 和 USER_KEY 操作
  - 清理未使用的 imports
  - _需求: 5.3, 5.6_

- [x] 9. 更新 API Client 支援 httpOnly Cookies
- [x] 9.1 設定 credentials: 'include' 於所有請求
  - 更新 apiRequest 函式預設設定
  - 確保所有 API 呼叫自動包含 cookies
  - 更新 CORS 設定以允許 credentials
  - _需求: 5.6_
  - **已完成**: apiRequest 函式已設定 `credentials: 'include'`，authAPI 所有方法已更新移除 token 參數

- [ ] 9.2 實作自動 token 刷新邏輯
  - 偵測 401 Unauthorized 回應
  - 自動呼叫 POST /api/v1/auth/refresh 嘗試刷新
  - 刷新成功後重新執行原請求
  - 刷新失敗則清除 authStore 並重導向登入頁
  - _需求: 5.6_
  - **待實作**: 需要在 apiRequest 函式中實作自動刷新邏輯

- [x] 9.3 移除手動 Authorization header 管理
  - 移除從 localStorage 讀取 token 的邏輯
  - 移除手動設定 Authorization header
  - 依賴 httpOnly cookies 自動傳送
  - _需求: 5.6_
  - **已完成**: authAPI 所有方法已移除 Authorization header 設定

- [x] 10. 更新 useOAuth hook
- [x] 10.1 保留 OAuth 重導向邏輯
  - 保持 signInWithGoogle 使用 Supabase Auth 觸發重導向
  - 確保 redirectTo 設定為 /auth/callback
  - _需求: 1.4, 5.5_
  - **已完成**: signInWithGoogle 保持使用 Supabase Auth OAuth 流程

- [x] 10.2 更新 OAuth callback 處理
  - 從 URL 提取授權碼（code）
  - 呼叫後端 POST /auth/oauth/callback 交換 code（使用正確的 API_BASE_URL）
  - 後端會設定 httpOnly cookies，前端僅需更新 authStore
  - 處理回調錯誤（顯示錯誤訊息）
  - _需求: 1.4, 5.5_
  - **已完成**: useOAuth hook 和 callback page 已更新，不再傳遞 token 參數給 setOAuthUser

- [ ] 11. 重寫 sessionManager 移除 Supabase 依賴
- [ ] 11.1 移除 Supabase session 刷新邏輯
  - 刪除 refreshSession 函式（改由 API client 自動刷新）
  - 刪除 validateSession 函式（middleware 負責驗證）
  - 刪除 setupAutoRefresh 和定時器邏輯
  - _需求: 5.4, 5.3_

- [ ] 11.2 移除 Supabase Auth 監聽器
  - 刪除 setupAuthListener 函式
  - 移除 onAuthStateChange 訂閱
  - 清理相關的 cleanup 函式
  - _需求: 5.3_

- [ ] 11.3 考慮完全刪除 sessionManager.ts
  - 評估是否仍需要此檔案
  - 如不需要則完全移除
  - 更新相關 imports
  - _需求: 5.3_

- [x] 12. 重寫 Next.js Middleware
- [x] 12.1 移除 Supabase middleware 依賴
  - 刪除 import { updateSession } from '@/utils/supabase/middleware'
  - 移除直接呼叫 supabase.auth.getUser() 的邏輯
  - _需求: 2.3, 1.3_
  - **已完成**: 完全移除 Supabase middleware 依賴

- [x] 12.2 實作後端 API token 驗證
  - 建立 verifyTokenWithBackend 輔助函式
  - 呼叫 POST /api/v1/auth/verify 驗證 token
  - 傳遞 cookies 至後端（forward Cookie header）
  - _需求: 2.1, 2.2_
  - **已完成**: 實作 verifyTokenWithBackend 函式，透過後端 API 驗證 JWT

- [x] 12.3 實作受保護路由邏輯
  - 檢查 pathname 是否為受保護路由
  - 若是且 token 無效，清除 cookies 並重導向登入頁
  - 若是公開路由且已登入，重導向至 dashboard
  - _需求: 2.1, 2.5_
  - **已完成**: 受保護路由和公開路由邏輯完整實作，OAuth callback 特殊處理

- [ ] 12.4 實作 token 即將過期檢查（可選）
  - 檢測 token 是否即將過期（< 5 分鐘）
  - 若即將過期，呼叫 POST /api/v1/auth/refresh 刷新
  - 處理刷新失敗的情況
  - _需求: 2.4_
  - **待實作**: 此功能為可選，可後續實作

- [ ] 13. 移除前端 Supabase 工具檔案
- [ ] 13.1 刪除 Supabase 客戶端檔案
  - 刪除 src/utils/supabase/client.ts
  - 刪除 src/utils/supabase/server.ts
  - 刪除 src/utils/supabase/middleware.ts
  - 刪除整個 src/utils/supabase 目錄（如無其他檔案）
  - _需求: 1.5_

- [ ] 13.2 清理 Supabase 相關 imports
  - 搜尋專案中所有 Supabase 客戶端引用
  - 移除未使用的 import 語句
  - 確認無任何前端程式碼直接使用 Supabase
  - _需求: 1.3, 5.3_

- [ ] 13.3 移除 @supabase/ssr 依賴（可選）
  - 評估是否仍需要此套件（OAuth 重導向仍使用）
  - 如不需要則從 package.json 移除
  - 執行 bun install 更新依賴
  - _需求: 1.5_

- [ ] 14. 撰寫前端單元測試
- [ ] 14.1 測試 authStore actions
  - 測試 login action（成功、失敗、錯誤處理）
  - 測試 logout action（清除狀態、呼叫 API）
  - 測試 initialize action（已登入、未登入）
  - 測試 setOAuthUser action
  - _需求: 9.2_

- [ ] 14.2 測試 API Client 自動刷新邏輯
  - 測試 401 回應觸發刷新
  - 測試刷新成功後重試原請求
  - 測試刷新失敗後清除狀態
  - 測試 credentials: 'include' 設定
  - _需求: 5.6, 9.2_

- [ ] 14.3 測試 useOAuth hook
  - 測試 signInWithGoogle 觸發重導向
  - 測試 handleOAuthCallback 處理授權碼
  - 測試錯誤處理和顯示
  - _需求: 5.5_

## 階段 3：整合測試與部署準備

- [ ] 15. 整合測試
- [ ] 15.1 測試完整認證流程（傳統登入）
  - 測試使用者註冊 → 登入 → 存取受保護頁面 → 登出
  - 驗證 httpOnly cookies 正確設定和清除
  - 驗證 middleware 正確保護路由
  - _需求: 3.2, 3.3, 2.1_

- [ ] 15.2 測試完整 OAuth 流程
  - 測試 Google OAuth 重導向 → callback → 登入成功
  - 驗證後端正確處理授權碼交換
  - 驗證 authStore 正確更新使用者狀態
  - _需求: 3.1, 5.5_

- [ ] 15.3 測試 token 自動刷新機制
  - 模擬 access token 過期情況
  - 驗證 API client 自動呼叫 refresh 端點
  - 驗證刷新成功後繼續執行原請求
  - 驗證 refresh token 過期後重導向登入
  - _需求: 2.4, 6.2_

- [ ] 15.4 測試資料存取透過後端 API
  - 測試 GET /api/v1/cards 返回正確資料
  - 測試 /api/v1/readings CRUD 操作
  - 驗證 RLS policies 正確套用（使用者只能存取自己的資料）
  - _需求: 4.1, 4.2, 4.5_

- [ ] 15.5 測試 Middleware 路由保護
  - 測試未登入存取受保護路由 → 重導向登入頁
  - 測試已登入存取公開路由（/auth/login）→ 重導向 dashboard
  - 測試 token 無效時的處理（清除 cookies）
  - _需求: 2.1, 2.5, 9.3_

- [ ] 16. E2E 測試 (Playwright)
- [ ] 16.1 測試使用者註冊和登入流程
  - 完整流程：註冊 → 登入 → 導向 dashboard → 登出
  - 驗證頁面正確顯示和導航
  - 驗證錯誤訊息正確顯示
  - _需求: 9.4_

- [ ] 16.2 測試 Google OAuth 登入流程
  - 模擬完整 OAuth 流程（可使用測試帳號或 mock）
  - 驗證重導向和 callback 處理
  - 驗證登入成功後導向 dashboard
  - _需求: 9.4_

- [ ] 16.3 測試受保護頁面存取控制
  - 測試未登入存取 /dashboard → 重導向登入
  - 測試登入後可正常存取受保護頁面
  - 測試登出後無法存取受保護頁面
  - _需求: 9.3_

- [ ] 16.4 測試邊界情況
  - 測試網路錯誤時的使用者體驗（顯示錯誤訊息）
  - 測試多個分頁共享 session（cookies 自動同步）
  - 測試 token 過期時自動刷新
  - _需求: 9.5_

- [ ] 17. 效能測試和優化
- [ ] 17.1 測試認證 API 端點效能
  - 測試 /auth/verify 回應時間（目標 < 50ms）
  - 測試 /auth/login 回應時間（目標 < 200ms）
  - 測試 /auth/refresh 回應時間（目標 < 100ms）
  - _需求: 效能要求_

- [ ] 17.2 測試 Middleware 驗證延遲
  - 測量 middleware token 驗證增加的延遲
  - 確保延遲 < 50ms
  - 考慮實作 Redis 快取以優化效能（如需要）
  - _需求: 效能要求_

- [ ] 17.3 驗證 Supabase 連線池配置
  - 確認 asyncpg 連線池正確設定（pool_size=20）
  - 測試高並發情況下的連線管理
  - 監控連線數和回應時間
  - _需求: 效能要求_

- [ ] 18. 文件更新
- [ ] 18.1 更新 .kiro/steering/structure.md
  - 記錄新的認證流程（後端 JWT 驗證）
  - 說明資料流向（前端 → 後端 API → Supabase）
  - 更新架構圖和說明
  - _需求: 10.1_

- [ ] 18.2 更新 Swagger/OpenAPI 文件
  - 記錄所有新增和更新的認證端點
  - 說明 request/response 格式和 cookie 設定
  - 標註錯誤代碼和情況
  - _需求: 10.2_

- [ ] 18.3 撰寫前端開發者指南
  - 在 CLAUDE.md 或 README.md 說明如何使用後端 API 進行認證
  - 提供 authStore 使用範例
  - 說明 OAuth 整合方式
  - _需求: 10.3_

- [ ] 18.4 撰寫遷移指南
  - 記錄從舊架構（前端直接 Supabase）到新架構的變更
  - 提供程式碼遷移範例
  - 說明常見問題和解決方法
  - _需求: 10.4_

- [ ] 18.5 更新環境變數文件
  - 更新 .env.example 說明 Supabase service role key 需求
  - 說明 CORS 設定和 cookie 安全設定
  - 記錄所有必要的環境變數
  - _需求: 10.5_

- [ ] 19. 部署準備和驗證
- [ ] 19.1 準備部署檢查清單
  - 確認所有測試通過（單元、整合、E2E）
  - 驗證環境變數正確設定（包含 service role key）
  - 檢查 CORS 設定允許生產環境域名
  - 確認 cookie secure flag 在生產環境啟用
  - _需求: 7.1, 7.2, 7.4, 安全性要求_

- [ ] 19.2 建立部署計畫
  - 規劃分階段部署策略（先部署後端，再部署前端）
  - 準備 rollback 程序和觸發條件
  - 設定監控和告警（錯誤率、回應時間）
  - _需求: 7.3, 7.4_

- [ ] 19.3 驗證向後相容性
  - 確認 Supabase 資料庫資料完整保留
  - 驗證 RLS policies 繼續正常運作
  - 確認無需修改資料庫 schema
  - _需求: 7.1, 7.2, 7.5_

- [ ] 19.4 準備監控和日誌
  - 設定認證相關日誌追蹤
  - 設定錯誤率和效能監控
  - 準備安全事件告警機制
  - _需求: 8.1, 8.5_

## 需求覆蓋檢查表

- ✅ **需求 1**: 前端移除 Supabase 直接存取 → 任務 5, 8, 9, 10, 13
- ✅ **需求 2**: 重構 Middleware 認證機制 → 任務 3.1, 3.2, 12
- ✅ **需求 3**: 統一認證流程至後端 API → 任務 3, 15.1, 15.2
- ✅ **需求 4**: 後端實作 Supabase 整合層 → 任務 4, 5
- ✅ **需求 5**: 更新前端 authStore 和 API 客戶端 → 任務 8, 9, 10, 11
- ✅ **需求 6**: 後端補充認證 API 端點 → 任務 3
- ✅ **需求 7**: 資料遷移與相容性 → 任務 19.3
- ✅ **需求 8**: 錯誤處理與日誌 → 任務 6, 19.4
- ✅ **需求 9**: 測試覆蓋 → 任務 7, 14, 15, 16
- ✅ **需求 10**: 文件更新 → 任務 18
