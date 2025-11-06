#!/bin/bash
# Debug script to see what JSON structure statusline receives

input=$(cat)
echo "$input" | jq '.' > /tmp/statusline-debug.json
echo "Debug output saved to /tmp/statusline-debug.json"
echo "Preview:"
echo "$input" | jq -r 'keys'
