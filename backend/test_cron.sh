#!/bin/bash
# Quick test script for Tasks Reset Cron Job
# 快速測試任務重置 Cron Job

echo "=========================================="
echo "Tasks Reset Cron Job - Quick Test"
echo "=========================================="
echo ""

# Get project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "Project root: $PROJECT_ROOT"
echo ""

# Test 1: Check if uv is installed
echo "[1/4] Checking uv installation..."
if ! command -v uv &> /dev/null; then
    echo "❌ ERROR: uv is not installed"
    echo "   Please install uv first: https://github.com/astral-sh/uv"
    exit 1
fi
echo "✅ uv found: $(which uv)"
echo ""

# Test 2: Check if script exists
echo "[2/4] Checking cron script..."
SCRIPT_PATH="$PROJECT_ROOT/backend/app/scripts/reset_tasks_cron.py"
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ ERROR: Script not found at $SCRIPT_PATH"
    exit 1
fi
echo "✅ Script found: $SCRIPT_PATH"
echo ""

# Test 3: Check if logs directory exists
echo "[3/4] Checking logs directory..."
LOGS_DIR="$PROJECT_ROOT/backend/logs"
if [ ! -d "$LOGS_DIR" ]; then
    echo "⚠️  WARNING: Logs directory not found, creating it..."
    mkdir -p "$LOGS_DIR"
fi
echo "✅ Logs directory ready: $LOGS_DIR"
echo ""

# Test 4: Run the script
echo "[4/4] Testing script execution..."
echo ""
echo "--- Testing --help ---"
cd "$PROJECT_ROOT/backend" && uv run python app/scripts/reset_tasks_cron.py --help
echo ""

# Ask user which test to run
echo "=========================================="
echo "Select test to run:"
echo "  1) Test daily reset (--daily)"
echo "  2) Test weekly reset (--weekly)"
echo "  3) Skip actual test"
echo "=========================================="
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo ""
        echo "--- Running Daily Reset Test ---"
        cd "$PROJECT_ROOT/backend" && uv run python app/scripts/reset_tasks_cron.py --daily
        echo ""
        echo "✅ Daily reset test completed!"
        ;;
    2)
        echo ""
        echo "--- Running Weekly Reset Test ---"
        cd "$PROJECT_ROOT/backend" && uv run python app/scripts/reset_tasks_cron.py --weekly
        echo ""
        echo "✅ Weekly reset test completed!"
        ;;
    3)
        echo ""
        echo "⏭️  Skipping actual test"
        ;;
    *)
        echo ""
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "Next steps:"
echo "=========================================="
echo "1. Review the output above for any errors"
echo "2. Check the logs directory for log files"
echo "3. Set up crontab using: crontab -e"
echo "4. Add the cron jobs from backend/CRON_SETUP.md"
echo ""
echo "For detailed setup instructions, see:"
echo "  backend/CRON_SETUP.md"
echo ""
echo "✅ All tests completed!"
