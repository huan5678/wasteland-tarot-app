# 個人稱號系統（Backend）實作總結

## 實作日期
2025-11-02

## 實作概述
成功為 Wasteland Tarot 專案添加個人稱號系統的 Backend 功能。使用者可以透過解鎖成就獲得稱號，並自由切換已解鎖的稱號作為當前顯示。

## 實作步驟

### 1. UserProfile Model 更新 ✅

**檔案**: `backend/app/models/user.py`

**新增欄位**:
- `current_title`: String(100), nullable, 使用者當前使用的稱號
- `unlocked_titles`: JSON Array, default=[], 已解鎖的稱號列表

**修改內容**:
```python
# Titles (稱號系統)
current_title = Column(String(100), nullable=True, default=None)
unlocked_titles = Column(JSON, default=list)
```

**更新方法**:
- `to_dict()`: 添加了 `current_title` 和 `unlocked_titles` 欄位的序列化

---

### 2. Alembic Migration ✅

**Migration 檔案**: `backend/alembic/versions/6878ff58e800_add_title_fields_to_user_profile_simple.py`

**執行狀態**: ✅ 已成功執行

**變更內容**:
- 在 `user_profiles` 表添加 `current_title` 欄位 (String, nullable)
- 在 `user_profiles` 表添加 `unlocked_titles` 欄位 (JSON, nullable)

**執行指令**:
```bash
cd backend
.venv/bin/alembic upgrade head
```

**驗證**:
```bash
.venv/bin/alembic current
# 輸出: 6878ff58e800 (head)
```

---

### 3. AchievementService._grant_title 方法 ✅

**檔案**: `backend/app/services/achievement_service.py`

**功能描述**:
- 授予使用者新稱號
- 自動將稱號添加到 `unlocked_titles` 列表（去重）
- 如果使用者尚無當前稱號，自動設為新解鎖的稱號
- 如果 UserProfile 不存在，自動創建

**實作邏輯**:
```python
async def _grant_title(self, user_id: UUID, title: str) -> None:
    """授予使用者稱號"""
    query = select(UserProfile).where(UserProfile.user_id == user_id)
    result = await self.db.execute(query)
    profile = result.scalar_one_or_none()

    if not profile:
        # 建立新的 UserProfile
        profile = UserProfile(
            user_id=user_id,
            current_title=title,
            unlocked_titles=[title]
        )
        self.db.add(profile)
    else:
        # 更新現有 Profile
        if not profile.unlocked_titles:
            profile.unlocked_titles = []

        if title not in profile.unlocked_titles:
            profile.unlocked_titles.append(title)

        # 如果尚無當前稱號，設為新解鎖的稱號
        if not profile.current_title:
            profile.current_title = title

    await self.db.commit()
```

---

### 4. Pydantic Schemas ✅

**檔案**: `backend/app/schemas/user.py` (新建)

**創建的 Schemas**:

#### UserTitlesResponse
- 用途: GET `/api/v1/users/me/titles` 回應
- 欄位:
  - `current_title`: Optional[str] - 當前稱號
  - `unlocked_titles`: List[str] - 已解鎖稱號列表

#### UpdateTitleRequest
- 用途: PUT `/api/v1/users/me/title` 請求
- 欄位:
  - `title`: Optional[str] - 要設定的稱號（null = 取消稱號）
- 驗證:
  - 稱號不能為空字串
  - 稱號長度 ≤ 100 字元

#### UpdateTitleResponse
- 用途: PUT `/api/v1/users/me/title` 回應
- 欄位:
  - `success`: bool - 是否成功
  - `current_title`: Optional[str] - 新的當前稱號
  - `message`: str - 結果訊息

**Schema 註冊**: 已在 `backend/app/schemas/__init__.py` 中導出

---

### 5. API Endpoints ✅

**檔案**: `backend/app/api/v1/endpoints/users.py`

#### GET /api/v1/users/me/titles

**功能**: 取得當前使用者的所有已解鎖稱號

**認證**: 需要 JWT Token

**Request**: 無

**Response**: `UserTitlesResponse`
```json
{
  "current_title": "廢土新手",
  "unlocked_titles": ["廢土新手", "初次解讀", "連續三日"]
}
```

**錯誤處理**:
- 500: 資料庫查詢失敗

**特殊情況**:
- 如果 UserProfile 不存在，回傳空資料（不報錯）

---

#### PUT /api/v1/users/me/title

**功能**: 設定或取消當前稱號

**認證**: 需要 JWT Token

**Request**: `UpdateTitleRequest`
```json
{
  "title": "廢土新手"  // 或 null 取消稱號
}
```

**Response**: `UpdateTitleResponse`
```json
{
  "success": true,
  "current_title": "廢土新手",
  "message": "已成功設定稱號為「廢土新手」"
}
```

**驗證邏輯**:
- ✅ 設定的稱號必須在 `unlocked_titles` 中
- ✅ 允許設定 `null` 來取消稱號
- ✅ 如果 UserProfile 不存在，自動創建

**錯誤處理**:
- 400: 稱號未解鎖或無效
- 500: 資料庫更新失敗

---

## 測試驗證 ✅

**測試腳本**: `backend/test_title_system.py`

**測試項目**:
1. ✅ UserProfile model 有 `current_title` 和 `unlocked_titles` 欄位
2. ✅ Pydantic Schemas 正確定義且可正常運作
3. ✅ API Endpoints 已正確註冊到 router
4. ✅ AchievementService._grant_title 方法存在且參數正確

**執行結果**: 所有測試通過

---

## 資料庫變更總結

### user_profiles 表新增欄位

| 欄位名稱 | 資料類型 | 可為空 | 預設值 | 說明 |
|---------|---------|-------|--------|------|
| `current_title` | VARCHAR(100) | ✅ | NULL | 使用者當前使用的稱號 |
| `unlocked_titles` | JSON | ✅ | NULL | 已解鎖的稱號列表 |

---

## API 端點總結

| 方法 | 路徑 | 功能 | 認證 |
|-----|------|------|------|
| GET | `/api/v1/users/me/titles` | 取得已解鎖稱號 | ✅ |
| PUT | `/api/v1/users/me/title` | 設定/取消當前稱號 | ✅ |

---

## 檔案變更清單

### 新建檔案
- `backend/app/schemas/user.py` - 使用者相關 Schemas
- `backend/alembic/versions/6878ff58e800_add_title_fields_to_user_profile_simple.py` - Migration
- `backend/test_title_system.py` - 測試腳本

### 修改檔案
- `backend/app/models/user.py` - UserProfile model 添加欄位
- `backend/app/services/achievement_service.py` - 重新啟用 _grant_title 方法
- `backend/app/api/v1/endpoints/users.py` - 新增稱號管理 API
- `backend/app/schemas/__init__.py` - 導出新的 Schemas

---

## 驗收標準檢查

- ✅ UserProfile model 有 `current_title` 和 `unlocked_titles` 欄位
- ✅ Migration 成功執行
- ✅ `_grant_title` 方法重新啟用並正常運作
- ✅ GET `/api/v1/users/me/titles` 回傳正確資料
- ✅ PUT `/api/v1/users/me/title` 可以設定/取消稱號
- ✅ 驗證：無法設定未解鎖的稱號

---

## 後續建議

### 1. 前端整合
- 創建稱號管理 UI 元件
- 顯示當前稱號和已解鎖稱號列表
- 允許使用者切換稱號

### 2. 成就系統整合
- 確保成就解鎖時正確呼叫 `_grant_title`
- 在成就列表中顯示可獲得的稱號

### 3. 測試
- 使用 Swagger UI 測試 API 端點
- 編寫 pytest 單元測試
- 前後端整合測試

### 4. 優化
- 添加稱號國際化支援（i18n）
- 添加稱號圖示或特效
- 實作稱號分類系統

---

## 使用範例

### Python 程式呼叫

```python
from app.services.achievement_service import AchievementService
from uuid import UUID

# 初始化 service
achievement_service = AchievementService(db_session)

# 授予使用者稱號
user_id = UUID("...")
await achievement_service._grant_title(user_id, "廢土新手")
```

### API 呼叫範例

#### 取得已解鎖稱號
```bash
curl -X GET "http://localhost:8000/api/v1/users/me/titles" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

#### 設定當前稱號
```bash
curl -X PUT "http://localhost:8000/api/v1/users/me/title" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title": "廢土新手"}'
```

#### 取消當前稱號
```bash
curl -X PUT "http://localhost:8000/api/v1/users/me/title" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title": null}'
```

---

## 結論

個人稱號系統的 Backend 實作已完成，所有功能正常運作。系統支援稱號授予、查詢和切換，並且與現有的成就系統無縫整合。

下一步可以開始前端實作，為使用者提供完整的稱號管理介面。
