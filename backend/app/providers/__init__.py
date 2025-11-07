"""AI LLM providers package - Optimized with lazy loading."""

from .base import BaseLLMProvider, LLMProviderError
from .factory import LLMProviderFactory

# DO NOT import provider implementations here - they will be lazily loaded
# from .gemini_provider import GeminiProvider  # ❌ Loads google-generativeai SDK (~50MB)
# from .openai_provider import OpenAIProvider  # ❌ Loads openai SDK (~30MB)
# from .fallback_provider import FallbackProvider

__all__ = [
    "BaseLLMProvider",
    "LLMProviderError",
    "LLMProviderFactory",
    # Provider implementations are loaded on-demand by factory
]
