#!/usr/bin/env python3
"""
Supabase Database Connection Module
廢土塔羅牌資料庫連接模組
"""

import os
from typing import Optional, List, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv
import logging
from functools import wraps

# 載入環境變數
load_dotenv()

# 設定日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SupabaseClient:
    """Supabase 客戶端封裝"""

    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not self.supabase_url or not self.supabase_key:
            raise ValueError("缺少必要的環境變數：SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY")

        try:
            self.client: Client = create_client(self.supabase_url, self.supabase_key)
            logger.info("✅ Supabase 連接初始化成功")
        except Exception as e:
            logger.error(f"❌ Supabase 連接初始化失敗: {e}")
            raise

    def get_client(self) -> Client:
        """取得 Supabase 客戶端"""
        return self.client

# 全域 Supabase 客戶端實例
supabase_client: Optional[SupabaseClient] = None

def get_supabase_client() -> Client:
    """取得 Supabase 客戶端實例"""
    global supabase_client

    if supabase_client is None:
        supabase_client = SupabaseClient()

    return supabase_client.get_client()

def handle_database_error(func):
    """資料庫錯誤處理裝飾器"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            logger.error(f"資料庫操作錯誤 in {func.__name__}: {e}")
            raise ValueError(f"資料庫操作失敗: {str(e)}")
    return wrapper

class CardRepository:
    """卡牌資料存取層"""

    def __init__(self):
        self.client = get_supabase_client()
        self.table_name = 'wasteland_cards'

    @handle_database_error
    async def get_all_cards(
        self,
        suit: Optional[str] = None,
        karma: Optional[str] = None,
        min_radiation: Optional[float] = None,
        max_radiation: Optional[float] = None,
        page: int = 1,
        per_page: int = 10
    ) -> Dict[str, Any]:
        """獲取所有卡牌（支援篩選和分頁）"""

        query = self.client.table(self.table_name).select("*")

        # 套用篩選條件
        if suit:
            query = query.eq('suit', suit)

        if karma:
            # 根據業力對齊篩選不同的解讀欄位
            karma_field = f"{karma.lower()}_interpretation"
            query = query.not_.is_(karma_field, 'null')

        if min_radiation is not None:
            query = query.gte('radiation_level', min_radiation)

        if max_radiation is not None:
            query = query.lte('radiation_level', max_radiation)

        # 計算總數
        count_result = query.execute()
        total = len(count_result.data) if count_result.data else 0

        # 套用分頁
        offset = (page - 1) * per_page
        paginated_query = query.range(offset, offset + per_page - 1)

        result = paginated_query.execute()

        return {
            'cards': result.data or [],
            'total': total,
            'page': page,
            'per_page': per_page
        }

    @handle_database_error
    async def get_card_by_id(self, card_id: str) -> Optional[Dict[str, Any]]:
        """根據ID獲取單張卡牌"""

        result = self.client.table(self.table_name).select("*").eq('id', card_id).execute()

        if result.data:
            return result.data[0]

        return None

    @handle_database_error
    async def get_random_cards(
        self,
        count: int = 1,
        karma_influence: Optional[str] = None,
        radiation_zone: bool = False
    ) -> List[Dict[str, Any]]:
        """獲取隨機卡牌"""

        query = self.client.table(self.table_name).select("*")

        # 套用篩選條件
        if radiation_zone:
            query = query.gte('radiation_level', 0.5)

        if karma_influence:
            karma_field = f"{karma_influence.lower()}_interpretation"
            query = query.not_.is_(karma_field, 'null')

        # 執行查詢並取得所有符合條件的卡牌
        result = query.execute()

        if not result.data:
            return []

        # 使用 PostgreSQL 的 TABLESAMPLE 或者 Python 隨機選擇
        # 這裡使用 Python 隨機選擇以確保相容性
        import random
        available_cards = result.data

        if len(available_cards) <= count:
            return available_cards

        return random.sample(available_cards, count)

class SpreadRepository:
    """牌陣資料存取層"""

    def __init__(self):
        self.client = get_supabase_client()
        # 注意：目前我們先使用硬編碼的牌陣模板
        # 在實際應用中，這些也會存在資料庫中
        self.spreads = [
            {
                "id": "three_card",
                "name": "廢土三卡牌陣",
                "type": "THREE_CARD",
                "description": "簡單而有效的三張卡牌陣，代表過去、現在、未來",
                "difficulty": 1,
                "card_count": 3,
                "positions": ["過去的影響", "現在的情況", "未來的走向"]
            },
            {
                "id": "celtic_cross",
                "name": "廢土凱爾特十字",
                "type": "CELTIC_CROSS",
                "description": "經典的十張卡牌陣，適合深度探索問題的各個層面",
                "difficulty": 4,
                "card_count": 10,
                "positions": ["現在情況", "挑戰", "遠程過去", "近期過去", "可能結果", "近期未來", "你的方法", "外界影響", "希望與恐懼", "最終結果"]
            },
            {
                "id": "vault_tec_spread",
                "name": "Vault-Tec 生存指南牌陣",
                "type": "VAULT_TEC_SPREAD",
                "description": "專為廢土求生設計的五卡牌陣",
                "difficulty": 2,
                "card_count": 5,
                "positions": ["當前資源", "威脅評估", "求生策略", "盟友支援", "最終結果"]
            },
            {
                "id": "brotherhood_council",
                "name": "兄弟會議會牌陣",
                "type": "BROTHERHOOD_COUNCIL",
                "description": "仿照鋼鐵兄弟會議會決策的七卡牌陣",
                "difficulty": 3,
                "card_count": 7,
                "positions": ["科技評估", "威脅分析", "資源狀況", "戰略選項", "道德考量", "長期影響", "議會決議"]
            }
        ]

    async def get_all_spreads(self, difficulty: Optional[int] = None) -> List[Dict[str, Any]]:
        """獲取所有牌陣模板"""

        spreads = self.spreads.copy()

        if difficulty:
            spreads = [spread for spread in spreads if spread["difficulty"] == difficulty]

        return spreads

    async def get_spread_by_id(self, spread_id: str) -> Optional[Dict[str, Any]]:
        """根據ID獲取牌陣模板"""

        for spread in self.spreads:
            if spread["id"] == spread_id:
                return spread

        return None

# 初始化資料存取層實例
card_repository = CardRepository()
spread_repository = SpreadRepository()