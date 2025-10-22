# 廢土塔羅 System Prompt 重構 - 實施指南

## 專案概述

重構目標：將 AI 解牌系統升級為結合**榮格深度心理學**與 **Fallout 廢土世界觀**的敘事治療工具。

## 核心改進

### 從「神秘占卜」到「心理投射」
- **舊系統**：模糊的「靈性指引」、預測性語言
- **新系統**：明確的心理投射、敘事治療、賦權語言

### 從「通用解讀」到「角色差異化」
- **舊系統**：所有角色使用相似的解讀框架
- **新系統**：每個角色有獨特的心理學詮釋風格和語言系統

### 從「簡單描述」到「深度整合」
- **舊系統**：表面化的牌義說明
- **新系統**：原型探索、陰影整合、敘事重構

---

## 實施步驟

### Phase 1: 資料庫更新（必須先執行）

#### 1.1 備份現有資料
```bash
# 備份 characters 表
pg_dump -h <host> -U <user> -d <database> -t characters > backup_characters_$(date +%Y%m%d).sql
```

#### 1.2 執行更新腳本
```bash
# 連接到資料庫並執行
psql -h <host> -U <user> -d <database> -f .kiro/specs/refactor-tarot-system-prompt/update_character_prompts.sql
```

#### 1.3 驗證更新結果
```sql
-- 檢查所有角色的 prompt 是否已更新
SELECT
    key,
    LENGTH(ai_system_prompt) as prompt_length,
    ai_tone_description,
    ai_prompt_config->>'style' as style
FROM characters
WHERE key IN ('pip_boy', 'vault_dweller', 'wasteland_trader', 'codsworth', 'super_mutant', 'ghoul')
ORDER BY key;

-- 預期結果：
-- pip_boy: 3000-4000 字
-- vault_dweller: 3500-4500 字
-- wasteland_trader: 3000-4000 字
-- codsworth: 3500-4500 字
-- super_mutant: 2500-3500 字
-- ghoul: 3500-4500 字
```

---

### Phase 2: 測試與驗證

#### 2.1 單元測試：角色風格一致性
創建測試案例驗證每個角色的語言風格：

```python
# tests/test_character_prompts.py
import pytest
from app.services.ai_interpretation_service import AIInterpretationService

@pytest.mark.asyncio
async def test_pip_boy_uses_data_language():
    """驗證 Pip-Boy 使用數據化語言"""
    interpretation = await generate_test_interpretation('pip_boy', 'The Fool')

    # 檢查關鍵詞
    assert any(word in interpretation for word in ['偵測到', '數據', '分析', '系統'])
    # 避免神秘化語言
    assert not any(word in interpretation for word in ['宇宙', '靈性', '天命'])

@pytest.mark.asyncio
async def test_vault_dweller_uses_narrative_style():
    """驗證 Vault Dweller 使用敘事風格"""
    interpretation = await generate_test_interpretation('vault_dweller', 'The Tower')

    assert any(phrase in interpretation for phrase in ['我也曾經', '讓我想起', '第一次'])
    assert '離開避難所' in interpretation or '廢土' in interpretation

@pytest.mark.asyncio
async def test_super_mutant_uses_simple_language():
    """驗證 Super Mutant 使用極簡語言"""
    interpretation = await generate_test_interpretation('super_mutant', 'The Devil')

    # 檢查句子長度（平均應該較短）
    sentences = interpretation.split('。')
    avg_length = sum(len(s) for s in sentences) / len(sentences)
    assert avg_length < 30  # 極簡風格，句子應該較短
```

#### 2.2 整合測試：完整解讀流程
```python
@pytest.mark.asyncio
async def test_full_interpretation_workflow():
    """測試完整解讀流程"""
    service = AIInterpretationService(settings, db_session)

    # 測試參數
    card = await get_test_card('The Fool')
    character = CharacterVoice.PIP_BOY
    question = "我應該換工作嗎？"
    karma = KarmaAlignment.NEUTRAL

    # 生成解讀
    interpretation = await service.generate_interpretation(
        card=card,
        character_voice=character,
        question=question,
        karma=karma
    )

    # 驗證結果
    assert interpretation is not None
    assert len(interpretation) >= 200  # 最小字數
    assert len(interpretation) <= 350  # 最大字數
    assert '工作' in interpretation or '職業' in interpretation  # 回應問題
    assert '【' in interpretation or '正在' in interpretation  # Pip-Boy 風格
```

#### 2.3 人工評測：質量檢查清單

**測試卡牌**：The Fool, The Tower, The Devil, Death, Ten of Swords

**測試角色**：所有 6 個主要角色

**評測標準**：
| 標準 | 評分 (1-5) | 備註 |
|------|-----------|------|
| 1. 角色聲音一致性 | | 是否符合角色設定？ |
| 2. 心理學深度 | | 是否提供深度洞察？ |
| 3. 非預測性 | | 是否避免預測性語言？ |
| 4. 廢土世界觀整合 | | 隱喻是否自然？ |
| 5. 賦權與能動性 | | 是否強調用戶選擇權？ |
| 6. 字數控制 | | 是否符合字數限制？ |
| 7. 繁體中文品質 | | 語言是否流暢自然？ |

---

### Phase 3: 漸進式部署

#### 3.1 A/B 測試計畫

**目標**：比較新舊 prompt 的用戶滿意度

**方法**：
1. 隨機分配 50% 用戶使用新 prompt
2. 收集以下指標：
   - 解讀完成率
   - 用戶停留時間
   - 重複使用率
   - 用戶評分（如果有）

**監控週期**：2 週

**決策標準**：
- 如果新 prompt 指標 ≥ 舊 prompt：全面採用
- 如果新 prompt 指標 < 舊 prompt 10%：調整並重新測試
- 如果新 prompt 指標 < 舊 prompt 20%：回滾並重新設計

#### 3.2 監控指標

```sql
-- 創建監控視圖
CREATE OR REPLACE VIEW ai_interpretation_metrics AS
SELECT
    character_voice,
    DATE(created_at) as date,
    COUNT(*) as total_interpretations,
    AVG(LENGTH(interpretation_text)) as avg_length,
    COUNT(DISTINCT user_id) as unique_users
FROM card_interpretations
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY character_voice, DATE(created_at)
ORDER BY date DESC, character_voice;
```

#### 3.3 錯誤處理與降級策略

**情境 1：AI 服務不可用**
```python
# 已在 AIInterpretationService 中實現
# 自動返回 None，由 caller 使用 fallback 靜態解讀
```

**情境 2：解讀質量異常**
```python
def validate_interpretation_quality(interpretation: str) -> bool:
    """驗證解讀質量"""
    # 檢查最小字數
    if len(interpretation) < 150:
        return False

    # 檢查是否包含預測性語言（應避免）
    forbidden_phrases = ['你將會', '未來會發生', '註定', '一定會']
    if any(phrase in interpretation for phrase in forbidden_phrases):
        logger.warning("Interpretation contains forbidden predictive language")
        return False

    # 檢查是否包含繁體中文
    if not any('\u4e00' <= char <= '\u9fff' for char in interpretation):
        return False

    return True
```

---

### Phase 4: 文檔與培訓

#### 4.1 內部文檔更新

**需要更新的文件**：
- [ ] API 文檔：說明新的解讀風格
- [ ] 用戶指南：解釋心理投射方法
- [ ] 開發者文檔：如何添加新角色 prompt

#### 4.2 Prompt 維護指南

**新增角色時的檢查清單**：
1. [ ] 定義角色的心理學取向（榮格/敘事治療/存在主義等）
2. [ ] 確定語言風格（正式/非正式、技術/詩意等）
3. [ ] 設計核心隱喻系統（與廢土世界觀整合）
4. [ ] 撰寫 5-10 個金句範例
5. [ ] 定義字數限制和格式結構
6. [ ] 創建測試案例（至少 3 張不同類型的牌）
7. [ ] 人工評測（至少 2 位評測者）

---

## 回滾計畫

### 如果需要緊急回滾

#### 方法 1：資料庫回滾
```sql
-- 從備份恢復
psql -h <host> -U <user> -d <database> < backup_characters_YYYYMMDD.sql
```

#### 方法 2：程式碼層級降級
```python
# config/settings.py
USE_NEW_PROMPTS = False  # 切換回舊版 prompt

# ai_interpretation_service.py
if not settings.USE_NEW_PROMPTS:
    # 使用舊版靜態 prompt
    return self._get_legacy_prompt(character_voice)
```

---

## 後續優化方向

### 短期（1-2 個月）
1. **擴展其他角色 prompt**：
   - Raider（掠奪者）
   - Brotherhood Scribe/Paladin（鋼鐵兄弟會）
   - NCR Ranger
   - Legion Centurion

2. **細化陣營風格**：
   - 在 `factions` 表的 `ai_style_config` 中添加更詳細的風格指引

3. **多語言支持**：
   - 目前只支援繁體中文
   - 未來可擴展至英文、簡體中文

### 中期（3-6 個月）
1. **動態 prompt 調整**：
   - 根據用戶歷史調整解讀風格
   - 學習用戶偏好（更理性 vs 更感性）

2. **上下文記憶**：
   - 記住用戶之前的問題和牌卡
   - 提供連貫的「諮詢體驗」

3. **情緒分析整合**：
   - 分析用戶問題中的情緒狀態
   - 動態調整同理心程度

### 長期（6-12 個月）
1. **AI Fine-tuning**：
   - 使用高質量解讀數據微調專用模型
   - 減少 prompt 工程依賴

2. **多模態輸入**：
   - 接受語音問題（語音轉文字）
   - 分析語調和情緒

3. **個人化心理模型**：
   - 為每位用戶建立心理特徵檔案
   - 提供深度個人化的洞察

---

## 成功標準

### 量化指標
- [ ] 用戶解讀完成率 ≥ 85%
- [ ] 平均停留時間增加 ≥ 20%
- [ ] 重複使用率 ≥ 40%
- [ ] AI 服務可用性 ≥ 99%

### 質化指標
- [ ] 用戶回饋提到「深刻」、「有幫助」、「準確」等正面詞彙
- [ ] 內部評測團隊評分 ≥ 4.0/5.0
- [ ] 無用戶投訴「解讀太預測性」或「不尊重」

---

## 聯絡人與責任

- **技術負責人**：[待填]
- **內容審查**：[待填]
- **心理學顧問**：[建議外聘臨床心理師審查]
- **用戶體驗**：[待填]

---

## 附錄

### A. 參考資料
- 榮格《紅書》與原型理論
- Michael White《敘事治療的實踐》
- Fallout 系列遊戲世界觀設定集
- 台灣心理諮商倫理守則

### B. 相關文件
- `system-prompts.md`：完整的 prompt 設計文件
- `update_character_prompts.sql`：資料庫更新腳本
- `TESTING.md`：詳細測試計畫（待創建）

### C. 風險評估
| 風險 | 可能性 | 影響 | 應對措施 |
|------|-------|------|----------|
| AI 成本超支 | 中 | 中 | 設定 token 限制、使用 cache |
| 解讀質量不穩定 | 中 | 高 | 實施質量驗證、fallback 機制 |
| 用戶不適應新風格 | 低 | 中 | A/B 測試、漸進式部署 |
| 法律/倫理問題 | 低 | 高 | 明確 AI 限制聲明、提供危機資源 |
