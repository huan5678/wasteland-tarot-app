"""
故事模式共用常數

這個模組定義了 Wasteland Story Mode 的共用常數，
確保模型和服務層使用相同的驗證規則。
"""

from typing import List

# 有效的陣營列表
VALID_FACTIONS: List[str] = [
    "vault_dweller",
    "brotherhood",
    "ncr",
    "legion",
    "raiders",
    "minutemen",
    "railroad",
    "institute",
    "independent"
]

# 時間格式正則表達式
TIMELINE_PATTERNS: List[str] = [
    r'^戰前$',
    r'^戰後$',
    r'^[0-9]{4} 年$'
]

# Vault 編號範圍
MIN_VAULT_NUMBER: int = 1
MAX_VAULT_NUMBER: int = 122

# 故事背景字數範圍
MIN_STORY_LENGTH: int = 200
MAX_STORY_LENGTH: int = 500

# 陣營到語音的映射
FACTION_VOICE_MAP = {
    "vault_dweller": ["pip_boy", "vault_dweller", "codsworth"],
    "brotherhood": ["brotherhood_scribe", "brotherhood_paladin"],
    "ncr": ["ncr_ranger"],
    "legion": ["legion_centurion"],
    "raiders": ["raider", "super_mutant"],
    "minutemen": ["minuteman"],
    "railroad": ["railroad_agent"],
    "institute": ["institute_scientist"],
    "independent": ["wasteland_trader"],
}

# 預設通用角色語音
DEFAULT_VOICES: List[str] = ["pip_boy", "wasteland_trader"]
