# Quick Fix: Session Management Issues

## Problem Summary

雙重 commit 導致多個 API 端點返回 503 錯誤：

1. `get_db()` 在 Line 107 自動 commit
2. Endpoints 在內部又手動 commit
3. 導致 commit 已關閉的 session 或重複 commit

## Solution Options

### Option 1: 移除 get_db() 的自動 commit (推薦)

**優點**:
- Endpoint 完全控制何時 commit
- 支援複雜的事務邏輯
- 錯誤處理更靈活

**修改** (`app/db/session.py`):
```python
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Database session dependency with manual commit control."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            # 移除自動 commit - 讓 endpoint 自行決定
        except Exception:
            await session.rollback()
            raise
```

**需要確保**: 每個 endpoint 都要手動 commit
- ✅ `get_random_cards()` - 已有 commit (Line 481)
- ✅ `get_card()` - 已有 commit (Line 252)
- ⚠️ 需要檢查其他 endpoints

---

### Option 2: 移除 Endpoint 的手動 commit

**優點**:
- 簡化 endpoint 程式碼
- 統一的 commit 策略

**缺點**:
- 失去對 commit 時機的控制
- 不適合複雜事務

**修改** (每個 endpoint):
```python
# 移除這行
# await db.commit()
```

**保持** (`app/db/session.py` Line 107):
```python
await session.commit()  # 保留自動 commit
```

---

### Option 3: Hybrid Approach (最佳實踐)

**實現**:
```python
# app/db/session.py
async def get_db(auto_commit: bool = True) -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            if auto_commit:
                await session.commit()
        except Exception:
            await session.rollback()
            raise

# 使用方式
# 自動 commit (簡單 read-only 或單一寫入)
async def simple_endpoint(db: AsyncSession = Depends(get_db)):
    ...

# 手動 commit (複雜事務)
async def complex_endpoint(db: AsyncSession = Depends(lambda: get_db(auto_commit=False))):
    ...
    await db.commit()
```

---

## Recommended Fix (Option 1)

### Step 1: 修改 `app/db/session.py`

```python
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency injection for database session.

    Endpoints MUST manually commit changes.
    Session automatically rolls back on exceptions.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            # No auto-commit - endpoints handle commits
        except Exception as e:
            logger.error(f"Database session error: {str(e)}", exc_info=True)
            await session.rollback()
            raise
```

### Step 2: 檢查所有需要 commit 的 Endpoints

運行檢查腳本:
```bash
python tools/check_missing_commits.py
```

### Step 3: 添加缺失的 commits

對於沒有 commit 的寫入操作端點，添加:
```python
try:
    # ... database operations ...
    await db.commit()
    return result
except Exception as e:
    await db.rollback()
    raise
```

---

## Testing After Fix

```bash
# 1. 重啟 API 服務器
# 停止當前服務器，然後:
uvicorn app.main:app --reload

# 2. 運行測試套件
python tools/comprehensive_api_test.py

# 3. 驗證特定端點
curl http://localhost:8000/api/v1/cards/random
curl http://localhost:8000/api/v1/readings/
curl http://localhost:8000/api/v1/spreads/
```

預期結果:
- ✅ GET /cards/random 應該返回 200 OK
- ✅ 並發測試應該通過
- ✅ 所有測試通過率應該 > 90%

---

## Files to Modify

1. **必須修改**:
   - `app/db/session.py` - 移除自動 commit

2. **需要檢查** (確保有 commit):
   - `app/api/v1/endpoints/cards.py`
   - `app/api/v1/endpoints/readings.py`
   - `app/api/v1/endpoints/spreads.py`
   - `app/api/v1/endpoints/bingo.py`
   - 所有其他有寫入操作的 endpoints

3. **可選優化**:
   - 改善錯誤訊息
   - 添加 request_id
   - 優化連接池設定

---

## Rollback Plan

如果修復後出現問題:

1. 恢復 `app/db/session.py`:
   ```bash
   git checkout app/db/session.py
   ```

2. 重啟服務器

3. 檢查日誌找出真正的問題
