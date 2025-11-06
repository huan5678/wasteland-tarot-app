"""
Pattern Generator Service
P2.1: 基於規則的智能節奏生成器

使用關鍵字分析和預定義規則生成鼓組 pattern
避免依賴外部 AI API（無 API key 和費用）
"""

import random
from typing import Dict, List
from app.schemas.music import Pattern


class PatternGenerator:
    """基於規則的智能節奏生成器"""

    # 流派特徵庫
    GENRE_PATTERNS = {
        "techno": {
            "kick_density": 0.3,  # 每步驟觸發機率
            "snare_density": 0.15,
            "hihat_density": 0.5,
            "kick_positions": [0, 4, 8, 12],  # 固定位置
            "snare_positions": [4, 12],
        },
        "house": {
            "kick_density": 0.25,
            "snare_density": 0.125,
            "hihat_density": 0.4,
            "kick_positions": [0, 4, 8, 12],
            "snare_positions": [4, 12],
        },
        "trap": {
            "kick_density": 0.2,
            "snare_density": 0.2,
            "hihat_density": 0.6,
            "kick_positions": [0, 6],
            "snare_positions": [4],
        },
        "industrial": {
            "kick_density": 0.35,
            "snare_density": 0.25,
            "hihat_density": 0.3,
            "kick_positions": [0, 3, 6, 9, 12, 15],
            "snare_positions": [4, 10],
        },
        "dnb": {  # Drum and Bass
            "kick_density": 0.2,
            "snare_density": 0.3,
            "hihat_density": 0.7,
            "kick_positions": [0, 9],
            "snare_positions": [4, 12],
        },
        "synthwave": {
            "kick_density": 0.25,
            "snare_density": 0.125,
            "hihat_density": 0.4,
            "kick_positions": [0, 4, 8, 12],
            "snare_positions": [4, 12],
        },
    }

    # 情緒修飾詞
    MOOD_MODIFIERS = {
        "aggressive": {"kick_boost": 1.3, "snare_boost": 1.2},
        "heavy": {"kick_boost": 1.4, "snare_boost": 1.1},
        "dark": {"kick_boost": 1.2, "hihat_reduce": 0.7},
        "energetic": {"hihat_boost": 1.5, "kick_boost": 1.1},
        "chill": {"kick_reduce": 0.7, "hihat_reduce": 0.8},
        "minimal": {"kick_reduce": 0.6, "snare_reduce": 0.6, "hihat_reduce": 0.5},
        "complex": {"hihat_boost": 1.3, "clap_boost": 2.0},
    }

    # 關鍵字對應
    GENRE_KEYWORDS = {
        "techno": ["techno", "tech"],
        "house": ["house", "deep house", "progressive"],
        "trap": ["trap", "hip hop", "rap"],
        "industrial": ["industrial", "noise", "harsh"],
        "dnb": ["drum and bass", "dnb", "jungle", "breakbeat"],
        "synthwave": ["synthwave", "retro", "80s"],
    }

    MOOD_KEYWORDS = {
        "aggressive": ["aggressive", "hard", "intense"],
        "heavy": ["heavy", "powerful", "strong"],
        "dark": ["dark", "ominous", "sinister", "evil"],
        "energetic": ["energetic", "high energy", "fast", "uplifting"],
        "chill": ["chill", "relaxed", "calm", "smooth"],
        "minimal": ["minimal", "simple", "sparse"],
        "complex": ["complex", "intricate", "polyrhythmic"],
    }

    def __init__(self):
        """初始化生成器"""
        random.seed()  # 確保每次生成不同

    def generate(self, prompt: str) -> Pattern:
        """
        根據 prompt 生成 Pattern

        流程：
        1. 分析 prompt 提取流派和情緒
        2. 選擇基礎模板
        3. 套用情緒修飾
        4. 加入隨機變化
        5. 回傳 Pattern

        Args:
            prompt: 使用者輸入的提示文字

        Returns:
            Pattern: 生成的 16 步驟節奏 pattern
        """
        prompt_lower = prompt.lower()

        # 1. 偵測流派
        genre = self._detect_genre(prompt_lower)

        # 2. 偵測情緒
        moods = self._detect_moods(prompt_lower)

        # 3. 取得基礎模板
        base_config = self.GENRE_PATTERNS.get(genre, self.GENRE_PATTERNS["techno"])

        # 4. 套用情緒修飾
        config = self._apply_mood_modifiers(base_config.copy(), moods)

        # 5. 生成各軌道
        kick = self._generate_kick(config)
        snare = self._generate_snare(config)
        hihat = self._generate_hihat(config)
        openhat = self._generate_openhat(config)
        clap = self._generate_clap(config, snare)

        return Pattern(
            kick=kick,
            snare=snare,
            hihat=hihat,
            openhat=openhat,
            clap=clap,
        )

    def _detect_genre(self, prompt: str) -> str:
        """偵測流派"""
        for genre, keywords in self.GENRE_KEYWORDS.items():
            if any(keyword in prompt for keyword in keywords):
                return genre
        return "techno"  # 預設流派

    def _detect_moods(self, prompt: str) -> List[str]:
        """偵測情緒（可多個）"""
        detected_moods = []
        for mood, keywords in self.MOOD_KEYWORDS.items():
            if any(keyword in prompt for keyword in keywords):
                detected_moods.append(mood)
        return detected_moods

    def _apply_mood_modifiers(self, config: Dict, moods: List[str]) -> Dict:
        """套用情緒修飾"""
        for mood in moods:
            if mood not in self.MOOD_MODIFIERS:
                continue

            modifiers = self.MOOD_MODIFIERS[mood]
            for key, multiplier in modifiers.items():
                if key.endswith("_boost"):
                    density_key = key.replace("_boost", "_density")
                    if density_key in config:
                        config[density_key] *= multiplier
                elif key.endswith("_reduce"):
                    density_key = key.replace("_reduce", "_density")
                    if density_key in config:
                        config[density_key] *= multiplier

        return config

    def _generate_kick(self, config: Dict) -> List[bool]:
        """生成 Kick 軌道（16 步驟）"""
        pattern = [False] * 16

        # 1. 填充固定位置
        for pos in config.get("kick_positions", []):
            if pos < 16:
                pattern[pos] = True

        # 2. 根據密度隨機添加額外的 kick
        density = min(config.get("kick_density", 0.25), 1.0)
        for i in range(16):
            if not pattern[i] and random.random() < density * 0.3:  # 30% 機率額外添加
                pattern[i] = True

        return pattern

    def _generate_snare(self, config: Dict) -> List[bool]:
        """生成 Snare 軌道（16 步驟）"""
        pattern = [False] * 16

        # 1. 填充固定位置
        for pos in config.get("snare_positions", []):
            if pos < 16:
                pattern[pos] = True

        # 2. 根據密度隨機添加
        density = min(config.get("snare_density", 0.15), 1.0)
        for i in range(16):
            if not pattern[i] and i % 4 != 0 and random.random() < density:
                pattern[i] = True

        return pattern

    def _generate_hihat(self, config: Dict) -> List[bool]:
        """生成 Hi-hat 軌道（16 步驟）"""
        pattern = [False] * 16
        density = min(config.get("hihat_density", 0.5), 1.0)

        # Hi-hat 通常在 offbeat（1, 3, 5, 7...）
        for i in range(16):
            if i % 2 == 1:  # Offbeat
                if random.random() < density:
                    pattern[i] = True
            else:  # Onbeat (較低機率)
                if random.random() < density * 0.3:
                    pattern[i] = True

        return pattern

    def _generate_openhat(self, config: Dict) -> List[bool]:
        """生成 Open Hi-hat 軌道（16 步驟）"""
        pattern = [False] * 16

        # Open hat 通常在 bar 結尾（位置 7, 15）
        openhat_positions = [7, 15]
        for pos in openhat_positions:
            if random.random() < 0.6:  # 60% 機率
                pattern[pos] = True

        return pattern

    def _generate_clap(self, config: Dict, snare_pattern: List[bool]) -> List[bool]:
        """生成 Clap 軌道（16 步驟）"""
        pattern = [False] * 16

        clap_density = config.get("clap_boost", 1.0) * 0.2  # 基礎 20% 機率

        # Clap 通常與 Snare 同步或略有偏移
        for i in range(16):
            if snare_pattern[i]:
                # 30% 機率與 snare 同步
                if random.random() < clap_density:
                    pattern[i] = True
            elif i > 0 and snare_pattern[i - 1]:
                # 10% 機率在 snare 後一步
                if random.random() < clap_density * 0.5:
                    pattern[i] = True

        return pattern
