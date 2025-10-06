# Comprehensive Testing Guide - Wasteland Tarot Backend

## 📋 概覽

完整的後端測試套件，涵蓋所有 API endpoints、服務層、資料庫操作和整合測試。

**測試框架**: pytest + pytest-asyncio
**覆蓋率目標**: ≥ 85%
**測試類型**: Unit, Integration, API, Performance, Edge Cases

---

## 🗂️ 測試結構

```
tests/
├── api/                           # API Endpoint Tests
│   ├── test_auth_endpoints.py
│   ├── test_cards_endpoints.py
│   ├── test_readings_endpoints.py
│   ├── test_reading_search.py
│   ├── test_reading_analytics.py
│   ├── test_spreads_endpoints.py
│   ├── test_voices_endpoints.py
│   ├── test_monitoring_endpoints.py
│   ├── test_streaming_endpoints.py
│   └── test_error_handling.py
├── unit/                          # Unit Tests
│   ├── test_user_service.py
│   ├── test_security.py
│   ├── test_ai_interpretation.py
│   ├── test_karma_system.py
│   └── test_wasteland_cards.py
├── integration/                   # Integration Tests
│   ├── test_complete_reading_flow.py
│   ├── test_auth_flow.py
│   ├── test_user_management.py
│   └── test_streaming_api.py
├── performance/                   # Performance Tests
│   ├── test_api_performance.py
│   └── test_reading_performance.py
├── edge_cases/                    # Edge Case Tests
│   └── test_phase4_edge_cases.py
├── conftest.py                    # Shared Fixtures
└── factories.py                   # Test Data Factories
```

---

## 🚀 運行測試

### 快速開始

```bash
# 安裝依賴
cd backend
uv sync

# 運行所有測試
pytest

# 運行特定測試套件
pytest tests/api                    # API tests only
pytest tests/unit                   # Unit tests only
pytest tests/integration            # Integration tests only
```

### 使用 Markers

```bash
# 運行特定類型的測試
pytest -m api                       # All API tests
pytest -m unit                      # All unit tests
pytest -m integration               # All integration tests
pytest -m performance               # Performance tests
pytest -m edge_cases                # Edge case tests

# 組合 markers
pytest -m "api and not slow"        # Fast API tests only
pytest -m "integration or performance"
```

### 詳細輸出

```bash
# 詳細輸出
pytest -v                           # Verbose
pytest -vv                          # Very verbose
pytest -vv --tb=short              # Short traceback

# 顯示 print 輸出
pytest -s                           # Show print statements
pytest -s -v                        # Verbose with prints
```

### 覆蓋率報告

```bash
# 生成覆蓋率報告
pytest --cov=app --cov-report=term-missing

# HTML 覆蓋率報告
pytest --cov=app --cov-report=html
# 查看: htmlcov/index.html

# XML 覆蓋率報告 (CI/CD)
pytest --cov=app --cov-report=xml
```

### 運行特定測試

```bash
# 運行特定文件
pytest tests/api/test_reading_analytics.py

# 運行特定 class
pytest tests/api/test_reading_analytics.py::TestReadingAnalytics

# 運行特定 test
pytest tests/api/test_reading_analytics.py::TestReadingAnalytics::test_get_basic_statistics

# 運行匹配模式的測試
pytest -k "analytics"               # Test names containing "analytics"
pytest -k "not slow"                # Exclude slow tests
```

---

## 📊 測試覆蓋

### API Endpoints 測試覆蓋

| Endpoint Category | Test File | Coverage |
|-------------------|-----------|----------|
| Authentication | `test_auth_endpoints.py` | ✅ Complete |
| Cards | `test_cards_endpoints.py` | ✅ Complete |
| Readings | `test_readings_endpoints.py` | ✅ Complete |
| Reading Search | `test_reading_search.py` | ✅ Complete |
| Analytics | `test_reading_analytics.py` | ✅ Complete |
| Spreads | `test_spreads_endpoints.py` | ✅ Complete |
| Voices | `test_voices_endpoints.py` | ✅ Complete |
| Monitoring | `test_monitoring_endpoints.py` | ✅ Complete |
| Streaming | `test_streaming_endpoints.py` | ✅ Complete |

### Services 測試覆蓋

- ✅ User Service
- ✅ Reading Service
- ✅ Analytics Service
- ✅ AI Interpretation Service
- ✅ Karma System
- ✅ Security & Authentication

### 整合測試覆蓋

- ✅ Complete Reading Flow
- ✅ User Authentication Flow
- ✅ Search & Filter Integration
- ✅ Analytics Integration
- ✅ Streaming Integration

---

## 🧪 測試類型說明

### 1. API Tests (`tests/api/`)

測試所有 API endpoints 的功能、驗證和錯誤處理。

**特點**:
- 使用 FastAPI TestClient
- 測試請求/回應格式
- 驗證狀態碼
- 測試認證和權限
- 錯誤處理測試

**範例**:
```python
async def test_get_analytics_stats(
    self,
    async_client: AsyncClient,
    test_user_with_token: Dict[str, Any]
):
    token = test_user_with_token["token"]

    response = await async_client.get(
        "/api/v1/readings/analytics/stats",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "total_readings" in data
```

### 2. Unit Tests (`tests/unit/`)

測試單一功能或方法，隔離外部依賴。

**特點**:
- 測試單一函數/方法
- Mock 外部依賴
- 快速執行
- 高覆蓋率目標

**範例**:
```python
def test_password_hashing():
    password = "test_password"
    hashed = hash_password(password)

    assert verify_password(password, hashed)
    assert not verify_password("wrong_password", hashed)
```

### 3. Integration Tests (`tests/integration/`)

測試多個組件的整合，模擬真實使用場景。

**特點**:
- 端到端流程
- 真實資料庫操作
- 多個 API 調用
- 完整的用戶旅程

**範例**:
```python
async def test_full_reading_lifecycle():
    # 1. Create user
    # 2. Create reading
    # 3. Update reading
    # 4. Search reading
    # 5. Get analytics
    # 6. Delete reading
```

### 4. Performance Tests (`tests/performance/`)

測試 API 效能和負載能力。

**特點**:
- 回應時間測試
- 並發請求測試
- 資料庫查詢效能
- 記憶體使用

### 5. Edge Case Tests (`tests/edge_cases/`)

測試邊界條件和異常情況。

**特點**:
- 極端值測試
- 錯誤輸入
- 資源限制
- 特殊情況

---

## 🔧 Fixtures 說明

### Database Fixtures

```python
@pytest_asyncio.fixture
async def db_session() -> AsyncSession:
    """提供測試用資料庫 session"""
```

### Client Fixtures

```python
@pytest_asyncio.fixture
async def async_client() -> AsyncClient:
    """提供測試用 HTTP client"""
```

### User Fixtures

```python
@pytest_asyncio.fixture
async def test_user_with_token():
    """提供測試用戶和 token"""
    return {
        "user": user,
        "token": token
    }
```

### Data Fixtures

```python
@pytest_asyncio.fixture
async def test_user_with_readings():
    """提供有多筆 readings 的測試用戶"""
```

---

## 📝 撰寫新測試

### 基本結構

```python
import pytest
from fastapi import status
from httpx import AsyncClient

@pytest.mark.asyncio
@pytest.mark.api
class TestNewFeature:
    """Test description"""

    async def test_basic_functionality(
        self,
        async_client: AsyncClient,
        test_user_with_token
    ):
        """Test basic functionality"""
        token = test_user_with_token["token"]

        response = await async_client.get(
            "/api/v1/new-endpoint",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "expected_field" in data
```

### TDD 流程

1. **RED**: 先寫測試（測試會失敗）
2. **GREEN**: 寫最少的程式碼讓測試通過
3. **REFACTOR**: 重構程式碼，確保測試仍然通過

---

## 🎯 測試最佳實踐

### 1. 測試命名

- 使用描述性名稱
- 格式: `test_<action>_<expected_result>`
- 範例: `test_create_reading_with_valid_data_returns_201`

### 2. 測試結構

- **Arrange**: 準備測試資料
- **Act**: 執行測試動作
- **Assert**: 驗證結果

```python
async def test_example():
    # Arrange
    user = create_test_user()
    token = get_token(user)

    # Act
    response = await client.get("/api/endpoint", headers={"Authorization": token})

    # Assert
    assert response.status_code == 200
```

### 3. 獨立性

- 每個測試應該獨立
- 不依賴其他測試的結果
- 使用 fixtures 建立測試資料

### 4. 可讀性

- 清楚的測試描述
- 簡潔的斷言
- 適當的註解

### 5. 完整性

- 測試成功路徑
- 測試錯誤路徑
- 測試邊界條件
- 測試認證/授權

---

## 🐛 除錯測試

### 顯示詳細輸出

```bash
# 顯示 print 和 log
pytest -s -v

# 顯示完整 traceback
pytest --tb=long

# 在第一個失敗時停止
pytest -x

# 顯示最慢的 10 個測試
pytest --durations=10
```

### 使用 pytest.set_trace()

```python
async def test_debugging():
    data = prepare_data()
    pytest.set_trace()  # Debugger will stop here
    response = await client.post("/api/endpoint", json=data)
```

### 使用 --pdb

```bash
# 在失敗時進入 debugger
pytest --pdb

# 在錯誤時進入 debugger
pytest --pdbcls=IPython.terminal.debugger:TerminalPdb
```

---

## 📈 持續整合

### GitHub Actions

```yaml
name: Backend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          cd backend
          pytest --cov=app --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

---

## 🎓 測試 Markers 完整列表

```ini
[pytest]
markers =
    unit: Unit tests
    integration: Integration tests
    api: API endpoint tests
    async: Asynchronous tests
    karma: Karma system tests
    faction: Faction alignment tests
    character: Character interpretation tests
    divination: Reading and divination tests
    slow: Slow-running tests
    audio: Audio system tests
    database: Database operation tests
    security: Security tests
    performance: Performance tests
    edge_cases: Edge case tests
```

---

## 📚 資源

- [pytest 文檔](https://docs.pytest.org/)
- [pytest-asyncio](https://pytest-asyncio.readthedocs.io/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [SQLAlchemy Testing](https://docs.sqlalchemy.org/en/14/orm/session_transaction.html#joining-a-session-into-an-external-transaction-such-as-for-test-suites)

---

## ✅ 檢查清單

新功能完成前的測試檢查清單：

- [ ] 撰寫 API endpoint 測試
- [ ] 撰寫 Service 層單元測試
- [ ] 撰寫整合測試
- [ ] 測試錯誤處理
- [ ] 測試認證/授權
- [ ] 測試邊界條件
- [ ] 檢查測試覆蓋率 (≥85%)
- [ ] 所有測試通過
- [ ] 更新測試文件

---

## 🚀 Quick Commands

```bash
# 開發時常用指令
pytest -v                                    # 快速測試
pytest -v -k "analytics"                     # 測試 analytics 相關
pytest --cov=app --cov-report=html          # 生成覆蓋率報告
python run_all_tests_comprehensive.py       # 完整測試套件

# CI/CD 指令
pytest --cov=app --cov-report=xml --tb=short -q
```
