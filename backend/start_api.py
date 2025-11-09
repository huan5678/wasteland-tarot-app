#!/usr/bin/env python3
"""
啟動 Swagger Demo API 服務器
Start Swagger Demo API Server
"""

import uvicorn
import os
from dotenv import load_dotenv

# 載入環境變數
load_dotenv()

if __name__ == "__main__":
    print("🚀 啟動廢土塔羅 API 服務器...")
    print("📊 Swagger 文檔: http://localhost:8000/docs")
    print("📋 ReDoc 文檔: http://localhost:8000/redoc")
    print("🔧 健康檢查: http://localhost:8000/health")
    print("=" * 50)

    uvicorn.run(
        "swagger_demo:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 8000)),
        reload=bool(os.getenv("API_RELOAD", True)),
        log_level=os.getenv("LOG_LEVEL", "info").lower()
    )