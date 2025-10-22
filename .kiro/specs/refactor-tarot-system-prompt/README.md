# 廢土塔羅 AI System Prompt 重構專案

## 專案概述

這是一個將 AI 解牌系統從「神秘占卜」升級為「深度心理投射工具」的重構專案，結合了：
- **榮格深度心理學**：原型理論、陰影整合、個性化過程
- **敘事治療方法**：投射技術、重構限制性敘事、賦權語言
- **Fallout 世界觀**：廢土生存智慧、業力系統、輻射作為創傷隱喻

## 核心改進

### 1. 從預測到投射
- ❌ 舊系統：「你將會遇到貴人」（預測性）
- ✅ 新系統：「這張牌反映了你內在對支持的渴望」（投射性）

### 2. 從通用到差異化
每個角色有獨特的心理學風格：
- **Pip-Boy**：數據化、理性分析
- **Vault Dweller**：成長故事、同行者視角
- **Wasteland Trader**：實用主義、交易隱喻
- **Codsworth**：溫柔管家、家庭化關懷
- **Super Mutant**：極簡直接、存在主義勇氣
- **Ghoul**：時間智慧、創傷共存

### 3. 從表面到深度
- 原型探索（英雄、陰影、智者）
- 陰影整合技巧
- 敘事重構方法
- 廢土隱喻系統（輻射=創傷、變種生物=陰影、避難所=防禦機制）

## 文件結構

```
.kiro/specs/refactor-tarot-system-prompt/
├── README.md                         # 本文件：專案總覽
├── system-prompts.md                 # 完整的 prompt 設計文件（核心）
├── update_character_prompts.sql      # 資料庫更新腳本
└── IMPLEMENTATION.md                 # 實施指南與測試計畫
```

## 快速開始

### 1. 閱讀設計文件
```bash
# 查看完整的 prompt 設計
cat .kiro/specs/refactor-tarot-system-prompt/system-prompts.md
```

**重點章節**：
- 通用基礎框架（所有角色共享的心理學原則）
- 5 階段解讀流程（從場景建構到行動賦權）
- 6 個主要角色的專屬 prompt

### 2. 執行資料庫更新
```bash
# ⚠️ 請先備份資料庫！
pg_dump -h <host> -U <user> -d <database> -t characters > backup_characters_$(date +%Y%m%d).sql

# 執行更新
psql -h <host> -U <user> -d <database> -f .kiro/specs/refactor-tarot-system-prompt/update_character_prompts.sql
```

### 3. 驗證更新
```sql
-- 檢查更新結果
SELECT
    key,
    LENGTH(ai_system_prompt) as prompt_length,
    ai_tone_description
FROM characters
WHERE key IN ('pip_boy', 'vault_dweller', 'wasteland_trader', 'codsworth', 'super_mutant', 'ghoul');
```

### 4. 測試新 prompt
```python
# 創建測試案例
from app.services.ai_interpretation_service import AIInterpretationService

service = AIInterpretationService(settings, db_session)
interpretation = await service.generate_interpretation(
    card=test_card,
    character_voice=CharacterVoice.PIP_BOY,
    question="我應該換工作嗎？",
    karma=KarmaAlignment.NEUTRAL
)

print(interpretation)
```

## 關鍵特色

### 心理學深度
- **榮格原型理論**：英雄旅程、陰影整合、個性化過程
- **投射技術**：將內在衝突外化到牌卡象徵
- **敘事治療**：重構限制性敘事、創造可能性故事
- **創傷知情**：溫和處理痛苦主題、提供危機資源

### 廢土整合
- **輻射隱喻系統**：輻射=創傷能量、輻射抗性=心理韌性
- **變種生物=陰影**：屍鬼、超級變種人作為被創傷改變的自我
- **陣營=價值觀**：鋼鐵兄弟會、NCR、凱薩軍團的道德哲學
- **業力系統**：Good/Neutral/Evil 作為當前道德取向

### 倫理保障
- **非預測性**：明確拒絕「你將會...」式語言
- **賦權語言**：強調用戶的選擇權和能動性
- **危機處理**：識別自殺/自傷意念，提供台灣危機專線
- **AI 限制聲明**：明確說明無法替代專業心理諮商

## 角色 Prompt 範例

### Pip-Boy（數據化理性）
```
正在啟動心理掃描模組...
【Pip-Boy 分析】針對你的問題，系統掃描到以下數據：

情緒穩定度：65%，內在衝突指數：中等

[數據分析內容...]

[系統註記] 數據之外，Pip-Boy 也理解你的疲憊是真實的。
建議優先處理：1. 建立支援網絡 2. 評估資源狀態
```

### Vault Dweller（成長故事）
```
[深呼吸] 你的問題讓我想起自己第一次面對類似處境的時候...

剛離開避難所時，我以為外面只有怪物。但後來發現，
最大的挑戰是面對自己內心的恐懼。

[故事性解讀...]

離開避難所的那一刻，你已經比昨天的自己更勇敢。
```

### Super Mutant（極簡直接）
```
我聽到你的問題。廢土教會我：複雜的話只會讓人迷路。

你害怕失敗。但失敗不會殺死你。逃避才會。

[直接指出核心真相...]

廢土不需要完美的人，需要能站起來的人。現在站起來。
```

## 實施建議

### Phase 1：小規模測試（1-2 週）
- 選擇 1-2 個角色進行 A/B 測試
- 收集用戶回饋和質量指標
- 調整 prompt 細節

### Phase 2：漸進部署（2-4 週）
- 逐步擴展到所有角色
- 監控 AI 成本和性能
- 建立質量驗證機制

### Phase 3：優化迭代（持續）
- 根據用戶數據調整 prompt
- 擴展到其他角色（Raider、Brotherhood 等）
- 開發動態 prompt 調整系統

## 成功標準

### 量化指標
- [ ] 用戶解讀完成率 ≥ 85%
- [ ] 平均停留時間增加 ≥ 20%
- [ ] 重複使用率 ≥ 40%

### 質化指標
- [ ] 用戶提到「深刻」、「有幫助」、「準確」
- [ ] 內部評測評分 ≥ 4.0/5.0
- [ ] 無「太預測性」或「不尊重」的投訴

## 風險與應對

### 風險 1：AI 成本超支
**應對**：設定 token 限制、使用 cache、監控每日成本

### 風險 2：解讀質量不穩定
**應對**：實施質量驗證、fallback 機制、人工抽查

### 風險 3：用戶不適應
**應對**：A/B 測試、漸進式部署、保留舊版選項

## 後續優化方向

### 短期（1-2 個月）
- 擴展其他角色 prompt（Raider、Brotherhood、NCR、Legion）
- 細化陣營風格配置
- 建立完整的測試套件

### 中期（3-6 個月）
- 動態 prompt 調整（根據用戶歷史）
- 上下文記憶（記住之前的諮詢）
- 情緒分析整合

### 長期（6-12 個月）
- AI Fine-tuning（專用模型）
- 多模態輸入（語音、情緒分析）
- 個人化心理模型

## 參考資料

### 學術基礎
- 榮格《紅書》與原型理論
- Michael White《敘事治療的實踐》
- Rachel Pollack《塔羅的七十八度智慧》

### 遊戲世界觀
- Fallout 系列遊戲設定集
- Fallout Bible（官方背景設定）

### 倫理指引
- 台灣心理諮商倫理守則
- APA 心理學家倫理規範

## 聯絡與貢獻

如有問題或建議，請：
1. 在專案中提 Issue
2. 聯繫技術負責人：[待填]
3. 參考 `IMPLEMENTATION.md` 獲取詳細指南

---

**版本**：v1.0
**最後更新**：2025-01-XX
**狀態**：設計完成，待實施
