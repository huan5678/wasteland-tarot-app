# 專案腳本目錄

此目錄包含各種開發與部署腳本。

## 可用腳本

### 🔐 generate-cert.sh

快速產生 HTTPS 開發用自簽 SSL 憑證。

**用途：**
- 為開發環境產生自簽 SSL 憑證
- iOS 13+ 的 DeviceOrientation API 需要 HTTPS
- 支援手機陀螺儀權限測試

**使用方式：**
```bash
# 執行腳本
./scripts/generate-cert.sh

# 或從專案根目錄
bash scripts/generate-cert.sh
```

**功能：**
- ✅ 自動檢查 openssl 是否安裝
- ✅ 建立 `.cert/` 目錄
- ✅ 產生 SSL 憑證與私鑰（有效期 365 天）
- ✅ 偵測並詢問是否覆蓋現有憑證
- ✅ 顯示憑證詳細資訊
- ✅ 提供完整使用說明
- ✅ 自動設定正確的檔案權限
- ✅ 彩色輸出與友善介面

**輸出檔案：**
- `.cert/localhost.pem` - SSL 憑證
- `.cert/localhost-key.pem` - SSL 私鑰

**後續步驟：**
1. 啟動 HTTPS 開發伺服器：`bun run dev:https`
2. 在手機開啟：`https://[你的IP]:3000/test-gyro`
3. 接受憑證警告
4. 測試陀螺儀權限

**注意事項：**
- ⚠️ 僅供開發使用，不可用於生產環境
- ⚠️ 私鑰已自動加入 `.gitignore`，不會被提交
- ⚠️ 憑證有效期為 365 天，過期後需重新產生

---

## 腳本開發指南

### 建立新腳本

1. 在此目錄建立新的 `.sh` 檔案
2. 加入 shebang：`#!/bin/bash`
3. 加入說明註解（用途、作者、日期）
4. 設定可執行權限：`chmod +x scripts/your-script.sh`
5. 更新此 README 文件

### 腳本規範

- 使用 `set -e` 確保錯誤時退出
- 使用彩色輸出提升可讀性
- 提供清楚的錯誤訊息
- 加入進度指示與完成確認
- 遵循 POSIX shell 標準

### 顏色定義範例

```bash
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}✓ 成功${NC}"
echo -e "${YELLOW}⚠ 警告${NC}"
echo -e "${RED}✗ 錯誤${NC}"
echo -e "${BLUE}→ 資訊${NC}"
```

---

## 相關文件

- [3D 傾斜效果開發指南](../docs/3D-TILT-DEVELOPMENT.md)
- [SSL 憑證說明](../.cert/README.md)
