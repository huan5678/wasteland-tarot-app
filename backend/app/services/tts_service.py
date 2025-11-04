"""
TTS Service - Google Cloud Text-to-Speech 整合
提供語音合成、SSML 生成、角色語音映射等功能
"""

import hashlib
import base64
import os
import json
import tempfile
import time
from enum import Enum
from typing import Optional, Dict, Any, Tuple, List
from google.cloud import texttospeech
from google.oauth2 import service_account
from app.config import get_settings
from app.core.logging_config import get_logger
from app.core.metrics import (
    tts_synthesis_total,
    tts_synthesis_duration,
    tts_cache_hits,
    tts_audio_file_size,
    tts_fallback_total,
    tts_requests_by_character,
    tts_text_length,
)
from app.schemas.audio import CustomPronunciation, VoiceControlParams, Pause

logger = get_logger(__name__)


class VoiceModel(str, Enum):
    """
    語音模型枚舉

    定義可用的 TTS 語音模型：
    - WAVENET: Google Cloud WaveNet 語音（現有模型）
    - CHIRP3_HD: Google Cloud Chirp 3:HD 語音（最新高品質模型）
    """
    WAVENET = "wavenet"
    CHIRP3_HD = "chirp3-hd"


# 前端角色語音配置（使用更極端的參數創造明顯差異）
# Pitch: -20 到 +20 semitones, Rate: 0.25 到 4.0
DEFAULT_VOICE_CONFIGS = {
    # === 極低音角色（威脅、強大）===
    "super_mutant": {"pitch": 0.4, "rate": 0.65, "volume": 1.0},        # -12st, 極低沉緩慢
    "brotherhood_paladin": {"pitch": 0.6, "rate": 0.75, "volume": 1.0}, # -8st, 低沉威嚴
    "legion_centurion": {"pitch": 0.5, "rate": 0.7, "volume": 1.0},     # -10st, 低沉命令

    # === 低音角色（粗獷、老練）===
    "ghoul": {"pitch": 0.7, "rate": 0.8, "volume": 1.0},                # -6st, 沙啞低沉
    "wasteland_trader": {"pitch": 0.8, "rate": 0.9, "volume": 1.0},     # -4st, 成熟商人
    "ncr_ranger": {"pitch": 0.75, "rate": 0.85, "volume": 1.0},         # -5st, 冷靜專業

    # === 中音角色（標準、友善）===
    "pip_boy": {"pitch": 1.0, "rate": 1.0, "volume": 1.0},              # 0st, 標準友善
    "minuteman": {"pitch": 0.92, "rate": 0.95, "volume": 1.0},          # -2st, 穩重可靠

    # === 高音角色（年輕、活潑）===
    "vault_dweller": {"pitch": 1.16, "rate": 1.1, "volume": 1.0},       # +4st, 年輕樂觀
    "railroad_agent": {"pitch": 1.12, "rate": 1.15, "volume": 1.0},     # +3st, 機敏快速
    "brotherhood_scribe": {"pitch": 1.2, "rate": 1.05, "volume": 1.0},  # +5st, 聰明好學

    # === 特殊角色 ===
    "codsworth": {"pitch": 1.32, "rate": 1.25, "volume": 1.0},          # +8st, 機器人高音快速
    "raider": {"pitch": 0.88, "rate": 1.3, "volume": 1.0},              # -3st, 粗野快速
    "institute_scientist": {"pitch": 1.24, "rate": 1.15, "volume": 1.0}, # +6st, 知識份子
}

# ============================================================================
# WaveNet Voice Mapping (DEPRECATED - Kept for emergency rollback)
# ============================================================================
#
# ⚠️ DEPRECATED: This mapping is kept for emergency rollback purposes.
#
# To re-enable WaveNet:
# 1. Set CHIRP3_ENABLED=false
# 2. Update VoiceModelRouter to use WaveNet by default
# 3. Remove deprecated markers below
#
# Last active: 2025-11-04
# Reason for deprecation: Chirp 3:HD fully rolled out and stable
#
# Google TTS 語音映射（使用 WaveNet 高品質語音）
# WaveNet 語音比 Standard 更自然、更有表現力
VOICE_MAPPING = {
    # === 極低音角色（使用 Wavenet-C 男性低音）===
    "super_mutant": "cmn-TW-Wavenet-C",          # WaveNet 低音 + 極低 pitch
    "brotherhood_paladin": "cmn-TW-Wavenet-C",   # WaveNet 低音 + 低 pitch
    "legion_centurion": "cmn-TW-Wavenet-C",      # WaveNet 低音 + 極低 pitch

    # === 低音角色（使用 Wavenet-B 男性標準音）===
    "ghoul": "cmn-TW-Wavenet-B",                 # WaveNet 男音 + 低 pitch
    "wasteland_trader": "cmn-TW-Wavenet-B",      # WaveNet 男音 + 低 pitch
    "ncr_ranger": "cmn-TW-Wavenet-B",            # WaveNet 男音 + 低 pitch

    # === 中音角色（使用 Wavenet-B 男性標準音）===
    "pip_boy": "cmn-TW-Wavenet-B",               # WaveNet 男音 + 標準 pitch
    "minuteman": "cmn-TW-Wavenet-B",             # WaveNet 男音 + 標準 pitch

    # === 高音角色（使用 Wavenet-A 女性音）===
    "vault_dweller": "cmn-TW-Wavenet-A",         # WaveNet 女音 + 高 pitch
    "railroad_agent": "cmn-TW-Wavenet-A",        # WaveNet 女音 + 高 pitch
    "brotherhood_scribe": "cmn-TW-Wavenet-A",    # WaveNet 女音 + 高 pitch

    # === 特殊角色 ===
    "codsworth": "cmn-TW-Wavenet-B",             # WaveNet 男音 + 極高 pitch（機器人）
    "raider": "cmn-TW-Wavenet-B",                # WaveNet 男音 + 低 pitch + 快速
    "institute_scientist": "cmn-TW-Wavenet-A",   # WaveNet 女音 + 高 pitch
}

# Chirp 3:HD 語音映射（Google Cloud 最新高品質語音模型）
#
# 語音選擇理論依據：
# 1. 性別匹配：保留現有角色的性別特徵（男性/女性）
# 2. 音調特徵：根據角色的音高設定選擇匹配的語音
# 3. 性格適配：選擇能夠增強角色性格特質的語音
# 4. 參數相容性：確保 pitch/rate 調製參數能夠良好運作
#
# 注意：Chirp 3:HD 目前主要支援英文語音（en-US），
# 在中文環境下使用時，會利用 Chirp 3:HD 的跨語言能力處理中文文字。
# Chirp 3:HD 語音映射（官方星體名稱版本）
# 根據 Google Cloud TTS 官方文檔：https://cloud.google.com/text-to-speech/docs/chirp3-hd#voice_options
# Chirp 3:HD 使用真實的星體和衛星名稱作為語音變體
# 只存儲星體名稱，完整語音名稱格式：{language_code}-Chirp3-HD-{star_name}
CHIRP3_VOICE_MAPPING = {
    # === 極低音男性角色（威脅、強大）===
    "super_mutant": "Algenib",
    # 選擇理由：Algenib（飛馬座γ星）提供深沉、強有力的男性低音
    # 適合表現超級變種人的威脅性和強大
    # 配合 -20st pitch 和 0.65 rate，創造極具威懾力的聲音

    "brotherhood_paladin": "Alnilam",
    # 選擇理由：Alnilam（獵戶座腰帶中央星）具有軍事權威感
    # 低音域穩定，適合鋼鐵兄弟會聖騎士的指揮官形象
    # 配合 -8st pitch 和 0.75 rate，展現威嚴但不失清晰

    "legion_centurion": "Enceladus",
    # 選擇理由：Enceladus（土衛二）提供嚴厲、紀律性的男性低音
    # 適合凱薩軍團百夫長的軍事紀律特質
    # 配合 -10st pitch 和 0.7 rate，展現嚴酷的軍事命令風格

    # === 低音男性角色（粗獷、老練）===
    "ghoul": "Fenrir",
    # 選擇理由：Fenrir（土衛九，北歐神話巨狼）具有歷經風霜的低音特質
    # 沙啞但不失表現力，適合屍鬼倖存者的老練形象
    # 配合 -6st pitch 和 0.8 rate，展現經歷廢土磨難的聲音

    "wasteland_trader": "Achird",
    # 選擇理由：Achird（仙后座η星）提供實用、商人般的男性中低音
    # 適合廢土商人的精明特質
    # 配合 -4st pitch 和 0.9 rate，展現實務主義的說話風格

    "ncr_ranger": "Iapetus",
    # 選擇理由：Iapetus（土衛八）具有專業、冷靜的男性中低音
    # 適合 NCR 遊騎兵的職業軍人形象
    # 配合 -5st pitch 和 0.85 rate，展現專業但不失人性

    # === 中音男性角色（標準、友善）===
    "pip_boy": "Puck",
    # 選擇理由：Puck（天王星衛星）提供中性、友善的男性中音
    # 適合 Pip-Boy AI 助手的標準化形象
    # 配合 0st pitch 和 1.0 rate，展現標準、清晰、友善的語音

    "minuteman": "Schedar",
    # 選擇理由：Schedar（仙后座α星）提供穩重、可靠的男性中音
    # 適合民兵組織的平民保護者形象
    # 配合 -2st pitch 和 0.95 rate，展現穩重可靠的聲音

    # === 高音女性角色（年輕、活潑）===
    "vault_dweller": "Aoede",
    # 選擇理由：Aoede（木衛四十一，繆斯女神之一）提供年輕、樂觀的女性高音
    # 適合避難所居民的年輕活力形象
    # 配合 +8st pitch 和 1.1 rate，展現年輕、充滿希望的聲音

    "railroad_agent": "Leda",
    # 選擇理由：Leda（木衛十三，希臘神話斯巴達王后）提供機敏、快速的女性高音
    # 適合地下鐵路特工的機智敏捷特質
    # 配合 +3st pitch 和 1.15 rate，展現快速、機敏的說話風格

    "brotherhood_scribe": "Callirrhoe",
    # 選擇理由：Callirrhoe（木衛十七，希臘神話河神之女）提供聰明、好奇的女性高音
    # 適合鋼鐵兄弟會學者的求知特質
    # 配合 +5st pitch 和 1.05 rate，展現聰明、好學的聲音

    # === 特殊角色 ===
    "codsworth": "Despina",
    # 選擇理由：Despina（海王星衛星）提供精確、正式的女性高音
    # 適合機器人管家 Codsworth 的正式服務特質
    # 配合 +8st pitch 和 1.25 rate，展現機器人化的高音、快速、精確語音

    "raider": "Rasalgethi",
    # 選擇理由：Rasalgethi（武仙座α星）提供攻擊性、不穩定的男性中音
    # 適合掠奪者的暴力、不可預測特質
    # 配合 -3st pitch 和 1.3 rate，展現粗野、快速、具威脅性的聲音

    "institute_scientist": "Kore",
    # 選擇理由：Kore（希臘神話冥后珀耳塞福涅的別名）提供分析性、理性的女性高音
    # 適合學院科學家的知識分子形象
    # 配合 +6st pitch 和 1.15 rate，展現理性、分析性、略帶疏離的聲音
}


class VoiceModelRouter:
    """
    語音模型路由器

    根據功能開關設定，決定使用哪個語音模型（Chirp 3:HD 或 WaveNet）。

    路由優先順序：
    1. 全域啟用開關（chirp3_enabled）
    2. 角色特定啟用列表（chirp3_enabled_characters）
    3. 百分比滾動（chirp3_rollout_percentage）

    特性：
    - 支援使用者一致性雜湊，確保同一使用者總是使用相同的模型
    - 支援匿名使用者的隨機路由
    - 支援角色特定的啟用控制
    """

    def __init__(self, settings=None):
        """
        初始化路由器

        Args:
            settings: Settings 實例，如果為 None 則使用 get_settings()
        """
        if settings is None:
            settings = get_settings()
        self.settings = settings
        self._enabled_characters_set = None
        self._update_enabled_characters_set()

    def _update_enabled_characters_set(self):
        """更新啟用角色集合（用於快速查找）"""
        if not self.settings.chirp3_enabled_characters:
            # 空字串表示所有角色都啟用
            self._enabled_characters_set = None
        else:
            # 解析逗號分隔的角色列表
            chars = [
                char.strip()
                for char in self.settings.chirp3_enabled_characters.split(",")
                if char.strip()
            ]
            self._enabled_characters_set = set(chars) if chars else None

    def should_use_chirp3(
        self,
        character_key: str,
        user_id: Optional[str] = None
    ) -> bool:
        """
        判斷是否應該使用 Chirp 3:HD

        Args:
            character_key: 角色識別碼
            user_id: 使用者 ID（用於一致性路由），可選

        Returns:
            True 如果應該使用 Chirp 3:HD，False 則使用 WaveNet
        """
        # 1. 檢查全域啟用開關
        if not self.settings.chirp3_enabled:
            return False

        # 2. 檢查角色特定啟用列表
        if self._enabled_characters_set is not None:
            # 如果設定了角色列表，只有列表中的角色才啟用
            if character_key in self._enabled_characters_set:
                return True
            else:
                return False

        # 3. 百分比滾動（deterministic per user）
        rollout_percentage = self.settings.chirp3_rollout_percentage
        if rollout_percentage <= 0:
            return False
        if rollout_percentage >= 100:
            return True

        if user_id:
            # 使用雜湊確保同一使用者總是得到相同的結果
            hash_val = int(
                hashlib.md5(user_id.encode()).hexdigest()[:8],
                16
            )
            return (hash_val % 100) < rollout_percentage
        else:
            # 匿名使用者：使用隨機數（但這是非確定性的）
            # 注意：這裡無法保證一致性，因為每次呼叫都會產生不同的結果
            # 如果需要在匿名使用者中也保持一致性，可以使用 session_id 或其他識別碼
            import random
            return random.randint(0, 99) < rollout_percentage

    def get_voice_model(
        self,
        character_key: str,
        user_id: Optional[str] = None
    ) -> VoiceModel:
        """
        取得應該使用的語音模型

        Args:
            character_key: 角色識別碼
            user_id: 使用者 ID（用於一致性路由），可選

        Returns:
            VoiceModel.CHIRP3_HD 或 VoiceModel.WAVENET
        """
        if self.should_use_chirp3(character_key, user_id):
            return VoiceModel.CHIRP3_HD
        else:
            return VoiceModel.WAVENET


class TTSService:
    """
    Google Cloud TTS 服務

    功能：
    1. 合成語音（synthesize_speech）
    2. 生成 SSML（generate_ssml）
    3. 參數轉換（convert_voice_params）
    4. 文字 hash 計算（compute_text_hash）
    """

    def __init__(self):
        """
        初始化 TTS 客戶端

        支援三種憑證方式（按優先順序）：
        1. GOOGLE_CLOUD_CREDENTIALS_JSON (環境變數 JSON 內容) - 雲端部署推薦
        2. GOOGLE_APPLICATION_CREDENTIALS (檔案路徑) - 本地開發
        3. Workload Identity (Google Cloud 預設憑證) - GCP 原生
        """
        try:
            settings = get_settings()
            credentials = None

            # 方法 1: 從環境變數讀取 JSON 內容（雲端部署推薦）
            credentials_json = settings.google_cloud_credentials_json
            if credentials_json:
                logger.info("[TTSService] Using credentials from GOOGLE_CLOUD_CREDENTIALS_JSON")
                try:
                    # 解析 JSON 字串
                    creds_dict = json.loads(credentials_json)
                    credentials = service_account.Credentials.from_service_account_info(creds_dict)
                    logger.info("[TTSService] Credentials loaded from JSON environment variable")
                except json.JSONDecodeError as e:
                    logger.error(f"[TTSService] Invalid JSON in GOOGLE_CLOUD_CREDENTIALS_JSON: {e}")
                    raise

            # 方法 2: 從檔案路徑讀取（本地開發）
            elif os.getenv('GOOGLE_APPLICATION_CREDENTIALS'):
                creds_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
                logger.info(f"[TTSService] Using credentials from file: {creds_path}")
                if os.path.exists(creds_path):
                    credentials = service_account.Credentials.from_service_account_file(creds_path)
                    logger.info("[TTSService] Credentials loaded from file")
                else:
                    logger.warning(f"[TTSService] Credentials file not found: {creds_path}")

            # 方法 3: 使用預設憑證（Workload Identity）
            else:
                logger.info("[TTSService] Using default credentials (Workload Identity or gcloud)")

            # 初始化客戶端
            if credentials:
                self.client = texttospeech.TextToSpeechClient(credentials=credentials)
            else:
                # 使用預設憑證（適用於 GCP 環境）
                self.client = texttospeech.TextToSpeechClient()

            logger.info("[TTSService] ✅ Google Cloud TTS client initialized successfully")

        except Exception as e:
            logger.error(f"[TTSService] ❌ Failed to initialize TTS client: {e}")
            self.client = None

    def compute_text_hash(self, text: str, character_key: str) -> str:
        """
        計算文字 + 角色的唯一 hash（舊版本，向後相容）

        Args:
            text: 要合成的文字
            character_key: 角色識別碼

        Returns:
            SHA256 hash (64 字元)

        Deprecated:
            使用 compute_cache_key() 替代，以包含所有合成參數
        """
        content = f"{text}:{character_key}"
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    def compute_cache_key(
        self,
        text: str,
        character_key: str,
        voice_model: VoiceModel,
        custom_pronunciations: Optional[List[CustomPronunciation]] = None,
        voice_controls: Optional[VoiceControlParams] = None
    ) -> str:
        """
        計算完整的快取 key，包含所有合成參數

        Args:
            text: 要合成的文字
            character_key: 角色識別碼
            voice_model: 語音模型
            custom_pronunciations: 可選的自訂發音列表
            voice_controls: 可選的語音控制參數

        Returns:
            SHA256 hash (64 字元)

        Example:
            >>> service = TTSService()
            >>> key1 = service.compute_cache_key("test", "pip_boy", VoiceModel.WAVENET)
            >>> key2 = service.compute_cache_key("test", "pip_boy", VoiceModel.CHIRP3_HD)
            >>> assert key1 != key2  # 不同模型產生不同 key
        """
        components = [text, character_key, voice_model.value]

        # 包含自訂發音
        if custom_pronunciations:
            pron_str = "|".join(
                f"{p.phrase}:{p.pronunciation}"
                for p in sorted(custom_pronunciations, key=lambda x: x.phrase)
            )
            components.append(pron_str)

        # 包含語音控制參數
        if voice_controls:
            ctrl_parts = []
            if voice_controls.pitch is not None:
                ctrl_parts.append(f"p{voice_controls.pitch:.1f}")
            if voice_controls.rate is not None:
                ctrl_parts.append(f"r{voice_controls.rate:.2f}")
            if voice_controls.volume is not None:
                ctrl_parts.append(f"v{voice_controls.volume:.2f}")
            if voice_controls.pauses:
                # 暫停順序重要，需要排序
                pause_str = "|".join(
                    f"{p.position}:{p.duration}"
                    for p in sorted(voice_controls.pauses, key=lambda x: (x.position, x.duration))
                )
                ctrl_parts.append(f"pause:{pause_str}")
            if ctrl_parts:
                components.append("_".join(ctrl_parts))

        # 計算 hash
        cache_input = ":".join(components)
        return hashlib.sha256(cache_input.encode('utf-8')).hexdigest()

    def convert_voice_params(
        self,
        character_key: str
    ) -> Tuple[float, float]:
        """
        轉換前端語音參數為 Google TTS 參數

        前端配置:
        - pitch: 0.6-1.3 (相對於 1.0)
        - rate: 0.8-1.15

        Google TTS 參數:
        - pitch: -20 to +20 semitones
        - speaking_rate: 0.25 to 4.0

        轉換公式:
        - semitones = (pitch - 1.0) * 50  (0.6 → -20st, 1.3 → +15st)
        - speaking_rate = rate (直接使用)

        Args:
            character_key: 角色識別碼

        Returns:
            (pitch_semitones, speaking_rate)
        """
        config = DEFAULT_VOICE_CONFIGS.get(
            character_key,
            {"pitch": 1.0, "rate": 1.0}
        )

        pitch_value = config["pitch"]
        
        # 檢查 pitch 是否已經是 semitones 格式（-20 到 +20）
        # 如果值在 -20 到 +20 範圍內，假設已經是 semitones
        if -20.0 <= pitch_value <= 20.0:
            pitch_semitones = pitch_value
        else:
            # 否則轉換 pitch (0.6-1.3) → semitones (-20 to +15)
            pitch_semitones = (pitch_value - 1.0) * 50
        
        # 限制範圍
        pitch_semitones = max(-20.0, min(20.0, pitch_semitones))

        # speaking_rate 直接使用
        speaking_rate = config["rate"]
        # 限制範圍
        speaking_rate = max(0.25, min(4.0, speaking_rate))

        return pitch_semitones, speaking_rate

    def generate_ssml(
        self,
        text: str,
        character_key: str,
        pitch_adjustment: Optional[float] = None,
        rate_adjustment: Optional[float] = None
    ) -> str:
        """
        生成 SSML 標記

        Args:
            text: 要合成的文字
            character_key: 角色識別碼
            pitch_adjustment: 音高調整（覆寫預設值，-20 to +20 semitones）
            rate_adjustment: 語速調整（覆寫預設值，0.25 to 4.0）

        Returns:
            SSML 字串

        Example:
            <speak>
              <prosody pitch="-10st" rate="0.8">
                強大！簡單！直接！
              </prosody>
            </speak>
        """
        # 取得角色語音參數
        pitch, rate = self.convert_voice_params(character_key)

        # 允許覆寫
        if pitch_adjustment is not None:
            pitch = pitch_adjustment
        if rate_adjustment is not None:
            rate = rate_adjustment

        # 生成 SSML
        ssml = f"""<speak>
  <prosody pitch="{pitch:+.1f}st" rate="{rate:.2f}">
    {text}
  </prosody>
</speak>"""

        return ssml

    def synthesize_speech(
        self,
        text: str,
        character_key: str,
        language_code: str = "cmn-CN",
        return_base64: bool = False,
        user_id: Optional[str] = None,
        cache_source: Optional[str] = None,
        custom_pronunciations: Optional[List[CustomPronunciation]] = None,
        voice_controls: Optional[VoiceControlParams] = None,
        force_voice_model: Optional[str] = None,
        voice_name_override: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        合成語音（核心方法，支援自動路由）

        Args:
            text: 要合成的文字
            character_key: 角色識別碼
            language_code: 語言代碼 (zh-TW, zh-CN, en-US)
            return_base64: 是否回傳 base64 編碼
            user_id: 使用者 ID（用於路由和 metrics）
            cache_source: 快取來源（"redis", "db", "new"）用於 metrics
            custom_pronunciations: 可選的自訂發音覆寫（僅 Chirp 3:HD）
            voice_controls: 可選的語音控制參數（僅 Chirp 3:HD）
            force_voice_model: 強制使用指定模型（"chirp3-hd" 或 "wavenet"），覆寫路由邏輯
            voice_name_override: 自訂語音名稱，覆寫角色預設語音（例如：'en-US-Chirp3-HD-Algenib'）

        Returns:
            {
                "audio_content": bytes,           # 音檔二進位資料
                "audio_base64": str,              # base64 編碼（如果 return_base64=True）
                "duration": float,                # 預估時長（秒）
                "file_size": int,                 # 檔案大小（位元組）
                "text_length": int,               # 文字長度
                "voice_name": str,                # 使用的語音名稱
                "voice_model": str,               # 語音模型（"wavenet" 或 "chirp3-hd"）
                "ssml_params": dict,              # SSML/標記參數
            }

        Raises:
            Exception: TTS 合成失敗
        """
        if not self.client:
            raise Exception("TTS client not initialized")

        # 初始化 router（如果尚未初始化）
        if not hasattr(self, 'router'):
            self.router = VoiceModelRouter()

        # 決定使用的語音模型
        if force_voice_model:
            # 強制使用指定模型
            if force_voice_model == "chirp3-hd":
                voice_model_enum = VoiceModel.CHIRP3_HD
            elif force_voice_model == "wavenet":
                voice_model_enum = VoiceModel.WAVENET
            else:
                raise ValueError(f"Invalid voice_model: {force_voice_model}")
        else:
            # 使用路由邏輯
            voice_model_enum = self.router.get_voice_model(character_key, user_id)

        voice_model = voice_model_enum.value  # "wavenet" 或 "chirp3-hd"

        # 記錄開始時間
        start_time = time.time()

        try:
            # 路由到適當的合成方法
            if voice_model_enum == VoiceModel.CHIRP3_HD:
                result = self._synthesize_chirp3(
                    text,
                    character_key,
                    language_code,
                    custom_pronunciations,
                    voice_controls,
                    voice_name_override
                )
            else:
                result = self._synthesize_wavenet(
                    text,
                    character_key,
                    language_code
                )

            # 計算合成時間
            duration_seconds = time.time() - start_time

            # 如果需要 base64
            if return_base64:
                audio_base64 = base64.b64encode(result["audio_content"]).decode('utf-8')
                result["audio_base64"] = f"data:audio/mp3;base64,{audio_base64}"

            # 記錄 Prometheus metrics - 成功
            tts_synthesis_total.labels(
                voice_model=voice_model,
                character_key=character_key,
                status="success"
            ).inc()

            tts_synthesis_duration.labels(
                voice_model=voice_model,
                character_key=character_key
            ).observe(duration_seconds)

            tts_audio_file_size.labels(
                voice_model=voice_model,
                character_key=character_key
            ).observe(result["file_size"])

            tts_requests_by_character.labels(
                character_key=character_key,
                voice_model=voice_model
            ).inc()

            tts_text_length.labels(
                voice_model=voice_model,
                character_key=character_key
            ).observe(result["text_length"])

            # 記錄快取 metrics（如果有）
            if cache_source:
                tts_cache_hits.labels(
                    voice_model=voice_model,
                    source=cache_source
                ).inc()

            logger.info(
                f"[TTSService] Synthesized speech: "
                f"character={character_key}, "
                f"text_length={result['text_length']}, "
                f"file_size={result['file_size']}, "
                f"voice={result['voice_name']}, "
                f"model={voice_model}, "
                f"duration={duration_seconds:.2f}s"
            )

            return result

        except Exception as e:
            # 計算錯誤發生時的時間
            duration_seconds = time.time() - start_time

            # 記錄 Prometheus metrics - 失敗
            tts_synthesis_total.labels(
                voice_model=voice_model,
                character_key=character_key,
                status="error"
            ).inc()

            # 記錄錯誤類型
            error_type = type(e).__name__

            # 嘗試 fallback（如果啟用且是 Chirp 3:HD 失敗）
            if (
                voice_model_enum == VoiceModel.CHIRP3_HD
                and self.router.settings.chirp3_fallback_to_wavenet
            ):
                logger.warning(
                    f"[TTSService] Chirp 3:HD failed, falling back to WaveNet: "
                    f"character={character_key}, error={error_type}: {str(e)}"
                )

                # 記錄 fallback metric
                tts_fallback_total.labels(
                    character_key=character_key,
                    error_type=error_type
                ).inc()

                # 降級到 WaveNet
                try:
                    result = self._synthesize_wavenet(text, character_key, language_code)

                    # 如果需要 base64
                    if return_base64:
                        audio_base64 = base64.b64encode(result["audio_content"]).decode('utf-8')
                        result["audio_base64"] = f"data:audio/mp3;base64,{audio_base64}"

                    # 更新 voice_model 為 wavenet（因為 fallback）
                    result["voice_model"] = "wavenet"

                    # 記錄 fallback 後的 metrics
                    fallback_duration = time.time() - start_time
                    tts_synthesis_total.labels(
                        voice_model="wavenet",
                        character_key=character_key,
                        status="success"
                    ).inc()
                    tts_synthesis_duration.labels(
                        voice_model="wavenet",
                        character_key=character_key
                    ).observe(fallback_duration)

                    logger.info(
                        f"[TTSService] Fallback to WaveNet successful: "
                        f"character={character_key}, duration={fallback_duration:.2f}s"
                    )

                    return result

                except Exception as fallback_error:
                    logger.error(
                        f"[TTSService] Fallback to WaveNet also failed: "
                        f"character={character_key}, error={type(fallback_error).__name__}: {str(fallback_error)}"
                    )
                    # 如果 fallback 也失敗，繼續拋出原始錯誤
                    raise e

            # 沒有 fallback 或 fallback 失敗，拋出錯誤
            logger.error(
                f"[TTSService] Synthesis failed: "
                f"character={character_key}, "
                f"model={voice_model}, "
                f"error={error_type}: {str(e)}"
            )

            raise

    def get_voice_config(self, character_key: str) -> Dict[str, float]:
        """
        取得角色語音配置

        Args:
            character_key: 角色識別碼

        Returns:
            {"pitch": float, "rate": float, "volume": float}
        """
        return DEFAULT_VOICE_CONFIGS.get(
            character_key,
            {"pitch": 1.0, "rate": 1.0, "volume": 1.0}
        )

    def get_voice_name(self, character_key: str, language_code: str = "cmn-TW") -> str:
        """
        取得 Google TTS 語音名稱

        Args:
            character_key: 角色識別碼
            language_code: 語言代碼

        Returns:
            語音名稱（如 "cmn-TW-Wavenet-C"）
        """
        if language_code == "cmn-TW" or language_code == "zh-TW":
            return VOICE_MAPPING.get(character_key, "cmn-TW-Wavenet-B")
        elif language_code == "cmn-CN" or language_code == "zh-CN":
            # 簡體中文語音映射（未來擴展）
            return "cmn-CN-Wavenet-B"
        elif language_code == "en-US":
            # 英文語音映射（未來擴展）
            return "en-US-Wavenet-B"
        else:
            return "cmn-TW-Wavenet-B"

    def get_chirp3_voice_name(self, character_key: str) -> Optional[str]:
        """
        取得 Chirp 3:HD 語音名稱

        Args:
            character_key: 角色識別碼

        Returns:
            Chirp 3:HD 語音名稱（如 "en-US-Chirp3-HD-Regulus"），
            如果角色沒有對應的 Chirp 3:HD 語音則返回 None
        """
        return CHIRP3_VOICE_MAPPING.get(character_key)

    def validate_chirp3_voice_mapping(self) -> Dict[str, Any]:
        """
        驗證 Chirp 3:HD 語音映射配置

        檢查：
        1. 所有預設角色都有對應的 Chirp 3:HD 語音
        2. 語音名稱格式正確（符合 Google TTS API 規範）
        3. 語音映射完整性

        Returns:
            {
                "valid": bool,                    # 是否驗證通過
                "missing_characters": List[str],   # 缺少語音映射的角色
                "total_characters": int,          # 總角色數
                "mapped_characters": int,         # 已映射的角色數
                "errors": List[str]               # 錯誤訊息列表
            }

        Example:
            >>> service = TTSService()
            >>> result = service.validate_chirp3_voice_mapping()
            >>> assert result["valid"] == True
            >>> assert result["missing_characters"] == []
        """
        errors: List[str] = []
        missing_characters: List[str] = []

        # 取得所有預設角色
        all_characters = set(DEFAULT_VOICE_CONFIGS.keys())

        # 檢查每個角色是否有 Chirp 3:HD 映射
        for character_key in all_characters:
            if character_key not in CHIRP3_VOICE_MAPPING:
                missing_characters.append(character_key)
                errors.append(f"角色 '{character_key}' 缺少 Chirp 3:HD 語音映射")

        # 驗證語音名稱格式（應該符合 en-US-Chirp3-HD-{VoiceName} 格式）
        for character_key, voice_name in CHIRP3_VOICE_MAPPING.items():
            if not voice_name.startswith("en-US-Chirp3-HD-"):
                errors.append(
                    f"角色 '{character_key}' 的語音名稱格式錯誤: {voice_name} "
                    f"（應為 en-US-Chirp3-HD-{{VoiceName}} 格式）"
                )

            # 檢查語音名稱是否為空
            if not voice_name or not voice_name.strip():
                errors.append(f"角色 '{character_key}' 的語音名稱為空")

        # 檢查是否有多餘的映射（不存在的角色）
        mapped_characters = set(CHIRP3_VOICE_MAPPING.keys())
        extra_characters = mapped_characters - all_characters
        if extra_characters:
            errors.append(
                f"發現未定義角色的語音映射: {', '.join(extra_characters)}"
            )

        valid = len(errors) == 0 and len(missing_characters) == 0

        return {
            "valid": valid,
            "missing_characters": missing_characters,
            "total_characters": len(all_characters),
            "mapped_characters": len(CHIRP3_VOICE_MAPPING),
            "errors": errors
        }

    def is_valid_chirp3_voice(self, voice_name: str) -> bool:
        """
        檢查語音名稱是否為有效的 Chirp 3:HD 語音

        Args:
            voice_name: 語音名稱

        Returns:
            如果是有效的 Chirp 3:HD 語音名稱則返回 True

        Example:
            >>> service = TTSService()
            >>> assert service.is_valid_chirp3_voice("en-US-Chirp3-HD-Regulus") == True
            >>> assert service.is_valid_chirp3_voice("cmn-TW-Wavenet-B") == False
        """
        if not voice_name:
            return False

        # 檢查格式：en-US-Chirp3-HD-{VoiceName}
        if not voice_name.startswith("en-US-Chirp3-HD-"):
            return False

        # 檢查是否在映射表中
        return voice_name in CHIRP3_VOICE_MAPPING.values()

    # ============================================================================
    # WaveNet Synthesis Method (DEPRECATED - Kept for emergency rollback)
    # ============================================================================
    #
    # ⚠️ DEPRECATED: This method is kept for emergency rollback purposes.
    #
    # After Chirp 3:HD has been stable for 1+ week without fallback,
    # this method is deprecated but preserved for emergency recovery.
    #
    # To re-enable:
    # 1. Update synthesize_speech() to call this method
    # 2. Remove deprecated markers
    # 3. Ensure VOICE_MAPPING is active
    #
    # See: backend/docs/WAVENET_CODE_CLEANUP_GUIDE.md

    def _synthesize_wavenet(
        self,
        text: str,
        character_key: str,
        language_code: str = "zh-TW"
    ) -> Dict[str, Any]:
        """
        使用 WaveNet 模型合成語音（DEPRECATED）

        ⚠️ DEPRECATED: This method is kept for emergency rollback purposes.

        After Chirp 3:HD has been stable for 1+ week without fallback,
        this method is deprecated but preserved for emergency recovery.

        To re-enable:
        1. Update synthesize_speech() to call this method
        2. Remove deprecated markers
        3. Ensure VOICE_MAPPING is active

        Args:
            text: 要合成的文字
            character_key: 角色識別碼
            language_code: 語言代碼 (zh-TW, zh-CN, en-US)

        Returns:
            合成結果字典，包含音檔內容和元資料

        Raises:
            Exception: TTS 合成失敗
        """
        if not self.client:
            raise Exception("TTS client not initialized")

        # 生成 SSML
        ssml = self.generate_ssml(text, character_key)

        # 取得語音名稱（WaveNet）
        voice_name = VOICE_MAPPING.get(character_key, "cmn-TW-Wavenet-B")

        # 取得語音參數
        pitch, rate = self.convert_voice_params(character_key)

        # 設定 TTS 輸入（使用 SSML）
        synthesis_input = texttospeech.SynthesisInput(ssml=ssml)

        # 設定語音參數
        voice = texttospeech.VoiceSelectionParams(
            language_code=language_code,
            name=voice_name,
        )

        # 設定音訊配置
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=1.0,  # SSML 已處理，這裡用預設值
            pitch=0.0,          # SSML 已處理，這裡用預設值
        )

        # 呼叫 Google Cloud TTS API
        response = self.client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )

        # 取得音檔內容
        audio_content = response.audio_content
        estimated_duration = (len(text) * 0.15) / rate

        return {
            "audio_content": audio_content,
            "duration": estimated_duration,
            "file_size": len(audio_content),
            "text_length": len(text),
            "voice_name": voice_name,
            "voice_model": "wavenet",
            "ssml_params": {
                "pitch": pitch,
                "rate": rate,
            },
        }

    # ============================================================================
    # Chirp 3:HD Synthesis Methods (Task 2.1, 2.4, 2.5)
    # ============================================================================

    def _insert_pauses(
        self,
        text: str,
        pauses: Optional[List[Pause]] = None
    ) -> str:
        """
        在文字中插入暫停標記

        Args:
            text: 原始文字
            pauses: 暫停位置列表

        Returns:
            插入暫停標記後的文字

        Example:
            >>> service = TTSService()
            >>> text = "Hello World"
            >>> pauses = [Pause(position=5, duration="medium")]
            >>> result = service._insert_pauses(text, pauses)
            >>> assert "[pause medium]" in result
        """
        if not pauses:
            return text

        # 按位置降序排序，從後往前插入以避免位置偏移
        sorted_pauses = sorted(pauses, key=lambda p: p.position, reverse=True)

        result = text
        for pause in sorted_pauses:
            if pause.position < 0 or pause.position > len(result):
                logger.warning(
                    f"Invalid pause position {pause.position} for text of length {len(result)}"
                )
                continue

            # 插入暫停標記（Chirp 3:HD 格式：`[pause {duration}]`）
            marker = f"[pause {pause.duration}]"
            result = result[:pause.position] + marker + result[pause.position:]

        return result

    def _apply_custom_pronunciations(
        self,
        text: str,
        custom_pronunciations: Optional[List[CustomPronunciation]] = None
    ) -> str:
        """
        應用自訂發音到文字中
        
        對於 Chirp 3:HD，使用自訂發音標記替換文字中的特定詞彙。
        注意：Chirp 3:HD 不支援傳統 SSML phoneme 標籤，而是使用自己的標記格式。
        
        Args:
            text: 原始文字
            custom_pronunciations: 自訂發音列表

        Returns:
            應用自訂發音後的文字
        """
        if not custom_pronunciations:
            return text

        modified_text = text
        for pron in custom_pronunciations:
            # 替換文字中的詞彙為帶 IPA 標記的格式
            # Chirp 3:HD 格式：[ipa {pronunciation}]{phrase}[/ipa]
            # 例如：[ipa pɪp bɔɪ]Pip-Boy[/ipa]
            if pron.phrase in modified_text:
                replacement = f"[ipa {pron.pronunciation}]{pron.phrase}[/ipa]"
                modified_text = modified_text.replace(pron.phrase, replacement)
                logger.debug(
                    f"[TTSService] Applied custom pronunciation: '{pron.phrase}' -> '{pron.pronunciation}'"
                )

        return modified_text

    def generate_chirp3_markup(
        self,
        text: str,
        character_key: str,
        custom_pronunciations: Optional[List[CustomPronunciation]] = None,
        voice_controls: Optional[VoiceControlParams] = None
    ) -> str:
        """
        生成 Chirp 3:HD 專用的標記文字

        Chirp 3:HD 使用自己的標記格式（不是 SSML），支援：
        - 音高調整：`[pitch {value}st]`
        - 語速調整：`[pace {value}]`
        - 暫停：`[pause {duration}]`
        - 自訂發音：`[ipa {pronunciation}]{phrase}[/ipa]`

        Args:
            text: 要合成的文字
            character_key: 角色識別碼
            custom_pronunciations: 自訂發音列表（會嵌入到標記文字中）
            voice_controls: 語音控制參數

        Returns:
            Chirp 3:HD 標記文字

        Note:
            - 自訂發音會直接嵌入到標記文字中
            - 暫停會直接插入到文字中
        """
        # 取得角色預設參數
        pitch, rate = self.convert_voice_params(character_key)

        # 應用覆寫
        if voice_controls:
            if voice_controls.pitch is not None:
                pitch = voice_controls.pitch
            if voice_controls.rate is not None:
                rate = voice_controls.rate

        # 先應用自訂發音
        processed_text = self._apply_custom_pronunciations(text, custom_pronunciations)

        # 再插入暫停
        marked_text = self._insert_pauses(
            processed_text,
            voice_controls.pauses if voice_controls else None
        )

        # 生成 Chirp 3:HD 標記
        # 格式：文字 + [pace {rate}] + [pitch {pitch}st]
        # 注意：Chirp 3:HD 的標記順序可能影響效果，將參數放在文字後面
        markup_parts = [marked_text]

        # 添加語速標記
        if rate != 1.0:
            markup_parts.append(f"[pace {rate:.2f}]")

        # 添加音高標記
        if pitch != 0.0:
            markup_parts.append(f"[pitch {pitch:+.1f}st]")

        return " ".join(markup_parts)

    def _is_chirp3_language_supported(self, language_code: str) -> bool:
        """
        檢查語言是否支援 Chirp 3:HD
        
        根據 Google Cloud 文檔，Chirp 3:HD 支援多種語言。
        參考：https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd#language_availability
        
        Args:
            language_code: 語言代碼
            
        Returns:
            是否支援 Chirp 3:HD
        """
        supported_languages = {
            "en-US",      # 美式英文
            "en-GB",      # 英式英文  
            "en-AU",      # 澳洲英文
            "en-IN",      # 印度英文
            "cmn-CN",     # 簡體中文 (中國大陸)
            "cmn-TW",     # 繁體中文 (台灣)
            "cmn-Hant-TW", # 繁體中文 (台灣) - 新格式
            "yue-Hant-HK", # 粵語 (香港)
            "ja-JP",      # 日文
            "ko-KR",      # 韓文
            "fr-FR",      # 法文
            "de-DE",      # 德文
            "es-ES",      # 西班牙文
            "pt-BR",      # 葡萄牙文 (巴西)
            "it-IT",      # 義大利文
        }
        # 也支援標準化的語言代碼 (zh-TW, zh-CN 等)
        normalized_map = {
            "zh-TW": "cmn-TW",
            "zh-CN": "cmn-CN",
            "zh-HK": "yue-Hant-HK",
        }
        return language_code in supported_languages or language_code in normalized_map

    def _convert_to_chirp_language_code(self, language_code: str) -> str:
        """
        轉換標準語言代碼為 Chirp 3:HD 支援的語言代碼
        
        根據 Google 官方文件，Chirp 3:HD 使用特定的語言代碼格式。
        參考：https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd#language_availability
        
        Args:
            language_code: 標準語言代碼 (zh-TW, zh-CN, en-US 等)
            
        Returns:
            Chirp 3:HD 相容的語言代碼
        """
        # 檢查是否為支援的語言
        if not self._is_chirp3_language_supported(language_code):
            logger.warning(
                f"[TTSService] Language '{language_code}' is not supported by Chirp 3:HD. "
                f"Will fallback to WaveNet."
            )
            return language_code
        
        # 語言代碼轉換映射表
        language_map = {
            # 英文變體
            "en-US": "en-US",
            "en-GB": "en-GB",
            "en-AU": "en-AU",
            "en-IN": "en-IN",
            # 中文變體 - 使用 cmn 前綴 (Mandarin Chinese)
            "zh-TW": "cmn-TW",      # 台灣繁體中文
            "zh-CN": "cmn-CN",      # 中國簡體中文
            "cmn-TW": "cmn-TW",     # 直接使用
            "cmn-CN": "cmn-CN",     # 直接使用
            "cmn-Hant-TW": "cmn-Hant-TW",  # 新格式繁體中文
            # 粵語
            "zh-HK": "yue-Hant-HK",  # 香港粵語
            "yue-Hant-HK": "yue-Hant-HK",
            # 其他亞洲語言
            "ja-JP": "ja-JP",        # 日文
            "ko-KR": "ko-KR",        # 韓文
            # 歐洲語言
            "fr-FR": "fr-FR",        # 法文
            "de-DE": "de-DE",        # 德文
            "es-ES": "es-ES",        # 西班牙文
            "pt-BR": "pt-BR",        # 葡萄牙文
            "it-IT": "it-IT",        # 義大利文
        }
        
        result = language_map.get(language_code, language_code)
        if result != language_code:
            logger.info(f"[TTSService] Converted language code: {language_code} → {result}")
        
        return result

    def _synthesize_chirp3(
        self,
        text: str,
        character_key: str,
        language_code: str = "en-US",
        custom_pronunciations: Optional[List[CustomPronunciation]] = None,
        voice_controls: Optional[VoiceControlParams] = None,
        voice_name_override: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        使用 Chirp 3:HD 模型合成語音

        Args:
            text: 要合成的文字
            character_key: 角色識別碼
            language_code: 語言代碼 (en-US, en-GB, cmn-CN, cmn-TW, ja-JP, ko-KR 等)
            custom_pronunciations: 可選的自訂發音覆寫
            voice_controls: 可選的語音控制參數
            voice_name_override: 自訂語音名稱，覆寫角色預設語音

        Returns:
            合成結果字典，包含音檔內容和元資料

        Raises:
            ValueError: 如果角色沒有對應的 Chirp 3:HD 語音
            Exception: TTS 合成失敗
        """
        if not self.client:
            raise Exception("TTS client not initialized")

        # 先轉換語言代碼到 Chirp 3:HD 格式，再檢查是否支援
        converted_language_code = self._convert_to_chirp_language_code(language_code)
        
        # 檢查轉換後的語言是否支援 Chirp 3:HD
        if not self._is_chirp3_language_supported(converted_language_code):
            logger.warning(
                f"[TTSService] Language '{language_code}' (converted to '{converted_language_code}') "
                f"not supported by Chirp 3:HD. Raising exception to trigger WaveNet fallback."
            )
            raise ValueError(
                f"Chirp 3:HD does not support language '{converted_language_code}'. "
                f"Supported languages: en-US, cmn-TW, cmn-CN, ja-JP, ko-KR, etc. "
                f"Please use WaveNet for other languages."
            )
        
        # 使用轉換後的語言代碼
        language_code = converted_language_code
        logger.info(f"[TTSService] Using Chirp3 language code: {language_code}")

        # 取得 Chirp 3:HD 語音名稱（支援自訂覆寫）
        # 無論是從映射表還是自訂，都需要提取 voice_id 並根據 language_code 重新構建
        
        if voice_name_override:
            voice_base = voice_name_override
            logger.info(f"[TTSService] Using custom voice base: {voice_base}")
        else:
            # 從映射表取得語音名稱（可能包含或不包含語言代碼）
            voice_base = CHIRP3_VOICE_MAPPING.get(character_key)
            if not voice_base:
                raise ValueError(
                    f"No Chirp 3:HD voice for character: {character_key}. "
                    f"Available characters: {', '.join(CHIRP3_VOICE_MAPPING.keys())}"
                )
        
        # 提取語音星體名稱（支援多種格式）
        if "-Chirp3-HD-" in voice_base:
            # 完整格式：en-US-Chirp3-HD-Algenib → Algenib
            star_name = voice_base.split("-Chirp3-HD-")[-1]
            logger.info(f"[TTSService] Extracted star name from full name: {voice_base} → {star_name}")
        else:
            # 簡短格式：直接是星體名稱（如 Algenib, Aoede）
            star_name = voice_base
            logger.info(f"[TTSService] Using star name directly: {star_name}")
        
        # 驗證星體名稱不為空
        if not star_name:
            logger.warning(f"[TTSService] Empty star name, using default 'Algenib'")
            star_name = "Algenib"
        
        # 根據語言代碼動態構建完整語音名稱
        # 格式：{language_code}-Chirp3-HD-{star_name}
        # Chirp 3:HD 語言代碼不需要轉換（已在上面檢查過支援性）
        voice_name = f"{language_code}-Chirp3-HD-{star_name}"
        logger.info(f"[TTSService] Built voice name: {voice_name} (language: {language_code}, star: {star_name})")

        # 取得語音參數
        pitch, rate = self.convert_voice_params(character_key)
        voice_config = self.get_voice_config(character_key)
        volume = voice_config.get("volume", 1.0)

        # 應用覆寫
        if voice_controls:
            if voice_controls.pitch is not None:
                pitch = voice_controls.pitch
            if voice_controls.rate is not None:
                rate = voice_controls.rate
            if voice_controls.volume is not None:
                volume = voice_controls.volume

        # 生成 Chirp 3:HD 標記（自訂發音已嵌入其中）
        markup_text = self.generate_chirp3_markup(
            text,
            character_key,
            custom_pronunciations,
            voice_controls
        )

        # 創建合成輸入
        synthesis_input = texttospeech.SynthesisInput(
            markup=markup_text
        )

        # 創建語音參數
        # voice_name 已經包含正確的語言代碼前綴（在上面構建時已轉換）
        # 例如：cmn-TW-Chirp3-HD-Algenib
        
        # 從語音名稱提取語言代碼
        # 格式：{language_code}-Chirp3-HD-{voice_id}
        voice_language_code = voice_name.split("-Chirp3-HD-")[0]
        
        voice = texttospeech.VoiceSelectionParams(
            language_code=voice_language_code,
            name=voice_name
        )

        # 轉換 volume (0.0-1.0) 為 volume_gain_db (-96.0 到 16.0 dB)
        # 公式：volume_gain_db = (volume - 1.0) * 32.0
        # volume=0.0 → -32dB, volume=1.0 → 0dB
        volume_gain_db = (volume - 1.0) * 32.0
        # 限制範圍在 -96.0 到 16.0 dB 之間
        volume_gain_db = max(-96.0, min(16.0, volume_gain_db))

        # 創建音訊配置（HD 品質）
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=1.0,  # 通過 markup 控制
            pitch=0.0,          # 通過 markup 控制
            sample_rate_hertz=24000,  # HD 品質：24kHz
            volume_gain_db=volume_gain_db,  # 音量控制（-96.0 到 16.0 dB）
        )

        # 執行合成
        try:
            # 執行 TTS 合成（自訂發音已嵌入 markup_text 中）
            response = self.client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )

            # 處理回應
            audio_content = response.audio_content
            estimated_duration = (len(text) * 0.15) / rate

            logger.info(
                f"[TTSService] Chirp 3:HD synthesis successful: "
                f"character={character_key}, "
                f"voice={voice_name}, "
                f"text_length={len(text)}, "
                f"file_size={len(audio_content)}"
            )

            return {
                "audio_content": audio_content,
                "duration": estimated_duration,
                "file_size": len(audio_content),
                "text_length": len(text),
                "voice_name": voice_name,
                "voice_model": "chirp3-hd",
                "ssml_params": {"pitch": pitch, "rate": rate}
            }

        except Exception as e:
            logger.error(
                f"[TTSService] Chirp 3:HD synthesis failed: "
                f"character={character_key}, "
                f"voice={voice_name}, "
                f"error={type(e).__name__}: {str(e)}"
            )
            raise


# 單例模式
_tts_service_instance: Optional[TTSService] = None


def get_tts_service() -> TTSService:
    """取得 TTS 服務單例"""
    global _tts_service_instance
    if _tts_service_instance is None:
        _tts_service_instance = TTSService()
    return _tts_service_instance
