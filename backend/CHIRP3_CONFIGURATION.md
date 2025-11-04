# Chirp 3:HD TTS 配置指南

## 概述

本文檔說明如何設定和使用 Google Cloud Text-to-Speech Chirp 3:HD 模型進行高品質語音合成。

## 配置狀態

✅ **已完成配置**

- ✓ Chirp 3:HD 已全局啟用 (100% rollout)
- ✓ Google Cloud TTS credentials 已設定
- ✓ 英文語音配置完成
- ✓ 自訂發音功能已實作
- ✓ 所有角色語音配置完成

## 環境變數設定

### Chirp 3:HD 功能開關

```bash
# 啟用 Chirp 3:HD
CHIRP3_ENABLED=true

# 使用百分比 (0-100)
# 100 = 所有請求使用 Chirp 3:HD
# 50 = 50% 請求使用 Chirp 3:HD，50% 使用 WaveNet
CHIRP3_ROLLOUT_PERCENTAGE=100

# 指定角色列表（逗號分隔）
# 空白 = 所有角色使用 Chirp 3:HD
# 例如："pip_boy,vault_dweller,brotherhood_scribe"
CHIRP3_ENABLED_CHARACTERS=

# Chirp 3:HD 失敗時回退到 WaveNet
CHIRP3_FALLBACK_TO_WAVENET=true
```

### Google TTS 基本設定

```bash
# 語言代碼（Chirp 3:HD 主要支援英文）
GOOGLE_TTS_LANGUAGE_CODE=en-US

# 語音名稱
GOOGLE_TTS_VOICE_NAME=en-US-Neural2-D

# Google Cloud Service Account Credentials (JSON 格式)
GOOGLE_CLOUD_CREDENTIALS_JSON={"type": "service_account", ...}

# Supabase Storage Bucket
SUPABASE_STORAGE_BUCKET=audio-files
```

## Chirp 3:HD 功能特性

### 1. 高品質音頻
- 24kHz 採樣率（HD 品質）
- MP3 格式輸出
- 更自然的語音合成

### 2. 音高調整
```
[pitch +5.0st]  # 提高 5 個半音
[pitch -8.0st]  # 降低 8 個半音
```

### 3. 語速控制
```
[pace 1.3]  # 1.3 倍速
[pace 0.7]  # 0.7 倍速
```

### 4. 自訂暫停
```
[pause 500ms]   # 暫停 500 毫秒
[pause short]   # 短暫停
[pause medium]  # 中等暫停
[pause long]    # 長暫停
```

### 5. 自訂發音（IPA 音標）
```python
custom_pronunciations = [
    CustomPronunciation(
        phrase="Pip-Boy",
        pronunciation="pɪp bɔɪ"
    ),
    CustomPronunciation(
        phrase="Tarot",
        pronunciation="ˈtæ.roʊ"
    )
]
```

輸出標記：
```
The [ipa pɪp bɔɪ]Pip-Boy[/ipa] shows your [ipa ˈtæ.roʊ]Tarot[/ipa] cards.
```

## 角色語音配置

系統支援 29 個廢土角色，每個角色有獨特的音高、語速和音色：

### 極低音角色（威脅、強大）
- `super_mutant`: pitch=0.4, rate=0.65 (-12st, 極低沉緩慢)
- `brotherhood_paladin`: pitch=0.6, rate=0.75 (-8st, 低沉威嚴)
- `legion_centurion`: pitch=0.5, rate=0.7 (-10st, 低沉命令)

### 機械/AI 角色
- `pip_boy`: pitch=1.8, rate=1.3 (+8st, 機械快速)
- `mr_handy`: pitch=1.6, rate=1.25 (+6st, 機械禮貌)
- `eyebot`: pitch=2.0, rate=1.4 (+10st, 極高電子音)

### 中性角色
- `vault_dweller`: pitch=1.0, rate=1.0 (0st, 標準音)
- `wasteland_merchant`: pitch=1.05, rate=1.05 (+1st, 友善)

### 完整角色列表
參見 `backend/app/services/tts_service.py` 的 `DEFAULT_VOICE_CONFIGS`

## API 使用範例

### 基本 TTS 生成

```bash
POST /api/v1/audio/story/generate
Content-Type: application/json

{
  "card_id": "123e4567-e89b-12d3-a456-426614174000",
  "character_keys": ["pip_boy", "vault_dweller"],
  "force_regenerate": false
}
```

### 使用自訂發音和語音控制

```python
from app.schemas.audio import (
    CustomPronunciation,
    VoiceControlParams,
    Pause
)

# 自訂發音
custom_pronunciations = [
    CustomPronunciation(
        phrase="Pip-Boy",
        pronunciation="pɪp bɔɪ"
    )
]

# 語音控制參數
voice_controls = VoiceControlParams(
    pitch=5.0,  # +5 semitones
    rate=1.2,   # 1.2x speed
    volume=1.0,
    pauses=[
        Pause(position=10, duration="medium"),
        Pause(position=25, duration="500ms")
    ]
)

# 在 TTS Service 中使用
tts_service = TTSService()
result = tts_service.synthesize(
    text="The Pip-Boy displays your stats.",
    character_key="pip_boy",
    custom_pronunciations=custom_pronunciations,
    voice_controls=voice_controls
)
```

## 測試與驗證

### 1. 檢查配置

```bash
cd backend
grep "^CHIRP3_" .env
```

預期輸出：
```
CHIRP3_ENABLED=true
CHIRP3_ROLLOUT_PERCENTAGE=100
CHIRP3_ENABLED_CHARACTERS=
CHIRP3_FALLBACK_TO_WAVENET=true
```

### 2. 啟動 Backend Server

```bash
cd backend
python -m app.main
```

### 3. 檢查日誌

啟動後應該看到：
```
[INFO] Chirp 3:HD TTS enabled (rollout: 100%)
[INFO] Using voice model: chirp3-hd
```

### 4. 測試 API

```bash
curl -X POST http://localhost:8000/api/v1/audio/story/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "card_id": "123e4567-e89b-12d3-a456-426614174000",
    "character_keys": ["pip_boy"],
    "force_regenerate": true
  }'
```

## 故障排除

### 問題：Chirp 3:HD 未啟用

檢查：
1. `CHIRP3_ENABLED=true` 已設定
2. `CHIRP3_ROLLOUT_PERCENTAGE > 0`
3. Google Cloud credentials 有效

### 問題：API 錯誤

可能原因：
1. Google Cloud TTS API 未啟用
2. Credentials 無效或過期
3. API quota 超限

解決方案：
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 啟用 Cloud Text-to-Speech API
3. 檢查 API quota 和使用量
4. 驗證 service account permissions

### 問題：語音品質不佳

建議：
1. 確認使用 Chirp 3:HD (檢查日誌)
2. 調整角色語音參數
3. 使用自訂發音改善特定詞彙
4. 確認 sample_rate_hertz=24000 (HD)

## 費用估算

Chirp 3:HD 定價（參考 2024 年）：
- Standard voices: ~$4 per 1M characters
- WaveNet voices: ~$16 per 1M characters
- Neural2 voices: ~$16 per 1M characters

注意：實際費用請參考 [Google Cloud Pricing](https://cloud.google.com/text-to-speech/pricing)

## 相關文件

- [Google Cloud TTS Documentation](https://cloud.google.com/text-to-speech/docs)
- [Chirp 3:HD Guide](https://cloud.google.com/text-to-speech/docs/chirp3)
- [AUDIO_SYSTEM_README.md](../AUDIO_SYSTEM_README.md)
- [backend/app/services/tts_service.py](app/services/tts_service.py)

## 更新日誌

### 2024-11-04
- ✅ 實作自訂發音功能 (`_apply_custom_pronunciations`)
- ✅ 修復 `PhoneticPronunciation` AttributeError
- ✅ 啟用 Chirp 3:HD (100% rollout)
- ✅ 配置英文語音 (en-US)
- ✅ 更新 .env 和 .env.example

### 未來計劃
- [ ] 添加更多語言支援
- [ ] 實作語音情感控制
- [ ] 添加語音緩存優化
- [ ] 實作 A/B 測試框架
