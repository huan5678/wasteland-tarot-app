"""
OpenAI Provider Implementation
Supports both GPT-4 (Chat Completions API) and GPT-5 (Responses API)
"""

import logging
from typing import Optional, Any, AsyncIterator
from openai import AsyncOpenAI, APIError, APIConnectionError, RateLimitError

from app.services.ai_providers.base import AIProvider

logger = logging.getLogger(__name__)


class OpenAIProvider(AIProvider):
    """OpenAI provider supporting both GPT-4 and GPT-5 series models"""

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
            model: Model name (gpt-4o, gpt-4o-mini, gpt-5, gpt-5-mini, gpt-5-nano)
            organization: Optional organization ID
        """
        self.api_key = api_key
        self.model = model
        self.organization = organization
        self.client: Optional[AsyncOpenAI] = None

        # Detect if this is a GPT-5 series model
        self.is_gpt5 = self._is_gpt5_model(model)

        self._initialize_client()

    def _is_gpt5_model(self, model: str) -> bool:
        """Check if model is GPT-5 series (uses Responses API)"""
        gpt5_models = ["gpt-5", "gpt-5-mini", "gpt-5-nano", "gpt-5-chat-latest"]
        return any(model.startswith(gpt5_model) for gpt5_model in gpt5_models)

    def _initialize_client(self) -> None:
        """Initialize OpenAI client"""
        try:
            kwargs = {"api_key": self.api_key}
            if self.organization:
                kwargs["organization"] = self.organization

            self.client = AsyncOpenAI(**kwargs)
            api_type = "Responses API" if self.is_gpt5 else "Chat Completions API"
            logger.info(f"OpenAI provider initialized successfully with model {self.model} ({api_type})")
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
            temperature: Response randomness (0-2, ignored for GPT-5)
            **kwargs: Additional OpenAI-specific parameters

        Returns:
            Generated text or None if failed
        """
        if not self.client:
            logger.warning("OpenAI client not initialized")
            return None

        try:
            if self.is_gpt5:
                # GPT-5 Responses API
                # Combine system and user prompts into single input
                combined_input = f"{system_prompt}\n\n{user_prompt}"

                response = await self.client.responses.create(
                    model=self.model,
                    input=combined_input,
                    reasoning={"effort": kwargs.get("reasoning_effort", "minimal")},
                    text={"verbosity": kwargs.get("text_verbosity", "low")},
                    max_output_tokens=max_tokens
                )

                # Extract output text from response
                if hasattr(response, 'output_text') and response.output_text:
                    return response.output_text.strip()

                logger.warning("OpenAI GPT-5 returned empty response")
                return None
            else:
                # GPT-4 Chat Completions API
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    max_completion_tokens=max_tokens,
                    temperature=temperature,
                    **kwargs
                )

                if response.choices and len(response.choices) > 0:
                    content = response.choices[0].message.content
                    if content:
                        return content.strip()

                logger.warning("OpenAI GPT-4 returned empty response")
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
            temperature: Response randomness (0-2, ignored for GPT-5)
            **kwargs: Additional OpenAI-specific parameters

        Yields:
            Text chunks as they are generated
        """
        if not self.client:
            logger.warning("OpenAI client not initialized")
            return

        try:
            if self.is_gpt5:
                # GPT-5 Responses API with streaming
                combined_input = f"{system_prompt}\n\n{user_prompt}"

                stream = await self.client.responses.create(
                    model=self.model,
                    input=combined_input,
                    reasoning={"effort": kwargs.get("reasoning_effort", "minimal")},
                    text={"verbosity": kwargs.get("text_verbosity", "low")},
                    max_output_tokens=max_tokens,
                    stream=True
                )

                async for chunk in stream:
                    # GPT-5 streaming returns delta with text content
                    if hasattr(chunk, 'delta') and hasattr(chunk.delta, 'text'):
                        if chunk.delta.text:
                            yield chunk.delta.text
                    # Fallback: check for direct text attribute
                    elif hasattr(chunk, 'text') and chunk.text:
                        yield chunk.text
            else:
                # GPT-4 Chat Completions API with streaming
                stream = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    max_completion_tokens=max_tokens,
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
        # GPT-5 pricing (estimated, as of 2025)
        if "gpt-5-nano" in self.model:
            # GPT-5-nano: High-throughput, lowest cost
            input_cost = 200 * 0.10 / 1_000_000
            output_cost = 400 * 0.40 / 1_000_000
            return input_cost + output_cost  # ~$0.00018
        elif "gpt-5-mini" in self.model:
            # GPT-5-mini: Balanced cost and capability
            input_cost = 200 * 0.20 / 1_000_000
            output_cost = 400 * 0.80 / 1_000_000
            return input_cost + output_cost  # ~$0.00036
        elif "gpt-5" in self.model:
            # GPT-5: Full reasoning model
            input_cost = 200 * 3.00 / 1_000_000
            output_cost = 400 * 12.00 / 1_000_000
            return input_cost + output_cost  # ~$0.0054

        # GPT-4 pricing (as of 2024)
        elif "gpt-4o-mini" in self.model:
            # GPT-4o-mini: $0.15/$0.60 per 1M tokens
            input_cost = 200 * 0.15 / 1_000_000
            output_cost = 400 * 0.60 / 1_000_000
            return input_cost + output_cost  # ~$0.00027
        else:
            # GPT-4o standard pricing
            input_cost = 200 * 2.50 / 1_000_000
            output_cost = 400 * 10.00 / 1_000_000
            return input_cost + output_cost  # ~$0.0045
