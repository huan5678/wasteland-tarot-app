"""
Google Gemini Provider Implementation
Uses Gemini 1.5 models for tarot interpretation
"""

import logging
from typing import Optional, Any, AsyncIterator
import google.generativeai as genai
from google.api_core import exceptions as google_exceptions

from app.services.ai_providers.base import AIProvider

logger = logging.getLogger(__name__)


class GeminiProvider(AIProvider):
    """Google Gemini provider implementation"""

    def __init__(
        self,
        api_key: str,
        model: str = "gemini-1.5-pro"
    ):
        """
        Initialize Gemini provider

        Args:
            api_key: Google API key
            model: Model name (gemini-1.5-pro, gemini-1.5-flash, etc.)
        """
        self.api_key = api_key
        self.model_name = model
        self.client = None
        self._initialized = False

        self._initialize_client()

    def _initialize_client(self) -> None:
        """Initialize Gemini client"""
        try:
            genai.configure(api_key=self.api_key)
            self.client = genai.GenerativeModel(self.model_name)
            self._initialized = True
            logger.info(f"Gemini provider initialized successfully with model {self.model_name}")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            self.client = None
            self._initialized = False

    async def generate_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 500,
        temperature: float = 0.8,
        **kwargs: Any
    ) -> Optional[str]:
        """
        Generate completion using Gemini API

        Args:
            system_prompt: System instructions
            user_prompt: User message
            max_tokens: Maximum tokens in response
            temperature: Response randomness (0-1)
            **kwargs: Additional Gemini-specific parameters

        Returns:
            Generated text or None if failed
        """
        if not self.client or not self._initialized:
            logger.warning("Gemini client not initialized")
            return None

        try:
            # Gemini combines system and user prompts differently
            # We prepend system instructions to the user prompt
            combined_prompt = f"{system_prompt}\n\n{user_prompt}"

            # Configure generation parameters
            generation_config = genai.types.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=temperature,
                **kwargs
            )

            # Generate content
            response = await self.client.generate_content_async(
                combined_prompt,
                generation_config=generation_config
            )

            if response and response.text:
                return response.text.strip()

            logger.warning("Gemini returned empty response")
            return None

        except google_exceptions.ResourceExhausted as e:
            logger.error(f"Gemini rate limit exceeded: {e}")
            return None
        except google_exceptions.GoogleAPIError as e:
            logger.error(f"Gemini API error: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in Gemini provider: {e}", exc_info=True)
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
        Generate completion using Gemini API with streaming

        Args:
            system_prompt: System instructions
            user_prompt: User message
            max_tokens: Maximum tokens in response
            temperature: Response randomness (0-1)
            **kwargs: Additional Gemini-specific parameters

        Yields:
            Text chunks as they are generated
        """
        if not self.client or not self._initialized:
            logger.warning("Gemini client not initialized")
            return

        try:
            # Gemini combines system and user prompts
            combined_prompt = f"{system_prompt}\n\n{user_prompt}"

            # Configure generation parameters
            generation_config = genai.types.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=temperature,
                **kwargs
            )

            # Generate content with streaming
            response = await self.client.generate_content_async(
                combined_prompt,
                generation_config=generation_config,
                stream=True
            )

            async for chunk in response:
                if chunk.text:
                    yield chunk.text

        except google_exceptions.ResourceExhausted as e:
            logger.error(f"Gemini rate limit exceeded: {e}")
            return
        except google_exceptions.GoogleAPIError as e:
            logger.error(f"Gemini API error: {e}")
            return
        except Exception as e:
            logger.error(f"Unexpected error in Gemini streaming: {e}", exc_info=True)
            return

    def is_available(self) -> bool:
        """Check if Gemini provider is available"""
        return self._initialized and self.client is not None

    def get_provider_name(self) -> str:
        """Get provider name"""
        return "gemini"

    def get_model_name(self) -> str:
        """Get current model name"""
        return self.model_name

    def get_estimated_cost_per_request(self) -> float:
        """
        Get estimated cost per request

        Based on typical 150-250 word output (~300-400 tokens)
        and ~200 token input prompts

        Returns:
            Estimated cost in USD
        """
        # Gemini 1.5 Pro pricing (as of 2024)
        # Input: $1.25 per 1M tokens
        # Output: $5.00 per 1M tokens
        if "flash" in self.model_name.lower():
            # Gemini 1.5 Flash: $0.075/$0.30 per 1M tokens
            input_cost = 200 * 0.075 / 1_000_000
            output_cost = 400 * 0.30 / 1_000_000
            return input_cost + output_cost  # ~$0.00014
        else:
            # Gemini 1.5 Pro pricing
            input_cost = 200 * 1.25 / 1_000_000
            output_cost = 400 * 5.00 / 1_000_000
            return input_cost + output_cost  # ~$0.0023