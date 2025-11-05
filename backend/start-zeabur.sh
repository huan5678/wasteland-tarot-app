#!/bin/bash
# Zeabur Startup Script for Wasteland Tarot Backend
# Handles PORT environment variable and production settings

set -e

# Default values
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"
WORKERS="${WORKERS:-2}"
LOG_LEVEL="${LOG_LEVEL:-warning}"

# Convert LOG_LEVEL to lowercase (uvicorn requires lowercase)
LOG_LEVEL=$(echo "$LOG_LEVEL" | tr '[:upper:]' '[:lower:]')

echo "🚀 Starting Wasteland Tarot Backend on Zeabur"
echo "   Host: $HOST"
echo "   Port: $PORT"
echo "   Workers: $WORKERS"
echo "   Log Level: $LOG_LEVEL"
echo ""

# Start uvicorn
exec uvicorn app.main:app \
    --host "$HOST" \
    --port "$PORT" \
    --workers "$WORKERS" \
    --log-level "$LOG_LEVEL" \
    --no-access-log
