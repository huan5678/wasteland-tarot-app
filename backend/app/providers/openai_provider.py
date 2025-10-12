"""OpenAI LLM provider."""

import json
import logging
from typing import Any, Dict

from app.models.music import MusicParameters
from .base import BaseLLMProvider, LLMProviderError

logger = logging.getLogger(__name__)


class OpenAIProvider(BaseLLMProvider):
    """
    OpenAI LLM Provider

    使用 OpenAI GPT 模型（預設 gpt-4o-mini）進行音樂參數解析。
    支援 JSON Mode 確保 JSON 格式正確。
    """

    @property
    def name(self) -> str:
        return "openai"

    async def parse_prompt(self, prompt: str) -> MusicParameters:
        """
        使用 OpenAI API 解析 prompt

        Args:
            prompt: 使用者輸入

        Returns:
            MusicParameters: 解析後的音樂參數

        Raises:
            LLMProviderError: API 呼叫失敗時拋出
        """
        try:
            from openai import AsyncOpenAI, OpenAIError
            import asyncio

            # 建立 OpenAI 客戶端
            client = AsyncOpenAI(
                api_key=self.api_key,
                timeout=self.timeout,
            )

            # 呼叫 API
            try:
                response = await asyncio.wait_for(
                    client.chat.completions.create(
                        model=self.model,
                        messages=[
                            {
                                "role": "system",
                                "content": self._build_system_prompt(),
                            },
                            {
                                "role": "user",
                                "content": prompt,
                            }
                        ],
                        response_format={"type": "json_object"},
                        temperature=0.7,
                        max_tokens=500,
                    ),
                    timeout=self.timeout
                )
            except asyncio.TimeoutError:
                raise LLMProviderError(
                    provider_name=self.name,
                    message=f"請求超時（{self.timeout} 秒）",
                )

            # 解析 JSON 回應
            try:
                result = json.loads(response.choices[0].message.content)
            except json.JSONDecodeError as e:
                logger.error(f"[OpenAI] JSON 解析失敗: {response.choices[0].message.content}")
                raise LLMProviderError(
                    provider_name=self.name,
                    message="回應格式錯誤（非有效 JSON）",
                    original_error=e,
                )

            # 驗證並回傳
            return self._validate_parameters(result)

        except LLMProviderError:
            raise
        except OpenAIError as e:
            logger.error(f"[OpenAI] API 錯誤: {str(e)}")
            raise LLMProviderError(
                provider_name=self.name,
                message=f"API 錯誤: {str(e)}",
                original_error=e,
            )
        except Exception as e:
            logger.error(f"[OpenAI] 未預期錯誤: {str(e)}")
            raise LLMProviderError(
                provider_name=self.name,
                message=f"未預期錯誤: {str(e)}",
                original_error=e,
            )
