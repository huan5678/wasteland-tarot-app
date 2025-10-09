# API 文檔 - 廢土塔羅系統

## 概述

本文檔描述了廢土塔羅解讀平台的 RESTful API 設計，包含 Fallout 主題的 78 張卡牌系統、Karma 系統、派系對齊、角色解讀風格、夥伴見解等完整功能。

## 基礎信息

- **基礎 URL**: `https://api.wasteland-tarot.com/v1`
- **協議**: HTTPS
- **認證**: JWT Bearer Token
- **內容類型**: application/json
- **字符編碼**: UTF-8

## 認證

所有 API 請求（除了公開端點）都需要在 HTTP Header 中包含 JWT token：

```
Authorization: Bearer <jwt_token>
```

### 獲取 Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

響應：
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "profile": {...}
  }
}
```

## 用戶管理 API

### 1. 用戶註冊

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "confirm_password": "password123",
  "profile": {
    "display_name": "塔羅愛好者",
    "birth_date": "1990-01-01",
    "zodiac_sign": "摩羯座"
  }
}
```

響應：
```json
{
  "success": true,
  "message": "註冊成功，請檢查郵件進行驗證",
  "user_id": "uuid"
}
```

### 2. 用戶登入

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 3. 重設密碼

```http
POST /auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 4. 獲取用戶資料

```http
GET /users/profile
Authorization: Bearer <token>
```

響應：
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "profile": {
    "display_name": "塔羅愛好者",
    "birth_date": "1990-01-01",
    "zodiac_sign": "摩羯座",
    "avatar_url": "https://...",
    "level": 5,
    "experience": 1250,
    "streak_days": 7,
    "total_readings": 42
  },
  "preferences": {
    "language": "zh-TW",
    "theme": "light",
    "notifications": {
      "daily_reminder": true,
      "weekly_summary": true
    }
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T12:00:00Z"
}
```

### 5. 更新用戶資料

```http
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "profile": {
    "display_name": "新名稱",
    "avatar_url": "https://new-avatar.jpg"
  },
  "preferences": {
    "theme": "dark"
  }
}
```

## 廢土塔羅牌 API

### 1. 獲取廢土牌組信息

```http
GET /wasteland/decks
```

響應：
```json
{
  "decks": [
    {
      "id": "wasteland-tarot-deck",
      "name": "廢土塔羅牌組",
      "fallout_name": "Wasteland Tarot Deck",
      "description": "後末日生存指南塔羅牌",
      "total_cards": 78,
      "major_arcana": 22,
      "minor_arcana": 56,
      "suits": {
        "nuka_cola_bottles": {
          "name": "可樂瓶",
          "original_suit": "聖杯",
          "element": "水",
          "represents": "情感、關係、輻射治療、社群連結"
        },
        "combat_weapons": {
          "name": "戰鬥武器",
          "original_suit": "寶劍",
          "element": "風",
          "represents": "衝突、策略、決策、生存智慧"
        },
        "bottle_caps": {
          "name": "瓶蓋",
          "original_suit": "錢幣",
          "element": "土",
          "represents": "資源、交易、生存物資、實用主義"
        },
        "radiation_rods": {
          "name": "輻射棒",
          "original_suit": "權杖",
          "element": "火",
          "represents": "能量、創造力、變異、行動力"
        }
      },
      "art_style": "80年代像素藝術風格",
      "theme": "後末日復古未來主義",
      "image_url": "https://wasteland-cards.com/deck-cover.jpg",
      "is_default": true
    }
  ]
}
```

### 2. 獲取特定廢土牌卡信息

```http
GET /wasteland/cards/{card_id}
```

響應：
```json
{
  "id": "vault-newbie",
  "name": "新手避難所居民",
  "name_en": "The Vault Newbie",
  "fallout_name": "新手避難所居民 (The Vault Newbie)",
  "original_name": "愚者",
  "number": 0,
  "suit": "major_arcana",
  "description": "剛走出避難所的居民，對廢土充滿天真幻想",
  "fallout_description": "一個剛走出避難所的居民，戴著派對帽用Pip-Boy自拍，背景是輻射廢土",
  "humor_twist": "戴著派對帽用Pip-Boy自拍，背景是輻射廢土",
  "keywords": {
    "upright": ["天真", "新開始", "無知即福", "適應能力"],
    "reversed": ["魯莽", "危險忽視", "不切實際", "生存危機"]
  },
  "fallout_keywords": {
    "upright": ["避難所新鮮人", "廢土探索", "樂觀態度", "學習適應"],
    "reversed": ["輻射中毒", "敵意忽視", "資源浪費", "生存技能不足"]
  },
  "imagery": {
    "main_symbols": ["Pip-Boy", "避難所制服", "派對帽", "輻射警告標誌"],
    "colors": ["藍色制服", "綠色顯示器", "黃色輻射標誌"],
    "description": "一個穿著藍色避難所制服的年輕人，手持Pip-Boy，背景是破敗的廢土景象"
  },
  "fallout_imagery": {
    "wasteland_symbols": ["破敗建築", "輻射符號", "變異植物", "廢棄車輛"],
    "vault_elements": ["Vault-Tec標誌", "避難所門", "科技設備"],
    "humor_elements": ["自拍姿勢", "過度樂觀表情", "忽視危險"]
  },
  "interpretations": {
    "general": "新手避難所居民代表對廢土生活的天真開始...",
    "survival": "在生存方面，這張牌提醒你保持學習心態...",
    "resources": "資源管理需要從基礎開始學習...",
    "relationships": "在廢土人際關係中，真誠但需要謹慎...",
    "exploration": "探索新區域時保持好奇心但要注意安全...",
    "rebuilding": "重建過程需要從簡單的任務開始..."
  },
  "radiation_level": 0.1,
  "survival_category": "社交與適應",
  "wasteland_elements": ["避難所科技", "社交互動", "學習成長", "環境適應"],
  "image_urls": {
    "front": "https://wasteland-cards.com/vault-newbie-front.jpg",
    "back": "https://wasteland-cards.com/vault-tec-back.jpg",
    "pixel_art": "https://wasteland-cards.com/vault-newbie-pixel.jpg"
  },
  "audio_cues": {
    "reveal": "vault-door-opening.mp3",
    "selection": "pip-boy-beep.mp3",
    "interpretation": "vault-dweller-voice.mp3"
  }
}
```

### 3. 廢土抽牌

```http
POST /wasteland/draw
Authorization: Bearer <token>
Content-Type: application/json

{
  "spread_type": "single_card_reading",
  "question": "我應該探索這個廢墟嗎？",
  "question_category": "exploration_adventures",
  "context": {
    "focus_area": "survival",
    "mood": "cautious",
    "specific_concern": "資源獲取",
    "survival_priority": "safety_first"
  },
  "character_voice": "pip_boy_analysis",
  "shuffle_algorithm": "wasteland_fisher_yates",
  "radiation_influence": true
}
```

響應：
```json
{
  "reading_id": "uuid",
  "spread_type": "single_card_reading",
  "question": "我應該探索這個廢墟嗎？",
  "cards": [
    {
      "position": 1,
      "card": {
        "id": "vault-newbie",
        "name": "新手避難所居民",
        "fallout_name": "新手避難所居民 (The Vault Newbie)",
        "number": 0,
        "suit": "major_arcana"
      },
      "orientation": "upright",
      "position_meaning": "當前廢土指引",
      "radiation_influence": 0.1,
      "pip_boy_scan": {
        "threat_level": "低",
        "resource_potential": "中",
        "radiation_reading": "安全範圍"
      }
    }
  ],
  "shuffle_data": {
    "algorithm_used": "wasteland_fisher_yates",
    "radiation_randomness": 0.15,
    "geiger_counter_seed": "click-click-beep-789",
    "shuffle_iterations": 78
  },
  "audio_cues": {
    "shuffle_sound": "geiger-counter-shuffle.mp3",
    "card_reveal": "vault-door-opening.mp3",
    "ambient": "wasteland-wind.mp3"
  },
  "created_at": "2024-01-15T12:00:00Z",
  "status": "pending_interpretation"
}
```

### 4. 獲取廢土 AI 解讀

```http
POST /wasteland/interpret
Authorization: Bearer <token>
Content-Type: application/json

{
  "reading_id": "uuid",
  "character_voice": "pip_boy_analysis",
  "include_companion_insights": true,
  "humor_level": "medium"
}
```

響應：
```json
{
  "reading_id": "uuid",
  "interpretation": {
    "overall_message": "Pip-Boy 分析顯示：新手避難所居民牌在廢土探索情境中帶來正面訊號。根據廢土生存手冊第127條，保持學習心態是成功探索的關鍵。雖然你可能還不熟悉所有廢土危險，但這份天真和好奇心將成為你的優勢...",
    "character_voice_style": {
      "voice": "pip_boy_analysis",
      "personality": "系統化分析，綠色單色螢幕風格數據呈現",
      "delivery": "像Pip-Boy介面一樣系統化分析卡牌資訊"
    },
    "card_meanings": [
      {
        "card_id": "vault-newbie",
        "position": 1,
        "fallout_meaning": "新手避難所居民牌代表學習和適應的開始。在廢土中，每個人都曾經是新手，重要的是保持開放的心態和學習的意願。",
        "survival_advice": "探索新區域時準備基本補給，帶上輻射感測器，並與經驗豐富的廢土居民建立聯繫。",
        "pip_boy_analysis": {
          "threat_assessment": "低風險 - 適合新手探索",
          "resource_evaluation": "中等收益潛力",
          "radiation_scan": "環境輻射在安全範圍內",
          "success_probability": "75%",
          "recommended_action": "進行探索，但保持謹慎"
        },
        "keywords": ["學習適應", "新手友善", "探索機會", "安全範圍"]
      }
    ],
    "wasteland_advice": [
      "根據廢土生存手冊：先檢查輻射等級",
      "Pip-Boy建議：與當地商人交換資訊",
      "避難所科技分析顯示：適合初級探索者",
      "廢土智慧告訴我們：天真有時是最好的防護"
    ],
    "humor_elements": [
      {
        "type": "vault_boy_reaction",
        "description": "Vault Boy 豎起大拇指，表示樂觀支持",
        "context": "對於新手探索的鼓勵"
      },
      {
        "type": "wasteland_meme",
        "description": "另一個需要你幫助的廢墟",
        "context": "常見的探索情況"
      }
    ],
    "karma_influence": {
      "current_karma": "neutral",
      "interpretation_bias": "平衡客觀的分析",
      "karma_advice": "探索時選擇幫助其他廢土居民，可以提升 karma 等級"
    },
    "faction_perspective": {
      "primary_faction": "vault_dweller",
      "interpretation_style": "天真但充滿希望的視角",
      "faction_advice": "作為避難所居民，你的科技知識可能在探索中很有用"
    },
    "survival_elements": {
      "radiation_exposure": "最小",
      "caps_potential": "25-50 瓶蓋",
      "experience_gain": "新手經驗 +15",
      "survival_tips": ["攜帶 RadAway", "準備基本武器", "帶上足夠的水"]
    },
    "lucky_elements": {
      "color": "Pip-Boy綠",
      "number": 0,
      "direction": "避難所門方向",
      "time": "清晨（輻射較低）",
      "lucky_item": "Vault-Tec 工具包"
    }
  },
  "companion_insights": [
    {
      "companion": "dogmeat",
      "insight": "汪汪！（Dogmeat 表示這個區域聞起來安全，沒有敵對氣味）",
      "relevance": 0.8,
      "personality_style": "忠誠可靠的簡單建議"
    },
    {
      "companion": "nick_valentine",
      "insight": "根據我的偵探經驗，新手的直覺往往比老手的偏見更準確。相信你的判斷，但別忘了基本防護。",
      "relevance": 0.9,
      "personality_style": "偵探式的邏輯推理"
    }
  ],
  "special_events": {
    "active_event": null,
    "weather_condition": "晴朗",
    "radiation_storm_risk": "低",
    "faction_activity": "平靜"
  },
  "audio_cues": {
    "interpretation_voice": "pip-boy-narrator.mp3",
    "background_ambient": "vault-machinery-hum.mp3",
    "notification_sounds": ["pip-boy-beep.mp3", "success-chime.mp3"]
  },
  "ai_confidence": 0.92,
  "generated_at": "2024-01-15T12:01:30Z",
  "status": "completed"
}
```

## 解讀歷史 API

### 1. 獲取解讀歷史

```http
GET /readings?page=1&limit=20&category=all&start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <token>
```

響應：
```json
{
  "readings": [
    {
      "id": "uuid",
      "question": "今天對我的建議是什麼？",
      "spread_type": "single_card",
      "cards_count": 1,
      "category": "daily_guidance",
      "status": "completed",
      "created_at": "2024-01-15T12:00:00Z",
      "has_interpretation": true,
      "tags": ["日常指導", "工作"],
      "mood_rating": 4
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  },
  "summary": {
    "total_readings": 156,
    "this_month": 23,
    "avg_mood_rating": 3.8,
    "most_common_category": "daily_guidance"
  }
}
```

### 2. 獲取特定解讀詳情

```http
GET /readings/{reading_id}
Authorization: Bearer <token>
```

### 3. 更新解讀標記

```http
PUT /readings/{reading_id}/metadata
Authorization: Bearer <token>
Content-Type: application/json

{
  "tags": ["日常指導", "工作", "重要"],
  "mood_rating": 5,
  "notes": "這次解讀很有幫助，提醒我要保持積極"
}
```

### 4. 刪除解讀

```http
DELETE /readings/{reading_id}
Authorization: Bearer <token>
```

## 牌陣 API

### 1. 獲取可用牌陣

```http
GET /spreads
```

響應：
```json
{
  "spreads": [
    {
      "id": "single_card",
      "name": "單牌解讀",
      "description": "適合日常指導和簡單問題",
      "cards_count": 1,
      "difficulty": "beginner",
      "estimated_time": "5分鐘",
      "positions": [
        {
          "position": 1,
          "name": "指導牌",
          "description": "針對你的問題給出建議"
        }
      ],
      "suitable_for": ["日常指導", "是非問題", "當下狀況"]
    },
    {
      "id": "three_card",
      "name": "過去現在未來",
      "description": "了解事情的發展脈絡",
      "cards_count": 3,
      "difficulty": "intermediate",
      "estimated_time": "15分鐘",
      "positions": [
        {
          "position": 1,
          "name": "過去",
          "description": "影響當前狀況的過去因素"
        },
        {
          "position": 2,
          "name": "現在",
          "description": "當前的狀況和挑戰"
        },
        {
          "position": 3,
          "name": "未來",
          "description": "可能的發展方向"
        }
      ],
      "suitable_for": ["關係發展", "職涯規劃", "重要決策"]
    }
  ]
}
```

## 統計 API

### 1. 獲取用戶統計

```http
GET /users/stats
Authorization: Bearer <token>
```

響應：
```json
{
  "overview": {
    "total_readings": 156,
    "total_days": 45,
    "current_streak": 7,
    "longest_streak": 12,
    "level": 5,
    "experience": 1250,
    "next_level_exp": 1500
  },
  "this_month": {
    "readings_count": 23,
    "most_drawn_card": {
      "id": "the-sun",
      "name": "太陽",
      "count": 3
    },
    "favorite_spread": "single_card",
    "avg_mood_rating": 3.8
  },
  "achievements": [
    {
      "id": "first_reading",
      "name": "初次解讀",
      "description": "完成第一次塔羅牌解讀",
      "earned_at": "2024-01-01T10:00:00Z",
      "rarity": "common"
    },
    {
      "id": "week_streak",
      "name": "一週連續",
      "description": "連續一週進行解讀",
      "earned_at": "2024-01-15T12:00:00Z",
      "rarity": "uncommon"
    }
  ],
  "cards_frequency": {
    "major_arcana": {
      "the-fool": 5,
      "the-magician": 3,
      "the-sun": 8
    },
    "minor_arcana": {
      "ace-of-cups": 2,
      "two-of-pentacles": 4
    }
  }
}
```

### 2. 獲取全域統計

```http
GET /stats/global
```

響應：
```json
{
  "platform_stats": {
    "total_users": 10543,
    "total_readings": 89234,
    "total_cards_drawn": 156890,
    "active_users_today": 234
  },
  "popular_content": {
    "most_drawn_cards": [
      {
        "card_id": "the-sun",
        "name": "太陽",
        "draw_count": 1234
      }
    ],
    "popular_spreads": [
      {
        "spread_id": "single_card",
        "name": "單牌解讀",
        "usage_count": 45678
      }
    ],
    "common_questions": [
      "今天對我的建議是什麼？",
      "我的愛情運勢如何？",
      "工作上有什麼需要注意的？"
    ]
  }
}
```

## 社群 API

### 1. 分享解讀

```http
POST /community/share
Authorization: Bearer <token>
Content-Type: application/json

{
  "reading_id": "uuid",
  "title": "今天的太陽牌給我很大鼓勵",
  "content": "想和大家分享今天抽到的太陽牌...",
  "tags": ["日常分享", "正面能量"],
  "visibility": "public",
  "allow_comments": true
}
```

### 2. 獲取社群動態

```http
GET /community/feed?page=1&limit=20&category=all
Authorization: Bearer <token>
```

### 3. 評論和互動

```http
POST /community/posts/{post_id}/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "很有共鳴！我昨天也抽到太陽牌",
  "parent_comment_id": null
}
```

## 通知 API

### 1. 獲取通知

```http
GET /notifications?page=1&limit=20&status=unread
Authorization: Bearer <token>
```

### 2. 標記已讀

```http
PUT /notifications/{notification_id}/read
Authorization: Bearer <token>
```

### 3. 通知設定

```http
PUT /users/notification-settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "daily_reminder": {
    "enabled": true,
    "time": "09:00",
    "timezone": "Asia/Taipei"
  },
  "weekly_summary": {
    "enabled": true,
    "day": "sunday",
    "time": "10:00"
  },
  "community_interactions": {
    "enabled": true,
    "types": ["comments", "likes"]
  }
}
```

## 錯誤處理

### HTTP 狀態碼

- `200` - 成功
- `201` - 創建成功
- `400` - 請求錯誤
- `401` - 未授權
- `403` - 禁止訪問
- `404` - 資源不存在
- `422` - 驗證錯誤
- `429` - 請求過於頻繁
- `500` - 服務器錯誤

### 錯誤響應格式

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "請求數據驗證失敗",
    "details": [
      {
        "field": "email",
        "message": "請提供有效的電子郵件地址"
      }
    ],
    "request_id": "uuid",
    "timestamp": "2024-01-15T12:00:00Z"
  }
}
```

### 常見錯誤碼

- `INVALID_TOKEN` - Token 無效或已過期
- `VALIDATION_ERROR` - 請求數據驗證失敗
- `USER_NOT_FOUND` - 用戶不存在
- `READING_NOT_FOUND` - 解讀記錄不存在
- `RATE_LIMIT_EXCEEDED` - 請求頻率超過限制
- `AI_SERVICE_ERROR` - AI 服務暫時不可用
- `INSUFFICIENT_PERMISSIONS` - 權限不足

## 限制和配額

### API 調用限制

- 一般用戶：每分鐘 60 次請求
- 高級用戶：每分鐘 120 次請求
- 每日解讀次數：免費用戶 3 次，高級用戶無限制

### 數據限制

- 問題內容：最多 500 字符
- 用戶筆記：最多 1000 字符
- 標籤：每個解讀最多 5 個標籤
- 頭像檔案：最大 5MB

## 版本控制

API 採用語義化版本控制：

- `v1.0.0` - 初始版本
- `v1.1.0` - 新增社群功能
- `v1.2.0` - 新增統計和成就系統

### 向後兼容性

- 新增欄位不會影響現有集成
- 重大變更會提前 30 天通知
- 舊版本 API 會維護至少 6 個月

## SDK 和工具

### 官方 SDK

- JavaScript/TypeScript: `@tarot-app/sdk-js`
- Python: `tarot-app-sdk`
- React Hooks: `@tarot-app/react-hooks`

### 測試工具

- Postman Collection: [下載連結]
- OpenAPI Specification: [下載連結]
- Swagger UI: https://api.tarot-app.com/docs

## 支援

### 技術支援

- 文檔：https://docs.tarot-app.com
- GitHub：https://github.com/tarot-app/api
- 電子郵件：api-support@tarot-app.com

### 社群

- Discord：https://discord.gg/tarot-app
- 論壇：https://community.tarot-app.com
- Stack Overflow：使用 `tarot-app-api` 標籤

## Karma 系統 API

### 1. 獲取用戶 Karma 狀態

```http
GET /karma/profile
Authorization: Bearer <token>
```

響應：
```json
{
  "karma_level": "neutral",
  "karma_points": 0,
  "interpretation_bias": {
    "optimism": 0.0,
    "realism": 0.0,
    "pragmatism": 0.0
  },
  "statistics": {
    "total_good_actions": 0,
    "total_neutral_actions": 5,
    "total_evil_actions": 0
  },
  "recent_changes": [
    {
      "action": "helped_settler",
      "points": 10,
      "timestamp": "2024-01-15T10:00:00Z",
      "reason": "協助廢土居民重建家園"
    }
  ]
}
```

### 2. 更新 Karma 等級

```http
POST /karma/update
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "saved_settlement",
  "karma_change": 25,
  "reason": "拯救了被攻擊的聚落",
  "context": {
    "location": "Sanctuary Hills",
    "faction_involved": "Minutemen"
  }
}
```

## 派系對齊系統 API

### 1. 獲取派系親和度

```http
GET /factions/alignment
Authorization: Bearer <token>
```

響應：
```json
{
  "primary_faction": "vault_dweller",
  "affinities": {
    "brotherhood_affinity": 50,
    "ncr_affinity": 50,
    "caesar_legion_affinity": 50,
    "raiders_affinity": 50,
    "vault_dweller_affinity": 75
  },
  "interpretation_style": {
    "analysis_approach": "scientific_method",
    "decision_making": "data_driven",
    "risk_assessment": "cautious_optimism"
  },
  "faction_history": [
    {
      "faction": "brotherhood_of_steel",
      "action": "shared_technology",
      "reputation_change": 10,
      "timestamp": "2024-01-15T09:00:00Z"
    }
  ]
}
```

### 2. 更新派系關係

```http
POST /factions/update
Authorization: Bearer <token>
Content-Type: application/json

{
  "faction": "brotherhood_of_steel",
  "action": "completed_mission",
  "reputation_change": 15,
  "context": {
    "mission_type": "technology_recovery",
    "success_level": "perfect"
  }
}
```

## 角色聲音系統 API

### 1. 獲取可用角色聲音

```http
GET /character-voices
```

響應：
```json
{
  "voices": [
    {
      "id": "pip_boy_analysis",
      "name": "Pip-Boy數據分析法",
      "description": "像Pip-Boy介面一樣系統化分析卡牌資訊",
      "personality": "系統化、數據導向、科技風格",
      "display_style": "綠色單色螢幕風格數據呈現",
      "example_phrases": [
        "掃描卡牌基本數據...",
        "分析元素屬性中...",
        "評估威脅等級...",
        "計算成功機率..."
      ]
    },
    {
      "id": "vault_dweller_perspective",
      "name": "避難所居民視角法",
      "description": "從剛走出避難所的天真視角解讀廢土現實",
      "personality": "天真、樂觀、好奇、科學導向",
      "humor_elements": [
        "用戰前常識理解戰後情況",
        "對危險事物的不當樂觀",
        "把輻射當作新鮮事物"
      ]
    },
    {
      "id": "wasteland_trader_wisdom",
      "name": "廢土商人智慧法",
      "description": "用精明商人的實用主義解讀卡牌",
      "personality": "狡猾但可靠的商人語調",
      "focus_areas": [
        "資源價值評估",
        "風險收益分析",
        "交易機會識別",
        "市場趨勢預測"
      ]
    },
    {
      "id": "super_mutant_simplicity",
      "name": "超級變種人簡化法",
      "description": "用直接粗暴但意外精準的方式解讀",
      "personality": "直接、簡單、邏輯清晰",
      "characteristics": [
        "語言簡單直接",
        "邏輯出奇清晰",
        "忽略複雜細節",
        "專注核心問題"
      ]
    }
  ]
}
```

### 2. 設定用戶偏好角色聲音

```http
PUT /character-voices/preference
Authorization: Bearer <token>
Content-Type: application/json

{
  "preferred_voice": "pip_boy_analysis",
  "adaptive_voice": true,
  "complexity_preference": "medium",
  "humor_level": "medium"
}
```

## 夥伴見解系統 API

### 1. 獲取可用夥伴

```http
GET /companions
```

響應：
```json
{
  "companions": [
    {
      "id": "dogmeat",
      "name": "Dogmeat",
      "personality": {
        "loyalty": 1.0,
        "intelligence": 0.6,
        "humor": 0.3
      },
      "interaction_style": "supportive",
      "specialties": ["忠誠支持", "簡單建議", "情感安慰"],
      "typical_insights": [
        "汪汪！（表示支持和鼓勵）",
        "（Dogmeat 嗅聞並指向某個方向）",
        "（搖尾巴表示贊同）"
      ]
    },
    {
      "id": "nick_valentine",
      "name": "Nick Valentine",
      "personality": {
        "loyalty": 0.9,
        "intelligence": 0.95,
        "humor": 0.7
      },
      "interaction_style": "analytical",
      "specialties": ["偵探推理", "邏輯分析", "人性洞察"],
      "typical_insights": [
        "根據我的偵探經驗...",
        "這種模式我見過...",
        "線索指向..."
      ]
    }
  ]
}
```

## 廢土牌陣 API

### 1. 獲取可用廢土牌陣

```http
GET /wasteland/spreads
```

響應：
```json
{
  "spreads": [
    {
      "id": "single_card_reading",
      "name": "單張廢土指引",
      "fallout_name": "單張廢土指引 (Single Wasteland Reading)",
      "description": "用一張卡牌指引今日的廢土生存策略",
      "cards_count": 1,
      "difficulty": "beginner",
      "estimated_time": "5分鐘",
      "use_cases": [
        "今日廢土運勢",
        "生存決策指引",
        "資源搜尋建議",
        "危險評估"
      ],
      "pip_boy_interface": true
    },
    {
      "id": "vault_tech_spread",
      "name": "避難所科技三牌陣",
      "fallout_name": "避難所科技三牌陣 (Vault-Tec Spread)",
      "description": "分析從戰前到重建的完整時間線",
      "cards_count": 3,
      "difficulty": "intermediate",
      "estimated_time": "15分鐘",
      "positions": [
        {
          "position": 1,
          "name": "戰前狀況",
          "fallout_name": "戰前狀況 (Pre-War)",
          "description": "影響當前情況的歷史因素"
        },
        {
          "position": 2,
          "name": "當前廢土",
          "fallout_name": "當前廢土 (Current Wasteland)",
          "description": "現在面臨的廢土挑戰"
        },
        {
          "position": 3,
          "name": "重建希望",
          "fallout_name": "重建希望 (Rebuilding Hope)",
          "description": "未來重建的可能性"
        }
      ],
      "interpretation_style": "用Vault-Tec風格的樂觀語調解讀嚴酷現實"
    }
  ]
}
```