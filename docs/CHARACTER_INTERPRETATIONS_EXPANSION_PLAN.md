# 角色解讀擴展計劃

## 📊 現狀總結

### 已完成（100% 覆蓋率）
- ✅ **Pip-Boy** (78/78) - `pip_boy_analysis`
- ✅ **避難所居民** (78/78) - `vault_dweller_perspective`
- ✅ **廢土商人** (78/78) - `wasteland_trader_wisdom`
- ✅ **超級變種人** (78/78) - `super_mutant_simplicity`
- ✅ **Codsworth** (78/78) - `codsworth_analysis`
- ✅ **兄弟會書記員** (78/78) - `brotherhood_scribe_analysis`
- ✅ **屍鬼** (78/78) - `ghoul_perspective`
- ✅ **掠奪者** (78/78) - `raider_perspective`

**總計：8 個角色，624 條解讀內容**

### 待補充（0% 覆蓋率）
- ⚠️ **兄弟會聖騎士** (0/78) - 需新增欄位
- ⚠️ **NCR 遊騎兵** (0/78) - 需新增欄位
- ⚠️ **軍團百夫長** (0/78) - 需新增欄位
- ⚠️ **民兵** (0/78) - 需新增欄位
- ⚠️ **鐵路特工** (0/78) - 需新增欄位
- ⚠️ **學院科學家** (0/78) - 需新增欄位

**總計：6 個角色，468 條解讀待補充**

## 🎯 目標

完成所有 14 個角色對 78 張卡片的解讀，總計 **1,092 條解讀內容**。

## 📝 實施步驟

### 步驟 1：資料庫 Schema 更新 ✅

**檔案**：`sql/add_missing_character_columns.sql`

執行方式：
```bash
# 在 Supabase SQL Editor 中執行
psql $DATABASE_URL < sql/add_missing_character_columns.sql
```

**新增欄位**：
| 角色 | 欄位名稱 | 說明 |
|------|---------|------|
| 兄弟會聖騎士 | `brotherhood_paladin_combat_wisdom` | 戰鬥智慧 - 紀律、榮譽、戰術 |
| NCR 遊騎兵 | `ncr_ranger_tactical_analysis` | 戰術分析 - 民主、法治、策略 |
| 軍團百夫長 | `legion_centurion_command` | 指揮命令 - 服從、力量、榮耀 |
| 民兵 | `minuteman_hope_message` | 希望訊息 - 人民、自由、希望 |
| 鐵路特工 | `railroad_agent_liberation_view` | 解放觀點 - 自由、秘密、解放 |
| 學院科學家 | `institute_scientist_research_notes` | 研究筆記 - 科學、理性、進步 |

### 步驟 2：更新後端 Model

**檔案**：`backend/app/models/wasteland_card.py`

在 `WastelandCard` 模型中添加新欄位：

```python
class WastelandCard(Base):
    # ... 現有欄位 ...
    
    # 擴展角色解讀（新增）
    brotherhood_paladin_combat_wisdom = Column(Text)
    ncr_ranger_tactical_analysis = Column(Text)
    legion_centurion_command = Column(Text)
    minuteman_hope_message = Column(Text)
    railroad_agent_liberation_view = Column(Text)
    institute_scientist_research_notes = Column(Text)
```

更新 `to_dict()` 方法，將新欄位加入 `character_voices`：

```python
def to_dict(self) -> dict:
    return {
        # ... 其他欄位 ...
        "character_voices": {
            # 現有角色
            CharacterVoice.PIP_BOY.value: self.pip_boy_analysis,
            CharacterVoice.VAULT_DWELLER.value: self.vault_dweller_perspective,
            CharacterVoice.WASTELAND_TRADER.value: self.wasteland_trader_wisdom,
            CharacterVoice.SUPER_MUTANT.value: self.super_mutant_simplicity,
            CharacterVoice.CODSWORTH.value: self.codsworth_analysis,
            CharacterVoice.BROTHERHOOD_SCRIBE.value: self.brotherhood_scribe_analysis,
            CharacterVoice.GHOUL.value: self.ghoul_perspective,
            CharacterVoice.RAIDER.value: self.raider_perspective,
            # 新增角色
            CharacterVoice.BROTHERHOOD_PALADIN.value: self.brotherhood_paladin_combat_wisdom,
            CharacterVoice.NCR_RANGER.value: self.ncr_ranger_tactical_analysis,
            CharacterVoice.LEGION_CENTURION.value: self.legion_centurion_command,
            CharacterVoice.MINUTEMAN.value: self.minuteman_hope_message,
            CharacterVoice.RAILROAD_AGENT.value: self.railroad_agent_liberation_view,
            CharacterVoice.INSTITUTE_SCIENTIST.value: self.institute_scientist_research_notes,
        },
    }
```

### 步驟 3：內容生成策略

#### 方案 A：使用 AI 批次生成（推薦）

**優點**：
- 快速生成大量內容
- 風格一致
- 可批次處理

**實施**：
1. 創建提示詞模板（每個角色一個）
2. 使用 OpenAI API 批次生成
3. 人工審核並調整

**提示詞範例**（兄弟會聖騎士）：

```
你是一位鋼鐵兄弟會的聖騎士，身穿動力裝甲，捍衛正義與科技。
請以聖騎士的口吻為以下塔羅牌提供解讀（50-100字）：

卡牌：{card_name}
正位意義：{upright_meaning}
逆位意義：{reversed_meaning}

要求：
- 強調紀律、榮譽、戰鬥技巧
- 使用軍事術語
- 體現兄弟會的價值觀
- 語氣堅定、專業
```

#### 方案 B：手動編寫

**優點**：
- 品質最高
- 完全符合角色設定

**缺點**：
- 耗時（468 條內容）
- 需要深入了解 Fallout 世界觀

### 步驟 4：內容補充腳本

創建批次導入腳本：

```python
# scripts/import_character_interpretations.py
import asyncio
import csv
from sqlalchemy import update
from app.db.session import get_db
from app.models.wasteland_card import WastelandCard

async def import_interpretations(csv_file: str, character_column: str):
    """
    從 CSV 導入角色解讀
    
    CSV 格式：
    card_name,interpretation
    可樂瓶二,聖騎士看來這是...
    """
    async for db in get_db():
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                stmt = (
                    update(WastelandCard)
                    .where(WastelandCard.name == row['card_name'])
                    .values({character_column: row['interpretation']})
                )
                await db.execute(stmt)
        await db.commit()

# 使用範例
asyncio.run(import_interpretations(
    'data/paladin_interpretations.csv',
    'brotherhood_paladin_combat_wisdom'
))
```

### 步驟 5：驗證與測試

**檢查覆蓋率**：
```sql
SELECT 
    COUNT(*) as total,
    COUNT(brotherhood_paladin_combat_wisdom) as paladin,
    COUNT(ncr_ranger_tactical_analysis) as ncr,
    COUNT(legion_centurion_command) as legion,
    COUNT(minuteman_hope_message) as minuteman,
    COUNT(railroad_agent_liberation_view) as railroad,
    COUNT(institute_scientist_research_notes) as institute
FROM wasteland_cards;
```

**前端測試**：
1. 選擇不同陣營
2. 點擊卡片查看角色解讀
3. 確認過濾正確顯示對應陣營的角色

## 📚 角色設定參考

### 1. 兄弟會聖騎士（Brotherhood Paladin）
- **核心價值**：榮譽、紀律、科技保護
- **語氣**：軍事化、專業、堅定
- **關鍵詞**：戰術、任務、榮譽守則、動力裝甲
- **範例**："聖騎士戰術評估：此牌象徵戰場上的轉折點。記住兄弟會守則：紀律勝過衝動。建議採取防禦姿態。"

### 2. NCR 遊騎兵（NCR Ranger）
- **核心價值**：民主、法治、保護人民
- **語氣**：專業、務實、正義感
- **關鍵詞**：正義、法律、巡邏、共和國
- **範例**："遊騎兵報告：這代表新的開始。NCR 的法律是文明的基石。記住，我們為人民服務。"

### 3. 軍團百夫長（Legion Centurion）
- **核心價值**：服從、力量、榮耀
- **語氣**：命令式、強硬、古羅馬風格
- **關鍵詞**：凱薩、榮譽、征服、服從
- **範例**："百夫長令：此牌預示勝利。軍團的意志如鋼鐵。弱者將被征服，強者獲得榮耀。"

### 4. 民兵（Minuteman）
- **核心價值**：人民、自由、互助
- **語氣**：鼓舞人心、溫暖、充滿希望
- **關鍵詞**：希望、自由、社區、守護
- **範例**："民兵的心聲：這張牌提醒我們，希望永遠存在。只要我們團結一致，就能重建家園。"

### 5. 鐵路特工（Railroad Agent）
- **核心價值**：自由、秘密、解放
- **語氣**：神秘、堅定、充滿使命感
- **關鍵詞**：解放、自由、秘密、義體人
- **範例**："特工密語：這條路通向自由。每個靈魂都值得解放。記住暗號，保持警惕。"

### 6. 學院科學家（Institute Scientist）
- **核心價值**：科學、理性、進步
- **語氣**：學術、冷靜、客觀
- **關鍵詞**：研究、數據、進化、未來
- **範例**："實驗記錄：根據數據分析，此變量指向正向結果。學院的研究將引領人類進化。"

## 🚀 優先級排序

### P0 - 立即執行
1. ✅ 執行資料庫 Schema 更新
2. ⏳ 更新後端 Model 和 to_dict()

### P1 - 本週完成
3. ⏳ 為最流行的陣營補充解讀
   - 兄弟會聖騎士（brotherhood）
   - NCR 遊騎兵（ncr）
   - 民兵（minutemen）

### P2 - 下週完成
4. ⏳ 補充其他陣營
   - 軍團百夫長（legion）
   - 鐵路特工（railroad）
   - 學院科學家（institute）

## 📈 進度追蹤

| 角色 | 進度 | 完成日期 |
|------|------|---------|
| 兄弟會聖騎士 | 0/78 (0%) | - |
| NCR 遊騎兵 | 0/78 (0%) | - |
| 軍團百夫長 | 0/78 (0%) | - |
| 民兵 | 0/78 (0%) | - |
| 鐵路特工 | 0/78 (0%) | - |
| 學院科學家 | 0/78 (0%) | - |

---

**文檔版本**：1.0  
**最後更新**：2025-11-05  
**負責人**：開發團隊
