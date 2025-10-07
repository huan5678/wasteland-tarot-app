# 後端伺服器快速啟動指南

## 最簡單的啟動方式

```bash
cd backend
./start.sh
```

就這麼簡單！伺服器會自動：
- ✅ 啟動虛擬環境
- ✅ 檢查配置
- ✅ 清理端口
- ✅ 啟動 FastAPI 伺服器

## 訪問 API 文件

啟動後打開瀏覽器：
- http://localhost:8000/docs （Swagger UI）
- http://localhost:8000/redoc （ReDoc）

## 停止伺服器

按 `Ctrl+C`

## 其他啟動選項

```bash
# 生產模式
./start.sh prod

# 自定義端口
PORT=8080 ./start.sh

# 自定義主機
HOST=127.0.0.1 ./start.sh
```

## 問題排查

如果啟動失敗，檢查：

1. **虛擬環境**
   ```bash
   ls -la .venv/
   ```

2. **環境變數**
   ```bash
   ls -la .env
   ```

3. **端口占用**
   ```bash
   lsof -ti:8000
   ```

詳細文件請參考 `README_SERVER.md`
