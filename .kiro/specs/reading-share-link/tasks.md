# 分享占卜結果 (Share Reading Results) - 實作任務

## TDD 開發原則

**Red → Green → Refactor 循環:**
1. **Red**: 先寫測試，確保測試失敗 (因為功能尚未實作)
2. **Green**: 實作最簡單的程式碼讓測試通過
3. **Refactor**: 優化程式碼，保持測試通過

**規則:**
- ❌ 不能在沒有測試的情況下寫功能程式碼
- ✅ 每個 commit 都應該包含測試 + 實作
- ✅ 測試覆蓋率: 後端 ≥ 90%, 前端 ≥ 80%

---

## Phase 1: 資料庫 Migration

### Task 1.1: 建立 Migration 檔案
**Type**: Backend | **TDD**: Red
**檔案**: `backend/alembic/versions/xxxx_add_share_token_to_readings.py`

**測試先行 (Red):**
```python
# backend/tests/migrations/test_add_share_token.py
def test_share_token_column_exists(db_session):
    """測試 share_token 欄位存在"""
    inspector = inspect(db_session.bind)
    columns = [col['name'] for col in inspector.get_columns('readings')]
    assert 'share_token' in columns
```

**實作 (Green):**
- 建立 Alembic migration
- 新增 `share_token` 欄位 (UUID, UNIQUE, NULLABLE)
- 建立 `idx_readings_share_token` 索引

**驗收:**
- [ ] Migration 檔案建立
- [ ] `alembic upgrade head` 執行成功
- [ ] `share_token` 欄位存在於 `readings` 表
- [ ] 索引 `idx_readings_share_token` 存在

---

### Task 1.2: 測試 Migration 正確性
**Type**: Backend | **TDD**: Green → Refactor

**測試套件:**
```python
# backend/tests/migrations/test_add_share_token.py
✅ test_share_token_column_exists
✅ test_share_token_is_uuid_type
✅ test_share_token_is_nullable
✅ test_share_token_unique_constraint
✅ test_share_token_index_exists
```

**驗收:**
- [ ] 所有 migration 測試通過
- [ ] 可以插入 NULL 到 `share_token`
- [ ] 無法插入重複的 `share_token`

---

### Task 1.3: 更新 Reading Model
**Type**: Backend | **TDD**: Red → Green

**測試先行 (Red):**
```python
# backend/tests/unit/models/test_reading.py
def test_reading_has_share_token_field():
    """測試 Reading model 有 share_token 欄位"""
    reading = Reading()
    assert hasattr(reading, 'share_token')

def test_generate_share_token():
    """測試生成 share_token"""
    reading = Reading(share_token=None)
    token = reading.generate_share_token()

    assert token is not None
    assert isinstance(token, uuid.UUID)
    assert reading.share_token == token
```

**實作 (Green):**
```python
# backend/app/models/reading.py
class Reading(Base):
    # ...
    share_token = Column(UUID(as_uuid=True), unique=True, nullable=True, index=True)

    def generate_share_token(self) -> uuid.UUID:
        if not self.share_token:
            self.share_token = uuid.uuid4()
        return self.share_token
```

**驗收:**
- [ ] `Reading.share_token` 欄位存在
- [ ] `generate_share_token()` 方法正常運作
- [ ] 測試通過

---

## Phase 2: 後端 API - 生成分享連結

### Task 2.1: ReadingRepository - 查詢方法
**Type**: Backend | **TDD**: Red → Green

**測試先行 (Red):**
```python
# backend/tests/unit/repositories/test_reading_repository.py
async def test_find_by_id(reading_repo, sample_reading):
    """測試根據 ID 查詢 reading"""
    result = await reading_repo.find_by_id(sample_reading.id)
    assert result is not None
    assert result.id == sample_reading.id

async def test_find_by_share_token(reading_repo, shared_reading):
    """測試根據 share_token 查詢 reading"""
    result = await reading_repo.find_by_share_token(shared_reading.share_token)
    assert result is not None
    assert result.id == shared_reading.id

async def test_find_by_invalid_token_returns_none(reading_repo):
    """測試無效 token 返回 None"""
    result = await reading_repo.find_by_share_token(uuid.uuid4())
    assert result is None
```

**實作 (Green):**
```python
# backend/app/repositories/reading_repository.py
class ReadingRepository:
    async def find_by_id(self, reading_id: UUID) -> Optional[Reading]:
        return self.db.query(Reading).filter(Reading.id == reading_id).first()

    async def find_by_share_token(self, token: UUID) -> Optional[Reading]:
        return self.db.query(Reading).filter(Reading.share_token == token).first()
```

**驗收:**
- [ ] `find_by_id()` 測試通過
- [ ] `find_by_share_token()` 測試通過
- [ ] 無效 token 返回 None

---

### Task 2.2: ShareService - 生成分享連結
**Type**: Backend | **TDD**: Red → Green → Refactor

**測試先行 (Red):**
```python
# backend/tests/unit/services/test_share_service.py

# Test 1: 成功生成新的 share_token
async def test_generate_new_token(share_service, completed_reading, user):
    result = await share_service.generate_share_link(
        completed_reading.id,
        user.id
    )

    assert result['share_token'] is not None
    assert 'share_url' in result
    assert str(result['share_token']) in result['share_url']

# Test 2: 冪等性
async def test_idempotent_token_generation(share_service, completed_reading, user):
    result1 = await share_service.generate_share_link(completed_reading.id, user.id)
    result2 = await share_service.generate_share_link(completed_reading.id, user.id)

    assert result1['share_token'] == result2['share_token']

# Test 3: 非擁有者無法分享 (403)
async def test_non_owner_cannot_share(share_service, completed_reading):
    other_user_id = uuid4()

    with pytest.raises(HTTPException) as exc:
        await share_service.generate_share_link(completed_reading.id, other_user_id)

    assert exc.value.status_code == 403

# Test 4: 未完成的占卜無法分享 (403)
async def test_incomplete_reading_cannot_share(share_service, user):
    incomplete_reading = Reading(user_id=user.id, status='in_progress')

    with pytest.raises(HTTPException) as exc:
        await share_service.generate_share_link(incomplete_reading.id, user.id)

    assert exc.value.status_code == 403

# Test 5: Reading 不存在 (404)
async def test_reading_not_found(share_service, user):
    with pytest.raises(HTTPException) as exc:
        await share_service.generate_share_link(uuid4(), user.id)

    assert exc.value.status_code == 404

# Test 6: Token 格式為 UUID v4
async def test_token_is_valid_uuid(share_service, completed_reading, user):
    result = await share_service.generate_share_link(completed_reading.id, user.id)

    token_uuid = UUID(result['share_token'])
    assert token_uuid.version == 4
```

**實作 (Green):**
```python
# backend/app/services/share_service.py
class ShareService:
    async def generate_share_link(self, reading_id: UUID, user_id: UUID) -> dict:
        # 1. 載入 reading
        reading = await self.reading_repo.find_by_id(reading_id)
        if not reading:
            raise HTTPException(status_code=404, detail="Reading not found")

        # 2. 驗證擁有者
        if reading.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not the owner")

        # 3. 驗證狀態
        if reading.status != 'completed':
            raise HTTPException(status_code=403, detail="Reading not completed")

        # 4. 生成或重用 token (冪等)
        share_token = reading.share_token or reading.generate_share_token()
        await self.reading_repo.save(reading)

        # 5. 返回結果
        return {
            "share_token": str(share_token),
            "share_url": f"{settings.FRONTEND_URL}/share/{share_token}",
            "created_at": reading.created_at
        }
```

**驗收:**
- [ ] 所有 6 個測試通過
- [ ] 測試覆蓋率 ≥ 90%
- [ ] 冪等性正確實作

---

### Task 2.3: API Endpoint - POST /api/readings/{id}/share
**Type**: Backend | **TDD**: Red → Green

**測試先行 (Red):**
```python
# backend/tests/integration/api/test_share_api.py

# Test 1: 成功生成分享連結
async def test_create_share_link_success(client, auth_headers, completed_reading):
    response = await client.post(
        f"/api/readings/{completed_reading.id}/share",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert 'share_token' in data
    assert 'share_url' in data

# Test 2: 未登入 (401)
async def test_create_share_link_unauthorized(client, completed_reading):
    response = await client.post(f"/api/readings/{completed_reading.id}/share")

    assert response.status_code == 401

# Test 3: 非擁有者 (403)
async def test_create_share_link_not_owner(client, other_user_headers, completed_reading):
    response = await client.post(
        f"/api/readings/{completed_reading.id}/share",
        headers=other_user_headers
    )

    assert response.status_code == 403

# Test 4: 未完成的占卜 (403)
async def test_create_share_link_incomplete(client, auth_headers, incomplete_reading):
    response = await client.post(
        f"/api/readings/{incomplete_reading.id}/share",
        headers=auth_headers
    )

    assert response.status_code == 403
```

**實作 (Green):**
```python
# backend/app/api/v1/endpoints/share.py
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.share import ShareLinkResponse
from app.services.share_service import ShareService
from app.core.auth import get_current_user

router = APIRouter()

@router.post("/readings/{reading_id}/share", response_model=ShareLinkResponse)
async def create_share_link(
    reading_id: UUID,
    current_user: User = Depends(get_current_user),
    share_service: ShareService = Depends(get_share_service)
):
    return await share_service.generate_share_link(reading_id, current_user.id)
```

**驗收:**
- [ ] 所有 API 測試通過
- [ ] 正確返回 200, 401, 403, 404 狀態碼
- [ ] Swagger 文件已更新

---

## Phase 3: 後端 API - 獲取分享結果

### Task 3.1: ShareService - 過濾私密欄位
**Type**: Backend | **TDD**: Red → Green

**測試先行 (Red):**
```python
# backend/tests/unit/services/test_share_service.py

# Test 1: 成功返回占卜結果
async def test_get_public_data_success(share_service, shared_reading):
    result = await share_service.get_public_reading_data(shared_reading.share_token)

    assert result['reading_id'] == str(shared_reading.id)
    assert result['spread_type'] == shared_reading.spread_type
    assert 'cards' in result

# Test 2: 過濾私密欄位
async def test_filters_private_fields(share_service, shared_reading):
    result = await share_service.get_public_reading_data(shared_reading.share_token)

    # 確保不包含私密資料
    assert 'user_id' not in result
    assert 'user_email' not in result
    assert 'user_name' not in result

# Test 3: Token 不存在 (404)
async def test_token_not_found(share_service):
    with pytest.raises(HTTPException) as exc:
        await share_service.get_public_reading_data(uuid4())

    assert exc.value.status_code == 404

# Test 4: Reading 未完成 (403)
async def test_incomplete_reading_forbidden(share_service, incomplete_shared_reading):
    with pytest.raises(HTTPException) as exc:
        await share_service.get_public_reading_data(incomplete_shared_reading.share_token)

    assert exc.value.status_code == 403

# Test 5: 包含所有公開欄位
async def test_includes_public_fields(share_service, shared_reading):
    result = await share_service.get_public_reading_data(shared_reading.share_token)

    required_fields = ['reading_id', 'spread_type', 'cards', 'created_at']
    for field in required_fields:
        assert field in result

    # 卡牌資訊完整
    card = result['cards'][0]
    assert 'card_name' in card
    assert 'card_image_url' in card
    assert 'position' in card
    assert 'is_reversed' in card
```

**實作 (Green):**
```python
# backend/app/services/share_service.py

async def get_public_reading_data(self, share_token: UUID) -> dict:
    # 1. 載入 reading
    reading = await self.reading_repo.find_by_share_token(share_token)
    if not reading:
        raise HTTPException(status_code=404, detail="Share link not found")

    # 2. 驗證狀態
    if reading.status != 'completed':
        raise HTTPException(status_code=403, detail="Reading not available")

    # 3. 過濾私密欄位
    return self._filter_private_fields(reading)

def _filter_private_fields(self, reading: Reading) -> dict:
    """過濾私密欄位，只返回公開資料"""
    return {
        "reading_id": str(reading.id),
        "spread_type": reading.spread_type,
        "cards": [
            {
                "card_name": card.card_name,
                "card_name_zh": card.card_name_zh,
                "card_image_url": card.card_image_url,
                "position": card.position,
                "is_reversed": card.is_reversed,
                "interpretation": card.interpretation
            }
            for card in reading.cards
        ],
        "created_at": reading.created_at.isoformat(),
        "question": reading.question
    }
```

**驗收:**
- [ ] 所有 5 個測試通過
- [ ] 絕對不包含 `user_id`, `user_email`, `user_name`
- [ ] 所有公開欄位都存在

---

### Task 3.2: API Endpoint - GET /api/share/{token}
**Type**: Backend | **TDD**: Red → Green

**測試先行 (Red):**
```python
# backend/tests/integration/api/test_share_api.py

# Test 1: 成功獲取分享結果
async def test_get_shared_reading_success(client, shared_reading):
    response = await client.get(f"/api/share/{shared_reading.share_token}")

    assert response.status_code == 200
    data = response.json()
    assert data['reading_id'] == str(shared_reading.id)

# Test 2: 無需登入即可訪問
async def test_get_shared_reading_no_auth_required(client, shared_reading):
    # 不傳 auth headers
    response = await client.get(f"/api/share/{shared_reading.share_token}")

    assert response.status_code == 200

# Test 3: 不包含私密資料
async def test_get_shared_reading_no_private_data(client, shared_reading):
    response = await client.get(f"/api/share/{shared_reading.share_token}")

    data = response.json()
    assert 'user_id' not in data
    assert 'user_email' not in data

# Test 4: Token 不存在 (404)
async def test_get_shared_reading_not_found(client):
    response = await client.get(f"/api/share/{uuid4()}")

    assert response.status_code == 404

# Test 5: 無效的 token 格式 (400)
async def test_get_shared_reading_invalid_format(client):
    response = await client.get("/api/share/invalid-token")

    assert response.status_code in [400, 422]  # FastAPI validation error
```

**實作 (Green):**
```python
# backend/app/api/v1/endpoints/share.py

@router.get("/share/{share_token}", response_model=PublicReadingResponse)
async def get_shared_reading(
    share_token: UUID,
    share_service: ShareService = Depends(get_share_service)
):
    """
    獲取公開的占卜結果

    - 無需登入
    - 自動過濾私密資料
    """
    return await share_service.get_public_reading_data(share_token)
```

**驗收:**
- [ ] 所有 API 測試通過
- [ ] 無需 Authentication
- [ ] Swagger 文件已更新

---

### Task 3.3: Rate Limiting
**Type**: Backend | **TDD**: Red → Green

**測試先行 (Red):**
```python
# backend/tests/integration/api/test_share_rate_limit.py

async def test_rate_limit_enforced(client, shared_reading):
    """測試 rate limiting"""
    # 快速發送 61 次請求
    for _ in range(61):
        response = await client.get(f"/api/share/{shared_reading.share_token}")

    # 第 61 次應該被 rate limit
    assert response.status_code == 429
```

**實作 (Green):**
```python
# backend/app/middleware/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# 在 endpoint 加上 rate limit
@router.get("/share/{share_token}")
@limiter.limit("60/minute")
async def get_shared_reading(...):
    # ...
```

**驗收:**
- [ ] Rate limiting 測試通過
- [ ] 超過限制返回 429
- [ ] 監控 metrics 已設定

---

## Phase 4: 前端 - 分享按鈕與 Modal

### Task 4.1: API Client - 生成分享連結
**Type**: Frontend | **TDD**: Red → Green

**測試先行 (Red):**
```typescript
// frontend/src/lib/api/__tests__/share.test.ts

describe('generateShareLink', () => {
  it('calls correct API endpoint', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({
      share_token: 'abc-123',
      share_url: 'https://example.com/share/abc-123'
    }))

    await generateShareLink('reading-id')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/readings/reading-id/share',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('includes auth token in headers', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ share_url: '...' }))

    await generateShareLink('reading-id')

    const headers = fetchMock.mock.calls[0][1].headers
    expect(headers['Authorization']).toBeDefined()
  })
})
```

**實作 (Green):**
```typescript
// frontend/src/lib/api/share.ts

export async function generateShareLink(readingId: string) {
  const response = await fetch(`/api/readings/${readingId}/share`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error('Failed to generate share link')
  }

  return response.json()
}
```

**驗收:**
- [ ] API client 測試通過
- [ ] 錯誤處理正確

---

### Task 4.2: ShareButton 元件
**Type**: Frontend | **TDD**: Red → Green → Refactor

**測試先行 (Red):**
```tsx
// frontend/src/components/share/__tests__/ShareButton.test.tsx

describe('ShareButton', () => {
  // Test 1: 按鈕正確渲染
  it('renders share button with icon', () => {
    render(<ShareButton readingId="test-id" />)

    const button = screen.getByRole('button', { name: /分享占卜結果/i })
    expect(button).toBeInTheDocument()
  })

  // Test 2: 點擊後呼叫 API
  it('calls API when clicked', async () => {
    const mockGenerate = jest.spyOn(api, 'generateShareLink')

    render(<ShareButton readingId="test-id" />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mockGenerate).toHaveBeenCalledWith('test-id')
    })
  })

  // Test 3: API 成功後顯示 modal
  it('shows modal on success', async () => {
    jest.spyOn(api, 'generateShareLink').mockResolvedValue({
      share_url: 'https://example.com/share/abc-123'
    })

    render(<ShareButton readingId="test-id" />)
    fireEvent.click(screen.getByRole('button'))

    await screen.findByText('https://example.com/share/abc-123')
  })

  // Test 4: 錯誤處理
  it('shows error on API failure', async () => {
    jest.spyOn(api, 'generateShareLink').mockRejectedValue(new Error('Failed'))

    render(<ShareButton readingId="test-id" />)
    fireEvent.click(screen.getByRole('button'))

    await screen.findByRole('alert')
  })

  // Test 5: Loading 狀態
  it('shows loading state', async () => {
    jest.spyOn(api, 'generateShareLink').mockImplementation(
      () => new Promise(() => {})
    )

    render(<ShareButton readingId="test-id" />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveTextContent('生成中...')
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })
})
```

**實作 (Green):**
```tsx
// frontend/src/components/share/ShareButton.tsx

export function ShareButton({ readingId }: ShareButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleShare = async () => {
    setIsLoading(true)
    try {
      const result = await generateShareLink(readingId)
      setShareUrl(result.share_url)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button onClick={handleShare} disabled={isLoading}>
        <PixelIcon name="share" sizePreset="sm" decorative />
        {isLoading ? '生成中...' : '分享結果'}
      </Button>
      {error && <div role="alert">{error}</div>}
      {shareUrl && <ShareModal shareUrl={shareUrl} onClose={() => setShareUrl(null)} />}
    </>
  )
}
```

**驗收:**
- [ ] 所有 5 個測試通過
- [ ] 使用 PixelIcon (不使用 lucide-react)
- [ ] 測試覆蓋率 ≥ 80%

---

### Task 4.3: ShareModal 元件
**Type**: Frontend | **TDD**: Red → Green

**測試先行 (Red):**
```tsx
// frontend/src/components/share/__tests__/ShareModal.test.tsx

describe('ShareModal', () => {
  // Test 1: 顯示分享連結
  it('displays share URL', () => {
    render(<ShareModal shareUrl="https://example.com/share/abc" onClose={jest.fn()} />)
    expect(screen.getByText('https://example.com/share/abc')).toBeInTheDocument()
  })

  // Test 2: 複製功能
  it('copies to clipboard', async () => {
    const writeText = jest.fn()
    Object.assign(navigator, { clipboard: { writeText } })

    render(<ShareModal shareUrl="test-url" onClose={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /複製/i }))

    expect(writeText).toHaveBeenCalledWith('test-url')
  })

  // Test 3: 複製後顯示成功訊息
  it('shows success message after copy', async () => {
    render(<ShareModal shareUrl="test-url" onClose={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /複製/i }))

    await screen.findByText('已複製！')
  })

  // Test 4: 關閉功能
  it('calls onClose when close button clicked', () => {
    const onClose = jest.fn()
    render(<ShareModal shareUrl="test-url" onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: /關閉/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
```

**實作 (Green):**
```tsx
// frontend/src/components/share/ShareModal.tsx

export function ShareModal({ shareUrl, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="modal">
      <h2>分享你的占卜結果</h2>
      <code>{shareUrl}</code>
      <Button onClick={handleCopy}>
        <PixelIcon name="copy" decorative />
        {copied ? '已複製！' : '複製連結'}
      </Button>
      <Button onClick={onClose}>關閉</Button>
    </div>
  )
}
```

**驗收:**
- [ ] 所有測試通過
- [ ] 使用 PixelIcon
- [ ] Fallout 主題樣式

---

### Task 4.4: 整合到占卜結果頁面
**Type**: Frontend | **TDD**: Red → Green

**測試先行 (Red):**
```tsx
// frontend/src/app/readings/[id]/__tests__/page.test.tsx

describe('ReadingResultPage', () => {
  it('shows share button for completed reading', async () => {
    render(<ReadingResultPage params={{ id: 'test-id' }} />)

    await screen.findByRole('button', { name: /分享/i })
  })

  it('does not show share button for incomplete reading', async () => {
    // Mock incomplete reading
    render(<ReadingResultPage params={{ id: 'incomplete-id' }} />)

    expect(screen.queryByRole('button', { name: /分享/i })).not.toBeInTheDocument()
  })
})
```

**實作 (Green):**
```tsx
// frontend/src/app/readings/[id]/page.tsx

export default function ReadingResultPage({ params }: { params: { id: string } }) {
  const { reading } = useReading(params.id)

  return (
    <div>
      <h1>占卜結果</h1>
      {/* 顯示占卜內容 */}

      {reading.status === 'completed' && (
        <ShareButton readingId={reading.id} />
      )}
    </div>
  )
}
```

**驗收:**
- [ ] 完成的占卜顯示分享按鈕
- [ ] 未完成的占卜不顯示分享按鈕

---

## Phase 5: 前端 - 分享頁面

### Task 5.1: API Client - 獲取分享結果
**Type**: Frontend | **TDD**: Red → Green

**測試先行 (Red):**
```typescript
// frontend/src/lib/api/__tests__/share.test.ts

describe('getSharedReading', () => {
  it('calls correct API endpoint', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ reading_id: 'test-id' }))

    await getSharedReading('abc-123')

    expect(fetchMock).toHaveBeenCalledWith('/api/share/abc-123')
  })

  it('does not include auth token', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ reading_id: 'test-id' }))

    await getSharedReading('abc-123')

    const headers = fetchMock.mock.calls[0][1]?.headers || {}
    expect(headers['Authorization']).toBeUndefined()
  })

  it('throws error on 404', async () => {
    fetchMock.mockResponseOnce('', { status: 404 })

    await expect(getSharedReading('invalid-token')).rejects.toThrow()
  })
})
```

**實作 (Green):**
```typescript
// frontend/src/lib/api/share.ts

export async function getSharedReading(token: string) {
  const response = await fetch(`/api/share/${token}`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Share link not found')
    }
    throw new Error('Failed to load reading')
  }

  return response.json()
}
```

**驗收:**
- [ ] API client 測試通過
- [ ] 不包含 Authorization header

---

### Task 5.2: SharePage 元件
**Type**: Frontend | **TDD**: Red → Green → Refactor

**測試先行 (Red):**
```tsx
// frontend/src/app/share/[token]/__tests__/page.test.tsx

describe('SharePage', () => {
  beforeEach(() => {
    jest.mock('next/navigation', () => ({
      useParams: () => ({ token: 'abc-123' })
    }))
  })

  // Test 1: Loading 狀態
  it('shows loading state initially', () => {
    jest.spyOn(api, 'getSharedReading').mockImplementation(() => new Promise(() => {}))

    render(<SharePage />)

    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument() // Loader
  })

  // Test 2: 成功渲染占卜結果
  it('renders reading data on success', async () => {
    jest.spyOn(api, 'getSharedReading').mockResolvedValue({
      cards: [
        { card_name: 'The Fool', interpretation: 'New beginning' }
      ]
    })

    render(<SharePage />)

    await screen.findByText('The Fool')
    await screen.findByText('New beginning')
  })

  // Test 3: 不顯示個人資訊
  it('does not display personal info', async () => {
    jest.spyOn(api, 'getSharedReading').mockResolvedValue({
      cards: [...]
    })

    render(<SharePage />)

    await waitFor(() => {
      expect(screen.queryByText(/user_id/i)).not.toBeInTheDocument()
    })
  })

  // Test 4: 404 錯誤
  it('handles 404 error', async () => {
    jest.spyOn(api, 'getSharedReading').mockRejectedValue(new Error('not found'))

    render(<SharePage />)

    await screen.findByText(/載入失敗/i)
  })

  // Test 5: CTA 按鈕
  it('renders CTA button', async () => {
    jest.spyOn(api, 'getSharedReading').mockResolvedValue({ cards: [...] })

    render(<SharePage />)

    const cta = await screen.findByRole('link', { name: /想試試看/i })
    expect(cta).toHaveAttribute('href', '/')
  })
})
```

**實作 (Green):**
```tsx
// frontend/src/app/share/[token]/page.tsx

export default function SharePage() {
  const params = useParams()
  const [reading, setReading] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getSharedReading(params.token as string)
      .then(setReading)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [params.token])

  if (loading) {
    return <PixelIcon name="loader" animation="spin" />
  }

  if (error) {
    return (
      <>
        <PixelIcon name="alert" variant="error" />
        <h1>載入失敗</h1>
      </>
    )
  }

  return (
    <>
      <h1>占卜結果分享</h1>
      {reading.cards.map(card => (
        <div key={card.position}>
          <h3>{card.card_name}</h3>
          <p>{card.interpretation}</p>
        </div>
      ))}
      <Link href="/"><Button>想試試看？馬上開始占卜</Button></Link>
    </>
  )
}
```

**驗收:**
- [ ] 所有 5 個測試通過
- [ ] 使用 PixelIcon
- [ ] Fallout 主題樣式

---

## Phase 6: E2E 測試

### Task 6.1: 完整分享流程測試
**Type**: E2E | **TDD**: Red → Green

**測試先行 (Red):**
```typescript
// frontend/tests/e2e/share-flow.spec.ts

test('complete share flow', async ({ page, context }) => {
  // 1. 登入並完成占卜
  await login(page)
  await completeReading(page)

  // 2. 點擊分享
  await page.click('button:has-text("分享結果")')

  // 3. 複製連結
  const shareUrl = await page.locator('code').textContent()
  await page.click('button:has-text("複製連結")')

  // 4. 訪客開啟連結
  const guestPage = await context.newPage()
  await guestPage.goto(shareUrl)

  // 5. 驗證結果顯示
  await expect(guestPage.locator('h1')).toContainText('占卜結果')

  // 6. 驗證無個人資訊
  const content = await guestPage.content()
  expect(content).not.toContain('user_id')
})
```

**驗收:**
- [ ] E2E 測試通過
- [ ] 完整流程無錯誤

---

### Task 6.2: 刪除占卜後連結失效
**Type**: E2E | **TDD**: Red → Green

**測試先行 (Red):**
```typescript
test('deleted reading invalidates share link', async ({ page }) => {
  // 1. 生成分享連結
  const shareUrl = await generateShareLink(page)

  // 2. 刪除占卜
  await deleteReading(page)

  // 3. 訪問連結應該 404
  await page.goto(shareUrl)
  await expect(page.locator('h1')).toContainText('載入失敗')
})
```

**驗收:**
- [ ] 測試通過
- [ ] 刪除後 share link 失效

---

## Phase 7: 安全性與隱私測試

### Task 7.1: 隱私保護測試
**Type**: Backend | **TDD**: Red → Green

**測試先行 (Red):**
```python
# backend/tests/security/test_share_privacy.py

async def test_no_user_id_in_response(client, shared_reading):
    """確認回應中沒有 user_id"""
    response = await client.get(f"/api/share/{shared_reading.share_token}")

    data = response.json()
    assert 'user_id' not in data
    assert 'user_email' not in data
    assert 'user_name' not in data

async def test_no_sql_injection(client):
    """測試 SQL injection 防護"""
    malicious_token = "'; DROP TABLE readings; --"
    response = await client.get(f"/api/share/{malicious_token}")

    assert response.status_code == 400  # Bad request, not executed

async def test_no_xss_in_response(client, shared_reading):
    """測試 XSS 防護"""
    shared_reading.question = "<script>alert('XSS')</script>"
    shared_reading.save()

    response = await client.get(f"/api/share/{shared_reading.share_token}")

    assert '<script>' not in response.text
```

**驗收:**
- [ ] 所有安全測試通過
- [ ] 無 SQL injection 漏洞
- [ ] 無 XSS 漏洞
- [ ] 無個人資訊洩漏

---

### Task 7.2: 前端安全測試
**Type**: Frontend | **TDD**: Red → Green

**測試先行 (Red):**
```tsx
// frontend/src/app/share/[token]/__tests__/security.test.tsx

describe('SharePage Security', () => {
  it('escapes HTML in card names', async () => {
    jest.spyOn(api, 'getSharedReading').mockResolvedValue({
      cards: [
        { card_name: '<script>alert("XSS")</script>' }
      ]
    })

    render(<SharePage />)

    await waitFor(() => {
      expect(screen.queryByText('<script>')).not.toBeInTheDocument()
    })
  })

  it('does not execute scripts in interpretation', async () => {
    const alertSpy = jest.spyOn(window, 'alert')

    jest.spyOn(api, 'getSharedReading').mockResolvedValue({
      cards: [
        { interpretation: '<img src=x onerror="alert(1)">' }
      ]
    })

    render(<SharePage />)

    await waitFor(() => {
      expect(alertSpy).not.toHaveBeenCalled()
    })
  })
})
```

**驗收:**
- [ ] XSS 防護測試通過
- [ ] HTML 正確 escape

---

## Phase 8: 文件與部署

### Task 8.1: API 文件更新
**Type**: Documentation

**任務:**
- [ ] 更新 Swagger/OpenAPI 規格
- [ ] 加入 `POST /api/readings/{id}/share` 文件
- [ ] 加入 `GET /api/share/{token}` 文件
- [ ] 加入 Schema 定義
- [ ] 加入錯誤碼說明

---

### Task 8.2: README 更新
**Type**: Documentation

**任務:**
- [ ] 更新功能清單
- [ ] 加入分享功能說明
- [ ] 加入隱私政策說明
- [ ] 更新架構圖

---

### Task 8.3: 部署前檢查
**Type**: DevOps

**檢查清單:**
- [ ] 所有測試通過 (單元 + 整合 + E2E)
- [ ] Migration 已在 staging 環境測試
- [ ] 環境變數已設定 (FRONTEND_URL)
- [ ] Rate limiting 已設定
- [ ] 監控 metrics 已建立
- [ ] 錯誤追蹤已設定 (Sentry)
- [ ] CORS 設定已更新
- [ ] 資料庫備份已完成

---

## 總結

### 測試覆蓋率目標
- **後端**: ≥ 90%
- **前端**: ≥ 80%
- **E2E**: 100% 主要流程

### 預計時程
- **Phase 1-3 (後端)**: 2-3 天
- **Phase 4-5 (前端)**: 2-3 天
- **Phase 6-7 (測試)**: 1-2 天
- **Phase 8 (文件)**: 1 天
- **總計**: 6-9 天

### 風險管理
- 測試未通過 → 不能進入下一個 phase
- Migration 問題 → 回滾並修復
- 安全測試失敗 → 阻斷部署，必須修復

---

**TDD 開發守則:**
1. ❌ 不寫測試，不寫程式碼
2. ✅ 先寫最簡單的測試
3. ✅ 只寫足夠通過測試的程式碼
4. ✅ 通過後再重構
5. ✅ 保持測試通過，才能 commit

**Linus 的提醒:**
> "Tests or it didn't happen. If you don't have tests, your code is garbage."

---

**文件版本**: 1.0
**最後更新**: 2025-10-21
**狀態**: 待審核
