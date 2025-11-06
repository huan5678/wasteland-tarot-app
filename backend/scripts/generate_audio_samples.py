#!/usr/bin/env python3
"""
Generate Audio Samples for Quality Assessment (Task 3.4)

This script generates audio samples for all 14 characters using both
Chirp 3:HD and WaveNet models for quality comparison.
"""

import asyncio
import json
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, List

from app.services.tts_service import TTSService, VoiceModel
from app.services.tts_service import DEFAULT_VOICE_CONFIGS, CHIRP3_VOICE_MAPPING


# Standard test text for comparison
TEST_TEXT = "Welcome to the Wasteland Tarot. Your cards reveal the path ahead in this post-apocalyptic world."

# Character-specific test texts (optional)
CHARACTER_TEXTS = {
    "pip_boy": "Systems online. Tarot reading initiated. Please select your cards.",
    "vault_dweller": "I've seen many things in the wasteland. Let me help you understand these cards.",
    "wasteland_trader": "These cards are valuable information. Trade wisely, friend.",
    "super_mutant": "Cards show path. Strong path. Follow it.",
    "brotherhood_paladin": "By the order of the Brotherhood, these readings are authorized.",
    "ghoul": "After all these years, I can still read the signs in these cards.",
}


async def generate_audio_samples():
    """Generate audio samples for all characters"""
    print("🎙️  Starting audio sample generation...")
    print(f"📅 Date: {datetime.now().isoformat()}\n")

    # Create output directory
    output_dir = Path("audio_samples")
    output_dir.mkdir(exist_ok=True)

    # Create subdirectories
    chirp3_dir = output_dir / "chirp3_hd"
    wavenet_dir = output_dir / "wavenet"
    chirp3_dir.mkdir(exist_ok=True)
    wavenet_dir.mkdir(exist_ok=True)

    # Initialize TTS service
    tts_service = TTSService()

    if not tts_service.client:
        print("❌ TTS client not initialized. Please check Google Cloud credentials.")
        return

    results = {
        "generated_at": datetime.now().isoformat(),
        "test_text": TEST_TEXT,
        "samples": []
    }

    # Generate samples for each character
    for character_key in DEFAULT_VOICE_CONFIGS.keys():
        print(f"\n📢 Processing {character_key}...")

        # Get character-specific text or use default
        text = CHARACTER_TEXTS.get(character_key, TEST_TEXT)

        # Generate Chirp 3:HD sample
        try:
            print(f"  🎯 Generating Chirp 3:HD sample...")
            chirp3_result = tts_service.synthesize_speech(
                text=text,
                character_key=character_key,
                force_voice_model="chirp3-hd"
            )

            chirp3_filename = f"{character_key}_chirp3.mp3"
            chirp3_path = chirp3_dir / chirp3_filename

            with open(chirp3_path, "wb") as f:
                f.write(chirp3_result["audio_content"])

            print(f"    ✅ Saved: {chirp3_path} ({chirp3_result['file_size']} bytes)")

            results["samples"].append({
                "character": character_key,
                "model": "chirp3-hd",
                "filename": chirp3_filename,
                "file_size": chirp3_result["file_size"],
                "duration": chirp3_result["duration"],
                "voice_name": chirp3_result["voice_name"]
            })

        except Exception as e:
            print(f"    ❌ Chirp 3:HD failed: {e}")
            results["samples"].append({
                "character": character_key,
                "model": "chirp3-hd",
                "error": str(e)
            })

        # Generate WaveNet sample
        try:
            print(f"  🎯 Generating WaveNet sample...")
            wavenet_result = tts_service.synthesize_speech(
                text=text,
                character_key=character_key,
                force_voice_model="wavenet"
            )

            wavenet_filename = f"{character_key}_wavenet.mp3"
            wavenet_path = wavenet_dir / wavenet_filename

            with open(wavenet_path, "wb") as f:
                f.write(wavenet_result["audio_content"])

            print(f"    ✅ Saved: {wavenet_path} ({wavenet_result['file_size']} bytes)")

            results["samples"].append({
                "character": character_key,
                "model": "wavenet",
                "filename": wavenet_filename,
                "file_size": wavenet_result["file_size"],
                "duration": wavenet_result["duration"],
                "voice_name": wavenet_result["voice_name"]
            })

        except Exception as e:
            print(f"    ❌ WaveNet failed: {e}")
            results["samples"].append({
                "character": character_key,
                "model": "wavenet",
                "error": str(e)
            })

    # Save metadata
    metadata_path = output_dir / "metadata.json"
    with open(metadata_path, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\n✅ Generation complete!")
    print(f"📁 Output directory: {output_dir.absolute()}")
    print(f"📊 Metadata saved: {metadata_path}")
    print(f"\n📈 Summary:")
    print(f"   - Total samples: {len(results['samples'])}")
    print(f"   - Successful: {sum(1 for s in results['samples'] if 'error' not in s)}")
    print(f"   - Failed: {sum(1 for s in results['samples'] if 'error' in s)}")


if __name__ == "__main__":
    asyncio.run(generate_audio_samples())
