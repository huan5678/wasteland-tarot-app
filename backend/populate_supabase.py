#!/usr/bin/env python3
"""
Supabase 資料庫初始化腳本
建立資料表並填入完整的廢土塔羅牌資料
"""

import asyncio
import os
import sys
from pathlib import Path

# 添加專案根目錄到 Python path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.base import Base
from app.models.user import User, UserProfile, UserPreferences
from app.models.wasteland_card import WastelandCard
from app.db.full_wasteland_seed import seed_full_wasteland_database
from app.config import settings


async def create_tables(engine):
    """建立所有資料表"""
    print("🏗️  正在建立資料表...")

    async with engine.begin() as conn:
        # 刪除現有表格 (小心使用!)
        await conn.run_sync(Base.metadata.drop_all)
        print("🗑️  已清除現有表格")

        # 建立新表格
        await conn.run_sync(Base.metadata.create_all)
        print("✅ 資料表建立完成")


async def populate_database():
    """填入資料庫資料"""
    print("🌟 開始建立 Supabase 廢土塔羅牌資料庫...")

    # 確認環境變數
    if not settings.supabase_url or not settings.supabase_key:
        print("❌ 錯誤: 請設定 SUPABASE_URL 和 SUPABASE_KEY 環境變數")
        return False

    # 建立資料庫連線
    print(f"🔗 連接到 Supabase: {settings.supabase_url[:30]}...")

    # 建立 async engine
    engine = create_async_engine(
        settings.database_url,
        echo=False,  # 設為 True 可以看到 SQL 語句
        future=True
    )

    try:
        # 建立資料表
        await create_tables(engine)

        # 建立 session
        async_session = sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )

        async with async_session() as session:
            print("📚 正在建立完整的廢土塔羅牌組...")

            # 填入完整的 78 張牌
            success = await seed_full_wasteland_database(session)

            if success:
                print("🎉 成功建立完整的廢土塔羅牌資料庫!")
                print("📊 資料庫包含:")
                print("   • 22 張大牌 (Major Arcana)")
                print("   • 56 張小牌 (Minor Arcana)")
                print("   • 4 個廢土主題花色")
                print("   • 完整的 Fallout 世界觀整合")
                return True
            else:
                print("❌ 建立資料庫時發生錯誤")
                return False

    except Exception as e:
        print(f"❌ 資料庫操作錯誤: {e}")
        return False
    finally:
        await engine.dispose()


async def verify_database():
    """驗證資料庫內容"""
    print("\n🔍 驗證資料庫內容...")

    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with async_session() as session:
            # 查詢卡牌總數
            from sqlalchemy import select, func

            total_cards = await session.scalar(select(func.count(WastelandCard.id)))
            print(f"📊 總卡牌數量: {total_cards}")

            # 查詢各花色數量
            suits = await session.execute(
                select(WastelandCard.suit, func.count(WastelandCard.id))
                .group_by(WastelandCard.suit)
            )

            print("🃏 各花色分布:")
            for suit, count in suits:
                print(f"   • {suit}: {count} 張")

            # 查詢一些範例卡牌
            sample_cards = await session.execute(
                select(WastelandCard.name, WastelandCard.suit, WastelandCard.radiation_level)
                .limit(5)
            )

            print("🎯 範例卡牌:")
            for name, suit, rad_level in sample_cards:
                print(f"   • {name} ({suit}) - 輻射等級: {rad_level}")

    except Exception as e:
        print(f"❌ 驗證錯誤: {e}")
    finally:
        await engine.dispose()


def check_environment():
    """檢查環境設定"""
    print("🔧 檢查環境設定...")

    required_vars = [
        "SUPABASE_URL",
        "SUPABASE_KEY",
        "DATABASE_URL"
    ]

    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)

    if missing_vars:
        print("❌ 缺少必要的環境變數:")
        for var in missing_vars:
            print(f"   • {var}")
        print("\n請在 .env 檔案中設定這些變數")
        return False

    print("✅ 環境變數設定完整")
    return True


async def main():
    """主執行函數"""
    print("🚀 廢土塔羅牌資料庫初始化工具")
    print("=" * 50)

    # 檢查環境
    if not check_environment():
        sys.exit(1)

    # 詢問使用者確認
    print("\n⚠️  警告: 此操作將清除現有資料庫並重新建立")
    confirm = input("是否繼續? (yes/no): ").lower().strip()

    if confirm not in ['yes', 'y', '是']:
        print("操作已取消")
        sys.exit(0)

    # 執行資料庫初始化
    success = await populate_database()

    if success:
        # 驗證結果
        await verify_database()
        print("\n🎉 資料庫初始化完成!")
        print("現在你的 Supabase 已經包含完整的廢土塔羅牌資料")
    else:
        print("\n❌ 資料庫初始化失敗")
        sys.exit(1)


if __name__ == "__main__":
    # 確保在 backend 目錄執行
    if not Path("app").exists():
        print("❌ 請在 backend 目錄中執行此腳本")
        sys.exit(1)

    # 載入環境變數
    from dotenv import load_dotenv
    load_dotenv()

    # 執行主程式
    asyncio.run(main())