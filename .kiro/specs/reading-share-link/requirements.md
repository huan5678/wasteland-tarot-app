# 分享占卜結果 (Share Reading Results) - 需求文件

## 1. 功能概述

### 1.1 核心問題
用戶完成占卜後，想分享結果給朋友查看，但現有系統不支援分享功能。

### 1.2 解決方案
提供唯讀分享連結功能，讓用戶可以生成獨特的 URL，朋友無需登入即可查看占卜結果。

### 1.3 關鍵原則 (Linus's Principles)
- **簡單至上**: 使用 UUID + 公開 API，不引入複雜的權限系統
- **消除特殊情況**: 只有完成的占卜可分享，冪等設計避免重複 token
- **不破壞現有功能**: 新增欄位為 nullable，不影響現有資料和 API
- **隱私優先**: 明確定義公開/私密資料邊界

---

## 2. 功能需求

### 2.1 生成分享連結

**FR-1: 分享按鈕**
- 用戶在占卜結果頁面 (`/readings/{id}`) 看到「分享」按鈕
- 按鈕使用 PixelIcon: `name="share"`
- 只有 `status = 'completed'` 的占卜顯示分享按鈕

**FR-2: 生成 Share Token**
- 點擊分享按鈕後，系統生成或重用 UUID v4 token
- Token 儲存在 `readings.share_token` 欄位
- 若 token 已存在，重用現有 token (冪等性)

**FR-3: 顯示分享連結**
- 生成後顯示 modal，包含：
  - 完整分享 URL: `https://example.com/share/{token}`
  - 「複製連結」按鈕 (使用 PixelIcon: `name="copy"`)
  - (可選) QR code

**FR-4: 權限驗證**
- 只有占卜的擁有者可以生成分享連結
- 非擁有者嘗試分享 → 403 Forbidden

### 2.2 查看分享結果

**FR-5: 公開分享頁面**
- 路徑: `/share/{token}`
- 無需登入即可訪問
- 顯示內容:
  - 占卜類型 (spread_type): 例如「三張牌占卜」
  - 卡牌資訊: 名稱、圖片、位置、是否逆位
  - AI 解讀內容
  - 占卜時間
  - (可選) 問題內容

**FR-6: 隱私保護**
- **不顯示**以下資訊:
  - 用戶 ID
  - 用戶 Email
  - 用戶姓名
  - IP 位址
  - 裝置資訊

**FR-7: 錯誤處理**
- Token 不存在 → 404 Not Found
- Reading 已刪除 → 404 Not Found
- Reading 未完成 (`status != 'completed'`) → 403 Forbidden

**FR-8: CTA (Call to Action)**
- 頁面底部顯示: "想試試看？馬上開始占卜"
- 連結到首頁或占卜頁面

### 2.3 分享管理

**FR-9: 刪除占卜自動失效分享**
- 用戶刪除占卜後，分享連結自動失效
- 資料庫使用 CASCADE 機制

**FR-10: 撤銷分享 (未來功能)**
- (Optional Phase 2) 用戶可手動撤銷分享
- 清除 `share_token` 欄位

---

## 3. 非功能需求

### 3.1 效能

**NFR-1: API 回應時間**
- `POST /api/readings/{id}/share` < 200ms
- `GET /api/share/{token}` < 200ms

**NFR-2: 分享頁面載入時間**
- 首次載入 < 1s
- 後續訪問 < 500ms (瀏覽器快取)

### 3.2 安全性

**NFR-3: Token 安全性**
- 使用 UUID v4 (128-bit 隨機)
- Token 碰撞機率 ≈ 0 (可忽略)
- 無法預測或枚舉

**NFR-4: 唯讀存取**
- 分享連結只允許 GET 請求
- 禁止修改、刪除操作

**NFR-5: Rate Limiting**
- 公開 API (`GET /api/share/{token}`) 加入 rate limiting
- 建議: 每 IP 每分鐘 60 次請求

### 3.3 可用性

**NFR-6: 跨裝置支援**
- 分享頁面支援桌面、平板、手機
- 響應式設計

**NFR-7: 無障礙 (Accessibility)**
- 分享按鈕加上 `aria-label="分享占卜結果"`
- 分享頁面符合 WCAG 2.1 AA 標準

### 3.4 可測試性 (TDD 重點)

**NFR-8: 測試覆蓋率**
- 後端單元測試覆蓋率 ≥ 90%
- 前端單元測試覆蓋率 ≥ 80%
- E2E 測試涵蓋所有主要流程

**NFR-9: 測試隔離**
- 每個測試使用獨立的資料庫 transaction
- 測試之間無依賴關係
- 可並行執行

---

## 4. 資料需求

### 4.1 資料庫變更

**Schema Change:**
```sql
ALTER TABLE readings ADD COLUMN share_token UUID UNIQUE;
CREATE INDEX idx_readings_share_token ON readings(share_token);
```

**欄位說明:**
- `share_token`: UUID v4, nullable, unique
- 索引: 加速 `GET /api/share/{token}` 查詢

### 4.2 資料流

```
[用戶完成占卜]
  ↓
[Reading created, status = 'completed']
  ↓
[用戶點擊「分享」]
  ↓
[API: POST /readings/{id}/share]
  ↓
  ├─ 若 share_token 存在 → 重用
  └─ 若不存在 → 生成 UUID v4
  ↓
[返回 share_url]
  ↓
[朋友訪問 /share/{token}]
  ↓
[API: GET /share/{token}]
  ↓
  ├─ 查詢 Reading
  ├─ 過濾私密資料
  └─ 返回公開資料
  ↓
[顯示占卜結果]
```

---

## 5. 邊界情況

| 情況 | 預期行為 | HTTP 狀態碼 |
|------|----------|-------------|
| 占卜不存在 | 返回錯誤訊息 | 404 |
| 占卜未完成 (`status != 'completed'`) | 不允許分享 | 403 |
| 非擁有者嘗試分享 | 拒絕請求 | 403 |
| 重複點擊「分享」 | 重用現有 token | 200 |
| 用戶刪除占卜 | Share link 自動失效 | 404 |
| Share token 碰撞 | 忽略 (機率 ≈ 0) | N/A |
| 訪客嘗試修改分享結果 | 拒絕請求 | 405 |
| 無效的 token 格式 | 返回錯誤 | 400 |

---

## 6. API 規格

### 6.1 生成分享連結

**Endpoint:** `POST /api/readings/{reading_id}/share`

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "share_token": "550e8400-e29b-41d4-a716-446655440000",
  "share_url": "https://example.com/share/550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2025-10-21T12:00:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Reading 不存在
- `403 Forbidden`:
  - 占卜不屬於當前用戶
  - 占卜未完成 (`status != 'completed'`)
- `401 Unauthorized`: 未登入

### 6.2 獲取分享結果

**Endpoint:** `GET /api/share/{share_token}`

**Response (200 OK):**
```json
{
  "reading_id": "uuid",
  "spread_type": "three_card",
  "cards": [
    {
      "card_name": "The Fool",
      "card_name_zh": "愚者",
      "card_image_url": "https://example.com/cards/fool.jpg",
      "position": "past",
      "is_reversed": false,
      "interpretation": "代表新的開始..."
    }
  ],
  "created_at": "2025-10-21T12:00:00Z",
  "question": "關於工作的問題"
}
```

**Error Responses:**
- `404 Not Found`: Token 不存在或 Reading 已刪除
- `403 Forbidden`: Reading 未完成
- `400 Bad Request`: Token 格式錯誤

---

## 7. 測試需求 (TDD)

### 7.1 後端單元測試

**Test Suite 1: Database Migration**
- ✅ `share_token` 欄位存在且為 UUID 類型
- ✅ `share_token` 欄位允許 NULL
- ✅ `share_token` 欄位具有 UNIQUE 約束
- ✅ `idx_readings_share_token` 索引存在

**Test Suite 2: POST /api/readings/{id}/share**
- ✅ 成功生成新的 share_token
- ✅ 重複呼叫返回相同 token (冪等性)
- ✅ 非擁有者無法分享 (403)
- ✅ 未完成的占卜無法分享 (403)
- ✅ 不存在的 reading (404)
- ✅ 未登入用戶 (401)
- ✅ share_token 格式為有效的 UUID v4
- ✅ 返回正確的 share_url

**Test Suite 3: GET /api/share/{token}**
- ✅ 成功返回占卜結果
- ✅ 過濾 user_id, user_email, user_name
- ✅ 包含 spread_type, cards, interpretation
- ✅ Token 不存在 (404)
- ✅ Reading 已刪除 (404)
- ✅ Reading 未完成 (403)
- ✅ 無效的 token 格式 (400)

### 7.2 前端單元測試

**Test Suite 4: ShareButton Component**
- ✅ 按鈕正確渲染
- ✅ 點擊後呼叫 API
- ✅ API 成功後顯示 modal
- ✅ API 失敗時顯示錯誤訊息
- ✅ 使用正確的 PixelIcon (name="share")

**Test Suite 5: ShareModal Component**
- ✅ 顯示正確的分享連結
- ✅ 複製按鈕可用
- ✅ 點擊複製後顯示成功訊息
- ✅ 關閉 modal 功能正常

**Test Suite 6: Share Page (/share/{token})**
- ✅ 成功渲染占卜結果
- ✅ 不顯示個人資訊
- ✅ Loading 狀態正確顯示
- ✅ 404 錯誤正確處理
- ✅ 403 錯誤正確處理
- ✅ CTA 按鈕正確連結

### 7.3 整合測試

**Test Suite 7: End-to-End Share Flow**
- ✅ 完整流程: 占卜 → 分享 → 訪問連結 → 查看結果
- ✅ 隱私驗證: 確認無個人資訊洩漏
- ✅ 刪除占卜後 share link 失效
- ✅ 跨裝置測試 (桌面、手機)

### 7.4 安全測試

**Test Suite 8: Security & Privacy**
- ✅ 訪客無法獲取 user_id
- ✅ 訪客無法修改占卜結果
- ✅ Token 無法被枚舉
- ✅ Rate limiting 正常運作
- ✅ SQL injection 防護
- ✅ XSS 防護

---

## 8. 驗收標準

### 8.1 功能驗收
- [ ] 用戶可以在占卜結果頁面點擊「分享」
- [ ] 系統生成唯一的分享連結
- [ ] 分享連結可被複製
- [ ] 朋友可無需登入查看占卜結果
- [ ] 分享頁面不顯示個人資訊
- [ ] 刪除占卜後分享連結失效

### 8.2 測試驗收
- [ ] 所有後端單元測試通過 (覆蓋率 ≥ 90%)
- [ ] 所有前端單元測試通過 (覆蓋率 ≥ 80%)
- [ ] E2E 測試通過
- [ ] 安全測試通過
- [ ] 無障礙測試通過 (WCAG 2.1 AA)

### 8.3 效能驗收
- [ ] API 回應時間 < 200ms
- [ ] 分享頁面載入 < 1s
- [ ] Rate limiting 運作正常

### 8.4 安全驗收
- [ ] 無 SQL injection 漏洞
- [ ] 無 XSS 漏洞
- [ ] 無個人資訊洩漏
- [ ] Token 安全性符合標準

---

## 9. 未來擴展 (Out of Scope)

以下功能不在本次範圍內，可作為 Phase 2 考慮:

- [ ] 分享過期機制
- [ ] 訪問次數統計
- [ ] 密碼保護的分享連結
- [ ] 自訂分享樣式/主題
- [ ] 分享到社交媒體 (Twitter, Facebook)
- [ ] Open Graph 預覽卡片
- [ ] 用戶可選擇「是否包含問題」

---

## 10. 風險與緩解

| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| 個人資訊洩漏 | 高 | 中 | 嚴格的資料過濾測試 + Code review |
| Token 碰撞 | 高 | 極低 | UUID v4 足夠安全 (忽略) |
| 濫用分享功能 | 中 | 中 | Rate limiting + 監控 |
| 資料庫效能問題 | 中 | 低 | 建立索引 + 查詢優化 |
| 前端快取問題 | 低 | 低 | 正確的 Cache-Control headers |

---

## 11. 成功指標

### 11.1 技術指標
- 測試覆蓋率: 後端 ≥ 90%, 前端 ≥ 80%
- API 回應時間 < 200ms
- 分享頁面載入 < 1s
- 無 P0/P1 安全漏洞

### 11.2 產品指標 (未來追蹤)
- 分享率: X% 的占卜結果被分享
- 分享連結點擊率: 每個連結平均 Y 次點擊
- 轉換率: 訪客 → 新用戶的轉換率 Z%

---

**文件版本**: 1.0
**最後更新**: 2025-10-21
**狀態**: 待審核
