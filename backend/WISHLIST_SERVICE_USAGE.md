# Wishlist Service 使用說明

## 概述

本文件說明 Wishlist Service (Task 2.1, 2.2, 2.3) 的實作與使用方法。

## 已實作元件

### 1. TimezoneUtil (`app/utils/timezone_util.py`)

**功能**：提供 UTC+8 時區處理功能

**函式**：

#### `get_utc8_today_range() -> Tuple[datetime, datetime]`

取得 UTC+8 今日的 UTC 時間範圍

```python
from app.utils.timezone_util import get_utc8_today_range

# 取得今日範圍（UTC+8 00:00 ~ UTC+8 24:00，轉換為 UTC）
today_start_utc, tomorrow_start_utc = get_utc8_today_range()

# 範例：當前 UTC+8 時間為 2025-11-03 09:00:00
# 回傳：
#   today_start_utc    = 2025-11-02 16:00:00 UTC (對應 UTC+8 2025-11-03 00:00:00)
#   tomorrow_start_utc = 2025-11-03 16:00:00 UTC (對應 UTC+8 2025-11-04 00:00:00)
```

**邊界情況處理**：
- UTC+8 23:59:59 → 仍屬於當日
- UTC+8 00:00:00 → 新的一天開始

#### `format_utc8_datetime(dt: Optional[datetime]) -> Optional[str]`

將 UTC 時間格式化為 UTC+8 字串

```python
from datetime import datetime, timezone
from app.utils.timezone_util import format_utc8_datetime

dt_utc = datetime(2025, 11, 3, 8, 30, 0, tzinfo=timezone.utc)
result = format_utc8_datetime(dt_utc)
# result = "2025-11-03 16:30 (UTC+8)"
```

### 2. WishlistService (`app/services/wishlist_service.py`)

**功能**：整合所有願望相關業務邏輯

#### 使用者方法

##### `get_user_wishes(user_id: UUID, db: AsyncSession) -> List[Wishlist]`

取得使用者的願望列表（排除已隱藏）

```python
from uuid import UUID
from app.services.wishlist_service import WishlistService

service = WishlistService()
user_id = UUID("...")

wishes = await service.get_user_wishes(user_id, db)
# 回傳：按 created_at 降序排列的願望列表（is_hidden=false）
```

##### `can_submit_today(user_id: UUID, db: AsyncSession) -> bool`

檢查使用者今日是否可提交願望（UTC+8）

```python
can_submit = await service.can_submit_today(user_id, db)
if can_submit:
    print("可以提交願望")
else:
    print("今日已提交，明日再來")
```

##### `create_wish(user_id: UUID, content: str, db: AsyncSession) -> Wishlist`

建立新願望

```python
try:
    wish = await service.create_wish(user_id, "I wish for peace in the wasteland", db)
    print(f"願望建立成功：{wish.id}")
except AlreadySubmittedTodayError:
    print("今日已提交願望")
except ContentTooLongError:
    print("內容超過 500 字")
except ContentEmptyError:
    print("內容不可為空")
```

**驗證規則**：
- 今日尚未提交（UTC+8）
- 內容非空
- 內容純文字長度 ≤ 500 字（移除 Markdown 語法後）

##### `update_wish(wish_id: UUID, user_id: UUID, content: str, db: AsyncSession) -> Wishlist`

更新願望內容

```python
try:
    updated_wish = await service.update_wish(wish_id, user_id, "Updated content", db)
    print("願望更新成功")
except WishNotFoundError:
    print("願望不存在")
except UnauthorizedError:
    print("無權限編輯此願望")
except EditNotAllowedError:
    print("願望不允許編輯（已有回覆或已編輯過）")
```

**編輯規則**：
- 必須是願望擁有者
- 尚未有管理員回覆
- 尚未編輯過（has_been_edited=false）
- 編輯後 has_been_edited 設為 true，永久鎖定

#### 管理員方法

##### `get_admin_wishes(filters: Dict, sort: str, page: int, per_page: int, db: AsyncSession) -> Tuple[List[Wishlist], int]`

取得管理員願望列表（支援篩選、排序、分頁）

```python
# 篩選未回覆的願望
filters = {"replied": False, "hidden": False}
wishes, total = await service.get_admin_wishes(filters, "newest", 1, 50, db)

# 篩選已隱藏的願望
filters = {"hidden": True}
wishes, total = await service.get_admin_wishes(filters, "oldest", 1, 50, db)

# 取得所有願望
filters = {}
wishes, total = await service.get_admin_wishes(filters, "newest", 1, 50, db)
```

**篩選選項**：
- `replied`: `True` (已回覆), `False` (未回覆), `None` (全部)
- `hidden`: `True` (已隱藏), `False` (未隱藏), `None` (全部)

**排序選項**：
- `"newest"`: 最新優先（created_at DESC）
- `"oldest"`: 最舊優先（created_at ASC）

**分頁**：
- `page`: 頁碼（從 1 開始）
- `per_page`: 每頁筆數（最多 100）

##### `add_or_update_reply(wish_id: UUID, reply: str, db: AsyncSession) -> Wishlist`

新增或編輯管理員回覆

```python
try:
    wish = await service.add_or_update_reply(wish_id, "感謝您的建議，我們會納入考慮", db)
    print("回覆成功")
except WishNotFoundError:
    print("願望不存在")
except ContentTooLongError:
    print("回覆超過 1000 字")
```

**驗證規則**：
- 內容非空
- 內容純文字長度 ≤ 1000 字（移除 Markdown 語法後）

##### `toggle_hidden(wish_id: UUID, is_hidden: bool, db: AsyncSession) -> Wishlist`

切換願望的隱藏狀態

```python
# 隱藏願望
wish = await service.toggle_hidden(wish_id, True, db)

# 取消隱藏
wish = await service.toggle_hidden(wish_id, False, db)
```

### 3. 自訂例外 (`app/core/exceptions.py`)

新增四個願望相關例外：

```python
from app.core.exceptions import (
    AlreadySubmittedTodayError,  # 今日已提交願望
    WishNotFoundError,            # 願望不存在
    EditNotAllowedError,          # 不允許編輯
    UnauthorizedError             # 無權限操作
)
```

**例外詳情**：

| 例外 | HTTP Status | Error Code | 說明 |
|------|-------------|------------|------|
| `AlreadySubmittedTodayError` | 409 Conflict | `ALREADY_SUBMITTED_TODAY` | 使用者今日已提交願望 |
| `WishNotFoundError` | 404 Not Found | `WISH_NOT_FOUND` | 願望 ID 不存在 |
| `EditNotAllowedError` | 403 Forbidden | `EDIT_NOT_ALLOWED` | 願望不允許編輯（已有回覆或已編輯） |
| `UnauthorizedError` | 403 Forbidden | `UNAUTHORIZED` | 使用者無權限操作該願望 |

## 測試結果

### TimezoneUtil 測試 (8 tests)

✅ 基本功能測試
✅ UTC+8 早上 9:00 測試
✅ 邊界測試：23:59
✅ 邊界測試：00:00
✅ 格式化基本測試
✅ UTC 午夜轉 UTC+8
✅ UTC 16:00 轉 UTC+8 午夜
✅ None 輸入處理

### WishlistService 測試 (12 tests)

**使用者方法 (9 tests)**：
✅ get_user_wishes
✅ can_submit_today (無願望)
✅ can_submit_today (已提交)
✅ create_wish 成功
✅ create_wish (今日已提交)
✅ create_wish (內容過長)
✅ update_wish 成功
✅ update_wish (非擁有者)
✅ update_wish (已編輯過)

**管理員方法 (3 tests)**：
✅ get_admin_wishes (全部)
✅ add_or_update_reply
✅ toggle_hidden

## 檔案結構

```
backend/
├── app/
│   ├── utils/
│   │   ├── __init__.py
│   │   └── timezone_util.py           # 新增：時區工具
│   ├── services/
│   │   ├── content_validator.py       # Task 2 已完成
│   │   └── wishlist_service.py        # 新增：願望服務
│   ├── models/
│   │   └── wishlist.py                # Task 1.1 已完成
│   └── core/
│       └── exceptions.py              # 擴充：新增願望例外
└── tests/
    └── test_timezone_util.py          # pytest 測試檔案（需資料庫環境）
```

## 下一步

Task 3: 定義 Pydantic Schemas（WishCreate, WishUpdate, AdminReplyRequest, WishResponse）
Task 3.1: 實作使用者 API Endpoints
Task 3.2: 實作管理員 API Endpoints

## 技術細節

### 時區處理邏輯

1. **儲存**: 資料庫儲存 UTC 時間（datetime with timezone）
2. **計算**: 後端使用 UTC+8 計算每日限制
3. **顯示**: 前端顯示時轉換為 UTC+8（或使用 format_utc8_datetime）

### 每日限制計算範例

```python
# 當前 UTC+8: 2025-11-03 23:59:00
# today_start:  2025-11-02 16:00:00 UTC (UTC+8 2025-11-03 00:00:00)
# tomorrow_start: 2025-11-03 16:00:00 UTC (UTC+8 2025-11-04 00:00:00)
# 查詢: created_at >= today_start AND created_at < tomorrow_start

# 當前 UTC+8: 2025-11-04 00:00:00 (新的一天)
# today_start:  2025-11-03 16:00:00 UTC (UTC+8 2025-11-04 00:00:00)
# tomorrow_start: 2025-11-04 16:00:00 UTC (UTC+8 2025-11-05 00:00:00)
# 允許提交新願望
```

### 願望編輯邏輯

```
可編輯條件：
1. user_id 匹配（擁有者）
2. admin_reply IS NULL（尚未回覆）
3. has_been_edited = false（尚未編輯）

編輯後：
- content 更新
- has_been_edited = true（永久鎖定）
- updated_at 更新
```

## 注意事項

1. **時區一致性**：所有時間相關查詢必須使用 `get_utc8_today_range()` 計算範圍
2. **內容驗證**：所有內容更新前必須呼叫 `ContentValidator` 驗證
3. **權限檢查**：更新操作前必須檢查 `user_id` 匹配與 `can_be_edited()`
4. **例外處理**：API 層需要 catch 自訂例外並回傳適當的 HTTP 狀態碼
5. **資料庫 Session**：所有方法使用 AsyncSession，需要 await
