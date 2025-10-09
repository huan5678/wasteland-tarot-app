# 需求文件

## 簡介

本功能旨在將 Wasteland Tarot 後端 FastAPI 的 Swagger UI 文件介面全面本地化為繁體中文（zh-TW），提升中文使用者的 API 文件閱讀體驗。這包含所有 API 端點的描述、參數名稱、說明文字、回應範例以及標籤分類等內容。

### 業務價值
- **提升使用者體驗**：中文開發者能更快理解 API 用途和參數定義
- **降低學習成本**：減少因語言障礙造成的理解錯誤
- **符合產品定位**：專案主要語言為繁體中文（zh-TW），API 文件應保持一致
- **增加可用性**：完整的中文文件能吸引更多華語系開發者

## 需求

### 需求 1：FastAPI 應用程式主要資訊本地化
**使用者故事：** 作為 API 使用者，我希望 Swagger UI 的主要應用程式資訊以繁體中文顯示，以便快速理解 API 的整體定位和用途。

#### 驗收標準

1. WHEN 使用者訪問 `/docs` 端點 THEN 系統 SHALL 以繁體中文顯示應用程式標題（title）
2. WHEN 使用者檢視 Swagger UI 頂部描述 THEN 系統 SHALL 以繁體中文顯示應用程式描述（description）
3. WHEN 使用者檢視版本資訊 THEN 系統 SHALL 保留版本號碼但補充繁體中文版本說明
4. WHEN 使用者檢視聯絡資訊 THEN 系統 SHALL 將聯絡人名稱翻譯為繁體中文
5. WHEN 使用者檢視授權資訊 THEN 系統 SHALL 保留原始授權連結但補充繁體中文授權名稱

### 需求 2：API 標籤分類本地化
**使用者故事：** 作為 API 使用者，我希望 Swagger UI 的端點分類標籤以繁體中文顯示，以便快速定位所需的 API 類別。

#### 驗收標準

1. WHEN 使用者檢視 Swagger UI 側邊欄 THEN 系統 SHALL 以繁體中文顯示所有 API 標籤名稱（tags）
2. WHEN 使用者展開標籤分類 THEN 系統 SHALL 以繁體中文顯示標籤描述（tag descriptions）
3. WHERE 標籤包含 emoji 圖示 THE 系統 SHALL 保留 emoji 並僅翻譯文字部分
4. WHEN 使用者切換不同標籤 THEN 系統 SHALL 確保所有標籤描述均為繁體中文
5. IF 標籤描述包含多行內容 THEN 系統 SHALL 完整翻譯所有行並保持格式

### 需求 3：API 端點路徑與摘要本地化
**使用者故事：** 作為 API 使用者，我希望每個 API 端點的摘要和描述以繁體中文呈現，以便理解端點的功能和用途。

#### 驗收標準

1. WHEN 使用者檢視端點列表 THEN 系統 SHALL 以繁體中文顯示端點摘要（summary）
2. WHEN 使用者展開端點詳情 THEN 系統 SHALL 以繁體中文顯示端點描述（description）
3. WHERE 端點描述包含 Markdown 格式 THE 系統 SHALL 保留格式並翻譯文字內容
4. WHEN 使用者檢視端點描述中的列表項目 THEN 系統 SHALL 翻譯所有列表項目為繁體中文
5. IF 端點描述包含程式碼範例 THEN 系統 SHALL 保留程式碼但翻譯註解為繁體中文
6. WHEN 使用者檢視回應描述（response_description）THEN 系統 SHALL 以繁體中文顯示

### 需求 4：請求參數本地化
**使用者故事：** 作為 API 使用者，我希望所有請求參數的說明以繁體中文顯示，以便正確理解參數的意義和使用方式。

#### 驗收標準

1. WHEN 使用者檢視路徑參數（Path parameters）THEN 系統 SHALL 以繁體中文顯示參數描述
2. WHEN 使用者檢視查詢參數（Query parameters）THEN 系統 SHALL 以繁體中文顯示參數描述
3. WHEN 使用者檢視請求主體參數（Request body）THEN 系統 SHALL 以繁體中文顯示欄位描述
4. WHERE 參數包含預設值說明 THE 系統 SHALL 以繁體中文說明預設值
5. WHEN 使用者檢視參數範例值 THEN 系統 SHALL 在適當時提供繁體中文範例說明
6. IF 參數為列舉型態（enum）THEN 系統 SHALL 保留英文值但補充繁體中文說明
7. WHEN 使用者檢視參數驗證規則 THEN 系統 SHALL 以繁體中文顯示驗證錯誤訊息

### 需求 5：回應範例與 Schema 本地化
**使用者故事：** 作為 API 使用者，我希望回應範例和資料結構說明以繁體中文呈現，以便理解 API 回傳的資料格式。

#### 驗收標準

1. WHEN 使用者檢視回應範例 THEN 系統 SHALL 以繁體中文說明範例資料的意義
2. WHEN 使用者檢視 Schema 定義 THEN 系統 SHALL 以繁體中文顯示欄位描述（field descriptions）
3. WHERE Schema 包含巢狀物件 THE 系統 SHALL 翻譯所有層級的欄位描述
4. WHEN 使用者檢視回應狀態碼說明 THEN 系統 SHALL 以繁體中文顯示狀態碼描述
5. IF 回應包含錯誤範例 THEN 系統 SHALL 以繁體中文顯示錯誤訊息說明
6. WHEN 使用者檢視 Schema 範例值 THEN 系統 SHALL 適當使用繁體中文範例資料

### 需求 6：錯誤回應本地化
**使用者故事：** 作為 API 使用者，我希望錯誤回應的說明以繁體中文顯示，以便快速理解錯誤原因和解決方式。

#### 驗收標準

1. WHEN 使用者檢視 4xx 錯誤回應 THEN 系統 SHALL 以繁體中文顯示錯誤描述
2. WHEN 使用者檢視 5xx 錯誤回應 THEN 系統 SHALL 以繁體中文顯示錯誤描述
3. WHERE 錯誤範例包含詳細訊息 THE 系統 SHALL 以繁體中文說明錯誤細節
4. WHEN 使用者檢視驗證錯誤（422）THEN 系統 SHALL 以繁體中文顯示驗證錯誤說明
5. IF 錯誤回應包含建議解決方案 THEN 系統 SHALL 以繁體中文提供解決建議

### 需求 7：Pydantic Schema 模型本地化
**使用者故事：** 作為 API 使用者，我希望資料模型（Pydantic schemas）的欄位說明以繁體中文呈現，以便理解資料結構。

#### 驗收標準

1. WHEN 使用者檢視 Schema 模型定義 THEN 系統 SHALL 以繁體中文顯示模型描述（class docstring）
2. WHEN 使用者檢視模型欄位 THEN 系統 SHALL 以繁體中文顯示欄位說明（Field description）
3. WHERE 欄位使用 Field() 定義 THE 系統 SHALL 翻譯 description 參數為繁體中文
4. WHEN 使用者檢視欄位驗證器（validators）THEN 系統 SHALL 以繁體中文說明驗證規則
5. IF 欄位包含範例值（example）THEN 系統 SHALL 適當提供繁體中文範例說明
6. WHEN 使用者檢視巢狀模型 THEN 系統 SHALL 翻譯所有層級的模型和欄位說明

### 需求 8：OpenAPI 規格文件本地化
**使用者故事：** 作為系統整合者，我希望 OpenAPI JSON 規格文件（`/openapi.json`）包含繁體中文描述，以便自動產生中文文件或客戶端程式碼。

#### 驗收標準

1. WHEN 使用者訪問 `/openapi.json` THEN 系統 SHALL 在 JSON 中包含繁體中文描述
2. WHERE JSON 包含 `info.description` THE 系統 SHALL 使用繁體中文
3. WHEN 使用者檢視 paths 定義 THEN 系統 SHALL 在 summary 和 description 欄位使用繁體中文
4. IF JSON 包含 components.schemas THEN 系統 SHALL 在 description 欄位使用繁體中文
5. WHEN 使用者檢視 tags 定義 THEN 系統 SHALL 在 name 和 description 欄位使用繁體中文

### 需求 9：程式碼範例與文件連結本地化
**使用者故事：** 作為 API 使用者，我希望程式碼範例和相關文件連結的說明以繁體中文呈現，以便快速理解如何使用 API。

#### 驗收標準

1. WHERE 端點描述包含程式碼範例 THE 系統 SHALL 以繁體中文註解說明範例用途
2. WHEN 使用者檢視 "Try it out" 功能說明 THEN 系統 SHALL 以繁體中文顯示操作提示
3. IF 描述包含外部文件連結 THEN 系統 SHALL 以繁體中文說明連結目的
4. WHEN 使用者檢視 curl 命令範例 THEN 系統 SHALL 以繁體中文註解說明命令用途
5. WHERE 範例包含多個步驟 THE 系統 SHALL 以繁體中文編號說明每個步驟

### 需求 10：保持技術術語一致性
**使用者故事：** 作為 API 使用者，我希望技術術語翻譯保持一致性，以便建立清晰的概念理解。

#### 驗收標準

1. WHEN 翻譯技術術語 THEN 系統 SHALL 在整個 Swagger UI 中使用一致的繁體中文譯名
2. WHERE 術語首次出現 THE 系統 SHALL 以「中文（English）」格式標註原文
3. WHEN 使用者檢視 Fallout 主題專有名詞 THEN 系統 SHALL 保留原文並加註繁體中文說明
4. IF 術語無標準譯名 THEN 系統 SHALL 優先使用原文並附註繁體中文解釋
5. WHEN 使用者檢視資料型態（如 string, integer）THEN 系統 SHALL 保留英文型態名稱

### 需求 11：維持原有功能與格式
**使用者故事：** 作為開發維護者，我希望本地化過程不影響現有 API 功能和 Swagger UI 的正常運作。

#### 驗收標準

1. WHEN 進行中文化修改 THEN 系統 SHALL 保持所有 API 端點的原有功能
2. WHEN 更新描述文字 THEN 系統 SHALL 保留 Markdown 格式和 HTML 標籤
3. WHERE 描述包含程式碼區塊 THE 系統 SHALL 保持程式碼格式不變
4. WHEN 使用者測試 API THEN 系統 SHALL 確保 "Try it out" 功能正常運作
5. IF 描述包含特殊字元或 emoji THEN 系統 SHALL 正確顯示不產生亂碼
6. WHEN 使用者訪問 `/docs` 和 `/redoc` THEN 系統 SHALL 兩種介面均正常顯示繁體中文

### 需求 12：文件品質與完整性
**使用者故事：** 作為 API 使用者，我希望中文文件保持高品質和完整性，確保所有重要資訊都正確翻譯。

#### 驗收標準

1. WHEN 翻譯 API 描述 THEN 系統 SHALL 確保譯文語意正確且符合專業術語
2. WHEN 使用者檢視任何端點 THEN 系統 SHALL 確保沒有遺漏未翻譯的英文內容
3. WHERE 描述包含技術細節 THE 系統 SHALL 確保翻譯準確不失真
4. WHEN 使用者檢視範例說明 THEN 系統 SHALL 確保範例與說明一致
5. IF 發現翻譯錯誤 THEN 系統 SHALL 提供修正機制並更新文件
