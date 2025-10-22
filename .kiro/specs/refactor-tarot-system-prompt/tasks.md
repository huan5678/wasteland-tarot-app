# 實作計畫：廢土塔羅 AI System Prompt 重構

## 概述

本實作計畫將 AI 塔羅解牌系統從「簡單模板填充」升級為「深度心理學投射工具」。**核心改進透過資料庫 Prompt 更新實現，無需修改程式碼**。

### 關鍵特點
- ✅ **零程式碼變更**：所有改進透過資料庫儲存的 System Prompt 實現
- ✅ **零 Migration**：使用現有 `characters` 表欄位
- ✅ **完全向後相容**：保留 fallback 機制
- ✅ **可測試**：每個步驟都有驗證機制

---

## 資料庫配置與驗證

### 1. 準備與備份

- [ ] 1.1 建立資料庫備份腳本
  - 編寫 `backup_characters.sh` 腳本，使用 `pg_dump` 備份 `characters` 表
  - 加入時間戳記到備份檔名（`backup_characters_YYYYMMDD_HHMMSS.sql`）
  - 驗證備份檔案可成功還原到測試資料庫
  - 將腳本加入 `.kiro/specs/refactor-tarot-system-prompt/scripts/` 目錄
  - _Requirements: 所有需求都依賴資料完整性保障_

- [ ] 1.2 驗證現有資料庫 Schema
  - 執行 SQL 查詢確認 `characters` 表包含所需欄位：
    - `ai_system_prompt TEXT`
    - `ai_tone_description VARCHAR(200)`
    - `ai_prompt_config JSON`
  - 檢查現有 6 個角色記錄（pip_boy, vault_dweller, wasteland_trader, codsworth, super_mutant, ghoul）
  - 記錄現有欄位內容（如果有）以便比對
  - _Requirements: FR-1（資料庫驅動的 Prompt 系統）_

### 2. 執行 Prompt 更新

- [ ] 2.1 執行資料庫更新腳本
  - 連接到 Supabase PostgreSQL 資料庫
  - 執行 `update_character_prompts.sql` 更新 6 個角色的 AI 配置
  - 確認更新成功（無錯誤訊息）
  - 記錄更新的行數（應為 6 行）
  - _Requirements: FR-1, FR-3（角色差異化系統）_

- [ ] 2.2 驗證 Prompt 內容完整性
  - 查詢每個角色的 `ai_system_prompt` 長度：
    ```sql
    SELECT key, LENGTH(ai_system_prompt), ai_tone_description
    FROM characters
    WHERE key IN ('pip_boy', 'vault_dweller', 'wasteland_trader', 'codsworth', 'super_mutant', 'ghoul');
    ```
  - 確認字數符合規範：
    - Pip-Boy: 3000-4000 字
    - Vault Dweller: 3500-4500 字
    - Wasteland Trader: 3000-4000 字
    - Codsworth: 3500-4500 字
    - Super Mutant: 2500-3500 字
    - Ghoul: 3500-4500 字
  - 驗證 `ai_prompt_config` JSON 格式正確
  - _Requirements: FR-3, NFR-1（Prompt 字數規範）_

- [ ] 2.3 驗證 Prompt 內容品質
  - 對每個角色執行關鍵詞檢查：
    - 榮格心理學元素（「原型」、「陰影」、「個性化」）
    - 5 階段解讀流程（「場景建構」、「投射性提問」、「原型探索」、「敘事重構」、「行動賦權」）
    - 廢土隱喻系統（「輻射」、「變種生物」、「避難所」、「業力」）
    - 倫理保障（「危機處理」、「AI 限制聲明」、「1925」）
  - 確認每個角色的語言風格標籤正確（數據化、敘事性、實用主義等）
  - _Requirements: FR-2（心理學框架整合）, FR-4（廢土隱喻系統）, FR-5（倫理保障機制）_

---

## 測試與驗證

### 3. 單元測試

- [ ] 3.1 建立 Prompt 載入測試
  - 編寫 `tests/unit/test_character_prompt_loading.py`
  - 測試 `AIInterpretationService._get_character_prompt()` 方法
  - 驗證每個角色都能成功載入 Prompt（返回非 None）
  - 驗證返回的 Dict 包含 `system`, `tone`, `config` 鍵
  - 驗證 `system` 欄位長度符合預期範圍
  - _Requirements: FR-1, TC-2（AI Provider 整合）_

- [ ] 3.2 建立語言風格驗證測試
  - 編寫 `tests/unit/test_character_voice_style.py`
  - 為每個角色建立語言風格測試：
    - **Pip-Boy**：檢測「偵測到」、「數據」、「分析」、「系統」關鍵詞
    - **Vault Dweller**：檢測「我也曾經」、「讓我想起」、「第一次」、「離開避難所」
    - **Wasteland Trader**：檢測「交易」、「籌碼」、「投資」、「划算」
    - **Codsworth**：檢測「主人」、「恕我直言」、「Codsworth」、「體面」
    - **Super Mutant**：驗證短句風格（平均句長 < 30 字元）
    - **Ghoul**：檢測「輻射」、「倖存」、「時間」、「活了這麼久」
  - _Requirements: FR-3（角色差異化系統）_

- [ ] 3.3 建立倫理保障測試
  - 編寫 `tests/unit/test_ethical_safeguards.py`
  - 測試危機關鍵詞偵測：模擬包含「自殺」、「結束生命」等關鍵詞的問題
  - 驗證回應包含台灣危機專線（1925, 1995, 1980）
  - 驗證回應包含 AI 限制聲明
  - 測試預測性語言檢測：確保回應不含「你將會」、「註定」、「一定會」
  - _Requirements: FR-5（倫理保障機制）_

- [ ] 3.4 建立繁體中文語言驗證測試
  - 編寫 `tests/unit/test_language_validation.py`
  - 測試 User Prompt 包含繁體中文指令
  - 驗證生成的解讀包含繁體中文字元（檢查 Unicode 範圍 \u4e00-\u9fff）
  - 測試台灣用語（如「瓶蓋」而非「瓶盖」）
  - _Requirements: NFR-2（語言要求）_

### 4. 整合測試

- [ ] 4.1 建立完整解讀流程測試
  - 編寫 `tests/integration/test_full_interpretation_flow.py`
  - 測試完整流程：
    1. 模擬用戶選擇牌卡（The Fool）+ 角色（Pip-Boy）+ 問題
    2. 呼叫 `AIInterpretationService.generate_interpretation()`
    3. 驗證回應非 None 且長度 >= 200 字元
    4. 驗證回應包含問題關鍵詞
    5. 驗證回應包含角色特色語言
  - 重複測試所有 6 個角色
  - _Requirements: FR-1, FR-2, FR-3（完整功能整合）_

- [ ] 4.2 建立 AI Provider 整合測試
  - 編寫 `tests/integration/test_ai_provider_integration.py`
  - 測試 Anthropic Provider（如果有 API Key）：
    - 載入 Pip-Boy System Prompt
    - 生成單張牌解讀
    - 驗證回應格式正確
    - 記錄 Token 使用量和成本
  - 測試 OpenAI Provider（如果有 API Key）
  - 測試 Gemini Provider（如果有 API Key）
  - _Requirements: TC-2（AI Provider 整合）_

- [ ] 4.3 建立錯誤處理與 Fallback 測試
  - 編寫 `tests/integration/test_error_handling.py`
  - 測試 AI Provider 不可用情境：
    - 模擬 Provider 返回 None
    - 驗證系統使用靜態解讀 fallback
  - 測試 Prompt 載入失敗情境：
    - 模擬資料庫返回 None
    - 驗證系統使用預設 Prompt 或 fallback
  - 測試 Timeout 情境：
    - 模擬 AI 回應超時（> 10s）
    - 驗證系統返回 None 並記錄錯誤
  - _Requirements: TC-3（向後相容）_

### 5. 人工品質評測

- [ ] 5.1 執行多角色解讀測試
  - 選擇 5 張測試牌卡（The Fool, The Tower, The Devil, Death, Ten of Swords）
  - 對每張牌使用所有 6 個角色生成解讀（共 30 個解讀）
  - 記錄每個解讀到 `test_results/manual_review/` 目錄
  - 使用相同問題（「我該如何面對未來的挑戰？」）以便比較
  - _Requirements: TR-3（人工評測）_

- [ ] 5.2 建立評分表並執行評測
  - 建立評分表（Excel 或 Google Sheets）包含以下維度：
    1. 角色聲音一致性（1-5 分）
    2. 心理學深度（1-5 分）
    3. 非預測性（1-5 分）
    4. 廢土世界觀整合（1-5 分）
    5. 賦權與能動性（1-5 分）
    6. 字數控制（1-5 分）
    7. 繁體中文品質（1-5 分）
  - 邀請 2-3 位評測者獨立評分
  - 計算平均分數，目標 ≥ 4.0/5.0
  - 記錄評測結果到 `test_results/manual_review/evaluation_scores.csv`
  - _Requirements: TR-3（人工評測）_

- [ ] 5.3 識別與記錄改進點
  - 分析評分低於 4.0 的項目
  - 記錄具體改進建議（哪個角色、哪個維度、具體問題）
  - 建立優先級清單（P0: 必須修正、P1: 應該修正、P2: 可選修正）
  - 將改進建議記錄到 `IMPROVEMENT_BACKLOG.md`
  - _Requirements: 質化指標（用戶回饋）_

---

## 品質保證與文件

### 6. Prompt 品質驗證工具

- [ ] 6.1 建立 Prompt 驗證腳本
  - 編寫 `scripts/validate_prompts.py` Python 腳本
  - 實作以下驗證功能：
    - 檢查 Prompt 字數範圍
    - 檢查榮格心理學關鍵詞（「原型」、「陰影」、「個性化」）
    - 檢查 5 階段解讀流程關鍵詞
    - 檢查倫理保障關鍵詞（「危機處理」、「1925」）
    - 檢查繁體中文語言品質
  - 輸出驗證報告（JSON 或 Markdown）
  - _Requirements: 所有需求都需要品質驗證_

- [ ] 6.2 執行 Prompt 驗證並生成報告
  - 對所有 6 個角色執行 `validate_prompts.py`
  - 生成驗證報告：`validation_report.md`
  - 檢查是否所有驗證項目都通過
  - 如果有失敗項目，記錄到 Issue Tracker
  - _Requirements: 所有需求都需要品質驗證_

### 7. 效能與成本測試

- [ ] 7.1 建立效能基準測試
  - 編寫 `tests/performance/test_interpretation_performance.py`
  - 測試單張牌解讀效能：
    - 資料庫查詢時間（目標 < 50ms）
    - AI Provider 回應時間（first token < 2s, 總時間 < 5s）
    - 總體回應時間（目標 < 6s）
  - 重複測試 10 次取平均值
  - 記錄效能指標到 `test_results/performance_benchmarks.json`
  - _Requirements: NFR-3（回應時間）_

- [ ] 7.2 建立成本估算測試
  - 編寫 `tests/performance/test_ai_cost_estimation.py`
  - 記錄每次解讀的 Token 使用量：
    - Prompt Tokens（預期 1500-2000）
    - Completion Tokens（預期 300-500）
  - 計算每次解讀成本（依不同 Provider）
  - 驗證成本在預期範圍內（$0.01-0.03）
  - 生成成本報告：`test_results/cost_analysis.md`
  - _Requirements: NFR-4（成本控制）_

### 8. 文件更新

- [ ] 8.1 更新 API 文件
  - 更新 FastAPI OpenAPI 文件（`/docs`）
  - 添加角色 Prompt 資訊到角色列表 API 回應
  - 更新 `/api/v1/characters` 端點文件，說明新的心理學描述
  - 添加範例回應展示新的解讀風格
  - _Requirements: DS-1（漸進式部署需要文件支援）_

- [ ] 8.2 建立內部技術文件
  - 編寫 `PROMPT_MAINTENANCE.md`：
    - 如何更新角色 Prompt
    - Prompt 驗證流程
    - 測試與部署流程
    - Rollback 程序
  - 編寫 `TROUBLESHOOTING.md`：
    - 常見問題與解決方案
    - 錯誤訊息解釋
    - 效能調優建議
  - _Requirements: DS-3（Rollback Plan 需要文件支援）_

---

## 部署準備

### 9. A/B 測試準備

- [ ] 9.1 實作 Feature Flag 機制（可選）
  - 在 `backend/app/config.py` 添加 `USE_NEW_PROMPTS` 設定
  - 從環境變數讀取（預設 `true`）
  - 在 `AIInterpretationService._get_character_prompt()` 添加 Flag 檢查
  - 如果 Flag 為 `false`，返回 None 使用 fallback
  - 編寫測試驗證 Feature Flag 正常運作
  - _Requirements: DS-1（A/B 測試）, DS-3（Rollback Plan）_

- [ ] 9.2 建立監控腳本
  - 編寫 `scripts/monitor_interpretation_metrics.py`
  - 監控以下指標：
    - 解讀請求總數（按角色分組）
    - 解讀成功率（AI 生成 vs Fallback）
    - 平均回應時間
    - AI Provider 錯誤率
    - 每日 API 成本
  - 生成每日監控報告（Markdown 或 JSON）
  - _Requirements: DS-2（監控指標）_

### 10. 部署檢查清單

- [ ] 10.1 建立部署前檢查腳本
  - 編寫 `scripts/pre_deployment_checklist.sh`
  - 自動化檢查：
    - ✅ 資料庫備份已建立
    - ✅ 所有單元測試通過
    - ✅ 所有整合測試通過
    - ✅ Prompt 驗證報告無 Critical 問題
    - ✅ 效能測試符合目標
    - ✅ 人工評測平均分 ≥ 4.0/5.0
  - 輸出檢查報告（通過/失敗）
  - _Requirements: 所有需求都需要部署前驗證_

- [ ] 10.2 準備 Rollback 腳本
  - 編寫 `scripts/rollback_prompts.sh`
  - 實作功能：
    - 從備份檔案還原 `characters` 表
    - 驗證還原成功
    - 重啟 FastAPI 服務（如果需要）
  - 測試 Rollback 腳本（使用測試資料庫）
  - 記錄 Rollback 程序到文件
  - _Requirements: DS-3（Rollback Plan）_

---

## 完成標準

### 最終驗證檢查清單

執行以下最終檢查，確保所有需求都已滿足：

- [ ] **功能性需求**
  - [ ] FR-1：資料庫 Prompt 系統正常運作
  - [ ] FR-2：心理學框架整合（5 階段流程）
  - [ ] FR-3：角色差異化系統（6 個角色各有特色）
  - [ ] FR-4：廢土隱喻系統（輻射、變種生物、陣營等）
  - [ ] FR-5：倫理保障機制（危機處理、AI 限制聲明）

- [ ] **非功能性需求**
  - [ ] NFR-1：Prompt 字數符合規範
  - [ ] NFR-2：所有解讀使用繁體中文（zh-TW）
  - [ ] NFR-3：回應時間達標（API p95 < 5s）
  - [ ] NFR-4：成本控制達標（$0.01-0.03/次）

- [ ] **測試需求**
  - [ ] TR-1：單元測試全部通過
  - [ ] TR-2：整合測試全部通過
  - [ ] TR-3：人工評測平均分 ≥ 4.0/5.0

- [ ] **部署需求**
  - [ ] DS-1：A/B 測試機制準備就緒
  - [ ] DS-2：監控指標腳本就緒
  - [ ] DS-3：Rollback 計畫已測試

### 成功標準

**量化指標**：
- [ ] 所有自動化測試通過率 = 100%
- [ ] 人工評測平均分 ≥ 4.0/5.0
- [ ] 效能測試 API p95 < 5s
- [ ] AI 成本 < $0.03/次

**質化指標**：
- [ ] 無 Critical 或 High 優先級的品質問題
- [ ] 所有文件完整且最新
- [ ] Rollback 程序已驗證可用

---

**專案狀態**：待實作
**預估總時數**：16-20 小時（包含測試與驗證）
**優先級**：P1（高優先級改進）
