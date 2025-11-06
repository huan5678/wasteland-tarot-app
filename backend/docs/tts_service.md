# TTS 服務完整文檔

## 概述

TTS (Text-to-Speech) 服務提供語音合成功能，支援 Google Cloud TTS API，包括 WaveNet 和最新的 Chirp 3:HD 語音模型。

**服務位置**: `backend/app/services/tts_service.py`

---

## 架構概覽

### 核心組件

1. **TTSService**: 主要的 TTS 服務類別
2. **VoiceModelRouter**: 語音模型路由邏輯
3. **VoiceModel**: 語音模型枚舉（WAVENET, CHIRP3_HD）

### 語音模型

- **WaveNet**: Google Cloud WaveNet 語音（已 deprecated，保留用於緊急回滾）
- **Chirp 3:HD**: Google Cloud Chirp 3:HD 語音（當前主要模型）

---

## 主要方法

### synthesize_speech()

主要的語音合成方法，自動路由到適當的語音模型。

```python
def synthesize_speech(
    self,
    text: str,
    character_key: str,
    language_code: str = "zh-TW",
    return_base64: bool = False,
    user_id: Optional[str] = None,
    custom_pronunciations: Optional[List[CustomPronunciation]] = None,
    voice_controls: Optional[VoiceControlParams] = None,
    force_voice_model: Optional[str] = None
) -> Dict[str, Any]:
```

**參數**:
- `text`: 要合成的文字（1-5000 字元）
- `character_key`: 角色識別碼（14 個角色之一）
- `language_code`: 語言代碼（預設: "zh-TW"）
- `return_base64`: 是否返回 base64 編碼
- `user_id`: 使用者 ID（用於一致性路由）
- `custom_pronunciations`: 自訂發音列表（僅 Chirp 3:HD）
- `voice_controls`: 語音控制參數（僅 Chirp 3:HD）
- `force_voice_model`: 強制使用指定模型（"chirp3-hd" 或 "wavenet"）

**返回**:
```python
{
    "audio_content": bytes,      # 音檔二進位資料
    "audio_base64": str,         # base64 編碼（如果 return_base64=True）
    "duration": float,           # 預估時長（秒）
    "file_size": int,            # 檔案大小（位元組）
    "text_length": int,          # 文字長度
    "voice_name": str,           # 使用的語音名稱
    "voice_model": str,          # 語音模型（"wavenet" 或 "chirp3-hd"）
    "ssml_params": dict,         # SSML/標記參數
}
```

**範例**:
```python
from app.services.tts_service import TTSService

service = TTSService()

# 基本合成
result = service.synthesize_speech(
    text="歡迎來到廢土塔羅",
    character_key="pip_boy"
)

# 使用自訂發音（Chirp 3:HD）
from app.schemas.audio import CustomPronunciation

result = service.synthesize_speech(
    text="Pip-Boy 3000 是廢土生存必備工具",
    character_key="pip_boy",
    custom_pronunciations=[
        CustomPronunciation(
            phrase="Pip-Boy",
            pronunciation="pɪp bɔɪ"
        )
    ]
)

# 使用語音控制（Chirp 3:HD）
from app.schemas.audio import VoiceControlParams, Pause

result = service.synthesize_speech(
    text="這是一個重要的訊息",
    character_key="pip_boy",
    voice_controls=VoiceControlParams(
        pitch=5.0,
        rate=1.2,
        pauses=[Pause(position=10, duration="medium")]
    )
)
```

### generate_chirp3_markup()

生成 Chirp 3:HD 專用的標記文字。

```python
def generate_chirp3_markup(
    self,
    text: str,
    character_key: str,
    custom_pronunciations: Optional[List[CustomPronunciation]] = None,
    voice_controls: Optional[VoiceControlParams] = None
) -> str:
```

**標記格式**:
- 音高調整: `[pitch {value}st]`
- 語速調整: `[pace {value}]`
- 暫停: `[pause {duration}]`

**範例輸出**:
```
Hello World [pause medium] [pace 1.20] [pitch +5.0st]
```

### compute_cache_key()

計算完整的快取 key，包含所有合成參數。

```python
def compute_cache_key(
    self,
    text: str,
    character_key: str,
    voice_model: VoiceModel,
    custom_pronunciations: Optional[List[CustomPronunciation]] = None,
    voice_controls: Optional[VoiceControlParams] = None
) -> str:
```

**包含的參數**:
- 文字內容
- 角色識別碼
- 語音模型版本
- 自訂發音
- 語音控制參數

---

## 角色語音配置

### 支援的角色

所有 14 個角色都有對應的 Chirp 3:HD 語音映射：

1. `super_mutant` - 超級變種人
2. `brotherhood_paladin` - 鋼鐵兄弟會聖騎士
3. `legion_centurion` - 軍團百夫長
4. `ghoul` - 屍鬼
5. `wasteland_trader` - 廢土商人
6. `ncr_ranger` - NCR 遊騎兵
7. `pip_boy` - Pip-Boy 3000
8. `minuteman` - 義勇軍
9. `vault_dweller` - 避難所居民
10. `railroad_agent` - 鐵路特工
11. `brotherhood_scribe` - 鋼鐵兄弟會文書
12. `codsworth` - 科茲沃斯
13. `raider` - 掠奪者
14. `institute_scientist` - 學院科學家

### 語音參數

每個角色都有預設的語音參數：

```python
DEFAULT_VOICE_CONFIGS = {
    "pip_boy": {
        "pitch": 1.0,    # 0 semitones (標準)
        "rate": 1.0,     # 標準語速
        "volume": 1.0    # 最大音量
    },
    # ... 其他角色
}
```

---

## 語音模型路由

### 路由邏輯

`VoiceModelRouter` 根據以下優先順序決定使用的語音模型：

1. **全域啟用開關** (`CHIRP3_ENABLED`)
2. **角色特定啟用列表** (`CHIRP3_ENABLED_CHARACTERS`)
3. **百分比滾動** (`CHIRP3_ROLLOUT_PERCENTAGE`)

### 使用者一致性

當提供 `user_id` 時，同一使用者總是會得到相同的模型（deterministic routing）。

---

## 自訂發音

### CustomPronunciation

使用 IPA 音標指定自訂發音：

```python
from app.schemas.audio import CustomPronunciation

pronunciations = [
    CustomPronunciation(
        phrase="Pip-Boy",
        pronunciation="pɪp bɔɪ",
        phonetic_encoding="PHONETIC_ENCODING_IPA"
    )
]
```

### 發音字典

常見術語的發音可以添加到全域字典中：

```python
# 在 tts_service.py 中添加
PRONUNCIATION_DICTIONARY = {
    "Pip-Boy": "pɪp bɔɪ",
    "Tarot": "ˈtæ.roʊ",
    # ... 更多術語
}
```

---

## 語音控制

### VoiceControlParams

支援運行時調整語音參數：

```python
from app.schemas.audio import VoiceControlParams, Pause

voice_controls = VoiceControlParams(
    pitch=5.0,          # 音高調整（-20 到 +20 semitones）
    rate=1.2,           # 語速倍率（0.25 到 4.0）
    volume=0.9,         # 音量（0.0 到 1.0）
    pauses=[            # 自訂暫停
        Pause(position=10, duration="medium"),
        Pause(position=25, duration="500ms")
    ]
)
```

### 暫停類型

- `"short"`: 短暫停（約 0.5 秒）
- `"medium"`: 中等暫停（約 1 秒）
- `"long"`: 長暫停（約 2 秒）
- `"{number}ms"`: 自訂毫秒數（如 "500ms"）

---

## 錯誤處理

### 常見錯誤

1. **TTS 客戶端未初始化**
   ```python
   Exception: TTS client not initialized
   ```
   **解決**: 檢查 Google Cloud 憑證配置

2. **無效的角色 key**
   ```python
   ValueError: No Chirp 3:HD voice for character: {character_key}
   ```
   **解決**: 使用有效的角色識別碼

3. **API 錯誤**
   ```python
   Exception: Google Cloud TTS API error
   ```
   **解決**: 檢查 API 憑證和配額

### Fallback 機制

當 Chirp 3:HD 合成失敗時（如果啟用 fallback）：

1. 自動記錄錯誤
2. 記錄 fallback metrics
3. 嘗試使用 WaveNet 合成
4. 返回 WaveNet 結果

---

## 效能優化

### 快取策略

1. **Redis 快取**: 5 分鐘 TTL（快速存取）
2. **資料庫快取**: 永久儲存（持久化）
3. **快取 key**: 包含所有合成參數

### 效能目標

- **合成時間**: < 2 秒（90% 請求）
- **快取命中率**: > 90%
- **錯誤率**: < 1%

---

## 監控指標

所有指標通過 Prometheus 暴露：

- `tts_synthesis_total`: 合成請求總數
- `tts_synthesis_duration_seconds`: 合成耗時
- `tts_cache_hits_total`: 快取命中數
- `tts_chirp3_fallback_total`: Fallback 次數

詳細說明見 `TTS_METRICS.md`。

---

## 相關文檔

- **語音映射說明**: `chirp3_voice_mapping.md`
- **API 端點文檔**: `api/audio_endpoints.md`
- **環境變數配置**: `CHIRP3_ENV_VARIABLES.md`
- **監控指標**: `TTS_METRICS.md`
- **故障排除**: `TTS_TROUBLESHOOTING.md`

---

**最後更新**: 2025-11-04
