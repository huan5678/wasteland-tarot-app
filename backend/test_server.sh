#!/bin/bash
# 測試伺服器啟動腳本

source .venv/bin/activate
timeout 3 ./start.sh dev 2>&1 | head -30
