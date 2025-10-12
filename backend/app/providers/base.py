"""Base LLM provider interface."""

from abc import ABC, abstractmethod
from typing import Dict, Any

from app.models.music import MusicParameters


class LLMProviderError(Exception):
    """LLM provider 相關錯誤"""

    def __init__(self, provider_name: str, message: str, original_error: Exception = None):
        self.provider_name = provider_name
        self.message = message
        self.original_error = original_error
        super().__init__(f"[{provider_name}] {message}")


class BaseLLMProvider(ABC):
    """
    LLM Provider 基礎介面

    所有 LLM provider 必須實作此介面,提供統一的音樂參數解析功能。
    """

    def __init__(self, api_key: str, model: str, timeout: int = 10):
        """
        初始化 provider

        Args:
            api_key: API 金鑰
            model: 模型名稱
            timeout: 請求超時時間（秒）
        """
        self.api_key = api_key
        self.model = model
        self.timeout = timeout

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider 名稱（例如: gemini, openai）"""
        pass

    @abstractmethod
    async def parse_prompt(self, prompt: str) -> MusicParameters:
        """
        解析使用者 prompt 為音樂參數

        Args:
            prompt: 使用者輸入的自然語言描述

        Returns:
            MusicParameters: 解析後的音樂參數

        Raises:
            LLMProviderError: 解析失敗時拋出
        """
        pass

    def _build_system_prompt(self) -> str:
        """
        建立系統 prompt

        Returns:
            str: 系統 prompt 文字
        """
        return """你是專業的音樂參數生成器。根據使用者的描述，生成適合的音樂參數。

回應格式（必須是有效的 JSON）：
{
  "key": "C" | "D" | "E" | "F" | "G" | "A" | "B",
  "mode": "major" | "minor",
  "tempo": 60-180 之間的整數,
  "timbre": "sine" | "square" | "sawtooth" | "triangle",
  "genre": ["ambient", "synthwave", ...],
  "mood": ["mysterious", "energetic", ...]
}

參數說明：
- key: 調性（C=平靜, A=神秘, G=明亮, E=深沉, D=溫暖, F=柔和, B=銳利）
- mode: major=明亮/快樂, minor=陰暗/憂鬱
- tempo: 速度（60=極慢, 90=緩慢, 120=中速, 150=快速, 180=極快）
- timbre: sine=柔和圓潤, square=明亮銳利, sawtooth=溫暖厚實, triangle=清澈乾淨
- genre: 風格標籤（最多 5 個）
- mood: 情緒標籤（最多 5 個）

範例：
輸入：「神秘的廢土夜晚，帶有合成器和電子鼓」
輸出：
{
  "key": "A",
  "mode": "minor",
  "tempo": 80,
  "timbre": "sawtooth",
  "genre": ["synthwave", "industrial", "ambient"],
  "mood": ["mysterious", "dark", "atmospheric"]
}

請根據使用者輸入生成 JSON 格式的音樂參數。"""

    def _validate_parameters(self, data: Dict[str, Any]) -> MusicParameters:
        """
        驗證並轉換為 MusicParameters

        Args:
            data: LLM 回傳的 JSON 資料

        Returns:
            MusicParameters: 驗證後的音樂參數

        Raises:
            LLMProviderError: 驗證失敗時拋出
        """
        try:
            return MusicParameters(**data)
        except Exception as e:
            raise LLMProviderError(
                provider_name=self.name,
                message=f"參數驗證失敗: {str(e)}",
                original_error=e,
            )
