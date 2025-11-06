#!/bin/bash
# 測試腳本：查看傳入狀態列的 JSON 資料

input=$(cat)
echo "=== 完整 JSON 輸入 ===" >&2
echo "$input" | jq '.' >&2
echo "" >&2

echo "=== 可用的 keys ===" >&2
echo "$input" | jq 'keys' >&2
echo "" >&2

echo "=== workspace 資訊 ===" >&2
echo "$input" | jq '.workspace' >&2
echo "" >&2

echo "=== context 資訊 ===" >&2
echo "$input" | jq '.context // "無 context 資訊"' >&2
echo "" >&2

echo "=== model 資訊 ===" >&2
echo "$input" | jq '.model // "無 model 資訊"' >&2
echo "" >&2

echo "=== usage 資訊 ===" >&2
echo "$input" | jq '.usage // "無 usage 資訊"' >&2
echo "" >&2

# 輸出簡單的狀態列（避免錯誤）
echo "測試完成 - 請查看上方輸出"
