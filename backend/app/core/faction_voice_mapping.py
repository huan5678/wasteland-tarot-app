"""
Faction-Voice Mapping Configuration
定義陣營與角色聲音的對應關係，用於過濾顯示相關的角色解讀
"""

from typing import Dict, List
from app.models.wasteland_card import FactionAlignment, CharacterVoice


# 陣營-角色映射表（基於 Fallout 世界觀）
FACTION_VOICE_MAPPING: Dict[str, List[str]] = {
    # 避難所居民 - 科技派系，親近 Pip-Boy 和 Codsworth
    FactionAlignment.VAULT_DWELLER.value: [
        CharacterVoice.PIP_BOY.value,
        CharacterVoice.VAULT_DWELLER.value,
        CharacterVoice.CODSWORTH.value,
    ],

    # 鋼鐵兄弟會 - 軍事科技派系
    FactionAlignment.BROTHERHOOD.value: [
        CharacterVoice.PIP_BOY.value,
        CharacterVoice.BROTHERHOOD_SCRIBE.value,
        CharacterVoice.BROTHERHOOD_PALADIN.value,
        CharacterVoice.CODSWORTH.value,  # 科技親和
    ],

    # NCR（新加州共和國）- 民主派系，重商貿
    FactionAlignment.NCR.value: [
        CharacterVoice.PIP_BOY.value,
        CharacterVoice.NCR_RANGER.value,
        CharacterVoice.WASTELAND_TRADER.value,  # 商業友好
    ],

    # 凱薩軍團 - 軍事獨裁派系
    FactionAlignment.LEGION.value: [
        CharacterVoice.PIP_BOY.value,
        CharacterVoice.LEGION_CENTURION.value,
        CharacterVoice.RAIDER.value,  # 暴力傾向相似
    ],

    # 掠奪者 - 混亂派系
    FactionAlignment.RAIDERS.value: [
        CharacterVoice.PIP_BOY.value,
        CharacterVoice.RAIDER.value,
        CharacterVoice.SUPER_MUTANT.value,  # 暴力同盟
    ],

    # 民兵組織 (Fallout 4) - 人民派系
    FactionAlignment.MINUTEMEN.value: [
        CharacterVoice.PIP_BOY.value,
        CharacterVoice.MINUTEMAN.value,
        CharacterVoice.WASTELAND_TRADER.value,  # 人民友好
        CharacterVoice.VAULT_DWELLER.value,  # 普通居民
    ],

    # 地下鐵路 (Fallout 4) - 解放派系
    FactionAlignment.RAILROAD.value: [
        CharacterVoice.PIP_BOY.value,
        CharacterVoice.RAILROAD_AGENT.value,
        CharacterVoice.GHOUL.value,  # 同情受壓迫者
    ],

    # 學院 (Fallout 4) - 科學派系
    FactionAlignment.INSTITUTE.value: [
        CharacterVoice.PIP_BOY.value,
        CharacterVoice.INSTITUTE_SCIENTIST.value,
        CharacterVoice.CODSWORTH.value,  # 科技親和
    ],

    # 獨立派 - 中立派系，可接觸多種角色
    FactionAlignment.INDEPENDENT.value: [
        CharacterVoice.PIP_BOY.value,
        CharacterVoice.VAULT_DWELLER.value,
        CharacterVoice.WASTELAND_TRADER.value,
        CharacterVoice.GHOUL.value,  # 自由選擇
    ],
}


def get_allowed_voices_for_faction(faction: str) -> List[str]:
    """
    根據陣營取得允許的角色聲音列表

    Args:
        faction: 陣營名稱 (FactionAlignment 的值)

    Returns:
        允許的角色聲音列表（CharacterVoice 的值）
        如果陣營不存在，返回僅包含 Pip-Boy 的列表
    """
    # 確保 pip_boy 永遠存在
    allowed_voices = FACTION_VOICE_MAPPING.get(
        faction,
        [CharacterVoice.PIP_BOY.value]
    )

    # 雙重保險：確保 pip_boy 在列表中
    if CharacterVoice.PIP_BOY.value not in allowed_voices:
        allowed_voices = [CharacterVoice.PIP_BOY.value] + allowed_voices

    return allowed_voices


def filter_character_voices_by_faction(
    character_voices: Dict[str, str],
    faction: str
) -> Dict[str, str]:
    """
    根據陣營過濾角色聲音解讀

    Args:
        character_voices: 完整的角色聲音解讀字典 {voice_name: interpretation}
        faction: 陣營名稱 (FactionAlignment 的值)

    Returns:
        過濾後的角色聲音解讀字典
    """
    allowed_voices = get_allowed_voices_for_faction(faction)

    return {
        voice: interpretation
        for voice, interpretation in character_voices.items()
        if voice in allowed_voices
    }


def get_faction_display_name(faction: str) -> str:
    """
    取得陣營的顯示名稱（中文）

    Args:
        faction: 陣營名稱 (FactionAlignment 的值)

    Returns:
        陣營的中文顯示名稱
    """
    faction_names = {
        FactionAlignment.VAULT_DWELLER.value: "避難所居民",
        FactionAlignment.BROTHERHOOD.value: "鋼鐵兄弟會",
        FactionAlignment.NCR.value: "新加州共和國",
        FactionAlignment.LEGION.value: "凱薩軍團",
        FactionAlignment.RAIDERS.value: "掠奪者",
        FactionAlignment.MINUTEMEN.value: "民兵組織",
        FactionAlignment.RAILROAD.value: "地下鐵路",
        FactionAlignment.INSTITUTE.value: "學院",
        FactionAlignment.INDEPENDENT.value: "獨立派",
    }
    return faction_names.get(faction, faction)


def get_voice_display_name(voice: str) -> str:
    """
    取得角色聲音的顯示名稱（中文）

    Args:
        voice: 角色聲音名稱 (CharacterVoice 的值)

    Returns:
        角色聲音的中文顯示名稱
    """
    voice_names = {
        CharacterVoice.PIP_BOY.value: "Pip-Boy",
        CharacterVoice.VAULT_DWELLER.value: "避難所居民",
        CharacterVoice.WASTELAND_TRADER.value: "廢土商人",
        CharacterVoice.CODSWORTH.value: "Codsworth",
        CharacterVoice.SUPER_MUTANT.value: "超級變種人",
        CharacterVoice.GHOUL.value: "屍鬼",
        CharacterVoice.RAIDER.value: "掠奪者",
        CharacterVoice.BROTHERHOOD_SCRIBE.value: "兄弟會書記員",
        CharacterVoice.BROTHERHOOD_PALADIN.value: "兄弟會聖騎士",
        CharacterVoice.NCR_RANGER.value: "NCR 遊騎兵",
        CharacterVoice.LEGION_CENTURION.value: "軍團百夫長",
        CharacterVoice.MINUTEMAN.value: "民兵",
        CharacterVoice.RAILROAD_AGENT.value: "鐵路特工",
        CharacterVoice.INSTITUTE_SCIENTIST.value: "學院科學家",
    }
    return voice_names.get(voice, voice)
