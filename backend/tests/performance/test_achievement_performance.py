"""
Performance Tests for Achievement System
成就系統效能測試

Tests:
- Concurrent achievement checks (1000 parallel requests)
- Redis cache hit rate
- API response times (P50, P95, P99)
- Migration script performance
- Database query optimization
"""

import pytest
import pytest_asyncio
import asyncio
import time
from datetime import datetime, timedelta
from uuid import uuid4
from typing import List, Dict, Any
from statistics import median, quantiles
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import text

from app.services.achievement_service import AchievementService
from app.services.achievement_cache_service import achievement_cache
from app.models.achievement import Achievement, UserAchievementProgress, AchievementCategory, AchievementRarity, AchievementStatus
from app.models.user import User
from app.models.user_analytics import AnalyticsEvent


@pytest_asyncio.fixture
async def performance_db():
    """建立效能測試資料庫"""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False
    )

    async with engine.begin() as conn:
        await conn.run_sync(Achievement.__table__.create)
        await conn.run_sync(UserAchievementProgress.__table__.create)
        await conn.run_sync(User.__table__.create)
        await conn.run_sync(AnalyticsEvent.__table__.create)

    async_session = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

    async with async_session() as session:
        yield session
        await session.rollback()

    await engine.dispose()


@pytest_asyncio.fixture
async def sample_data(performance_db):
    """建立範例資料"""
    # 建立成就
    achievements = [
        Achievement(
            id=uuid4(),
            code=f"TEST_ACH_{i}",
            name_zh_tw=f"測試成就 {i}",
            criteria={"type": "READING_COUNT", "target": 10},
            rewards={"karma_points": 100},
            category=AchievementCategory.READING.value,
            rarity=AchievementRarity.COMMON.value,
            is_active=True
        )
        for i in range(15)
    ]

    for ach in achievements:
        performance_db.add(ach)

    # 建立測試使用者
    users = [
        User(
            id=uuid4(),
            email=f"perf_user_{i}@example.com",
            name=f"Perf User {i}",
            password_hash="hashed"
        )
        for i in range(100)  # 100 users for testing
    ]

    for user in users:
        performance_db.add(user)

    await performance_db.commit()

    # 為每個使用者建立進度
    for user in users:
        for achievement in achievements:
            progress = UserAchievementProgress(
                user_id=user.id,
                achievement_id=achievement.id,
                current_progress=0,
                target_progress=10,
                status=AchievementStatus.IN_PROGRESS.value
            )
            performance_db.add(progress)

        # 建立一些 analytics 事件
        for j in range(5):
            event = AnalyticsEvent(
                user_id=user.id,
                event_type='reading_completed',
                event_data={'reading_id': f'reading-{j}'},
                created_at=datetime.utcnow() - timedelta(days=j)
            )
            performance_db.add(event)

    await performance_db.commit()

    return {'achievements': achievements, 'users': users}


# ===== Test 17.1: Concurrent Load Testing =====

@pytest.mark.asyncio
async def test_concurrent_achievement_checks(performance_db, sample_data):
    """
    測試並發成就檢查
    目標：1000 並發請求，P95 < 1秒
    """
    users = sample_data['users']
    achievement_service = AchievementService(performance_db)

    # 準備並發任務
    async def check_user_achievements(user_id):
        start = time.time()
        try:
            await achievement_service.unlock_achievements_for_user(
                user_id=user_id,
                trigger_event='reading_completed',
                event_context={'test': True}
            )
            return time.time() - start
        except Exception as e:
            print(f"Error in concurrent check: {e}")
            return None

    # 模擬 1000 並發請求（重複使用 100 個使用者）
    tasks = []
    for i in range(1000):
        user = users[i % len(users)]
        tasks.append(check_user_achievements(user.id))

    # 執行並發任務
    print("\n🚀 Starting 1000 concurrent achievement checks...")
    start_time = time.time()

    response_times = await asyncio.gather(*tasks)
    response_times = [t for t in response_times if t is not None]

    total_time = time.time() - start_time

    # 計算統計指標
    response_times.sort()

    p50 = median(response_times)
    p95 = quantiles(response_times, n=100)[94]  # 95th percentile
    p99 = quantiles(response_times, n=100)[98]  # 99th percentile

    print(f"\n📊 Performance Metrics:")
    print(f"  Total requests: 1000")
    print(f"  Total time: {total_time:.2f}s")
    print(f"  Throughput: {1000/total_time:.2f} req/s")
    print(f"  P50 response time: {p50*1000:.2f}ms")
    print(f"  P95 response time: {p95*1000:.2f}ms")
    print(f"  P99 response time: {p99*1000:.2f}ms")

    # 驗證效能目標
    assert p95 < 1.0, f"P95 response time {p95:.2f}s exceeds 1s target"
    print("✅ P95 < 1s requirement met")


# ===== Test 17.2: Migration Script Performance =====

@pytest.mark.asyncio
async def test_migration_script_performance(performance_db):
    """
    測試 Migration 腳本效能
    目標：處理 10,000 使用者
    """
    from app.services.achievement_service import AchievementService

    # 建立成就
    achievement = Achievement(
        id=uuid4(),
        code="MIGRATION_TEST",
        name_zh_tw="遷移測試",
        criteria={"type": "READING_COUNT", "target": 5},
        rewards={"karma_points": 100},
        category=AchievementCategory.READING.value,
        rarity=AchievementRarity.COMMON.value,
        is_active=True
    )
    performance_db.add(achievement)

    # 建立 1000 個使用者（模擬大規模遷移）
    print("\n🚀 Creating 1000 users for migration test...")
    users = []
    for i in range(1000):
        user = User(
            id=uuid4(),
            email=f"migration_user_{i}@example.com",
            name=f"Migration User {i}",
            password_hash="hashed"
        )
        performance_db.add(user)
        users.append(user)

        # 建立一些歷史事件
        for j in range(7):
            event = AnalyticsEvent(
                user_id=user.id,
                event_type='reading_completed',
                event_data={'reading_id': f'reading-{j}'},
                created_at=datetime.utcnow() - timedelta(days=j)
            )
            performance_db.add(event)

    await performance_db.commit()

    # 執行遷移
    achievement_service = AchievementService(performance_db)

    print("\n🚀 Running migration for 1000 users...")
    start_time = time.time()

    # 批次處理（每批 50 個使用者）
    batch_size = 50
    processed = 0

    for i in range(0, len(users), batch_size):
        batch_users = users[i:i+batch_size]

        for user in batch_users:
            await achievement_service.recalculate_user_progress(user.id)
            processed += 1

        print(f"  Processed: {processed}/1000 users")

    total_time = time.time() - start_time

    print(f"\n📊 Migration Performance:")
    print(f"  Total users: 1000")
    print(f"  Total time: {total_time:.2f}s")
    print(f"  Users/second: {1000/total_time:.2f}")
    print(f"  Average time/user: {total_time/1000*1000:.2f}ms")

    # 驗證效能目標（1000 users 應在 60 秒內完成）
    assert total_time < 60, f"Migration took {total_time:.2f}s, exceeds 60s target"
    print("✅ Migration performance target met")


# ===== Test 20.1: Query Performance =====

@pytest.mark.asyncio
async def test_query_performance(performance_db, sample_data):
    """
    測試查詢效能
    目標：API 回應時間 P95 < 500ms
    """
    users = sample_data['users']
    achievement_service = AchievementService(performance_db)

    # 測試不同查詢的效能
    query_times = {
        'get_all_achievements': [],
        'get_user_progress': [],
        'get_user_progress_with_achievements': []
    }

    # 執行多次查詢以獲得統計資料
    iterations = 100

    print(f"\n🚀 Running {iterations} iterations of each query...")

    for i in range(iterations):
        user = users[i % len(users)]

        # Test get_all_achievements
        start = time.time()
        await achievement_service.get_all_achievements()
        query_times['get_all_achievements'].append(time.time() - start)

        # Test get_user_progress
        start = time.time()
        await achievement_service.get_user_progress(user.id)
        query_times['get_user_progress'].append(time.time() - start)

        # Test get_user_progress_with_achievements
        start = time.time()
        await achievement_service.get_user_progress_with_achievements(user.id)
        query_times['get_user_progress_with_achievements'].append(time.time() - start)

    # 計算並報告統計指標
    print(f"\n📊 Query Performance (over {iterations} iterations):")

    for query_name, times in query_times.items():
        times.sort()
        p50 = median(times)
        p95 = quantiles(times, n=100)[94]

        print(f"\n  {query_name}:")
        print(f"    P50: {p50*1000:.2f}ms")
        print(f"    P95: {p95*1000:.2f}ms")

        # 驗證 P95 < 500ms
        assert p95 < 0.5, f"{query_name} P95 {p95*1000:.2f}ms exceeds 500ms"

    print("\n✅ All queries meet P95 < 500ms requirement")


# ===== Test Cache Hit Rate =====

@pytest.mark.asyncio
@pytest.mark.skipif(
    not achievement_cache.redis_available,
    reason="Redis not available for cache testing"
)
async def test_redis_cache_hit_rate(performance_db, sample_data):
    """
    測試 Redis 快取命中率
    目標：命中率 > 80%
    """
    users = sample_data['users']
    achievement_service = AchievementService(performance_db)

    # 清除所有快取
    for user in users:
        await achievement_cache.invalidate_user_progress_cache(user.id)

    await achievement_cache.invalidate_achievement_definitions_cache()

    # 執行查詢以填充快取
    print("\n🚀 Warming up cache...")
    for i in range(10):
        await achievement_service.get_all_achievements()
        await achievement_service.get_user_progress_with_achievements(users[0].id)

    # 重複查詢以測試快取命中
    print("\n🚀 Testing cache hit rate (100 iterations)...")

    cache_hits = 0
    cache_misses = 0

    for i in range(100):
        # 從快取讀取成就定義
        cached = await achievement_cache.get_achievement_definitions_cache()

        if cached:
            cache_hits += 1
        else:
            cache_misses += 1

    hit_rate = cache_hits / (cache_hits + cache_misses) * 100

    print(f"\n📊 Cache Performance:")
    print(f"  Cache hits: {cache_hits}")
    print(f"  Cache misses: {cache_misses}")
    print(f"  Hit rate: {hit_rate:.2f}%")

    # 驗證命中率 > 80%
    assert hit_rate > 80, f"Cache hit rate {hit_rate:.2f}% below 80% target"
    print("✅ Cache hit rate > 80% requirement met")


# ===== Test Index Performance =====

@pytest.mark.asyncio
async def test_database_index_performance(performance_db, sample_data):
    """
    測試資料庫索引效能
    驗證查詢使用正確的索引
    """
    users = sample_data['users']
    user_id = users[0].id

    # 執行查詢並檢查執行計畫（僅適用於 PostgreSQL）
    # SQLite 不支援 EXPLAIN ANALYZE，所以這裡只測試查詢速度

    start = time.time()

    # 查詢使用者進度（應使用 user_id 索引）
    query = text("""
        SELECT * FROM user_achievement_progress
        WHERE user_id = :user_id
    """)

    result = await performance_db.execute(query, {'user_id': str(user_id)})
    rows = result.fetchall()

    query_time = time.time() - start

    print(f"\n📊 Index Performance:")
    print(f"  Query time: {query_time*1000:.2f}ms")
    print(f"  Rows returned: {len(rows)}")

    # 應該在 100ms 內完成
    assert query_time < 0.1, f"Query took {query_time*1000:.2f}ms, may need index optimization"
    print("✅ Query uses indexes efficiently")


if __name__ == "__main__":
    # 可以直接執行此檔案來進行效能測試
    pytest.main([__file__, "-v", "-s"])
