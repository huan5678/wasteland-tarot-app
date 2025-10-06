#!/bin/bash

# Codebase 清理腳本 - 移除過時的總結文件和測試檔案
# 執行前請先備份重要檔案

set -e

echo "🧹 開始清理 Codebase..."
echo ""

# 建立備份目錄
BACKUP_DIR=".archive/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📦 備份目錄: $BACKUP_DIR"
echo ""

# ============================================================================
# 1. 清理根目錄的總結文件 (保留重要文件)
# ============================================================================
echo "🗑️  清理根目錄總結文件..."

# 要刪除的文件列表
ROOT_CLEANUP_FILES=(
  "ACCESSIBILITY_AUDIT_REPORT.md"
  "AUDIO_TEST_SUMMARY.md"
  "AUDIO_USAGE_GUIDE.md"
  "COMPLETE_TESTING_REPORT.md"
  "COMPONENT_CLEANUP_PLAN.md"
  "DOTO_FONT_GUIDE.md"
  "DOTO_FONT_SUMMARY.md"
  "E2E_TESTING_GUIDE.md"
  "FINAL_REFACTORING_AND_FIXES_REPORT.md"
  "FRONTEND_PERFORMANCE_GUIDE.md"
  "FRONTEND_TESTING_GUIDE.md"
  "LOGGING_INTEGRATION_SUMMARY.md"
  "PHASE4_PROGRESS_REPORT.md"
  "REFACTORING_REPORT.md"
  "STREAMING_FEATURE_SUMMARY.md"
  "SUPABASE_MIGRATION_SUMMARY.md"
  "TASK_10.1_COMPLETION_SUMMARY.md"
  "TASK_10.2_COMPLETION_SUMMARY.md"
  "TASK_10.3_COMPLETION_SUMMARY.md"
  "TEST-SUMMARY.md"
  "TESTING_GUIDE.md"
  "TEST_SUITE_SUMMARY.md"
  "WEB_AUDIO_IMPLEMENTATION_SUMMARY.md"
)

for file in "${ROOT_CLEANUP_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  - 移除: $file"
    mv "$file" "$BACKUP_DIR/"
  fi
done

echo ""

# ============================================================================
# 2. 清理後端總結文件
# ============================================================================
echo "🗑️  清理後端總結文件..."

BACKEND_CLEANUP_FILES=(
  "backend/AI_IMPLEMENTATION_SUMMARY.md"
  "backend/AI_SETUP_GUIDE.md"
  "backend/ANALYTICS_IMPLEMENTATION_SUMMARY.md"
  "backend/API_TEST_REPORT.md"
  "backend/BACKEND_TEST_REPORT.md"
  "backend/COMPLETE_BACKEND_SUMMARY.md"
  "backend/COMPREHENSIVE_TEST_SUMMARY.md"
  "backend/COMPREHENSIVE_VALIDATION_REPORT.md"
  "backend/DATABASE_MIGRATION_GUIDE.md"
  "backend/ENHANCED_TEST_SUMMARY.md"
  "backend/FINAL_TEST_REPORT.md"
  "backend/IMPLEMENTATION_SUMMARY.md"
  "backend/INTEGRATION_SUMMARY.md"
  "backend/PERFORMANCE_OPTIMIZATION_GUIDE.md"
  "backend/PHASE2_BACKEND_COMPLETE_SUMMARY.md"
  "backend/QUICK_FIX_GUIDE.md"
  "backend/REFACTOR_REPORT.md"
  "backend/SCHEDULER_IMPLEMENTATION_SUMMARY.md"
  "backend/SCHEMA_FIX_REPORT.md"
  "backend/SCHEMA_FIX_SUMMARY.md"
  "backend/SUPABASE_CONNECTION_GUIDE.md"
  "backend/TASK_12_13_SUMMARY.md"
  "backend/TASK_14_20_SUMMARY.md"
  "backend/TASK_18_22_SUMMARY.md"
  "backend/TASK_22_LOGOUT_SUMMARY.md"
  "backend/TASK_23_27_TEST_SUMMARY.md"
  "backend/TASK_28_30_SUMMARY.md"
  "backend/TESTING_COMPREHENSIVE_GUIDE.md"
  "backend/TESTING_GUIDE.md"
  "backend/TESTING_REPORT.md"
  "backend/TEST_FILES_SUMMARY.md"
  "backend/TEST_GUIDE.md"
  "backend/TEST_IMPLEMENTATION_SUMMARY.md"
  "backend/TEST_STATUS_REPORT.md"
  "backend/TEST_SUMMARY.md"
)

for file in "${BACKEND_CLEANUP_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  - 移除: $file"
    mv "$file" "$BACKUP_DIR/"
  fi
done

echo ""

# ============================================================================
# 3. 清理過時的測試檔案
# ============================================================================
echo "🗑️  清理過時的測試檔案..."

OBSOLETE_TEST_FILES=(
  "backend/quick_test.py"
  "backend/manual_test.py"
  "backend/simple_test.py"
  "backend/test_runner.py"
  "backend/quick_test_validation.py"
  "backend/tests/test_runner.py"
  "backend/QUICK_TEST_RESULTS.txt"
)

for file in "${OBSOLETE_TEST_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  - 移除: $file"
    mv "$file" "$BACKUP_DIR/"
  fi
done

echo ""

# ============================================================================
# 4. 清理測試結果檔案
# ============================================================================
echo "🗑️  清理測試結果檔案..."

if [ -f "backend/test_results_*.json" ]; then
  echo "  - 移除: backend/test_results_*.json"
  mv backend/test_results_*.json "$BACKUP_DIR/" 2>/dev/null || true
fi

echo ""

# ============================================================================
# 5. 統計與總結
# ============================================================================
echo "✅ 清理完成！"
echo ""
echo "📊 清理統計:"
echo "  - 備份位置: $BACKUP_DIR"
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR" | wc -l)
echo "  - 已備份檔案數量: $BACKUP_COUNT"
echo ""
echo "💡 提示:"
echo "  - 所有檔案已備份至 $BACKUP_DIR"
echo "  - 如需復原，請手動從備份目錄複製回來"
echo "  - 確認無問題後，可刪除備份目錄: rm -rf $BACKUP_DIR"
echo ""
