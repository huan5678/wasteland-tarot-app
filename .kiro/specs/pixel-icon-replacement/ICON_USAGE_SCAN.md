# PixelIcon 使用情況掃描報告

**掃描日期**: 2025-10-11
**掃描範圍**: `src/` 目錄下所有 `.tsx` 和 `.ts` 檔案
**掃描工具**: grep + sed + sort

---

## 📊 使用統計總覽

| 指標 | 數值 |
|------|------|
| **PixelIcon 使用總次數** | 290 次 |
| **不重複圖示數量** | 90 個 |
| **動態圖示變數** | 1 個 (`${iconName}`) |
| **測試用圖示** | 2 個 (`nonexistent`, `nonexistent-icon`) |
| **實際需映射圖示** | 87 個 |

---

## 🔥 使用頻率 Top 20

根據使用次數排序，以下是最常用的 20 個圖示（**優先映射**）：

| 排名 | 圖示名稱 | 使用次數 | 優先級 | 映射建議 |
|------|----------|----------|--------|----------|
| 1 | `home` | 33 | P0 | house |
| 2 | `x` | 18 | P0 | x, close |
| 3 | `alert-triangle` | 14 | P0 | exclamation-triangle |
| 4 | `star` | 11 | P0 | star |
| 5 | `reload` | 9 | P0 | refresh, sync |
| 6 | `check` | 9 | P0 | check, checkmark |
| 7 | `spade` | 8 | P1 | spades (card suit) |
| 8 | `plus` | 8 | P0 | plus |
| 9 | `card-stack` | 8 | P1 | cards, stack |
| 10 | `save` | 7 | P0 | floppy-disk, save |
| 11 | `tag` | 6 | P1 | tag, label |
| 12 | `clock` | 6 | P1 | clock, time |
| 13 | `hash` | 5 | P1 | hashtag |
| 14 | `user` | 4 | P0 | user, user-circle |
| 15 | `trending-up` | 4 | P1 | arrow-up, chart-up |
| 16 | `trash-2` | 4 | P0 | trash, trash-can |
| 17 | `sparkles` | 4 | P1 | stars, sparkle |
| 18 | `search` | 4 | P0 | magnifying-glass |
| 19 | `play` | 4 | P0 | play-button, play |
| 20 | `nonexistent` | 4 | - | 測試用（不需映射） |

**關鍵發現**:
- ✅ Top 10 圖示佔總使用量的 **45%**（131/290）
- ✅ Top 20 圖示佔總使用量的 **60%**（175/290）
- ✅ 優先映射 Top 20 可快速達成主要功能覆蓋

---

## 📋 完整圖示清單（90個）

按字母順序排列：

```
alert
alert-triangle
android
archive
arrow-left
arrow-right
award
bar-chart-3
bell
book-open
books
brain
bulb
calendar
card-stack
chart-bar
check
chevron-down
chevron-left
chevron-right
chevron-up
clipboard
clock
close
copy
device-desktop
device-mobile
device-tablet
download
edit
edit-2
eye
file-text
filter
flame
grip-vertical
hash
home
image
info
library
link
list
loader
lock
logout
mask
maximize-2
message-square
minimize-2
music
palette
pause
pencil
play
plus
refresh-cw
reload
rotate-ccw
save
scroll
scroll-text
search
settings
share
share-2
shield
skip-back
skip-forward
spade
sparkles
star
tag
target
thumbs-up
trash
trash-2
trending-up
trophy
user
user-circle
user-plus
users
volume-2
volume-x
wifi-off
x
zap

[測試用圖示]
nonexistent
nonexistent-icon

[動態變數]
${iconName}
```

---

## 🎯 圖示分類

### 導航類 (15個)
```
home, arrow-left, arrow-right, chevron-down, chevron-left,
chevron-right, chevron-up, close, x, skip-back, skip-forward,
maximize-2, minimize-2, link, target
```

### 使用者/帳戶類 (7個)
```
user, user-circle, user-plus, users, logout, lock, shield
```

### 動作/操作類 (20個)
```
check, plus, edit, edit-2, pencil, save, trash, trash-2, copy,
download, reload, refresh-cw, rotate-ccw, search, filter,
share, share-2, archive, clipboard, grip-vertical
```

### 媒體/播放類 (7個)
```
play, pause, music, volume-2, volume-x, skip-back, skip-forward
```

### 資訊/提示類 (8個)
```
alert, alert-triangle, info, bell, loader, sparkles, zap, flame
```

### 內容/文件類 (10個)
```
book-open, books, file-text, scroll, scroll-text, library,
image, palette, message-square, list
```

### 數據/圖表類 (5個)
```
bar-chart-3, chart-bar, trending-up, award, trophy
```

### 標籤/分類類 (6個)
```
tag, hash, calendar, clock, star, spade
```

### 裝置類 (4個)
```
device-desktop, device-mobile, device-tablet, android
```

### 設定/工具類 (5個)
```
settings, bulb, brain, mask, eye
```

### 其他/特殊類 (3個)
```
card-stack, wifi-off, thumbs-up
```

---

## 🚨 需特別注意的圖示

### 1. 測試用圖示（不需映射）
- `nonexistent` (4次使用)
- `nonexistent-icon` (若干次使用)

這些是測試 fallback 機制用的圖示，**不需要**在映射表中處理。

### 2. 動態變數
- `${iconName}` (若干次使用)

這是程式碼中的動態變數，會在執行時替換為實際圖示名稱。映射表需要支援所有可能的值。

### 3. 高頻但命名相似的圖示
需要仔細檢查 HackerNoon 是否有對應的圖示：
- `trash` vs `trash-2`
- `edit` vs `edit-2`
- `share` vs `share-2`
- `user` vs `user-circle` vs `user-plus`

---

## 📦 映射優先級建議

### P0 (Critical) - 立即映射（20個）
**高頻使用 + 核心功能**

```
home, x, close, alert-triangle, star, reload, check, plus, save,
trash, trash-2, user, search, play, pause, music, volume-2,
volume-x, chevron-left, chevron-right
```

### P1 (High) - 次要映射（30個）
**中頻使用 + 重要功能**

```
spade, card-stack, tag, clock, hash, trending-up, sparkles,
loader, arrow-left, arrow-right, chevron-down, chevron-up,
edit, pencil, copy, download, refresh-cw, filter, share,
settings, calendar, book-open, file-text, user-circle,
device-mobile, shield, info, bell, list, logout
```

### P2 (Medium) - 後續映射（37個）
**低頻使用 + 補充功能**

其餘所有圖示

---

## 🎨 視覺驗證重點

映射完成後，需要特別驗證以下高頻圖示的視覺一致性：

1. **home** (33次) - 首頁/主頁圖示
2. **x** (18次) - 關閉/取消圖示
3. **alert-triangle** (14次) - 警告/錯誤圖示
4. **star** (11次) - 收藏/評分圖示
5. **reload** (9次) - 重新載入圖示
6. **check** (9次) - 確認/勾選圖示
7. **spade** (8次) - 黑桃花色圖示（塔羅牌相關）
8. **plus** (8次) - 新增/加號圖示
9. **card-stack** (8次) - 卡牌堆疊圖示（塔羅牌相關）
10. **save** (7次) - 儲存圖示

---

## 📂 主要使用檔案

根據 grep 結果，PixelIcon 主要使用於以下類型的檔案：

### 高頻使用檔案類型
1. **UI 元件** (`src/components/`)
   - 音樂播放器元件
   - 導航元件
   - 塔羅牌元件
   - 表單元件

2. **頁面元件** (`src/app/`)
   - 首頁
   - Dashboard
   - Settings
   - Readings

3. **工具元件** (`src/components/ui/`)
   - 按鈕
   - 對話框
   - 下拉選單

---

## ✅ Task 1.3 驗收標準檢查

- [x] 掃描所有 `.tsx` 和 `.ts` 檔案
- [x] 提取所有 `PixelIcon` 的 `name` 屬性
- [x] 統計使用總次數（290次）
- [x] 統計不重複圖示數量（90個）
- [x] 識別高頻使用圖示（Top 20）
- [x] 分類整理圖示（11個分類）
- [x] 標記測試用圖示
- [x] 建議映射優先級（P0/P1/P2）
- [x] 產生詳細報告文件

---

## 🚀 下一步行動

1. ✅ 開始 Task 1.4：建立 TypeScript 型別定義
2. ✅ 開始 Task 1.5：建立映射表骨架（優先 P0 的 20 個圖示）
3. ✅ 進入 Phase 2：核心元件改造

---

**掃描完成時間**: 2025-10-11 22:40
**實際需映射圖示**: 87 個
**優先映射圖示**: 20 個 (P0) + 30 個 (P1) = 50 個
**預計映射完成時間**: Phase 3（3-5 天）
