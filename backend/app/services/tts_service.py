"""
TTS Service - Google Cloud Text-to-Speech 整合
提供語音合成、SSML 生成、角色語音映射等功能
"""

import hashlib
import base64
import os
import json
import tempfile
from typing import Optional, Dict, Any, Tuple
from google.cloud import texttospeech
from google.oauth2 import service_account
from app.config import get_settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)


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
        計算文字 + 角色的唯一 hash

        Args:
            text: 要合成的文字
            character_key: 角色識別碼

        Returns:
            SHA256 hash (64 字元)
        """
        content = f"{text}:{character_key}"
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

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

        # 轉換 pitch (0.6-1.3) → semitones (-20 to +15)
        pitch_semitones = (config["pitch"] - 1.0) * 50
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
        language_code: str = "zh-TW",
        return_base64: bool = False
    ) -> Dict[str, Any]:
        """
        合成語音（核心方法）

        Args:
            text: 要合成的文字
            character_key: 角色識別碼
            language_code: 語言代碼 (zh-TW, zh-CN, en-US)
            return_base64: 是否回傳 base64 編碼

        Returns:
            {
                "audio_content": bytes,           # 音檔二進位資料
                "audio_base64": str,              # base64 編碼（如果 return_base64=True）
                "duration": float,                # 預估時長（秒）
                "file_size": int,                 # 檔案大小（位元組）
                "text_length": int,               # 文字長度
                "voice_name": str,                # 使用的語音名稱
                "ssml_params": dict,              # SSML 參數
            }

        Raises:
            Exception: TTS 合成失敗
        """
        if not self.client:
            raise Exception("TTS client not initialized")

        try:
            # 生成 SSML
            ssml = self.generate_ssml(text, character_key)

            # 取得語音名稱（預設使用 WaveNet）
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
            file_size = len(audio_content)

            # 預估時長（粗略估計：每個字元 0.15 秒，再根據語速調整）
            estimated_duration = (len(text) * 0.15) / rate

            # 準備回傳資料
            result = {
                "audio_content": audio_content,
                "duration": estimated_duration,
                "file_size": file_size,
                "text_length": len(text),
                "voice_name": voice_name,
                "ssml_params": {
                    "pitch": pitch,
                    "rate": rate,
                },
            }

            # 如果需要 base64
            if return_base64:
                audio_base64 = base64.b64encode(audio_content).decode('utf-8')
                result["audio_base64"] = f"data:audio/mp3;base64,{audio_base64}"

            logger.info(
                f"[TTSService] Synthesized speech: "
                f"character={character_key}, "
                f"text_length={len(text)}, "
                f"file_size={file_size}, "
                f"voice={voice_name}"
            )

            return result

        except Exception as e:
            logger.error(f"[TTSService] Speech synthesis failed: {e}")
            raise Exception(f"Speech synthesis failed: {str(e)}")

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


# 單例模式
_tts_service_instance: Optional[TTSService] = None


def get_tts_service() -> TTSService:
    """取得 TTS 服務單例"""
    global _tts_service_instance
    if _tts_service_instance is None:
        _tts_service_instance = TTSService()
    return _tts_service_instance
