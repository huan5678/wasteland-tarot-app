#!/bin/bash
# 備案腳本：使用 ccusage 計算 token（較快但可能不準確）

# 讀取 JSON 輸入
input=$(cat)

# 提取基本資訊
cwd=$(echo "$input" | jq -r '.workspace.current_dir // .workspace.project_dir // "."')
project_dir=$(echo "$input" | jq -r '.workspace.project_dir // "."')
username=$(whoami)
hostname=$(hostname -s)
path=$(basename "$cwd")
time=$(date +%H:%M:%S)

# 提取模型資訊
model_id=$(echo "$input" | jq -r '.model.id // empty')

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

# 從 ccusage 取得完整統計
ccusage_full=$(echo "$input" | FORCE_COLOR=1 bun x ccusage statusline --visual-burn-rate emoji --context-low-threshold 60 --context-medium-threshold 80 2>/dev/null)

# 提取 token 資訊並重新格式化
if echo "$ccusage_full" | grep -q "🧠"; then
    # 提取數字（去除千位分隔符）
    tokens_num=$(echo "$ccusage_full" | grep -o '🧠 [0-9,]*' | sed 's/🧠 //' | tr -d ',')
    percentage=$(echo "$ccusage_full" | grep -o '([0-9]*%)' | tr -d '()')

    if [ -n "$tokens_num" ] && [ -n "$percentage" ]; then
        # 轉換為 k 格式
        if [ "$tokens_num" -ge 1000 ]; then
            tokens_k=$(awk "BEGIN {printf \"%.1f\", $tokens_num / 1000}")
            tokens_display="${tokens_k}k"
        else
            tokens_display="$tokens_num"
        fi

        # 設定顏色（根據百分比）
        percentage_num=$(echo "$percentage" | tr -d '%')
        if [ "$percentage_num" -lt 60 ]; then
            token_color="\033[1;32m"  # 綠色
        elif [ "$percentage_num" -lt 80 ]; then
            token_color="\033[1;33m"  # 黃色
        else
            token_color="\033[1;31m"  # 紅色
        fi

        token_info="${token_color}${tokens_display}/200k tokens ($percentage)\033[0m \033[2m(ccusage)\033[0m"
    fi
fi

# 如果沒有 token 資訊，使用原始 ccusage 輸出
if [ -z "$token_info" ]; then
    token_info="$ccusage_full"
fi

# 模型資訊行
if [ -n "$model_id" ]; then
    model_line="\033[1;35m$model_id\033[0m · $token_info"
else
    model_line="$token_info"
fi

# 組合輸出
line1="$model_line"
line2="\033[1;36m$username@$hostname\033[0m \033[1;33m$path\033[0m$git_info \033[1;34m$time\033[0m"

# 輸出兩行
printf "%b\n%b\n" "$line1" "$line2"
