"""LLM Provider Factory (Multi-Provider 架構) - Optimized with Lazy Loading."""

import logging
from typing import List, Optional, Dict, Any

from app.config import settings
from app.models.music import MusicParameters
from .base import BaseLLMProvider, LLMProviderError

logger = logging.getLogger(__name__)


class LLMProviderFactory:
    """
    LLM Provider Factory (Memory Optimized)

    管理多個 LLM provider，實作回退機制：
    1. 第一優先: Google Gemini 2.5 Flash
    2. 第二優先: OpenAI GPT-4o-mini
    3. 最終回退: 預設參數

    優化特性:
    - Lazy Loading: Provider 只在首次使用時才載入
    - 單例模式: 每個 provider 只創建一次
    - 記憶體節省: 未使用的 provider 不會載入到記憶體

    使用方式:
        factory = LLMProviderFactory()
        result = await factory.parse_prompt("神秘的廢土夜晚")
        print(result.parameters)  # MusicParameters
        print(result.provider)    # "gemini" | "openai" | "fallback"
    """

    def __init__(self):
        """初始化 provider factory (lazy loading)"""
        self._providers_cache: Dict[str, BaseLLMProvider] = {}
        self._provider_order = ["gemini", "openai", "fallback"]
        logger.info("[LLMFactory] Provider factory 初始化完成 (使用延遲載入)")

    def _get_or_create_provider(self, provider_name: str) -> Optional[BaseLLMProvider]:
        """
        取得或創建 provider (lazy loading)
        
        Args:
            provider_name: Provider 名稱 ("gemini", "openai", "fallback")
            
        Returns:
            Provider 實例，如果無法創建則返回 None
        """
        # 如果已經載入，直接返回
        if provider_name in self._providers_cache:
            return self._providers_cache[provider_name]
        
        # Lazy loading: 只在需要時才 import 和創建
        try:
            if provider_name == "gemini" and settings.gemini_api_key:
                from .gemini_provider import GeminiProvider
                provider = GeminiProvider(
                    api_key=settings.gemini_api_key,
                    model="gemini-2.0-flash-exp",
                    timeout=10,
                )
                self._providers_cache[provider_name] = provider
                logger.info(f"[LLMFactory] {provider_name} provider 已載入")
                return provider
                
            elif provider_name == "openai" and settings.openai_api_key:
                from .openai_provider import OpenAIProvider
                provider = OpenAIProvider(
                    api_key=settings.openai_api_key,
                    model=settings.openai_model,
                    timeout=10,
                )
                self._providers_cache[provider_name] = provider
                logger.info(f"[LLMFactory] {provider_name} provider 已載入")
                return provider
                
            elif provider_name == "fallback":
                from .fallback_provider import FallbackProvider
                provider = FallbackProvider()
                self._providers_cache[provider_name] = provider
                logger.info(f"[LLMFactory] {provider_name} provider 已載入")
                return provider
                
        except Exception as e:
            logger.warning(f"[LLMFactory] {provider_name} provider 載入失敗: {str(e)}")
            return None
        
        return None

    async def parse_prompt(self, prompt: str) -> Dict[str, Any]:
        """
        解析使用者 prompt 為音樂參數（含 provider 資訊）

        嘗試順序（Lazy Loading）：
        1. Gemini 2.5 Flash（首次使用時載入，10s timeout）
        2. OpenAI GPT-4o-mini（首次使用時載入，10s timeout）
        3. Fallback（首次使用時載入，預設參數）

        Args:
            prompt: 使用者輸入的自然語言描述

        Returns:
            Dict 包含:
                - parameters: MusicParameters
                - provider: str (使用的 provider 名稱)

        Raises:
            Exception: 僅在所有 provider（包含 fallback）都失敗時拋出
        """
        for provider_name in self._provider_order:
            # Lazy loading: 只在需要時才載入 provider
            provider = self._get_or_create_provider(provider_name)
            
            if provider is None:
                logger.debug(f"[LLMFactory] {provider_name} provider 不可用，跳過")
                continue
            
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
        available = []
        for provider_name in self._provider_order:
            provider = self._get_or_create_provider(provider_name)
            if provider:
                available.append(provider.name)
        return available
    
    def get_loaded_providers(self) -> List[str]:
        """
        取得已載入到記憶體的 provider 名稱
        
        Returns:
            List[str]: 已載入的 provider 名稱列表
        """
        return list(self._providers_cache.keys())
