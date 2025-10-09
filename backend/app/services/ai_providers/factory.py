"""
AI Provider Factory
Creates appropriate AI provider based on configuration
"""

import logging
from typing import Optional
from app.services.ai_providers.base import AIProvider
from app.services.ai_providers.openai_provider import OpenAIProvider
from app.services.ai_providers.gemini_provider import GeminiProvider
from app.services.ai_providers.anthropic_provider import AnthropicProvider

logger = logging.getLogger(__name__)


def create_ai_provider(
    provider_name: str,
    api_key: str,
    model: str,
    **kwargs
) -> Optional[AIProvider]:
    """
    Factory function to create AI provider instances

    Args:
        provider_name: Provider name ('openai', 'gemini', 'anthropic')
        api_key: API key for the provider
        model: Model name to use
        **kwargs: Additional provider-specific parameters

    Returns:
        AIProvider instance or None if provider is invalid

    Raises:
        ValueError: If provider name is unknown
    """
    provider_name_lower = provider_name.lower().strip()

    if provider_name_lower == "openai":
        logger.info(f"Creating OpenAI provider with model {model}")
        return OpenAIProvider(
            api_key=api_key,
            model=model,
            organization=kwargs.get("organization")
        )

    elif provider_name_lower == "gemini":
        logger.info(f"Creating Gemini provider with model {model}")
        return GeminiProvider(
            api_key=api_key,
            model=model
        )

    elif provider_name_lower == "anthropic":
        logger.info(f"Creating Anthropic provider with model {model}")
        return AnthropicProvider(
            api_key=api_key,
            model=model
        )

    else:
        raise ValueError(
            f"Unknown AI provider: {provider_name}. "
            f"Supported providers: openai, gemini, anthropic"
        )


def auto_select_provider(
    openai_key: Optional[str] = None,
    gemini_key: Optional[str] = None,
    anthropic_key: Optional[str] = None,
    preferred_provider: Optional[str] = None,
    **kwargs
) -> Optional[tuple[str, str]]:
    """
    Automatically select best available provider

    Priority order:
    1. Preferred provider if specified and available
    2. OpenAI (best balance of cost and quality)
    3. Gemini (most cost-effective)
    4. Anthropic (highest quality)

    Args:
        openai_key: OpenAI API key
        gemini_key: Gemini API key
        anthropic_key: Anthropic API key
        preferred_provider: Preferred provider name
        **kwargs: Additional configuration

    Returns:
        Tuple of (provider_name, api_key) or None if no provider available
    """
    # Check preferred provider first
    if preferred_provider:
        preferred = preferred_provider.lower().strip()
        if preferred == "openai" and openai_key:
            logger.info("Using preferred provider: OpenAI")
            return ("openai", openai_key)
        elif preferred == "gemini" and gemini_key:
            logger.info("Using preferred provider: Gemini")
            return ("gemini", gemini_key)
        elif preferred == "anthropic" and anthropic_key:
            logger.info("Using preferred provider: Anthropic")
            return ("anthropic", anthropic_key)
        else:
            logger.warning(
                f"Preferred provider {preferred_provider} not available, "
                f"falling back to auto-selection"
            )

    # Auto-select based on availability (priority order)
    if openai_key:
        logger.info("Auto-selected provider: OpenAI")
        return ("openai", openai_key)

    if gemini_key:
        logger.info("Auto-selected provider: Gemini")
        return ("gemini", gemini_key)

    if anthropic_key:
        logger.info("Auto-selected provider: Anthropic")
        return ("anthropic", anthropic_key)

    logger.warning("No AI provider available (no API keys configured)")
    return None