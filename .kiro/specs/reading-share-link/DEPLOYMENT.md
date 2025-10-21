# Reading Share Link - Deployment Checklist

## 部署前檢查清單

使用此清單確保分享功能在生產環境中安全且正確地運行。

---

## 📋 Phase 1: 資料庫遷移

### 1.1 測試環境驗證

- [ ] 在測試資料庫執行遷移
  ```bash
  cd backend
  alembic upgrade head
  ```

- [ ] 驗證 `completed_readings` 表格結構
  ```sql
  \d completed_readings
  ```

- [ ] 確認以下變更：
  - [ ] `share_token` 欄位已添加 (UUID type)
  - [ ] `share_token` 欄位允許 NULL
  - [ ] `share_token` 有 UNIQUE constraint
  - [ ] `idx_completed_readings_share_token` 索引已創建

### 1.2 生產環境遷移

- [ ] 備份生產資料庫
  ```bash
  pg_dump -U postgres -d wasteland_tarot > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] 在維護時段執行遷移
- [ ] 驗證遷移成功
- [ ] 記錄遷移時間和結果

### 1.3 回滾計畫

- [ ] 準備回滾腳本
  ```bash
  alembic downgrade -1
  ```

- [ ] 測試回滾流程
- [ ] 記錄回滾步驟

---

## 🔐 Phase 2: 安全檢查

### 2.1 資料隱私

- [ ] 驗證 `ShareService._filter_private_fields()` 正確過濾以下欄位：
  - [ ] `user_id`
  - [ ] `user_email`
  - [ ] `user_name`
  - [ ] `user` (relationship)

- [ ] 執行隱私測試
  ```bash
  cd backend
  pytest tests/unit/test_share_service.py::test_privacy_filtering -v
  ```

- [ ] 手動驗證 API 回應不含敏感資料
  ```bash
  curl http://localhost:8000/api/v1/share/{token} | jq
  ```

### 2.2 SQL Injection 防護

- [ ] 確認所有查詢使用 ORM 或參數化查詢
- [ ] 執行 SQL injection 測試
  ```bash
  playwright test tests/e2e/reading-share-security.spec.ts -g "SQL Injection"
  ```

- [ ] 驗證 UUID 參數驗證正常運作

### 2.3 XSS 防護

- [ ] 確認前端使用 React (自動轉義)
- [ ] 執行 XSS 測試
  ```bash
  playwright test tests/e2e/reading-share-security.spec.ts -g "XSS"
  ```

- [ ] (建議) 設定 Content-Security-Policy header

### 2.4 授權檢查

- [ ] 測試未登入使用者無法生成分享連結 (401/403)
- [ ] 測試非擁有者無法分享他人的占卜 (403)
- [ ] 測試公開端點無需授權 (GET /share/{token})

---

## 🧪 Phase 3: 測試驗證

### 3.1 單元測試

- [ ] 執行後端單元測試
  ```bash
  cd backend
  pytest tests/unit/test_share_service.py -v
  pytest tests/api/test_share_api.py -v
  ```

- [ ] 確認測試覆蓋率 ≥ 80%
  ```bash
  pytest --cov=app/services/share_service --cov=app/api/v1/endpoints/share
  ```

### 3.2 E2E 測試

- [ ] 執行完整 E2E 測試
  ```bash
  playwright test tests/e2e/reading-share.spec.ts
  ```

- [ ] 驗證以下場景：
  - [ ] 完整分享流程 (生成 → 複製 → 訪問)
  - [ ] 隱私驗證 (無 user_id)
  - [ ] 刪除占卜使分享連結失效
  - [ ] 無效 token 處理
  - [ ] 冪等性 (重複分享返回相同 token)

### 3.3 安全測試

- [ ] 執行安全測試
  ```bash
  playwright test tests/e2e/reading-share-security.spec.ts
  ```

- [ ] 確認所有安全測試通過

### 3.4 手動測試

- [ ] 創建測試占卜
- [ ] 生成分享連結
- [ ] 複製連結
- [ ] 在無痕視窗開啟連結
- [ ] 驗證資料正確顯示
- [ ] 刪除占卜
- [ ] 驗證分享連結失效 (404)

---

## ⚙️ Phase 4: 環境配置

### 4.1 環境變數

- [ ] 設定 `FRONTEND_URL`
  ```bash
  # .env
  FRONTEND_URL=https://wasteland-tarot.com
  ```

- [ ] 驗證設定生效
  ```python
  from app.config import settings
  print(settings.frontend_url)
  ```

### 4.2 CORS 設定

- [ ] 確認 CORS 允許前端域名
  ```python
  # backend/app/main.py
  origins = [
      settings.frontend_url,
      "http://localhost:3000",  # 開發環境
  ]
  ```

### 4.3 資料庫連線池

- [ ] 檢查資料庫連線池大小足夠
- [ ] 監控連線使用情況

---

## 📊 Phase 5: 效能優化

### 5.1 資料庫索引

- [ ] 確認 `share_token` 索引存在且有效
  ```sql
  SELECT * FROM pg_indexes WHERE tablename = 'completed_readings' AND indexname LIKE '%share_token%';
  ```

- [ ] 執行 EXPLAIN ANALYZE 檢查查詢效能
  ```sql
  EXPLAIN ANALYZE
  SELECT * FROM completed_readings WHERE share_token = 'uuid-here';
  ```

### 5.2 快取策略 (可選)

- [ ] 考慮實作 Redis 快取
- [ ] 設定合理的 TTL

### 5.3 CDN 設定 (可選)

- [ ] 如果使用 CDN，確保 `/share/*` 路徑可快取
- [ ] 設定適當的 Cache-Control headers

---

## 🚀 Phase 6: 部署步驟

### 6.1 準備工作

- [ ] 通知團隊即將部署
- [ ] 備份生產資料庫
- [ ] 設定維護頁面 (如需要)

### 6.2 後端部署

1. [ ] 拉取最新程式碼
   ```bash
   git pull origin main
   ```

2. [ ] 執行資料庫遷移
   ```bash
   cd backend
   alembic upgrade head
   ```

3. [ ] 重啟後端服務
   ```bash
   systemctl restart wasteland-tarot-backend
   ```

4. [ ] 驗證服務運行
   ```bash
   curl http://localhost:8000/health
   ```

### 6.3 前端部署

1. [ ] 拉取最新程式碼
   ```bash
   git pull origin main
   ```

2. [ ] 安裝依賴
   ```bash
   npm install
   ```

3. [ ] 建置生產版本
   ```bash
   npm run build
   ```

4. [ ] 部署到伺服器
   ```bash
   npm run start
   # 或使用 PM2
   pm2 restart wasteland-tarot-frontend
   ```

5. [ ] 驗證前端運行
   ```bash
   curl https://wasteland-tarot.com
   ```

### 6.4 驗證部署

- [ ] 測試分享功能運作
- [ ] 檢查錯誤日誌
- [ ] 監控系統資源使用

---

## 📈 Phase 7: 監控與告警

### 7.1 日誌監控

- [ ] 確認分享相關日誌正常記錄
- [ ] 設定錯誤日誌告警

### 7.2 效能監控

- [ ] 監控 API 回應時間
  - Target: `POST /readings/{id}/share` < 500ms
  - Target: `GET /share/{token}` < 300ms

- [ ] 監控資料庫查詢效能

### 7.3 使用量監控

- [ ] 追蹤分享連結生成次數
- [ ] 追蹤分享連結訪問次數
- [ ] 設定異常使用告警 (防止濫用)

### 7.4 錯誤監控

- [ ] 監控 404 錯誤率 (可能表示大量無效連結)
- [ ] 監控 403 錯誤率 (可能表示授權問題)
- [ ] 監控 500 錯誤 (系統問題)

---

## 🔧 Phase 8: 回滾計畫

### 8.1 回滾觸發條件

在以下情況考慮回滾：

- [ ] 大量 500 錯誤 (錯誤率 > 5%)
- [ ] 資料隱私洩漏
- [ ] 關鍵功能失效
- [ ] 效能嚴重降低 (回應時間 > 3s)

### 8.2 回滾步驟

1. [ ] 回滾前端部署
   ```bash
   git checkout {previous-commit}
   npm run build
   pm2 restart wasteland-tarot-frontend
   ```

2. [ ] 回滾後端部署
   ```bash
   git checkout {previous-commit}
   systemctl restart wasteland-tarot-backend
   ```

3. [ ] 回滾資料庫遷移 (謹慎！)
   ```bash
   cd backend
   alembic downgrade -1
   ```

4. [ ] 驗證回滾成功

5. [ ] 通知團隊和使用者

---

## 📝 Phase 9: 文件更新

### 9.1 API 文件

- [ ] 更新 Swagger/OpenAPI 文件
- [ ] 確保 API.md 與實作一致
- [ ] 更新 Postman collection (如有)

### 9.2 使用者文件

- [ ] 更新使用者手冊
- [ ] 創建分享功能教學
- [ ] 更新 FAQ

### 9.3 內部文件

- [ ] 更新系統架構圖
- [ ] 記錄部署日誌
- [ ] 更新 README

---

## ✅ Phase 10: 部署後驗證

### 10.1 煙霧測試 (Smoke Test)

在生產環境執行以下測試：

- [ ] 使用者可以登入
- [ ] 可以創建新占卜
- [ ] 可以生成分享連結
- [ ] 分享連結可以在無痕視窗訪問
- [ ] 分享資料不含個人資訊
- [ ] 刪除占卜後分享連結失效

### 10.2 效能驗證

- [ ] API 回應時間在可接受範圍內
- [ ] 資料庫查詢使用索引
- [ ] 無記憶體洩漏

### 10.3 安全驗證

- [ ] 無 SQL injection 漏洞
- [ ] 無 XSS 漏洞
- [ ] 隱私資料正確過濾
- [ ] 授權檢查正常運作

### 10.4 使用者驗證

- [ ] 邀請內部測試人員測試
- [ ] 收集反饋
- [ ] 修復緊急問題

---

## 🐛 Phase 11: 已知問題與限制

### 11.1 已知限制

記錄已知但可接受的限制：

- [ ] 分享連結無法撤銷（除非刪除占卜）
- [ ] 分享連結永久有效
- [ ] 無法追蹤誰查看了連結
- [ ] 無法設定過期時間

### 11.2 未來改進

規劃未來版本可能的改進：

- [ ] 添加分享連結過期時間
- [ ] 添加訪問統計
- [ ] 添加撤銷分享功能
- [ ] 添加分享權限設定（僅特定人可見）

---

## 📞 Phase 12: 支援與聯絡

### 12.1 緊急聯絡

- **技術負責人**: [Name] - [Email]
- **資料庫管理員**: [Name] - [Email]
- **DevOps**: [Name] - [Email]

### 12.2 監控儀表板

- [ ] 應用監控: [URL]
- [ ] 錯誤追蹤: [URL]
- [ ] 效能監控: [URL]

### 12.3 文件連結

- API 文件: `.kiro/specs/reading-share-link/API.md`
- 需求文件: `.kiro/specs/reading-share-link/requirements.md`
- 設計文件: `.kiro/specs/reading-share-link/design.md`
- 任務清單: `.kiro/specs/reading-share-link/tasks.md`

---

## ✨ 最終檢查

部署完成後，確認以下所有項目：

- [ ] ✅ 所有測試通過
- [ ] ✅ 資料庫遷移成功
- [ ] ✅ 前後端部署完成
- [ ] ✅ 煙霧測試通過
- [ ] ✅ 監控和告警已設定
- [ ] ✅ 文件已更新
- [ ] ✅ 團隊已通知
- [ ] ✅ 使用者可以正常使用分享功能
- [ ] ✅ 無隱私資料洩漏
- [ ] ✅ 無安全漏洞

---

## 📅 部署記錄

### 部署日期: _______________

### 部署人員: _______________

### 版本號: _______________

### 部署結果:
- [ ] 成功
- [ ] 部分成功（說明：_______________）
- [ ] 失敗（說明：_______________）

### 問題記錄:


### 後續行動:


---

**部署完成！** 🎉

記得在部署後持續監控系統運行狀況，並及時處理任何問題。
