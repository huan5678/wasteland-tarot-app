"""
同步所有用戶的 total_readings 欄位

此腳本會：
1. 查詢所有用戶
2. 計算每個用戶實際的 reading 數量
3. 更新 users 表的 total_readings 欄位
"""

import asyncio
from sqlalchemy import select, func, update
from app.db.database import AsyncSessionLocal
from app.models.user import User
from app.models.reading_session import ReadingSession


async def sync_total_readings():
    """同步所有用戶的 total_readings 欄位"""

    async with AsyncSessionLocal() as db:
        try:
            # 查詢所有用戶
            result = await db.execute(
                select(User.id, User.email, User.name, User.total_readings)
            )
            users = result.all()

            print(f'📊 找到 {len(users)} 個用戶，開始同步...')
            print('=' * 80)

            updated_count = 0

            for user_id, email, name, current_total in users:
                # 計算實際的 reading 數量
                count_result = await db.execute(
                    select(func.count(ReadingSession.id))
                    .where(ReadingSession.user_id == user_id)
                )
                actual_count = count_result.scalar()

                # 如果數量不一致，更新
                if current_total != actual_count:
                    await db.execute(
                        update(User)
                        .where(User.id == user_id)
                        .values(total_readings=actual_count)
                    )

                    print(f'✅ 更新: {name} ({email})')
                    print(f'   ID: {user_id}')
                    print(f'   舊值: {current_total} → 新值: {actual_count}')
                    print()

                    updated_count += 1
                else:
                    print(f'⏭️  跳過: {name} ({email}) - 已同步 ({actual_count})')

            # 提交變更
            await db.commit()

            print('=' * 80)
            print(f'✅ 同步完成！')
            print(f'   總用戶數: {len(users)}')
            print(f'   已更新: {updated_count}')
            print(f'   跳過: {len(users) - updated_count}')

        except Exception as e:
            await db.rollback()
            print(f'❌ 同步失敗: {str(e)}')
            raise


if __name__ == '__main__':
    print('🚀 開始同步 total_readings 欄位...')
    print()
    asyncio.run(sync_total_readings())
    print()
    print('🎉 完成！')
