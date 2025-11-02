# 個人稱號系統 - 快速上手指南

## 系統概述

個人稱號系統允許使用者透過解鎖成就獲得稱號，並自由切換已解鎖的稱號作為當前顯示。

## API 端點

### 1. 取得已解鎖稱號

**Endpoint**: `GET /api/v1/users/me/titles`

**需求**: JWT 認證

**回應範例**:
```json
{
  "current_title": "廢土新手",
  "unlocked_titles": ["廢土新手", "初次解讀", "連續三日"]
}
```

### 2. 設定當前稱號

**Endpoint**: `PUT /api/v1/users/me/title`

**需求**: JWT 認證

**請求範例**:
```json
{
  "title": "廢土新手"
}
```

**回應範例**:
```json
{
  "success": true,
  "current_title": "廢土新手",
  "message": "已成功設定稱號為「廢土新手」"
}
```

**取消稱號**:
```json
{
  "title": null
}
```

## 測試

### 執行測試腳本

```bash
cd backend
.venv/bin/python test_title_system.py
```

### 使用 Swagger UI

1. 啟動 backend server:
```bash
cd backend
.venv/bin/uvicorn app.main:app --reload
```

2. 訪問 Swagger UI:
```
http://localhost:8000/docs
```

3. 測試端點:
   - 先登入取得 JWT Token
   - 使用 "Authorize" 按鈕設定 Token
   - 測試 `/api/v1/users/me/titles` (GET)
   - 測試 `/api/v1/users/me/title` (PUT)

## 資料庫變更

Migration 已經執行完成，無需手動操作。

如果需要重新執行 migration：
```bash
cd backend
.venv/bin/alembic upgrade head
```

## 程式整合

### 在成就解鎖時授予稱號

```python
from app.services.achievement_service import AchievementService

# 在成就定義中添加 title_reward
achievement_config = {
    "code": "first_reading",
    "title": "初次解讀",
    "rewards": {
        "karma": 10,
        "title": "廢土新手"  # 稱號獎勵
    }
}
```

### 手動授予稱號

```python
from app.services.achievement_service import AchievementService
from uuid import UUID

async def grant_title_example(db_session, user_id: UUID):
    service = AchievementService(db_session)
    await service._grant_title(user_id, "廢土新手")
```

## 常見問題

### Q: 使用者第一次使用時會有預設稱號嗎？
A: 不會。使用者需要透過解鎖成就獲得第一個稱號。當使用者解鎖第一個稱號時，會自動設為當前稱號。

### Q: 可以設定未解鎖的稱號嗎？
A: 不可以。API 會驗證稱號是否在 `unlocked_titles` 列表中，否則會回傳 400 錯誤。

### Q: 如何取消當前稱號？
A: 發送 PUT 請求到 `/api/v1/users/me/title`，body 為 `{"title": null}`。

### Q: 稱號列表會自動去重嗎？
A: 是的。`_grant_title` 方法會檢查稱號是否已存在於 `unlocked_titles` 中，避免重複添加。

## 詳細文件

完整的實作細節請參考：`TITLE_SYSTEM_IMPLEMENTATION.md`
