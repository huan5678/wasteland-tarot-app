#!/usr/bin/env python3
"""
Test script to verify Chirp3-HD voice mapping and language conversion
"""

import sys
import os
sys.path.insert(0, '/home/huan/projects/wasteland-tarot-app/backend')

# Load .env file
from dotenv import load_dotenv
load_dotenv('/home/huan/projects/wasteland-tarot-app/backend/.env')

from app.services.tts_service import TTSService, CHIRP3_VOICE_MAPPING

def test_voice_mapping():
    """Test that all characters have Chirp3-HD voices"""
    print("=" * 60)
    print("Testing Chirp3-HD Voice Mapping")
    print("=" * 60)
    
    service = TTSService()
    
    # Test all characters
    test_characters = [
        'super_mutant', 'vault_dweller', 'ghoul', 'codsworth', 
        'pip_boy', 'raider', 'brotherhood_scribe'
    ]
    
    print(f"\nTotal characters in mapping: {len(CHIRP3_VOICE_MAPPING)}")
    print(f"Testing {len(test_characters)} characters...\n")
    
    for char in test_characters:
        voice = CHIRP3_VOICE_MAPPING.get(char, "NOT_FOUND")
        print(f"  {char:25s} -> {voice}")
    
    print("\n" + "=" * 60)
    print("Testing Language Code Conversion")
    print("=" * 60 + "\n")
    
    # Test language code conversion
    test_languages = [
        'en-US', 'en-GB', 'zh-TW', 'zh-CN', 'ja-JP', 'ko-KR',
        'cmn-TW', 'cmn-CN', 'fr-FR', 'de-DE'
    ]
    
    for lang in test_languages:
        converted = service._convert_to_chirp_language_code(lang)
        supported = service._is_chirp3_language_supported(converted)
        status = "✓ SUPPORTED" if supported else "✗ NOT SUPPORTED"
        if lang != converted:
            print(f"  {lang:10s} -> {converted:15s} {status}")
        else:
            print(f"  {lang:10s} -> (no change)      {status}")
    
    print("\n" + "=" * 60)
    print("Testing Voice Router")
    print("=" * 60 + "\n")
    
    # Test router decision
    from app.services.tts_service import VoiceModelRouter
    router = VoiceModelRouter()
    
    test_chars = ['super_mutant', 'vault_dweller', 'pip_boy']
    for char in test_chars:
        should_use = router.should_use_chirp3(char)
        model = router.get_voice_model(char)
        print(f"  {char:25s} -> Use Chirp3: {str(should_use):5s} -> Model: {model.value}")
    
    print("\n" + "=" * 60)
    print("Testing Voice Name Construction")
    print("=" * 60 + "\n")
    
    # Test actual voice name construction for different languages
    test_cases = [
        ('vault_dweller', 'en-US'),
        ('vault_dweller', 'zh-TW'),
        ('vault_dweller', 'cmn-TW'),
        ('super_mutant', 'en-US'),
        ('super_mutant', 'ja-JP'),
    ]
    
    for char, lang in test_cases:
        star_name = CHIRP3_VOICE_MAPPING.get(char, "Unknown")
        converted_lang = service._convert_to_chirp_language_code(lang)
        voice_name = f"{converted_lang}-Chirp3-HD-{star_name}"
        print(f"  {char:20s} + {lang:8s} -> {voice_name}")
    
    print("\n" + "=" * 60)
    print("All tests completed!")
    print("=" * 60)

if __name__ == "__main__":
    test_voice_mapping()
