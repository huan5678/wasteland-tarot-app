"""
Anthropic Claude Provider Implementation
Uses Claude models for tarot interpretation
"""

import logging
from typing import Optional, Any, AsyncIterator
from anthropic import AsyncAnthropic, APIError, APIConnectionError, RateLimitError

from app.services.ai_providers.base import AIProvider

logger = logging.getLogger(__name__)


class AnthropicProvider(AIProvider):
    """Anthropic Claude provider implementation"""

    def __init__(
        self,
        api_key: str,
        model: str = "claude-3-5-sonnet-20241022"
    ):
        """
        Initialize Anthropic provider

        Args:
            api_key: Anthropic API key
            model: Model name (claude-3-5-sonnet, claude-3-opus, etc.)
        """
        self.api_key = api_key
        self.model = model
        self.client: Optional[AsyncAnthropic] = None

        self._initialize_client()

    def _initialize_client(self) -> None:
        """Initialize Anthropic client"""
        try:
            self.client = AsyncAnthropic(api_key=self.api_key)
            logger.info(f"Anthropic provider initialized successfully with model {self.model}")
        except Exception as e:
            logger.error(f"Failed to initialize Anthropic client: {e}")
            self.client = None

    async def generate_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 500,
        temperature: float = 0.8,
        **kwargs: Any
    ) -> Optional[str]:
        """
        Generate completion using Anthropic API

        Args:
            system_prompt: System instructions
            user_prompt: User message
            max_tokens: Maximum tokens in response
            temperature: Response randomness (0-1)
            **kwargs: Additional Anthropic-specific parameters

        Returns:
            Generated text or None if failed
        """
        if not self.client:
            logger.warning("Anthropic client not initialized")
            return None

        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": user_prompt
                    }
                ],
                **kwargs
            )

            if response.content and len(response.content) > 0:
                text = response.content[0].text
                if text:
                    return text.strip()

            logger.warning("Anthropic returned empty response")
            return None

        except RateLimitError as e:
            logger.error(f"Anthropic rate limit exceeded: {e}")
            return None
        except APIConnectionError as e:
            logger.error(f"Anthropic connection error: {e}")
            return None
        except APIError as e:
            logger.error(f"Anthropic API error: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in Anthropic provider: {e}", exc_info=True)
            return None

    async def generate_completion_stream(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 500,
        temperature: float = 0.8,
        **kwargs: Any
    ) -> AsyncIterator[str]:
        """
        Generate completion using Anthropic API with streaming

        Args:
            system_prompt: System instructions
            user_prompt: User message
            max_tokens: Maximum tokens in response
            temperature: Response randomness (0-1)
            **kwargs: Additional Anthropic-specific parameters

        Yields:
            Text chunks as they are generated
        """
        if not self.client:
            logger.warning("Anthropic client not initialized")
            return

        try:
            async with self.client.messages.stream(
                model=self.model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": user_prompt
                    }
                ],
                **kwargs
            ) as stream:
                async for text in stream.text_stream:
                    yield text

        except RateLimitError as e:
            logger.error(f"Anthropic rate limit exceeded: {e}")
            return
        except APIConnectionError as e:
            logger.error(f"Anthropic connection error: {e}")
            return
        except APIError as e:
            logger.error(f"Anthropic API error: {e}")
            return
        except Exception as e:
            logger.error(f"Unexpected error in Anthropic streaming: {e}", exc_info=True)
            return

    def is_available(self) -> bool:
        """Check if Anthropic provider is available"""
        return self.client is not None

    def get_provider_name(self) -> str:
        """Get provider name"""
        return "anthropic"

    def get_model_name(self) -> str:
        """Get current model name"""
        return self.model

    def get_estimated_cost_per_request(self) -> float:
        """
        Get estimated cost per request

        Based on typical 150-250 word output (~300-400 tokens)
        and ~200 token input prompts

        Returns:
            Estimated cost in USD
        """
        # Claude 3.5 Sonnet pricing (as of 2024)
        # Input: $3.00 per 1M tokens
        # Output: $15.00 per 1M tokens
        if "haiku" in self.model.lower():
            # Claude 3 Haiku: $0.25/$1.25 per 1M tokens
            input_cost = 200 * 0.25 / 1_000_000
            output_cost = 400 * 1.25 / 1_000_000
            return input_cost + output_cost  # ~$0.00055
        elif "opus" in self.model.lower():
            # Claude 3 Opus: $15.00/$75.00 per 1M tokens
            input_cost = 200 * 15.00 / 1_000_000
            output_cost = 400 * 75.00 / 1_000_000
            return input_cost + output_cost  # ~$0.033
        else:
            # Claude 3.5 Sonnet pricing
            input_cost = 200 * 3.00 / 1_000_000
            output_cost = 400 * 15.00 / 1_000_000
            return input_cost + output_cost  # ~$0.0066