"""
故事驗證服務 - Wasteland Story Mode

提供故事內容的驗證功能，確保故事符合 200-500 字的要求、
陣營有效性、時間格式正確等。
"""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
import re

# 導入共用常數
from app.models.story_constants import (
    VALID_FACTIONS,
    TIMELINE_PATTERNS,
    MIN_VAULT_NUMBER,
    MAX_VAULT_NUMBER,
    MIN_STORY_LENGTH,
    MAX_STORY_LENGTH,
)


@dataclass
class ValidationResult:
    """驗證結果資料類別"""
    valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """轉換為字典（用於 API 回應）"""
        return {
            "valid": self.valid,
            "errors": self.errors,
            "warnings": self.warnings
        }


class StoryValidationService:
    """故事驗證服務"""

    # 使用共用常數
    VALID_FACTIONS = VALID_FACTIONS
    TIMELINE_PATTERNS = TIMELINE_PATTERNS
    MIN_VAULT_NUMBER = MIN_VAULT_NUMBER
    MAX_VAULT_NUMBER = MAX_VAULT_NUMBER
    MIN_TEXT_LENGTH = MIN_STORY_LENGTH
    MAX_TEXT_LENGTH = MAX_STORY_LENGTH

    def validate_story_content(self, story: Dict[str, Any]) -> ValidationResult:
        """
        驗證完整的故事內容

        Args:
            story: 故事資料字典，包含所有故事欄位

        Returns:
            ValidationResult: 驗證結果
        """
        errors = []
        warnings = []

        # 驗證故事背景字數
        if "story_background" in story:
            if not self.validate_text_length(story["story_background"]):
                actual_length = len(story["story_background"])
                errors.append(
                    f"故事背景字數必須在 {self.MIN_TEXT_LENGTH}-{self.MAX_TEXT_LENGTH} 字之間，"
                    f"目前為 {actual_length} 字"
                )

        # 驗證陣營列表
        if "story_faction_involved" in story:
            if not self.validate_faction_list(story["story_faction_involved"]):
                errors.append(
                    f"陣營列表包含無效的陣營。有效陣營：{', '.join(self.VALID_FACTIONS)}"
                )

        # 驗證時間格式
        if "story_timeline" in story:
            if not self.validate_timeline_format(story["story_timeline"]):
                errors.append(
                    f"時間格式無效：'{story['story_timeline']}'。"
                    f"必須是「戰前」、「戰後」或「YYYY 年」格式（例如：2277 年）"
                )

        # 驗證 Vault 編號（如果提供）
        if "vault_number" in story and story["vault_number"] is not None:
            if not self.validate_vault_number(story["vault_number"]):
                errors.append(
                    f"Vault 編號必須在 {self.MIN_VAULT_NUMBER}-{self.MAX_VAULT_NUMBER} 之間"
                )

        return ValidationResult(
            valid=(len(errors) == 0),
            errors=errors,
            warnings=warnings
        )

    def validate_text_length(
        self,
        text: str,
        min_len: int = None,
        max_len: int = None
    ) -> bool:
        """
        驗證繁體中文字數（200-500字）

        Args:
            text: 要驗證的文字
            min_len: 最小字數（預設 200）
            max_len: 最大字數（預設 500）

        Returns:
            bool: 字數是否在範圍內
        """
        if min_len is None:
            min_len = self.MIN_TEXT_LENGTH
        if max_len is None:
            max_len = self.MAX_TEXT_LENGTH

        text_length = len(text)
        return min_len <= text_length <= max_len

    def validate_faction_list(self, factions: List[str]) -> bool:
        """
        驗證陣營列表內容

        Args:
            factions: 陣營列表

        Returns:
            bool: 陣營列表是否有效
        """
        if not isinstance(factions, list):
            return False

        if len(factions) == 0:
            return False

        # 檢查所有陣營是否有效
        for faction in factions:
            if faction not in self.VALID_FACTIONS:
                return False

        return True

    def validate_timeline_format(self, timeline: str) -> bool:
        """
        驗證時間格式：「戰前」、「戰後」或「YYYY 年」

        Args:
            timeline: 時間字串

        Returns:
            bool: 時間格式是否有效
        """
        if not timeline:
            return False

        # 檢查是否符合任一有效格式
        for pattern in self.TIMELINE_PATTERNS:
            if re.match(pattern, timeline):
                return True

        return False

    def validate_vault_number(self, vault_num: Optional[int]) -> bool:
        """
        驗證 Vault 編號（1-122）

        Args:
            vault_num: Vault 編號（可為 None）

        Returns:
            bool: Vault 編號是否有效
        """
        # None 是允許的（可選欄位）
        if vault_num is None:
            return True

        # 檢查範圍
        if not isinstance(vault_num, int):
            return False

        return self.MIN_VAULT_NUMBER <= vault_num <= self.MAX_VAULT_NUMBER
