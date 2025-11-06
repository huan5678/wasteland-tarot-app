"""
Prometheus metrics for TTS system monitoring

This module defines Prometheus metrics for tracking Chirp 3:HD TTS synthesis
performance, quality, and system health.
"""

from prometheus_client import Counter, Histogram

# TTS Synthesis Metrics
tts_synthesis_total = Counter(
    "tts_synthesis_total",
    "Total TTS synthesis requests",
    ["voice_model", "character_key", "status"]
)

tts_synthesis_duration = Histogram(
    "tts_synthesis_duration_seconds",
    "TTS synthesis duration in seconds",
    ["voice_model", "character_key"],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0]
)

tts_cache_hits = Counter(
    "tts_cache_hits_total",
    "Cache hit/miss counts for TTS synthesis",
    ["voice_model", "source"]  # source: redis, db, new
)

tts_audio_file_size = Histogram(
    "tts_audio_file_size_bytes",
    "Audio file size distribution in bytes",
    ["voice_model", "character_key"],
    buckets=[1000, 5000, 10000, 50000, 100000, 500000]
)

tts_fallback_total = Counter(
    "tts_chirp3_fallback_total",
    "Chirp 3:HD fallback to WaveNet count",
    ["character_key", "error_type"]
)

# Additional metrics for detailed monitoring
tts_requests_by_character = Counter(
    "tts_requests_by_character_total",
    "Total TTS requests per character",
    ["character_key", "voice_model"]
)

tts_text_length = Histogram(
    "tts_text_length_characters",
    "Text length distribution for TTS synthesis",
    ["voice_model", "character_key"],
    buckets=[10, 50, 100, 200, 500, 1000, 2000, 5000]
)
