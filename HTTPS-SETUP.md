# HTTPS 開發環境設定指南

本文件說明如何為 iOS 陀螺儀功能設定 HTTPS 開發環境。

---

## 為什麼需要 HTTPS？

**iOS 13+ 的 DeviceOrientation API 需要 HTTPS 才能請求陀螺儀權限。**

### 影響範圍

| 環境 | 滑鼠 Hover 效果 | 陀螺儀效果 |
|------|----------------|-----------|
| HTTP (localhost) | ✅ 可用 | ❌ 權限被拒絕 |
| HTTPS (localhost) | ✅ 可用 | ✅ 完全可用 |
| HTTPS (生產環境) | ✅ 可用 | ✅ 完全可用 |

---

## 快速開始

### 方法 1: 使用 npm 指令（推薦）

```bash
# 1. 產生 SSL 憑證
bun run cert:generate

# 2. 啟動 HTTPS 開發伺服器
bun run dev:https
```

### 方法 2: 使用腳本

```bash
# 1. 產生 SSL 憑證
./scripts/generate-cert.sh

# 2. 啟動 HTTPS 開發伺服器
bun run dev:https
```

---

## 詳細步驟

### 步驟 1: 產生自簽 SSL 憑證

執行憑證產生腳本：

```bash
bun run cert:generate
```

腳本會自動：
- ✅ 檢查 openssl 是否安裝
- ✅ 建立 `.cert/` 目錄
- ✅ 產生 SSL 憑證（有效期 365 天）
- ✅ 設定正確的檔案權限
- ✅ 顯示完整的使用說明

**產生的檔案：**
- `.cert/localhost.pem` - SSL 憑證
- `.cert/localhost-key.pem` - SSL 私鑰

### 步驟 2: 啟動 HTTPS 開發伺服器

```bash
bun run dev:https
```

伺服器會在以下位置啟動：
- **本機**: https://localhost:3000
- **網路**: https://192.168.1.x:3000

### 步驟 3: 在瀏覽器中接受憑證

#### 桌面瀏覽器

**Chrome / Edge:**
1. 開啟 https://localhost:3000
2. 點擊「進階」
3. 點擊「繼續前往 localhost (不安全)」

**Safari:**
1. 開啟 https://localhost:3000
2. 點擊「顯示詳細資料」
3. 點擊「瀏覽此網站」

**Firefox:**
1. 開啟 https://localhost:3000
2. 點擊「進階」
3. 點擊「接受風險並繼續」

#### 行動裝置

**iOS Safari:**
1. 確保手機與電腦在同一網路
2. 開啟 https://192.168.1.x:3000（將 x 替換為實際 IP）
3. 點擊「顯示詳細資料」
4. 點擊「瀏覽此網站」
5. 再次確認「瀏覽此網站」

**Android Chrome:**
1. 確保手機與電腦在同一網路
2. 開啟 https://192.168.1.x:3000
3. 點擊「進階」
4. 點擊「繼續前往」

### 步驟 4: 測試陀螺儀功能

在手機瀏覽器開啟測試頁面：

```
https://192.168.1.x:3000/test-gyro
```

測試頁面功能：
- 📱 顯示裝置資訊（iOS 偵測、HTTPS 狀態）
- 🔐 陀螺儀權限狀態即時顯示
- 📊 陀螺儀資料視覺化（alpha、beta、gamma）
- 🎯 3D 傾斜預覽
- 🐛 診斷工具

---

## 常見問題

### Q: 如何找到我的 IP 位址？

**macOS:**
```bash
ipconfig getifaddr en0
```

**Linux:**
```bash
hostname -I | awk '{print $1}'
```

**Windows:**
```bash
ipconfig
```

憑證產生腳本會自動顯示你的網路 IP。

### Q: 憑證過期怎麼辦？

憑證有效期為 365 天。過期後重新執行：

```bash
bun run cert:generate
```

腳本會偵測到現有憑證並詢問是否覆蓋。

### Q: 可以在生產環境使用這個憑證嗎？

**不可以！** 此憑證僅供開發使用。

生產環境請使用正式 SSL 憑證：
- ✅ Let's Encrypt（免費）
- ✅ Cloudflare（免費）
- ✅ Vercel（自動提供 HTTPS）

### Q: 為什麼瀏覽器顯示「不安全」警告？

這是正常的！因為憑證是自簽的，瀏覽器無法驗證其真實性。在開發環境中這是可接受的，但**絕不可在生產環境使用**。

### Q: 憑證會被提交到 Git 嗎？

不會。`.gitignore` 已包含 `*.pem` 規則，憑證檔案不會被版本控制。

### Q: 可以只使用 HTTP 開發嗎？

可以，但會有限制：

| 功能 | HTTP | HTTPS |
|------|------|-------|
| 桌面滑鼠效果 | ✅ | ✅ |
| 行動陀螺儀效果 | ❌ | ✅ |
| 視覺效果（光澤/陰影） | ✅ | ✅ |

如果不需要測試陀螺儀，可使用：
```bash
bun run dev  # HTTP 模式
```

---

## 檔案結構

```
tarot-card-nextjs-app/
├── .cert/                        # SSL 憑證目錄（git ignored）
│   ├── localhost.pem            # SSL 憑證
│   ├── localhost-key.pem        # SSL 私鑰
│   └── README.md                # 憑證說明
├── scripts/
│   ├── generate-cert.sh         # 憑證產生腳本
│   └── README.md                # 腳本說明
├── server.mjs                   # HTTPS 開發伺服器
└── HTTPS-SETUP.md              # 本文件
```

---

## 進階配置

### 自訂憑證設定

編輯 `scripts/generate-cert.sh` 修改以下變數：

```bash
DAYS_VALID=365        # 憑證有效期（天）
COMMON_NAME="localhost"  # 憑證 Common Name
```

### 自訂 HTTPS 埠號

編輯 `server.mjs` 修改：

```javascript
const port = 3000  // 改為你想要的埠號
```

### 支援多個網域

產生支援多個網域的憑證：

```bash
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:*.local,IP:192.168.1.x" \
  -keyout .cert/localhost-key.pem \
  -out .cert/localhost.pem
```

---

## 故障排除

### 問題 1: 陀螺儀權限仍被拒絕

**檢查項目：**
1. 確認使用 HTTPS（URL 以 `https://` 開頭）
2. 確認已接受憑證警告
3. 確認測試頁面顯示 `HTTPS: 是`
4. 確認 iOS Safari 設定未阻擋「動作與方向」

**解決步驟：**
1. 清除 Safari 快取：設定 → Safari → 清除歷史記錄與網站資料
2. 重新載入頁面
3. 再次請求權限

### 問題 2: 憑證無法產生

**檢查 openssl 是否安裝：**
```bash
which openssl
openssl version
```

**安裝 openssl：**
- macOS: `brew install openssl`
- Ubuntu: `sudo apt-get install openssl`
- CentOS: `sudo yum install openssl`

### 問題 3: HTTPS 伺服器無法啟動

**檢查憑證檔案是否存在：**
```bash
ls -la .cert/
```

應該看到：
- `localhost.pem`
- `localhost-key.pem`

**重新產生憑證：**
```bash
bun run cert:generate
```

### 問題 4: 手機無法連線

**檢查網路：**
1. 確認手機與電腦在同一 Wi-Fi 網路
2. 確認防火牆未阻擋 3000 埠

**macOS 允許埠號：**
```bash
# 暫時允許（重啟後失效）
sudo pfctl -d  # 停用防火牆
```

---

## 安全性最佳實踐

### 開發環境 ✅
- ✅ 使用自簽憑證
- ✅ 憑證不提交至 Git
- ✅ 僅在本機網路使用
- ✅ 接受瀏覽器警告

### 生產環境 ✅
- ✅ 使用正式 SSL 憑證（Let's Encrypt、Cloudflare）
- ✅ 憑證由可信任的 CA 簽發
- ✅ 定期更新憑證
- ✅ 啟用 HSTS（HTTP Strict Transport Security）

### 絕對禁止 ❌
- ❌ 在生產環境使用自簽憑證
- ❌ 將私鑰提交至版本控制
- ❌ 在公開網路分享自簽憑證
- ❌ 使用弱加密算法（RSA < 2048 bits）

---

## 相關資源

### 文件
- [3D 卡片傾斜效果開發指南](docs/3D-TILT-DEVELOPMENT.md)
- [憑證目錄說明](.cert/README.md)
- [腳本文件](scripts/README.md)

### 外部連結
- [iOS DeviceOrientation API 文件](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent)
- [Let's Encrypt](https://letsencrypt.org/)
- [mkcert - 本機 HTTPS 工具](https://github.com/FiloSottile/mkcert)

---

## 貢獻

如有問題或建議，請開啟 GitHub Issue。

---

**文件版本：** 1.0
**最後更新：** 2025-10-09
**維護者：** Wasteland Tarot Project
