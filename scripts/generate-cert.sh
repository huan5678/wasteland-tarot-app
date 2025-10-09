#!/bin/bash

#############################################################################
# SSL 自簽憑證產生腳本
#
# 用途：為開發環境產生自簽 SSL 憑證（iOS 陀螺儀 API 需要 HTTPS）
# 使用：./scripts/generate-cert.sh
#
# 作者：Wasteland Tarot Project
# 日期：2025-10-09
#############################################################################

set -e  # 遇到錯誤立即退出

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 設定變數
CERT_DIR=".cert"
CERT_FILE="localhost.pem"
KEY_FILE="localhost-key.pem"
DAYS_VALID=365
COMMON_NAME="localhost"

# 顯示標題
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}    SSL 自簽憑證產生器${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 檢查 openssl 是否安裝
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}✗ 錯誤：找不到 openssl 指令${NC}"
    echo -e "${YELLOW}  請先安裝 openssl:${NC}"
    echo -e "${YELLOW}    macOS:   brew install openssl${NC}"
    echo -e "${YELLOW}    Ubuntu:  sudo apt-get install openssl${NC}"
    echo -e "${YELLOW}    CentOS:  sudo yum install openssl${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 找到 openssl: $(openssl version)${NC}"
echo ""

# 檢查憑證目錄是否存在
if [ -d "$CERT_DIR" ]; then
    echo -e "${YELLOW}⚠ 憑證目錄已存在: $CERT_DIR${NC}"

    # 檢查是否已有憑證
    if [ -f "$CERT_DIR/$CERT_FILE" ] && [ -f "$CERT_DIR/$KEY_FILE" ]; then
        echo -e "${YELLOW}⚠ 發現現有憑證:${NC}"
        echo -e "  - $CERT_DIR/$CERT_FILE"
        echo -e "  - $CERT_DIR/$KEY_FILE"
        echo ""

        # 顯示憑證資訊
        echo -e "${BLUE}現有憑證資訊:${NC}"
        openssl x509 -in "$CERT_DIR/$CERT_FILE" -noout -subject -dates 2>/dev/null || true
        echo ""

        # 詢問是否覆蓋
        read -p "$(echo -e ${YELLOW}是否要覆蓋現有憑證？ [y/N]: ${NC})" -n 1 -r
        echo ""

        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}✓ 保留現有憑證，取消產生${NC}"
            exit 0
        fi

        echo -e "${YELLOW}→ 將覆蓋現有憑證...${NC}"
        rm -f "$CERT_DIR/$CERT_FILE" "$CERT_DIR/$KEY_FILE"
    fi
else
    echo -e "${BLUE}→ 建立憑證目錄: $CERT_DIR${NC}"
    mkdir -p "$CERT_DIR"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}    產生憑證${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 產生憑證
echo -e "${BLUE}→ 產生 SSL 憑證與私鑰...${NC}"
echo -e "  Common Name: ${GREEN}$COMMON_NAME${NC}"
echo -e "  有效期限: ${GREEN}$DAYS_VALID 天${NC}"
echo ""

# 執行 openssl 指令
openssl req \
    -x509 \
    -newkey rsa:2048 \
    -nodes \
    -sha256 \
    -days $DAYS_VALID \
    -subj "/CN=$COMMON_NAME" \
    -keyout "$CERT_DIR/$KEY_FILE" \
    -out "$CERT_DIR/$CERT_FILE" \
    2>&1 | grep -v "^\.\..*" || true  # 過濾掉 openssl 的點點點輸出

echo ""

# 驗證憑證檔案
if [ ! -f "$CERT_DIR/$CERT_FILE" ] || [ ! -f "$CERT_DIR/$KEY_FILE" ]; then
    echo -e "${RED}✗ 錯誤：憑證產生失敗${NC}"
    exit 1
fi

# 設定檔案權限（私鑰應該只有擁有者可讀）
chmod 600 "$CERT_DIR/$KEY_FILE"
chmod 644 "$CERT_DIR/$CERT_FILE"

echo -e "${GREEN}✓ 憑證產生成功！${NC}"
echo ""

# 顯示憑證資訊
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}    憑證資訊${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 取得憑證詳細資訊
SUBJECT=$(openssl x509 -in "$CERT_DIR/$CERT_FILE" -noout -subject | sed 's/subject=//')
NOT_BEFORE=$(openssl x509 -in "$CERT_DIR/$CERT_FILE" -noout -startdate | sed 's/notBefore=//')
NOT_AFTER=$(openssl x509 -in "$CERT_DIR/$CERT_FILE" -noout -enddate | sed 's/notAfter=//')

echo -e "${GREEN}憑證主體:${NC} $SUBJECT"
echo -e "${GREEN}生效日期:${NC} $NOT_BEFORE"
echo -e "${GREEN}到期日期:${NC} $NOT_AFTER"
echo ""

# 顯示檔案位置
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}    檔案位置${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${GREEN}SSL 憑證:${NC} $CERT_DIR/$CERT_FILE"
echo -e "${GREEN}私鑰:${NC}     $CERT_DIR/$KEY_FILE"
echo ""

# 顯示檔案大小
CERT_SIZE=$(ls -lh "$CERT_DIR/$CERT_FILE" | awk '{print $5}')
KEY_SIZE=$(ls -lh "$CERT_DIR/$KEY_FILE" | awk '{print $5}')

echo -e "${BLUE}憑證大小:${NC} $CERT_SIZE"
echo -e "${BLUE}私鑰大小:${NC} $KEY_SIZE"
echo ""

# 使用說明
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}    使用說明${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${GREEN}1. 啟動 HTTPS 開發伺服器:${NC}"
echo -e "   ${YELLOW}bun run dev:https${NC}"
echo ""

echo -e "${GREEN}2. 在瀏覽器開啟:${NC}"
echo -e "   桌面: ${YELLOW}https://localhost:3000${NC}"
echo -e "   手機: ${YELLOW}https://$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $1}' 2>/dev/null || echo '192.168.1.x'):3000${NC}"
echo ""

echo -e "${GREEN}3. 接受憑證警告:${NC}"
echo -e "   ${BLUE}iOS Safari:${NC}"
echo -e "     • 點擊「顯示詳細資料」"
echo -e "     • 點擊「瀏覽此網站」"
echo -e "     • 再次確認「瀏覽此網站」"
echo ""
echo -e "   ${BLUE}Chrome/Edge:${NC}"
echo -e "     • 點擊「進階」"
echo -e "     • 點擊「繼續前往 localhost (不安全)」"
echo ""

echo -e "${GREEN}4. 測試陀螺儀功能:${NC}"
echo -e "   在手機瀏覽器開啟 ${YELLOW}https://[IP]:3000/test-gyro${NC}"
echo ""

# 安全性提醒
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}    安全性提醒${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}⚠ 此憑證僅供開發使用！${NC}"
echo -e "  ${RED}✗${NC} 不要在生產環境使用"
echo -e "  ${RED}✗${NC} 不要將私鑰提交至版本控制"
echo -e "  ${GREEN}✓${NC} 生產環境請使用正式 SSL 憑證（Let's Encrypt、Cloudflare）"
echo ""

# 檢查 .gitignore
if [ -f ".gitignore" ]; then
    if grep -q "*.pem" .gitignore; then
        echo -e "${GREEN}✓ .gitignore 已包含 *.pem 規則（憑證不會被提交）${NC}"
    else
        echo -e "${YELLOW}⚠ 建議在 .gitignore 加入 *.pem 規則${NC}"
        echo -e "  執行: ${BLUE}echo '*.pem' >> .gitignore${NC}"
    fi
else
    echo -e "${YELLOW}⚠ 找不到 .gitignore 檔案${NC}"
fi

echo ""
echo -e "${GREEN}✓ 完成！${NC}"
echo ""
