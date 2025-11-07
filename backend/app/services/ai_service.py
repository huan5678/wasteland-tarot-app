"""AI music generation service layer."""

import logging
from typing import Dict, Any
from uuid import UUID

from supabase import Client
from fastapi import HTTPException, status

from app.models.music import QuotaResponse, MusicParameters
from app.providers.factory import LLMProviderFactory

logger = logging.getLogger(__name__)


class AIService:
    """
    AI 音樂生成服務層

    處理 AI 音樂參數生成、配額管理。
    """

    def __init__(self, supabase: Client):
        """
        初始化服務

        Args:
            supabase: Supabase 客戶端
        """
        self.supabase = supabase
        self.llm_factory = LLMProviderFactory()

    async def generate_music_parameters(
        self,
        user_id: UUID,
        prompt: str,
    ) -> Dict[str, Any]:
        """
        AI 音樂生成（參數解析）

        邏輯:
        1. 檢查使用者配額
        2. 若配額用盡，回傳 403
        3. 呼叫 LLM Provider Factory
        4. 驗證 JSON 格式
        5. 回傳參數（不扣配額，儲存時才扣）

        Args:
            user_id: 使用者 ID
            prompt: 使用者輸入的 prompt

        Returns:
            Dict 包含:
                - parameters: MusicParameters
                - provider: str
                - quota_remaining: int

        Raises:
            HTTPException: 配額用盡或生成失敗時拋出
        """
        try:
            # Step 1: 檢查配額
            quota_response = await self.get_user_quota(user_id)

            if quota_response.remaining <= 0:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"本月配額已用完（{quota_response.used_quota}/{quota_response.monthly_quota}），下月 1 日重置",
                )

            # Step 2: 呼叫 LLM Provider Factory
            result = await self.llm_factory.parse_prompt(prompt)

            logger.info(
                f"[AIService] AI 生成成功: user_id={user_id}, provider={result['provider']}"
            )

            return {
                "parameters": result["parameters"],
                "provider": result["provider"],
                "quota_remaining": quota_response.remaining,
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[AIService] AI 生成失敗: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"AI 生成失敗: {str(e)}",
            )

    async def get_user_quota(
        self,
        user_id: UUID,
    ) -> QuotaResponse:
        """
        查詢使用者配額

        Args:
            user_id: 使用者 ID

        Returns:
            QuotaResponse: 配額資訊

        Raises:
            HTTPException: 查詢失敗時拋出
        """
        try:
            # 查詢配額
            response = self.supabase.table("user_ai_quotas") \
                .select("*") \
                .eq("user_id", str(user_id)) \
                .execute()

            if not response.data:
                # 若配額記錄不存在，建立預設配額
                insert_response = self.supabase.table("user_ai_quotas") \
                    .insert({
                        "user_id": str(user_id),
                        "monthly_quota": 20,
                        "used_quota": 0,
                    }) \
                    .execute()

                if not insert_response.data:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="建立配額記錄失敗",
                    )

                response.data = insert_response.data
                logger.info(f"[AIService] 已建立預設配額: user_id={user_id}")

            from app.models.music import UserAIQuota
            quota = UserAIQuota(**response.data[0])

            return QuotaResponse.from_quota(quota)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[AIService] 查詢配額失敗: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="查詢配額失敗",
            )
