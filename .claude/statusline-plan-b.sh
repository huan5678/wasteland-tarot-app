#!/bin/bash

# 讀取 JSON 輸入
input=$(cat)

# 提取基本資訊
cwd=$(echo "$input" | jq -r '.workspace.current_dir // .workspace.project_dir // "."')
project_dir=$(echo "$input" | jq -r '.workspace.project_dir // "."')
username=$(whoami)
hostname=$(hostname -s)
path=$(basename "$cwd")
time=$(date +%H:%M:%S)

# 提取模型和 transcript 路徑
model_id=$(echo "$input" | jq -r '.model.id // empty')
transcript_path=$(echo "$input" | jq -r '.transcript_path // empty')

# Token 上限
token_limit=200000

# 方案 B：從 transcript 最新 message 計算真實 tokens
if [ -n "$transcript_path" ] && [ -f "$transcript_path" ]; then
    # 使用快取（基於文件修改時間）
    cache_file="/tmp/claude_token_planb_$(echo "$transcript_path" | md5).cache"
    transcript_mtime=$(stat -f %m "$transcript_path" 2>/dev/null || echo 0)

    # 檢查快取
    if [ -f "$cache_file" ]; then
        cache_mtime=$(cat "$cache_file" | jq -r '.mtime // 0' 2>/dev/null || echo 0)
        if [ "$cache_mtime" = "$transcript_mtime" ]; then
            # 使用快取
            total_tokens=$(cat "$cache_file" | jq -r '.tokens // 0' 2>/dev/null || echo 0)
        else
            # 重新計算
            last_usage=$(tail -20 "$transcript_path" | jq -s 'map(select(.message.usage)) | reverse | .[0].message.usage' 2>/dev/null)
            cache_read=$(echo "$last_usage" | jq '.cache_read_input_tokens // 0' 2>/dev/null || echo 0)
            cache_creation=$(echo "$last_usage" | jq '.cache_creation_input_tokens // 0' 2>/dev/null || echo 0)
            input_tokens=$(echo "$last_usage" | jq '.input_tokens // 0' 2>/dev/null || echo 0)
            total_tokens=$((cache_read + cache_creation + input_tokens))

            # 儲存快取
            echo "{\"mtime\":$transcript_mtime,\"tokens\":$total_tokens}" > "$cache_file" 2>/dev/null
        fi
    else
        # 無快取，計算並儲存
        last_usage=$(tail -20 "$transcript_path" | jq -s 'map(select(.message.usage)) | reverse | .[0].message.usage' 2>/dev/null)
        cache_read=$(echo "$last_usage" | jq '.cache_read_input_tokens // 0' 2>/dev/null || echo 0)
        cache_creation=$(echo "$last_usage" | jq '.cache_creation_input_tokens // 0' 2>/dev/null || echo 0)
        input_tokens=$(echo "$last_usage" | jq '.input_tokens // 0' 2>/dev/null || echo 0)
        total_tokens=$((cache_read + cache_creation + input_tokens))

        echo "{\"mtime\":$transcript_mtime,\"tokens\":$total_tokens}" > "$cache_file" 2>/dev/null
    fi

    # 計算百分比和格式化
    if [ "$total_tokens" -gt 0 ]; then
        percentage=$(awk "BEGIN {printf \"%.0f\", ($total_tokens / $token_limit) * 100}")

        # 格式化為 k
        if [ "$total_tokens" -ge 1000 ]; then
            tokens_k=$(awk "BEGIN {printf \"%.1f\", $total_tokens / 1000}")
            tokens_display="${tokens_k}k"
        else
            tokens_display="$total_tokens"
        fi

        # 根據百分比設定顏色
        if [ "$percentage" -lt 60 ]; then
            token_color="\033[1;32m"  # 綠色
        elif [ "$percentage" -lt 80 ]; then
            token_color="\033[1;33m"  # 黃色
        else
            token_color="\033[1;31m"  # 紅色
        fi

        token_info="${token_color}${tokens_display}/200k tokens (${percentage}%)\033[0m"
        token_calculated=true
    fi
fi

# 如果計算失敗，顯示未知
if [ -z "$token_calculated" ]; then
    token_info="\033[2mtoken 使用量未知\033[0m"
fi

# 模型資訊行
if [ -n "$model_id" ]; then
    model_line="\033[1;35m$model_id\033[0m · $token_info"
else
    model_line="$token_info"
fi

# 切換到工作目錄
cd "$cwd" 2>/dev/null || cd "$project_dir" 2>/dev/null

# Git 資訊（branch + ahead/behind）
if git rev-parse --git-dir >/dev/null 2>&1; then
    branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo 'detached')
    upstream=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null)

    if [ -n "$upstream" ]; then
        ahead=$(git rev-list --count HEAD ^"$upstream" 2>/dev/null || echo '0')
        behind=$(git rev-list --count "$upstream" ^HEAD 2>/dev/null || echo '0')
        git_info=" \033[1;35m[$branch"
        [ "$ahead" -gt 0 ] && git_info="$git_info \033[1;32m↑$ahead\033[1;35m"
        [ "$behind" -gt 0 ] && git_info="$git_info \033[1;31m↓$behind\033[1;35m"
        git_info="$git_info]\033[0m"
    else
        git_info=" \033[1;35m[$branch]\033[0m"
    fi
else
    git_info=''
fi

# 組合輸出
line1="$model_line"
line2="\033[1;36m$username@$hostname\033[0m \033[1;33m$path\033[0m$git_info \033[1;34m$time\033[0m"

# 輸出兩行
printf "%b\n%b\n" "$line1" "$line2"
