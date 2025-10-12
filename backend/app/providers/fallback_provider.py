"""Fallback provider (返回預設參數)."""

import logging

from app.models.music import MusicParameters
from .base import BaseLLMProvider

logger = logging.getLogger(__name__)


class FallbackProvider(BaseLLMProvider):
    """
    Fallback Provider

    當所有 LLM provider 都失敗時，回傳預設的音樂參數。
    確保使用者始終能生成音樂（漸進增強策略）。
    """

    def __init__(self):
        """初始化 fallback provider（無需 API 金鑰）"""
        # 不呼叫 super().__init__，因為不需要 API 金鑰
        self._name = "fallback"

    @property
    def name(self) -> str:
        return self._name

    async def parse_prompt(self, prompt: str) -> MusicParameters:
        """
        回傳預設音樂參數

        Args:
            prompt: 使用者輸入（不使用）

        Returns:
            MusicParameters: 預設音樂參數
        """
        logger.warning(f"[Fallback] 使用預設參數回傳（prompt: {prompt[:50]}...）")

        return MusicParameters(
            key="C",
            mode="minor",
            tempo=90,
            timbre="sine",
            genre=["ambient"],
            mood=["mysterious"],
        )
