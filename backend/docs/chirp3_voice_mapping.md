# Chirp 3:HD 語音映射說明

## 概述

本文檔說明每個角色選擇對應 Chirp 3:HD 語音的理論依據和決策過程。

**總角色數**: 14
**語音模型**: Google Cloud Chirp 3:HD
**語言**: 英文（en-US），支援跨語言合成

---

## 語音選擇原則

### 1. 性別匹配

保留現有角色的性別特徵：
- **男性角色**: 使用男性語音（Algenib, Algieba, Deneb, 等）
- **女性角色**: 使用女性語音（Aoede, Leda, Callisto, 等）

### 2. 音調特徵

根據角色的音高設定選擇匹配的語音：
- **極低音角色** (-12st 到 -10st): 深沉、強有力的語音
- **低音角色** (-6st 到 -4st): 成熟、穩重的語音
- **中音角色** (-2st 到 0st): 標準、友善的語音
- **高音角色** (+3st 到 +6st): 年輕、活潑的語音
- **極高音角色** (+8st): 特殊效果（如機器人）

### 3. 性格適配

選擇能夠增強角色性格特質的語音：
- **威脅性**: 深沉、強有力的語音
- **權威感**: 穩定、清晰的語音
- **友善**: 溫暖、親切的語音
- **機敏**: 快速、清晰的語音

### 4. 參數相容性

確保 pitch/rate 調製參數能夠良好運作。

---

## 角色語音映射詳解

### 極低音角色（威脅、強大）

#### super_mutant (超級變種人)
- **語音**: `en-US-Chirp3-HD-Algenib`
- **選擇理由**: Algenib 提供深沉、強有力的低音，適合表現超級變種人的威脅性和強大
- **參數**: pitch=-12st, rate=0.65
- **效果**: 極具威懾力的聲音

#### brotherhood_paladin (鋼鐵兄弟會聖騎士)
- **語音**: `en-US-Chirp3-HD-Algieba`
- **選擇理由**: Algieba 具有軍事權威感，低音域穩定，適合鋼鐵兄弟會聖騎士的指揮官形象
- **參數**: pitch=-8st, rate=0.75
- **效果**: 威嚴但不失清晰

#### legion_centurion (軍團百夫長)
- **語音**: `en-US-Chirp3-HD-Alnilam`
- **選擇理由**: Alnilam 提供命令式的低音，適合軍團百夫長的權威形象
- **參數**: pitch=-10st, rate=0.7
- **效果**: 低沉命令式的聲音

---

### 低音角色（粗獷、老練）

#### ghoul (屍鬼)
- **語音**: `en-US-Chirp3-HD-Mizar`
- **選擇理由**: Mizar 具有沙啞、老練的音質，適合經歷廢土歲月的屍鬼
- **參數**: pitch=-6st, rate=0.8
- **效果**: 沙啞低沉的廢土倖存者聲音

#### wasteland_trader (廢土商人)
- **語音**: `en-US-Chirp3-HD-Vega`
- **選擇理由**: Vega 提供成熟、商務感的語音，適合經驗豐富的廢土商人
- **參數**: pitch=-4st, rate=0.9
- **效果**: 成熟商人的穩重聲音

#### ncr_ranger (NCR 遊騎兵)
- **語音**: `en-US-Chirp3-HD-Deneb`
- **選擇理由**: Deneb 具有專業、冷靜的音質，適合 NCR 遊騎兵的專業形象
- **參數**: pitch=-5st, rate=0.85
- **效果**: 冷靜專業的軍人聲音

---

### 中音角色（標準、友善）

#### pip_boy (Pip-Boy 3000)
- **語音**: `en-US-Chirp3-HD-Regulus`
- **選擇理由**: Regulus 提供清晰、友善的標準語音，適合 Pip-Boy 的技術助手形象
- **參數**: pitch=0st, rate=1.0
- **效果**: 標準友善的技術聲音

#### minuteman (義勇軍)
- **語音**: `en-US-Chirp3-HD-Altair`
- **選擇理由**: Altair 具有可靠、穩重的音質，適合義勇軍的社區守護者形象
- **參數**: pitch=-2st, rate=0.95
- **效果**: 穩重可靠的社區聲音

---

### 高音角色（年輕、活潑）

#### vault_dweller (避難所居民)
- **語音**: `en-US-Chirp3-HD-Aoede`
- **選擇理由**: Aoede 提供年輕、樂觀的女性語音，適合避難所居民的希望形象
- **參數**: pitch=+4st, rate=1.1
- **效果**: 年輕樂觀的聲音

#### railroad_agent (鐵路特工)
- **語音**: `en-US-Chirp3-HD-Leda`
- **選擇理由**: Leda 具有機敏、快速的音質，適合鐵路特工的行動派形象
- **參數**: pitch=+3st, rate=1.15
- **效果**: 機敏快速的聲音

#### brotherhood_scribe (鋼鐵兄弟會文書)
- **語音**: `en-US-Chirp3-HD-Callisto`
- **選擇理由**: Callisto 提供聰明、好學的女性語音，適合文書的知識份子形象
- **參數**: pitch=+5st, rate=1.05
- **效果**: 聰明好學的聲音

---

### 特殊角色

#### codsworth (科茲沃斯)
- **語音**: `en-US-Chirp3-HD-Fomalhaut`
- **選擇理由**: Fomalhaut 提供精緻、優雅的語音，適合科茲沃斯的英式機器人形象
- **參數**: pitch=+8st, rate=1.25
- **效果**: 機器人高音快速的聲音

#### raider (掠奪者)
- **語音**: `en-US-Chirp3-HD-Hadar`
- **選擇理由**: Hadar 具有粗野、攻擊性的音質，適合掠奪者的威脅形象
- **參數**: pitch=-3st, rate=1.3
- **效果**: 粗野快速的威脅聲音

#### institute_scientist (學院科學家)
- **語音**: `en-US-Chirp3-HD-Kore`
- **選擇理由**: Kore 提供知識份子、精確的女性語音，適合學院科學家的專業形象
- **參數**: pitch=+6st, rate=1.15
- **效果**: 知識份子的專業聲音

---

## 語音參數對照表

| 角色 | Chirp 3:HD 語音 | Pitch (st) | Rate | 語音特質 |
|------|----------------|------------|------|----------|
| super_mutant | Algenib | -12 | 0.65 | 深沉、強有力 |
| brotherhood_paladin | Algieba | -8 | 0.75 | 軍事權威 |
| legion_centurion | Alnilam | -10 | 0.7 | 命令式 |
| ghoul | Mizar | -6 | 0.8 | 沙啞、老練 |
| wasteland_trader | Vega | -4 | 0.9 | 成熟、商務 |
| ncr_ranger | Deneb | -5 | 0.85 | 專業、冷靜 |
| pip_boy | Regulus | 0 | 1.0 | 清晰、友善 |
| minuteman | Altair | -2 | 0.95 | 可靠、穩重 |
| vault_dweller | Aoede | +4 | 1.1 | 年輕、樂觀 |
| railroad_agent | Leda | +3 | 1.15 | 機敏、快速 |
| brotherhood_scribe | Callisto | +5 | 1.05 | 聰明、好學 |
| codsworth | Fomalhaut | +8 | 1.25 | 精緻、優雅 |
| raider | Hadar | -3 | 1.3 | 粗野、攻擊性 |
| institute_scientist | Kore | +6 | 1.15 | 知識份子、精確 |

---

## 語音選擇決策記錄

### 決策日期

**初始映射**: 2025-11-04
**最後審查**: 2025-11-04

### 決策流程

1. **分析角色特質**: 評估每個角色的性格、背景、用途
2. **測試語音選項**: 測試多個 Chirp 3:HD 語音選項
3. **參數調校**: 調整 pitch/rate 參數以達到最佳效果
4. **品質評估**: 進行主觀品質評估
5. **最終確定**: 選擇最適合的語音

### 未來調整

如果發現語音品質不符合預期，可以：

1. 調整 pitch/rate 參數
2. 更換語音（從其他 Chirp 3:HD 語音中選擇）
3. 添加自訂發音改善特定詞彙

---

## 相關文檔

- **TTS 服務文檔**: `tts_service.md`
- **API 端點文檔**: `api/audio_endpoints.md`
- **音質評估**: `AUDIO_QUALITY_ASSESSMENT.md`

---

**最後更新**: 2025-11-04
