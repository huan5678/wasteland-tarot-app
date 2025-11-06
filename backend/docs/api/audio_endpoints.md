# Audio API 端點文檔

## 概述

Audio API 提供語音合成功能，支援即時 TTS 合成、故事音檔生成等功能。

**Base URL**: `/api/v1/audio`

---

## 端點列表

### POST /api/v1/audio/synthesize

即時合成語音（用於 AI 動態解讀）

#### 請求

**Content-Type**: `application/json`

**Request Body**:
```json
{
  "text": "要合成的文字",
  "character_key": "pip_boy",
  "audio_type": "ai_response",
  "cache_enabled": true,
  "return_format": "url",
  "custom_pronunciations": [
    {
      "phrase": "Pip-Boy",
      "pronunciation": "pɪp bɔɪ",
      "phonetic_encoding": "PHONETIC_ENCODING_IPA"
    }
  ],
  "voice_controls": {
    "pitch": 5.0,
    "rate": 1.2,
    "volume": 1.0,
    "pauses": [
      {
        "position": 10,
        "duration": "medium"
      }
    ]
  },
  "force_voice_model": "chirp3-hd"
}
```

**參數說明**:

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `text` | string | ✅ | 要合成的文字（1-5000 字元） |
| `character_key` | string | ✅ | 角色識別碼（14 個角色之一） |
| `audio_type` | string | ❌ | 音檔類型（預設: "ai_response"） |
| `cache_enabled` | boolean | ❌ | 是否啟用快取（預設: true） |
| `return_format` | string | ❌ | 回傳格式（"url" 或 "base64"，預設: "url"） |
| `custom_pronunciations` | array | ❌ | 自訂發音列表（僅 Chirp 3:HD） |
| `voice_controls` | object | ❌ | 語音控制參數（僅 Chirp 3:HD） |
| `force_voice_model` | string | ❌ | 強制使用指定模型（"chirp3-hd" 或 "wavenet"） |

#### 回應

**200 OK**:
```json
{
  "url": "https://storage.supabase.co/audio/xxx.mp3",
  "audio_base64": null,
  "duration": 1.5,
  "file_size": 10240,
  "cached": false,
  "source": "new",
  "voice_model": "chirp3-hd",
  "voice_name": "en-US-Chirp3-HD-Regulus",
  "character": {
    "key": "pip_boy",
    "name": "Pip Boy",
    "voice_params": {
      "pitch": 1.0,
      "rate": 1.0,
      "volume": 1.0
    }
  }
}
```

**400 Bad Request**:
```json
{
  "detail": "Invalid character_key: invalid_character"
}
```

**503 Service Unavailable**:
```json
{
  "detail": "TTS service temporarily unavailable"
}
```

#### 範例

**cURL**:
```bash
curl -X POST "http://localhost:8000/api/v1/audio/synthesize" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "歡迎來到廢土塔羅",
    "character_key": "pip_boy",
    "force_voice_model": "chirp3-hd"
  }'
```

**Python**:
```python
import requests

response = requests.post(
    "http://localhost:8000/api/v1/audio/synthesize",
    json={
        "text": "歡迎來到廢土塔羅",
        "character_key": "pip_boy",
        "force_voice_model": "chirp3-hd"
    }
)

data = response.json()
print(f"Audio URL: {data['url']}")
print(f"Voice Model: {data['voice_model']}")
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:8000/api/v1/audio/synthesize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: '歡迎來到廢土塔羅',
    character_key: 'pip_boy',
    force_voice_model: 'chirp3-hd'
  })
});

const data = await response.json();
console.log('Audio URL:', data.url);
```

---

### POST /api/v1/audio/generate/story

生成故事音檔（批量生成）

#### 請求

```json
{
  "card_id": "123e4567-e89b-12d3-a456-426614174000",
  "character_keys": ["brotherhood_scribe", "ncr_ranger"],
  "force_regenerate": false
}
```

#### 回應

```json
{
  "card_id": "123e4567-e89b-12d3-a456-426614174000",
  "audio_urls": {
    "brotherhood_scribe": "https://storage.supabase.co/story/card-001/brotherhood_scribe.mp3",
    "ncr_ranger": "https://storage.supabase.co/story/card-001/ncr_ranger.mp3"
  },
  "cached": {
    "brotherhood_scribe": true,
    "ncr_ranger": false
  },
  "generated_at": "2025-11-04T10:30:00Z"
}
```

---

### GET /api/v1/audio/story/{card_id}

取得故事音檔 URL

#### 路徑參數

- `card_id`: 卡牌 ID (UUID)

#### 回應

```json
{
  "card_id": "123e4567-e89b-12d3-a456-426614174000",
  "audio_urls": {
    "pip_boy": "https://storage.supabase.co/story/card-001/pip_boy.mp3",
    "vault_dweller": "https://storage.supabase.co/story/card-001/vault_dweller.mp3"
  }
}
```

---

## Chirp 3:HD 專屬功能

### 自訂發音

使用 IPA 音標指定自訂發音：

```json
{
  "text": "I read a book",
  "character_key": "pip_boy",
  "custom_pronunciations": [
    {
      "phrase": "read",
      "pronunciation": "rɛd",
      "phonetic_encoding": "PHONETIC_ENCODING_IPA"
    }
  ]
}
```

### 語音控制

調整語音參數：

```json
{
  "text": "這是一個重要的訊息",
  "character_key": "pip_boy",
  "voice_controls": {
    "pitch": 5.0,
    "rate": 1.2,
    "volume": 0.9,
    "pauses": [
      {
        "position": 10,
        "duration": "medium"
      },
      {
        "position": 25,
        "duration": "500ms"
      }
    ]
  }
}
```

### 強制語音模型

覆寫路由邏輯，強制使用指定模型：

```json
{
  "text": "測試文字",
  "character_key": "pip_boy",
  "force_voice_model": "chirp3-hd"
}
```

---

## 錯誤處理

### 常見錯誤碼

| 狀態碼 | 說明 | 解決方法 |
|--------|------|----------|
| 400 | 無效的請求參數 | 檢查參數格式和值 |
| 401 | 未授權 | 提供有效的認證 token |
| 403 | 禁止訪問 | 檢查權限設定 |
| 404 | 資源不存在 | 檢查 card_id 或 URL |
| 500 | 內部錯誤 | 檢查服務日誌 |
| 503 | 服務暫時不可用 | 檢查 TTS 服務狀態 |

### 錯誤回應格式

```json
{
  "detail": "錯誤訊息描述"
}
```

---

## 速率限制

- **標準用戶**: 100 請求/分鐘
- **認證用戶**: 500 請求/分鐘
- **API Key**: 1000 請求/分鐘

---

## 認證

大部分端點需要認證。在請求標頭中包含認證 token：

```
Authorization: Bearer <access_token>
```

---

## 相關文檔

- **TTS 服務文檔**: `../tts_service.md`
- **語音映射說明**: `../chirp3_voice_mapping.md`
- **環境變數配置**: `../CHIRP3_ENV_VARIABLES.md`

---

**最後更新**: 2025-11-04
