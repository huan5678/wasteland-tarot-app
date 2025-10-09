"""
OpenAI Provider Implementation
Uses GPT-4 models for tarot interpretation
"""

import logging
from typing import Optional, Any, AsyncIterator
from openai import AsyncOpenAI, APIError, APIConnectionError, RateLimitError

from app.services.ai_providers.base import AIProvider

logger = logging.getLogger(__name__)


class OpenAIProvider(AIProvider):
    """OpenAI GPT-4 provider implementation"""

    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4o",
        organization: Optional[str] = None
    ):
        """
        Initialize OpenAI provider

        Args:
            api_key: OpenAI API key
            model: Model name (gpt-4o, gpt-4o-mini, etc.)
            organization: Optional organization ID
        """
        self.api_key = api_key
        self.model = model
        self.organization = organization
        self.client: Optional[AsyncOpenAI] = None

        self._initialize_client()

    def _initialize_client(self) -> None:
        """Initialize OpenAI client"""
        try:
            kwargs = {"api_key": self.api_key}
            if self.organization:
                kwargs["organization"] = self.organization

            self.client = AsyncOpenAI(**kwargs)
            logger.info(f"OpenAI provider initialized successfully with model {self.model}")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
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
        Generate completion using OpenAI API

        Args:
            system_prompt: System instructions
            user_prompt: User message
            max_tokens: Maximum tokens in response
            temperature: Response randomness (0-2 for OpenAI)
            **kwargs: Additional OpenAI-specific parameters

        Returns:
            Generated text or None if failed
        """
        if not self.client:
            logger.warning("OpenAI client not initialized")
            return None

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature,
                **kwargs
            )

            if response.choices and len(response.choices) > 0:
                content = response.choices[0].message.content
                if content:
                    return content.strip()

            logger.warning("OpenAI returned empty response")
            return None

        except RateLimitError as e:
            logger.error(f"OpenAI rate limit exceeded: {e}")
            return None
        except APIConnectionError as e:
            logger.error(f"OpenAI connection error: {e}")
            return None
        except APIError as e:
            logger.error(f"OpenAI API error: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in OpenAI provider: {e}", exc_info=True)
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
        Generate completion using OpenAI API with streaming

        Args:
            system_prompt: System instructions
            user_prompt: User message
            max_tokens: Maximum tokens in response
            temperature: Response randomness (0-2 for OpenAI)
            **kwargs: Additional OpenAI-specific parameters

        Yields:
            Text chunks as they are generated
        """
        if not self.client:
            logger.warning("OpenAI client not initialized")
            return

        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature,
                stream=True,
                **kwargs
            )

            async for chunk in stream:
                if chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    if delta.content:
                        yield delta.content

        except RateLimitError as e:
            logger.error(f"OpenAI rate limit exceeded: {e}")
            return
        except APIConnectionError as e:
            logger.error(f"OpenAI connection error: {e}")
            return
        except APIError as e:
            logger.error(f"OpenAI API error: {e}")
            return
        except Exception as e:
            logger.error(f"Unexpected error in OpenAI streaming: {e}", exc_info=True)
            return

    def is_available(self) -> bool:
        """Check if OpenAI provider is available"""
        return self.client is not None

    def get_provider_name(self) -> str:
        """Get provider name"""
        return "openai"

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
        # GPT-4o pricing (as of 2024)
        # Input: $2.50 per 1M tokens
        # Output: $10.00 per 1M tokens
        if "gpt-4o-mini" in self.model:
            # GPT-4o-mini: $0.15/$0.60 per 1M tokens
            input_cost = 200 * 0.15 / 1_000_000
            output_cost = 400 * 0.60 / 1_000_000
            return input_cost + output_cost  # ~$0.00027
        else:
            # GPT-4o standard pricing
            input_cost = 200 * 2.50 / 1_000_000
            output_cost = 400 * 10.00 / 1_000_000
            return input_cost + output_cost  # ~$0.0045