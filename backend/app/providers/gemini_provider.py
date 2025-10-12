"""Google Gemini LLM provider."""

import json
import logging
from typing import Any, Dict

from app.models.music import MusicParameters
from .base import BaseLLMProvider, LLMProviderError

logger = logging.getLogger(__name__)


class GeminiProvider(BaseLLMProvider):
    """
    Google Gemini LLM Provider

    使用 Google Gemini 2.5 Flash 模型進行音樂參數解析。
    支援 Structured Output 確保 JSON 格式正確。
    """

    @property
    def name(self) -> str:
        return "gemini"

    async def parse_prompt(self, prompt: str) -> MusicParameters:
        """
        使用 Gemini API 解析 prompt

        Args:
            prompt: 使用者輸入

        Returns:
            MusicParameters: 解析後的音樂參數

        Raises:
            LLMProviderError: API 呼叫失敗時拋出
        """
        try:
            import google.generativeai as genai
            import asyncio

            # 配置 Gemini API
            genai.configure(api_key=self.api_key)

            # 建立模型（使用 2.5 Flash）
            model = genai.GenerativeModel(
                model_name=self.model,
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.95,
                    "top_k": 40,
                    "max_output_tokens": 1024,
                    "response_mime_type": "application/json",
                }
            )

            # 建立完整 prompt
            full_prompt = f"{self._build_system_prompt()}\n\n使用者輸入：{prompt}"

            # 呼叫 API（使用 asyncio timeout）
            try:
                response = await asyncio.wait_for(
                    asyncio.to_thread(
                        model.generate_content,
                        full_prompt
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
                result = json.loads(response.text)
            except json.JSONDecodeError as e:
                logger.error(f"[Gemini] JSON 解析失敗: {response.text}")
                raise LLMProviderError(
                    provider_name=self.name,
                    message="回應格式錯誤（非有效 JSON）",
                    original_error=e,
                )

            # 驗證並回傳
            return self._validate_parameters(result)

        except LLMProviderError:
            raise
        except Exception as e:
            logger.error(f"[Gemini] API 呼叫失敗: {str(e)}")
            raise LLMProviderError(
                provider_name=self.name,
                message=f"API 呼叫失敗: {str(e)}",
                original_error=e,
            )
