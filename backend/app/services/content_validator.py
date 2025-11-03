"""
內容驗證工具 - Wishlist Feature

提供 Markdown 內容驗證功能，包含：
- Markdown 語法移除
- 純文字長度計算
- 願望內容驗證（1-500字）
- 管理員回覆驗證（1-1000字）

符合需求：R1.4, R5.2, R11.6
"""

import re
from typing import Optional

from app.core.exceptions import WastelandTarotException
from fastapi import status


class ContentEmptyError(WastelandTarotException):
    """當內容為空或純空白時拋出"""

    def __init__(self, message: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=message or "內容不可為空",
            error_code="CONTENT_EMPTY"
        )


class ContentTooLongError(WastelandTarotException):
    """當內容超過長度限制時拋出"""

    def __init__(
        self,
        message: Optional[str] = None,
        max_length: Optional[int] = None,
        actual_length: Optional[int] = None
    ):
        details = {}
        if max_length is not None:
            details["max_length"] = max_length
        if actual_length is not None:
            details["actual_length"] = actual_length

        if message is None and max_length is not None:
            message = f"內容超過長度限制（最多 {max_length} 字）"

        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=message or "內容過長",
            error_code="CONTENT_TOO_LONG",
            details=details
        )


class ContentValidator:
    """
    內容驗證工具

    提供 Markdown 內容的驗證功能，計算渲染後的純文字長度
    """

    # 字數限制常數
    MIN_WISH_LENGTH = 1
    MAX_WISH_LENGTH = 500
    MIN_ADMIN_REPLY_LENGTH = 1
    MAX_ADMIN_REPLY_LENGTH = 1000

    @staticmethod
    def strip_markdown(text: str) -> str:
        """
        移除 Markdown 語法符號，取得純文字內容

        支援的 Markdown 語法：
        - 程式碼區塊：```language
        - 行內程式碼：`code`
        - 連結：[text](url) → 保留 text
        - 圖片：![alt](url) → 完全移除
        - 標題：#, ##, ###
        - 粗體：**text**, __text__
        - 斜體：*text*, _text_
        - 引用：>
        - 清單符號：-, *, +, 1.

        Args:
            text: 包含 Markdown 語法的文字

        Returns:
            str: 移除 Markdown 語法後的純文字
        """
        if not text:
            return ""

        result = text

        # 1. 移除程式碼區塊 ```...```（包含內容）
        # 使用 DOTALL 讓 . 匹配換行符號
        result = re.sub(r"```[\s\S]*?```", "", result, flags=re.DOTALL)

        # 2. 移除行內程式碼的反引號，但保留內容 `code`
        result = re.sub(r"`([^`]+)`", r"\1", result)

        # 3. 移除圖片（完全移除，包括 alt text）![alt](url)
        result = re.sub(r"!\[([^\]]*)\]\([^\)]+\)", "", result)

        # 4. 移除連結 URL，保留顯示文字 [text](url) → text
        result = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", result)

        # 5. 移除標題符號 #, ##, ###
        result = re.sub(r"^#{1,6}\s+", "", result, flags=re.MULTILINE)

        # 6. 移除粗體符號 **text** 和 __text__（處理巢狀格式）
        # 使用非貪婪匹配，多次執行以處理巢狀情況
        while re.search(r"\*\*(.+?)\*\*", result):
            result = re.sub(r"\*\*(.+?)\*\*", r"\1", result)
        while re.search(r"__(.+?)__", result):
            result = re.sub(r"__(.+?)__", r"\1", result)

        # 7. 移除斜體符號 *text* 和 _text_
        # 使用非貪婪匹配，避免誤刪其他星號
        while re.search(r"(?<!\*)\*(?!\*)([^\*]+?)(?<!\*)\*(?!\*)", result):
            result = re.sub(r"(?<!\*)\*(?!\*)([^\*]+?)(?<!\*)\*(?!\*)", r"\1", result)
        # _ 斜體需要在單詞邊界
        while re.search(r"(?<!_)_(?!_)([^_]+?)(?<!_)_(?!_)", result):
            result = re.sub(r"(?<!_)_(?!_)([^_]+?)(?<!_)_(?!_)", r"\1", result)

        # 8. 移除引用符號 >
        result = re.sub(r"^>\s*", "", result, flags=re.MULTILINE)

        # 9. 移除清單符號 -, *, +, 1., 2. 等
        result = re.sub(r"^[-\*\+]\s+", "", result, flags=re.MULTILINE)
        result = re.sub(r"^\d+\.\s+", "", result, flags=re.MULTILINE)

        return result

    @staticmethod
    def get_plain_text_length(text: str) -> int:
        """
        計算純文字長度（移除 Markdown 語法後）

        Args:
            text: 包含 Markdown 語法的文字

        Returns:
            int: 純文字字元數
        """
        plain_text = ContentValidator.strip_markdown(text)
        return len(plain_text.strip())

    @staticmethod
    def validate_wish_content(content: str) -> None:
        """
        驗證願望內容

        規則：
        - 不可為空或純空白
        - 純文字長度必須在 1-500 字之間

        Args:
            content: 願望內容（可能包含 Markdown）

        Raises:
            ContentEmptyError: 內容為空或純空白
            ContentTooLongError: 內容超過 500 字
        """
        # 檢查是否為空
        if not content or not content.strip():
            raise ContentEmptyError("願望內容不可為空")

        # 計算純文字長度
        plain_length = ContentValidator.get_plain_text_length(content)

        # 檢查是否為空白內容（移除 Markdown 後）
        if plain_length == 0:
            raise ContentEmptyError("願望內容不可為空")

        # 檢查是否超過長度限制
        if plain_length > ContentValidator.MAX_WISH_LENGTH:
            raise ContentTooLongError(
                message=f"願望內容超過長度限制（最多 {ContentValidator.MAX_WISH_LENGTH} 字，目前 {plain_length} 字）",
                max_length=ContentValidator.MAX_WISH_LENGTH,
                actual_length=plain_length
            )

    @staticmethod
    def validate_admin_reply(reply: str) -> None:
        """
        驗證管理員回覆內容

        規則：
        - 不可為空或純空白
        - 純文字長度必須在 1-1000 字之間

        Args:
            reply: 管理員回覆內容（可能包含 Markdown）

        Raises:
            ContentEmptyError: 回覆為空或純空白
            ContentTooLongError: 回覆超過 1000 字
        """
        # 檢查是否為空
        if not reply or not reply.strip():
            raise ContentEmptyError("管理員回覆不可為空")

        # 計算純文字長度
        plain_length = ContentValidator.get_plain_text_length(reply)

        # 檢查是否為空白內容（移除 Markdown 後）
        if plain_length == 0:
            raise ContentEmptyError("管理員回覆不可為空")

        # 檢查是否超過長度限制
        if plain_length > ContentValidator.MAX_ADMIN_REPLY_LENGTH:
            raise ContentTooLongError(
                message=f"管理員回覆超過長度限制（最多 {ContentValidator.MAX_ADMIN_REPLY_LENGTH} 字，目前 {plain_length} 字）",
                max_length=ContentValidator.MAX_ADMIN_REPLY_LENGTH,
                actual_length=plain_length
            )
