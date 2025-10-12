"""LLM Provider Factory (Multi-Provider 架構)."""

import logging
from typing import List, Optional, Dict, Any

from app.config import settings
from app.models.music import MusicParameters
from .base import BaseLLMProvider, LLMProviderError
from .gemini_provider import GeminiProvider
from .openai_provider import OpenAIProvider
from .fallback_provider import FallbackProvider

logger = logging.getLogger(__name__)


class LLMProviderFactory:
    """
    LLM Provider Factory

    管理多個 LLM provider，實作回退機制：
    1. 第一優先: Google Gemini 2.5 Flash
    2. 第二優先: OpenAI GPT-4o-mini
    3. 最終回退: 預設參數

    使用方式:
        factory = LLMProviderFactory()
        result = await factory.parse_prompt("神秘的廢土夜晚")
        print(result.parameters)  # MusicParameters
        print(result.provider)    # "gemini" | "openai" | "fallback"
    """

    def __init__(self):
        """初始化 provider factory"""
        self.providers: List[BaseLLMProvider] = []
        self._initialize_providers()

    def _initialize_providers(self) -> None:
        """初始化所有可用的 providers"""
        # 1. Gemini Provider（第一優先）
        if settings.gemini_api_key:
            try:
                self.providers.append(
                    GeminiProvider(
                        api_key=settings.gemini_api_key,
                        model="gemini-2.0-flash-exp",  # 使用 2.0 Flash
                        timeout=10,
                    )
                )
                logger.info("[LLMFactory] Gemini provider 已啟用")
            except Exception as e:
                logger.warning(f"[LLMFactory] Gemini provider 初始化失敗: {str(e)}")

        # 2. OpenAI Provider（第二優先）
        if settings.openai_api_key:
            try:
                self.providers.append(
                    OpenAIProvider(
                        api_key=settings.openai_api_key,
                        model=settings.openai_model,  # 預設 gpt-4o-mini
                        timeout=10,
                    )
                )
                logger.info("[LLMFactory] OpenAI provider 已啟用")
            except Exception as e:
                logger.warning(f"[LLMFactory] OpenAI provider 初始化失敗: {str(e)}")

        # 3. Fallback Provider（最終回退，永遠可用）
        self.providers.append(FallbackProvider())
        logger.info("[LLMFactory] Fallback provider 已啟用")

        logger.info(f"[LLMFactory] 總共載入 {len(self.providers)} 個 providers")

    async def parse_prompt(self, prompt: str) -> Dict[str, Any]:
        """
        解析使用者 prompt 為音樂參數（含 provider 資訊）

        嘗試順序：
        1. Gemini 2.5 Flash（10s timeout）
        2. OpenAI GPT-4o-mini（10s timeout）
        3. Fallback（預設參數）

        Args:
            prompt: 使用者輸入的自然語言描述

        Returns:
            Dict 包含:
                - parameters: MusicParameters
                - provider: str (使用的 provider 名稱)

        Raises:
            Exception: 僅在所有 provider（包含 fallback）都失敗時拋出
        """
        for provider in self.providers:
            try:
                logger.info(f"[LLMFactory] 嘗試使用 {provider.name} provider")

                parameters = await provider.parse_prompt(prompt)

                logger.info(
                    f"[LLMFactory] {provider.name} 解析成功: "
                    f"key={parameters.key}, mode={parameters.mode}, tempo={parameters.tempo}"
                )

                return {
                    "parameters": parameters,
                    "provider": provider.name,
                }

            except LLMProviderError as e:
                logger.warning(
                    f"[LLMFactory] {provider.name} 失敗: {e.message}"
                )
                # 繼續嘗試下一個 provider
                continue

            except Exception as e:
                logger.error(
                    f"[LLMFactory] {provider.name} 未預期錯誤: {str(e)}"
                )
                # 繼續嘗試下一個 provider
                continue

        # 理論上不會執行到這裡（因為 fallback provider 永遠成功）
        # 但為了安全起見，仍拋出異常
        raise Exception("所有 LLM providers（包含 fallback）都失敗")

    def get_available_providers(self) -> List[str]:
        """
        取得所有可用的 provider 名稱

        Returns:
            List[str]: Provider 名稱列表
        """
        return [provider.name for provider in self.providers]
