# 實作計畫

本文件包含 critical-bugs-fix 功能的詳細實作任務，遵循測試驅動開發（TDD）方法，按技術依賴性排序，確保每個任務可在 1-3 小時內完成。

## 後端：用戶註冊 API 實作

### 1. 確認現有用戶模型架構

- 檢查 `backend/app/models/user.py` 的 User 模型欄位
- 驗證 `email`、`name`、`hashed_password`、`display_name`、`faction_alignment`、`vault_number` 等欄位是否存在
- 確認 SQLAlchemy 模型與資料庫架構一致
- 執行 `uv run alembic current` 檢查遷移狀態
- _Requirements: 1.1, 1.4_

### 2. 實作註冊 API 端點

#### 2.1 建立註冊請求 Pydantic 模型

- 在 `backend/app/api/auth.py` 中確認 `UserRegistrationRequest` 類別是否已存在
- 如不存在，創建包含 `email`、`password`、`confirm_password`、`name` 等欄位的 Pydantic 模型
- 實作 `@field_validator` 驗證器：
  - `validate_password`: 密碼長度至少 8 字元
  - `validate_name`: name 長度 1-50 字元
  - `validate_passwords_match`: 確認 password 和 confirm_password 相符
- 為 Pydantic 模型撰寫單元測試：`backend/tests/unit/test_auth_schemas.py`
- _Requirements: 1.1, 1.3, 1.7_

#### 2.2 實作用戶創建服務邏輯

- 在 `backend/app/services/user_service.py` 檢查 `create_user` 方法是否存在
- 如不存在，實作 `create_user` 方法：
  - 使用 bcrypt 雜湊密碼（透過 `passlib.context.CryptContext`）
  - 檢查 email 唯一性（查詢資料庫）
  - 創建新用戶記錄並儲存至資料庫
  - 拋出 `UserAlreadyExistsError` 當 email 已存在
- 撰寫 `UserService` 單元測試：`backend/tests/unit/test_user_service.py`
  - 測試成功創建用戶
  - 測試重複 email 拋出例外
  - 測試密碼雜湊正確（bcrypt）
- _Requirements: 1.1, 1.2, 1.4_

#### 2.3 實作註冊 API 路由

- 在 `backend/app/api/auth.py` 檢查 `/register` 端點是否存在
- 如不存在，實作 `POST /register` 端點：
  - 接收 `UserRegistrationRequest` 請求
  - 呼叫 `UserService.create_user` 創建用戶
  - 呼叫 `AuthenticationService.login_user` 自動產生 JWT token
  - 初始化 Karma 系統（非致命錯誤）
  - 返回 201 Created 與用戶資料、JWT token
- 處理錯誤：
  - 409 Conflict: Email 已存在
  - 422 Unprocessable Entity: 驗證錯誤
  - 500 Internal Server Error: 未預期錯誤
- 撰寫 API 契約測試：`backend/tests/api/test_auth_endpoints.py`
  - 測試成功註冊並返回 token
  - 測試重複 email 返回 409
  - 測試密碼強度不足返回 422
  - 測試密碼不符返回 422
- _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6_

#### 2.4 整合測試註冊流程

- 撰寫整合測試：`backend/tests/integration/test_user_registration_flow.py`
- 測試完整註冊流程（含資料庫互動）：
  - 成功註冊 → 自動登入 → 返回 token
  - 密碼正確雜湊並儲存
  - Karma 系統正確初始化
- 執行所有後端測試確保覆蓋率 ≥ 80%
- _Requirements: 1.1-1.7, 6.1-6.6_

## 前端：API 路徑配置修復

### 3. 修復前端 API 客戶端

#### 3.1 修正 API 路徑配置

- 檢查 `src/lib/api.ts` 的 `API_BASE_URL` 配置
- 確認使用 `process.env.NEXT_PUBLIC_API_URL` 或預設值 `http://localhost:8000`
- 修正 `authAPI.register` 方法的路徑為 `/api/v1/auth/register`
- 確保所有 API 端點路徑不包含 `undefined` 或重複片段
- 檢查 `.env.local` 檔案是否正確設定 `NEXT_PUBLIC_API_URL`
- _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

#### 3.2 更新註冊 API 請求介面

- 在 `src/lib/api.ts` 更新 `authAPI.register` 方法：
  - 接受參數：`{email, username, password, confirm_password, name, display_name?, faction_alignment?, vault_number?}`
  - 發送 POST 請求至 `/api/v1/auth/register`
  - 返回 `Promise<{message, user, access_token, refresh_token, token_type}>`
- 更新 TypeScript 型別定義確保型別安全
- 撰寫 API 客戶端單元測試：`src/lib/__tests__/api.test.ts`
  - 測試正確的 API 路徑拼接
  - 測試錯誤處理（409, 422, 500）
- _Requirements: 2.1, 2.5, 2.6_

#### 3.3 修復錯誤處理與日誌

- 在 `src/lib/api.ts` 的 `apiRequest` 函數中：
  - 確保 404 錯誤時記錄完整請求 URL（開發環境）
  - 實作重試邏輯（5xx 錯誤）
  - 推送錯誤至 `useErrorStore`
- 撰寫錯誤處理測試
- _Requirements: 2.6_

## 前端：Web Audio 音效系統修復

### 4. 實作 Web Audio 音效生成器

#### 4.1 建立音效生成器模組

- 創建 `src/lib/audio/SoundGenerator.ts`：
  - 實作 `generateButtonClick()`: 使用 sine wave, 短促高頻音
  - 實作 `generateCardFlip()`: 使用 noise + envelope
  - 實作 `generatePipBoyBeep()`: 使用 square wave
  - 實作 `generateTerminalType()`: 使用短脈衝音
  - 實作 `generateVaultDoor()`: 使用低頻 + 掃頻效果
- 每個生成器函數接受參數：`(audioContext: AudioContext, destination: AudioNode, options?: SoundOptions)`
- 使用 `OscillatorNode`、`GainNode`、`AudioBufferSourceNode` 生成音效
- 撰寫單元測試：`src/lib/audio/__tests__/SoundGenerator.test.ts`
- _Requirements: 3.1, 3.2_

#### 4.2 更新 AudioEngine 整合音效生成器

- 修改 `src/lib/audio/AudioEngine.ts`：
  - 移除音檔載入邏輯（`loadSound` 方法中的 `fetch` 呼叫）
  - 整合 `SoundGenerator` 模組
  - 更新 `play` 方法：查找音效配置 → 呼叫對應的生成器函數
  - 確保生成的音效快取至 `audioBuffers`
- 更新 `AudioEngine` 測試以驗證生成器整合
- _Requirements: 3.1, 3.2, 3.3_

#### 4.3 實作音效配置管理

- 在 `src/lib/audio/constants.ts` 定義音效配置：
  - 音效 ID 對應生成器函數
  - 預設參數（頻率、持續時間、波形類型）
  - 優先級（critical, normal, low）
- 在 `src/lib/audio/AudioEngine.ts` 讀取配置並初始化音效
- 撰寫配置驗證測試
- _Requirements: 3.1, 3.9_

#### 4.4 測試 Web Audio 錯誤處理

- 在 `AudioEngine.initialize()` 實作靜默失敗：
  - AudioContext 不支援時記錄錯誤但不拋出例外
  - 捕獲所有音效播放錯誤並記錄至 console
- 撰寫錯誤處理測試：
  - 測試 AudioContext 不支援時不中斷應用
  - 測試音效播放失敗時優雅降級
- _Requirements: 3.4, 3.5_

#### 4.5 整合測試 Web Audio 系統

- 撰寫整合測試：`src/__tests__/integration/audio-system.test.ts`
- 測試完整音效播放流程：
  - 初始化 AudioEngine
  - 播放各種音效
  - 驗證音效正確生成並播放
  - 驗證記憶體管理（LRU 快取）
- 執行所有前端測試確保覆蓋率 ≥ 75%
- _Requirements: 3.1-3.9_

## 前端：快速占卜路由修復

### 5. 修復快速占卜路由

#### 5.1 修改首頁導航邏輯

- 修改 `src/app/page.tsx` 的 `handleQuickReading` 函數：
  - 檢查用戶登入狀態：`const user = useAuthStore(s => s.user)`
  - 已登入：導向 `/readings/new`
  - **未登入：導向 `/readings/quick`**（而非 `/auth/register`）
- 撰寫首頁組件測試：
  - 測試已登入用戶點擊快速占卜導向 `/readings/new`
  - 測試未登入用戶點擊快速占卜導向 `/readings/quick`
- _Requirements: 4.1, 4.3, 4.6_

#### 5.2 創建快速占卜頁面

- 創建 `src/app/readings/quick/page.tsx`：
  - 實作訪客快速占卜介面
  - 使用 `CardDrawInterface` 組件（若已存在）或創建簡化版本
  - 呼叫後端 API 抽取隨機卡牌
  - 顯示占卜結果（不儲存至資料庫）
  - 提示訪客註冊以儲存結果
- 不需要認證保護（允許訪客存取）
- 撰寫快速占卜頁面測試
- _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6_

#### 5.3 E2E 測試快速占卜流程

- 撰寫 E2E 測試：`tests/e2e/quick-reading-flow.spec.ts`
- 測試訪客快速占卜流程：
  - 訪客進入首頁
  - 點擊「快速占卜」按鈕
  - 驗證導向 `/readings/quick` 頁面
  - 驗證頁面載入成功並顯示占卜介面
- _Requirements: 4.1-4.6_

## 次要問題修復

### 6. 修復次要問題

#### 6.1 新增 favicon

- 創建或取得 Vault-Tec 主題 favicon 圖示
- 將 `favicon.ico` 放置於 `public/` 目錄
- 驗證瀏覽器請求 `/favicon.ico` 返回 200 OK
- _Requirements: 5.1, 5.2_

#### 6.2 安裝並配置 web-vitals

- 檢查 `package.json` 是否包含 `web-vitals` 依賴
- 如缺失，執行 `bun add web-vitals`
- 在 `src/app/layout.tsx` 或適當位置初始化效能監控
- 撰寫簡單測試確保模組正確載入
- _Requirements: 5.3, 5.4_

#### 6.3 優化音效系統錯誤處理

- 檢查 `src/lib/audio/AudioEngine.ts` 和 `AudioManager.ts`
- 確保所有錯誤處理為靜默失敗（不顯示 toast 或彈窗）
- 僅在開發環境記錄詳細錯誤至 console
- 生產環境僅記錄至遠端日誌服務（若有）
- _Requirements: 5.5, 5.6_

## 整合測試與驗證

### 7. 端到端測試與驗證

#### 7.1 撰寫用戶註冊 E2E 測試

- 撰寫 E2E 測試：`tests/e2e/user-registration.spec.ts`
- 測試案例：
  - 成功註冊並自動登入
  - 重複 email 顯示錯誤訊息
  - 密碼不符顯示錯誤訊息
  - 密碼強度不足顯示錯誤訊息
- _Requirements: 1.1-1.7_

#### 7.2 執行完整測試套件

- 執行後端測試：`cd backend && uv run pytest --cov=app --cov-report=html`
- 執行前端單元測試：`bun test --coverage`
- 執行前端 E2E 測試：`bun test:playwright`
- 驗證測試覆蓋率：
  - 後端：新增程式碼覆蓋率 ≥ 80%
  - 前端：新增程式碼覆蓋率 ≥ 75%
- _Requirements: 6.3, 6.4_

#### 7.3 手動驗證關鍵功能

- **註冊功能**：
  - 新用戶可成功註冊
  - 註冊後自動登入並導向儀表板
  - Email 重複顯示正確錯誤訊息
- **音效系統**：
  - 點擊按鈕播放音效（無 404 錯誤）
  - AudioContext 初始化失敗時應用仍正常運作
- **快速占卜**：
  - 訪客點擊快速占卜導向正確頁面
  - 快速占卜頁面正常載入並可進行占卜
- _Requirements: All requirements need E2E validation_

#### 7.4 效能驗證

- 使用 pytest-benchmark 測試註冊 API 回應時間：
  - p95 < 500ms
  - p99 < 1000ms
- 使用 Jest + Performance API 測試 Web Audio 音效生成延遲 < 100ms
- 使用 Lighthouse 測試快速占卜頁面載入時間 < 2s
- _Requirements: Non-Functional Requirements (效能要求)_

## 文件與元數據更新

### 8. 更新 API 文件

#### 8.1 驗證 FastAPI OpenAPI 文件

- 啟動後端伺服器：`cd backend && uv run uvicorn app.main:app --reload`
- 訪問 Swagger UI：`http://localhost:8000/docs`
- 確認 `/api/v1/auth/register` 端點正確顯示
- 驗證請求/回應範例完整且準確
- _Requirements: 6.1, 6.2_

#### 8.2 完成測試文件

- 確認所有測試案例覆蓋需求文件中的驗收標準
- 更新測試報告（若需要）
- _Requirements: 6.3, 6.4, 6.5, 6.6_

---

## 任務執行順序總結

建議按以下順序執行任務以最大化早期驗證與漸進式開發：

1. **後端基礎**（任務 1-2）：確認資料模型 → 實作註冊 API
2. **前端 API 修復**（任務 3）：修正 API 路徑配置
3. **音效系統重構**（任務 4）：實作 Web Audio 生成器
4. **路由修復**（任務 5）：修復快速占卜導航
5. **次要修復**（任務 6）：favicon、web-vitals、錯誤處理
6. **整合測試**（任務 7）：E2E 測試與效能驗證
7. **文件更新**（任務 8）：API 文件與測試報告

每個階段完成後應執行相關測試，確保功能正常再進入下一階段。

---

**最後更新時間：** 2025-10-06
**任務版本：** 1.0
**狀態：** 已生成，待審核與實作
