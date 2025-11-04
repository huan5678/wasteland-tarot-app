#!/usr/bin/env python3
"""
測試 Chirp 3:HD API 的腳本
驗證所有修復是否正常運作
"""

import requests
import json

API_BASE = "http://localhost:8000/api/v1/audio"

def test_basic_synthesis():
    """測試基本語音合成"""
    print("=" * 60)
    print("測試 1: 基本語音合成")
    print("=" * 60)
    
    payload = {
        "text": "Welcome to the wasteland. Your journey begins now.",
        "character_key": "vault_dweller",
        "audio_type": "ai_response",
        "cache_enabled": False,
        "return_format": "url"
    }
    
    print(f"請求: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(f"{API_BASE}/synthesize", json=payload)
        print(f"狀態碼: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ 成功!")
            print(f"  語音模型: {data.get('voice_model')}")
            print(f"  語音名稱: {data.get('voice_name')}")
            print(f"  時長: {data.get('duration')}秒")
            print(f"  檔案大小: {data.get('file_size')} bytes")
            print(f"  快取: {data.get('cached')}")
            return True
        else:
            print(f"❌ 失敗: {response.text}")
            return False
    except Exception as e:
        print(f"❌ 錯誤: {e}")
        return False

def test_custom_voice():
    """測試自訂語音"""
    print("\n" + "=" * 60)
    print("測試 2: 自訂語音")
    print("=" * 60)
    
    payload = {
        "text": "Testing custom voice with Algenib star.",
        "character_key": "super_mutant",
        "audio_type": "ai_response",
        "cache_enabled": False,
        "return_format": "url",
        "voice_name": "en-US-Chirp3-HD-Algenib",
        "language_code": "en-US"
    }
    
    print(f"請求: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(f"{API_BASE}/synthesize", json=payload)
        print(f"狀態碼: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ 成功!")
            print(f"  語音名稱: {data.get('voice_name')}")
            print(f"  是否使用了自訂語音: {'Algenib' in data.get('voice_name', '')}")
            return True
        else:
            print(f"❌ 失敗: {response.text}")
            return False
    except Exception as e:
        print(f"❌ 錯誤: {e}")
        return False

def test_chinese_language():
    """測試中文語言"""
    print("\n" + "=" * 60)
    print("測試 3: 中文語言")
    print("=" * 60)
    
    payload = {
        "text": "歡迎來到廢土，你的旅程現在開始。",
        "character_key": "vault_dweller",
        "audio_type": "ai_response",
        "cache_enabled": False,
        "return_format": "url",
        "language_code": "zh-TW"
    }
    
    print(f"請求: {json.dumps(payload, indent=2, ensure_ascii=False)}")
    
    try:
        response = requests.post(f"{API_BASE}/synthesize", json=payload)
        print(f"狀態碼: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ 成功!")
            print(f"  語音名稱: {data.get('voice_name')}")
            print(f"  是否包含中文語言代碼: {'cmn-Hant-TW' in data.get('voice_name', '')}")
            return True
        else:
            print(f"❌ 失敗: {response.text}")
            return False
    except Exception as e:
        print(f"❌ 錯誤: {e}")
        return False

def test_multiple_characters():
    """測試多個不同角色"""
    print("\n" + "=" * 60)
    print("測試 4: 多個不同角色")
    print("=" * 60)
    
    characters = [
        ("super_mutant", "Deep voice test"),
        ("vault_dweller", "Young voice test"),
        ("pip_boy", "Standard voice test")
    ]
    
    results = []
    for char_key, text in characters:
        payload = {
            "text": text,
            "character_key": char_key,
            "audio_type": "ai_response",
            "cache_enabled": False,
            "return_format": "url"
        }
        
        try:
            response = requests.post(f"{API_BASE}/synthesize", json=payload)
            if response.status_code == 200:
                data = response.json()
                voice_name = data.get('voice_name', '')
                results.append((char_key, voice_name, True))
                print(f"  {char_key}: ✅ {voice_name}")
            else:
                results.append((char_key, None, False))
                print(f"  {char_key}: ❌ {response.status_code}")
        except Exception as e:
            results.append((char_key, None, False))
            print(f"  {char_key}: ❌ {e}")
    
    # 檢查所有語音名稱是否不同
    voice_names = [v for _, v, success in results if success and v]
    unique_voices = len(set(voice_names))
    
    print(f"\n  總共測試: {len(characters)} 個角色")
    print(f"  成功: {sum(1 for _, _, s in results if s)} 個")
    print(f"  不同語音: {unique_voices} 個")
    print(f"  結果: {'✅ 通過' if unique_voices == len(characters) else '❌ 失敗'}")
    
    return unique_voices == len(characters)

if __name__ == "__main__":
    print("開始測試 Chirp 3:HD API...")
    print("請確保後端服務器正在運行 (http://localhost:8000)")
    print()
    
    tests = [
        test_basic_synthesis,
        test_custom_voice,
        test_chinese_language,
        test_multiple_characters
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except KeyboardInterrupt:
            print("\n\n測試被中斷")
            break
        except Exception as e:
            print(f"\n測試執行錯誤: {e}")
            results.append(False)
    
    print("\n" + "=" * 60)
    print("測試總結")
    print("=" * 60)
    print(f"總共: {len(results)} 個測試")
    print(f"通過: {sum(results)} 個")
    print(f"失敗: {len(results) - sum(results)} 個")
    
    if all(results):
        print("\n🎉 所有測試通過!")
    else:
        print("\n⚠️  部分測試失敗，請檢查日誌")
