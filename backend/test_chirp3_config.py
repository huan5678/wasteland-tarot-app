#!/usr/bin/env python3
"""
測試 Chirp 3:HD 配置
驗證環境變數設定是否正確
"""

import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.config import get_settings

def test_chirp3_config():
    """測試 Chirp 3:HD 配置"""
    print("=" * 80)
    print("CHIRP 3:HD TTS 配置檢查")
    print("=" * 80)
    
    settings = get_settings()
    
    # 檢查 Google Cloud TTS 配置
    print("\n📋 Google Cloud TTS 基本配置:")
    print(f"  ✓ Language Code: {settings.google_tts_language_code}")
    print(f"  ✓ Voice Name: {settings.google_tts_voice_name}")
    print(f"  ✓ Storage Bucket: {settings.supabase_storage_bucket}")
    
    has_credentials = settings.google_cloud_credentials_json is not None
    print(f"  {'✓' if has_credentials else '✗'} Credentials: {'已設定' if has_credentials else '未設定'}")
    
    # 檢查 Chirp 3:HD 功能開關
    print("\n🎵 Chirp 3:HD 功能開關:")
    print(f"  {'✓' if settings.chirp3_enabled else '✗'} CHIRP3_ENABLED: {settings.chirp3_enabled}")
    print(f"  ✓ CHIRP3_ROLLOUT_PERCENTAGE: {settings.chirp3_rollout_percentage}%")
    print(f"  ✓ CHIRP3_ENABLED_CHARACTERS: {settings.chirp3_enabled_characters or '(all)'}")
    print(f"  ✓ CHIRP3_FALLBACK_TO_WAVENET: {settings.chirp3_fallback_to_wavenet}")
    
    # 檢查配置狀態
    print("\n📊 配置狀態:")
    if settings.chirp3_enabled:
        if settings.chirp3_rollout_percentage == 100:
            print("  ✓ Chirp 3:HD 完全啟用 (100% rollout)")
        elif settings.chirp3_rollout_percentage > 0:
            print(f"  ⚠ Chirp 3:HD 部分啟用 ({settings.chirp3_rollout_percentage}% rollout)")
        else:
            print("  ⚠ Chirp 3:HD 已啟用但 rollout 為 0%")
    else:
        print("  ✗ Chirp 3:HD 未啟用 (使用 WaveNet)")
    
    # 檢查語言設定
    print("\n🌐 語言設定:")
    if settings.google_tts_language_code.startswith('en'):
        print(f"  ✓ 使用英文語音: {settings.google_tts_language_code}")
        print("  ✓ 適合 Chirp 3:HD (主要支援英文)")
    else:
        print(f"  ⚠ 使用非英文語音: {settings.google_tts_language_code}")
        print("  ⚠ Chirp 3:HD 目前主要支援英文")
    
    # 總結
    print("\n" + "=" * 80)
    if settings.chirp3_enabled and has_credentials and settings.chirp3_rollout_percentage > 0:
        print("✅ 配置檢查通過！Chirp 3:HD 已正確設定。")
        print("\n下一步：")
        print("  1. 啟動 backend server: python -m app.main")
        print("  2. 測試 TTS API endpoint")
        print("  3. 檢查日誌確認使用 Chirp 3:HD")
    else:
        print("⚠️  配置不完整，請檢查以下項目：")
        if not has_credentials:
            print("  - Google Cloud credentials 未設定")
        if not settings.chirp3_enabled:
            print("  - CHIRP3_ENABLED 未啟用")
        if settings.chirp3_rollout_percentage == 0:
            print("  - CHIRP3_ROLLOUT_PERCENTAGE 為 0")
    print("=" * 80)

if __name__ == "__main__":
    try:
        test_chirp3_config()
    except Exception as e:
        print(f"\n❌ 錯誤: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
