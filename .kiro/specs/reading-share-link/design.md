# 分享占卜結果 (Share Reading Results) - 設計文件

## 1. 設計原則 (Linus's Design Philosophy)

### 1.1 "Good Taste" - 消除特殊情況
```python
# ❌ Bad: 特殊情況處理
def create_share_link(reading):
    if reading.share_token is None:
        reading.share_token = uuid.uuid4()
        reading.save()
    return reading.share_token

# ✅ Good: 消除特殊情況
def get_or_create_share_token(reading):
    return reading.share_token or reading.generate_share_token()
```

### 1.2 簡單的資料結構
- **不建立獨立的 `shares` 表** (YAGNI - You Aren't Gonna Need It)
- `readings` 表新增 `share_token` 欄位即可
- 未來若需要統計功能，再考慮擴展

### 1.3 冪等設計
- 重複呼叫 `POST /share` 返回相同 token
- 避免產生多個無效 token

---

## 2. 系統架構

### 2.1 整體架構圖

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                  │
├──────────────────────┬──────────────────────────────────┤
│  Reading Result Page │        Share Page                │
│  /readings/{id}      │        /share/{token}            │
│                      │                                  │
│  ┌──────────────┐    │   ┌──────────────────┐         │
│  │ ShareButton  │    │   │ ShareResultView  │         │
│  └──────┬───────┘    │   └────────┬─────────┘         │
│         │            │            │                    │
└─────────┼────────────┴────────────┼────────────────────┘
          │                         │
          │ POST /api/readings/{id}/share
          │                         │ GET /api/share/{token}
          │                         │
┌─────────▼─────────────────────────▼────────────────────┐
│                   Backend API (FastAPI)                 │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │          ShareService (Business Logic)          │   │
│  │  - generate_share_link()                        │   │
│  │  - get_public_reading_data()                    │   │
│  │  - filter_private_fields()                      │   │
│  └──────────────────────┬──────────────────────────┘   │
│                         │                               │
│  ┌──────────────────────▼──────────────────────────┐   │
│  │     ReadingRepository (Data Access Layer)       │   │
│  │  - find_by_id()                                 │   │
│  │  - find_by_share_token()                        │   │
│  │  - update_share_token()                         │   │
│  └──────────────────────┬──────────────────────────┘   │
└─────────────────────────┼──────────────────────────────┘
                          │
                ┌─────────▼─────────┐
                │   PostgreSQL DB   │
                │  readings table   │
                │  + share_token    │
                └───────────────────┘
```

### 2.2 資料流 (Data Flow)

#### 2.2.1 生成分享連結流程
```
User clicks "Share"
  ↓
ShareButton calls API: POST /api/readings/{id}/share
  ↓
API validates:
  ├─ Check authentication (JWT)
  ├─ Check reading exists
  ├─ Check user is owner
  └─ Check status == 'completed'
  ↓
ShareService.generate_share_link(reading_id):
  ├─ Load reading from DB
  ├─ If share_token exists → return existing
  └─ If not → generate UUID v4 → save → return
  ↓
Return { share_token, share_url, created_at }
  ↓
Frontend displays ShareModal with URL
```

#### 2.2.2 查看分享結果流程
```
Visitor opens /share/{token}
  ↓
Frontend calls API: GET /api/share/{token}
  ↓
API validates:
  ├─ Check token format (UUID)
  └─ No authentication required
  ↓
ShareService.get_public_reading_data(token):
  ├─ Load reading by share_token
  ├─ Check reading exists (404 if not)
  ├─ Check status == 'completed' (403 if not)
  ├─ Filter private fields (user_id, email, etc.)
  └─ Return public data
  ↓
Frontend renders ShareResultView
```

---

## 3. 資料庫設計

### 3.1 Schema 變更

#### 3.1.1 Migration (Alembic)

**檔案**: `backend/alembic/versions/xxxx_add_share_token_to_readings.py`

```python
"""Add share_token to readings table

Revision ID: xxxx
Revises: yyyy
Create Date: 2025-10-21 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers
revision = 'xxxx'
down_revision = 'yyyy'
branch_labels = None
depends_on = None

def upgrade():
    # 新增 share_token 欄位
    op.add_column(
        'readings',
        sa.Column('share_token', UUID(as_uuid=True), nullable=True, unique=True)
    )

    # 建立唯一索引
    op.create_index(
        'idx_readings_share_token',
        'readings',
        ['share_token'],
        unique=True
    )

def downgrade():
    op.drop_index('idx_readings_share_token', table_name='readings')
    op.drop_column('readings', 'share_token')
```

#### 3.1.2 測試 Migration

**檔案**: `backend/tests/migrations/test_add_share_token.py`

```python
import pytest
from sqlalchemy import inspect

def test_share_token_column_exists(db_session):
    """測試 share_token 欄位存在"""
    inspector = inspect(db_session.bind)
    columns = [col['name'] for col in inspector.get_columns('readings')]
    assert 'share_token' in columns

def test_share_token_is_uuid(db_session):
    """測試 share_token 是 UUID 類型"""
    inspector = inspect(db_session.bind)
    columns = {col['name']: col for col in inspector.get_columns('readings')}
    share_token_col = columns['share_token']
    assert 'UUID' in str(share_token_col['type'])

def test_share_token_is_nullable(db_session):
    """測試 share_token 允許 NULL"""
    inspector = inspect(db_session.bind)
    columns = {col['name']: col for col in inspector.get_columns('readings')}
    assert columns['share_token']['nullable'] is True

def test_share_token_index_exists(db_session):
    """測試索引存在"""
    inspector = inspect(db_session.bind)
    indexes = inspector.get_indexes('readings')
    index_names = [idx['name'] for idx in indexes]
    assert 'idx_readings_share_token' in index_names

def test_share_token_unique_constraint(db_session):
    """測試 UNIQUE 約束"""
    inspector = inspect(db_session.bind)
    indexes = inspector.get_indexes('readings')
    share_token_idx = next(
        idx for idx in indexes if idx['name'] == 'idx_readings_share_token'
    )
    assert share_token_idx['unique'] is True
```

### 3.2 Model 定義

**檔案**: `backend/app/models/reading.py`

```python
from sqlalchemy import Column, String, UUID as SQLUUID
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Reading(Base):
    __tablename__ = 'readings'

    id = Column(SQLUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(SQLUUID(as_uuid=True), ForeignKey('users.id'))
    spread_type = Column(String(50))
    status = Column(String(20))
    question = Column(Text, nullable=True)

    # 新增欄位
    share_token = Column(UUID(as_uuid=True), unique=True, nullable=True, index=True)

    # ... 其他欄位

    def generate_share_token(self) -> uuid.UUID:
        """生成並儲存 share_token"""
        if not self.share_token:
            self.share_token = uuid.uuid4()
        return self.share_token
```

---

## 4. 後端 API 設計 (TDD)

### 4.1 生成分享連結 API

#### 4.1.1 API Endpoint

**檔案**: `backend/app/api/v1/endpoints/share.py`

```python
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
    """
    生成或獲取占卜結果的分享連結

    - 需要登入
    - 只能分享自己的占卜
    - 只能分享已完成的占卜
    - 冪等操作：重複呼叫返回相同 token
    """
    return await share_service.generate_share_link(reading_id, current_user.id)
```

#### 4.1.2 Service Layer

**檔案**: `backend/app/services/share_service.py`

```python
from uuid import UUID
from fastapi import HTTPException
from app.repositories.reading_repository import ReadingRepository

class ShareService:
    def __init__(self, reading_repo: ReadingRepository):
        self.reading_repo = reading_repo

    async def generate_share_link(self, reading_id: UUID, user_id: UUID) -> dict:
        """
        生成分享連結

        Raises:
            404: Reading 不存在
            403: 不是擁有者 或 未完成
        """
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
            "share_url": f"https://example.com/share/{share_token}",
            "created_at": reading.created_at
        }
```

#### 4.1.3 測試 (TDD - Red → Green → Refactor)

**檔案**: `backend/tests/unit/services/test_share_service.py`

```python
import pytest
from uuid import uuid4
from fastapi import HTTPException
from app.services.share_service import ShareService

class TestGenerateShareLink:
    """測試生成分享連結功能"""

    @pytest.fixture
    def share_service(self, reading_repo):
        return ShareService(reading_repo)

    @pytest.fixture
    def completed_reading(self, user):
        """已完成的占卜"""
        return Reading(
            id=uuid4(),
            user_id=user.id,
            status='completed',
            share_token=None
        )

    # Test 1: 成功生成新的 share_token
    async def test_generate_new_token(self, share_service, completed_reading, user):
        """測試首次生成 share_token"""
        result = await share_service.generate_share_link(
            completed_reading.id,
            user.id
        )

        assert result['share_token'] is not None
        assert 'share_url' in result
        assert result['share_url'].startswith('https://')
        assert str(result['share_token']) in result['share_url']

    # Test 2: 冪等性 - 重複呼叫返回相同 token
    async def test_idempotent_token_generation(self, share_service, completed_reading, user):
        """測試重複生成返回相同 token"""
        result1 = await share_service.generate_share_link(
            completed_reading.id,
            user.id
        )
        result2 = await share_service.generate_share_link(
            completed_reading.id,
            user.id
        )

        assert result1['share_token'] == result2['share_token']

    # Test 3: 非擁有者無法分享 (403)
    async def test_non_owner_cannot_share(self, share_service, completed_reading):
        """測試非擁有者嘗試分享"""
        other_user_id = uuid4()

        with pytest.raises(HTTPException) as exc:
            await share_service.generate_share_link(
                completed_reading.id,
                other_user_id
            )

        assert exc.value.status_code == 403
        assert "Not the owner" in exc.value.detail

    # Test 4: 未完成的占卜無法分享 (403)
    async def test_incomplete_reading_cannot_share(self, share_service, user):
        """測試未完成的占卜"""
        incomplete_reading = Reading(
            id=uuid4(),
            user_id=user.id,
            status='in_progress',
            share_token=None
        )

        with pytest.raises(HTTPException) as exc:
            await share_service.generate_share_link(
                incomplete_reading.id,
                user.id
            )

        assert exc.value.status_code == 403
        assert "not completed" in exc.value.detail.lower()

    # Test 5: Reading 不存在 (404)
    async def test_reading_not_found(self, share_service, user):
        """測試不存在的 reading"""
        fake_id = uuid4()

        with pytest.raises(HTTPException) as exc:
            await share_service.generate_share_link(fake_id, user.id)

        assert exc.value.status_code == 404
        assert "not found" in exc.value.detail.lower()

    # Test 6: share_token 格式為有效的 UUID v4
    async def test_token_is_valid_uuid(self, share_service, completed_reading, user):
        """測試 token 是有效的 UUID v4"""
        result = await share_service.generate_share_link(
            completed_reading.id,
            user.id
        )

        # UUID v4 的版本位應該是 4
        token_uuid = UUID(result['share_token'])
        assert token_uuid.version == 4
```

### 4.2 獲取分享結果 API

#### 4.2.1 API Endpoint

**檔案**: `backend/app/api/v1/endpoints/share.py`

```python
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

#### 4.2.2 Service Layer

**檔案**: `backend/app/services/share_service.py`

```python
async def get_public_reading_data(self, share_token: UUID) -> dict:
    """
    獲取公開的占卜資料

    Raises:
        404: Token 不存在 或 Reading 已刪除
        403: Reading 未完成
    """
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
        "question": reading.question  # 可選：根據隱私設定
    }
    # 明確不包含: user_id, user_email, user_name
```

#### 4.2.3 測試 (TDD)

**檔案**: `backend/tests/unit/services/test_share_service.py`

```python
class TestGetPublicReadingData:
    """測試獲取公開占卜資料"""

    # Test 1: 成功返回占卜結果
    async def test_get_public_data_success(self, share_service, shared_reading):
        """測試成功獲取公開資料"""
        result = await share_service.get_public_reading_data(
            shared_reading.share_token
        )

        assert result['reading_id'] == str(shared_reading.id)
        assert result['spread_type'] == shared_reading.spread_type
        assert 'cards' in result
        assert len(result['cards']) > 0

    # Test 2: 過濾私密欄位
    async def test_filters_private_fields(self, share_service, shared_reading):
        """測試不返回私密欄位"""
        result = await share_service.get_public_reading_data(
            shared_reading.share_token
        )

        # 確保不包含私密資料
        assert 'user_id' not in result
        assert 'user_email' not in result
        assert 'user_name' not in result

    # Test 3: Token 不存在 (404)
    async def test_token_not_found(self, share_service):
        """測試不存在的 token"""
        fake_token = uuid4()

        with pytest.raises(HTTPException) as exc:
            await share_service.get_public_reading_data(fake_token)

        assert exc.value.status_code == 404

    # Test 4: Reading 未完成 (403)
    async def test_incomplete_reading_forbidden(self, share_service):
        """測試未完成的 reading"""
        incomplete_reading = Reading(
            id=uuid4(),
            status='in_progress',
            share_token=uuid4()
        )

        with pytest.raises(HTTPException) as exc:
            await share_service.get_public_reading_data(
                incomplete_reading.share_token
            )

        assert exc.value.status_code == 403

    # Test 5: 包含正確的公開欄位
    async def test_includes_public_fields(self, share_service, shared_reading):
        """測試包含所有公開欄位"""
        result = await share_service.get_public_reading_data(
            shared_reading.share_token
        )

        # 必須包含的欄位
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

---

## 5. 前端設計 (TDD)

### 5.1 ShareButton 元件

#### 5.1.1 元件設計

**檔案**: `frontend/src/components/share/ShareButton.tsx`

```tsx
'use client'

import { useState } from 'react'
import { PixelIcon } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import { ShareModal } from './ShareModal'
import { generateShareLink } from '@/lib/api/share'

interface ShareButtonProps {
  readingId: string
}

export function ShareButton({ readingId }: ShareButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleShare = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await generateShareLink(readingId)
      setShareUrl(result.share_url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate share link')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={handleShare}
        disabled={isLoading}
        aria-label="分享占卜結果"
      >
        <PixelIcon name="share" sizePreset="sm" decorative />
        {isLoading ? '生成中...' : '分享結果'}
      </Button>

      {error && (
        <div className="text-error mt-2" role="alert">
          {error}
        </div>
      )}

      {shareUrl && (
        <ShareModal
          shareUrl={shareUrl}
          onClose={() => setShareUrl(null)}
        />
      )}
    </>
  )
}
```

#### 5.1.2 測試 (TDD)

**檔案**: `frontend/src/components/share/__tests__/ShareButton.test.tsx`

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ShareButton } from '../ShareButton'
import { generateShareLink } from '@/lib/api/share'

jest.mock('@/lib/api/share')

describe('ShareButton', () => {
  const mockGenerateShareLink = generateShareLink as jest.MockedFunction<typeof generateShareLink>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // Test 1: 按鈕正確渲染
  it('renders share button with icon', () => {
    render(<ShareButton readingId="test-id" />)

    const button = screen.getByRole('button', { name: /分享占卜結果/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('分享結果')
  })

  // Test 2: 點擊後呼叫 API
  it('calls API when clicked', async () => {
    mockGenerateShareLink.mockResolvedValue({
      share_token: 'abc-123',
      share_url: 'https://example.com/share/abc-123',
      created_at: '2025-10-21T00:00:00Z'
    })

    render(<ShareButton readingId="test-id" />)

    const button = screen.getByRole('button', { name: /分享占卜結果/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockGenerateShareLink).toHaveBeenCalledWith('test-id')
    })
  })

  // Test 3: API 成功後顯示 modal
  it('shows modal on successful API call', async () => {
    mockGenerateShareLink.mockResolvedValue({
      share_token: 'abc-123',
      share_url: 'https://example.com/share/abc-123',
      created_at: '2025-10-21T00:00:00Z'
    })

    render(<ShareButton readingId="test-id" />)

    const button = screen.getByRole('button', { name: /分享占卜結果/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('https://example.com/share/abc-123')).toBeInTheDocument()
    })
  })

  // Test 4: API 失敗時顯示錯誤
  it('shows error message on API failure', async () => {
    mockGenerateShareLink.mockRejectedValue(new Error('Failed to generate'))

    render(<ShareButton readingId="test-id" />)

    const button = screen.getByRole('button', { name: /分享占卜結果/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to generate')
    })
  })

  // Test 5: Loading 狀態
  it('shows loading state during API call', async () => {
    mockGenerateShareLink.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<ShareButton readingId="test-id" />)

    const button = screen.getByRole('button', { name: /分享占卜結果/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(button).toHaveTextContent('生成中...')
      expect(button).toBeDisabled()
    })
  })
})
```

### 5.2 ShareModal 元件

#### 5.2.1 元件設計

**檔案**: `frontend/src/components/share/ShareModal.tsx`

```tsx
'use client'

import { useState } from 'react'
import { PixelIcon } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'

interface ShareModalProps {
  shareUrl: string
  onClose: () => void
}

export function ShareModal({ shareUrl, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-pip-boy-dark p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold text-pip-boy-green mb-4">
          分享你的占卜結果
        </h2>

        <div className="bg-black p-3 rounded mb-4">
          <code className="text-pip-boy-green text-sm break-all">
            {shareUrl}
          </code>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleCopy} className="flex-1">
            <PixelIcon name="copy" sizePreset="sm" decorative />
            {copied ? '已複製！' : '複製連結'}
          </Button>

          <Button onClick={onClose} variant="secondary">
            關閉
          </Button>
        </div>
      </div>
    </div>
  )
}
```

#### 5.2.2 測試 (TDD)

**檔案**: `frontend/src/components/share/__tests__/ShareModal.test.tsx`

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ShareModal } from '../ShareModal'

describe('ShareModal', () => {
  const mockShareUrl = 'https://example.com/share/abc-123'
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined)
      }
    })
  })

  // Test 1: 顯示正確的分享連結
  it('displays share URL correctly', () => {
    render(<ShareModal shareUrl={mockShareUrl} onClose={mockOnClose} />)

    expect(screen.getByText(mockShareUrl)).toBeInTheDocument()
  })

  // Test 2: 複製按鈕可用
  it('has copy button', () => {
    render(<ShareModal shareUrl={mockShareUrl} onClose={mockOnClose} />)

    const copyButton = screen.getByRole('button', { name: /複製連結/i })
    expect(copyButton).toBeInTheDocument()
  })

  // Test 3: 點擊複製後呼叫 clipboard API
  it('copies to clipboard when copy button clicked', async () => {
    render(<ShareModal shareUrl={mockShareUrl} onClose={mockOnClose} />)

    const copyButton = screen.getByRole('button', { name: /複製連結/i })
    fireEvent.click(copyButton)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockShareUrl)
  })

  // Test 4: 複製後顯示成功訊息
  it('shows success message after copy', async () => {
    render(<ShareModal shareUrl={mockShareUrl} onClose={mockOnClose} />)

    const copyButton = screen.getByRole('button', { name: /複製連結/i })
    fireEvent.click(copyButton)

    await screen.findByText('已複製！')
  })

  // Test 5: 關閉 modal 功能正常
  it('calls onClose when close button clicked', () => {
    render(<ShareModal shareUrl={mockShareUrl} onClose={mockOnClose} />)

    const closeButton = screen.getByRole('button', { name: /關閉/i })
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })
})
```

### 5.3 分享頁面 (Share Page)

#### 5.3.1 頁面設計

**檔案**: `frontend/src/app/share/[token]/page.tsx`

```tsx
'use client'

import { useEffect, useState } from 'use client'
import { useParams } from 'next/navigation'
import { getSharedReading } from '@/lib/api/share'
import { PixelIcon } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SharePage() {
  const params = useParams()
  const token = params.token as string

  const [reading, setReading] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadReading()
  }, [token])

  const loadReading = async () => {
    try {
      const data = await getSharedReading(token)
      setReading(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reading')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <PixelIcon name="loader" animation="spin" variant="primary" sizePreset="lg" decorative />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <PixelIcon name="alert" variant="error" sizePreset="xl" decorative />
        <h1 className="text-2xl mt-4">載入失敗</h1>
        <p className="text-muted mt-2">{error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-pip-boy-green mb-6">
        占卜結果分享
      </h1>

      <div className="space-y-4">
        {/* 顯示卡牌 */}
        {reading.cards.map((card: any, index: number) => (
          <div key={index} className="bg-pip-boy-dark p-4 rounded">
            <h3 className="font-bold">{card.position}</h3>
            <p>{card.card_name}</p>
            <p className="text-sm text-muted">{card.interpretation}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-8 text-center">
        <Link href="/">
          <Button>
            想試試看？馬上開始占卜
          </Button>
        </Link>
      </div>
    </div>
  )
}
```

#### 5.3.2 測試 (TDD)

**檔案**: `frontend/src/app/share/[token]/__tests__/page.test.tsx`

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import SharePage from '../page'
import { getSharedReading } from '@/lib/api/share'

jest.mock('@/lib/api/share')
jest.mock('next/navigation', () => ({
  useParams: () => ({ token: 'abc-123' })
}))

describe('SharePage', () => {
  const mockGetSharedReading = getSharedReading as jest.MockedFunction<typeof getSharedReading>

  const mockReading = {
    reading_id: 'test-id',
    spread_type: 'three_card',
    cards: [
      {
        card_name: 'The Fool',
        position: 'past',
        is_reversed: false,
        interpretation: 'A new beginning...'
      }
    ],
    created_at: '2025-10-21T00:00:00Z'
  }

  // Test 1: Loading 狀態正確顯示
  it('shows loading state initially', () => {
    mockGetSharedReading.mockImplementation(() => new Promise(() => {}))

    render(<SharePage />)

    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument() // Loader icon
  })

  // Test 2: 成功渲染占卜結果
  it('renders reading data on success', async () => {
    mockGetSharedReading.mockResolvedValue(mockReading)

    render(<SharePage />)

    await waitFor(() => {
      expect(screen.getByText('The Fool')).toBeInTheDocument()
      expect(screen.getByText('A new beginning...')).toBeInTheDocument()
    })
  })

  // Test 3: 不顯示個人資訊
  it('does not display personal information', async () => {
    mockGetSharedReading.mockResolvedValue(mockReading)

    render(<SharePage />)

    await waitFor(() => {
      expect(screen.queryByText(/user_id/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/email/i)).not.toBeInTheDocument()
    })
  })

  // Test 4: 404 錯誤正確處理
  it('handles 404 error correctly', async () => {
    mockGetSharedReading.mockRejectedValue(new Error('Share link not found'))

    render(<SharePage />)

    await waitFor(() => {
      expect(screen.getByText(/載入失敗/i)).toBeInTheDocument()
      expect(screen.getByText(/Share link not found/i)).toBeInTheDocument()
    })
  })

  // Test 5: CTA 按鈕正確連結
  it('renders CTA button with correct link', async () => {
    mockGetSharedReading.mockResolvedValue(mockReading)

    render(<SharePage />)

    await waitFor(() => {
      const ctaButton = screen.getByRole('link', { name: /想試試看/i })
      expect(ctaButton).toHaveAttribute('href', '/')
    })
  })
})
```

---

## 6. E2E 測試設計

### 6.1 完整分享流程

**檔案**: `frontend/tests/e2e/share-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Share Reading Flow', () => {
  test('complete share flow', async ({ page, context }) => {
    // 1. 登入
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // 2. 完成占卜
    await page.goto('/readings/new')
    // ... 占卜流程 ...
    await page.waitForURL(/\/readings\/[a-z0-9-]+/)

    // 3. 點擊分享按鈕
    await page.click('button:has-text("分享結果")')

    // 4. 等待 modal 出現
    const shareUrl = await page.locator('code').textContent()
    expect(shareUrl).toContain('/share/')

    // 5. 複製連結
    await page.click('button:has-text("複製連結")')
    await expect(page.locator('button:has-text("已複製！")')).toBeVisible()

    // 6. 在新頁面開啟分享連結 (模擬訪客)
    const guestPage = await context.newPage()
    await guestPage.goto(shareUrl!)

    // 7. 驗證占卜結果顯示
    await expect(guestPage.locator('h1')).toContainText('占卜結果分享')
    await expect(guestPage.locator('.card')).toHaveCount(3) // 假設是三張牌

    // 8. 驗證無個人資訊
    const pageContent = await guestPage.content()
    expect(pageContent).not.toContain('test@example.com')
    expect(pageContent).not.toContain('user_id')

    // 9. 驗證 CTA 存在
    await expect(guestPage.locator('a:has-text("想試試看")')).toBeVisible()
  })

  test('deleted reading makes share link invalid', async ({ page }) => {
    // 1. 生成分享連結
    await page.goto('/readings/test-id')
    await page.click('button:has-text("分享結果")')
    const shareUrl = await page.locator('code').textContent()

    // 2. 刪除占卜
    await page.goto('/readings')
    await page.click('button[aria-label="刪除占卜"]')
    await page.click('button:has-text("確認刪除")')

    // 3. 訪問分享連結應該 404
    await page.goto(shareUrl!)
    await expect(page.locator('h1')).toContainText('載入失敗')
  })
})
```

---

## 7. 安全性設計

### 7.1 資料過濾清單

**明確定義公開/私密欄位:**

| 欄位 | 是否公開 | 原因 |
|------|----------|------|
| `reading_id` | ✅ 是 | 用於識別占卜 |
| `spread_type` | ✅ 是 | 占卜類型 (無敏感性) |
| `cards` | ✅ 是 | 占卜結果核心資料 |
| `interpretation` | ✅ 是 | AI 解讀 (無敏感性) |
| `created_at` | ✅ 是 | 占卜時間 (無敏感性) |
| `question` | ⚠️ 可選 | 可能包含個人資訊，可設定為可選 |
| `user_id` | ❌ 否 | 個人識別資訊 |
| `user_email` | ❌ 否 | 個人識別資訊 |
| `user_name` | ❌ 否 | 個人識別資訊 |
| `ip_address` | ❌ 否 | 隱私資訊 |

### 7.2 Rate Limiting

**檔案**: `backend/app/middleware/rate_limit.py`

```python
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# 分享頁面 API 限制
@limiter.limit("60/minute")
async def get_shared_reading(request: Request, share_token: UUID):
    # ... API logic ...
    pass
```

### 7.3 安全測試

**檔案**: `backend/tests/security/test_share_security.py`

```python
class TestShareSecurity:
    """測試分享功能的安全性"""

    async def test_no_sql_injection(self, client):
        """測試 SQL injection 防護"""
        malicious_token = "'; DROP TABLE readings; --"
        response = await client.get(f"/api/share/{malicious_token}")

        # 應該返回 400 (格式錯誤) 而不是執行 SQL
        assert response.status_code == 400

    async def test_no_xss_in_response(self, client, shared_reading):
        """測試 XSS 防護"""
        # 嘗試注入 script 標籤
        shared_reading.question = "<script>alert('XSS')</script>"
        shared_reading.save()

        response = await client.get(f"/api/share/{shared_reading.share_token}")

        # 確保 response 經過 escape
        assert '<script>' not in response.text
        assert '&lt;script&gt;' in response.text or 'alert' not in response.text

    async def test_cannot_access_other_users_data(self, client):
        """測試無法透過 share API 存取其他用戶資料"""
        response = await client.get(f"/api/share/{valid_token}")
        data = response.json()

        # 確認回應中沒有 user_id
        assert 'user_id' not in data
        assert 'user_email' not in data
```

---

## 8. 效能優化

### 8.1 資料庫索引

```sql
-- share_token 索引 (已在 migration 建立)
CREATE INDEX idx_readings_share_token ON readings(share_token);

-- 複合索引 (若需要過濾 status)
CREATE INDEX idx_readings_share_token_status
ON readings(share_token, status)
WHERE share_token IS NOT NULL;
```

### 8.2 快取策略

**檔案**: `backend/app/services/share_service.py`

```python
from functools import lru_cache
from cachetools import TTLCache

# 快取分享結果 (5分鐘)
share_cache = TTLCache(maxsize=1000, ttl=300)

async def get_public_reading_data(self, share_token: UUID) -> dict:
    # 檢查快取
    cache_key = f"share:{share_token}"
    if cache_key in share_cache:
        return share_cache[cache_key]

    # 從資料庫載入
    reading = await self.reading_repo.find_by_share_token(share_token)
    # ...

    result = self._filter_private_fields(reading)

    # 儲存到快取
    share_cache[cache_key] = result

    return result
```

---

## 9. 監控與日誌

### 9.1 關鍵指標

**需要監控的指標:**
- `share_link_generated_total`: 生成分享連結總數
- `share_link_accessed_total`: 分享連結訪問總數
- `share_api_latency`: API 回應延遲
- `share_api_error_rate`: API 錯誤率

### 9.2 日誌記錄

**檔案**: `backend/app/services/share_service.py`

```python
import structlog

logger = structlog.get_logger()

async def generate_share_link(self, reading_id: UUID, user_id: UUID) -> dict:
    logger.info(
        "generate_share_link_started",
        reading_id=str(reading_id),
        user_id=str(user_id)
    )

    # ... logic ...

    logger.info(
        "share_link_generated",
        reading_id=str(reading_id),
        share_token=str(share_token),
        is_new_token=bool(not reading.share_token)
    )

    return result
```

---

## 10. 部署檢查清單

- [ ] Migration 已執行且驗證
- [ ] 所有測試通過 (單元 + 整合 + E2E)
- [ ] 安全測試通過 (SQL injection, XSS)
- [ ] Rate limiting 已設定
- [ ] 錯誤監控已建立 (Sentry / Datadog)
- [ ] 資料庫索引已建立
- [ ] API 文件已更新 (Swagger)
- [ ] 前端環境變數已設定 (NEXT_PUBLIC_API_URL)
- [ ] CORS 設定已更新
- [ ] 隱私政策已更新 (若需要)

---

**文件版本**: 1.0
**最後更新**: 2025-10-21
**狀態**: 待審核
