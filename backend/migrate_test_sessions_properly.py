#!/usr/bin/env python3
"""
正確遷移測試 reading_sessions 到 completed_readings (使用正規化設計)

這個腳本會：
1. 檢查所有 status != 'complete' 的 reading_sessions
2. 使用更新後的 complete_session 方法來正確完成它們
3. 為每個 session 在 completed_readings 和 reading_card_positions 表中建立對應記錄
"""

import os
import sys
import asyncio
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.db.database import AsyncSessionLocal
from app.services.session_service import SessionService
from sqlalchemy import select, text
from app.models.reading_session import ReadingSession


async def main():
    # Create database session
    async with AsyncSessionLocal() as db:
        try:
            print("正在檢查需要遷移的 reading_sessions...")

            # 獲取所有非 complete 的 sessions
            result = await db.execute(
                select(ReadingSession).where(ReadingSession.status != 'complete')
            )
            sessions = result.scalars().all()

            print(f"\n找到 {len(sessions)} 個需要遷移的 sessions")

            if len(sessions) == 0:
                print("✅ 沒有需要遷移的 sessions")
                return

            # 顯示前 5 個 sessions 的詳細資訊
            print("\n前 5 個 sessions 的資訊：")
            for session in sessions[:5]:
                print(f"  - ID: {session.id}")
                print(f"    Question: {session.question[:50]}...")
                print(f"    Status: {session.status}")
                print(f"    Created: {session.created_at}")

            # 確認是否要繼續
            print("\n" + "="*50)
            print("這個腳本會使用更新後的 complete_session 方法")
            print("為每個 session 建立正規化的 completed_reading 和 reading_card_positions 記錄")
            response = input("\n是否繼續遷移？ (yes/no): ")

            if response.lower() != 'yes':
                print("取消操作")
                return

            # 建立 SessionService
            session_service = SessionService(db)

            migrated_count = 0
            error_count = 0

            print(f"\n開始遷移...")

            for session in sessions:
                try:
                    # 使用 complete_session 方法來正確完成 session
                    result = await session_service.complete_session(
                        session_id=str(session.id),
                        interpretation=None,  # 使用 session_state 中的 interpretation
                        reading_metadata={
                            "character_voice_used": "pip_boy",  # 預設值
                            "karma_context": "neutral",  # 預設值
                            "privacy_level": "private",
                            "allow_public_sharing": False,
                        }
                    )

                    migrated_count += 1
                    print(f"✅ 已遷移: {session.question[:40]}... -> Reading ID: {result['reading_id']}")

                except Exception as e:
                    error_count += 1
                    print(f"❌ 遷移失敗: {session.id} - {str(e)}")

            print(f"\n" + "="*50)
            print(f"遷移完成！")
            print(f"  - 成功: {migrated_count} 個")
            print(f"  - 失敗: {error_count} 個")

            # 驗證結果
            print("\n驗證結果...")

            # 檢查 completed_readings 數量
            reading_count_result = await db.execute(
                text("SELECT COUNT(*) FROM completed_readings")
            )
            reading_count = reading_count_result.scalar()

            # 檢查 reading_card_positions 數量
            position_count_result = await db.execute(
                text("SELECT COUNT(*) FROM reading_card_positions")
            )
            position_count = position_count_result.scalar()

            # 檢查 complete sessions 數量
            complete_sessions_result = await db.execute(
                select(ReadingSession).where(ReadingSession.status == 'complete')
            )
            complete_sessions = complete_sessions_result.scalars().all()

            print(f"  - completed_readings 表: {reading_count} 筆記錄")
            print(f"  - reading_card_positions 表: {position_count} 筆記錄")
            print(f"  - complete sessions: {len(complete_sessions)} 個")

            # 檢查是否還有未完成的 sessions
            remaining_result = await db.execute(
                select(ReadingSession).where(ReadingSession.status != 'complete')
            )
            remaining_sessions = remaining_result.scalars().all()

            if len(remaining_sessions) == 0:
                print("\n✅ 所有 sessions 都已正確遷移！")
            else:
                print(f"\n⚠️  還有 {len(remaining_sessions)} 個未完成的 sessions")

        finally:
            await db.close()


if __name__ == "__main__":
    asyncio.run(main())
