#!/bin/bash

# 讀取並保存完整 JSON 輸入
input=$(cat)

# 輸出完整 JSON 到檔案以供檢查
echo "$input" | jq '.' > /tmp/claude-statusline-input.json 2>&1

# 嘗試提取各種可能的 token 資訊
echo "=== Debug: JSON Keys ===" >&2
echo "$input" | jq 'keys' >&2
echo "" >&2

echo "=== Debug: Model Info ===" >&2
echo "$input" | jq '.model // .models // empty' >&2
echo "" >&2

echo "=== Debug: Usage/Token Info ===" >&2
echo "$input" | jq '.usage // .tokens // .context // empty' >&2
echo "" >&2

echo "=== Debug: Session Info ===" >&2
echo "$input" | jq '.session // empty' >&2
echo "" >&2

echo "=== Debug: Stats Info ===" >&2
echo "$input" | jq '.stats // empty' >&2
echo "" >&2

# 簡單輸出
echo "Debug 完成 - 請查看 /tmp/claude-statusline-input.json 和上方 stderr 輸出"
echo "完整 JSON 已儲存至: /tmp/claude-statusline-input.json"
