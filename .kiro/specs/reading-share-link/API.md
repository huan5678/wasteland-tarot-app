# Reading Share Link - API Documentation

## 概述

分享占卜結果功能讓使用者能夠透過唯讀連結分享他們的塔羅占卜結果，無需收件人登入即可查看。

## API 端點

### 1. 生成分享連結

**端點**: `POST /api/v1/readings/{reading_id}/share`

**描述**: 為指定的占卜生成分享連結。如果已存在分享連結，則返回現有的（冪等性）。

**授權**: 需要 JWT token（只有占卜擁有者可以生成分享連結）

**路徑參數**:
- `reading_id` (UUID, required): 占卜記錄的 ID

**請求範例**:
```http
POST /api/v1/readings/123e4567-e89b-12d3-a456-426614174000/share
Authorization: Bearer <access_token>
```

**成功回應** (200 OK):
```json
{
  "share_token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "share_url": "http://localhost:3000/share/a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "created_at": "2025-01-15T10:30:00Z"
}
```

**錯誤回應**:

- **401 Unauthorized**: 未提供有效的 JWT token
```json
{
  "detail": "Not authenticated"
}
```

- **403 Forbidden**: 使用者不是此占卜的擁有者
```json
{
  "detail": "You don't have permission to share this reading"
}
```

- **404 Not Found**: 占卜不存在
```json
{
  "detail": "Reading not found"
}
```

**冪等性**:
- 對同一個 `reading_id` 多次呼叫此端點，會返回相同的 `share_token`
- `created_at` 不會更新，保持首次創建時間

---

### 2. 取得公開占卜資料

**端點**: `GET /api/v1/share/{share_token}`

**描述**: 透過分享 token 取得公開的占卜資料。此端點無需授權，任何人都可以訪問。

**授權**: 不需要（公開端點）

**路徑參數**:
- `share_token` (UUID, required): 分享連結的 token

**請求範例**:
```http
GET /api/v1/share/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**成功回應** (200 OK):
```json
{
  "reading_id": "123e4567-e89b-12d3-a456-426614174000",
  "question": "我在廢土上的下一步該如何走？",
  "spread_type": "three_card",
  "character_voice": "Nick_Valentine",
  "karma_context": "NEUTRAL",
  "overall_interpretation": "根據卡牌顯示，你目前處於一個轉折點...",
  "summary_message": "保持謹慎，信任你的直覺",
  "prediction_confidence": 0.75,
  "created_at": "2025-01-15T10:00:00Z",
  "card_positions": [
    {
      "position_number": 1,
      "position_name": "過去",
      "position_meaning": "影響你當前處境的過去事件",
      "is_reversed": false,
      "card": {
        "id": "card-uuid-1",
        "name": "The Fool",
        "suit": "major_arcana",
        "number": 0,
        "is_major_arcana": true,
        "upright_meaning": "新的開始，無拘無束的精神",
        "reversed_meaning": "魯莽，缺乏方向",
        "keywords": ["開始", "冒險", "自由"],
        "image_url": "https://example.com/cards/fool.jpg",
        "fallout_easter_egg": "Vault Dweller 剛離開避難所的那一刻"
      }
    }
    // ... more card positions
  ]
}
```

**資料欄位說明**:

| 欄位 | 類型 | 描述 | 隱私 |
|------|------|------|------|
| `reading_id` | UUID | 占卜記錄 ID | 公開 |
| `question` | string | 占卜問題 | 公開 |
| `spread_type` | string | 牌陣類型 | 公開 |
| `character_voice` | string | 角色聲音 | 公開 |
| `karma_context` | string | 業力背景 | 公開 |
| `overall_interpretation` | string | 整體解讀 | 公開 |
| `summary_message` | string | 總結訊息 | 公開 |
| `prediction_confidence` | float | 預測信心度 (0-1) | 公開 |
| `created_at` | ISO 8601 | 創建時間 | 公開 |
| `card_positions` | array | 卡牌位置陣列 | 公開 |

**明確不包含的隱私欄位**:
- ❌ `user_id` - 使用者 ID
- ❌ `user_email` - 使用者 email
- ❌ `user_name` - 使用者名稱
- ❌ `user` - 使用者關聯物件
- ❌ `updated_at` - 更新時間（可能洩漏使用行為）
- ❌ `ip_address` - IP 位址
- ❌ `session_id` - Session ID

**錯誤回應**:

- **404 Not Found**: 分享 token 不存在或已失效
```json
{
  "detail": "Shared reading not found"
}
```

- **422 Unprocessable Entity**: 無效的 UUID 格式
```json
{
  "detail": [
    {
      "loc": ["path", "share_token"],
      "msg": "value is not a valid uuid",
      "type": "type_error.uuid"
    }
  ]
}
```

---

## 資料模型

### ShareLinkResponse

生成分享連結的回應格式。

```typescript
interface ShareLinkResponse {
  share_token: string;    // UUID v4 格式
  share_url: string;      // 完整的分享 URL
  created_at: string;     // ISO 8601 格式
}
```

**驗證規則**:
- `share_token`: 必須是有效的 UUID v4
- `share_url`: 必須是有效的 URL
- `created_at`: 必須是 ISO 8601 格式

### PublicReadingData

公開分享的占卜資料格式。

```typescript
interface PublicReadingData {
  reading_id: string;
  question: string;
  spread_type: string;
  character_voice?: string;
  karma_context?: string;
  overall_interpretation?: string;
  summary_message?: string;
  prediction_confidence?: number;
  created_at: string;
  card_positions: CardPosition[];
}

interface CardPosition {
  position_number: number;
  position_name: string;
  position_meaning: string;
  is_reversed: boolean;
  card: Card;
}

interface Card {
  id: string;
  name: string;
  suit: string;
  number: number;
  is_major_arcana: boolean;
  upright_meaning: string;
  reversed_meaning: string;
  keywords: string[];
  image_url?: string;
  fallout_easter_egg?: string;
}
```

---

## 安全性

### 授權

- **生成分享連結** (`POST /readings/{id}/share`): 需要 JWT token
  - 驗證使用者是占卜的擁有者
  - 非擁有者會收到 403 Forbidden

- **查看分享資料** (`GET /share/{token}`): 無需授權
  - 公開端點，任何人都可以訪問
  - 只要有 token 就可以查看

### 隱私保護

**資料過濾機制**:

後端在 `ShareService._filter_private_fields()` 方法中明確過濾以下欄位：

```python
def _filter_private_fields(self, reading) -> Dict:
    return {
        "reading_id": str(reading.id),
        "question": reading.question,
        # ... 只包含公開欄位
        # 明確不包含: user_id, user (relationship)
    }
```

**保證**:
- ✅ 絕不洩漏 `user_id`, `user_email`, `user_name`
- ✅ 絕不包含 relationship 物件（如 `user`）
- ✅ 所有回應都經過明確的欄位白名單過濾

### 輸入驗證

**UUID 驗證**:
- 所有 UUID 參數都使用 Pydantic 的 `UUID` 型別驗證
- 無效的 UUID 會返回 422 Unprocessable Entity
- 防止 SQL injection 和路徑遍歷攻擊

**範例**:
```python
@router.get("/share/{share_token}")
async def get_shared_reading(
    share_token: UUID,  # Pydantic 自動驗證
    db: AsyncSession = Depends(get_db)
):
    ...
```

### SQL Injection 防護

- 所有資料庫查詢使用 SQLAlchemy ORM
- 參數化查詢，絕不拼接字串
- UUID 型別驗證提供額外保護層

**範例**:
```python
# ✅ 安全: 使用 ORM 和參數化查詢
result = await db.execute(
    select(CompletedReading).where(
        CompletedReading.share_token == share_token
    )
)

# ❌ 危險: 絕不這樣做
# query = f"SELECT * FROM readings WHERE share_token = '{share_token}'"
```

### XSS 防護

- 後端原樣儲存資料（不執行任何腳本）
- 前端使用 React 自動轉義 HTML
- 建議設置 Content-Security-Policy header

---

## 使用範例

### 前端 TypeScript 範例

```typescript
import { shareAPI } from '@/lib/api/share';

// 1. 生成分享連結
async function generateShareLink(readingId: string) {
  try {
    const response = await shareAPI.generateShareLink(readingId);
    console.log('Share URL:', response.share_url);
    return response;
  } catch (error) {
    console.error('Failed to generate share link:', error);
    throw error;
  }
}

// 2. 取得分享資料
async function getSharedReading(shareToken: string) {
  try {
    const data = await shareAPI.getSharedReading(shareToken);
    console.log('Reading:', data.question);
    return data;
  } catch (error) {
    console.error('Failed to fetch shared reading:', error);
    throw error;
  }
}

// 3. 使用範例
const readingId = '123e4567-e89b-12d3-a456-426614174000';
const shareData = await generateShareLink(readingId);

// 複製到剪貼簿
await navigator.clipboard.writeText(shareData.share_url);

// 在新視窗開啟
window.open(shareData.share_url, '_blank');
```

### cURL 範例

```bash
# 1. 生成分享連結 (需要 JWT token)
curl -X POST \
  'http://localhost:8000/api/v1/readings/123e4567-e89b-12d3-a456-426614174000/share' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json'

# 2. 取得公開占卜資料 (無需授權)
curl -X GET \
  'http://localhost:8000/api/v1/share/a1b2c3d4-e5f6-7890-abcd-ef1234567890'
```

### Python 範例

```python
import requests

# 1. 生成分享連結
def generate_share_link(reading_id: str, access_token: str):
    url = f'http://localhost:8000/api/v1/readings/{reading_id}/share'
    headers = {'Authorization': f'Bearer {access_token}'}

    response = requests.post(url, headers=headers)
    response.raise_for_status()

    return response.json()

# 2. 取得分享資料
def get_shared_reading(share_token: str):
    url = f'http://localhost:8000/api/v1/share/{share_token}'

    response = requests.get(url)
    response.raise_for_status()

    return response.json()

# 使用範例
reading_id = '123e4567-e89b-12d3-a456-426614174000'
access_token = 'YOUR_ACCESS_TOKEN'

share_data = generate_share_link(reading_id, access_token)
print(f"Share URL: {share_data['share_url']}")

# 取得公開資料
shared_reading = get_shared_reading(share_data['share_token'])
print(f"Question: {shared_reading['question']}")
```

---

## 錯誤處理

### 常見錯誤碼

| 狀態碼 | 情境 | 處理建議 |
|--------|------|----------|
| 200 | 成功 | 正常處理回應資料 |
| 401 | 未授權 | 引導使用者登入 |
| 403 | 無權限 | 提示使用者只能分享自己的占卜 |
| 404 | 找不到 | 提示分享連結不存在或已失效 |
| 422 | 驗證錯誤 | 檢查 UUID 格式是否正確 |
| 500 | 伺服器錯誤 | 記錄錯誤並提示使用者稍後再試 |

### 前端錯誤處理範例

```typescript
try {
  const data = await shareAPI.getSharedReading(shareToken);
  // 處理成功
} catch (error: any) {
  switch (error.status) {
    case 404:
      showError('此分享連結不存在或已失效');
      break;
    case 422:
      showError('無效的分享連結格式');
      break;
    default:
      showError('無法載入分享的占卜結果');
  }
}
```

---

## 限制與最佳實踐

### 限制

- ❌ 無法撤銷分享連結（除非刪除整個占卜）
- ❌ 無法設定過期時間
- ❌ 無法追蹤誰查看了分享連結
- ⚠️ 分享連結永久有效（直到占卜被刪除）

### 最佳實踐

**後端**:
1. ✅ 使用 UUID v4 確保 token 不可預測
2. ✅ 在資料庫層面加上 UNIQUE constraint
3. ✅ 使用 ORM 防止 SQL injection
4. ✅ 明確的欄位白名單過濾
5. ✅ 完整的錯誤處理和記錄

**前端**:
1. ✅ 使用 Zod 驗證 API 回應
2. ✅ 提供一鍵複製功能
3. ✅ 顯示複製成功提示
4. ✅ 完整的錯誤狀態處理
5. ✅ 無障礙設計（ARIA 標籤）

**安全**:
1. ✅ 永不在前端處理敏感資料
2. ✅ 使用 HTTPS 傳輸
3. ✅ 設定 CSP header（建議）
4. ✅ 實施 rate limiting（建議）

---

## 變更日誌

### v1.0.0 (2025-01-15)
- 初始發布
- 實作分享連結生成 API
- 實作公開占卜資料 API
- 完整的隱私過濾機制
- E2E 和安全測試

---

## 相關文件

- [需求文件](./requirements.md)
- [設計文件](./design.md)
- [任務清單](./tasks.md)
- [測試文件](../../tests/e2e/reading-share.spec.ts)
- [安全測試](../../tests/e2e/reading-share-security.spec.ts)
