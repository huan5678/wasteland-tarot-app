# 🃏 Wasteland Tarot API 測試指南

這個完整的測試套件確保你的FastAPI應用程式在所有方面都能正常運行。

## 📋 測試套件概覽

我們建立了7個主要測試模組，覆蓋了API的所有關鍵功能：

### 1. 🗄️ 資料庫連接測試 (`test_database_connection.py`)
- 驗證Supabase連接正常
- 檢查資料表結構完整性
- 測試事務處理和回滾功能
- 驗證schema一致性
- 性能基準測試

### 2. 🚀 API端點測試 (`test_api_endpoints_comprehensive.py`)
- 測試所有HTTP方法 (GET, POST, PUT, DELETE)
- 驗證響應格式和狀態碼
- 測試分頁、排序、篩選功能
- 驗證請求/響應標頭
- 性能和並發測試

### 3. 🃏 卡片資料完整性測試 (`test_card_data_integrity.py`)
- 驗證78張塔羅牌完整性
- 檢查Major Arcana (22張) 和Minor Arcana (56張)
- 驗證卡片編號和花色正確性
- 檢查必要欄位存在
- 驗證廢土主題一致性

### 4. 🔍 查詢參數測試 (`test_query_parameters.py`)
- 測試所有查詢參數組合
- 驗證篩選條件正確性
- 測試邊界值和無效輸入
- 檢查搜尋功能
- 測試排序和分頁

### 5. ❌ 錯誤處理測試 (`test_error_handling.py`)
- 測試404、422、500等錯誤碼
- 驗證錯誤響應格式
- 測試安全性（SQL注入、XSS保護）
- 檢查輸入驗證
- 測試併發錯誤處理

### 6. 📚 Swagger UI測試 (`test_swagger_ui.py`)
- 驗證OpenAPI schema完整性
- 測試Swagger UI可訪問性
- 檢查API文檔完整性
- 驗證參數和響應定義
- 測試ReDoc功能

### 7. 🔗 CORS配置測試 (`test_cors_configuration.py`)
- 測試跨域請求處理
- 驗證預檢請求
- 檢查允許的來源和方法
- 測試安全配置
- 驗證標頭處理

## 🚀 快速開始

### 1. 安裝依賴
```bash
# 使用uv安裝測試依賴
uv add --group dev pytest pytest-asyncio pytest-cov httpx
```

### 2. 運行所有測試
```bash
# 使用我們的測試運行器
python run_all_tests.py

# 或使用pytest直接運行
python -m pytest tests/ -v
```

### 3. 運行特定測試模組
```bash
# 資料庫測試
python -m pytest tests/test_database_connection.py -v

# API端點測試
python -m pytest tests/test_api_endpoints_comprehensive.py -v

# 卡片完整性測試
python -m pytest tests/test_card_data_integrity.py -v
```

## 🎯 測試標記系統

我們使用pytest標記來分類測試：

```bash
# 運行集成測試
python -m pytest -m integration -v

# 運行資料庫測試
python -m pytest -m database -v

# 運行性能測試
python -m pytest -m performance -v

# 跳過慢速測試
python -m pytest -m "not slow" -v
```

## 📊 測試覆蓋率

檢查代碼覆蓋率：

```bash
# 生成覆蓋率報告
python -m pytest --cov=app --cov-report=html --cov-report=term-missing

# 設置覆蓋率門檻
python -m pytest --cov=app --cov-fail-under=80
```

覆蓋率報告將生成在 `htmlcov/index.html`

## 🔧 測試配置

### pytest.ini 配置
```ini
[tool:pytest]
testpaths = tests
python_files = test_*.py *_test.py
python_classes = Test*
python_functions = test_*
addopts =
    --strict-markers
    --strict-config
    --cov=app
    --cov-branch
    --cov-report=term-missing:skip-covered
    --cov-report=html:htmlcov
    --cov-report=xml
    --cov-fail-under=85
    --asyncio-mode=auto
markers =
    unit: Unit tests for individual functions
    integration: Integration tests for API endpoints
    async: Asynchronous operation tests
    karma: Karma system specific tests
    faction: Faction alignment tests
    character: Character interpretation tests
    divination: Reading and divination tests
    slow: Tests that take longer to run
    database: Database operation tests
    security: Authentication and security tests
    performance: Performance and load tests
```

## 🎮 測試數據和Fixtures

我們提供了豐富的測試數據fixtures：

### 用戶fixtures
- `vault_dweller`: 避難所居民
- `brotherhood_member`: 兄弟會成員
- `raider`: 劫掠者
- `experienced_user`: 經驗豐富的用戶

### 卡片fixtures
- `complete_deck`: 完整78張卡片
- `major_arcana_card`: 大阿爾克那卡片
- `minor_arcana_card`: 小阿爾克那卡片
- `high_radiation_card`: 高輻射卡片

### 系統fixtures
- `async_client`: 異步HTTP客戶端
- `db_session`: 資料庫會話
- `mock_ai_service`: 模擬AI服務

## 📈 性能基準

我們設置了以下性能基準：

- API響應時間: < 2秒
- 資料庫查詢: < 1秒
- 卡片洗牌: < 0.5秒
- 文檔載入: < 3秒

## 🐛 調試測試

### 運行特定測試
```bash
# 運行單個測試函數
python -m pytest tests/test_api_endpoints_comprehensive.py::TestCardsAPI::test_get_all_cards -v

# 運行測試類
python -m pytest tests/test_database_connection.py::TestDatabaseConnection -v
```

### 詳細輸出
```bash
# 顯示詳細輸出
python -m pytest tests/ -v -s

# 顯示最慢的10個測試
python -m pytest tests/ --durations=10
```

### 測試失敗時
```bash
# 在第一個失敗時停止
python -m pytest tests/ -x

# 顯示詳細traceback
python -m pytest tests/ --tb=long

# 進入調試模式
python -m pytest tests/ --pdb
```

## 🔄 持續集成

在CI/CD中使用：

```yaml
# GitHub Actions 示例
- name: Run tests
  run: |
    python run_all_tests.py

- name: Upload coverage reports
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage.xml
```

## 📝 測試報告

測試完成後會生成：

1. **終端報告**: 即時測試結果
2. **HTML覆蓋率報告**: `htmlcov/index.html`
3. **JSON測試報告**: `test_report_YYYYMMDD_HHMMSS.json`
4. **XML覆蓋率**: `coverage.xml` (用於CI)

## ✅ 測試檢查清單

在部署前確保：

- [ ] 所有資料庫測試通過
- [ ] 所有API端點正常工作
- [ ] 78張卡片資料完整
- [ ] 查詢參數正確處理
- [ ] 錯誤處理適當
- [ ] Swagger UI可訪問
- [ ] CORS正確配置
- [ ] 測試覆蓋率 > 80%

## 🆘 故障排除

### 常見問題

1. **資料庫連接失敗**
   ```bash
   # 檢查環境變數
   echo $DATABASE_URL

   # 檢查Supabase連接
   python -c "from app.config import get_settings; print(get_settings().database_url)"
   ```

2. **測試超時**
   ```bash
   # 增加超時時間
   python -m pytest tests/ --timeout=300
   ```

3. **依賴問題**
   ```bash
   # 重新安裝依賴
   uv sync --group dev
   ```

4. **權限問題**
   ```bash
   # 確保測試文件可執行
   chmod +x run_all_tests.py
   ```

## 🎯 最佳實踐

1. **編寫測試前先運行**: 確保新測試環境乾淨
2. **保持測試獨立**: 每個測試都應該能單獨運行
3. **使用描述性名稱**: 測試名稱應該清楚說明在測試什麼
4. **測試邊界條件**: 不只測試正常情況，也要測試極端情況
5. **保持測試快速**: 使用mock和fixture來避免慢速操作
6. **定期更新測試**: 當API變更時及時更新測試

---

## 🎉 結語

這個測試套件為你的Wasteland Tarot API提供了全面的質量保證。通過運行這些測試，你可以確信API在各種情況下都能穩定運行，為用戶提供可靠的塔羅牌占卜體驗。

記住：好的測試不只是檢查代碼是否工作，更是為未來的變更提供安全網，讓你能夠自信地改進和擴展API功能。

**May the wasteland guide your code! 🃏☢️**