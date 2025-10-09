"""
Abstract Base Provider Protocol for AI Interpretation Services
Defines the interface that all AI providers must implement
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, AsyncIterator


class AIProvider(ABC):
    """Abstract base class for AI providers"""

    @abstractmethod
    async def generate_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 500,
        temperature: float = 0.8,
        **kwargs: Any
    ) -> Optional[str]:
        """
        Generate AI completion based on system and user prompts

        Args:
            system_prompt: System-level instructions for the AI
            user_prompt: User's request/question
            max_tokens: Maximum tokens in response
            temperature: Randomness of response (0-1)
            **kwargs: Provider-specific additional parameters

        Returns:
            Generated text or None if failed
        """
        pass

    @abstractmethod
    async def generate_completion_stream(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 500,
        temperature: float = 0.8,
        **kwargs: Any
    ) -> AsyncIterator[str]:
        """
        Generate AI completion as a stream of text chunks

        Args:
            system_prompt: System-level instructions for the AI
            user_prompt: User's request/question
            max_tokens: Maximum tokens in response
            temperature: Randomness of response (0-1)
            **kwargs: Provider-specific additional parameters

        Yields:
            Text chunks as they are generated
        """
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if provider is properly configured and available"""
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """Get the name of this provider"""
        pass

    @abstractmethod
    def get_model_name(self) -> str:
        """Get the current model name being used"""
        pass

    def get_estimated_cost_per_request(self) -> float:
        """
        Get estimated cost per typical request (optional)

        Returns:
            Estimated cost in USD
        """
        return 0.0

    def get_provider_info(self) -> Dict[str, Any]:
        """Get provider metadata"""
        return {
            "provider": self.get_provider_name(),
            "model": self.get_model_name(),
            "available": self.is_available(),
            "estimated_cost": self.get_estimated_cost_per_request(),
        }
