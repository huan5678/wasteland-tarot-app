# Requirements Document

## Introduction

本需求文件旨在修復全網站功能驗證測試中發現的關鍵錯誤（P0 級別阻塞問題）。這些錯誤嚴重影響核心用戶流程，包括用戶註冊、音效系統、API 通訊和核心功能導航。修復這些問題將恢復基本的用戶體驗，確保新用戶能夠註冊、現有用戶能夠使用完整功能，並提供預期的沉浸式音效體驗。

**商業價值：**
- 移除用戶註冊阻塞，允許新用戶加入平台
- 恢復音效系統，提供完整的 Fallout 主題沉浸式體驗
- 修復 API 通訊問題，確保前後端正常整合
- 修復核心功能導航，讓未登入用戶能夠體驗快速占卜

## Requirements

### Requirement 1: 後端用戶註冊 API 實作

**User Story:** 作為新用戶，我想要能夠註冊帳號，以便我可以儲存我的占卜歷史並使用完整的平台功能。

#### Acceptance Criteria

1. WHEN 用戶提交有效的註冊表單（包含 email、username、password）THEN 後端 SHALL 創建新用戶記錄並返回 201 Created 狀態碼
2. WHEN 用戶嘗試使用已存在的 email 註冊 THEN 後端 SHALL 返回 409 Conflict 錯誤並提供明確的錯誤訊息
3. WHEN 用戶提交的密碼少於 8 個字元 THEN 後端 SHALL 返回 422 Unprocessable Entity 並說明密碼強度要求
4. WHEN 用戶成功註冊 THEN 系統 SHALL 使用 bcrypt 加密密碼並儲存至資料庫
5. WHEN 用戶成功註冊 THEN 系統 SHALL 自動產生 JWT token 並返回給前端
6. WHERE 註冊 API 端點位於 `/api/v1/auth/register` THE 系統 SHALL 接受 POST 請求並返回用戶資料（不含密碼）
7. IF 註冊請求缺少必要欄位（email、username 或 password）THEN 系統 SHALL 返回 422 錯誤並明確指出缺少的欄位

### Requirement 2: 前端 API 路徑配置修復

**User Story:** 作為系統管理員，我需要前端正確連接後端 API，以便所有 API 請求能夠成功執行。

#### Acceptance Criteria

1. WHEN 前端發送註冊請求 THEN 系統 SHALL 使用正確的 API 路徑格式 `/api/v1/auth/register`
2. WHERE 環境變數配置 API 基礎 URL THE 系統 SHALL 正確拼接完整的 API 端點路徑
3. IF 開發環境啟動 THEN API 基礎 URL SHALL 設定為 `http://localhost:8000/api/v1`
4. WHEN 前端發送任何認證相關請求 THEN 路徑 SHALL NOT 包含 `undefined` 或重複的路徑片段
5. WHERE API 客戶端配置檔案存在 THE 系統 SHALL 使用環境變數 `NEXT_PUBLIC_API_URL` 作為基礎路徑
6. WHEN API 請求失敗並返回 404 THEN 前端 SHALL 在開發環境的 console 中記錄完整的請求 URL 以便除錯

### Requirement 3: Web Audio API 音效系統實作

**User Story:** 作為用戶，我想要在使用平台時聽到 Fallout 主題音效，以獲得完整的沉浸式體驗，而系統應使用 Web Audio API 即時生成音效而非載入音檔。

#### Acceptance Criteria

1. WHERE 音效系統初始化 THE 系統 SHALL 使用 Web Audio API (AudioContext) 生成以下音效類型：
   - `button-click`: 短促的點擊音（使用 OscillatorNode 生成）
   - `card-flip`: 翻牌音效（使用 noise + envelope）
   - `pip-boy-beep`: Pip-Boy 特色嗶聲（使用方波振盪器）
   - `terminal-type`: 終端機打字音（使用短脈衝音）
   - `vault-door`: Vault 門開啟音（使用低頻 + 掃頻效果）
2. WHEN AudioEngine 初始化 THEN 系統 SHALL 創建 AudioContext 並預先定義所有音效的生成函數
3. WHEN 用戶觸發音效播放 THEN 系統 SHALL 即時使用 Web Audio API 生成並播放音效
4. IF 瀏覽器不支援 Web Audio API THEN 系統 SHALL 優雅降級（靜默失敗）並記錄警告至 console
5. WHERE 音效生成失敗 THE 系統 SHALL NOT 顯示錯誤 toast 或中斷用戶體驗
6. WHEN 用戶首次互動觸發音效初始化 THEN 系統 SHALL 成功創建 AudioContext 並準備所有音效生成器
7. WHILE 背景音樂需要播放 THE 系統 SHALL 使用 Web Audio API 的 OscillatorNode 和 GainNode 生成環境音效循環
8. WHEN 音效播放結束 THEN 系統 SHALL 正確清理 AudioNodes 以避免記憶體洩漏
9. WHERE 音效參數配置 THE 系統 SHALL 提供可調整的音量、頻率、持續時間等參數

### Requirement 4: 快速占卜路由修復

**User Story:** 作為未登入的訪客，我想要點擊「快速占卜」按鈕時能夠直接進行占卜，而不是被導向註冊頁面，以便我可以在註冊前先體驗平台功能。

#### Acceptance Criteria

1. WHEN 訪客在首頁點擊「快速占卜」按鈕 THEN 系統 SHALL 導航至快速占卜頁面（`/readings/quick` 或類似路徑）
2. WHEN 訪客到達快速占卜頁面 THEN 系統 SHALL NOT 要求登入或註冊
3. WHERE 快速占卜按鈕存在於首頁 THE 按鈕 SHALL 正確連結至快速占卜功能路由
4. IF 快速占卜路由不存在 THEN 系統 SHALL 創建該路由並提供基本的占卜功能
5. WHEN 訪客完成快速占卜 THEN 系統 SHALL 顯示占卜結果但不儲存至資料庫
6. WHEN 快速占卜頁面載入 THEN 系統 SHALL NOT 重定向至 `/auth/register` 或 `/auth/login`

### Requirement 5: 次要問題修復

**User Story:** 作為開發者，我想要修復次要但影響用戶體驗的問題，以提升平台整體品質。

#### Acceptance Criteria

1. WHERE 網站根目錄 `public/` THE 系統 SHALL 包含 `favicon.ico` 檔案
2. WHEN 瀏覽器請求 `/favicon.ico` THEN 系統 SHALL 返回 200 OK 並提供 Vault-Tec 主題圖示
3. WHERE web-vitals 模組被導入 THE 系統 SHALL 成功載入該模組並初始化效能監控
4. IF web-vitals 模組缺失 THEN 系統 SHALL 安裝該依賴並配置效能指標收集
5. WHEN 音效系統初始化失敗 THEN 錯誤處理 SHALL 優雅降級而非在 UI 中顯示多個錯誤提示
6. WHERE Console 錯誤訊息顯示 THE 開發環境 SHALL 記錄詳細錯誤但生產環境 SHALL 僅記錄至遠端日誌服務

### Requirement 6: API 端點文件與驗證

**User Story:** 作為開發者，我需要確保新增的 API 端點有完整的文件並通過測試，以便團隊成員能夠正確使用並維護這些端點。

#### Acceptance Criteria

1. WHEN 註冊 API 端點實作完成 THEN FastAPI 的 OpenAPI 文件 SHALL 自動包含該端點說明
2. WHERE Swagger UI (`/docs`) 存在 THE 註冊端點 SHALL 顯示請求/回應範例
3. WHEN 後端測試套件執行 THEN SHALL 包含註冊端點的單元測試和整合測試
4. IF 註冊 API 測試執行 THEN 測試 SHALL 涵蓋成功註冊、重複 email、無效密碼等情境
5. WHEN API 端點返回錯誤 THEN 回應格式 SHALL 遵循統一的錯誤回應結構
6. WHERE API 版本為 v1 THE 所有認證相關端點 SHALL 使用一致的命名慣例和回應格式

## Non-Functional Requirements

### 效能要求
- 註冊 API 回應時間 SHALL 在 95% 的情況下少於 500ms
- Web Audio API 音效生成與播放 SHALL 在用戶互動後 100ms 內開始
- AudioContext 初始化 SHALL 在 500ms 內完成
- 快速占卜頁面載入時間 SHALL 在 2 秒內完成

### 安全要求
- 密碼加密 SHALL 使用 bcrypt 演算法且 cost factor 至少為 10
- JWT token SHALL 包含適當的過期時間（30 分鐘）
- API 端點 SHALL 實施速率限制以防止暴力攻擊

### 相容性要求
- Web Audio API 音效系統 SHALL 在所有現代瀏覽器（Chrome、Firefox、Safari、Edge）正常運作
- 音效系統 SHALL 支援 Web Audio API 的降級處理（若瀏覽器不支援則靜默失敗）
- API 端點 SHALL 與現有的 Supabase 認證系統整合
- 修復 SHALL NOT 破壞現有的登入功能

### 可維護性要求
- 新增程式碼 SHALL 包含適當的註解和型別提示
- API 端點 SHALL 遵循現有的服務層架構模式
- Web Audio API 音效生成器 SHALL 封裝為可重用的模組並提供清晰的介面
- 音效參數配置 SHALL 集中管理以便未來調整

## Out of Scope

以下項目不在本次修復範圍內：
- 新增的註冊功能進階驗證（如 email 驗證、手機號碼）
- 音效系統的音量控制或自訂設定介面
- 快速占卜的完整功能實作（僅修復路由問題）
- 其他 P1/P2 級別問題的修復
- 用戶登入功能的修改或增強
- 測試報告中未提及的其他功能問題

## Success Criteria

本功能被視為成功實作的標準：
1. 新用戶能夠成功註冊並自動登入系統
2. 所有音效使用 Web Audio API 即時生成且不顯示錯誤訊息
3. 快速占卜按鈕正確導航至占卜功能而非註冊頁面
4. 前端與後端 API 通訊無 404 或路徑錯誤
5. 所有新增的測試通過且程式碼覆蓋率達到 80% 以上
6. 修復後的系統在手機、平板、桌面環境均正常運作
7. Web Audio API 生成的音效在所有主流瀏覽器正常播放
