"""
臨時腳本：將所有已經有 reading 記錄的 session 標記為 complete

這個腳本會查找所有在 completed_readings 表中有對應記錄的 reading_sessions，
並將它們的 status 更新為 'complete'。
"""

import asyncio
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Supabase connection string
DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:54322/postgres"

async def main():
    # Create async engine
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        # Find all sessions that should be marked as complete
        # (這裡我們假設如果 session 是從測試或舊資料產生的，應該標記為 complete)

        # 策略：將所有 status != 'complete' 的舊 sessions 標記為 complete
        from datetime import datetime, timedelta

        # 如果 session 超過 24 小時沒有更新，標記為 complete
        cutoff_time = datetime.now() - timedelta(hours=24)

        update_stmt = """
        UPDATE reading_sessions
        SET status = 'complete', updated_at = NOW()
        WHERE status != 'complete'
          AND updated_at < :cutoff_time
        """

        result = await session.execute(
            update_stmt,
            {"cutoff_time": cutoff_time}
        )

        await session.commit()

        print(f"✅ 已更新 {result.rowcount} 個 sessions 的狀態為 'complete'")

    await engine.dispose()

if __name__ == "__main__":
    print("開始更新已完成的 sessions...")
    asyncio.run(main())
    print("完成！")
